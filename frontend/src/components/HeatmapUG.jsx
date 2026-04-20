import React from 'react'

export default function HeatmapUG({ result }) {
  const { a_ug_matrix, genres } = result

  const getColor     = v => `rgba(29, 158, 117, ${Math.max(0.08, v)})`
  const getTextColor = v => v > 0.5 ? '#F0EDE6' : '#7A7A7A'

  return (
    <div className="card-border p-4 overflow-x-auto">
      <div className="min-w-max">
        {/* Column headers */}
        <div className="flex mb-2">
          <div className="w-24 shrink-0" />
          {genres.map(g => (
            <div key={g} className="w-28 text-center text-xs font-semibold text-textMuted shrink-0 pb-2">
              {g}
            </div>
          ))}
        </div>
        {/* Rows */}
        {a_ug_matrix.map(row => (
          <div key={row.name} className="flex mb-1">
            <div className="w-24 shrink-0 flex items-center text-sm font-bold text-textPrimary pl-2">
              {row.name}
            </div>
            {genres.map(g => {
              const v = row[g] ?? 0
              return (
                <div
                  key={g}
                  className="w-28 h-10 m-0.5 rounded-sm flex items-center justify-center text-xs font-mono hover:ring-2 hover:ring-highlight transition-all shrink-0"
                  style={{ backgroundColor: getColor(v), color: getTextColor(v) }}
                  title={`${row.name} – ${g}: ${v.toFixed(2)}`}
                >
                  {v.toFixed(2)}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
