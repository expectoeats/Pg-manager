import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextAuthRequest } from 'next-auth';

export default auth((req: NextAuthRequest) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth?.user;

  const isAuthPage = nextUrl.pathname.startsWith('/login');
  const isDashboardPage =
    nextUrl.pathname.startsWith('/dashboard') || nextUrl.pathname === '/';

  if (isAuthPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/dashboard', nextUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn && isDashboardPage) {
    return NextResponse.redirect(new URL('/login', nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
