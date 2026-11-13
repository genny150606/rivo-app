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
  Sparkles,
  FileSpreadsheet,
  Compass,
  ExternalLink,
  Navigation,
} from 'lucide-react';
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

      setSearchResult({
        discoveredCount: jobRes.discoveredTotal ?? allSearchProspects.length,
        insertedCount: jobRes.insertedCount ?? insertedProspects.length,
        duplicatesSkipped: jobRes.skippedDuplicates ?? 0,
        items: allSearchProspects,
      });

      // Merge results into existingProspects for map plotting & pick first geo pin
      setExistingProspects((prev) => {
        const map = new Map<string, OutreachProspectRecord>();
        for (const item of allSearchProspects) map.set(item.id, item);
        for (const old of prev) {
          if (!map.has(old.id)) map.set(old.id, old);
        }
        return Array.from(map.values());
      });

      const firstMappable =
        allSearchProspects.find((p) => p.latitude != null && p.longitude != null) ||
        allSearchProspects[0] ||
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
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-[#27272A] pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#BFFF00]" />
            <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#BFFF00]">
              RIVO OUTREACH — BUSINESS DISCOVERY
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-[-0.02em] text-[#FAFAFA]">
            Ricerca e Acquisizione Attività — Priority Maps &amp; Campania
          </h1>
          <p className="text-sm text-[#A1A1AA] mt-1">
            Motore geografico prioritario su Maps centrato su Napoli e Campania a lungo raggio (fino a 120 km), con mappa interattiva live e anteprima schede Google Maps.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowManualModal((v) => !v)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#121214] border border-[#27272A] hover:border-[#3F3F46] text-xs font-medium text-[#FAFAFA] transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#BFFF00]" />
            Inserimento Manuale
          </button>
          <button
            type="button"
            onClick={() => setShowCsvModal((v) => !v)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#121214] border border-[#27272A] hover:border-[#3F3F46] text-xs font-medium text-[#FAFAFA] transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#A1A1AA]" />
            Importa CSV
          </button>
          <Link
            href="/admin/outreach/prospects"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#BFFF00] hover:bg-[#A8E600] text-[#09090B] text-xs font-semibold transition-colors"
          >
            Apri CRM Prospect
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {manualFeedback && (
        <div className="p-4 rounded-xl bg-[#121214] border border-[#BFFF00]/40 text-xs text-[#FAFAFA] flex items-center justify-between">
          <span>{manualFeedback}</span>
          <button
            type="button"
            onClick={() => setManualFeedback(null)}
            className="text-[#A1A1AA] hover:text-[#FAFAFA]"
          >
            Chiudi
          </button>
        </div>
      )}

      {/* Manual Entry Panel */}
      {showManualModal && (
        <form
          onSubmit={handleManualSubmit}
          className="bg-[#121214] border border-[#27272A] rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
            <h2 className="text-sm font-semibold text-[#FAFAFA]">
              Inserimento Diretto Attività Commerciale (con Provenienza Tracciata)
            </h2>
            <button
              type="button"
              onClick={() => setShowManualModal(false)}
              className="text-xs text-[#A1A1AA] hover:text-[#FAFAFA]"
            >
              Chiudi
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[#A1A1AA] mb-1.5">
                Nome Attività *
              </label>
              <input
                type="text"
                required
                value={manualForm.business_name}
                onChange={(e) => setManualForm({ ...manualForm, business_name: e.target.value })}
                placeholder="Es. Osteria del Porto"
                className="w-full h-10 px-3.5 rounded-lg bg-[#0D0D10] border border-[#27272A] text-sm text-[#FAFAFA] focus:outline-none focus:border-[#BFFF00]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[#A1A1AA] mb-1.5">
                Categoria *
              </label>
              <select
                value={manualForm.category}
                onChange={(e) =>
                  setManualForm({
                    ...manualForm,
                    category: e.target.value,
                  })
                }
                className="w-full h-10 px-3.5 rounded-lg bg-[#0D0D10] border border-[#27272A] text-sm text-[#FAFAFA] focus:outline-none focus:border-[#BFFF00]"
              >
                {OUTREACH_DISCOVERY_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[#A1A1AA] mb-1.5">
                Sottocategoria
              </label>
              <input
                type="text"
                value={manualForm.subcategory}
                onChange={(e) => setManualForm({ ...manualForm, subcategory: e.target.value })}
                placeholder="Es. restaurant / barber"
                className="w-full h-10 px-3.5 rounded-lg bg-[#0D0D10] border border-[#27272A] text-sm text-[#FAFAFA] focus:outline-none focus:border-[#BFFF00]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[#A1A1AA] mb-1.5">
                Città
              </label>
              <input
                type="text"
                value={manualForm.city}
                onChange={(e) => setManualForm({ ...manualForm, city: e.target.value })}
                placeholder="Napoli"
                className="w-full h-10 px-3.5 rounded-lg bg-[#0D0D10] border border-[#27272A] text-sm text-[#FAFAFA] focus:outline-none focus:border-[#BFFF00]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[#A1A1AA] mb-1.5">
                Indirizzo Commerciale
              </label>
              <input
                type="text"
                value={manualForm.address}
                onChange={(e) => setManualForm({ ...manualForm, address: e.target.value })}
                placeholder="Via Toledo 148"
                className="w-full h-10 px-3.5 rounded-lg bg-[#0D0D10] border border-[#27272A] text-sm text-[#FAFAFA] focus:outline-none focus:border-[#BFFF00]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[#A1A1AA] mb-1.5">
                Sito Web
              </label>
              <input
                type="url"
                value={manualForm.website}
                onChange={(e) => setManualForm({ ...manualForm, website: e.target.value })}
                placeholder="https://..."
                className="w-full h-10 px-3.5 rounded-lg bg-[#0D0D10] border border-[#27272A] text-sm text-[#FAFAFA] focus:outline-none focus:border-[#BFFF00]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[#A1A1AA] mb-1.5">
                URL Instagram
              </label>
              <input
                type="url"
                value={manualForm.instagram_url}
                onChange={(e) => setManualForm({ ...manualForm, instagram_url: e.target.value })}
                placeholder="https://instagram.com/..."
                className="w-full h-10 px-3.5 rounded-lg bg-[#0D0D10] border border-[#27272A] text-sm text-[#FAFAFA] focus:outline-none focus:border-[#BFFF00]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[#A1A1AA] mb-1.5">
                Telefono Aziendale
              </label>
              <input
                type="text"
                value={manualForm.business_phone}
                onChange={(e) => setManualForm({ ...manualForm, business_phone: e.target.value })}
                placeholder="+39 081 ..."
                className="w-full h-10 px-3.5 rounded-lg bg-[#0D0D10] border border-[#27272A] text-sm text-[#FAFAFA] focus:outline-none focus:border-[#BFFF00]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[#A1A1AA] mb-1.5">
                Email Aziendale
              </label>
              <input
                type="email"
                value={manualForm.business_email}
                onChange={(e) => setManualForm({ ...manualForm, business_email: e.target.value })}
                placeholder="info@..."
                className="w-full h-10 px-3.5 rounded-lg bg-[#0D0D10] border border-[#27272A] text-sm text-[#FAFAFA] focus:outline-none focus:border-[#BFFF00]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[#A1A1AA] mb-1.5">
                Descrizione / Servizi Rilevati
              </label>
              <input
                type="text"
                value={manualForm.description}
                onChange={(e) => setManualForm({ ...manualForm, description: e.target.value })}
                placeholder="Ristorante di pesce con 60 coperti, menu PDF online..."
                className="w-full h-10 px-3.5 rounded-lg bg-[#0D0D10] border border-[#27272A] text-sm text-[#FAFAFA] focus:outline-none focus:border-[#BFFF00]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[#A1A1AA] mb-1.5">
                Fonte del Dato / Base Giuridica
              </label>
              <input
                type="text"
                value={manualForm.source}
                onChange={(e) => setManualForm({ ...manualForm, source: e.target.value })}
                className="w-full h-10 px-3.5 rounded-lg bg-[#0D0D10] border border-[#27272A] text-sm text-[#FAFAFA] focus:outline-none focus:border-[#BFFF00]"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={manualSubmitting}
              className="px-4 py-2 rounded-lg bg-[#BFFF00] hover:bg-[#A8E600] text-[#09090B] text-xs font-semibold disabled:opacity-50"
            >
              {manualSubmitting ? 'Salvataggio e Deduplicazione...' : 'Salva Prospect nel CRM'}
            </button>
          </div>
        </form>
      )}

      {/* CSV Import Modal */}
      {showCsvModal && (
        <form
          onSubmit={handleCsvImport}
          className="bg-[#121214] border border-[#27272A] rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
            <h2 className="text-sm font-semibold text-[#FAFAFA]">
              Importazione Multipla CSV (con Deduplicazione Automatica)
            </h2>
            <button
              type="button"
              onClick={() => setShowCsvModal(false)}
              className="text-xs text-[#A1A1AA] hover:text-[#FAFAFA]"
            >
              Chiudi
            </button>
          </div>
          <p className="text-xs text-[#A1A1AA]">
            Incolla righe CSV con intestazione:{' '}
            <code className="text-[#FAFAFA]">
              business_name,category,subcategory,city,address,website,business_phone,business_email
            </code>
          </p>
          <textarea
            rows={5}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={`business_name,category,subcategory,city,address,website,business_phone,business_email\nPizzeria Partenope,food_beverage,pizzeria,Napoli,Via Chiaia 42,https://pizzeriapartenope.example.it,+39081123456,info@pizzeriapartenope.example.it`}
            className="w-full p-3.5 rounded-lg bg-[#0D0D10] border border-[#27272A] text-xs font-mono text-[#FAFAFA] focus:outline-none focus:border-[#BFFF00]"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={csvImporting}
              className="px-4 py-2 rounded-lg bg-[#BFFF00] hover:bg-[#A8E600] text-[#09090B] text-xs font-semibold disabled:opacity-50"
            >
              {csvImporting ? 'Importazione in corso...' : 'Importa e Deduplica'}
            </button>
          </div>
        </form>
      )}

      {/* Main Search Interface */}
      <form
        onSubmit={handleRunDiscovery}
        className="bg-[#121214] border border-[#27272A] rounded-xl p-6 space-y-5"
      >
        {/* Campania Geo-Presets Quick Bar */}
        <div className="space-y-2 pb-4 border-b border-[#27272A]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.08em] text-[#BFFF00]">
              <Compass className="w-3.5 h-3.5" />
              Focus Territoriale: Napoli &amp; Campania a Largo Raggio
            </span>
            <span className="text-[11px] font-mono text-[#71717A]">
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
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                    isActive
                      ? 'bg-[#BFFF00]/15 border-[#BFFF00] text-[#BFFF00] font-semibold'
                      : 'bg-[#0D0D10] border-[#27272A] text-[#A1A1AA] hover:border-[#3F3F46] hover:text-[#FAFAFA]'
                  }`}
                >
                  <Navigation className="w-3 h-3 shrink-0" />
                  <span>{preset.label}</span>
                  <span className="text-[10px] font-mono opacity-75">{preset.radiusKm}km</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Località */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[#A1A1AA] mb-1.5">
              Località / Città Principale
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-[#BFFF00] absolute left-3 top-3" />
              <input
                type="text"
                required
                value={locationQuery}
                onChange={(e) => {
                  setActivePresetId(null);
                  setLocationQuery(e.target.value);
                }}
                placeholder="Es. Napoli, Salerno, Caserta, Sorrento..."
                className="w-full h-10 pl-9 pr-3.5 rounded-lg bg-[#0D0D10] border border-[#27272A] text-sm text-[#FAFAFA] focus:outline-none focus:border-[#BFFF00]"
              />
            </div>
          </div>

          {/* Raggio Geografico */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[#A1A1AA]">
                Raggio (1–120 km)
              </label>
              <span className="text-[10px] font-mono text-[#BFFF00]">
                {radiusKm >= 50 ? 'Largo raggio' : radiusKm >= 20 ? 'Area metropolitana' : 'Urbano'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={120}
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="w-full accent-[#BFFF00] cursor-pointer"
              />
              <input
                type="number"
                min={1}
                max={120}
                value={radiusKm}
                onChange={(e) => setRadiusKm(Math.max(1, Math.min(120, Number(e.target.value) || 1)))}
                className="w-16 h-10 px-2 rounded-lg bg-[#0D0D10] border border-[#27272A] text-sm font-mono text-[#FAFAFA] text-center focus:outline-none focus:border-[#BFFF00]"
              />
            </div>
          </div>

          {/* Categoria Commerciale */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[#A1A1AA] mb-1.5">
              Categoria Commerciale
            </label>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full h-10 px-3.5 rounded-lg bg-[#0D0D10] border border-[#27272A] text-sm text-[#FAFAFA] focus:outline-none focus:border-[#BFFF00]"
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
            <label className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[#A1A1AA] mb-1.5">
              Sottocategoria
            </label>
            <select
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              className="w-full h-10 px-3.5 rounded-lg bg-[#0D0D10] border border-[#27272A] text-sm text-[#FAFAFA] focus:outline-none focus:border-[#BFFF00]"
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
            <label className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[#A1A1AA] mb-1.5">
              Max Risultati
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={maxResults}
              onChange={(e) => setMaxResults(Number(e.target.value))}
              className="w-full h-10 px-3.5 rounded-lg bg-[#0D0D10] border border-[#27272A] text-sm font-mono text-[#FAFAFA] focus:outline-none focus:border-[#BFFF00]"
            />
          </div>
        </div>

        {/* Fonti di acquisizione selezionabili */}
        <div className="pt-2 border-t border-[#27272A]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <span className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[#A1A1AA]">
                Fonti di Acquisizione Autorizzate (`BusinessDataProvider`)
              </span>
              <div className="flex flex-wrap gap-3">
                {providers.map((p) => {
                  const checked = selectedProviders.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className={`inline-flex items-center gap-2.5 px-3.5 py-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                        checked
                          ? 'bg-[#18181B] border-[#BFFF00] text-[#FAFAFA]'
                          : 'bg-[#0D0D10] border-[#27272A] text-[#A1A1AA]'
                      } ${!p.configured ? 'opacity-50' : ''}`}
                    >
                      <input
                        type="checkbox"
                        disabled={!p.configured}
                        checked={checked}
                        onChange={() => toggleProvider(p.id)}
                        className="accent-[#BFFF00]"
                      />
                      <div>
                        <div className="font-medium flex items-center gap-1.5">
                          <Database className="w-3 h-3 text-[#BFFF00]" />
                          <span>{p.name}</span>
                          {p.id === 'google_places_official' && (
                            <span className="px-1.5 py-0.5 rounded bg-[#BFFF00]/20 text-[#BFFF00] text-[9px] font-mono font-bold uppercase tracking-wider">
                              #1 MAPS PRIORITARIO
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#71717A]">{p.attribution}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={searching || selectedProviders.length === 0}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#BFFF00] hover:bg-[#A8E600] text-[#09090B] text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 shrink-0"
            >
              {searching ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Ricerca in corso...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Avvia ricerca
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {searchError && (
        <div className="p-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-sm text-[#EF4444] flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{searchError}</span>
        </div>
      )}

      {searchWarnings.length > 0 && (
        <div className="p-4 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-xs text-[#F59E0B] space-y-1">
          {searchWarnings.map((warn, i) => (
            <div key={i} className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{warn}</span>
            </div>
          ))}
        </div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#121214] border border-[#27272A] rounded-xl p-4">
              <span className="text-[11px] font-mono uppercase text-[#A1A1AA]">
                Attività Trovate dalle Fonti
              </span>
              <div className="text-2xl font-bold font-mono text-[#FAFAFA] mt-1">
                {searchResult.discoveredCount}
              </div>
            </div>
            <div className="bg-[#121214] border border-[#27272A] rounded-xl p-4">
              <span className="text-[11px] font-mono uppercase text-[#A1A1AA]">
                Nuovi Prospect Inseriti nel CRM
              </span>
              <div className="text-2xl font-bold font-mono text-[#BFFF00] mt-1">
                {searchResult.insertedCount}
              </div>
            </div>
            <div className="bg-[#121214] border border-[#27272A] rounded-xl p-4">
              <span className="text-[11px] font-mono uppercase text-[#A1A1AA]">
                Duplicati Riconosciuti e Ignorati
              </span>
              <div className="text-2xl font-bold font-mono text-[#FAFAFA] mt-1">
                {searchResult.duplicatesSkipped}
              </div>
            </div>
          </div>

          <div className="bg-[#121214] border border-[#27272A] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#27272A] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#BFFF00]" />
                <h2 className="text-sm font-semibold text-[#FAFAFA]">
                  Risultati Acquisiti e Salvati nel Database ({searchResult.items.length})
                </h2>
              </div>
              <Link
                href="/admin/outreach/intelligence"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#BFFF00] hover:underline"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Avvia Analisi AI sui nuovi Prospect
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#27272A] text-[11px] font-mono uppercase text-[#A1A1AA] bg-[#0D0D10]">
                    <th className="py-3 px-4">Attività</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4">Località / Indirizzo</th>
                    <th className="py-3 px-4">Canali Pubblici Rilevati</th>
                    <th className="py-3 px-4">Fonte & Licenza</th>
                    <th className="py-3 px-4 text-right">Mappa / Preview</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272A] text-sm">
                  {searchResult.items.map((item) => {
                    const isSelected = selectedProspect?.id === item.id;
                    const gmapsHref =
                      item.digital_signals?.googleMapsUrl ||
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        [item.business_name, item.address, item.city].filter(Boolean).join(', ')
                      )}`;
                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-[#18181B] transition-colors ${
                          isSelected ? 'bg-[#BFFF00]/5' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-medium text-[#FAFAFA]">
                          <div className="flex items-center gap-2">
                            <span>{item.business_name}</span>
                            {newlyInsertedIds.has(item.id) && (
                              <span className="px-1.5 py-0.5 rounded bg-[#BFFF00]/20 text-[#BFFF00] text-[9px] font-mono uppercase">
                                NUOVO
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-[#A1A1AA]">
                          <div>{item.category}</div>
                          {item.subcategory && (
                            <div className="text-[11px] text-[#71717A]">{item.subcategory}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-[#A1A1AA]">
                          <div className="flex items-center gap-1.5">
                            <span>{item.city || '-'}</span>
                            {typeof item.digital_signals?.distanceKm === 'number' && (
                              <span className="text-[10px] font-mono text-[#BFFF00]">
                                • {item.digital_signals.distanceKm} km
                              </span>
                            )}
                          </div>
                          {item.address && (
                            <div className="text-[11px] text-[#71717A] truncate max-w-[240px]">
                              {item.address}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 text-xs">
                            {item.website && (
                              <a
                                href={item.website}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#18181B] border border-[#27272A] text-[#FAFAFA] hover:border-[#BFFF00]"
                              >
                                <Globe className="w-3 h-3 text-[#BFFF00]" />
                                Web
                              </a>
                            )}
                            {item.business_phone && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#18181B] border border-[#27272A] text-[#A1A1AA] font-mono text-[11px]">
                                <Phone className="w-3 h-3" />
                                {item.business_phone}
                              </span>
                            )}
                            {item.business_email && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#18181B] border border-[#27272A] text-[#BFFF00] font-mono text-[11px]">
                                <Mail className="w-3 h-3" />
                                {item.business_email}
                              </span>
                            )}
                            {!item.website && !item.business_phone && !item.business_email && (
                              <span className="text-[11px] text-[#71717A]">Solo scheda geografica</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[11px] font-mono text-[#71717A]">
                          <div>{item.source}</div>
                          <div className="text-[10px]">{item.source_reference}</div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
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
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border text-[11px] font-medium transition-colors ${
                                isSelected
                                  ? 'bg-[#BFFF00] border-[#BFFF00] text-[#09090B] font-semibold'
                                  : 'bg-[#0D0D10] border-[#27272A] text-[#FAFAFA] hover:border-[#BFFF00]'
                              }`}
                            >
                              <MapPin className="w-3 h-3" />
                              Anteprima Maps
                            </button>
                            <a
                              href={gmapsHref}
                              target="_blank"
                              rel="noreferrer"
                              title="Apri su Google Maps"
                              className="p-1.5 rounded border border-[#27272A] bg-[#0D0D10] text-[#A1A1AA] hover:text-[#BFFF00] hover:border-[#BFFF00] transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {searchResult.items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-[#71717A]">
                        Nessuna nuova attività inserita con i filtri specificati.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
