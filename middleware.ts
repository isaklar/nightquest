import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const allowedIps = process.env.ALLOWED_IPS?.split(',').map(ip => ip.trim()) ?? []

  if (allowedIps.length === 0) {
    return NextResponse.next()
  }

  const forwarded = request.headers.get('x-forwarded-for')
  const clientIp = forwarded?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? ''

  if (!allowedIps.includes(clientIp)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
