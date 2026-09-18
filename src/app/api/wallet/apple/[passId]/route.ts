import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createPkpassBundle } from '@/lib/wallet/apple-pass';
import { isValidUUID } from '@/lib/security';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface AppleWalletRouteProps {
  params: Promise<{ passId: string }>;
}

export async function GET(request: NextRequest, { params }: AppleWalletRouteProps) {
  try {
    const resolvedParams = await params;
    const passId = resolvedParams.passId;
    const orgId = request.nextUrl.searchParams.get('org_id');

    let customerName = 'Cliente RIVO';
    let stampsCount = 1;
    let maxStamps = 10;
    let rewardText = 'Omaggio Esclusivo';
    let organizationName = 'Locale Partner';
    let passToken = `RIVO-PASS-${passId.slice(0, 8).toUpperCase()}`;

    // 1. If passId is a UUID, attempt to load loyalty card from Supabase
    if (isValidUUID(passId)) {
      const { data: card } = await supabase
        .from('loyalty_cards')
        .select('*, organizations(name, loyalty_reward_text)')
        .eq('id', passId)
        .single();

      if (card) {
        customerName = card.customer_name || customerName;
        stampsCount = card.stamps_count || stampsCount;
        maxStamps = card.max_stamps || maxStamps;
        passToken = `RIVO-${card.id.slice(0, 8).toUpperCase()}`;
        if (card.organizations) {
          organizationName = card.organizations.name || organizationName;
          rewardText = card.organizations.loyalty_reward_text || rewardText;
        }
      }
    } else if (orgId && isValidUUID(orgId)) {
      const { data: org } = await supabase
        .from('organizations')
        .select('name, loyalty_reward_text')
        .eq('id', orgId)
        .single();

      if (org) {
        organizationName = org.name || organizationName;
        rewardText = org.loyalty_reward_text || rewardText;
      }
    }

    // 2. Build the signed .pkpass bundle
    const pkpassBuffer = await createPkpassBundle({
      passToken,
      customerName,
      stampsCount,
      maxStamps,
      rewardText,
      organizationName,
    });

    const filename = `rivo-loyalty-${organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.pkpass`;

    // 3. Return native application/vnd.apple.pkpass stream
    return new Response(new Uint8Array(pkpassBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Rivo-Pass-Type': 'storeCard',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    console.error('[Apple Wallet] Error generating .pkpass:', err);
    return new Response(`Errore nella generazione del pass Apple Wallet: ${msg}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
