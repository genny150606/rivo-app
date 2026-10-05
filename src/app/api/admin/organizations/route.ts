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
      vatNumber,
      whatsappNumber,
      instagramUrl,
      description,
      adminNotes,
      googleReviewUrl,
      wifiSsid,
      wifiPassword,
      aiMenuContext,
      loyaltyRewardText,
      primaryColor,
      locationName,
      address,
      city,
      postalCode,
      province,
      ownerFirstName,
      ownerLastName,
      ownerEmail,
      ownerPassword,
      planName,
      deviceName,
      deviceType,
      deviceCode,
      destinationUrl,
      businessTypeSlug,
      selectedModuleSlugs,
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

    // Resolve Business Type
    let targetBtSlug = businessTypeSlug;
    if (!targetBtSlug) {
      if (category === 'hotel') targetBtSlug = 'hotel';
      else if (category === 'bnb') targetBtSlug = 'bb';
      else if (category === 'bar') targetBtSlug = 'bar';
      else if (category === 'pizzeria') targetBtSlug = 'pizzeria';
      else if (category === 'retail' || category === 'store') targetBtSlug = 'retail';
      else targetBtSlug = 'restaurant';
    }

    const { data: btData } = await supabase
      .from('business_types')
      .select('id, slug')
      .eq('slug', targetBtSlug)
      .single();

    // 1. Get Plan
    const { data: plan } = await supabase
      .from('plans')
      .select('id')
      .eq('name', planName || 'Starter')
      .single();

    // Helper to rollback partial provisioning on failure
    const rollback = async (orgId: string) => {
      try {
        await supabase.from('devices').delete().eq('organization_id', orgId);
        await supabase.from('locations').delete().eq('organization_id', orgId);
        await supabase.from('organization_modules').delete().eq('organization_id', orgId);
        await supabase.from('organizations').delete().eq('id', orgId);
      } catch (cleanupErr) {
        console.error('Failed to rollback organization provisioning:', cleanupErr);
      }
    };

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
        business_type: targetBtSlug || category || 'retail',
        business_type_id: btData?.id || null,
        hub_mode: hubMode || 'hub',
        custom_cta_label: customCtaLabel || null,
        custom_cta_url: customCtaUrl || null,
        vat_number: vatNumber || null,
        whatsapp_number: whatsappNumber || null,
        instagram_url: instagramUrl || null,
        description: description || null,
        admin_notes: adminNotes || null,
        google_review_url: googleReviewUrl || null,
        wifi_ssid: wifiSsid || null,
        wifi_password: wifiPassword || null,
        ai_menu_context: aiMenuContext || null,
        loyalty_reward_text: loyaltyRewardText || null,
        primary_color: primaryColor || '#B4F02A',
        review_shield_enabled: true,
        status: 'active',
      })
      .select()
      .single();

    if (orgErr || !org) {
      return NextResponse.json({ error: orgErr?.message || 'Errore creazione attività' }, { status: 400 });
    }

    // 2.1 Provision Organization Modules
    if (btData?.id) {
      // Get all modules from catalog
      const { data: allModules } = await supabase.from('modules').select('id, slug');
      const moduleMap = new Map((allModules || []).map((m: any) => [m.slug, m.id]));

      if (Array.isArray(selectedModuleSlugs) && selectedModuleSlugs.length > 0) {
        // Use explicitly selected modules
        const moduleInserts = selectedModuleSlugs
          .filter((slug: string) => moduleMap.has(slug))
          .map((slug: string) => ({
            organization_id: org.id,
            module_id: moduleMap.get(slug),
            enabled: true,
            source: 'admin_override',
          }));

        if (moduleInserts.length > 0) {
          await supabase.from('organization_modules').insert(moduleInserts);
        }
      } else {
        // Fall back to preset defaults from business_type_modules
        const { data: presetModules } = await supabase
          .from('business_type_modules')
          .select('module_id, enabled_by_default')
          .eq('business_type_id', btData.id);

        if (presetModules && presetModules.length > 0) {
          const moduleInserts = presetModules.map((pm: any) => ({
            organization_id: org.id,
            module_id: pm.module_id,
            enabled: pm.enabled_by_default,
            source: 'preset',
          }));
          await supabase.from('organization_modules').insert(moduleInserts);
        }
      }
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
        province: province || null,
        country: 'IT',
      })
      .select()
      .single();

    if (locErr || !loc) {
      await rollback(org.id);
      return NextResponse.json({ error: locErr?.message || 'Errore creazione sede' }, { status: 400 });
    }

    // 4. Insert Initial Device (with Guaranteed Unique Code)
    let cleanCode = deviceCode?.trim() 
      ? (deviceCode.trim().toUpperCase().startsWith('RIVO-') ? deviceCode.trim().toUpperCase() : `RIVO-${deviceCode.trim().toUpperCase()}`)
      : ('RIVO-' + Math.random().toString(36).substring(2, 8).toUpperCase());

    // Verify uniqueness against existing devices to prevent devices_unique_code_key collision
    let codeExists = true;
    let attempts = 0;
    while (codeExists && attempts < 10) {
      const { data: existingDevice } = await supabase
        .from('devices')
        .select('id')
        .eq('unique_code', cleanCode)
        .maybeSingle();

      if (!existingDevice) {
        codeExists = false;
      } else {
        // Suffix collision detected - generate fresh random unique code
        cleanCode = 'RIVO-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        attempts++;
      }
    }

    const { error: devErr } = await supabase
      .from('devices')
      .insert({
        organization_id: org.id,
        location_id: loc.id,
        name: deviceName || 'Tavolo 1',
        type: deviceType || 'both',
        unique_code: cleanCode,
        destination_url: destinationUrl || 'https://google.com',
        status: 'active',
      });

    if (devErr) {
      await rollback(org.id);
      return NextResponse.json({ error: devErr.message }, { status: 400 });
    }

    // 5. Create or connect the owner without changing the active administrator session.
    let authUserId: string | null = null;
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
      // If user already exists in auth, find existing user so we can attach them to this organization
      if (authErr.message?.toLowerCase().includes('already') || authErr.message?.toLowerCase().includes('registered')) {
        const { data: userList } = await supabase.auth.admin.listUsers();
        const existing = userList?.users?.find((u) => u.email?.toLowerCase() === ownerEmail.toLowerCase());
        if (existing) {
          authUserId = existing.id;
          if (ownerPassword) {
            await supabase.auth.admin.updateUserById(existing.id, { password: ownerPassword });
          }
        } else {
          await rollback(org.id);
          return NextResponse.json({ error: authErr.message }, { status: 400 });
        }
      } else {
        await rollback(org.id);
        return NextResponse.json({ error: authErr.message }, { status: 400 });
      }
    } else {
      authUserId = authData.user?.id || null;
    }

    // 6. Connect Profile to this Organization
    if (authUserId) {
      const { error: ownerProfileError } = await supabase
        .from('profiles')
        .upsert({
          auth_user_id: authUserId,
          organization_id: org.id,
          role: 'client',
          first_name: ownerFirstName || null,
          last_name: ownerLastName || null,
          email: ownerEmail,
        }, { onConflict: 'auth_user_id' });

      if (ownerProfileError) {
        await rollback(org.id);
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
      deviceCode: cleanCode,
      welcomeEmailSent,
      emailWarning,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
