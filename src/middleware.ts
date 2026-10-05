import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Public route prefixes that bypass Supabase auth completely for maximum fluidity & 0ms overhead
const PUBLIC_PREFIXES = [
  '/t/',
  '/hub/',
  '/review/',
  '/call/',
  '/wheel/',
  '/loyalty/',
  '/ai-sommelier/',
  '/wifi/',
  '/invite/',
  '/api/',
  '/login',
  '/auth/',
  '/_next',
  '/brand/',
];

const PUBLIC_EXACT = [
  '/',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.json',
];

// Matcher for static assets (images, audio, fonts, icons, etc.)
const STATIC_ASSET_REGEX = /\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|txt|xml|mp3|wav|woff|woff2|ttf|eot)$/i;

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_EXACT.includes(pathname)) return true;
  if (STATIC_ASSET_REGEX.test(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // FAST PATH: Return immediately for public routes without calling supabase.auth.getUser()
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // PROTECTED PATH: Only initialize Supabase client and check session on protected routes (e.g. /dashboard, /admin)
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users to login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|txt|xml|mp3|wav|woff|woff2|ttf|eot)$).*)',
  ],
};
