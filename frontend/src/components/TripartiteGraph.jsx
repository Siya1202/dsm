import React, { useRef, useEffect, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'

function generateGraphData(data) {
  const nodes = [];
  const links = [];

  data.users.forEach(u => nodes.push({ id: u, group: 'user', color: '#C8521A' }));
  data.movies.forEach(m => nodes.push({ id: m, group: 'movie', color: '#9FE1CB' }));
  data.genres.forEach(g => nodes.push({ id: g, group: 'genre', color: '#F5C4B3' }));

  Object.entries(data.watchHistory).forEach(([user, movies]) => {
    movies.forEach(movie => {
      links.push({ source: user, target: movie, color: '#7F77DD' });
    });
  });

  Object.entries(data.movieGenreMap).forEach(([movie, genres]) => {
    genres.forEach(genre => {
      links.push({ source: movie, target: genre, color: '#1D9E75' });
    });
  });

  return { nodes, links };
}

export default function TripartiteGraph({ data }) {
  const fgRef = useRef();
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });

  useEffect(() => {
    setGraphData(generateGraphData(data))
  }, [data]);

  useEffect(() => {
    if (fgRef.current && window.d3) {
      fgRef.current.d3Force('collide', window.d3.forceCollide(25));
      setTimeout(() => fgRef.current.zoomToFit(400, 50), 500);
    }
  }, [graphData]);

  return (
    <div className="card-border bg-[#0D0D0D] overflow-hidden relative" style={{ height: 400 }}>
      {graphData.nodes.length > 0 && (
          <ForceGraph2D
            ref={fgRef}
            graphData={graphData}
            width={800}
            height={400}
            nodeLabel="id"
            nodeColor={node => node.color}
            nodeRelSize={8}
            linkColor={link => link.color}
            linkWidth={1.5}
            backgroundColor="#0D0D0D"
            onNodeDragEnd={node => { node.fx = node.x; node.fy = node.y; }}
          />
      )}
      <div className="absolute bottom-4 left-4 bg-section/90 border border-borderDark px-4 py-2 rounded text-xs text-textPrimary space-y-1 backdrop-blur-md pointer-events-none">
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#C8521A]"></span> Users</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#9FE1CB]"></span> Movies</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#F5C4B3]"></span> Genres</div>
        <div className="border-t border-borderDark my-1 pt-1">
          <div className="flex items-center gap-2"><span className="w-3 h-0.5 bg-[#7F77DD]"></span> Watch Edge</div>
          <div className="flex items-center gap-2"><span className="w-3 h-0.5 bg-[#1D9E75]"></span> Genre Edge</div>
        </div>
      </div>
    </div>
  )
}
