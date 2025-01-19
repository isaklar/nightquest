'use client'

import { useState, useEffect } from 'react'
import { addDays, format, startOfWeek, isSaturday, isSunday, isMonday } from 'date-fns'
import { motion } from 'framer-motion'

const users = ['Isak', 'Emil', 'Carl', 'Mark']

export default function WeekCalendar() {
  const [weekDates, setWeekDates] = useState<Date[]>([])
  const [availability, setAvailability] = useState<{ [key: string]: string[] }>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/storage')
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`)
        }
        const data = await response.json()
        setAvailability(data.availability || {})

        const today = new Date()
        const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 })
        const dates = []
        for (let i = 0; i < 7; i++) {
          const date = addDays(currentWeekStart, i)
          if (!isSaturday(date) && !isSunday(date)) {
            dates.push(date)
          }
        }
        setWeekDates(dates)

        // Check if it's Monday and reset if necessary
        if (isMonday(today)) {
          await resetWeek()
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const resetWeek = async () => {
    try {
      const response = await fetch('/api/storage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reset: true }),
      })
      if (!response.ok) {
        throw new Error(`Failed to reset week: ${response.status} ${response.statusText}`)
      }
      setAvailability({})
    } catch (err) {
      console.error('Error resetting week:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    }
  }

  const toggleAvailability = async (date: string, user: string) => {
    const updatedAvailability = { ...availability }
    if (!updatedAvailability[date]) {
      updatedAvailability[date] = []
    }
    if (updatedAvailability[date].includes(user)) {
      updatedAvailability[date] = updatedAvailability[date].filter(u => u !== user)
    } else {
      updatedAvailability[date].push(user)
    }

    setAvailability(updatedAvailability)

    try {
      const response = await fetch('/api/storage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ availability: updatedAvailability }),
      })
      if (!response.ok) {
        throw new Error(`Failed to update availability: ${response.status} ${response.statusText}`)
      }
      window.dispatchEvent(new Event('availabilityChanged'))
    } catch (err) {
      console.error('Error updating availability:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    }
  }

  if (isLoading) {
    return <p className="text-base sm:text-lg">Loading calendar...</p>
  }

  if (error) {
    return <p className="text-base sm:text-lg text-red-500">Error: {error}</p>
  }

  return (
    <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-4 sm:p-6 shadow-lg">
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        {weekDates.map((date, index) => (
          <motion.div
            key={date.toISOString()}
            className="border border-white border-opacity-20 p-4 rounded-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div className="font-bold text-lg">{format(date, 'EEE')}</div>
            <div className="text-sm opacity-70 mb-2">{format(date, 'MMM d')}</div>
            {users.map(user => (
              <motion.button
                key={user}
                onClick={() => toggleAvailability(format(date, 'yyyy-MM-dd'), user)}
                className={`mt-1 px-3 py-1 text-sm rounded-full w-full transition-colors ${
                  availability[format(date, 'yyyy-MM-dd')]?.includes(user)
                    ? 'bg-green-500 text-white'
                    : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {user}
              </motion.button>
            ))}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
