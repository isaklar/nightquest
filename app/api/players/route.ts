import { NextRequest, NextResponse } from 'next/server'
import { getDb, initSchema } from '@/app/lib/db'

export async function GET() {
  try {
    await initSchema()
    const db = getDb()
    const result = await db.execute('SELECT id, name FROM players ORDER BY name')
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error fetching players:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { names, startTime, endTime } = await request.json()
    await initSchema()
    const db = getDb()

    if (Array.isArray(names)) {
      const statements = names
        .map((name: string) => name.trim())
        .filter(Boolean)
        .map((name: string) => ({
          sql: 'INSERT OR IGNORE INTO players (name) VALUES (?)',
          args: [name],
        }))
      if (statements.length > 0) {
        await db.batch(statements)
      }
    }

    if (startTime) {
      await db.execute({ sql: "INSERT OR REPLACE INTO app_config (key, value) VALUES ('start_time', ?)", args: [startTime] })
    }
    if (endTime) {
      await db.execute({ sql: "INSERT OR REPLACE INTO app_config (key, value) VALUES ('end_time', ?)", args: [endTime] })
    }

    const result = await db.execute('SELECT id, name FROM players ORDER BY name')
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error adding players:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()
    await initSchema()
    const db = getDb()
    await db.execute({ sql: 'DELETE FROM players WHERE id = ?', args: [id] })
    const result = await db.execute('SELECT id, name FROM players ORDER BY name')
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error deleting player:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
