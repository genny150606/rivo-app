import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateGoogleWalletSaveUrl } from '@/lib/wallet/google-pass';
import { isValidUUID } from '@/lib/security';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface GoogleWalletRouteProps {
  params: Promise<{ passId: string }>;
}

export async function POST(request: NextRequest, { params }: GoogleWalletRouteProps) {
  try {
    const resolvedParams = await params;
    const passId = resolvedParams.passId;
    const body = await request.json().catch(() => ({}));

    let customerName = body.customer_name || 'Cliente RIVO';
    let stampsCount = body.stamps_count || 1;
    let maxStamps = body.max_stamps || 10;
    let rewardText = body.reward_text || 'Omaggio Esclusivo';
    let organizationName = 'Locale Partner';
    let passToken = `RIVO-GOOGLE-${passId.slice(0, 8).toUpperCase()}`;

    // Look up card details if valid UUID
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
    } else if (body.organization_id && isValidUUID(body.organization_id)) {
      const { data: org } = await supabase
        .from('organizations')
        .select('name, loyalty_reward_text')
        .eq('id', body.organization_id)
        .single();

      if (org) {
        organizationName = org.name || organizationName;
        rewardText = org.loyalty_reward_text || rewardText;
      }
    }

    const { saveUrl, isSandbox } = generateGoogleWalletSaveUrl({
      passId,
      passToken,
      organizationName,
      customerName,
      stampsCount,
      maxStamps,
      rewardText,
    });

    return NextResponse.json({
      success: true,
      saveUrl,
      isSandbox,
      passToken,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
