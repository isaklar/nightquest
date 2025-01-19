'use client'

import { useState, useEffect } from 'react'
import { format, parseISO, startOfWeek, addDays } from 'date-fns'
import { motion } from 'framer-motion'

type VotingOption = {
  date: string
  availableUsers: string[]
  votes: number
}

interface VotingSystemProps {
  bestDays: { date: string; availableUsers: string[] }[]
}

const users = ['Isak', 'Emil', 'Carl', 'Mark']

export default function VotingSystem({ bestDays }: VotingSystemProps) {
  const [votingOptions, setVotingOptions] = useState<VotingOption[]>([])
  const [userVotes, setUserVotes] = useState<Record<string, string>>({})
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchVotingData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/storage')
        if (!response.ok) {
          throw new Error(`Failed to fetch voting data: ${response.status} ${response.statusText}`)
        }
        const data = await response.json()
        if (data.votes) {
          setVotingOptions(data.votes)
        } else {
          const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
          const weekDays = Array.from({ length: 5 }, (_, i) => addDays(currentWeekStart, i))
          setVotingOptions(weekDays.map(day => ({
            date: format(day, 'yyyy-MM-dd'),
            availableUsers: [],
            votes: 0
          })))
        }
        if (data.userVotes) {
          setUserVotes(data.userVotes)
        }
      } catch (err) {
        console.error('Error fetching voting data:', err)
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchVotingData()
  }, [])

  const handleVote = async (date: string) => {
    if (!selectedUser) {
      setError('Please select a user before voting')
      return
    }

    try {
      let updatedOptions = [...votingOptions]
      let updatedUserVotes = { ...userVotes }

      // Remove previous vote if exists
      if (userVotes[selectedUser]) {
        updatedOptions = updatedOptions.map(option =>
          option.date === userVotes[selectedUser] ? { ...option, votes: option.votes - 1 } : option
        )
      }

      // Add new vote
      updatedOptions = updatedOptions.map(option =>
        option.date === date ? { ...option, votes: option.votes + 1 } : option
      )

      updatedUserVotes[selectedUser] = date

      setVotingOptions(updatedOptions)
      setUserVotes(updatedUserVotes)

      const response = await fetch('/api/storage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ votes: updatedOptions, userVotes: updatedUserVotes }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update vote: ${response.status} ${response.statusText}`)
      }
    } catch (err) {
      console.error('Error updating vote:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    }
  }

  const handleRemoveVote = async () => {
    if (!selectedUser || !userVotes[selectedUser]) {
      setError('No vote to remove for the selected user')
      return
    }

    try {
      let updatedOptions = votingOptions.map(option =>
        option.date === userVotes[selectedUser] ? { ...option, votes: option.votes - 1 } : option
      )
      let updatedUserVotes = { ...userVotes }
      delete updatedUserVotes[selectedUser]

      setVotingOptions(updatedOptions)
      setUserVotes(updatedUserVotes)

      const response = await fetch('/api/storage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ votes: updatedOptions, userVotes: updatedUserVotes }),
      })

      if (!response.ok) {
        throw new Error(`Failed to remove vote: ${response.status} ${response.statusText}`)
      }
    } catch (err) {
      console.error('Error removing vote:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    }
  }

  if (isLoading) {
    return <p className="text-base sm:text-lg">Loading voting options...</p>
  }

  if (error) {
    return <p className="text-base sm:text-lg text-red-500">Error: {error}</p>
  }

  const totalVotes = Object.keys(userVotes).length

  return (
    <motion.div
      className="mt-6 sm:mt-8 p-4 sm:p-6 bg-white bg-opacity-10 backdrop-blur-lg rounded-xl shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-xl sm:text-2xl font-semibold mb-4">Vote for Gaming Night</h2>
      <p className="text-sm sm:text-base mb-4">
        Please vote for your preferred day this week:
      </p>
      <div className="mb-4">
        <label htmlFor="user-select" className="block text-sm font-medium text-gray-300 mb-2">
          Select your name:
        </label>
        <select
          id="user-select"
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="block w-full px-3 py-2 bg-white bg-opacity-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="">Select a user</option>
          {users.map((user) => (
            <option key={user} value={user}>
              {user}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-4">
        {votingOptions.map((option) => (
          <div key={option.date} className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{format(parseISO(option.date), 'EEEE, MMMM d')}</p>
              <p className="text-sm opacity-70">Available: {option.availableUsers.join(', ')}</p>
            </div>
            <button
              onClick={() => handleVote(option.date)}
              disabled={totalVotes >= 4 && !userVotes[selectedUser]}
              className={`px-4 py-2 rounded-full ${
                totalVotes >= 4 && !userVotes[selectedUser]
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600'
              } transition-colors`}
            >
              {userVotes[selectedUser] === option.date ? 'Change Vote' : 'Vote'} ({option.votes})
            </button>
          </div>
        ))}
      </div>
      {userVotes[selectedUser] && (
        <button
          onClick={handleRemoveVote}
          className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
        >
          Remove Vote
        </button>
      )}
      <p className="mt-4 text-sm text-center">
        Total votes: {totalVotes}/4
      </p>
    </motion.div>
  )
}
