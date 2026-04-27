import { NextRequest, NextResponse } from 'next/server'

const FORBIDDEN_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Access Denied — NightQuest</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    :root {
      --bg: #0a0a0b;
      --bg-card: #16161a;
      --text: #ededef;
      --text-muted: #8b8b8e;
      --accent: #6c63ff;
      --accent-2: #00d4aa;
      --gradient: linear-gradient(135deg, #6c63ff, #00d4aa);
      --gradient-text: linear-gradient(135deg, #6c63ff 0%, #00d4aa 50%, #6c63ff 100%);
      --border: rgba(255, 255, 255, 0.06);
      --font: 'Inter', system-ui, -apple-system, sans-serif;
      --mono: 'JetBrains Mono', 'SF Mono', monospace;
      --ease: cubic-bezier(0.16, 1, 0.3, 1);
    }
    html { font-size: 16px; }
    body {
      font-family: var(--font);
      color: var(--text);
      background: var(--bg);
      line-height: 1.7;
      -webkit-font-smoothing: antialiased;
    }
    ::selection { background: var(--accent); color: #fff; }

    .page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      position: relative;
      overflow: hidden;
    }
    .grid-bg {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
      background-size: 60px 60px;
      mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
      -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
    }
    .container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.25rem;
      position: relative;
      z-index: 1;
      max-width: 480px;
      text-align: center;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1.25rem;
      border: 1px solid var(--border);
      border-radius: 100px;
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--text-muted);
      background: rgba(255,255,255,0.03);
      backdrop-filter: blur(10px);
    }
    .badge-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ff5050;
      animation: pulse 2s ease infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(255, 80, 80, 0.4); }
      50% { opacity: 0.8; box-shadow: 0 0 0 8px rgba(255, 80, 80, 0); }
    }
    .title {
      font-size: clamp(3rem, 8vw, 5rem);
      font-weight: 900;
      line-height: 1;
      letter-spacing: -0.04em;
    }
    .code {
      background: var(--gradient-text);
      background-size: 200% auto;
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: shimmer 3s linear infinite;
    }
    @keyframes shimmer { to { background-position: 200% center; } }
    .subtitle {
      font-size: 1.1rem;
      color: var(--text-muted);
      font-weight: 400;
      max-width: 360px;
    }
    .card {
      width: 100%;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 2rem;
      margin-top: 0.5rem;
      position: relative;
      overflow: hidden;
    }
    .card-shine {
      position: absolute;
      inset: 0;
      background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.03) 45%, transparent 50%);
      pointer-events: none;
    }
    .card-text {
      font-family: var(--mono);
      font-size: 0.8rem;
      color: var(--text-muted);
      letter-spacing: 0.05em;
      line-height: 1.8;
    }
    .card-text span { color: var(--accent); }
    .brand {
      font-family: var(--mono);
      font-size: 0.8rem;
      color: var(--text-muted);
      letter-spacing: 0.05em;
      margin-top: 0.5rem;
    }
    .brand b { color: var(--text); font-weight: 700; }
    .brand-bracket { color: var(--accent); }
  </style>
</head>
<body>
  <div class="page">
    <div class="grid-bg"></div>
    <div class="container">
      <div class="badge">
        <span class="badge-dot"></span>
        access denied
      </div>
      <h1 class="title"><span class="code">403</span></h1>
      <p class="subtitle">You don't have permission to view this page.</p>
      <div class="card">
        <div class="card-shine"></div>
        <p class="card-text">
          <span>error</span>: your IP address is not on the<br />
          allow list for this application.
        </p>
      </div>
      <p class="brand"><span class="brand-bracket">{</span><b>NQ</b><span class="brand-bracket">}</span> &mdash; NightQuest</p>
    </div>
  </div>
</body>
</html>`

export function middleware(request: NextRequest) {
  const allowedIps = process.env.ALLOWED_IPS?.split(',').map(ip => ip.trim()) ?? []

  if (allowedIps.length === 0) {
    return NextResponse.next()
  }

  const forwarded = request.headers.get('x-forwarded-for')
  const clientIp = forwarded?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? ''

  if (!allowedIps.includes(clientIp)) {
    return new NextResponse(FORBIDDEN_HTML, {
      status: 403,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
