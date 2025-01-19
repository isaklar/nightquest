'use client'

import WeekCalendar from './components/WeekCalendar'
import AvailabilitySummary from './components/AvailabilitySummary'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 text-white p-4 sm:p-8 flex items-center justify-center">
      <div className="w-full max-w-5xl">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8 text-center">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-pink-500">
            Gaming Night Planner
          </span>
        </h1>
        <WeekCalendar />
        <AvailabilitySummary />
      </div>
    </main>
  )
}

