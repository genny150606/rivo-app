import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyUserOrgAccess, isValidUUID } from '@/lib/security';
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
 * GET /api/tables/assignments
 * Returns all active table assignments, waiter assignments, and free tables
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyUserOrgAccess(request);
    if (!authResult.authorized) return authResult.errorResponse;

    const { profile } = authResult;
    if (!can(profile, 'tables.view')) {
      return NextResponse.json({ error: 'Permesso negato.' }, { status: 403 });
    }

    const adminClient = getAdminClient();
    const orgId = profile.organization_id;

    // Fetch all devices (tables) for this organization
    const { data: devices, error: devErr } = await adminClient
      .from('devices')
      .select('id, name, unique_code, location_id, is_active')
      .eq('organization_id', orgId)
      .order('name', { ascending: true });

    if (devErr) {
      console.error('[API Table Assignments GET] Devices error:', devErr);
      return NextResponse.json({ error: 'Errore nel recupero dei tavoli.' }, { status: 500 });
    }

    // Fetch active assignments with waiter details
    const { data: assignments, error: assignErr } = await adminClient
      .from('table_assignments')
      .select(`
        id,
        device_id,
        waiter_id,
        status,
        assigned_at,
        profiles (
          id,
          first_name,
          last_name,
          email,
          role
        )
      `)
      .eq('organization_id', orgId)
      .eq('status', 'active');

    if (assignErr) {
      console.error('[API Table Assignments GET] Assignments error:', assignErr);
      return NextResponse.json({ error: 'Errore nel recupero delle assegnazioni.' }, { status: 500 });
    }

    // Fetch active staff (waiters and managers) eligible for assignment
    const { data: staffList } = await adminClient
      .from('profiles')
      .select('id, first_name, last_name, email, role, status')
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .in('role', ['waiter', 'manager', 'owner', 'client']);

    return NextResponse.json({
      tables: devices || [],
      assignments: assignments || [],
      staff: staffList || [],
    });
  } catch (err: any) {
    console.error('[API Table Assignments GET] Exception:', err);
    return NextResponse.json({ error: 'Errore interno.' }, { status: 500 });
  }
}

/**
 * POST /api/tables/assignments
 * Assigns a table to a waiter (or "Prendi Tavolo" by the waiter themselves)
 * ACID safe thanks to PostgreSQL unique index idx_unique_active_table_assignment
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyUserOrgAccess(request);
    if (!authResult.authorized) return authResult.errorResponse;

    const { profile, user } = authResult;
    const body = await request.json();
    const deviceId = body.deviceId;
    let targetWaiterId = body.waiterId;

    if (!isValidUUID(deviceId)) {
      return NextResponse.json({ error: 'ID tavolo (device) non valido.' }, { status: 400 });
    }

    // If no waiterId is specified, the calling user is taking the table themselves ("Prendi Tavolo")
    if (!targetWaiterId) {
      targetWaiterId = profile.id;
    }

    if (!isValidUUID(targetWaiterId)) {
      return NextResponse.json({ error: 'ID cameriere non valido.' }, { status: 400 });
    }

    // Permissions check
    const isSelfTake = targetWaiterId === profile.id;
    if (isSelfTake) {
      if (!can(profile, 'tables.take')) {
        return NextResponse.json({ error: 'Permesso negato: non puoi prendere in carico tavoli.' }, { status: 403 });
      }
    } else {
      if (!can(profile, 'tables.assign')) {
        return NextResponse.json({ error: 'Permesso negato: solo manager e proprietari possono assegnare tavoli ad altri.' }, { status: 403 });
      }
    }

    const adminClient = getAdminClient();
    const orgId = profile.organization_id;

    // Verify target waiter exists and is active in this org
    const { data: targetWaiter, error: waiterErr } = await adminClient
      .from('profiles')
      .select('id, first_name, last_name, status, organization_id')
      .eq('id', targetWaiterId)
      .eq('organization_id', orgId)
      .single();

    if (waiterErr || !targetWaiter || targetWaiter.status !== 'active') {
      return NextResponse.json({ error: 'Collaboratore non trovato o non attivo.' }, { status: 400 });
    }

    // Check device belongs to this org
    const { data: device, error: devErr } = await adminClient
      .from('devices')
      .select('id, name')
      .eq('id', deviceId)
      .eq('organization_id', orgId)
      .single();

    if (devErr || !device) {
      return NextResponse.json({ error: 'Tavolo non trovato in questa organizzazione.' }, { status: 404 });
    }

    // If an active assignment exists:
    // If assigned by Manager/Owner, release previous assignment and reassign
    // If taken by another waiter and caller is NOT manager/owner, block with 409
    const { data: currentAssignment } = await adminClient
      .from('table_assignments')
      .select('id, waiter_id, profiles(first_name, last_name)')
      .eq('organization_id', orgId)
      .eq('device_id', deviceId)
      .eq('status', 'active')
      .maybeSingle();

    if (currentAssignment) {
      if (currentAssignment.waiter_id === targetWaiterId) {
        return NextResponse.json({ success: true, message: 'Tavolo già assegnato a questo cameriere.', assignmentId: currentAssignment.id });
      }

      // If caller is waiter taking a table that is already taken by someone else:
      if (isSelfTake && !can(profile, 'tables.assign')) {
        const assignedTo = (currentAssignment.profiles as any)?.first_name || 'un altro cameriere';
        return NextResponse.json({
          error: `Questo tavolo è già stato preso in carico da ${assignedTo}.`,
          code: 'TABLE_ALREADY_ASSIGNED',
        }, { status: 409 });
      }

      // Manager/Owner reassigning: release the old assignment
      await adminClient
        .from('table_assignments')
        .update({ status: 'released', released_at: new Date().toISOString() })
        .eq('id', currentAssignment.id);
    }

    // Insert new assignment
    const { data: newAssignment, error: insertErr } = await adminClient
      .from('table_assignments')
      .insert({
        organization_id: orgId,
        device_id: deviceId,
        waiter_id: targetWaiterId,
        assigned_by: profile.id,
        status: 'active',
        assigned_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertErr) {
      // 23505 = unique violation in Postgres (idx_unique_active_table_assignment concurrency race)
      if (insertErr.code === '23505') {
        return NextResponse.json({
          error: 'Un altro cameriere ha appena preso in carico questo tavolo!',
          code: 'CONCURRENCY_CONFLICT',
        }, { status: 409 });
      }
      console.error('[API Table Assignments POST] Insert error:', insertErr);
      return NextResponse.json({ error: 'Errore nell’assegnazione del tavolo.' }, { status: 500 });
    }

    // Audit log
    await logAuditEvent({
      organizationId: orgId,
      actor: { id: profile.id, email: profile.email || user.email, role: profile.role },
      action: isSelfTake ? 'tables.taken' : 'tables.assigned',
      entityType: 'table_assignment',
      entityId: newAssignment.id,
      details: { deviceId, tableName: device.name, waiterId: targetWaiterId, waiterName: `${targetWaiter.first_name} ${targetWaiter.last_name || ''}`.trim() },
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    });

    return NextResponse.json({
      success: true,
      assignment: newAssignment,
    });
  } catch (err: any) {
    console.error('[API Table Assignments POST] Exception:', err);
    return NextResponse.json({ error: 'Errore interno.' }, { status: 500 });
  }
}

/**
 * DELETE /api/tables/assignments
 * Releases a table assignment ("Libera Tavolo" or closing service)
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await verifyUserOrgAccess(request);
    if (!authResult.authorized) return authResult.errorResponse;

    const { profile, user } = authResult;
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');
    const deviceId = searchParams.get('deviceId');

    const adminClient = getAdminClient();
    const orgId = profile.organization_id;

    let query = adminClient
      .from('table_assignments')
      .select('id, waiter_id, device_id, devices(name)')
      .eq('organization_id', orgId)
      .eq('status', 'active');

    if (assignmentId && isValidUUID(assignmentId)) {
      query = query.eq('id', assignmentId);
    } else if (deviceId && isValidUUID(deviceId)) {
      query = query.eq('device_id', deviceId);
    } else {
      return NextResponse.json({ error: 'Fornire assignmentId o deviceId valido.' }, { status: 400 });
    }

    const { data: assignment, error: fetchErr } = await query.maybeSingle();

    if (fetchErr || !assignment) {
      return NextResponse.json({ error: 'Assegnazione attiva non trovata.' }, { status: 404 });
    }

    // Permission check: Waiter can release their own table; Manager/Owner can release any
    if (assignment.waiter_id !== profile.id && !can(profile, 'tables.assign')) {
      return NextResponse.json({ error: 'Non hai i permessi per liberare questo tavolo.' }, { status: 403 });
    }

    const { error: releaseErr } = await adminClient
      .from('table_assignments')
      .update({
        status: 'released',
        released_at: new Date().toISOString(),
      })
      .eq('id', assignment.id);

    if (releaseErr) {
      return NextResponse.json({ error: 'Errore nel rilascio del tavolo.' }, { status: 500 });
    }

    // Audit log
    await logAuditEvent({
      organizationId: orgId,
      actor: { id: profile.id, email: profile.email || user.email, role: profile.role },
      action: 'tables.released',
      entityType: 'table_assignment',
      entityId: assignment.id,
      details: { deviceId: assignment.device_id, tableName: (assignment.devices as any)?.name },
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    });

    return NextResponse.json({ success: true, message: 'Tavolo liberato con successo.' });
  } catch (err: any) {
    console.error('[API Table Assignments DELETE] Exception:', err);
    return NextResponse.json({ error: 'Errore interno.' }, { status: 500 });
  }
}
