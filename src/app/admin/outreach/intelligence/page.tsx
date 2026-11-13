'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  Send,
  Layers,
  CheckCircle2,
  ExternalLink,
  Link2,
} from 'lucide-react';
import { buildProspectDemoUrl } from '@/lib/outreach/preview';
import type {
  OutreachProspectRecord,
  OutreachPitchGenerationPayload,
  PitchApproachVariant,
} from '@/lib/outreach/types';

interface GenerationRecord {
  id: string;
  prospect_id: string;
  generation_type: 'business_intelligence' | 'sales_pitch';
  generated_content: OutreachPitchGenerationPayload | Record<string, unknown>;
  approved: boolean;
  approved_variant?: string | null;
  created_at: string;
}

function OutreachIntelligenceContent() {
  const searchParams = useSearchParams();
  const initialProspectId = searchParams.get('prospectId') || '';

  const [prospects, setProspects] = useState<OutreachProspectRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string>(initialProspectId);
  const [selectedProspect, setSelectedProspect] = useState<OutreachProspectRecord | null>(null);
  const [latestPitchGen, setLatestPitchGen] = useState<GenerationRecord | null>(null);
  const [activeVariant, setActiveVariant] = useState<PitchApproachVariant>('A_professional');

  const [customFocusNote, setCustomFocusNote] = useState(
    'Proporre una breve demo di 10 minuti dei moduli RIVO pertinenti per l’attività'
  );
  const [analyzing, setAnalyzing] = useState(false);
  const [batchRunning, setBatchRunning] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Editable draft for the active pitch
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');

  const loadProspectsList = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/outreach/prospects?pageSize=100&sortBy=lead_score', {
        cache: 'no-store',
      });
      const json = await res.json();
      if (res.ok && json.prospects) {
        setProspects(json.prospects);
        if (!selectedId && json.prospects.length > 0) {
          setSelectedId(json.prospects[0].id);
        }
      }
    } catch {
      // ignore
    }
  }, [selectedId]);

  const loadSelectedProspectIntel = useCallback(
    async (id: string) => {
      if (!id) return;
      try {
        const res = await fetch(`/api/admin/outreach/prospects?id=${id}`, { cache: 'no-store' });
        const json = await res.json();
        if (res.ok && json.prospect) {
          setSelectedProspect(json.prospect);
          const gens: GenerationRecord[] = json.generations || [];
          const salesGen =
            gens.find((g) => g.generation_type === 'sales_pitch') || null;
          setLatestPitchGen(salesGen);

          const payload = salesGen?.generated_content as
            | OutreachPitchGenerationPayload
            | undefined;
          const variantObj = payload?.variants?.[activeVariant];
          if (variantObj) {
            setEditSubject(variantObj.subject || '');
            setEditBody(variantObj.fullMessageBody || '');
          } else {
            setEditSubject('');
            setEditBody('');
          }
        }
      } catch {
        // ignore
      }
    },
    [activeVariant]
  );

  useEffect(() => {
    loadProspectsList();
  }, [loadProspectsList]);

  useEffect(() => {
    if (selectedId) {
      loadSelectedProspectIntel(selectedId);
    }
  }, [selectedId, loadSelectedProspectIntel]);

  const pitchPayload = latestPitchGen?.generated_content as
    | OutreachPitchGenerationPayload
    | undefined;
  const currentVariantContent = pitchPayload?.variants?.[activeVariant] || null;
  const prospectDemoUrl = selectedProspect
    ? buildProspectDemoUrl(selectedProspect.business_name, selectedProspect.id)
    : null;

  const handleVariantSwitch = (variant: PitchApproachVariant) => {
    setActiveVariant(variant);
    const vObj = pitchPayload?.variants?.[variant];
    if (vObj) {
      setEditSubject(vObj.subject || '');
      setEditBody(vObj.fullMessageBody || '');
    }
  };

  const handleAnalyzeAndGenerate = async () => {
    if (!selectedId) return;
    setAnalyzing(true);
    setFeedback(null);
    try {
      const analyzeRes = await fetch('/api/admin/outreach/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          prospect_id: selectedId,
        }),
      });
      const analyzeJson = await analyzeRes.json();
      if (!analyzeRes.ok) throw new Error(analyzeJson.error || 'Errore analisi AI');

      const pitchRes = await fetch('/api/admin/outreach/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_pitch',
          prospect_id: selectedId,
          custom_focus_note: customFocusNote,
        }),
      });
      const pitchJson = await pitchRes.json();
      if (!pitchRes.ok) throw new Error(pitchJson.error || 'Errore generazione proposte');

      setFeedback(
        `Analisi completata: Score ${analyzeJson.analysis.totalLeadScore}/100 (${analyzeJson.analysis.classification.label}) — 3 varianti generate e validate contro allucinazioni.`
      );
      await loadSelectedProspectIntel(selectedId);
      await loadProspectsList();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Errore analisi AI');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleBatchAnalyze = async () => {
    const unanalyzedIds = prospects
      .filter((p) => !p.ai_analysis)
      .slice(0, 10)
      .map((p) => p.id);
    const targetIds =
      unanalyzedIds.length > 0 ? unanalyzedIds : prospects.slice(0, 5).map((p) => p.id);
    if (targetIds.length === 0) return;

    setBatchRunning(true);
    setFeedback(`Avvio job di analisi AI su ${targetIds.length} prospect...`);
    try {
      const res = await fetch('/api/admin/outreach/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          prospect_ids: targetIds,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Errore batch AI');
      setFeedback(`Job completato (${json.job?.status || 'completed'}). Ricarico i punteggi...`);
      await loadProspectsList();
      if (selectedId) await loadSelectedProspectIntel(selectedId);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Errore batch AI');
    } finally {
      setBatchRunning(false);
    }
  };

  const handleApproveAndSavePitch = async () => {
    if (!selectedId || !editBody.trim()) return;
    try {
      const res = await fetch('/api/admin/outreach/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve_pitch',
          generation_id: latestPitchGen?.id || '',
          prospect_id: selectedId,
          variant: activeVariant,
          subject: editSubject,
          content: editBody,
          channel: 'email',
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Errore approvazione');
      setFeedback('Proposta commerciale salvata e approvata per l’invio.');
      await loadSelectedProspectIntel(selectedId);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Errore salvataggio proposta');
    }
  };

  const handleCopyPitch = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInsertDemoLink = () => {
    if (!selectedProspect || !prospectDemoUrl || editBody.includes('/preview/')) return;
    const snippet = `Ho preparato anche un'anteprima interattiva RIVO dedicata a ${selectedProspect.business_name} (senza login né impegno): ${prospectDemoUrl}`;
    setEditBody((prev) => (prev.trim() ? `${prev.trimEnd()}\n\n${snippet}` : snippet));
  };

  const breakdown = selectedProspect?.ai_analysis?.scoreBreakdown;

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-[#27272A] pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#BFFF00]" />
            <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#BFFF00]">
              RIVO OUTREACH — AI BUSINESS INTELLIGENCE & SALES AGENT
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-[-0.02em] text-[#FAFAFA]">
            Motore AI di Qualificazione & Proposte Personalizzate
          </h1>
          <p className="text-sm text-[#A1A1AA] mt-1">
            Valutazione oggettiva basata su fatti verificati, Lead Score spiegabile a 6 fattori e generazione anti-allucinazione in 3 approcci (A/B/C).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={batchRunning || prospects.length === 0}
            onClick={handleBatchAnalyze}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#121214] border border-[#27272A] hover:border-[#BFFF00] text-xs font-medium text-[#FAFAFA] disabled:opacity-50"
          >
            <Layers className="w-3.5 h-3.5 text-[#BFFF00]" />
            {batchRunning ? 'Batch AI in corso...' : 'Analizza Batch Prospect'}
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-[#121214] border border-[#BFFF00]/40 text-xs text-[#FAFAFA] flex items-center justify-between">
          <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-[#A1A1AA] hover:text-[#FAFAFA]"
          >
            Chiudi
          </button>
        </div>
      )}

      {/* Selector & Trigger Bar */}
      <div className="bg-[#121214] border border-[#27272A] rounded-xl p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
        <div className="lg:col-span-4">
          <label className="block text-[11px] font-mono uppercase text-[#A1A1AA] mb-1.5">
            Seleziona Attività Commerciale
          </label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full h-10 px-3.5 rounded-lg bg-[#0D0D10] border border-[#27272A] text-xs text-[#FAFAFA] focus:outline-none focus:border-[#BFFF00]"
          >
            {prospects.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.lead_score}/100] {p.business_name} ({p.category} — {p.city || 'N/D'})
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-5">
          <label className="block text-[11px] font-mono uppercase text-[#A1A1AA] mb-1.5">
            Obiettivo Commerciale / Focus della Proposta
          </label>
          <input
            type="text"
            value={customFocusNote}
            onChange={(e) => setCustomFocusNote(e.target.value)}
            className="w-full h-10 px-3.5 rounded-lg bg-[#0D0D10] border border-[#27272A] text-xs text-[#FAFAFA] focus:outline-none focus:border-[#BFFF00]"
          />
        </div>

        <div className="lg:col-span-3">
          <button
            type="button"
            disabled={analyzing || !selectedId}
            onClick={handleAnalyzeAndGenerate}
            className="w-full h-10 inline-flex items-center justify-center gap-2 px-4 rounded-lg bg-[#BFFF00] hover:bg-[#A8E600] text-[#09090B] text-xs font-bold uppercase tracking-wider disabled:opacity-50"
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Elaborazione AI...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Analizza & Genera A/B/C
              </>
            )}
          </button>
        </div>
      </div>

      {selectedProspect && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Explainable Lead Score & Opportunities */}
          <div className="lg:col-span-5 space-y-6">
            {/* 6-Factor Lead Scoring Card */}
            <div className="bg-[#121214] border border-[#27272A] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
                <div>
                  <span className="text-[11px] font-mono uppercase text-[#A1A1AA]">
                    LEAD SCORING SPIEGABILE (SEZ. 7 PRD)
                  </span>
                  <h2 className="text-base font-bold text-[#FAFAFA] mt-0.5">
                    {selectedProspect.business_name}
                  </h2>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold font-mono text-[#BFFF00]">
                    {selectedProspect.lead_score}/100
                  </div>
                  <div className="text-[11px] font-mono text-[#A1A1AA]">
                    Confidenza Dati: {selectedProspect.confidence_score}%
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                {[
                  {
                    label: 'Compatibilità Categoria con RIVO',
                    val: breakdown?.rivoCompatibility?.score ?? 0,
                    max: 25,
                    explanation: breakdown?.rivoCompatibility?.explanation,
                  },
                  {
                    label: 'Opportunità Commerciali Identificate',
                    val: breakdown?.identifiedOpportunities?.score ?? 0,
                    max: 20,
                    explanation: breakdown?.identifiedOpportunities?.explanation,
                  },
                  {
                    label: 'Qualità Presenza Digitale',
                    val: breakdown?.digitalPresence?.score ?? 0,
                    max: 20,
                    explanation: breakdown?.digitalPresence?.explanation,
                  },
                  {
                    label: 'Servizi Rilevanti per RIVO',
                    val: breakdown?.relevantServicesCount?.score ?? 0,
                    max: 15,
                    explanation: breakdown?.relevantServicesCount?.explanation,
                  },
                  {
                    label: 'Completezza Dati di Contatto',
                    val: breakdown?.informationCompleteness?.score ?? 0,
                    max: 10,
                    explanation: breakdown?.informationCompleteness?.explanation,
                  },
                  {
                    label: 'Affidabilità Evidenze Raccolte',
                    val: breakdown?.evidenceReliability?.score ?? 0,
                    max: 10,
                    explanation: breakdown?.evidenceReliability?.explanation,
                  },
                ].map((factor) => {
                  const pct = Math.min(100, Math.round((factor.val / factor.max) * 100));
                  return (
                    <div key={factor.label} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#A1A1AA]">{factor.label}</span>
                        <span className="font-mono text-[#FAFAFA]">
                          {factor.val}/{factor.max}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#18181B] rounded-full overflow-hidden">
                        <div className="h-full bg-[#BFFF00]" style={{ width: `${pct}%` }} />
                      </div>
                      {factor.explanation && (
                        <div className="text-[10px] text-[#71717A]">{factor.explanation}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Opportunities Classification */}
            <div className="bg-[#121214] border border-[#27272A] rounded-xl p-5 space-y-3">
              <div className="text-[11px] font-mono uppercase text-[#BFFF00]">
                Opportunità RIVO Rilevate (Confermate vs Plausibili vs Non Verificabili)
              </div>
              <p className="text-xs text-[#A1A1AA] leading-relaxed">
                {selectedProspect.ai_analysis?.executiveSummary ||
                  'Premi "Analizza & Genera A/B/C" per eseguire la valutazione.'}
              </p>

              <div className="space-y-2.5 pt-2">
                {(selectedProspect.ai_analysis?.opportunities || []).map((opp, idx) => (
                  <div
                    key={`${opp.moduleSlug}-${idx}`}
                    className="p-3 rounded-lg bg-[#0D0D10] border border-[#27272A] space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#FAFAFA]">
                        {opp.moduleName}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                          opp.verificationStatus === 'confirmed'
                            ? 'bg-[#BFFF00]/15 text-[#BFFF00]'
                            : opp.verificationStatus === 'plausible'
                            ? 'bg-[#3B82F6]/15 text-[#3B82F6]'
                            : 'bg-[#27272A] text-[#A1A1AA]'
                        }`}
                      >
                        {opp.verificationStatus === 'confirmed'
                          ? 'Confermata'
                          : opp.verificationStatus === 'plausible'
                          ? 'Plausibile'
                          : 'Non Verificabile'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#A1A1AA]">{opp.rationale}</p>
                    <div className="text-[10px] font-mono text-[#71717A]">
                      Evidenza: {opp.supportingEvidence}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: AI Personalized Sales Agent (Variants A, B, C) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[#121214] border border-[#27272A] rounded-xl p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#27272A] pb-4">
                <div>
                  <span className="text-[11px] font-mono uppercase text-[#BFFF00]">
                    AI PERSONALIZED SALES AGENT (SEZ. 8 PRD)
                  </span>
                  <h2 className="text-base font-bold text-[#FAFAFA] mt-0.5">
                    3 Approcci Commerciali su Misura
                  </h2>
                </div>

                <div className="flex items-center gap-1.5 bg-[#0D0D10] p-1 rounded-lg border border-[#27272A]">
                  {(
                    [
                      { code: 'A_professional', label: 'A — Professionale' },
                      { code: 'B_informal', label: 'B — Informale' },
                      { code: 'C_consultative', label: 'C — Consulenziale' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.code}
                      type="button"
                      onClick={() => handleVariantSwitch(tab.code)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        activeVariant === tab.code
                          ? 'bg-[#BFFF00] text-[#09090B] font-bold'
                          : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {selectedProspect && prospectDemoUrl && (
                <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-lg bg-[#0D0D10] border border-[#27272A]">
                  <div className="min-w-0 flex items-center gap-2">
                    <Link2 className="w-3.5 h-3.5 text-[#BFFF00] shrink-0" />
                    <span className="text-[11px] font-mono uppercase text-[#BFFF00] shrink-0">
                      Demo Interattiva Prospect
                    </span>
                    <span className="text-[11px] font-mono text-[#71717A] truncate max-w-[260px] hidden sm:inline">
                      {prospectDemoUrl}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={prospectDemoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#18181B] border border-[#27272A] hover:border-[#BFFF00] text-xs text-[#FAFAFA]"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#BFFF00]" />
                      Apri Anteprima
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopyPitch('demo-link', prospectDemoUrl)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#18181B] border border-[#27272A] hover:border-[#BFFF00] text-xs text-[#FAFAFA]"
                    >
                      {copiedId === 'demo-link' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#BFFF00]" />
                          Link Copiato
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copia Link Demo
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {!currentVariantContent ? (
                <div className="py-12 text-center text-xs text-[#71717A]">
                  Nessuna proposta ancora generata per questa attività. Clicca &ldquo;Analizza &amp; Genera A/B/C&rdquo; in alto.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Anti-Hallucination & Approval Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-[#0D0D10] border border-[#27272A]">
                    <div className="flex items-center gap-2 text-xs">
                      {pitchPayload?.hallucinationCheckPassed ? (
                        <>
                          <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
                          <span className="text-[#FAFAFA] font-medium">
                            Controllo Anti-Allucinazione Superato
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
                          <span className="text-[#F59E0B]">
                            Verifica consigliata:{' '}
                            {(pitchPayload?.hallucinationCheckNotes || []).join(', ')}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {latestPitchGen?.approved && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#BFFF00]/15 text-[#BFFF00] text-[11px] font-mono">
                          <CheckCircle2 className="w-3 h-3" />
                          APPROVATA
                        </span>
                      )}
                      {prospectDemoUrl && (
                        <button
                          type="button"
                          disabled={editBody.includes('/preview/')}
                          onClick={handleInsertDemoLink}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs transition-colors disabled:opacity-45 disabled:cursor-not-allowed ${
                            activeVariant === 'A_professional' && !editBody.includes('/preview/')
                              ? 'bg-[#BFFF00]/15 border-[#BFFF00] text-[#BFFF00] hover:bg-[#BFFF00] hover:text-[#09090B] font-semibold'
                              : 'bg-[#18181B] border-[#27272A] hover:border-[#BFFF00] text-[#FAFAFA]'
                          }`}
                        >
                          <Link2 className="w-3.5 h-3.5" />
                          Inserisci Link Demo
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyPitch(
                            latestPitchGen?.id || 'copy',
                            `${editSubject ? `Oggetto: ${editSubject}\n\n` : ''}${editBody}`
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#18181B] border border-[#27272A] hover:border-[#BFFF00] text-xs text-[#FAFAFA]"
                      >
                        {copiedId === (latestPitchGen?.id || 'copy') ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#BFFF00]" />
                            Copiato
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copia Testo
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Subject & Body Editor */}
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-[#A1A1AA] mb-1">
                      Oggetto Comunicazione
                    </label>
                    <input
                      type="text"
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-lg bg-[#0D0D10] border border-[#27272A] text-xs text-[#FAFAFA] focus:outline-none focus:border-[#BFFF00]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-[#A1A1AA] mb-1">
                      Corpo del Messaggio (Modificabile prima dell’approvazione)
                    </label>
                    <textarea
                      rows={9}
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      className="w-full p-3.5 rounded-lg bg-[#0D0D10] border border-[#27272A] text-xs text-[#FAFAFA] leading-relaxed focus:outline-none focus:border-[#BFFF00]"
                    />
                  </div>

                  {/* 6 Structural Sections Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2">
                    {[
                      {
                        label: '1. Apertura Personalizzata',
                        val: currentVariantContent.introduction,
                      },
                      {
                        label: '2. Osservazione Specifica',
                        val: currentVariantContent.specificObservation,
                      },
                      {
                        label: '3. Opportunità Identificata',
                        val: currentVariantContent.opportunityIdentified,
                      },
                      {
                        label: '4. Collegamento Modulo RIVO',
                        val: currentVariantContent.rivoModuleConnection,
                      },
                      {
                        label: '5. Proposta Commerciale Concreta',
                        val: currentVariantContent.commercialProposal,
                      },
                      {
                        label: '6. Call To Action Non Invasiva',
                        val: currentVariantContent.callToAction,
                      },
                    ].map((sec) => (
                      <div
                        key={sec.label}
                        className="p-2.5 rounded bg-[#0D0D10] border border-[#27272A] text-[11px]"
                      >
                        <div className="font-mono uppercase text-[#71717A]">{sec.label}</div>
                        <div className="text-[#A1A1AA] mt-0.5">{sec.val || '-'}</div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#27272A]">
                    <div className="text-[11px] text-[#71717A] font-mono">
                      Fatti verificati utilizzati:{' '}
                      {(currentVariantContent.factsReferenced || []).length}
                    </div>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={handleApproveAndSavePitch}
                        className="px-4 py-2 rounded-lg bg-[#18181B] border border-[#BFFF00] text-[#BFFF00] text-xs font-semibold hover:bg-[#BFFF00] hover:text-[#09090B] transition-colors"
                      >
                        Salva & Approva Proposta
                      </button>
                      <Link
                        href={`/admin/outreach/communications?prospectId=${selectedProspect.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#BFFF00] hover:bg-[#A8E600] text-[#09090B] text-xs font-bold"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Invia in Comunicazioni
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OutreachIntelligencePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#09090B] text-[#A1A1AA] p-8 font-mono text-xs">
          CARICAMENTO AI BUSINESS INTELLIGENCE...
        </div>
      }
    >
      <OutreachIntelligenceContent />
    </Suspense>
  );
}
