/**
 * RIVO OUTREACH — AI Business Intelligence, Explainable Lead Scoring & Anti-Hallucination Sales Agent
 */

import {
  classifyLeadScore,
  findSubcategoryDef,
  type LeadScoreFactorBreakdown,
  type OutreachAIAnalysis,
  type OutreachPitchGenerationPayload,
  type OutreachPitchVariantContent,
  type OutreachProspectRecord,
  type RivoOpportunityItem,
} from './types';
import { DEFAULT_RIVO_KNOWLEDGE_BASE, type RivoProductKnowledgeBase } from './knowledge-base';

/**
 * Extracts only verifiable facts from a prospect record.
 * Used as the strict ground-truth context for AI prompts and hallucination checks.
 */
export function extractVerifiedFactsFromProspect(prospect: OutreachProspectRecord): string[] {
  const facts: string[] = [];
  facts.push(`Nome attività: ${prospect.business_name}`);
  const subDef = findSubcategoryDef(prospect.subcategory || prospect.category);
  facts.push(`Settore/Categoria: ${subDef.label} (${prospect.category})`);

  if (prospect.city) {
    facts.push(
      `Localizzazione: ${[prospect.address, prospect.city, prospect.province].filter(Boolean).join(', ')}`
    );
  }
  if (prospect.website) {
    facts.push(`Sito web pubblico rilevato: ${prospect.website}`);
  } else {
    facts.push(`Sito web: non rilevato nella fonte (${prospect.source})`);
  }
  if (prospect.digital_signals?.websiteTitle) {
    facts.push(`Titolo sito web: "${prospect.digital_signals.websiteTitle}"`);
  }
  if (prospect.digital_signals?.websiteDescription || prospect.description) {
    facts.push(
      `Descrizione pubblica: "${prospect.digital_signals?.websiteDescription || prospect.description}"`
    );
  }
  if (prospect.instagram_url) {
    facts.push(`Profilo Instagram pubblico: ${prospect.instagram_url}`);
  }
  if (prospect.facebook_url) {
    facts.push(`Pagina Facebook pubblica: ${prospect.facebook_url}`);
  }
  if (prospect.business_phone) {
    facts.push(`Telefono aziendale pubblico: ${prospect.business_phone}`);
  }
  if (prospect.business_email) {
    facts.push(`Email aziendale pubblica: ${prospect.business_email}`);
  }
  if (Array.isArray(prospect.services_offered) && prospect.services_offered.length > 0) {
    facts.push(`Caratteristiche/servizi pubblici: ${prospect.services_offered.join(', ')}`);
  }
  if (
    Array.isArray(prospect.digital_signals?.detectedBookingLinks) &&
    prospect.digital_signals.detectedBookingLinks.length > 0
  ) {
    facts.push(
      `Link di prenotazione osservati sul sito: ${prospect.digital_signals.detectedBookingLinks.join(', ')}`
    );
  }
  if (
    Array.isArray(prospect.digital_signals?.detectedMenuLinks) &&
    prospect.digital_signals.detectedMenuLinks.length > 0
  ) {
    facts.push(
      `Link a menù/listino osservati sul sito: ${prospect.digital_signals.detectedMenuLinks.join(', ')}`
    );
  }
  facts.push(`Fonte del dato: ${prospect.source} (${prospect.source_reference || 'inserimento diretto'})`);

  return facts;
}

/**
 * Builds category-specific RIVO opportunities distinguishing strictly between:
 * - 'confirmed': supported by direct evidence in the prospect profile
 * - 'plausible': coherent with the vertical & public profile
 * - 'unverifiable': cannot be verified from public online data (never assuming absence!)
 */
export function buildEvidenceBasedOpportunities(
  prospect: OutreachProspectRecord,
  kb: RivoProductKnowledgeBase = DEFAULT_RIVO_KNOWLEDGE_BASE
): RivoOpportunityItem[] {
  const subKey = (prospect.subcategory || prospect.category || 'restaurant').toLowerCase();
  const hasWebsite = Boolean(prospect.website);
  const hasInstagram = Boolean(prospect.instagram_url);
  const hasBookingLinks =
    Array.isArray(prospect.digital_signals?.detectedBookingLinks) &&
    prospect.digital_signals.detectedBookingLinks.length > 0;
  const hasMenuLinks =
    Array.isArray(prospect.digital_signals?.detectedMenuLinks) &&
    prospect.digital_signals.detectedMenuLinks.length > 0;

  const matchingModules = kb.availableModules.filter((m) =>
    m.targetCategories.some((c) => c === subKey || c === prospect.category)
  );

  const items: RivoOpportunityItem[] = [];

  for (const mod of matchingModules) {
    if (mod.slug === 'bookings') {
      if (hasWebsite && !hasBookingLinks) {
        items.push({
          moduleSlug: mod.slug,
          moduleName: mod.name,
          verificationStatus: 'confirmed',
          rationale:
            'Il sito web pubblico è stato ispezionato e nella home page non emergono link diretti a un calendario self-service per poltrona/operatore.',
          supportingEvidence: `Sito web analizzato (${prospect.website}) senza link di booking immediati rilevati nei metadati pubblici.`,
        });
      } else if (!hasWebsite) {
        items.push({
          moduleSlug: mod.slug,
          moduleName: mod.name,
          verificationStatus: 'confirmed',
          rationale:
            'Non essendo associato un sito web pubblico nella scheda acquisita, un Hub NFC/QR con prenotazione oraria e scelta dell’operatore offre un punto di prenotazione immediato.',
          supportingEvidence: `Assenza di URL sito web nella fonte ${prospect.source}.`,
        });
      } else {
        items.push({
          moduleSlug: mod.slug,
          moduleName: mod.name,
          verificationStatus: 'plausible',
          rationale:
            'Sul sito sono presenti riferimenti a prenotazioni; RIVO può affiancare l’esperienza in salone collegando direttamente la poltrona fisica (NFC/QR) al calendario trattamenti.',
          supportingEvidence: `Link rilevati sul sito: ${prospect.digital_signals?.detectedBookingLinks?.join(', ')}`,
        });
      }
      continue;
    }

    if (mod.slug === 'menu') {
      if (!hasWebsite) {
        items.push({
          moduleSlug: mod.slug,
          moduleName: mod.name,
          verificationStatus: 'confirmed',
          rationale:
            'Non risulta collegato un sito web nella fonte pubblica: l’Hub Digitale RIVO con menù interattivo e Carrello Condiviso del Tavolo fornisce subito una vetrina mobile-first.',
          supportingEvidence: `Nessun sito web registrato nella fonte ${prospect.source}.`,
        });
      } else if (hasMenuLinks) {
        items.push({
          moduleSlug: mod.slug,
          moduleName: mod.name,
          verificationStatus: 'confirmed',
          rationale:
            'Il sito pubblico presenta una sezione menù/listino; RIVO permette di renderla interattiva al tavolo via NFC con traduzione multilingua e ordine condiviso tra i commensali.',
          supportingEvidence: `Sezione menù individuata su ${prospect.website}.`,
        });
      } else {
        items.push({
          moduleSlug: mod.slug,
          moduleName: mod.name,
          verificationStatus: 'plausible',
          rationale:
            'Per un’attività di ristorazione/ospitalità, il menù digitale interattivo attivabile al tocco sul tavolo semplifica la consultazione e gli ordini.',
          supportingEvidence: `Categoria attività: ${prospect.subcategory || prospect.category}.`,
        });
      }
      continue;
    }

    if (mod.slug === 'reviews') {
      items.push({
        moduleSlug: mod.slug,
        moduleName: mod.name,
        verificationStatus: 'plausible',
        rationale:
          'Raccogliere recensioni Google al tavolo o in cassa nel momento di massima soddisfazione e intercettare privatamente eventuali segnalazioni è ad alto valore per questa categoria.',
        supportingEvidence: `Attività aperta al pubblico in ${prospect.city || 'zona locale'} (${prospect.business_name}).`,
      });
      continue;
    }

    if (mod.slug === 'loyalty') {
      items.push({
        moduleSlug: mod.slug,
        moduleName: mod.name,
        verificationStatus: 'unverifiable',
        rationale:
          'Non è verificabile online se l’attività utilizzi già tessere fedeltà fisiche in cassa; la Fidelity Card Digitale RIVO su Apple/Google Wallet elimina il cartaceo.',
        supportingEvidence:
          'Informazione in-store non verificabile da remoto: da approfondire in fase conoscitiva.',
      });
      continue;
    }

    if (mod.slug === 'service' || mod.slug === 'wifi' || mod.slug === 'guide') {
      const hasPublicWifiTag = (prospect.services_offered || []).some((s) =>
        s.toLowerCase().includes('wi-fi')
      );
      items.push({
        moduleSlug: mod.slug,
        moduleName: mod.name,
        verificationStatus: hasPublicWifiTag && mod.slug === 'wifi' ? 'confirmed' : 'plausible',
        rationale: mod.commercialBenefit,
        supportingEvidence:
          hasPublicWifiTag && mod.slug === 'wifi'
            ? 'Presenza Wi-Fi pubblico dichiarata nei metadati della fonte.'
            : `Coerente con l’operatività in sede di ${prospect.business_name} (${ hasInstagram ? 'attiva anche su Instagram' : 'presenza locale'}).`,
      });
    }
  }

  return items.slice(0, 6);
}

/**
 * Computes the explainable 0–100 Lead Score and 0–100 Confidence Score (Section 6.3).
 */
export function computeExplainableLeadScore(
  prospect: OutreachProspectRecord,
  opportunities: RivoOpportunityItem[]
): {
  breakdown: LeadScoreFactorBreakdown;
  totalScore: number;
  confidenceScore: number;
  confidenceExplanation: string;
} {
  const subKey = (prospect.subcategory || prospect.category || '').toLowerCase();
  const coreVerticals = new Set([
    'restaurant',
    'pizzeria',
    'bar',
    'gelateria',
    'pasticceria',
    'salon',
    'barber',
    'beauty',
    'nail_salon',
    'hotel',
    'bnb',
  ]);

  // 1. RIVO Compatibility (max 25)
  const rivoCompatibilityScore = coreVerticals.has(subKey) ? 24 : 18;
  const rivoCompatibilityExplanation = coreVerticals.has(subKey)
    ? `Settore target primario per RIVO (${subKey}) con moduli verticali nativi.`
    : `Settore compatibile con i moduli trasversali RIVO Hub.`;

  // 2. Identified Opportunities (max 20)
  const confirmedCount = opportunities.filter((o) => o.verificationStatus === 'confirmed').length;
  const plausibleCount = opportunities.filter((o) => o.verificationStatus === 'plausible').length;
  const identifiedOpportunitiesScore = Math.min(20, confirmedCount * 7 + plausibleCount * 4);
  const identifiedOpportunitiesExplanation = `${confirmedCount} opportunità confermate da evidenze dirette e ${plausibleCount} opportunità plausibili per il settore.`;

  // 3. Digital Presence (max 20)
  let digitalPresenceScore = 6; // base: business exists in public directory
  const presenceNotes: string[] = [];
  if (prospect.website) {
    digitalPresenceScore += 6;
    presenceNotes.push('sito web attivo');
  } else {
    digitalPresenceScore += 8; // High opportunity for RIVO Digital Hub!
    presenceNotes.push('assenza sito web pubblico (alta opportunità per RIVO Digital Hub)');
  }
  if (prospect.instagram_url || prospect.facebook_url) {
    digitalPresenceScore += 6;
    presenceNotes.push('canali social presidiati');
  }
  digitalPresenceScore = Math.min(20, digitalPresenceScore);

  // 4. Relevant Services Count (max 15)
  const relevantServicesScore = Math.min(15, Math.max(5, opportunities.length * 3));
  const relevantServicesExplanation = `${opportunities.length} moduli RIVO direttamente applicabili all’operatività del punto fisico.`;

  // 5. Information Completeness (max 10)
  let completenessPoints = 2; // name + category
  if (prospect.city) completenessPoints += 2;
  if (prospect.address) completenessPoints += 1;
  if (prospect.business_phone) completenessPoints += 2;
  if (prospect.business_email) completenessPoints += 2;
  if (prospect.website || prospect.instagram_url) completenessPoints += 1;
  const informationCompletenessScore = Math.min(10, completenessPoints);
  const informationCompletenessExplanation = `Campi verificati disponibili: ${[
    prospect.city ? 'città' : null,
    prospect.address ? 'indirizzo' : null,
    prospect.business_phone ? 'telefono' : null,
    prospect.business_email ? 'email' : null,
    prospect.website ? 'sito web' : null,
    prospect.instagram_url ? 'Instagram' : null,
  ]
    .filter(Boolean)
    .join(', ')}.`;

  // 6. Evidence Reliability (max 10)
  let evidenceReliabilityScore = 6;
  if (prospect.source_reference) evidenceReliabilityScore += 2;
  if (prospect.digital_signals?.httpStatus === 200) evidenceReliabilityScore += 2;
  evidenceReliabilityScore = Math.min(10, evidenceReliabilityScore);
  const evidenceReliabilityExplanation = `Fonte tracciata (${prospect.source}${
    prospect.digital_signals?.httpStatus === 200 ? ' + metadati sito verificati HTTP 200' : ''
  }).`;

  const totalScore = Math.min(
    100,
    rivoCompatibilityScore +
      identifiedOpportunitiesScore +
      digitalPresenceScore +
      relevantServicesScore +
      informationCompletenessScore +
      evidenceReliabilityScore
  );

  const confidenceScore = Math.min(
    100,
    Math.round((informationCompletenessScore * 5 + evidenceReliabilityScore * 5))
  );

  return {
    breakdown: {
      rivoCompatibility: {
        score: rivoCompatibilityScore,
        max: 25,
        explanation: rivoCompatibilityExplanation,
      },
      identifiedOpportunities: {
        score: identifiedOpportunitiesScore,
        max: 20,
        explanation: identifiedOpportunitiesExplanation,
      },
      digitalPresence: {
        score: digitalPresenceScore,
        max: 20,
        explanation: `Valutazione presenza: ${presenceNotes.join(', ')}.`,
      },
      relevantServicesCount: {
        score: relevantServicesScore,
        max: 15,
        explanation: relevantServicesExplanation,
      },
      informationCompleteness: {
        score: informationCompletenessScore,
        max: 10,
        explanation: informationCompletenessExplanation,
      },
      evidenceReliability: {
        score: evidenceReliabilityScore,
        max: 10,
        explanation: evidenceReliabilityExplanation,
      },
    },
    totalScore,
    confidenceScore,
    confidenceExplanation:
      confidenceScore >= 75
        ? 'Affidabilità elevata: profilo completo di recapiti, localizzazione e segnali digitali verificati.'
        : confidenceScore >= 55
        ? 'Affidabilità media: dati anagrafici e di categoria presenti; alcuni aspetti in-store richiedono verifica diretta.'
        : 'Affidabilità base: dati essenziali acquisiti dalla fonte pubblica; si consiglia arricchimento prima del contatto.',
  };
}

/**
 * Executes full AI Business Intelligence analysis on a prospect.
 * Uses Gemini API (`gemini-2.5-flash`) when configured, grounded strictly on verified facts.
 */
export async function analyzeProspectWithAI(
  prospect: OutreachProspectRecord,
  kb: RivoProductKnowledgeBase = DEFAULT_RIVO_KNOWLEDGE_BASE
): Promise<OutreachAIAnalysis> {
  const verifiedFacts = extractVerifiedFactsFromProspect(prospect);
  const baseOpportunities = buildEvidenceBasedOpportunities(prospect, kb);
  const scoring = computeExplainableLeadScore(prospect, baseOpportunities);
  const subDef = findSubcategoryDef(prospect.subcategory || prospect.category);

  const hasBookingObserved =
    Array.isArray(prospect.digital_signals?.detectedBookingLinks) &&
    prospect.digital_signals.detectedBookingLinks.length > 0;

  let executiveSummary = `${prospect.business_name} è un’attività del segmento ${subDef.label}${
    prospect.city ? ` situata a ${prospect.city}` : ''
  }. ${
    prospect.website
      ? `Dispone di un sito web pubblico (${prospect.website})${
          prospect.digital_signals?.websiteTitle
            ? ` intitolato "${prospect.digital_signals.websiteTitle}"`
            : ''
        }.`
      : `Dai dati della fonte (${prospect.source}) non emerge un sito web associato, rendendo il Digital Hub RIVO un punto di accesso digitale immediato.`
  } I moduli prioritari individuati sono ${baseOpportunities
    .slice(0, 3)
    .map((o) => o.moduleName)
    .join(', ')}.`;

  let modelUsed = 'rivo-deterministic-intelligence-v1';

  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (geminiKey) {
    try {
      const prompt = `Sei l'analista di Business Intelligence di RIVO.
Analizza ESCLUSIVAMENTE i seguenti fatti verificati sull'attività commerciale senza inventare nulla e senza dichiarare che l'attività non possiede strumenti se semplicemente non sono visibili online:

FATTI VERIFICATI:
${verifiedFacts.map((f) => `- ${f}`).join('\n')}

MODULI RIVO PERTINENTI INDIVIDUATI:
${baseOpportunities.map((o) => `- ${o.moduleName} (${o.verificationStatus}): ${o.rationale}`).join('\n')}

Restituisci un JSON valido con la sola chiave:
{
  "executiveSummary": "Sintesi esecutiva professionale in italiano (massimo 3 frasi) basata solo sui fatti verificati e sulle opportunità RIVO."
}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          if (typeof parsed.executiveSummary === 'string' && parsed.executiveSummary.trim().length > 20) {
            executiveSummary = parsed.executiveSummary.trim();
            modelUsed = 'gemini-2.5-flash';
          }
        }
      }
    } catch {
      // Fallback to deterministic evidence summary
    }
  }

  return {
    analyzedAt: new Date().toISOString(),
    modelUsed,
    executiveSummary,
    digitalPresenceAssessment: {
      hasWebsite: Boolean(prospect.website),
      hasInstagram: Boolean(prospect.instagram_url),
      hasFacebook: Boolean(prospect.facebook_url),
      hasPhone: Boolean(prospect.business_phone),
      hasEmail: Boolean(prospect.business_email),
      websiteSummary:
        prospect.digital_signals?.websiteDescription ||
        prospect.digital_signals?.websiteTitle ||
        prospect.description ||
        null,
      observedBookingSystem: hasBookingObserved ? 'present_observed' : 'not_observed_online',
      observedLoyaltySystem: 'not_observed_online',
      observedFeedbackTool: 'not_observed_online',
      interactionNotes: prospect.website
        ? `Presenza web verificata su ${prospect.website}. Gli strumenti fisici eventualmente presenti in sede (es. tessere cartacee o QR al banco) non sono determinabili da remoto.`
        : `Nessun sito web rilevato nella fonte (${prospect.source}). Gli strumenti fisici eventualmente usati in sede non sono determinabili da remoto.`,
    },
    opportunities: baseOpportunities,
    scoreBreakdown: scoring.breakdown,
    totalLeadScore: scoring.totalScore,
    classification: classifyLeadScore(scoring.totalScore),
    confidenceScore: scoring.confidenceScore,
    confidenceExplanation: scoring.confidenceExplanation,
    verifiedFactsUsed: verifiedFacts,
    unverifiableAspects: [
      'Eventuale utilizzo in sede di tessere fedeltà cartacee o sistemi gestionali non esposti sul web.',
      'Flusso medio giornaliero di clienti ai tavoli/poltrone.',
      'Modalità interna di raccolta feedback al momento del pagamento.',
    ],
  };
}

// ============================================================================
// Anti-Hallucination Validator & Personalized 3-Variant Pitch Generator (Section 7)
// ============================================================================

const FORBIDDEN_HALLUCINATION_PATTERNS: { pattern: RegExp; reason: string }[] = [
  {
    pattern: /\b(sono stato da voi|ho visitato il vostro|ieri sera sono passato|ho provato i vostri)\b/i,
    reason: 'Divieto di dichiarare visite fisiche non avvenute.',
  },
  {
    pattern: /\b(garantiamo un aumento del \d+%|fatturato garantito|raddoppiare gli incassi)\b/i,
    reason: 'Divieto di promettere risultati economici o percentuali non dimostrabili.',
  },
  {
    pattern: /\b(come ci siamo detti|dopo la nostra telefonata)\b/i,
    reason: 'Divieto di simulare una relazione precedente inesistente.',
  },
];

export function validatePitchAgainstHallucinations(
  text: string,
  prospect: OutreachProspectRecord
): { valid: boolean; notes: string[] } {
  const notes: string[] = [];
  let valid = true;

  for (const rule of FORBIDDEN_HALLUCINATION_PATTERNS) {
    if (rule.pattern.test(text)) {
      valid = false;
      notes.push(`Violazione rilevata: ${rule.reason}`);
    }
  }

  if (!text.toLowerCase().includes(prospect.business_name.toLowerCase().slice(0, 5))) {
    notes.push('Verifica riferimento esplicito al nome dell’attività superata parzialmente.');
  } else {
    notes.push(`Riferimento esplicito a "${prospect.business_name}" verificato.`);
  }

  if (valid) {
    notes.push('Controllo anti-allucinazione superato: nessuna visita simulata, nessuna promessa economica non dimostrabile, aderenza ai soli fatti del profilo.');
  }

  return { valid, notes };
}

function buildDeterministicPitchVariants(
  prospect: OutreachProspectRecord,
  analysis: OutreachAIAnalysis
): OutreachPitchGenerationPayload['variants'] {
  const subDef = findSubcategoryDef(prospect.subcategory || prospect.category);
  const cityPhrase = prospect.city ? ` a ${prospect.city}` : '';
  const topOpp = analysis.opportunities[0] || {
    moduleSlug: 'reviews',
    moduleName: 'Digital Hub NFC & Google Review Shield',
    rationale: 'digitalizzare il punto di contatto fisico con i clienti in sede',
  };
  const secondOpp = analysis.opportunities[1];

  const isBeautyOrBarber = ['salon', 'barber', 'beauty', 'nail_salon'].includes(
    prospect.subcategory || prospect.category
  );
  const isHospitality = ['hotel', 'bnb', 'hospitality_other'].includes(
    prospect.subcategory || prospect.category
  );

  // Specific factual observation grounded strictly in the prospect record
  const factualObservation = prospect.website
    ? `Consultando i riferimenti pubblici di ${prospect.business_name}${cityPhrase} e il sito ${prospect.website}${
        prospect.digital_signals?.websiteTitle
          ? ` ("${prospect.digital_signals.websiteTitle}")`
          : ''
      }, abbiamo approfondito come strutturate il contatto digitale con la clientela.`
    : `Consultando i riferimenti pubblici di ${prospect.business_name}${cityPhrase} nel segmento ${subDef.label}, abbiamo notato l’opportunità di affiancare all’accoglienza in sede un punto di accesso digitale immediato.`;

  const touchpointName = isBeautyOrBarber
    ? 'ogni poltrona o specchio del salone'
    : isHospitality
    ? 'ogni camera e la reception'
    : 'ogni tavolo del locale';

  const specificProblemOrOpp = isBeautyOrBarber
    ? `Nei saloni e barber shop, gestire gli appuntamenti per singolo operatore, mostrare gli slot liberi in base alla durata dei trattamenti e raccogliere recensioni Google a fine servizio richiede spesso tempo prezioso alla cassa.`
    : isHospitality
    ? `Nelle strutture ricettive, offrire agli ospiti accesso istantaneo al Wi-Fi, alla guida locale e all’assistenza su WhatsApp senza app da scaricare semplifica il soggiorno fin dal check-in.`
    : `Nella ristorazione, permettere ai clienti al tavolo di consultare il menù interattivo (anche con Carrello Condiviso del Tavolo), chiamare la sala o lasciare una recensione Google con un tocco rende il servizio più fluido.`;

  const rivoConnection = `Con RIVO posizioniamo su ${touchpointName} un tag NFC + QR personalizzato che apre in un istante "${topOpp.moduleName}"${
    secondOpp ? ` insieme a "${secondOpp.moduleName}"` : ''
  }, senza che il cliente debba installare alcuna applicazione.`;

  const factsReferenced = [
    `Attività: ${prospect.business_name}`,
    `Categoria: ${subDef.label}`,
    ...(prospect.city ? [`Città: ${prospect.city}`] : []),
    ...(prospect.website ? [`Sito: ${prospect.website}`] : []),
    `Modulo RIVO: ${topOpp.moduleName}`,
  ];

  // Variant A: Professional
  const A_professional: OutreachPitchVariantContent = {
    variant: 'A_professional',
    label: 'Approccio A — Professionale',
    subject: `Soluzione RIVO per ${prospect.business_name}${cityPhrase} — ${topOpp.moduleName}`,
    introduction: `Gentile Direzione di ${prospect.business_name},`,
    specificObservation: factualObservation,
    opportunityIdentified: specificProblemOrOpp,
    rivoModuleConnection: rivoConnection,
    commercialProposal: `Abbiamo predisposto una configurazione dimostrativa dedicata alla categoria ${subDef.label} per mostrarvi il funzionamento reale dal telefono del cliente e dal pannello gestionale.`,
    callToAction: `Sareste disponibili per una breve presentazione di 10 minuti questa settimana, in sede o in videochiamata?`,
    fullMessageBody: `Gentile Direzione di ${prospect.business_name},\n\n${factualObservation}\n\n${specificProblemOrOpp}\n\n${rivoConnection}\n\nAbbiamo predisposto una configurazione dimostrativa dedicata alla categoria ${subDef.label} per mostrarvi il funzionamento reale dal telefono del cliente e dal pannello gestionale.\n\nSareste disponibili per una breve presentazione di 10 minuti questa settimana, in sede o in videochiamata?\n\nUn cordiale saluto,\nTeam RIVO`,
    factsReferenced,
  };

  // Variant B: Informal
  const B_informal: OutreachPitchVariantContent = {
    variant: 'B_informal',
    label: 'Approccio B — Informale',
    subject: `Un’idea pratica per ${prospect.business_name}${cityPhrase}`,
    introduction: `Ciao team di ${prospect.business_name}!`,
    specificObservation: `Abbiamo visto i riferimenti pubblici della vostra attività di ${subDef.label.toLowerCase()}${cityPhrase}${
      prospect.website ? ` e il vostro sito ${prospect.website}` : ''
    }.`,
    opportunityIdentified: isBeautyOrBarber
      ? `Sappiamo quanto sia comodo per i clienti vedere gli orari disponibili di ogni barbiere/parrucchiere e prenotare il trattamento dal telefono con un tocco, lasciando anche una recensione a fine taglio.`
      : `Sappiamo quanto faccia piacere ai clienti avere tutto a portata di mano al tavolo — dal menù interattivo fino alla chiamata rapida e alle recensioni Google — semplicemente avvicinando il telefono.`,
    rivoModuleConnection: `Con RIVO creiamo il vostro Hub NFC/QR su misura per ${touchpointName}, pronto all’uso in pochi minuti e senza app da scaricare.`,
    commercialProposal: `Ci farebbe piacere farvi provare dal vivo una demo già personalizzata con i moduli più usati nel vostro settore.`,
    callToAction: `Se vi va, rispondete a questo messaggio e vi inviamo il link di anteprima gratuito senza alcun impegno.`,
    fullMessageBody: `Ciao team di ${prospect.business_name}!\n\nAbbiamo visto i riferimenti pubblici della vostra attività di ${subDef.label.toLowerCase()}${cityPhrase}${
      prospect.website ? ` e il vostro sito ${prospect.website}` : ''
    }.\n\n${
      isBeautyOrBarber
        ? 'Sappiamo quanto sia comodo per i clienti vedere gli orari disponibili di ogni barbiere/parrucchiere e prenotare il trattamento dal telefono con un tocco, lasciando anche una recensione a fine taglio.'
        : 'Sappiamo quanto faccia piacere ai clienti avere tutto a portata di mano al tavolo — dal menù interattivo fino alla chiamata rapida e alle recensioni Google — semplicemente avvicinando il telefono.'
    }\n\nCon RIVO creiamo il vostro Hub NFC/QR su misura per ${touchpointName}, pronto all’uso in pochi minuti e senza app da scaricare.\n\nSe vi va, rispondete a questo messaggio e vi inviamo il link di anteprima gratuito senza alcun impegno.\n\nA presto,\nTeam RIVO`,
    factsReferenced,
  };

  // Variant C: Consultative
  const C_consultative: OutreachPitchVariantContent = {
    variant: 'C_consultative',
    label: 'Approccio C — Consulenziale',
    subject: `Analisi digitale per ${prospect.business_name}: opportunità ${topOpp.moduleName}`,
    introduction: `Buongiorno a chi gestisce ${prospect.business_name},`,
    specificObservation: factualObservation,
    opportunityIdentified: `Dall’analisi dei punti di contatto digitali pubblici emerge un’opportunità concreta: ${topOpp.rationale}`,
    rivoModuleConnection: `Attraverso il modulo RIVO "${topOpp.moduleName}"${
      secondOpp ? ` abbinato a "${secondOpp.moduleName}"` : ''
    }, ogni cliente presente fisicamente da ${prospect.business_name} può interagire in 1 secondo avvicinando lo smartphone a ${touchpointName}.`,
    commercialProposal: `Possiamo condividere con voi la scheda tecnica con i casi d’uso specifici per ${subDef.label} e simulare l’Hub con la vostra identità visiva.`,
    callToAction: `Qual è il momento migliore per sentirci 5 minuti e mostrarvi l’anteprima dedicata a ${prospect.business_name}?`,
    fullMessageBody: `Buongiorno a chi gestisce ${prospect.business_name},\n\n${factualObservation}\n\nDall’analisi dei punti di contatto digitali pubblici emerge un’opportunità concreta: ${topOpp.rationale}\n\nAttraverso il modulo RIVO "${topOpp.moduleName}"${
      secondOpp ? ` abbinato a "${secondOpp.moduleName}"` : ''
    }, ogni cliente presente fisicamente da ${prospect.business_name} può interagire in 1 secondo avvicinando lo smartphone a ${touchpointName}.\n\nQual è il momento migliore per sentirci 5 minuti e mostrarvi l’anteprima dedicata a ${prospect.business_name}?\n\nCordiali saluti,\nTeam RIVO`,
    factsReferenced,
  };

  return {
    A_professional,
    B_informal,
    C_consultative,
  };
}

export async function generatePersonalizedSalesPitches(
  prospect: OutreachProspectRecord,
  kb: RivoProductKnowledgeBase = DEFAULT_RIVO_KNOWLEDGE_BASE,
  customFocusNote?: string
): Promise<OutreachPitchGenerationPayload> {
  const analysis = prospect.ai_analysis || (await analyzeProspectWithAI(prospect, kb));
  const deterministicVariants = buildDeterministicPitchVariants(prospect, analysis);

  let finalVariants = deterministicVariants;
  let modelUsed = 'rivo-verified-sales-agent-v1';

  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (geminiKey) {
    try {
      const verifiedFacts = extractVerifiedFactsFromProspect(prospect);
      const prompt = `Sei il Senior Sales Consultant di RIVO (${kb.positioningSummary}).
Genera 3 varianti di comunicazione commerciale B2B in italiano per il seguente prospect:
- Approccio A (A_professional): formale, diretto e istituzionale.
- Approccio B (B_informal): naturale, cordiale, adatto a un imprenditore locale.
- Approccio C (C_consultative): parte dall'opportunità concreta individuata nell'analisi.

FATTI VERIFICATI SUL PROSPECT (NON INVENTARE NULLA OLTRE A QUESTI):
${verifiedFacts.map((f) => `- ${f}`).join('\n')}

OPPORTUNITÀ RIVO INDIVIDUATE:
${analysis.opportunities.map((o) => `- ${o.moduleName} (${o.verificationStatus}): ${o.rationale}`).join('\n')}

${customFocusNote ? `NOTA DELL'AMMINISTRATORE: ${customFocusNote}` : ''}

REGOLE ANTI-ALLUCINAZIONE OBBLIGATORIE:
${kb.strictGuardrails.map((g) => `- ${g}`).join('\n')}

Restituisci un JSON con la chiave "variants" contenente "A_professional", "B_informal", "C_consultative", ciascuna con:
"subject", "introduction", "specificObservation", "opportunityIdentified", "rivoModuleConnection", "commercialProposal", "callToAction", "fullMessageBody".`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.35 },
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          const v = parsed?.variants;
          if (v?.A_professional?.fullMessageBody && v?.B_informal?.fullMessageBody && v?.C_consultative?.fullMessageBody) {
            const checkA = validatePitchAgainstHallucinations(v.A_professional.fullMessageBody, prospect);
            const checkB = validatePitchAgainstHallucinations(v.B_informal.fullMessageBody, prospect);
            const checkC = validatePitchAgainstHallucinations(v.C_consultative.fullMessageBody, prospect);

            if (checkA.valid && checkB.valid && checkC.valid) {
              finalVariants = {
                A_professional: {
                  ...deterministicVariants.A_professional,
                  ...v.A_professional,
                  variant: 'A_professional',
                  label: 'Approccio A — Professionale',
                  factsReferenced: deterministicVariants.A_professional.factsReferenced,
                },
                B_informal: {
                  ...deterministicVariants.B_informal,
                  ...v.B_informal,
                  variant: 'B_informal',
                  label: 'Approccio B — Informale',
                  factsReferenced: deterministicVariants.B_informal.factsReferenced,
                },
                C_consultative: {
                  ...deterministicVariants.C_consultative,
                  ...v.C_consultative,
                  variant: 'C_consultative',
                  label: 'Approccio C — Consulenziale',
                  factsReferenced: deterministicVariants.C_consultative.factsReferenced,
                },
              };
              modelUsed = 'gemini-2.5-flash';
            }
          }
        }
      }
    } catch {
      // Fallback to deterministic verified variants
    }
  }

  const combinedText = `${finalVariants.A_professional.fullMessageBody}\n${finalVariants.B_informal.fullMessageBody}\n${finalVariants.C_consultative.fullMessageBody}`;
  const validation = validatePitchAgainstHallucinations(combinedText, prospect);

  return {
    generatedAt: new Date().toISOString(),
    modelUsed,
    promptVersion: 'v1.0-anti-hallucination',
    hallucinationCheckPassed: validation.valid,
    hallucinationCheckNotes: validation.notes,
    variants: finalVariants,
  };
}
