import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createHash, randomBytes } from 'node:crypto';
import { isValidUUID, sanitizeString } from '@/lib/security';
import { getDefaultCanvaMenuConfig, type CanvaDish, type CanvaMenuConfig } from '@/lib/canva-menu';
import { findAssignedWaiterId, notifyTelegramStaff, type ServiceOrderDetails } from '@/lib/service-notify';
import {
  MAX_DRAFT_ITEMS_PER_SESSION,
  MAX_GUESTS_PER_SESSION,
  MAX_GUEST_NAME_LENGTH,
  MAX_ITEM_NOTES_LENGTH,
  MAX_ITEM_QUANTITY,
  SESSION_IDLE_TIMEOUT_MS,
  canForceSubmit,
  computeGuestShares,
  formatEuro,
  getReadyCheckStatus,
  parsePrice,
  pickGuestColor,
  type TableCartGuest,
  type TableCartItem,
  type TableCartSession,
  type TableCartState,
} from '@/lib/table-cart/shared';

/**
 * /api/table-cart — Collaborative Table Cart (multiplayer table order)
 *
 * GET  ?session_id=…            (header x-table-guest-token)  → current table state + heartbeat
 * POST { action: 'join', device_id, guest_name, guest_token? } → joins/creates the table session
 * POST { action, session_id, … } (header x-table-guest-token)  → add_item | update_item | set_ready | rename | submit
 *
 * Guests never touch the database directly: tables are RLS-locked and only
 * this route (service role) reads/writes them.
 */

const GUEST_TOKEN_HEADER = 'x-table-guest-token';

const GUEST_COLUMNS = 'id, guest_name, color, is_ready, ready_at, last_seen_at, created_at';
const ITEM_COLUMNS =
  'id, guest_id, dish_id, dish_name, unit_price, quantity, notes, is_shared, is_custom, status, order_round, created_at';
const SESSION_COLUMNS = 'id, organization_id, device_id, table_label, status, current_round, created_at, updated_at';

type SessionRow = TableCartSession & { updated_at: string };

class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

function getAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new ApiError(503, 'Carrello condiviso non disponibile', 'unavailable');
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function newSecret(): string {
  return randomBytes(32).toString('base64url');
}

function cleanName(raw: unknown): string {
  const name = sanitizeString(raw, MAX_GUEST_NAME_LENGTH)?.replace(/\s+/g, ' ');
  if (!name || name.length < 1) throw new ApiError(400, 'Inserisci il tuo nome');
  return name;
}

function errorResponse(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
  }
  console.error('[table-cart] Unexpected error:', err);
  return NextResponse.json({ error: 'Errore interno, riprova' }, { status: 500 });
}

// ---------------------------------------------------------------------------
// Data access helpers
// ---------------------------------------------------------------------------

function normalizeItem(row: Record<string, unknown>): TableCartItem {
  return { ...(row as unknown as TableCartItem), unit_price: Number(row.unit_price) || 0 };
}

async function loadState(sb: SupabaseClient, session: SessionRow, meId: string | null): Promise<TableCartState> {
  const [{ data: guests, error: gErr }, { data: items, error: iErr }] = await Promise.all([
    sb.from('table_session_guests').select(GUEST_COLUMNS).eq('session_id', session.id).order('created_at'),
    sb.from('table_cart_items').select(ITEM_COLUMNS).eq('session_id', session.id).order('created_at'),
  ]);
  if (gErr || iErr) throw new ApiError(500, 'Impossibile caricare il tavolo');

  const guestList = (guests || []) as TableCartGuest[];
  const { updated_at: _updatedAt, ...publicSession } = session;
  void _updatedAt;
  return {
    session: publicSession,
    guests: guestList,
    items: (items || []).map((r) => normalizeItem(r as Record<string, unknown>)),
    me: guestList.find((g) => g.id === meId) || null,
    serverTime: new Date().toISOString(),
  };
}

async function getSession(sb: SupabaseClient, sessionId: string): Promise<SessionRow> {
  const { data, error } = await sb.from('table_sessions').select(SESSION_COLUMNS).eq('id', sessionId).maybeSingle();
  if (error || !data) throw new ApiError(404, 'Tavolo non trovato', 'session_not_found');
  return data as SessionRow;
}

/** Authenticates the guest by token and checks the session is still open. */
async function authenticate(sb: SupabaseClient, request: NextRequest, sessionId: unknown) {
  if (!isValidUUID(sessionId)) throw new ApiError(400, 'Sessione tavolo non valida');
  const token = request.headers.get(GUEST_TOKEN_HEADER);
  if (!token || token.length < 20 || token.length > 200) throw new ApiError(401, 'Accesso al tavolo non valido', 'unauthorized');

  const { data: guest } = await sb
    .from('table_session_guests')
    .select(`${GUEST_COLUMNS}, session_id`)
    .eq('guest_token_hash', hashToken(token))
    .maybeSingle();

  if (!guest || guest.session_id !== sessionId) throw new ApiError(401, 'Accesso al tavolo non valido', 'unauthorized');

  const session = await getSession(sb, sessionId as string);
  if (session.status !== 'active') throw new ApiError(410, 'Il tavolo è stato chiuso', 'session_closed');

  return { guest: guest as TableCartGuest & { session_id: string }, session };
}

async function touchSession(sb: SupabaseClient, sessionId: string) {
  await sb.from('table_sessions').update({ updated_at: new Date().toISOString() }).eq('id', sessionId);
}

async function setGuestReady(sb: SupabaseClient, guestId: string, ready: boolean) {
  await sb
    .from('table_session_guests')
    .update({ is_ready: ready, ready_at: ready ? new Date().toISOString() : null })
    .eq('id', guestId);
}

/** Finds the dish in the venue menu so names & prices can't be forged by the client. */
async function resolveDish(
  sb: SupabaseClient,
  organizationId: string,
  dish: { id?: unknown; name?: unknown; price?: unknown }
): Promise<{ dish_id: string; dish_name: string; unit_price: number; is_custom: boolean }> {
  const dishId = sanitizeString(dish.id, 100);
  if (!dishId) throw new ApiError(400, 'Piatto non valido');

  const { data: org } = await sb.from('organizations').select('hub_config').eq('id', organizationId).maybeSingle();
  const configured = (org?.hub_config as { canvaMenu?: CanvaMenuConfig } | null)?.canvaMenu;
  const menu: CanvaMenuConfig = configured && configured.enabled !== false ? configured : getDefaultCanvaMenuConfig();

  if (menu.allowTableOrders === false) throw new ApiError(403, 'Le ordinazioni dal tavolo non sono attive');

  const allDishes: CanvaDish[] = (menu.categories || []).flatMap((c) => c.dishes || c.items || []);
  const found = allDishes.find((d) => d.id === dishId);

  if (found) {
    if (found.available === false || found.isAvailable === false) {
      throw new ApiError(409, `${found.name} è esaurito`, 'dish_unavailable');
    }
    return { dish_id: found.id, dish_name: found.name.slice(0, 150), unit_price: parsePrice(found.price), is_custom: false };
  }

  // Off-menu suggestion from the AI Sommelier: accepted with indicative price
  if (dishId.startsWith('wine-')) {
    const name = sanitizeString(dish.name, 150);
    if (!name) throw new ApiError(400, 'Piatto non valido');
    return { dish_id: dishId, dish_name: name, unit_price: Math.min(parsePrice(dish.price), 500), is_custom: true };
  }

  throw new ApiError(404, 'Questo piatto non è più nel menù', 'dish_not_found');
}

// ---------------------------------------------------------------------------
// GET — state + heartbeat
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const sb = getAdminClient();
    const sessionId = request.nextUrl.searchParams.get('session_id');
    const { guest, session } = await authenticate(sb, request, sessionId);

    await sb.from('table_session_guests').update({ last_seen_at: new Date().toISOString() }).eq('id', guest.id);

    return NextResponse.json(await loadState(sb, session, guest.id));
  } catch (err) {
    return errorResponse(err);
  }
}

// ---------------------------------------------------------------------------
// POST — actions
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const sb = getAdminClient();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const action = String(body.action || '');

    if (action === 'join') return await handleJoin(sb, body);

    const { guest, session } = await authenticate(sb, request, body.session_id);

    switch (action) {
      case 'add_item':
        await handleAddItem(sb, session, guest, body);
        break;
      case 'update_item':
        await handleUpdateItem(sb, session, guest, body);
        break;
      case 'set_ready':
        await setGuestReady(sb, guest.id, body.ready === true);
        break;
      case 'rename':
        await sb.from('table_session_guests').update({ guest_name: cleanName(body.guest_name) }).eq('id', guest.id);
        break;
      case 'submit':
        return await handleSubmit(sb, session, guest, body);
      default:
        throw new ApiError(400, 'Azione non valida');
    }

    await Promise.all([
      touchSession(sb, session.id),
      sb.from('table_session_guests').update({ last_seen_at: new Date().toISOString() }).eq('id', guest.id),
    ]);
    return NextResponse.json(await loadState(sb, session, guest.id));
  } catch (err) {
    return errorResponse(err);
  }
}

async function handleJoin(sb: SupabaseClient, body: Record<string, unknown>) {
  if (!isValidUUID(body.device_id)) throw new ApiError(400, 'Tavolo non valido');
  const guestName = cleanName(body.guest_name);

  const { data: device } = await sb
    .from('devices')
    .select('id, organization_id, name, status')
    .eq('id', body.device_id as string)
    .maybeSingle();
  if (!device || device.status !== 'active') throw new ApiError(404, 'Tavolo non trovato');

  // 1. Find the active session of this table (closing it if idle for too long)
  let session: SessionRow | null = null;
  const { data: existing } = await sb
    .from('table_sessions')
    .select(SESSION_COLUMNS)
    .eq('device_id', device.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    const idleFor = Date.now() - new Date((existing as SessionRow).updated_at).getTime();
    if (idleFor > SESSION_IDLE_TIMEOUT_MS) {
      await sb
        .from('table_sessions')
        .update({ status: 'closed', closed_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      session = existing as SessionRow;
    }
  }

  // 2. Returning guest on the same session? (page reload, phone locked…)
  const providedToken = typeof body.guest_token === 'string' ? body.guest_token : null;
  if (session && providedToken && providedToken.length >= 20 && providedToken.length <= 200) {
    const { data: returning } = await sb
      .from('table_session_guests')
      .select('id, session_id')
      .eq('guest_token_hash', hashToken(providedToken))
      .maybeSingle();
    if (returning && returning.session_id === session.id) {
      await sb
        .from('table_session_guests')
        .update({ guest_name: guestName, last_seen_at: new Date().toISOString() })
        .eq('id', returning.id);
      return NextResponse.json({ guest_token: providedToken, state: await loadState(sb, session, returning.id) });
    }
  }

  // 3. Open a new session if needed (unique index protects against races)
  if (!session) {
    const { data: created, error } = await sb
      .from('table_sessions')
      .insert({
        organization_id: device.organization_id,
        device_id: device.id,
        table_label: (device.name || 'Tavolo').slice(0, 60),
        session_token: newSecret(),
        status: 'active',
        guest_count: 0,
      })
      .select(SESSION_COLUMNS)
      .single();

    if (error) {
      // Another phone opened the table at the same instant: join that one
      const { data: raced } = await sb
        .from('table_sessions')
        .select(SESSION_COLUMNS)
        .eq('device_id', device.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!raced) throw new ApiError(500, 'Impossibile aprire il tavolo');
      session = raced as SessionRow;
    } else {
      session = created as SessionRow;
    }
  }

  // 4. Add the guest
  const { count } = await sb
    .from('table_session_guests')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', session.id);
  const guestCount = count || 0;
  if (guestCount >= MAX_GUESTS_PER_SESSION) throw new ApiError(409, 'Il tavolo ha raggiunto il numero massimo di persone');

  const token = newSecret();
  const { data: guest, error: guestErr } = await sb
    .from('table_session_guests')
    .insert({
      session_id: session.id,
      organization_id: session.organization_id,
      guest_name: guestName,
      guest_token_hash: hashToken(token),
      color: pickGuestColor(guestCount),
    })
    .select('id')
    .single();
  if (guestErr || !guest) throw new ApiError(500, 'Impossibile unirsi al tavolo');

  await sb
    .from('table_sessions')
    .update({ guest_count: guestCount + 1, updated_at: new Date().toISOString() })
    .eq('id', session.id);

  return NextResponse.json({ guest_token: token, state: await loadState(sb, session, guest.id) });
}

async function handleAddItem(
  sb: SupabaseClient,
  session: SessionRow,
  guest: TableCartGuest,
  body: Record<string, unknown>
) {
  const dishInput = (body.dish || {}) as { id?: unknown; name?: unknown; price?: unknown };
  const quantity = Math.max(1, Math.min(MAX_ITEM_QUANTITY, Math.floor(Number(body.quantity) || 1)));
  const notes = sanitizeString(body.notes, MAX_ITEM_NOTES_LENGTH);
  const isShared = body.is_shared === true;

  const resolved = await resolveDish(sb, session.organization_id, dishInput);

  // Merge with an identical line of the same guest
  let query = sb
    .from('table_cart_items')
    .select('id, quantity')
    .eq('session_id', session.id)
    .eq('guest_id', guest.id)
    .eq('status', 'draft')
    .eq('dish_id', resolved.dish_id)
    .eq('is_shared', isShared);
  query = notes ? query.eq('notes', notes) : query.is('notes', null);
  const { data: sameLine } = await query.limit(1).maybeSingle();

  if (sameLine) {
    await sb
      .from('table_cart_items')
      .update({ quantity: Math.min(MAX_ITEM_QUANTITY, sameLine.quantity + quantity), updated_at: new Date().toISOString() })
      .eq('id', sameLine.id);
  } else {
    const { count } = await sb
      .from('table_cart_items')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', session.id)
      .eq('status', 'draft');
    if ((count || 0) >= MAX_DRAFT_ITEMS_PER_SESSION) throw new ApiError(409, 'Il carrello del tavolo è pieno');

    const { error } = await sb.from('table_cart_items').insert({
      session_id: session.id,
      organization_id: session.organization_id,
      guest_id: guest.id,
      ...resolved,
      quantity,
      notes,
      is_shared: isShared,
    });
    if (error) throw new ApiError(500, 'Impossibile aggiungere il piatto');
  }

  // Changing your order means you're choosing again
  await setGuestReady(sb, guest.id, false);
}

async function handleUpdateItem(
  sb: SupabaseClient,
  session: SessionRow,
  guest: TableCartGuest,
  body: Record<string, unknown>
) {
  if (!isValidUUID(body.item_id)) throw new ApiError(400, 'Piatto non valido');

  const { data: item } = await sb
    .from('table_cart_items')
    .select('id, guest_id, status, session_id')
    .eq('id', body.item_id as string)
    .maybeSingle();

  if (!item || item.session_id !== session.id) throw new ApiError(404, 'Piatto non trovato');
  if (item.status !== 'draft') throw new ApiError(409, 'Questo piatto è già stato inviato in cucina');
  if (item.guest_id !== guest.id) throw new ApiError(403, 'Puoi modificare solo i tuoi piatti');

  if (body.quantity !== undefined && Number(body.quantity) <= 0) {
    await sb.from('table_cart_items').delete().eq('id', item.id);
  } else {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.quantity !== undefined) {
      patch.quantity = Math.max(1, Math.min(MAX_ITEM_QUANTITY, Math.floor(Number(body.quantity) || 1)));
    }
    if (body.notes !== undefined) patch.notes = sanitizeString(body.notes, MAX_ITEM_NOTES_LENGTH);
    if (body.is_shared !== undefined) patch.is_shared = body.is_shared === true;
    await sb.from('table_cart_items').update(patch).eq('id', item.id);
  }

  await setGuestReady(sb, guest.id, false);
}

async function handleSubmit(
  sb: SupabaseClient,
  session: SessionRow,
  guest: TableCartGuest,
  body: Record<string, unknown>
) {
  const force = body.force === true;
  const expectedRound = Number(body.round);
  const state = await loadState(sb, session, guest.id);

  // Someone else already sent this round (all phones fire after the countdown)
  if (Number.isFinite(expectedRound) && expectedRound !== session.current_round) {
    return NextResponse.json({ ...state, submitted: false, already_submitted: true });
  }

  const me = state.me;
  if (!me?.is_ready) throw new ApiError(409, 'Conferma prima di essere pronto', 'not_ready');

  const drafts = state.items.filter((i) => i.status === 'draft');
  const readyCheck = getReadyCheckStatus(state.guests, drafts);
  if (readyCheck.kind === 'empty') throw new ApiError(400, 'Il carrello del tavolo è vuoto', 'empty');

  let includedGuestIds: Set<string>;
  if (readyCheck.kind === 'all_ready') {
    includedGuestIds = new Set(state.guests.map((g) => g.id));
  } else if (force && canForceSubmit(state.guests)) {
    includedGuestIds = new Set(state.guests.filter((g) => g.is_ready).map((g) => g.id));
  } else {
    throw new ApiError(409, 'Non tutti sono pronti', 'not_all_ready');
  }

  // Items of guests who haven't confirmed stay in the cart for the next round
  const toSend = drafts.filter((i) => !i.guest_id || includedGuestIds.has(i.guest_id));
  if (toSend.length === 0) throw new ApiError(400, 'Nessun piatto confermato da inviare', 'empty');

  // Optimistic lock: only one phone wins the round
  const round = session.current_round;
  const { data: locked } = await sb
    .from('table_sessions')
    .update({ current_round: round + 1, updated_at: new Date().toISOString() })
    .eq('id', session.id)
    .eq('current_round', round)
    .eq('status', 'active')
    .select(SESSION_COLUMNS)
    .maybeSingle();

  if (!locked) {
    const fresh = await getSession(sb, session.id);
    return NextResponse.json({ ...(await loadState(sb, fresh, guest.id)), submitted: false, already_submitted: true });
  }

  const guestNames = new Map(state.guests.map((g) => [g.id, g.guest_name]));
  const includedGuests = state.guests.filter((g) => includedGuestIds.has(g.id));
  const { total } = computeGuestShares(toSend, includedGuests);

  const orderDetails: ServiceOrderDetails & { session_id: string } = {
    collaborative: true,
    session_id: session.id,
    round,
    guests: includedGuests.map((g) => g.guest_name),
    total: formatEuro(total),
    items: toSend.map((i) => ({
      id: i.dish_id,
      name: i.dish_name,
      quantity: i.quantity,
      price: formatEuro(i.unit_price),
      guest_name: i.is_shared ? null : (i.guest_id && guestNames.get(i.guest_id)) || null,
      notes: i.notes,
      shared: i.is_shared,
      custom: i.is_custom || undefined,
    })),
  };

  const assignedWaiterId = await findAssignedWaiterId(sb, session.organization_id, session.device_id);
  const { data: call, error: callErr } = await sb
    .from('service_calls')
    .insert({
      organization_id: session.organization_id,
      device_id: session.device_id,
      type: 'dish_order',
      table_label: session.table_label,
      status: 'pending',
      order_details: orderDetails,
      assigned_waiter_id: assignedWaiterId,
    })
    .select('id')
    .single();

  if (callErr || !call) {
    // Release the lock so the table can retry
    await sb.from('table_sessions').update({ current_round: round }).eq('id', session.id).eq('current_round', round + 1);
    throw new ApiError(500, 'Impossibile inviare la comanda, riprova');
  }

  const now = new Date().toISOString();
  await Promise.all([
    sb
      .from('table_cart_items')
      .update({ status: 'sent', order_round: round, service_call_id: call.id, sent_at: now, updated_at: now })
      .in('id', toSend.map((i) => i.id)),
    sb.from('table_session_guests').update({ is_ready: false, ready_at: null }).eq('session_id', session.id),
  ]);

  await notifyTelegramStaff(sb, session.organization_id, session.table_label, 'dish_order', orderDetails);

  return NextResponse.json({
    ...(await loadState(sb, locked as SessionRow, guest.id)),
    submitted: true,
    round,
    sent_count: toSend.length,
  });
}
