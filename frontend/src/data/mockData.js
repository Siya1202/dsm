/**
 * mockData.js — Initial seed data for the Setup Form.
 * Pre-computed recommendations below reflect the ADDITIVE blending formula:
 *   FinalScore = CollabScore + 0.5 × GenreScore
 *
 * These values are only used to seed the form's initial state.
 * All live computations go through computeEngine.js.
 */

export const INITIAL_SETUP = {
  users: ['Alice', 'Bob', 'Charlie'],
  movies: ['Inception', 'Interstellar', 'The Matrix', 'Parasite', 'Dune'],
  genres: ['Sci-Fi', 'Thriller', 'Drama'],
  watchHistory: {
    Alice:   ['Inception', 'The Matrix'],
    Bob:     ['Interstellar', 'Dune'],
    Charlie: [],
  },
  movieGenreMap: {
    Inception:      ['Sci-Fi', 'Thriller'],
    Interstellar:   ['Sci-Fi', 'Drama'],
    'The Matrix':   ['Sci-Fi', 'Thriller'],
    Parasite:       ['Thriller', 'Drama'],
    Dune:           ['Sci-Fi', 'Drama'],
  },
  genrePrefs: {
    Charlie: ['Sci-Fi', 'Drama'],
  },
};

/**
 * Static reference values (additive blending formula).
 * Used for documentation / testing only — Dashboard reads from computeEngine.
 *
 * Alice  (affinity: Sci-Fi=0.50, Thriller=0.50, Drama=0.00)
 *   CollabScore = 0 (no shared watches with Bob)
 *   → Interstellar: 0 + 0.5×0.50 = 0.25
 *   → Parasite:     0 + 0.5×0.50 = 0.25
 *   → Dune:         0 + 0.5×0.50 = 0.25
 *
 * Bob    (affinity: Sci-Fi=0.50, Thriller=0.00, Drama=0.50)
 *   CollabScore = 0 (no shared watches with Alice)
 *   → Inception:   0 + 0.5×0.50 = 0.25
 *   → The Matrix:  0 + 0.5×0.50 = 0.25
 *   → Parasite:    0 + 0.5×0.50 = 0.25
 *
 * Charlie (afinity: Sci-Fi=0.50, Drama=0.50, Thriller=0.00 — from cold-start prefs)
 *   CollabScore = 0 (all-zero A_UM row)
 *   → Inception:    0 + 0.5×0.50 = 0.25
 *   → Interstellar: 0 + 0.5×1.00 = 0.50
 *   → The Matrix:   0 + 0.5×0.50 = 0.25
 *   → Parasite:     0 + 0.5×0.50 = 0.25 (Thriller+Drama → 0+0.5=0.50)
 *   → Dune:         0 + 0.5×1.00 = 0.50
 */
