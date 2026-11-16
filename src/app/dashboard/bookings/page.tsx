'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  CalendarCheck,
  Scissors,
  Users,
  Clock,
  Plus,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Phone,
  MessageCircle,
  AlertCircle,
  Trash2,
  Edit3,
  RefreshCw,
  UserCheck,
  UserX,
  Ban,
  CheckCircle2,
  Calendar,
  Wand2,
  Save,
  Sliders,
} from 'lucide-react';
import {
  SalonService,
  SalonStaffMember,
  SalonBooking,
  WeeklySchedule,
  DayOfWeekKey,
  DaySchedule,
  DAY_LABELS_IT,
  SERVICE_CATEGORIES,
  ServiceCategorySlug,
  STAFF_COLOR_PALETTE,
  getDefaultWeeklySchedule,
  getDayOfWeekKey,
  getTodayDateStr,
  formatEuroPrice,
  computeAvailableSlotsForDate,
} from '@/lib/bookings/shared';
import { hapticTap, hapticSuccess, hapticSelection } from '@/lib/haptics';
import {
  PageHeader,
  SurfaceCard,
  KpiCard,
  StatusBadge,
  SegmentedControl,
  EmptyState,
} from '@/components/ui';

type DashboardTab = 'agenda' | 'staff' | 'services' | 'schedule';

const BOOKING_INPUT_CLASS =
  'w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--rivo-volt)] focus:ring-2 focus:ring-[var(--focus-ring)] transition-colors';

export default function SalonBookingsDashboardPage() {
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>('agenda');

  // Data state
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayDateStr());
  const [services, setServices] = useState<SalonService[]>([]);
  const [staff, setStaff] = useState<SalonStaffMember[]>([]);
  const [bookings, setBookings] = useState<SalonBooking[]>([]);
  const [schedule, setSchedule] = useState<WeeklySchedule>(() => getDefaultWeeklySchedule());

  // Action feedback state
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingDeleteStaffId, setPendingDeleteStaffId] = useState<string | null>(null);
  const [pendingDeleteServiceId, setPendingDeleteServiceId] = useState<string | null>(null);

  // Manual Booking / Walk-in Modal State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingFormStaffId, setBookingFormStaffId] = useState<string>('');
  const [bookingFormServiceIds, setBookingFormServiceIds] = useState<string[]>([]);
  const [bookingFormTime, setBookingFormTime] = useState<string>('09:30');
  const [bookingFormCustomerName, setBookingFormCustomerName] = useState<string>('');
  const [bookingFormCustomerPhone, setBookingFormCustomerPhone] = useState<string>('');
  const [bookingFormNotes, setBookingFormNotes] = useState<string>('');

  // Staff Editor Modal State
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState('');
  const [staffColor, setStaffColor] = useState(STAFF_COLOR_PALETTE[0]);
  const [staffAllServices, setStaffAllServices] = useState(true);
  const [staffServiceIds, setStaffServiceIds] = useState<string[]>([]);

  // Service Editor Modal State
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [serviceCategory, setServiceCategory] = useState<ServiceCategorySlug>('taglio');
  const [serviceDuration, setServiceDuration] = useState<number>(30);
  const [servicePriceEur, setServicePriceEur] = useState<string>('25');
  const [serviceDescription, setServiceDescription] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token || null;
  }, [supabase]);

  const fetchSalonData = useCallback(
    async (targetOrgId: string, dateStr: string) => {
      try {
        const token = await getAccessToken();
        const res = await fetch(
          `/api/bookings?organization_id=${encodeURIComponent(targetOrgId)}&date=${encodeURIComponent(dateStr)}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.error) {
          throw new Error(json.error || 'Impossibile caricare i dati delle prenotazioni');
        }
        setServices(json.services || []);
        setStaff(json.staff || []);
        setBookings(json.bookings || []);
        setSchedule(json.schedule || getDefaultWeeklySchedule());
      } catch (err: any) {
        setErrorMessage(err?.message || 'Errore di caricamento agenda');
      }
    },
    [getAccessToken]
  );

  useEffect(() => {
    let mounted = true;
    async function init() {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .maybeSingle();

        let resolvedOrgId = profile?.organization_id || null;
        if (!resolvedOrgId) {
          const { data: member } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle();
          resolvedOrgId = member?.organization_id || null;
        }

        if (resolvedOrgId && mounted) {
          setOrgId(resolvedOrgId);
          await fetchSalonData(resolvedOrgId, selectedDate);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, [supabase, fetchSalonData, selectedDate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || saving) return;
      if (showServiceModal) setShowServiceModal(false);
      else if (showStaffModal) setShowStaffModal(false);
      else if (showBookingModal) setShowBookingModal(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showServiceModal, showStaffModal, showBookingModal, saving]);

  // Realtime subscription on salon_bookings
  useEffect(() => {
    if (!orgId) return;
    const channel = supabase
      .channel(`salon-bookings-${orgId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'salon_bookings',
          filter: `organization_id=eq.${orgId}`,
        },
        () => {
          fetchSalonData(orgId, selectedDate);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId, selectedDate, supabase, fetchSalonData]);

  const postAction = async (payload: Record<string, any>) => {
    if (!orgId) return null;
    setSaving(true);
    setErrorMessage(null);
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          organization_id: orgId,
          ...payload,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Operazione non riuscita');
      }
      return json;
    } catch (err: any) {
      setErrorMessage(err?.message || 'Errore durante il salvataggio');
      return null;
    } finally {
      setSaving(false);
    }
  };

  // Date navigation helpers
  const shiftDate = (days: number) => {
    hapticSelection();
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + days));
    setSelectedDate(dt.toISOString().slice(0, 10));
  };

  const formattedSelectedDate = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }, [selectedDate]);

  const handleSeedTemplate = async (preset: 'barber' | 'salon') => {
    hapticTap();
    const res = await postAction({ action: 'seed_template', preset });
    if (res && orgId) {
      hapticSuccess();
      showToast(
        preset === 'barber'
          ? 'Template Barber Shop caricato con successo!'
          : 'Template Salone Parrucchiere caricato con successo!'
      );
      await fetchSalonData(orgId, selectedDate);
    }
  };

  const handleUpdateBookingStatus = async (
    bookingId: string,
    status: 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  ) => {
    hapticTap();
    const res = await postAction({
      action: 'update_booking_status',
      booking_id: bookingId,
      status,
    });
    if (res && orgId) {
      hapticSuccess();
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status } : b)));
      showToast('Stato appuntamento aggiornato');
    }
  };

  const handleToggleStaffPresence = async (member: SalonStaffMember) => {
    hapticTap();
    const nextPresent = !member.is_present_today;
    const res = await postAction({
      action: 'toggle_staff_presence',
      staff_id: member.id,
      is_present_today: nextPresent,
    });
    if (res) {
      hapticSuccess();
      setStaff((prev) =>
        prev.map((s) => (s.id === member.id ? { ...s, is_present_today: nextPresent } : s))
      );
      showToast(
        nextPresent
          ? `${member.name} segnato come Presente oggi`
          : `${member.name} segnato come Assente oggi`
      );
    }
  };

  const openNewBookingModal = (defaultStaffId?: string) => {
    hapticTap();
    setBookingFormStaffId(defaultStaffId || staff[0]?.id || '');
    setBookingFormServiceIds(services[0] ? [services[0].id] : []);
    setBookingFormTime('09:30');
    setBookingFormCustomerName('');
    setBookingFormCustomerPhone('');
    setBookingFormNotes('');
    setShowBookingModal(true);
  };

  const handleCreateManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingFormCustomerName.trim() || bookingFormServiceIds.length === 0 || !bookingFormStaffId) return;

    const res = await postAction({
      action: 'create_booking',
      staff_id: bookingFormStaffId,
      booking_date: selectedDate,
      start_time: bookingFormTime,
      service_ids: bookingFormServiceIds,
      customer_name: bookingFormCustomerName.trim(),
      customer_phone: bookingFormCustomerPhone.trim() || '-',
      customer_notes: bookingFormNotes.trim() || null,
    });

    if (res && orgId) {
      hapticSuccess();
      setShowBookingModal(false);
      showToast('Appuntamento inserito in agenda!');
      await fetchSalonData(orgId, selectedDate);
    }
  };

  // Staff Modal Helpers
  const openEditStaffModal = (member?: SalonStaffMember) => {
    hapticTap();
    if (member) {
      setEditingStaffId(member.id);
      setStaffName(member.name);
      setStaffRole(member.role_title || '');
      setStaffColor(member.color || STAFF_COLOR_PALETTE[0]);
      const allS = !member.service_ids || member.service_ids.length === 0;
      setStaffAllServices(allS);
      setStaffServiceIds(member.service_ids || []);
    } else {
      setEditingStaffId(null);
      setStaffName('');
      setStaffRole('Hair Stylist / Barber');
      setStaffColor(STAFF_COLOR_PALETTE[staff.length % STAFF_COLOR_PALETTE.length]);
      setStaffAllServices(true);
      setStaffServiceIds([]);
    }
    setShowStaffModal(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim()) return;

    const res = await postAction({
      action: 'upsert_staff',
      id: editingStaffId || undefined,
      name: staffName.trim(),
      role_title: staffRole.trim() || 'Hair Stylist',
      color: staffColor,
      is_active: true,
      is_present_today: true,
      service_ids: staffAllServices ? [] : staffServiceIds,
    });

    if (res && orgId) {
      hapticSuccess();
      setShowStaffModal(false);
      showToast(editingStaffId ? 'Membro dello staff aggiornato' : 'Nuova poltrona / staff aggiunta');
      await fetchSalonData(orgId, selectedDate);
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (pendingDeleteStaffId !== staffId) {
      hapticTap();
      setPendingDeleteStaffId(staffId);
      return;
    }
    setPendingDeleteStaffId(null);
    const res = await postAction({ action: 'delete_staff', staff_id: staffId });
    if (res && orgId) {
      hapticSuccess();
      showToast('Membro dello staff rimosso');
      await fetchSalonData(orgId, selectedDate);
    }
  };

  // Service Modal Helpers
  const openEditServiceModal = (svc?: SalonService) => {
    hapticTap();
    if (svc) {
      setEditingServiceId(svc.id);
      setServiceName(svc.name);
      setServiceCategory((svc.category as ServiceCategorySlug) || 'taglio');
      setServiceDuration(svc.duration_minutes);
      setServicePriceEur(String(svc.price));
      setServiceDescription(svc.description || '');
    } else {
      setEditingServiceId(null);
      setServiceName('');
      setServiceCategory('taglio');
      setServiceDuration(30);
      setServicePriceEur('25');
      setServiceDescription('');
    }
    setShowServiceModal(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim()) return;

    const parsedPrice = parseFloat(servicePriceEur.replace(',', '.'));
    const price = Number.isFinite(parsedPrice) ? parsedPrice : 0;

    const res = await postAction({
      action: 'upsert_service',
      id: editingServiceId || undefined,
      name: serviceName.trim(),
      category: serviceCategory,
      duration_minutes: Number(serviceDuration) || 30,
      price,
      description: serviceDescription.trim() || null,
      is_active: true,
    });

    if (res && orgId) {
      hapticSuccess();
      setShowServiceModal(false);
      showToast(editingServiceId ? 'Trattamento aggiornato' : 'Nuovo trattamento aggiunto al listino');
      await fetchSalonData(orgId, selectedDate);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (pendingDeleteServiceId !== serviceId) {
      hapticTap();
      setPendingDeleteServiceId(serviceId);
      return;
    }
    setPendingDeleteServiceId(null);
    const res = await postAction({ action: 'delete_service', service_id: serviceId });
    if (res && orgId) {
      hapticSuccess();
      showToast('Trattamento rimosso dal listino');
      await fetchSalonData(orgId, selectedDate);
    }
  };

  // Schedule Helpers
  const updateDaySchedule = (dayKey: DayOfWeekKey, updater: (prev: DaySchedule) => DaySchedule) => {
    setSchedule((prev) => ({
      ...prev,
      [dayKey]: updater(prev[dayKey]),
    }));
  };

  const handleSaveSchedule = async () => {
    hapticTap();
    const res = await postAction({
      action: 'save_schedule',
      schedule,
    });
    if (res) {
      hapticSuccess();
      showToast('Orari settimanali del salone salvati!');
    }
  };

  // Computed Agenda Metrics
  const activeBookingsForDay = useMemo(() => bookings.filter((b) => b.status !== 'cancelled'), [bookings]);

  const estimatedRevenue = useMemo(
    () =>
      bookings
        .filter((b) => b.status === 'confirmed' || b.status === 'completed')
        .reduce((acc, b) => acc + (Number(b.total_price) || 0), 0),
    [bookings]
  );

  const activeDayKey = useMemo(() => getDayOfWeekKey(selectedDate), [selectedDate]);
  const dayScheduleInfo = schedule[activeDayKey];

  // Available slots for the manual booking modal
  const manualModalAvailableSlots = useMemo(() => {
    const chosenServices = services.filter((s) => bookingFormServiceIds.includes(s.id));
    if (chosenServices.length === 0) return [];
    const totalDuration = chosenServices.reduce((sum, s) => sum + s.duration_minutes, 0) || 30;
    return computeAvailableSlotsForDate({
      dateStr: selectedDate,
      durationMinutes: totalDuration,
      staffList: staff,
      selectedStaffId: bookingFormStaffId || 'any',
      requiredServiceIds: bookingFormServiceIds,
      orgSchedule: schedule,
      existingBookings: bookings,
      stepMinutes: 15,
    });
  }, [selectedDate, bookingFormServiceIds, bookingFormStaffId, services, staff, bookings, schedule]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-[var(--text-secondary)]">
        <RefreshCw className="w-7 h-7 animate-spin text-[var(--rivo-volt-text)]" />
        <p className="text-sm font-semibold">Caricamento Agenda Salone &amp; Poltrone...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-5 right-5 z-50 px-4 py-3 rounded-xl bg-[#047857] text-white dark:bg-[var(--accent-operational)] dark:text-[#09090B] font-bold text-xs shadow-2xl flex items-center gap-2 animate-fade-in"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      <PageHeader
        eyebrow="Gestore Prenotazioni & Poltrone Live"
        eyebrowTone="volt"
        title="Agenda Appuntamenti & Staff"
        description="Gestisci gli appuntamenti per ogni parrucchiere o barbiere, imposta i trattamenti con le durate e sincronizza in tempo reale gli slot liberi sul tuo Hub NFC/QR."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => openNewBookingModal()}
              className="px-4 py-2.5 rounded-xl bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-colors cursor-pointer min-h-[40px]"
            >
              <Plus className="w-4 h-4" />
              <span>Nuovo Appuntamento</span>
            </button>

            <button
              type="button"
              onClick={() => orgId && fetchSalonData(orgId, selectedDate)}
              aria-label="Aggiorna agenda"
              className="p-2.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer min-h-[40px]"
              title="Aggiorna agenda"
            >
              <RefreshCw className={`w-4 h-4 ${saving ? 'animate-spin text-[var(--rivo-volt-text)]' : ''}`} />
            </button>
          </div>
        }
      />

      {/* Error Banner */}
      {errorMessage && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-[var(--accent-critical-bg)] border border-[var(--accent-critical-border)] text-[var(--accent-critical-text)] text-xs font-semibold flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            aria-label="Chiudi errore"
            className="p-1 rounded-lg hover:bg-[var(--bg-surface)]/40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1-Click Starter Template Banner when empty */}
      {(services.length === 0 || staff.length === 0) && (
        <SurfaceCard
          variant="subtle"
          padding="md"
          className="border-[var(--rivo-volt-border)] bg-[var(--rivo-volt-bg)] flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[var(--rivo-volt-text)] font-bold text-xs uppercase tracking-wider">
              <Wand2 className="w-4 h-4" />
              <span>Configurazione Istantanea in 1 Tap</span>
            </div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Vuoi iniziare subito con un listino trattamenti e poltrone già pronte?
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Carica i trattamenti predefiniti (con durate e prezzi modificabili) e 3 poltrone dimostrative per
              testare subito il calendario clienti.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSeedTemplate('barber')}
              className="px-4 py-2.5 rounded-xl bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <Scissors className="w-4 h-4" />
              <span>Template Barber Shop</span>
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => handleSeedTemplate('salon')}
              className="px-4 py-2.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-[var(--accent-telemetry-text)]" />
              <span>Template Salone Donna/Unisex</span>
            </button>
          </div>
        </SurfaceCard>
      )}

      {/* 4 Navigation Tabs */}
      <div className="overflow-x-auto no-scrollbar">
        <SegmentedControl
          ariaLabel="Sezioni gestione prenotazioni e salone"
          value={activeTab}
          onChange={(val) => {
            hapticSelection();
            setActiveTab(val);
          }}
          options={[
            {
              value: 'agenda',
              label: 'Agenda Salone',
              icon: CalendarCheck,
              badge: activeBookingsForDay.length,
            },
            {
              value: 'staff',
              label: 'Staff & Poltrone',
              icon: Users,
              badge: staff.filter((s) => s.is_present_today).length,
            },
            {
              value: 'services',
              label: 'Listino Trattamenti',
              icon: Scissors,
              badge: services.length,
            },
            {
              value: 'schedule',
              label: 'Orari & Pause',
              icon: Clock,
            },
          ]}
        />
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: AGENDA SALONE (MULTI-COLUMN BY STAFF MEMBER) */}
      {/* ===================================================================== */}
      {activeTab === 'agenda' && (
        <div className="space-y-5">
          {/* Date Bar */}
          <SurfaceCard padding="sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => shiftDate(-1)}
                  className="p-2.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] transition-colors cursor-pointer"
                  aria-label="Giorno precedente"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="px-4 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-[var(--rivo-volt-text)] shrink-0" />
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)] capitalize">
                      {formattedSelectedDate}
                    </p>
                    <p className="text-[11px] font-mono tabular-nums text-[var(--text-secondary)]">
                      {dayScheduleInfo?.open
                        ? `Orario salone: ${[
                            dayScheduleInfo.morning.enabled
                              ? `${dayScheduleInfo.morning.start}–${dayScheduleInfo.morning.end}`
                              : null,
                            dayScheduleInfo.afternoon.enabled
                              ? `${dayScheduleInfo.afternoon.start}–${dayScheduleInfo.afternoon.end}`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(' / ')}`
                        : 'Giorno di chiusura settimanale'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => shiftDate(1)}
                  className="p-2.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] transition-colors cursor-pointer"
                  aria-label="Giorno successivo"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {selectedDate !== getTodayDateStr() && (
                  <button
                    type="button"
                    onClick={() => setSelectedDate(getTodayDateStr())}
                    className="px-3 py-2 rounded-xl bg-[var(--rivo-volt-bg)] border border-[var(--rivo-volt-border)] text-[var(--rivo-volt-text)] text-xs font-bold transition-colors cursor-pointer"
                  >
                    Oggi
                  </button>
                )}

                <input
                  type="date"
                  aria-label="Seleziona data agenda"
                  value={selectedDate}
                  onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs font-mono tabular-nums text-[var(--text-primary)] focus:outline-none focus:border-[var(--rivo-volt)]"
                />
              </div>
            </div>
          </SurfaceCard>

          {/* Daily KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <KpiCard
              label="Appuntamenti"
              value={`${activeBookingsForDay.length} prenotati`}
              icon={CalendarCheck}
              tone="neutral"
            />
            <KpiCard
              label="Poltrone Presenti"
              value={`${staff.filter((s) => s.is_present_today).length} / ${staff.length}`}
              icon={Users}
              tone="operational"
            />
            <KpiCard
              label="Incasso Stimato"
              value={formatEuroPrice(estimatedRevenue)}
              icon={Scissors}
              tone="volt"
            />
          </div>

          {/* Columns per Barber / Hairdresser */}
          {staff.length === 0 ? (
            <SurfaceCard padding="none">
              <EmptyState
                icon={Users}
                title="Nessuna poltrona o membro dello staff configurato"
                description="Aggiungi i tuoi barbieri o parrucchieri nella scheda 'Staff & Poltrone' oppure usa i template pronti qui sopra."
              />
            </SurfaceCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {staff.map((member) => {
                const memberBookings = bookings
                  .filter((b) => b.staff_id === member.id)
                  .sort((a, b) => a.start_time.localeCompare(b.start_time));

                return (
                  <SurfaceCard
                    key={member.id}
                    padding="none"
                    className={`flex flex-col overflow-hidden transition-all ${
                      member.is_present_today ? '' : 'opacity-75'
                    }`}
                  >
                    {/* Column Header */}
                    <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between gap-3 bg-[var(--bg-subtle)]">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-[#09090B] shrink-0 shadow-xs"
                          style={{ backgroundColor: member.color || '#f59e0b' }}
                        >
                          {member.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-[var(--text-primary)] truncate">
                              {member.name}
                            </h3>
                            <StatusBadge tone={member.is_present_today ? 'operational' : 'critical'} size="sm">
                              {member.is_present_today ? 'Presente' : 'Assente'}
                            </StatusBadge>
                          </div>
                          <p className="text-[11px] text-[var(--text-secondary)] truncate font-mono tabular-nums">
                            {member.role_title || 'Stylist / Barber'} •{' '}
                            {memberBookings.filter((b) => b.status !== 'cancelled').length} appuntamenti
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => openNewBookingModal(member.id)}
                        aria-label={`Aggiungi appuntamento per ${member.name}`}
                        className="p-2 rounded-xl bg-[var(--rivo-volt-bg)] hover:opacity-90 border border-[var(--rivo-volt-border)] text-[var(--rivo-volt-text)] transition-colors cursor-pointer shrink-0"
                        title={`Aggiungi appuntamento per ${member.name}`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Appointments List */}
                    <div className="p-3.5 space-y-2.5 flex-1">
                      {memberBookings.length === 0 ? (
                        <div className="py-10 px-4 text-center rounded-xl border border-dashed border-[var(--border-subtle)] space-y-2">
                          <Clock className="w-6 h-6 text-[var(--text-muted)] mx-auto" />
                          <p className="text-xs font-semibold text-[var(--text-secondary)]">
                            Nessun appuntamento per questa data
                          </p>
                          <button
                            type="button"
                            onClick={() => openNewBookingModal(member.id)}
                            className="text-xs font-bold text-[var(--rivo-volt-text)] hover:underline cursor-pointer"
                          >
                            + Inserisci appuntamento o pausa
                          </button>
                        </div>
                      ) : (
                        memberBookings.map((bk) => {
                          const isCancelled = bk.status === 'cancelled';
                          const isCompleted = bk.status === 'completed';
                          const isNoShow = bk.status === 'no_show';
                          const cleanPhone = (bk.customer_phone || '').replace(/[^0-9]/g, '');
                          const serviceNames = (bk.services_snapshot || []).map((s) => s.name);

                          return (
                            <div
                              key={bk.id}
                              className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                                isCancelled
                                  ? 'bg-[var(--bg-subtle)]/40 border-[var(--border-subtle)] opacity-50'
                                  : isCompleted
                                  ? 'bg-[var(--accent-operational-bg)] border-[var(--accent-operational-border)]'
                                  : isNoShow
                                  ? 'bg-[var(--accent-critical-bg)] border-[var(--accent-critical-border)]'
                                  : 'bg-[var(--bg-subtle)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                              }`}
                            >
                              {/* Time & Status Row */}
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="px-2.5 py-1 rounded-lg font-mono tabular-nums text-xs font-bold text-[#09090B]"
                                    style={{ backgroundColor: member.color || '#f59e0b' }}
                                  >
                                    {bk.start_time} – {bk.end_time}
                                  </span>
                                  <span className="text-[11px] font-mono tabular-nums font-semibold text-[var(--text-secondary)]">
                                    {bk.total_duration_minutes} min
                                  </span>
                                </div>

                                <StatusBadge
                                  tone={
                                    bk.status === 'confirmed'
                                      ? 'warning'
                                      : bk.status === 'completed'
                                      ? 'operational'
                                      : bk.status === 'no_show'
                                      ? 'critical'
                                      : 'neutral'
                                  }
                                  size="sm"
                                >
                                  {bk.status === 'confirmed'
                                    ? 'Confermato'
                                    : bk.status === 'completed'
                                    ? 'Completato'
                                    : bk.status === 'no_show'
                                    ? 'No-Show'
                                    : 'Annullato'}
                                </StatusBadge>
                              </div>

                              {/* Customer & Services */}
                              <div>
                                <div className="flex items-center justify-between gap-2">
                                  <h4 className="text-sm font-bold text-[var(--text-primary)] truncate">
                                    {bk.customer_name}
                                  </h4>
                                  <span className="text-xs font-mono tabular-nums font-bold text-[var(--rivo-volt-text)] shrink-0">
                                    {formatEuroPrice(bk.total_price)}
                                  </span>
                                </div>
                                <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
                                  {serviceNames.join(' + ') || 'Trattamento in salone'}
                                </p>
                                {bk.customer_phone && bk.customer_phone !== '-' && (
                                  <p className="text-[11px] text-[var(--text-muted)] font-mono tabular-nums flex items-center gap-1 mt-1">
                                    <Phone className="w-3 h-3" />
                                    <span>{bk.customer_phone}</span>
                                  </p>
                                )}
                                {bk.customer_notes && (
                                  <p className="text-[11px] text-[var(--accent-warning-text)] bg-[var(--accent-warning-bg)] border border-[var(--accent-warning-border)] rounded-lg px-2.5 py-1.5 mt-1.5 flex items-start gap-1.5">
                                    <MessageCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                    <span>{bk.customer_notes}</span>
                                  </p>
                                )}
                              </div>

                              {/* 1-Tap Actions */}
                              {bk.status !== 'cancelled' && (
                                <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-wrap items-center gap-1.5">
                                  {bk.status !== 'completed' && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateBookingStatus(bk.id, 'completed')}
                                      className="px-2.5 py-1.5 rounded-lg bg-[var(--accent-operational-bg)] hover:opacity-90 border border-[var(--accent-operational-border)] text-[var(--accent-operational-text)] text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                    >
                                      <Check className="w-3 h-3" />
                                      <span>Completa</span>
                                    </button>
                                  )}

                                  {cleanPhone.length >= 6 && (
                                    <a
                                      href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                                        `Ciao ${bk.customer_name}! Ti ricordiamo il tuo appuntamento del ${selectedDate} alle ore ${bk.start_time} con ${member.name}. A presto!`
                                      )}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-2.5 py-1.5 rounded-lg bg-[var(--accent-operational-bg)] hover:opacity-90 border border-[var(--accent-operational-border)] text-[var(--accent-operational-text)] text-[11px] font-bold flex items-center gap-1"
                                    >
                                      <MessageCircle className="w-3 h-3" />
                                      <span>WhatsApp</span>
                                    </a>
                                  )}

                                  {bk.status === 'confirmed' && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateBookingStatus(bk.id, 'no_show')}
                                      className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--accent-critical-bg)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--accent-critical-text)] text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                    >
                                      <Ban className="w-3 h-3" />
                                      <span>No-Show</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleUpdateBookingStatus(bk.id, 'cancelled')}
                                    className="ml-auto px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--accent-critical-bg)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--accent-critical-text)] text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                  >
                                    <X className="w-3 h-3" />
                                    <span>Annulla</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </SurfaceCard>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: STAFF & POLTRONE */}
      {/* ===================================================================== */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <SurfaceCard padding="md" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Poltrone, Barbieri e Hair Stylist
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Attiva o disattiva in 1 tap chi è presente oggi e scegli quali trattamenti esegue ciascun
                professionista.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openEditStaffModal()}
              className="px-4 py-2.5 rounded-xl bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Aggiungi Poltrona / Staff</span>
            </button>
          </SurfaceCard>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staff.map((member) => {
              const assignedCount = member.service_ids?.length || 0;
              return (
                <SurfaceCard key={member.id} padding="md" className="flex flex-col justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base text-[#09090B] shadow-xs shrink-0"
                          style={{ backgroundColor: member.color || '#f59e0b' }}
                        >
                          {member.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-bold text-[var(--text-primary)] truncate">
                            {member.name}
                          </h3>
                          <p className="text-xs text-[var(--text-secondary)] truncate">
                            {member.role_title || 'Hair Stylist / Barber'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleStaffPresence(member)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer shrink-0 ${
                          member.is_present_today
                            ? 'bg-[var(--accent-operational-bg)] border-[var(--accent-operational-border)] text-[var(--accent-operational-text)]'
                            : 'bg-[var(--accent-critical-bg)] border-[var(--accent-critical-border)] text-[var(--accent-critical-text)]'
                        }`}
                      >
                        {member.is_present_today ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Presente</span>
                          </>
                        ) : (
                          <>
                            <UserX className="w-3.5 h-3.5" />
                            <span>Assente</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--text-muted)] block mb-1">
                        Competenze &amp; Trattamenti abilitati
                      </span>
                      {assignedCount === 0 ? (
                        <span className="text-xs font-semibold text-[var(--accent-operational-text)] flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <span>Esegue tutti i trattamenti del listino ({services.length})</span>
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {services
                            .filter((s) => member.service_ids.includes(s.id))
                            .map((s) => (
                              <span
                                key={s.id}
                                className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                              >
                                {s.name}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => openEditStaffModal(member)}
                      className="px-3 py-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Modifica</span>
                    </button>

                    {pendingDeleteStaffId === member.id ? (
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDeleteStaff(member.id)}
                          className="px-2.5 py-2 rounded-xl bg-[#B91C1C] text-white text-xs font-bold cursor-pointer"
                        >
                          Conferma
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDeleteStaffId(null)}
                          className="px-2 py-2 rounded-xl bg-[var(--bg-subtle)] text-[var(--text-secondary)] text-xs font-semibold cursor-pointer"
                        >
                          Annulla
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDeleteStaff(member.id)}
                        aria-label={`Elimina ${member.name}`}
                        className="p-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--accent-critical-bg)] text-[var(--text-muted)] hover:text-[var(--accent-critical-text)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
                        title="Elimina membro staff"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </SurfaceCard>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: LISTINO TRATTAMENTI & TEMPI */}
      {/* ===================================================================== */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <SurfaceCard padding="md" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Listino Trattamenti, Durate &amp; Prezzi
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                La durata di ogni trattamento determina automaticamente gli slot liberi mostrati al cliente
                quando prenota.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => openEditServiceModal()}
                className="px-4 py-2.5 rounded-xl bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nuovo Trattamento</span>
              </button>
            </div>
          </SurfaceCard>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {services.map((svc) => {
              const catInfo = SERVICE_CATEGORIES.find((c) => c.id === svc.category);
              return (
                <SurfaceCard
                  key={svc.id}
                  padding="md"
                  className="flex flex-col justify-between gap-3 hover:border-[var(--border-strong)] transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <StatusBadge tone="volt" size="sm">
                        {catInfo?.label || svc.category}
                      </StatusBadge>
                      <span className="text-xs font-mono tabular-nums font-bold text-[var(--text-secondary)] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[var(--rivo-volt-text)]" />
                        {svc.duration_minutes} min
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-[var(--text-primary)] leading-snug">
                        {svc.name}
                      </h3>
                      <span className="text-base font-mono tabular-nums font-bold text-[var(--rivo-volt-text)] shrink-0">
                        {formatEuroPrice(svc.price)}
                      </span>
                    </div>

                    {svc.description && (
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        {svc.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => openEditServiceModal(svc)}
                      className="px-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Modifica</span>
                    </button>

                    {pendingDeleteServiceId === svc.id ? (
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDeleteService(svc.id)}
                          className="px-2.5 py-2 rounded-xl bg-[#B91C1C] text-white text-xs font-bold cursor-pointer"
                        >
                          Conferma
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDeleteServiceId(null)}
                          className="px-2 py-2 rounded-xl bg-[var(--bg-subtle)] text-[var(--text-secondary)] text-xs font-semibold cursor-pointer"
                        >
                          Annulla
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDeleteService(svc.id)}
                        aria-label={`Elimina trattamento ${svc.name}`}
                        className="p-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--accent-critical-bg)] text-[var(--text-muted)] hover:text-[var(--accent-critical-text)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
                        title="Elimina trattamento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </SurfaceCard>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: ORARI DI APERTURA & PAUSE */}
      {/* ===================================================================== */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          <SurfaceCard padding="md" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Orari Settimanali del Salone &amp; Turni (Mattina / Pomeriggio)
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Configura i giorni di apertura e l&apos;eventuale pausa pranzo. Il cliente vedrà solo gli slot
                che rientrano negli orari di apertura.
              </p>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveSchedule}
              className="px-5 py-2.5 rounded-xl bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Salvataggio...' : 'Salva Orari Settimanali'}</span>
            </button>
          </SurfaceCard>

          <div className="space-y-2.5">
            {DAY_LABELS_IT.map((dayMeta) => {
              const dayKey = dayMeta.key;
              const dayCfg = schedule[dayKey] || {
                open: false,
                morning: { enabled: true, start: '09:00', end: '13:00' },
                afternoon: { enabled: true, start: '14:30', end: '19:30' },
              };

              return (
                <SurfaceCard
                  key={dayKey}
                  padding="sm"
                  className={`flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                    dayCfg.open ? '' : 'opacity-75'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-[180px]">
                    <button
                      type="button"
                      onClick={() =>
                        updateDaySchedule(dayKey, (prev) => ({
                          ...prev,
                          open: !prev.open,
                          morning: {
                            ...prev.morning,
                            enabled: !prev.open ? true : prev.morning.enabled,
                          },
                        }))
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        dayCfg.open
                          ? 'bg-[var(--accent-operational-bg)] border-[var(--accent-operational-border)] text-[var(--accent-operational-text)]'
                          : 'bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--text-muted)]'
                      }`}
                    >
                      {dayCfg.open ? 'Aperto' : 'Chiuso'}
                    </button>
                    <span className="text-sm font-bold text-[var(--text-primary)]">{dayMeta.full}</span>
                  </div>

                  {dayCfg.open ? (
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Turno Mattina */}
                      <div className="flex flex-wrap items-center gap-2 bg-[var(--bg-subtle)] px-3 py-2 rounded-xl border border-[var(--border-subtle)]">
                        <input
                          type="checkbox"
                          aria-label={`Abilita turno mattina ${dayMeta.full}`}
                          checked={dayCfg.morning.enabled}
                          onChange={(e) =>
                            updateDaySchedule(dayKey, (prev) => ({
                              ...prev,
                              morning: { ...prev.morning, enabled: e.target.checked },
                            }))
                          }
                        />
                        <span className="text-[11px] font-bold text-[var(--text-secondary)]">Mattina:</span>
                        <input
                          type="time"
                          aria-label={`Inizio mattina ${dayMeta.full}`}
                          disabled={!dayCfg.morning.enabled}
                          value={dayCfg.morning.start}
                          onChange={(e) =>
                            updateDaySchedule(dayKey, (prev) => ({
                              ...prev,
                              morning: { ...prev.morning, start: e.target.value },
                            }))
                          }
                          className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-2 py-1 text-xs font-mono tabular-nums text-[var(--text-primary)] disabled:opacity-40"
                        />
                        <span className="text-[var(--text-muted)]">–</span>
                        <input
                          type="time"
                          aria-label={`Fine mattina ${dayMeta.full}`}
                          disabled={!dayCfg.morning.enabled}
                          value={dayCfg.morning.end}
                          onChange={(e) =>
                            updateDaySchedule(dayKey, (prev) => ({
                              ...prev,
                              morning: { ...prev.morning, end: e.target.value },
                            }))
                          }
                          className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-2 py-1 text-xs font-mono tabular-nums text-[var(--text-primary)] disabled:opacity-40"
                        />
                      </div>

                      {/* Turno Pomeriggio */}
                      <div className="flex flex-wrap items-center gap-2 bg-[var(--bg-subtle)] px-3 py-2 rounded-xl border border-[var(--border-subtle)]">
                        <input
                          type="checkbox"
                          aria-label={`Abilita turno pomeriggio ${dayMeta.full}`}
                          checked={dayCfg.afternoon.enabled}
                          onChange={(e) =>
                            updateDaySchedule(dayKey, (prev) => ({
                              ...prev,
                              afternoon: { ...prev.afternoon, enabled: e.target.checked },
                            }))
                          }
                        />
                        <span className="text-[11px] font-bold text-[var(--text-secondary)]">
                          Pomeriggio:
                        </span>
                        <input
                          type="time"
                          aria-label={`Inizio pomeriggio ${dayMeta.full}`}
                          disabled={!dayCfg.afternoon.enabled}
                          value={dayCfg.afternoon.start}
                          onChange={(e) =>
                            updateDaySchedule(dayKey, (prev) => ({
                              ...prev,
                              afternoon: { ...prev.afternoon, start: e.target.value },
                            }))
                          }
                          className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-2 py-1 text-xs font-mono tabular-nums text-[var(--text-primary)] disabled:opacity-40"
                        />
                        <span className="text-[var(--text-muted)]">–</span>
                        <input
                          type="time"
                          aria-label={`Fine pomeriggio ${dayMeta.full}`}
                          disabled={!dayCfg.afternoon.enabled}
                          value={dayCfg.afternoon.end}
                          onChange={(e) =>
                            updateDaySchedule(dayKey, (prev) => ({
                              ...prev,
                              afternoon: { ...prev.afternoon, end: e.target.value },
                            }))
                          }
                          className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-2 py-1 text-xs font-mono tabular-nums text-[var(--text-primary)] disabled:opacity-40"
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-[var(--text-muted)]">
                      Salone chiuso per l&apos;intera giornata
                    </span>
                  )}
                </SurfaceCard>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: NUOVO APPUNTAMENTO MANUALE / WALK-IN */}
      {/* ===================================================================== */}
      {showBookingModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-booking-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-backdrop)] backdrop-blur-sm animate-fade-in overscroll-contain"
        >
          <div className="w-full max-w-lg rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 id="new-booking-modal-title" className="text-lg font-bold text-[var(--text-primary)]">
                  Inserisci Appuntamento in Agenda
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Data selezionata:{' '}
                  <strong className="text-[var(--text-primary)] font-mono tabular-nums">{selectedDate}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBookingModal(false)}
                aria-label="Chiudi modale nuovo appuntamento"
                className="p-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualBooking} className="space-y-4">
              {/* Staff picker */}
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] block mb-1.5">
                  Poltrona / Professionista
                </label>
                <select
                  value={bookingFormStaffId}
                  onChange={(e) => setBookingFormStaffId(e.target.value)}
                  className={BOOKING_INPUT_CLASS}
                >
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role_title || 'Stylist'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Services picker */}
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] block mb-1.5">
                  Trattamenti da eseguire
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-1">
                  {services.map((svc) => {
                    const checked = bookingFormServiceIds.includes(svc.id);
                    return (
                      <button
                        key={svc.id}
                        type="button"
                        onClick={() =>
                          setBookingFormServiceIds((prev) =>
                            checked ? prev.filter((id) => id !== svc.id) : [...prev, svc.id]
                          )
                        }
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          checked
                            ? 'bg-[var(--rivo-volt-bg)] border-[var(--rivo-volt)] text-[var(--text-primary)]'
                            : 'bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 text-xs font-bold">
                          <span className="truncate">{svc.name}</span>
                          <span className="text-[var(--rivo-volt-text)] font-mono tabular-nums shrink-0">
                            {formatEuroPrice(svc.price)}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono tabular-nums text-[var(--text-muted)]">
                          {svc.duration_minutes} min
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time picker with quick available slots */}
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] block mb-1.5">
                  Orario di inizio
                </label>
                <input
                  type="time"
                  value={bookingFormTime}
                  onChange={(e) => setBookingFormTime(e.target.value)}
                  className={`${BOOKING_INPUT_CLASS} font-mono tabular-nums mb-2`}
                />
                {manualModalAvailableSlots.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                    {manualModalAvailableSlots.map((slot) => (
                      <button
                        key={slot.start_time}
                        type="button"
                        onClick={() => setBookingFormTime(slot.start_time)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono tabular-nums font-bold cursor-pointer transition-colors ${
                          bookingFormTime === slot.start_time
                            ? 'bg-[var(--rivo-volt)] text-[#09090B]'
                            : 'bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                        }`}
                      >
                        {slot.start_time}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Customer Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[var(--text-secondary)] block mb-1">
                    Nome Cliente (o &ldquo;Pausa&rdquo;) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Es. Marco Rossi"
                    value={bookingFormCustomerName}
                    onChange={(e) => setBookingFormCustomerName(e.target.value)}
                    className={BOOKING_INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--text-secondary)] block mb-1">
                    Telefono / WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="Es. 333 1234567"
                    value={bookingFormCustomerPhone}
                    onChange={(e) => setBookingFormCustomerPhone(e.target.value)}
                    className={`${BOOKING_INPUT_CLASS} font-mono tabular-nums`}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] block mb-1">
                  Note (opzionale)
                </label>
                <input
                  type="text"
                  placeholder="Es. Sfumatura alta a pelle, cliente abituale"
                  value={bookingFormNotes}
                  onChange={(e) => setBookingFormNotes(e.target.value)}
                  className={BOOKING_INPUT_CLASS}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={saving || !bookingFormCustomerName.trim() || bookingFormServiceIds.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] disabled:opacity-40 text-[#09090B] font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  {saving ? 'Salvataggio...' : 'Salva Appuntamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: AGGIUNGI / MODIFICA STAFF */}
      {/* ===================================================================== */}
      {showStaffModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="staff-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-backdrop)] backdrop-blur-sm animate-fade-in overscroll-contain"
        >
          <div className="w-full max-w-md rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 id="staff-modal-title" className="text-lg font-bold text-[var(--text-primary)]">
                {editingStaffId ? 'Modifica Professionista' : 'Nuova Poltrona / Professionista'}
              </h3>
              <button
                type="button"
                onClick={() => setShowStaffModal(false)}
                aria-label="Chiudi modale staff"
                className="p-2 rounded-xl bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] block mb-1">
                  Nome (visibile ai clienti) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Es. Marco"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className={BOOKING_INPUT_CLASS}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] block mb-1">
                  Ruolo / Specializzazione
                </label>
                <input
                  type="text"
                  placeholder="Es. Master Barber / Colorist"
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value)}
                  className={BOOKING_INPUT_CLASS}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] block mb-1.5">
                  Colore Poltrona in Agenda
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {STAFF_COLOR_PALETTE.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      aria-label={`Seleziona colore ${hex}`}
                      onClick={() => setStaffColor(hex)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer ${
                        staffColor === hex ? 'scale-110 border-[var(--text-primary)]' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={staffAllServices}
                    onChange={(e) => setStaffAllServices(e.target.checked)}
                    className="rounded border-[var(--border-strong)]"
                  />
                  <span>Esegue tutti i trattamenti del listino</span>
                </label>

                {!staffAllServices && (
                  <div className="max-h-40 overflow-y-auto space-y-1.5 p-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                    {services.map((svc) => {
                      const checked = staffServiceIds.includes(svc.id);
                      return (
                        <label
                          key={svc.id}
                          className="flex items-center gap-2 text-xs text-[var(--text-primary)] cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setStaffServiceIds((prev) =>
                                checked ? prev.filter((id) => id !== svc.id) : [...prev, svc.id]
                              )
                            }
                          />
                          <span>{svc.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="px-4 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={saving || !staffName.trim()}
                  className="px-5 py-2 rounded-xl bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] disabled:opacity-40 text-[#09090B] font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  Salva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: AGGIUNGI / MODIFICA TRATTAMENTO */}
      {/* ===================================================================== */}
      {showServiceModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="service-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-backdrop)] backdrop-blur-sm animate-fade-in overscroll-contain"
        >
          <div className="w-full max-w-md rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 id="service-modal-title" className="text-lg font-bold text-[var(--text-primary)]">
                {editingServiceId ? 'Modifica Trattamento' : 'Nuovo Trattamento'}
              </h3>
              <button
                type="button"
                onClick={() => setShowServiceModal(false)}
                aria-label="Chiudi modale trattamento"
                className="p-2 rounded-xl bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] block mb-1">
                  Nome del Trattamento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Es. Taglio Uomo + Barba Completa"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className={BOOKING_INPUT_CLASS}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] block mb-1">
                  Categoria
                </label>
                <select
                  value={serviceCategory}
                  onChange={(e) => setServiceCategory(e.target.value as ServiceCategorySlug)}
                  className={BOOKING_INPUT_CLASS}
                >
                  {SERVICE_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[var(--text-secondary)] block mb-1">
                    Durata (minuti) *
                  </label>
                  <select
                    value={serviceDuration}
                    onChange={(e) => setServiceDuration(Number(e.target.value))}
                    className={`${BOOKING_INPUT_CLASS} font-mono tabular-nums`}
                  >
                    {[15, 20, 25, 30, 45, 50, 60, 75, 90, 120].map((min) => (
                      <option key={min} value={min}>
                        {min} minuti
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--text-secondary)] block mb-1">
                    Prezzo (€) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="25"
                    value={servicePriceEur}
                    onChange={(e) => setServicePriceEur(e.target.value)}
                    className={`${BOOKING_INPUT_CLASS} font-mono tabular-nums`}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] block mb-1">
                  Descrizione breve (opzionale)
                </label>
                <input
                  type="text"
                  placeholder="Es. Shampoo, taglio sartoriale e panno caldo"
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                  className={BOOKING_INPUT_CLASS}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="px-4 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={saving || !serviceName.trim()}
                  className="px-5 py-2 rounded-xl bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] disabled:opacity-40 text-[#09090B] font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  Salva Trattamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
