import React, { useState } from 'react'

export default function SetupForm({ setupData, setSetupData }) {
  // ── local transient inputs
  const [newUser, setNewUser]   = useState('')
  const [newMovie, setNewMovie] = useState('')
  const [newGenre, setNewGenre] = useState('')
  const [mapMovie, setMapMovie] = useState('')
  const [mapGenre, setMapGenre] = useState('')
  const [histUser, setHistUser] = useState('')
  const [histMovie, setHistMovie] = useState('')

  // ── helpers ────────────────────────────────────────────────────────────────

  /** Add an item to a flat list field (users / movies / genres) */
  const addToList = (field, value, clear) => {
    const v = value.trim()
    if (!v || setupData[field].includes(v)) return
    setSetupData(prev => ({ ...prev, [field]: [...prev[field], v] }))
    clear('')
  }

  /** BUG 4 FIX: Cascading delete for USER */
  const deleteUser = (user) => {
    setSetupData(prev => {
      const wh   = { ...prev.watchHistory };  delete wh[user]
      const gp   = { ...prev.genrePrefs };    delete gp[user]
      return {
        ...prev,
        users: prev.users.filter(u => u !== user),
        watchHistory: wh,
        genrePrefs: gp,
      }
    })
  }

  /** BUG 4 FIX: Cascading delete for MOVIE */
  const deleteMovie = (movie) => {
    setSetupData(prev => {
      // strip from movieGenreMap
      const mgm = { ...prev.movieGenreMap }; delete mgm[movie]
      // strip from every user's watchHistory
      const wh = {}
      Object.keys(prev.watchHistory).forEach(u => {
        wh[u] = prev.watchHistory[u].filter(m => m !== movie)
      })
      return {
        ...prev,
        movies: prev.movies.filter(m => m !== movie),
        movieGenreMap: mgm,
        watchHistory: wh,
      }
    })
  }

  /** BUG 4 FIX: Cascading delete for GENRE */
  const deleteGenre = (genre) => {
    setSetupData(prev => {
      // strip from every movie's genre list
      const mgm = {}
      Object.keys(prev.movieGenreMap).forEach(m => {
        mgm[m] = prev.movieGenreMap[m].filter(g => g !== genre)
      })
      // strip from every user's cold-start prefs
      const gp = {}
      Object.keys(prev.genrePrefs).forEach(u => {
        gp[u] = prev.genrePrefs[u].filter(g => g !== genre)
      })
      return {
        ...prev,
        genres: prev.genres.filter(g => g !== genre),
        movieGenreMap: mgm,
        genrePrefs: gp,
      }
    })
  }

  /** Map a genre onto a movie */
  const addMovieGenre = () => {
    if (!mapMovie || !mapGenre) return
    setSetupData(prev => {
      const mgm = { ...prev.movieGenreMap }
      if (!mgm[mapMovie]) mgm[mapMovie] = []
      if (!mgm[mapMovie].includes(mapGenre)) mgm[mapMovie] = [...mgm[mapMovie], mapGenre]
      return { ...prev, movieGenreMap: mgm }
    })
    setMapGenre('')
  }

  /** Remove a single genre from a movie */
  const removeMovieGenre = (movie, genre) => {
    setSetupData(prev => {
      const mgm = { ...prev.movieGenreMap }
      mgm[movie] = mgm[movie].filter(g => g !== genre)
      return { ...prev, movieGenreMap: mgm }
    })
  }

  /** Add a movie to a user's watch history */
  const addWatchHistory = () => {
    if (!histUser || !histMovie) return
    setSetupData(prev => {
      const wh = { ...prev.watchHistory }
      if (!wh[histUser]) wh[histUser] = []
      if (!wh[histUser].includes(histMovie)) wh[histUser] = [...wh[histUser], histMovie]
      return { ...prev, watchHistory: wh }
    })
    setHistMovie('')
  }

  /** Remove a single movie from a user's watch history */
  const removeWatchHistoryItem = (user, movie) => {
    setSetupData(prev => {
      const wh = { ...prev.watchHistory }
      wh[user] = wh[user].filter(m => m !== movie)
      return { ...prev, watchHistory: wh }
    })
  }

  /** Toggle a genre pref for a cold-start user */
  const toggleGenrePref = (user, genre) => {
    setSetupData(prev => {
      const gp = { ...prev.genrePrefs }
      if (!gp[user]) gp[user] = []
      if (gp[user].includes(genre)) {
        gp[user] = gp[user].filter(g => g !== genre)
      } else {
        gp[user] = [...gp[user], genre]
      }
      return { ...prev, genrePrefs: gp }
    })
  }

  const Chip = ({ label, onRemove }) => (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-section border border-borderDark rounded text-sm text-textPrimary">
      {label}
      <button onClick={onRemove} className="text-textMuted hover:text-accent leading-none">&times;</button>
    </span>
  )

  const AddRow = ({ value, onChange, placeholder, onAdd }) => (
    <div className="flex gap-2 mt-3">
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onAdd()}
        placeholder={placeholder}
        className="bg-section border border-borderDark rounded px-3 py-1.5 text-sm text-textPrimary outline-none focus:border-accent transition-colors flex-1 max-w-xs"
      />
      <button
        onClick={onAdd}
        className="px-4 py-1.5 bg-borderDark hover:bg-accent text-white rounded text-sm transition-colors"
      >
        Add
      </button>
    </div>
  )

  // Identify cold-start users (empty watch history)
  const coldStartUsers = setupData.users.filter(
    u => (setupData.watchHistory[u] || []).length === 0
  )

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="card-border p-8 mb-8 space-y-8">

      {/* ── USERS ──────────────────────────────────────────────────────────── */}
      <div>
        <h3 className="accent-heading">Users</h3>
        <div className="flex flex-wrap gap-2">
          {setupData.users.map(u => (
            <Chip key={u} label={u} onRemove={() => deleteUser(u)} />
          ))}
        </div>
        <AddRow
          value={newUser} onChange={setNewUser} placeholder="New user name…"
          onAdd={() => {
            const v = newUser.trim()
            if (!v || setupData.users.includes(v)) return
            setSetupData(prev => ({
              ...prev,
              users: [...prev.users, v],
              watchHistory: { ...prev.watchHistory, [v]: [] },
            }))
            setNewUser('')
          }}
        />
      </div>

      {/* ── MOVIES ─────────────────────────────────────────────────────────── */}
      <div>
        <h3 className="accent-heading">Movies</h3>
        <div className="flex flex-wrap gap-2">
          {setupData.movies.map(m => (
            <Chip key={m} label={m} onRemove={() => deleteMovie(m)} />
          ))}
        </div>
        <AddRow
          value={newMovie} onChange={setNewMovie} placeholder="New movie title…"
          onAdd={() => {
            const v = newMovie.trim()
            if (!v || setupData.movies.includes(v)) return
            setSetupData(prev => ({
              ...prev,
              movies: [...prev.movies, v],
              movieGenreMap: { ...prev.movieGenreMap, [v]: [] },
            }))
            setNewMovie('')
          }}
        />
      </div>

      {/* ── GENRES ─────────────────────────────────────────────────────────── */}
      <div>
        <h3 className="accent-heading">Genres</h3>
        <div className="flex flex-wrap gap-2">
          {setupData.genres.map(g => (
            <Chip key={g} label={g} onRemove={() => deleteGenre(g)} />
          ))}
        </div>
        <AddRow
          value={newGenre} onChange={setNewGenre} placeholder="New genre…"
          onAdd={() => addToList('genres', newGenre, setNewGenre)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-borderDark">

        {/* ── MOVIE → GENRE MAP ─────────────────────────────────────────────── */}
        <div>
          <h3 className="accent-heading">Movie → Genre Mapping</h3>
          <div className="flex gap-2 mb-4">
            <select value={mapMovie} onChange={e => setMapMovie(e.target.value)}
              className="bg-section border border-borderDark rounded p-1.5 text-sm outline-none flex-1">
              <option value="">Movie…</option>
              {setupData.movies.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={mapGenre} onChange={e => setMapGenre(e.target.value)}
              className="bg-section border border-borderDark rounded p-1.5 text-sm outline-none flex-1">
              <option value="">Genre…</option>
              {setupData.genres.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <button onClick={addMovieGenre}
              className="px-3 py-1.5 bg-borderDark hover:bg-accent text-white rounded text-sm transition-colors">
              Map
            </button>
          </div>
          <div className="space-y-2">
            {setupData.movies.map(m => (
              <div key={m} className="flex items-center justify-between border-b border-borderDark pb-2 last:border-0">
                <span className="text-sm font-semibold">{m}</span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {(setupData.movieGenreMap[m] || []).map(g => (
                    <span key={g}
                      className="px-2 py-0.5 bg-section border border-borderDark rounded text-[10px] inline-flex items-center gap-1">
                      {g}
                      <button onClick={() => removeMovieGenre(m, g)}
                        className="hover:text-accent text-textMuted">&times;</button>
                    </span>
                  ))}
                  {(setupData.movieGenreMap[m] || []).length === 0 &&
                    <span className="text-xs text-textMuted italic">none</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── WATCH HISTORY ─────────────────────────────────────────────────── */}
        <div>
          <h3 className="accent-heading">User Watch History</h3>
          <div className="flex gap-2 mb-4">
            <select value={histUser} onChange={e => setHistUser(e.target.value)}
              className="bg-section border border-borderDark rounded p-1.5 text-sm outline-none flex-1">
              <option value="">User…</option>
              {setupData.users.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <select value={histMovie} onChange={e => setHistMovie(e.target.value)}
              className="bg-section border border-borderDark rounded p-1.5 text-sm outline-none flex-1">
              <option value="">Movie…</option>
              {setupData.movies.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <button onClick={addWatchHistory}
              className="px-3 py-1.5 bg-borderDark hover:bg-accent text-white rounded text-sm transition-colors">
              Log
            </button>
          </div>
          <div className="space-y-2">
            {setupData.users.map(user => {
              const history = setupData.watchHistory[user] || []
              const isColdStart = history.length === 0
              return (
                <div key={user}
                  className="flex flex-col border-b border-borderDark pb-2 mb-2 last:border-0 last:pb-0 last:mb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold">{user}</span>
                    {isColdStart
                      ? <span className="text-[10px] text-accent italic">No history — cold start</span>
                      : <div className="flex flex-wrap gap-1 justify-end">
                          {history.map(m => (
                            <span key={m}
                              className="px-2 py-0.5 bg-section border border-borderDark rounded text-[10px] inline-flex items-center gap-1">
                              {m}
                              <button onClick={() => removeWatchHistoryItem(user, m)}
                                className="hover:text-accent text-textMuted">&times;</button>
                            </span>
                          ))}
                        </div>
                    }
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── BUG 1 FIX: COLD-START GENRE PREFERENCES ───────────────────────── */}
      {coldStartUsers.length > 0 && (
        <div className="pt-4 border-t border-borderDark">
          <h3 className="accent-heading">Cold-Start Genre Preferences</h3>
          <p className="text-xs text-textMuted mb-4">
            Users with no watch history need genre preferences to receive recommendations (α = 0 → 100% genre-based scoring).
          </p>
          <div className="space-y-4">
            {coldStartUsers.map(user => (
              <div key={user} className="p-4 border border-borderDark rounded bg-section">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-bold">{user}</span>
                  <span className="text-[10px] text-accent border border-accent/50 bg-accent/10 px-2 py-0.5 rounded">
                    No watch history detected — please select preferred genres
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {setupData.genres.map(g => {
                    const selected = (setupData.genrePrefs[user] || []).includes(g)
                    return (
                      <button
                        key={g}
                        onClick={() => toggleGenrePref(user, g)}
                        className={`px-3 py-1.5 rounded text-sm border transition-colors ${
                          selected
                            ? 'bg-accent border-accent text-white'
                            : 'bg-background border-borderDark text-textMuted hover:border-accent hover:text-textPrimary'
                        }`}
                      >
                        {g}
                      </button>
                    )
                  })}
                </div>
                {(setupData.genrePrefs[user] || []).length === 0 && (
                  <p className="text-xs text-textMuted italic mt-2">
                    ⚠ No genres selected — this user will receive no recommendations.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
