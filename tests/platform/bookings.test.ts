import { describe, it, expect } from 'vitest';
import {
  computeAvailableSlotsForDate,
  hasBookingConflict,
  findNextAvailableSlotForStaff,
  canStaffPerformServices,
  timeToMinutes,
  minutesToTime,
  getDefaultWeeklySchedule,
  SalonStaffMember,
  OccupiedBookingSlot,
} from '@/lib/bookings/shared';

const mockStaff: SalonStaffMember[] = [
  {
    id: 'staff-marco',
    organization_id: 'org-1',
    name: 'Marco',
    role_title: 'Master Barber',
    color: '#f59e0b',
    is_active: true,
    is_present_today: true,
    service_ids: [], // performs all services
    working_hours: null,
    sort_order: 0,
  },
  {
    id: 'staff-luca',
    organization_id: 'org-1',
    name: 'Luca',
    role_title: 'Fade Specialist',
    color: '#10b981',
    is_active: true,
    is_present_today: true,
    service_ids: ['svc-cut', 'svc-beard'], // does NOT perform svc-color
    working_hours: null,
    sort_order: 1,
  },
];

describe('Salon & Barber Booking Availability Engine', () => {
  it('converts time strings and minutes accurately', () => {
    expect(minutesToTime(timeToMinutes('09:30') + 45)).toBe('10:15');
    expect(minutesToTime(timeToMinutes('12:15') + 45)).toBe('13:00');
  });

  it('filters staff by assigned treatment capabilities', () => {
    expect(canStaffPerformServices(mockStaff[0], ['svc-cut', 'svc-color'])).toBe(true);
    expect(canStaffPerformServices(mockStaff[1], ['svc-cut', 'svc-beard'])).toBe(true);
    expect(canStaffPerformServices(mockStaff[1], ['svc-color'])).toBe(false);
  });

  it('excludes slots that would overflow the morning shift break (13:00)', () => {
    // 2026-11-11 is a Wednesday (open 09:00-13:00 and 14:30-19:30)
    const dateStr = '2026-11-11';
    const slots = computeAvailableSlotsForDate({
      dateStr,
      durationMinutes: 60,
      staffList: mockStaff,
      selectedStaffId: 'staff-marco',
      requiredServiceIds: ['svc-cut', 'svc-beard'],
      orgSchedule: getDefaultWeeklySchedule(),
      existingBookings: [],
      nowDateStr: '2026-11-10',
      stepMinutes: 15,
    });

    const times = slots.map((s) => s.start_time);
    // 12:00 + 60m = 13:00 (fits inside 09:00-13:00)
    expect(times).toContain('12:00');
    // 12:15 + 60m = 13:15 (overflows 13:00 lunch break -> must NOT be available)
    expect(times).not.toContain('12:15');
    expect(times).not.toContain('12:30');
    // Afternoon resumes at 14:30
    expect(times).toContain('14:30');
  });

  it('detects booking conflicts and blocks overlapping slots for a specific barber while keeping other barbers available', () => {
    const dateStr = '2026-11-11';
    const existingBookings: OccupiedBookingSlot[] = [
      {
        id: 'bk-1',
        staff_id: 'staff-marco',
        booking_date: dateStr,
        start_time: '10:00',
        end_time: '10:45',
        status: 'confirmed',
      },
    ];

    expect(
      hasBookingConflict(
        existingBookings,
        'staff-marco',
        dateStr,
        timeToMinutes('10:15'),
        timeToMinutes('10:45')
      )
    ).toBe(true);

    expect(
      hasBookingConflict(
        existingBookings,
        'staff-luca',
        dateStr,
        timeToMinutes('10:15'),
        timeToMinutes('10:45')
      )
    ).toBe(false);

    // When customer selects "Primo disponibile" (selectedStaffId = 'any'), 10:00 is still available via Luca
    const anyStaffSlots = computeAvailableSlotsForDate({
      dateStr,
      durationMinutes: 30,
      staffList: mockStaff,
      selectedStaffId: 'any',
      requiredServiceIds: ['svc-cut'],
      orgSchedule: getDefaultWeeklySchedule(),
      existingBookings,
      nowDateStr: '2026-11-10',
    });

    const slotAt10 = anyStaffSlots.find((s) => s.start_time === '10:00');
    expect(slotAt10).toBeDefined();
    expect(slotAt10?.staff_id).toBe('staff-luca');
  });

  it('returns empty slots on closed days (e.g. Monday)', () => {
    // 2026-11-09 is a Monday (closed by default in getDefaultWeeklySchedule())
    const slots = computeAvailableSlotsForDate({
      dateStr: '2026-11-09',
      durationMinutes: 30,
      staffList: mockStaff,
      selectedStaffId: 'any',
      requiredServiceIds: ['svc-cut'],
      orgSchedule: getDefaultWeeklySchedule(),
      existingBookings: [],
      nowDateStr: '2026-11-08',
    });
    expect(slots).toHaveLength(0);
  });

  it('finds the next available slot for each staff member across upcoming days', () => {
    const nextSlot = findNextAvailableSlotForStaff({
      staff: mockStaff[0],
      durationMinutes: 30,
      requiredServiceIds: ['svc-cut'],
      orgSchedule: getDefaultWeeklySchedule(),
      existingBookings: [],
      maxDaysAhead: 7,
    });
    expect(nextSlot).not.toBeNull();
    expect(nextSlot?.start_time).toBeDefined();
  });
});
