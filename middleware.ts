import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const VALID = new Set(['professional', 'genz', 'civic'])

export function middleware(req: NextRequest) {
  const url = new URL(req.url)
  const q = url.searchParams.get('persona')

  if (q && VALID.has(q)) {
    // Persist the choice
    const res = NextResponse.next()
    res.cookies.set('tm_persona', q, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })
    return res
  }

  return NextResponse.next()
}

// Scope to app routes (exclude _next, api, static assets)
export const config = { 
  matcher: ['/', '/((?!_next|api|static|.*\\..*).*)'] 
}
