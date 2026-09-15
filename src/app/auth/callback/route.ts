import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

function safeNextPath(value: string | null) {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/dashboard';
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const response = NextResponse.redirect(new URL(safeNextPath(requestUrl.searchParams.get('next')), request.url));

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=invalid-link', request.url));
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL('/login?error=expired-link', request.url));
  }

  return response;
}
