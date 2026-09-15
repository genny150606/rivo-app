import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function sendTelegramAlert(
  orgId: string,
  deviceId: string | null,
  rating: number,
  customerName: string | null,
  customerContact: string | null,
  comment: string
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

    let deviceLabel = 'Generale';
    if (deviceId) {
      const { data: dev } = await supabase
        .from('devices')
        .select('name, unique_code')
        .eq('id', deviceId)
        .single();
      if (dev) {
        deviceLabel = `${dev.name} (${dev.unique_code})`;
      }
    }

    const message = `🚨 *ALLERTA REPUTAZIONE RIVO*\n\n` +
      `📍 *Locale:* ${org.name}\n` +
      `🪑 *Tavolo / Punto:* ${deviceLabel}\n` +
      `⭐ *Valutazione:* ${rating}/5\n` +
      `👤 *Ospite:* ${customerName || 'Anonimo'}\n` +
      `📞 *Contatto:* ${customerContact || 'Non rilasciato'}\n\n` +
      `💬 *Messaggio dell'ospite:*\n"${comment}"\n\n` +
      `⚡ *Azione consigliata:* Raggiungi il tavolo per scusarti e rimediare prima che il cliente lasci il locale!`;

    await fetch(`https://api.telegram.org/bot${org.telegram_bot_token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: org.telegram_chat_id,
        text: message,
        parse_mode: 'Markdown',
      }),
    });
  } catch (tgErr) {
    console.warn('[Telegram Alert] Failed to send alert:', tgErr);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organization_id, device_id, rating, customer_name, customer_contact, comment } = body;

    if (!organization_id || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Dati incompleti o non validi' },
        { status: 400 }
      );
    }

    if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
      return NextResponse.json(
        { error: 'Il commento è obbligatorio' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('private_feedbacks')
      .insert({
        organization_id,
        device_id: device_id || null,
        rating,
        customer_name: customer_name ? customer_name.trim() : null,
        customer_contact: customer_contact ? customer_contact.trim() : null,
        comment: comment.trim(),
        status: 'new',
      });

    if (error) {
      console.error('[Feedback API] Insert error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If rating is 1, 2, or 3, dispatch urgent Telegram alert to merchant
    if (rating <= 3) {
      sendTelegramAlert(
        organization_id,
        device_id || null,
        rating,
        customer_name ? customer_name.trim() : null,
        customer_contact ? customer_contact.trim() : null,
        comment.trim()
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    console.error('[Feedback API] Exception:', msg);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
