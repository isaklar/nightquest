import { NextRequest, NextResponse } from 'next/server'
import { getDb, initSchema } from '@/app/lib/db'

export async function GET() {
  try {
    await initSchema()
    const db = getDb()
    const result = await db.execute(`
      SELECT v.date, p.name as player_name
      FROM votes v
      JOIN players p ON v.player_id = p.id
    `)

    const votes: Record<string, string[]> = {}
    const userVotes: Record<string, string> = {}

    for (const row of result.rows) {
      const date = row.date as string
      const playerName = row.player_name as string
      if (!votes[date]) votes[date] = []
      votes[date].push(playerName)
      userVotes[playerName] = date
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
    await initSchema()
    const db = getDb()

    const playerResult = await db.execute({ sql: 'SELECT id FROM players WHERE name = ?', args: [playerName] })
    if (playerResult.rows.length === 0) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    await db.execute({
      sql: `INSERT INTO votes (player_id, date) VALUES (?, ?)
            ON CONFLICT(player_id) DO UPDATE SET date = excluded.date`,
      args: [playerResult.rows[0].id as number, date],
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error casting vote:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { playerName } = await request.json()
    await initSchema()
    const db = getDb()

    const playerResult = await db.execute({ sql: 'SELECT id FROM players WHERE name = ?', args: [playerName] })
    if (playerResult.rows.length === 0) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    await db.execute({ sql: 'DELETE FROM votes WHERE player_id = ?', args: [playerResult.rows[0].id as number] })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing vote:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
