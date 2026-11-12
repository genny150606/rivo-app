'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  ShieldCheck,
  Database,
  Sliders,
  Trash2,
  Save,
  RefreshCw,
  KeyRound,
  BookOpen,
} from 'lucide-react';
import type { RivoProductKnowledgeBase } from '@/lib/outreach/knowledge-base';

interface EnvCredentialsStatus {
  geminiConfigured: boolean;
  googlePlacesConfigured: boolean;
  smtpConfigured: boolean;
  whatsappCloudConfigured: boolean;
  metaInstagramConfigured: boolean;
}

export default function OutreachSettingsPage() {
  const [envStatus, setEnvStatus] = useState<EnvCredentialsStatus | null>(null);
  const [kb, setKb] = useState<RivoProductKnowledgeBase | null>(null);
  const [kbJsonDraft, setKbJsonDraft] = useState('');

  const [commercialSettings, setCommercialSettings] = useState({
    retentionDays: 365,
    defaultAiModel: 'gemini-2.5-flash',
    defaultDeliveryMode: 'approval',
    maxDailyDiscoveryRequests: 50,
    monthlyAcquisitionBudgetEur: 0,
  });

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/outreach/settings', { cache: 'no-store' });
      const json = await res.json();
      if (res.ok) {
        setEnvStatus(json.envStatus || null);
        if (json.knowledgeBase) {
          setKb(json.knowledgeBase);
          setKbJsonDraft(JSON.stringify(json.knowledgeBase, null, 2));
        }
        if (json.commercialSettings) {
          setCommercialSettings(json.commercialSettings);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSaveCommercialSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/outreach/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_commercial_settings',
          commercial_settings: commercialSettings,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Errore salvataggio impostazioni');
      setFeedback('Impostazioni operative e limiti anti-spam salvati con successo.');
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Errore salvataggio');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveKnowledgeBase = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      const parsed = JSON.parse(kbJsonDraft);
      const res = await fetch('/api/admin/outreach/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_knowledge_base',
          knowledge_base: parsed,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Errore salvataggio Knowledge Base');
      setFeedback(
        'Knowledge Base RIVO aggiornata nel database! L’AI Sales Agent utilizzerà immediatamente le nuove direttive.'
      );
      setKb(parsed);
    } catch (err) {
      setFeedback(
        err instanceof Error
          ? `Errore JSON o salvataggio: ${err.message}`
          : 'Errore salvataggio Knowledge Base'
      );
    } finally {
      setBusy(false);
    }
  };

  const handleRunRetentionCleanup = async () => {
    if (
      !window.confirm(
        'Confermi la pulizia GDPR dei prospect inattivi la cui data di conservazione è scaduta?'
      )
    ) {
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/outreach/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'run_retention_cleanup',
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Errore pulizia GDPR');
      setFeedback(
        `Pulizia Data Retention completata: ${json.deletedCount} schede scadute rimosse.`
      );
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Errore pulizia GDPR');
    } finally {
      setBusy(false);
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
              RIVO OUTREACH — IMPOSTAZIONI, KNOWLEDGE BASE & GDPR (SEZ. 8.1, 15 & 16 PRD)
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-[-0.02em] text-[#FAFAFA]">
            Governance, Knowledge Base AI & Sicurezza
          </h1>
          <p className="text-sm text-[#A1A1AA] mt-1">
            Stato chiavi server-side (mai esposte nel browser), Knowledge Base RIVO aggiornabile, limiti giornalieri di invio e Data Retention GDPR.
          </p>
        </div>

        <button
          type="button"
          onClick={loadSettings}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#121214] border border-[#27272A] text-xs text-[#FAFAFA]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Ricarica
        </button>
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

      {loading ? (
        <div className="p-12 text-center text-xs font-mono text-[#71717A]">
          CARICAMENTO IMPOSTAZIONI...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Server Credentials Status, Rate Limits & GDPR Retention */}
          <div className="lg:col-span-5 space-y-6">
            {/* Server-Side Credentials Status */}
            <div className="bg-[#121214] border border-[#27272A] rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FAFAFA]">
                <KeyRound className="w-4 h-4 text-[#BFFF00]" />
                Stato Integrazioni Server-Side (Zero Secret nel Client)
              </div>
              <div className="space-y-2 pt-1 text-xs">
                {[
                  {
                    label: 'Google Gemini API (AI Business Intelligence & Sales Agent)',
                    ok: envStatus?.geminiConfigured,
                  },
                  {
                    label: 'OpenStreetMap Overpass API (ODbL Open Data Discovery)',
                    ok: true,
                  },
                  {
                    label: 'Google Places API Ufficiale (Opzionale)',
                    ok: envStatus?.googlePlacesConfigured,
                  },
                  {
                    label: 'SMTP / Nodemailer Email Commerciale',
                    ok: envStatus?.smtpConfigured,
                  },
                  {
                    label: 'WhatsApp Business Cloud API + Webhook',
                    ok: envStatus?.whatsappCloudConfigured,
                  },
                  {
                    label: 'Instagram Graph API (Messaging Ufficiale)',
                    ok: envStatus?.metaInstagramConfigured,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between p-2.5 rounded bg-[#0D0D10] border border-[#27272A]"
                  >
                    <span className="text-[#A1A1AA]">{item.label}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                        item.ok
                          ? 'bg-[#22C55E]/15 text-[#22C55E]'
                          : 'bg-[#27272A] text-[#A1A1AA]'
                      }`}
                    >
                      {item.ok ? 'CONFIGURATA' : 'FALLBACK ATTIVO'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-2 text-[11px] font-mono text-[#71717A]">
                Webhook WhatsApp Inbound:{' '}
                <code className="text-[#FAFAFA]">/api/admin/outreach/webhooks/whatsapp</code>
              </div>
            </div>

            {/* Operational Rate Limits & CAC */}
            <form
              onSubmit={handleSaveCommercialSettings}
              className="bg-[#121214] border border-[#27272A] rounded-xl p-5 space-y-4"
            >
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FAFAFA]">
                <Sliders className="w-4 h-4 text-[#BFFF00]" />
                Limiti Operativi, Tutela Dominio & Budget CAC
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] text-[#A1A1AA] mb-1">
                    Max Ricerche Discovery / Giorno
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={commercialSettings.maxDailyDiscoveryRequests}
                    onChange={(e) =>
                      setCommercialSettings({
                        ...commercialSettings,
                        maxDailyDiscoveryRequests: Number(e.target.value),
                      })
                    }
                    className="w-full h-9 px-3 rounded bg-[#0D0D10] border border-[#27272A] font-mono text-[#FAFAFA]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#A1A1AA] mb-1">
                    Giorni Retention Default
                  </label>
                  <input
                    type="number"
                    min={30}
                    max={730}
                    value={commercialSettings.retentionDays}
                    onChange={(e) =>
                      setCommercialSettings({
                        ...commercialSettings,
                        retentionDays: Number(e.target.value),
                      })
                    }
                    className="w-full h-9 px-3 rounded bg-[#0D0D10] border border-[#27272A] font-mono text-[#FAFAFA]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#A1A1AA] mb-1">
                    Budget Mensile Outreach (€ per calcolo CAC)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={commercialSettings.monthlyAcquisitionBudgetEur}
                    onChange={(e) =>
                      setCommercialSettings({
                        ...commercialSettings,
                        monthlyAcquisitionBudgetEur: Number(e.target.value),
                      })
                    }
                    className="w-full h-9 px-3 rounded bg-[#0D0D10] border border-[#27272A] font-mono text-[#FAFAFA]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#A1A1AA] mb-1">
                    Modalità Invio Default
                  </label>
                  <select
                    value={commercialSettings.defaultDeliveryMode}
                    onChange={(e) =>
                      setCommercialSettings({
                        ...commercialSettings,
                        defaultDeliveryMode: e.target.value,
                      })
                    }
                    className="w-full h-9 px-3 rounded bg-[#0D0D10] border border-[#27272A] text-[#FAFAFA]"
                  >
                    <option value="draft">Draft Mode</option>
                    <option value="approval">Approval Mode</option>
                    <option value="automated">Automated Mode</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#BFFF00] text-[#09090B] text-xs font-bold"
                >
                  <Save className="w-3.5 h-3.5" />
                  Salva Parametri Operativi
                </button>
              </div>
            </form>

            {/* GDPR Data Retention */}
            <div className="bg-[#121214] border border-[#27272A] rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FAFAFA]">
                <ShieldCheck className="w-4 h-4 text-[#BFFF00]" />
                GDPR Data Retention & Minimizzazione Dati
              </div>
              <p className="text-xs text-[#A1A1AA]">
                Rimuove automaticamente le schede prospect non convertite la cui data di conservazione (`retention_expires_at`) è scaduta.
              </p>
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleRunRetentionCleanup}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#18181B] border border-[#EF4444]/50 text-[#EF4444] text-xs font-semibold hover:bg-[#EF4444]/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Esegui Pulizia GDPR Ora
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Editable RIVO Knowledge Base */}
          <div className="lg:col-span-7">
            <form
              onSubmit={handleSaveKnowledgeBase}
              className="bg-[#121214] border border-[#27272A] rounded-xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#BFFF00]">
                    <BookOpen className="w-4 h-4" />
                    Knowledge Base RIVO (Sez. 8.1 PRD)
                  </div>
                  <p className="text-xs text-[#A1A1AA] mt-0.5">
                    Catalogo strutturato dei moduli RIVO, benefici per categoria, obiezioni frequenti e guardrail anti-allucinazione usato da Gemini.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-[#71717A]">
                  Moduli attivi: {kb?.availableModules?.length ?? 0}
                </span>
              </div>

              <textarea
                rows={22}
                value={kbJsonDraft}
                onChange={(e) => setKbJsonDraft(e.target.value)}
                className="w-full p-4 rounded-lg bg-[#0D0D10] border border-[#27272A] font-mono text-xs text-[#FAFAFA] leading-relaxed focus:outline-none focus:border-[#BFFF00]"
              />

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-[#71717A]">
                  Modificabile in formato JSON senza richiedere deploy del codice.
                </span>
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#BFFF00] hover:bg-[#A8E600] text-[#09090B] text-xs font-bold uppercase tracking-wider"
                >
                  <Database className="w-3.5 h-3.5" />
                  Salva Knowledge Base RIVO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
