from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
import numpy as np
import networkx as nx
from collections import defaultdict
from scipy.sparse import lil_matrix, csr_matrix
import community as community_louvain 

app = FastAPI()

# Allow CORS for the Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RequestPayload(BaseModel):
    users: List[str]
    movies: List[str]
    genres: List[str]
    watchHistory: Dict[str, List[str]]
    movieGenreMap: Dict[str, List[str]]
    coldStart: Dict[str, List[str]]

def compute_recommendations(payload: RequestPayload):
    users = payload.users
    movies = payload.movies
    genres = payload.genres
    watch_history = payload.watchHistory
    movie_genres = payload.movieGenreMap
    genre_prefs = payload.coldStart

    n, k, p = len(users), len(movies), len(genres)

    # Empty cases handling
    if n == 0 or k == 0 or p == 0:
        return {}

    # STEP 1: SPARSE MATRICES
    A_UM = lil_matrix((n, k), dtype=np.int8)
    for i, user in enumerate(users):
        history = watch_history.get(user, [])
        for j, movie in enumerate(movies):
            if movie in history:
                A_UM[i, j] = 1

    A_MG = lil_matrix((k, p), dtype=np.int8)
    for j, movie in enumerate(movies):
        m_genres = movie_genres.get(movie, [])
        for l, genre in enumerate(genres):
            if genre in m_genres:
                A_MG[j, l] = 1

    A_UM_csr = csr_matrix(A_UM)
    A_MG_csr = csr_matrix(A_MG)
    A_UM_d = A_UM_csr.toarray()
    A_MG_d = A_MG_csr.toarray()

    # Identify cold start users
    cold_start_users = [u for u in users if u in genre_prefs and len(watch_history.get(u, [])) == 0]
    
    # STEP 3: SIMILARITY
    sim_matrix_raw = (A_UM_csr @ A_UM_csr.T).toarray().astype(float)

    def jaccard_matrix(A):
        A_f = A.toarray().astype(float)
        intersection = A_f @ A_f.T
        row_sums = A_f.sum(axis=1)
        union = row_sums[:, None] + row_sums[None, :] - intersection
        with np.errstate(divide='ignore', invalid='ignore'):
            jac = np.where(union > 0, intersection / union, 0.0)
        return jac

    sim_matrix_jaccard = jaccard_matrix(A_UM_csr)

    # STEP 4: USER-GENRE AFFINITY
    A_UG = (A_UM_csr @ A_MG_csr).toarray().astype(float)
    row_sums = A_UG.sum(axis=1, keepdims=True)
    A_UG_norm = np.where(row_sums > 0, A_UG / row_sums, 0.0)

    for user in cold_start_users:
        if user in users:
            i = users.index(user)
            prefs = genre_prefs.get(user, [])
            if len(prefs) > 0:
                for genre in prefs:
                    if genre in genres:
                        l = genres.index(genre)
                        A_UG_norm[i, l] = 1.0 / len(prefs)

    # STEP 5: SCORES
    collab_scores = sim_matrix_raw @ A_UM_d 
    genre_scores = A_UG_norm @ A_MG_d.T

    alpha = np.array([0.0 if u in cold_start_users else 1.0 for u in users])
    final_scores = (alpha[:, None] * collab_scores) + ((1 - alpha[:, None]) * genre_scores)

    recommendations_out = {}
    for i, user in enumerate(users):
        watched = set(watch_history.get(user, []))
        recs = []
        for j, movie in enumerate(movies):
            if movie not in watched and final_scores[i, j] > 0:
                recs.append({
                    "title": movie,
                    "score": float(final_scores[i, j]),
                    "type": "Genre-Based" if user in cold_start_users else "Collaborative"
                })
        recs.sort(key=lambda x: x["score"], reverse=True)
        recommendations_out[user] = recs

    # STEP 6: COMMUNITY DETECTION
    G_users = nx.Graph()
    G_users.add_nodes_from(users)
    for i, u1 in enumerate(users):
        for j, u2 in enumerate(users):
            if i < j and sim_matrix_raw[i, j] > 0:
                G_users.add_edge(u1, u2, weight=sim_matrix_raw[i, j])

    communities_out = []
    if G_users.number_of_edges() > 0:
        partition = community_louvain.best_partition(G_users, weight='weight')
        communities = defaultdict(list)
        for u, comm_id in partition.items():
            communities[comm_id].append(u)
        for cid, members in communities.items():
            communities_out.append({"id": f"Community {cid + 1}", "members": members})
    else:
        for i, u in enumerate(users):
            communities_out.append({"id": f"Community {i + 1}", "members": [u]})

    # ----- FORMATTING DATA FOR FRONTEND STRUCTURE -----
    
    # 1. A_UM Matrix
    a_um_out = []
    for i, user in enumerate(users):
        row_dict = {"name": user}
        for j, movie in enumerate(movies):
            row_dict[movie] = int(A_UM_d[i][j])
        a_um_out.append(row_dict)

    # 2. A_UG Matrix
    a_ug_out = []
    for i, user in enumerate(users):
        row_dict = {"name": user}
        for l, genre in enumerate(genres):
            row_dict[genre] = float(A_UG_norm[i][l])
        a_ug_out.append(row_dict)

    # 3. Recommendation Scores for UI standard bar chart
    rec_scores_out = []
    for j, movie in enumerate(movies):
        row_dict = {"movie": movie}
        for i, user in enumerate(users):
            row_dict[user] = float(final_scores[i, j])
        rec_scores_out.append(row_dict)

    # 4. Similarities
    sims = {"jaccard": [], "intersection": []}
    for i, u1 in enumerate(users):
        for j, u2 in enumerate(users):
            if i < j:
                pair = f"{u1} - {u2}"
                sims["intersection"].append({"pair": pair, "score": int(sim_matrix_raw[i, j])})
                sims["jaccard"].append({"pair": pair, "score": float(sim_matrix_jaccard[i, j])})

    return {
        "users": users,
        "movies": movies,
        "genres": genres,
        "watchHistory": watch_history,
        "movieGenreMap": movie_genres,
        "coldStart": genre_prefs,
        "recommendations": recommendations_out,
        "communities": communities_out,
        "a_um_matrix": a_um_out,
        "a_ug_matrix": a_ug_out,
        "recommendationScores": rec_scores_out,
        "similarities": sims
    }

@app.post("/api/recommend")
async def recommend(payload: RequestPayload):
    return compute_recommendations(payload)
