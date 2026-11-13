import { describe, it, expect } from 'vitest';
import {
  normalizeBusinessName,
  extractWebsiteDomain,
  normalizePhoneDigits,
  matchDuplicateInList,
} from '@/lib/outreach/deduplication';
import {
  extractVerifiedFactsFromProspect,
  buildEvidenceBasedOpportunities,
  computeExplainableLeadScore,
  validatePitchAgainstHallucinations,
} from '@/lib/outreach/ai-intelligence';
import { OutreachComplianceService } from '@/lib/outreach/compliance';
import { DEFAULT_RIVO_KNOWLEDGE_BASE } from '@/lib/outreach/knowledge-base';
import {
  CAMPANIA_GEO_PRESETS,
  resolveLocationCoordinates,
  computeDistanceKm,
  buildGoogleMapsUrl,
} from '@/lib/outreach/providers/discovery';
import type { OutreachProspectRecord } from '@/lib/outreach/types';

function makeMockProspect(overrides: Partial<OutreachProspectRecord> = {}): OutreachProspectRecord {
  return {
    id: 'prosp-001',
    business_name: 'Osteria Bella Milano S.R.L.',
    normalized_name: 'osteria bella milano',
    category: 'food_beverage',
    subcategory: 'restaurant',
    address: 'Via Brera 24',
    city: 'Milano',
    province: 'MI',
    region: 'Lombardia',
    postal_code: '20121',
    latitude: 45.4722,
    longitude: 9.1878,
    website: 'https://www.osteriabellamilano.it/menu',
    website_domain: 'osteriabellamilano.it',
    instagram_url: 'https://instagram.com/osteriabellamilano',
    facebook_url: null,
    business_phone: '+39 02 1234 5678',
    business_email: 'info@osteriabellamilano.it',
    description: 'Ristorante tradizionale milanese con 70 coperti e menu stagionale.',
    services_offered: ['Cucina milanese', 'Cene aziendali', 'Wi-Fi gratuito'],
    digital_signals: {
      websiteTitle: 'Osteria Bella Milano — Cucina Tradizionale',
      websiteDescription: 'Ristorante nel cuore di Brera.',
      detectedBookingLinks: [],
      detectedMenuLinks: ['https://www.osteriabellamilano.it/menu.pdf'],
      detectedSocialLinks: ['https://instagram.com/osteriabellamilano'],
      httpStatus: 200,
      inspectedAt: new Date().toISOString(),
    },
    source: 'openstreetmap_odbl',
    source_reference: 'node:123456',
    source_acquired_at: new Date().toISOString(),
    lead_score: 0,
    confidence_score: 0,
    ai_analysis: null,
    commercial_status: 'nuovo',
    admin_notes: null,
    organization_id: null,
    merged_into_id: null,
    retention_expires_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('RIVO OUTREACH — Deduplication Engine', () => {
  it('normalizes business names by stripping legal suffixes and accents', () => {
    expect(normalizeBusinessName('Osteria Bella Milano S.R.L.')).toBe('osteria bella milano');
    expect(normalizeBusinessName('Caffè del Corso S.N.C.')).toBe('caffe del corso');
  });

  it('extracts normalized website domain without www or path', () => {
    expect(extractWebsiteDomain('https://www.OsteriaBellaMilano.it/prenota')).toBe(
      'osteriabellamilano.it'
    );
    expect(extractWebsiteDomain('not a valid url at all')).toBeNull();
  });

  it('normalizes Italian phone numbers consistently', () => {
    expect(normalizePhoneDigits('+39 02 1234 5678')).toBe('0212345678');
    expect(normalizePhoneDigits('0039 340-9876543')).toBe('3409876543');
  });

  it('detects duplicate prospects by website domain, phone, or normalized name + city', () => {
    const existing = [makeMockProspect()];

    const matchByDomain = matchDuplicateInList(
      {
        business_name: 'Osteria Bella',
        website: 'https://osteriabellamilano.it/contatti',
        source: 'manual_admin_entry',
      },
      existing
    );
    expect(matchByDomain.isDuplicate).toBe(true);
    expect(matchByDomain.matchReason).toBe('website_domain');

    const matchByPhone = matchDuplicateInList(
      {
        business_name: 'Altro Nome',
        business_phone: '+39 02 12345678',
        source: 'manual_admin_entry',
      },
      existing
    );
    expect(matchByPhone.isDuplicate).toBe(true);
    expect(matchByPhone.matchReason).toBe('phone');
  });
});

describe('RIVO OUTREACH — Explainable AI Scoring & Anti-Hallucination', () => {
  it('builds evidence-based opportunities and computes an explainable 0-100 lead score', () => {
    const prospect = makeMockProspect();
    const verifiedFacts = extractVerifiedFactsFromProspect(prospect);
    expect(verifiedFacts.length).toBeGreaterThanOrEqual(5);

    const opportunities = buildEvidenceBasedOpportunities(prospect, DEFAULT_RIVO_KNOWLEDGE_BASE);
    expect(opportunities.length).toBeGreaterThan(0);

    const score = computeExplainableLeadScore(prospect, opportunities);
    expect(score.totalScore).toBeGreaterThanOrEqual(70);
    expect(score.totalScore).toBeLessThanOrEqual(100);
    expect(score.confidenceScore).toBeGreaterThanOrEqual(60);
  });

  it('flags hallucinated claims that assert physical visits or guaranteed revenue increases', () => {
    const prospect = makeMockProspect();
    const cleanValidation = validatePitchAgainstHallucinations(
      'Gentile Osteria Bella Milano, abbiamo visto il vostro sito a Milano e crediamo che il Carrello Condiviso del Tavolo RIVO possa supportare lo staff.',
      prospect
    );
    expect(cleanValidation.valid).toBe(true);

    const hallucinatedValidation = validatePitchAgainstHallucinations(
      'Ieri sera sono passato da Osteria Bella Milano e garantiamo un aumento del 300% del fatturato.',
      prospect
    );
    expect(hallucinatedValidation.valid).toBe(false);
    expect(hallucinatedValidation.notes.length).toBeGreaterThanOrEqual(2);
  });
});

describe('RIVO OUTREACH — OutreachComplianceService Gate', () => {
  it('blocks sends when prospect is in "non_contattare" or suppressed', () => {
    const prospect = makeMockProspect({ commercial_status: 'non_contattare' });
    const res = OutreachComplianceService.evaluateSendEligibility({
      prospect,
      channel: 'email',
      deliveryMode: 'approval',
      isHumanApproved: true,
      permissions: [
        {
          id: 'perm-1',
          prospect_id: prospect.id,
          channel: 'email',
          permission_status: 'granted',
          legal_basis: 'documented_b2b_legitimate_interest',
          evidence_reference: 'Contatto pubblico aziendale',
          evidence_timestamp: new Date().toISOString(),
          scope: 'b2b',
          source: 'admin',
          withdrawn_at: null,
          created_at: new Date().toISOString(),
        },
      ],
      suppressions: [],
    });
    expect(res.allowed).toBe(false);
    expect(res.status).toBe('blocked_suppression');
  });

  it('blocks Instagram outbound DMs when no active user-initiated conversation window exists', () => {
    const prospect = makeMockProspect({ commercial_status: 'contatto_consentito' });
    const res = OutreachComplianceService.evaluateSendEligibility({
      prospect,
      channel: 'instagram',
      deliveryMode: 'approval',
      isHumanApproved: true,
      permissions: [
        {
          id: 'perm-ig',
          prospect_id: prospect.id,
          channel: 'instagram',
          permission_status: 'granted',
          legal_basis: 'documented_b2b_legitimate_interest',
          evidence_reference: 'Profilo IG pubblico',
          evidence_timestamp: new Date().toISOString(),
          scope: 'b2b',
          source: 'admin',
          withdrawn_at: null,
          created_at: new Date().toISOString(),
        },
      ],
      suppressions: [],
      openConversationStatus: null,
    });
    expect(res.allowed).toBe(false);
    expect(res.status).toBe('blocked_channel_policy');
  });

  it('allows Approval Mode email send when B2B legitimate interest is registered and Admin approved', () => {
    const prospect = makeMockProspect({ commercial_status: 'contatto_consentito' });
    const res = OutreachComplianceService.evaluateSendEligibility({
      prospect,
      channel: 'email',
      deliveryMode: 'approval',
      isHumanApproved: true,
      permissions: [
        {
          id: 'perm-em',
          prospect_id: prospect.id,
          channel: 'email',
          permission_status: 'granted',
          legal_basis: 'documented_b2b_legitimate_interest',
          evidence_reference: 'Email info@ pubblicata sul sito aziendale',
          evidence_timestamp: new Date().toISOString(),
          scope: 'b2b',
          source: 'admin',
          withdrawn_at: null,
          created_at: new Date().toISOString(),
        },
      ],
      suppressions: [],
    });
    expect(res.allowed).toBe(true);
    expect(res.status).toBe('allowed');
  });
});

describe('RIVO OUTREACH — Campania & Maps Discovery Engine', () => {
  it('exposes Campania geo presets anchored on Napoli with wide-range radius options', () => {
    const napoliCentro = CAMPANIA_GEO_PRESETS.find((p) => p.id === 'napoli_centro');
    const campaniaWide = CAMPANIA_GEO_PRESETS.find((p) => p.id === 'campania_wide');

    expect(napoliCentro).toBeDefined();
    expect(napoliCentro?.query).toBe('Napoli');
    expect(campaniaWide).toBeDefined();
    expect(campaniaWide?.radiusKm).toBeGreaterThanOrEqual(75);
  });

  it('resolves Napoli and Salerno coordinates synchronously with Campania region metadata', async () => {
    const napoli = await resolveLocationCoordinates('Napoli');
    const salerno = await resolveLocationCoordinates('Salerno');

    expect(napoli).not.toBeNull();
    expect(napoli?.region).toBe('Campania');
    expect(napoli?.lat).toBeCloseTo(40.8518, 2);
    expect(napoli?.lon).toBeCloseTo(14.2681, 2);

    expect(salerno).not.toBeNull();
    expect(salerno?.region).toBe('Campania');
    expect(salerno?.province).toBe('SA');
  });

  it('computes accurate Haversine distance between Napoli and Salerno', () => {
    const km = computeDistanceKm(40.8518, 14.2681, 40.6824, 14.7681);
    expect(km).toBeGreaterThan(43);
    expect(km).toBeLessThan(50);
  });

  it('builds encoded Google Maps search URLs from business details', () => {
    const url = buildGoogleMapsUrl('Pizzeria Da Michele', 'Via Cesare Sersale 1', 'Napoli');
    expect(url).toContain('https://www.google.com/maps/search/');
    expect(url).toContain(encodeURIComponent('Pizzeria Da Michele'));
    expect(url).toContain('Napoli');
  });
});
