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

    // 2. Fetch organization configuration (Hub Mode, Review Shield & Smart Routing)
    const { data: org } = await supabase
      .from('organizations')
      .select('category, hub_mode, review_shield_enabled, google_review_url, smart_routing_enabled, lunch_destination_url, lunch_start_time, lunch_end_time')
      .eq('id', device.organization_id)
      .single();

    // 3. Parse interaction context
    const sourceParam = request.nextUrl.searchParams.get('source')?.toLowerCase();
    let interactionType: 'nfc' | 'qr' | 'unknown' = 'unknown';
    if (sourceParam === 'nfc') interactionType = 'nfc';
    else if (sourceParam === 'qr') interactionType = 'qr';

    const userAgent = request.headers.get('user-agent') || null;
    const referrer = request.headers.get('referer') || null;

    // 4. Log interaction asynchronously without blocking
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

    const hubMode = org?.hub_mode || 'hub';

    // 5. UNIVERSAL EXPERIENCE HUB MODE (Default)
    // Directs visitors to the category-adaptive experience hub
    if (hubMode === 'hub') {
      const hubUrl = new URL(`/hub/${cleanCode}`, request.url);
      if (sourceParam) {
        hubUrl.searchParams.set('source', sourceParam);
      }
      return NextResponse.redirect(hubUrl.toString(), { status: 307 });
    }

    // 6. SMART ROUTING CHECK (Time-based conditional routing)
    if (hubMode === 'smart_routing' && org?.lunch_destination_url) {
      try {
        const romeFormatter = new Intl.DateTimeFormat('it-IT', {
          timeZone: 'Europe/Rome',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        const currentRomeTime = romeFormatter.format(new Date()); // e.g. "13:15"
        const startTime = org.lunch_start_time || '12:00';
        const endTime = org.lunch_end_time || '15:30';

        if (currentRomeTime >= startTime && currentRomeTime <= endTime) {
          const lunchUrl = org.lunch_destination_url.startsWith('http')
            ? org.lunch_destination_url
            : `https://${org.lunch_destination_url}`;
          return NextResponse.redirect(lunchUrl, { status: 307 });
        }
      } catch (err) {
        console.warn('[Tracking] Smart routing check failed, falling back:', err);
      }
    }

    // 7. REVIEW SHIELD CHECK
    // If review shield is enabled or hubMode is set to 'shield', redirect to review shield
    if (hubMode === 'shield' || org?.review_shield_enabled) {
      const url = new URL(`/review/${cleanCode}`, request.url);
      if (sourceParam) {
        url.searchParams.set('source', sourceParam);
      }
      return NextResponse.redirect(url.toString(), { status: 307 });
    }

    // 8. Fallback / Direct Mode: direct redirect to target destination
    const destination = org?.google_review_url || device.destination_url;
    const targetUrl = destination.startsWith('http')
      ? destination
      : `https://${destination}`;

    return NextResponse.redirect(targetUrl, { status: 307 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal error';
    console.error('[Tracking] Exception:', errorMsg);
    return new NextResponse('Internal tracking error', { status: 500 });
  }
}
