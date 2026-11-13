'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  XCircle,
  Plus,
  RefreshCw,
  Target,
} from 'lucide-react';
import { OUTREACH_DISCOVERY_CATEGORIES } from '@/lib/outreach/types';
import { DEFAULT_RIVO_KNOWLEDGE_BASE } from '@/lib/outreach/knowledge-base';

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
    setFeedback('Avvio esecuzione asincrona della campagna...');
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
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-[#27272A] pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#BFFF00]" />
            <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#BFFF00]">
              RIVO OUTREACH — GESTIONE CAMPAGNE (SEZ. 10 PRD)
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-[-0.02em] text-[#FAFAFA]">
            Campagne di Acquisizione Commerciale
          </h1>
          <p className="text-sm text-[#A1A1AA] mt-1">
            Segmentazione per categoria, località e Lead Score minimo, scelta moduli RIVO da promuovere ed esecuzione controllata in Draft o Approval Mode.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowCreate((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#BFFF00] hover:bg-[#A8E600] text-[#09090B] text-xs font-bold uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" />
            Nuova Campagna
          </button>
          <button
            type="button"
            onClick={loadCampaigns}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#121214] border border-[#27272A] text-xs text-[#FAFAFA]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Aggiorna
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

      {/* Create Campaign Form */}
      {showCreate && (
        <form
          onSubmit={handleCreateCampaign}
          className="bg-[#121214] border border-[#27272A] rounded-xl p-6 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
            <h2 className="text-sm font-bold text-[#FAFAFA]">
              Configurazione Nuova Campagna Commerciale RIVO
            </h2>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="text-xs text-[#A1A1AA] hover:text-[#FAFAFA]"
            >
              Chiudi
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-mono uppercase text-[#A1A1AA] mb-1">
                Nome Campagna *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Es. Ristoranti Napoli & Campania — Carrello Condiviso"
                className="w-full h-10 px-3.5 rounded-lg bg-[#0D0D10] border border-[#27272A] text-xs text-[#FAFAFA]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-[#A1A1AA] mb-1">
                Categoria Target
              </label>
              <select
                value={form.targetCategory}
                onChange={(e) =>
                  setForm({
                    ...form,
                    targetCategory: e.target.value,
                  })
                }
                className="w-full h-10 px-3.5 rounded-lg bg-[#0D0D10] border border-[#27272A] text-xs text-[#FAFAFA]"
              >
                {OUTREACH_DISCOVERY_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-[#A1A1AA] mb-1">
                Località / Città
              </label>
              <input
                type="text"
                required
                value={form.targetLocation}
                onChange={(e) => setForm({ ...form, targetLocation: e.target.value })}
                className="w-full h-10 px-3.5 rounded-lg bg-[#0D0D10] border border-[#27272A] text-xs text-[#FAFAFA]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-[#A1A1AA] mb-1">
                Punteggio Minimo Prospect (0–100)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.minLeadScore}
                onChange={(e) => setForm({ ...form, minLeadScore: Number(e.target.value) })}
                className="w-full h-10 px-3.5 rounded-lg bg-[#0D0D10] border border-[#27272A] text-xs font-mono text-[#FAFAFA]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-[#A1A1AA] mb-1">
                Numero Massimo di Prospect
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={form.maxProspects}
                onChange={(e) => setForm({ ...form, maxProspects: Number(e.target.value) })}
                className="w-full h-10 px-3.5 rounded-lg bg-[#0D0D10] border border-[#27272A] text-xs font-mono text-[#FAFAFA]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-[#A1A1AA] mb-1">
                Approccio AI & Modalità Invio
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
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
                  className="h-10 px-2.5 rounded-lg bg-[#0D0D10] border border-[#27272A] text-xs text-[#FAFAFA]"
                >
                  <option value="A_professional">Approccio A (Pro)</option>
                  <option value="B_informal">Approccio B (Smart)</option>
                  <option value="C_consultative">Approccio C (Consul.)</option>
                </select>
                <select
                  value={form.executionMode}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      executionMode: e.target.value as 'draft' | 'approval' | 'automated',
                    })
                  }
                  className="h-10 px-2.5 rounded-lg bg-[#0D0D10] border border-[#27272A] text-xs text-[#FAFAFA]"
                >
                  <option value="draft">Draft Mode</option>
                  <option value="approval">Approval Mode</option>
                  <option value="automated">Automated Mode</option>
                </select>
              </div>
            </div>
          </div>

          {/* Promoted RIVO Modules */}
          <div>
            <span className="block text-[11px] font-mono uppercase text-[#A1A1AA] mb-2">
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
                    className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                      selected
                        ? 'bg-[#18181B] border-[#BFFF00] text-[#BFFF00] font-semibold'
                        : 'bg-[#0D0D10] border-[#27272A] text-[#A1A1AA]'
                    }`}
                  >
                    {mod.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-[#A1A1AA] mb-1">
              Obiettivo Specifico della Campagna
            </label>
            <input
              type="text"
              value={form.campaignGoal}
              onChange={(e) => setForm({ ...form, campaignGoal: e.target.value })}
              className="w-full h-10 px-3.5 rounded-lg bg-[#0D0D10] border border-[#27272A] text-xs text-[#FAFAFA]"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-lg bg-[#BFFF00] hover:bg-[#A8E600] text-[#09090B] text-xs font-bold uppercase tracking-wider"
            >
              {submitting ? 'Creazione in corso...' : 'Crea Campagna Commerciale'}
            </button>
          </div>
        </form>
      )}

      {/* Campaigns List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-[#71717A] bg-[#121214] border border-[#27272A] rounded-xl">
            CARICAMENTO CAMPAGNE COMMERCIALI...
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#71717A] bg-[#121214] border border-[#27272A] rounded-xl">
            Nessuna campagna attiva. Clicca &ldquo;Nuova Campagna&rdquo; per configurare la prima campagna RIVO OUTREACH.
          </div>
        ) : (
          campaigns.map((c) => {
            const metrics = c.metrics || {};
            const cfg = c.configuration || {};
            return (
              <div
                key={c.id}
                className="bg-[#121214] border border-[#27272A] rounded-xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                        c.status === 'running'
                          ? 'bg-[#BFFF00] text-[#09090B] font-bold'
                          : c.status === 'completed'
                          ? 'bg-[#22C55E]/15 text-[#22C55E]'
                          : 'bg-[#27272A] text-[#A1A1AA]'
                      }`}
                    >
                      {c.status}
                    </span>
                    <span className="text-[11px] font-mono text-[#A1A1AA]">
                      Modalità: {(cfg.executionMode || 'approval').toUpperCase()} • Variante:{' '}
                      {cfg.preferredVariant || 'A_professional'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#FAFAFA]">{c.name}</h3>
                  <div className="text-xs text-[#A1A1AA] flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-[#BFFF00]" />
                      {c.category} ({c.location}) • Min Score {cfg.minLeadScore ?? 60}/100
                    </span>
                    {cfg.campaignGoal && (
                      <span className="text-[#71717A]">Obiettivo: {cfg.campaignGoal}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  <div className="grid grid-cols-4 gap-4 text-center bg-[#0D0D10] px-4 py-2.5 rounded-lg border border-[#27272A]">
                    <div>
                      <div className="text-[10px] font-mono uppercase text-[#71717A]">Trovati</div>
                      <div className="text-sm font-bold font-mono text-[#FAFAFA]">
                        {metrics.discovered ?? 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase text-[#71717A]">
                        Analizzati
                      </div>
                      <div className="text-sm font-bold font-mono text-[#BFFF00]">
                        {metrics.analyzed ?? 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase text-[#71717A]">
                        Qualificati
                      </div>
                      <div className="text-sm font-bold font-mono text-[#FAFAFA]">
                        {metrics.qualified ?? 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase text-[#71717A]">
                        Pipeline
                      </div>
                      <div className="text-sm font-bold font-mono text-[#22C55E]">
                        {metrics.inPipeline ?? 0}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {c.status === 'draft' && (
                      <button
                        type="button"
                        onClick={() => handleRunCampaign(c.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#BFFF00] text-[#09090B] text-xs font-bold"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Avvia
                      </button>
                    )}
                    {c.status === 'paused' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateCampaignStatus(c.id, 'running')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#BFFF00] text-[#09090B] text-xs font-bold"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Riprendi
                      </button>
                    )}
                    {c.status === 'running' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateCampaignStatus(c.id, 'paused')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#18181B] border border-[#27272A] text-xs text-[#FAFAFA]"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        Pausa
                      </button>
                    )}
                    {c.status !== 'cancelled' && c.status !== 'completed' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateCampaignStatus(c.id, 'cancelled')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#18181B] border border-[#27272A] text-xs text-[#EF4444]"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Annulla
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
