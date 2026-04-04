from __future__ import annotations

import random
from collections import defaultdict
from typing import Dict, List, Set, Tuple

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.crud import (
    get_preferred_genre_ids,
    get_user_prefers_sorted,
    get_watched_movie_ids,
    total_user_watch_events,
)
from app.models import (
    Genre,
    GenreCooccurrenceGlobal,
    GenreCooccurrenceUser,
    GenreMovieIndex,
    Movie,
    MovieGenre,
)
from app.schemas import FeedItem, FeedResponse


def _global_cooccurrence_map(db: Session) -> Dict[Tuple[int, int], float]:
    out: Dict[Tuple[int, int], float] = {}
    for g1, g2, sc in db.execute(
        select(
            GenreCooccurrenceGlobal.g1,
            GenreCooccurrenceGlobal.g2,
            GenreCooccurrenceGlobal.score,
        )
    ).all():
        out[(g1, g2)] = float(sc)
    return out


def _user_cooccurrence_map(db: Session, user_id: int) -> Dict[Tuple[int, int], float]:
    out: Dict[Tuple[int, int], float] = {}
    for g1, g2, sc in db.execute(
        select(
            GenreCooccurrenceUser.g1,
            GenreCooccurrenceUser.g2,
            GenreCooccurrenceUser.score,
        ).where(GenreCooccurrenceUser.user_id == user_id)
    ).all():
        out[(g1, g2)] = float(sc)
    return out


def effective_cooccurrence_with_preferred(
    db: Session,
    user_id: int,
    preferred: Set[int],
    alpha: float,
) -> List[Tuple[int, float]]:
    """
    For each genre G not in preferred, score = max over P in preferred of
    blended cooccurrence(P, G).
    """
    global_map = _global_cooccurrence_map(db)
    personal_map = _user_cooccurrence_map(db, user_id)

    def pair_score(g1: int, g2: int) -> float:
        a, b = (g1, g2) if g1 < g2 else (g2, g1)
        pg = personal_map.get((a, b), 0.0)
        gg = global_map.get((a, b), 0.0)
        return alpha * pg + (1.0 - alpha) * gg

    all_genre_ids = {r[0] for r in db.execute(select(Genre.id)).all()}
    candidates = [g for g in all_genre_ids if g not in preferred]
    ranked: List[Tuple[int, float]] = []
    for g in candidates:
        if not preferred:
            break
        best = 0.0
        for p in preferred:
            if p == g:
                continue
            best = max(best, pair_score(p, g))
        if best > 0:
            ranked.append((g, best))
    ranked.sort(key=lambda x: x[1], reverse=True)
    return ranked


def _movies_for_genre_ordered(
    db: Session, genre_id: int, exclude: Set[int], limit: int
) -> List[int]:
    rows = db.execute(
        select(GenreMovieIndex.movie_id, GenreMovieIndex.fractional_score)
        .where(GenreMovieIndex.genre_id == genre_id)
        .order_by(GenreMovieIndex.fractional_score.desc())
    ).all()
    out: List[int] = []
    for mid, _ in rows:
        if mid in exclude:
            continue
        out.append(mid)
        if len(out) >= limit:
            break
    return out


def _global_top_movies(db: Session, exclude: Set[int], limit: int) -> List[int]:
    rows = db.execute(select(Movie.id).order_by(Movie.total_views.desc())).all()
    out: List[int] = []
    for (mid,) in rows:
        if mid in exclude:
            continue
        out.append(mid)
        if len(out) >= limit:
            break
    return out


def _interleave_personalized(
    db: Session,
    prefs: List[Tuple[int, float]],
    target: int,
    exclude: Set[int],
) -> List[Tuple[int, str]]:
    """Water-filling interleave: each pick goes to the genre whose turn is most due."""
    if not prefs or target <= 0:
        return []
    genres_weights = [(g, max(s, 1e-12)) for g, s in prefs]
    tw = sum(w for _, w in genres_weights)
    if tw <= 0:
        return []

    lists_map: Dict[int, List[int]] = {
        g: _movies_for_genre_ordered(db, g, exclude, 300) for g, _ in genres_weights
    }
    cursors: Dict[int, int] = {g: 0 for g, _ in genres_weights}

    def pop_next(g: int) -> int | None:
        lst = lists_map[g]
        i = cursors[g]
        while i < len(lst) and lst[i] in exclude:
            i += 1
        if i >= len(lst):
            cursors[g] = i
            return None
        mid = lst[i]
        cursors[g] = i + 1
        return mid

    norm = [w / tw for _, w in genres_weights]
    gids = [g for g, _ in genres_weights]
    credit = [0.0] * len(gids)
    picks: List[Tuple[int, str]] = []

    for _ in range(target):
        for i in range(len(credit)):
            credit[i] += norm[i]
        j = max(range(len(credit)), key=lambda i: (credit[i], -i))
        credit[j] -= 1.0
        g = gids[j]
        mid = pop_next(g)
        if mid is None:
            found_mid = None
            for gg in gids:
                found_mid = pop_next(gg)
                if found_mid is not None:
                    mid = found_mid
                    break
            if mid is None:
                break
        if mid in exclude:
            continue
        picks.append((mid, "personalized"))
        exclude.add(mid)

    return picks


def _discovery_pool(
    db: Session,
    user_id: int,
    preferred: Set[int],
    target: int,
    exclude: Set[int],
) -> List[Tuple[int, str]]:
    if target <= 0:
        return []
    watches = total_user_watch_events(db, user_id)
    alpha = min(watches / 10.0, 1.0)
    ranked_adj = effective_cooccurrence_with_preferred(db, user_id, preferred, alpha)
    if not ranked_adj:
        all_ids = [r[0] for r in db.execute(select(Genre.id)).all()]
        ranked_adj = [(g, 1.0) for g in all_ids if g not in preferred][:5]

    k = min(3, max(2, len(ranked_adj)))
    top_k = ranked_adj[:k] if ranked_adj else []

    genre_pool = [g for g, _ in top_k]
    random.shuffle(genre_pool)

    picks: List[Tuple[int, str]] = []
    for g in genre_pool:
        if len(picks) >= target:
            break
        candidates = _movies_for_genre_ordered(db, g, exclude, 80)
        random.shuffle(candidates)
        for mid in candidates:
            if mid in exclude:
                continue
            picks.append((mid, "discovery"))
            exclude.add(mid)
            if len(picks) >= target:
                break
    return picks


def build_feed(db: Session, user_id: int, limit: int) -> FeedResponse:
    watched = get_watched_movie_ids(db, user_id)
    exclude_p: Set[int] = set(watched)

    n60 = int(round(limit * 0.6))
    n30 = int(round(limit * 0.3))
    n10 = max(0, limit - n60 - n30)

    prefs = get_user_prefers_sorted(db, user_id)
    preferred_ids = get_preferred_genre_ids(db, user_id)

    # No onboarding yet: lean on global for the personalized slice
    if not prefs:
        personal = [
            (mid, "personalized")
            for mid in _global_top_movies(db, set(exclude_p), n60)
        ]
        for mid, _ in personal:
            exclude_p.add(mid)
    else:
        personal = _interleave_personalized(db, prefs, n60, set(exclude_p))
        for mid, _ in personal:
            exclude_p.add(mid)

    exclude_g = set(watched) | {m for m, _ in personal}
    global_items = [(mid, "global") for mid in _global_top_movies(db, exclude_g, n30)]

    exclude_d = set(watched) | {m for m, _ in personal} | {m for m, _ in global_items}
    disc = _discovery_pool(db, user_id, preferred_ids, n10, set(exclude_d))

    merged: List[Tuple[int, str]] = []
    seen: Set[int] = set(watched)
    for lst in (personal, global_items, disc):
        for mid, bkt in lst:
            if mid in seen:
                continue
            seen.add(mid)
            merged.append((mid, bkt))
    merged = merged[:limit]

    titles = {r[0]: r[1] for r in db.execute(select(Movie.id, Movie.title)).all()}
    genre_by_movie: Dict[int, List[str]] = defaultdict(list)
    for mid, name in db.execute(
        select(MovieGenre.movie_id, Genre.name)
        .join(Genre, Genre.id == MovieGenre.genre_id)
        .order_by(MovieGenre.movie_id, Genre.name)
    ).all():
        genre_by_movie[mid].append(name)

    items = [
        FeedItem(
            movie_id=mid,
            title=titles.get(mid, "?"),
            bucket=bkt,
            genres=genre_by_movie.get(mid, []),
        )
        for mid, bkt in merged
    ]
    mix: dict = {"personalized": 0, "global": 0, "discovery": 0}
    for it in items:
        mix[it.bucket] = mix.get(it.bucket, 0) + 1

    return FeedResponse(user_id=user_id, items=items, mix=mix)
