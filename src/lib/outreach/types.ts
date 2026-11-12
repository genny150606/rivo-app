/**
 * RIVO OUTREACH — Domain Types, Pipeline Definitions & Discovery Taxonomy
 */

export type OutreachCommercialStatus =
  | 'nuovo'
  | 'da_analizzare'
  | 'analizzato'
  | 'da_contattare'
  | 'contatto_consentito'
  | 'in_conversazione'
  | 'interessato'
  | 'appuntamento_fissato'
  | 'trattativa'
  | 'convertito_in_cliente'
  | 'non_interessato'
  | 'non_contattare';

export interface PipelineStageDefinition {
  id: OutreachCommercialStatus;
  label: string;
  shortLabel: string;
  description: string;
  order: number;
  isTerminal?: boolean;
  isPositive?: boolean;
}

export const OUTREACH_PIPELINE_STAGES: PipelineStageDefinition[] = [
  {
    id: 'nuovo',
    label: '1. Nuovo',
    shortLabel: 'Nuovo',
    description: 'Attività appena acquisita da una fonte autorizzata.',
    order: 1,
  },
  {
    id: 'da_analizzare',
    label: '2. Da analizzare',
    shortLabel: 'Da analizzare',
    description: 'In coda per l’analisi AI della presenza digitale.',
    order: 2,
  },
  {
    id: 'analizzato',
    label: '3. Analizzato',
    shortLabel: 'Analizzato',
    description: 'Profilo AI, opportunità RIVO e Lead Score completati.',
    order: 3,
  },
  {
    id: 'da_contattare',
    label: '4. Da contattare',
    shortLabel: 'Da contattare',
    description: 'Qualificato, in attesa di verifica permessi o contatto.',
    order: 4,
  },
  {
    id: 'contatto_consentito',
    label: '5. Contatto consentito',
    shortLabel: 'Contatto consentito',
    description: 'Base giuridica verificata per il canale selezionato.',
    order: 5,
  },
  {
    id: 'in_conversazione',
    label: '6. In conversazione',
    shortLabel: 'In conversazione',
    description: 'Primo contatto avviato o dialogo attivo col referente.',
    order: 6,
  },
  {
    id: 'interessato',
    label: '7. Interessato',
    shortLabel: 'Interessato',
    description: 'Il prospect ha manifestato interesse per i moduli RIVO.',
    order: 7,
    isPositive: true,
  },
  {
    id: 'appuntamento_fissato',
    label: '8. Appuntamento fissato',
    shortLabel: 'Appuntamento',
    description: 'Demo o incontro commerciale pianificato.',
    order: 8,
    isPositive: true,
  },
  {
    id: 'trattativa',
    label: '9. Trattativa',
    shortLabel: 'Trattativa',
    description: 'Proposta economica e configurazione dispositivi in valutazione.',
    order: 9,
    isPositive: true,
  },
  {
    id: 'convertito_in_cliente',
    label: '10. Convertito in cliente',
    shortLabel: 'Cliente RIVO',
    description: 'Convertito in organizzazione RIVO attiva.',
    order: 10,
    isTerminal: true,
    isPositive: true,
  },
  {
    id: 'non_interessato',
    label: '11. Non interessato',
    shortLabel: 'Non interessato',
    description: 'Il prospect ha declinato la proposta.',
    order: 11,
    isTerminal: true,
  },
  {
    id: 'non_contattare',
    label: '12. Non contattare',
    shortLabel: 'Non contattare',
    description: 'Bloccato (opt-out o soppressione permanente).',
    order: 12,
    isTerminal: true,
  },
];

export type LeadScoreTier = 'low' | 'moderate' | 'high' | 'priority';

export interface LeadScoreClassification {
  tier: LeadScoreTier;
  label: string;
  rangeLabel: string;
}

export function classifyLeadScore(score: number): LeadScoreClassification {
  const s = Math.max(0, Math.min(100, Math.round(score || 0)));
  if (s >= 80) {
    return { tier: 'priority', label: 'Priorità commerciale', rangeLabel: '80–100' };
  }
  if (s >= 60) {
    return { tier: 'high', label: 'Alto potenziale', rangeLabel: '60–79' };
  }
  if (s >= 40) {
    return { tier: 'moderate', label: 'Potenziale moderato', rangeLabel: '40–59' };
  }
  return { tier: 'low', label: 'Basso potenziale', rangeLabel: '0–39' };
}

// ============================================================================
// Discovery Categories & Subcategories (Extensible Taxonomy)
// ============================================================================

export interface OutreachSubcategoryDef {
  id: string;
  label: string;
  rivoCategorySlug: string; // Maps to RIVO BusinessCategory when converting to client
  osmQueries: { key: string; value: string }[];
  defaultRivoModules: string[];
}

export interface OutreachMacroCategoryDef {
  id: string;
  label: string;
  subcategories: OutreachSubcategoryDef[];
}

export const OUTREACH_DISCOVERY_CATEGORIES: OutreachMacroCategoryDef[] = [
  {
    id: 'food_beverage',
    label: 'Food & Beverage',
    subcategories: [
      {
        id: 'restaurant',
        label: 'Ristoranti',
        rivoCategorySlug: 'restaurant',
        osmQueries: [{ key: 'amenity', value: 'restaurant' }],
        defaultRivoModules: ['menu', 'service', 'reviews', 'wifi', 'loyalty', 'wheel', 'sommelier', 'analytics'],
      },
      {
        id: 'pizzeria',
        label: 'Pizzerie',
        rivoCategorySlug: 'pizzeria',
        osmQueries: [
          { key: 'amenity', value: 'restaurant' },
          { key: 'cuisine', value: 'pizza' },
        ],
        defaultRivoModules: ['menu', 'service', 'reviews', 'loyalty', 'wheel', 'wifi'],
      },
      {
        id: 'bar',
        label: 'Bar & Cocktail Bar',
        rivoCategorySlug: 'bar',
        osmQueries: [
          { key: 'amenity', value: 'bar' },
          { key: 'amenity', value: 'cafe' },
        ],
        defaultRivoModules: ['menu', 'service', 'reviews', 'loyalty', 'wheel', 'wifi'],
      },
      {
        id: 'gelateria',
        label: 'Gelaterie',
        rivoCategorySlug: 'bar',
        osmQueries: [{ key: 'amenity', value: 'ice_cream' }],
        defaultRivoModules: ['menu', 'reviews', 'loyalty', 'wheel', 'instagram'],
      },
      {
        id: 'pasticceria',
        label: 'Pasticcerie & Bakery',
        rivoCategorySlug: 'bar',
        osmQueries: [
          { key: 'shop', value: 'pastry' },
          { key: 'shop', value: 'Confectionery' },
          { key: 'shop', value: 'bakery' },
        ],
        defaultRivoModules: ['menu', 'reviews', 'loyalty', 'whatsapp', 'instagram'],
      },
    ],
  },
  {
    id: 'beauty_personal_care',
    label: 'Beauty & Personal Care',
    subcategories: [
      {
        id: 'salon',
        label: 'Parrucchieri & Hair Salon',
        rivoCategorySlug: 'salon',
        osmQueries: [{ key: 'shop', value: 'hairdresser' }],
        defaultRivoModules: ['bookings', 'reviews', 'loyalty', 'whatsapp', 'instagram', 'custom_cta'],
      },
      {
        id: 'barber',
        label: 'Barbieri & Barber Shop',
        rivoCategorySlug: 'barber',
        osmQueries: [{ key: 'shop', value: 'hairdresser' }],
        defaultRivoModules: ['bookings', 'reviews', 'loyalty', 'whatsapp', 'instagram'],
      },
      {
        id: 'beauty',
        label: 'Centri Estetici & SPA',
        rivoCategorySlug: 'beauty',
        osmQueries: [{ key: 'shop', value: 'beauty' }],
        defaultRivoModules: ['bookings', 'reviews', 'loyalty', 'whatsapp', 'instagram', 'custom_cta'],
      },
      {
        id: 'nail_salon',
        label: 'Nail Salon & Onicotecnica',
        rivoCategorySlug: 'beauty',
        osmQueries: [{ key: 'shop', value: 'beauty' }],
        defaultRivoModules: ['bookings', 'reviews', 'loyalty', 'instagram', 'whatsapp'],
      },
    ],
  },
  {
    id: 'hospitality',
    label: 'Hospitality',
    subcategories: [
      {
        id: 'hotel',
        label: 'Hotel',
        rivoCategorySlug: 'hotel',
        osmQueries: [{ key: 'tourism', value: 'hotel' }],
        defaultRivoModules: ['wifi', 'guide', 'service', 'reviews', 'whatsapp', 'menu'],
      },
      {
        id: 'bnb',
        label: 'B&B & Affittacamere',
        rivoCategorySlug: 'bnb',
        osmQueries: [
          { key: 'tourism', value: 'guest_house' },
          { key: 'tourism', value: 'apartment' },
        ],
        defaultRivoModules: ['wifi', 'guide', 'reviews', 'whatsapp'],
      },
      {
        id: 'hospitality_other',
        label: 'Strutture Ricettive & Resort',
        rivoCategorySlug: 'hotel',
        osmQueries: [
          { key: 'tourism', value: 'resort' },
          { key: 'tourism', value: 'hostel' },
        ],
        defaultRivoModules: ['wifi', 'guide', 'service', 'reviews', 'whatsapp'],
      },
    ],
  },
];

export function findSubcategoryDef(subcategoryOrCategory: string): OutreachSubcategoryDef {
  const q = (subcategoryOrCategory || '').toLowerCase();
  for (const macro of OUTREACH_DISCOVERY_CATEGORIES) {
    for (const sub of macro.subcategories) {
      if (sub.id === q || sub.rivoCategorySlug === q || sub.label.toLowerCase() === q) {
        return sub;
      }
    }
  }
  return OUTREACH_DISCOVERY_CATEGORIES[0].subcategories[0];
}

// ============================================================================
// AI Business Intelligence & Opportunity Structures
// ============================================================================

export type OpportunityVerificationStatus = 'confirmed' | 'plausible' | 'unverifiable';

export interface RivoOpportunityItem {
  moduleSlug: string;
  moduleName: string;
  verificationStatus: OpportunityVerificationStatus;
  rationale: string;
  supportingEvidence: string;
}

export interface LeadScoreFactorBreakdown {
  rivoCompatibility: { score: number; max: 25; explanation: string };
  identifiedOpportunities: { score: number; max: 20; explanation: string };
  digitalPresence: { score: number; max: 20; explanation: string };
  relevantServicesCount: { score: number; max: 15; explanation: string };
  informationCompleteness: { score: number; max: 10; explanation: string };
  evidenceReliability: { score: number; max: 10; explanation: string };
}

export interface OutreachAIAnalysis {
  analyzedAt: string;
  modelUsed: string;
  executiveSummary: string;
  digitalPresenceAssessment: {
    hasWebsite: boolean;
    hasInstagram: boolean;
    hasFacebook: boolean;
    hasPhone: boolean;
    hasEmail: boolean;
    websiteSummary: string | null;
    observedBookingSystem: 'present_observed' | 'not_observed_online';
    observedLoyaltySystem: 'present_observed' | 'not_observed_online';
    observedFeedbackTool: 'present_observed' | 'not_observed_online';
    interactionNotes: string;
  };
  opportunities: RivoOpportunityItem[];
  scoreBreakdown: LeadScoreFactorBreakdown;
  totalLeadScore: number;
  classification: LeadScoreClassification;
  confidenceScore: number;
  confidenceExplanation: string;
  verifiedFactsUsed: string[];
  unverifiableAspects: string[];
}

export type PitchApproachVariant = 'A_professional' | 'B_informal' | 'C_consultative';

export interface OutreachPitchVariantContent {
  variant: PitchApproachVariant;
  label: string;
  subject: string;
  introduction: string;
  specificObservation: string;
  opportunityIdentified: string;
  rivoModuleConnection: string;
  commercialProposal: string;
  callToAction: string;
  fullMessageBody: string;
  factsReferenced: string[];
}

export interface OutreachPitchGenerationPayload {
  generatedAt: string;
  modelUsed: string;
  promptVersion: string;
  hallucinationCheckPassed: boolean;
  hallucinationCheckNotes: string[];
  variants: {
    A_professional: OutreachPitchVariantContent;
    B_informal: OutreachPitchVariantContent;
    C_consultative: OutreachPitchVariantContent;
  };
}

// ============================================================================
// Prospect & Database Record Interfaces
// ============================================================================

export interface PublicDigitalSignals {
  websiteTitle?: string | null;
  websiteDescription?: string | null;
  detectedBookingLinks?: string[];
  detectedMenuLinks?: string[];
  detectedSocialLinks?: string[];
  httpStatus?: number | null;
  inspectedAt?: string | null;
}

export interface OutreachProspectRecord {
  id: string;
  business_name: string;
  normalized_name: string;
  category: string;
  subcategory: string | null;
  city: string | null;
  province: string | null;
  region: string | null;
  address: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  website: string | null;
  website_domain: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  business_phone: string | null;
  business_email: string | null;
  description: string | null;
  services_offered: string[];
  digital_signals: PublicDigitalSignals;
  source: string;
  source_reference: string | null;
  source_acquired_at: string;
  lead_score: number;
  confidence_score: number;
  ai_analysis: OutreachAIAnalysis | null;
  commercial_status: OutreachCommercialStatus;
  admin_notes: string | null;
  organization_id: string | null;
  merged_into_id: string | null;
  retention_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export type OutreachChannel = 'email' | 'whatsapp' | 'instagram' | 'manual';
export type OutreachDeliveryMode = 'draft' | 'approval' | 'automated' | 'manual';

export type LegalBasisType =
  | 'explicit_consent'
  | 'user_initiated_inbound'
  | 'pre_contractual_request'
  | 'documented_b2b_legitimate_interest'
  | 'manual_1to1_inquiry';

export interface OutreachContactPermissionRecord {
  id: string;
  prospect_id: string;
  channel: OutreachChannel;
  permission_status: 'granted' | 'pending_verification' | 'denied' | 'withdrawn';
  legal_basis: LegalBasisType;
  evidence_reference: string;
  evidence_timestamp: string;
  scope: string;
  source: string;
  withdrawn_at: string | null;
  created_at: string;
}
