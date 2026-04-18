import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const lineColors = ["#7F77DD","#1D9E75","#C8521A","#D85A30","#0F6E56"];

export default function ScoreBarChart({ data }) {
  if (data.recommendationScores.length === 0) {
      return <div className="card-border p-4 flex items-center justify-center italic text-textMuted" style={{ height: 400 }}>No unwatched movies available to score.</div>
  }

  return (
    <div className="card-border p-4" style={{ height: 400 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data.recommendationScores}
          margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
          <XAxis dataKey="movie" stroke="#7A7A7A" tick={{ fill: '#7A7A7A', fontSize: 12 }} />
          <YAxis stroke="#7A7A7A" tick={{ fill: '#7A7A7A', fontSize: 12 }} />
          <Tooltip 
            cursor={{ fill: '#2A2A2A', opacity: 0.4 }}
            contentStyle={{ backgroundColor: '#1C1C1C', borderColor: '#2A2A2A', color: '#F0EDE6' }}
            itemStyle={{ fontSize: 13 }}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
          {data.users.map((user, idx) => (
             <Bar key={user} dataKey={user} fill={lineColors[idx % lineColors.length]} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
