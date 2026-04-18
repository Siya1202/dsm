import React from 'react'

function MiniTable({ title, tableData, scoreType }) {
  return (
    <div className="card-border overflow-hidden">
      <div className="bg-accent/10 border-b border-borderDark px-4 py-2">
        <h4 className="text-xs font-bold text-accent uppercase tracking-widest">{title}</h4>
      </div>
      {tableData.length === 0 ? (
          <div className="p-4 text-xs italic text-textMuted">Not enough users for similarity comparison</div>
      ) : (
          <table className="w-full text-left text-sm">
            <tbody>
              {tableData.map((row, idx) => (
                <tr key={idx} className="border-b border-borderDark last:border-0 even:bg-section/50 hover:bg-section transition-colors">
                  <td className="px-4 py-2 font-medium">{row.pair}</td>
                  <td className="px-4 py-2 text-right font-mono text-textMuted">
                    {scoreType === 'float' ? row.score.toFixed(3) : row.score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      )}
    </div>
  )
}

export default function SimilarityTable({ data }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <MiniTable 
        title="Intersection Similarity" 
        tableData={data.similarities.intersection} 
        scoreType="int" 
      />
      <MiniTable 
        title="Jaccard Similarity" 
        tableData={data.similarities.jaccard} 
        scoreType="float" 
      />
    </div>
  )
}
