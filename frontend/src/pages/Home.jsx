import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import SetupForm from '../components/SetupForm'
import { MOCK_DATA } from '../data/mockData' // We use this purely to seed initial form state

export default function Home() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Global form state initializing from our mock defaults so user doesn't have an empty screen
  const [setupData, setSetupData] = useState({
    users: [...MOCK_DATA.users],
    movies: [...MOCK_DATA.movies],
    genres: [...MOCK_DATA.genres],
    watchHistory: { ...MOCK_DATA.watchHistory },
    movieGenreMap: { ...MOCK_DATA.movieGenreMap },
    coldStart: { ...MOCK_DATA.coldStart }
  })

  const handleRunAlgorithm = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('http://localhost:8000/api/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(setupData)
      })

      if (!response.ok) {
        throw new Error('Failed to fetch from backend API. Make sure uvicorn is running!')
      }
      const data = await response.json()
      
      // Navigate to dashboard and pass the fetched payload!
      navigate('/dashboard', { state: { apiData: data } })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="container mx-auto px-6 py-16 max-w-4xl"
    >
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-4 text-textPrimary">
          Discover Your <span className="relative inline-block">
            Next Watch.
            <div className="absolute -bottom-2 left-0 right-0 h-1 bg-accent"></div>
          </span>
        </h1>
        <p className="text-textMuted text-lg mt-6">
          Configure the underlying data graph dynamically before generating predictions.
        </p>
      </div>

      <SetupForm setupData={setupData} setSetupData={setSetupData} />

      {error && (
        <div className="mt-4 p-4 border border-accent bg-accent/10 text-accent text-center rounded">
          {error}
        </div>
      )}

      <div className="flex justify-center mt-12">
        <button 
          onClick={handleRunAlgorithm}
          disabled={loading}
          className="bg-accent hover:bg-accentHover text-white font-bold py-4 px-10 rounded shadow-lg transition-transform transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {loading ? 'Crunching Matrices...' : 'Run Recommendation Engine'}
        </button>
      </div>
    </motion.div>
  )
}
