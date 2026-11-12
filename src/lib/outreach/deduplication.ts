/**
 * RIVO OUTREACH — Prospect Deduplication & Record Merge Service
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { OutreachProspectRecord } from './types';

const GENERIC_SOCIAL_DOMAINS = new Set([
  'instagram.com',
  'www.instagram.com',
  'facebook.com',
  'www.facebook.com',
  'fb.com',
  'linktr.ee',
  'wa.me',
  'tiktok.com',
  'google.com',
]);

export function normalizeBusinessName(rawName: string): string {
  if (!rawName) return '';
  return rawName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(s\.?r\.?l\.?s?\.?|s\.?n\.?c\.?|s\.?a\.?s\.?|s\.?p\.?a\.?)\b/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractWebsiteDomain(rawUrl: string | null | undefined): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(withProtocol);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    if (!host || GENERIC_SOCIAL_DOMAINS.has(host)) {
      return null;
    }
    return host;
  } catch {
    return null;
  }
}

export function normalizePhoneDigits(rawPhone: string | null | undefined): string | null {
  if (!rawPhone) return null;
  const digits = rawPhone.replace(/[^0-9]/g, '');
  if (digits.length < 6) return null;
  return digits.replace(/^0039/, '').replace(/^39(?=\d{9,10}$)/, '');
}

export interface DuplicateMatchResult {
  isDuplicate: boolean;
  matchedProspect: OutreachProspectRecord | null;
  matchReason: 'source_reference' | 'website_domain' | 'name_and_city' | 'phone' | null;
}

/**
 * Pure in-memory deduplication matcher against a list of existing prospects.
 * Used both in unit tests and by the database deduplication service.
 */
export function matchDuplicateInList(
  candidate: {
    business_name: string;
    city?: string | null;
    address?: string | null;
    website?: string | null;
    business_phone?: string | null;
    source: string;
    source_reference?: string | null;
  },
  existingList: OutreachProspectRecord[]
): DuplicateMatchResult {
  const normName = normalizeBusinessName(candidate.business_name);
  const domain = extractWebsiteDomain(candidate.website);
  const normPhone = normalizePhoneDigits(candidate.business_phone);
  const normCity = (candidate.city || '').trim().toLowerCase();

  for (const existing of existingList) {
    if (existing.merged_into_id) continue;

    // 1. Exact source + source_reference match
    if (
      candidate.source_reference &&
      existing.source === candidate.source &&
      existing.source_reference === candidate.source_reference
    ) {
      return {
        isDuplicate: true,
        matchedProspect: existing,
        matchReason: 'source_reference',
      };
    }

    // 2. Same custom website domain
    if (domain && existing.website_domain && domain === existing.website_domain) {
      return {
        isDuplicate: true,
        matchedProspect: existing,
        matchReason: 'website_domain',
      };
    }

    // 3. Same normalized business phone
    if (normPhone && existing.business_phone) {
      const existingPhone = normalizePhoneDigits(existing.business_phone);
      if (existingPhone && existingPhone === normPhone) {
        return {
          isDuplicate: true,
          matchedProspect: existing,
          matchReason: 'phone',
        };
      }
    }

    // 4. Same normalized business name in the same city
    if (normName && existing.normalized_name === normName) {
      const exCity = (existing.city || '').trim().toLowerCase();
      if (!normCity || !exCity || normCity === exCity) {
        return {
          isDuplicate: true,
          matchedProspect: existing,
          matchReason: 'name_and_city',
        };
      }
    }
  }

  return {
    isDuplicate: false,
    matchedProspect: null,
    matchReason: null,
  };
}

/**
 * Merges `secondaryProspectId` into `primaryProspectId`, preserving all non-empty
 * contact fields, AI generations, conversations, messages, permissions, and logs.
 */
export async function mergeDuplicateProspects(
  adminDb: SupabaseClient,
  primaryProspectId: string,
  secondaryProspectId: string,
  adminUserId?: string
): Promise<{ success: boolean; error?: string; mergedProspect?: OutreachProspectRecord }> {
  if (primaryProspectId === secondaryProspectId) {
    return { success: false, error: 'Impossibile unire una scheda con se stessa.' };
  }

  const [{ data: primary }, { data: secondary }] = await Promise.all([
    adminDb.from('outreach_prospects').select('*').eq('id', primaryProspectId).maybeSingle(),
    adminDb.from('outreach_prospects').select('*').eq('id', secondaryProspectId).maybeSingle(),
  ]);

  if (!primary || !secondary) {
    return { success: false, error: 'Una delle schede prospect selezionate non esiste.' };
  }

  const primaryServices = Array.isArray(primary.services_offered) ? primary.services_offered : [];
  const secondaryServices = Array.isArray(secondary.services_offered) ? secondary.services_offered : [];
  const mergedServices = Array.from(new Set([...primaryServices, ...secondaryServices]));

  const mergedSignals = {
    ...(secondary.digital_signals || {}),
    ...(primary.digital_signals || {}),
  };

  const combinedNotes = [primary.admin_notes, secondary.admin_notes]
    .filter(Boolean)
    .join('\n---\n');

  // Repoint related child records to primary prospect
  await Promise.all([
    adminDb
      .from('outreach_ai_generations')
      .update({ prospect_id: primaryProspectId })
      .eq('prospect_id', secondaryProspectId),
    adminDb
      .from('outreach_conversations')
      .update({ prospect_id: primaryProspectId })
      .eq('prospect_id', secondaryProspectId),
    adminDb
      .from('outreach_messages')
      .update({ prospect_id: primaryProspectId })
      .eq('prospect_id', secondaryProspectId),
    adminDb
      .from('outreach_contact_permissions')
      .update({ prospect_id: primaryProspectId })
      .eq('prospect_id', secondaryProspectId),
    adminDb
      .from('outreach_activity_logs')
      .update({ prospect_id: primaryProspectId })
      .eq('prospect_id', secondaryProspectId),
  ]);

  // Update primary record with enriched fields from secondary where missing
  const { data: updatedPrimary, error: updateErr } = await adminDb
    .from('outreach_prospects')
    .update({
      subcategory: primary.subcategory || secondary.subcategory,
      city: primary.city || secondary.city,
      province: primary.province || secondary.province,
      region: primary.region || secondary.region,
      address: primary.address || secondary.address,
      postal_code: primary.postal_code || secondary.postal_code,
      website: primary.website || secondary.website,
      website_domain: primary.website_domain || secondary.website_domain,
      instagram_url: primary.instagram_url || secondary.instagram_url,
      facebook_url: primary.facebook_url || secondary.facebook_url,
      business_phone: primary.business_phone || secondary.business_phone,
      business_email: primary.business_email || secondary.business_email,
      description: primary.description || secondary.description,
      services_offered: mergedServices,
      digital_signals: mergedSignals,
      lead_score: Math.max(primary.lead_score || 0, secondary.lead_score || 0),
      confidence_score: Math.max(primary.confidence_score || 0, secondary.confidence_score || 0),
      ai_analysis: primary.ai_analysis || secondary.ai_analysis,
      admin_notes: combinedNotes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', primaryProspectId)
    .select('*')
    .single();

  if (updateErr) {
    return { success: false, error: updateErr.message };
  }

  // Mark secondary as merged and remove from active lists
  await adminDb
    .from('outreach_prospects')
    .update({
      merged_into_id: primaryProspectId,
      commercial_status: 'non_contattare',
      source_reference: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', secondaryProspectId);

  await adminDb.from('outreach_activity_logs').insert({
    prospect_id: primaryProspectId,
    action: 'prospect_merged',
    metadata: {
      merged_secondary_id: secondaryProspectId,
      merged_business_name: secondary.business_name,
      merged_source: secondary.source,
    },
    admin_user_id: adminUserId || null,
  });

  return { success: true, mergedProspect: updatedPrimary as OutreachProspectRecord };
}
