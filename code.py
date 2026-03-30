# ============================================================
# DSM CIE - I : Modeling User-Movie-Genre Relationships
# Using Graph Theory
# Group: SY_10-02 | PICT, Pune
# ============================================================
 
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import networkx as nx
from collections import defaultdict
 
# ============================================================
# STEP 1: GET INPUT FROM USER
# ============================================================
 
print("=" * 50)
print("  DSM PROJECT - Movie Recommendation System")
print("  Group SY_10-02 | PICT Pune")
print("=" * 50)
 
# --- Get Users ---
print("\n--- ENTER USERS ---")
users = []
n_users = int(input("How many users? "))
for i in range(n_users):
    name = input(f"  Enter name of User {i+1}: ").strip()
    users.append(name)
 
# --- Get Movies ---
print("\n--- ENTER MOVIES ---")
movies = []
n_movies = int(input("How many movies? "))
for i in range(n_movies):
    name = input(f"  Enter name of Movie {i+1}: ").strip()
    movies.append(name)
 
# --- Get Genres ---
print("\n--- ENTER GENRES ---")
genres = []
n_genres = int(input("How many genres? "))
for i in range(n_genres):
    name = input(f"  Enter Genre {i+1}: ").strip()
    genres.append(name)
 
# --- Get Movie-Genre Mapping ---
print("\n--- ASSIGN GENRES TO MOVIES ---")
print(f"Available genres: {', '.join(genres)}")
movie_genres = {}
for movie in movies:
    while True:
        g_input = input(f"  Genres for '{movie}' (comma separated): ").strip()
        g_list = [g.strip() for g in g_input.split(",")]
        invalid = [g for g in g_list if g not in genres]
        if invalid:
            print(f"  Invalid genres: {invalid}. Please use only: {genres}")
        else:
            movie_genres[movie] = g_list
            break
 
# --- Get Watch History ---
print("\n--- ENTER WATCH HISTORY ---")
print(f"Available movies: {', '.join(movies)}")
watch_history = {}
for user in users:
    while True:
        m_input = input(f"  Movies watched by '{user}' (comma separated): ").strip()
        m_list = [m.strip() for m in m_input.split(",")]
        invalid = [m for m in m_list if m not in movies]
        if invalid:
            print(f"  Invalid movies: {invalid}. Please use only: {movies}")
        else:
            watch_history[user] = m_list
            break
 
# --- Get save path ---
print("\n--- OUTPUT ---")
save_path = input("Enter full path to save the output image (e.g. /Users/yourname/dsm/output.png): ").strip()
 
# ============================================================
# STEP 2: BUILD ADJACENCY MATRICES
# ============================================================
 
n, k, p = len(users), len(movies), len(genres)
 
A_UM = np.zeros((n, k), dtype=int)
for i, user in enumerate(users):
    for j, movie in enumerate(movies):
        if movie in watch_history[user]:
            A_UM[i][j] = 1
 
A_MG = np.zeros((k, p), dtype=int)
for j, movie in enumerate(movies):
    for l, genre in enumerate(genres):
        if genre in movie_genres[movie]:
            A_MG[j][l] = 1
 
print("\n" + "=" * 50)
print("STEP 2: ADJACENCY MATRICES")
print("=" * 50)
 
print("\nUser-Movie Matrix (A_UM):")
print(f"{'':>15}", end="")
for m in movies:
    print(f"{m:>15}", end="")
print()
for i, user in enumerate(users):
    print(f"{user:>15}", end="")
    for val in A_UM[i]:
        print(f"{val:>15}", end="")
    print()
 
print("\nMovie-Genre Matrix (A_MG):")
print(f"{'':>15}", end="")
for g in genres:
    print(f"{g:>12}", end="")
print()
for j, movie in enumerate(movies):
    print(f"{movie:>15}", end="")
    for val in A_MG[j]:
        print(f"{val:>12}", end="")
    print()
 
# ============================================================
# STEP 3: DEGREE CENTRALITY
# ============================================================
 
print("\n" + "=" * 50)
print("STEP 3: DEGREE CENTRALITY")
print("=" * 50)
 
print("\nUser Degrees (movies watched):")
for i, user in enumerate(users):
    deg = int(np.sum(A_UM[i]))
    print(f"  deg({user}) = {deg}")
 
print("\nMovie Degrees (watched by how many users):")
for j, movie in enumerate(movies):
    deg = int(np.sum(A_UM[:, j]))
    print(f"  deg({movie}) = {deg}")
 
most_popular = movies[int(np.argmax(np.sum(A_UM, axis=0)))]
print(f"\n  Most popular movie: {most_popular}")
 
# ============================================================
# STEP 4: USER SIMILARITY
# ============================================================
 
print("\n" + "=" * 50)
print("STEP 4: USER SIMILARITY")
print("=" * 50)
 
def user_similarity(u1, u2):
    return len(set(watch_history[u1]) & set(watch_history[u2]))
 
sim_matrix = {}
print()
for i, u1 in enumerate(users):
    for j, u2 in enumerate(users):
        if i < j:
            sim = user_similarity(u1, u2)
            sim_matrix[(u1, u2)] = sim
            print(f"  Sim({u1}, {u2}) = {sim}")
 
# ============================================================
# STEP 5: RECOMMENDATION SCORE
# ============================================================
 
print("\n" + "=" * 50)
print("STEP 5: RECOMMENDATION SCORES")
print("=" * 50)
 
def get_similar_users(target_user):
    similar = {}
    for u in users:
        if u != target_user:
            pair = (min(target_user, u), max(target_user, u))
            sim = sim_matrix.get(pair, 0)
            if sim > 0:
                similar[u] = sim
    return similar
 
def recommendation_score(target_user):
    similar_users = get_similar_users(target_user)
    scores = defaultdict(float)
    watched = set(watch_history[target_user])
    for v, sim in similar_users.items():
        v_idx = users.index(v)
        for j, movie in enumerate(movies):
            if movie not in watched:
                scores[movie] += sim * A_UM[v_idx][j]
    return scores
 
print()
for user in users:
    scores = recommendation_score(user)
    if scores:
        sorted_recs = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        print(f"  Recommendations for {user}:")
        for movie, score in sorted_recs:
            print(f"    -> {movie}  (score: {score:.1f})")
    else:
        print(f"  {user}: No new recommendations")
    print()
 
# ============================================================
# STEP 6: BUILD & VISUALIZE TRIPARTITE GRAPH
# ============================================================
 
G = nx.Graph()
G.add_nodes_from(users,  node_type="user")
G.add_nodes_from(movies, node_type="movie")
G.add_nodes_from(genres, node_type="genre")
 
for user, watched in watch_history.items():
    for movie in watched:
        G.add_edge(user, movie)
 
for movie, genre_list in movie_genres.items():
    for genre in genre_list:
        G.add_edge(movie, genre)
 
fig, axes = plt.subplots(1, 3, figsize=(22, 7))
fig.suptitle("DSM CIE-I: User–Movie–Genre Graph Theory Model\nGroup SY_10-02 | PICT Pune",
             fontsize=13, fontweight="bold", y=1.01)
 
# --- Plot 1: Tripartite Graph ---
ax1 = axes[0]
ax1.set_title("Tripartite Graph (G = V, E)", fontweight="bold")
 
pos = {}
u_y = np.linspace(0.85, 0.15, len(users))
m_y = np.linspace(0.90, 0.10, len(movies))
g_y = np.linspace(0.85, 0.15, len(genres))
 
for i, u in enumerate(users):  pos[u] = (0.0, u_y[i])
for i, m in enumerate(movies): pos[m] = (0.5, m_y[i])
for i, g in enumerate(genres): pos[g] = (1.0, g_y[i])
 
user_edges  = [(u, m) for u, mlist in watch_history.items() for m in mlist]
genre_edges = [(m, g) for m, glist in movie_genres.items() for g in glist]
 
nx.draw_networkx_edges(G, pos, edgelist=user_edges,  ax=ax1,
                       edge_color="#7F77DD", width=1.8, alpha=0.7)
nx.draw_networkx_edges(G, pos, edgelist=genre_edges, ax=ax1,
                       edge_color="#1D9E75", width=1.8, alpha=0.7)
nx.draw_networkx_nodes(G, pos, nodelist=users,  ax=ax1,
                       node_color="#CECBF6", node_size=900)
nx.draw_networkx_nodes(G, pos, nodelist=movies, ax=ax1,
                       node_color="#9FE1CB", node_size=900)
nx.draw_networkx_nodes(G, pos, nodelist=genres, ax=ax1,
                       node_color="#F5C4B3", node_size=900)
nx.draw_networkx_labels(G, pos, ax=ax1, font_size=7.5, font_weight="bold")
 
legend = [
    mpatches.Patch(color="#CECBF6", label="Users"),
    mpatches.Patch(color="#9FE1CB", label="Movies"),
    mpatches.Patch(color="#F5C4B3", label="Genres"),
]
ax1.legend(handles=legend, loc="lower center", fontsize=8)
ax1.axis("off")
 
# --- Plot 2: User-Movie Matrix Heatmap ---
ax2 = axes[1]
ax2.set_title("User–Movie Adjacency Matrix (A_UM)", fontweight="bold")
ax2.imshow(A_UM, cmap="Purples", aspect="auto", vmin=0, vmax=1.2)
ax2.set_xticks(range(k)); ax2.set_xticklabels(movies, rotation=25, ha="right", fontsize=9)
ax2.set_yticks(range(n)); ax2.set_yticklabels(users, fontsize=9)
for i in range(n):
    for j in range(k):
        ax2.text(j, i, str(A_UM[i][j]), ha="center", va="center",
                 fontsize=13, fontweight="bold",
                 color="white" if A_UM[i][j] == 1 else "#555")
ax2.set_xlabel("Movies", fontsize=9)
ax2.set_ylabel("Users", fontsize=9)
 
# --- Plot 3: Recommendation Scores Bar Chart ---
ax3 = axes[2]
ax3.set_title("Recommendation Scores per User", fontweight="bold")
 
bar_data = {}
all_movies_set = set()
for user in users:
    scores = recommendation_score(user)
    bar_data[user] = scores
    all_movies_set.update(scores.keys())
 
all_movies_list = sorted(all_movies_set)
if all_movies_list:
    x = np.arange(len(all_movies_list))
    width = 0.8 / len(users)
    colors = ["#7F77DD", "#1D9E75", "#D85A30", "#BA7517", "#185FA5",
              "#993556", "#639922", "#A32D2D", "#0F6E56", "#534AB7"]
    for idx, user in enumerate(users):
        vals = [bar_data[user].get(m, 0) for m in all_movies_list]
        ax3.bar(x + idx * width, vals, width, label=user,
                color=colors[idx % len(colors)], alpha=0.85)
    ax3.set_xticks(x + width * (len(users) - 1) / 2)
    ax3.set_xticklabels(all_movies_list, rotation=15, ha="right", fontsize=9)
    ax3.set_ylabel("Score", fontsize=9)
    ax3.set_xlabel("Movies (not yet watched)", fontsize=9)
    ax3.legend(fontsize=8)
    ax3.yaxis.set_major_locator(plt.MaxNLocator(integer=True))
else:
    ax3.text(0.5, 0.5, "No recommendations\n(all movies watched)",
             ha="center", va="center", fontsize=11, transform=ax3.transAxes)
    ax3.axis("off")
 
plt.tight_layout()
plt.savefig(save_path, dpi=150, bbox_inches="tight")
plt.close()
print(f"\nVisualization saved to: {save_path}")
print("\nDone!")