import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function notifyTelegramStaff(orgId: string, tableLabel: string, type: string) {
  try {
    const { data: org } = await supabase
      .from('organizations')
      .select('name, telegram_bot_token, telegram_chat_id, telegram_alerts_enabled')
      .eq('id', orgId)
      .single();

    if (!org || !org.telegram_alerts_enabled || !org.telegram_bot_token || !org.telegram_chat_id) {
      return;
    }

    const typeLabels: Record<string, string> = {
      waiter: 'Assistenza Cameriere / Staff',
      bill_pos: 'Richiesta Conto con POS / Carta',
      bill_cash: 'Richiesta Conto in Contanti',
    };

    const label = typeLabels[type] || 'Chiamata Servizio';

    const msg = `[CHIAMATA SERVIZIO AL TAVOLO]\n\n` +
      `• Locale: ${org.name}\n` +
      `• Postazione / Tavolo: ${tableLabel}\n` +
      `• Tipo Richiesta: ${label}\n\n` +
      `• Azione: Servire il cliente al tavolo.`;

    await fetch(`https://api.telegram.org/bot${org.telegram_bot_token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: org.telegram_chat_id,
        text: msg,
        parse_mode: 'Markdown',
      }),
    });
  } catch (err) {
    console.warn('[Service Call] Telegram dispatch error:', err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organization_id, device_id, type, table_label } = body;

    if (!organization_id || !type) {
      return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('service_calls')
      .insert({
        organization_id,
        device_id: device_id || null,
        type,
        table_label: table_label || 'Tavolo',
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Notify staff on Telegram if configured
    notifyTelegramStaff(organization_id, table_label || 'Tavolo', type);

    return NextResponse.json({ success: true, call: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const orgId = request.nextUrl.searchParams.get('organization_id');
    if (!orgId) {
      return NextResponse.json({ error: 'organization_id obbligatorio' }, { status: 400 });
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

    if (!id || !status) {
      return NextResponse.json({ error: 'id e status obbligatori' }, { status: 400 });
    }

    const { error } = await supabase
      .from('service_calls')
      .update({ status })
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
