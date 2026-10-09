import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyUserOrgAccess, isValidUUID } from '@/lib/security';
import { logAuditEvent } from '@/lib/audit';

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72; // bcrypt limit used by Supabase Auth

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}

async function requireSuperadmin(request: NextRequest) {
  const authResult = await verifyUserOrgAccess(request);
  if (!authResult.authorized) return { error: authResult.errorResponse } as const;
  if (authResult.profile.role !== 'admin') {
    return {
      error: NextResponse.json({ error: 'Accesso riservato ai superadmin RIVO' }, { status: 403 }),
    } as const;
  }
  return { auth: authResult } as const;
}

/**
 * GET /api/admin/organizations/[id]/users
 * Lists the accounts (profiles) that belong to this organization.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orgId } = await params;
    if (!orgId || !isValidUUID(orgId)) {
      return NextResponse.json({ error: 'ID organizzazione non valido' }, { status: 400 });
    }

    const guard = await requireSuperadmin(request);
    if ('error' in guard) return guard.error;

    const adminClient = getAdminClient();
    const { data: profiles, error } = await adminClient
      .from('profiles')
      .select('id, auth_user_id, email, first_name, last_name, role, status')
      .eq('organization_id', orgId)
      .order('role', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: profiles || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Errore interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * POST /api/admin/organizations/[id]/users
 * Sets a new password for one account of this organization.
 * Body: { profileId: string, newPassword: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orgId } = await params;
    if (!orgId || !isValidUUID(orgId)) {
      return NextResponse.json({ error: 'ID organizzazione non valido' }, { status: 400 });
    }

    const guard = await requireSuperadmin(request);
    if ('error' in guard) return guard.error;
    const { profile: actor } = guard.auth;

    const body = await request.json().catch(() => ({}));
    const { profileId, newPassword } = body as { profileId?: unknown; newPassword?: unknown };

    if (typeof profileId !== 'string' || !isValidUUID(profileId)) {
      return NextResponse.json({ error: 'Utente non valido' }, { status: 400 });
    }
    if (typeof newPassword !== 'string' || newPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `La password deve avere almeno ${MIN_PASSWORD_LENGTH} caratteri` },
        { status: 400 }
      );
    }
    if (newPassword.length > MAX_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `La password non può superare ${MAX_PASSWORD_LENGTH} caratteri` },
        { status: 400 }
      );
    }

    const adminClient = getAdminClient();

    // The target account must belong to the organization in the URL
    const { data: target, error: targetErr } = await adminClient
      .from('profiles')
      .select('id, auth_user_id, email, role, organization_id')
      .eq('id', profileId)
      .eq('organization_id', orgId)
      .maybeSingle();

    if (targetErr || !target) {
      return NextResponse.json({ error: 'Utente non trovato in questa attività' }, { status: 404 });
    }
    if (!target.auth_user_id) {
      return NextResponse.json(
        { error: 'Questo profilo non ha ancora un account di accesso attivo' },
        { status: 400 }
      );
    }
    // Other superadmin accounts are not managed from here
    if (target.role === 'admin' && target.auth_user_id !== actor.auth_user_id) {
      return NextResponse.json(
        { error: 'Non puoi cambiare la password di un altro superadmin da questo pannello' },
        { status: 403 }
      );
    }

    const { error: updateErr } = await adminClient.auth.admin.updateUserById(target.auth_user_id, {
      password: newPassword,
    });

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    await logAuditEvent({
      organizationId: orgId,
      actor: { id: actor.auth_user_id, email: actor.email, role: actor.role },
      action: 'admin.password_reset',
      entityType: 'profile',
      entityId: target.id,
      details: { target_email: target.email },
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
    });

    return NextResponse.json({ success: true, email: target.email });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Errore interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
