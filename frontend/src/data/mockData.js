export const MOCK_DATA = {
  users: ["Alice", "Bob", "Charlie"],
  movies: ["Inception", "Interstellar", "The Matrix", "Parasite", "Dune"],
  genres: ["Sci-Fi", "Thriller", "Drama"],
  watchHistory: {
    Alice: ["Inception", "The Matrix"],
    Bob: ["Interstellar", "Dune"],
    Charlie: [],
  },
  movieGenreMap: {
    Inception: ["Sci-Fi", "Thriller"],
    Interstellar: ["Sci-Fi", "Drama"],
    "The Matrix": ["Sci-Fi", "Thriller"],
    Parasite: ["Thriller", "Drama"],
    Dune: ["Sci-Fi", "Drama"],
  },
  coldStart: {
    Charlie: ["Sci-Fi", "Drama"],
  },
  recommendations: {
    Alice: [
      { title: "Interstellar", score: 2.0, type: "Collaborative" },
      { title: "Dune", score: 1.0, type: "Collaborative" },
    ],
    Bob: [
      { title: "Inception", score: 1.0, type: "Collaborative" },
      { title: "The Matrix", score: 1.0, type: "Collaborative" },
    ],
    Charlie: [
      { title: "Interstellar", score: 0.5, type: "Genre-Based" },
      { title: "Dune", score: 0.5, type: "Genre-Based" },
      { title: "Inception", score: 0.333, type: "Genre-Based" },
    ],
  },
  communities: [
    { id: "Community 1", members: ["Alice", "Bob"] },
    { id: "Community 2", members: ["Charlie"] },
  ],
  a_um_matrix: [
    { name: "Alice", Inception: 1, Interstellar: 0, "The Matrix": 1, Parasite: 0, Dune: 0 },
    { name: "Bob", Inception: 0, Interstellar: 1, "The Matrix": 0, Parasite: 0, Dune: 1 },
    { name: "Charlie", Inception: 0, Interstellar: 0, "The Matrix": 0, Parasite: 0, Dune: 0 },
  ],
  a_ug_matrix: [
    { name: "Alice", "Sci-Fi": 1.0, Thriller: 1.0, Drama: 0.0 },
    { name: "Bob", "Sci-Fi": 1.0, Thriller: 0.0, Drama: 1.0 },
    { name: "Charlie", "Sci-Fi": 0.5, Thriller: 0.0, Drama: 0.5 }, // Using cold start preferences as mock affinities 
  ],
  recommendationScores: [
    { movie: "Inception", Alice: 0, Bob: 1.0, Charlie: 0.333 },
    { movie: "Interstellar", Alice: 2.0, Bob: 0, Charlie: 0.5 },
    { movie: "The Matrix", Alice: 0, Bob: 1.0, Charlie: 0 },
    { movie: "Parasite", Alice: 0, Bob: 0, Charlie: 0 },
    { movie: "Dune", Alice: 1.0, Bob: 0, Charlie: 0.5 },
  ],
  similarities: {
    jaccard: [
      { pair: "Alice - Bob", score: 0.0 },
      { pair: "Alice - Charlie", score: 0.0 },
      { pair: "Bob - Charlie", score: 0.0 },
    ],
    intersection: [
      { pair: "Alice - Bob", score: 0 },
      { pair: "Alice - Charlie", score: 0 },
      { pair: "Bob - Charlie", score: 0 },
    ]
  }
};
