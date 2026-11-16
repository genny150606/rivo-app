'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  Cpu,
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
import {
  PageHeader,
  SurfaceCard,
  StatusBadge,
  EmptyState,
} from '@/components/ui';
import type { StatusTone } from '@/components/ui/StatusBadge';
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

  const getScoreTone = (score: number): StatusTone => {
    if (score >= 80) return 'volt';
    if (score >= 60) return 'operational';
    if (score >= 40) return 'warning';
    return 'neutral';
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
    <div className="space-y-6">
      <PageHeader
        eyebrow="RIVO OUTREACH — PROSPECT CRM"
        title={`Archivio Prospect & Qualificazione (${total})`}
        description="Tabella ad alta densità con Lead Score spiegabile, verifica duplicati, storico comunicazioni e conversione diretta in Cliente RIVO."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/admin/outreach/discovery"
              className="inline-flex items-center min-h-[44px] px-3.5 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-xs font-medium text-[var(--text-primary)] transition-colors"
            >
              + Acquisisci Nuove Attività
            </Link>
            <button
              type="button"
              onClick={fetchProspects}
              className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-xs text-[var(--text-primary)] transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Aggiorna
            </button>
          </div>
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

      {/* Filter Bar */}
      <SurfaceCard padding="sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="sm:col-span-2 relative">
            <label htmlFor="prospects-search-q" className="sr-only">
              Cerca prospect
            </label>
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-3.5" />
            <input
              id="prospects-search-q"
              type="text"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Cerca per nome, città, email o dominio…"
              className="w-full h-11 pl-9 pr-3.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--rivo-volt)]"
            />
          </div>

          <div>
            <label htmlFor="prospects-filter-category" className="sr-only">
              Filtra per categoria
            </label>
            <select
              id="prospects-filter-category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full h-11 px-3 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--rivo-volt)]"
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
            <label htmlFor="prospects-filter-status" className="sr-only">
              Filtra per stato pipeline
            </label>
            <select
              id="prospects-filter-status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full h-11 px-3 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--rivo-volt)]"
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
            <label htmlFor="prospects-filter-score" className="sr-only">
              Filtra per punteggio minimo
            </label>
            <select
              id="prospects-filter-score"
              value={minScore}
              onChange={(e) => {
                setMinScore(e.target.value);
                setPage(1);
              }}
              className="w-full h-11 px-3 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--rivo-volt)]"
            >
              <option value="">Qualsiasi Lead Score</option>
              <option value="80">80–100 (Priorità Alta)</option>
              <option value="60">60+ (Buon Potenziale)</option>
              <option value="40">40+ (Potenziale Medio)</option>
            </select>
          </div>

          <div>
            <label htmlFor="prospects-sort-by" className="sr-only">
              Ordina prospect
            </label>
            <select
              id="prospects-sort-by"
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as 'lead_score' | 'created_at' | 'business_name')
              }
              className="w-full h-11 px-3 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--rivo-volt)]"
            >
              <option value="lead_score">Ordina per: Lead Score</option>
              <option value="created_at">Ordina per: Data Acquisizione</option>
              <option value="business_name">Ordina per: Nome A-Z</option>
            </select>
          </div>
        </div>
      </SurfaceCard>

      {/* Bulk Selection Toolbar */}
      {selectedIds.length > 0 && (
        <SurfaceCard padding="sm" className="border-[var(--rivo-volt-border)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[var(--text-primary)]">
              <span className="px-2 py-0.5 rounded bg-[var(--rivo-volt)] text-[var(--rivo-volt-ink)] font-mono tabular-nums font-bold">
                {selectedIds.length}
              </span>
              <span>prospect selezionati</span>
              {selectedIds.length > 15 && (
                <span className="text-[11px] text-[var(--text-secondary)]">
                  (scansione AI fino a 15 alla volta)
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={bulkFindingIg}
                onClick={handleBulkFindInstagram}
                className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-1.5 rounded-lg bg-[var(--rivo-volt-bg)] border border-[var(--rivo-volt-border)] hover:border-[var(--rivo-volt)] text-xs font-semibold text-[var(--rivo-volt-text)] disabled:opacity-50 transition-colors"
              >
                {bulkFindingIg ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Ricerca Instagram AI…
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
                className="min-h-[40px] px-3 py-1.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Deseleziona
              </button>
            </div>
          </div>
        </SurfaceCard>
      )}

      {/* Data Table & Mobile Cards */}
      <SurfaceCard padding="none">
        {loading ? (
          <div className="py-12 text-center text-xs text-[var(--text-muted)] font-mono">
            CARICAMENTO ARCHIVIO PROSPECT…
          </div>
        ) : error ? (
          <div className="py-8 px-4 text-center text-xs text-[var(--accent-critical-text)]">
            {error}
          </div>
        ) : prospects.length === 0 ? (
          <div className="p-6">
            <EmptyState
              compact
              icon={Search}
              title="Nessun prospect trovato"
              description='Avvia una ricerca dalla sezione "Ricerca attività" per popolare il CRM.'
            />
          </div>
        ) : (
          <>
            {/* Mobile Card List */}
            <div className="lg:hidden divide-y divide-[var(--border-subtle)]">
              {prospects.map((p) => (
                <div
                  key={p.id}
                  className={`p-4 space-y-3 ${
                    activeProspect?.id === p.id ? 'bg-[var(--bg-elevated)]' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <input
                        aria-label={`Seleziona ${p.business_name}`}
                        type="checkbox"
                        checked={selectedIds.includes(p.id)}
                        onChange={() => toggleSelectOne(p.id)}
                        className="mt-1 w-4 h-4 accent-[#BFFF00] shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-[var(--text-primary)] flex flex-wrap items-center gap-1.5">
                          <span>{p.business_name}</span>
                          {p.organization_id && (
                            <StatusBadge tone="volt" variant="solid" size="sm" shape="tag">
                              CLIENTE RIVO
                            </StatusBadge>
                          )}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)]">
                          {p.city || '-'} • {p.category}
                          {p.subcategory ? ` (${p.subcategory})` : ''}
                        </div>
                      </div>
                    </div>

                    <StatusBadge
                      tone={getScoreTone(p.lead_score)}
                      variant={p.lead_score >= 80 ? 'solid' : 'soft'}
                      size="sm"
                      shape="tag"
                      className="tabular-nums shrink-0"
                    >
                      {p.lead_score}/100
                    </StatusBadge>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {p.website && <Globe className="w-3.5 h-3.5 text-[var(--rivo-volt-text)]" />}
                    {p.business_email && (
                      <Mail className="w-3.5 h-3.5 text-[var(--accent-operational-text)]" />
                    )}
                    {p.business_phone && (
                      <Phone className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                    )}
                    {p.instagram_url && (() => {
                      const igHandle = extractInstagramHandle(p.instagram_url);
                      return (
                        <a
                          href={p.instagram_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--rivo-volt-bg)] border border-[var(--rivo-volt-border)] text-[var(--rivo-volt-text)] text-[10px] font-mono"
                        >
                          <InstagramIcon className="w-3 h-3 shrink-0" />
                          {igHandle && <span className="max-w-[110px] truncate">@{igHandle}</span>}
                        </a>
                      );
                    })()}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <select
                      aria-label={`Stato pipeline per ${p.business_name}`}
                      value={p.commercial_status}
                      onChange={(e) =>
                        handleStageChange(p.id, e.target.value as OutreachCommercialStatus)
                      }
                      className="h-10 px-2.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)]"
                    >
                      {OUTREACH_PIPELINE_STAGES.map((stage) => (
                        <option key={stage.id} value={stage.id}>
                          {stage.shortLabel}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-2">
                      <a
                        href={buildProspectDemoUrl(p.business_name, p.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 min-h-[40px] px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--rivo-volt-text)]"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Demo
                      </a>
                      <button
                        type="button"
                        onClick={() => openProspectDetail(p)}
                        className="min-h-[40px] px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--rivo-volt)] text-xs font-medium text-[var(--text-primary)]"
                      >
                        Dettagli
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="h-11 bg-[var(--bg-canvas)] border-b border-[var(--border-subtle)] text-[11px] font-mono uppercase text-[var(--text-muted)]">
                    <th className="px-4 w-10">
                      <input
                        aria-label="Seleziona tutti i prospect"
                        type="checkbox"
                        checked={prospects.length > 0 && selectedIds.length === prospects.length}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 accent-[#BFFF00]"
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
                <tbody className="divide-y divide-[var(--border-subtle)] text-sm">
                  {prospects.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => openProspectDetail(p)}
                      className={`h-13 cursor-pointer transition-colors hover:bg-[var(--bg-elevated)] ${
                        activeProspect?.id === p.id ? 'bg-[var(--bg-elevated)]' : ''
                      }`}
                    >
                      <td className="px-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          aria-label={`Seleziona ${p.business_name}`}
                          type="checkbox"
                          checked={selectedIds.includes(p.id)}
                          onChange={() => toggleSelectOne(p.id)}
                          className="w-4 h-4 accent-[#BFFF00]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                          <span>{p.business_name}</span>
                          {p.organization_id && (
                            <StatusBadge tone="volt" variant="solid" size="sm" shape="tag">
                              CLIENTE RIVO
                            </StatusBadge>
                          )}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] truncate max-w-[260px]">
                          {p.address || p.source || 'Fonte registrata'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">
                        <div>{p.category}</div>
                        {p.subcategory && (
                          <div className="text-[11px] text-[var(--text-muted)]">{p.subcategory}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--text-primary)]">{p.city || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {p.website && <Globe className="w-3.5 h-3.5 text-[var(--rivo-volt-text)]" />}
                          {p.business_email && (
                            <Mail className="w-3.5 h-3.5 text-[var(--accent-operational-text)]" />
                          )}
                          {p.business_phone && (
                            <Phone className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                          )}
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
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[var(--rivo-volt-bg)] border border-[var(--rivo-volt-border)] text-[var(--rivo-volt-text)] hover:border-[var(--rivo-volt)] text-[10px] font-mono transition-colors"
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
                        <StatusBadge
                          tone={getScoreTone(p.lead_score)}
                          variant={p.lead_score >= 80 ? 'solid' : 'soft'}
                          size="sm"
                          shape="tag"
                          className="tabular-nums"
                        >
                          {p.lead_score}/100
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          aria-label={`Stato pipeline per ${p.business_name}`}
                          value={p.commercial_status}
                          onChange={(e) =>
                            handleStageChange(p.id, e.target.value as OutreachCommercialStatus)
                          }
                          className="h-9 px-2.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--rivo-volt)]"
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
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--rivo-volt)] text-xs text-[var(--rivo-volt-text)]"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Demo
                          </a>
                          <button
                            type="button"
                            onClick={() => openProspectDetail(p)}
                            className="px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--rivo-volt)] text-xs text-[var(--text-primary)]"
                          >
                            Dettagli
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </SurfaceCard>

      {/* Lateral Detail Drawer */}
      {activeProspect && (
        <aside
          aria-label={`Scheda prospect ${activeProspect.business_name}`}
          className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-[var(--bg-canvas)] border-l border-[var(--border-subtle)] shadow-2xl overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-6"
        >
          <div className="flex items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--rivo-volt-text)]">
                  SCHEDA PROSPECT
                </span>
                <StatusBadge
                  tone={getScoreTone(activeProspect.lead_score)}
                  variant={activeProspect.lead_score >= 80 ? 'solid' : 'soft'}
                  size="sm"
                  shape="tag"
                  className="tabular-nums"
                >
                  Score {activeProspect.lead_score}/100
                </StatusBadge>
                <StatusBadge tone="neutral" size="sm" shape="tag" className="tabular-nums">
                  Confidenza {activeProspect.confidence_score}%
                </StatusBadge>
                {demoOpenedLogs.length > 0 && (
                  <StatusBadge tone="telemetry" size="sm" shape="tag" className="tabular-nums">
                    <Eye className="w-3 h-3" />
                    Demo Aperta ({demoOpenedLogs.length}x) •{' '}
                    {new Date(demoOpenedLogs[0].created_at).toLocaleString('it-IT')}
                  </StatusBadge>
                )}
                {demoCtaLogs.length > 0 && (
                  <StatusBadge tone="volt" variant="solid" size="sm" shape="tag">
                    <CheckCircle2 className="w-3 h-3" />
                    Richiesta Attivazione dalla Demo
                  </StatusBadge>
                )}
              </div>
              <h2 className="font-display text-xl font-bold text-[var(--text-primary)] mt-1.5">
                {activeProspect.business_name}
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                {activeProspect.category}{' '}
                {activeProspect.subcategory ? `• ${activeProspect.subcategory}` : ''} •{' '}
                {activeProspect.city || 'Città non specificata'}
              </p>
            </div>
            <button
              type="button"
              aria-label="Chiudi scheda prospect"
              onClick={() => setActiveProspect(null)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rivo-volt)]"
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
              className="inline-flex items-center gap-2 min-h-[40px] px-3.5 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--rivo-volt-border)] hover:border-[var(--rivo-volt)] text-xs font-semibold text-[var(--rivo-volt-text)]"
            >
              <Cpu className="w-3.5 h-3.5" />
              {activeProspect.ai_analysis ? 'Riesegui Analisi AI' : 'Analizza con AI'}
            </button>

            <Link
              href={`/admin/outreach/communications?prospectId=${activeProspect.id}`}
              className="inline-flex items-center gap-2 min-h-[40px] px-3.5 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-xs font-medium text-[var(--text-primary)]"
            >
              <Send className="w-3.5 h-3.5" />
              Invia Comunicazione
            </Link>

            <button
              type="button"
              disabled={actionBusy || findingIgId === activeProspect.id}
              onClick={handleFindInstagramForActive}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-lg bg-[var(--rivo-volt-bg)] border border-[var(--rivo-volt-border)] hover:border-[var(--rivo-volt)] text-xs font-semibold text-[var(--rivo-volt-text)] disabled:opacity-50"
            >
              {findingIgId === activeProspect.id ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Ricerca IG…
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
                  className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--rivo-volt)] text-xs font-medium text-[var(--rivo-volt-text)]"
                >
                  <Send className="w-3.5 h-3.5" />
                  Invia DM IG (Coda)
                </Link>
                {activeIgDmUrl && (
                  <a
                    href={activeIgDmUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--rivo-volt)] text-xs font-mono text-[var(--text-primary)]"
                  >
                    <InstagramIcon className="w-3.5 h-3.5 text-[var(--rivo-volt-text)]" />
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
                  className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--rivo-volt-border)] hover:border-[var(--rivo-volt)] text-xs font-medium text-[var(--rivo-volt-text)]"
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
                  className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--rivo-volt)] text-xs font-medium text-[var(--text-primary)]"
                >
                  {copiedDemoUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[var(--rivo-volt-text)]" />
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
                  className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[var(--rivo-volt-ink)] text-xs font-bold uppercase tracking-wide touch-press"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  CONVERTI IN CLIENTE RIVO
                </button>
                <Link
                  href={`/admin/organizations/new?outreachProspectId=${activeProspect.id}`}
                  className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  Apri Wizard Organizzazione
                </Link>
              </>
            ) : (
              <Link
                href={`/admin/organizations/${activeProspect.organization_id}`}
                className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-lg bg-[var(--rivo-volt)] text-[var(--rivo-volt-ink)] text-xs font-bold"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Apri Organizzazione RIVO Convertita
              </Link>
            )}
          </div>

          {/* Demo CTA Summary Card */}
          {demoCtaLogs.length > 0 && latestCtaMeta && (
            <SurfaceCard padding="sm" className="border-[var(--rivo-volt-border)] bg-[var(--rivo-volt-bg)] space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono uppercase font-bold text-[var(--rivo-volt-text)]">
                  Richiesta Attivazione dalla Demo
                </span>
                <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                  {new Date(demoCtaLogs[0].created_at).toLocaleString('it-IT')}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
                <div>
                  <span className="text-[var(--text-muted)]">Referente: </span>
                  <span className="text-[var(--text-primary)] font-medium">
                    {String(latestCtaMeta.contact_name || 'Non indicato')}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">Telefono: </span>
                  <span className="text-[var(--text-primary)] font-mono">
                    {String(latestCtaMeta.contact_phone || 'Non indicato')}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">Orario preferito: </span>
                  <span className="text-[var(--text-primary)]">
                    {String(latestCtaMeta.preferred_time || 'Non indicato')}
                  </span>
                </div>
              </div>
              {Boolean(latestCtaMeta.note) && (
                <div className="pt-1 text-[var(--text-primary)]">
                  <span className="text-[var(--text-muted)]">Nota: </span>
                  {String(latestCtaMeta.note)}
                </div>
              )}
            </SurfaceCard>
          )}

          {/* Convert Modal */}
          {showConvertModal && (
            <SurfaceCard padding="md" className="border-[var(--rivo-volt)]">
              <form onSubmit={handleConvertToClient} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--rivo-volt-text)]">
                    Conversione Transazionale in Organizzazione RIVO
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowConvertModal(false)}
                    className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    Annulla
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="convert-owner-first"
                      className="block text-[11px] text-[var(--text-secondary)] mb-1"
                    >
                      Nome Referente
                    </label>
                    <input
                      id="convert-owner-first"
                      type="text"
                      required
                      value={convertOwnerFirstName}
                      onChange={(e) => setConvertOwnerFirstName(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="convert-owner-last"
                      className="block text-[11px] text-[var(--text-secondary)] mb-1"
                    >
                      Cognome Referente
                    </label>
                    <input
                      id="convert-owner-last"
                      type="text"
                      required
                      value={convertOwnerLastName}
                      onChange={(e) => setConvertOwnerLastName(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="convert-owner-email"
                      className="block text-[11px] text-[var(--text-secondary)] mb-1"
                    >
                      Email Account Titolare *
                    </label>
                    <input
                      id="convert-owner-email"
                      type="email"
                      required
                      value={convertOwnerEmail}
                      onChange={(e) => setConvertOwnerEmail(e.target.value)}
                      placeholder="titolare@locale.it"
                      className="w-full h-10 px-3 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="convert-owner-password"
                      className="block text-[11px] text-[var(--text-secondary)] mb-1"
                    >
                      Password Iniziale *
                    </label>
                    <input
                      id="convert-owner-password"
                      type="text"
                      required
                      value={convertOwnerPassword}
                      onChange={(e) => setConvertOwnerPassword(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)]"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={actionBusy}
                    className="min-h-[40px] px-4 py-2 rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[var(--rivo-volt-ink)] text-xs font-bold"
                  >
                    Conferma Creazione Organizzazione
                  </button>
                </div>
              </form>
            </SurfaceCard>
          )}

          {/* Co-Branding Demo Preview & Custom Logo */}
          <SurfaceCard padding="sm" className="space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase text-[var(--rivo-volt-text)]">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Anteprima Co-Branding Link Demo (RIVO + Attività)</span>
              </div>
              <StatusBadge tone="neutral" size="sm" shape="tag">
                {activeProspect.digital_signals?.customLogoUrl
                  ? 'Logo Custom'
                  : activeProspect.digital_signals?.logoUrl
                  ? (activeProspect.digital_signals as { logoSource?: string })?.logoSource ||
                    'Rilevato Online'
                  : 'Monogramma Auto'}
              </StatusBadge>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
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
                <span className="text-xs font-mono font-bold text-[var(--text-muted)]">+</span>
                {showActiveLogoImage && activeProxyLogoUrl ? (
                  <div className="w-9 h-9 rounded-xl bg-white border border-white/90 flex items-center justify-center overflow-hidden p-1 shadow-sm shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeProxyLogoUrl}
                      alt={activeProspect.business_name}
                      width={36}
                      height={36}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                      onError={() => setFailedLogoUrl(activeProxyLogoUrl)}
                    />
                  </div>
                ) : (
                  <div
                    className="w-9 h-9 rounded-xl bg-[var(--bg-elevated)] border border-[var(--rivo-volt-border)] flex items-center justify-center shadow-sm shrink-0"
                    aria-label={activeProspect.business_name}
                  >
                    <span className="text-xs font-black tracking-tight text-[var(--rivo-volt-text)] select-none">
                      {getBusinessInitials(activeProspect.business_name)}
                    </span>
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                  RIVO + {activeProspect.business_name}
                </div>
                <div className="text-[11px] text-[var(--text-muted)] truncate">
                  {activeLogoUrl ||
                    `Monogramma: ${getBusinessInitials(activeProspect.business_name)}`}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="prospect-custom-logo-url"
                className="block text-[11px] text-[var(--text-secondary)]"
              >
                URL Logo Attività (PNG/JPG pubblico, opzionale)
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  id="prospect-custom-logo-url"
                  type="text"
                  value={customLogoDraft}
                  onChange={(e) => setCustomLogoDraft(e.target.value)}
                  placeholder="https://esempio.it/logo.png"
                  className="flex-1 min-w-[200px] h-10 px-3 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--rivo-volt)]"
                />
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={handleSaveCustomLogo}
                  className="h-10 px-3.5 rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[var(--rivo-volt-ink)] text-xs font-bold disabled:opacity-50"
                >
                  Salva Logo
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={handleDiscoverLogo}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--rivo-volt-border)] hover:border-[var(--rivo-volt)] text-xs font-medium text-[var(--rivo-volt-text)] disabled:opacity-50"
                >
                  <Cpu className={`w-3.5 h-3.5 ${discoveringLogo ? 'animate-pulse' : ''}`} />
                  {discoveringLogo ? 'Ricerca Logo…' : 'Cerca Logo Auto'}
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
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--rivo-volt)] text-xs font-medium text-[var(--text-primary)] disabled:opacity-50"
                >
                  <Upload className={`w-3.5 h-3.5 ${uploadingLogo ? 'animate-bounce' : ''}`} />
                  {uploadingLogo ? 'Caricamento…' : 'Carica File'}
                </button>

                {activeProspect.website && (
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={handleEnrichWebsiteLogo}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--rivo-volt)] text-xs font-medium text-[var(--text-primary)] disabled:opacity-50"
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
                    ? 'text-[var(--accent-critical-text)]'
                    : logoFeedback.type === 'info'
                    ? 'text-[var(--accent-warning-text)]'
                    : 'text-[var(--rivo-volt-text)]'
                }`}
              >
                {logoFeedback.message}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                Appare nella card anteprima su WhatsApp/Telegram e dentro la demo interattiva quando condividi il link.
              </p>
              {activeOgCardUrl && (
                <a
                  href={activeOgCardUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--rivo-volt-text)] underline-offset-2 hover:underline shrink-0"
                >
                  <ExternalLink className="w-3 h-3" />
                  Anteprima Card Social
                </a>
              )}
            </div>
          </SurfaceCard>

          {/* Provenance & Contacts */}
          <SurfaceCard padding="sm" className="space-y-2 text-xs">
            <div className="text-[11px] font-mono uppercase text-[var(--text-secondary)]">
              Dati Commerciali e Provenienza Tracciabile
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-[var(--text-muted)]">Indirizzo: </span>
                <span className="text-[var(--text-primary)]">
                  {activeProspect.address || 'Non disponibile'}
                </span>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Telefono: </span>
                <span className="text-[var(--text-primary)] font-mono">
                  {activeProspect.business_phone || 'Non disponibile'}
                </span>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Email: </span>
                <span className="text-[var(--text-primary)] font-mono">
                  {activeProspect.business_email || 'Non disponibile'}
                </span>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Sito Web: </span>
                {activeProspect.website ? (
                  <a
                    href={activeProspect.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--rivo-volt-text)] hover:underline inline-flex items-center gap-1"
                  >
                    {activeProspect.website_domain || activeProspect.website}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-[var(--text-primary)]">Non rilevato</span>
                )}
              </div>
              <div className="md:col-span-2 flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[var(--text-muted)]">Instagram: </span>
                {activeProspect.instagram_url ? (
                  <>
                    <a
                      href={activeProspect.instagram_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--rivo-volt-text)] hover:underline inline-flex items-center gap-1 font-mono"
                    >
                      <InstagramIcon className="w-3.5 h-3.5" />
                      @{activeIgHandle || 'instagram'}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    {activeIgDmUrl && (
                      <a
                        href={activeIgDmUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--rivo-volt-bg)] border border-[var(--rivo-volt-border)] hover:border-[var(--rivo-volt)] text-[11px] font-mono text-[var(--rivo-volt-text)]"
                      >
                        ig.me/m/@{activeIgHandle || 'instagram'}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                    <Link
                      href={`/admin/outreach/communications?tab=instagram_dm&prospectId=${encodeURIComponent(
                        activeProspect.id
                      )}`}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--rivo-volt)] text-[11px] text-[var(--text-primary)]"
                    >
                      <Send className="w-2.5 h-2.5 text-[var(--rivo-volt-text)]" />
                      Invia DM IG (Coda)
                    </Link>
                  </>
                ) : (
                  <span className="text-[var(--text-primary)]">Non rilevato</span>
                )}
                <button
                  type="button"
                  disabled={actionBusy || findingIgId === activeProspect.id}
                  onClick={handleFindInstagramForActive}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--rivo-volt)] text-[11px] text-[var(--rivo-volt-text)] disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-2.5 h-2.5 ${
                      findingIgId === activeProspect.id ? 'animate-spin' : ''
                    }`}
                  />
                  {findingIgId === activeProspect.id ? 'Ricerca IG…' : 'Cerca IG con AI'}
                </button>
              </div>
            </div>
            <div className="pt-2 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)] font-mono">
              Fonte: {activeProspect.source} ({activeProspect.source_reference || 'N/D'}) •
              Acquisito il {new Date(activeProspect.source_acquired_at).toLocaleString('it-IT')}
            </div>
          </SurfaceCard>

          {/* Duplicate warning if any */}
          {activeDetail && activeDetail.duplicateCandidates.length > 0 && (
            <SurfaceCard variant="warning" padding="sm" className="space-y-2">
              <div className="text-xs font-semibold text-[var(--accent-warning-text)] flex items-center gap-2">
                <GitMerge className="w-4 h-4" />
                Possibili Schede Duplicate Rilevate ({activeDetail.duplicateCandidates.length})
              </div>
              {activeDetail.duplicateCandidates.map((dup) => (
                <div
                  key={dup.id}
                  className="flex items-center justify-between gap-2 text-xs bg-[var(--bg-canvas)] p-2.5 rounded-lg border border-[var(--border-subtle)]"
                >
                  <div>
                    <span className="font-medium text-[var(--text-primary)]">{dup.business_name}</span>
                    <span className="text-[var(--text-muted)] ml-2">{dup.city}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleMergeDuplicate(dup.id)}
                    className="px-2.5 py-1 rounded-md bg-[var(--rivo-volt)] text-[var(--rivo-volt-ink)] font-semibold text-[11px]"
                  >
                    Unisci Schede
                  </button>
                </div>
              ))}
            </SurfaceCard>
          )}

          {/* AI Analysis Summary & Opportunities */}
          <SurfaceCard padding="sm" className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-mono uppercase text-[var(--rivo-volt-text)]">
                AI Business Intelligence &amp; Opportunità RIVO
              </span>
              <Link
                href={`/admin/outreach/intelligence?prospectId=${activeProspect.id}`}
                className="text-xs text-[var(--rivo-volt-text)] hover:underline"
              >
                Apri vista completa AI →
              </Link>
            </div>
            <p className="text-xs text-[var(--text-primary)] leading-relaxed">
              {activeProspect.ai_analysis?.executiveSummary ||
                'Nessuna analisi AI ancora eseguita per questa attività. Clicca "Analizza con AI" per valutare opportunità e punteggio.'}
            </p>

            {Array.isArray(activeProspect.ai_analysis?.opportunities) &&
              activeProspect.ai_analysis.opportunities.length > 0 && (
                <div className="space-y-2 pt-2">
                  {activeProspect.ai_analysis.opportunities.map((opp, idx) => (
                    <div
                      key={`${opp.moduleSlug}-${idx}`}
                      className="p-2.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[var(--text-primary)]">
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
                            ? 'Opportunità Confermata'
                            : opp.verificationStatus === 'plausible'
                            ? 'Opportunità Plausibile'
                            : 'Non Verificabile Online'}
                        </StatusBadge>
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-1">{opp.rationale}</p>
                    </div>
                  ))}
                </div>
              )}
          </SurfaceCard>

          {/* Commercial Notes */}
          <SurfaceCard padding="sm" className="space-y-2">
            <label
              htmlFor="prospect-admin-notes"
              className="block text-[11px] font-mono uppercase text-[var(--text-secondary)]"
            >
              Note Commerciali Admin
            </label>
            <textarea
              id="prospect-admin-notes"
              rows={3}
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              placeholder="Annotazioni su chiamata, referente, orario migliore per ricontatto…"
              className="w-full p-3 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--rivo-volt)]"
            />
            <div className="flex justify-between items-center pt-1">
              <button
                type="button"
                onClick={() => handleGdprDelete(activeProspect.id)}
                className="inline-flex items-center gap-1.5 min-h-[36px] text-xs text-[var(--accent-critical-text)] hover:underline"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Cancellazione GDPR
              </button>
              <button
                type="button"
                disabled={actionBusy}
                onClick={handleSaveNotes}
                className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--rivo-volt)] text-xs font-medium text-[var(--text-primary)]"
              >
                Salva Note
              </button>
            </div>
          </SurfaceCard>

          {/* Demo Telemetry & Communication History */}
          {detailLoading ? (
            <div className="text-xs font-mono text-[var(--text-muted)]">Caricamento storico…</div>
          ) : (
            activeDetail && (
              <>
                <SurfaceCard padding="sm" className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-mono uppercase text-[var(--text-secondary)] tabular-nums">
                      Eventi Demo Interattiva ({demoTelemetryLogs.length})
                    </div>
                    {demoInteractionLogs.length > 0 && (
                      <span className="text-[11px] font-mono tabular-nums text-[var(--rivo-volt-text)]">
                        {demoInteractionLogs.length} interazioni
                      </span>
                    )}
                  </div>
                  {demoTelemetryLogs.length === 0 ? (
                    <p className="text-xs text-[var(--text-muted)]">
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
                            className="p-2 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs flex flex-wrap items-center justify-between gap-2"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusBadge
                                tone={
                                  evt.action === 'demo_cta_submitted'
                                    ? 'volt'
                                    : evt.action === 'demo_opened'
                                    ? 'telemetry'
                                    : 'neutral'
                                }
                                size="sm"
                                shape="tag"
                              >
                                {eventLabel}
                              </StatusBadge>
                              {detailParts.length > 0 && (
                                <span className="text-[11px] text-[var(--text-secondary)] font-mono">
                                  {detailParts.join(' • ')}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-mono text-[var(--text-muted)]">
                              {new Date(evt.created_at).toLocaleString('it-IT')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </SurfaceCard>

                <SurfaceCard padding="sm" className="space-y-2">
                  <div className="text-[11px] font-mono uppercase text-[var(--text-secondary)] tabular-nums">
                    Storico Comunicazioni ({activeDetail.messages.length})
                  </div>
                  {activeDetail.messages.length === 0 ? (
                    <p className="text-xs text-[var(--text-muted)]">
                      Nessun messaggio inviato o ricevuto.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {activeDetail.messages.map((m) => (
                        <div
                          key={m.id}
                          className="p-2.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs"
                        >
                          <div className="flex justify-between text-[11px] font-mono text-[var(--text-secondary)]">
                            <span>
                              {m.direction === 'outbound' ? 'INVIATO' : 'RICEVUTO'} • {m.channel}
                            </span>
                            <span>{m.provider_status}</span>
                          </div>
                          {m.subject && (
                            <div className="font-semibold text-[var(--text-primary)] mt-1">
                              {m.subject}
                            </div>
                          )}
                          <p className="text-[var(--text-secondary)] mt-1 whitespace-pre-line">
                            {m.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </SurfaceCard>
              </>
            )
          )}
        </aside>
      )}
    </div>
  );
}
