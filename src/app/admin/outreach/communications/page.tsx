'use client';

import React, { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
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
  Sparkles,
  SkipForward,
  RotateCcw,
  CheckCircle2,
  Info,
  MessageSquare,
  MapPin,
  Search,
} from 'lucide-react';
import { InstagramIcon } from '@/components/brand-icons';
import {
  extractInstagramHandle,
  buildInstagramDmDeepLink,
  buildInstagramDmDraft,
} from '@/lib/outreach/instagram';
import { buildProspectDemoUrl } from '@/lib/outreach/preview';
import type {
  LegalBasisType,
  OutreachAIAnalysis,
  OutreachChannel,
  OutreachDeliveryMode,
  OutreachProspectRecord,
  PublicDigitalSignals,
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

type CommunicationProspect = Pick<
  OutreachProspectRecord,
  | 'id'
  | 'business_name'
  | 'category'
  | 'subcategory'
  | 'city'
  | 'business_email'
  | 'business_phone'
  | 'instagram_url'
  | 'website'
  | 'commercial_status'
> & {
  lead_score?: number;
  digital_signals?: PublicDigitalSignals | Record<string, unknown> | null;
  ai_analysis?: OutreachAIAnalysis | null;
};

interface ProspectPitchEntry {
  variants?: {
    A_professional?: { subject?: string; fullMessageBody?: string };
    B_informal?: { subject?: string; fullMessageBody?: string };
    C_consultative?: { subject?: string; fullMessageBody?: string };
  };
}

interface CommunicationsApiResponse {
  channels?: ChannelStatus[];
  messages?: MessageRecord[];
  suppressions?: SuppressionRecord[];
  prospects?: CommunicationProspect[];
  pitchByProspectId?: Record<string, ProspectPitchEntry>;
}

type ActiveTab = 'instagram_dm' | 'composer';
type InstagramQueueFilter = 'to_contact' | 'all' | 'sent';

function getLeadScoreBadgeClass(score?: number): string {
  if (typeof score !== 'number') {
    return 'bg-[#18181B] border-[#27272A] text-[#A1A1AA]';
  }
  if (score >= 80) {
    return 'bg-[#BFFF00]/15 border-[#BFFF00]/40 text-[#BFFF00]';
  }
  if (score >= 60) {
    return 'bg-[#22C55E]/15 border-[#22C55E]/40 text-[#22C55E]';
  }
  if (score >= 40) {
    return 'bg-[#F59E0B]/15 border-[#F59E0B]/40 text-[#F59E0B]';
  }
  return 'bg-[#18181B] border-[#27272A] text-[#A1A1AA]';
}

function OutreachCommunicationsContent() {
  const searchParams = useSearchParams();
  const initialProspectId = searchParams.get('prospectId') || '';
  const initialTab: ActiveTab =
    searchParams.get('tab') === 'instagram_dm' ? 'instagram_dm' : 'composer';

  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);
  const [channels, setChannels] = useState<ChannelStatus[]>([]);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [suppressions, setSuppressions] = useState<SuppressionRecord[]>([]);
  const [prospects, setProspects] = useState<CommunicationProspect[]>([]);
  const [pitchByProspectId, setPitchByProspectId] = useState<
    Record<string, ProspectPitchEntry>
  >({});

  const [selectedProspectId, setSelectedProspectId] = useState(initialProspectId);
  const [channel, setChannel] = useState<OutreachChannel>('email');
  const [deliveryMode, setDeliveryMode] = useState<OutreachDeliveryMode>('approval');
  const [isHumanApproved, setIsHumanApproved] = useState(true);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');

  // Instagram 1-Click DM Queue State
  const [igFilter, setIgFilter] = useState<InstagramQueueFilter>('to_contact');
  const [selectedIgProspectId, setSelectedIgProspectId] = useState(initialProspectId);
  const [editedDmByProspectId, setEditedDmByProspectId] = useState<Record<string, string>>({});
  const [copiedAndOpenedProspectId, setCopiedAndOpenedProspectId] = useState<string | null>(null);
  const [igDiscoveryBusy, setIgDiscoveryBusy] = useState(false);

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
  const [loadedProspect, setLoadedProspect] = useState<CommunicationProspect | null>(null);

  const applyCommunicationsPayload = useCallback(
    (json: CommunicationsApiResponse, options?: { syncInitialUrl?: boolean }) => {
      setChannels(json.channels || []);
      setMessages(json.messages || []);
      setSuppressions(json.suppressions || []);
      setPitchByProspectId(json.pitchByProspectId || {});

      if (!json.prospects) return;
      const list = json.prospects;
      setProspects(list);

      let urlProspectId = '';
      if (options?.syncInitialUrl && typeof window !== 'undefined') {
        const sp = new URLSearchParams(window.location.search);
        urlProspectId = sp.get('prospectId') || '';
        if (sp.get('tab') === 'instagram_dm') {
          setActiveTab('instagram_dm');
        }
      }

      setSelectedProspectId((prev) => prev || urlProspectId || list[0]?.id || '');

      const withIg = list.filter((p) => Boolean(extractInstagramHandle(p.instagram_url)));
      const sentIgIds = new Set(
        (json.messages || [])
          .filter(
            (m) =>
              m.channel === 'instagram' &&
              m.direction === 'outbound' &&
              m.provider_status === 'sent'
          )
          .map((m) => m.prospect_id)
      );
      const suppressedIds = new Set<string>(
        list.filter((p) => p.commercial_status === 'non_contattare').map((p) => p.id)
      );
      for (const s of json.suppressions || []) {
        if (s.channel === 'all' || s.channel === 'instagram') {
          suppressedIds.add(s.prospect_id);
        }
      }
      const firstUncontactedIg =
        withIg.find((p) => !sentIgIds.has(p.id) && !suppressedIds.has(p.id)) || withIg[0];

      const shouldSelectUrlIg =
        Boolean(options?.syncInitialUrl) &&
        Boolean(urlProspectId) &&
        withIg.some((p) => p.id === urlProspectId);

      if (
        shouldSelectUrlIg &&
        (sentIgIds.has(urlProspectId) || suppressedIds.has(urlProspectId))
      ) {
        setIgFilter('all');
      }

      setSelectedIgProspectId((prev) => {
        if (shouldSelectUrlIg) {
          return urlProspectId;
        }
        if (prev && withIg.some((p) => p.id === prev)) {
          return prev;
        }
        return firstUncontactedIg?.id || '';
      });
    },
    []
  );

  const loadCommunicationsData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/outreach/communications', { cache: 'no-store' });
      const json: CommunicationsApiResponse = await res.json();
      if (res.ok) {
        applyCommunicationsPayload(json);
      }
    } catch {
      // ignore
    }
  }, [applyCommunicationsPayload]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/outreach/communications', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: CommunicationsApiResponse | null) => {
        if (cancelled || !json) return;
        applyCommunicationsPayload(json, { syncInitialUrl: true });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [applyCommunicationsPayload]);

  // Load approved/selected pitch when prospect changes in Composer
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

  // Derived Instagram DM Queue datasets
  const sentIgByProspectId = useMemo(() => {
    const map = new Map<string, MessageRecord>();
    for (const m of messages) {
      if (
        m.channel === 'instagram' &&
        m.direction === 'outbound' &&
        m.provider_status === 'sent' &&
        !map.has(m.prospect_id)
      ) {
        map.set(m.prospect_id, m);
      }
    }
    return map;
  }, [messages]);

  const suppressedIgProspectIds = useMemo(() => {
    const ids = new Set<string>();
    for (const p of prospects) {
      if (p.commercial_status === 'non_contattare') {
        ids.add(p.id);
      }
    }
    for (const s of suppressions) {
      if (s.channel === 'all' || s.channel === 'instagram') {
        ids.add(s.prospect_id);
      }
    }
    return ids;
  }, [prospects, suppressions]);

  const withIgProspects = useMemo(
    () => prospects.filter((p) => Boolean(extractInstagramHandle(p.instagram_url))),
    [prospects]
  );

  const toContactProspects = useMemo(
    () =>
      withIgProspects.filter(
        (p) => !sentIgByProspectId.has(p.id) && !suppressedIgProspectIds.has(p.id)
      ),
    [withIgProspects, sentIgByProspectId, suppressedIgProspectIds]
  );

  const alreadySentProspects = useMemo(
    () => withIgProspects.filter((p) => sentIgByProspectId.has(p.id)),
    [withIgProspects, sentIgByProspectId]
  );

  const prospectsWithoutIg = useMemo(() => {
    const list = prospects.filter(
      (p) => !extractInstagramHandle(p.instagram_url) && !suppressedIgProspectIds.has(p.id)
    );
    if (!initialProspectId) return list;
    const requestedIdx = list.findIndex((p) => p.id === initialProspectId);
    if (requestedIdx <= 0) return list;
    const requested = list[requestedIdx];
    return [requested, ...list.slice(0, requestedIdx), ...list.slice(requestedIdx + 1)];
  }, [prospects, suppressedIgProspectIds, initialProspectId]);

  const toContactCount = toContactProspects.length;
  const withIgCount = withIgProspects.length;
  const alreadySentCount = alreadySentProspects.length;

  const filteredIgProspects = useMemo(() => {
    if (igFilter === 'to_contact') return toContactProspects;
    if (igFilter === 'sent') return alreadySentProspects;
    return withIgProspects;
  }, [igFilter, toContactProspects, alreadySentProspects, withIgProspects]);

  const activeIgProspect = useMemo(
    () =>
      filteredIgProspects.find((p) => p.id === selectedIgProspectId) ||
      filteredIgProspects[0] ||
      null,
    [filteredIgProspects, selectedIgProspectId]
  );

  const getDefaultDmForProspect = useCallback(
    (prospect: CommunicationProspect): string => {
      const demoUrl = buildProspectDemoUrl(prospect.business_name, prospect.id);
      const informalBody =
        pitchByProspectId[prospect.id]?.variants?.B_informal?.fullMessageBody?.trim() || '';

      if (informalBody) {
        if (informalBody.includes(demoUrl) || informalBody.includes('/preview/')) {
          return informalBody;
        }
        return `${informalBody}\n\nDemo interattiva RIVO per ${prospect.business_name}: ${demoUrl}`;
      }

      return buildInstagramDmDraft(
        {
          id: prospect.id,
          business_name: prospect.business_name,
          category: prospect.category,
          subcategory: prospect.subcategory,
          city: prospect.city,
          website: prospect.website,
          ai_analysis: prospect.ai_analysis ?? null,
        },
        demoUrl
      );
    },
    [pitchByProspectId]
  );

  const activeIgDefaultDm = useMemo(
    () => (activeIgProspect ? getDefaultDmForProspect(activeIgProspect) : ''),
    [activeIgProspect, getDefaultDmForProspect]
  );

  const dmDraft = activeIgProspect
    ? (editedDmByProspectId[activeIgProspect.id] ?? activeIgDefaultDm)
    : '';

  const activeIgHasCustomPitch = Boolean(
    activeIgProspect &&
      pitchByProspectId[activeIgProspect.id]?.variants?.B_informal?.fullMessageBody?.trim()
  );
  const copiedAndOpened = Boolean(
    activeIgProspect && copiedAndOpenedProspectId === activeIgProspect.id
  );
  const activeIgHandle = activeIgProspect
    ? extractInstagramHandle(activeIgProspect.instagram_url)
    : null;
  const activeIgDemoUrl = activeIgProspect
    ? buildProspectDemoUrl(activeIgProspect.business_name, activeIgProspect.id)
    : null;
  const activeIgSentMsg = activeIgProspect
    ? sentIgByProspectId.get(activeIgProspect.id) || null
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

  const handleOptOut = async (targetProspectId?: string) => {
    const pid = targetProspectId || selectedProspectId;
    if (!pid) return;
    if (
      !window.confirm(
        'Confermi l’inserimento immediato di questo prospect nella Suppression List (Non contattare)?'
      )
    ) {
      return;
    }

    const nextIgProspect =
      activeIgProspect?.id === pid
        ? filteredIgProspects.find((p) => p.id !== pid) || null
        : null;

    setBusy(true);
    try {
      const res = await fetch('/api/admin/outreach/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record_opt_out',
          prospect_id: pid,
          channel: 'all',
          reason: 'Opt-out registrato manualmente da Admin',
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Errore opt-out');

      if (activeIgProspect?.id === pid) {
        setCopiedAndOpenedProspectId(null);
        setSelectedIgProspectId(nextIgProspect?.id || '');
      }

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

  const handleFindInstagramBatch = async () => {
    const targetIds = prospectsWithoutIg.slice(0, 10).map((p) => p.id);
    if (targetIds.length === 0) return;
    setIgDiscoveryBusy(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/outreach/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'find_instagram',
          prospect_ids: targetIds,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || 'Errore durante la ricerca profili Instagram AI');
      }
      const foundCount =
        typeof json.foundCount === 'number'
          ? json.foundCount
          : typeof json.updatedCount === 'number'
          ? json.updatedCount
          : null;
      setFeedback({
        type: 'ok',
        text:
          foundCount !== null
            ? `Ricerca Instagram AI completata: individuati ${foundCount} profili su ${targetIds.length} prospect analizzati.`
            : `Ricerca Instagram AI completata su ${targetIds.length} prospect senza profilo.`,
      });
      await loadCommunicationsData();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Errore ricerca Instagram AI',
      });
    } finally {
      setIgDiscoveryBusy(false);
    }
  };

  const handleCopyAndOpenInstagramDm = () => {
    if (!activeIgProspect || !dmDraft.trim()) return;
    const dmDeepLink = buildInstagramDmDeepLink(activeIgProspect.instagram_url);
    if (!dmDeepLink) {
      setFeedback({
        type: 'err',
        text: 'Handle Instagram non valido per costruire il link diretto ig.me/m/.',
      });
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(dmDraft).catch(() => {});
    }
    window.open(dmDeepLink, '_blank', 'noopener,noreferrer');
    setCopiedAndOpenedProspectId(activeIgProspect.id);
    setFeedback({
      type: 'ok',
      text: `DM copiato negli appunti e chat ig.me/m/@${activeIgHandle || 'profilo'} aperta. Dopo l’invio su Instagram clicca "2. Conferma DM Inviato & Prossimo".`,
    });
  };

  const handleConfirmIgDmSent = async () => {
    if (!activeIgProspect || !dmDraft.trim()) return;
    const sentProspectId = activeIgProspect.id;
    const sentBusinessName = activeIgProspect.business_name;

    const currentIdx = toContactProspects.findIndex((p) => p.id === sentProspectId);
    const remainingQueue = toContactProspects.filter((p) => p.id !== sentProspectId);
    const nextTarget =
      (currentIdx >= 0
        ? toContactProspects.slice(currentIdx + 1).find((p) => p.id !== sentProspectId)
        : null) ||
      remainingQueue[0] ||
      null;

    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/outreach/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'log_assisted_instagram_dm',
          prospect_id: sentProspectId,
          content: dmDraft,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || 'Errore registrazione DM Instagram inviato');
      }

      setCopiedAndOpenedProspectId(null);
      setEditedDmByProspectId((prev) => {
        const next = { ...prev };
        delete next[sentProspectId];
        return next;
      });

      if (nextTarget) {
        setSelectedIgProspectId(nextTarget.id);
      } else if (igFilter === 'to_contact') {
        setSelectedIgProspectId('');
      }

      setFeedback({
        type: 'ok',
        text: nextTarget
          ? `DM Instagram registrato per ${sentBusinessName}! Prossimo prospect pronto: ${nextTarget.business_name}.`
          : `DM Instagram registrato per ${sentBusinessName}! Hai completato tutti i prospect pronti in coda.`,
      });
      await loadCommunicationsData();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Errore registrazione DM Instagram',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleSkipIgProspect = () => {
    if (!activeIgProspect || filteredIgProspects.length <= 1) return;
    const idx = filteredIgProspects.findIndex((p) => p.id === activeIgProspect.id);
    const next = filteredIgProspects[(idx + 1) % filteredIgProspects.length];
    if (!next) return;
    setSelectedIgProspectId(next.id);
    setCopiedAndOpenedProspectId(null);
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
          onClick={() => loadCommunicationsData()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#121214] border border-[#27272A] hover:border-[#BFFF00]/50 text-xs text-[#FAFAFA] self-start lg:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Aggiorna
        </button>
      </div>

      {/* Top Segmented Tab Switcher */}
      <div className="inline-flex flex-wrap items-center gap-2 p-1.5 rounded-xl bg-[#121214] border border-[#27272A]">
        <button
          type="button"
          onClick={() => setActiveTab('instagram_dm')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'instagram_dm'
              ? 'bg-[#BFFF00] text-[#09090B] shadow-sm'
              : 'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#18181B]'
          }`}
        >
          <InstagramIcon className="w-3.5 h-3.5" />
          <span>Coda DM Instagram (1-Click)</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'instagram_dm'
                ? 'bg-[#09090B]/15 text-[#09090B]'
                : 'bg-[#18181B] border border-[#27272A] text-[#BFFF00]'
            }`}
          >
            {toContactCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('composer')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'composer'
              ? 'bg-[#BFFF00] text-[#09090B] shadow-sm'
              : 'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#18181B]'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Composer Multicanale (Email / WhatsApp / Manuale)</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            feedback.type === 'ok'
              ? 'bg-[#121214] border-[#BFFF00]/50 text-[#FAFAFA]'
              : 'bg-[#EF4444]/10 border-[#EF4444]/40 text-[#EF4444]'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'ok' ? (
              <ShieldCheck className="w-4 h-4 text-[#BFFF00] shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-[#EF4444] shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-[#A1A1AA] hover:text-[#FAFAFA] shrink-0"
          >
            Chiudi
          </button>
        </div>
      )}

      {activeTab === 'instagram_dm' ? (
        <div className="space-y-5">
          {/* Compliance Info Banner */}
          <div className="bg-[#121214] border border-[#BFFF00]/30 rounded-xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#BFFF00]/10 border border-[#BFFF00]/30 flex items-center justify-center shrink-0">
              <Info className="w-4 h-4 text-[#BFFF00]" />
            </div>
            <div className="space-y-1">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#BFFF00]">
                Modalità Assistita Ufficiale — Zero Rischio Ban Meta
              </div>
              <p className="text-xs text-[#A1A1AA] leading-relaxed">
                Meta non consente l&apos;invio API automatico di DM a freddo: qui trovi i profili Instagram individuati con messaggio personalizzato AI e link demo RIVO + Attività. In 1 clic copi il DM e apri la chat ig.me/m/@handle pronta per Incolla + Invio.
              </p>
            </div>
          </div>

          {/* Filter Bar + AI Instagram Finder */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-[#121214] border border-[#27272A] rounded-xl p-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIgFilter('to_contact')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  igFilter === 'to_contact'
                    ? 'bg-[#BFFF00]/15 border-[#BFFF00] text-[#BFFF00]'
                    : 'bg-[#0D0D10] border-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA]'
                }`}
              >
                Da contattare ({toContactCount})
              </button>
              <button
                type="button"
                onClick={() => setIgFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  igFilter === 'all'
                    ? 'bg-[#BFFF00]/15 border-[#BFFF00] text-[#BFFF00]'
                    : 'bg-[#0D0D10] border-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA]'
                }`}
              >
                Tutti con Instagram ({withIgCount})
              </button>
              <button
                type="button"
                onClick={() => setIgFilter('sent')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  igFilter === 'sent'
                    ? 'bg-[#BFFF00]/15 border-[#BFFF00] text-[#BFFF00]'
                    : 'bg-[#0D0D10] border-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA]'
                }`}
              >
                Già contattati su IG ({alreadySentCount})
              </button>
            </div>

            <button
              type="button"
              disabled={igDiscoveryBusy || busy || prospectsWithoutIg.length === 0}
              onClick={handleFindInstagramBatch}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-[#18181B] border border-[#BFFF00]/50 hover:border-[#BFFF00] text-xs font-semibold text-[#BFFF00] disabled:opacity-45 disabled:cursor-not-allowed transition-colors"
            >
              <Search className={`w-3.5 h-3.5 ${igDiscoveryBusy ? 'animate-pulse' : ''}`} />
              <span>
                {igDiscoveryBusy
                  ? 'Ricerca Instagram AI in corso...'
                  : `Cerca Instagram AI sui Prospect senza IG (${prospectsWithoutIg.length})`}
              </span>
            </button>
          </div>

          {/* Split 2-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Queue List */}
            <div className="lg:col-span-5 bg-[#121214] border border-[#27272A] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#27272A] pb-2.5">
                <h2 className="text-xs font-mono uppercase text-[#A1A1AA]">
                  Coda Profili Instagram ({filteredIgProspects.length})
                </h2>
                <span className="text-[10px] font-mono text-[#71717A]">
                  1-Click DM Workflow
                </span>
              </div>

              {filteredIgProspects.length === 0 ? (
                <div className="p-6 text-center space-y-3 rounded-lg bg-[#0D0D10] border border-[#27272A]">
                  <InstagramIcon className="w-6 h-6 text-[#71717A] mx-auto" />
                  <p className="text-xs text-[#A1A1AA]">
                    {igFilter === 'to_contact'
                      ? 'Nessun prospect con Instagram in attesa di contatto in questa lista.'
                      : igFilter === 'sent'
                      ? 'Nessun DM Instagram ancora registrato come inviato.'
                      : 'Nessun prospect ha ancora un profilo Instagram salvato.'}
                  </p>
                  {prospectsWithoutIg.length > 0 && (
                    <button
                      type="button"
                      disabled={igDiscoveryBusy}
                      onClick={handleFindInstagramBatch}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181B] border border-[#BFFF00]/50 text-[11px] font-semibold text-[#BFFF00]"
                    >
                      <Sparkles className="w-3 h-3" />
                      Avvia Ricerca Instagram AI
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {filteredIgProspects.map((p) => {
                    const handle = extractInstagramHandle(p.instagram_url);
                    const isSelected = activeIgProspect?.id === p.id;
                    const isSent = sentIgByProspectId.has(p.id);
                    const isSuppressed = suppressedIgProspectIds.has(p.id);

                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedIgProspectId(p.id);
                          setCopiedAndOpenedProspectId(null);
                        }}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all space-y-2 ${
                          isSelected
                            ? 'bg-[#18181B] border-[#BFFF00] shadow-[0_0_0_1px_rgba(191,255,0,0.25)]'
                            : 'bg-[#0D0D10] border-[#27272A] hover:border-[#3F3F46]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-[#FAFAFA] truncate">
                              {p.business_name}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-[#A1A1AA] mt-0.5">
                              <MapPin className="w-3 h-3 text-[#71717A] shrink-0" />
                              <span className="truncate">
                                {p.city || p.subcategory || p.category}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded border text-[10px] font-mono font-semibold shrink-0 ${getLeadScoreBadgeClass(
                              p.lead_score
                            )}`}
                          >
                            {typeof p.lead_score === 'number'
                              ? `Score ${p.lead_score}`
                              : 'Score N/D'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#BFFF00]">
                            <InstagramIcon className="w-3 h-3" />
                            @{handle}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {isSent && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#22C55E]/15 border border-[#22C55E]/40 text-[10px] font-mono uppercase text-[#22C55E]">
                                <CheckCircle2 className="w-3 h-3" />
                                DM Inviato
                              </span>
                            )}
                            {isSuppressed && (
                              <span className="px-2 py-0.5 rounded bg-[#EF4444]/15 border border-[#EF4444]/40 text-[10px] font-mono uppercase text-[#EF4444]">
                                Opt-Out
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Active 1-Click DM Card */}
            <div className="lg:col-span-7">
              {!activeIgProspect || !activeIgHandle ? (
                <div className="bg-[#121214] border border-[#27272A] rounded-xl p-10 text-center space-y-3">
                  <MessageSquare className="w-8 h-8 text-[#71717A] mx-auto" />
                  <h3 className="text-sm font-semibold text-[#FAFAFA]">
                    Seleziona un prospect con Instagram dalla coda
                  </h3>
                  <p className="text-xs text-[#A1A1AA] max-w-md mx-auto">
                    Qui compariranno il profilo @handle, il link alla Demo RIVO + Attività e il messaggio personalizzato pronto per essere copiato e inviato su Instagram Direct in 1 clic.
                  </p>
                </div>
              ) : (
                <div className="bg-[#121214] border border-[#27272A] rounded-xl p-6 space-y-5">
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-[#27272A] pb-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-[#FAFAFA]">
                          {activeIgProspect.business_name}
                        </h2>
                        <span
                          className={`px-2 py-0.5 rounded border text-[10px] font-mono font-semibold ${getLeadScoreBadgeClass(
                            activeIgProspect.lead_score
                          )}`}
                        >
                          {typeof activeIgProspect.lead_score === 'number'
                            ? `Lead Score ${activeIgProspect.lead_score}/100`
                            : 'Lead Score N/D'}
                        </span>
                        {activeIgSentMsg && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#22C55E]/15 border border-[#22C55E]/40 text-[10px] font-mono uppercase text-[#22C55E]">
                            <CheckCircle2 className="w-3 h-3" />
                            DM già inviato (
                            {new Date(
                              activeIgSentMsg.sent_at || activeIgSentMsg.created_at
                            ).toLocaleDateString('it-IT')}
                            )
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-[#A1A1AA]">
                        {[
                          activeIgProspect.city,
                          activeIgProspect.subcategory || activeIgProspect.category,
                        ]
                          .filter(Boolean)
                          .join(' • ') || 'Attività Locale'}
                      </div>

                      <div className="pt-0.5">
                        <a
                          href={`https://www.instagram.com/${activeIgHandle}/`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#BFFF00] hover:underline"
                        >
                          <InstagramIcon className="w-3.5 h-3.5" />
                          @{activeIgHandle}
                        </a>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={`https://www.instagram.com/${activeIgHandle}/`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181B] border border-[#27272A] hover:border-[#BFFF00]/60 text-xs text-[#FAFAFA]"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-[#BFFF00]" />
                        Apri Profilo
                      </a>
                      {activeIgDemoUrl && (
                        <a
                          href={activeIgDemoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181B] border border-[#BFFF00]/40 hover:border-[#BFFF00] text-xs font-medium text-[#BFFF00]"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Apri Demo RIVO + Attività
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Editable DM Draft */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor="instagram-dm-draft"
                          className="text-[11px] font-mono uppercase text-[#A1A1AA]"
                        >
                          Testo DM Instagram Personalizzato
                        </label>
                        <span className="px-2 py-0.5 rounded bg-[#18181B] border border-[#27272A] text-[10px] font-mono text-[#BFFF00]">
                          {activeIgHasCustomPitch
                            ? 'Pitch AI Informale (Variante B)'
                            : 'Bozza Smart IG + Demo RIVO'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`text-[11px] font-mono ${
                            dmDraft.length > 950 ? 'text-[#F59E0B]' : 'text-[#71717A]'
                          }`}
                        >
                          {dmDraft.length} caratteri
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditedDmByProspectId((prev) => {
                              const next = { ...prev };
                              delete next[activeIgProspect.id];
                              return next;
                            });
                            setCopiedAndOpenedProspectId(null);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#18181B] border border-[#27272A] hover:border-[#BFFF00]/60 text-[11px] text-[#FAFAFA]"
                        >
                          <RotateCcw className="w-3 h-3 text-[#BFFF00]" />
                          Ripristina DM AI
                        </button>
                      </div>
                    </div>

                    <textarea
                      id="instagram-dm-draft"
                      rows={7}
                      value={dmDraft}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditedDmByProspectId((prev) => ({
                          ...prev,
                          [activeIgProspect.id]: val,
                        }));
                      }}
                      className="w-full p-3.5 rounded-xl bg-[#0D0D10] border border-[#27272A] focus:border-[#BFFF00] focus:outline-none text-xs text-[#FAFAFA] leading-relaxed"
                    />
                  </div>

                  {/* Two Big Sequential 1-Click Action Buttons */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      disabled={busy || !dmDraft.trim()}
                      onClick={handleCopyAndOpenInstagramDm}
                      className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 ${
                        copiedAndOpened
                          ? 'bg-[#18181B] border-2 border-[#22C55E] text-[#22C55E]'
                          : 'bg-[#BFFF00] hover:bg-[#A8E600] text-[#09090B]'
                      }`}
                    >
                      {copiedAndOpened ? (
                        <Check className="w-4 h-4 shrink-0" />
                      ) : (
                        <Copy className="w-4 h-4 shrink-0" />
                      )}
                      <span>1. Copia DM & Apri Chat Instagram</span>
                    </button>

                    <button
                      type="button"
                      disabled={busy || !dmDraft.trim()}
                      onClick={handleConfirmIgDmSent}
                      className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 ${
                        copiedAndOpened
                          ? 'bg-[#BFFF00] hover:bg-[#A8E600] text-[#09090B] ring-2 ring-[#BFFF00]/40 shadow-[0_0_24px_rgba(191,255,0,0.22)]'
                          : 'bg-[#18181B] border border-[#27272A] hover:border-[#BFFF00]/60 text-[#FAFAFA]'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>2. Conferma DM Inviato & Prossimo →</span>
                    </button>
                  </div>

                  {/* Quick Secondary Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#27272A] pt-4">
                    <button
                      type="button"
                      disabled={busy || filteredIgProspects.length <= 1}
                      onClick={handleSkipIgProspect}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181B] border border-[#27272A] hover:border-[#3F3F46] text-xs text-[#A1A1AA] hover:text-[#FAFAFA] disabled:opacity-40"
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                      Salta →
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleOptOut(activeIgProspect.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181B] border border-[#27272A] hover:border-[#EF4444]/60 text-xs text-[#EF4444] disabled:opacity-40"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      Opt-Out / Non contattare
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
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
                      onClick={() => handleOptOut(selectedProspectId)}
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
      )}
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
