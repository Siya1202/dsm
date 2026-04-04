"""
Load catalogue CSVs, build genre→movie index and global genre co-occurrence.
"""
from __future__ import annotations

from collections import defaultdict
from datetime import datetime
from pathlib import Path

import pandas as pd
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.db import Base, engine, SessionLocal
from app.models import (
    Genre,
    GenreCooccurrenceGlobal,
    GenreMovieIndex,
    Movie,
    MovieGenre,
    UserPrefer,
    UserWatched,
)


DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


def _load_csv(name: str) -> pd.DataFrame:
    path = DATA_DIR / name
    if not path.exists():
        raise FileNotFoundError(f"Missing data file: {path}")
    return pd.read_csv(path)


def load_catalogue_from_csv(db: Session) -> None:
    genres_df = _load_csv("genres.csv")
    movies_df = _load_csv("movies.csv")
    mg_df = _load_csv("movie_genres.csv")

    db.execute(delete(MovieGenre))
    db.execute(delete(Movie))
    db.execute(delete(Genre))
    db.flush()

    for _, row in genres_df.iterrows():
        db.merge(Genre(id=int(row["id"]), name=str(row["name"])))

    for _, row in movies_df.iterrows():
        db.merge(
            Movie(
                id=int(row["id"]),
                title=str(row["title"]),
                total_views=int(row.get("total_views", 0)),
            )
        )

    for _, row in mg_df.iterrows():
        db.merge(
            MovieGenre(movie_id=int(row["movie_id"]), genre_id=int(row["genre_id"]))
        )
    db.commit()


def rebuild_genre_movie_index(db: Session) -> None:
    db.execute(delete(GenreMovieIndex))
    movies = db.execute(select(Movie.id, Movie.total_views)).all()
    mid_views = {m[0]: m[1] for m in movies}

    genre_to_movies: dict[int, list[tuple[int, float]]] = defaultdict(list)
    links = db.execute(select(MovieGenre.movie_id, MovieGenre.genre_id)).all()
    movie_genre_count: dict[int, int] = defaultdict(int)
    for mid, _ in links:
        movie_genre_count[mid] += 1

    for movie_id, genre_id in links:
        k = movie_genre_count[movie_id]
        if k == 0:
            continue
        tv = mid_views.get(movie_id, 0)
        frac = float(tv) / k
        genre_to_movies[genre_id].append((movie_id, frac))

    now = datetime.utcnow()
    for gid, items in genre_to_movies.items():
        items.sort(key=lambda x: x[1], reverse=True)
        for movie_id, frac in items:
            db.add(
                GenreMovieIndex(
                    genre_id=gid,
                    movie_id=movie_id,
                    fractional_score=frac,
                    updated_at=now,
                )
            )
    db.commit()


def rebuild_genre_cooccurrence_global(db: Session) -> None:
    db.execute(delete(GenreCooccurrenceGlobal))
    movie_genres: dict[int, list[int]] = defaultdict(list)
    for mid, gid in db.execute(select(MovieGenre.movie_id, MovieGenre.genre_id)).all():
        movie_genres[mid].append(gid)

    pair_counts: dict[tuple[int, int], float] = defaultdict(float)
    for gids in movie_genres.values():
        gids = sorted(set(gids))
        if len(gids) < 2:
            continue
        for i, a in enumerate(gids):
            for b in gids[i + 1 :]:
                g1, g2 = (a, b) if a < b else (b, a)
                pair_counts[(g1, g2)] += 1.0

    for (g1, g2), sc in pair_counts.items():
        db.add(GenreCooccurrenceGlobal(g1=g1, g2=g2, score=float(sc)))
    db.commit()


def refresh_after_movie_views_changed(db: Session, movie_id: int) -> None:
    """Update index rows for genres linked to this movie (total_views changed)."""
    gids = [
        r[0]
        for r in db.execute(
            select(MovieGenre.genre_id).where(MovieGenre.movie_id == movie_id)
        ).all()
    ]
    m = db.get(Movie, movie_id)
    if m is None:
        return
    k = len(gids)
    if k == 0:
        return
    frac = float(m.total_views) / k
    now = datetime.utcnow()
    for gid in gids:
        row = db.execute(
            select(GenreMovieIndex).where(
                GenreMovieIndex.genre_id == gid,
                GenreMovieIndex.movie_id == movie_id,
            )
        ).scalar_one_or_none()
        if row:
            row.fractional_score = frac
            row.updated_at = now
        else:
            db.add(
                GenreMovieIndex(
                    genre_id=gid,
                    movie_id=movie_id,
                    fractional_score=frac,
                    updated_at=now,
                )
            )
    # Re-sort not stored in DB; feed pulls ORDER BY fractional_score DESC per genre
    db.commit()


def seed_if_empty() -> None:
    init_db()
    db = SessionLocal()
    try:
        n = db.execute(select(Movie.id).limit(1)).scalar_one_or_none()
        if n is None:
            load_catalogue_from_csv(db)
            rebuild_genre_movie_index(db)
            rebuild_genre_cooccurrence_global(db)
    finally:
        db.close()


def full_rebuild_indexes() -> None:
    db = SessionLocal()
    try:
        rebuild_genre_movie_index(db)
        rebuild_genre_cooccurrence_global(db)
    finally:
        db.close()


def reset_catalogue_from_csv() -> None:
    """Wipe catalogue and user watch/preferences, then reload from data/*.csv."""
    init_db()
    db = SessionLocal()
    try:
        db.execute(delete(UserWatched))
        db.execute(delete(UserPrefer))
        db.commit()
        load_catalogue_from_csv(db)
        rebuild_genre_movie_index(db)
        rebuild_genre_cooccurrence_global(db)
    finally:
        db.close()


if __name__ == "__main__":
    reset_catalogue_from_csv()
