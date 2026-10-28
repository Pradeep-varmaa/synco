import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Allow public routes & static files
  const isPublicRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname === '/logo.png';

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || 'synco_default_secret_key_123456789',
  });

  if (isPublicRoute) {
    // If user is already authenticated and visits /login or /auth/signin, redirect to home page
    if (token && (pathname === '/login' || pathname.startsWith('/auth/signin'))) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }

  // 2. If NO session/token is found on ANY protected route:
  // Automatically redirect to /login with callbackUrl
  if (!token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - logo.png
     */
    '/((?!_next/static|_next/image|favicon.ico|logo.png).*)',
  ],
};
