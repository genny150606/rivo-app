import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { isValidUUID, sanitizeString, verifyUserOrgAccess } from '@/lib/security';
import {
  BARBER_STARTER_SERVICES,
  SALON_STARTER_SERVICES,
  STARTER_STAFF_BARBER,
  STARTER_STAFF_SALON,
  getDefaultWeeklySchedule,
  getTodayDateStr,
  hasBookingConflict,
  minutesToTime,
  timeToMinutes,
  type OccupiedBookingSlot,
  type SalonBooking,
  type SalonService,
  type SalonStaffMember,
  type WeeklySchedule,
} from '@/lib/bookings/shared';

function getAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(request: NextRequest) {
  try {
    const orgId = request.nextUrl.searchParams.get('organization_id');
    const dateParam = request.nextUrl.searchParams.get('date') || getTodayDateStr();

    if (!orgId || !isValidUUID(orgId)) {
      return NextResponse.json({ error: 'organization_id valido obbligatorio' }, { status: 400 });
    }

    const authCheck = await verifyUserOrgAccess(request, orgId);
    if (!authCheck.authorized) return authCheck.errorResponse;

    const sb = getAdminClient();

    const [{ data: org }, { data: servicesData }, { data: staffData }, { data: bookingsData }] =
      await Promise.all([
        sb.from('organizations').select('id, name, category, hub_config').eq('id', orgId).maybeSingle(),
        sb
          .from('salon_services')
          .select('*')
          .eq('organization_id', orgId)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true }),
        sb
          .from('salon_staff')
          .select('*')
          .eq('organization_id', orgId)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true }),
        sb
          .from('salon_bookings')
          .select('*')
          .eq('organization_id', orgId)
          .eq('booking_date', dateParam)
          .order('start_time', { ascending: true }),
      ]);

    const schedule: WeeklySchedule =
      (org?.hub_config as { salonSchedule?: WeeklySchedule } | null)?.salonSchedule ||
      getDefaultWeeklySchedule();

    const services = ((servicesData || []) as SalonService[]).map((s) => ({
      ...s,
      price: Number(s.price) || 0,
    }));

    const staff = ((staffData || []) as SalonStaffMember[]).map((m) => ({
      ...m,
      service_ids: Array.isArray(m.service_ids) ? m.service_ids : [],
    }));

    const bookings = ((bookingsData || []) as SalonBooking[]).map((b) => ({
      ...b,
      total_price: Number(b.total_price) || 0,
      services_snapshot: Array.isArray(b.services_snapshot) ? b.services_snapshot : [],
    }));

    return NextResponse.json({
      services,
      staff,
      bookings,
      schedule,
      orgCategory: org?.category || 'salon',
      orgName: org?.name || 'Salone',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Errore caricamento agenda';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const orgId = typeof body.organization_id === 'string' ? body.organization_id : '';
    const action = String(body.action || '');

    if (!orgId || !isValidUUID(orgId)) {
      return NextResponse.json({ error: 'organization_id non valido' }, { status: 400 });
    }

    const authCheck = await verifyUserOrgAccess(request, orgId);
    if (!authCheck.authorized) return authCheck.errorResponse;

    const sb = getAdminClient();

    // -------------------------------------------------------------------------
    // 1. Seed starter Barber / Salon template
    // -------------------------------------------------------------------------
    if (action === 'seed_template') {
      const preset = body.preset === 'barber' ? 'barber' : 'salon';
      const starterServices = preset === 'barber' ? BARBER_STARTER_SERVICES : SALON_STARTER_SERVICES;
      const starterStaff = preset === 'barber' ? STARTER_STAFF_BARBER : STARTER_STAFF_SALON;

      const { count: srvCount } = await sb
        .from('salon_services')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId);

      if (!srvCount || srvCount === 0) {
        await sb
          .from('salon_services')
          .insert(starterServices.map((s) => ({ ...s, organization_id: orgId })));
      }

      const { count: staffCount } = await sb
        .from('salon_staff')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId);

      if (!staffCount || staffCount === 0) {
        await sb.from('salon_staff').insert(
          starterStaff.map((m) => ({
            ...m,
            organization_id: orgId,
            service_ids: [],
            is_active: true,
            is_present_today: true,
          }))
        );
      }

      return NextResponse.json({ success: true });
    }

    // -------------------------------------------------------------------------
    // 2. Create manual booking from Salon Dashboard
    // -------------------------------------------------------------------------
    if (action === 'create_booking') {
      const staffId = body.staff_id;
      const customerName = sanitizeString(body.customer_name, 80);
      const customerPhone = sanitizeString(body.customer_phone, 35) || '-';
      const customerNotes = sanitizeString(body.customer_notes, 250);
      const bookingDate = sanitizeString(body.booking_date, 10);
      const startTime = sanitizeString(body.start_time, 5);
      const rawServiceIds = Array.isArray(body.service_ids) ? body.service_ids.map(String) : [];

      if (!isValidUUID(staffId) || !customerName || !bookingDate || !startTime || rawServiceIds.length === 0) {
        return NextResponse.json({ error: 'Compila tutti i campi obbligatori' }, { status: 400 });
      }

      const { data: srvRows } = await sb
        .from('salon_services')
        .select('id, name, duration_minutes, price')
        .eq('organization_id', orgId)
        .in('id', rawServiceIds);

      const chosenServices = srvRows || [];
      if (chosenServices.length === 0) {
        return NextResponse.json({ error: 'Seleziona almeno un trattamento valido' }, { status: 400 });
      }

      const totalDuration = chosenServices.reduce((a, s) => a + Number(s.duration_minutes || 30), 0);
      const totalPrice = chosenServices.reduce((a, s) => a + Number(s.price || 0), 0);
      const startMin = timeToMinutes(startTime);
      const endMin = startMin + totalDuration;
      const endTime = minutesToTime(endMin);

      const { data: existingDay } = await sb
        .from('salon_bookings')
        .select('id, staff_id, booking_date, start_time, end_time, status')
        .eq('organization_id', orgId)
        .eq('staff_id', staffId)
        .eq('booking_date', bookingDate)
        .neq('status', 'cancelled');

      if (hasBookingConflict((existingDay || []) as OccupiedBookingSlot[], staffId as string, bookingDate, startMin, endMin)) {
        return NextResponse.json(
          { error: 'Questo operatore ha già un appuntamento in sovrapposizione in questa fascia oraria' },
          { status: 409 }
        );
      }

      const { data: created, error } = await sb
        .from('salon_bookings')
        .insert({
          organization_id: orgId,
          staff_id: staffId,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_notes: customerNotes,
          service_ids: chosenServices.map((s) => s.id),
          services_snapshot: chosenServices.map((s) => ({
            id: s.id,
            name: s.name,
            duration_minutes: Number(s.duration_minutes),
            price: Number(s.price),
          })),
          booking_date: bookingDate,
          start_time: startTime,
          end_time: endTime,
          total_duration_minutes: totalDuration,
          total_price: totalPrice,
          status: 'confirmed',
          source: 'manual',
        })
        .select('*')
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ booking: created });
    }

    // -------------------------------------------------------------------------
    // 3. Update booking status
    // -------------------------------------------------------------------------
    if (action === 'update_booking_status') {
      const bookingId = body.booking_id;
      const status = String(body.status || '');
      if (!isValidUUID(bookingId) || !['confirmed', 'completed', 'cancelled', 'no_show'].includes(status)) {
        return NextResponse.json({ error: 'Stato non valido' }, { status: 400 });
      }

      const { error } = await sb
        .from('salon_bookings')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', bookingId)
        .eq('organization_id', orgId);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    // -------------------------------------------------------------------------
    // 4. Upsert / Toggle / Delete Staff Member
    // -------------------------------------------------------------------------
    if (action === 'upsert_staff') {
      const id = isValidUUID(body.id) ? (body.id as string) : undefined;
      const name = sanitizeString(body.name, 60);
      const roleTitle = sanitizeString(body.role_title, 60) || 'Hair Stylist';
      const color = sanitizeString(body.color, 16) || '#10b981';
      const serviceIds = Array.isArray(body.service_ids) ? body.service_ids.map(String) : [];
      const isPresentToday = body.is_present_today !== false;
      const isActive = body.is_active !== false;

      if (!name) {
        return NextResponse.json({ error: 'Inserisci il nome del collaboratore' }, { status: 400 });
      }

      const payload = {
        organization_id: orgId,
        name,
        role_title: roleTitle,
        color,
        service_ids: serviceIds,
        is_present_today: isPresentToday,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      };

      if (id) {
        const { error } = await sb
          .from('salon_staff')
          .update(payload)
          .eq('id', id)
          .eq('organization_id', orgId);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      } else {
        const { error } = await sb.from('salon_staff').insert(payload);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'toggle_staff_presence') {
      const staffId = body.staff_id;
      const present = body.is_present_today === true;
      if (!isValidUUID(staffId)) {
        return NextResponse.json({ error: 'Collaboratore non valido' }, { status: 400 });
      }
      const { error } = await sb
        .from('salon_staff')
        .update({ is_present_today: present, updated_at: new Date().toISOString() })
        .eq('id', staffId)
        .eq('organization_id', orgId);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (action === 'delete_staff') {
      const staffId = body.staff_id;
      if (!isValidUUID(staffId)) {
        return NextResponse.json({ error: 'Collaboratore non valido' }, { status: 400 });
      }
      const { error } = await sb
        .from('salon_staff')
        .delete()
        .eq('id', staffId)
        .eq('organization_id', orgId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    // -------------------------------------------------------------------------
    // 5. Upsert / Delete Treatment Service
    // -------------------------------------------------------------------------
    if (action === 'upsert_service') {
      const id = isValidUUID(body.id) ? (body.id as string) : undefined;
      const name = sanitizeString(body.name, 100);
      const category = sanitizeString(body.category, 30) || 'taglio';
      const description = sanitizeString(body.description, 280);
      const durationMinutes = Math.max(5, Math.min(360, Math.round(Number(body.duration_minutes) || 30)));
      const price = Math.max(0, Number(body.price) || 0);
      const isActive = body.is_active !== false;

      if (!name) {
        return NextResponse.json({ error: 'Inserisci il nome del trattamento' }, { status: 400 });
      }

      const payload = {
        organization_id: orgId,
        name,
        category,
        description,
        duration_minutes: durationMinutes,
        price,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      };

      if (id) {
        const { error } = await sb
          .from('salon_services')
          .update(payload)
          .eq('id', id)
          .eq('organization_id', orgId);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      } else {
        const { error } = await sb.from('salon_services').insert(payload);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'delete_service') {
      const serviceId = body.service_id;
      if (!isValidUUID(serviceId)) {
        return NextResponse.json({ error: 'Trattamento non valido' }, { status: 400 });
      }
      const { error } = await sb
        .from('salon_services')
        .delete()
        .eq('id', serviceId)
        .eq('organization_id', orgId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    // -------------------------------------------------------------------------
    // 6. Save Weekly Schedule into organizations.hub_config.salonSchedule
    // -------------------------------------------------------------------------
    if (action === 'save_schedule') {
      const schedule = body.schedule as WeeklySchedule | undefined;
      if (!schedule || typeof schedule !== 'object') {
        return NextResponse.json({ error: 'Orari non validi' }, { status: 400 });
      }

      const { data: org } = await sb
        .from('organizations')
        .select('hub_config')
        .eq('id', orgId)
        .maybeSingle();

      const currentHubConfig =
        org?.hub_config && typeof org.hub_config === 'object' ? (org.hub_config as Record<string, unknown>) : {};

      const { error } = await sb
        .from('organizations')
        .update({
          hub_config: {
            ...currentHubConfig,
            salonSchedule: schedule,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', orgId);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Azione non riconosciuta' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Errore interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
