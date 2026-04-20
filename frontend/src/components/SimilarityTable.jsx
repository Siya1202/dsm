import React from 'react'

function MiniTable({ title, rows, formatter }) {
  return (
    <div className="card-border overflow-hidden">
      <div className="bg-accent/10 border-b border-borderDark px-4 py-2">
        <h4 className="text-xs font-bold text-accent uppercase tracking-widest">{title}</h4>
      </div>
      {rows.length === 0 ? (
        <p className="p-4 text-xs italic text-textMuted">Not enough users for comparison.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-b border-borderDark last:border-0 even:bg-section/50 hover:bg-section transition-colors">
                <td className="px-4 py-2 font-medium">{row.pair}</td>
                <td className="px-4 py-2 text-right font-mono text-textMuted">{formatter(row.score)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default function SimilarityTable({ result }) {
  const { similarities } = result
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <MiniTable
        title="Intersection Similarity"
        rows={similarities.intersection}
        formatter={v => v}
      />
      <MiniTable
        title="Jaccard Similarity"
        rows={similarities.jaccard}
        formatter={v => v.toFixed(3)}
      />
    </div>
  )
}
