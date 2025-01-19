'use client'

import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { motion } from 'framer-motion'
import VotingSystem from './VotingSystem'

const calculateBestDays = (availabilityData: { [key: string]: string[] }) => {
  let maxAvailable = 0
  let bestDates: { date: string; availableUsers: string[] }[] = []

  for (const [date, users] of Object.entries(availabilityData)) {
    const availableUsers = users as string[]
    if (availableUsers.length > maxAvailable) {
      maxAvailable = availableUsers.length
      bestDates = [{ date, availableUsers }]
    } else if (availableUsers.length === maxAvailable && availableUsers.length > 0) {
      bestDates.push({ date, availableUsers })
    }
  }

  return bestDates
}

export default function AvailabilitySummary() {
  const [bestDays, setBestDays] = useState<{ date: string; availableUsers: string[] }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const updateBestDays = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/storage')
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`)
        }
        const data = await response.json()
        if (!data || typeof data !== 'object') {
          throw new Error(`Invalid data received: ${JSON.stringify(data)}`)
        }
        const availabilityData = data.availability || {}
        const bestDates = calculateBestDays(availabilityData)
        setBestDays(bestDates)

        if (bestDates.length > 1) {
          const votingOptions = bestDates.map(day => ({ ...day, votes: 0 }))
          const voteResponse = await fetch('/api/storage', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ votes: votingOptions }),
          })
          if (!voteResponse.ok) {
            throw new Error(`Failed to update voting options: ${voteResponse.status} ${voteResponse.statusText}`)
          }
          window.dispatchEvent(new Event('votingOptionsChanged'))
        } else {
          const clearResponse = await fetch('/api/storage', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ votes: null, userVoted: null }),
          })
          if (!clearResponse.ok) {
            throw new Error(`Failed to clear voting options: ${clearResponse.status} ${clearResponse.statusText}`)
          }
        }
      } catch (err) {
        console.error('Error updating best days:', err)
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    updateBestDays()
    window.addEventListener('availabilityChanged', updateBestDays)

    return () => {
      window.removeEventListener('availabilityChanged', updateBestDays)
    }
  }, [])

  if (isLoading) {
    return (
      <motion.div
        className="mt-6 sm:mt-8 p-4 sm:p-6 bg-white bg-opacity-10 backdrop-blur-lg rounded-xl shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-base sm:text-lg">Loading...</p>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div
        className="mt-6 sm:mt-8 p-4 sm:p-6 bg-white bg-opacity-10 backdrop-blur-lg rounded-xl shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-base sm:text-lg text-red-500">Error: {error}</p>
      </motion.div>
    )
  }

  if (bestDays.length === 0) {
    return (
      <motion.div
        className="mt-6 sm:mt-8 p-4 sm:p-6 bg-white bg-opacity-10 backdrop-blur-lg rounded-xl shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-base sm:text-lg">No suggested game night yet. Please select your availability.</p>
      </motion.div>
    )
  }

  if (bestDays.length === 1) {
    const { date, availableUsers } = bestDays[0]
    return (
      <motion.div
        className="mt-6 sm:mt-8 p-4 sm:p-6 bg-white bg-opacity-10 backdrop-blur-lg rounded-xl shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-xl sm:text-2xl font-semibold mb-4">Suggested Gaming Night</h2>
        <p className="text-base sm:text-lg mb-2">
          The best day for gaming night is{' '}
          <span className="font-bold text-yellow-300">
            {format(parseISO(date), 'EEEE, MMMM d')}
          </span>
        </p>
        <p className="text-sm sm:text-base">
          Available players: {availableUsers.join(', ')}
        </p>
      </motion.div>
    )
  }

  return <VotingSystem bestDays={bestDays} />
}
