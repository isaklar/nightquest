'use client'

import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'

interface VotingSystemProps {
  bestDays: { date: string; availableUsers: string[] }[]
  players: { id: number; name: string }[]
}

export default function VotingSystem({ bestDays, players }: VotingSystemProps) {
  const [userVotes, setUserVotes] = useState<Record<string, string>>({})
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({})
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/votes')
      .then(res => res.json())
      .then(data => {
        setUserVotes(data.userVotes || {})
        const c: Record<string, number> = {}
        for (const date of Object.values(data.userVotes || {}) as string[]) {
          c[date] = (c[date] || 0) + 1
        }
        setVoteCounts(c)
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  const handleVote = async (date: string) => {
    if (!selectedUser) return

    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: selectedUser, date }),
      })
      if (!res.ok) throw new Error('Vote failed')

      // Update local state
      const oldDate = userVotes[selectedUser]
      const newCounts = { ...voteCounts }
      if (oldDate) newCounts[oldDate] = Math.max((newCounts[oldDate] || 1) - 1, 0)
      newCounts[date] = (newCounts[date] || 0) + 1

      setVoteCounts(newCounts)
      setUserVotes({ ...userVotes, [selectedUser]: date })
    } catch (err) {
      console.error('Error voting:', err)
    }
  }

  const handleRemoveVote = async () => {
    if (!selectedUser || !userVotes[selectedUser]) return

    try {
      const res = await fetch('/api/votes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: selectedUser }),
      })
      if (!res.ok) throw new Error('Remove vote failed')

      const oldDate = userVotes[selectedUser]
      const newCounts = { ...voteCounts }
      if (oldDate) newCounts[oldDate] = Math.max((newCounts[oldDate] || 1) - 1, 0)

      setVoteCounts(newCounts)
      const newVotes = { ...userVotes }
      delete newVotes[selectedUser]
      setUserVotes(newVotes)
    } catch (err) {
      console.error('Error removing vote:', err)
    }
  }

  if (isLoading) {
    return <div className="section-card"><p className="mono" style={{ color: 'var(--text-muted)' }}>Loading votes...</p></div>
  }

  const totalVotes = Object.keys(userVotes).length

  return (
    <div className="section-card">
      <div className="card-shine"></div>
      <div className="section-label">
        <span className="label-line"></span>
        <span className="mono">02 — Tiebreaker</span>
      </div>
      <h2 className="section-heading">Vote for <span className="gradient-text">Game Night</span></h2>
      <p className="vote-sub">Multiple days tied! Cast your vote to decide.</p>

      <div className="vote-user-select">
        <label className="mono vote-label">Who are you?</label>
        <div className="vote-user-chips">
          {players.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedUser(p.name)}
              className={`vote-chip ${selectedUser === p.name ? 'vote-chip-active' : ''}`}
            >
              {p.name}
              {userVotes[p.name] && <span className="vote-chip-dot"></span>}
            </button>
          ))}
        </div>
      </div>

      <div className="vote-options">
        {bestDays.map(option => {
          const count = voteCounts[option.date] || 0
          const isMyVote = userVotes[selectedUser] === option.date
          return (
            <div key={option.date} className={`vote-option ${isMyVote ? 'vote-option-selected' : ''}`}>
              <div className="vote-option-info">
                <span className="vote-option-day">{format(parseISO(option.date), 'EEEE')}</span>
                <span className="vote-option-date mono">{format(parseISO(option.date), 'MMM d')}</span>
                <span className="vote-option-players">{option.availableUsers.join(', ')}</span>
              </div>
              <div className="vote-option-action">
                <span className="vote-count mono">{count}</span>
                <button
                  onClick={() => handleVote(option.date)}
                  disabled={!selectedUser}
                  className={`btn ${isMyVote ? 'btn-primary' : 'btn-ghost'} vote-btn`}
                >
                  {isMyVote ? 'Voted' : 'Vote'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {selectedUser && userVotes[selectedUser] && (
        <button onClick={handleRemoveVote} className="btn btn-ghost remove-vote-btn">
          Remove my vote
        </button>
      )}

      <div className="vote-progress">
        <div className="vote-progress-bar" style={{ width: `${(totalVotes / players.length) * 100}%` }}></div>
      </div>
      <p className="mono vote-tally">{totalVotes} / {players.length} voted</p>
    </div>
  )
}
