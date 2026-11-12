import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type AdminAuthResult =
  | {
      authorized: true;
      user: { id: string; email?: string };
      profile: { id: string; auth_user_id: string; role: string; email: string | null };
      adminDb: SupabaseClient;
    }
  | {
      authorized: false;
      errorResponse: NextResponse;
    };

/**
 * Verifies that the incoming HTTP request belongs to an authenticated RIVO Superadmin
 * (`profiles.role === 'admin'`). Owners, staff members, and unauthenticated callers
 * are strictly rejected with 401/403.
 */
export async function verifySuperAdminAccess(request: NextRequest): Promise<AdminAuthResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

  const sessionClient = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: () => {},
    },
  });

  const {
    data: { user },
    error: userError,
  } = await sessionClient.auth.getUser();

  if (userError || !user) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { error: 'Sessione non valida o assente. Effettua l’accesso come amministratore RIVO.' },
        { status: 401 }
      ),
    };
  }

  const { data: profile, error: profileError } = await sessionClient
    .from('profiles')
    .select('id, auth_user_id, role, email')
    .eq('auth_user_id', user.id)
    .single();

  if (profileError || !profile || profile.role !== 'admin') {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { error: 'Accesso negato: RIVO OUTREACH è riservato esclusivamente ai Superadmin RIVO.' },
        { status: 403 }
      ),
    };
  }

  const adminDb = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return {
    authorized: true,
    user: { id: user.id, email: user.email },
    profile,
    adminDb,
  };
}
