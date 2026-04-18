import React, { useState } from 'react'

export default function SetupForm({ setupData, setSetupData }) {
  // Temporary inputs for simple adding
  const [newUser, setNewUser] = useState('')
  const [newMovie, setNewMovie] = useState('')
  const [newGenre, setNewGenre] = useState('')

  const handleAddField = (field, key, setKey) => {
    if (!key.trim()) return;
    if (setupData[field].includes(key.trim())) return;
    setSetupData(prev => ({
      ...prev,
      [field]: [...prev[field], key.trim()]
    }))
    setKey('')
  }

  const handleRemoveField = (field, item) => {
    setSetupData(prev => {
      const copy = { ...prev };
      copy[field] = copy[field].filter(x => x !== item);
      return copy;
    })
  }

  // Handle adding genres to movies
  const [targetMovie, setTargetMovie] = useState('')
  const [targetMGenre, setTargetMGenre] = useState('')
  
  const addMovieGenre = () => {
    if (!targetMovie || !targetMGenre) return;
    setSetupData(prev => {
      const mapping = { ...prev.movieGenreMap }
      if (!mapping[targetMovie]) mapping[targetMovie] = []
      if (!mapping[targetMovie].includes(targetMGenre)) {
        mapping[targetMovie] = [...mapping[targetMovie], targetMGenre]
      }
      return { ...prev, movieGenreMap: mapping }
    })
    setTargetMGenre('')
  }

  // Handle watch history
  const [targetUser, setTargetUser] = useState('')
  const [targetHistory, setTargetHistory] = useState('')

  const addWatchHistory = () => {
    if (!targetUser || !targetHistory) return;
    setSetupData(prev => {
      const wh = { ...prev.watchHistory }
      if (!wh[targetUser]) wh[targetUser] = []
      if (!wh[targetUser].includes(targetHistory)) {
         wh[targetUser] = [...wh[targetUser], targetHistory]
      }
      return { ...prev, watchHistory: wh }
    })
    setTargetHistory('')
  }

  return (
    <div className="card-border p-8 mb-8 space-y-8">
      
      {/* USERS */}
      <div>
        <h3 className="accent-heading">Users</h3>
        <div className="flex flex-wrap gap-3 mb-3">
          {setupData.users.map(user => (
            <div key={user} className="px-4 py-2 border border-borderDark bg-section rounded text-sm text-textPrimary inline-flex items-center gap-2">
              {user} <button onClick={() => handleRemoveField('users', user)} className="text-textMuted hover:text-accent">&times;</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input 
            value={newUser} onChange={e => setNewUser(e.target.value)} 
            placeholder="New User" 
            className="bg-section border border-borderDark rounded px-3 py-1.5 text-sm outline-none text-textPrimary"
          />
          <button onClick={() => handleAddField('users', newUser, setNewUser)} className="px-4 py-1.5 bg-borderDark hover:bg-accent text-white rounded text-sm transition-colors">Add</button>
        </div>
      </div>

      {/* MOVIES */}
      <div>
        <h3 className="accent-heading">Movies</h3>
        <div className="flex flex-wrap gap-3 mb-3">
          {setupData.movies.map(movie => (
            <div key={movie} className="px-4 py-2 border border-borderDark bg-section rounded text-sm text-textPrimary inline-flex items-center gap-2">
              {movie} <button onClick={() => handleRemoveField('movies', movie)} className="text-textMuted hover:text-accent">&times;</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input 
            value={newMovie} onChange={e => setNewMovie(e.target.value)} 
            placeholder="New Movie" 
            className="bg-section border border-borderDark rounded px-3 py-1.5 text-sm outline-none"
          />
          <button onClick={() => handleAddField('movies', newMovie, setNewMovie)} className="px-4 py-1.5 bg-borderDark hover:bg-accent text-white rounded text-sm transition-colors">Add</button>
        </div>
      </div>

      {/* GENRES */}
      <div>
        <h3 className="accent-heading">Genres</h3>
        <div className="flex flex-wrap gap-3 mb-3">
          {setupData.genres.map(genre => (
            <div key={genre} className="px-4 py-2 border border-borderDark bg-section rounded text-sm text-textPrimary inline-flex items-center gap-2">
              {genre} <button onClick={() => handleRemoveField('genres', genre)} className="text-textMuted hover:text-accent">&times;</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input 
            value={newGenre} onChange={e => setNewGenre(e.target.value)} 
            placeholder="New Genre" 
            className="bg-section border border-borderDark rounded px-3 py-1.5 text-sm outline-none"
          />
          <button onClick={() => handleAddField('genres', newGenre, setNewGenre)} className="px-4 py-1.5 bg-borderDark hover:bg-accent text-white rounded text-sm transition-colors">Add</button>
        </div>
      </div>

      {/* MATRIX MAPPERS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-borderDark">
        <div>
          <h3 className="accent-heading">Map Movie Genres</h3>
          <div className="flex gap-2 mb-4">
            <select value={targetMovie} onChange={e=>setTargetMovie(e.target.value)} className="bg-section border border-borderDark rounded p-1 text-sm outline-none w-1/3">
              <option value="">Movie...</option>
              {setupData.movies.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={targetMGenre} onChange={e=>setTargetMGenre(e.target.value)} className="bg-section border border-borderDark rounded p-1 text-sm outline-none w-1/3">
              <option value="">Genre...</option>
              {setupData.genres.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <button onClick={addMovieGenre} className="px-3 bg-borderDark hover:bg-accent rounded text-xs transition-colors">Map</button>
          </div>
          <div className="space-y-3">
            {Object.entries(setupData.movieGenreMap).map(([movie, genres]) => (
              <div key={movie} className="flex items-center justify-between border-b border-borderDark pb-2 last:border-0">
                <span className="text-sm font-semibold">{movie}</span>
                <span className="text-xs text-textMuted">{genres.join(', ')}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="accent-heading">User Watch History</h3>
          <div className="flex gap-2 mb-4">
            <select value={targetUser} onChange={e=>setTargetUser(e.target.value)} className="bg-section border border-borderDark rounded p-1 text-sm outline-none w-1/3">
              <option value="">User...</option>
              {setupData.users.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <select value={targetHistory} onChange={e=>setTargetHistory(e.target.value)} className="bg-section border border-borderDark rounded p-1 text-sm outline-none w-1/3">
              <option value="">Movie...</option>
              {setupData.movies.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <button onClick={addWatchHistory} className="px-3 bg-borderDark hover:bg-accent rounded text-xs transition-colors">Log View</button>
          </div>
          <div className="space-y-3">
            {setupData.users.map(user => {
               const history = setupData.watchHistory[user] || [];
               return (
                 <div key={user} className="flex items-center justify-between border-b border-borderDark pb-2 last:border-0">
                   <span className="text-sm font-semibold">{user}</span>
                   <span className="text-xs text-textMuted">{history.length > 0 ? history.join(', ') : <span className="italic">Cold Start</span>}</span>
                 </div>
               )
            })}
          </div>
        </div>
      </div>

    </div>
  )
}
