import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUUID(id: unknown): boolean {
  if (typeof id !== 'string') return false;
  return UUID_REGEX.test(id.trim());
}

export function sanitizeString(val: unknown, maxLength = 255): string | null {
  if (val === null || val === undefined) return null;
  const str = String(val).trim();
  if (!str) return null;
  return str.slice(0, maxLength);
}

export type AuthCheckResult =
  | { authorized: true; user: unknown; profile: unknown }
  | { authorized: false; errorResponse: NextResponse };

export async function verifyUserOrgAccess(
  request: NextRequest,
  targetOrgId?: string | null
): Promise<AuthCheckResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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
        { error: 'Sessione non valida o scaduta. Effettua il login.' },
        { status: 401 }
      ),
    };
  }

  const { data: profile } = await sessionClient
    .from('profiles')
    .select('organization_id, role')
    .eq('auth_user_id', user.id)
    .single();

  if (targetOrgId) {
    const isOwnerOrStaff = profile?.organization_id === targetOrgId;
    const isAdmin = profile?.role === 'admin';

    if (!isOwnerOrStaff && !isAdmin) {
      return {
        authorized: false,
        errorResponse: NextResponse.json(
          { error: 'Non hai i permessi per accedere a questa organizzazione.' },
          { status: 403 }
        ),
      };
    }
  }

  return {
    authorized: true,
    user,
    profile,
  };
}
