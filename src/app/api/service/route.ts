import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isValidUUID, sanitizeString, verifyUserOrgAccess } from '@/lib/security';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface OrderDetails {
  items?: Array<{ name: string; quantity: number; price: string }>;
  total?: string;
  notes?: string;
}

async function notifyTelegramStaff(
  orgId: string, 
  tableLabel: string, 
  type: string, 
  orderDetails?: OrderDetails | null
) {
  try {
    const { data: org } = await supabase
      .from('organizations')
      .select('name, telegram_bot_token, telegram_chat_id, telegram_alerts_enabled')
      .eq('id', orgId)
      .single();

    if (!org || !org.telegram_alerts_enabled || !org.telegram_bot_token || !org.telegram_chat_id) {
      return;
    }

    let msg = '';
    if (type === 'dish_order' && orderDetails) {
      const itemsList = (orderDetails.items || [])
        .map((item) => `  • ${item.quantity}x ${item.name} (${item.price})`)
        .join('\n');

      msg = `[NUOVO ORDINE PIATTI AL TAVOLO]\n\n` +
        `• Locale: ${org.name}\n` +
        `• Postazione / Tavolo: ${tableLabel}\n` +
        `• Portate Ordinate:\n${itemsList || '  (Nessun piatto specificato)'}\n` +
        `• Totale: ${orderDetails.total || '0,00 €'}\n` +
        (orderDetails.notes ? `• Note cliente: ${orderDetails.notes}\n` : '') +
        `• Azione: Portare la comanda in cucina / cassa.`;
    } else {
      const typeLabels: Record<string, string> = {
        waiter: 'Assistenza Cameriere / Staff',
        bill_pos: 'Richiesta Conto con POS / Carta',
        bill_cash: 'Richiesta Conto in Contanti',
        dish_order: 'Nuovo Ordine Piatti',
      };

      const label = typeLabels[type] || 'Chiamata Servizio';

      msg = `[CHIAMATA SERVIZIO AL TAVOLO]\n\n` +
        `• Locale: ${org.name}\n` +
        `• Postazione / Tavolo: ${tableLabel}\n` +
        `• Tipo Richiesta: ${label}\n\n` +
        `• Azione: Servire il cliente al tavolo.`;
    }

    await fetch(`https://api.telegram.org/bot${org.telegram_bot_token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: org.telegram_chat_id,
        text: msg,
      }),
    });
  } catch (err) {
    console.warn('[Service Call] Telegram dispatch error:', err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organization_id, device_id, type, table_label, order_details } = body;

    if (!organization_id || !type) {
      return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 });
    }

    if (!isValidUUID(organization_id)) {
      return NextResponse.json({ error: 'ID organizzazione non valido' }, { status: 400 });
    }

    if (device_id && !isValidUUID(device_id)) {
      return NextResponse.json({ error: 'ID dispositivo non valido' }, { status: 400 });
    }

    const validTypes = ['waiter', 'bill_pos', 'bill_cash', 'dish_order'];
    const cleanType = String(type).trim().toLowerCase();
    if (!validTypes.includes(cleanType)) {
      return NextResponse.json({ error: 'Tipo di chiamata non valido' }, { status: 400 });
    }

    const cleanTableLabel = sanitizeString(table_label, 50) || 'Tavolo';

    const { data, error } = await supabase
      .from('service_calls')
      .insert({
        organization_id,
        device_id: device_id || null,
        type: cleanType,
        table_label: cleanTableLabel,
        status: 'pending',
        order_details: order_details || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Notify staff on Telegram if configured
    notifyTelegramStaff(organization_id, cleanTableLabel, cleanType, order_details);

    return NextResponse.json({ success: true, call: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const orgId = request.nextUrl.searchParams.get('organization_id');
    if (!orgId || !isValidUUID(orgId)) {
      return NextResponse.json({ error: 'organization_id valido obbligatorio' }, { status: 400 });
    }

    // High security: merchant/admin session required
    const authCheck = await verifyUserOrgAccess(request, orgId);
    if (!authCheck.authorized) {
      return authCheck.errorResponse;
    }

    const { data, error } = await supabase
      .from('service_calls')
      .select('*')
      .eq('organization_id', orgId)
      .in('status', ['pending', 'in_progress'])
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ calls: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status || !isValidUUID(id)) {
      return NextResponse.json({ error: 'id valido e status obbligatori' }, { status: 400 });
    }

    // Check service call organization
    const { data: call, error: callErr } = await supabase
      .from('service_calls')
      .select('id, organization_id')
      .eq('id', id)
      .single();

    if (callErr || !call) {
      return NextResponse.json({ error: 'Chiamata di servizio non trovata' }, { status: 404 });
    }

    // High security: merchant/admin session check
    const authCheck = await verifyUserOrgAccess(request, call.organization_id);
    if (!authCheck.authorized) {
      return authCheck.errorResponse;
    }

    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    const cleanStatus = String(status).trim().toLowerCase();
    if (!validStatuses.includes(cleanStatus)) {
      return NextResponse.json({ error: 'Stato non valido' }, { status: 400 });
    }

    const { error } = await supabase
      .from('service_calls')
      .update({ status: cleanStatus })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
