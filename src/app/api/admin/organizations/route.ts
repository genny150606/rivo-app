import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { sendWelcomeEmail } from '@/lib/email/welcome-email';

// Initialize Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: NextRequest) {
  try {
    // Verify the caller using their session before using the privileged client.
    // The service-role key bypasses RLS and must never be exposed to the browser.
    const sessionClient = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {},
      },
    });
    const {
      data: { user },
      error: userError,
    } = await sessionClient.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Sessione non valida. Accedi di nuovo.' }, { status: 401 });
    }

    const { data: requesterProfile, error: profileError } = await sessionClient
      .from('profiles')
      .select('role')
      .eq('auth_user_id', user.id)
      .single();

    if (profileError || requesterProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Operazione riservata agli amministratori RIVO.' }, { status: 403 });
    }

    if (!supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: 'Configurazione server incompleta: manca SUPABASE_SERVICE_ROLE_KEY.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      businessName,
      slug,
      logoUrl,
      phone,
      email,
      website,
      category,
      hubMode,
      customCtaLabel,
      customCtaUrl,
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

    // Provisioning writes span multiple tenants and Auth. This must run only on
    // the server with a service-role client, after the admin check above.
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

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
        logo_url: logoUrl || null,
        phone: phone || null,
        email: email || null,
        website: website || null,
        plan_id: plan?.id || null,
        category: category || 'restaurant',
        hub_mode: hubMode || 'hub',
        custom_cta_label: customCtaLabel || null,
        custom_cta_url: customCtaUrl || null,
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

    // 5. Create the owner without changing the active administrator session.
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: ownerEmail,
      password: ownerPassword,
      email_confirm: true,
      user_metadata: {
        first_name: ownerFirstName || '',
        last_name: ownerLastName || '',
      },
    });

    if (authErr) {
      return NextResponse.json({ error: authErr.message }, { status: 400 });
    }

    // 6. Connect Profile to this Organization
    if (authData.user) {
      const { error: ownerProfileError } = await supabase
        .from('profiles')
        .upsert({
          auth_user_id: authData.user.id,
          organization_id: org.id,
          role: 'client',
          first_name: ownerFirstName || null,
          last_name: ownerLastName || null,
        }, { onConflict: 'auth_user_id' });

      if (ownerProfileError) {
        return NextResponse.json({ error: ownerProfileError.message }, { status: 400 });
      }
    }

    // 7. Generate a personal, one-time sign-in link and deliver it in the
    // branded welcome email. A failure to send must not undo provisioning.
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/$/, '');
    const callbackUrl = `${appUrl}/auth/callback?next=/dashboard`;
    const { data: loginLink, error: loginLinkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: ownerEmail,
      options: { redirectTo: callbackUrl },
    });

    let emailWarning: string | undefined;
    let welcomeEmailSent = false;

    if (loginLinkError || !loginLink?.properties.action_link) {
      emailWarning = 'Organizzazione creata, ma non è stato possibile generare il link personale di accesso.';
    } else {
      const emailResult = await sendWelcomeEmail({
        appUrl,
        businessName,
        ownerEmail,
        ownerFirstName,
        ownerPassword,
        onboardingLink: loginLink.properties.action_link,
      });

      welcomeEmailSent = emailResult.sent;
      emailWarning = emailResult.sent ? undefined : emailResult.reason;
    }

    return NextResponse.json({
      success: true,
      organization: org,
      deviceCode: randCode,
      welcomeEmailSent,
      emailWarning,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
