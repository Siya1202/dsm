from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from app.db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)


class Genre(Base):
    __tablename__ = "genres"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), unique=True, nullable=False)


class Movie(Base):
    __tablename__ = "movies"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(256), nullable=False)
    total_views = Column(Integer, nullable=False, default=0)


class MovieGenre(Base):
    __tablename__ = "movie_genres"
    __table_args__ = (UniqueConstraint("movie_id", "genre_id", name="uq_movie_genre"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    movie_id = Column(Integer, ForeignKey("movies.id"), nullable=False, index=True)
    genre_id = Column(Integer, ForeignKey("genres.id"), nullable=False, index=True)


class UserWatched(Base):
    __tablename__ = "user_watched"
    __table_args__ = (UniqueConstraint("user_id", "movie_id", name="uq_user_movie"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    movie_id = Column(Integer, ForeignKey("movies.id"), nullable=False, index=True)
    watch_count = Column(Integer, nullable=False, default=0)
    last_watched_at = Column(DateTime, nullable=True)


class UserPrefer(Base):
    __tablename__ = "user_prefers"
    __table_args__ = (UniqueConstraint("user_id", "genre_id", name="uq_user_genre_pref"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    genre_id = Column(Integer, ForeignKey("genres.id"), nullable=False, index=True)
    score = Column(Float, nullable=False, default=0.0)


class GenreMovieIndex(Base):
    __tablename__ = "genre_movie_index"
    __table_args__ = (UniqueConstraint("genre_id", "movie_id", name="uq_genre_movie_idx"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    genre_id = Column(Integer, ForeignKey("genres.id"), nullable=False, index=True)
    movie_id = Column(Integer, ForeignKey("movies.id"), nullable=False, index=True)
    fractional_score = Column(Float, nullable=False, default=0.0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class GenreCooccurrenceGlobal(Base):
    __tablename__ = "genre_cooccurrence_global"
    __table_args__ = (UniqueConstraint("g1", "g2", name="uq_g1_g2_global"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    g1 = Column(Integer, ForeignKey("genres.id"), nullable=False, index=True)
    g2 = Column(Integer, ForeignKey("genres.id"), nullable=False, index=True)
    score = Column(Float, nullable=False, default=0.0)


class GenreCooccurrenceUser(Base):
    __tablename__ = "genre_cooccurrence_user"
    __table_args__ = (UniqueConstraint("user_id", "g1", "g2", name="uq_user_g1_g2"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    g1 = Column(Integer, ForeignKey("genres.id"), nullable=False, index=True)
    g2 = Column(Integer, ForeignKey("genres.id"), nullable=False, index=True)
    score = Column(Float, nullable=False, default=0.0)
