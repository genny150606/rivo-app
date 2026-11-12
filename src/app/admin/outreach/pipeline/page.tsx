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
} from 'lucide-react';
import {
  OUTREACH_PIPELINE_STAGES,
  type OutreachProspectRecord,
  type OutreachCommercialStatus,
} from '@/lib/outreach/types';

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
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-[#27272A] pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#BFFF00]" />
            <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#BFFF00]">
              RIVO OUTREACH — PIPELINE COMMERCIALE & CRM (SEZ. 11 & 12 PRD)
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-[-0.02em] text-[#FAFAFA]">
            Pipeline Commerciale End-to-End (12 Stati)
          </h1>
          <p className="text-sm text-[#A1A1AA] mt-1">
            Gestione completa dalla scoperta alla conversione transazionale in Organizzazione Cliente RIVO.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={selectedStageFilter}
            onChange={(e) => setSelectedStageFilter(e.target.value)}
            className="h-9 px-3 rounded-lg bg-[#121214] border border-[#27272A] text-xs text-[#FAFAFA]"
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

      {/* Horizontal Kanban Board across 12 Stages */}
      {loading ? (
        <div className="p-12 text-center text-xs font-mono text-[#71717A]">
          CARICAMENTO PIPELINE COMMERCIALE...
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-6">
          {stagesToRender.map((stage) => {
            const stageProspects = prospects.filter((p) => p.commercial_status === stage.id);
            const isConvertedStage = stage.id === 'convertito_in_cliente';

            return (
              <div
                key={stage.id}
                className={`w-80 shrink-0 rounded-xl border p-4 flex flex-col gap-3 ${
                  isConvertedStage
                    ? 'bg-[#121214] border-[#BFFF00]/60'
                    : 'bg-[#121214] border-[#27272A]'
                }`}
              >
                <div className="flex items-center justify-between border-b border-[#27272A] pb-2.5">
                  <div className="flex items-center gap-2">
                    <Kanban
                      className={`w-3.5 h-3.5 ${
                        isConvertedStage ? 'text-[#BFFF00]' : 'text-[#A1A1AA]'
                      }`}
                    />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#FAFAFA]">
                      {stage.shortLabel}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#18181B] border border-[#27272A] text-[#BFFF00]">
                    {stageProspects.length}
                  </span>
                </div>

                <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                  {stageProspects.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-[#71717A] border border-dashed border-[#27272A] rounded-lg">
                      Nessun prospect in questo stato
                    </div>
                  ) : (
                    stageProspects.map((p) => (
                      <div
                        key={p.id}
                        className="p-3.5 rounded-lg bg-[#0D0D10] border border-[#27272A] hover:border-[#3F3F46] space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link
                              href={`/admin/outreach/prospects`}
                              className="text-xs font-bold text-[#FAFAFA] hover:text-[#BFFF00]"
                            >
                              {p.business_name}
                            </Link>
                            <div className="text-[11px] text-[#71717A]">
                              {p.category} • {p.city || 'N/D'}
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#18181B] border border-[#27272A] text-[#BFFF00]">
                            {p.lead_score}/100
                          </span>
                        </div>

                        {p.admin_notes && (
                          <p className="text-[11px] text-[#A1A1AA] bg-[#121214] p-2 rounded border border-[#27272A] line-clamp-2">
                            {p.admin_notes}
                          </p>
                        )}

                        <div className="pt-1 flex flex-col gap-2">
                          <select
                            value={p.commercial_status}
                            onChange={(e) =>
                              handleMoveStage(p.id, e.target.value as OutreachCommercialStatus)
                            }
                            className="w-full h-8 px-2 rounded bg-[#121214] border border-[#27272A] text-[11px] text-[#FAFAFA]"
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
                                className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded bg-[#BFFF00] hover:bg-[#A8E600] text-[#09090B] text-[11px] font-bold"
                              >
                                <UserCheck className="w-3 h-3" />
                                CONVERTI IN CLIENTE RIVO
                              </button>
                              <Link
                                href={`/admin/organizations/new?outreachProspectId=${p.id}`}
                                title="Apri Wizard Organizzazione precompilato"
                                className="p-1.5 rounded bg-[#18181B] border border-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA]"
                              >
                                <Building2 className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          ) : (
                            <Link
                              href={`/admin/organizations/${p.organization_id}`}
                              className="inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded bg-[#22C55E]/15 border border-[#22C55E]/40 text-[#22C55E] text-[11px] font-semibold"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Cliente Attivo RIVO
                              <ArrowRight className="w-3 h-3" />
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
