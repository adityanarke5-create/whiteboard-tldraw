import { NextResponse } from 'next/server'

export function middleware(request) {
  const { pathname } = request.nextUrl

  // Public routes that don't require auth
  const publicRoutes = ['/', '/signin', '/signup']
  
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Protected routes - redirect to signin if no auth
  // Note: Client-side auth check happens in components
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
