/**
 * RIVO OUTREACH — Transactional & Idempotent Prospect-to-Client Conversion Service
 * Reuses the RIVO Organization Provisioning pipeline (`organizations`, `organization_modules`,
 * `locations`, `devices`, owner `profiles`).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { findSubcategoryDef, type OutreachProspectRecord } from './types';
import { sendWelcomeEmail } from '@/lib/email/welcome-email';

export interface ConvertProspectToClientInput {
  prospectId: string;
  ownerEmail: string;
  ownerPassword: string;
  ownerFirstName?: string;
  ownerLastName?: string;
  categoryOverride?: string;
  selectedModuleSlugs?: string[];
  planName?: string;
  deviceName?: string;
  primaryColor?: string;
  appUrl: string;
  adminUserId?: string;
}

export interface ConvertProspectResult {
  success: boolean;
  idempotentReplay: boolean;
  organization?: any;
  deviceCode?: string;
  welcomeEmailSent?: boolean;
  emailWarning?: string;
  error?: string;
}

export async function convertProspectToRivoClient(
  adminDb: SupabaseClient,
  input: ConvertProspectToClientInput
): Promise<ConvertProspectResult> {
  // 1. Load prospect and check idempotency
  const { data: prospectRow, error: prospectErr } = await adminDb
    .from('outreach_prospects')
    .select('*')
    .eq('id', input.prospectId)
    .maybeSingle();

  if (prospectErr || !prospectRow) {
    return {
      success: false,
      idempotentReplay: false,
      error: 'Prospect non trovato.',
    };
  }

  const prospect = prospectRow as OutreachProspectRecord;

  // IDEMPOTENCY GUARD: If prospect already has an organization_id, return existing org
  if (prospect.organization_id) {
    const { data: existingOrg } = await adminDb
      .from('organizations')
      .select('*')
      .eq('id', prospect.organization_id)
      .maybeSingle();

    if (existingOrg) {
      return {
        success: true,
        idempotentReplay: true,
        organization: existingOrg,
      };
    }
  }

  const subDef = findSubcategoryDef(
    input.categoryOverride || prospect.subcategory || prospect.category
  );
  const category = input.categoryOverride || subDef.rivoCategorySlug || 'restaurant';

  let targetBtSlug = 'restaurant';
  if (category === 'hotel') targetBtSlug = 'hotel';
  else if (category === 'bnb') targetBtSlug = 'bb';
  else if (category === 'bar') targetBtSlug = 'bar';
  else if (category === 'pizzeria') targetBtSlug = 'pizzeria';
  else if (category === 'salon') targetBtSlug = 'salon';
  else if (category === 'barber') targetBtSlug = 'barber';
  else if (category === 'beauty') targetBtSlug = 'beauty';
  else if (category === 'retail' || category === 'store') targetBtSlug = 'retail';

  const [{ data: btData }, { data: plan }] = await Promise.all([
    adminDb.from('business_types').select('id, slug').eq('slug', targetBtSlug).maybeSingle(),
    adminDb
      .from('plans')
      .select('id')
      .eq('name', input.planName || 'Starter')
      .maybeSingle(),
  ]);

  const rollback = async (orgId: string) => {
    try {
      await adminDb.from('devices').delete().eq('organization_id', orgId);
      await adminDb.from('locations').delete().eq('organization_id', orgId);
      await adminDb.from('organization_modules').delete().eq('organization_id', orgId);
      await adminDb.from('organizations').delete().eq('id', orgId);
    } catch (cleanupErr) {
      console.error('[Outreach Conversion Rollback Error]', cleanupErr);
    }
  };

  // Generate unique slug
  const baseSlug = prospect.business_name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const finalSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

  // 2. Create Organization
  const { data: org, error: orgErr } = await adminDb
    .from('organizations')
    .insert({
      name: prospect.business_name,
      slug: finalSlug,
      phone: prospect.business_phone || null,
      email: prospect.business_email || input.ownerEmail,
      website: prospect.website || null,
      plan_id: plan?.id || null,
      category,
      business_type: targetBtSlug,
      business_type_id: btData?.id || null,
      hub_mode: 'hub',
      whatsapp_number: prospect.business_phone || null,
      instagram_url: prospect.instagram_url || null,
      description: prospect.description || null,
      admin_notes: `Convertito da RIVO OUTREACH (Prospect ID: ${prospect.id}, Fonte: ${prospect.source}).`,
      primary_color: input.primaryColor || '#BFFF00',
      review_shield_enabled: true,
      status: 'active',
    })
    .select('*')
    .single();

  if (orgErr || !org) {
    return {
      success: false,
      idempotentReplay: false,
      error: orgErr?.message || 'Errore nella creazione dell’organizzazione RIVO.',
    };
  }

  // 3. Provision Modules
  const moduleSlugsToEnable =
    Array.isArray(input.selectedModuleSlugs) && input.selectedModuleSlugs.length > 0
      ? input.selectedModuleSlugs
      : subDef.defaultRivoModules;

  const { data: allModules } = await adminDb.from('modules').select('id, slug');
  const moduleMap = new Map((allModules || []).map((m: any) => [m.slug, m.id]));

  const moduleInserts = moduleSlugsToEnable
    .filter((slug) => moduleMap.has(slug))
    .map((slug) => ({
      organization_id: org.id,
      module_id: moduleMap.get(slug),
      enabled: true,
      source: 'outreach_conversion',
    }));

  if (moduleInserts.length > 0) {
    await adminDb.from('organization_modules').insert(moduleInserts);
  }

  // 4. Create Location
  const { data: loc, error: locErr } = await adminDb
    .from('locations')
    .insert({
      organization_id: org.id,
      name: 'Sede Principale',
      address: prospect.address || null,
      city: prospect.city || null,
      postal_code: prospect.postal_code || null,
      province: prospect.province || null,
      country: 'IT',
    })
    .select('*')
    .single();

  if (locErr || !loc) {
    await rollback(org.id);
    return {
      success: false,
      idempotentReplay: false,
      error: locErr?.message || 'Errore nella creazione della sede.',
    };
  }

  // 5. Create Initial Device
  const defaultDeviceLabel = ['salon', 'barber', 'beauty'].includes(category)
    ? 'Postazione 1'
    : ['hotel', 'bnb'].includes(category)
    ? 'Camera 101'
    : 'Tavolo 1';

  let cleanCode = 'RIVO-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  for (let attempt = 0; attempt < 8; attempt++) {
    const { data: existingDev } = await adminDb
      .from('devices')
      .select('id')
      .eq('unique_code', cleanCode)
      .maybeSingle();
    if (!existingDev) break;
    cleanCode = 'RIVO-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  const { error: devErr } = await adminDb.from('devices').insert({
    organization_id: org.id,
    location_id: loc.id,
    name: input.deviceName || defaultDeviceLabel,
    type: 'both',
    unique_code: cleanCode,
    destination_url: prospect.website || 'https://google.com',
    status: 'active',
  });

  if (devErr) {
    await rollback(org.id);
    return {
      success: false,
      idempotentReplay: false,
      error: devErr.message,
    };
  }

  // 6. Create or attach Owner User
  let authUserId: string | null = null;
  const { data: authData, error: authErr } = await adminDb.auth.admin.createUser({
    email: input.ownerEmail,
    password: input.ownerPassword,
    email_confirm: true,
    user_metadata: {
      first_name: input.ownerFirstName || '',
      last_name: input.ownerLastName || '',
    },
  });

  if (authErr) {
    if (
      authErr.message?.toLowerCase().includes('already') ||
      authErr.message?.toLowerCase().includes('registered')
    ) {
      const { data: userList } = await adminDb.auth.admin.listUsers();
      const existing = userList?.users?.find(
        (u) => u.email?.toLowerCase() === input.ownerEmail.toLowerCase()
      );
      if (existing) {
        authUserId = existing.id;
      } else {
        await rollback(org.id);
        return { success: false, idempotentReplay: false, error: authErr.message };
      }
    } else {
      await rollback(org.id);
      return { success: false, idempotentReplay: false, error: authErr.message };
    }
  } else {
    authUserId = authData.user?.id || null;
  }

  if (authUserId) {
    const { error: profileErr } = await adminDb.from('profiles').upsert(
      {
        auth_user_id: authUserId,
        organization_id: org.id,
        role: 'client',
        first_name: input.ownerFirstName || null,
        last_name: input.ownerLastName || null,
        email: input.ownerEmail,
      },
      { onConflict: 'auth_user_id' }
    );

    if (profileErr) {
      await rollback(org.id);
      return { success: false, idempotentReplay: false, error: profileErr.message };
    }
  }

  // 7. Link Prospect to Organization & Update Pipeline Status
  const nowIso = new Date().toISOString();
  await Promise.all([
    adminDb
      .from('outreach_prospects')
      .update({
        organization_id: org.id,
        commercial_status: 'convertito_in_cliente',
        updated_at: nowIso,
      })
      .eq('id', prospect.id),
    adminDb.from('outreach_activity_logs').insert({
      prospect_id: prospect.id,
      action: 'converted_to_rivo_client',
      metadata: {
        organization_id: org.id,
        organization_slug: org.slug,
        device_code: cleanCode,
        enabled_modules: moduleSlugsToEnable,
      },
      admin_user_id: input.adminUserId || null,
    }),
  ]);

  // 8. Optional Welcome Email
  let welcomeEmailSent = false;
  let emailWarning: string | undefined;
  try {
    const callbackUrl = `${input.appUrl.replace(/\/$/, '')}/auth/callback?next=/dashboard`;
    const { data: loginLink } = await adminDb.auth.admin.generateLink({
      type: 'magiclink',
      email: input.ownerEmail,
      options: { redirectTo: callbackUrl },
    });
    if (loginLink?.properties?.action_link) {
      const emailRes = await sendWelcomeEmail({
        appUrl: input.appUrl,
        businessName: prospect.business_name,
        ownerEmail: input.ownerEmail,
        ownerFirstName: input.ownerFirstName || 'Titolare',
        ownerPassword: input.ownerPassword,
        onboardingLink: loginLink.properties.action_link,
      });
      welcomeEmailSent = emailRes.sent;
      emailWarning = emailRes.sent ? undefined : emailRes.reason;
    }
  } catch {
    emailWarning = 'Organizzazione creata, ma email di benvenuto non inviata.';
  }

  return {
    success: true,
    idempotentReplay: false,
    organization: org,
    deviceCode: cleanCode,
    welcomeEmailSent,
    emailWarning,
  };
}
