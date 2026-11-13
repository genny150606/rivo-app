'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  Sparkles,
  Globe,
  Phone,
  Mail,
  ExternalLink,
  X,
  CheckCircle2,
  GitMerge,
  Trash2,
  UserCheck,
  Building2,
  Send,
  RefreshCw,
  Copy,
  Check,
  Eye,
  Image as ImageIcon,
  Upload,
} from 'lucide-react';
import { InstagramIcon } from '@/components/brand-icons';
import {
  OUTREACH_DISCOVERY_CATEGORIES,
  OUTREACH_PIPELINE_STAGES,
  type OutreachProspectRecord,
  type OutreachCommercialStatus,
} from '@/lib/outreach/types';
import { buildProspectDemoUrl, encodePreviewSlug } from '@/lib/outreach/preview';
import {
  buildInstagramDmDeepLink,
  extractInstagramHandle,
} from '@/lib/outreach/instagram';
import { computeLogoVersionTag, getBusinessInitials } from '@/lib/outreach/logo-resolver';

export default function OutreachProspectsPage() {
  const [prospects, setProspects] = useState<OutreachProspectRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [minScore, setMinScore] = useState<string>('');
  const [sortBy, setSortBy] = useState<'lead_score' | 'created_at' | 'business_name'>('lead_score');
  const [page, setPage] = useState(1);

  // Selection & Side Drawer
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeProspect, setActiveProspect] = useState<OutreachProspectRecord | null>(null);
  const [activeDetail, setActiveDetail] = useState<{
    generations: Array<{
      id: string;
      generation_type: string;
      generated_content: Record<string, unknown>;
      approved: boolean;
      created_at: string;
    }>;
    messages: Array<{
      id: string;
      channel: string;
      direction: string;
      subject: string | null;
      content: string;
      provider_status: string;
      created_at: string;
    }>;
    duplicateCandidates: Array<{
      id: string;
      business_name: string;
      city: string | null;
    }>;
    logs?: Array<{
      id: string;
      action: string;
      metadata?: Record<string, unknown> | null;
      created_at: string;
    }>;
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [copiedDemoUrl, setCopiedDemoUrl] = useState(false);

  // Actions state
  const [actionBusy, setActionBusy] = useState(false);
  const [bulkFindingIg, setBulkFindingIg] = useState(false);
  const [findingIgId, setFindingIgId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [customLogoDraft, setCustomLogoDraft] = useState('');
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);
  const [discoveringLogo, setDiscoveringLogo] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [enrichingWebsiteLogo, setEnrichingWebsiteLogo] = useState(false);
  const [logoFeedback, setLogoFeedback] = useState<{
    type: 'success' | 'info' | 'error';
    message: string;
  } | null>(null);
  const logoFileInputRef = useRef<HTMLInputElement | null>(null);

  // Convert to Client Modal
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertOwnerFirstName, setConvertOwnerFirstName] = useState('');
  const [convertOwnerLastName, setConvertOwnerLastName] = useState('');
  const [convertOwnerEmail, setConvertOwnerEmail] = useState('');
  const [convertOwnerPassword, setConvertOwnerPassword] = useState('Rivo2026!');

  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (category) params.set('category', category);
    if (statusFilter) params.set('status', statusFilter);
    if (minScore !== '') params.set('minScore', minScore);
    params.set('sortBy', sortBy);
    params.set('sortDir', 'desc');
    params.set('page', String(page));
    params.set('pageSize', '25');
    return params.toString();
  }, [q, category, statusFilter, minScore, sortBy, page]);

  const fetchProspects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/outreach/prospects?${buildQueryString()}`, {
        cache: 'no-store',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Impossibile caricare i prospect');
      setProspects(json.prospects || []);
      setTotal(json.totalCount || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore caricamento prospect');
    } finally {
      setLoading(false);
    }
  }, [buildQueryString]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/outreach/prospects?${buildQueryString()}`, { cache: 'no-store' })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Impossibile caricare i prospect');
        return json;
      })
      .then((json) => {
        if (cancelled) return;
        setProspects(json.prospects || []);
        setTotal(json.totalCount || 0);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Errore caricamento prospect');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [buildQueryString]);

  const openProspectDetail = async (p: OutreachProspectRecord) => {
    setActiveProspect(p);
    setNotesDraft(p.admin_notes || '');
    setCustomLogoDraft(p.digital_signals?.customLogoUrl || '');
    setFailedLogoUrl(null);
    setLogoFeedback(null);
    setConvertOwnerFirstName(p.business_name);
    setConvertOwnerLastName('Titolare');
    setConvertOwnerEmail(p.business_email || '');
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/outreach/prospects?id=${p.id}`, { cache: 'no-store' });
      const json = await res.json();
      if (res.ok) {
        setActiveProspect(json.prospect);
        setNotesDraft(json.prospect?.admin_notes || '');
        setCustomLogoDraft(json.prospect?.digital_signals?.customLogoUrl || '');
        setActiveDetail({
          generations: json.generations || [],
          messages: json.messages || [],
          duplicateCandidates: json.duplicateCandidates || [],
          logs: json.logs || [],
        });
      }
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStageChange = async (prospectId: string, nextStage: OutreachCommercialStatus) => {
    setActionBusy(true);
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
      if (!res.ok) throw new Error(json.error || 'Errore aggiornamento stato');
      setFeedback(`Stato aggiornato a: ${nextStage}`);
      if (activeProspect?.id === prospectId) {
        setActiveProspect({ ...activeProspect, commercial_status: nextStage });
      }
      fetchProspects();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Errore aggiornamento');
    } finally {
      setActionBusy(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!activeProspect) return;
    setActionBusy(true);
    try {
      const res = await fetch('/api/admin/outreach/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_prospect',
          prospect_id: activeProspect.id,
          admin_notes: notesDraft,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Errore salvataggio note');
      setActiveProspect(json.prospect);
      setFeedback('Note commerciali salvate.');
      fetchProspects();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Errore salvataggio note');
    } finally {
      setActionBusy(false);
    }
  };

  const applyUpdatedProspectLogoState = (updatedProspect: OutreachProspectRecord) => {
    setActiveProspect(updatedProspect);
    setCustomLogoDraft(updatedProspect.digital_signals?.customLogoUrl || '');
    setFailedLogoUrl(null);
    setProspects((prev) =>
      prev.map((item) => (item.id === updatedProspect.id ? updatedProspect : item))
    );
  };

  const handleSaveCustomLogo = async () => {
    if (!activeProspect) return;
    setActionBusy(true);
    setLogoFeedback(null);
    try {
      const res = await fetch('/api/admin/outreach/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_prospect',
          prospect_id: activeProspect.id,
          custom_logo_url: customLogoDraft,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Errore salvataggio logo');
      const updatedProspect = json.prospect as OutreachProspectRecord;
      applyUpdatedProspectLogoState(updatedProspect);
      const msg = customLogoDraft.trim()
        ? 'Logo personalizzato salvato per il co-branding demo.'
        : 'Logo personalizzato rimosso.';
      setLogoFeedback({ type: 'success', message: msg });
      setFeedback(msg);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore salvataggio logo';
      setLogoFeedback({ type: 'error', message: msg });
      setFeedback(msg);
    } finally {
      setActionBusy(false);
    }
  };

  const handleEnrichWebsiteLogo = async () => {
    if (!activeProspect || !activeProspect.website) return;
    setActionBusy(true);
    setEnrichingWebsiteLogo(true);
    setLogoFeedback(null);
    try {
      const res = await fetch('/api/admin/outreach/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'enrich_website',
          prospect_id: activeProspect.id,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Errore rilevamento sito web');
      const updatedProspect = json.prospect as OutreachProspectRecord;
      applyUpdatedProspectLogoState(updatedProspect);
      const resolvedLogo =
        updatedProspect.digital_signals?.customLogoUrl || updatedProspect.digital_signals?.logoUrl;
      const msg = resolvedLogo
        ? 'Metadati e logo rilevati dal sito web.'
        : 'Metadati sito aggiornati (nessun logo trovato nel HTML).';
      setLogoFeedback({ type: resolvedLogo ? 'success' : 'info', message: msg });
      setFeedback(msg);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore rilevamento sito web';
      setLogoFeedback({ type: 'error', message: msg });
      setFeedback(msg);
    } finally {
      setEnrichingWebsiteLogo(false);
      setActionBusy(false);
    }
  };

  const handleDiscoverLogo = async () => {
    if (!activeProspect) return;
    setActionBusy(true);
    setDiscoveringLogo(true);
    setLogoFeedback(null);
    try {
      const res = await fetch('/api/admin/outreach/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'discover_logo',
          prospect_id: activeProspect.id,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Errore ricerca automatica logo');
      const updatedProspect = json.prospect as OutreachProspectRecord;
      applyUpdatedProspectLogoState(updatedProspect);
      if (json.found && json.logoUrl) {
        const sourceSuffix = json.logoSource ? ` (${json.logoSource})` : '';
        const msg = `Logo ufficiale rilevato e salvato${sourceSuffix}.`;
        setLogoFeedback({ type: 'success', message: msg });
        setFeedback(msg);
      } else {
        const msg =
          'Nessun logo ufficiale trovato online. Puoi incollare un URL o caricare un file.';
        setLogoFeedback({ type: 'info', message: msg });
        setFeedback(msg);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore ricerca automatica logo';
      setLogoFeedback({ type: 'error', message: msg });
      setFeedback(msg);
    } finally {
      setDiscoveringLogo(false);
      setActionBusy(false);
    }
  };

  const handleUploadLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !activeProspect) return;

    if (file.size > 5 * 1024 * 1024) {
      const msg = 'Il file è troppo grande. Dimensione massima 5MB.';
      setLogoFeedback({ type: 'error', message: msg });
      setFeedback(msg);
      return;
    }

    setActionBusy(true);
    setUploadingLogo(true);
    setLogoFeedback(null);
    try {
      const formData = new FormData();
      formData.append('action', 'upload_prospect_logo');
      formData.append('prospect_id', activeProspect.id);
      formData.append('file', file);

      const res = await fetch('/api/admin/outreach/prospects', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Errore upload file logo');
      const updatedProspect = json.prospect as OutreachProspectRecord;
      applyUpdatedProspectLogoState(updatedProspect);
      const msg = 'File logo caricato e salvato per il co-branding demo.';
      setLogoFeedback({ type: 'success', message: msg });
      setFeedback(msg);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore upload file logo';
      setLogoFeedback({ type: 'error', message: msg });
      setFeedback(msg);
    } finally {
      setUploadingLogo(false);
      setActionBusy(false);
    }
  };

  const handleRunAIAnalysis = async (prospectId: string) => {
    setActionBusy(true);
    setFeedback('Analisi AI Business Intelligence e calcolo Lead Score in corso...');
    try {
      const res = await fetch('/api/admin/outreach/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          prospect_id: prospectId,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Errore durante analisi AI');
      setFeedback(
        `Analisi AI completata! Punteggio Lead: ${json.analysis.totalLeadScore}/100.`
      );
      await openProspectDetail(json.prospect);
      fetchProspects();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Errore analisi AI');
    } finally {
      setActionBusy(false);
    }
  };

  const handleBulkFindInstagram = async () => {
    const targetIds = selectedIds.slice(0, 15);
    if (targetIds.length === 0) return;
    setBulkFindingIg(true);
    setFeedback(
      `Ricerca Instagram AI in corso su ${targetIds.length} prospect selezionati...`
    );
    try {
      const res = await fetch('/api/admin/outreach/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'find_instagram',
          prospect_ids: targetIds,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Errore ricerca Instagram AI');

      const foundCount =
        typeof json.foundCount === 'number'
          ? json.foundCount
          : typeof json.discoveredCount === 'number'
          ? json.discoveredCount
          : typeof json.job?.result?.foundCount === 'number'
          ? json.job.result.foundCount
          : Array.isArray(json.results)
          ? json.results.filter(
              (r: { instagramUrl?: string | null; found?: boolean }) =>
                Boolean(r?.instagramUrl || r?.found)
            ).length
          : Array.isArray(json.updatedProspects)
          ? json.updatedProspects.length
          : 0;
      const checkedCount =
        typeof json.checkedCount === 'number'
          ? json.checkedCount
          : typeof json.job?.result?.checkedCount === 'number'
          ? json.job.result.checkedCount
          : targetIds.length;

      setFeedback(
        `Ricerca Instagram AI completata: ${foundCount} / ${checkedCount} profili trovati.`
      );
      await fetchProspects();
      if (activeProspect && targetIds.includes(activeProspect.id)) {
        await openProspectDetail(activeProspect);
      }
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Errore ricerca Instagram AI');
    } finally {
      setBulkFindingIg(false);
    }
  };

  const handleFindInstagramForActive = async () => {
    if (!activeProspect) return;
    const targetId = activeProspect.id;
    setFindingIgId(targetId);
    setFeedback('Ricerca profilo Instagram pubblico con AI in corso...');
    try {
      const res = await fetch('/api/admin/outreach/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'find_instagram',
          prospect_id: targetId,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Errore ricerca Instagram AI');

      const updatedList = Array.isArray(json.updatedProspects)
        ? (json.updatedProspects as OutreachProspectRecord[])
        : [];
      const updated =
        updatedList.find((p) => p.id === targetId) ||
        updatedList[0] ||
        (json.prospect as OutreachProspectRecord | undefined) ||
        null;
      const discoveredUrl =
        updated?.instagram_url ||
        json.instagramUrl ||
        json.instagram_url ||
        json.result?.instagramUrl ||
        null;
      const handle =
        extractInstagramHandle(discoveredUrl) ||
        (typeof json.handle === 'string' ? json.handle.replace(/^@/, '') : null) ||
        (typeof json.result?.handle === 'string'
          ? json.result.handle.replace(/^@/, '')
          : null);

      if (updated) {
        setActiveProspect(updated);
        setProspects((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
      } else if (discoveredUrl) {
        setActiveProspect((prev) =>
          prev && prev.id === targetId ? { ...prev, instagram_url: discoveredUrl } : prev
        );
        setProspects((prev) =>
          prev.map((item) =>
            item.id === targetId ? { ...item, instagram_url: discoveredUrl } : item
          )
        );
      }

      if (handle) {
        setFeedback(`Trovato @${handle} — profilo Instagram collegato al prospect.`);
      } else if (discoveredUrl) {
        setFeedback('Profilo Instagram pubblico trovato e salvato.');
      } else if (activeProspect.instagram_url) {
        const existingHandle = extractInstagramHandle(activeProspect.instagram_url);
        setFeedback(
          existingHandle
            ? `Profilo Instagram già verificato (@${existingHandle}).`
            : 'Profilo Instagram già presente.'
        );
      } else {
        setFeedback('Nessun profilo Instagram pubblico verificabile trovato.');
      }
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Errore ricerca Instagram AI');
    } finally {
      setFindingIgId(null);
    }
  };

  const handleMergeDuplicate = async (duplicateId: string) => {
    if (!activeProspect) return;
    setActionBusy(true);
    try {
      const res = await fetch('/api/admin/outreach/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'merge_duplicates',
          primary_prospect_id: activeProspect.id,
          secondary_prospect_id: duplicateId,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Errore fusione duplicati');
      setFeedback('Schede duplicate unite correttamente.');
      await openProspectDetail(activeProspect);
      fetchProspects();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Errore unione duplicati');
    } finally {
      setActionBusy(false);
    }
  };

  const handleConvertToClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProspect) return;
    setActionBusy(true);
    try {
      const res = await fetch('/api/admin/outreach/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'convert_to_client',
          prospect_id: activeProspect.id,
          owner_first_name: convertOwnerFirstName,
          owner_last_name: convertOwnerLastName,
          owner_email: convertOwnerEmail,
          owner_password: convertOwnerPassword,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Errore conversione in cliente RIVO');

      setFeedback(
        json.alreadyConverted
          ? `Prospect già convertito nell'organizzazione #${json.organizationId}.`
          : `Conversione completata! Creata Organizzazione RIVO (${json.organizationSlug}).`
      );
      setShowConvertModal(false);
      await openProspectDetail(activeProspect);
      fetchProspects();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Errore conversione');
    } finally {
      setActionBusy(false);
    }
  };

  const handleGdprDelete = async (prospectId: string) => {
    if (!window.confirm('Confermi la cancellazione GDPR definitiva di questo prospect?')) return;
    setActionBusy(true);
    try {
      const res = await fetch('/api/admin/outreach/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'erase_prospect',
          prospect_id: prospectId,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Errore cancellazione');
      setFeedback('Prospect cancellato definitivamente secondo procedura GDPR.');
      setActiveProspect(null);
      fetchProspects();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Errore cancellazione');
    } finally {
      setActionBusy(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === prospects.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(prospects.map((p) => p.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const getScoreBadgeClass = (score: number) => {
    if (score >= 80) return 'bg-[#BFFF00] text-[#09090B] font-bold';
    if (score >= 60) return 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30';
    if (score >= 40) return 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30';
    return 'bg-[#27272A] text-[#A1A1AA]';
  };

  const activeDemoUrl = activeProspect
    ? buildProspectDemoUrl(activeProspect.business_name, activeProspect.id)
    : null;
  const previewSlug = activeProspect
    ? encodePreviewSlug(activeProspect.business_name, activeProspect.id)
    : null;
  const activeIgHandle = extractInstagramHandle(activeProspect?.instagram_url);
  const activeIgDmUrl = buildInstagramDmDeepLink(activeProspect?.instagram_url);
  const activeLogoUrl =
    activeProspect?.digital_signals?.customLogoUrl ||
    activeProspect?.digital_signals?.logoUrl ||
    null;
  const versionTag = activeProspect
    ? computeLogoVersionTag(activeLogoUrl, activeProspect.business_name)
    : null;
  const activeProxyLogoUrl =
    previewSlug && activeLogoUrl && versionTag
      ? `/api/outreach/preview/${previewSlug}/logo?v=${versionTag}`
      : null;
  const activeOgCardUrl =
    previewSlug && versionTag
      ? `/api/outreach/preview/${previewSlug}/og?v=${versionTag}`
      : null;
  const showActiveLogoImage = Boolean(
    activeProxyLogoUrl && failedLogoUrl !== activeProxyLogoUrl
  );
  const activeLogs = activeDetail?.logs || [];
  const demoOpenedLogs = activeLogs.filter((l) => l.action === 'demo_opened');
  const demoCtaLogs = activeLogs.filter((l) => l.action === 'demo_cta_submitted');
  const demoInteractionLogs = activeLogs.filter((l) => l.action === 'demo_interaction');
  const demoTelemetryLogs = activeLogs.filter(
    (l) =>
      l.action === 'demo_opened' ||
      l.action === 'demo_cta_submitted' ||
      l.action === 'demo_interaction'
  );
  const latestCtaMeta = (demoCtaLogs[0]?.metadata || null) as Record<string, unknown> | null;

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-[#27272A] pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#BFFF00]" />
            <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#BFFF00]">
              RIVO OUTREACH — PROSPECT CRM
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-[-0.02em] text-[#FAFAFA]">
            Archivio Prospect & Qualificazione ({total})
          </h1>
          <p className="text-sm text-[#A1A1AA] mt-1">
            Tabella ad alta densità con Lead Score spiegabile, verifica duplicati, storico comunicazioni e conversione diretta in Cliente RIVO.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/outreach/discovery"
            className="px-3.5 py-2 rounded-lg bg-[#121214] border border-[#27272A] hover:border-[#3F3F46] text-xs font-medium text-[#FAFAFA]"
          >
            + Acquisisci Nuove Attività
          </Link>
          <button
            type="button"
            onClick={fetchProspects}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#121214] border border-[#27272A] hover:border-[#3F3F46] text-xs text-[#FAFAFA]"
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

      {/* Filter Bar */}
      <div className="bg-[#121214] border border-[#27272A] rounded-xl p-4 grid grid-cols-1 md:grid-cols-6 gap-3">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-[#71717A] absolute left-3 top-3" />
          <input
            type="text"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Cerca per nome, città, email o dominio..."
            className="w-full h-10 pl-9 pr-3.5 rounded-lg bg-[#0D0D10] border border-[#27272A] text-xs text-[#FAFAFA] focus:outline-none focus:border-[#BFFF00]"
          />
        </div>

        <div>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="w-full h-10 px-3 rounded-lg bg-[#0D0D10] border border-[#27272A] text-xs text-[#FAFAFA] focus:outline-none focus:border-[#BFFF00]"
          >
            <option value="">Tutte le categorie</option>
            {OUTREACH_DISCOVERY_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full h-10 px-3 rounded-lg bg-[#0D0D10] border border-[#27272A] text-xs text-[#FAFAFA] focus:outline-none focus:border-[#BFFF00]"
          >
            <option value="">Tutti gli stati pipeline</option>
            {OUTREACH_PIPELINE_STAGES.map((st) => (
              <option key={st.id} value={st.id}>
                {st.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={minScore}
            onChange={(e) => {
              setMinScore(e.target.value);
              setPage(1);
            }}
            className="w-full h-10 px-3 rounded-lg bg-[#0D0D10] border border-[#27272A] text-xs text-[#FAFAFA] focus:outline-none focus:border-[#BFFF00]"
          >
            <option value="">Qualsiasi Lead Score</option>
            <option value="80">80–100 (Priorità Alta)</option>
            <option value="60">60+ (Buon Potenziale)</option>
            <option value="40">40+ (Potenziale Medio)</option>
          </select>
        </div>

        <div>
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as 'lead_score' | 'created_at' | 'business_name')
            }
            className="w-full h-10 px-3 rounded-lg bg-[#0D0D10] border border-[#27272A] text-xs text-[#FAFAFA] focus:outline-none focus:border-[#BFFF00]"
          >
            <option value="lead_score">Ordina per: Lead Score</option>
            <option value="created_at">Ordina per: Data Acquisizione</option>
            <option value="business_name">Ordina per: Nome A-Z</option>
          </select>
        </div>
      </div>

      {/* Bulk Selection Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-[#121214] border border-fuchsia-500/40 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[#FAFAFA]">
            <span className="px-2 py-0.5 rounded bg-[#BFFF00] text-[#09090B] font-mono font-bold">
              {selectedIds.length}
            </span>
            <span>prospect selezionati</span>
            {selectedIds.length > 15 && (
              <span className="text-[11px] text-[#A1A1AA]">
                (scansione AI fino a 15 alla volta)
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={bulkFindingIg}
              onClick={handleBulkFindInstagram}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-fuchsia-500/15 border border-fuchsia-500/45 hover:border-fuchsia-400 text-xs font-semibold text-fuchsia-300 disabled:opacity-50 transition-colors"
            >
              {bulkFindingIg ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Ricerca Instagram AI...
                </>
              ) : (
                <>
                  <InstagramIcon className="w-3.5 h-3.5" />
                  Trova Instagram AI ({selectedIds.length})
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-lg bg-[#0D0D10] border border-[#27272A] hover:border-[#3F3F46] text-xs text-[#A1A1AA] hover:text-[#FAFAFA]"
            >
              Deseleziona
            </button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-[#121214] border border-[#27272A] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="h-11 bg-[#0D0D10] border-b border-[#27272A] text-[11px] font-mono uppercase text-[#A1A1AA]">
                <th className="px-4 w-10">
                  <input
                    type="checkbox"
                    checked={prospects.length > 0 && selectedIds.length === prospects.length}
                    onChange={toggleSelectAll}
                    className="accent-[#BFFF00]"
                  />
                </th>
                <th className="px-4">Attività Commerciale</th>
                <th className="px-4">Categoria</th>
                <th className="px-4">Città</th>
                <th className="px-4">Canali</th>
                <th className="px-4">Lead Score</th>
                <th className="px-4">Stato Pipeline</th>
                <th className="px-4 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272A] text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-[#71717A] font-mono">
                    CARICAMENTO ARCHIVIO PROSPECT...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-[#EF4444]">
                    {error}
                  </td>
                </tr>
              ) : prospects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-[#71717A]">
                    Nessun prospect trovato. Avvia una ricerca dalla sezione &ldquo;Ricerca attività&rdquo;.
                  </td>
                </tr>
              ) : (
                prospects.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => openProspectDetail(p)}
                    className={`h-13 cursor-pointer transition-colors hover:bg-[#18181B] ${
                      activeProspect?.id === p.id ? 'bg-[#18181B]' : ''
                    }`}
                  >
                    <td className="px-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(p.id)}
                        onChange={() => toggleSelectOne(p.id)}
                        className="accent-[#BFFF00]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#FAFAFA] flex items-center gap-2">
                        <span>{p.business_name}</span>
                        {p.organization_id && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#BFFF00] text-[#09090B] font-bold">
                            CLIENTE RIVO
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#71717A] truncate max-w-[260px]">
                        {p.address || p.source || 'Fonte registrata'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#A1A1AA]">
                      <div>{p.category}</div>
                      {p.subcategory && (
                        <div className="text-[11px] text-[#71717A]">{p.subcategory}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#FAFAFA]">{p.city || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {p.website && <Globe className="w-3.5 h-3.5 text-[#BFFF00]" />}
                        {p.business_email && <Mail className="w-3.5 h-3.5 text-[#22C55E]" />}
                        {p.business_phone && <Phone className="w-3.5 h-3.5 text-[#A1A1AA]" />}
                        {p.instagram_url && (() => {
                          const igHandle = extractInstagramHandle(p.instagram_url);
                          return (
                            <a
                              href={p.instagram_url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              title={
                                igHandle ? `@${igHandle} su Instagram` : 'Apri profilo Instagram'
                              }
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-fuchsia-500/15 border border-fuchsia-500/40 text-fuchsia-400 hover:text-fuchsia-300 hover:border-fuchsia-400 text-[10px] font-mono transition-colors"
                            >
                              <InstagramIcon className="w-3 h-3 shrink-0" />
                              {igHandle && (
                                <span className="max-w-[88px] truncate">@{igHandle}</span>
                              )}
                            </a>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono ${getScoreBadgeClass(
                          p.lead_score
                        )}`}
                      >
                        {p.lead_score}/100
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={p.commercial_status}
                        onChange={(e) =>
                          handleStageChange(p.id, e.target.value as OutreachCommercialStatus)
                        }
                        className="h-8 px-2.5 rounded bg-[#0D0D10] border border-[#27272A] text-xs text-[#FAFAFA] focus:outline-none focus:border-[#BFFF00]"
                      >
                        {OUTREACH_PIPELINE_STAGES.map((stage) => (
                          <option key={stage.id} value={stage.id}>
                            {stage.shortLabel}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1.5">
                        <a
                          href={buildProspectDemoUrl(p.business_name, p.id)}
                          target="_blank"
                          rel="noreferrer"
                          title="Apri Demo Interattiva RIVO"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#18181B] border border-[#27272A] hover:border-[#BFFF00] text-xs text-[#BFFF00]"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Demo
                        </a>
                        <button
                          type="button"
                          onClick={() => openProspectDetail(p)}
                          className="px-2.5 py-1 rounded bg-[#18181B] border border-[#27272A] hover:border-[#BFFF00] text-xs text-[#FAFAFA]"
                        >
                          Dettagli
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lateral Detail Drawer */}
      {activeProspect && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-[#0D0D10] border-l border-[#27272A] shadow-2xl overflow-y-auto p-6 space-y-6">
          <div className="flex items-start justify-between border-b border-[#27272A] pb-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono uppercase text-[#BFFF00]">
                  SCHEDA PROSPECT
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-mono ${getScoreBadgeClass(
                    activeProspect.lead_score
                  )}`}
                >
                  Score {activeProspect.lead_score}/100
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#18181B] border border-[#27272A] text-[#A1A1AA]">
                  Confidenza {activeProspect.confidence_score}%
                </span>
                {demoOpenedLogs.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-[#06B6D4]/15 text-[#22D3EE] border border-[#06B6D4]/40">
                    <Eye className="w-3 h-3" />
                    Demo Aperta ({demoOpenedLogs.length}x) •{' '}
                    {new Date(demoOpenedLogs[0].created_at).toLocaleString('it-IT')}
                  </span>
                )}
                {demoCtaLogs.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-[#BFFF00] text-[#09090B] font-bold">
                    <CheckCircle2 className="w-3 h-3" />
                    Richiesta Attivazione dalla Demo
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-[#FAFAFA] mt-1">
                {activeProspect.business_name}
              </h2>
              <p className="text-xs text-[#A1A1AA]">
                {activeProspect.category}{' '}
                {activeProspect.subcategory ? `• ${activeProspect.subcategory}` : ''} •{' '}
                {activeProspect.city || 'Città non specificata'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveProspect(null)}
              className="p-2 rounded-lg bg-[#121214] border border-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Primary Actions Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => handleRunAIAnalysis(activeProspect.id)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#18181B] border border-[#BFFF00]/50 hover:border-[#BFFF00] text-xs font-semibold text-[#BFFF00]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {activeProspect.ai_analysis ? 'Riesegui Analisi AI' : 'Analizza con AI'}
            </button>

            <Link
              href={`/admin/outreach/communications?prospectId=${activeProspect.id}`}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#121214] border border-[#27272A] hover:border-[#3F3F46] text-xs font-medium text-[#FAFAFA]"
            >
              <Send className="w-3.5 h-3.5" />
              Invia Comunicazione
            </Link>

            <button
              type="button"
              disabled={actionBusy || findingIgId === activeProspect.id}
              onClick={handleFindInstagramForActive}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-fuchsia-500/15 border border-fuchsia-500/40 hover:border-fuchsia-400 text-xs font-semibold text-fuchsia-300 disabled:opacity-50"
            >
              {findingIgId === activeProspect.id ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Ricerca IG...
                </>
              ) : (
                <>
                  <InstagramIcon className="w-3.5 h-3.5" />
                  Cerca IG con AI
                </>
              )}
            </button>

            {activeProspect.instagram_url && (
              <>
                <Link
                  href={`/admin/outreach/communications?tab=instagram_dm&prospectId=${encodeURIComponent(
                    activeProspect.id
                  )}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#121214] border border-fuchsia-500/40 hover:border-fuchsia-400 text-xs font-medium text-fuchsia-300"
                >
                  <Send className="w-3.5 h-3.5" />
                  Invia DM IG (Coda)
                </Link>
                {activeIgDmUrl && (
                  <a
                    href={activeIgDmUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#18181B] border border-[#27272A] hover:border-fuchsia-400 text-xs font-mono text-fuchsia-300"
                  >
                    <InstagramIcon className="w-3.5 h-3.5" />
                    ig.me/m/@{activeIgHandle || 'instagram'}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </>
            )}

            {activeDemoUrl && (
              <>
                <a
                  href={activeDemoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#121214] border border-[#BFFF00]/50 hover:border-[#BFFF00] text-xs font-medium text-[#BFFF00]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Apri Demo
                </a>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(activeDemoUrl);
                    setCopiedDemoUrl(true);
                    setTimeout(() => setCopiedDemoUrl(false), 2000);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#121214] border border-[#27272A] hover:border-[#BFFF00] text-xs font-medium text-[#FAFAFA]"
                >
                  {copiedDemoUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#BFFF00]" />
                      Link Demo Copiato
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copia Link Demo
                    </>
                  )}
                </button>
              </>
            )}

            {!activeProspect.organization_id ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowConvertModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#BFFF00] hover:bg-[#A8E600] text-[#09090B] text-xs font-bold uppercase tracking-wide"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  CONVERTI IN CLIENTE RIVO
                </button>
                <Link
                  href={`/admin/organizations/new?outreachProspectId=${activeProspect.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#121214] border border-[#27272A] hover:border-[#3F3F46] text-xs text-[#A1A1AA] hover:text-[#FAFAFA]"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  Apri Wizard Organizzazione
                </Link>
              </>
            ) : (
              <Link
                href={`/admin/organizations/${activeProspect.organization_id}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#BFFF00] text-[#09090B] text-xs font-bold"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Apri Organizzazione RIVO Convertita
              </Link>
            )}
          </div>

          {/* Demo CTA Summary Card */}
          {demoCtaLogs.length > 0 && latestCtaMeta && (
            <div className="p-4 rounded-xl bg-[#BFFF00]/10 border border-[#BFFF00]/50 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono uppercase font-bold text-[#BFFF00]">
                  Richiesta Attivazione dalla Demo
                </span>
                <span className="text-[11px] font-mono text-[#A1A1AA]">
                  {new Date(demoCtaLogs[0].created_at).toLocaleString('it-IT')}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
                <div>
                  <span className="text-[#71717A]">Referente: </span>
                  <span className="text-[#FAFAFA] font-medium">
                    {String(latestCtaMeta.contact_name || 'Non indicato')}
                  </span>
                </div>
                <div>
                  <span className="text-[#71717A]">Telefono: </span>
                  <span className="text-[#FAFAFA] font-mono">
                    {String(latestCtaMeta.contact_phone || 'Non indicato')}
                  </span>
                </div>
                <div>
                  <span className="text-[#71717A]">Orario preferito: </span>
                  <span className="text-[#FAFAFA]">
                    {String(latestCtaMeta.preferred_time || 'Non indicato')}
                  </span>
                </div>
              </div>
              {Boolean(latestCtaMeta.note) && (
                <div className="pt-1 text-[#FAFAFA]">
                  <span className="text-[#71717A]">Nota: </span>
                  {String(latestCtaMeta.note)}
                </div>
              )}
            </div>
          )}

          {/* Convert Modal */}
          {showConvertModal && (
            <form
              onSubmit={handleConvertToClient}
              className="p-4 rounded-xl bg-[#121214] border border-[#BFFF00] space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#BFFF00]">
                  Conversione Transazionale in Organizzazione RIVO
                </h3>
                <button
                  type="button"
                  onClick={() => setShowConvertModal(false)}
                  className="text-xs text-[#A1A1AA]"
                >
                  Annulla
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#A1A1AA] mb-1">Nome Referente</label>
                  <input
                    type="text"
                    required
                    value={convertOwnerFirstName}
                    onChange={(e) => setConvertOwnerFirstName(e.target.value)}
                    className="w-full h-9 px-3 rounded bg-[#0D0D10] border border-[#27272A] text-xs text-[#FAFAFA]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#A1A1AA] mb-1">Cognome Referente</label>
                  <input
                    type="text"
                    required
                    value={convertOwnerLastName}
                    onChange={(e) => setConvertOwnerLastName(e.target.value)}
                    className="w-full h-9 px-3 rounded bg-[#0D0D10] border border-[#27272A] text-xs text-[#FAFAFA]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#A1A1AA] mb-1">
                    Email Account Titolare *
                  </label>
                  <input
                    type="email"
                    required
                    value={convertOwnerEmail}
                    onChange={(e) => setConvertOwnerEmail(e.target.value)}
                    placeholder="titolare@locale.it"
                    className="w-full h-9 px-3 rounded bg-[#0D0D10] border border-[#27272A] text-xs text-[#FAFAFA]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#A1A1AA] mb-1">
                    Password Iniziale *
                  </label>
                  <input
                    type="text"
                    required
                    value={convertOwnerPassword}
                    onChange={(e) => setConvertOwnerPassword(e.target.value)}
                    className="w-full h-9 px-3 rounded bg-[#0D0D10] border border-[#27272A] text-xs font-mono text-[#FAFAFA]"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={actionBusy}
                  className="px-4 py-2 rounded bg-[#BFFF00] text-[#09090B] text-xs font-bold"
                >
                  Conferma Creazione Organizzazione
                </button>
              </div>
            </form>
          )}

          {/* Co-Branding Demo Preview & Custom Logo */}
          <div className="bg-[#121214] border border-[#27272A] rounded-xl p-4 space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase text-[#BFFF00]">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Anteprima Co-Branding Link Demo (RIVO + Attività)</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#18181B] border border-[#27272A] text-[#A1A1AA]">
                {activeProspect.digital_signals?.customLogoUrl
                  ? 'Logo Custom'
                  : activeProspect.digital_signals?.logoUrl
                  ? (activeProspect.digital_signals as { logoSource?: string })?.logoSource ||
                    'Rilevato Online'
                  : 'Monogramma Auto'}
              </span>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0D0D10] border border-[#27272A]">
              <div className="inline-flex items-center gap-1.5 shrink-0">
                <div className="w-9 h-9 rounded-xl bg-white border border-white/90 flex items-center justify-center p-1 shadow-sm shrink-0">
                  <Image
                    src="/brand/rivo-icon.png"
                    alt="RIVO"
                    width={24}
                    height={24}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-xs font-mono font-bold text-[#71717A]">+</span>
                {showActiveLogoImage && activeProxyLogoUrl ? (
                  <div className="w-9 h-9 rounded-xl bg-white border border-white/90 flex items-center justify-center overflow-hidden p-1 shadow-sm shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeProxyLogoUrl}
                      alt={activeProspect.business_name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                      onError={() => setFailedLogoUrl(activeProxyLogoUrl)}
                    />
                  </div>
                ) : (
                  <div
                    className="w-9 h-9 rounded-xl bg-[#18181B] border border-[#BFFF00]/45 flex items-center justify-center shadow-sm shrink-0"
                    aria-label={activeProspect.business_name}
                  >
                    <span className="text-xs font-black tracking-tight text-[#BFFF00] select-none">
                      {getBusinessInitials(activeProspect.business_name)}
                    </span>
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-[#FAFAFA] truncate">
                  RIVO + {activeProspect.business_name}
                </div>
                <div className="text-[11px] text-[#71717A] truncate">
                  {activeLogoUrl ||
                    `Monogramma: ${getBusinessInitials(activeProspect.business_name)}`}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] text-[#A1A1AA]">
                URL Logo Attività (PNG/JPG pubblico, opzionale)
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={customLogoDraft}
                  onChange={(e) => setCustomLogoDraft(e.target.value)}
                  placeholder="https://esempio.it/logo.png"
                  className="flex-1 min-w-[200px] h-9 px-3 rounded-lg bg-[#0D0D10] border border-[#27272A] text-xs text-[#FAFAFA] focus:outline-none focus:border-[#BFFF00]"
                />
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={handleSaveCustomLogo}
                  className="h-9 px-3.5 rounded-lg bg-[#BFFF00] hover:bg-[#A8E600] text-[#09090B] text-xs font-bold disabled:opacity-50"
                >
                  Salva Logo
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={handleDiscoverLogo}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[#18181B] border border-[#BFFF00]/40 hover:border-[#BFFF00] text-xs font-medium text-[#BFFF00] disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${discoveringLogo ? 'animate-pulse' : ''}`} />
                  {discoveringLogo ? 'Ricerca Logo...' : 'Cerca Logo Auto'}
                </button>

                <input
                  ref={logoFileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleUploadLogoFile}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => logoFileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[#18181B] border border-[#27272A] hover:border-[#BFFF00] text-xs font-medium text-[#FAFAFA] disabled:opacity-50"
                >
                  <Upload className={`w-3.5 h-3.5 ${uploadingLogo ? 'animate-bounce' : ''}`} />
                  {uploadingLogo ? 'Caricamento...' : 'Carica File'}
                </button>

                {activeProspect.website && (
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={handleEnrichWebsiteLogo}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[#18181B] border border-[#27272A] hover:border-[#BFFF00] text-xs font-medium text-[#FAFAFA] disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${enrichingWebsiteLogo ? 'animate-spin' : ''}`}
                    />
                    Rileva dal Sito
                  </button>
                )}
              </div>
            </div>

            {logoFeedback && (
              <div
                className={`text-[11px] font-medium ${
                  logoFeedback.type === 'error'
                    ? 'text-[#EF4444]'
                    : logoFeedback.type === 'info'
                    ? 'text-[#F59E0B]'
                    : 'text-[#BFFF00]'
                }`}
              >
                {logoFeedback.message}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
              <p className="text-[11px] text-[#71717A] leading-relaxed">
                Appare nella card anteprima su WhatsApp/Telegram e dentro la demo interattiva quando condividi il link.
              </p>
              {activeOgCardUrl && (
                <a
                  href={activeOgCardUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[#A1A1AA] hover:text-[#BFFF00] underline-offset-2 hover:underline shrink-0"
                >
                  <ExternalLink className="w-3 h-3" />
                  Anteprima Card Social
                </a>
              )}
            </div>
          </div>

          {/* Provenance & Contacts */}
          <div className="bg-[#121214] border border-[#27272A] rounded-xl p-4 space-y-2 text-xs">
            <div className="text-[11px] font-mono uppercase text-[#A1A1AA]">
              Dati Commerciali e Provenienza Tracciabile
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-[#71717A]">Indirizzo: </span>
                <span className="text-[#FAFAFA]">
                  {activeProspect.address || 'Non disponibile'}
                </span>
              </div>
              <div>
                <span className="text-[#71717A]">Telefono: </span>
                <span className="text-[#FAFAFA] font-mono">
                  {activeProspect.business_phone || 'Non disponibile'}
                </span>
              </div>
              <div>
                <span className="text-[#71717A]">Email: </span>
                <span className="text-[#FAFAFA] font-mono">
                  {activeProspect.business_email || 'Non disponibile'}
                </span>
              </div>
              <div>
                <span className="text-[#71717A]">Sito Web: </span>
                {activeProspect.website ? (
                  <a
                    href={activeProspect.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#BFFF00] hover:underline inline-flex items-center gap-1"
                  >
                    {activeProspect.website_domain || activeProspect.website}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-[#FAFAFA]">Non rilevato</span>
                )}
              </div>
              <div className="md:col-span-2 flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[#71717A]">Instagram: </span>
                {activeProspect.instagram_url ? (
                  <>
                    <a
                      href={activeProspect.instagram_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-fuchsia-300 hover:underline inline-flex items-center gap-1 font-mono"
                    >
                      <InstagramIcon className="w-3.5 h-3.5 text-fuchsia-400" />
                      @{activeIgHandle || 'instagram'}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    {activeIgDmUrl && (
                      <a
                        href={activeIgDmUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-fuchsia-500/15 border border-fuchsia-500/40 hover:border-fuchsia-400 text-[11px] font-mono text-fuchsia-300"
                      >
                        ig.me/m/@{activeIgHandle || 'instagram'}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                    <Link
                      href={`/admin/outreach/communications?tab=instagram_dm&prospectId=${encodeURIComponent(
                        activeProspect.id
                      )}`}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#18181B] border border-[#27272A] hover:border-fuchsia-400 text-[11px] text-fuchsia-300"
                    >
                      <Send className="w-2.5 h-2.5" />
                      Invia DM IG (Coda)
                    </Link>
                  </>
                ) : (
                  <span className="text-[#FAFAFA]">Non rilevato</span>
                )}
                <button
                  type="button"
                  disabled={actionBusy || findingIgId === activeProspect.id}
                  onClick={handleFindInstagramForActive}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#18181B] border border-[#27272A] hover:border-fuchsia-400 text-[11px] text-fuchsia-300 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-2.5 h-2.5 ${
                      findingIgId === activeProspect.id ? 'animate-spin' : ''
                    }`}
                  />
                  {findingIgId === activeProspect.id ? 'Ricerca IG...' : 'Cerca IG con AI'}
                </button>
              </div>
            </div>
            <div className="pt-2 border-t border-[#27272A] text-[11px] text-[#71717A] font-mono">
              Fonte: {activeProspect.source} ({activeProspect.source_reference || 'N/D'}) •
              Acquisito il {new Date(activeProspect.source_acquired_at).toLocaleString('it-IT')}
            </div>
          </div>

          {/* Duplicate warning if any */}
          {activeDetail && activeDetail.duplicateCandidates.length > 0 && (
            <div className="p-4 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 space-y-2">
              <div className="text-xs font-semibold text-[#F59E0B] flex items-center gap-2">
                <GitMerge className="w-4 h-4" />
                Possibili Schede Duplicate Rilevate ({activeDetail.duplicateCandidates.length})
              </div>
              {activeDetail.duplicateCandidates.map((dup) => (
                <div
                  key={dup.id}
                  className="flex items-center justify-between text-xs bg-[#0D0D10] p-2.5 rounded border border-[#27272A]"
                >
                  <div>
                    <span className="font-medium text-[#FAFAFA]">{dup.business_name}</span>
                    <span className="text-[#71717A] ml-2">{dup.city}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleMergeDuplicate(dup.id)}
                    className="px-2.5 py-1 rounded bg-[#BFFF00] text-[#09090B] font-semibold text-[11px]"
                  >
                    Unisci Schede
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* AI Analysis Summary & Opportunities */}
          <div className="bg-[#121214] border border-[#27272A] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-[#BFFF00]">
                AI Business Intelligence & Opportunità RIVO
              </span>
              <Link
                href={`/admin/outreach/intelligence?prospectId=${activeProspect.id}`}
                className="text-xs text-[#BFFF00] hover:underline"
              >
                Apri vista completa AI →
              </Link>
            </div>
            <p className="text-xs text-[#FAFAFA] leading-relaxed">
              {activeProspect.ai_analysis?.executiveSummary ||
                'Nessuna analisi AI ancora eseguita per questa attività. Clicca "Analizza con AI" per valutare opportunità e punteggio.'}
            </p>

            {Array.isArray(activeProspect.ai_analysis?.opportunities) &&
              activeProspect.ai_analysis.opportunities.length > 0 && (
                <div className="space-y-2 pt-2">
                  {activeProspect.ai_analysis.opportunities.map((opp, idx) => (
                    <div
                      key={`${opp.moduleSlug}-${idx}`}
                      className="p-2.5 rounded-lg bg-[#0D0D10] border border-[#27272A] text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#FAFAFA]">{opp.moduleName}</span>
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
                            ? 'Opportunità Confermata'
                            : opp.verificationStatus === 'plausible'
                            ? 'Opportunità Plausibile'
                            : 'Non Verificabile Online'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#A1A1AA] mt-1">{opp.rationale}</p>
                    </div>
                  ))}
                </div>
              )}
          </div>

          {/* Commercial Notes */}
          <div className="bg-[#121214] border border-[#27272A] rounded-xl p-4 space-y-2">
            <label className="block text-[11px] font-mono uppercase text-[#A1A1AA]">
              Note Commerciali Admin
            </label>
            <textarea
              rows={3}
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              placeholder="Annotazioni su chiamata, referente, orario migliore per ricontatto..."
              className="w-full p-3 rounded-lg bg-[#0D0D10] border border-[#27272A] text-xs text-[#FAFAFA] focus:outline-none focus:border-[#BFFF00]"
            />
            <div className="flex justify-between items-center pt-1">
              <button
                type="button"
                onClick={() => handleGdprDelete(activeProspect.id)}
                className="inline-flex items-center gap-1.5 text-xs text-[#EF4444] hover:underline"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Cancellazione GDPR
              </button>
              <button
                type="button"
                disabled={actionBusy}
                onClick={handleSaveNotes}
                className="px-3.5 py-1.5 rounded-lg bg-[#18181B] border border-[#27272A] hover:border-[#BFFF00] text-xs text-[#FAFAFA]"
              >
                Salva Note
              </button>
            </div>
          </div>

          {/* Demo Telemetry & Communication History */}
          {detailLoading ? (
            <div className="text-xs font-mono text-[#71717A]">Caricamento storico...</div>
          ) : (
            activeDetail && (
              <>
                <div className="bg-[#121214] border border-[#27272A] rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-mono uppercase text-[#A1A1AA]">
                      Eventi Demo Interattiva ({demoTelemetryLogs.length})
                    </div>
                    {demoInteractionLogs.length > 0 && (
                      <span className="text-[11px] font-mono text-[#BFFF00]">
                        {demoInteractionLogs.length} interazioni
                      </span>
                    )}
                  </div>
                  {demoTelemetryLogs.length === 0 ? (
                    <p className="text-xs text-[#71717A]">
                      Nessuna apertura o interazione demo ancora registrata.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {demoTelemetryLogs.slice(0, 12).map((evt) => {
                        const meta = (evt.metadata || {}) as Record<string, unknown>;
                        const eventLabel =
                          evt.action === 'demo_opened'
                            ? 'Demo Aperta'
                            : evt.action === 'demo_cta_submitted'
                            ? 'Richiesta Attivazione Inviata'
                            : 'Interazione Modulo Demo';
                        const detailParts = [
                          meta.vertical ? `vertical: ${String(meta.vertical)}` : null,
                          meta.module ? `modulo: ${String(meta.module)}` : null,
                          meta.interaction ? `azione: ${String(meta.interaction)}` : null,
                          meta.tab ? `tab: ${String(meta.tab)}` : null,
                          meta.contact_name ? `contatto: ${String(meta.contact_name)}` : null,
                        ].filter(Boolean);
                        return (
                          <div
                            key={evt.id}
                            className="p-2 rounded bg-[#0D0D10] border border-[#27272A] text-xs flex flex-wrap items-center justify-between gap-2"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase ${
                                  evt.action === 'demo_cta_submitted'
                                    ? 'bg-[#BFFF00]/20 text-[#BFFF00]'
                                    : evt.action === 'demo_opened'
                                    ? 'bg-[#06B6D4]/20 text-[#22D3EE]'
                                    : 'bg-[#27272A] text-[#FAFAFA]'
                                }`}
                              >
                                {eventLabel}
                              </span>
                              {detailParts.length > 0 && (
                                <span className="text-[11px] text-[#A1A1AA] font-mono">
                                  {detailParts.join(' • ')}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-mono text-[#71717A]">
                              {new Date(evt.created_at).toLocaleString('it-IT')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="bg-[#121214] border border-[#27272A] rounded-xl p-4 space-y-2">
                  <div className="text-[11px] font-mono uppercase text-[#A1A1AA]">
                    Storico Comunicazioni ({activeDetail.messages.length})
                  </div>
                  {activeDetail.messages.length === 0 ? (
                    <p className="text-xs text-[#71717A]">Nessun messaggio inviato o ricevuto.</p>
                  ) : (
                    <div className="space-y-2">
                      {activeDetail.messages.map((m) => (
                        <div
                          key={m.id}
                          className="p-2.5 rounded bg-[#0D0D10] border border-[#27272A] text-xs"
                        >
                          <div className="flex justify-between text-[11px] font-mono text-[#A1A1AA]">
                            <span>
                              {m.direction === 'outbound' ? 'INVIATO' : 'RICEVUTO'} • {m.channel}
                            </span>
                            <span>{m.provider_status}</span>
                          </div>
                          {m.subject && (
                            <div className="font-semibold text-[#FAFAFA] mt-1">{m.subject}</div>
                          )}
                          <p className="text-[#A1A1AA] mt-1 whitespace-pre-line">{m.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )
          )}
        </div>
      )}
    </div>
  );
}
