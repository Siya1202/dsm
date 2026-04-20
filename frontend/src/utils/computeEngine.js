/**
 * computeEngine.js
 * ----------------
 * Pure JavaScript implementation of the recommendation engine math.
 * All values are DERIVED on demand from the six sources of truth:
 *   users[], movies[], genres[], watchHistory{}, movieGenreMap{}, genrePrefs{}
 *
 * Nothing here is stored in React state — call compute() and get back
 * a fully fresh result object ready to render in the dashboard.
 */

/**
 * Build A_UM — User × Movie binary matrix
 * A_UM[i][j] = 1 if user[i] watched movie[j], else 0
 */
export function buildAUM(users, movies, watchHistory) {
  return users.map(user =>
    movies.map(movie => ((watchHistory[user] || []).includes(movie) ? 1 : 0))
  );
}

/**
 * Build A_MG — Movie × Genre binary matrix
 * A_MG[j][l] = 1 if movie[j] belongs to genre[l], else 0
 */
export function buildAMG(movies, genres, movieGenreMap) {
  return movies.map(movie =>
    genres.map(genre => ((movieGenreMap[movie] || []).includes(genre) ? 1 : 0))
  );
}

/**
 * Matrix multiply A (n×k) by B (k×p) → result (n×p)
 */
function matMul(A, B) {
  const n = A.length;
  const k = B.length;
  const p = k > 0 ? B[0].length : 0;
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: p }, (_, l) =>
      A[i].reduce((sum, _, j) => sum + A[i][j] * B[j][l], 0)
    )
  );
}

/**
 * Build A_UG_norm — User × Genre normalised affinity
 * Raw A_UG = A_UM × A_MG
 * Normalise each row to sum to 1 (or use genrePrefs for cold-start users)
 */
export function buildAUGNorm(users, movies, genres, watchHistory, movieGenreMap, genrePrefs) {
  const AUM = buildAUM(users, movies, watchHistory);
  const AMG = buildAMG(movies, genres, movieGenreMap);
  const AUG = matMul(AUM, AMG);

  const coldStartUsers = users.filter(u => (watchHistory[u] || []).length === 0);

  return AUG.map((row, i) => {
    const user = users[i];
    if (coldStartUsers.includes(user)) {
      // Cold-start: build row from stated genre preferences
      const prefs = genrePrefs[user] || [];
      return genres.map(g =>
        prefs.length > 0 && prefs.includes(g) ? 1.0 / prefs.length : 0.0
      );
    }
    const rowSum = row.reduce((s, v) => s + v, 0);
    return rowSum > 0 ? row.map(v => v / rowSum) : row.map(() => 0);
  });
}

/**
 * Raw intersection similarity  Sim(u_i, u_j) = |M(u_i) ∩ M(u_j)|
 * Returns an n×n matrix
 */
function buildSimRaw(AUM) {
  const n = AUM.length;
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) =>
      AUM[i].reduce((s, _, k) => s + AUM[i][k] * AUM[j][k], 0)
    )
  );
}

/**
 * Jaccard similarity = intersection / union
 */
function buildJaccard(AUM) {
  const n = AUM.length;
  const sim = buildSimRaw(AUM);
  return Array.from({ length: n }, (_, i) => {
    const degI = AUM[i].reduce((s, v) => s + v, 0);
    return Array.from({ length: n }, (_, j) => {
      const degJ = AUM[j].reduce((s, v) => s + v, 0);
      const union = degI + degJ - sim[i][j];
      return union > 0 ? sim[i][j] / union : 0;
    });
  });
}

/**
 * Main compute function — call this on "Run" click.
 *
 * @returns {Object} Full dashboard payload with all derived values
 */
export function compute({ users, movies, genres, watchHistory, movieGenreMap, genrePrefs }) {
  if (!users.length || !movies.length || !genres.length) {
    return null;
  }

  const coldStartUsers = users.filter(u => (watchHistory[u] || []).length === 0);

  const AUM = buildAUM(users, movies, watchHistory);
  const AMG = buildAMG(movies, genres, movieGenreMap);
  const AUGNorm = buildAUGNorm(users, movies, genres, watchHistory, movieGenreMap, genrePrefs);
  const simRaw = buildSimRaw(AUM);
  const simJac = buildJaccard(AUM);

  // ── Collaborative score matrix  (n×k)
  // CollabScore[i][j] = Σ_v Sim(i,v) * A_UM[v][j]
  // Cold-start users have an all-zero A_UM row → CollabScore is 0 naturally.
  const collabScores = matMul(simRaw, AUM);

  // ── Genre score matrix  (n×k)
  // AUGNorm is (n×p), AMG is (k×p) → transpose AMG to (p×k) for matMul
  // GenreScore[i][j] = AUGNorm[i] · AMG[j]
  const AMG_T = Array.from({ length: genres.length }, (_, l) =>
    movies.map((_, j) => AMG[j][l])
  );
  const genreScores = matMul(AUGNorm, AMG_T);

  // ── FIX: Additive blending — ALWAYS add genre component regardless of history
  //   FinalScore(u, m) = CollabScore(u, m) + 0.5 × GenreScore(u, m)
  //   • Users with history: CollabScore > 0 when neighbours watched m
  //   • Cold-start users:   CollabScore = 0 (zero A_UM row), genre drives everything
  //   • No alpha array needed — formula is symmetric for both cases
  const finalScores = users.map((_, i) =>
    movies.map((__, j) => collabScores[i][j] + 0.5 * genreScores[i][j])
  );

  // ── Build recommendations (exclude already-watched, score > 0)
  const recommendations = {};
  users.forEach((user, i) => {
    const watched = new Set(watchHistory[user] || []);
    const recs = movies
      .map((movie, j) => ({ movie, score: finalScores[i][j] }))
      .filter(r => !watched.has(r.movie) && r.score > 0)
      .sort((a, b) => b.score - a.score);
    recommendations[user] = {
      type: coldStartUsers.includes(user) ? 'Genre-Based' : 'Collaborative',
      recs,
    };
  });

  // ── A_UM matrix rows for heatmap
  const a_um_matrix = users.map((user, i) => {
    const row = { name: user };
    movies.forEach((m, j) => { row[m] = AUM[i][j]; });
    return row;
  });

  // ── A_UG_norm matrix rows for heatmap
  const a_ug_matrix = users.map((user, i) => {
    const row = { name: user };
    genres.forEach((g, l) => { row[g] = AUGNorm[i][l]; });
    return row;
  });

  // ── Recommendation scores for bar chart
  const recommendationScores = movies.map((movie, j) => {
    const row = { movie };
    users.forEach((u, i) => { row[u] = finalScores[i][j]; });
    return row;
  });

  // ── Similarity pairs
  const similarities = { intersection: [], jaccard: [] };
  users.forEach((u1, i) => {
    users.forEach((u2, j) => {
      if (i < j) {
        similarities.intersection.push({ pair: `${u1} - ${u2}`, score: simRaw[i][j] });
        similarities.jaccard.push({ pair: `${u1} - ${u2}`, score: simJac[i][j] });
      }
    });
  });

  return {
    users,
    movies,
    genres,
    watchHistory,
    movieGenreMap,
    genrePrefs,
    recommendations,
    a_um_matrix,
    a_ug_matrix,
    recommendationScores,
    similarities,
  };
}
