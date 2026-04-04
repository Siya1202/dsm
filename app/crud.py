from collections import defaultdict
from datetime import datetime
from typing import List, Set, Tuple

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models import (
    GenreCooccurrenceUser,
    Movie,
    MovieGenre,
    User,
    UserPrefer,
    UserWatched,
)


def ensure_user(db: Session, user_id: int) -> User:
    u = db.get(User, user_id)
    if u is None:
        u = User(id=user_id)
        db.add(u)
        db.flush()
    return u


def get_movie_genre_ids(db: Session, movie_id: int) -> List[int]:
    rows = db.execute(
        select(MovieGenre.genre_id).where(MovieGenre.movie_id == movie_id)
    ).all()
    return [r[0] for r in rows]


def genre_count_for_movie(db: Session, movie_id: int) -> int:
    return len(get_movie_genre_ids(db, movie_id))


def onboard_user(db: Session, user_id: int, top_genres: List[int]) -> dict:
    ensure_user(db, user_id)
    db.execute(delete(UserPrefer).where(UserPrefer.user_id == user_id))
    third = 1.0 / 3.0
    for gid in top_genres:
        db.add(UserPrefer(user_id=user_id, genre_id=gid, score=third))
    db.commit()
    return {
        "status": "ok",
        "seeded_preferences": [
            {"genre_id": gid, "score": round(third, 6)} for gid in top_genres
        ],
    }


def recompute_user_prefers(db: Session, user_id: int) -> None:
    """
    prefers(g) = share of the user's watch history attributed to genre g.

    Each watch_count is split evenly across the movie's genres (same idea as
    fractional genre credit, but driven by *your* watches, not global popularity).
    So many watches of Action+Sci-Fi titles push both Action and Sci-Fi up.
    """
    rows = db.execute(
        select(UserWatched.movie_id, UserWatched.watch_count).where(
            UserWatched.user_id == user_id
        )
    ).all()
    if not rows:
        return

    numer: dict[int, float] = defaultdict(float)
    denom = 0.0
    for movie_id, watch_count in rows:
        if db.get(Movie, movie_id) is None:
            continue
        gids = get_movie_genre_ids(db, movie_id)
        k = len(gids)
        if k == 0 or watch_count <= 0:
            continue
        w = float(watch_count)
        per_genre = w / k
        denom += w
        for g in gids:
            numer[g] += per_genre

    if denom <= 0:
        return

    db.execute(delete(UserPrefer).where(UserPrefer.user_id == user_id))
    for g, val in numer.items():
        db.add(UserPrefer(user_id=user_id, genre_id=g, score=val / denom))
    db.commit()


def recompute_user_cooccurrence(db: Session, user_id: int) -> None:
    """Personal co-occurrence: weighted by watch_count for pairs of genres on same watched movie."""
    db.execute(
        delete(GenreCooccurrenceUser).where(GenreCooccurrenceUser.user_id == user_id)
    )
    rows = db.execute(
        select(UserWatched.movie_id, UserWatched.watch_count).where(
            UserWatched.user_id == user_id
        )
    ).all()
    pair_scores: dict[Tuple[int, int], float] = defaultdict(float)
    for movie_id, watch_count in rows:
        gids = sorted(set(get_movie_genre_ids(db, movie_id)))
        if len(gids) < 2:
            continue
        w = float(watch_count)
        for i, a in enumerate(gids):
            for b in gids[i + 1 :]:
                g1, g2 = (a, b) if a < b else (b, a)
                pair_scores[(g1, g2)] += w

    for (g1, g2), sc in pair_scores.items():
        db.add(
            GenreCooccurrenceUser(
                user_id=user_id, g1=g1, g2=g2, score=float(sc)
            )
        )
    db.commit()


def total_user_watch_events(db: Session, user_id: int) -> int:
    r = db.execute(
        select(UserWatched.watch_count).where(UserWatched.user_id == user_id)
    ).all()
    return int(sum(row[0] for row in r))


def record_watch(db: Session, user_id: int, movie_id: int, timestamp: str | None) -> dict:
    ensure_user(db, user_id)
    m = db.get(Movie, movie_id)
    if m is None:
        raise ValueError("Unknown movie_id")

    m.total_views += 1
    uw = db.scalars(
        select(UserWatched).where(
            UserWatched.user_id == user_id,
            UserWatched.movie_id == movie_id,
        )
    ).first()
    ts = datetime.utcnow()
    if timestamp:
        try:
            ts = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        except ValueError:
            pass
    if uw is None:
        uw = UserWatched(
            user_id=user_id,
            movie_id=movie_id,
            watch_count=1,
            last_watched_at=ts,
        )
        db.add(uw)
    else:
        uw.watch_count += 1
        uw.last_watched_at = ts

    db.commit()
    db.refresh(uw)
    db.refresh(m)

    # Global catalogue views changed: refresh genre index & global co-occurrence for this movie's genres
    from app.seed import refresh_after_movie_views_changed

    refresh_after_movie_views_changed(db, movie_id)

    recompute_user_prefers(db, user_id)
    recompute_user_cooccurrence(db, user_id)

    total = total_user_watch_events(db, user_id)
    return {
        "status": "ok",
        "watch_count_for_movie": uw.watch_count,
        "total_user_watches": total,
        "updated_preferences": True,
    }


def get_watched_movie_ids(db: Session, user_id: int) -> Set[int]:
    rows = db.execute(
        select(UserWatched.movie_id).where(UserWatched.user_id == user_id)
    ).all()
    return {r[0] for r in rows}


def get_user_prefers_sorted(db: Session, user_id: int) -> List[Tuple[int, float]]:
    rows = db.execute(
        select(UserPrefer.genre_id, UserPrefer.score)
        .where(UserPrefer.user_id == user_id)
        .order_by(UserPrefer.score.desc())
    ).all()
    return [(r[0], float(r[1])) for r in rows]


def get_preferred_genre_ids(db: Session, user_id: int) -> Set[int]:
    return {g for g, _ in get_user_prefers_sorted(db, user_id)}
