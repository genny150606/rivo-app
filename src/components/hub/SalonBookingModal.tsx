'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Scissors,
  Sparkles,
  Calendar,
  Clock,
  Check,
  ChevronRight,
  ArrowLeft,
  X,
  User,
  Phone,
  MessageSquare,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Trash2,
  Sun,
  Sunset,
  CalendarPlus,
} from 'lucide-react';
import {
  SERVICE_CATEGORIES,
  computeAvailableSlotsForDate,
  findNextAvailableSlotForStaff,
  formatEuroPrice,
  getDayOfWeekKey,
  getDefaultWeeklySchedule,
  getTodayDateStr,
  type OccupiedBookingSlot,
  type SalonService,
  type SalonStaffMember,
  type WeeklySchedule,
} from '@/lib/bookings/shared';
import { getInitials } from '@/lib/table-cart/shared';
import { hapticTap, hapticSuccess, hapticWarning } from '@/lib/haptics';

interface SavedBookingPass {
  id: string;
  cancel_token: string;
  customer_name: string;
  customer_phone: string;
  staff_name: string;
  staff_role: string;
  staff_color: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_duration_minutes: number;
  total_price: number;
  services: { id: string; name: string; duration_minutes: number; price: number }[];
}

const PASS_STORAGE_KEY = (orgId: string) => `rivo_salon_booking_${orgId}`;

export default function SalonBookingModal({
  isOpen,
  onClose,
  organizationId,
  organizationName,
  whatsappNumber,
  accentColor = '#BFFF00',
  contrastText = '#000000',
}: {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  organizationName: string;
  whatsappNumber?: string | null;
  accentColor?: string;
  contrastText?: string;
}) {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [services, setServices] = useState<SalonService[]>([]);
  const [staff, setStaff] = useState<SalonStaffMember[]>([]);
  const [schedule, setSchedule] = useState<WeeklySchedule>(getDefaultWeeklySchedule);
  const [occupiedSlots, setOccupiedSlots] = useState<OccupiedBookingSlot[]>([]);

  // Wizard Steps: 1 = Services, 2 = Staff, 3 = Date & Time, 4 = Customer Details
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | 'any'>('any');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateStr);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Customer form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Active saved booking pass
  const [savedPass, setSavedPass] = useState<SavedBookingPass | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const loadBookingData = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/hub/bookings?organization_id=${organizationId}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore caricamento disponibilità');

      setServices(data.services || []);
      setStaff(data.staff || []);
      if (data.schedule) setSchedule(data.schedule);
      setOccupiedSlots(data.occupiedSlots || []);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Errore caricamento calendario');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (!isOpen) return;
    loadBookingData();

    // Restore customer name/phone and active pass from localStorage
    if (typeof window !== 'undefined') {
      try {
        const storedName = localStorage.getItem('rivo_guest_name') || '';
        const storedPhone = localStorage.getItem('rivo_guest_phone') || '';
        if (storedName) setCustomerName(storedName);
        if (storedPhone) setCustomerPhone(storedPhone);

        const rawPass = localStorage.getItem(PASS_STORAGE_KEY(organizationId));
        if (rawPass) {
          const parsed = JSON.parse(rawPass) as SavedBookingPass;
          if (parsed.booking_date >= getTodayDateStr()) {
            setSavedPass(parsed);
          } else {
            localStorage.removeItem(PASS_STORAGE_KEY(organizationId));
          }
        }
      } catch {
        // ignore storage errors
      }
    }
  }, [isOpen, organizationId, loadBookingData]);

  // Selected services summary
  const selectedServices = useMemo(
    () => services.filter((s) => selectedServiceIds.includes(s.id)),
    [services, selectedServiceIds]
  );

  const totalDuration = useMemo(
    () => selectedServices.reduce((acc, s) => acc + s.duration_minutes, 0),
    [selectedServices]
  );

  const totalPrice = useMemo(
    () => selectedServices.reduce((acc, s) => acc + Number(s.price || 0), 0),
    [selectedServices]
  );

  // Next 14 days calendar strip
  const upcomingDays = useMemo(() => {
    const base = new Date();
    const list: {
      dateStr: string;
      dayShort: string;
      dayNum: string;
      monthShort: string;
      isOpen: boolean;
      isToday: boolean;
    }[] = [];

    for (let i = 0; i < 14; i++) {
      const dt = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const d = String(dt.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      const dowKey = getDayOfWeekKey(dateStr);
      const isOpen = Boolean(schedule?.[dowKey]?.open);

      list.push({
        dateStr,
        dayShort:
          i === 0
            ? 'OGGI'
            : i === 1
            ? 'DOM'
            : dt.toLocaleDateString('it-IT', { weekday: 'short' }).toUpperCase().replace('.', ''),
        dayNum: String(dt.getDate()),
        monthShort: dt.toLocaleDateString('it-IT', { month: 'short' }).replace('.', ''),
        isOpen,
        isToday: i === 0,
      });
    }
    return list;
  }, [schedule]);

  // Ensure selectedDate is an open day when entering Step 3
  useEffect(() => {
    const current = upcomingDays.find((d) => d.dateStr === selectedDate);
    if (!current || !current.isOpen) {
      const firstOpen = upcomingDays.find((d) => d.isOpen);
      if (firstOpen) setSelectedDate(firstOpen.dateStr);
    }
  }, [upcomingDays, selectedDate]);

  // Available slots for the selected date, staff, and total duration
  const availableSlots = useMemo(() => {
    if (totalDuration <= 0) return [];
    return computeAvailableSlotsForDate({
      dateStr: selectedDate,
      durationMinutes: totalDuration,
      staffList: staff,
      selectedStaffId,
      requiredServiceIds: selectedServiceIds,
      orgSchedule: schedule,
      existingBookings: occupiedSlots,
    });
  }, [selectedDate, totalDuration, staff, selectedStaffId, selectedServiceIds, schedule, occupiedSlots]);

  const morningSlots = useMemo(
    () => availableSlots.filter((s) => s.period === 'morning'),
    [availableSlots]
  );
  const afternoonSlots = useMemo(
    () => availableSlots.filter((s) => s.period === 'afternoon'),
    [availableSlots]
  );

  const selectedSlotObj = useMemo(
    () => availableSlots.find((s) => s.start_time === selectedTime) || null,
    [availableSlots, selectedTime]
  );

  if (!isOpen) return null;

  const toggleService = (id: string) => {
    hapticTap();
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setSelectedTime(null);
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTime || selectedServiceIds.length === 0) return;
    setSubmitting(true);
    setErrorMsg(null);
    hapticTap();

    try {
      const res = await fetch('/api/hub/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'book',
          organization_id: organizationId,
          staff_id: selectedStaffId,
          service_ids: selectedServiceIds,
          booking_date: selectedDate,
          start_time: selectedTime,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          customer_notes: customerNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Impossibile completare la prenotazione');

      hapticSuccess();
      const pass: SavedBookingPass = {
        id: data.booking.id,
        cancel_token: data.cancel_token,
        customer_name: data.booking.customer_name,
        customer_phone: data.booking.customer_phone,
        staff_name: data.booking.staff_name,
        staff_role: data.booking.staff_role,
        staff_color: data.booking.staff_color,
        booking_date: data.booking.booking_date,
        start_time: data.booking.start_time,
        end_time: data.booking.end_time,
        total_duration_minutes: data.booking.total_duration_minutes,
        total_price: Number(data.booking.total_price) || totalPrice,
        services: data.booking.services_snapshot || [],
      };

      setSavedPass(pass);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('rivo_guest_name', customerName.trim());
          localStorage.setItem('rivo_guest_phone', customerPhone.trim());
          localStorage.setItem(PASS_STORAGE_KEY(organizationId), JSON.stringify(pass));
        } catch {}
      }
    } catch (err: unknown) {
      hapticWarning();
      setErrorMsg(err instanceof Error ? err.message : 'Errore durante la prenotazione');
      loadBookingData();
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelSavedPass = async () => {
    if (!savedPass) return;
    if (!confirm('Confermi di voler disdire questo appuntamento? Lo slot tornerà subito libero.')) {
      return;
    }
    setCancelling(true);
    try {
      const res = await fetch('/api/hub/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          booking_id: savedPass.id,
          cancel_token: savedPass.cancel_token,
        }),
      });
      if (res.ok) {
        hapticSuccess();
        if (typeof window !== 'undefined') {
          localStorage.removeItem(PASS_STORAGE_KEY(organizationId));
        }
        setSavedPass(null);
        setStep(1);
        loadBookingData();
      }
    } finally {
      setCancelling(false);
    }
  };

  const buildGoogleCalendarUrl = (pass: SavedBookingPass) => {
    const cleanDate = pass.booking_date.replace(/-/g, '');
    const startHHMM = pass.start_time.replace(':', '') + '00';
    const endHHMM = pass.end_time.replace(':', '') + '00';
    const title = encodeURIComponent(`Appuntamento da ${organizationName} (${pass.staff_name})`);
    const details = encodeURIComponent(
      `Trattamenti: ${pass.services.map((s) => s.name).join(' + ')}\nOperatore: ${pass.staff_name}`
    );
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${cleanDate}T${startHHMM}/${cleanDate}T${endHHMM}&details=${details}`;
  };

  const visibleServices =
    categoryFilter === 'all'
      ? services
      : services.filter((s) => s.category === categoryFilter);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-[#111413] border-t sm:border border-white/15 rounded-t-3xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden space-y-3.5">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            {!savedPass && step > 1 ? (
              <button
                type="button"
                onClick={() => {
                  hapticTap();
                  setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : 1));
                }}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/15 text-white flex items-center justify-center cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-bold"
                style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
              >
                <Scissors className="w-4 h-4" />
              </div>
            )}
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                {savedPass ? 'Il Tuo Appuntamento Confermato' : 'Prenota il tuo Appuntamento'}
              </h3>
              <p className="text-[11px] text-zinc-400">
                {savedPass
                  ? organizationName
                  : step === 1
                  ? 'Passo 1 di 4 • Scegli uno o più trattamenti'
                  : step === 2
                  ? 'Passo 2 di 4 • Scegli il tuo Parrucchiere / Barber'
                  : step === 3
                  ? 'Passo 3 di 4 • Scegli giorno e orario libero'
                  : 'Passo 4 di 4 • Conferma i tuoi dati'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-xl min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ================================================================= */}
        {/* ACTIVE BOOKING PASS VIEW */}
        {/* ================================================================= */}
        {savedPass ? (
          <div className="overflow-y-auto flex-1 space-y-4 pr-1 py-1">
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 block">
                Prenotazione Registrata in Agenda
              </span>
              <h4 className="text-base font-extrabold text-white">
                Ti aspettiamo, {savedPass.customer_name}!
              </h4>
              <p className="text-xs text-zinc-300">
                {new Date(savedPass.booking_date + 'T12:00:00').toLocaleDateString('it-IT', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}{' '}
                • <strong className="text-white">{savedPass.start_time} - {savedPass.end_time}</strong>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <span className="text-zinc-400">Operatore scelto:</span>
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span
                    className="w-3 h-3 rounded-full inline-block"
                    style={{ backgroundColor: savedPass.staff_color }}
                  />
                  {savedPass.staff_name}
                </span>
              </div>

              <div className="space-y-1.5">
                <span className="text-zinc-400 block">Trattamenti ({savedPass.total_duration_minutes} min):</span>
                {savedPass.services.map((srv) => (
                  <div key={srv.id} className="flex items-center justify-between text-white font-semibold">
                    <span>• {srv.name}</span>
                    <span className="font-mono text-zinc-300">{formatEuroPrice(srv.price)}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-2.5">
                <span className="text-zinc-400 font-semibold">Totale in salone:</span>
                <span className="text-sm font-mono font-extrabold" style={{ color: accentColor }}>
                  {formatEuroPrice(savedPass.total_price)}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <a
                href={buildGoogleCalendarUrl(savedPass)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-lg"
                style={{ backgroundColor: accentColor, color: contrastText }}
              >
                <CalendarPlus className="w-4 h-4" />
                <span>Aggiungi a Google Calendar</span>
              </a>

              {whatsappNumber && (
                <a
                  href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Ciao ${organizationName}! Sono ${savedPass.customer_name}, ho prenotato per il ${savedPass.booking_date} alle ${savedPass.start_time} con ${savedPass.staff_name}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Scrivici su WhatsApp</span>
                </a>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    hapticTap();
                    setSavedPass(null);
                    setStep(1);
                  }}
                  className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold cursor-pointer"
                >
                  Nuova Prenotazione
                </button>
                <button
                  type="button"
                  onClick={handleCancelSavedPass}
                  disabled={cancelling}
                  className="py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{cancelling ? 'Disdetta...' : 'Disdici Orario'}</span>
                </button>
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="w-7 h-7 animate-spin mx-auto" style={{ color: accentColor }} />
            <p className="text-xs text-zinc-400">Caricamento disponibilità salone...</p>
          </div>
        ) : (
          <>
            {/* ============================================================= */}
            {/* STEP 1: CHOOSE TREATMENTS */}
            {/* ============================================================= */}
            {step === 1 && (
              <>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar shrink-0">
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 cursor-pointer transition-all ${
                      categoryFilter === 'all'
                        ? 'shadow'
                        : 'bg-white/5 text-zinc-400 hover:text-white border border-white/10'
                    }`}
                    style={
                      categoryFilter === 'all'
                        ? { backgroundColor: accentColor, color: contrastText }
                        : undefined
                    }
                  >
                    Tutti ({services.length})
                  </button>
                  {SERVICE_CATEGORIES.filter((c) => services.some((s) => s.category === c.id)).map(
                    (cat) => {
                      const active = categoryFilter === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategoryFilter(cat.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 cursor-pointer transition-all ${
                            active
                              ? 'shadow'
                              : 'bg-white/5 text-zinc-400 hover:text-white border border-white/10'
                          }`}
                          style={
                            active ? { backgroundColor: accentColor, color: contrastText } : undefined
                          }
                        >
                          {cat.emoji} {cat.label}
                        </button>
                      );
                    }
                  )}
                </div>

                <div className="overflow-y-auto flex-1 space-y-2.5 pr-1">
                  {visibleServices.map((srv) => {
                    const isSelected = selectedServiceIds.includes(srv.id);
                    return (
                      <button
                        key={srv.id}
                        type="button"
                        onClick={() => toggleService(srv.id)}
                        className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-start justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-white/[0.08] border-emerald-400/60 shadow-md'
                            : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.05]'
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                              isSelected
                                ? 'bg-emerald-400 border-emerald-400 text-black'
                                : 'border-white/25 bg-black/40'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <div className="min-w-0 space-y-1">
                            <h4 className="text-xs sm:text-sm font-extrabold text-white">
                              {srv.name}
                            </h4>
                            {srv.description && (
                              <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
                                {srv.description}
                              </p>
                            )}
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-300 bg-white/5 px-2 py-0.5 rounded-md">
                              <Clock className="w-3 h-3 text-emerald-400" />
                              {srv.duration_minutes} min
                            </span>
                          </div>
                        </div>

                        <span
                          className="text-xs sm:text-sm font-mono font-extrabold shrink-0"
                          style={{ color: accentColor }}
                        >
                          {formatEuroPrice(srv.price)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Step 1 Sticky Footer */}
                <div className="pt-3 border-t border-white/10 space-y-2.5 shrink-0">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">
                      {selectedServices.length}{' '}
                      {selectedServices.length === 1 ? 'trattamento' : 'trattamenti'} •{' '}
                      <strong className="text-white">🕒 {totalDuration} min</strong>
                    </span>
                    <span className="font-mono font-extrabold text-sm" style={{ color: accentColor }}>
                      {formatEuroPrice(totalPrice)}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={selectedServices.length === 0}
                    onClick={() => {
                      hapticTap();
                      setStep(2);
                    }}
                    className="w-full min-h-[46px] rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
                    style={{ backgroundColor: accentColor, color: contrastText }}
                  >
                    <span>Scegli il Parrucchiere / Barber</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}

            {/* ============================================================= */}
            {/* STEP 2: CHOOSE BARBER / HAIR STYLIST */}
            {/* ============================================================= */}
            {step === 2 && (
              <div className="overflow-y-auto flex-1 space-y-3 pr-1">
                {/* Option: Any / First Available */}
                <button
                  type="button"
                  onClick={() => {
                    hapticTap();
                    setSelectedStaffId('any');
                    setSelectedTime(null);
                    setStep(3);
                  }}
                  className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                    selectedStaffId === 'any'
                      ? 'bg-emerald-500/15 border-emerald-400/50'
                      : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.07]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold shrink-0"
                      style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
                    >
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-extrabold text-white">Primo Disponibile</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                          Consigliato
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Ti mostra tutti gli orari liberi del salone con qualsiasi operatore
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
                </button>

                {/* Individual Staff Members */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {staff.map((member) => {
                    const nextSlot = findNextAvailableSlotForStaff({
                      staff: member,
                      durationMinutes: totalDuration || 30,
                      requiredServiceIds: selectedServiceIds,
                      orgSchedule: schedule,
                      existingBookings: occupiedSlots,
                    });

                    return (
                      <button
                        key={member.id}
                        type="button"
                        disabled={!nextSlot}
                        onClick={() => {
                          hapticTap();
                          setSelectedStaffId(member.id);
                          if (nextSlot) setSelectedDate(nextSlot.dateStr);
                          setSelectedTime(null);
                          setStep(3);
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2.5 cursor-pointer disabled:opacity-45 ${
                          selectedStaffId === member.id
                            ? 'bg-white/10 border-white/40'
                            : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black text-black shrink-0"
                            style={{ backgroundColor: member.color }}
                          >
                            {getInitials(member.name)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-extrabold text-white truncate">
                              {member.name}
                            </h4>
                            <p className="text-[11px] text-zinc-400 truncate">{member.role_title}</p>
                          </div>
                        </div>

                        {nextSlot ? (
                          <div className="px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-bold text-emerald-300 flex items-center justify-between">
                            <span>⚡ Libero {nextSlot.dayLabel}</span>
                            <span className="font-mono">{nextSlot.start_time}</span>
                          </div>
                        ) : (
                          <div className="px-2.5 py-1 rounded-xl bg-white/5 text-[11px] text-zinc-500">
                            Nessuno slot nei prossimi 7gg
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* STEP 3: CHOOSE DATE & AVAILABLE TIME SLOT */}
            {/* ============================================================= */}
            {step === 3 && (
              <>
                {/* Horizontal 14-day calendar strip */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar shrink-0">
                  {upcomingDays.map((d) => {
                    const isSelected = d.dateStr === selectedDate;
                    return (
                      <button
                        key={d.dateStr}
                        type="button"
                        disabled={!d.isOpen}
                        onClick={() => {
                          hapticTap();
                          setSelectedDate(d.dateStr);
                          setSelectedTime(null);
                        }}
                        className={`min-w-[64px] py-2 px-2.5 rounded-2xl border text-center transition-all shrink-0 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${
                          isSelected
                            ? 'shadow-lg font-extrabold'
                            : 'bg-white/[0.03] border-white/10 text-zinc-300 hover:bg-white/[0.07]'
                        }`}
                        style={
                          isSelected
                            ? { backgroundColor: accentColor, color: contrastText, borderColor: accentColor }
                            : undefined
                        }
                      >
                        <span className="text-[9px] font-mono uppercase block opacity-80">
                          {d.dayShort}
                        </span>
                        <span className="text-base font-extrabold block leading-tight my-0.5">
                          {d.dayNum}
                        </span>
                        <span className="text-[9px] uppercase block opacity-75">
                          {d.isOpen ? d.monthShort : 'CHIUSO'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Available Time Slots */}
                <div className="overflow-y-auto flex-1 space-y-4 pr-1">
                  {availableSlots.length === 0 ? (
                    <div className="py-10 text-center space-y-2">
                      <Calendar className="w-8 h-8 text-zinc-600 mx-auto" />
                      <p className="text-xs font-bold text-zinc-300">
                        Nessun orario libero per questa giornata
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        Prova a selezionare un altro giorno qui sopra o scegli &ldquo;Primo Disponibile&rdquo;.
                      </p>
                    </div>
                  ) : (
                    <>
                      {morningSlots.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                            <Sun className="w-3.5 h-3.5" />
                            Mattina ({morningSlots.length} orari liberi)
                          </span>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {morningSlots.map((slot) => {
                              const active = selectedTime === slot.start_time;
                              return (
                                <button
                                  key={slot.start_time}
                                  type="button"
                                  onClick={() => {
                                    hapticTap();
                                    setSelectedTime(slot.start_time);
                                  }}
                                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                                    active
                                      ? 'font-extrabold shadow-md'
                                      : 'bg-white/[0.04] border-white/10 text-white hover:bg-white/10'
                                  }`}
                                  style={
                                    active
                                      ? { backgroundColor: accentColor, color: contrastText }
                                      : undefined
                                  }
                                >
                                  <span className="text-xs font-mono font-bold block">
                                    {slot.start_time}
                                  </span>
                                  {selectedStaffId === 'any' && (
                                    <span className="text-[9px] opacity-80 truncate block">
                                      {slot.staff_name}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {afternoonSlots.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                            <Sunset className="w-3.5 h-3.5" />
                            Pomeriggio ({afternoonSlots.length} orari liberi)
                          </span>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {afternoonSlots.map((slot) => {
                              const active = selectedTime === slot.start_time;
                              return (
                                <button
                                  key={slot.start_time}
                                  type="button"
                                  onClick={() => {
                                    hapticTap();
                                    setSelectedTime(slot.start_time);
                                  }}
                                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                                    active
                                      ? 'font-extrabold shadow-md'
                                      : 'bg-white/[0.04] border-white/10 text-white hover:bg-white/10'
                                  }`}
                                  style={
                                    active
                                      ? { backgroundColor: accentColor, color: contrastText }
                                      : undefined
                                  }
                                >
                                  <span className="text-xs font-mono font-bold block">
                                    {slot.start_time}
                                  </span>
                                  {selectedStaffId === 'any' && (
                                    <span className="text-[9px] opacity-80 truncate block">
                                      {slot.staff_name}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Step 3 Footer */}
                <div className="pt-3 border-t border-white/10 space-y-2.5 shrink-0">
                  {selectedSlotObj && (
                    <div className="flex items-center justify-between text-xs bg-white/5 rounded-xl px-3 py-2">
                      <span className="text-zinc-300">
                        Orario: <strong className="text-white">{selectedSlotObj.start_time} - {selectedSlotObj.end_time}</strong>
                      </span>
                      <span className="text-emerald-300 font-bold">
                        con {selectedSlotObj.staff_name}
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    disabled={!selectedTime}
                    onClick={() => {
                      hapticTap();
                      setStep(4);
                    }}
                    className="w-full min-h-[46px] rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
                    style={{ backgroundColor: accentColor, color: contrastText }}
                  >
                    <span>Continua e Conferma</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}

            {/* ============================================================= */}
            {/* STEP 4: CUSTOMER DETAILS & CONFIRM */}
            {/* ============================================================= */}
            {step === 4 && (
              <form onSubmit={handleConfirmBooking} className="overflow-y-auto flex-1 space-y-3.5 pr-1">
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1.5 text-xs">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block">
                    Riepilogo Appuntamento
                  </span>
                  <p className="text-white font-bold">
                    {selectedServices.map((s) => s.name).join(' + ')} ({totalDuration} min)
                  </p>
                  <p className="text-zinc-300">
                    📅{' '}
                    {new Date(selectedDate + 'T12:00:00').toLocaleDateString('it-IT', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}{' '}
                    • ore <strong>{selectedSlotObj?.start_time} - {selectedSlotObj?.end_time}</strong>
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-white/10">
                    <span className="text-zinc-400">
                      Operatore: <strong className="text-white">{selectedSlotObj?.staff_name}</strong>
                    </span>
                    <span className="font-mono font-extrabold text-sm" style={{ color: accentColor }}>
                      {formatEuroPrice(totalPrice)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5 mb-1">
                      <User className="w-3.5 h-3.5 text-zinc-400" />
                      Il tuo Nome e Cognome *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={70}
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Es. Alessandro Rossi"
                      className="w-full min-h-[42px] bg-black/50 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/40"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5 mb-1">
                      <Phone className="w-3.5 h-3.5 text-zinc-400" />
                      Cellulare / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={30}
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Es. +39 333 1234567"
                      className="w-full min-h-[42px] bg-black/50 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/40"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                      Note per il parrucchiere / barbiere (opzionale)
                    </label>
                    <input
                      type="text"
                      maxLength={200}
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      placeholder="Es. Sfumatura media, allergie particolari..."
                      className="w-full min-h-[42px] bg-black/50 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/40"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !customerName.trim() || !customerPhone.trim()}
                  className="w-full min-h-[46px] rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  style={{ backgroundColor: accentColor, color: contrastText }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Registrazione appuntamento...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Conferma Appuntamento in Salone</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
