import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      businessName,
      slug,
      phone,
      email,
      website,
      locationName,
      address,
      city,
      postalCode,
      ownerFirstName,
      ownerLastName,
      ownerEmail,
      ownerPassword,
      planName,
      deviceName,
      deviceType,
      destinationUrl,
    } = body;

    if (!businessName || !ownerEmail || !ownerPassword) {
      return NextResponse.json(
        { error: 'Nome attività, email titolare e password sono obbligatori.' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 1. Get Plan
    const { data: plan } = await supabase
      .from('plans')
      .select('id')
      .eq('name', planName || 'Starter')
      .single();

    // 2. Insert Organization
    const finalSlug = slug?.trim() || businessName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const { data: org, error: orgErr } = await supabase
      .from('organizations')
      .insert({
        name: businessName,
        slug: finalSlug,
        phone: phone || null,
        email: email || null,
        website: website || null,
        plan_id: plan?.id || null,
        status: 'active',
      })
      .select()
      .single();

    if (orgErr || !org) {
      return NextResponse.json({ error: orgErr?.message || 'Errore creazione attività' }, { status: 400 });
    }

    // 3. Insert Location
    const { data: loc, error: locErr } = await supabase
      .from('locations')
      .insert({
        organization_id: org.id,
        name: locationName || 'Sede Principale',
        address: address || null,
        city: city || null,
        postal_code: postalCode || null,
        country: 'IT',
      })
      .select()
      .single();

    if (locErr || !loc) {
      return NextResponse.json({ error: locErr?.message || 'Errore creazione sede' }, { status: 400 });
    }

    // 4. Insert Initial Device
    const randCode = 'RIVO-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const { error: devErr } = await supabase
      .from('devices')
      .insert({
        organization_id: org.id,
        location_id: loc.id,
        name: deviceName || 'Tavolo 1',
        type: deviceType || 'both',
        unique_code: randCode,
        destination_url: destinationUrl || 'https://google.com',
        status: 'active',
      });

    if (devErr) {
      return NextResponse.json({ error: devErr.message }, { status: 400 });
    }

    // 5. Create Auth User directly via Supabase Auth
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: ownerEmail,
      password: ownerPassword,
      options: {
        data: {
          first_name: ownerFirstName || '',
          last_name: ownerLastName || '',
        },
      },
    });

    if (authErr) {
      return NextResponse.json({ error: authErr.message }, { status: 400 });
    }

    // 6. Connect Profile to this Organization
    if (authData.user) {
      await supabase
        .from('profiles')
        .upsert({
          auth_user_id: authData.user.id,
          organization_id: org.id,
          role: 'client',
          first_name: ownerFirstName || null,
          last_name: ownerLastName || null,
        }, { onConflict: 'auth_user_id' });
    }

    return NextResponse.json({
      success: true,
      organization: org,
      deviceCode: randCode,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
