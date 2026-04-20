'use client'

import { useState, useEffect } from 'react'
import { addDays, format, startOfWeek, isSaturday, isSunday } from 'date-fns'

interface WeekCalendarProps {
  players: { id: number; name: string }[]
}

export default function WeekCalendar({ players }: WeekCalendarProps) {
  const [weekDates, setWeekDates] = useState<Date[]>([])
  const [availability, setAvailability] = useState<Record<string, string[]>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const today = new Date()
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 })
    const dates: Date[] = []
    for (let i = 0; i < 7; i++) {
      const date = addDays(currentWeekStart, i)
      if (!isSaturday(date) && !isSunday(date)) dates.push(date)
    }
    setWeekDates(dates)

    fetch('/api/availability')
      .then(res => res.json())
      .then(data => setAvailability(data))
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  const toggleAvailability = async (date: string, playerName: string) => {
    // Optimistic update
    const updated = { ...availability }
    if (!updated[date]) updated[date] = []
    if (updated[date].includes(playerName)) {
      updated[date] = updated[date].filter(u => u !== playerName)
    } else {
      updated[date].push(playerName)
    }
    setAvailability(updated)

    try {
      const res = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName, date }),
      })
      if (res.ok) {
        const newData = await res.json()
        setAvailability(newData)
      }
      window.dispatchEvent(new Event('availabilityChanged'))
    } catch (err) {
      console.error('Error toggling availability:', err)
    }
  }

  if (isLoading) {
    return <div className="section-card"><p className="mono" style={{ color: 'var(--text-muted)' }}>Loading calendar...</p></div>
  }

  return (
    <div className="section-card">
      <div className="card-shine"></div>
      <div className="section-label">
        <span className="label-line"></span>
        <span className="mono">01 — Availability</span>
      </div>
      <h2 className="section-heading">This Week</h2>
      <div className="calendar-grid">
        {weekDates.map((date, index) => {
          const dateStr = format(date, 'yyyy-MM-dd')
          const dayAvailable = availability[dateStr] || []
          const allAvailable = dayAvailable.length === players.length && players.length > 0
          return (
            <div
              key={dateStr}
              className={`day-column ${allAvailable ? 'day-column-perfect' : ''}`}
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              <div className="day-header">
                <span className="day-name">{format(date, 'EEE')}</span>
                <span className="day-date mono">{format(date, 'MMM d')}</span>
              </div>
              <div className="day-count">
                <span className="count-number">{dayAvailable.length}</span>
                <span className="count-label">/ {players.length}</span>
              </div>
              <div className="player-buttons">
                {players.map(player => (
                  <button
                    key={player.id}
                    onClick={() => toggleAvailability(dateStr, player.name)}
                    className={`player-btn ${dayAvailable.includes(player.name) ? 'player-btn-active' : ''}`}
                  >
                    {player.name}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
