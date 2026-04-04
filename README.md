# Graph-style movie recommender

FastAPI + SQLite implementation of a 60% / 30% / 10% feed:

- **Personalized (60%)** — genre ranked indexes with fractional view credit (`total_views / genre_count`), interleaved by `user_prefers` weights.
- **Global (30%)** — movies ordered by catalogue `total_views`.
- **Discovery (10%)** — adjacent genres via blended personal + global co-occurrence; `alpha = min(watch_events / 10, 1)`.

## Setup

```powershell
cd "d:\Education\Projects\DSM CURSOR"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Run

```powershell
uvicorn app.main:app --reload
```

- **Web UI:** [http://127.0.0.1:8000/](http://127.0.0.1:8000/) — pick 3 genres, refresh feed, mark watched.
- **API explorer:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

On first start, `data/*.csv` is loaded into `movie_rec.db` if the DB is empty.

## API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/genres` | List genre ids for onboarding |
| POST | `/onboard` | Body: `user_id`, `top_genres` (3 ids) — seeds `user_prefers` at ⅓ each |
| POST | `/watch` | Body: `user_id`, `movie_id` — increments watch + global views, updates prefers, co-occurrence, genre index rows |
| GET | `/feed?user_id=&limit=` | Merged feed (watched titles excluded) |

## Reset catalogue

Reloads CSVs and clears watch/preference rows (user ids remain):

```powershell
.\.venv\Scripts\python -m app.seed
```
