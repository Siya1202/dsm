import React from 'react'

const colors = ["border-highlight", "border-success", "border-accent"];

export default function CommunityPanel({ data }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {data.communities.map((comm, idx) => (
        <div key={comm.id} className={`card-border p-5 border-l-4 ${colors[idx % colors.length]}`}>
          <h4 className="text-sm font-bold text-textMuted mb-3 uppercase tracking-wider">{comm.id}</h4>
          <div className="flex flex-wrap gap-2">
            {comm.members.map(member => (
              <span key={member} className="px-3 py-1 bg-section rounded border border-borderDark text-sm">
                {member}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
