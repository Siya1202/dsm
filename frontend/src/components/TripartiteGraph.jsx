import React, { useRef, useEffect, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'

function buildGraph({ users, movies, genres, watchHistory, movieGenreMap }) {
  const nodes = [
    ...users.map(u  => ({ id: u, color: '#C8521A' })),
    ...movies.map(m => ({ id: m, color: '#9FE1CB' })),
    ...genres.map(g => ({ id: g, color: '#F5C4B3' })),
  ]
  const links = []
  Object.entries(watchHistory).forEach(([user, watched]) =>
    watched.forEach(m => links.push({ source: user, target: m, color: '#7F77DD' }))
  )
  Object.entries(movieGenreMap).forEach(([movie, gg]) =>
    gg.forEach(g => links.push({ source: movie, target: g, color: '#1D9E75' }))
  )
  return { nodes, links }
}

export default function TripartiteGraph({ result }) {
  const fgRef = useRef()
  const [gd, setGd] = useState({ nodes: [], links: [] })

  useEffect(() => { setGd(buildGraph(result)) }, [result])

  useEffect(() => {
    if (fgRef.current && window.d3) {
      fgRef.current.d3Force('collide', window.d3.forceCollide(25))
      setTimeout(() => fgRef.current?.zoomToFit(400, 50), 600)
    }
  }, [gd])

  return (
    <div className="card-border bg-[#0D0D0D] overflow-hidden relative" style={{ height: 400 }}>
      {gd.nodes.length > 0 && (
        <ForceGraph2D
          ref={fgRef}
          graphData={gd}
          width={800} height={400}
          nodeLabel="id"
          nodeColor={n => n.color}
          nodeRelSize={8}
          linkColor={l => l.color}
          linkWidth={1.5}
          backgroundColor="#0D0D0D"
          onNodeDragEnd={n => { n.fx = n.x; n.fy = n.y }}
        />
      )}
      <div className="absolute bottom-4 left-4 bg-section/90 border border-borderDark px-4 py-2 rounded text-xs text-textPrimary space-y-1 backdrop-blur-md pointer-events-none">
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#C8521A]" /> Users</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#9FE1CB]" /> Movies</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#F5C4B3]" /> Genres</div>
        <div className="border-t border-borderDark my-1 pt-1">
          <div className="flex items-center gap-2"><span className="w-3 h-0.5 bg-[#7F77DD]" /> Watch edge</div>
          <div className="flex items-center gap-2"><span className="w-3 h-0.5 bg-[#1D9E75]" /> Genre edge</div>
        </div>
      </div>
    </div>
  )
}
