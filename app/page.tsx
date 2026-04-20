'use client'

import { useState, useEffect } from 'react'
import PlayerSetup from './components/PlayerSetup'
import WeekCalendar from './components/WeekCalendar'
import AvailabilitySummary from './components/AvailabilitySummary'

type Player = { id: number; name: string }

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showSetup, setShowSetup] = useState(false)

  const loadPlayers = async () => {
    try {
      const res = await fetch('/api/players')
      if (!res.ok) throw new Error('Failed to load players')
      const data: Player[] = await res.json()
      setPlayers(data)
      setShowSetup(data.length === 0)
    } catch (err) {
      console.error(err)
      setShowSetup(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadPlayers() }, [])

  if (isLoading) {
    return (
      <main className="app-loading">
        <div className="loader"></div>
      </main>
    )
  }

  if (showSetup) {
    return <PlayerSetup onComplete={loadPlayers} />
  }

  return (
    <>
      <div className="cursor-glow" id="cursorGlow"></div>
      <nav className="navbar">
        <a href="#" className="nav-brand">
          <span className="brand-bracket">{'{'}</span>NQ<span className="brand-bracket">{'}'}</span>
        </a>
        <span className="mono nav-tagline">Gaming Night Planner</span>
      </nav>

      <main className="app-main">
        <section className="hero-mini">
          <div className="hero-grid-bg"></div>
          <div className="hero-content">
            <div className="hero-badge">
              <span className="pulse-dot"></span>
              {players.length} players ready
            </div>
            <h1 className="hero-title">
              <span className="reveal-line"><span>Night</span></span>
              <span className="reveal-line"><span className="gradient-text">Quest</span></span>
            </h1>
            <p className="hero-sub">Find the perfect night for gaming.</p>
          </div>
        </section>

        <section className="content-section">
          <WeekCalendar players={players} />
        </section>

        <section className="content-section">
          <AvailabilitySummary players={players} />
        </section>
      </main>

      <footer className="app-footer">
        <div className="footer-inner">
          <span className="mono">&copy; {new Date().getFullYear()} NightQuest</span>
          <span className="mono footer-tagline">Designed with precision.</span>
        </div>
      </footer>
    </>
  )
}

