import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isValidUUID } from '@/lib/security';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * GET /api/bill-request/telegram-action?action=dispatch|settle&id=...&org=...
 * Simple, instant landing handler for staff tapping inline action buttons on Telegram
 */
export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get('action');
  const id = request.nextUrl.searchParams.get('id');
  const orgId = request.nextUrl.searchParams.get('org');

  if (!id || !action || !orgId || !isValidUUID(id)) {
    return new Response('Parametri non validi o mancanti.', { status: 400 });
  }

  const targetStatus = action === 'dispatch' ? 'attendant_dispatched' : 'settled';

  try {
    const updates: Record<string, unknown> = {
      status: targetStatus,
      updated_at: new Date().toISOString(),
    };

    if (targetStatus === 'attendant_dispatched') {
      updates.dispatched_at = new Date().toISOString();
      updates.dispatched_by = 'Staff Telegram';
    } else {
      updates.settled_at = new Date().toISOString();
    }

    const { data: updatedBill, error } = await supabase
      .from('bill_requests')
      .update(updates)
      .eq('id', id)
      .select('table_label, status')
      .single();

    if (error) {
      return new Response(`Errore: ${error.message}`, { status: 500 });
    }

    // Sync service_calls
    const mappedServiceStatus = targetStatus === 'settled' ? 'completed' : 'in_progress';
    await supabase
      .from('service_calls')
      .update({ status: mappedServiceStatus })
      .contains('order_details', { bill_request_id: id });

    // Broadcast update to monitor
    const channel = supabase.channel(`table-alerts:${orgId}`);
    channel.subscribe((subStatus) => {
      if (subStatus === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'bill_status_change',
          payload: {
            bill_request_id: id,
            table_label: updatedBill?.table_label,
            status: targetStatus,
            updated_at: new Date().toISOString(),
          },
        });
        supabase.removeChannel(channel);
      }
    });

    const isDispatch = targetStatus === 'attendant_dispatched';
    const htmlResponse = `
      <!DOCTYPE html>
      <html lang="it">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>RIVO Staff Alert</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #09090b; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; padding: 20px; }
          .card { background: #18181b; border: 1px solid #27272a; border-radius: 24px; padding: 32px; max-width: 380px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
          .icon { width: 56px; height: 56px; border-radius: 16px; background: ${isDispatch ? 'rgba(56, 189, 248, 0.15)' : 'rgba(52, 211, 153, 0.15)'}; color: ${isDispatch ? '#38bdf8' : '#34d399'}; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 28px; }
          h2 { margin: 0 0 8px; font-size: 20px; }
          p { color: #a1a1aa; font-size: 14px; line-height: 1.5; margin: 0 0 20px; }
          .badge { display: inline-block; padding: 6px 14px; border-radius: 9999px; background: ${isDispatch ? '#0284c7' : '#059669'}; color: #fff; font-weight: bold; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">${isDispatch ? '🏃' : '✓'}</div>
          <h2>${isDispatch ? 'Preso in Carico!' : 'Conto Saldato!'}</h2>
          <p>La richiesta per il <strong>${updatedBill?.table_label || 'Tavolo'}</strong> è stata aggiornata sul monitor cassa e di sala.</p>
          <span class="badge">${isDispatch ? 'In arrivo al tavolo' : 'Tavolo liberato'}</span>
        </div>
      </body>
      </html>
    `;

    return new Response(htmlResponse, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return new Response(`Errore server: ${msg}`, { status: 500 });
  }
}
