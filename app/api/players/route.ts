import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/app/lib/db'

export async function GET() {
  try {
    const db = getDb()
    const players = db.prepare('SELECT id, name FROM players ORDER BY name').all()
    return NextResponse.json(players)
  } catch (error) {
    console.error('Error fetching players:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { names, startTime, endTime } = await request.json()
    const db = getDb()

    if (Array.isArray(names)) {
      const insert = db.prepare('INSERT OR IGNORE INTO players (name) VALUES (?)')
      const insertMany = db.transaction((playerNames: string[]) => {
        for (const name of playerNames) {
          if (name.trim()) insert.run(name.trim())
        }
      })
      insertMany(names)
    }

    if (startTime) {
      db.prepare("INSERT OR REPLACE INTO app_config (key, value) VALUES ('start_time', ?)").run(startTime)
    }
    if (endTime) {
      db.prepare("INSERT OR REPLACE INTO app_config (key, value) VALUES ('end_time', ?)").run(endTime)
    }

    const players = db.prepare('SELECT id, name FROM players ORDER BY name').all()
    return NextResponse.json(players)
  } catch (error) {
    console.error('Error adding players:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()
    const db = getDb()
    db.prepare('DELETE FROM players WHERE id = ?').run(id)
    const players = db.prepare('SELECT id, name FROM players ORDER BY name').all()
    return NextResponse.json(players)
  } catch (error) {
    console.error('Error deleting player:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
