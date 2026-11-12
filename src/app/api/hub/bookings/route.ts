import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createHash, randomBytes } from 'node:crypto';
import { isValidUUID, sanitizeString } from '@/lib/security';
import {
  BARBER_STARTER_SERVICES,
  SALON_STARTER_SERVICES,
  STARTER_STAFF_BARBER,
  STARTER_STAFF_SALON,
  computeAvailableSlotsForDate,
  formatEuroPrice,
  getDefaultWeeklySchedule,
  getTodayDateStr,
  hasBookingConflict,
  minutesToTime,
  timeToMinutes,
  type OccupiedBookingSlot,
  type SalonService,
  type SalonStaffMember,
  type WeeklySchedule,
} from '@/lib/bookings/shared';

function getAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

async function ensureStarterDataIfEmpty(
  sb: SupabaseClient,
  orgId: string,
  category: string | null
): Promise<{ services: SalonService[]; staff: SalonStaffMember[] }> {
  const [{ data: existingServices }, { data: existingStaff }] = await Promise.all([
    sb
      .from('salon_services')
      .select('id, organization_id, name, category, description, duration_minutes, price, is_active, sort_order')
      .eq('organization_id', orgId)
      .order('sort_order', { ascending: true }),
    sb
      .from('salon_staff')
      .select('id, organization_id, name, role_title, color, service_ids, working_hours, is_active, is_present_today, sort_order')
      .eq('organization_id', orgId)
      .order('sort_order', { ascending: true }),
  ]);

  let services = (existingServices || []) as SalonService[];
  let staff = (existingStaff || []) as SalonStaffMember[];

  const isBarber = category === 'barber';

  if (services.length === 0) {
    const starterServices = isBarber ? BARBER_STARTER_SERVICES : SALON_STARTER_SERVICES;
    const { data: insertedServices } = await sb
      .from('salon_services')
      .insert(starterServices.map((s) => ({ ...s, organization_id: orgId })))
      .select('id, organization_id, name, category, description, duration_minutes, price, is_active, sort_order');

    if (insertedServices && insertedServices.length > 0) {
      services = insertedServices as SalonService[];
    } else {
      // Fallback in-memory if migration not yet applied
      services = starterServices.map((s, idx) => ({
        ...s,
        id: `starter-srv-${idx + 1}`,
        organization_id: orgId,
      }));
    }
  }

  if (staff.length === 0) {
    const starterStaff = isBarber ? STARTER_STAFF_BARBER : STARTER_STAFF_SALON;
    const { data: insertedStaff } = await sb
      .from('salon_staff')
      .insert(
        starterStaff.map((m) => ({
          ...m,
          organization_id: orgId,
          service_ids: [],
          is_active: true,
          is_present_today: true,
        }))
      )
      .select('id, organization_id, name, role_title, color, service_ids, working_hours, is_active, is_present_today, sort_order');

    if (insertedStaff && insertedStaff.length > 0) {
      staff = insertedStaff as SalonStaffMember[];
    } else {
      staff = starterStaff.map((m, idx) => ({
        ...m,
        id: `starter-staff-${idx + 1}`,
        organization_id: orgId,
        service_ids: [],
        working_hours: null,
        is_active: true,
        is_present_today: true,
      }));
    }
  }

  return {
    services: services.map((s) => ({ ...s, price: Number(s.price) || 0 })),
    staff: staff.map((m) => ({
      ...m,
      service_ids: Array.isArray(m.service_ids) ? m.service_ids : [],
    })),
  };
}

async function notifyTelegramBooking(
  sb: SupabaseClient,
  orgId: string,
  info: {
    customerName: string;
    customerPhone: string;
    staffName: string;
    dateStr: string;
    startTime: string;
    endTime: string;
    servicesText: string;
    totalPrice: number;
    notes?: string | null;
  }
) {
  try {
    const { data: org } = await sb
      .from('organizations')
      .select('name, telegram_bot_token, telegram_chat_id, telegram_alerts_enabled')
      .eq('id', orgId)
      .single();

    if (!org || !org.telegram_alerts_enabled || !org.telegram_bot_token || !org.telegram_chat_id) {
      return;
    }

    const msg =
      `✂️ [NUOVA PRENOTAZIONE APPUNTAMENTO]\n\n` +
      `• Salone: ${org.name}\n` +
      `• Cliente: ${info.customerName} (${info.customerPhone})\n` +
      `• Operatore: ${info.staffName}\n` +
      `• Data e Ora: ${info.dateStr} dalle ${info.startTime} alle ${info.endTime}\n` +
      `• Trattamenti: ${info.servicesText}\n` +
      `• Totale stimato: ${formatEuroPrice(info.totalPrice)}\n` +
      (info.notes ? `• Note: ${info.notes}\n` : '');

    await fetch(`https://api.telegram.org/bot${org.telegram_bot_token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: org.telegram_chat_id,
        text: msg,
      }),
    });
  } catch (err) {
    console.warn('[Bookings] Telegram notify error:', err);
  }
}

export async function GET(request: NextRequest) {
  try {
    const orgId = request.nextUrl.searchParams.get('organization_id');
    if (!orgId || !isValidUUID(orgId)) {
      return NextResponse.json({ error: 'ID organizzazione non valido' }, { status: 400 });
    }

    const sb = getAdminClient();
    const { data: org } = await sb
      .from('organizations')
      .select('id, name, category, hub_config')
      .eq('id', orgId)
      .maybeSingle();

    if (!org) {
      return NextResponse.json({ error: 'Attività non trovata' }, { status: 404 });
    }

    const schedule: WeeklySchedule =
      (org.hub_config as { salonSchedule?: WeeklySchedule } | null)?.salonSchedule ||
      getDefaultWeeklySchedule();

    const { services, staff } = await ensureStarterDataIfEmpty(sb, orgId, org.category);

    const todayStr = getTodayDateStr();
    const { data: bookingsData } = await sb
      .from('salon_bookings')
      .select('id, staff_id, booking_date, start_time, end_time, status')
      .eq('organization_id', orgId)
      .gte('booking_date', todayStr)
      .neq('status', 'cancelled');

    const occupiedSlots: OccupiedBookingSlot[] = (bookingsData || []) as OccupiedBookingSlot[];

    return NextResponse.json({
      services: services.filter((s) => s.is_active),
      staff: staff.filter((m) => m.is_active),
      schedule,
      occupiedSlots,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Errore caricamento calendario';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sb = getAdminClient();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const action = String(body.action || 'book');

    // 1. Customer self-cancellation with secret token
    if (action === 'cancel') {
      const bookingId = body.booking_id;
      const cancelToken = typeof body.cancel_token === 'string' ? body.cancel_token : '';
      if (!isValidUUID(bookingId) || cancelToken.length < 16) {
        return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 });
      }

      const { data: existing } = await sb
        .from('salon_bookings')
        .select('id, cancel_token_hash, status')
        .eq('id', bookingId)
        .maybeSingle();

      if (!existing || existing.cancel_token_hash !== hashToken(cancelToken)) {
        return NextResponse.json({ error: 'Impossibile verificare la prenotazione' }, { status: 403 });
      }

      await sb
        .from('salon_bookings')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', bookingId);

      return NextResponse.json({ success: true });
    }

    // 2. Create a new customer booking
    const orgId = body.organization_id;
    if (!isValidUUID(orgId)) {
      return NextResponse.json({ error: 'Organizzazione non valida' }, { status: 400 });
    }

    const customerName = sanitizeString(body.customer_name, 80);
    const customerPhone = sanitizeString(body.customer_phone, 35);
    const customerNotes = sanitizeString(body.customer_notes, 250);
    const bookingDate = sanitizeString(body.booking_date, 10);
    const startTime = sanitizeString(body.start_time, 5);
    const requestedStaffId = sanitizeString(body.staff_id, 50) || 'any';
    const rawServiceIds = Array.isArray(body.service_ids) ? body.service_ids.map(String) : [];

    if (!customerName || !customerPhone) {
      return NextResponse.json({ error: 'Inserisci nome e numero di telefono' }, { status: 400 });
    }
    if (!bookingDate || !/^\d{4}-\d{2}-\d{2}$/.test(bookingDate) || !startTime || !/^\d{2}:\d{2}$/.test(startTime)) {
      return NextResponse.json({ error: 'Seleziona data e orario validi' }, { status: 400 });
    }
    if (rawServiceIds.length === 0 || rawServiceIds.length > 6) {
      return NextResponse.json({ error: 'Seleziona almeno un trattamento' }, { status: 400 });
    }

    const { data: org } = await sb
      .from('organizations')
      .select('id, name, category, hub_config')
      .eq('id', orgId as string)
      .maybeSingle();

    if (!org) {
      return NextResponse.json({ error: 'Salone non trovato' }, { status: 404 });
    }

    const schedule: WeeklySchedule =
      (org.hub_config as { salonSchedule?: WeeklySchedule } | null)?.salonSchedule ||
      getDefaultWeeklySchedule();

    const { services, staff } = await ensureStarterDataIfEmpty(sb, org.id, org.category);
    const activeServices = services.filter((s) => s.is_active && rawServiceIds.includes(s.id));

    if (activeServices.length === 0) {
      return NextResponse.json({ error: 'Trattamento selezionato non disponibile' }, { status: 400 });
    }

    const totalDuration = activeServices.reduce((acc, s) => acc + s.duration_minutes, 0);
    const totalPrice = activeServices.reduce((acc, s) => acc + Number(s.price || 0), 0);
    const startMin = timeToMinutes(startTime);
    const endMin = startMin + totalDuration;
    const endTime = minutesToTime(endMin);

    const { data: dayBookings } = await sb
      .from('salon_bookings')
      .select('id, staff_id, booking_date, start_time, end_time, status')
      .eq('organization_id', org.id)
      .eq('booking_date', bookingDate)
      .neq('status', 'cancelled');

    const occupied = (dayBookings || []) as OccupiedBookingSlot[];

    // Verify slot is genuinely available for the requested staff or 'any'
    const validSlots = computeAvailableSlotsForDate({
      dateStr: bookingDate,
      durationMinutes: totalDuration,
      staffList: staff,
      selectedStaffId: requestedStaffId === 'any' ? 'any' : requestedStaffId,
      requiredServiceIds: activeServices.map((s) => s.id),
      orgSchedule: schedule,
      existingBookings: occupied,
    });

    const matchingSlot = validSlots.find((s) => s.start_time === startTime);
    if (!matchingSlot) {
      return NextResponse.json(
        { error: 'Questo orario è appena stato prenotato. Scegli un altro orario disponibile.' },
        { status: 409 }
      );
    }

    const chosenStaff = staff.find((m) => m.id === matchingSlot.staff_id) || staff[0];
    if (hasBookingConflict(occupied, chosenStaff.id, bookingDate, startMin, endMin)) {
      return NextResponse.json(
        { error: 'Orario non più disponibile per questo operatore.' },
        { status: 409 }
      );
    }

    const cancelToken = randomBytes(24).toString('base64url');
    const servicesSnapshot = activeServices.map((s) => ({
      id: s.id,
      name: s.name,
      duration_minutes: s.duration_minutes,
      price: Number(s.price) || 0,
    }));

    const { data: created, error: insertErr } = await sb
      .from('salon_bookings')
      .insert({
        organization_id: org.id,
        staff_id: chosenStaff.id,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_notes: customerNotes,
        service_ids: activeServices.map((s) => s.id),
        services_snapshot: servicesSnapshot,
        booking_date: bookingDate,
        start_time: startTime,
        end_time: endTime,
        total_duration_minutes: totalDuration,
        total_price: totalPrice,
        status: 'confirmed',
        source: 'hub',
        cancel_token_hash: hashToken(cancelToken),
      })
      .select('*')
      .single();

    if (insertErr || !created) {
      return NextResponse.json(
        { error: insertErr?.message || 'Impossibile salvare la prenotazione' },
        { status: 500 }
      );
    }

    // Save contact in CRM leads (best-effort)
    try {
      await sb.from('leads').insert({
        organization_id: org.id,
        name: customerName,
        contact: customerPhone,
        source: 'loyalty',
      });
    } catch {
      // Ignore if duplicate
    }

    notifyTelegramBooking(sb, org.id, {
      customerName,
      customerPhone,
      staffName: chosenStaff.name,
      dateStr: bookingDate,
      startTime,
      endTime,
      servicesText: activeServices.map((s) => s.name).join(' + '),
      totalPrice,
      notes: customerNotes,
    });

    return NextResponse.json({
      booking: {
        ...created,
        staff_name: chosenStaff.name,
        staff_role: chosenStaff.role_title,
        staff_color: chosenStaff.color,
      },
      cancel_token: cancelToken,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Errore interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
