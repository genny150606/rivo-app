'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Kanban,
  UserCheck,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  Building2,
  X,
} from 'lucide-react';
import {
  OUTREACH_PIPELINE_STAGES,
  type OutreachProspectRecord,
  type OutreachCommercialStatus,
} from '@/lib/outreach/types';
import { PageHeader, SurfaceCard, StatusBadge } from '@/components/ui';
import { cn } from '@/lib/cn';

export default function OutreachPipelinePage() {
  const [prospects, setProspects] = useState<OutreachProspectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('ALL');

  const loadPipeline = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/outreach/prospects?pageSize=150&sortBy=lead_score', {
        cache: 'no-store',
      });
      const json = await res.json();
      if (res.ok && json.prospects) {
        setProspects(json.prospects);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPipeline();
  }, [loadPipeline]);

  const handleMoveStage = async (prospectId: string, nextStage: OutreachCommercialStatus) => {
    try {
      const res = await fetch('/api/admin/outreach/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_status',
          prospect_id: prospectId,
          commercial_status: nextStage,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Errore spostamento stato');
      setFeedback(`Prospect spostato in "${nextStage}".`);
      loadPipeline();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Errore spostamento');
    }
  };

  const handleQuickConvert = async (p: OutreachProspectRecord) => {
    const emailPrompt =
      p.business_email ||
      window.prompt('Inserisci l’email del titolare per creare l’account RIVO:', '') ||
      '';
    if (!emailPrompt.trim()) return;

    try {
      const res = await fetch('/api/admin/outreach/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'convert_to_client',
          prospect_id: p.id,
          owner_first_name: p.business_name,
          owner_last_name: 'Titolare',
          owner_email: emailPrompt.trim(),
          owner_password: 'Rivo2026!',
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Errore conversione');
      setFeedback(
        `Attività "${p.business_name}" convertita in Cliente RIVO (Org ID: ${json.organizationId}).`
      );
      loadPipeline();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Errore conversione');
    }
  };

  const stagesToRender =
    selectedStageFilter === 'ALL'
      ? OUTREACH_PIPELINE_STAGES
      : OUTREACH_PIPELINE_STAGES.filter((s) => s.id === selectedStageFilter);

  return (
    <div className="space-y-6 min-w-0">
      <PageHeader
        eyebrow="RIVO OUTREACH — PIPELINE COMMERCIALE & CRM (SEZ. 11 & 12 PRD)"
        title="Pipeline Commerciale End-to-End (12 Stati)"
        description="Gestione completa dalla scoperta alla conversione transazionale in Organizzazione Cliente RIVO."
        actions={
          <>
            <label htmlFor="pipeline-stage-filter" className="sr-only">
              Filtra stato pipeline
            </label>
            <select
              id="pipeline-stage-filter"
              value={selectedStageFilter}
              onChange={(e) => setSelectedStageFilter(e.target.value)}
              className="min-h-[40px] px-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)]"
            >
              <option value="ALL">Mostra tutte le 12 colonne</option>
              {OUTREACH_PIPELINE_STAGES.map((st) => (
                <option key={st.id} value={st.id}>
                  Filtra: {st.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={loadPipeline}
              className="inline-flex min-h-[40px] items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-primary)] transition-colors cursor-pointer"
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
            className="inline-flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Chiudi</span>
          </button>
        </div>
      )}

      {/* Horizontal Kanban Board across 12 Stages */}
      {loading ? (
        <SurfaceCard loading />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-6">
          {stagesToRender.map((stage) => {
            const stageProspects = prospects.filter((p) => p.commercial_status === stage.id);
            const isConvertedStage = stage.id === 'convertito_in_cliente';

            return (
              <div
                key={stage.id}
                className={cn(
                  'w-80 shrink-0 rounded-xl border p-4 flex flex-col gap-3 bg-[var(--bg-surface)]',
                  isConvertedStage
                    ? 'border-[var(--rivo-volt-border)]'
                    : 'border-[var(--border-subtle)]'
                )}
              >
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <Kanban
                      className={cn(
                        'w-3.5 h-3.5 shrink-0',
                        isConvertedStage
                          ? 'text-[var(--rivo-volt-text)]'
                          : 'text-[var(--text-secondary)]'
                      )}
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] truncate">
                      {stage.shortLabel}
                    </span>
                  </div>
                  <StatusBadge tone="volt" shape="tag" className="tabular-nums">
                    {stageProspects.length}
                  </StatusBadge>
                </div>

                <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                  {stageProspects.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-[var(--text-muted)] border border-dashed border-[var(--border-subtle)] rounded-lg">
                      Nessun prospect in questo stato
                    </div>
                  ) : (
                    stageProspects.map((p) => (
                      <div
                        key={p.id}
                        className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] space-y-2.5 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link
                              href="/admin/outreach/prospects"
                              className="text-xs font-bold text-[var(--text-primary)] hover:text-[var(--rivo-volt-text)] block truncate"
                            >
                              {p.business_name}
                            </Link>
                            <div className="text-[11px] text-[var(--text-muted)] truncate">
                              {p.category} · {p.city || 'N/D'}
                            </div>
                          </div>
                          <StatusBadge tone="volt" shape="tag" className="tabular-nums">
                            {p.lead_score}/100
                          </StatusBadge>
                        </div>

                        {p.admin_notes && (
                          <p className="text-[11px] text-[var(--text-secondary)] bg-[var(--bg-surface)] p-2 rounded-lg border border-[var(--border-subtle)] line-clamp-2">
                            {p.admin_notes}
                          </p>
                        )}

                        <div className="pt-1 flex flex-col gap-2">
                          <label htmlFor={`move-${p.id}`} className="sr-only">
                            Sposta stato per {p.business_name}
                          </label>
                          <select
                            id={`move-${p.id}`}
                            value={p.commercial_status}
                            onChange={(e) =>
                              handleMoveStage(p.id, e.target.value as OutreachCommercialStatus)
                            }
                            className="w-full min-h-[36px] px-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-primary)]"
                          >
                            {OUTREACH_PIPELINE_STAGES.map((st) => (
                              <option key={st.id} value={st.id}>
                                Sposta in: {st.shortLabel}
                              </option>
                            ))}
                          </select>

                          {!p.organization_id ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleQuickConvert(p)}
                                className="flex-1 min-h-[36px] inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[var(--rivo-volt-ink)] text-[11px] font-bold transition-colors cursor-pointer"
                              >
                                <UserCheck className="w-3 h-3" strokeWidth={1.75} aria-hidden="true" />
                                <span>CONVERTI IN CLIENTE RIVO</span>
                              </button>
                              <Link
                                href={`/admin/organizations/new?outreachProspectId=${p.id}`}
                                title="Apri Wizard Organizzazione precompilato"
                                aria-label={`Apri Wizard Organizzazione precompilato per ${p.business_name}`}
                                className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                              >
                                <Building2 className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                              </Link>
                            </div>
                          ) : (
                            <Link
                              href={`/admin/organizations/${p.organization_id}`}
                              className="inline-flex min-h-[36px] items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-[var(--accent-operational-bg)] border border-[var(--accent-operational-border)] text-[var(--accent-operational-text)] text-[11px] font-semibold"
                            >
                              <CheckCircle2 className="w-3 h-3" strokeWidth={1.75} aria-hidden="true" />
                              <span>Cliente Attivo RIVO</span>
                              <ArrowRight className="w-3 h-3" strokeWidth={1.75} aria-hidden="true" />
                            </Link>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
