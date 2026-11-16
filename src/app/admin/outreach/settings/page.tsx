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
  X,
} from 'lucide-react';
import type { RivoProductKnowledgeBase } from '@/lib/outreach/knowledge-base';
import { PageHeader, SurfaceCard, StatusBadge } from '@/components/ui';
import { cn } from '@/lib/cn';

interface EnvCredentialsStatus {
  geminiConfigured: boolean;
  googlePlacesConfigured: boolean;
  smtpConfigured: boolean;
  whatsappCloudConfigured: boolean;
  metaInstagramConfigured: boolean;
}

const FIELD_CLASS =
  'w-full min-h-[40px] px-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--rivo-volt)] text-xs text-[var(--text-primary)]';

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
    <div className="space-y-6 min-w-0">
      <PageHeader
        eyebrow="RIVO OUTREACH — IMPOSTAZIONI, KNOWLEDGE BASE & GDPR (SEZ. 8.1, 15 & 16 PRD)"
        title="Governance, Knowledge Base AI & Sicurezza"
        description="Stato chiavi server-side (mai esposte nel browser), Knowledge Base RIVO aggiornabile, limiti giornalieri di invio e Data Retention GDPR."
        actions={
          <button
            type="button"
            onClick={loadSettings}
            className="inline-flex min-h-[40px] items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <RefreshCw
              className={cn('w-3.5 h-3.5', loading && 'animate-spin')}
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <span>Ricarica</span>
          </button>
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
            className="inline-flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Chiudi</span>
          </button>
        </div>
      )}

      {loading ? (
        <SurfaceCard loading />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-5 space-y-6">
            <SurfaceCard
              header={{
                eyebrow: 'SECRETS & WEBHOOKS',
                title: 'Stato Integrazioni Server-Side (Zero Secret nel Client)',
                icon: KeyRound,
              }}
            >
              <div className="space-y-2 text-xs">
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
                    className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]"
                  >
                    <span className="text-[var(--text-secondary)] min-w-0">{item.label}</span>
                    <StatusBadge tone={item.ok ? 'operational' : 'neutral'} shape="tag">
                      {item.ok ? 'CONFIGURATA' : 'FALLBACK ATTIVO'}
                    </StatusBadge>
                  </div>
                ))}
              </div>
              <div className="pt-3 mt-3 border-t border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-muted)] break-all">
                Webhook WhatsApp Inbound:{' '}
                <code className="text-[var(--text-primary)]">
                  /api/admin/outreach/webhooks/whatsapp
                </code>
              </div>
            </SurfaceCard>

            <SurfaceCard
              header={{
                eyebrow: 'RATE LIMITS & CAC',
                title: 'Limiti Operativi, Tutela Dominio & Budget CAC',
                icon: Sliders,
              }}
            >
              <form onSubmit={handleSaveCommercialSettings} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label
                      htmlFor="set-max-discovery"
                      className="block text-[11px] text-[var(--text-secondary)] mb-1"
                    >
                      Max Ricerche Discovery / Giorno
                    </label>
                    <input
                      id="set-max-discovery"
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
                      className={cn(FIELD_CLASS, 'font-mono tabular-nums')}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="set-retention-days"
                      className="block text-[11px] text-[var(--text-secondary)] mb-1"
                    >
                      Giorni Retention Default
                    </label>
                    <input
                      id="set-retention-days"
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
                      className={cn(FIELD_CLASS, 'font-mono tabular-nums')}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="set-budget-eur"
                      className="block text-[11px] text-[var(--text-secondary)] mb-1"
                    >
                      Budget Mensile Outreach (€ per calcolo CAC)
                    </label>
                    <input
                      id="set-budget-eur"
                      type="number"
                      min={0}
                      value={commercialSettings.monthlyAcquisitionBudgetEur}
                      onChange={(e) =>
                        setCommercialSettings({
                          ...commercialSettings,
                          monthlyAcquisitionBudgetEur: Number(e.target.value),
                        })
                      }
                      className={cn(FIELD_CLASS, 'font-mono tabular-nums')}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="set-delivery-mode"
                      className="block text-[11px] text-[var(--text-secondary)] mb-1"
                    >
                      Modalità Invio Default
                    </label>
                    <select
                      id="set-delivery-mode"
                      value={commercialSettings.defaultDeliveryMode}
                      onChange={(e) =>
                        setCommercialSettings({
                          ...commercialSettings,
                          defaultDeliveryMode: e.target.value,
                        })
                      }
                      className={FIELD_CLASS}
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
                    className="inline-flex min-h-[40px] items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[var(--rivo-volt-ink)] text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                    <span>Salva Parametri Operativi</span>
                  </button>
                </div>
              </form>
            </SurfaceCard>

            <SurfaceCard
              header={{
                eyebrow: 'COMPLIANCE',
                title: 'GDPR Data Retention & Minimizzazione Dati',
                icon: ShieldCheck,
              }}
            >
              <div className="space-y-3">
                <p className="text-xs text-[var(--text-secondary)]">
                  Rimuove automaticamente le schede prospect non convertite la cui data di conservazione (`retention_expires_at`) è scaduta.
                </p>
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleRunRetentionCleanup}
                    className="inline-flex min-h-[40px] items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--accent-critical-bg)] border border-[var(--accent-critical-border)] text-[var(--accent-critical-text)] text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                    <span>Esegui Pulizia GDPR Ora</span>
                  </button>
                </div>
              </div>
            </SurfaceCard>
          </div>

          {/* Right Column: Editable RIVO Knowledge Base */}
          <div className="lg:col-span-7">
            <SurfaceCard
              header={{
                eyebrow: 'AI AGENT CONTEXT',
                title: 'Knowledge Base RIVO (Sez. 8.1 PRD)',
                subtitle:
                  'Catalogo strutturato dei moduli RIVO, benefici per categoria, obiezioni frequenti e guardrail anti-allucinazione usato da Gemini.',
                icon: BookOpen,
                action: (
                  <StatusBadge tone="volt" className="tabular-nums">
                    Moduli attivi: {kb?.availableModules?.length ?? 0}
                  </StatusBadge>
                ),
              }}
            >
              <form onSubmit={handleSaveKnowledgeBase} className="space-y-4">
                <label htmlFor="kb-json-editor" className="sr-only">
                  Editor JSON Knowledge Base RIVO
                </label>
                <textarea
                  id="kb-json-editor"
                  rows={22}
                  spellCheck={false}
                  value={kbJsonDraft}
                  onChange={(e) => setKbJsonDraft(e.target.value)}
                  className="w-full p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--rivo-volt)] font-mono text-xs text-[var(--text-primary)] leading-relaxed"
                />

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <span className="text-[11px] text-[var(--text-muted)]">
                    Modificabile in formato JSON senza richiedere deploy del codice.
                  </span>
                  <button
                    type="submit"
                    disabled={busy}
                    className="inline-flex min-h-[44px] items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[var(--rivo-volt-ink)] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Database className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                    <span>Salva Knowledge Base RIVO</span>
                  </button>
                </div>
              </form>
            </SurfaceCard>
          </div>
        </div>
      )}
    </div>
  );
}
