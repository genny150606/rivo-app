import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { OutreachComplianceService } from '@/lib/outreach/compliance';
import { normalizePhoneDigits } from '@/lib/outreach/deduplication';

function getServiceDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const mode = sp.get('hub.mode');
  const token = sp.get('hub.verify_token');
  const challenge = sp.get('hub.challenge');

  const expectedToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  if (mode === 'subscribe' && expectedToken && token === expectedToken && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verifica webhook WhatsApp non riuscita.' }, { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => ({}));
    const entries: any[] = Array.isArray(payload?.entry) ? payload.entry : [];
    const adminDb = getServiceDb();

    for (const entry of entries) {
      const changes: any[] = Array.isArray(entry?.changes) ? entry.changes : [];
      for (const change of changes) {
        const value = change?.value || {};
        const incomingMessages: any[] = Array.isArray(value.messages) ? value.messages : [];

        for (const msg of incomingMessages) {
          const fromPhone = normalizePhoneDigits(msg.from);
          const textBody = String(msg.text?.body || '').trim();
          if (!fromPhone || !textBody) continue;

          const { data: allProspects } = await adminDb
            .from('outreach_prospects')
            .select('id, business_phone, commercial_status')
            .not('business_phone', 'is', null)
            .is('merged_into_id', null);

          const matched = (allProspects || []).find(
            (p) => normalizePhoneDigits(p.business_phone) === fromPhone
          );
          if (!matched) continue;

          // Check opt-out keywords
          if (/\b(stop|non contattare|cancella|disiscrivi|opt-out|rimuovi)\b/i.test(textBody)) {
            await OutreachComplianceService.recordOptOutAndSuppress(adminDb, {
              prospectId: matched.id,
              channel: 'whatsapp',
              reason: `Opt-out ricevuto via webhook WhatsApp ("${textBody.slice(0, 60)}")`,
              contactIdentifier: msg.from,
            });
            continue;
          }

          // Record inbound message & open 24h user-initiated conversation window
          const nowIso = new Date().toISOString();
          const { data: conv } = await adminDb
            .from('outreach_conversations')
            .insert({
              prospect_id: matched.id,
              channel: 'whatsapp',
              conversation_status: 'open_user_initiated',
              provider_reference: msg.id || null,
              last_user_message_at: nowIso,
            })
            .select('id')
            .single();

          await Promise.all([
            adminDb.from('outreach_messages').insert({
              prospect_id: matched.id,
              conversation_id: conv?.id || null,
              channel: 'whatsapp',
              direction: 'inbound',
              delivery_mode: 'automated',
              content: textBody,
              provider_status: 'replied',
              sent_at: nowIso,
            }),
            adminDb.from('outreach_contact_permissions').insert({
              prospect_id: matched.id,
              channel: 'whatsapp',
              permission_status: 'granted',
              legal_basis: 'user_initiated_inbound',
              evidence_reference: `wa_inbound_msg:${msg.id || nowIso}`,
              source: 'whatsapp_webhook',
              scope: 'b2b_commercial_outreach',
            }),
            adminDb
              .from('outreach_prospects')
              .update({
                commercial_status: 'in_conversazione',
                updated_at: nowIso,
              })
              .eq('id', matched.id),
          ]);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Webhook error' }, { status: 500 });
  }
}
