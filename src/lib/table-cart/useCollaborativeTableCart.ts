'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import {
  canForceSubmit,
  computeGuestShares,
  getReadyCheckStatus,
  isGuestAway,
  type TableCartGuest,
  type TableCartItem,
  type TableCartState,
} from './shared';

export type TableCartStatus = 'idle' | 'restoring' | 'joining' | 'active' | 'unavailable';

interface StoredCredentials {
  sessionId: string | null;
  token: string | null;
  name: string | null;
}

export interface DishInput {
  id: string;
  name: string;
  price: string | number;
}

export interface TableCartEvents {
  onGuestJoined?: (name: string) => void;
  onNudged?: (fromName: string) => void;
  onSubmitted?: (info: { round: number; byMe: boolean }) => void;
  onError?: (message: string) => void;
}

const POLL_INTERVAL_MS = 12_000;
const COUNTDOWN_SECONDS = 3;
/** After this wait, ready guests may send without the missing ones. */
export const FORCE_SUBMIT_AFTER_MS = 60_000;

const storageKey = (deviceId: string) => `rivo_table_cart_${deviceId}`;

function readCredentials(deviceId: string): StoredCredentials {
  if (typeof window === 'undefined') return { sessionId: null, token: null, name: null };
  try {
    const raw = localStorage.getItem(storageKey(deviceId));
    if (raw) return { sessionId: null, token: null, name: null, ...JSON.parse(raw) };
  } catch {
    // corrupted storage: ignore
  }
  return { sessionId: null, token: null, name: localStorage.getItem('rivo_guest_name') };
}

function writeCredentials(deviceId: string, creds: StoredCredentials) {
  try {
    localStorage.setItem(storageKey(deviceId), JSON.stringify(creds));
    if (creds.name) localStorage.setItem('rivo_guest_name', creds.name);
  } catch {
    // private mode / quota: the session simply won't survive a reload
  }
}

class TableCartRequestError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

/**
 * Collaborative Table Cart hook.
 * - Joins the active session of the table device (one per table)
 * - Keeps every phone in sync through Supabase Realtime broadcast + presence
 *   (with polling fallback), while all data goes through /api/table-cart
 * - Implements the Ready Check: when everybody is ready a 3s countdown
 *   starts on every phone, then the round is sent to the kitchen.
 */
export function useCollaborativeTableCart({
  supabase,
  deviceId,
  enabled,
  events,
}: {
  supabase: SupabaseClient;
  deviceId: string | null | undefined;
  enabled: boolean;
  events?: TableCartEvents;
}) {
  const [status, setStatus] = useState<TableCartStatus>('idle');
  const [state, setState] = useState<TableCartState | null>(null);
  const [savedName, setSavedName] = useState<string>('');
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [onlineGuestIds, setOnlineGuestIds] = useState<Set<string>>(new Set());
  const [countdown, setCountdown] = useState<number | null>(null);
  const [lastSubmittedRound, setLastSubmittedRound] = useState<number | null>(null);
  const [clockSkewMs, setClockSkewMs] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  const tokenRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const eventsRef = useRef(events);
  const knownGuestIdsRef = useRef<Set<string> | null>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  // -------------------------------------------------------------------------
  // Networking
  // -------------------------------------------------------------------------

  const applyState = useCallback((next: TableCartState) => {
    setClockSkewMs(new Date(next.serverTime).getTime() - Date.now());

    // "Sara si è seduta al tavolo" toasts
    const known = knownGuestIdsRef.current;
    if (known) {
      for (const g of next.guests) {
        if (!known.has(g.id) && g.id !== next.me?.id) eventsRef.current?.onGuestJoined?.(g.guest_name);
      }
    }
    knownGuestIdsRef.current = new Set(next.guests.map((g) => g.id));

    setState((prev) => {
      // A round was sent by someone else while we were away from the screen
      if (prev && next.session.current_round > prev.session.current_round) {
        setLastSubmittedRound(next.session.current_round - 1);
      }
      return next;
    });
  }, []);

  const request = useCallback(async (method: 'GET' | 'POST', body?: Record<string, unknown>) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (tokenRef.current) headers['x-table-guest-token'] = tokenRef.current;
    const url =
      method === 'GET'
        ? `/api/table-cart?session_id=${encodeURIComponent(sessionIdRef.current || '')}`
        : '/api/table-cart';
    const res = await fetch(url, {
      method,
      headers,
      body: method === 'POST' ? JSON.stringify(body || {}) : undefined,
      cache: 'no-store',
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new TableCartRequestError(res.status, json.error || 'Errore di rete', json.code);
    return json;
  }, []);

  const resetToIdle = useCallback(() => {
    sessionIdRef.current = null;
    tokenRef.current = null;
    knownGuestIdsRef.current = null;
    setState(null);
    setStatus('idle');
  }, []);

  const handleRequestError = useCallback(
    (err: unknown) => {
      if (err instanceof TableCartRequestError) {
        if (err.code === 'unavailable') {
          setStatus('unavailable');
          return;
        }
        if (err.status === 401 || err.status === 410 || err.code === 'session_not_found') {
          // Table closed or credentials no longer valid: ask to join again
          if (deviceId) writeCredentials(deviceId, { sessionId: null, token: null, name: savedName || null });
          resetToIdle();
          eventsRef.current?.onError?.(err.status === 410 ? 'Il tavolo è stato chiuso. Unisciti di nuovo.' : err.message);
          return;
        }
        eventsRef.current?.onError?.(err.message);
        return;
      }
      eventsRef.current?.onError?.('Connessione assente: riprova tra un attimo');
    },
    [deviceId, resetToIdle, savedName]
  );

  const refresh = useCallback(async () => {
    if (!sessionIdRef.current || !tokenRef.current) return;
    try {
      applyState(await request('GET'));
    } catch (err) {
      handleRequestError(err);
    }
  }, [applyState, handleRequestError, request]);

  const broadcast = useCallback((event: string, payload: Record<string, unknown> = {}) => {
    channelRef.current?.send({ type: 'broadcast', event, payload }).catch(() => {});
  }, []);

  /** Runs a mutation, applies the returned state and pings the other phones. */
  const mutate = useCallback(
    async (actionName: string, body: Record<string, unknown>) => {
      if (!sessionIdRef.current) return null;
      setPendingAction(actionName);
      try {
        const json = await request('POST', { ...body, session_id: sessionIdRef.current });
        applyState(json);
        broadcast('cart_changed');
        return json;
      } catch (err) {
        handleRequestError(err);
        return null;
      } finally {
        setPendingAction(null);
      }
    },
    [applyState, broadcast, handleRequestError, request]
  );

  // -------------------------------------------------------------------------
  // Restore a previous session on this phone (reload, screen lock…)
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!enabled || !deviceId) return;
    const creds = readCredentials(deviceId);
    setSavedName(creds.name || '');
    if (!creds.sessionId || !creds.token) return;

    sessionIdRef.current = creds.sessionId;
    tokenRef.current = creds.token;
    setStatus('restoring');

    let cancelled = false;
    request('GET')
      .then((json) => {
        if (cancelled) return;
        applyState(json);
        setStatus('active');
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof TableCartRequestError && err.code === 'unavailable') {
          setStatus('unavailable');
          return;
        }
        // Stale session: keep the name to pre-fill the join sheet
        writeCredentials(deviceId, { sessionId: null, token: null, name: creds.name });
        resetToIdle();
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, deviceId, request, applyState, resetToIdle]);

  const join = useCallback(
    async (guestName: string) => {
      if (!deviceId) return false;
      const name = guestName.trim();
      if (!name) return false;
      setStatus('joining');
      const previous = readCredentials(deviceId);
      try {
        const json = await request('POST', {
          action: 'join',
          device_id: deviceId,
          guest_name: name,
          guest_token: previous.token || undefined,
        });
        tokenRef.current = json.guest_token;
        sessionIdRef.current = json.state.session.id;
        writeCredentials(deviceId, { sessionId: json.state.session.id, token: json.guest_token, name });
        setSavedName(name);
        knownGuestIdsRef.current = null;
        applyState(json.state);
        setStatus('active');
        broadcast('cart_changed');
        return true;
      } catch (err) {
        if (err instanceof TableCartRequestError && err.code === 'unavailable') {
          setStatus('unavailable');
        } else {
          setStatus('idle');
          eventsRef.current?.onError?.(err instanceof Error ? err.message : 'Impossibile unirsi al tavolo');
        }
        return false;
      }
    },
    [applyState, broadcast, deviceId, request]
  );

  // -------------------------------------------------------------------------
  // Realtime: presence (who's at the table) + broadcast (sync pings, nudges)
  // -------------------------------------------------------------------------

  const sessionId = state?.session.id || null;
  const meId = state?.me?.id || null;

  useEffect(() => {
    if (status !== 'active' || !sessionId || !meId) return;

    const channel = supabase.channel(`table-cart:${sessionId}`, {
      config: { broadcast: { self: false }, presence: { key: meId } },
    });

    channel
      .on('broadcast', { event: 'cart_changed' }, () => {
        refresh();
      })
      .on('broadcast', { event: 'nudge' }, ({ payload }) => {
        if (payload?.to === meId) eventsRef.current?.onNudged?.(String(payload.fromName || 'Il tavolo'));
      })
      .on('broadcast', { event: 'submitted' }, ({ payload }) => {
        setLastSubmittedRound(Number(payload?.round) || null);
        eventsRef.current?.onSubmitted?.({ round: Number(payload?.round) || 0, byMe: false });
        refresh();
      })
      .on('presence', { event: 'sync' }, () => {
        setOnlineGuestIds(new Set(Object.keys(channel.presenceState())));
      })
      .subscribe((subStatus) => {
        if (subStatus === 'SUBSCRIBED') {
          channel.track({ guest_id: meId, at: Date.now() }).catch(() => {});
        }
      });

    channelRef.current = channel;
    return () => {
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [status, sessionId, meId, supabase, refresh]);

  // Polling fallback + heartbeat, and instant refresh when the phone wakes up
  useEffect(() => {
    if (status !== 'active') return;
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', refresh);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', refresh);
    };
  }, [status, refresh]);

  // 1s clock for "waiting since…" logic
  useEffect(() => {
    if (status !== 'active') return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [status]);

  // -------------------------------------------------------------------------
  // Derived data
  // -------------------------------------------------------------------------

  const derived = useMemo(() => {
    const guests: TableCartGuest[] = state?.guests || [];
    const items: TableCartItem[] = state?.items || [];
    const me = state?.me || null;
    const drafts = items.filter((i) => i.status === 'draft');
    const sent = items.filter((i) => i.status === 'sent');

    const myDrafts = drafts.filter((i) => i.guest_id === me?.id && !i.is_shared);
    const sharedDrafts = drafts.filter((i) => i.is_shared);
    const othersDrafts = drafts.filter((i) => i.guest_id !== me?.id && !i.is_shared);

    const draftShares = computeGuestShares(drafts, guests);
    const sentShares = computeGuestShares(sent, guests);
    const readyCheck = getReadyCheckStatus(guests, drafts);

    // Quantity of each dish *I* have in the draft cart (menu badges)
    const myDishQuantities: Record<string, number> = {};
    for (const i of drafts) {
      if (i.guest_id === me?.id) myDishQuantities[i.dish_id] = (myDishQuantities[i.dish_id] || 0) + i.quantity;
    }

    const serverNow = now + clockSkewMs;
    const isAway = (g: TableCartGuest) =>
      onlineGuestIds.size > 0 ? !onlineGuestIds.has(g.id) && isGuestAway(g, serverNow) : isGuestAway(g, serverNow);

    const myReadySinceMs = me?.is_ready && me.ready_at ? serverNow - new Date(me.ready_at).getTime() : 0;
    const waitingForAwayOnly =
      readyCheck.kind === 'waiting' && readyCheck.waitingFor.length > 0 && readyCheck.waitingFor.every(isAway);
    const canForce =
      readyCheck.kind === 'waiting' &&
      !!me?.is_ready &&
      canForceSubmit(guests, serverNow) &&
      (myReadySinceMs >= FORCE_SUBMIT_AFTER_MS || waitingForAwayOnly);

    return {
      guests,
      me,
      drafts,
      sent,
      myDrafts,
      sharedDrafts,
      othersDrafts,
      draftShares,
      sentShares,
      readyCheck,
      myDishQuantities,
      draftCount: drafts.reduce((a, i) => a + i.quantity, 0),
      myDraftShare: draftShares.shares.find((s) => s.guestId === me?.id) || null,
      mySentShare: sentShares.shares.find((s) => s.guestId === me?.id) || null,
      canForce,
      forceAvailableInMs: me?.is_ready ? Math.max(0, FORCE_SUBMIT_AFTER_MS - myReadySinceMs) : null,
      isAway,
    };
  }, [state, onlineGuestIds, now, clockSkewMs]);

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  const addItem = useCallback(
    (dish: DishInput, opts?: { quantity?: number; notes?: string; isShared?: boolean }) =>
      mutate('add_item', {
        action: 'add_item',
        dish: { id: dish.id, name: dish.name, price: dish.price },
        quantity: opts?.quantity || 1,
        notes: opts?.notes || undefined,
        is_shared: opts?.isShared === true,
      }),
    [mutate]
  );

  const updateItem = useCallback(
    (itemId: string, patch: { quantity?: number; notes?: string | null; isShared?: boolean }) =>
      mutate('update_item', {
        action: 'update_item',
        item_id: itemId,
        quantity: patch.quantity,
        notes: patch.notes === undefined ? undefined : patch.notes || '',
        is_shared: patch.isShared,
      }),
    [mutate]
  );

  /** Removes one unit of a dish from my most recent matching draft line. */
  const decrementDish = useCallback(
    (dishId: string) => {
      const line = [...derived.drafts].reverse().find((i) => i.dish_id === dishId && i.guest_id === derived.me?.id);
      if (!line) return Promise.resolve(null);
      return updateItem(line.id, { quantity: line.quantity - 1 });
    },
    [derived.drafts, derived.me?.id, updateItem]
  );

  const setReady = useCallback((ready: boolean) => mutate('set_ready', { action: 'set_ready', ready }), [mutate]);

  const rename = useCallback(
    async (name: string) => {
      const res = await mutate('rename', { action: 'rename', guest_name: name });
      if (res && deviceId) {
        writeCredentials(deviceId, { sessionId: sessionIdRef.current, token: tokenRef.current, name });
        setSavedName(name);
      }
      return res;
    },
    [deviceId, mutate]
  );

  const nudge = useCallback(
    (guestId: string) => {
      broadcast('nudge', { to: guestId, fromName: derived.me?.guest_name || 'Il tavolo' });
    },
    [broadcast, derived.me?.guest_name]
  );

  const submit = useCallback(
    async (force = false) => {
      if (!state || submittingRef.current) return null;
      submittingRef.current = true;
      const round = state.session.current_round;
      try {
        const json = await mutate('submit', { action: 'submit', force, round });
        if (json?.submitted) {
          setLastSubmittedRound(round);
          broadcast('submitted', { round });
          eventsRef.current?.onSubmitted?.({ round, byMe: true });
        } else if (json?.already_submitted) {
          setLastSubmittedRound(round);
        }
        return json;
      } finally {
        submittingRef.current = false;
      }
    },
    [broadcast, mutate, state]
  );

  // -------------------------------------------------------------------------
  // Unanimous Ready Check → 3s countdown on every phone → submit
  // -------------------------------------------------------------------------

  const allReady = derived.readyCheck.kind === 'all_ready';
  const currentRound = state?.session.current_round;

  useEffect(() => {
    if (!allReady) {
      setCountdown(null);
      return;
    }
    setCountdown(COUNTDOWN_SECONDS);
    const timer = setInterval(() => {
      setCountdown((c) => (c === null ? null : c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [allReady, currentRound]);

  useEffect(() => {
    if (countdown === 0 && allReady) {
      setCountdown(null);
      submit(false);
    }
  }, [countdown, allReady, submit]);

  return {
    status,
    isActive: status === 'active' && !!state,
    state,
    savedName,
    pendingAction,
    onlineGuestIds,
    countdown,
    lastSubmittedRound,
    dismissSubmitted: () => setLastSubmittedRound(null),
    ...derived,
    join,
    refresh,
    addItem,
    updateItem,
    decrementDish,
    setReady,
    rename,
    nudge,
    submit,
  };
}

export type CollaborativeTableCart = ReturnType<typeof useCollaborativeTableCart>;
