import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organization_id, name, contact, source } = body;

    if (!organization_id || !contact) {
      return NextResponse.json({ error: 'organization_id e contatto obbligatori' }, { status: 400 });
    }

    // Save lead
    await supabase.from('leads').insert({
      organization_id,
      name: name ? name.trim() : null,
      contact: contact.trim(),
      source: source || 'wifi',
    });

    // Fetch org Wi-Fi credentials
    const { data: org } = await supabase
      .from('organizations')
      .select('wifi_ssid, wifi_password')
      .eq('id', organization_id)
      .single();

    return NextResponse.json({
      success: true,
      wifi: {
        ssid: org?.wifi_ssid || 'RIVO-GUEST-WIFI',
        password: org?.wifi_password || 'benvenuto2026',
      },
    });
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

    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ leads: leads || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
