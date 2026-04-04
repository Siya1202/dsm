from typing import List, Optional

from pydantic import BaseModel, Field


class OnboardRequest(BaseModel):
    user_id: int = Field(..., ge=1)
    top_genres: List[int] = Field(..., min_length=3, max_length=3)


class OnboardResponse(BaseModel):
    status: str
    seeded_preferences: List[dict]


class WatchRequest(BaseModel):
    user_id: int = Field(..., ge=1)
    movie_id: int = Field(..., ge=1)
    timestamp: Optional[str] = None


class WatchResponse(BaseModel):
    status: str
    watch_count_for_movie: int
    total_user_watches: int
    updated_preferences: bool


class FeedItem(BaseModel):
    movie_id: int
    title: str
    bucket: str
    genres: List[str] = Field(default_factory=list)


class FeedResponse(BaseModel):
    user_id: int
    items: List[FeedItem]
    mix: dict
