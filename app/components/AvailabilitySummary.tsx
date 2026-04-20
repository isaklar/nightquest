'use client'

import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import VotingSystem from './VotingSystem'

interface AvailabilitySummaryProps {
  players: { id: number; name: string }[]
}

const calculateBestDays = (availabilityData: Record<string, string[]>) => {
  let maxAvailable = 0
  let bestDates: { date: string; availableUsers: string[] }[] = []

  for (const [date, users] of Object.entries(availabilityData)) {
    if (users.length > maxAvailable) {
      maxAvailable = users.length
      bestDates = [{ date, availableUsers: users }]
    } else if (users.length === maxAvailable && users.length > 0) {
      bestDates.push({ date, availableUsers: users })
    }
  }

  return bestDates
}

export default function AvailabilitySummary({ players }: AvailabilitySummaryProps) {
  const [bestDays, setBestDays] = useState<{ date: string; availableUsers: string[] }[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const updateBestDays = async () => {
      setIsLoading(true)
      try {
        const res = await fetch('/api/availability')
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setBestDays(calculateBestDays(data))
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    updateBestDays()
    window.addEventListener('availabilityChanged', updateBestDays)
    return () => window.removeEventListener('availabilityChanged', updateBestDays)
  }, [])

  if (isLoading) {
    return (
      <div className="section-card">
        <p className="mono" style={{ color: 'var(--text-muted)' }}>Calculating best day...</p>
      </div>
    )
  }

  if (bestDays.length === 0) {
    return (
      <div className="section-card">
        <div className="card-shine"></div>
        <div className="section-label">
          <span className="label-line"></span>
          <span className="mono">02 — Result</span>
        </div>
        <h2 className="section-heading">Game Night</h2>
        <p className="summary-empty">Select your availability above to find the best day.</p>
      </div>
    )
  }

  if (bestDays.length === 1) {
    const { date, availableUsers } = bestDays[0]
    return (
      <div className="section-card result-card">
        <div className="card-shine"></div>
        <div className="section-label">
          <span className="label-line"></span>
          <span className="mono">02 — Result</span>
        </div>
        <h2 className="section-heading">Game Night</h2>
        <div className="result-highlight">
          <span className="result-day gradient-text">{format(parseISO(date), 'EEEE')}</span>
          <span className="result-date mono">{format(parseISO(date), 'MMMM d')}</span>
        </div>
        <div className="result-players">
          {availableUsers.map(user => (
            <span key={user} className="result-player-tag">{user}</span>
          ))}
        </div>
        <div className="result-actions">
          <a
            href={`/api/calendar?date=${date}`}
            download={`gaming-night-${date}.ics`}
            className="btn btn-primary"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Add to Calendar</span>
          </a>
        </div>
      </div>
    )
  }

  return <VotingSystem bestDays={bestDays} players={players} />
}
