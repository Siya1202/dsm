import React from 'react'
import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-borderDark bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold flex items-center gap-2 text-textPrimary hover:text-accent transition-colors">
          <span className="text-2xl">🎬</span>
          CineGraph
        </Link>
        <div className="flex items-center gap-8 text-sm font-semibold tracking-wide text-textMuted">
          <Link to="/" className="hover:text-textPrimary transition-colors">Setup</Link>
          <Link to="/dashboard" className="hover:text-textPrimary transition-colors">Results</Link>
          <button className="hover:text-textPrimary transition-colors">About</button>
        </div>
      </div>
    </nav>
  )
}
