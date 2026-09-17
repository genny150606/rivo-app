import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isValidUUID, sanitizeString, verifyUserOrgAccess } from '@/lib/security';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const orgId = request.nextUrl.searchParams.get('organization_id');
    const contact = request.nextUrl.searchParams.get('contact');

    if (!orgId || !isValidUUID(orgId)) {
      return NextResponse.json({ error: 'organization_id valido obbligatorio' }, { status: 400 });
    }

    if (contact) {
      const cleanContact = sanitizeString(contact, 120);
      if (!cleanContact) {
        return NextResponse.json({ error: 'Contatto non valido' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('loyalty_cards')
        .select('*')
        .eq('organization_id', orgId)
        .eq('customer_contact', cleanContact)
        .single();

      if (error && error.code !== 'PGRST116') {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ card: data || null });
    }

    // Listing all cards is a dashboard operation: require merchant/admin auth
    const authCheck = await verifyUserOrgAccess(request, orgId);
    if (!authCheck.authorized) {
      return authCheck.errorResponse;
    }

    const { data, error } = await supabase
      .from('loyalty_cards')
      .select('*')
      .eq('organization_id', orgId)
      .order('updated_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ cards: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organization_id, customer_contact, customer_name } = body;

    if (!organization_id || !customer_contact) {
      return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 });
    }

    if (!isValidUUID(organization_id)) {
      return NextResponse.json({ error: 'ID organizzazione non valido' }, { status: 400 });
    }

    const cleanContact = sanitizeString(customer_contact, 120);
    if (!cleanContact || cleanContact.length < 3) {
      return NextResponse.json({ error: 'Contatto non valido' }, { status: 400 });
    }

    const cleanName = sanitizeString(customer_name, 100);

    // Check if card already exists
    const { data: existingCard } = await supabase
      .from('loyalty_cards')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('customer_contact', cleanContact)
      .single();

    if (existingCard) {
      const newCount = existingCard.stamps_count + 1;
      const { data: updatedCard, error: updateErr } = await supabase
        .from('loyalty_cards')
        .update({
          stamps_count: newCount,
          customer_name: cleanName || existingCard.customer_name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingCard.id)
        .select()
        .single();

      if (updateErr) throw updateErr;

      return NextResponse.json({ success: true, card: updatedCard, isNew: false });
    }

    // Create new card with 1 initial stamp
    const { data: newCard, error: createErr } = await supabase
      .from('loyalty_cards')
      .insert({
        organization_id,
        customer_contact: cleanContact,
        customer_name: cleanName,
        stamps_count: 1,
        max_stamps: 10,
      })
      .select()
      .single();

    if (createErr) throw createErr;

    // Capture in leads CRM
    supabase
      .from('leads')
      .insert({
        organization_id,
        name: cleanName,
        contact: cleanContact,
        source: 'loyalty',
      })
      .then();

    return NextResponse.json({ success: true, card: newCard, isNew: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { card_id, action } = body;

    if (!card_id || !isValidUUID(card_id)) {
      return NextResponse.json({ error: 'card_id valido obbligatorio' }, { status: 400 });
    }

    // Fetch the card to know which organization it belongs to
    const { data: card, error: cardErr } = await supabase
      .from('loyalty_cards')
      .select('id, organization_id')
      .eq('id', card_id)
      .single();

    if (cardErr || !card) {
      return NextResponse.json({ error: 'Carta fedeltà non trovata' }, { status: 404 });
    }

    // High security: require merchant or admin auth for this organization
    const authCheck = await verifyUserOrgAccess(request, card.organization_id);
    if (!authCheck.authorized) {
      return authCheck.errorResponse;
    }

    if (action === 'reset') {
      // After redeeming reward, reset stamps count to 0
      const { data, error } = await supabase
        .from('loyalty_cards')
        .update({ stamps_count: 0, updated_at: new Date().toISOString() })
        .eq('id', card_id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, card: data });
    }

    return NextResponse.json({ error: 'Azione non supportata' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
