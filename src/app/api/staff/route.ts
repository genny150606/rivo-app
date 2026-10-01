import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { verifyUserOrgAccess, isValidUUID, sanitizeString, UserProfile } from '@/lib/security';
import { can, normalizeRole, StaffRole } from '@/lib/rbac';
import { logAuditEvent } from '@/lib/audit';
import { sendStaffInvitationEmail } from '@/lib/email/invitation-email';

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}

/**
 * Helper to resolve the active organization ID:
 * - If user has profile.organization_id, that is primary.
 * - If user is admin (profile.role === 'admin'):
 *     - If an organization_id was passed explicitly and is valid UUID, use that.
 *     - Otherwise, fallback to the first active organization.
 */
async function resolveOrganizationId(
  profile: UserProfile,
  explicitOrgId?: string | null
): Promise<string | null> {
  const adminClient = getAdminClient();
  const isAdmin = profile.role === 'admin';

  if (isAdmin) {
    if (explicitOrgId && isValidUUID(explicitOrgId)) {
      return explicitOrgId;
    }
    if (profile.organization_id) {
      return profile.organization_id;
    }
    // Fallback to first organization in database
    const { data: firstOrg } = await adminClient
      .from('organizations')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    return firstOrg?.id || null;
  }

  return profile.organization_id || null;
}

/**
 * GET /api/staff
 * Returns staff members for the authorized organization, including active table assignments
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyUserOrgAccess(request);
    if (!authResult.authorized) return authResult.errorResponse;

    const { profile } = authResult;
    if (!can(profile, 'staff.view')) {
      return NextResponse.json({ error: 'Permesso negato.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const requestedOrgId = searchParams.get('organization_id') || searchParams.get('organizationId');

    const orgId = await resolveOrganizationId(profile, requestedOrgId);
    if (!orgId) {
      return NextResponse.json({ error: 'Nessuna organizzazione trovata o selezionata.' }, { status: 400 });
    }

    const adminClient = getAdminClient();

    // Fetch staff profiles
    const { data: staffMembers, error: staffError } = await adminClient
      .from('profiles')
      .select('id, auth_user_id, email, first_name, last_name, role, status, location_id, permissions, last_login_at, created_at')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (staffError) {
      console.error('[API Staff GET] Error:', staffError);
      return NextResponse.json({ error: 'Errore nel recupero dello staff.' }, { status: 500 });
    }

    // Fetch pending invitations
    const { data: pendingInvitations, error: invError } = await adminClient
      .from('staff_invitations')
      .select('id, email, first_name, last_name, role, location_id, status, created_at, expires_at')
      .eq('organization_id', orgId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (invError) {
      console.error('[API Staff GET Invites] Error:', invError);
    }

    // Fetch active table assignments
    const { data: assignments } = await adminClient
      .from('table_assignments')
      .select('id, waiter_id, device_id, assigned_at, devices(id, name, unique_code)')
      .eq('organization_id', orgId)
      .eq('status', 'active');

    // Fetch organization locations for mapping
    const { data: locations } = await adminClient
      .from('locations')
      .select('id, name')
      .eq('organization_id', orgId);

    return NextResponse.json({
      organization_id: orgId,
      staff: staffMembers || [],
      invitations: pendingInvitations || [],
      assignments: assignments || [],
      locations: locations || [],
    });
  } catch (err: any) {
    console.error('[API Staff GET] Exception:', err);
    return NextResponse.json({ error: 'Errore interno.' }, { status: 500 });
  }
}

/**
 * POST /api/staff
 * Invites a new collaborator (generates secure token, writes invitation, sends email)
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyUserOrgAccess(request);
    if (!authResult.authorized) return authResult.errorResponse;

    const { profile, user } = authResult;
    if (!can(profile, 'staff.create')) {
      return NextResponse.json({ error: 'Permesso negato: non puoi invitare collaboratori.' }, { status: 403 });
    }

    const body = await request.json();
    const email = sanitizeString(body.email)?.toLowerCase();
    const firstName = sanitizeString(body.firstName, 100);
    const lastName = sanitizeString(body.lastName, 100);
    const role = (body.role as StaffRole) || 'waiter';
    const locationId = body.locationId && isValidUUID(body.locationId) ? body.locationId : null;
    const requestedOrgId = body.organizationId || body.organization_id;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email non valida.' }, { status: 400 });
    }

    if (!['owner', 'manager', 'waiter'].includes(role)) {
      return NextResponse.json({ error: 'Ruolo non valido.' }, { status: 400 });
    }

    // Only owner/admin can invite another owner or manager
    const normalizedUserRole = normalizeRole(profile.role);
    if (normalizedUserRole !== 'owner' && normalizedUserRole !== 'admin') {
      if (role === 'owner' || role === 'manager') {
        return NextResponse.json({ error: 'Solo i proprietari possono invitare manager o proprietari.' }, { status: 403 });
      }
    }

    const orgId = await resolveOrganizationId(profile, requestedOrgId);
    if (!orgId) {
      return NextResponse.json({ error: 'Nessuna organizzazione selezionata.' }, { status: 400 });
    }

    const adminClient = getAdminClient();

    // Check if user with this email already exists in profiles for this org
    const { data: existingStaff } = await adminClient
      .from('profiles')
      .select('id, status, role')
      .eq('organization_id', orgId)
      .eq('email', email)
      .maybeSingle();

    if (existingStaff && existingStaff.status !== 'deactivated') {
      return NextResponse.json({ error: 'Un collaboratore con questa email è già presente nel team.' }, { status: 400 });
    }

    // Fetch org details for email
    const { data: org } = await adminClient
      .from('organizations')
      .select('name')
      .eq('id', orgId)
      .single();

    const businessName = org?.name || 'Ristorante';

    // Invalidate previous pending invitations for this email in this org
    await adminClient
      .from('staff_invitations')
      .update({ status: 'revoked' })
      .eq('organization_id', orgId)
      .eq('email', email)
      .eq('status', 'pending');

    // Generate secure single-use token (32 bytes = 64 hex chars)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    const { data: invitation, error: invError } = await adminClient
      .from('staff_invitations')
      .insert({
        organization_id: orgId,
        location_id: locationId,
        email,
        first_name: firstName,
        last_name: lastName,
        role,
        token_hash: tokenHash,
        status: 'pending',
        invited_by_user_id: user.id,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (invError || !invitation) {
      console.error('[API Staff Invite] Insert Error:', invError);
      return NextResponse.json({ 
        error: 'Errore durante la creazione dell’invito: ' + (invError?.message || 'Database error') 
      }, { status: 500 });
    }

    // Build invite URL
    const origin = request.nextUrl.origin;
    const inviteUrl = `${origin}/invite/${rawToken}`;

    // Role display name
    const roleLabels: Record<string, string> = {
      owner: 'Proprietario',
      manager: 'Manager di Sala',
      waiter: 'Cameriere',
    };

    // Send invitation email
    const emailResult = await sendStaffInvitationEmail({
      appUrl: origin,
      businessName,
      inviteeEmail: email,
      inviteeFirstName: firstName || 'Collaboratore',
      roleName: roleLabels[role] || role,
      inviteUrl,
      expiresInDays: 7,
    });

    // Audit log
    await logAuditEvent({
      organizationId: orgId,
      actor: { id: profile.id, email: profile.email || user.email, role: profile.role },
      action: 'staff.invited',
      entityType: 'staff_invitation',
      entityId: invitation.id,
      details: { email, role, firstName, lastName, locationId, emailSent: emailResult.sent },
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    });

    return NextResponse.json({
      success: true,
      invitationId: invitation.id,
      inviteUrl,
      emailSent: emailResult.sent,
    });
  } catch (err: any) {
    console.error('[API Staff Invite] Exception:', err);
    return NextResponse.json({ error: 'Errore interno.' }, { status: 500 });
  }
}

/**
 * PATCH /api/staff
 * Updates staff member (status change: active, suspended, deactivated; or role / location update)
 */
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await verifyUserOrgAccess(request);
    if (!authResult.authorized) return authResult.errorResponse;

    const { profile, user } = authResult;
    const body = await request.json();
    const staffId = body.staffId;
    const newStatus = body.status;
    const newRole = body.role;
    const newLocationId = body.locationId !== undefined ? body.locationId : undefined;
    const requestedOrgId = body.organizationId || body.organization_id;

    if (!isValidUUID(staffId)) {
      return NextResponse.json({ error: 'ID collaboratore non valido.' }, { status: 400 });
    }

    const orgId = await resolveOrganizationId(profile, requestedOrgId);
    if (!orgId) {
      return NextResponse.json({ error: 'Nessuna organizzazione selezionata.' }, { status: 400 });
    }

    const adminClient = getAdminClient();

    // Fetch target staff
    const { data: targetStaff, error: fetchErr } = await adminClient
      .from('profiles')
      .select('id, auth_user_id, organization_id, email, first_name, last_name, role, status')
      .eq('id', staffId)
      .eq('organization_id', orgId)
      .single();

    if (fetchErr || !targetStaff) {
      return NextResponse.json({ error: 'Collaboratore non trovato.' }, { status: 404 });
    }

    // Safety: prevent self-deactivation or self-suspension
    if (targetStaff.id === profile.id && (newStatus === 'deactivated' || newStatus === 'suspended')) {
      return NextResponse.json({ error: 'Non puoi sospendere o disattivare il tuo stesso account.' }, { status: 400 });
    }

    // Authorization checks
    if (newStatus && !can(profile, 'staff.disable')) {
      return NextResponse.json({ error: 'Permesso negato: non puoi modificare lo stato dei collaboratori.' }, { status: 403 });
    }

    if (newRole && !can(profile, 'staff.update')) {
      return NextResponse.json({ error: 'Permesso negato: non puoi modificare il ruolo dei collaboratori.' }, { status: 403 });
    }

    const updates: Record<string, unknown> = {};
    if (newStatus && ['active', 'suspended', 'deactivated'].includes(newStatus)) {
      updates.status = newStatus;
    }
    if (newRole && ['owner', 'manager', 'waiter'].includes(newRole)) {
      // Only owner/admin can promote to owner/manager
      const normalizedUserRole = normalizeRole(profile.role);
      if (normalizedUserRole !== 'owner' && normalizedUserRole !== 'admin') {
        return NextResponse.json({ error: 'Solo i proprietari possono modificare i ruoli di gestione.' }, { status: 403 });
      }
      updates.role = newRole;
    }
    if (newLocationId !== undefined) {
      updates.location_id = newLocationId && isValidUUID(newLocationId) ? newLocationId : null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nessuna modifica fornita.' }, { status: 400 });
    }

    const { data: updated, error: updateErr } = await adminClient
      .from('profiles')
      .update(updates)
      .eq('id', staffId)
      .select()
      .single();

    if (updateErr) {
      console.error('[API Staff PATCH] Error:', updateErr);
      return NextResponse.json({ error: 'Errore nell’aggiornamento del collaboratore.' }, { status: 500 });
    }

    // If deactivated or suspended, release all their active table assignments
    if (newStatus === 'deactivated' || newStatus === 'suspended') {
      await adminClient
        .from('table_assignments')
        .update({ status: 'released', released_at: new Date().toISOString() })
        .eq('waiter_id', staffId)
        .eq('status', 'active');
    }

    // Audit log
    await logAuditEvent({
      organizationId: orgId,
      actor: { id: profile.id, email: profile.email || user.email, role: profile.role },
      action: newStatus === 'deactivated' ? 'staff.deactivated' : (newStatus === 'suspended' ? 'staff.suspended' : 'staff.updated'),
      entityType: 'profile',
      entityId: staffId,
      details: { previous: { status: targetStaff.status, role: targetStaff.role }, updates },
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    });

    return NextResponse.json({ success: true, staff: updated });
  } catch (err: any) {
    console.error('[API Staff PATCH] Exception:', err);
    return NextResponse.json({ error: 'Errore interno.' }, { status: 500 });
  }
}
