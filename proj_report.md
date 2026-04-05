# Project Report: Graph-Style Movie Recommender

## 1. Executive summary

This project is a **small recommendation system** that models users, movies, and genres as a **graph in SQL** (not a dedicated graph database). It serves a **mixed feed** made of three parts: about **60%** personalized by inferred genre taste, **30%** globally popular titles, and **10%** “discovery” from genres that co-occur with the user’s preferences. The backend is **FastAPI** with **SQLite**; the product surface is a **browser UI** at `/` plus **OpenAPI** docs at `/docs`.

The design goal is to demonstrate **clear system thinking**—incremental updates, precomputed indexes, cold-start onboarding, and exploration—**without** training ML models.

---

## 2. Conceptual model (the “graph”)

Although storage is relational, the **mental model** is a graph:

| Concept | Meaning in this codebase |
|--------|---------------------------|
| **User → watched → Movie** | `user_watched` with `watch_count`; each watch also increments `movies.total_views` (global popularity). |
| **Movie → belongs_to → Genre** | `movie_genres` (many-to-many). |
| **User → prefers → Genre** | `user_prefers.score` in `[0, 1]` per (user, genre), recomputed from watch history (see section 7.2). |
| **Genre ↔ Genre co-occurrence** | **Global:** `genre_cooccurrence_global` from the catalogue. **Personal:** `genre_cooccurrence_user` from the user’s watched movies. Blended for discovery (see section 7.3). |

**Onboarding** is stored separately in **`user_onboard`**: the three genre ids chosen when the user clicks **Save preferences**. That row is **not** overwritten when `user_prefers` is recomputed after watches, so the UI can always show “which three genres this user picked.”

---

## 3. Technology stack

| Layer | Choice |
|--------|--------|
| API | **FastAPI** |
| ORM / DB | **SQLAlchemy 2** + **SQLite** (`movie_rec.db`) |
| Validation | **Pydantic v2** |
| Catalogue load | **pandas** (CSV import in `seed.py`) |
| UI | Static **HTML / CSS / JavaScript** served from `static/`, `GET /` returns `index.html` |
| Optional | **httpx** (for API testing with FastAPI’s `TestClient`) |

---

## 4. Repository layout

```
DSM CURSOR/
├── app/
│   ├── main.py          # Routes, static mount, lifespan (seed on startup)
│   ├── db.py            # Engine, SessionLocal, Base
│   ├── models.py        # SQLAlchemy tables
│   ├── schemas.py       # Request/response models
│   ├── crud.py          # Users, onboard, watch, prefers, co-occurrence
│   ├── recommender.py   # Feed: 60/30/10, indexes, discovery
│   └── seed.py          # CSV load, index rebuild, optional DB reset
├── data/
│   ├── genres.csv
│   ├── movies.csv
│   └── movie_genres.csv
├── static/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── requirements.txt
├── README.md
└── proj_report.md       # This file
```

---

## 5. Database schema (tables)

- **`users`** — `id` (client-supplied integer “profile id”).
- **`genres`** — `id`, `name`.
- **`movies`** — `id`, `title`, `total_views` (global view count; increments on every watch in the app).
- **`movie_genres`** — `(movie_id, genre_id)` links.
- **`user_watched`** — `(user_id, movie_id)`, `watch_count`, `last_watched_at`.
- **`user_onboard`** — one row per user: `genre_id_1..3` (last saved onboarding).
- **`user_prefers`** — `(user_id, genre_id, score)` taste vector after watches.
- **`genre_movie_index`** — per genre, per movie: `fractional_score` for ordering within the genre.
- **`genre_cooccurrence_global`** — undirected pairs `(g1, g2)` with catalogue co-occurrence strength.
- **`genre_cooccurrence_user`** — same for one user’s watched catalogue.

Indexes are rebuilt from CSV on empty DB; **per-movie fractional rows** in `genre_movie_index` are **patched** when a movie’s `total_views` changes (see `refresh_after_movie_views_changed` in `seed.py`).

---

## 6. Key formulas

### 6.1 Fractional genre score (catalogue / ranking index)

For each movie \(M\) with global views \(V\) and \(k\) genres:

\[
\text{fractional\_score}(M, g) = \frac{V}{k}
\]

So a hit that spans two genres splits its weight equally in each genre’s ranked list. The **genre index** stores movies per genre ordered by this score **descending**.

### 6.2 User preference after watches

For each `(movie, watch_count)` row, with \(k\) genres and watch weight \(w\):

- Each genre on that movie receives **`w / k`** toward its numerator.
- Denominator is **`sum(w)`** over all watched rows (total watch events, counting `watch_count`).

Then `prefers(user, g) = numer[g] / denom`. This is **driven by the user’s watch counts**, not by global blockbuster popularity, so repeated watches in Action+Sci-Fi genuinely shift taste toward those genres.

If the user has **no** `user_watched` rows, **`recompute_user_prefers` does nothing**, so **`user_prefers` from onboarding** (three rows at ⅓ each) stays until the first watch.

### 6.3 Discovery: blending co-occurrence

Let **personal** co-occurrence come from watched movies (pairs of genres on the same title, weighted by `watch_count`). Let **global** co-occurrence come from the full catalogue.

\[
\alpha = \min\left(\frac{\text{total watch events}}{10},\, 1\right)
\]

\[
\text{effective}(g_1, g_2) = \alpha \cdot \text{personal} + (1-\alpha) \cdot \text{global}
\]

For each **non-preferred** genre \(G\), the score is the **maximum** effective co-occurrence with any **preferred** genre. Top adjacent genres (2–3) supply random picks from their genre indexes for the discovery bucket.

---

## 7. Feed construction (`recommender.build_feed`)

Given `limit` (default 20):

1. **Sizes:** `n60 = round(0.6 * limit)`, `n30 = round(0.3 * limit)`, `n10 = limit - n60 - n30`.
2. **Personalized (~60%):**
   - If **`user_prefers` is empty:** fill from **global top movies** (same as popularity list) labeled `personalized` (cold personalization gap).
   - Else: **water-filling interleave** across genres in `user_prefers` weighted by score, pulling from `genre_movie_index` per genre.
3. **Global (~30%):** top `movies.total_views` excluding already chosen personalized titles and watched titles.
4. **Discovery (~10%):** adjacent genres via blended co-occurrence; random shuffle within top genres and candidate movies; exclude preferred genres from the “adjacent” set logic (they’re already in taste).
5. **Merge order:** concatenate **personalized → global → discovery**, **skip duplicates** and **skip watched**; first bucket wins for bucket label if a movie appeared in multiple lists.
6. **Truncate** to `limit`.
7. **Response:** each item includes `movie_id`, `title`, `bucket`, and **`genres`** (names from `movie_genres` + `genres`).

---

## 8. HTTP API

| Method | Path | Role |
|--------|------|------|
| `GET` | `/` | Web UI (`static/index.html`, no-store cache header). |
| `GET` | `/static/...` | CSS/JS. |
| `GET` | `/docs`, `/redoc` | OpenAPI UI. |
| `GET` | `/health` | Liveness. |
| `GET` | `/genres` | List `{ id, name }` for onboarding chips. |
| `GET` | `/user-picks?user_id=` | The three saved onboarding genre ids from `user_onboard`, or `[]` if never saved. |
| `POST` | `/onboard` | Body: `user_id`, `top_genres` (exactly 3 valid genre ids). Seeds `user_prefers` at ⅓ each and upserts `user_onboard`. |
| `POST` | `/watch` | Body: `user_id`, `movie_id`, optional `timestamp`. Updates watch counts, movie `total_views`, index rows for that movie, recomputes `user_prefers` and personal co-occurrence. |
| `GET` | `/feed?user_id=&limit=` | Composite feed JSON with `items` and `mix` counts per bucket. |

---

## 9. Frontend behavior (`static/`)

- **User id** numeric field: switching users **debounced**; refetch `/user-picks` and `/feed` only when the id **actually changes** (avoids wiping genre selection on spurious input events).
- **Genre chips:** delegated click handler; at most three selections; non-selected chips are **visually blocked** (not `disabled`) when three are selected so selected chips stay easy to toggle off.
- **Save preferences** → `POST /onboard`; **Refresh feed** → `GET /feed`; **Mark watched** → `POST /watch` then refresh feed.
- Invalid genre ids from the API are **filtered** against `/genres` so the UI cannot enter a deadlocked chip state.

---

## 10. Data loading and reset

- **First run:** If the database has no movies, `seed_if_empty()` loads `data/*.csv`, builds `genre_movie_index` and `genre_cooccurrence_global`.
- **Manual reset:** `python -m app.seed` runs `reset_catalogue_from_csv()`: deletes watches, preferences, and **onboarding** rows, reloads CSVs, rebuilds global indexes. **User rows** in `users` are not bulk-deleted by this script (users are created on demand).

---

## 11. How to run

```powershell
cd "d:\Education\Projects\DSM CURSOR"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

- UI: `http://127.0.0.1:8000/`
- API explorer: `http://127.0.0.1:8000/docs`

---

## 12. Design decisions and limitations

**Decisions**

- **SQLite + tables** instead of Neo4j: faster to ship; the graph is logical.
- **Separate `user_onboard`** so the UI can show “picked genres” even after `user_prefers` is replaced by watch-based inference.
- **Watch-weighted prefers** instead of weighting by global `total_views`: aligns recommendations with **repeated** user behavior.
- **60/30/10** implemented as **round** then remainder to discovery; exact percentages vary slightly with `limit`.

**Limitations**

- **No authentication:** `user_id` is trust-on-client.
- **No time decay:** old and recent watches count the same in `prefers` and co-occurrence.
- **Personalized bucket without prefs** falls back to global top movies (honest cold gap, not latent-factor CF).
- **Discovery** uses randomness: feeds are not fully reproducible without fixing the RNG seed.
- **Single SQLite file:** not suited to high concurrent write load without migration to a server RDBMS.

---

## 13. Possible extensions

- Time decay on watches (`exp(-\lambda \cdot \text{age})`).
- Diversity caps (e.g. max N from same genre in a row).
- Session- or mood-based short-term profile.
- PostgreSQL + connection pooling for production.
- Batch job to fully re-sort `genre_movie_index` after many view updates (today, per-movie patch keeps scores correct; global reorder is by query `ORDER BY fractional_score`).

---

## 14. Summary

The project implements a **transparent, graph-inspired recommender**: onboarding and watches update **edges** (`prefers`, `watched`, co-occurrence); **precomputed structures** (genre–movie index, global co-occurrence, global top list) power a **three-bucket feed** with **deduplication** and **watched filtering**. The **web UI** and **REST API** expose the same behavior for demos, portfolios, and further experimentation.
