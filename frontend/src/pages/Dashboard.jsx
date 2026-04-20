import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import RecommendationCards from '../components/RecommendationCards'
import TripartiteGraph      from '../components/TripartiteGraph'
import HeatmapUM            from '../components/HeatmapUM'
import HeatmapUG            from '../components/HeatmapUG'
import ScoreBarChart        from '../components/ScoreBarChart'
import SimilarityTable      from '../components/SimilarityTable'

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
  const navigate  = useNavigate()
  // BUG 2 FIX: read only from router state — never from mockData directly
  const result = location.state?.result

  useEffect(() => {
    if (!result) navigate('/')
  }, [result, navigate])

  if (!result) return (
    <div className="p-8 text-textMuted">Redirecting to setup…</div>
  )

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="mb-12 flex justify-between items-end border-b border-borderDark pb-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-textPrimary">Analysis Results</h1>
          <p className="text-textMuted mt-2">
            Computed from your live graph configuration.
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="text-sm font-bold text-textMuted hover:text-accent transition-colors"
        >
          ← Back to Configurator
        </button>
      </div>

      {/* A — Recommendations */}
      <Section title="A. Final Recommendations" delay={0.1}>
        <RecommendationCards result={result} />
      </Section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
        {/* B — Tripartite Graph */}
        <Section title="B. Tripartite Graph Visualisation" delay={0.2}>
          <TripartiteGraph result={result} />
        </Section>

        {/* E — Scores Bar Chart */}
        <Section title="E. Recommendation Scores" delay={0.3}>
          <ScoreBarChart result={result} />
        </Section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
        {/* C — A_UM Heatmap */}
        <Section title="C. User-Movie Matrix (A_UM)" delay={0.4}>
          <HeatmapUM result={result} />
        </Section>

        {/* D — A_UG Heatmap */}
        <Section title="D. User-Genre Affinity (A_UG_norm)" delay={0.5}>
          <HeatmapUG result={result} />
        </Section>
      </div>

      {/* F — Similarity Tables */}
      <Section title="F. User Similarity" delay={0.6}>
        <SimilarityTable result={result} />
      </Section>
    </div>
  )
}
