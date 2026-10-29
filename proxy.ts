import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextAuthRequest } from 'next-auth';

// Public paths that do not require authentication
const PUBLIC_PATHS = ['/login'];

export default auth((req: NextAuthRequest) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth?.user;

  const isPublicPath = PUBLIC_PATHS.some((p) => nextUrl.pathname.startsWith(p));

  if (isPublicPath) {
    // Redirect already-authenticated users away from the login page
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/dashboard', nextUrl));
    }
    return NextResponse.next();
  }

  // Every other path is protected — redirect unauthenticated users to /login
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
