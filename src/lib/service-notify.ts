import type { SupabaseClient } from '@supabase/supabase-js';

export interface ServiceOrderItem {
  id?: string;
  name: string;
  quantity: number;
  price: string;
  guest_name?: string | null;
  notes?: string | null;
  shared?: boolean;
  custom?: boolean;
}

export interface ServiceOrderDetails {
  items?: ServiceOrderItem[];
  total?: string;
  notes?: string;
  guests?: string[];
  round?: number;
  collaborative?: boolean;
}

/**
 * Returns the waiter currently assigned to a table device (if any),
 * so the service call is routed to the right person.
 */
export async function findAssignedWaiterId(
  supabase: SupabaseClient,
  organizationId: string,
  deviceId: string | null | undefined
): Promise<string | null> {
  if (!deviceId) return null;
  const { data } = await supabase
    .from('table_assignments')
    .select('waiter_id')
    .eq('organization_id', organizationId)
    .eq('device_id', deviceId)
    .eq('status', 'active')
    .maybeSingle();
  return data?.waiter_id || null;
}

function formatItemLine(item: ServiceOrderItem): string {
  const who = item.shared ? ' [al centro]' : item.guest_name ? ` [${item.guest_name}]` : '';
  const notes = item.notes ? ` — ${item.notes}` : '';
  return `  • ${item.quantity}x ${item.name} (${item.price})${who}${notes}`;
}

/**
 * Sends a Telegram alert to the venue staff (if the bot is configured).
 * Never throws: notification failures must not break the customer flow.
 */
export async function notifyTelegramStaff(
  supabase: SupabaseClient,
  orgId: string,
  tableLabel: string,
  type: string,
  orderDetails?: ServiceOrderDetails | null
): Promise<void> {
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
      const itemsList = (orderDetails.items || []).map(formatItemLine).join('\n');
      const guestsLine =
        orderDetails.collaborative && orderDetails.guests && orderDetails.guests.length > 0
          ? `• Ordine di gruppo (${orderDetails.guests.length}): ${orderDetails.guests.join(', ')}\n`
          : '';

      msg = `[NUOVO ORDINE PIATTI AL TAVOLO]\n\n` +
        `• Locale: ${org.name}\n` +
        `• Postazione / Tavolo: ${tableLabel}\n` +
        guestsLine +
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
