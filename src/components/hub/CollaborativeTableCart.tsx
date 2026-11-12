'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Check,
  Clock,
  Plus,
  Minus,
  Trash2,
  Share2,
  Bell,
  CheckCircle2,
  Sparkles,
  Receipt,
  UtensilsCrossed,
  X,
  Pencil,
  Send,
  ChefHat,
  RotateCcw,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import type { CanvaDish } from '@/lib/canva-menu';
import {
  formatEuro,
  getInitials,
  parsePrice,
  type TableCartGuest,
  type TableCartItem,
} from '@/lib/table-cart/shared';
import type { CollaborativeTableCart } from '@/lib/table-cart/useCollaborativeTableCart';
import { hapticTap, hapticSuccess, hapticWarning } from '@/lib/haptics';

// ============================================================================
// 1. LIVE PRESENCE BAR (Header Pill in Hub & Menu)
// ============================================================================

export function TablePresenceBar({
  cart,
  tableLabel,
  accentColor,
  contrastText,
  onOpenCart,
  onAskJoin,
}: {
  cart: CollaborativeTableCart;
  tableLabel: string;
  accentColor: string;
  contrastText: string;
  onOpenCart: () => void;
  onAskJoin: () => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  if (cart.status === 'unavailable') return null;

  if (!cart.isActive) {
    return (
      <div className="w-full rounded-2xl border border-white/15 bg-black/50 backdrop-blur-md p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
          >
            <Users className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-extrabold text-white truncate">
                {tableLabel} • Ordine Condiviso
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 truncate">
              Ordina insieme ai tuoi amici in tempo reale
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            hapticTap();
            onAskJoin();
          }}
          disabled={cart.status === 'joining' || cart.status === 'restoring'}
          className="px-3 py-1.5 rounded-xl text-xs font-extrabold shrink-0 transition-all active:scale-95 cursor-pointer"
          style={{ backgroundColor: accentColor, color: contrastText }}
        >
          {cart.status === 'joining' || cart.status === 'restoring' ? 'Connessione...' : 'Unisciti al Tavolo'}
        </button>
      </div>
    );
  }

  const { guests, me, readyCheck } = cart;

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameDraft.trim();
    if (!trimmed) return;
    await cart.rename(trimmed);
    setEditingName(false);
  };

  return (
    <div className="w-full rounded-2xl border border-white/15 bg-black/55 backdrop-blur-md p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            hapticTap();
            onOpenCart();
          }}
          className="flex items-center gap-2 min-w-0 text-left cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="text-xs font-extrabold text-white truncate">{tableLabel}</span>
          <span className="text-[11px] text-zinc-400 shrink-0">
            • {guests.length} {guests.length === 1 ? 'commensale' : 'commensali'}
          </span>
        </button>

        {me && !editingName && (
          <button
            type="button"
            onClick={() => {
              hapticTap();
              setNameDraft(me.guest_name);
              setEditingName(true);
            }}
            className="text-[11px] text-zinc-300 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 shrink-0 cursor-pointer"
          >
            <span>Tu: <strong className="text-white">{me.guest_name}</strong></span>
            <Pencil className="w-2.5 h-2.5 text-zinc-400" />
          </button>
        )}
      </div>

      {editingName && (
        <form onSubmit={handleRenameSubmit} className="flex items-center gap-1.5 pt-0.5">
          <input
            type="text"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            maxLength={30}
            placeholder="Il tuo nome..."
            autoFocus
            className="flex-1 bg-zinc-900 border border-white/20 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
          />
          <button
            type="submit"
            className="px-2.5 py-1 rounded-lg text-xs font-bold"
            style={{ backgroundColor: accentColor, color: contrastText }}
          >
            Salva
          </button>
          <button
            type="button"
            onClick={() => setEditingName(false)}
            className="p-1 text-zinc-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </form>
      )}

      {/* Avatars strip */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {guests.map((g) => {
            const away = cart.isAway(g);
            return (
              <div
                key={g.id}
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-all ${
                  g.is_ready
                    ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                    : 'bg-white/5 border-white/10 text-zinc-200'
                } ${away ? 'opacity-50' : ''}`}
              >
                <span
                  className="w-4 h-4 rounded-full text-[9px] font-black text-black flex items-center justify-center shrink-0"
                  style={{ backgroundColor: g.color }}
                >
                  {getInitials(g.guest_name)}
                </span>
                <span className="truncate max-w-[80px]">{g.guest_name}</span>
                {g.is_ready ? (
                  <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                ) : (
                  <Clock className="w-2.5 h-2.5 text-zinc-400 shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {readyCheck.kind === 'waiting' && (
          <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/15 border border-amber-400/30 px-2 py-0.5 rounded-full shrink-0">
            {readyCheck.ready}/{readyCheck.total} pronti
          </span>
        )}
        {readyCheck.kind === 'all_ready' && (
          <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-400/40 px-2 py-0.5 rounded-full shrink-0 animate-pulse">
            Tutti pronti!
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 2. JOIN TABLE MODAL ("Come ti chiami?")
// ============================================================================

export function JoinTableModal({
  isOpen,
  tableLabel,
  savedName,
  joining,
  accentColor,
  contrastText,
  onClose,
  onJoin,
}: {
  isOpen: boolean;
  tableLabel: string;
  savedName: string;
  joining: boolean;
  accentColor: string;
  contrastText: string;
  onClose: () => void;
  onJoin: (name: string) => Promise<boolean>;
}) {
  const [name, setName] = useState(savedName || '');

  useEffect(() => {
    if (savedName && !name) setName(savedName);
  }, [savedName, name]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    hapticTap();
    await onJoin(name.trim());
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-[#131614] border border-white/15 p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold"
              style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
            >
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block">
                Carrello Condiviso Live
              </span>
              <h3 className="text-base font-extrabold text-white">{tableLabel}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed">
          Inserisci il tuo nome per vedere in tempo reale i piatti scelti dai tuoi amici, dividere i piatti al centro e confermare insieme l&apos;ordine.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[11px] font-bold text-zinc-300 block mb-1.5">
              Come ti chiami?
            </label>
            <input
              type="text"
              required
              maxLength={30}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Es. Marco"
              autoFocus
              className="w-full min-h-[44px] bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/40"
            />
          </div>

          <button
            type="submit"
            disabled={joining || !name.trim()}
            className="w-full min-h-[44px] rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: accentColor, color: contrastText }}
          >
            {joining ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Ingresso al tavolo...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Entra nel {tableLabel}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// 3. ADD DISH OPTIONS DRAWER ("Per me" vs "Al centro" + note)
// ============================================================================

export function AddDishCollaborativeSheet({
  dish,
  guestName,
  accentColor,
  contrastText,
  submitting,
  onClose,
  onConfirm,
}: {
  dish: CanvaDish | null;
  guestName: string;
  accentColor: string;
  contrastText: string;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (opts: { quantity: number; isShared: boolean; notes: string }) => Promise<void>;
}) {
  const [quantity, setQuantity] = useState(1);
  const [isShared, setIsShared] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (dish) {
      setQuantity(1);
      const hasSharedTag = (dish.tags || []).some((t) => /condivid|tagliere|centro/i.test(t));
      setIsShared(hasSharedTag);
      setNotes('');
    }
  }, [dish]);

  if (!dish) return null;

  const unitPrice = parsePrice(dish.price);
  const lineTotal = formatEuro(unitPrice * quantity);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    hapticSuccess();
    await onConfirm({ quantity, isShared, notes: notes.trim() });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-[#131614] border-t sm:border border-white/15 p-5 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              Aggiungi al carrello del tavolo
            </span>
            <h3 className="text-base font-extrabold text-white leading-snug">{dish.name}</h3>
            <p className="text-xs font-mono font-bold mt-0.5" style={{ color: accentColor }}>
              {dish.price}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Who is it for? */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-300 block">
              Per chi è questa portata?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  hapticTap();
                  setIsShared(false);
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  !isShared
                    ? 'bg-white/10 border-white/40 text-white'
                    : 'bg-white/[0.03] border-white/10 text-zinc-400'
                }`}
              >
                <span className="text-xs font-extrabold block">👤 Per me ({guestName})</span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">
                  Conteggiato nella tua quota
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  hapticTap();
                  setIsShared(true);
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  isShared
                    ? 'bg-amber-500/15 border-amber-400/50 text-amber-200'
                    : 'bg-white/[0.03] border-white/10 text-zinc-400'
                }`}
              >
                <span className="text-xs font-extrabold block">🤝 Al Centro</span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">
                  Diviso tra tutto il tavolo
                </span>
              </button>
            </div>
          </div>

          {/* Quantity */}
          <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-2xl p-3">
            <span className="text-xs font-bold text-zinc-200">Quantità</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  hapticTap();
                  setQuantity((q) => Math.max(1, q - 1));
                }}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-6 text-center font-mono text-sm font-extrabold text-white">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => {
                  hapticTap();
                  setQuantity((q) => Math.min(20, q + 1));
                }}
                className="w-8 h-8 rounded-xl flex items-center justify-center font-bold"
                style={{ backgroundColor: accentColor, color: contrastText }}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[11px] font-bold text-zinc-300 block mb-1">
              Note o variazioni (opzionale)
            </label>
            <input
              type="text"
              maxLength={160}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Es. ben cotta, senza cipolla, poco ghiaccio..."
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[46px] rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: accentColor, color: contrastText }}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Aggiunta in corso...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>
                  Aggiungi {isShared ? 'al Centro' : `per ${guestName}`} • {lineTotal}
                </span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// 4. FLOATING BOTTOM BAR (Shows Table Total + Personal Quota + Ready Check)
// ============================================================================

export function CollaborativeFloatingBar({
  cart,
  tableLabel,
  accentColor,
  contrastText,
  isLight = false,
  onOpenCart,
}: {
  cart: CollaborativeTableCart;
  tableLabel: string;
  accentColor: string;
  contrastText: string;
  isLight?: boolean;
  onOpenCart: () => void;
}) {
  if (!cart.isActive) return null;

  const hasDrafts = cart.draftCount > 0;
  const hasSent = cart.sent.length > 0;
  if (!hasDrafts && !hasSent) return null;

  const tableTotal = hasDrafts ? cart.draftShares.total : cart.sentShares.total;
  const myQuota = hasDrafts
    ? cart.myDraftShare?.total || 0
    : cart.mySentShare?.total || 0;

  return (
    <div
      className="p-3 rounded-2xl border shadow-2xl backdrop-blur-md flex items-center justify-between gap-3"
      style={{
        backgroundColor: isLight ? 'rgba(255,255,255,0.96)' : 'rgba(15,18,17,0.96)',
        borderColor: `${accentColor}55`,
        boxShadow: '0 8px 30px rgba(0,0,0,0.55)',
      }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 relative"
          style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center"
            style={{ backgroundColor: accentColor, color: contrastText }}
          >
            {hasDrafts ? cart.draftCount : cart.sent.length}
          </span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className={`text-xs font-extrabold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {tableLabel}: {formatEuro(tableTotal)}
            </p>
            {cart.readyCheck.kind === 'waiting' && (
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                {cart.readyCheck.ready}/{cart.readyCheck.total} ✅
              </span>
            )}
          </div>
          <p className="text-[11px] font-mono text-zinc-400 truncate">
            La tua quota: <strong style={{ color: accentColor }}>{formatEuro(myQuota)}</strong>
            {!hasDrafts && hasSent ? ' (In cucina 👨‍🍳)' : ''}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          hapticTap();
          onOpenCart();
        }}
        className="px-3.5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-lg active:scale-95 shrink-0 cursor-pointer"
        style={{
          backgroundColor: accentColor,
          color: contrastText,
          boxShadow: `0 4px 16px ${accentColor}45`,
        }}
      >
        <Receipt className="w-3.5 h-3.5" />
        <span>{hasDrafts ? 'Vedi Ordine' : 'Riepilogo'}</span>
      </button>
    </div>
  );
}

// ============================================================================
// 5. FULL COLLABORATIVE CART MODAL / SHEET WITH UNANIMOUS READY CHECK
// ============================================================================

export function CollaborativeTableCartModal({
  isOpen,
  cart,
  tableLabel,
  accentColor,
  contrastText,
  onClose,
  onOpenSmartBill,
}: {
  isOpen: boolean;
  cart: CollaborativeTableCart;
  tableLabel: string;
  accentColor: string;
  contrastText: string;
  onClose: () => void;
  onOpenSmartBill: (prefill: { tableTotal: number; myQuota: number; guestCount: number }) => void;
}) {
  const [nudgedGuestId, setNudgedGuestId] = useState<string | null>(null);

  if (!isOpen || !cart.isActive) return null;

  const {
    guests,
    me,
    myDrafts,
    othersDrafts,
    sharedDrafts,
    sent,
    draftShares,
    sentShares,
    readyCheck,
    countdown,
    lastSubmittedRound,
    canForce,
    forceAvailableInMs,
  } = cart;

  const guestMap = new Map<string, TableCartGuest>(guests.map((g) => [g.id, g]));
  const myDraftQuota = cart.myDraftShare?.total || 0;
  const mySentQuota = cart.mySentShare?.total || 0;
  const combinedTableTotal = draftShares.total + sentShares.total;
  const combinedMyQuota = myDraftQuota + mySentQuota;

  const handleNudge = (g: TableCartGuest) => {
    hapticTap();
    cart.nudge(g.id);
    setNudgedGuestId(g.id);
    setTimeout(() => {
      setNudgedGuestId((prev) => (prev === g.id ? null : prev));
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-[#111413] border-t sm:border border-white/15 rounded-t-3xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden space-y-3.5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold"
              style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
            >
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  {tableLabel} — Ordine di Gruppo
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {guests.length} al tavolo
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                L&apos;ordine parte quando tutti i commensali confermano di essere pronti
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              hapticTap();
              onClose();
            }}
            className="p-1.5 text-zinc-400 hover:text-white rounded-xl min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Unanimous Countdown Overlay Banner */}
        {countdown !== null && (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400/60 text-center space-y-2.5 animate-pulse shrink-0">
            <div className="flex items-center justify-center gap-2 text-emerald-300 font-extrabold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>TUTTI PRONTI! ({guests.length}/{guests.length})</span>
            </div>
            <p className="text-xs text-white font-bold">
              Invio della comanda in cucina tra{' '}
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-400 text-black font-mono font-black text-sm mx-1">
                {countdown}
              </span>{' '}
              secondi...
            </p>
            <button
              type="button"
              onClick={() => {
                hapticWarning();
                cart.setReady(false);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-amber-300 border border-amber-400/40 text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Annulla se hai dimenticato qualcosa</span>
            </button>
          </div>
        )}

        {/* Just-submitted celebration banner */}
        {lastSubmittedRound !== null && cart.drafts.length === 0 && (
          <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <h4 className="text-xs font-extrabold text-white">
                  Comanda #{lastSubmittedRound} inviata in cucina! 👨‍🍳
                </h4>
                <p className="text-[11px] text-zinc-300">
                  Il personale ha ricevuto l&apos;ordine di tutto il tavolo. Potete ordinare altri giri quando volete.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={cart.dismissSubmitted}
              className="text-zinc-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 space-y-4 pr-1">
          {cart.drafts.length === 0 && sent.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <UtensilsCrossed className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-xs font-bold text-zinc-300">Il carrello del tavolo è vuoto</p>
              <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                Aggiungi i tuoi piatti dal menù: compariranno qui in tempo reale per tutto il tavolo.
              </p>
            </div>
          ) : (
            <>
              {/* 1. MY DISHES */}
              {me && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full inline-block"
                        style={{ backgroundColor: me.color }}
                      />
                      I Tuoi Piatti ({me.guest_name})
                    </span>
                    <span className="text-xs font-mono font-bold text-white">
                      {formatEuro(cart.myDraftShare?.personal || 0)}
                    </span>
                  </div>

                  {myDrafts.length === 0 ? (
                    <p className="text-[11px] text-zinc-500 italic bg-white/[0.02] border border-white/5 rounded-xl p-2.5">
                      Non hai ancora aggiunto piatti personali in questo giro.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {myDrafts.map((item) => (
                        <EditableCartItemRow
                          key={item.id}
                          item={item}
                          accentColor={accentColor}
                          contrastText={contrastText}
                          onQuantityChange={(q) => cart.updateItem(item.id, { quantity: q })}
                          onToggleShared={() => cart.updateItem(item.id, { isShared: !item.is_shared })}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 2. SHARED DISHES ("AL CENTRO") */}
              {sharedDrafts.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5" />
                      Al Centro • Condivisi ({formatEuro( (draftShares.sharedTotal) / Math.max(1, guests.length) )} a testa)
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-300">
                      {formatEuro(draftShares.sharedTotal)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {sharedDrafts.map((item) => {
                      const author = item.guest_id ? guestMap.get(item.guest_id) : null;
                      const isMine = item.guest_id === me?.id;
                      return isMine ? (
                        <EditableCartItemRow
                          key={item.id}
                          item={item}
                          accentColor={accentColor}
                          contrastText={contrastText}
                          onQuantityChange={(q) => cart.updateItem(item.id, { quantity: q })}
                          onToggleShared={() => cart.updateItem(item.id, { isShared: !item.is_shared })}
                        />
                      ) : (
                        <ReadOnlyCartItemRow key={item.id} item={item} author={author || null} />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. OTHERS' DISHES */}
              {othersDrafts.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 block">
                    👥 Piatti degli altri commensali
                  </span>
                  <div className="space-y-2">
                    {othersDrafts.map((item) => {
                      const author = item.guest_id ? guestMap.get(item.guest_id) : null;
                      return <ReadOnlyCartItemRow key={item.id} item={item} author={author || null} />;
                    })}
                  </div>
                </div>
              )}

              {/* 4. ALREADY SENT TO KITCHEN */}
              {sent.length > 0 && (
                <div className="pt-2 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <ChefHat className="w-3.5 h-3.5" />
                      Già Inviati in Cucina ({sent.reduce((a, i) => a + i.quantity, 0)} portate)
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {formatEuro(sentShares.total)}
                    </span>
                  </div>
                  <div className="space-y-1.5 opacity-85">
                    {sent.map((item) => {
                      const author = item.guest_id ? guestMap.get(item.guest_id) : null;
                      return (
                        <div
                          key={item.id}
                          className="px-3 py-2 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono font-bold text-emerald-300">
                              {item.quantity}x
                            </span>
                            <span className="text-white font-semibold truncate">{item.dish_name}</span>
                            {item.is_shared ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 shrink-0">
                                🤝 Centro
                              </span>
                            ) : author ? (
                              <span className="text-[10px] text-zinc-400 shrink-0">
                                ({author.guest_name})
                              </span>
                            ) : null}
                          </div>
                          <span className="font-mono text-zinc-300 shrink-0 ml-2">
                            {formatEuro(item.unit_price * item.quantity)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ================================================================= */}
        {/* READY CHECK BAR & QUOTA FOOTER */}
        {/* ================================================================= */}
        <div className="pt-3 border-t border-white/10 space-y-3 shrink-0">
          {/* Quota Summary */}
          <div className="grid grid-cols-2 gap-2 bg-black/40 border border-white/10 rounded-2xl p-2.5">
            <div>
              <span className="text-[10px] uppercase text-zinc-400 font-semibold block">
                Totale Tavolo
              </span>
              <span className="text-sm font-mono font-extrabold text-white">
                {formatEuro(combinedTableTotal)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase text-zinc-400 font-semibold block">
                La tua quota ({me?.guest_name})
              </span>
              <span className="text-sm font-mono font-extrabold" style={{ color: accentColor }}>
                {formatEuro(combinedMyQuota)}
              </span>
            </div>
          </div>

          {/* Ready Check Grid when there are draft items */}
          {cart.drafts.length > 0 && (
            <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-300">
                  Conferma del Tavolo (Ready Check)
                </span>
                {readyCheck.kind === 'waiting' && (
                  <span className="text-[11px] font-mono font-bold text-amber-400">
                    {readyCheck.ready}/{readyCheck.total} Pronti
                  </span>
                )}
              </div>

              {/* Guest Status Pills + Nudge button */}
              <div className="grid grid-cols-2 gap-1.5">
                {guests.map((g) => {
                  const isMe = g.id === me?.id;
                  const justNudged = nudgedGuestId === g.id;
                  return (
                    <div
                      key={g.id}
                      className={`px-2.5 py-1.5 rounded-xl border flex items-center justify-between gap-1.5 text-xs ${
                        g.is_ready
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                          : 'bg-black/40 border-white/10 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-4 h-4 rounded-full text-[9px] font-black text-black flex items-center justify-center shrink-0"
                          style={{ backgroundColor: g.color }}
                        >
                          {getInitials(g.guest_name)}
                        </span>
                        <span className="truncate font-semibold text-[11px]">
                          {g.guest_name} {isMe ? '(Tu)' : ''}
                        </span>
                      </div>

                      {g.is_ready ? (
                        <span className="text-[10px] font-bold text-emerald-400 shrink-0">
                          ✅ Pronto
                        </span>
                      ) : !isMe ? (
                        <button
                          type="button"
                          onClick={() => handleNudge(g)}
                          className="px-1.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center gap-0.5 shrink-0 cursor-pointer"
                          title={`Invia un promemoria a ${g.guest_name}`}
                        >
                          <Bell className="w-2.5 h-2.5" />
                          <span>{justNudged ? 'Inviato!' : 'Bussa'}</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-zinc-400 shrink-0">⏳ Scegliendo</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Primary Ready Toggle Button */}
              {me && (
                <button
                  type="button"
                  onClick={() => {
                    hapticSuccess();
                    cart.setReady(!me.is_ready);
                  }}
                  disabled={cart.pendingAction === 'set_ready' || cart.pendingAction === 'submit'}
                  className={`w-full min-h-[46px] rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer ${
                    me.is_ready
                      ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                      : ''
                  }`}
                  style={
                    !me.is_ready
                      ? { backgroundColor: accentColor, color: contrastText }
                      : undefined
                  }
                >
                  {me.is_ready ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Sei pronto! In attesa degli altri... (Tocca per modificare)</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Sono pronto a ordinare! ✅</span>
                    </>
                  )}
                </button>
              )}

              {/* Fallback Force Submit if someone is away / unresponsive */}
              {canForce && readyCheck.kind === 'waiting' && (
                <button
                  type="button"
                  onClick={() => {
                    hapticWarning();
                    cart.submit(true);
                  }}
                  className="w-full py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-amber-200 text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>
                    {readyCheck.waitingFor.map((w) => w.guest_name).join(', ')} non risponde? Invia ora i piatti confermati
                  </span>
                </button>
              )}

              {!canForce &&
                me?.is_ready &&
                readyCheck.kind === 'waiting' &&
                forceAvailableInMs !== null &&
                forceAvailableInMs > 0 && (
                  <p className="text-[10px] text-center text-zinc-500">
                    In attesa che {readyCheck.waitingFor.map((w) => w.guest_name).join(', ')} tocchi &ldquo;Sono pronto&rdquo;...
                  </p>
                )}
            </div>
          )}

          {/* SmartBill Integration Button */}
          <button
            type="button"
            onClick={() => {
              hapticTap();
              onClose();
              onOpenSmartBill({
                tableTotal: combinedTableTotal,
                myQuota: combinedMyQuota,
                guestCount: Math.max(1, guests.length),
              });
            }}
            className="w-full py-2.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>
              Chiedi il Conto / Paga la tua quota ({formatEuro(combinedMyQuota)})
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Sub-rows for Editable (mine) vs Read-only (friends') items
// ============================================================================

function EditableCartItemRow({
  item,
  accentColor,
  contrastText,
  onQuantityChange,
  onToggleShared,
}: {
  item: TableCartItem;
  accentColor: string;
  contrastText: string;
  onQuantityChange: (q: number) => void;
  onToggleShared: () => void;
}) {
  return (
    <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-2.5">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <h4 className="text-xs font-bold text-white truncate">{item.dish_name}</h4>
          <button
            type="button"
            onClick={() => {
              hapticTap();
              onToggleShared();
            }}
            className={`text-[9px] px-1.5 py-0.5 rounded font-bold border cursor-pointer ${
              item.is_shared
                ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
            }`}
            title="Cambia tra piatto personale e condiviso al centro"
          >
            {item.is_shared ? '🤝 Al Centro' : '👤 Personale'}
          </button>
        </div>
        {item.notes && (
          <p className="text-[10px] text-amber-300/90 italic truncate">Note: {item.notes}</p>
        )}
        <p className="text-[10px] text-zinc-400 font-mono">
          {formatEuro(item.unit_price)} cad. •{' '}
          <strong style={{ color: accentColor }}>
            {formatEuro(item.unit_price * item.quantity)}
          </strong>
        </p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => {
            hapticTap();
            onQuantityChange(item.quantity - 1);
          }}
          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center active:scale-95"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="w-5 text-center text-xs font-bold font-mono text-white">
          {item.quantity}
        </span>
        <button
          type="button"
          onClick={() => {
            hapticTap();
            onQuantityChange(item.quantity + 1);
          }}
          className="w-7 h-7 rounded-lg flex items-center justify-center active:scale-95"
          style={{ backgroundColor: accentColor, color: contrastText }}
        >
          <Plus className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => {
            hapticTap();
            onQuantityChange(0);
          }}
          className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center active:scale-95 ml-0.5"
          title="Rimuovi piatto"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function ReadOnlyCartItemRow({
  item,
  author,
}: {
  item: TableCartItem;
  author: TableCartGuest | null;
}) {
  return (
    <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-2.5">
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {author && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-black shrink-0"
              style={{ backgroundColor: author.color }}
            >
              {author.guest_name}
            </span>
          )}
          <h4 className="text-xs font-bold text-zinc-200 truncate">
            {item.quantity}x {item.dish_name}
          </h4>
        </div>
        {item.notes && (
          <p className="text-[10px] text-zinc-400 italic truncate">Note: {item.notes}</p>
        )}
      </div>
      <span className="text-xs font-mono font-bold text-zinc-300 shrink-0">
        {formatEuro(item.unit_price * item.quantity)}
      </span>
    </div>
  );
}
