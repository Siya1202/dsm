import React from 'react'

export default function RecommendationCards({ result }) {
  const { recommendations, watchHistory } = result

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Object.entries(recommendations).map(([user, data]) => {
        // BUG 2 & 3 FIX: filter watched movies BEFORE rendering (engine already does this,
        // but we guard here too so nothing ever slips through)
        const watched = new Set(watchHistory[user] || [])
        const recs = data.recs.filter(r => !watched.has(r.movie))

        const isCollab = data.type === 'Collaborative'
        const badgeClass = isCollab
          ? 'bg-highlight/20 text-highlight border-highlight/50'
          : 'bg-success/20 text-success border-success/50'

        return (
          <div key={user} className="card-border p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">{user}</h3>
              {recs.length > 0 && (
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded border ${badgeClass}`}>
                  {data.type}
                </span>
              )}
            </div>

            {recs.length === 0 ? (
              <p className="text-sm italic text-textMuted flex-1 flex items-center">
                No recommendations available.
              </p>
            ) : (
              <div className="space-y-4 flex-1">
                {recs.map((rec, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-textPrimary">{rec.movie}</span>
                      <span className="text-accent font-mono">{rec.score.toFixed(3)}</span>
                    </div>
                    <div className="w-full bg-section h-1.5 rounded overflow-hidden">
                      <div
                        className="bg-accent h-full transition-all"
                        style={{ width: `${Math.min((rec.score / 2.0) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
