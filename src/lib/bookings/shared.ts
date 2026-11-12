/**
 * RIVO Salon & Barber Booking Engine — shared types, presets & availability math.
 */

export type ServiceCategorySlug = 'taglio' | 'barba' | 'colore' | 'piega' | 'trattamenti';

export interface SalonService {
  id: string;
  organization_id?: string;
  name: string;
  category: ServiceCategorySlug | string;
  description: string | null;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  sort_order: number;
}

export interface TimeShift {
  enabled: boolean;
  start: string; // 'HH:MM'
  end: string;   // 'HH:MM'
}

export interface DaySchedule {
  open: boolean;
  morning: TimeShift;
  afternoon: TimeShift;
}

/** 0 = Domenica, 1 = Lunedì ... 6 = Sabato */
export type DayOfWeekKey = '0' | '1' | '2' | '3' | '4' | '5' | '6';
export type WeeklySchedule = Record<DayOfWeekKey, DaySchedule>;

export interface SalonStaffMember {
  id: string;
  organization_id?: string;
  name: string;
  role_title: string;
  color: string;
  service_ids: string[]; // empty = can perform all services
  working_hours: WeeklySchedule | null;
  is_active: boolean;
  is_present_today: boolean;
  sort_order: number;
}

export interface BookingServiceSnapshot {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
}

export type BookingStatus = 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface SalonBooking {
  id: string;
  organization_id: string;
  staff_id: string;
  customer_name: string;
  customer_phone: string;
  customer_notes: string | null;
  service_ids: string[];
  services_snapshot: BookingServiceSnapshot[];
  booking_date: string; // 'YYYY-MM-DD'
  start_time: string;   // 'HH:MM'
  end_time: string;     // 'HH:MM'
  total_duration_minutes: number;
  total_price: number;
  status: BookingStatus;
  source: 'hub' | 'manual';
  created_at: string;
}

/** Public-safe booking interval used on the Hub to compute free slots without exposing PII. */
export interface OccupiedBookingSlot {
  id: string;
  staff_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
}

export interface AvailableTimeSlot {
  start_time: string; // 'HH:MM'
  end_time: string;   // 'HH:MM'
  period: 'morning' | 'afternoon';
  staff_id: string;
  staff_name: string;
  staff_color: string;
}

export const SERVICE_CATEGORIES: { id: ServiceCategorySlug; label: string; emoji: string }[] = [
  { id: 'taglio', label: 'Taglio & Styling', emoji: '✂️' },
  { id: 'barba', label: 'Barba & Grooming', emoji: '🪒' },
  { id: 'piega', label: 'Piega & Acconciature', emoji: '💇‍♀️' },
  { id: 'colore', label: 'Colore & Schiariture', emoji: '🎨' },
  { id: 'trattamenti', label: 'Trattamenti & Cura', emoji: '✨' },
];

export const DAY_LABELS_IT: { key: DayOfWeekKey; short: string; full: string }[] = [
  { key: '1', short: 'Lun', full: 'Lunedì' },
  { key: '2', short: 'Mar', full: 'Martedì' },
  { key: '3', short: 'Mer', full: 'Mercoledì' },
  { key: '4', short: 'Gio', full: 'Giovedì' },
  { key: '5', short: 'Ven', full: 'Venerdì' },
  { key: '6', short: 'Sab', full: 'Sabato' },
  { key: '0', short: 'Dom', full: 'Domenica' },
];

export const STAFF_COLOR_PALETTE = [
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

export function getDefaultWeeklySchedule(): WeeklySchedule {
  const openDay = (): DaySchedule => ({
    open: true,
    morning: { enabled: true, start: '09:00', end: '13:00' },
    afternoon: { enabled: true, start: '14:30', end: '19:30' },
  });
  const closedDay = (): DaySchedule => ({
    open: false,
    morning: { enabled: false, start: '09:00', end: '13:00' },
    afternoon: { enabled: false, start: '14:30', end: '19:30' },
  });

  return {
    '0': closedDay(), // Domenica chiuso
    '1': closedDay(), // Lunedì chiuso (classico saloni/barber)
    '2': openDay(),
    '3': openDay(),
    '4': openDay(),
    '5': openDay(),
    '6': {
      open: true,
      morning: { enabled: true, start: '09:00', end: '13:30' },
      afternoon: { enabled: true, start: '14:00', end: '19:30' },
    },
  };
}

// ============================================================================
// Starter Templates (1-Click Seed for New Barber Shops & Hair Salons)
// ============================================================================

export const BARBER_STARTER_SERVICES: Omit<SalonService, 'id' | 'organization_id'>[] = [
  {
    name: 'Taglio Uomo Stilizzato / Fade',
    category: 'taglio',
    description: 'Consulenza d’immagine, shampoo specifico, taglio forbici o sfumatura razor fade e styling finale.',
    duration_minutes: 30,
    price: 25,
    is_active: true,
    sort_order: 10,
  },
  {
    name: 'Ritual Barba Panno Caldo',
    category: 'barba',
    description: 'Modellatura barba tradizionale con triplo panno caldo, oli essenziali emollienti e dopobarba lenitivo.',
    duration_minutes: 20,
    price: 15,
    is_active: true,
    sort_order: 20,
  },
  {
    name: 'Combo Taglio + Ritual Barba Completa',
    category: 'taglio',
    description: 'Il nostro pacchetto completo: taglio su misura, lavaggio energizzante e rituale barba panno caldo.',
    duration_minutes: 45,
    price: 36,
    is_active: true,
    sort_order: 30,
  },
  {
    name: 'Taglio Bimbo / Under 12',
    category: 'taglio',
    description: 'Taglio rapido e curato per i più piccoli.',
    duration_minutes: 25,
    price: 18,
    is_active: true,
    sort_order: 40,
  },
  {
    name: 'Black Mask & Pulizia Viso Express',
    category: 'trattamenti',
    description: 'Trattamento purificante al carbone attivo con vapore e crema idratante.',
    duration_minutes: 15,
    price: 12,
    is_active: true,
    sort_order: 50,
  },
];

export const SALON_STARTER_SERVICES: Omit<SalonService, 'id' | 'organization_id'>[] = [
  {
    name: 'Piega Glamour & Shampoo Specifico',
    category: 'piega',
    description: 'Detersione con bagno capillare nutriente, massaggio cute e piega liscia o mossa a lunga tenuta.',
    duration_minutes: 35,
    price: 25,
    is_active: true,
    sort_order: 10,
  },
  {
    name: 'Taglio Donna & Piega Sartoriale',
    category: 'taglio',
    description: 'Studio morfologico del viso, taglio personalizzato e piega completa.',
    duration_minutes: 50,
    price: 45,
    is_active: true,
    sort_order: 20,
  },
  {
    name: 'Colore Radici Senza Ammoniaca + Piega',
    category: 'colore',
    description: 'Colorazione delicata ad alta copertura con oli biologici, fissaggio lucentezza e piega.',
    duration_minutes: 75,
    price: 65,
    is_active: true,
    sort_order: 30,
  },
  {
    name: 'Balayage / Schiariture + Tonalizzante + Piega',
    category: 'colore',
    description: 'Schiariture naturali a mano libera con protezione fibra capillare, gloss e styling.',
    duration_minutes: 120,
    price: 110,
    is_active: true,
    sort_order: 40,
  },
  {
    name: 'Trattamento Ristrutturante alla Cheratina',
    category: 'trattamenti',
    description: 'Impacco profondo rimpolpante ad azione anti-crespo e luminosità immediata.',
    duration_minutes: 25,
    price: 22,
    is_active: true,
    sort_order: 50,
  },
];

export const STARTER_STAFF_BARBER = [
  { name: 'Davide', role_title: 'Master Barber & Founder', color: '#10b981', sort_order: 10 },
  { name: 'Marco', role_title: 'Senior Barber & Beard Specialist', color: '#8b5cf6', sort_order: 20 },
  { name: 'Lorenzo', role_title: 'Hair Stylist & Fade Artist', color: '#3b82f6', sort_order: 30 },
];

export const STARTER_STAFF_SALON = [
  { name: 'Giulia', role_title: 'Art Director & Colorist', color: '#ec4899', sort_order: 10 },
  { name: 'Elena', role_title: 'Senior Hair Stylist', color: '#8b5cf6', sort_order: 20 },
  { name: 'Davide', role_title: 'Cut & Styling Specialist', color: '#10b981', sort_order: 30 },
];

// ============================================================================
// Time & Slot Availability Math
// ============================================================================

export function timeToMinutes(hhmm: string): number {
  const [h, m] = (hhmm || '00:00').split(':').map((v) => parseInt(v, 10) || 0);
  return h * 60 + m;
}

export function minutesToTime(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, Math.round(totalMinutes)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatEuroPrice(val: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(val || 0);
}

/** Returns '0'..'6' for a 'YYYY-MM-DD' date string without timezone drift. */
export function getDayOfWeekKey(dateStr: string): DayOfWeekKey {
  const [y, m, d] = dateStr.split('-').map((n) => parseInt(n, 10));
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1, 12, 0, 0));
  return String(dt.getUTCDay()) as DayOfWeekKey;
}

export function getTodayDateStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function canStaffPerformServices(staff: SalonStaffMember, serviceIds: string[]): boolean {
  if (!staff.is_active) return false;
  if (!Array.isArray(staff.service_ids) || staff.service_ids.length === 0) return true;
  const allowed = new Set(staff.service_ids);
  return serviceIds.every((id) => allowed.has(id));
}

export function hasBookingConflict(
  existingBookings: OccupiedBookingSlot[],
  staffId: string,
  dateStr: string,
  startMin: number,
  endMin: number,
  ignoreBookingId?: string
): boolean {
  for (const b of existingBookings) {
    if (b.id === ignoreBookingId) continue;
    if (b.staff_id !== staffId || b.booking_date !== dateStr) continue;
    if (b.status === 'cancelled') continue;
    const bStart = timeToMinutes(b.start_time);
    const bEnd = timeToMinutes(b.end_time);
    if (startMin < bEnd && endMin > bStart) {
      return true;
    }
  }
  return false;
}

/**
 * Computes all available slots for a given date, duration, and either a specific
 * staff member or 'any' ("Primo disponibile").
 * Step interval is 15 minutes (or 30 minutes for longer treatments).
 */
export function computeAvailableSlotsForDate({
  dateStr,
  durationMinutes,
  staffList,
  selectedStaffId,
  requiredServiceIds,
  orgSchedule,
  existingBookings,
  nowDateStr,
  nowMinutes,
  stepMinutes = 15,
}: {
  dateStr: string;
  durationMinutes: number;
  staffList: SalonStaffMember[];
  selectedStaffId: string | 'any';
  requiredServiceIds: string[];
  orgSchedule: WeeklySchedule;
  existingBookings: OccupiedBookingSlot[];
  nowDateStr?: string;
  nowMinutes?: number;
  stepMinutes?: number;
}): AvailableTimeSlot[] {
  const todayStr = nowDateStr || getTodayDateStr();
  if (dateStr < todayStr) return [];

  const isToday = dateStr === todayStr;
  const currentMin =
    typeof nowMinutes === 'number'
      ? nowMinutes
      : new Date().getHours() * 60 + new Date().getMinutes();

  const dowKey = getDayOfWeekKey(dateStr);

  // Filter eligible staff
  const candidates = staffList.filter((s) => {
    if (!s.is_active) return false;
    if (isToday && !s.is_present_today) return false;
    if (selectedStaffId !== 'any' && s.id !== selectedStaffId) return false;
    return canStaffPerformServices(s, requiredServiceIds);
  });

  if (candidates.length === 0) return [];

  const slotMap = new Map<string, AvailableTimeSlot>();

  for (const staff of candidates) {
    const schedule = staff.working_hours || orgSchedule;
    const daySched = schedule?.[dowKey] || orgSchedule?.[dowKey];
    if (!daySched || !daySched.open) continue;

    const shifts: { period: 'morning' | 'afternoon'; shift: TimeShift }[] = [
      { period: 'morning', shift: daySched.morning },
      { period: 'afternoon', shift: daySched.afternoon },
    ];

    for (const { period, shift } of shifts) {
      if (!shift || !shift.enabled) continue;
      const shiftStart = timeToMinutes(shift.start);
      const shiftEnd = timeToMinutes(shift.end);

      for (let t = shiftStart; t + durationMinutes <= shiftEnd; t += stepMinutes) {
        // Require at least 15 min lead time if booking for today
        if (isToday && t < currentMin + 15) continue;

        const endMin = t + durationMinutes;
        if (hasBookingConflict(existingBookings, staff.id, dateStr, t, endMin)) {
          continue;
        }

        const startStr = minutesToTime(t);
        if (!slotMap.has(startStr)) {
          slotMap.set(startStr, {
            start_time: startStr,
            end_time: minutesToTime(endMin),
            period,
            staff_id: staff.id,
            staff_name: staff.name,
            staff_color: staff.color,
          });
        }
      }
    }
  }

  return Array.from(slotMap.values()).sort(
    (a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time)
  );
}

/**
 * Finds the very next available slot for a staff member across the next N days
 * (used to show "⚡ Libero oggi 15:30" or "⚡ Libero domani 09:30" on each barber card!).
 */
export function findNextAvailableSlotForStaff({
  staff,
  durationMinutes,
  requiredServiceIds,
  orgSchedule,
  existingBookings,
  maxDaysAhead = 7,
}: {
  staff: SalonStaffMember;
  durationMinutes: number;
  requiredServiceIds: string[];
  orgSchedule: WeeklySchedule;
  existingBookings: OccupiedBookingSlot[];
  maxDaysAhead?: number;
}): { dateStr: string; dayLabel: string; start_time: string } | null {
  const base = new Date();
  for (let offset = 0; offset < maxDaysAhead; offset++) {
    const dt = new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    const slots = computeAvailableSlotsForDate({
      dateStr,
      durationMinutes,
      staffList: [staff],
      selectedStaffId: staff.id,
      requiredServiceIds,
      orgSchedule,
      existingBookings,
    });

    if (slots.length > 0) {
      const dayLabel =
        offset === 0
          ? 'oggi'
          : offset === 1
          ? 'domani'
          : dt.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
      return { dateStr, dayLabel, start_time: slots[0].start_time };
    }
  }
  return null;
}
