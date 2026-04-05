from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app import crud, recommender
from app.db import get_db
from app.schemas import (
    FeedResponse,
    OnboardRequest,
    OnboardResponse,
    UserPicksResponse,
    WatchRequest,
    WatchResponse,
)
from app.models import Genre
from app.seed import seed_if_empty

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"


@asynccontextmanager
async def lifespan(app: FastAPI):
    seed_if_empty()
    yield


app = FastAPI(
    title="Graph Movie Recommender",
    description="60/30/10 feed: personalized genre index, global top, discovery via co-occurrence.",
    lifespan=lifespan,
)

if STATIC_DIR.is_dir():
    app.mount(
        "/static",
        StaticFiles(directory=str(STATIC_DIR)),
        name="static",
    )


@app.get("/")
def root():
    """Web UI for onboarding, feed, and watches."""
    index = STATIC_DIR / "index.html"
    if not index.is_file():
        raise HTTPException(status_code=503, detail="static/index.html missing")
    return FileResponse(
        index,
        headers={"Cache-Control": "no-store, max-age=0"},
    )


@app.post("/onboard", response_model=OnboardResponse)
def onboard(req: OnboardRequest, db: Session = Depends(get_db)):
    for gid in req.top_genres:
        g = db.get(Genre, gid)
        if g is None:
            raise HTTPException(status_code=400, detail=f"Unknown genre_id: {gid}")
    return crud.onboard_user(db, req.user_id, req.top_genres)


@app.post("/watch", response_model=WatchResponse)
def watch(req: WatchRequest, db: Session = Depends(get_db)):
    try:
        return crud.record_watch(db, req.user_id, req.movie_id, req.timestamp)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@app.get("/feed", response_model=FeedResponse)
def feed(
    user_id: int = Query(..., ge=1),
    limit: int = Query(20, ge=5, le=100),
    db: Session = Depends(get_db),
):
    crud.ensure_user(db, user_id)
    return recommender.build_feed(db, user_id=user_id, limit=limit)


@app.get("/user-picks", response_model=UserPicksResponse)
def user_picks(user_id: int = Query(..., ge=1), db: Session = Depends(get_db)):
    """Genres from last Save preferences (user_onboard); empty if that user never onboarded."""
    crud.ensure_user(db, user_id)
    ids = crud.get_onboard_genre_ids(db, user_id)
    return UserPicksResponse(user_id=user_id, top_genres=ids)


@app.get("/genres")
def list_genres(db: Session = Depends(get_db)):
    from sqlalchemy import select

    rows = db.execute(select(Genre.id, Genre.name).order_by(Genre.id)).all()
    return [{"id": r[0], "name": r[1]} for r in rows]


@app.get("/health")
def health():
    return {"status": "ok"}
