import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const cleanCode = code ? code.trim().toUpperCase() : '';

    if (!cleanCode) {
      return new NextResponse('Device code required', { status: 400 });
    }

    // 1. Fetch device details
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('id, organization_id, location_id, destination_url, status')
      .eq('unique_code', cleanCode)
      .single();

    if (deviceError || !device) {
      return new NextResponse('Device not found', { status: 404 });
    }

    if (device.status !== 'active') {
      return new NextResponse('Device is currently inactive', { status: 403 });
    }

    // 2. Parse interaction context
    const sourceParam = request.nextUrl.searchParams.get('source')?.toLowerCase();
    let interactionType: 'nfc' | 'qr' | 'unknown' = 'unknown';
    if (sourceParam === 'nfc') interactionType = 'nfc';
    else if (sourceParam === 'qr') interactionType = 'qr';

    const userAgent = request.headers.get('user-agent') || null;
    const referrer = request.headers.get('referer') || null;

    // 3. Log interaction asynchronously without blocking fast redirect
    // We fire insert into interactions table
    supabase
      .from('interactions')
      .insert({
        organization_id: device.organization_id,
        location_id: device.location_id,
        device_id: device.id,
        interaction_type: interactionType,
        user_agent: userAgent,
        referrer: referrer,
      })
      .then(({ error }) => {
        if (error) {
          console.error('[Tracking] Error logging interaction:', error.message);
        }
      });

    // 4. Immediate redirect to target destination
    const targetUrl = device.destination_url.startsWith('http')
      ? device.destination_url
      : `https://${device.destination_url}`;

    return NextResponse.redirect(targetUrl, { status: 307 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal error';
    console.error('[Tracking] Exception:', errorMsg);
    return new NextResponse('Internal tracking error', { status: 500 });
  }
}
