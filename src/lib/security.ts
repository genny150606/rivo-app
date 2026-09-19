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

export interface UserProfile {
  id: string;
  auth_user_id: string;
  organization_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: string;
  status?: string | null;
  location_id?: string | null;
  permissions?: string[] | null;
}

export type AuthCheckResult =
  | { authorized: true; user: any; profile: UserProfile }
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
    .select('id, auth_user_id, organization_id, email, first_name, last_name, role, status, location_id, permissions')
    .eq('auth_user_id', user.id)
    .single();

  if (!profile) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { error: 'Profilo utente non trovato.' },
        { status: 403 }
      ),
    };
  }

  // Check if profile is active
  if (profile.status === 'deactivated') {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { error: 'Questo account collaboratore è stato disattivato.' },
        { status: 403 }
      ),
    };
  }

  if (profile.status === 'suspended') {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { error: 'Questo account collaboratore è temporaneamente sospeso.' },
        { status: 403 }
      ),
    };
  }

  if (targetOrgId) {
    const isOwnerOrStaff = profile.organization_id === targetOrgId;
    const isAdmin = profile.role === 'admin';

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
