'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Send,
  ShieldCheck,
  ShieldAlert,
  Ban,
  RefreshCw,
  Reply,
  ExternalLink,
  Link2,
  Copy,
  Check,
} from 'lucide-react';
import { buildProspectDemoUrl } from '@/lib/outreach/preview';
import type {
  LegalBasisType,
  OutreachChannel,
  OutreachDeliveryMode,
  OutreachProspectRecord,
} from '@/lib/outreach/types';

interface ChannelStatus {
  channel: OutreachChannel;
  label: string;
  configured: boolean;
  policySummary: string;
}

interface MessageRecord {
  id: string;
  prospect_id: string;
  channel: string;
  direction: 'outbound' | 'inbound';
  delivery_mode: string;
  subject: string | null;
  content: string;
  provider_status: string;
  sent_at: string | null;
  created_at: string;
}

interface SuppressionRecord {
  id: string;
  prospect_id: string;
  channel: string;
  contact_identifier: string | null;
  reason: string;
  created_at: string;
}

function OutreachCommunicationsContent() {
  const searchParams = useSearchParams();
  const initialProspectId = searchParams.get('prospectId') || '';

  const [channels, setChannels] = useState<ChannelStatus[]>([]);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [suppressions, setSuppressions] = useState<SuppressionRecord[]>([]);
  const [prospects, setProspects] = useState<OutreachProspectRecord[]>([]);

  const [selectedProspectId, setSelectedProspectId] = useState(initialProspectId);
  const [channel, setChannel] = useState<OutreachChannel>('email');
  const [deliveryMode, setDeliveryMode] = useState<OutreachDeliveryMode>('approval');
  const [isHumanApproved, setIsHumanApproved] = useState(true);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');

  // Legal Basis / Permission Registration State
  const [legalBasis, setLegalBasis] = useState<LegalBasisType>(
    'documented_b2b_legitimate_interest'
  );
  const [evidenceReference, setEvidenceReference] = useState(
    'Indirizzo aziendale pubblico verificato / Richiesta contatto commerciale B2B pertinente'
  );

  // Inbound Reply Modal
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');

  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [copiedDemoLink, setCopiedDemoLink] = useState(false);
  const [loadedProspect, setLoadedProspect] = useState<OutreachProspectRecord | null>(null);

  const loadCommunicationsData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/outreach/communications', { cache: 'no-store' });
      const json = await res.json();

      if (res.ok) {
        setChannels(json.channels || []);
        setMessages(json.messages || []);
        setSuppressions(json.suppressions || []);
        if (json.prospects) {
          setProspects(json.prospects);
          if (!selectedProspectId && json.prospects.length > 0) {
            setSelectedProspectId(json.prospects[0].id);
          }
        }
      }
    } catch {
      // ignore
    }
  }, [selectedProspectId]);

  useEffect(() => {
    loadCommunicationsData();
  }, [loadCommunicationsData]);

  // Load approved/selected pitch when prospect changes
  useEffect(() => {
    if (!selectedProspectId) return;
    fetch(`/api/admin/outreach/prospects?id=${selectedProspectId}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((json) => {
        if (json.prospect) {
          setLoadedProspect(json.prospect);
        }
        if (json.messages && json.messages.length > 0) {
          const approvedMsg = json.messages.find(
            (m: { provider_status: string }) => m.provider_status === 'approved'
          );
          if (approvedMsg) {
            setSubject(approvedMsg.subject || '');
            setContent(approvedMsg.content || '');
            return;
          }
        }
        if (json.generations && json.generations.length > 0) {
          const salesGen = json.generations.find(
            (g: { generation_type: string }) => g.generation_type === 'sales_pitch'
          );
          const v = salesGen?.generated_content?.variants?.A_professional;
          if (v) {
            setSubject(v.subject || '');
            setContent(v.fullMessageBody || '');
          }
        }
      })
      .catch(() => {});
  }, [selectedProspectId]);

  const selectedProspect =
    prospects.find((p) => p.id === selectedProspectId) ||
    (loadedProspect?.id === selectedProspectId ? loadedProspect : null);
  const selectedDemoUrl = selectedProspect
    ? buildProspectDemoUrl(selectedProspect.business_name, selectedProspect.id)
    : null;

  const handleRegisterPermission = async () => {
    if (!selectedProspectId) return;
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/outreach/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'grant_permission',
          prospect_id: selectedProspectId,
          channel,
          legal_basis: legalBasis,
          evidence_reference: evidenceReference,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Errore registrazione permesso');
      setFeedback({
        type: 'ok',
        text: `Base giuridica (${legalBasis}) registrata per il canale ${channel.toUpperCase()}.`,
      });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Errore registrazione permesso',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleDispatchCommunication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProspectId || !content.trim()) return;
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/outreach/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'dispatch_message',
          prospect_id: selectedProspectId,
          channel,
          delivery_mode: deliveryMode,
          is_human_approved: isHumanApproved,
          subject: subject || undefined,
          content,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || json.reason || 'Blocco Compliance o errore invio');
      }
      setFeedback({
        type: 'ok',
        text: `Comunicazione processata (${json.providerStatus || 'inviata'}) tramite Compliance Service.`,
      });
      await loadCommunicationsData();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Errore invio comunicazione',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleRecordInboundReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProspectId || !replyText.trim()) return;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/outreach/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record_inbound_reply',
          prospect_id: selectedProspectId,
          channel,
          content: replyText,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Errore registrazione risposta');
      setFeedback({
        type: 'ok',
        text: 'Risposta ricevuta registrata! Pipeline aggiornata a "Interessato" e finestra 24h aperta.',
      });
      setReplyText('');
      setShowReplyForm(false);
      await loadCommunicationsData();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Errore registrazione risposta',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleOptOut = async () => {
    if (!selectedProspectId) return;
    if (
      !window.confirm(
        'Confermi l’inserimento immediato di questo prospect nella Suppression List (Non contattare)?'
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/admin/outreach/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record_opt_out',
          prospect_id: selectedProspectId,
          channel: 'all',
          reason: 'Opt-out registrato manualmente da Admin',
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Errore opt-out');
      setFeedback({
        type: 'ok',
        text: 'Prospect inserito nella Suppression List e bloccato su tutti i canali.',
      });
      await loadCommunicationsData();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Errore opt-out',
      });
    } finally {
      setBusy(false);
    }
  };

  const prospectNameById = (id: string) =>
    prospects.find((p) => p.id === id)?.business_name || 'Prospect';

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-[#27272A] pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#BFFF00]" />
            <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#BFFF00]">
              RIVO OUTREACH — COMUNICAZIONI & COMPLIANCE GATE (SEZ. 9 & 15 PRD)
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-[-0.02em] text-[#FAFAFA]">
            Centro Comunicazioni Multicanale & Tutela Dominio
          </h1>
          <p className="text-sm text-[#A1A1AA] mt-1">
            Ogni invio passa attraverso `OutreachComplianceService`: verifica permessi, base giuridica GDPR, finestra 24h Meta/WhatsApp e Suppression List.
          </p>
        </div>

        <button
          type="button"
          onClick={loadCommunicationsData}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#121214] border border-[#27272A] text-xs text-[#FAFAFA]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Aggiorna
        </button>
      </div>

      {/* Channels Status Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {channels.map((ch) => (
          <div
            key={ch.channel}
            className="bg-[#121214] border border-[#27272A] rounded-xl p-4 space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#FAFAFA]">{ch.label}</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                  ch.configured
                    ? 'bg-[#22C55E]/15 text-[#22C55E]'
                    : 'bg-[#F59E0B]/15 text-[#F59E0B]'
                }`}
              >
                {ch.configured ? 'Attivo' : 'Assistito / Config'}
              </span>
            </div>
            <p className="text-[11px] text-[#71717A] leading-snug">{ch.policySummary}</p>
          </div>
        ))}
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
            feedback.type === 'ok'
              ? 'bg-[#121214] border-[#BFFF00]/50 text-[#FAFAFA]'
              : 'bg-[#EF4444]/10 border-[#EF4444]/40 text-[#EF4444]'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'ok' ? (
              <ShieldCheck className="w-4 h-4 text-[#BFFF00]" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-[#EF4444]" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-[#A1A1AA] hover:text-[#FAFAFA]"
          >
            Chiudi
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Outbound Composer & Compliance Gate */}
        <div className="lg:col-span-7 space-y-6">
          <form
            onSubmit={handleDispatchCommunication}
            className="bg-[#121214] border border-[#27272A] rounded-xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
              <h2 className="text-sm font-bold text-[#FAFAFA] flex items-center gap-2">
                <Send className="w-4 h-4 text-[#BFFF00]" />
                Invio / Coda Comunicazione Commerciale
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowReplyForm((v) => !v)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#18181B] border border-[#27272A] text-[11px] text-[#BFFF00]"
                >
                  <Reply className="w-3 h-3" />
                  Registra Risposta Ricevuta
                </button>
                <button
                  type="button"
                  onClick={handleOptOut}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#18181B] border border-[#27272A] text-[11px] text-[#EF4444]"
                >
                  <Ban className="w-3 h-3" />
                  Opt-Out / Sopprimi
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-mono uppercase text-[#A1A1AA] mb-1">
                  Prospect Destinatario
                </label>
                <select
                  value={selectedProspectId}
                  onChange={(e) => setSelectedProspectId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-[#0D0D10] border border-[#27272A] text-xs text-[#FAFAFA]"
                >
                  {prospects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.business_name} (
                      {p.business_email ||
                        p.business_phone ||
                        p.city ||
                        'Senza recapito diretto'}
                      )
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-[#A1A1AA] mb-1">
                  Canale di Contatto
                </label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as OutreachChannel)}
                  className="w-full h-10 px-3 rounded-lg bg-[#0D0D10] border border-[#27272A] text-xs text-[#FAFAFA]"
                >
                  <option value="email">Email Commerciale</option>
                  <option value="whatsapp">WhatsApp Business Cloud API</option>
                  <option value="instagram">Instagram (API / Assistito)</option>
                  <option value="manual">Contatto Manuale 1-to-1</option>
                </select>
              </div>
            </div>

            {/* Legal Basis & Permission Registration Box */}
            <div className="p-3.5 rounded-lg bg-[#0D0D10] border border-[#27272A] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-[#BFFF00]">
                  1. Base Giuridica & Permesso Canale (`OutreachComplianceService`)
                </span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleRegisterPermission}
                  className="px-3 py-1 rounded bg-[#18181B] border border-[#BFFF00] text-[#BFFF00] text-[11px] font-semibold hover:bg-[#BFFF00] hover:text-[#09090B]"
                >
                  Registra Autorizzazione Canale
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <select
                  value={legalBasis}
                  onChange={(e) => setLegalBasis(e.target.value as LegalBasisType)}
                  className="h-9 px-2.5 rounded bg-[#121214] border border-[#27272A] text-xs text-[#FAFAFA]"
                >
                  <option value="documented_b2b_legitimate_interest">
                    Legittimo Interesse B2B (Contatto Aziendale Pubblico)
                  </option>
                  <option value="explicit_consent">Consenso Esplicito Opt-In</option>
                  <option value="pre_contractual_request">Richiesta Pre-Contrattuale</option>
                  <option value="user_initiated_inbound">
                    Finestra 24h Avviata dall’Utente (WhatsApp / IG)
                  </option>
                </select>
                <input
                  type="text"
                  value={evidenceReference}
                  onChange={(e) => setEvidenceReference(e.target.value)}
                  placeholder="Nota evidenza consenso / fonte contatto..."
                  className="h-9 px-2.5 rounded bg-[#121214] border border-[#27272A] text-xs text-[#FAFAFA]"
                />
              </div>
            </div>

            {/* Execution Mode Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono uppercase text-[#A1A1AA] mb-1">
                  Modalità Operativa (Sez. 9.2 PRD)
                </label>
                <select
                  value={deliveryMode}
                  onChange={(e) => setDeliveryMode(e.target.value as OutreachDeliveryMode)}
                  className="w-full h-10 px-3 rounded-lg bg-[#0D0D10] border border-[#27272A] text-xs text-[#FAFAFA]"
                >
                  <option value="draft">Draft Mode (Salva solo bozza)</option>
                  <option value="approval">Approval Mode (Invia con approvazione Admin)</option>
                  <option value="automated">Automated Mode (Solo canali con permesso attivo)</option>
                </select>
              </div>

              <div className="flex items-end pb-2">
                <label className="inline-flex items-center gap-2 text-xs text-[#FAFAFA] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isHumanApproved}
                    onChange={(e) => setIsHumanApproved(e.target.checked)}
                    className="accent-[#BFFF00]"
                  />
                  <span>Confermo revisione umana e approvazione Admin per questo messaggio</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-[#A1A1AA] mb-1">
                Oggetto (Email)
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Proposta RIVO personalizzata per l'attività..."
                className="w-full h-10 px-3.5 rounded-lg bg-[#0D0D10] border border-[#27272A] text-xs text-[#FAFAFA]"
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <label className="block text-[11px] font-mono uppercase text-[#A1A1AA]">
                  Testo della Comunicazione *
                </label>

                <div className="flex flex-wrap items-center gap-1.5">
                  {selectedDemoUrl ? (
                    <a
                      href={selectedDemoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#0D0D10] border border-[#27272A] hover:border-[#BFFF00] text-[11px] text-[#FAFAFA]"
                    >
                      <ExternalLink className="w-3 h-3 text-[#BFFF00]" />
                      Apri Demo
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#0D0D10] border border-[#27272A] text-[11px] text-[#71717A] opacity-50">
                      <ExternalLink className="w-3 h-3" />
                      Apri Demo
                    </span>
                  )}

                  <button
                    type="button"
                    disabled={!selectedDemoUrl}
                    onClick={() => {
                      if (!selectedDemoUrl) return;
                      navigator.clipboard.writeText(selectedDemoUrl);
                      setCopiedDemoLink(true);
                      setTimeout(() => setCopiedDemoLink(false), 2000);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#0D0D10] border border-[#27272A] hover:border-[#BFFF00] text-[11px] text-[#FAFAFA] disabled:opacity-45 disabled:cursor-not-allowed"
                  >
                    {copiedDemoLink ? (
                      <>
                        <Check className="w-3 h-3 text-[#BFFF00]" />
                        Copiato
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copia Link Demo
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={!selectedProspect || !selectedDemoUrl || content.includes('/preview/')}
                    onClick={() => {
                      if (!selectedProspect || !selectedDemoUrl || content.includes('/preview/')) return;
                      const snippet = `Ho preparato anche un'anteprima interattiva RIVO dedicata a ${selectedProspect.business_name} (senza login né impegno): ${selectedDemoUrl}`;
                      setContent((prev) => (prev.trim() ? `${prev.trimEnd()}\n\n${snippet}` : snippet));
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#18181B] border border-[#BFFF00]/50 hover:border-[#BFFF00] text-[11px] font-medium text-[#BFFF00] disabled:opacity-45 disabled:cursor-not-allowed"
                  >
                    <Link2 className="w-3 h-3" />
                    Inserisci Link Demo nel Testo
                  </button>
                </div>
              </div>
              <textarea
                rows={7}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-3.5 rounded-lg bg-[#0D0D10] border border-[#27272A] text-xs text-[#FAFAFA] leading-relaxed"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#BFFF00] hover:bg-[#A8E600] text-[#09090B] text-xs font-bold uppercase tracking-wider disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {deliveryMode === 'draft'
                  ? 'Salva in Bozza'
                  : 'Verifica Compliance & Invia Comunicazione'}
              </button>
            </div>
          </form>

          {/* Inbound Reply Recorder */}
          {showReplyForm && (
            <form
              onSubmit={handleRecordInboundReply}
              className="bg-[#121214] border border-[#BFFF00] rounded-xl p-5 space-y-3"
            >
              <h3 className="text-xs font-bold uppercase text-[#BFFF00]">
                Registra Risposta Inbound dal Prospect
              </h3>
              <textarea
                rows={3}
                required
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Incolla il testo della risposta ricevuta via Email, WhatsApp o Instagram..."
                className="w-full p-3 rounded bg-[#0D0D10] border border-[#27272A] text-xs text-[#FAFAFA]"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={busy}
                  className="px-4 py-2 rounded bg-[#BFFF00] text-[#09090B] text-xs font-bold"
                >
                  Salva Risposta & Aggiorna Pipeline
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right: Recent Messages & Suppression List */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#121214] border border-[#27272A] rounded-xl p-5 space-y-3">
            <h2 className="text-xs font-mono uppercase text-[#A1A1AA]">
              Registro Comunicazioni & Stato Consegna ({messages.length})
            </h2>
            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {messages.length === 0 ? (
                <p className="text-xs text-[#71717A]">Nessuna comunicazione registrata.</p>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-lg bg-[#0D0D10] border border-[#27272A] space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#FAFAFA]">
                        {prospectNameById(m.prospect_id)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                          m.provider_status === 'sent' || m.provider_status === 'replied'
                            ? 'bg-[#BFFF00]/15 text-[#BFFF00]'
                            : 'bg-[#27272A] text-[#A1A1AA]'
                        }`}
                      >
                        {m.direction === 'inbound' ? 'RISPOSTA INBOUND' : m.provider_status}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-[#71717A]">
                      Canale: {m.channel.toUpperCase()} • Modalità: {m.delivery_mode} •{' '}
                      {new Date(m.created_at).toLocaleString('it-IT')}
                    </div>
                    {m.subject && <div className="text-[#FAFAFA] font-medium">{m.subject}</div>}
                    <p className="text-[#A1A1AA] line-clamp-3">{m.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-[#121214] border border-[#27272A] rounded-xl p-5 space-y-3">
            <h2 className="text-xs font-mono uppercase text-[#EF4444]">
              Suppression List & Opt-Out Attivi ({suppressions.length})
            </h2>
            <div className="space-y-2 max-h-[220px] overflow-y-auto">
              {suppressions.length === 0 ? (
                <p className="text-xs text-[#71717A]">Nessun contatto in lista di soppressione.</p>
              ) : (
                suppressions.map((s) => (
                  <div
                    key={s.id}
                    className="p-2.5 rounded bg-[#0D0D10] border border-[#27272A] flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono text-[#FAFAFA]">
                        {s.contact_identifier || prospectNameById(s.prospect_id)}
                      </span>
                      <div className="text-[10px] text-[#71717A]">{s.reason}</div>
                    </div>
                    <span className="text-[10px] font-mono uppercase text-[#EF4444]">
                      BLOCCATO
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OutreachCommunicationsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#09090B] text-[#A1A1AA] p-8 font-mono text-xs">
          CARICAMENTO CENTRO COMUNICAZIONI...
        </div>
      }
    >
      <OutreachCommunicationsContent />
    </Suspense>
  );
}
