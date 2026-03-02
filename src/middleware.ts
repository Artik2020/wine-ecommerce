import { NextResponse } from 'next/server'

// Simplified middleware - just allow all routes for now
export async function middleware(request: Request) {
  const { pathname } = new URL(request.url)
  
  // Allow all routes - we'll handle auth in the components
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
}
