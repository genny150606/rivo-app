import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { verifyUserOrgAccess, isValidUUID, sanitizeString } from '@/lib/security';
import { guardModuleAccess } from '@/lib/modules/guard';
import { hasPermission } from '@/lib/rbac';

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}

const ReturnItemSchema = z.object({
  sale_item_id: z.string().uuid('Item vendita non valido'),
  variant_id: z.string().uuid().optional().nullable(),
  quantity: z.number().int().positive('Quantità non valida'),
  refund_unit_price: z.number().nonnegative('Prezzo di rimborso non valido'),
  restock: z.boolean().default(true),
});

const ProcessReturnSchema = z.object({
  sale_id: z.string().uuid('ID vendita non valido'),
  location_id: z.string().uuid().optional().nullable(),
  refund_method: z.enum(['cash', 'card', 'coupon', 'exchange']),
  reason: z.string().max(255).optional().nullable(),
  return_items: z.array(ReturnItemSchema).min(1, 'Seleziona almeno un articolo da rendere'),
});

/**
 * POST /api/sales/returns
 * Process a customer return atomically via Postgres RPC rpc_process_return.
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyUserOrgAccess(request);
    if (!authResult.authorized) return authResult.errorResponse;

    const { profile } = authResult;
    const adminClient = getAdminClient();

    let targetOrgId = profile.organization_id;
    if (!targetOrgId && profile.role === 'admin') {
      const { data: firstOrg } = await adminClient
        .from('organizations')
        .select('id')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      targetOrgId = firstOrg?.id || '';
    }

    if (!targetOrgId) {
      return NextResponse.json({ error: 'Nessuna organizzazione trovata' }, { status: 400 });
    }

    // Module guard: require 'sales'
    const moduleDenied = await guardModuleAccess(targetOrgId, 'sales');
    if (moduleDenied) return moduleDenied;

    if (!hasPermission(profile.role, 'sales.refund')) {
      return NextResponse.json({ error: 'Permessi insufficienti per processare resi e rimborsi' }, { status: 403 });
    }

    const rawBody = await request.json();
    const parseResult = ProcessReturnSchema.safeParse(rawBody);

    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0]?.message || 'Dati reso non validi';
      return NextResponse.json({ error: firstIssue }, { status: 400 });
    }

    const {
      sale_id,
      location_id,
      refund_method,
      reason,
      return_items,
    } = parseResult.data;

    // Call atomic RPC
    const { data: rpcResult, error: rpcErr } = await adminClient.rpc('rpc_process_return', {
      p_org_id: targetOrgId,
      p_sale_id: sale_id,
      p_location_id: location_id || null,
      p_return_items: return_items,
      p_refund_method: refund_method,
      p_reason: reason ? sanitizeString(reason, 255) : null,
      p_user_id: profile.auth_user_id || null,
    });

    if (rpcErr) {
      return NextResponse.json({ error: rpcErr.message || 'Errore durante la registrazione del reso' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      result: rpcResult,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
