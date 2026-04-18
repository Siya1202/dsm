import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import RecommendationCards from '../components/RecommendationCards'
import TripartiteGraph from '../components/TripartiteGraph'
import HeatmapUM from '../components/HeatmapUM'
import HeatmapUG from '../components/HeatmapUG'
import ScoreBarChart from '../components/ScoreBarChart'
import SimilarityTable from '../components/SimilarityTable'
import CommunityPanel from '../components/CommunityPanel'

const Section = ({ title, children, delay }) => (
  <motion.section 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="mb-12"
  >
    <h2 className="uppercase tracking-widest text-sm font-bold text-accent mb-6 border-b border-borderDark pb-2 inline-block">
      {title}
    </h2>
    {children}
  </motion.section>
)

export default function Dashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  const apiData = location.state?.apiData

  useEffect(() => {
    if (!apiData) {
      navigate('/')
    }
  }, [apiData, navigate])

  if (!apiData) return <div className="p-8">Loading data or redirecting to Setup...</div>

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="mb-12 flex justify-between items-end border-b border-borderDark pb-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-textPrimary">Analysis Results</h1>
          <p className="text-textMuted mt-2">Graph theory based recommendations computed by your Python Engine.</p>
        </div>
        <button onClick={() => navigate('/')} className="text-sm font-bold text-textMuted hover:text-accent transition-colors">
          &larr; Back to Configurator
        </button>
      </div>

      <Section title="A. Final Recommendations" delay={0.1}>
        <RecommendationCards data={apiData} />
      </Section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
        <Section title="B. Tripartite Graph Visualization" delay={0.2}>
          <TripartiteGraph data={apiData} />
        </Section>
        <Section title="E. Recommendation Scores" delay={0.3}>
          <ScoreBarChart data={apiData} />
        </Section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
        <Section title="C. User-Movie Matrix (A_UM)" delay={0.4}>
          <HeatmapUM data={apiData} />
        </Section>
        <Section title="D. User-Genre Affinity (A_UG_norm)" delay={0.5}>
          <HeatmapUG data={apiData} />
        </Section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
        <Section title="F. User Similarity" delay={0.6}>
          <SimilarityTable data={apiData} />
        </Section>
        <Section title="G. Discovered Communities" delay={0.7}>
          <CommunityPanel data={apiData} />
        </Section>
      </div>
    </div>
  )
}
