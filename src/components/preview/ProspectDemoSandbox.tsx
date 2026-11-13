'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BedDouble,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  Copy,
  CreditCard,
  Eye,
  Gift,
  Lock,
  MapPin,
  MessageSquare,
  Minus,
  Monitor,
  Phone,
  Plus,
  Receipt,
  RefreshCw,
  Scissors,
  Send,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Star,
  Tag,
  TrendingUp,
  User,
  Users,
  Utensils,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import {
  buildVerticalSandboxData,
  slugifyBusinessName,
  type DemoMenuItem,
  type DemoVerticalMode,
  type PublicProspectPreviewDTO,
  type PublicRecommendedModuleDTO,
} from '@/lib/outreach/preview';

type ViewMode = 'client' | 'owner';
type OwnerItemKind = 'order' | 'waiter' | 'bill' | 'booking' | 'hospitality' | 'retail';

interface OwnerQueueItem {
  id: string;
  title: string;
  subtitle: string;
  badgeText: string;
  timeLabel: string;
  amountEur?: number;
  statusIndex: number;
  statusStages: string[];
  isFromClientDemo: boolean;
  kind: OwnerItemKind;
}

interface PrivateFeedbackItem {
  id: string;
  stars: number;
  reason: string;
  message: string;
  timeLabel: string;
  isFromClientDemo: boolean;
}

interface FoodCartEntry {
  item: DemoMenuItem;
  guest: 'Tu' | 'Marco';
  qty: number;
}

interface VerticalMeta {
  label: string;
  contextBadge: string;
  ownerTitle: string;
  ownerSubtitle: string;
  tabs: Array<{ id: string; label: string }>;
}

const VERTICAL_META: Record<DemoVerticalMode, VerticalMeta> = {
  food: {
    label: 'Ristorazione & Bar',
    contextBadge: 'Tavolo 07 • NFC & QR',
    ownerTitle: 'Cucina & Sala Live',
    ownerSubtitle: 'Comande condivise al tavolo, chiamate cameriere e conti smart in tempo reale.',
    tabs: [
      { id: 'menu', label: 'Menù & Carrello' },
      { id: 'service', label: 'Servizi Tavolo' },
      { id: 'engage', label: 'Ruota & Recensioni' },
    ],
  },
  beauty: {
    label: 'Salone & Benessere',
    contextBadge: 'Poltrone • Prenotazione Smart',
    ownerTitle: 'Agenda Poltrone Live',
    ownerSubtitle: 'Nuovi appuntamenti scelti dal cliente, fidelity card e feedback privati.',
    tabs: [
      { id: 'booking', label: 'Prenota Poltrona' },
      { id: 'loyalty', label: 'Fidelity Card' },
      { id: 'engage', label: 'Ruota & Recensioni' },
    ],
  },
  hospitality: {
    label: 'Ospitalità & Strutture',
    contextBadge: 'Camera 104 • Guest Hub',
    ownerTitle: 'Desk Reception Live',
    ownerSubtitle: 'Richieste dirette dalla camera, Wi-Fi 1-tap e guida locale personalizzata.',
    tabs: [
      { id: 'hub', label: 'Hub & Wi-Fi' },
      { id: 'room', label: 'Servizi Camera' },
      { id: 'guide', label: 'Guida & Recensioni' },
    ],
  },
  retail: {
    label: 'Negozio & Boutique',
    contextBadge: 'In-Store • Catalogo Smart',
    ownerTitle: 'Banco & Stock Live',
    ownerSubtitle: 'Richieste taglia verso il commesso, pass VIP clienti e premi in cassa.',
    tabs: [
      { id: 'catalog', label: 'Catalogo & Taglie' },
      { id: 'loyalty', label: 'Fidelity VIP' },
      { id: 'engage', label: 'Ruota & Recensioni' },
    ],
  },
};

const MODULE_STATUS_BADGE: Record<
  PublicRecommendedModuleDTO['status'],
  { label: string; className: string }
> = {
  confirmed_opportunity: {
    label: 'Alta affinità',
    className: 'bg-[#BFFF00]/15 text-[#BFFF00] border-[#BFFF00]/30',
  },
  plausible_opportunity: {
    label: 'Consigliato',
    className: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
  },
  not_verifiable: {
    label: 'Su misura',
    className: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  },
};

const PREFERRED_TIME_OPTIONS = [
  'Mattina (09:30 - 12:30)',
  'Pomeriggio (14:30 - 17:30)',
  'Sera (18:00 - 20:00)',
  'Qualsiasi orario',
];

const FEEDBACK_QUICK_REASONS = [
  'Attesa leggermente lunga',
  'Dettaglio servizio da migliorare',
  'Comunicazione non chiara',
];

function formatEur(value: number): string {
  return `€ ${value.toFixed(2).replace('.', ',')}`;
}

function getCurrentTimeLabel(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function buildBaselineOwnerItems(
  vertical: DemoVerticalMode,
  sandboxData: ReturnType<typeof buildVerticalSandboxData>
): OwnerQueueItem[] {
  switch (vertical) {
    case 'beauty':
      return [
        {
          id: 'base-b1',
          title: 'Poltrona 01 • Giulia R.',
          subtitle: `${sandboxData.beautyServices[0]?.name || 'Taglio & Styling'} con ${sandboxData.beautyStaff[0]?.name || 'Specialista'}`,
          badgeText: '11:00',
          timeLabel: 'Oggi',
          amountEur: sandboxData.beautyServices[0]?.price ?? 35,
          statusIndex: 1,
          statusStages: ['In attesa', 'Confermato', 'Completato'],
          isFromClientDemo: false,
          kind: 'booking',
        },
        {
          id: 'base-b2',
          title: 'Poltrona 02 • Alessandro P.',
          subtitle: `${sandboxData.beautyServices[1]?.name || 'Trattamento Signature'} con ${sandboxData.beautyStaff[1]?.name || 'Team'}`,
          badgeText: '15:30',
          timeLabel: 'Oggi',
          amountEur: sandboxData.beautyServices[1]?.price ?? 45,
          statusIndex: 0,
          statusStages: ['In attesa', 'Confermato', 'Completato'],
          isFromClientDemo: false,
          kind: 'booking',
        },
      ];
    case 'hospitality':
      return [
        {
          id: 'base-h1',
          title: 'Camera 204 • Check-in VIP',
          subtitle: 'Richiesto kit cuscini aggiuntivi per le ore 19:00',
          badgeText: 'Housekeeping',
          timeLabel: '14 min fa',
          statusIndex: 1,
          statusStages: ['Nuova richiesta', 'Presa in carico', 'Completato'],
          isFromClientDemo: false,
          kind: 'hospitality',
        },
        {
          id: 'base-h2',
          title: 'Camera 109 • Transfer',
          subtitle: 'Conferma taxi privato stazione per domani ore 10:00',
          badgeText: 'Reception',
          timeLabel: '32 min fa',
          statusIndex: 0,
          statusStages: ['Nuova richiesta', 'Presa in carico', 'Completato'],
          isFromClientDemo: false,
          kind: 'hospitality',
        },
      ];
    case 'retail':
      return [
        {
          id: 'base-r1',
          title: `Camerino 01 • ${sandboxData.retailProducts[0]?.name || 'Articolo'}`,
          subtitle: `Richiesta prova Taglia ${sandboxData.retailProducts[0]?.inStockSizes[0] || 'M'}`,
          badgeText: 'In store',
          timeLabel: '6 min fa',
          amountEur: sandboxData.retailProducts[0]?.price ?? 149,
          statusIndex: 1,
          statusStages: ['Da portare', 'In camerino', 'Completato'],
          isFromClientDemo: false,
          kind: 'retail',
        },
        {
          id: 'base-r2',
          title: `Banco • ${sandboxData.retailProducts[1]?.name || 'Articolo'}`,
          subtitle: `Verifica disponibilità Taglia ${sandboxData.retailProducts[1]?.inStockSizes[0] || '42'}`,
          badgeText: 'Banco',
          timeLabel: '19 min fa',
          amountEur: sandboxData.retailProducts[1]?.price ?? 129,
          statusIndex: 0,
          statusStages: ['Da portare', 'In camerino', 'Completato'],
          isFromClientDemo: false,
          kind: 'retail',
        },
      ];
    case 'food':
    default:
      return [
        {
          id: 'base-f1',
          title: 'Tavolo 04 • Comanda #108',
          subtitle: `2x ${sandboxData.foodMenu[0]?.name || 'Piatto del Giorno'}, 1x ${sandboxData.foodMenu[3]?.name || 'Acqua'}`,
          badgeText: 'Cucina',
          timeLabel: '4 min fa',
          amountEur: (sandboxData.foodMenu[0]?.price ?? 12) * 2 + (sandboxData.foodMenu[3]?.price ?? 5),
          statusIndex: 0,
          statusStages: ['In preparazione', 'Pronto', 'Servito'],
          isFromClientDemo: false,
          kind: 'order',
        },
        {
          id: 'base-f2',
          title: 'Tavolo 02 • Conto Smart',
          subtitle: 'Richiesto conto diviso per 2 ospiti (carta al tavolo)',
          badgeText: 'Sala',
          timeLabel: '12 min fa',
          amountEur: 36,
          statusIndex: 1,
          statusStages: ['In attesa', 'Gestito'],
          isFromClientDemo: false,
          kind: 'bill',
        },
      ];
  }
}

function VerticalGlyph({ vertical, className }: { vertical: DemoVerticalMode; className?: string }) {
  switch (vertical) {
    case 'beauty':
      return <Scissors className={className} />;
    case 'hospitality':
      return <BedDouble className={className} />;
    case 'retail':
      return <ShoppingBag className={className} />;
    case 'food':
    default:
      return <Utensils className={className} />;
  }
}

interface WheelAndReviewsProps {
  businessName: string;
  wheelPrizes: Array<{ label: string; code: string }>;
  showWheel?: boolean;
  onTrackModule: (moduleName: string) => void;
  onPrivateFeedbackSubmit: (stars: number, reason: string, message: string) => void;
}

function WheelAndReviewsSection({
  businessName,
  wheelPrizes,
  showWheel = true,
  onTrackModule,
  onPrivateFeedbackSubmit,
}: WheelAndReviewsProps) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wonPrize, setWonPrize] = useState<{ label: string; code: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const [selectedStars, setSelectedStars] = useState<number>(0);
  const [hoverStars, setHoverStars] = useState<number>(0);
  const [feedbackReason, setFeedbackReason] = useState<string>(FEEDBACK_QUICK_REASONS[0]);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [feedbackSent, setFeedbackSent] = useState<boolean>(false);

  const spinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayPrizes = useMemo(() => wheelPrizes.slice(0, 4), [wheelPrizes]);

  useEffect(() => {
    return () => {
      if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    };
  }, []);

  const handleSpin = () => {
    if (isSpinning || displayPrizes.length === 0) return;
    onTrackModule('Ruota Premi');
    setIsSpinning(true);
    setWonPrize(null);

    const prizeIdx = Math.floor(Math.random() * displayPrizes.length);
    const sliceDeg = 360 / displayPrizes.length;
    const targetSliceCenter = prizeIdx * sliceDeg + sliceDeg / 2;
    const extraTurns = 5 * 360;
    const nextRotation = rotation + extraTurns + (360 - ((rotation + targetSliceCenter) % 360));
    setRotation(nextRotation);

    spinTimerRef.current = setTimeout(() => {
      setIsSpinning(false);
      setWonPrize(displayPrizes[prizeIdx]);
    }, 3100);
  };

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1800);
  };

  const handleStarClick = (starValue: number) => {
    setSelectedStars(starValue);
    setFeedbackSent(false);
    onTrackModule('Google Review Shield');
  };

  const handleSendPrivateFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStars < 1 || selectedStars > 3) return;
    const finalMsg =
      feedbackMessage.trim() ||
      `Segnalazione privata (${selectedStars}/5 stelle): ${feedbackReason}.`;
    onPrivateFeedbackSubmit(selectedStars, feedbackReason, finalMsg);
    setFeedbackSent(true);
    setFeedbackMessage('');
  };

  const activeStars = hoverStars || selectedStars;

  return (
    <div className="space-y-4">
      {showWheel && (
        <div className="rounded-2xl bg-[#121214] border border-[#27272A] p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#BFFF00]/15 border border-[#BFFF00]/30 flex items-center justify-center">
                <Gift className="w-3.5 h-3.5 text-[#BFFF00]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#FAFAFA]">Ruota Premi Istantanea</h4>
                <p className="text-[11px] text-[#A1A1AA]">Un giro omaggio dopo la visita</p>
              </div>
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#18181B] text-[#BFFF00] border border-[#BFFF00]/25">
              Demo
            </span>
          </div>

          <div className="flex flex-col items-center py-2">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <div className="absolute -top-2 z-20 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[14px] border-l-transparent border-r-transparent border-t-[#BFFF00] drop-shadow" />
              <div
                className="w-40 h-40 rounded-full border-4 border-[#27272A] shadow-inner relative overflow-hidden transition-transform duration-[3000ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  background:
                    'conic-gradient(#18181B 0deg 90deg, #27272A 90deg 180deg, #1E2810 180deg 270deg, #27272A 270deg 360deg)',
                }}
              >
                {displayPrizes.map((prize, idx) => {
                  const angle = idx * (360 / displayPrizes.length) + 180 / displayPrizes.length;
                  return (
                    <div
                      key={prize.code}
                      className="absolute inset-0 flex items-start justify-center pt-4 pointer-events-none"
                      style={{ transform: `rotate(${angle}deg)` }}
                    >
                      <span className="text-[9px] font-bold text-[#FAFAFA] text-center leading-tight max-w-[62px] px-1">
                        {prize.code}
                      </span>
                    </div>
                  );
                })}
                <div className="absolute inset-0 m-auto w-9 h-9 rounded-full bg-[#09090B] border-2 border-[#BFFF00] flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-[#BFFF00]" />
                </div>
              </div>
            </div>

            {wonPrize ? (
              <div className="w-full mt-2 p-3 rounded-xl bg-[#BFFF00]/10 border border-[#BFFF00]/35 text-center space-y-2">
                <p className="text-xs font-bold text-[#BFFF00]">Hai vinto: {wonPrize.label}</p>
                <div className="flex items-center justify-center gap-2">
                  <code className="px-2.5 py-1 rounded-lg bg-[#09090B] border border-[#27272A] text-xs font-mono text-[#FAFAFA]">
                    {wonPrize.code}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopyCoupon(wonPrize.code)}
                    className="px-2.5 py-1 rounded-lg bg-[#BFFF00] text-[#09090B] text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? 'Copiato' : 'Copia'}</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleSpin}
                  className="text-[11px] text-[#A1A1AA] hover:text-[#FAFAFA] underline cursor-pointer"
                >
                  Gira di nuovo
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSpin}
                disabled={isSpinning}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#BFFF00] hover:bg-[#BFFF00]/90 disabled:opacity-60 text-[#09090B] text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSpinning ? 'animate-spin' : ''}`} />
                <span>{isSpinning ? 'Estrazione in corso...' : 'Gira la Ruota Premi'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Google Review Shield */}
      <div className="rounded-2xl bg-[#121214] border border-[#27272A] p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#FAFAFA]">Google Review Shield</h4>
            <p className="text-[11px] text-[#A1A1AA]">
              Come valuti l’esperienza da {businessName}?
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 py-1">
          {[1, 2, 3, 4, 5].map((star) => {
            const filled = star <= activeStars;
            return (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverStars(star)}
                onMouseLeave={() => setHoverStars(0)}
                onClick={() => handleStarClick(star)}
                aria-label={`Valuta ${star} stelle`}
                className="p-1.5 rounded-lg hover:bg-[#18181B] transition-transform active:scale-95 cursor-pointer"
              >
                <Star
                  className={`w-6 h-6 transition-colors ${
                    filled ? 'text-[#BFFF00] fill-[#BFFF00]' : 'text-zinc-600'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {selectedStars >= 4 && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Valutazione {selectedStars}★ — Redirect Google Maps Attivo</span>
            </div>
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              Con 4 o 5 stelle, RIVO apre in automatico la scheda Google di{' '}
              <strong className="text-[#FAFAFA]">{businessName}</strong> per trasformare i clienti
              soddisfatti in recensioni pubbliche verificate.
            </p>
            <div className="px-3 py-2 rounded-lg bg-[#09090B] border border-[#27272A] flex items-center justify-between text-[11px]">
              <span className="text-[#A1A1AA] truncate">
                g.page/r/{slugifyBusinessName(businessName)}/review
              </span>
              <span className="text-[#BFFF00] font-mono font-semibold shrink-0 ml-2">
                Anteprima
              </span>
            </div>
          </div>
        )}

        {selectedStars >= 1 && selectedStars <= 3 && !feedbackSent && (
          <form
            onSubmit={handleSendPrivateFeedback}
            className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2.5"
          >
            <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>Scudo Attivo: Feedback Privato al Titolare</span>
            </div>
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              Sotto le 4 stelle il cliente non viene spinto su Google: il messaggio arriva solo a te
              nella Vista Titolare.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {FEEDBACK_QUICK_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setFeedbackReason(reason)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-medium border transition-colors cursor-pointer ${
                    feedbackReason === reason
                      ? 'bg-amber-400 text-[#09090B] border-amber-400 font-bold'
                      : 'bg-[#09090B] text-zinc-300 border-[#27272A] hover:border-zinc-500'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
            <textarea
              value={feedbackMessage}
              onChange={(e) => setFeedbackMessage(e.target.value)}
              rows={2}
              placeholder="Scrivi un consiglio privato per migliorare..."
              className="w-full rounded-xl bg-[#09090B] border border-[#27272A] px-3 py-2 text-xs text-[#FAFAFA] placeholder:text-zinc-500 focus:outline-none focus:border-[#BFFF00]"
            />
            <button
              type="submit"
              className="w-full py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#09090B] text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Invia Feedback Privato al Titolare</span>
            </button>
          </form>
        )}

        {feedbackSent && (
          <div className="p-3 rounded-xl bg-[#BFFF00]/10 border border-[#BFFF00]/30 text-xs text-[#BFFF00] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              Feedback privato inviato! Controlla il pannello <strong>Anteprima Vista Titolare</strong>.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProspectDemoSandbox({ preview }: { preview: PublicProspectPreviewDTO }) {
  const sandboxData = useMemo(() => buildVerticalSandboxData(preview), [preview]);
  const verticalMeta = VERTICAL_META[preview.vertical];

  const [viewMode, setViewMode] = useState<ViewMode>('client');
  const [activeSubTab, setActiveSubTab] = useState<string>(verticalMeta.tabs[0].id);

  // Tracking refs (100% browser-only except silent telemetry + CTA POST)
  const hasTrackedOpenRef = useRef(false);
  const trackedModulesRef = useRef<Set<string>>(new Set());

  const postPreviewEvent = useCallback(
    async (payload: Record<string, unknown>) => {
      const response = await fetch(`/api/outreach/preview/${encodeURIComponent(preview.slug)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return response;
    },
    [preview.slug]
  );

  useEffect(() => {
    if (hasTrackedOpenRef.current) return;
    hasTrackedOpenRef.current = true;
    postPreviewEvent({ action: 'track_open' }).catch(() => {});
  }, [postPreviewEvent]);

  const trackModuleInteraction = useCallback(
    (moduleName: string) => {
      if (trackedModulesRef.current.has(moduleName)) return;
      trackedModulesRef.current.add(moduleName);
      postPreviewEvent({ action: 'track_interaction', moduleName }).catch(() => {});
    },
    [postPreviewEvent]
  );

  // Owner live feed & unread notification counter
  const [ownerQueue, setOwnerQueue] = useState<OwnerQueueItem[]>(() =>
    buildBaselineOwnerItems(preview.vertical, sandboxData)
  );
  const [privateFeedbacks, setPrivateFeedbacks] = useState<PrivateFeedbackItem[]>([]);
  const [unreadOwnerCount, setUnreadOwnerCount] = useState<number>(0);
  const [demoActionsCount, setDemoActionsCount] = useState<number>(0);
  const [lastSyncedBanner, setLastSyncedBanner] = useState<string | null>(null);

  const pushOwnerItem = useCallback((item: Omit<OwnerQueueItem, 'id' | 'timeLabel'>) => {
    const newItem: OwnerQueueItem = {
      ...item,
      id: `demo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timeLabel: `Adesso (${getCurrentTimeLabel()})`,
    };
    setOwnerQueue((prev) => [newItem, ...prev]);
    setUnreadOwnerCount((prev) => prev + 1);
    setDemoActionsCount((prev) => prev + 1);
    setLastSyncedBanner(newItem.title);
  }, []);

  const handleToggleOwnerItemStatus = (itemId: string) => {
    setOwnerQueue((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const nextIndex = (item.statusIndex + 1) % item.statusStages.length;
        return { ...item, statusIndex: nextIndex };
      })
    );
  };

  const handleSwitchViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'owner') {
      setUnreadOwnerCount(0);
      trackModuleInteraction('Anteprima Vista Titolare');
    }
  };

  // ---------------- FOOD STATE ----------------
  const [activeGuest, setActiveGuest] = useState<'Tu' | 'Marco'>('Tu');
  const [foodCart, setFoodCart] = useState<FoodCartEntry[]>(() => {
    const prefilledItem = sandboxData.foodMenu[sandboxData.foodMenu.length - 1] || sandboxData.foodMenu[0];
    return prefilledItem ? [{ item: prefilledItem, guest: 'Marco', qty: 1 }] : [];
  });
  const [foodSentTotal, setFoodSentTotal] = useState<number>(0);
  const [foodOrderBanner, setFoodOrderBanner] = useState<string | null>(null);
  const [splitGuests, setSplitGuests] = useState<2 | 3 | 4>(2);
  const [serviceBanner, setServiceBanner] = useState<string | null>(null);
  const [wifiCopied, setWifiCopied] = useState<boolean>(false);

  const cartTotal = useMemo(
    () => foodCart.reduce((sum, entry) => sum + entry.item.price * entry.qty, 0),
    [foodCart]
  );
  const cartItemsCount = useMemo(() => foodCart.reduce((sum, entry) => sum + entry.qty, 0), [foodCart]);

  const adjustCartItem = (menuItem: DemoMenuItem, delta: 1 | -1, guestOverride?: 'Tu' | 'Marco') => {
    const targetGuest = guestOverride || activeGuest;
    trackModuleInteraction('Carrello Tavolo Condiviso');
    setFoodOrderBanner(null);

    setFoodCart((prev) => {
      const idx = prev.findIndex((e) => e.item.id === menuItem.id && e.guest === targetGuest);
      if (idx === -1) {
        if (delta < 0) return prev;
        return [...prev, { item: menuItem, guest: targetGuest, qty: 1 }];
      }
      const updatedQty = prev[idx].qty + delta;
      if (updatedQty <= 0) {
        return prev.filter((_, i) => i !== idx);
      }
      return prev.map((entry, i) => (i === idx ? { ...entry, qty: updatedQty } : entry));
    });
  };

  const getItemQtyForGuest = (itemId: string, guest: 'Tu' | 'Marco') => {
    return foodCart.find((e) => e.item.id === itemId && e.guest === guest)?.qty || 0;
  };

  const handleSendFoodOrder = () => {
    if (foodCart.length === 0) return;
    trackModuleInteraction('Carrello Tavolo Condiviso');
    const summaryText = foodCart
      .map((e) => `${e.qty}x ${e.item.name} (${e.guest})`)
      .join(' • ');
    const orderAmount = cartTotal;

    pushOwnerItem({
      title: 'Tavolo 07 • Nuova Comanda Condivisa',
      subtitle: summaryText,
      badgeText: `${cartItemsCount} articoli`,
      amountEur: orderAmount,
      statusIndex: 0,
      statusStages: ['In preparazione', 'Pronto', 'Servito'],
      isFromClientDemo: true,
      kind: 'order',
    });

    setFoodSentTotal((prev) => prev + orderAmount);
    setFoodCart([]);
    setFoodOrderBanner('Comanda inviata alla cucina! Ora visibile in Vista Titolare.');
  };

  const smartBillBaseTotal = (foodSentTotal > 0 ? foodSentTotal : 38) + cartTotal;
  const smartBillPerGuest = smartBillBaseTotal / splitGuests;

  const handleCallWaiter = () => {
    trackModuleInteraction('Servizi Tavolo & Conto Smart');
    pushOwnerItem({
      title: 'Tavolo 07 • Chiamata Cameriere',
      subtitle: 'Richiesta assistenza immediata dal tag NFC sul tavolo',
      badgeText: 'Urgente Sala',
      statusIndex: 0,
      statusStages: ['In attesa', 'Preso in carico', 'Servito'],
      isFromClientDemo: true,
      kind: 'waiter',
    });
    setServiceBanner('Cameriere avvisato! Notifica inviata alla sala.');
  };

  const handleRequestBill = (isSplit: boolean) => {
    trackModuleInteraction('Servizi Tavolo & Conto Smart');
    pushOwnerItem({
      title: isSplit ? `Tavolo 07 • Conto Smart (${splitGuests} quote)` : 'Tavolo 07 • Richiesta Conto',
      subtitle: isSplit
        ? `Divisione in ${splitGuests} quote da ${formatEur(smartBillPerGuest)} ciascuna`
        : `Richiesto conto intero al tavolo (${formatEur(smartBillBaseTotal)})`,
      badgeText: 'Conto Tavolo',
      amountEur: smartBillBaseTotal,
      statusIndex: 0,
      statusStages: ['In attesa', 'In arrivo al tavolo', 'Saldato'],
      isFromClientDemo: true,
      kind: 'bill',
    });
    setServiceBanner(
      isSplit
        ? `Conto diviso per ${splitGuests} inviato in cassa (${formatEur(smartBillPerGuest)}/persona).`
        : 'Richiesta conto inviata al personale di sala.'
    );
  };

  // ---------------- BEAUTY STATE ----------------
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3>(1);
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    sandboxData.beautyServices[0]?.id || ''
  );
  const [selectedStaffId, setSelectedStaffId] = useState<string>(
    sandboxData.beautyStaff[0]?.id || ''
  );
  const [selectedSlot, setSelectedSlot] = useState<string>(
    sandboxData.beautyStaff[0]?.slots[0] || '10:30'
  );
  const [bookingClientName, setBookingClientName] = useState<string>('Cliente Demo');
  const [bookingConfirmed, setBookingConfirmed] = useState<boolean>(false);
  const [beautyStamps, setBeautyStamps] = useState<number>(6);

  const activeBeautyService =
    sandboxData.beautyServices.find((s) => s.id === selectedServiceId) ||
    sandboxData.beautyServices[0];
  const activeBeautyStaff =
    sandboxData.beautyStaff.find((s) => s.id === selectedStaffId) || sandboxData.beautyStaff[0];

  const handleSelectStaff = (staffId: string) => {
    setSelectedStaffId(staffId);
    const staffObj = sandboxData.beautyStaff.find((s) => s.id === staffId);
    if (staffObj && staffObj.slots.length > 0) {
      setSelectedSlot(staffObj.slots[0]);
    }
  };

  const handleConfirmBeautyBooking = () => {
    if (!activeBeautyService || !activeBeautyStaff) return;
    trackModuleInteraction('Prenotazioni Smart & Agenda Poltrone');
    const clientLabel = bookingClientName.trim() || 'Cliente Demo';

    pushOwnerItem({
      title: `${clientLabel} • Ore ${selectedSlot}`,
      subtitle: `${activeBeautyService.name} (${activeBeautyService.durationMin} min) con ${activeBeautyStaff.name}`,
      badgeText: activeBeautyStaff.role,
      amountEur: activeBeautyService.price,
      statusIndex: 1,
      statusStages: ['In attesa', 'Confermato', 'Completato'],
      isFromClientDemo: true,
      kind: 'booking',
    });
    setBookingConfirmed(true);
  };

  const handleAddBeautyStamp = () => {
    trackModuleInteraction('Fidelity Card Digitale');
    setBeautyStamps((prev) => (prev >= 8 ? 6 : prev + 1));
    setDemoActionsCount((prev) => prev + 1);
  };

  // ---------------- HOSPITALITY STATE ----------------
  const [wifiConnected, setWifiConnected] = useState<boolean>(false);
  const [sentHospitalityIds, setSentHospitalityIds] = useState<string[]>([]);
  const [savedGuideIds, setSavedGuideIds] = useState<string[]>([]);

  const handleHospitalityServiceRequest = (serviceId: string) => {
    const srv = sandboxData.hospitalityServices.find((s) => s.id === serviceId);
    if (!srv) return;
    trackModuleInteraction('Richieste Reception Live');
    pushOwnerItem({
      title: `Camera 104 • ${srv.title}`,
      subtitle: `${srv.subtitle} (${srv.eta})`,
      badgeText: 'Guest Request',
      statusIndex: 0,
      statusStages: ['Nuova richiesta', 'Presa in carico', 'Completato'],
      isFromClientDemo: true,
      kind: 'hospitality',
    });
    setSentHospitalityIds((prev) => (prev.includes(serviceId) ? prev : [...prev, serviceId]));
  };

  // ---------------- RETAIL STATE ----------------
  const [selectedRetailSizes, setSelectedRetailSizes] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const product of sandboxData.retailProducts) {
      initial[product.id] = product.inStockSizes[0] || product.sizes[0] || 'Unica';
    }
    return initial;
  });
  const [requestedRetailIds, setRequestedRetailIds] = useState<string[]>([]);
  const [retailVipPoints, setRetailVipPoints] = useState<number>(140);

  const handleRequestRetailTryOn = (productId: string) => {
    const product = sandboxData.retailProducts.find((p) => p.id === productId);
    if (!product) return;
    const chosenSize = selectedRetailSizes[product.id] || product.sizes[0];
    const inStock = product.inStockSizes.includes(chosenSize);

    trackModuleInteraction('Catalogo & Richiesta Taglia');
    pushOwnerItem({
      title: `Camerino 02 • ${product.name}`,
      subtitle: `Richiesta prova Taglia ${chosenSize} (${inStock ? 'disponibile in negozio' : 'verifica magazzino'})`,
      badgeText: `TG ${chosenSize}`,
      amountEur: product.price,
      statusIndex: 0,
      statusStages: ['Da portare', 'In camerino', 'Completato'],
      isFromClientDemo: true,
      kind: 'retail',
    });
    setRequestedRetailIds((prev) => (prev.includes(productId) ? prev : [...prev, productId]));
  };

  // ---------------- PRIVATE REVIEW SHIELD CALLBACK ----------------
  const handlePrivateFeedbackSubmit = (stars: number, reason: string, message: string) => {
    setPrivateFeedbacks((prev) => [
      {
        id: `fb-${Date.now()}`,
        stars,
        reason,
        message,
        timeLabel: `Adesso (${getCurrentTimeLabel()})`,
        isFromClientDemo: true,
      },
      ...prev,
    ]);
    setUnreadOwnerCount((prev) => prev + 1);
    setDemoActionsCount((prev) => prev + 1);
    setLastSyncedBanner('Feedback privato intercettato (Review Shield)');
  };

  // ---------------- CTA MODAL STATE ----------------
  const [isCtaOpen, setIsCtaOpen] = useState<boolean>(false);
  const [contactName, setContactName] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [preferredTime, setPreferredTime] = useState<string>(PREFERRED_TIME_OPTIONS[0]);
  const [ctaNote, setCtaNote] = useState<string>('');
  const [ctaSubmitting, setCtaSubmitting] = useState<boolean>(false);
  const [ctaError, setCtaError] = useState<string | null>(null);
  const [ctaSubmitted, setCtaSubmitted] = useState<boolean>(false);

  useEffect(() => {
    if (!isCtaOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsCtaOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCtaOpen]);

  const handleOpenCta = () => {
    setCtaError(null);
    setIsCtaOpen(true);
    trackModuleInteraction('Richiesta Attivazione CTA');
  };

  const handleSubmitCta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim()) {
      setCtaError('Inserisci il nome del referente e un numero di telefono o WhatsApp.');
      return;
    }
    setCtaError(null);
    setCtaSubmitting(true);
    try {
      const response = await postPreviewEvent({
        action: 'request_activation',
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        preferredTime,
        note: ctaNote.trim() || undefined,
      });
      if (!response.ok) {
        const errJson = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(
          errJson?.error || 'Impossibile inviare la richiesta in questo momento. Riprova.'
        );
      }
      setCtaSubmitted(true);
      setIsCtaOpen(false);
    } catch (err) {
      setCtaError(
        err instanceof Error
          ? err.message
          : 'Errore di connessione. Riprova tra qualche secondo.'
      );
    } finally {
      setCtaSubmitting(false);
    }
  };

  const locationLabel = [preview.city, preview.province].filter(Boolean).join(' • ');
  const simulatedRevenueEur = useMemo(
    () => ownerQueue.reduce((sum, item) => sum + (item.amountEur || 0), 0),
    [ownerQueue]
  );
  const clientAddedCount = useMemo(
    () =>
      ownerQueue.filter((i) => i.isFromClientDemo).length +
      privateFeedbacks.filter((f) => f.isFromClientDemo).length,
    [ownerQueue, privateFeedbacks]
  );

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] pb-28 selection:bg-[#BFFF00] selection:text-[#09090B]">
      {/* a) Non-invasive Top Preview Banner */}
      <header className="sticky top-0 z-40 bg-[#09090B]/92 backdrop-blur-xl border-b border-[#27272A]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#121214] border border-[#27272A] flex items-center justify-center shrink-0 p-1.5">
              <Image
                src="/brand/rivo-icon.png"
                alt="RIVO"
                width={24}
                height={24}
                className="rounded-xs"
              />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-[#BFFF00]/15 text-[#BFFF00] border border-[#BFFF00]/30">
                  <Sparkles className="w-2.5 h-2.5" />
                  MODALITÀ ANTEPRIMA INTERATTIVA
                </span>
                <span className="text-[11px] text-[#A1A1AA] hidden md:inline">
                  Ambiente simulato senza modifiche reali
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-1">
                <h1 className="text-sm sm:text-base font-bold text-[#FAFAFA] truncate">
                  {preview.businessName}
                </h1>
                <span className="text-xs text-[#A1A1AA] inline-flex items-center gap-1">
                  <Tag className="w-3 h-3 text-[#BFFF00]" />
                  {preview.subcategory || preview.category || verticalMeta.label}
                </span>
                {(locationLabel || preview.address) && (
                  <span className="text-xs text-[#A1A1AA] inline-flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
                    <span className="truncate">
                      {[preview.address, locationLabel].filter(Boolean).join(' — ')}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            <span className="text-[11px] text-[#A1A1AA] md:hidden">
              Simulazione senza modifiche reali
            </span>
            <button
              type="button"
              onClick={handleOpenCta}
              className="px-3.5 py-2 rounded-xl bg-[#BFFF00] hover:bg-[#BFFF00]/90 text-[#09090B] text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>Attiva per {preview.businessName}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 sm:pt-7 space-y-6">
        {ctaSubmitted && (
          <div className="rounded-2xl bg-[#BFFF00]/10 border border-[#BFFF00]/35 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#BFFF00] shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <p className="text-sm font-bold text-[#FAFAFA]">
                  Richiesta inviata per {preview.businessName}!
                </p>
                <p className="text-xs text-[#A1A1AA]">
                  Ti contatteremo nella fascia selezionata ({preferredTime}) per attivare il tuo
                  sistema RIVO su misura.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-[#BFFF00] uppercase shrink-0">
              Confermato
            </span>
          </div>
        )}

        {/* c) Recommended Modules Summary Card */}
        <section
          aria-label="Moduli RIVO consigliati"
          className="rounded-2xl bg-[#121214] border border-[#27272A] p-4 sm:p-5 space-y-3.5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#18181B] border border-[#27272A] flex items-center justify-center">
                <VerticalGlyph vertical={preview.vertical} className="w-4 h-4 text-[#BFFF00]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#FAFAFA]">
                  Perché RIVO consiglia questi moduli per {preview.businessName}
                </h2>
                <p className="text-xs text-[#A1A1AA]">
                  Configurazione consigliata per il profilo {verticalMeta.label.toLowerCase()}
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-[#A1A1AA] bg-[#18181B] border border-[#27272A] px-2.5 py-1 rounded-lg self-start sm:self-auto">
              {preview.recommendedModules.length} moduli selezionati
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {preview.recommendedModules.map((mod, idx) => {
              const badge = MODULE_STATUS_BADGE[mod.status] || MODULE_STATUS_BADGE.plausible_opportunity;
              return (
                <div
                  key={`${mod.moduleName}-${idx}`}
                  className="rounded-xl bg-[#18181B] border border-[#27272A] p-3.5 flex flex-col justify-between gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xs font-bold text-[#FAFAFA] leading-snug">
                      {mod.moduleName}
                    </h3>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed">{mod.rationale}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* b) View Mode Switcher prominently above the simulator */}
        <section aria-label="Selettore vista demo" className="flex flex-col items-center gap-2.5">
          <div className="inline-flex w-full sm:w-auto p-1.5 rounded-2xl bg-[#121214] border border-[#27272A] shadow-lg">
            <button
              type="button"
              onClick={() => handleSwitchViewMode('client')}
              className={`flex-1 sm:flex-initial px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all inline-flex items-center justify-center gap-2 cursor-pointer ${
                viewMode === 'client'
                  ? 'bg-[#BFFF00] text-[#09090B] shadow-md'
                  : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
              }`}
            >
              <Smartphone className="w-4 h-4 shrink-0" />
              <span>Vista Cliente</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchViewMode('owner')}
              className={`flex-1 sm:flex-initial px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all inline-flex items-center justify-center gap-2 cursor-pointer relative ${
                viewMode === 'owner'
                  ? 'bg-[#BFFF00] text-[#09090B] shadow-md'
                  : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
              }`}
            >
              <Monitor className="w-4 h-4 shrink-0" />
              <span>Anteprima Vista Titolare</span>
              {unreadOwnerCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-mono font-extrabold bg-[#BFFF00] text-[#09090B] ring-2 ring-[#09090B] animate-pulse shadow-[0_0_16px_rgba(191,255,0,0.65)]">
                  +{unreadOwnerCount}
                </span>
              )}
            </button>
          </div>

          <p className="text-xs text-[#A1A1AA] text-center">
            {viewMode === 'client'
              ? 'Interagisci con lo smartphone qui sotto come un cliente: ogni azione si aggiorna dal vivo nella Vista Titolare.'
              : `Stai vedendo ciò che riceve il team di ${preview.businessName} in tempo reale.`}
          </p>
        </section>

        {/* d) Interactive Client View OR e) Live Owner View */}
        {viewMode === 'client' ? (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Smartphone Simulator */}
            <div className="lg:col-span-7 flex justify-center">
              <div className="w-full max-w-[400px] rounded-[2.5rem] border-[6px] border-[#27272A] bg-[#09090B] shadow-[0_25px_70px_rgba(0,0,0,0.75)] overflow-hidden">
                {/* Phone Status Bar / Dynamic Island */}
                <div className="px-6 pt-3 pb-2 flex items-center justify-between bg-[#09090B]">
                  <span className="text-[11px] font-mono font-semibold text-[#FAFAFA] tabular-nums">
                    9:41
                  </span>
                  <div className="w-24 h-5 rounded-full bg-[#18181B] border border-[#27272A] flex items-center justify-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#BFFF00]" />
                    <span className="text-[9px] font-mono text-[#A1A1AA]">NFC HUB</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#BFFF00]">5G</span>
                </div>

                {/* Branded App Header inside Phone */}
                <div className="px-4 pt-2 pb-3 border-b border-[#27272A] bg-[#121214]/90 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#BFFF00] block">
                        {verticalMeta.contextBadge}
                      </span>
                      <h3 className="text-sm font-extrabold text-[#FAFAFA] truncate">
                        {preview.businessName}
                      </h3>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-[#18181B] border border-[#27272A] flex items-center justify-center shrink-0">
                      <VerticalGlyph vertical={preview.vertical} className="w-4 h-4 text-[#BFFF00]" />
                    </div>
                  </div>

                  {/* Phone Sub-Tabs */}
                  <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#09090B] border border-[#27272A]">
                    {verticalMeta.tabs.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveSubTab(tab.id)}
                        className={`px-2 py-2 rounded-lg text-[11px] font-bold transition-colors text-center leading-tight cursor-pointer ${
                          activeSubTab === tab.id
                            ? 'bg-[#BFFF00] text-[#09090B]'
                            : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Phone Scrollable Body */}
                <div className="p-4 space-y-4 min-h-[520px] max-h-[650px] overflow-y-auto bg-[#09090B]">
                  {/* ================= FOOD VERTICAL ================= */}
                  {preview.vertical === 'food' && activeSubTab === 'menu' && (
                    <div className="space-y-3.5">
                      {/* Shared Table Guest Toggle */}
                      <div className="rounded-xl bg-[#121214] border border-[#27272A] p-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#BFFF00]" />
                          <div>
                            <p className="text-xs font-bold text-[#FAFAFA]">Carrello Tavolo 07</p>
                            <p className="text-[10px] text-[#A1A1AA]">
                              Simula chi sta aggiungendo piatti:
                            </p>
                          </div>
                        </div>
                        <div className="inline-flex p-0.5 rounded-lg bg-[#09090B] border border-[#27272A]">
                          {(['Tu', 'Marco'] as const).map((guest) => (
                            <button
                              key={guest}
                              type="button"
                              onClick={() => setActiveGuest(guest)}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                                activeGuest === guest
                                  ? 'bg-[#BFFF00] text-[#09090B]'
                                  : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
                              }`}
                            >
                              {guest}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="space-y-2.5">
                        {sandboxData.foodMenu.map((dish) => {
                          const myQty = getItemQtyForGuest(dish.id, activeGuest);
                          const totalItemQty =
                            getItemQtyForGuest(dish.id, 'Tu') + getItemQtyForGuest(dish.id, 'Marco');
                          return (
                            <div
                              key={dish.id}
                              className="rounded-xl bg-[#121214] border border-[#27272A] p-3 space-y-2"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-xs font-bold text-[#FAFAFA]">
                                      {dish.name}
                                    </span>
                                    {dish.badge && (
                                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#BFFF00]/15 text-[#BFFF00]">
                                        {dish.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-[#A1A1AA] mt-0.5 leading-snug">
                                    {dish.description}
                                  </p>
                                </div>
                                <span className="text-xs font-mono font-bold text-[#FAFAFA] tabular-nums shrink-0">
                                  {formatEur(dish.price)}
                                </span>
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                <span className="text-[10px] text-[#A1A1AA]">
                                  {totalItemQty > 0
                                    ? `Al tavolo: ${totalItemQty} pz (${activeGuest}: ${myQty})`
                                    : dish.category}
                                </span>
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => adjustCartItem(dish, -1)}
                                    disabled={myQty === 0}
                                    aria-label={`Rimuovi ${dish.name}`}
                                    className="w-7 h-7 rounded-lg bg-[#18181B] border border-[#27272A] text-[#FAFAFA] disabled:opacity-35 flex items-center justify-center cursor-pointer"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="w-5 text-center text-xs font-mono font-bold tabular-nums">
                                    {myQty}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => adjustCartItem(dish, 1)}
                                    aria-label={`Aggiungi ${dish.name}`}
                                    className="w-7 h-7 rounded-lg bg-[#BFFF00] text-[#09090B] flex items-center justify-center font-bold cursor-pointer"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Shared Cart Summary & Send */}
                      <div className="rounded-2xl bg-[#18181B] border border-[#BFFF00]/30 p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#FAFAFA]">
                            Riepilogo Carrello Condiviso ({cartItemsCount})
                          </span>
                          <span className="text-sm font-mono font-extrabold text-[#BFFF00] tabular-nums">
                            {formatEur(cartTotal)}
                          </span>
                        </div>

                        {foodCart.length > 0 ? (
                          <ul className="space-y-1 text-[11px]">
                            {foodCart.map((entry) => (
                              <li
                                key={`${entry.item.id}-${entry.guest}`}
                                className="flex items-center justify-between text-zinc-300"
                              >
                                <span className="truncate pr-2">
                                  <span className="text-[#BFFF00] font-semibold">
                                    [{entry.guest}]
                                  </span>{' '}
                                  {entry.qty}x {entry.item.name}
                                </span>
                                <span className="font-mono tabular-nums shrink-0">
                                  {formatEur(entry.item.price * entry.qty)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[11px] text-[#A1A1AA]">
                            Aggiungi uno o più piatti qui sopra per simulare l’invio in cucina.
                          </p>
                        )}

                        <button
                          type="button"
                          onClick={handleSendFoodOrder}
                          disabled={foodCart.length === 0}
                          className="w-full py-2.5 px-4 rounded-xl bg-[#BFFF00] hover:bg-[#BFFF00]/90 disabled:opacity-40 text-[#09090B] text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Invia Comanda alla Cucina</span>
                        </button>

                        {foodOrderBanner && (
                          <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-center justify-between gap-2">
                            <span>{foodOrderBanner}</span>
                            <button
                              type="button"
                              onClick={() => handleSwitchViewMode('owner')}
                              className="text-[#BFFF00] font-bold underline shrink-0 cursor-pointer"
                            >
                              Apri →
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {preview.vertical === 'food' && activeSubTab === 'service' && (
                    <div className="space-y-3.5">
                      <div className="grid grid-cols-1 gap-2.5">
                        <button
                          type="button"
                          onClick={handleCallWaiter}
                          className="w-full p-3.5 rounded-2xl bg-[#121214] hover:bg-[#18181B] border border-[#27272A] hover:border-[#BFFF00]/40 text-left flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#BFFF00]/15 border border-[#BFFF00]/30 flex items-center justify-center">
                              <Bell className="w-4 h-4 text-[#BFFF00]" />
                            </div>
                            <div>
                              <span className="text-xs font-bold text-[#FAFAFA] block">
                                Chiama Cameriere
                              </span>
                              <span className="text-[11px] text-[#A1A1AA]">
                                Avvisa subito la sala per Tavolo 07
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#A1A1AA]" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRequestBill(false)}
                          className="w-full p-3.5 rounded-2xl bg-[#121214] hover:bg-[#18181B] border border-[#27272A] hover:border-[#BFFF00]/40 text-left flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center">
                              <Receipt className="w-4 h-4 text-sky-300" />
                            </div>
                            <div>
                              <span className="text-xs font-bold text-[#FAFAFA] block">
                                Richiedi Conto al Tavolo
                              </span>
                              <span className="text-[11px] text-[#A1A1AA]">
                                Totale stimato: {formatEur(smartBillBaseTotal)}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#A1A1AA]" />
                        </button>
                      </div>

                      {serviceBanner && (
                        <div className="p-3 rounded-xl bg-[#BFFF00]/10 border border-[#BFFF00]/30 text-[11px] text-[#BFFF00] flex items-center justify-between gap-2">
                          <span>{serviceBanner}</span>
                          <button
                            type="button"
                            onClick={() => handleSwitchViewMode('owner')}
                            className="font-bold underline shrink-0 cursor-pointer"
                          >
                            Vedi Live →
                          </button>
                        </div>
                      )}

                      {/* Conto Smart Splitter */}
                      <div className="rounded-2xl bg-[#121214] border border-[#27272A] p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-[#FAFAFA]">Conto Smart</h4>
                            <p className="text-[11px] text-[#A1A1AA]">
                              Dividi il tavolo in un tap
                            </p>
                          </div>
                          <span className="text-sm font-mono font-bold text-[#FAFAFA] tabular-nums">
                            {formatEur(smartBillBaseTotal)}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          {([2, 3, 4] as const).map((count) => (
                            <button
                              key={count}
                              type="button"
                              onClick={() => {
                                setSplitGuests(count);
                                trackModuleInteraction('Servizi Tavolo & Conto Smart');
                              }}
                              className={`py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                                splitGuests === count
                                  ? 'bg-[#BFFF00] text-[#09090B] border-[#BFFF00]'
                                  : 'bg-[#18181B] text-[#FAFAFA] border-[#27272A]'
                              }`}
                            >
                              {count} Ospiti
                            </button>
                          ))}
                        </div>

                        <div className="p-3 rounded-xl bg-[#09090B] border border-[#27272A] flex items-center justify-between">
                          <span className="text-xs text-[#A1A1AA]">Quota a persona:</span>
                          <span className="text-base font-mono font-extrabold text-[#BFFF00] tabular-nums">
                            {formatEur(smartBillPerGuest)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRequestBill(true)}
                          className="w-full py-2 px-3 rounded-xl bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-xs font-bold text-[#FAFAFA] transition-colors cursor-pointer"
                        >
                          Invia Richiesta Conto Diviso ({splitGuests} quote)
                        </button>
                      </div>

                      {/* 1-Tap Wi-Fi Ospiti */}
                      <div className="rounded-2xl bg-[#121214] border border-[#27272A] p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                            <Wifi className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#FAFAFA]">Wi-Fi Ospiti</p>
                            <p className="text-[11px] font-mono text-[#A1A1AA] truncate">
                              RIVO-GUEST-WIFI
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            trackModuleInteraction('Wi-Fi Ospiti');
                            navigator.clipboard?.writeText('Benvenuti2026').catch(() => {});
                            setWifiCopied(true);
                            setTimeout(() => setWifiCopied(false), 2000);
                          }}
                          className="px-3 py-2 rounded-xl bg-[#18181B] border border-[#27272A] text-xs font-bold text-[#BFFF00] inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                        >
                          {wifiCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{wifiCopied ? 'Copiata!' : 'Copia Pass'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {preview.vertical === 'food' && activeSubTab === 'engage' && (
                    <WheelAndReviewsSection
                      businessName={preview.businessName}
                      wheelPrizes={sandboxData.wheelPrizes}
                      onTrackModule={trackModuleInteraction}
                      onPrivateFeedbackSubmit={handlePrivateFeedbackSubmit}
                    />
                  )}

                  {/* ================= BEAUTY VERTICAL ================= */}
                  {preview.vertical === 'beauty' && activeSubTab === 'booking' && (
                    <div className="space-y-3.5">
                      {/* 3-Step Indicator */}
                      <div className="flex items-center justify-between gap-1 px-1">
                        {[
                          { step: 1 as const, label: '1. Trattamento' },
                          { step: 2 as const, label: '2. Specialista' },
                          { step: 3 as const, label: '3. Conferma' },
                        ].map((s) => (
                          <button
                            key={s.step}
                            type="button"
                            onClick={() => {
                              setBookingConfirmed(false);
                              setBookingStep(s.step);
                            }}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                              bookingStep === s.step
                                ? 'bg-[#BFFF00]/15 text-[#BFFF00] border-[#BFFF00]/40'
                                : bookingStep > s.step
                                ? 'bg-[#121214] text-emerald-300 border-emerald-500/30'
                                : 'bg-[#121214] text-[#A1A1AA] border-[#27272A]'
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>

                      {bookingStep === 1 && (
                        <div className="space-y-2.5">
                          <p className="text-xs font-bold text-[#FAFAFA]">
                            Scegli il servizio desiderato:
                          </p>
                          {sandboxData.beautyServices.map((srv) => {
                            const selected = srv.id === selectedServiceId;
                            return (
                              <button
                                key={srv.id}
                                type="button"
                                onClick={() => {
                                  setSelectedServiceId(srv.id);
                                  setBookingConfirmed(false);
                                  trackModuleInteraction('Prenotazioni Smart & Agenda Poltrone');
                                }}
                                className={`w-full text-left p-3 rounded-xl border transition-colors space-y-1 cursor-pointer ${
                                  selected
                                    ? 'bg-[#BFFF00]/10 border-[#BFFF00]/50'
                                    : 'bg-[#121214] border-[#27272A] hover:border-zinc-600'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-bold text-[#FAFAFA]">
                                    {srv.name}
                                  </span>
                                  <span className="text-xs font-mono font-bold text-[#BFFF00] tabular-nums">
                                    {formatEur(srv.price)}
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#A1A1AA] leading-snug">
                                  {srv.description}
                                </p>
                                <div className="flex items-center gap-2 text-[10px] text-zinc-400 pt-0.5">
                                  <Clock className="w-3 h-3" />
                                  <span>{srv.durationMin} min</span>
                                  <span>•</span>
                                  <span>{srv.category}</span>
                                </div>
                              </button>
                            );
                          })}
                          <button
                            type="button"
                            onClick={() => setBookingStep(2)}
                            className="w-full py-2.5 px-4 rounded-xl bg-[#BFFF00] text-[#09090B] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>Scegli Specialista e Orario</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {bookingStep === 2 && (
                        <div className="space-y-3">
                          <p className="text-xs font-bold text-[#FAFAFA]">
                            Seleziona lo specialista:
                          </p>
                          <div className="space-y-2">
                            {sandboxData.beautyStaff.map((member) => {
                              const active = member.id === selectedStaffId;
                              return (
                                <button
                                  key={member.id}
                                  type="button"
                                  onClick={() => handleSelectStaff(member.id)}
                                  className={`w-full p-3 rounded-xl border text-left flex items-center gap-3 transition-colors cursor-pointer ${
                                    active
                                      ? 'bg-[#18181B] border-[#BFFF00]/50'
                                      : 'bg-[#121214] border-[#27272A]'
                                  }`}
                                >
                                  <div
                                    className="w-10 h-10 rounded-full bg-[#09090B] flex items-center justify-center font-bold text-xs text-[#FAFAFA] shrink-0"
                                    style={{ border: `2px solid ${member.color}` }}
                                  >
                                    {member.name
                                      .split(' ')
                                      .map((p) => p[0])
                                      .join('')}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-[#FAFAFA]">
                                      {member.name}
                                    </p>
                                    <p className="text-[11px] text-[#A1A1AA] truncate">
                                      {member.role} • {member.specialty}
                                    </p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          {activeBeautyStaff && (
                            <div className="space-y-2">
                              <p className="text-xs font-bold text-[#FAFAFA]">
                                Orari disponibili oggi:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {activeBeautyStaff.slots.map((slot) => (
                                  <button
                                    key={slot}
                                    type="button"
                                    onClick={() => setSelectedSlot(slot)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer ${
                                      selectedSlot === slot
                                        ? 'bg-[#BFFF00] text-[#09090B] border-[#BFFF00]'
                                        : 'bg-[#121214] text-[#FAFAFA] border-[#27272A]'
                                    }`}
                                  >
                                    {slot}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setBookingStep(1)}
                              className="px-3 py-2.5 rounded-xl bg-[#121214] border border-[#27272A] text-xs font-bold text-[#A1A1AA] cursor-pointer"
                            >
                              Indietro
                            </button>
                            <button
                              type="button"
                              onClick={() => setBookingStep(3)}
                              className="flex-1 py-2.5 px-4 rounded-xl bg-[#BFFF00] text-[#09090B] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <span>Continua</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {bookingStep === 3 && (
                        <div className="space-y-3">
                          <div className="rounded-2xl bg-[#121214] border border-[#27272A] p-3.5 space-y-2">
                            <span className="text-[10px] font-mono uppercase text-[#BFFF00]">
                              Riepilogo Prenotazione
                            </span>
                            <p className="text-xs font-bold text-[#FAFAFA]">
                              {activeBeautyService?.name}
                            </p>
                            <p className="text-[11px] text-[#A1A1AA]">
                              Con <strong className="text-[#FAFAFA]">{activeBeautyStaff?.name}</strong>{' '}
                              alle <strong className="text-[#FAFAFA]">{selectedSlot}</strong> (
                              {activeBeautyService?.durationMin} min)
                            </p>
                            <div className="pt-1 border-t border-[#27272A] flex items-center justify-between">
                              <span className="text-xs text-[#A1A1AA]">Totale stimato</span>
                              <span className="text-sm font-mono font-bold text-[#BFFF00] tabular-nums">
                                {formatEur(activeBeautyService?.price || 0)}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label
                              htmlFor="demo-booking-client"
                              className="text-xs font-medium text-[#A1A1AA] flex items-center gap-1.5"
                            >
                              <User className="w-3.5 h-3.5 text-[#BFFF00]" />
                              <span>Nome cliente simulato</span>
                            </label>
                            <input
                              id="demo-booking-client"
                              type="text"
                              value={bookingClientName}
                              onChange={(e) => setBookingClientName(e.target.value)}
                              placeholder="Cliente Demo"
                              className="w-full rounded-xl bg-[#121214] border border-[#27272A] px-3 py-2.5 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#BFFF00]"
                            />
                          </div>

                          {bookingConfirmed ? (
                            <div className="p-3.5 rounded-2xl bg-[#BFFF00]/10 border border-[#BFFF00]/35 space-y-2.5">
                              <div className="flex items-center gap-2 text-xs font-bold text-[#BFFF00]">
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                                <span>Prenotazione inserita in Agenda Poltrone!</span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleSwitchViewMode('owner')}
                                  className="flex-1 py-2 px-3 rounded-xl bg-[#BFFF00] text-[#09090B] text-xs font-bold cursor-pointer"
                                >
                                  Apri Agenda Titolare →
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setBookingConfirmed(false);
                                    setBookingStep(1);
                                  }}
                                  className="px-3 py-2 rounded-xl bg-[#121214] border border-[#27272A] text-xs font-bold text-[#FAFAFA] cursor-pointer"
                                >
                                  Nuova
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setBookingStep(2)}
                                className="px-3 py-2.5 rounded-xl bg-[#121214] border border-[#27272A] text-xs font-bold text-[#A1A1AA] cursor-pointer"
                              >
                                Indietro
                              </button>
                              <button
                                type="button"
                                onClick={handleConfirmBeautyBooking}
                                className="flex-1 py-2.5 px-4 rounded-xl bg-[#BFFF00] text-[#09090B] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Conferma Prenotazione Simulata</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {preview.vertical === 'beauty' && activeSubTab === 'loyalty' && (
                    <div className="space-y-4">
                      <div className="rounded-2xl bg-gradient-to-br from-[#18181B] via-[#121214] to-[#09090B] border border-[#BFFF00]/35 p-4 space-y-4 shadow-xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-mono uppercase text-[#BFFF00]">
                              Apple & Google Wallet Pass
                            </span>
                            <h4 className="text-sm font-extrabold text-[#FAFAFA]">
                              {preview.businessName}
                            </h4>
                          </div>
                          <CreditCard className="w-5 h-5 text-[#BFFF00]" />
                        </div>

                        <div className="grid grid-cols-4 gap-2 py-1">
                          {Array.from({ length: 8 }, (_, idx) => {
                            const filled = idx < beautyStamps;
                            return (
                              <div
                                key={idx}
                                className={`h-11 rounded-xl border flex items-center justify-center transition-all ${
                                  filled
                                    ? 'bg-[#BFFF00] text-[#09090B] border-[#BFFF00] font-extrabold'
                                    : 'bg-[#09090B] text-zinc-600 border-[#27272A]'
                                }`}
                              >
                                {filled ? <Check className="w-4 h-4" /> : <span className="text-xs">{idx + 1}</span>}
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#A1A1AA]">Progresso tessera</span>
                          <span className="font-mono font-bold text-[#BFFF00] tabular-nums">
                            {beautyStamps} / 8 Timbri
                          </span>
                        </div>

                        {beautyStamps >= 8 && (
                          <div className="p-3 rounded-xl bg-[#BFFF00]/15 border border-[#BFFF00]/40 text-xs text-[#BFFF00] font-bold flex items-center gap-2">
                            <Award className="w-4 h-4 shrink-0" />
                            <span>Premio Sbloccato: -30% sul prossimo trattamento!</span>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={handleAddBeautyStamp}
                          className="w-full py-2.5 px-4 rounded-xl bg-[#BFFF00] hover:bg-[#BFFF00]/90 text-[#09090B] text-xs font-bold transition-colors cursor-pointer"
                        >
                          {beautyStamps >= 8 ? 'Riscatta Premio & Riparti' : 'Simula Nuovo Timbro (+1)'}
                        </button>
                      </div>
                    </div>
                  )}

                  {preview.vertical === 'beauty' && activeSubTab === 'engage' && (
                    <WheelAndReviewsSection
                      businessName={preview.businessName}
                      wheelPrizes={sandboxData.wheelPrizes}
                      onTrackModule={trackModuleInteraction}
                      onPrivateFeedbackSubmit={handlePrivateFeedbackSubmit}
                    />
                  )}

                  {/* ================= HOSPITALITY VERTICAL ================= */}
                  {preview.vertical === 'hospitality' && activeSubTab === 'hub' && (
                    <div className="space-y-3.5">
                      <div className="rounded-2xl bg-[#121214] border border-[#27272A] p-4 space-y-2">
                        <span className="text-[10px] font-mono uppercase text-[#BFFF00]">
                          Benvenuto • Camera 104
                        </span>
                        <h4 className="text-sm font-bold text-[#FAFAFA]">
                          Il tuo Concierge Digitale in {preview.city || 'struttura'}
                        </h4>
                        <p className="text-xs text-[#A1A1AA] leading-relaxed">
                          Nessuna app da scaricare: connetti il Wi-Fi in un tocco o scrivi subito
                          alla reception.
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#121214] border border-[#27272A] p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#BFFF00]/15 border border-[#BFFF00]/30 flex items-center justify-center shrink-0">
                            <Wifi className="w-5 h-5 text-[#BFFF00]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#FAFAFA]">1-Tap Wi-Fi Ospiti</p>
                            <p className="text-[11px] font-mono text-[#A1A1AA] truncate">
                              Rete: {slugifyBusinessName(preview.businessName).toUpperCase()}-GUEST
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              trackModuleInteraction('1-Tap Wi-Fi Ospiti');
                              setWifiConnected(true);
                              setDemoActionsCount((prev) => prev + 1);
                            }}
                            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                              wifiConnected
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-[#BFFF00] text-[#09090B]'
                            }`}
                          >
                            {wifiConnected ? 'Connesso alla rete ospite ✓' : 'Connetti con 1 Tap'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              trackModuleInteraction('1-Tap Wi-Fi Ospiti');
                              navigator.clipboard?.writeText('OspiteVIP2026').catch(() => {});
                              setWifiCopied(true);
                              setTimeout(() => setWifiCopied(false), 1800);
                            }}
                            className="px-3 py-2.5 rounded-xl bg-[#18181B] border border-[#27272A] text-xs font-bold text-[#FAFAFA] cursor-pointer"
                          >
                            {wifiCopied ? 'Copiata' : 'Copia'}
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveSubTab('room')}
                        className="w-full p-3.5 rounded-2xl bg-[#18181B] border border-[#27272A] hover:border-[#BFFF00]/40 flex items-center justify-between text-xs font-bold text-[#FAFAFA] cursor-pointer"
                      >
                        <span>Vai ai Servizi in Camera & Reception</span>
                        <ArrowRight className="w-4 h-4 text-[#BFFF00]" />
                      </button>
                    </div>
                  )}

                  {preview.vertical === 'hospitality' && activeSubTab === 'room' && (
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-[#FAFAFA]">
                        Invia una richiesta al Desk Reception:
                      </p>
                      {sandboxData.hospitalityServices.map((srv) => {
                        const alreadySent = sentHospitalityIds.includes(srv.id);
                        return (
                          <div
                            key={srv.id}
                            className="rounded-xl bg-[#121214] border border-[#27272A] p-3.5 space-y-2.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="text-xs font-bold text-[#FAFAFA]">{srv.title}</h4>
                                <p className="text-[11px] text-[#A1A1AA] mt-0.5">{srv.subtitle}</p>
                              </div>
                              <span className="text-[10px] font-mono text-[#BFFF00] bg-[#BFFF00]/10 px-2 py-0.5 rounded shrink-0">
                                {srv.eta}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleHospitalityServiceRequest(srv.id)}
                              className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                                alreadySent
                                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/35'
                                  : 'bg-[#BFFF00] hover:bg-[#BFFF00]/90 text-[#09090B]'
                              }`}
                            >
                              {alreadySent ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Inviata alla Reception (Invia ancora)</span>
                                </>
                              ) : (
                                <>
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Invia alla Reception</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {preview.vertical === 'hospitality' && activeSubTab === 'guide' && (
                    <div className="space-y-4">
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          <Compass className="w-4 h-4 text-[#BFFF00]" />
                          <h4 className="text-xs font-bold text-[#FAFAFA]">
                            Guida Locale Selezionata da {preview.businessName}
                          </h4>
                        </div>
                        {sandboxData.hospitalityGuide.map((spot) => {
                          const saved = savedGuideIds.includes(spot.id);
                          return (
                            <div
                              key={spot.id}
                              className="rounded-xl bg-[#121214] border border-[#27272A] p-3 space-y-1.5"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-xs font-bold text-[#FAFAFA]">{spot.name}</p>
                                  <p className="text-[10px] font-mono text-[#BFFF00]">
                                    {spot.type} • {spot.distance}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    trackModuleInteraction('Guida Locale Interattiva');
                                    setSavedGuideIds((prev) =>
                                      prev.includes(spot.id)
                                        ? prev.filter((id) => id !== spot.id)
                                        : [...prev, spot.id]
                                    );
                                  }}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border cursor-pointer ${
                                    saved
                                      ? 'bg-[#BFFF00] text-[#09090B] border-[#BFFF00]'
                                      : 'bg-[#18181B] text-[#A1A1AA] border-[#27272A]'
                                  }`}
                                >
                                  {saved ? 'Salvato ✓' : 'Salva'}
                                </button>
                              </div>
                              <p className="text-[11px] text-[#A1A1AA]">{spot.highlight}</p>
                            </div>
                          );
                        })}
                      </div>

                      <WheelAndReviewsSection
                        businessName={preview.businessName}
                        wheelPrizes={sandboxData.wheelPrizes}
                        showWheel={false}
                        onTrackModule={trackModuleInteraction}
                        onPrivateFeedbackSubmit={handlePrivateFeedbackSubmit}
                      />
                    </div>
                  )}

                  {/* ================= RETAIL VERTICAL ================= */}
                  {preview.vertical === 'retail' && activeSubTab === 'catalog' && (
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-[#FAFAFA]">
                        Seleziona una taglia e chiedi la prova in camerino:
                      </p>
                      {sandboxData.retailProducts.map((product) => {
                        const chosenSize = selectedRetailSizes[product.id] || product.sizes[0];
                        const isRequested = requestedRetailIds.includes(product.id);
                        return (
                          <div
                            key={product.id}
                            className="rounded-xl bg-[#121214] border border-[#27272A] p-3.5 space-y-2.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-[10px] font-mono uppercase text-[#BFFF00]">
                                  {product.category}
                                </span>
                                <h4 className="text-xs font-bold text-[#FAFAFA]">{product.name}</h4>
                                <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                                  {product.description}
                                </p>
                              </div>
                              <span className="text-xs font-mono font-bold text-[#FAFAFA] tabular-nums shrink-0">
                                {formatEur(product.price)}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              {product.sizes.map((size) => {
                                const inStock = product.inStockSizes.includes(size);
                                const active = chosenSize === size;
                                return (
                                  <button
                                    key={size}
                                    type="button"
                                    onClick={() =>
                                      setSelectedRetailSizes((prev) => ({
                                        ...prev,
                                        [product.id]: size,
                                      }))
                                    }
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition-colors cursor-pointer ${
                                      active
                                        ? 'bg-[#BFFF00] text-[#09090B] border-[#BFFF00]'
                                        : inStock
                                        ? 'bg-[#18181B] text-[#FAFAFA] border-[#27272A]'
                                        : 'bg-[#09090B] text-zinc-500 border-[#27272A] border-dashed'
                                    }`}
                                  >
                                    {size}
                                  </button>
                                );
                              })}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRequestRetailTryOn(product.id)}
                              className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                                isRequested
                                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/35'
                                  : 'bg-[#BFFF00] hover:bg-[#BFFF00]/90 text-[#09090B]'
                              }`}
                            >
                              {isRequested ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Richiesta inviata al commesso (TG {chosenSize})</span>
                                </>
                              ) : (
                                <>
                                  <ShoppingBag className="w-3.5 h-3.5" />
                                  <span>Richiedi Prova al Commesso (TG {chosenSize})</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {preview.vertical === 'retail' && activeSubTab === 'loyalty' && (
                    <div className="space-y-4">
                      <div className="rounded-2xl bg-gradient-to-br from-[#18181B] via-[#121214] to-[#09090B] border border-[#BFFF00]/35 p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-mono uppercase text-[#BFFF00]">
                              RIVO Retail VIP Pass
                            </span>
                            <h4 className="text-sm font-extrabold text-[#FAFAFA]">
                              {preview.businessName}
                            </h4>
                          </div>
                          <Award className="w-5 h-5 text-[#BFFF00]" />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-end justify-between">
                            <span className="text-xs text-[#A1A1AA]">Saldo Punti</span>
                            <span className="text-2xl font-mono font-extrabold text-[#BFFF00] tabular-nums">
                              {retailVipPoints} pt
                            </span>
                          </div>
                          <div className="w-full h-2.5 rounded-full bg-[#09090B] border border-[#27272A] overflow-hidden">
                            <div
                              className="h-full bg-[#BFFF00] transition-all duration-300"
                              style={{ width: `${Math.min(100, (retailVipPoints / 200) * 100)}%` }}
                            />
                          </div>
                          <p className="text-[11px] text-[#A1A1AA]">
                            {retailVipPoints >= 200
                              ? 'Soglia Gold raggiunta! Buono -15% pronto in cassa.'
                              : `Mancano ${200 - retailVipPoints} pt al buono -15% VIP.`}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            trackModuleInteraction('Fidelity Pass VIP');
                            setRetailVipPoints((p) => (p >= 230 ? 140 : p + 30));
                            setDemoActionsCount((c) => c + 1);
                          }}
                          className="w-full py-2.5 px-4 rounded-xl bg-[#BFFF00] text-[#09090B] text-xs font-bold cursor-pointer"
                        >
                          {retailVipPoints >= 230
                            ? 'Riparti Demo Punti'
                            : 'Simula Acquisto in Negozio (+30 pt)'}
                        </button>
                      </div>
                    </div>
                  )}

                  {preview.vertical === 'retail' && activeSubTab === 'engage' && (
                    <WheelAndReviewsSection
                      businessName={preview.businessName}
                      wheelPrizes={sandboxData.wheelPrizes}
                      onTrackModule={trackModuleInteraction}
                      onPrivateFeedbackSubmit={handlePrivateFeedbackSubmit}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Companion Live Sync Explainer on Desktop / Below on Mobile */}
            <aside className="lg:col-span-5 space-y-4">
              <div className="rounded-2xl bg-[#121214] border border-[#27272A] p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#BFFF00]">
                    Sincronizzazione Live Demo
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[#FAFAFA] tabular-nums">
                    <span className="w-2 h-2 rounded-full bg-[#BFFF00] animate-pulse" />
                    {demoActionsCount} azioni simulate
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#FAFAFA]">
                  Prova un’azione nello smartphone e guardala arrivare al banco
                </h3>
                <p className="text-xs text-[#A1A1AA] leading-relaxed">
                  Tutto ciò che simuli qui dentro — comande, chiamate, prenotazioni, richieste taglia
                  o feedback privati — viene inviato istantaneamente nel pannello{' '}
                  <strong className="text-[#FAFAFA]">Anteprima Vista Titolare</strong> senza
                  scrivere su nessun database reale.
                </p>

                {lastSyncedBanner ? (
                  <div className="p-3.5 rounded-xl bg-[#BFFF00]/10 border border-[#BFFF00]/35 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#BFFF00]">
                      <Zap className="w-4 h-4 shrink-0" />
                      <span>Ultimo evento generato:</span>
                    </div>
                    <p className="text-xs text-[#FAFAFA] font-medium">{lastSyncedBanner}</p>
                    <button
                      type="button"
                      onClick={() => handleSwitchViewMode('owner')}
                      className="w-full py-2 px-3 rounded-xl bg-[#BFFF00] text-[#09090B] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Vedi ora in Anteprima Vista Titolare</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-[#18181B] border border-[#27272A] text-xs text-[#A1A1AA] space-y-1.5">
                    <p className="font-semibold text-[#FAFAFA]">Suggerimento rapido:</p>
                    <p>
                      {preview.vertical === 'food' &&
                        'Aggiungi un piatto al carrello condiviso e clicca “Invia Comanda alla Cucina”, oppure prova “Chiama Cameriere”.'}
                      {preview.vertical === 'beauty' &&
                        'Completa i 3 passaggi di prenotazione poltrona e premi “Conferma Prenotazione Simulata”.'}
                      {preview.vertical === 'hospitality' &&
                        'Apri “Servizi Camera” e invia una richiesta alla reception per vederla apparire nel Desk Live.'}
                      {preview.vertical === 'retail' &&
                        'Scegli una taglia nel catalogo e clicca “Richiedi Prova al Commesso”.'}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div className="p-3 rounded-xl bg-[#18181B] border border-[#27272A]">
                    <span className="text-[10px] font-mono uppercase text-[#A1A1AA] block">
                      Zero App
                    </span>
                    <span className="text-xs font-bold text-[#FAFAFA]">
                      Apertura in 0,4s via NFC/QR
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#18181B] border border-[#27272A]">
                    <span className="text-[10px] font-mono uppercase text-[#A1A1AA] block">
                      Su Misura
                    </span>
                    <span className="text-xs font-bold text-[#FAFAFA]">
                      100% personalizzato su di te
                    </span>
                  </div>
                </div>
              </div>
            </aside>
          </section>
        ) : (
          /* e) Anteprima Vista Titolare Panel */
          <section className="space-y-5">
            <div className="rounded-2xl bg-[#121214] border border-[#27272A] p-5 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#27272A] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold bg-[#BFFF00]/15 text-[#BFFF00] border border-[#BFFF00]/30">
                      <Monitor className="w-3 h-3" />
                      {verticalMeta.ownerTitle}
                    </span>
                    <span className="text-xs text-[#A1A1AA]">{preview.businessName}</span>
                  </div>
                  <p className="text-xs text-[#A1A1AA] mt-1.5">{verticalMeta.ownerSubtitle}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleSwitchViewMode('client')}
                  className="px-3.5 py-2 rounded-xl bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-xs font-bold text-[#FAFAFA] inline-flex items-center gap-2 self-start sm:self-auto cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5 text-[#BFFF00]" />
                  <span>Torna a Vista Cliente</span>
                </button>
              </div>

              {/* Mini Live ROI / Engagement Counters */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-[#18181B] border border-[#27272A] space-y-1">
                  <span className="text-[10px] font-mono uppercase text-[#A1A1AA] block">
                    Elementi in Coda
                  </span>
                  <span className="text-xl font-mono font-extrabold text-[#FAFAFA] tabular-nums">
                    {ownerQueue.length}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#18181B] border border-[#27272A] space-y-1">
                  <span className="text-[10px] font-mono uppercase text-[#A1A1AA] block">
                    Da Tua Demo Cliente
                  </span>
                  <span className="text-xl font-mono font-extrabold text-[#BFFF00] tabular-nums">
                    +{clientAddedCount}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#18181B] border border-[#27272A] space-y-1">
                  <span className="text-[10px] font-mono uppercase text-[#A1A1AA] block">
                    Feedback Intercettati
                  </span>
                  <span className="text-xl font-mono font-extrabold text-amber-300 tabular-nums">
                    {privateFeedbacks.length}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#18181B] border border-[#27272A] space-y-1">
                  <span className="text-[10px] font-mono uppercase text-[#A1A1AA] block">
                    Valore Sessione
                  </span>
                  <span className="text-xl font-mono font-extrabold text-emerald-300 tabular-nums">
                    {simulatedRevenueEur > 0 ? formatEur(simulatedRevenueEur) : 'Live'}
                  </span>
                </div>
              </div>

              {/* Live Queue Cards */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA]">
                    Flusso Operativo in Tempo Reale (clicca sullo stato per avanzare)
                  </h3>
                  <span className="text-[11px] text-[#A1A1AA] inline-flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-[#BFFF00]" />
                    Simulazione interattiva
                  </span>
                </div>

                <div className="space-y-2.5">
                  {ownerQueue.map((item) => {
                    const currentStage = item.statusStages[item.statusIndex] || item.statusStages[0];
                    const isLastStage = item.statusIndex === item.statusStages.length - 1;
                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          item.isFromClientDemo
                            ? 'bg-[#BFFF00]/[0.06] border-[#BFFF00]/40'
                            : 'bg-[#18181B] border-[#27272A]'
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            {item.isFromClientDemo && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase bg-[#BFFF00] text-[#09090B]">
                                NUOVO DA DEMO CLIENTE
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#09090B] text-[#A1A1AA] border border-[#27272A]">
                              {item.badgeText}
                            </span>
                            <span className="text-[11px] text-[#A1A1AA]">{item.timeLabel}</span>
                          </div>
                          <h4 className="text-sm font-bold text-[#FAFAFA]">{item.title}</h4>
                          <p className="text-xs text-[#A1A1AA] leading-relaxed">{item.subtitle}</p>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          {typeof item.amountEur === 'number' && item.amountEur > 0 && (
                            <span className="text-sm font-mono font-bold text-[#FAFAFA] tabular-nums">
                              {formatEur(item.amountEur)}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleToggleOwnerItemStatus(item.id)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                              isLastStage
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
                                : 'bg-[#09090B] hover:border-[#BFFF00] text-[#BFFF00] border-[#BFFF00]/40'
                            }`}
                          >
                            {isLastStage ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <RefreshCw className="w-3.5 h-3.5" />
                            )}
                            <span>{currentStage}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Private Feedback Intercepted via Review Shield */}
              <div className="rounded-xl bg-[#18181B] border border-[#27272A] p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-300" />
                    <h4 className="text-xs font-bold text-[#FAFAFA]">
                      Scudo Recensioni — Feedback Privati Intercettati
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-[#A1A1AA]">
                    Non pubblicati su Google
                  </span>
                </div>

                {privateFeedbacks.length > 0 ? (
                  <div className="space-y-2">
                    {privateFeedbacks.map((fb) => (
                      <div
                        key={fb.id}
                        className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-[#BFFF00] text-[#09090B]">
                              NUOVO DA DEMO CLIENTE
                            </span>
                            <span className="text-xs font-bold text-amber-300">
                              {fb.stars}/5★ • {fb.reason}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#A1A1AA]">{fb.timeLabel}</span>
                        </div>
                        <p className="text-xs text-[#FAFAFA]">{fb.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#A1A1AA]">
                    Nessuna segnalazione critica nella sessione. Prova a selezionare 1–3 stelle nel
                    modulo <strong className="text-[#FAFAFA]">Google Review Shield</strong> in Vista
                    Cliente per vedere come viene bloccata una recensione negativa.
                  </p>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* f) Bottom Sticky Conversion CTA Bar */}
      <aside className="fixed bottom-0 inset-x-0 z-40 bg-[#09090B]/95 backdrop-blur-xl border-t border-[#27272A]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
            <div className="w-9 h-9 rounded-xl bg-[#BFFF00]/15 border border-[#BFFF00]/35 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-[#BFFF00]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-[#FAFAFA] truncate">
                {ctaSubmitted
                  ? `Richiesta registrata per ${preview.businessName}`
                  : `Attiva RIVO per ${preview.businessName}`}
              </p>
              <p className="text-[11px] text-[#A1A1AA] truncate">
                Setup chiavi in mano con tag NFC/QR su misura • Call conoscitiva 10 min
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenCta}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#BFFF00] hover:bg-[#BFFF00]/90 text-[#09090B] text-xs sm:text-sm font-extrabold transition-colors inline-flex items-center justify-center gap-2 shrink-0 shadow-[0_0_24px_rgba(191,255,0,0.22)] cursor-pointer"
          >
            <Phone className="w-4 h-4" />
            <span>
              {ctaSubmitted ? 'Invia un’altra nota' : 'Richiedi Call 10 min / Attiva'}
            </span>
          </button>
        </div>
      </aside>

      {/* Activation / Callback Modal */}
      {isCtaOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cta-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCtaOpen(false);
          }}
        >
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-[#121214] border border-[#27272A] p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#BFFF00]">
                  Attivazione Personalizzata
                </span>
                <h2 id="cta-modal-title" className="text-lg font-extrabold text-[#FAFAFA] mt-0.5">
                  Attiva per {preview.businessName}
                </h2>
                <p className="text-xs text-[#A1A1AA] mt-0.5">
                  Lasciaci un recapito: ti mostriamo in 10 minuti come personalizzare RIVO sulla tua
                  attività.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCtaOpen(false)}
                aria-label="Chiudi finestra"
                className="p-2 rounded-xl bg-[#18181B] border border-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitCta} className="space-y-3.5">
              <div className="space-y-1.5">
                <label htmlFor="cta-contact-name" className="text-xs font-semibold text-[#FAFAFA] block">
                  Nome referente *
                </label>
                <input
                  id="cta-contact-name"
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Es. Marco Bianchi"
                  className="w-full rounded-xl bg-[#09090B] border border-[#27272A] px-3.5 py-2.5 text-sm text-[#FAFAFA] placeholder:text-zinc-500 focus:outline-none focus:border-[#BFFF00]"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="cta-contact-phone" className="text-xs font-semibold text-[#FAFAFA] block">
                  Telefono / WhatsApp per richiamarti *
                </label>
                <input
                  id="cta-contact-phone"
                  type="tel"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="Es. +39 333 123 4567"
                  className="w-full rounded-xl bg-[#09090B] border border-[#27272A] px-3.5 py-2.5 text-sm text-[#FAFAFA] placeholder:text-zinc-500 focus:outline-none focus:border-[#BFFF00]"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="cta-preferred-time" className="text-xs font-semibold text-[#FAFAFA] block">
                  Fascia oraria preferita
                </label>
                <select
                  id="cta-preferred-time"
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="w-full rounded-xl bg-[#09090B] border border-[#27272A] px-3.5 py-2.5 text-sm text-[#FAFAFA] focus:outline-none focus:border-[#BFFF00]"
                >
                  {PREFERRED_TIME_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="cta-note" className="text-xs font-semibold text-[#FAFAFA] block">
                  Note opzionali
                </label>
                <textarea
                  id="cta-note"
                  rows={2}
                  value={ctaNote}
                  onChange={(e) => setCtaNote(e.target.value)}
                  placeholder="Es. Quanti tavoli/poltrone hai o quale funzione ti interessa di più..."
                  className="w-full rounded-xl bg-[#09090B] border border-[#27272A] px-3.5 py-2.5 text-sm text-[#FAFAFA] placeholder:text-zinc-500 focus:outline-none focus:border-[#BFFF00]"
                />
              </div>

              {ctaError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{ctaError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={ctaSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-[#BFFF00] hover:bg-[#BFFF00]/90 disabled:opacity-60 text-[#09090B] text-sm font-extrabold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{ctaSubmitting ? 'Invio in corso...' : 'Conferma Richiesta Call'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
