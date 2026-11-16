'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Cpu,
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
import {
  PageHeader,
  SurfaceCard,
  StatusBadge,
  EmptyState,
  SegmentedControl,
} from '@/components/ui';
import { InstagramIcon } from '@/components/brand-icons';
import { buildProspectDemoUrl } from '@/lib/outreach/preview';
import {
  buildInstagramDmDeepLink,
  extractInstagramHandle,
} from '@/lib/outreach/instagram';
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
  const [findingInstagram, setFindingInstagram] = useState(false);
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
  const selectedIgHandle = extractInstagramHandle(selectedProspect?.instagram_url);
  const selectedIgDmUrl = buildInstagramDmDeepLink(selectedProspect?.instagram_url);

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

  const handleFindInstagram = async () => {
    if (!selectedId) return;
    setFindingInstagram(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/outreach/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'find_instagram',
          prospect_id: selectedId,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Errore ricerca profilo Instagram');

      const updatedList = Array.isArray(json.updatedProspects)
        ? (json.updatedProspects as OutreachProspectRecord[])
        : [];
      const updatedProspect =
        updatedList.find((p) => p.id === selectedId) ||
        updatedList[0] ||
        (json.prospect as OutreachProspectRecord | undefined) ||
        null;
      const discoveredUrl =
        updatedProspect?.instagram_url ||
        json.instagramUrl ||
        json.instagram_url ||
        json.result?.instagramUrl ||
        null;
      const discoveredHandle =
        extractInstagramHandle(discoveredUrl) ||
        (typeof json.handle === 'string' ? json.handle.replace(/^@/, '') : null) ||
        (typeof json.result?.handle === 'string'
          ? json.result.handle.replace(/^@/, '')
          : null);

      if (updatedProspect) {
        setSelectedProspect(updatedProspect);
        setProspects((prev) =>
          prev.map((p) => (p.id === updatedProspect.id ? updatedProspect : p))
        );
      } else if (discoveredUrl) {
        setSelectedProspect((prev) =>
          prev && prev.id === selectedId ? { ...prev, instagram_url: discoveredUrl } : prev
        );
        setProspects((prev) =>
          prev.map((p) =>
            p.id === selectedId ? { ...p, instagram_url: discoveredUrl } : p
          )
        );
      }

      if (discoveredHandle) {
        setFeedback(`Trovato @${discoveredHandle}`);
      } else if (discoveredUrl) {
        setFeedback('Profilo Instagram pubblico trovato e salvato.');
      } else {
        setFeedback('Nessun profilo Instagram pubblico verificabile trovato');
      }
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Errore ricerca profilo Instagram');
    } finally {
      setFindingInstagram(false);
    }
  };

  const handleCopyDmAndOpenChat = () => {
    if (!selectedProspect?.instagram_url) return;
    const dmUrl =
      buildInstagramDmDeepLink(selectedProspect.instagram_url) ||
      selectedProspect.instagram_url;
    if (editBody.trim()) {
      navigator.clipboard.writeText(editBody);
      setCopiedId('ig-dm');
      setTimeout(() => setCopiedId(null), 2000);
    }
    window.open(dmUrl, '_blank', 'noopener,noreferrer');
    setFeedback('Testo DM copiato e chat Instagram aperta in una nuova scheda.');
  };

  const breakdown = selectedProspect?.ai_analysis?.scoreBreakdown;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="RIVO OUTREACH — AI BUSINESS INTELLIGENCE & SALES AGENT"
        title="Motore AI di Qualificazione & Proposte Personalizzate"
        description="Valutazione oggettiva basata su fatti verificati, Lead Score spiegabile a 6 fattori e generazione anti-allucinazione in 3 approcci (A/B/C)."
        actions={
          <button
            type="button"
            disabled={batchRunning || prospects.length === 0}
            onClick={handleBatchAnalyze}
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--rivo-volt)] text-xs font-medium text-[var(--text-primary)] disabled:opacity-50 transition-colors touch-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rivo-volt)]"
          >
            <Layers className="w-3.5 h-3.5 text-[var(--rivo-volt-text)]" />
            {batchRunning ? 'Batch AI in corso…' : 'Analizza Batch Prospect'}
          </button>
        }
      />

      {feedback && (
        <SurfaceCard padding="sm" className="border-[var(--rivo-volt-border)]">
          <div className="text-xs text-[var(--text-primary)] flex items-center justify-between gap-3">
            <span>{feedback}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium shrink-0 px-2 py-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rivo-volt)]"
            >
              Chiudi
            </button>
          </div>
        </SurfaceCard>
      )}

      {/* Selector & Trigger Bar */}
      <SurfaceCard padding="md">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
          <div className="lg:col-span-4">
            <label
              htmlFor="intel-prospect-select"
              className="block text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
            >
              Seleziona Attività Commerciale
            </label>
            <select
              id="intel-prospect-select"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full h-11 px-3.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--rivo-volt)]"
            >
              {prospects.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.lead_score}/100] {p.business_name} ({p.category} — {p.city || 'N/D'})
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-5">
            <label
              htmlFor="intel-focus-note"
              className="block text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
            >
              Obiettivo Commerciale / Focus della Proposta
            </label>
            <input
              id="intel-focus-note"
              type="text"
              value={customFocusNote}
              onChange={(e) => setCustomFocusNote(e.target.value)}
              className="w-full h-11 px-3.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--rivo-volt)]"
            />
          </div>

          <div className="lg:col-span-3">
            <button
              type="button"
              disabled={analyzing || !selectedId}
              onClick={handleAnalyzeAndGenerate}
              className="w-full h-11 inline-flex items-center justify-center gap-2 px-4 rounded-xl bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[var(--rivo-volt-ink)] text-xs font-bold uppercase tracking-wider disabled:opacity-50 transition-colors touch-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rivo-volt)]"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Elaborazione AI…
                </>
              ) : (
                <>
                  <Cpu className="w-4 h-4" />
                  Analizza &amp; Genera A/B/C
                </>
              )}
            </button>
          </div>
        </div>
      </SurfaceCard>

      {selectedProspect && (
        <div className="space-y-6">
          {/* Top Prospect Actions Strip */}
          <SurfaceCard padding="sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 text-xs min-w-0">
                <span className="font-semibold text-[var(--text-primary)]">
                  {selectedProspect.business_name}
                </span>
                <span className="text-[var(--text-muted)]">•</span>
                <span className="text-[var(--text-secondary)]">
                  {selectedProspect.city || 'Città N/D'} ({selectedProspect.subcategory || selectedProspect.category})
                </span>
                {selectedProspect.website && (
                  <a
                    href={selectedProspect.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--rivo-volt-text)] hover:border-[var(--rivo-volt-border)] text-[11px] transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {selectedProspect.website_domain || 'Sito Web'}
                  </a>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {selectedProspect.instagram_url ? (
                  <>
                    <a
                      href={selectedProspect.instagram_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--rivo-volt-border)] hover:border-[var(--rivo-volt)] text-xs font-medium text-[var(--rivo-volt-text)] transition-colors"
                    >
                      <InstagramIcon className="w-3.5 h-3.5" />
                      <span>@{selectedIgHandle || 'instagram'}</span>
                      <ExternalLink className="w-3 h-3 opacity-80" />
                    </a>
                    <Link
                      href={`/admin/outreach/communications?tab=instagram_dm&prospectId=${encodeURIComponent(
                        selectedProspect.id
                      )}`}
                      className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-xs font-medium text-[var(--text-primary)] transition-colors"
                    >
                      <Send className="w-3.5 h-3.5 text-[var(--rivo-volt-text)]" />
                      Apri in Coda DM
                    </Link>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={findingInstagram}
                    onClick={handleFindInstagram}
                    className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--rivo-volt-border)] hover:border-[var(--rivo-volt)] text-xs font-semibold text-[var(--rivo-volt-text)] transition-colors disabled:opacity-50"
                  >
                    {findingInstagram ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Ricerca Instagram AI…
                      </>
                    ) : (
                      <>
                        <InstagramIcon className="w-3.5 h-3.5" />
                        Trova Instagram con AI
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </SurfaceCard>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Explainable Lead Score & Opportunities */}
            <div className="lg:col-span-5 space-y-6">
              {/* 6-Factor Lead Scoring Card */}
              <SurfaceCard padding="md" className="space-y-4">
                <div className="flex items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
                  <div className="min-w-0">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                      LEAD SCORING SPIEGABILE (SEZ. 7 PRD)
                    </span>
                    <h2 className="font-display text-base font-bold text-[var(--text-primary)] mt-0.5 truncate">
                      {selectedProspect.business_name}
                    </h2>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-bold font-mono tabular-nums text-[var(--rivo-volt-text)]">
                      {selectedProspect.lead_score}/100
                    </div>
                    <div className="text-[11px] font-mono tabular-nums text-[var(--text-secondary)]">
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
                        <div className="flex justify-between text-[11px] gap-2">
                          <span className="text-[var(--text-secondary)]">{factor.label}</span>
                          <span className="font-mono tabular-nums text-[var(--text-primary)] shrink-0">
                            {factor.val}/{factor.max}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                          <div className="h-full bg-[var(--rivo-volt)]" style={{ width: `${pct}%` }} />
                        </div>
                        {factor.explanation && (
                          <div className="text-[10px] text-[var(--text-muted)]">{factor.explanation}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </SurfaceCard>

              {/* Opportunities Classification */}
              <SurfaceCard
                padding="md"
                className="space-y-3"
                header={{
                  eyebrow: 'Opportunità RIVO Rilevate',
                  title: 'Confermate vs Plausibili vs Non Verificabili',
                }}
              >
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {selectedProspect.ai_analysis?.executiveSummary ||
                    'Premi "Analizza & Genera A/B/C" per eseguire la valutazione.'}
                </p>

                <div className="space-y-2.5 pt-2">
                  {(selectedProspect.ai_analysis?.opportunities || []).map((opp, idx) => (
                    <div
                      key={`${opp.moduleSlug}-${idx}`}
                      className="p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[var(--text-primary)]">
                          {opp.moduleName}
                        </span>
                        <StatusBadge
                          tone={
                            opp.verificationStatus === 'confirmed'
                              ? 'volt'
                              : opp.verificationStatus === 'plausible'
                              ? 'telemetry'
                              : 'neutral'
                          }
                          size="sm"
                          shape="tag"
                        >
                          {opp.verificationStatus === 'confirmed'
                            ? 'Confermata'
                            : opp.verificationStatus === 'plausible'
                            ? 'Plausibile'
                            : 'Non Verificabile'}
                        </StatusBadge>
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)]">{opp.rationale}</p>
                      <div className="text-[10px] font-mono text-[var(--text-muted)]">
                        Evidenza: {opp.supportingEvidence}
                      </div>
                    </div>
                  ))}
                </div>
              </SurfaceCard>
            </div>

            {/* Right Column: AI Personalized Sales Agent (Variants A, B, C) */}
            <div className="lg:col-span-7 space-y-6">
              <SurfaceCard padding="lg" className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--rivo-volt-text)]">
                      AI PERSONALIZED SALES AGENT (SEZ. 8 PRD)
                    </span>
                    <h2 className="font-display text-base font-bold text-[var(--text-primary)] mt-0.5">
                      3 Approcci Commerciali su Misura
                    </h2>
                  </div>

                  <SegmentedControl<PitchApproachVariant>
                    ariaLabel="Variante approccio commerciale"
                    value={activeVariant}
                    onChange={handleVariantSwitch}
                    size="sm"
                    options={[
                      { value: 'A_professional', label: 'A — Professionale' },
                      { value: 'B_informal', label: 'B — Informale' },
                      { value: 'C_consultative', label: 'C — Consulenziale' },
                    ]}
                  />
                </div>

                {selectedProspect && prospectDemoUrl && (
                  <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                    <div className="min-w-0 flex items-center gap-2">
                      <Link2 className="w-3.5 h-3.5 text-[var(--rivo-volt-text)] shrink-0" />
                      <span className="text-[11px] font-mono uppercase text-[var(--rivo-volt-text)] shrink-0">
                        Demo Interattiva Prospect
                      </span>
                      <span className="text-[11px] font-mono text-[var(--text-muted)] truncate max-w-[260px] hidden sm:inline">
                        {prospectDemoUrl}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={prospectDemoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 min-h-[36px] px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--rivo-volt-border)] text-xs text-[var(--text-primary)]"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-[var(--rivo-volt-text)]" />
                        Apri Anteprima
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopyPitch('demo-link', prospectDemoUrl)}
                        className="inline-flex items-center gap-1.5 min-h-[36px] px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--rivo-volt-border)] text-xs text-[var(--text-primary)]"
                      >
                        {copiedId === 'demo-link' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[var(--rivo-volt-text)]" />
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
                  <EmptyState
                    compact
                    icon={Cpu}
                    title="Nessuna proposta generata"
                    description='Clicca "Analizza & Genera A/B/C" in alto per generare le 3 proposte personalizzate.'
                  />
                ) : (
                  <div className="space-y-4">
                    {/* Anti-Hallucination & Approval Banner */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                      <div className="flex items-center gap-2 text-xs">
                        {pitchPayload?.hallucinationCheckPassed ? (
                          <>
                            <ShieldCheck className="w-4 h-4 text-[var(--accent-operational-text)] shrink-0" />
                            <span className="text-[var(--text-primary)] font-medium">
                              Controllo Anti-Allucinazione Superato
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 text-[var(--accent-warning-text)] shrink-0" />
                            <span className="text-[var(--accent-warning-text)]">
                              Verifica consigliata:{' '}
                              {(pitchPayload?.hallucinationCheckNotes || []).join(', ')}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {latestPitchGen?.approved && (
                          <StatusBadge tone="volt" size="sm" shape="tag">
                            <CheckCircle2 className="w-3 h-3" />
                            APPROVATA
                          </StatusBadge>
                        )}
                        {prospectDemoUrl && (
                          <button
                            type="button"
                            disabled={editBody.includes('/preview/')}
                            onClick={handleInsertDemoLink}
                            className={`inline-flex items-center gap-1.5 min-h-[36px] px-2.5 py-1 rounded-lg border text-xs transition-colors disabled:opacity-45 disabled:cursor-not-allowed ${
                              activeVariant === 'A_professional' && !editBody.includes('/preview/')
                                ? 'bg-[var(--rivo-volt-bg)] border-[var(--rivo-volt-border)] text-[var(--rivo-volt-text)] hover:bg-[var(--rivo-volt)] hover:text-[var(--rivo-volt-ink)] font-semibold'
                                : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] hover:border-[var(--rivo-volt-border)] text-[var(--text-primary)]'
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
                          className="inline-flex items-center gap-1.5 min-h-[36px] px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--rivo-volt-border)] text-xs text-[var(--text-primary)]"
                        >
                          {copiedId === (latestPitchGen?.id || 'copy') ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[var(--rivo-volt-text)]" />
                              Copiato
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              Copia Testo
                            </>
                          )}
                        </button>
                        {selectedProspect.instagram_url && (
                          <>
                            <button
                              type="button"
                              onClick={handleCopyDmAndOpenChat}
                              title={
                                selectedIgDmUrl
                                  ? `Copia messaggio e apri ${selectedIgDmUrl}`
                                  : 'Copia messaggio e apri Instagram'
                              }
                              className="inline-flex items-center gap-1.5 min-h-[36px] px-2.5 py-1 rounded-lg bg-[var(--rivo-volt-bg)] border border-[var(--rivo-volt-border)] hover:border-[var(--rivo-volt)] text-xs font-medium text-[var(--rivo-volt-text)]"
                            >
                              {copiedId === 'ig-dm' ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  DM Copiato!
                                </>
                              ) : (
                                <>
                                  <InstagramIcon className="w-3.5 h-3.5" />
                                  Copia DM &amp; Apri Chat IG
                                </>
                              )}
                            </button>
                            <Link
                              href={`/admin/outreach/communications?tab=instagram_dm&prospectId=${encodeURIComponent(
                                selectedProspect.id
                              )}`}
                              className="inline-flex items-center gap-1.5 min-h-[36px] px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--rivo-volt-border)] text-xs text-[var(--text-primary)]"
                            >
                              <Send className="w-3.5 h-3.5 text-[var(--rivo-volt-text)]" />
                              Apri in Coda DM
                            </Link>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Subject & Body Editor */}
                    <div>
                      <label
                        htmlFor="intel-edit-subject"
                        className="block text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)] mb-1"
                      >
                        Oggetto Comunicazione
                      </label>
                      <input
                        id="intel-edit-subject"
                        type="text"
                        value={editSubject}
                        onChange={(e) => setEditSubject(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--rivo-volt)]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="intel-edit-body"
                        className="block text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)] mb-1"
                      >
                        Corpo del Messaggio (Modificabile prima dell’approvazione)
                      </label>
                      <textarea
                        id="intel-edit-body"
                        rows={9}
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        className="w-full p-3.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] leading-relaxed focus:outline-none focus:border-[var(--rivo-volt)]"
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
                          className="p-2.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[11px]"
                        >
                          <div className="font-mono uppercase text-[var(--text-muted)]">{sec.label}</div>
                          <div className="text-[var(--text-secondary)] mt-0.5">{sec.val || '-'}</div>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border-subtle)]">
                      <div className="text-[11px] text-[var(--text-muted)] font-mono tabular-nums">
                        Fatti verificati utilizzati:{' '}
                        {(currentVariantContent.factsReferenced || []).length}
                      </div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          onClick={handleApproveAndSavePitch}
                          className="min-h-[44px] px-4 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--rivo-volt-border)] text-[var(--rivo-volt-text)] text-xs font-semibold hover:bg-[var(--rivo-volt)] hover:text-[var(--rivo-volt-ink)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rivo-volt)]"
                        >
                          Salva &amp; Approva Proposta
                        </button>
                        <Link
                          href={`/admin/outreach/communications?prospectId=${selectedProspect.id}`}
                          className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[var(--rivo-volt-ink)] text-xs font-bold touch-press"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Invia in Comunicazioni
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </SurfaceCard>
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
        <div className="py-12 font-mono text-xs text-[var(--text-secondary)]">
          CARICAMENTO AI BUSINESS INTELLIGENCE…
        </div>
      }
    >
      <OutreachIntelligenceContent />
    </Suspense>
  );
}
