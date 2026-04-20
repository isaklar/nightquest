import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/app/lib/db'

export const dynamic = 'force-dynamic'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toIcsDatetime(dateStr: string, time: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  return `${year}${pad(month)}${pad(day)}T${pad(hour)}${pad(minute)}00`
}

function generateUid(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let uid = ''
  for (let i = 0; i < 24; i++) {
    uid += chars[Math.floor(Math.random() * chars.length)]
  }
  return `${uid}@nightquest`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'Missing or invalid date parameter' }, { status: 400 })
    }

    const db = getDb()

    const startRow = db.prepare("SELECT value FROM app_config WHERE key = 'start_time'").get() as { value: string } | undefined
    const endRow = db.prepare("SELECT value FROM app_config WHERE key = 'end_time'").get() as { value: string } | undefined

    const startTime = startRow?.value || '19:00'
    const endTime = endRow?.value || '23:00'

    const players = db.prepare(`
      SELECT p.name FROM availability a
      JOIN players p ON a.player_id = p.id
      WHERE a.date = ?
      ORDER BY p.name
    `).all(date) as { name: string }[]

    const attendees = players.map(p => p.name).join(', ')
    const dtStart = toIcsDatetime(date, startTime)
    const dtEnd = toIcsDatetime(date, endTime)
    const now = new Date()
    const dtStamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}T${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//NightQuest//Gaming Night Planner//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${generateUid()}`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      'SUMMARY:🎮 Gaming Night',
      `DESCRIPTION:Gaming night with ${attendees}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT1H',
      'ACTION:DISPLAY',
      'DESCRIPTION:Gaming Night in 1 hour!',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    return new NextResponse(ics, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="gaming-night-${date}.ics"`,
      },
    })
  } catch (error) {
    console.error('Error generating calendar invite:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
