import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isValidUUID, sanitizeString } from '@/lib/security';
import { 
  BillRequestStatus, 
  PaymentMethodIntent, 
  WebSocketTableAlertPayload 
} from '@/lib/types/smart-bill';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Dispatches rich interactive Telegram message with Inline Keyboard actions
 */
async function notifyTelegramSmartBill(opts: {
  orgId: string;
  tableLabel: string;
  intent: PaymentMethodIntent;
  totalAmount?: number;
  banknote?: number | null;
  changeDue?: number;
  splitCount?: number;
  invoiceCompany?: string;
  invoiceSdi?: string;
  billRequestId: string;
}) {
  try {
    const { data: org } = await supabase
      .from('organizations')
      .select('name, telegram_bot_token, telegram_chat_id, telegram_alerts_enabled')
      .eq('id', opts.orgId)
      .single();

    if (!org || !org.telegram_alerts_enabled || !org.telegram_bot_token || !org.telegram_chat_id) {
      return;
    }

    let actionRequired = '';
    let methodDesc = '';

    switch (opts.intent) {
      case 'pos_contactless':
        methodDesc = 'POS Contactless / Apple Pay';
        actionRequired = 'Portare terminale POS Contactless al tavolo.';
        break;
      case 'pos_traditional':
        methodDesc = 'POS Tradizionale (Chip & PIN)';
        actionRequired = 'Portare terminale POS per pagamento con carta.';
        break;
      case 'cash_exact':
        methodDesc = 'Contanti Esatti (Nessun resto richiesto)';
        actionRequired = 'Incassare contanti esatti al tavolo o in cassa.';
        break;
      case 'cash_needs_change':
        methodDesc = `Contanti con Banconota da ${opts.banknote || 'N/D'} €`;
        actionRequired = `Portare ${opts.changeDue ? opts.changeDue.toFixed(2) + ' €' : 'il'} resto esatto al tavolo!`;
        break;
    }

    let msg = `[CHIAMATA CONTO AL TAVOLO - SMART BILL]\n\n` +
      `• Locale: ${org.name}\n` +
      `• Tavolo: ${opts.tableLabel}\n` +
      `• Metodo Scelto: ${methodDesc}\n` +
      (opts.totalAmount && opts.totalAmount > 0 ? `• Totale Calcolato: ${opts.totalAmount.toFixed(2)} €\n` : '') +
      (opts.splitCount && opts.splitCount > 1 ? `• Divisione: ${opts.splitCount} persone alla romana\n` : '') +
      (opts.changeDue && opts.changeDue > 0 ? `• Resto da portare: ${opts.changeDue.toFixed(2)} €\n` : '') +
      (opts.invoiceCompany ? `• FATTURA ELETTRONICA: ${opts.invoiceCompany} (SDI: ${opts.invoiceSdi || '0000000'})\n` : '') +
      `\n• AZIONE RICHIESTA: ${actionRequired}`;

    // App URL to resolve directly via web hook or callback
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rivo-app-ten.vercel.app';
    const dispatchUrl = `${appBaseUrl}/api/bill-request/telegram-action?action=dispatch&id=${opts.billRequestId}&org=${opts.orgId}`;
    const settleUrl = `${appBaseUrl}/api/bill-request/telegram-action?action=settle&id=${opts.billRequestId}&org=${opts.orgId}`;

    await fetch(`https://api.telegram.org/bot${org.telegram_bot_token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: org.telegram_chat_id,
        text: msg,
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🏃 Prendi in Carico', url: dispatchUrl },
              { text: '✅ Conto Saldato', url: settleUrl },
            ],
          ],
        },
      }),
    });
  } catch (err) {
    console.warn('[Smart Bill] Telegram dispatch error:', err);
  }
}

/**
 * POST /api/bill-request
 * Atomic creation of bill requests with optimistic concurrency lock and realtime broadcast
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organization_id,
      device_id,
      table_label,
      payment_method_intent,
      total_amount,
      banknote_denomination,
      split_count,
      invoice_data,
      notes,
    } = body;

    if (!organization_id || !table_label) {
      return NextResponse.json({ error: 'organization_id e table_label sono obbligatori' }, { status: 400 });
    }

    if (!isValidUUID(organization_id)) {
      return NextResponse.json({ error: 'ID organizzazione non valido' }, { status: 400 });
    }

    const cleanTableLabel = sanitizeString(table_label, 60) || 'Tavolo';
    const cleanIntent: PaymentMethodIntent = [
      'pos_contactless', 
      'pos_traditional', 
      'cash_exact', 
      'cash_needs_change'
    ].includes(payment_method_intent) ? payment_method_intent : 'pos_contactless';

    // 1. CONCURRENCY LOCK CHECK:
    // Prevent duplicate simultaneous taps from multiple people at the same table
    const { data: existingActiveRequest } = await supabase
      .from('bill_requests')
      .select('id, status, created_at')
      .eq('organization_id', organization_id)
      .eq('table_label', cleanTableLabel)
      .in('status', ['bill_requested', 'attendant_dispatched'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingActiveRequest) {
      return NextResponse.json({
        error: 'Un commensale ha già chiamato il conto per questo tavolo. Il personale sta arrivando!',
        existing_request_id: existingActiveRequest.id,
        status: existingActiveRequest.status,
      }, { status: 409 });
    }

    // 2. Compute numeric values
    const numTotal = Number(total_amount) || 0;
    const numBanknote = banknote_denomination ? Number(banknote_denomination) : null;
    let changeDue = 0;
    if (cleanIntent === 'cash_needs_change' && numBanknote && numBanknote > numTotal) {
      changeDue = Number((numBanknote - numTotal).toFixed(2));
    }

    const numSplit = Math.max(1, Math.min(50, Number(split_count) || 1));
    const splitQuota = numTotal > 0 ? Number((numTotal / numSplit).toFixed(2)) : null;

    // 3. Atomic Insert into bill_requests table
    const { data: billRequest, error: billErr } = await supabase
      .from('bill_requests')
      .insert({
        organization_id,
        device_id: device_id && isValidUUID(device_id) ? device_id : null,
        table_label: cleanTableLabel,
        status: 'bill_requested',
        payment_method_intent: cleanIntent,
        total_amount: numTotal,
        banknote_denomination: numBanknote,
        change_due: changeDue,
        split_count: numSplit,
        split_quota_amount: splitQuota,
        invoice_data: invoice_data || null,
        notes: notes ? sanitizeString(notes, 300) : null,
      })
      .select()
      .single();

    if (billErr) {
      console.error('[Smart Bill] Insert error:', billErr);
      return NextResponse.json({ error: billErr.message }, { status: 500 });
    }

    // 4. Backward Compatibility Sync with service_calls table
    // Ensures existing service monitor WebSocket listeners catch the event
    const serviceType = invoice_data 
      ? 'bill_invoice' 
      : (cleanIntent.startsWith('pos') ? 'bill_pos' : 'bill_cash');

    let actionRequiredText = 'Servire il conto al tavolo.';
    if (cleanIntent === 'pos_contactless') actionRequiredText = 'Portare POS Contactless / Apple Pay.';
    if (cleanIntent === 'pos_traditional') actionRequiredText = 'Portare terminale POS per carta.';
    if (cleanIntent === 'cash_needs_change') actionRequiredText = `Portare resto da ${changeDue.toFixed(2)} € (banconota da ${numBanknote} €).`;
    if (cleanIntent === 'cash_exact') actionRequiredText = 'Incassare contanti esatti.';

    const { data: serviceCall } = await supabase
      .from('service_calls')
      .insert({
        organization_id,
        device_id: device_id && isValidUUID(device_id) ? device_id : null,
        type: serviceType,
        table_label: cleanTableLabel,
        status: 'pending',
        order_details: {
          total: numTotal > 0 ? `${numTotal.toFixed(2)} €` : undefined,
          split_count: numSplit,
          split_quota: splitQuota ? `${splitQuota.toFixed(2)} €` : undefined,
          payment_method: cleanIntent.startsWith('pos') ? 'pos' : 'cash',
          payment_intent: cleanIntent,
          banknote: numBanknote,
          change_due: changeDue > 0 ? `${changeDue.toFixed(2)} €` : undefined,
          action_required: actionRequiredText,
          bill_request_id: billRequest.id,
          invoice: invoice_data || null,
        },
      })
      .select()
      .single();

    // 5. Broadcast to Supabase Realtime Channel: table-alerts:${organization_id}
    const realtimePayload: WebSocketTableAlertPayload = {
      table_id: cleanTableLabel,
      action: 'BILL_REQUEST',
      method: cleanIntent.startsWith('pos') ? 'POS_CONTACTLESS' : (cleanIntent === 'cash_exact' ? 'CASH_EXACT' : 'CASH_CHANGE'),
      action_required: actionRequiredText,
      timestamp: new Date().toISOString(),
      details: {
        bill_request_id: billRequest.id,
        total_amount: numTotal,
        banknote_denomination: numBanknote || undefined,
        change_due: changeDue,
        split_count: numSplit,
        split_quota: splitQuota ? `${splitQuota.toFixed(2)} €` : undefined,
        has_invoice: !!invoice_data,
        invoice_company: invoice_data?.companyName,
        invoice_sdi: invoice_data?.sdiCode,
      },
    };

    // Broadcast channel event via Supabase Realtime
    const channel = supabase.channel(`table-alerts:${organization_id}`);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'table_alert',
          payload: realtimePayload,
        });
        supabase.removeChannel(channel);
      }
    });

    // 6. Notify Staff on Telegram with interactive Inline Action Buttons
    notifyTelegramSmartBill({
      orgId: organization_id,
      tableLabel: cleanTableLabel,
      intent: cleanIntent,
      totalAmount: numTotal,
      banknote: numBanknote,
      changeDue: changeDue,
      splitCount: numSplit,
      invoiceCompany: invoice_data?.companyName,
      invoiceSdi: invoice_data?.sdiCode,
      billRequestId: billRequest.id,
    });

    return NextResponse.json({
      success: true,
      bill_request: billRequest,
      service_call: serviceCall,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * PATCH /api/bill-request
 * Updates status: 'attendant_dispatched' or 'settled'
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, dispatched_by } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'id e status obbligatori' }, { status: 400 });
    }

    const validStatuses: BillRequestStatus[] = ['attendant_dispatched', 'settled', 'idle', 'bill_requested'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Status non valido' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'attendant_dispatched') {
      updates.dispatched_at = new Date().toISOString();
      if (dispatched_by) updates.dispatched_by = sanitizeString(dispatched_by, 100);
    } else if (status === 'settled') {
      updates.settled_at = new Date().toISOString();
    }

    const { data: updatedBill, error: updateErr } = await supabase
      .from('bill_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Sync corresponding service_calls
    const mappedServiceStatus = status === 'settled' 
      ? 'completed' 
      : (status === 'attendant_dispatched' ? 'in_progress' : 'pending');

    await supabase
      .from('service_calls')
      .update({ status: mappedServiceStatus })
      .contains('order_details', { bill_request_id: id });

    // Realtime broadcast of status change
    if (updatedBill) {
      const channel = supabase.channel(`table-alerts:${updatedBill.organization_id}`);
      channel.subscribe((subStatus) => {
        if (subStatus === 'SUBSCRIBED') {
          channel.send({
            type: 'broadcast',
            event: 'bill_status_change',
            payload: {
              bill_request_id: updatedBill.id,
              table_label: updatedBill.table_label,
              status: updatedBill.status,
              updated_at: updatedBill.updated_at,
            },
          });
          supabase.removeChannel(channel);
        }
      });
    }

    return NextResponse.json({ success: true, bill_request: updatedBill });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * GET /api/bill-request
 * List active bill requests for an organization
 */
export async function GET(request: NextRequest) {
  try {
    const orgId = request.nextUrl.searchParams.get('organization_id');
    if (!orgId || !isValidUUID(orgId)) {
      return NextResponse.json({ error: 'organization_id valido obbligatorio' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('bill_requests')
      .select('*')
      .eq('organization_id', orgId)
      .in('status', ['bill_requested', 'attendant_dispatched'])
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ bill_requests: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
