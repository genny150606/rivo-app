import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { verifyUserOrgAccess, isValidUUID, sanitizeString } from '@/lib/security';
import { can } from '@/lib/rbac';
import { logAuditEvent } from '@/lib/audit';

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}

/**
 * GET /api/staff/invite?token=xyz
 * Public endpoint to validate an invitation token before registration
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token || token.length < 32) {
      return NextResponse.json({ error: 'Token non valido.' }, { status: 400 });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const adminClient = getAdminClient();

    const { data: invite, error } = await adminClient
      .from('staff_invitations')
      .select('id, email, first_name, last_name, role, status, expires_at, organization_id, location_id, organizations(name), locations(name)')
      .eq('token_hash', tokenHash)
      .single();

    if (error || !invite) {
      return NextResponse.json({ error: 'Invito non trovato o scaduto.' }, { status: 404 });
    }

    if (invite.status !== 'pending') {
      return NextResponse.json({ error: `Questo invito è già stato ${invite.status === 'accepted' ? 'utilizzato' : 'revocato'}.` }, { status: 410 });
    }

    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Questo invito è scaduto. Richiedine uno nuovo al responsabile.' }, { status: 410 });
    }

    const orgName = (invite.organizations as any)?.name || 'Ristorante';
    const locName = (invite.locations as any)?.name || null;

    return NextResponse.json({
      valid: true,
      email: invite.email,
      firstName: invite.first_name,
      lastName: invite.last_name,
      role: invite.role,
      organizationName: orgName,
      locationName: locName,
    });
  } catch (err: any) {
    console.error('[API Staff Invite GET] Exception:', err);
    return NextResponse.json({ error: 'Errore interno.' }, { status: 500 });
  }
}

/**
 * POST /api/staff/invite
 * Public endpoint to accept invitation, create user credentials, and activate profile
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = sanitizeString(body.token);
    const password = body.password;
    const firstName = sanitizeString(body.firstName, 100);
    const lastName = sanitizeString(body.lastName, 100);

    if (!token || !password || password.length < 8) {
      return NextResponse.json({ error: 'Dati incompleti o password troppo breve (minimo 8 caratteri).' }, { status: 400 });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const adminClient = getAdminClient();

    // Fetch invitation
    const { data: invite, error: inviteErr } = await adminClient
      .from('staff_invitations')
      .select('id, email, first_name, last_name, role, status, expires_at, organization_id, location_id')
      .eq('token_hash', tokenHash)
      .single();

    if (inviteErr || !invite) {
      return NextResponse.json({ error: 'Invito non valido o inesistente.' }, { status: 404 });
    }

    if (invite.status !== 'pending') {
      return NextResponse.json({ error: 'Questo invito è già stato utilizzato o revocato.' }, { status: 410 });
    }

    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Questo invito è scaduto.' }, { status: 410 });
    }

    const email = invite.email.toLowerCase().trim();
    const effectiveFirstName = firstName || invite.first_name || '';
    const effectiveLastName = lastName || invite.last_name || '';

    // Check if auth user already exists for this email
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingAuthUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email);

    let authUserId: string;

    if (existingAuthUser) {
      // Update password of existing auth user
      const { data: updatedUser, error: updateAuthErr } = await adminClient.auth.admin.updateUserById(
        existingAuthUser.id,
        {
          password,
          email_confirm: true,
          user_metadata: {
            first_name: effectiveFirstName,
            last_name: effectiveLastName,
          },
        }
      );

      if (updateAuthErr || !updatedUser.user) {
        console.error('[API Invite POST] Update auth error:', updateAuthErr);
        return NextResponse.json({ error: 'Errore nell’aggiornamento dell’account.' }, { status: 500 });
      }
      authUserId = updatedUser.user.id;
    } else {
      // Create new Supabase auth user
      const { data: newAuthUser, error: createAuthErr } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: effectiveFirstName,
          last_name: effectiveLastName,
        },
      });

      if (createAuthErr || !newAuthUser.user) {
        console.error('[API Invite POST] Create auth error:', createAuthErr);
        return NextResponse.json({ error: 'Errore nella creazione dell’account: ' + (createAuthErr?.message || '') }, { status: 500 });
      }
      authUserId = newAuthUser.user.id;
    }

    // Check if profile exists
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('id')
      .eq('auth_user_id', authUserId)
      .maybeSingle();

    let profileId: string;

    if (existingProfile) {
      // Update profile
      const { data: updatedProfile, error: profUpdateErr } = await adminClient
        .from('profiles')
        .update({
          organization_id: invite.organization_id,
          location_id: invite.location_id,
          email,
          first_name: effectiveFirstName,
          last_name: effectiveLastName,
          role: invite.role,
          status: 'active',
          last_login_at: new Date().toISOString(),
        })
        .eq('id', existingProfile.id)
        .select()
        .single();

      if (profUpdateErr || !updatedProfile) {
        console.error('[API Invite POST] Profile update err:', profUpdateErr);
        return NextResponse.json({ error: 'Errore nella configurazione del profilo.' }, { status: 500 });
      }
      profileId = updatedProfile.id;
    } else {
      // Insert new profile
      const { data: newProfile, error: profInsertErr } = await adminClient
        .from('profiles')
        .insert({
          auth_user_id: authUserId,
          organization_id: invite.organization_id,
          location_id: invite.location_id,
          email,
          first_name: effectiveFirstName,
          last_name: effectiveLastName,
          role: invite.role,
          status: 'active',
          last_login_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (profInsertErr || !newProfile) {
        console.error('[API Invite POST] Profile insert err:', profInsertErr);
        return NextResponse.json({ error: 'Errore nel salvataggio del profilo: ' + (profInsertErr?.message || '') }, { status: 500 });
      }
      profileId = newProfile.id;
    }

    // Mark invitation as accepted
    await adminClient
      .from('staff_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invite.id);

    // Audit log
    await logAuditEvent({
      organizationId: invite.organization_id,
      actor: { id: profileId, email, role: invite.role },
      action: 'staff.invitation_accepted',
      entityType: 'staff_invitation',
      entityId: invite.id,
      details: { email, role: invite.role, profileId },
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    });

    return NextResponse.json({
      success: true,
      message: 'Account attivato con successo! Ora puoi effettuare il login.',
      role: invite.role,
    });
  } catch (err: any) {
    console.error('[API Staff Invite Accept] Exception:', err);
    return NextResponse.json({ error: 'Errore interno.' }, { status: 500 });
  }
}

/**
 * DELETE /api/staff/invite?id=xyz
 * Authenticated endpoint to revoke a pending invitation
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await verifyUserOrgAccess(request);
    if (!authResult.authorized) return authResult.errorResponse;

    const { profile, user } = authResult;
    if (!can(profile, 'staff.disable')) {
      return NextResponse.json({ error: 'Permesso negato: non puoi revocare inviti.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const inviteId = searchParams.get('id');

    if (!isValidUUID(inviteId)) {
      return NextResponse.json({ error: 'ID invito non valido.' }, { status: 400 });
    }

    const adminClient = getAdminClient();
    const orgId = profile.organization_id;

    const { data: invite, error: fetchErr } = await adminClient
      .from('staff_invitations')
      .select('id, email, status')
      .eq('id', inviteId)
      .eq('organization_id', orgId)
      .single();

    if (fetchErr || !invite) {
      return NextResponse.json({ error: 'Invito non trovato.' }, { status: 404 });
    }

    if (invite.status !== 'pending') {
      return NextResponse.json({ error: 'Solo gli inviti in attesa possono essere revocati.' }, { status: 400 });
    }

    const { error: updateErr } = await adminClient
      .from('staff_invitations')
      .update({ status: 'revoked' })
      .eq('id', inviteId);

    if (updateErr) {
      return NextResponse.json({ error: 'Errore nella revoca dell’invito.' }, { status: 500 });
    }

    // Audit log
    await logAuditEvent({
      organizationId: orgId,
      actor: { id: profile.id, email: profile.email || user.email, role: profile.role },
      action: 'staff.invitation_revoked',
      entityType: 'staff_invitation',
      entityId: inviteId,
      details: { email: invite.email },
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    });

    return NextResponse.json({ success: true, message: 'Invito revocato.' });
  } catch (err: any) {
    console.error('[API Staff Invite DELETE] Exception:', err);
    return NextResponse.json({ error: 'Errore interno.' }, { status: 500 });
  }
}
