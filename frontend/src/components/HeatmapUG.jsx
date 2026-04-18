import React from 'react'

export default function HeatmapUG({ data: rawData }) {
  const data = rawData.a_ug_matrix;
  const cols = rawData.genres;

  const getColor = (val) => `rgba(29, 158, 117, ${Math.max(0.1, val)})`;
  const getTextColor = (val) => val > 0.5 ? '#F0EDE6' : '#7A7A7A';

  return (
    <div className="card-border p-4 overflow-x-auto">
      <div className="min-w-max">
        <div className="flex mb-2">
          <div className="w-24 shrink-0"></div>
          {cols.map(g => (
            <div key={g} className="w-24 text-center text-xs font-semibold text-textMuted shrink-0">
              {g}
            </div>
          ))}
        </div>
        {data.map(row => (
          <div key={row.name} className="flex mb-1">
            <div className="w-24 shrink-0 flex items-center text-sm font-bold text-textPrimary pl-2">
              {row.name}
            </div>
            {cols.map(g => (
              <div 
                key={g} 
                className="w-24 h-10 m-0.5 rounded-sm flex items-center justify-center text-xs font-mono transition-colors hover:ring-2 hover:ring-highlight shrink-0"
                style={{ backgroundColor: getColor(row[g]||0), color: getTextColor(row[g]||0) }}
                title={`${row.name} - ${g}: ${(row[g]||0).toFixed(2)}`}
              >
                {(row[g]||0).toFixed(2)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
