import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const AGENT_ROUTES = [
  '/dashboard', '/leads', '/pipeline', '/entry', '/leaderboard',
  '/analytics', '/goals', '/dials', '/deposits', '/issued', '/policies',
  '/closing', '/script', '/coaching', '/hustle', '/debt', '/calendar',
  '/action-items', '/admin', '/agents', '/settings',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isAgentRoute = AGENT_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
  if (!isAgentRoute) return NextResponse.next()

  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)).*)',
  ],
}
