import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

function generateCouponCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'RIVO-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organization_id, reward, customer_name, customer_contact } = body;

    if (!organization_id || !reward || !customer_contact) {
      return NextResponse.json(
        { error: 'Parametri mancanti (organization_id, reward, customer_contact)' },
        { status: 400 }
      );
    }

    const code = generateCouponCode();
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    const { data: coupon, error: couponErr } = await supabase
      .from('coupons')
      .insert({
        organization_id,
        code,
        reward,
        customer_name: customer_name ? customer_name.trim() : null,
        customer_contact: customer_contact.trim(),
        status: 'active',
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (couponErr) {
      return NextResponse.json({ error: couponErr.message }, { status: 500 });
    }

    // Capture customer into leads CRM automatically
    supabase
      .from('leads')
      .insert({
        organization_id,
        name: customer_name ? customer_name.trim() : null,
        contact: customer_contact.trim(),
        source: 'wheel',
      })
      .then();

    return NextResponse.json({ success: true, coupon });
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
      .from('coupons')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ coupons: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, organization_id } = body;

    if (!code || !organization_id) {
      return NextResponse.json({ error: 'Codice e organization_id obbligatori' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();

    // Verify coupon
    const { data: coupon, error: findErr } = await supabase
      .from('coupons')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('code', cleanCode)
      .single();

    if (findErr || !coupon) {
      return NextResponse.json({ error: 'Coupon non trovato' }, { status: 404 });
    }

    if (coupon.status === 'redeemed') {
      return NextResponse.json({ error: 'Questo coupon è già stato riscattato' }, { status: 400 });
    }

    if (new Date(coupon.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Questo coupon è scaduto' }, { status: 400 });
    }

    // Mark as redeemed
    const { error: updateErr } = await supabase
      .from('coupons')
      .update({ status: 'redeemed' })
      .eq('id', coupon.id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, reward: coupon.reward, customer: coupon.customer_name });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
