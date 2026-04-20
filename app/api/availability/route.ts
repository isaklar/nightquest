import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/app/lib/db'
import { isMonday, startOfDay, format } from 'date-fns'

function checkAndResetWeek(db: ReturnType<typeof getDb>) {
  const today = new Date()
  if (isMonday(today)) {
    const config = db.prepare("SELECT value FROM app_config WHERE key = 'last_reset'").get() as { value: string } | undefined
    const lastReset = config?.value ? new Date(config.value) : null
    if (!lastReset || lastReset < startOfDay(today)) {
      db.prepare('DELETE FROM availability').run()
      db.prepare('DELETE FROM votes').run()
      db.prepare("INSERT OR REPLACE INTO app_config (key, value) VALUES ('last_reset', ?)").run(today.toISOString())
    }
  }
}

export async function GET() {
  try {
    const db = getDb()
    checkAndResetWeek(db)

    const rows = db.prepare(`
      SELECT a.date, p.name as player_name
      FROM availability a
      JOIN players p ON a.player_id = p.id
      ORDER BY a.date, p.name
    `).all() as { date: string; player_name: string }[]

    const availability: Record<string, string[]> = {}
    for (const row of rows) {
      if (!availability[row.date]) availability[row.date] = []
      availability[row.date].push(row.player_name)
    }

    return NextResponse.json(availability)
  } catch (error) {
    console.error('Error fetching availability:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { playerName, date } = await request.json()
    const db = getDb()

    const player = db.prepare('SELECT id FROM players WHERE name = ?').get(playerName) as { id: number } | undefined
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    const existing = db.prepare('SELECT id FROM availability WHERE player_id = ? AND date = ?').get(player.id, date) as { id: number } | undefined

    if (existing) {
      db.prepare('DELETE FROM availability WHERE id = ?').run(existing.id)
    } else {
      db.prepare('INSERT INTO availability (player_id, date) VALUES (?, ?)').run(player.id, date)
    }

    // Return updated availability
    const rows = db.prepare(`
      SELECT a.date, p.name as player_name
      FROM availability a
      JOIN players p ON a.player_id = p.id
      ORDER BY a.date, p.name
    `).all() as { date: string; player_name: string }[]

    const availability: Record<string, string[]> = {}
    for (const row of rows) {
      if (!availability[row.date]) availability[row.date] = []
      availability[row.date].push(row.player_name)
    }

    return NextResponse.json(availability)
  } catch (error) {
    console.error('Error toggling availability:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
