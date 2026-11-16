'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  MapPin,
  Globe,
  Phone,
  Mail,
  Plus,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowUpRight,
  Database,
  Cpu,
  FileSpreadsheet,
  Compass,
  ExternalLink,
  Navigation,
  Send,
} from 'lucide-react';
import {
  PageHeader,
  KpiCard,
  SurfaceCard,
  StatusBadge,
  EmptyState,
} from '@/components/ui';
import { InstagramIcon } from '@/components/brand-icons';
import {
  buildInstagramDmDeepLink,
  extractInstagramHandle,
} from '@/lib/outreach/instagram';
import {
  OUTREACH_DISCOVERY_CATEGORIES,
  type OutreachProspectRecord,
} from '@/lib/outreach/types';
import {
  CAMPANIA_GEO_PRESETS,
  type CampaniaGeoPreset,
} from '@/lib/outreach/providers/discovery';
import OutreachInteractiveMap from '@/components/outreach/OutreachInteractiveMap';

interface ProviderInfo {
  id: string;
  name: string;
  providerType: string;
  attribution: string;
  configured: boolean;
}

export default function OutreachDiscoveryPage() {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [campaniaPresets, setCampaniaPresets] = useState<CampaniaGeoPreset[]>(CAMPANIA_GEO_PRESETS);
  const [activePresetId, setActivePresetId] = useState<string | null>('campania_wide');
  const [locationQuery, setLocationQuery] = useState('Napoli');
  const [centerLat, setCenterLat] = useState<number>(40.8518);
  const [centerLon, setCenterLon] = useState<number>(14.2681);
  const [radiusKm, setRadiusKm] = useState(35);
  const [category, setCategory] = useState<string>('food_beverage');
  const [subcategory, setSubcategory] = useState<string>('restaurant');
  const [maxResults, setMaxResults] = useState(25);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([
    'google_places_official',
    'openstreetmap_odbl',
  ]);

  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const mapSectionRef = useRef<HTMLDivElement | null>(null);
  const [existingProspects, setExistingProspects] = useState<OutreachProspectRecord[]>([]);
  const [selectedProspect, setSelectedProspect] = useState<OutreachProspectRecord | null>(null);
  const [newlyInsertedIds, setNewlyInsertedIds] = useState<Set<string>>(new Set());
  const [searchWarnings, setSearchWarnings] = useState<string[]>([]);
  const [searchResult, setSearchResult] = useState<{
    discoveredCount: number;
    insertedCount: number;
    duplicatesSkipped: number;
    analyzedCount: number;
    instagramDiscoveredCount: number;
    items: OutreachProspectRecord[];
  } | null>(null);

  // Manual Entry State
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    business_name: '',
    category: 'food_beverage',
    subcategory: 'restaurant',
    city: 'Napoli',
    province: 'NA',
    region: 'Campania',
    address: '',
    website: '',
    instagram_url: '',
    facebook_url: '',
    business_phone: '',
    business_email: '',
    description: '',
    source: 'manual_admin_entry',
  });
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualFeedback, setManualFeedback] = useState<string | null>(null);

  // CSV Import State
  const [csvText, setCsvText] = useState('');
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvImporting, setCsvImporting] = useState(false);

  const loadProviders = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/outreach/discovery', { cache: 'no-store' });
      const json = await res.json();
      if (res.ok) {
        if (json.providers) setProviders(json.providers);
        if (Array.isArray(json.campaniaPresets) && json.campaniaPresets.length > 0) {
          setCampaniaPresets(json.campaniaPresets);
        }
        if (Array.isArray(json.existingProspects)) {
          setExistingProspects(json.existingProspects);
        }
      }
    } catch {
      // ignore initial load error
    }
  }, []);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  const subcategoriesForSelected =
    OUTREACH_DISCOVERY_CATEGORIES.find((c) => c.id === category)?.subcategories || [];

  const handleCategoryChange = (nextCategory: string) => {
    setCategory(nextCategory);
    const found = OUTREACH_DISCOVERY_CATEGORIES.find((c) => c.id === nextCategory);
    if (found && found.subcategories.length > 0) {
      setSubcategory(found.subcategories[0].id);
    } else {
      setSubcategory('');
    }
  };

  const toggleProvider = (id: string) => {
    setSelectedProviders((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSelectPreset = (preset: CampaniaGeoPreset) => {
    setActivePresetId(preset.id);
    setLocationQuery(preset.query);
    setCenterLat(preset.lat);
    setCenterLon(preset.lon);
    setRadiusKm(preset.radiusKm);
  };

  const executeDiscovery = async (opts?: { overrideLat?: number; overrideLon?: number }) => {
    if (!locationQuery.trim() && opts?.overrideLat == null) return;
    setSearching(true);
    setSearchError(null);
    setSearchWarnings([]);

    const useCustomCoords = opts?.overrideLat != null && opts?.overrideLon != null;
    const reqLat = useCustomCoords
      ? opts.overrideLat
      : activePresetId
      ? centerLat
      : null;
    const reqLon = useCustomCoords
      ? opts.overrideLon
      : activePresetId
      ? centerLon
      : null;

    try {
      const res = await fetch('/api/admin/outreach/discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start_discovery',
          locationQuery: locationQuery.trim() || 'Napoli',
          radiusKm,
          centerLat: reqLat,
          centerLon: reqLon,
          category,
          subcategory: subcategory || undefined,
          maxResults,
          providerIds:
            selectedProviders.length > 0
              ? selectedProviders
              : ['google_places_official', 'openstreetmap_odbl'],
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Errore durante la ricerca delle attività');
      }

      const jobRes = json.job?.result || {};
      const insertedProspects: OutreachProspectRecord[] = json.insertedProspects || [];
      const allSearchProspects: OutreachProspectRecord[] =
        json.allSearchProspects && json.allSearchProspects.length > 0
          ? json.allSearchProspects
          : insertedProspects;

      if (json.searchCenter) {
        setCenterLat(json.searchCenter.lat);
        setCenterLon(json.searchCenter.lon);
      }

      const newIdSet = new Set(insertedProspects.map((p) => p.id));
      setNewlyInsertedIds(newIdSet);
      setSearchWarnings(Array.isArray(jobRes.warnings) ? jobRes.warnings : []);

      const sortedSearchProspects = [...allSearchProspects].sort(
        (a, b) => (b.lead_score || 0) - (a.lead_score || 0)
      );
      const analyzedInResult = sortedSearchProspects.filter(
        (p) => Boolean(p.ai_analysis) || (p.lead_score ?? 0) > 0
      ).length;
      const instagramInResult = sortedSearchProspects.filter((p) =>
        Boolean(p.instagram_url)
      ).length;

      setSearchResult({
        discoveredCount: jobRes.discoveredTotal ?? sortedSearchProspects.length,
        insertedCount: jobRes.insertedCount ?? insertedProspects.length,
        duplicatesSkipped: jobRes.skippedDuplicates ?? 0,
        analyzedCount: jobRes.analyzedCount ?? analyzedInResult,
        instagramDiscoveredCount:
          typeof jobRes.instagramDiscoveredCount === 'number'
            ? jobRes.instagramDiscoveredCount
            : instagramInResult,
        items: sortedSearchProspects,
      });

      // Merge results into existingProspects for map plotting & pick first geo pin
      setExistingProspects((prev) => {
        const map = new Map<string, OutreachProspectRecord>();
        for (const item of sortedSearchProspects) map.set(item.id, item);
        for (const old of prev) {
          if (!map.has(old.id)) map.set(old.id, old);
        }
        return Array.from(map.values());
      });

      const firstMappable =
        sortedSearchProspects.find((p) => p.latitude != null && p.longitude != null) ||
        sortedSearchProspects[0] ||
        null;
      if (firstMappable) {
        setSelectedProspect(firstMappable);
      }
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Errore imprevisto');
    } finally {
      setSearching(false);
    }
  };

  const handleRunDiscovery = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeDiscovery();
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualSubmitting(true);
    setManualFeedback(null);
    try {
      const res = await fetch('/api/admin/outreach/discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'manual_import',
          items: [manualForm],
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Errore salvataggio prospect manuale');
      }
      setManualFeedback(
        `Acquisizione completata: ${json.insertedCount} inserito, ${json.duplicatesCount} duplicato rilevato.`
      );
      setManualForm({
        ...manualForm,
        business_name: '',
        address: '',
        website: '',
        instagram_url: '',
        facebook_url: '',
        business_phone: '',
        business_email: '',
        description: '',
      });
    } catch (err) {
      setManualFeedback(err instanceof Error ? err.message : 'Errore salvataggio');
    } finally {
      setManualSubmitting(false);
    }
  };

  const handleCsvImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim()) return;
    setCsvImporting(true);
    setManualFeedback(null);

    try {
      const lines = csvText
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

      if (lines.length < 2) {
        throw new Error('Inserire almeno una riga di intestazione e una riga dati CSV.');
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const parsedItems = lines
        .slice(1)
        .map((line) => {
          const cols = line.split(',').map((c) => c.trim());
          const row: Record<string, string> = {};
          headers.forEach((h, i) => {
            row[h] = cols[i] || '';
          });

          return {
            business_name: row.business_name || row.nome || '',
            category: row.category || category,
            subcategory: row.subcategory || row.sottocategoria || subcategory,
            city: row.city || row.citta || locationQuery,
            province: row.province || row.provincia || '',
            address: row.address || row.indirizzo || '',
            website: row.website || row.website_url || row.sito || '',
            instagram_url: row.instagram_url || row.instagram || '',
            business_phone: row.business_phone || row.phone || row.telefono || '',
            business_email: row.business_email || row.email || '',
            source: 'csv_admin_import',
          };
        })
        .filter((p) => p.business_name.length >= 2);

      if (parsedItems.length === 0) {
        throw new Error('Nessuna riga valida trovata (colonna business_name o nome richiesta).');
      }

      const res = await fetch('/api/admin/outreach/discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'manual_import',
          items: parsedItems,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Errore importazione CSV');

      setManualFeedback(
        `CSV importato: ${json.insertedCount} nuovi prospect creati, ${json.duplicatesCount} duplicati ignorati.`
      );
      setCsvText('');
      setShowCsvModal(false);
    } catch (err) {
      setManualFeedback(err instanceof Error ? err.message : 'Errore importazione CSV');
    } finally {
      setCsvImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="RIVO OUTREACH — BUSINESS DISCOVERY"
        title="Ricerca e Acquisizione Attività — Priority Maps & Campania"
        description="Motore geografico prioritario su Maps centrato su Napoli e Campania a lungo raggio (fino a 120 km), con mappa interattiva live e anteprima schede Google Maps."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowManualModal((v) => !v)}
              className="inline-flex items-center gap-2 min-h-[44px] px-3.5 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-xs font-medium text-[var(--text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rivo-volt)]"
            >
              <Plus className="w-3.5 h-3.5 text-[var(--rivo-volt-text)]" />
              Inserimento Manuale
            </button>
            <button
              type="button"
              onClick={() => setShowCsvModal((v) => !v)}
              className="inline-flex items-center gap-2 min-h-[44px] px-3.5 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-xs font-medium text-[var(--text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rivo-volt)]"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
              Importa CSV
            </button>
            <Link
              href="/admin/outreach/prospects"
              className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[var(--rivo-volt-ink)] text-xs font-semibold transition-colors touch-press"
            >
              Apri CRM Prospect
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        }
      />

      {manualFeedback && (
        <SurfaceCard padding="sm" className="border-[var(--rivo-volt-border)]">
          <div className="text-xs text-[var(--text-primary)] flex items-center justify-between gap-3">
            <span>{manualFeedback}</span>
            <button
              type="button"
              onClick={() => setManualFeedback(null)}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium shrink-0 px-2 py-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rivo-volt)]"
            >
              Chiudi
            </button>
          </div>
        </SurfaceCard>
      )}

      {/* Manual Entry Panel */}
      {showManualModal && (
        <SurfaceCard padding="lg">
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
              <h2 className="font-display text-sm font-semibold text-[var(--text-primary)]">
                Inserimento Diretto Attività Commerciale (con Provenienza Tracciata)
              </h2>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2 py-1 rounded"
              >
                Chiudi
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="manual-business-name"
                  className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-secondary)] mb-1.5"
                >
                  Nome Attività *
                </label>
                <input
                  id="manual-business-name"
                  type="text"
                  required
                  value={manualForm.business_name}
                  onChange={(e) => setManualForm({ ...manualForm, business_name: e.target.value })}
                  placeholder="Es. Osteria del Porto"
                  className="w-full h-11 px-3.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--rivo-volt)]"
                />
              </div>

              <div>
                <label
                  htmlFor="manual-category"
                  className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-secondary)] mb-1.5"
                >
                  Categoria *
                </label>
                <select
                  id="manual-category"
                  value={manualForm.category}
                  onChange={(e) =>
                    setManualForm({
                      ...manualForm,
                      category: e.target.value,
                    })
                  }
                  className="w-full h-11 px-3.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--rivo-volt)]"
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
                  htmlFor="manual-subcategory"
                  className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-secondary)] mb-1.5"
                >
                  Sottocategoria
                </label>
                <input
                  id="manual-subcategory"
                  type="text"
                  value={manualForm.subcategory}
                  onChange={(e) => setManualForm({ ...manualForm, subcategory: e.target.value })}
                  placeholder="Es. restaurant / barber"
                  className="w-full h-11 px-3.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--rivo-volt)]"
                />
              </div>

              <div>
                <label
                  htmlFor="manual-city"
                  className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-secondary)] mb-1.5"
                >
                  Città
                </label>
                <input
                  id="manual-city"
                  type="text"
                  value={manualForm.city}
                  onChange={(e) => setManualForm({ ...manualForm, city: e.target.value })}
                  placeholder="Napoli"
                  className="w-full h-11 px-3.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--rivo-volt)]"
                />
              </div>

              <div>
                <label
                  htmlFor="manual-address"
                  className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-secondary)] mb-1.5"
                >
                  Indirizzo Commerciale
                </label>
                <input
                  id="manual-address"
                  type="text"
                  value={manualForm.address}
                  onChange={(e) => setManualForm({ ...manualForm, address: e.target.value })}
                  placeholder="Via Toledo 148"
                  className="w-full h-11 px-3.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--rivo-volt)]"
                />
              </div>

              <div>
                <label
                  htmlFor="manual-website"
                  className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-secondary)] mb-1.5"
                >
                  Sito Web
                </label>
                <input
                  id="manual-website"
                  type="url"
                  value={manualForm.website}
                  onChange={(e) => setManualForm({ ...manualForm, website: e.target.value })}
                  placeholder="https://…"
                  className="w-full h-11 px-3.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--rivo-volt)]"
                />
              </div>

              <div>
                <label
                  htmlFor="manual-instagram"
                  className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-secondary)] mb-1.5"
                >
                  URL Instagram
                </label>
                <input
                  id="manual-instagram"
                  type="url"
                  value={manualForm.instagram_url}
                  onChange={(e) => setManualForm({ ...manualForm, instagram_url: e.target.value })}
                  placeholder="https://instagram.com/…"
                  className="w-full h-11 px-3.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--rivo-volt)]"
                />
              </div>

              <div>
                <label
                  htmlFor="manual-phone"
                  className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-secondary)] mb-1.5"
                >
                  Telefono Aziendale
                </label>
                <input
                  id="manual-phone"
                  type="text"
                  value={manualForm.business_phone}
                  onChange={(e) => setManualForm({ ...manualForm, business_phone: e.target.value })}
                  placeholder="+39 081 …"
                  className="w-full h-11 px-3.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--rivo-volt)]"
                />
              </div>

              <div>
                <label
                  htmlFor="manual-email"
                  className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-secondary)] mb-1.5"
                >
                  Email Aziendale
                </label>
                <input
                  id="manual-email"
                  type="email"
                  value={manualForm.business_email}
                  onChange={(e) => setManualForm({ ...manualForm, business_email: e.target.value })}
                  placeholder="info@…"
                  className="w-full h-11 px-3.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--rivo-volt)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="manual-description"
                  className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-secondary)] mb-1.5"
                >
                  Descrizione / Servizi Rilevati
                </label>
                <input
                  id="manual-description"
                  type="text"
                  value={manualForm.description}
                  onChange={(e) => setManualForm({ ...manualForm, description: e.target.value })}
                  placeholder="Ristorante di pesce con 60 coperti, menu PDF online…"
                  className="w-full h-11 px-3.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--rivo-volt)]"
                />
              </div>
              <div>
                <label
                  htmlFor="manual-source"
                  className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-secondary)] mb-1.5"
                >
                  Fonte del Dato / Base Giuridica
                </label>
                <input
                  id="manual-source"
                  type="text"
                  value={manualForm.source}
                  onChange={(e) => setManualForm({ ...manualForm, source: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--rivo-volt)]"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={manualSubmitting}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[var(--rivo-volt-ink)] text-xs font-semibold disabled:opacity-50 touch-press"
              >
                {manualSubmitting ? 'Salvataggio e Deduplicazione…' : 'Salva Prospect nel CRM'}
              </button>
            </div>
          </form>
        </SurfaceCard>
      )}

      {/* CSV Import Modal */}
      {showCsvModal && (
        <SurfaceCard padding="lg">
          <form onSubmit={handleCsvImport} className="space-y-4">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
              <h2 className="font-display text-sm font-semibold text-[var(--text-primary)]">
                Importazione Multipla CSV (con Deduplicazione Automatica)
              </h2>
              <button
                type="button"
                onClick={() => setShowCsvModal(false)}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2 py-1 rounded"
              >
                Chiudi
              </button>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Incolla righe CSV con intestazione:{' '}
              <code className="text-[var(--text-primary)] font-mono">
                business_name,category,subcategory,city,address,website,business_phone,business_email
              </code>
            </p>
            <label htmlFor="discovery-csv-input" className="sr-only">
              Contenuto CSV
            </label>
            <textarea
              id="discovery-csv-input"
              rows={5}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={`business_name,category,subcategory,city,address,website,business_phone,business_email\nPizzeria Partenope,food_beverage,pizzeria,Napoli,Via Chiaia 42,https://pizzeriapartenope.example.it,+39081123456,info@pizzeriapartenope.example.it`}
              className="w-full p-3.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--rivo-volt)]"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={csvImporting}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[var(--rivo-volt-ink)] text-xs font-semibold disabled:opacity-50 touch-press"
              >
                {csvImporting ? 'Importazione in corso…' : 'Importa e Deduplica'}
              </button>
            </div>
          </form>
        </SurfaceCard>
      )}

      {/* Main Search Interface */}
      <SurfaceCard padding="lg">
        <form onSubmit={handleRunDiscovery} className="space-y-5">
          {/* Campania Geo-Presets Quick Bar */}
          <div className="space-y-2 pb-4 border-b border-[var(--border-subtle)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.08em] text-[var(--rivo-volt-text)]">
                <Compass className="w-3.5 h-3.5" />
                Focus Territoriale: Napoli &amp; Campania a Largo Raggio
              </span>
              <span className="text-[11px] font-mono tabular-nums text-[var(--text-muted)]">
                Centro: {centerLat.toFixed(4)}, {centerLon.toFixed(4)} • Raggio {radiusKm} km
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {campaniaPresets.map((preset) => {
                const isActive = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    title={`${preset.label} — ${preset.city} (${preset.province}), raggio ${preset.radiusKm} km`}
                    className={`inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg border text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rivo-volt)] ${
                      isActive
                        ? 'bg-[var(--rivo-volt-bg)] border-[var(--rivo-volt-border)] text-[var(--rivo-volt-text)] font-semibold'
                        : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Navigation className="w-3 h-3 shrink-0" />
                    <span>{preset.label}</span>
                    <span className="text-[10px] font-mono tabular-nums opacity-75">
                      {preset.radiusKm}km
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Località */}
            <div>
              <label
                htmlFor="discovery-location-input"
                className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-secondary)] mb-1.5"
              >
                Località / Città Principale
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-[var(--rivo-volt-text)] absolute left-3 top-3.5" />
                <input
                  id="discovery-location-input"
                  type="text"
                  required
                  value={locationQuery}
                  onChange={(e) => {
                    setActivePresetId(null);
                    setLocationQuery(e.target.value);
                  }}
                  placeholder="Es. Napoli, Salerno, Caserta, Sorrento…"
                  className="w-full h-11 pl-9 pr-3.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--rivo-volt)]"
                />
              </div>
            </div>

            {/* Raggio Geografico */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="discovery-radius-number"
                  className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-secondary)]"
                >
                  Raggio (1–120 km)
                </label>
                <span className="text-[10px] font-mono text-[var(--rivo-volt-text)]">
                  {radiusKm >= 50 ? 'Largo raggio' : radiusKm >= 20 ? 'Area metropolitana' : 'Urbano'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  aria-label="Selettore raggio geografico"
                  type="range"
                  min={1}
                  max={120}
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="w-full accent-[#BFFF00] cursor-pointer"
                />
                <input
                  id="discovery-radius-number"
                  type="number"
                  min={1}
                  max={120}
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Math.max(1, Math.min(120, Number(e.target.value) || 1)))}
                  className="w-16 h-11 px-2 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm font-mono tabular-nums text-[var(--text-primary)] text-center focus:outline-none focus:border-[var(--rivo-volt)]"
                />
              </div>
            </div>

            {/* Categoria Commerciale */}
            <div>
              <label
                htmlFor="discovery-category-select"
                className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-secondary)] mb-1.5"
              >
                Categoria Commerciale
              </label>
              <select
                id="discovery-category-select"
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--rivo-volt)]"
              >
                {OUTREACH_DISCOVERY_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sottocategoria */}
            <div>
              <label
                htmlFor="discovery-subcategory-select"
                className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-secondary)] mb-1.5"
              >
                Sottocategoria
              </label>
              <select
                id="discovery-subcategory-select"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--rivo-volt)]"
              >
                {subcategoriesForSelected.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Numero Massimo di Risultati */}
            <div>
              <label
                htmlFor="discovery-max-results"
                className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-secondary)] mb-1.5"
              >
                Max Risultati
              </label>
              <input
                id="discovery-max-results"
                type="number"
                min={1}
                max={50}
                value={maxResults}
                onChange={(e) => setMaxResults(Number(e.target.value))}
                className="w-full h-11 px-3.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm font-mono tabular-nums text-[var(--text-primary)] focus:outline-none focus:border-[var(--rivo-volt)]"
              />
            </div>
          </div>

          {/* Fonti di acquisizione selezionabili */}
          <div className="pt-3 border-t border-[var(--border-subtle)]">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-2">
                <span className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-secondary)]">
                  Fonti di Acquisizione Autorizzate (BusinessDataProvider)
                </span>
                <div className="flex flex-wrap gap-3">
                  {providers.map((p) => {
                    const checked = selectedProviders.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                          checked
                            ? 'bg-[var(--bg-elevated)] border-[var(--rivo-volt)] text-[var(--text-primary)]'
                            : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
                        } ${!p.configured ? 'opacity-50' : ''}`}
                      >
                        <input
                          type="checkbox"
                          disabled={!p.configured}
                          checked={checked}
                          onChange={() => toggleProvider(p.id)}
                          className="w-4 h-4 accent-[#BFFF00]"
                        />
                        <div>
                          <div className="font-medium flex flex-wrap items-center gap-1.5">
                            <Database className="w-3 h-3 text-[var(--rivo-volt-text)]" />
                            <span>{p.name}</span>
                            {p.id === 'google_places_official' && (
                              <StatusBadge tone="volt" size="sm" shape="tag">
                                #1 MAPS PRIORITARIO
                              </StatusBadge>
                            )}
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)]">{p.attribution}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={searching || selectedProviders.length === 0}
                className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-xl bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[var(--rivo-volt-ink)] text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 shrink-0 touch-press"
              >
                {searching ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Ricerca &amp; Analisi AI…
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Avvia ricerca + Analisi AI
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </SurfaceCard>

      {searchError && (
        <SurfaceCard variant="critical" padding="sm">
          <div className="text-sm text-[var(--accent-critical-text)] flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{searchError}</span>
          </div>
        </SurfaceCard>
      )}

      {searchWarnings.length > 0 && (
        <SurfaceCard variant="warning" padding="sm" className="space-y-1">
          {searchWarnings.map((warn, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-[var(--accent-warning-text)]">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{warn}</span>
            </div>
          ))}
        </SurfaceCard>
      )}

      {/* Interactive Geo-Map & Google Maps Preview */}
      <div ref={mapSectionRef}>
        <OutreachInteractiveMap
          centerLat={centerLat}
          centerLon={centerLon}
          locationLabel={locationQuery || 'Napoli'}
          radiusKm={radiusKm}
          prospects={existingProspects}
          newlyInsertedIds={newlyInsertedIds}
          selectedProspect={selectedProspect}
          onSelectProspect={(p) => setSelectedProspect(p)}
          onChangeCenter={(lat, lon, label) => {
            setActivePresetId('custom_map');
            setCenterLat(lat);
            setCenterLon(lon);
            if (label) setLocationQuery(label);
          }}
          onSearchThisArea={(lat, lon) =>
            executeDiscovery({
              overrideLat: lat ?? centerLat,
              overrideLon: lon ?? centerLon,
            })
          }
          searching={searching}
          onProspectAnalyzed={(updated) => {
            setSelectedProspect(updated);
            setExistingProspects((prev) =>
              prev.map((p) => (p.id === updated.id ? updated : p))
            );
            setSearchResult((prev) =>
              prev
                ? {
                    ...prev,
                    items: prev.items.map((p) => (p.id === updated.id ? updated : p)),
                  }
                : null
            );
          }}
        />
      </div>

      {/* Results Section */}
      {searchResult && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Attività Trovate dalle Fonti"
              value={searchResult.discoveredCount}
              tone="neutral"
            />
            <KpiCard
              label="Nuovi Prospect Inseriti nel CRM"
              value={searchResult.insertedCount}
              tone="volt"
            />
            <KpiCard
              label="Già Analizzati dall'AI"
              value={`${searchResult.analyzedCount} / ${searchResult.items.length}`}
              tone="operational"
            />
            <KpiCard
              label="Alto Potenziale (Score ≥ 60)"
              value={searchResult.items.filter((i) => (i.lead_score || 0) >= 60).length}
              tone="volt"
            />
          </div>

          <SurfaceCard padding="none">
            <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--rivo-volt-text)]" />
                <h2 className="font-display text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                  Risultati Acquisiti &amp; Analizzati dall&apos;AI ({searchResult.items.length})
                </h2>
                {searchResult.instagramDiscoveredCount > 0 && (
                  <StatusBadge tone="volt" size="sm">
                    <InstagramIcon className="w-3 h-3" />
                    {searchResult.instagramDiscoveredCount}{' '}
                    {searchResult.instagramDiscoveredCount === 1
                      ? 'profilo Instagram trovato con AI'
                      : 'profili Instagram trovati con AI'}
                  </StatusBadge>
                )}
              </div>
              <Link
                href="/admin/outreach/intelligence"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--rivo-volt-text)] hover:underline"
              >
                <Cpu className="w-3.5 h-3.5" />
                Genera Messaggi &amp; Sales Agent AI
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {searchResult.items.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  compact
                  icon={Search}
                  title="Nessuna nuova attività inserita"
                  description="Nessuna nuova attività inserita con i filtri specificati."
                />
              </div>
            ) : (
              <>
                {/* Mobile Card List */}
                <div className="lg:hidden divide-y divide-[var(--border-subtle)]">
                  {searchResult.items.map((item) => {
                    const isSelected = selectedProspect?.id === item.id;
                    const score = item.lead_score || item.ai_analysis?.totalLeadScore || 0;
                    const gmapsHref =
                      item.digital_signals?.googleMapsUrl ||
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        [item.business_name, item.address, item.city].filter(Boolean).join(', ')
                      )}`;
                    const igHandle = extractInstagramHandle(item.instagram_url);

                    return (
                      <div
                        key={item.id}
                        className={`p-4 space-y-3 ${isSelected ? 'bg-[var(--rivo-volt-bg)]' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-semibold text-sm text-[var(--text-primary)]">
                                {item.business_name}
                              </span>
                              {newlyInsertedIds.has(item.id) && (
                                <StatusBadge tone="volt" size="sm" shape="tag">
                                  NUOVO
                                </StatusBadge>
                              )}
                            </div>
                            <div className="text-xs text-[var(--text-secondary)]">
                              {item.city || '-'} • {item.subcategory || item.category}
                            </div>
                          </div>
                          {(item.ai_analysis || score > 0) && (
                            <StatusBadge
                              tone={
                                score >= 80
                                  ? 'volt'
                                  : score >= 60
                                  ? 'operational'
                                  : score >= 40
                                  ? 'telemetry'
                                  : 'neutral'
                              }
                              size="sm"
                              shape="tag"
                              className="tabular-nums shrink-0"
                            >
                              {score}/100
                            </StatusBadge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {item.website && (
                            <a
                              href={item.website}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                            >
                              <Globe className="w-3 h-3 text-[var(--rivo-volt-text)]" />
                              Web
                            </a>
                          )}
                          {item.instagram_url && (
                            <a
                              href={item.instagram_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--rivo-volt-bg)] border border-[var(--rivo-volt-border)] text-[var(--rivo-volt-text)]"
                            >
                              <InstagramIcon className="w-3 h-3" />@{igHandle || 'instagram'}
                            </a>
                          )}
                          {item.business_phone && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] font-mono">
                              <Phone className="w-3 h-3" />
                              {item.business_phone}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <Link
                            href={`/admin/outreach/intelligence?prospectId=${encodeURIComponent(item.id)}`}
                            className="inline-flex items-center gap-1 min-h-[38px] px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--rivo-volt-text)] text-xs font-medium"
                          >
                            <Cpu className="w-3.5 h-3.5" />
                            Pitch
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProspect(item);
                              if (item.latitude != null && item.longitude != null) {
                                setCenterLat(item.latitude);
                                setCenterLon(item.longitude);
                              }
                              mapSectionRef.current?.scrollIntoView({
                                behavior: 'smooth',
                                block: 'center',
                              });
                            }}
                            className={`inline-flex items-center gap-1 min-h-[38px] px-3 py-1.5 rounded-lg border text-xs font-medium ${
                              isSelected
                                ? 'bg-[var(--rivo-volt)] border-[var(--rivo-volt)] text-[var(--rivo-volt-ink)] font-semibold'
                                : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] text-[var(--text-primary)]'
                            }`}
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            Maps
                          </button>
                          <a
                            href={gmapsHref}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Apri ${item.business_name} su Google Maps`}
                            className="inline-flex items-center justify-center min-h-[38px] min-w-[38px] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:text-[var(--rivo-volt-text)]"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--border-subtle)] text-[11px] font-mono uppercase text-[var(--text-muted)] bg-[var(--bg-canvas)]">
                        <th className="py-3 px-4">Attività</th>
                        <th className="py-3 px-4">Lead Score &amp; Analisi AI</th>
                        <th className="py-3 px-4">Località / Indirizzo</th>
                        <th className="py-3 px-4">Canali Pubblici Rilevati</th>
                        <th className="py-3 px-4">Fonte &amp; Licenza</th>
                        <th className="py-3 px-4 text-right">Azioni &amp; Mappa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)] text-sm">
                      {searchResult.items.map((item) => {
                        const isSelected = selectedProspect?.id === item.id;
                        const score = item.lead_score || item.ai_analysis?.totalLeadScore || 0;
                        const classification = item.ai_analysis?.classification?.label;
                        const topOpps = item.ai_analysis?.opportunities?.slice(0, 2) || [];
                        const scoreTone =
                          score >= 80
                            ? 'volt'
                            : score >= 60
                            ? 'operational'
                            : score >= 40
                            ? 'telemetry'
                            : 'neutral';
                        const gmapsHref =
                          item.digital_signals?.googleMapsUrl ||
                          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            [item.business_name, item.address, item.city].filter(Boolean).join(', ')
                          )}`;
                        const igHandle = extractInstagramHandle(item.instagram_url);
                        const igDmLink = buildInstagramDmDeepLink(item.instagram_url);
                        return (
                          <tr
                            key={item.id}
                            className={`hover:bg-[var(--bg-elevated)] transition-colors ${
                              isSelected ? 'bg-[var(--rivo-volt-bg)]' : ''
                            }`}
                          >
                            <td className="py-3 px-4 font-medium text-[var(--text-primary)]">
                              <div className="flex items-center gap-2">
                                <span>{item.business_name}</span>
                                {newlyInsertedIds.has(item.id) && (
                                  <StatusBadge tone="volt" size="sm" shape="tag">
                                    NUOVO
                                  </StatusBadge>
                                )}
                              </div>
                              <div className="text-[11px] text-[var(--text-muted)] font-normal mt-0.5">
                                {item.subcategory || item.category}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-xs">
                              {item.ai_analysis || score > 0 ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <StatusBadge
                                      tone={scoreTone}
                                      size="sm"
                                      shape="tag"
                                      className="tabular-nums font-bold"
                                    >
                                      {score}/100
                                    </StatusBadge>
                                    {classification && (
                                      <span className="text-[11px] font-medium text-[var(--text-primary)]">
                                        {classification}
                                      </span>
                                    )}
                                  </div>
                                  {topOpps.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {topOpps.map((o) => (
                                        <span
                                          key={o.moduleSlug}
                                          className="px-1.5 py-0.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[10px] text-[var(--text-secondary)]"
                                        >
                                          {o.moduleName}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[11px] text-[var(--text-muted)]">
                                  Da analizzare
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-xs text-[var(--text-secondary)]">
                              <div className="flex items-center gap-1.5">
                                <span>{item.city || '-'}</span>
                                {typeof item.digital_signals?.distanceKm === 'number' && (
                                  <span className="text-[10px] font-mono tabular-nums text-[var(--rivo-volt-text)]">
                                    • {item.digital_signals.distanceKm} km
                                  </span>
                                )}
                              </div>
                              {item.address && (
                                <div className="text-[11px] text-[var(--text-muted)] truncate max-w-[240px]">
                                  {item.address}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                {item.website && (
                                  <a
                                    href={item.website}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--rivo-volt)]"
                                  >
                                    <Globe className="w-3 h-3 text-[var(--rivo-volt-text)]" />
                                    Web
                                  </a>
                                )}
                                {item.instagram_url && (
                                  <div className="inline-flex items-center gap-1">
                                    <a
                                      href={item.instagram_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      title={
                                        igHandle
                                          ? `@${igHandle} su Instagram`
                                          : 'Apri profilo Instagram'
                                      }
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--rivo-volt-bg)] border border-[var(--rivo-volt-border)] text-[var(--rivo-volt-text)] hover:border-[var(--rivo-volt)]"
                                    >
                                      <InstagramIcon className="w-3 h-3" />
                                      <span>@{igHandle || 'instagram'}</span>
                                    </a>
                                    <Link
                                      href={`/admin/outreach/communications?tab=instagram_dm&prospectId=${encodeURIComponent(
                                        item.id
                                      )}`}
                                      title={
                                        igDmLink
                                          ? `Apri coda DM Instagram (${igDmLink})`
                                          : 'Apri coda DM Instagram'
                                      }
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--rivo-volt)] text-[var(--text-primary)] text-[11px] font-mono"
                                    >
                                      <Send className="w-2.5 h-2.5 text-[var(--rivo-volt-text)]" />
                                      DM
                                    </Link>
                                  </div>
                                )}
                                {item.business_phone && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] font-mono text-[11px]">
                                    <Phone className="w-3 h-3" />
                                    {item.business_phone}
                                  </span>
                                )}
                                {item.business_email && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--rivo-volt-text)] font-mono text-[11px]">
                                    <Mail className="w-3 h-3" />
                                    {item.business_email}
                                  </span>
                                )}
                                {!item.website &&
                                  !item.instagram_url &&
                                  !item.business_phone &&
                                  !item.business_email && (
                                    <span className="text-[11px] text-[var(--text-muted)]">
                                      Solo scheda geografica
                                    </span>
                                  )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-[11px] font-mono text-[var(--text-muted)]">
                              <div>{item.source}</div>
                              <div className="text-[10px]">{item.source_reference}</div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <Link
                                  href={`/admin/outreach/intelligence?prospectId=${encodeURIComponent(item.id)}`}
                                  title="Apri scheda AI e genera Pitch"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--rivo-volt-text)] hover:border-[var(--rivo-volt)] text-[11px] font-medium transition-colors"
                                >
                                  <Cpu className="w-3 h-3" />
                                  Pitch
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedProspect(item);
                                    if (item.latitude != null && item.longitude != null) {
                                      setCenterLat(item.latitude);
                                      setCenterLon(item.longitude);
                                    }
                                    mapSectionRef.current?.scrollIntoView({
                                      behavior: 'smooth',
                                      block: 'center',
                                    });
                                  }}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
                                    isSelected
                                      ? 'bg-[var(--rivo-volt)] border-[var(--rivo-volt)] text-[var(--rivo-volt-ink)] font-semibold'
                                      : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--rivo-volt)]'
                                  }`}
                                >
                                  <MapPin className="w-3 h-3" />
                                  Maps
                                </button>
                                <a
                                  href={gmapsHref}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Apri su Google Maps"
                                  aria-label={`Apri ${item.business_name} su Google Maps`}
                                  className="p-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:text-[var(--rivo-volt-text)] hover:border-[var(--rivo-volt)] transition-colors"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </SurfaceCard>
        </div>
      )}
    </div>
  );
}
