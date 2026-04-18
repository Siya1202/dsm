import React from 'react'

export default function HeatmapUM({ data: rawData }) {
  const data = rawData.a_um_matrix;
  const cols = rawData.movies;

  const getColor = (val) => val === 0 ? '#F0EDE6' : '#C8521A';
  const getTextColor = (val) => val === 0 ? '#141414' : '#F0EDE6';

  return (
    <div className="card-border p-4 overflow-x-auto">
      <div className="min-w-max">
        <div className="flex mb-2">
          <div className="w-24 shrink-0"></div>
          {cols.map(m => (
            <div key={m} className="w-20 text-center text-xs font-semibold text-textMuted leading-tight shrink-0 flex items-end justify-center pb-2">
              <span className="-rotate-45 block mb-2">{m}</span>
            </div>
          ))}
        </div>
        {data.map(row => (
          <div key={row.name} className="flex mb-1">
            <div className="w-24 shrink-0 flex items-center text-sm font-bold text-textPrimary pl-2">
              {row.name}
            </div>
            {cols.map(m => (
              <div 
                key={m} 
                className="w-20 h-10 m-0.5 rounded-sm flex items-center justify-center text-xs font-mono transition-colors hover:ring-2 hover:ring-highlight shrink-0"
                style={{ backgroundColor: getColor(row[m]||0), color: getTextColor(row[m]||0) }}
                title={`${row.name} - ${m}: ${row[m]||0}`}
              >
                {row[m] || 0}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
