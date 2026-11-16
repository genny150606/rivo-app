'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  XCircle,
  Plus,
  RefreshCw,
  Target,
  Megaphone,
  X,
} from 'lucide-react';
import { OUTREACH_DISCOVERY_CATEGORIES } from '@/lib/outreach/types';
import { DEFAULT_RIVO_KNOWLEDGE_BASE } from '@/lib/outreach/knowledge-base';
import { PageHeader, SurfaceCard, StatusBadge, EmptyState } from '@/components/ui';
import { cn } from '@/lib/cn';

interface CampaignRecord {
  id: string;
  name: string;
  category: string;
  location: string;
  configuration: {
    subcategory?: string;
    radiusKm?: number;
    maxProspects?: number;
    minLeadScore?: number;
    promotedModules?: string[];
    campaignGoal?: string;
    preferredVariant?: 'A_professional' | 'B_informal' | 'C_consultative';
    channel?: string;
    executionMode?: 'draft' | 'approval' | 'automated';
  } | null;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'cancelled';
  metrics?: {
    discovered?: number;
    analyzed?: number;
    qualified?: number;
    inPipeline?: number;
  };
  created_at: string;
}

const INPUT_CLASS =
  'w-full min-h-[44px] px-3.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--rivo-volt)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]';

export default function OutreachCampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    targetCategory: 'food_beverage',
    targetSubcategory: 'restaurant',
    targetLocation: 'Napoli',
    radiusKm: 35,
    maxProspects: 30,
    minLeadScore: 60,
    promotedModules: ['menu', 'service', 'reviews'],
    campaignGoal: 'Ottenere una demo di 10 minuti sul Carrello Condiviso e Hub NFC RIVO',
    preferredVariant: 'A_professional' as 'A_professional' | 'B_informal' | 'C_consultative',
    channel: 'email' as 'email' | 'whatsapp' | 'instagram' | 'manual',
    executionMode: 'approval' as 'draft' | 'approval' | 'automated',
  });

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/outreach/campaigns', { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && json.campaigns) {
        setCampaigns(json.campaigns);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const toggleModule = (moduleSlug: string) => {
    setForm((prev) => ({
      ...prev,
      promotedModules: prev.promotedModules.includes(moduleSlug)
        ? prev.promotedModules.filter((m) => m !== moduleSlug)
        : [...prev.promotedModules, moduleSlug],
    }));
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/outreach/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_campaign',
          name: form.name.trim(),
          category: form.targetCategory,
          location: form.targetLocation.trim(),
          configuration: {
            subcategory: form.targetSubcategory,
            radiusKm: form.radiusKm,
            maxProspects: form.maxProspects,
            minLeadScore: form.minLeadScore,
            promotedModules: form.promotedModules,
            campaignGoal: form.campaignGoal,
            preferredVariant: form.preferredVariant,
            channel: form.channel,
            executionMode: form.executionMode,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Errore creazione campagna');
      setFeedback(`Campagna "${json.campaign.name}" creata con successo.`);
      setShowCreate(false);
      setForm({ ...form, name: '' });
      loadCampaigns();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Errore creazione campagna');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRunCampaign = async (campaignId: string) => {
    setFeedback('Avvio esecuzione asincrona della campagna…');
    try {
      const res = await fetch('/api/admin/outreach/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'run_campaign',
          campaign_id: campaignId,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Errore avvio campagna');
      setFeedback(`Campagna eseguita (${json.job?.status || 'running'}).`);
      loadCampaigns();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Errore avvio campagna');
    }
  };

  const handleUpdateCampaignStatus = async (
    campaignId: string,
    status: 'paused' | 'running' | 'cancelled'
  ) => {
    try {
      const res = await fetch('/api/admin/outreach/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_campaign_status',
          campaign_id: campaignId,
          status,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Errore stato campagna');
      setFeedback(`Stato campagna aggiornato a: ${status}`);
      loadCampaigns();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Errore stato campagna');
    }
  };

  return (
    <div className="space-y-6 min-w-0">
      <PageHeader
        eyebrow="RIVO OUTREACH — GESTIONE CAMPAGNE (SEZ. 10 PRD)"
        title="Campagne di Acquisizione Commerciale"
        description="Segmentazione per categoria, località e Lead Score minimo, scelta moduli RIVO da promuovere ed esecuzione controllata in Draft o Approval Mode."
        actions={
          <>
            <button
              type="button"
              onClick={() => setShowCreate((v) => !v)}
              className="inline-flex min-h-[44px] items-center gap-2 px-4 py-2 rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[var(--rivo-volt-ink)] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
              <span>Nuova Campagna</span>
            </button>
            <button
              type="button"
              onClick={loadCampaigns}
              className="inline-flex min-h-[44px] items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <RefreshCw
                className={cn('w-3.5 h-3.5', loading && 'animate-spin')}
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <span>Aggiorna</span>
            </button>
          </>
        }
      />

      {feedback && (
        <div
          aria-live="polite"
          className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--rivo-volt-border)] text-xs text-[var(--text-primary)] flex items-center justify-between gap-2"
        >
          <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            aria-label="Chiudi avviso"
            className="min-h-[32px] px-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] inline-flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Chiudi</span>
          </button>
        </div>
      )}

      {/* Create Campaign Form */}
      {showCreate && (
        <SurfaceCard padding="lg">
          <form onSubmit={handleCreateCampaign} className="space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h2 className="font-display text-sm font-bold text-[var(--text-primary)]">
                Configurazione Nuova Campagna Commerciale RIVO
              </h2>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Chiudi
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="camp-name"
                  className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] mb-1.5"
                >
                  Nome Campagna *
                </label>
                <input
                  id="camp-name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Es. Ristoranti Napoli & Campania — Carrello Condiviso…"
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label
                  htmlFor="camp-cat"
                  className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] mb-1.5"
                >
                  Categoria Target
                </label>
                <select
                  id="camp-cat"
                  value={form.targetCategory}
                  onChange={(e) => setForm({ ...form, targetCategory: e.target.value })}
                  className={INPUT_CLASS}
                >
                  {OUTREACH_DISCOVERY_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="camp-loc"
                  className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] mb-1.5"
                >
                  Località / Città
                </label>
                <input
                  id="camp-loc"
                  type="text"
                  required
                  value={form.targetLocation}
                  onChange={(e) => setForm({ ...form, targetLocation: e.target.value })}
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label
                  htmlFor="camp-min-score"
                  className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] mb-1.5"
                >
                  Punteggio Minimo Prospect (0–100)
                </label>
                <input
                  id="camp-min-score"
                  type="number"
                  min={0}
                  max={100}
                  value={form.minLeadScore}
                  onChange={(e) => setForm({ ...form, minLeadScore: Number(e.target.value) })}
                  className={cn(INPUT_CLASS, 'font-mono tabular-nums')}
                />
              </div>

              <div>
                <label
                  htmlFor="camp-max-prospects"
                  className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] mb-1.5"
                >
                  Numero Massimo di Prospect
                </label>
                <input
                  id="camp-max-prospects"
                  type="number"
                  min={1}
                  max={500}
                  value={form.maxProspects}
                  onChange={(e) => setForm({ ...form, maxProspects: Number(e.target.value) })}
                  className={cn(INPUT_CLASS, 'font-mono tabular-nums')}
                />
              </div>

              <div>
                <span className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] mb-1.5">
                  Approccio AI &amp; Modalità Invio
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    aria-label="Approccio AI"
                    value={form.preferredVariant}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        preferredVariant: e.target.value as
                          | 'A_professional'
                          | 'B_informal'
                          | 'C_consultative',
                      })
                    }
                    className={INPUT_CLASS}
                  >
                    <option value="A_professional">Approccio A (Pro)</option>
                    <option value="B_informal">Approccio B (Smart)</option>
                    <option value="C_consultative">Approccio C (Consul.)</option>
                  </select>
                  <select
                    aria-label="Modalità Invio"
                    value={form.executionMode}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        executionMode: e.target.value as 'draft' | 'approval' | 'automated',
                      })
                    }
                    className={INPUT_CLASS}
                  >
                    <option value="draft">Draft Mode</option>
                    <option value="approval">Approval Mode</option>
                    <option value="automated">Automated Mode</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <span className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] mb-2">
                Prodotti e Funzionalità RIVO da Promuovere
              </span>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_RIVO_KNOWLEDGE_BASE.availableModules.map((mod) => {
                  const selected = form.promotedModules.includes(mod.slug);
                  return (
                    <button
                      key={mod.slug}
                      type="button"
                      onClick={() => toggleModule(mod.slug)}
                      className={cn(
                        'min-h-[36px] px-3 py-1.5 rounded-lg border text-xs transition-colors cursor-pointer',
                        selected
                          ? 'bg-[var(--rivo-volt-bg)] border-[var(--rivo-volt)] text-[var(--rivo-volt-text)] font-semibold'
                          : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      )}
                    >
                      {mod.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label
                htmlFor="camp-goal"
                className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] mb-1.5"
              >
                Obiettivo Specifico della Campagna
              </label>
              <input
                id="camp-goal"
                type="text"
                value={form.campaignGoal}
                onChange={(e) => setForm({ ...form, campaignGoal: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[var(--rivo-volt-ink)] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Creazione in corso…' : 'Crea Campagna Commerciale'}
              </button>
            </div>
          </form>
        </SurfaceCard>
      )}

      {/* Campaigns List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <SurfaceCard loading />
        ) : campaigns.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            eyebrow="CAMPAIGN ENGINE"
            title="Nessuna campagna attiva"
            description='Clicca "Nuova Campagna" per configurare la prima campagna RIVO OUTREACH.'
            primaryAction={{
              label: 'Nuova Campagna',
              onClick: () => setShowCreate(true),
              icon: Plus,
            }}
          />
        ) : (
          campaigns.map((c) => {
            const metrics = c.metrics || {};
            const cfg = c.configuration || {};
            return (
              <SurfaceCard key={c.id} padding="md">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <StatusBadge
                        tone={
                          c.status === 'running'
                            ? 'volt'
                            : c.status === 'completed'
                            ? 'operational'
                            : 'neutral'
                        }
                        variant={c.status === 'running' ? 'solid' : 'soft'}
                        shape="tag"
                      >
                        {c.status}
                      </StatusBadge>
                      <span className="text-[11px] font-mono text-[var(--text-muted)]">
                        Modalità: {(cfg.executionMode || 'approval').toUpperCase()} · Variante:{' '}
                        {cfg.preferredVariant || 'A_professional'}
                      </span>
                    </div>
                    <h3 className="font-display text-base font-bold text-[var(--text-primary)] truncate">
                      {c.name}
                    </h3>
                    <div className="text-xs text-[var(--text-secondary)] flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                        <Target className="w-3.5 h-3.5 text-[var(--rivo-volt-text)]" strokeWidth={1.75} aria-hidden="true" />
                        <span>
                          {c.category} ({c.location}) · Min Score {cfg.minLeadScore ?? 60}/100
                        </span>
                      </span>
                      {cfg.campaignGoal && (
                        <span className="text-[var(--text-muted)]">Obiettivo: {cfg.campaignGoal}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    <div className="grid grid-cols-4 gap-3 sm:gap-4 text-center bg-[var(--bg-elevated)] px-4 py-2.5 rounded-xl border border-[var(--border-subtle)]">
                      <div>
                        <div className="text-[10px] font-mono uppercase text-[var(--text-muted)]">
                          Trovati
                        </div>
                        <div className="text-sm font-bold font-mono tabular-nums text-[var(--text-primary)]">
                          {metrics.discovered ?? 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono uppercase text-[var(--text-muted)]">
                          Analizzati
                        </div>
                        <div className="text-sm font-bold font-mono tabular-nums text-[var(--rivo-volt-text)]">
                          {metrics.analyzed ?? 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono uppercase text-[var(--text-muted)]">
                          Qualificati
                        </div>
                        <div className="text-sm font-bold font-mono tabular-nums text-[var(--text-primary)]">
                          {metrics.qualified ?? 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono uppercase text-[var(--text-muted)]">
                          Pipeline
                        </div>
                        <div className="text-sm font-bold font-mono tabular-nums text-[var(--accent-operational-text)]">
                          {metrics.inPipeline ?? 0}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {c.status === 'draft' && (
                        <button
                          type="button"
                          onClick={() => handleRunCampaign(c.id)}
                          className="inline-flex min-h-[40px] items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[var(--rivo-volt-ink)] text-xs font-bold cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                          <span>Avvia</span>
                        </button>
                      )}
                      {c.status === 'paused' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateCampaignStatus(c.id, 'running')}
                          className="inline-flex min-h-[40px] items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[var(--rivo-volt-ink)] text-xs font-bold cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                          <span>Riprendi</span>
                        </button>
                      )}
                      {c.status === 'running' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateCampaignStatus(c.id, 'paused')}
                          className="inline-flex min-h-[40px] items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] cursor-pointer"
                        >
                          <Pause className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                          <span>Pausa</span>
                        </button>
                      )}
                      {c.status !== 'cancelled' && c.status !== 'completed' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateCampaignStatus(c.id, 'cancelled')}
                          className="inline-flex min-h-[40px] items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--accent-critical-border)] text-xs text-[var(--accent-critical-text)] cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                          <span>Annulla</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </SurfaceCard>
            );
          })
        )}
      </div>
    </div>
  );
}
