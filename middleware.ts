import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

// Legacy NextAuth imports (commented out for migration)
// import { getToken } from 'next-auth/jwt';
// import { guestRegex, isDevelopmentEnvironment } from '@/lib/constants';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith('/ping')) {
    return new Response('pong', { status: 200 });
  }

  // Skip auth check for Supabase Auth API routes
  if (pathname.startsWith('/api/auth') || pathname.startsWith('/auth/')) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // 사용자 세션 확인
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // 인증이 필요한 보호된 경로들
  const protectedPaths = ['/', '/chat'];
  const isProtectedPath = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  // 사용자가 없고 보호된 경로에 접근하려는 경우
  if (!user && isProtectedPath) {
    const redirectUrl = encodeURIComponent(request.url);
    return NextResponse.redirect(
      new URL(`/api/auth/guest?redirectUrl=${redirectUrl}`, request.url),
    );
  }

  // 인증된 사용자(게스트 포함)가 auth 페이지에 접근하는 경우 차단
  if (user) {
    const authPages = ['/login', '/register'];
    if (authPages.includes(pathname)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/',
    '/chat/:path*',
    '/api/:path*',
    '/login',
    '/register',
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
