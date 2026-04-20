'use client'

import { useState } from 'react'

interface PlayerSetupProps {
  onComplete: () => void
}

export default function PlayerSetup({ onComplete }: PlayerSetupProps) {
  const [players, setPlayers] = useState<string[]>(['', '', '', ''])
  const [startTime, setStartTime] = useState('19:00')
  const [endTime, setEndTime] = useState('23:00')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addField = () => setPlayers([...players, ''])

  const removeField = (index: number) => {
    if (players.length <= 2) return
    setPlayers(players.filter((_, i) => i !== index))
  }

  const updateField = (index: number, value: string) => {
    const updated = [...players]
    updated[index] = value
    setPlayers(updated)
  }

  const handleSubmit = async () => {
    const validNames = players.map(p => p.trim()).filter(Boolean)
    if (validNames.length < 2) {
      setError('Add at least 2 players')
      return
    }

    const uniqueNames = Array.from(new Set(validNames))
    if (uniqueNames.length !== validNames.length) {
      setError('Player names must be unique')
      return
    }

    if (startTime >= endTime) {
      setError('End time must be after start time')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ names: uniqueNames, startTime, endTime }),
      })
      if (!res.ok) throw new Error('Failed to save players')
      onComplete()
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="setup-overlay">
      <div className="setup-grid-bg"></div>
      <div className="setup-container">
        <div className="setup-badge">
          <span className="pulse-dot"></span>
          First time setup
        </div>
        <h1 className="setup-title">
          <span className="reveal-line"><span>Add Your</span></span>
          <span className="reveal-line"><span className="gradient-text">Players</span></span>
        </h1>
        <p className="setup-sub">Who&apos;s joining gaming night?</p>

        <div className="setup-card">
          <div className="card-shine"></div>
          <div className="setup-fields">
            {players.map((name, i) => (
              <div key={i} className="setup-field-row">
                <span className="field-num mono">{String(i + 1).padStart(2, '0')}</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => updateField(i, e.target.value)}
                  placeholder={`Player ${i + 1}`}
                  className="setup-input"
                  maxLength={20}
                />
                {players.length > 2 && (
                  <button
                    onClick={() => removeField(i)}
                    className="field-remove"
                    aria-label="Remove player"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          <button onClick={addField} className="btn btn-ghost add-player-btn">
            + Add another player
          </button>

          <div className="setup-time-section">
            <span className="mono setup-time-label">Gaming time (24h)</span>
            <div className="setup-time-row">
              <div className="setup-time-field">
                <label className="mono field-num">FROM</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="setup-input setup-time-input"
                />
              </div>
              <span className="setup-time-separator">→</span>
              <div className="setup-time-field">
                <label className="mono field-num">TO</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="setup-input setup-time-input"
                />
              </div>
            </div>
          </div>

          {error && <p className="setup-error">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn btn-primary setup-submit"
          >
            <span>{isSubmitting ? 'Saving...' : 'Start Planning'}</span>
            {!isSubmitting && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
