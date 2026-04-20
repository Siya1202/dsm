import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import SetupForm from '../components/SetupForm'
import { INITIAL_SETUP } from '../data/mockData'
import { compute } from '../utils/computeEngine'

export default function Home() {
  const navigate = useNavigate()
  const [error, setError]       = useState(null)
  const [setupData, setSetupData] = useState({
    users:        [...INITIAL_SETUP.users],
    movies:       [...INITIAL_SETUP.movies],
    genres:       [...INITIAL_SETUP.genres],
    watchHistory: { ...INITIAL_SETUP.watchHistory },
    movieGenreMap:{ ...INITIAL_SETUP.movieGenreMap },
    genrePrefs:   { ...INITIAL_SETUP.genrePrefs },
  })

  const handleRun = () => {
    setError(null)

    // BUG 2 FIX: recompute from LIVE state every single time
    const result = compute(setupData)

    if (!result) {
      setError('Please add at least one user, movie and genre before running.')
      return
    }

    // Navigate and pass results via router state
    navigate('/dashboard', { state: { result } })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="container mx-auto px-6 py-16 max-w-4xl"
    >
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-4 text-textPrimary">
          Discover Your{' '}
          <span className="relative inline-block">
            Next Watch.
            <div className="absolute -bottom-2 left-0 right-0 h-1 bg-accent" />
          </span>
        </h1>
        <p className="text-textMuted text-lg mt-6">
          Configure the graph below, then run the recommendation engine.
        </p>
      </div>

      <SetupForm setupData={setupData} setSetupData={setSetupData} />

      {error && (
        <div className="mb-6 p-4 border border-accent bg-accent/10 text-accent text-center rounded text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-center mt-8">
        <button
          onClick={handleRun}
          className="bg-accent hover:bg-accentHover text-white font-bold py-4 px-10 rounded shadow-lg transition-transform transform hover:-translate-y-1 active:translate-y-0"
        >
          Run Recommendation Engine
        </button>
      </div>
    </motion.div>
  )
}
