import React from 'react'

export default function HeatmapUM({ result }) {
  const { a_um_matrix, movies } = result

  const getColor     = v => v === 0 ? '#F0EDE6' : '#C8521A'
  const getTextColor = v => v === 0 ? '#141414' : '#F0EDE6'

  return (
    <div className="card-border p-4 overflow-x-auto">
      <div className="min-w-max">
        {/* Column headers */}
        <div className="flex mb-2">
          <div className="w-24 shrink-0" />
          {movies.map(m => (
            <div key={m} className="w-20 text-center text-xs font-semibold text-textMuted shrink-0 flex items-end justify-center pb-2">
              <span className="-rotate-45 block mb-2">{m}</span>
            </div>
          ))}
        </div>
        {/* Rows */}
        {a_um_matrix.map(row => (
          <div key={row.name} className="flex mb-1">
            <div className="w-24 shrink-0 flex items-center text-sm font-bold text-textPrimary pl-2">
              {row.name}
            </div>
            {movies.map(m => {
              const v = row[m] ?? 0
              return (
                <div
                  key={m}
                  className="w-20 h-10 m-0.5 rounded-sm flex items-center justify-center text-xs font-mono hover:ring-2 hover:ring-highlight transition-all shrink-0"
                  style={{ backgroundColor: getColor(v), color: getTextColor(v) }}
                  title={`${row.name} – ${m}: ${v}`}
                >
                  {v}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
