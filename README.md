# DSM — Discrete Structures & Mathematics: Movie Recommendation System

> **DSM CIE-I Project | Group SY_10-02 | PICT, Pune**
>
> A full-stack, graph-theory-based movie recommendation engine that models the relationships between users, movies, and genres as a **tripartite graph**. The system applies collaborative filtering, genre-based cold-start handling, and Louvain community detection — all exposed through a FastAPI backend and a modern React (Vite) frontend.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Academic Context](#2-academic-context)
3. [Repository Structure](#3-repository-structure)
4. [Mathematical Foundations](#4-mathematical-foundations)
   - 4.1 [The Tripartite Graph Model](#41-the-tripartite-graph-model)
   - 4.2 [Sparse Adjacency Matrices](#42-sparse-adjacency-matrices)
   - 4.3 [Degree Centrality](#43-degree-centrality)
   - 4.4 [User Similarity](#44-user-similarity)
   - 4.5 [User-Genre Affinity](#45-user-genre-affinity)
   - 4.6 [Recommendation Scoring](#46-recommendation-scoring)
   - 4.7 [Cold-Start Handling](#47-cold-start-handling)
   - 4.8 [Community Detection (Louvain)](#48-community-detection-louvain)
5. [File-by-File Explanation](#5-file-by-file-explanation)
   - 5.1 [code.py — CLI Script](#51-codepy--cli-script)
   - 5.2 [api.py — FastAPI Backend](#52-apipy--fastapi-backend)
   - 5.3 [requirements.txt](#53-requirementstxt)
   - 5.4 [frontend/](#54-frontend)
   - 5.5 [Output Images](#55-output-images)
6. [Algorithm Pipeline (Step by Step)](#6-algorithm-pipeline-step-by-step)
7. [API Reference](#7-api-reference)
8. [Data Structures & Schemas](#8-data-structures--schemas)
9. [Setup & Installation](#9-setup--installation)
   - 9.1 [Prerequisites](#91-prerequisites)
   - 9.2 [Backend Setup](#92-backend-setup)
   - 9.3 [Frontend Setup](#93-frontend-setup)
   - 9.4 [Running the Full Stack](#94-running-the-full-stack)
10. [How to Use (CLI Mode)](#10-how-to-use-cli-mode)
11. [How to Use (Web App Mode)](#11-how-to-use-web-app-mode)
12. [Visualizations Explained](#12-visualizations-explained)
13. [Improvements Over the Original PPT Model](#13-improvements-over-the-original-ppt-model)
14. [Dependency Reference](#14-dependency-reference)
15. [Known Limitations](#15-known-limitations)
16. [Future Work](#16-future-work)

---

## 1. Project Overview

This project implements a **movie recommendation system** grounded in **discrete mathematics and graph theory**, built as a CIE (Continuous Internal Evaluation) assignment for the DSM course at PICT Pune.

The core idea is to represent the movie ecosystem as a **tripartite graph** — three disjoint sets of nodes (Users, Movies, Genres) connected by two types of edges:

- **User–Movie edges (E_UM):** a user has watched a movie.
- **Movie–Genre edges (E_MG):** a movie belongs to a genre.

From this graph structure, the system derives sparse binary matrices, computes user-similarity scores using set-intersection and Jaccard metrics, blends collaborative and genre-based scoring, and groups users into communities using the Louvain algorithm — all in a mathematically transparent and explainable way.

The project ships in **two modes**:

| Mode | Entry Point | Output |
|------|-------------|--------|
| CLI / Standalone | `code.py` | Console output + a multi-panel PNG chart |
| Full-stack Web App | `api.py` + `frontend/` | Interactive browser dashboard |

---

## 2. Academic Context

| Field | Detail |
|-------|--------|
| Course | Discrete Structures & Mathematics (DSM) |
| Assessment | CIE-I |
| Group | SY_10-02 |
| Institution | PICT, Pune |
| Topic | Modeling User–Movie–Genre Relationships Using Graph Theory |

The project directly implements and extends concepts taught in DSM: graph representations, adjacency matrices, bipartite and multipartite graphs, matrix multiplication for relationship propagation, and graph clustering algorithms.

---

## 3. Repository Structure

```
dsm/
├── code.py               # Standalone CLI script — full pipeline with visualization
├── api.py                # FastAPI server — exposes the algorithm as a REST endpoint
├── requirements.txt      # Python dependencies
├── frontend/             # React (Vite) web application
│   ├── src/
│   │   ├── App.jsx       # Root React component
│   │   ├── components/   # Chart, table, and graph components
│   │   └── ...
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── dsm_output.png        # Sample output image from code.py
├── output1.png           # Additional sample output
└── __pycache__/          # Python bytecode cache (auto-generated, ignore)
```

---

## 4. Mathematical Foundations

### 4.1 The Tripartite Graph Model

The system defines a graph:

```
G = (V, E)

V = U ∪ M ∪ G          (disjoint sets)
  U = {u₁, u₂, ..., uₙ}    — n users
  M = {m₁, m₂, ..., mₖ}    — k movies
  G = {g₁, g₂, ..., gₚ}    — p genres

E = E_UM ∪ E_MG
  E_UM ⊆ U × M         — watch-history edges
  E_MG ⊆ M × G         — genre-membership edges
```

No direct User–Genre or User–User edges exist in the tripartite graph. All relationships flow through Movies.

---

### 4.2 Sparse Adjacency Matrices

Two binary adjacency matrices are built from the graph:

**A_UM (n × k) — User–Movie Matrix:**
```
A_UM[i][j] = 1   if user uᵢ has watched movie mⱼ
           = 0   otherwise
```

**A_MG (k × p) — Movie–Genre Matrix:**
```
A_MG[j][l] = 1   if movie mⱼ belongs to genre gₗ
           = 0   otherwise
```

Both matrices use **SciPy CSR (Compressed Sparse Row)** format internally. This is critical for scalability — for large datasets most entries are 0, and dense NumPy arrays would waste enormous memory. CSR format stores only the non-zero values.

---

### 4.3 Degree Centrality

**User degree** = number of movies a user has watched:
```
deg(uᵢ) = Σⱼ A_UM[i][j]   (row sum of A_UM)
```

**Movie degree** = number of users who have watched a movie:
```
deg(mⱼ) = Σᵢ A_UM[i][j]   (column sum of A_UM)
```

The movie with the highest degree is identified as the **most popular movie** in the dataset.

---

### 4.4 User Similarity

Two similarity metrics are computed between every pair of users:

**Raw Intersection (PPT formula):**
```
Sim(uᵢ, uⱼ) = |M(uᵢ) ∩ M(uⱼ)|
```
This equals the number of movies both users have watched in common.

In matrix form this is just the (i, j) entry of:
```
S_raw = A_UM × A_UM^T       (n × n matrix)
```

**Jaccard Similarity (normalized):**
```
Jaccard(uᵢ, uⱼ) = |M(uᵢ) ∩ M(uⱼ)| / |M(uᵢ) ∪ M(uⱼ)|
                 = S_raw[i][j] / (deg(uᵢ) + deg(uⱼ) - S_raw[i][j])
```

Jaccard is preferable when users have very different watch volumes — a user who has watched 100 movies and a user who has watched 5 might share 5 movies, which raw intersection would score 5, but Jaccard would correctly score much lower (~5/100 ≈ 0.05) since the overlap is small relative to the total.

---

### 4.5 User-Genre Affinity

The **A_UG (User–Genre Affinity) matrix** is derived by multiplying A_UM by A_MG:

```
A_UG = A_UM × A_MG       (n × p matrix)

A_UG[i][l] = number of movies user uᵢ watched that belong to genre gₗ
```

This matrix is then **row-normalized** so each user's genre affinities sum to 1:

```
A_UG_norm[i][l] = A_UG[i][l] / Σₗ A_UG[i][l]
```

The result is a probability-like distribution: how much of a user's watching is in each genre.

---

### 4.6 Recommendation Scoring

The final recommendation score for user uᵢ on movie mⱼ blends two components:

**Collaborative Score (from the PPT):**
```
CollabScore(uᵢ, mⱼ) = Σ_{v ∈ N(uᵢ)} Sim(uᵢ, v) · A_UM[v][j]
```
In matrix form: `Collab = S_raw × A_UM` — each user's score for a movie is the sum of similarity-weighted watches by all other users.

**Genre Score (enhancement over the PPT):**
```
GenreScore(uᵢ, mⱼ) = Σₗ A_UG_norm[i][l] · A_MG[j][l]
                    = A_UG_norm[i] · A_MG[j]
```
This is the dot product between the user's normalized genre affinity and the movie's genre membership vector. A higher score means the movie's genres align closely with what the user typically watches.

**Final Blended Score:**
```
FinalScore(uᵢ, mⱼ) = α · CollabScore(uᵢ, mⱼ) + (1 - α) · GenreScore(uᵢ, mⱼ)

where:
  α = 1   if user has watch history (pure collaborative)
  α = 0   if user is a cold-start user (pure genre-based)
```

Movies the user has already watched are excluded from recommendations. Only movies with a positive FinalScore are recommended, and they are sorted in descending order.

---

### 4.7 Cold-Start Handling

A **cold-start user** is any user with an empty watch history. The standard collaborative formula produces zero scores for such users (no similarity with anyone). The system handles this by:

1. Prompting the cold-start user (or the frontend form) for their **preferred genres**.
2. Setting those genre preferences directly into row i of `A_UG_norm` with equal weight: `1 / len(prefs)` for each preferred genre.
3. Setting α = 0 so only the genre score contributes to their recommendations.

This gracefully handles new users without crashing or producing empty outputs.

---

### 4.8 Community Detection (Louvain)

A **User–User similarity graph** is built where:
- Each user is a node.
- An edge between uᵢ and uⱼ exists if `S_raw[i][j] > 0` (they share at least one movie).
- Edge weight = raw intersection similarity score.

The **Louvain algorithm** (`python-louvain` library) is then run on this graph to find communities — groups of users with high internal similarity. The algorithm works by iteratively moving nodes between communities to maximize **modularity** (a measure of how dense connections are within communities vs. between them).

If no edges exist (no users share any movies), each user is placed in their own singleton community.

---

## 5. File-by-File Explanation

### 5.1 `code.py` — CLI Script

**Lines: 525 | Size: 18.8 KB**

This is the self-contained, command-line version of the full algorithm. It walks the user through every step interactively, prints all intermediate results to the console, and produces a 4-panel matplotlib visualization saved as a PNG.

**Execution flow:**

**Step 0 — Interactive Input**
The script uses `input()` calls to collect:
- Number of users and their names.
- Number of movies and their titles.
- Number of genres and their names.
- Genre assignments for each movie (validated against the genre list).
- Watch history for each user (validated against the movie list).
- Cold-start genre preferences (only prompted for users with empty watch histories).
- File path for saving the output PNG.

**Step 1 — Build Sparse Adjacency Matrices**
Constructs `A_UM` and `A_MG` as `scipy.sparse.lil_matrix` objects (efficient for incremental construction), then converts them to CSR format for math. Prints both matrices to the console in a formatted table.

**Step 2 — Degree Centrality**
Computes row sums (user degrees) and column sums (movie degrees) of `A_UM`. Identifies and prints the most popular movie.

**Step 3 — User Similarity**
Computes both `S_raw = A_UM × A_UM^T` and the Jaccard matrix. Prints all pairwise similarities for `i < j` (upper triangle only, since similarity is symmetric).

**Step 4 — User-Genre Affinity**
Computes `A_UG = A_UM × A_MG`, normalizes rows, and injects cold-start genre preferences. Prints `A_UG_norm` as a formatted table.

**Step 5 — Recommendation Scores**
Computes collaborative and genre scores, blends them, and prints a ranked recommendation list for every user. Labels each recommendation as either "(collaborative)" or "(genre-based cold start)".

**Step 6 — Community Detection**
Builds the user-similarity graph in `networkx`, runs Louvain, and prints which community each user belongs to.

**Step 7 — Visualization**
Creates a `matplotlib` figure with 4 subplots:
1. **Tripartite Graph** — nodes colored by community, user–movie edges in purple, movie–genre edges in green.
2. **A_UM Heatmap** — purple color scale, values annotated in each cell.
3. **A_UG_norm Heatmap** — green color scale, normalized affinity values annotated.
4. **Recommendation Score Bar Chart** — grouped bars per user for all unwatched movies.

---

### 5.2 `api.py` — FastAPI Backend

**Lines: 189 | Size: 6.25 KB**

This file exposes the entire algorithm as a single HTTP POST endpoint, so the React frontend can call it programmatically.

**Key components:**

**FastAPI App & CORS Middleware**
```python
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], ...)
```
CORS is opened to `*` so the Vite dev server (typically on port 5173) can call the API (typically on port 8000) without browser security errors. In production, this should be restricted to your domain.

**`RequestPayload` (Pydantic model)**
```python
class RequestPayload(BaseModel):
    users: List[str]
    movies: List[str]
    genres: List[str]
    watchHistory: Dict[str, List[str]]
    movieGenreMap: Dict[str, List[str]]
    coldStart: Dict[str, List[str]]
```
Pydantic automatically validates that the incoming JSON matches this schema. If any field is missing or has the wrong type, FastAPI returns a 422 Unprocessable Entity response with a detailed error message.

**`compute_recommendations(payload)`**
This is the core function — identical in algorithm to `code.py` but without any `input()` calls or `matplotlib` code. It accepts the payload, runs all 6 steps, and returns a structured dictionary.

**Return payload structure:**
```
{
  "users": [...],
  "movies": [...],
  "genres": [...],
  "watchHistory": {...},
  "movieGenreMap": {...},
  "coldStart": {...},
  "recommendations": {
      "User1": [{"title": "Movie", "score": 2.5, "type": "Collaborative"}, ...],
      ...
  },
  "communities": [
      {"id": "Community 1", "members": ["User1", "User2"]},
      ...
  ],
  "a_um_matrix": [
      {"name": "User1", "Movie1": 1, "Movie2": 0, ...},
      ...
  ],
  "a_ug_matrix": [
      {"name": "User1", "Action": 0.5, "Comedy": 0.5, ...},
      ...
  ],
  "recommendationScores": [
      {"movie": "Movie3", "User1": 1.5, "User2": 0.0, ...},
      ...
  ],
  "similarities": {
      "jaccard": [{"pair": "User1 - User2", "score": 0.333}, ...],
      "intersection": [{"pair": "User1 - User2", "score": 2}, ...]
  }
}
```

**`POST /api/recommend`**
```python
@app.post("/api/recommend")
async def recommend(payload: RequestPayload):
    return compute_recommendations(payload)
```
This single route is the only endpoint. The entire frontend is driven by calling this route once.

---

### 5.3 `requirements.txt`

```
fastapi==0.110.0
uvicorn==0.27.1
numpy
networkx
scipy
scikit-learn
python-louvain
```

| Package | Purpose |
|---------|---------|
| `fastapi` | Web framework for the REST API |
| `uvicorn` | ASGI server that runs FastAPI |
| `numpy` | Dense array operations and math |
| `networkx` | Graph construction and manipulation |
| `scipy` | Sparse matrix types (lil_matrix, csr_matrix) |
| `scikit-learn` | `normalize` utility (used in `code.py`) |
| `python-louvain` | Louvain community detection algorithm |

Note: `matplotlib` is used in `code.py` but is not listed in `requirements.txt`. You will need to install it separately if running the CLI script: `pip install matplotlib`.

---

### 5.4 `frontend/`

The frontend is a **React application built with Vite**. It consists of ~53% JavaScript, ~1.3% CSS, and ~1.3% HTML.

**What it does:**
- Provides a form where users can enter all the input data (users, movies, genres, watch histories, cold-start preferences).
- On submission, it sends a POST request to `http://localhost:8000/api/recommend`.
- Renders the API response as a set of interactive visualizations — charts for recommendation scores, heatmaps for A_UM and A_UG matrices, similarity tables, community groupings, and recommendation lists.

**Tech stack:**
- **React** — UI framework
- **Vite** — build tool and dev server (hot module replacement)
- **Recharts or similar** — charting library for heatmaps and bar charts (based on the data shape returned by the API)

---

### 5.5 Output Images

**`dsm_output.png`** and **`output1.png`** are pre-generated sample outputs from `code.py`, committed to the repository so viewers on GitHub can see what the visualization looks like without running the code. They show the 4-panel matplotlib figure with the tripartite graph, A_UM heatmap, A_UG heatmap, and the recommendation bar chart.

---

## 6. Algorithm Pipeline (Step by Step)

```
INPUT
  └── Users, Movies, Genres, Watch History, Movie-Genre Map, Cold-Start Prefs
        │
        ▼
STEP 1: BUILD SPARSE MATRICES
  A_UM (n×k)  ← watch history
  A_MG (k×p)  ← movie-genre memberships
        │
        ▼
STEP 2: DEGREE CENTRALITY
  deg(user)  = row sums of A_UM   → "how many movies has each user watched?"
  deg(movie) = col sums of A_UM   → "how popular is each movie?"
        │
        ▼
STEP 3: USER SIMILARITY
  S_raw     = A_UM × A_UM^T       → pairwise intersection counts
  S_jaccard = S_raw / union       → normalized Jaccard similarity
        │
        ▼
STEP 4: USER-GENRE AFFINITY
  A_UG      = A_UM × A_MG        → raw genre affinity counts
  A_UG_norm = normalize(A_UG)    → row-normalized genre distribution
  [cold-start users injected here with stated genre preferences]
        │
        ▼
STEP 5: RECOMMENDATION SCORING
  CollabScore  = S_raw × A_UM         → similarity-weighted collaborative score
  GenreScore   = A_UG_norm × A_MG^T   → genre alignment score
  FinalScore   = α·Collab + (1-α)·Genre
  [filter out already-watched movies, sort descending]
        │
        ▼
STEP 6: COMMUNITY DETECTION
  Build user-user graph (edge if S_raw[i,j] > 0, weight = S_raw[i,j])
  Run Louvain → partition users into communities
        │
        ▼
OUTPUT
  Recommendations (per user, sorted)
  Communities (groups of similar users)
  A_UM, A_UG_norm, Similarities (for visualization)
```

---

## 7. API Reference

### `POST /api/recommend`

**URL:** `http://localhost:8000/api/recommend`

**Content-Type:** `application/json`

**Request Body:**

```json
{
  "users": ["Alice", "Bob", "Carol"],
  "movies": ["Inception", "Interstellar", "The Notebook", "Titanic"],
  "genres": ["Sci-Fi", "Romance", "Thriller"],
  "watchHistory": {
    "Alice": ["Inception", "Interstellar"],
    "Bob": ["Inception", "The Notebook"],
    "Carol": []
  },
  "movieGenreMap": {
    "Inception": ["Sci-Fi", "Thriller"],
    "Interstellar": ["Sci-Fi"],
    "The Notebook": ["Romance"],
    "Titanic": ["Romance", "Thriller"]
  },
  "coldStart": {
    "Carol": ["Sci-Fi", "Thriller"]
  }
}
```

**Field descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| `users` | `List[str]` | List of all user names |
| `movies` | `List[str]` | List of all movie titles |
| `genres` | `List[str]` | List of all genre names |
| `watchHistory` | `Dict[str, List[str]]` | Map of user → list of movies they have watched |
| `movieGenreMap` | `Dict[str, List[str]]` | Map of movie → list of genres it belongs to |
| `coldStart` | `Dict[str, List[str]]` | Map of user → list of preferred genres (only for users with empty watch history) |

**Response:** JSON object (see structure in section 5.2)

**Status Codes:**
- `200 OK` — Recommendations computed successfully
- `422 Unprocessable Entity` — Request body failed Pydantic validation

---

## 8. Data Structures & Schemas

### Internal Matrices

| Matrix | Shape | Dtype | Format | Description |
|--------|-------|-------|--------|-------------|
| `A_UM` | n × k | int8 | CSR sparse | User–Movie binary matrix |
| `A_MG` | k × p | int8 | CSR sparse | Movie–Genre binary matrix |
| `S_raw` | n × n | float64 | dense | Intersection-based similarity |
| `S_jaccard` | n × n | float64 | dense | Jaccard similarity |
| `A_UG` | n × p | float64 | dense | User–Genre affinity (raw) |
| `A_UG_norm` | n × p | float64 | dense | User–Genre affinity (normalized) |
| `collab_scores` | n × k | float64 | dense | Collaborative recommendation scores |
| `genre_scores` | n × k | float64 | dense | Genre-based recommendation scores |
| `final_scores` | n × k | float64 | dense | Blended final scores |

### Graph Objects

| Object | Type | Nodes | Edges | Weights |
|--------|------|-------|-------|---------|
| `G` (tripartite) | `nx.Graph` | Users + Movies + Genres | E_UM ∪ E_MG | Unweighted |
| `G_users` | `nx.Graph` | Users only | Pairwise if S_raw > 0 | S_raw[i,j] |

---

## 9. Setup & Installation

### 9.1 Prerequisites

- Python 3.9 or higher
- Node.js 18 or higher (for the frontend)
- pip

### 9.2 Backend Setup

```bash
# Clone the repository
git clone https://github.com/Siya1202/dsm.git
cd dsm

# (Recommended) Create and activate a virtual environment
python -m venv venv
source venv/bin/activate       # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Install matplotlib (needed only for code.py, not the API)
pip install matplotlib
```

### 9.3 Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend

# Install Node dependencies
npm install
```

### 9.4 Running the Full Stack

Open two terminal windows:

**Terminal 1 — Start the FastAPI server:**
```bash
# From the root dsm/ directory
uvicorn api:app --reload --host 0.0.0.0 --port 8000
```
The API will be available at `http://localhost:8000`. You can visit `http://localhost:8000/docs` to see the automatically generated Swagger UI documentation.

**Terminal 2 — Start the Vite dev server:**
```bash
# From the frontend/ directory
npm run dev
```
The frontend will be available at `http://localhost:5173` (default Vite port).

---

## 10. How to Use (CLI Mode)

Run `code.py` directly from the command line:

```bash
python code.py
```

The script will prompt you for input step by step:

```
============================================================
 DSM PROJECT - Movie Recommendation System (Improved)
 Group SY_10-02 | PICT Pune
============================================================

--- ENTER USERS ---
How many users? 3
  User 1: Alice
  User 2: Bob
  User 3: Carol

--- ENTER MOVIES ---
How many movies? 4
  Movie 1: Inception
  ...

--- ASSIGN GENRES TO MOVIES ---
Available genres: Sci-Fi, Romance, Thriller
  Genres for 'Inception' (comma separated): Sci-Fi, Thriller

--- ENTER WATCH HISTORY ---
Available movies: Inception, Interstellar, The Notebook, Titanic
  Movies watched by 'Alice' (comma separated, or press Enter to skip): Inception, Interstellar

--- COLD START: GENRE PREFERENCES ---
  These users have no watch history: ['Carol']
  Top genres for 'Carol' (comma separated): Sci-Fi

--- OUTPUT ---
Enter full path to save the output image (e.g. /home/user/output.png): /home/user/dsm_output.png
```

The script then runs all 6 steps, prints results to the console, and saves a PNG to the path you specified.

**Validation:** The script validates all movie and genre names on input. If you type an invalid name, it will prompt again. You cannot break the pipeline with a typo.

---

## 11. How to Use (Web App Mode)

1. Start both servers as described in [section 9.4](#94-running-the-full-stack).
2. Open `http://localhost:5173` in your browser.
3. Use the form to enter:
   - User names
   - Movie titles
   - Genre names
   - Watch history per user
   - Genre preferences for cold-start users
4. Click **Submit / Compute Recommendations**.
5. The dashboard will render:
   - A recommendation list per user
   - The A_UM matrix as a heatmap
   - The A_UG_norm matrix as a heatmap
   - Recommendation scores as a bar chart
   - Jaccard and intersection similarity tables
   - Community groupings

---

## 12. Visualizations Explained

### Panel 1: Tripartite Graph

A spring-layout-style (actually fixed x-position) graph with three vertical columns:
- **Left column:** Users, colored by their Louvain community.
- **Middle column:** Movies, in mint green.
- **Right column:** Genres, in peach/salmon.
- **Purple edges:** User–Movie connections (watch history).
- **Green edges:** Movie–Genre connections.

This visualization makes the graph structure immediately visible and reveals which users cluster together (same community color).

### Panel 2: A_UM Heatmap

A grid of n rows (users) × k columns (movies). Each cell is either 0 (white/light) or 1 (dark purple). This directly displays the User–Movie binary adjacency matrix — you can instantly see which user has watched which movie.

### Panel 3: A_UG_norm Heatmap

A grid of n rows × p columns (genres). Values range from 0.0 to 1.0, shown on a green color scale. This reveals each user's genre taste profile derived from their watch history. Cold-start users show values here based on their stated preferences.

### Panel 4: Recommendation Score Bar Chart

A grouped bar chart where:
- The x-axis shows **unwatched movies** (movies no user in this chart has already seen).
- Each color group represents a different user.
- Bar height = FinalScore for that user–movie pair.

Only movies with FinalScore > 0 for at least one user appear on the x-axis.

---

## 13. Improvements Over the Original PPT Model

The project explicitly documents 5 improvements over the baseline PPT formulation:

| # | Improvement | Why It Matters |
|---|-------------|----------------|
| 1 | **Sparse matrices (CSR)** | A_UM and A_MG use `scipy.sparse` instead of dense NumPy arrays. Scales to millions of users/movies without running out of memory. |
| 2 | **A_MG actually used** | The PPT defines E_MG edges but never uses A_MG in the recommendation formula. This project computes `A_UG = A_UM × A_MG` and uses it in scoring, making genre edges meaningful. |
| 3 | **Cold-start handling** | Users with no watch history previously crashed or got zero scores. Alpha-blending (α=0 for cold-start, α=1 otherwise) ensures every user gets recommendations. |
| 4 | **Community detection** | The PPT mentions communities in its conclusion but doesn't implement them. This project runs Louvain on the user-similarity graph, delivering on the PPT's promise. |
| 5 | **Jaccard similarity** | The PPT only defines raw intersection count. Jaccard normalization makes similarity fairer between users with very different watch volumes. |

---

## 14. Dependency Reference

### Python

| Package | Version | What it does in this project |
|---------|---------|------------------------------|
| `fastapi` | 0.110.0 | REST API framework; defines routes, handles request parsing |
| `uvicorn` | 0.27.1 | ASGI server; runs the FastAPI app |
| `numpy` | latest | Dense matrix math; array operations for scores |
| `networkx` | latest | Graph construction, edge/node management, layout for plotting |
| `scipy` | latest | `lil_matrix` and `csr_matrix` for sparse A_UM and A_MG |
| `scikit-learn` | latest | `normalize` utility in code.py |
| `python-louvain` | latest | `community.best_partition()` — runs Louvain algorithm |
| `matplotlib` | latest | 4-panel visualization in code.py (not in requirements.txt) |
| `pydantic` | (via fastapi) | Request body validation and schema enforcement |

### JavaScript (Frontend)

| Package | Purpose |
|---------|---------|
| `react` | UI component library |
| `vite` | Fast build tool and dev server |
| `recharts` (or similar) | Charting library for heatmaps and bar charts |

---

## 15. Known Limitations

- **No authentication or rate limiting:** The API is completely open. The CORS wildcard (`allow_origins=["*"]`) should be restricted before any public deployment.
- **No persistent storage:** All data is computed per-request and discarded. There is no database or session storage.
- **Dense intermediate matrices:** Even though A_UM and A_MG are stored as sparse matrices, intermediate results (`S_raw`, `collab_scores`, `final_scores`) are converted to dense arrays. For very large datasets, these can consume significant memory.
- **Single endpoint:** The API has only one route. There is no way to query recommendations for a single user or update data incrementally.
- **Matplotlib not in requirements.txt:** Running `code.py` will fail without `matplotlib` unless installed separately.
- **Frontend details not documented upstream:** The `frontend/` source code is not described in any README in the repo, so its internal component structure was not documented here in full detail.

---

## 16. Future Work

- **Add ratings support:** Currently all interactions are binary (watched / not watched). Incorporating a rating (1–5 stars) would enable weighted collaborative filtering.
- **Matrix Factorization:** Implement SVD or ALS decomposition on A_UM for latent factor models.
- **Persistent backend:** Integrate a database (e.g., SQLite, PostgreSQL) to store users, movies, and watch histories across sessions.
- **Incremental updates:** Allow adding a single user or movie without recomputing the full pipeline.
- **Authentication:** Add user accounts to the web app so each person sees only their own recommendations.
- **Cosine similarity:** Add cosine similarity as a third similarity metric alongside intersection and Jaccard.
- **Evaluation metrics:** Implement Precision@K, Recall@K, and NDCG to measure recommendation quality.
- **Docker support:** Containerize the backend and frontend for easy one-command deployment.

---

