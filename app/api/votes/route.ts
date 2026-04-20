import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/app/lib/db'

export async function GET() {
  try {
    const db = getDb()
    const rows = db.prepare(`
      SELECT v.date, p.name as player_name
      FROM votes v
      JOIN players p ON v.player_id = p.id
    `).all() as { date: string; player_name: string }[]

    const votes: Record<string, string[]> = {}
    const userVotes: Record<string, string> = {}

    for (const row of rows) {
      if (!votes[row.date]) votes[row.date] = []
      votes[row.date].push(row.player_name)
      userVotes[row.player_name] = row.date
    }

    return NextResponse.json({ votes, userVotes })
  } catch (error) {
    console.error('Error fetching votes:', error)
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

    // Upsert vote (replace if already voted)
    db.prepare(`
      INSERT INTO votes (player_id, date) VALUES (?, ?)
      ON CONFLICT(player_id) DO UPDATE SET date = excluded.date
    `).run(player.id, date)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error casting vote:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { playerName } = await request.json()
    const db = getDb()

    const player = db.prepare('SELECT id FROM players WHERE name = ?').get(playerName) as { id: number } | undefined
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    db.prepare('DELETE FROM votes WHERE player_id = ?').run(player.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing vote:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
