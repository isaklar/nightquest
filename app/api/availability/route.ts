import { NextRequest, NextResponse } from 'next/server'
import { getDb, initSchema } from '@/app/lib/db'
import { isFriday, startOfDay } from 'date-fns'

async function checkAndResetWeek() {
  const db = getDb()
  const today = new Date()
  if (isFriday(today)) {
    const result = await db.execute({
      sql: "SELECT value FROM app_config WHERE key = 'last_reset'",
      args: [],
    })
    const lastReset = result.rows[0]?.value ? new Date(result.rows[0].value as string) : null
    if (!lastReset || lastReset < startOfDay(today)) {
      await db.batch([
        'DELETE FROM availability',
        'DELETE FROM votes',
        { sql: "INSERT OR REPLACE INTO app_config (key, value) VALUES ('last_reset', ?)", args: [today.toISOString()] },
      ])
    }
  }
}

async function fetchAvailability() {
  const db = getDb()
  const result = await db.execute({
    sql: `SELECT a.date, p.name as player_name
          FROM availability a
          JOIN players p ON a.player_id = p.id
          ORDER BY a.date, p.name`,
    args: [],
  })

  const availability: Record<string, string[]> = {}
  for (const row of result.rows) {
    const date = row.date as string
    const playerName = row.player_name as string
    if (!availability[date]) availability[date] = []
    availability[date].push(playerName)
  }
  return availability
}

export async function GET() {
  try {
    await initSchema()
    await checkAndResetWeek()
    const availability = await fetchAvailability()
    return NextResponse.json(availability)
  } catch (error) {
    console.error('Error fetching availability:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { playerName, date } = await request.json()
    await initSchema()
    const db = getDb()

    const playerResult = await db.execute({ sql: 'SELECT id FROM players WHERE name = ?', args: [playerName] })
    if (playerResult.rows.length === 0) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }
    const playerId = playerResult.rows[0].id as number

    const existing = await db.execute({
      sql: 'SELECT id FROM availability WHERE player_id = ? AND date = ?',
      args: [playerId, date],
    })

    if (existing.rows.length > 0) {
      await db.execute({ sql: 'DELETE FROM availability WHERE id = ?', args: [existing.rows[0].id as number] })
    } else {
      await db.execute({ sql: 'INSERT INTO availability (player_id, date) VALUES (?, ?)', args: [playerId, date] })
    }

    const availability = await fetchAvailability()
    return NextResponse.json(availability)
  } catch (error) {
    console.error('Error toggling availability:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
