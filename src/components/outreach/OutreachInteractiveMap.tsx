'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Map as MapIcon,
  MapPin,
  Layers,
  Crosshair,
  ExternalLink,
  Cpu,
  UserPlus,
  Phone,
  Globe,
  Navigation,
  Search,
  CheckCircle2,
} from 'lucide-react';
import type { OutreachProspectRecord } from '@/lib/outreach/types';
import { SurfaceCard, StatusBadge } from '@/components/ui';
import { cn } from '@/lib/cn';

declare global {
  interface Window {
    L?: any;
  }
}

export interface OutreachInteractiveMapProps {
  centerLat: number;
  centerLon: number;
  locationLabel: string;
  radiusKm: number;
  prospects: OutreachProspectRecord[];
  newlyInsertedIds?: Set<string>;
  selectedProspect: OutreachProspectRecord | null;
  onSelectProspect: (prospect: OutreachProspectRecord) => void;
  onChangeCenter: (lat: number, lon: number, label?: string) => void;
  onSearchThisArea: (lat?: number, lon?: number) => void;
  searching?: boolean;
  onProspectAnalyzed?: (updated: OutreachProspectRecord) => void;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

function loadLeafletAssets(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('SSR'));
      return;
    }

    if (window.L) {
      resolve(window.L);
      return;
    }

    if (!document.getElementById('leaflet-css-cdn')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css-cdn';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const existingScript = document.getElementById('leaflet-js-cdn') as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.L));
      existingScript.addEventListener('error', () => reject(new Error('Leaflet load error')));
      return;
    }

    const script = document.createElement('script');
    script.id = 'leaflet-js-cdn';
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => {
      if (window.L) resolve(window.L);
      else reject(new Error('Leaflet global missing'));
    };
    script.onerror = () => reject(new Error('Leaflet CDN unavailable'));
    document.head.appendChild(script);
  });
}

export default function OutreachInteractiveMap({
  centerLat,
  centerLon,
  locationLabel,
  radiusKm,
  prospects,
  newlyInsertedIds,
  selectedProspect,
  onSelectProspect,
  onChangeCenter,
  onSearchThisArea,
  searching = false,
  onProspectAnalyzed,
}: OutreachInteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const overlayLayerRef = useRef<any>(null);
  const lastFitKeyRef = useRef<string>('');

  const [leafletReady, setLeafletReady] = useState(false);
  const [leafletFailed, setLeafletFailed] = useState(false);
  const [mapStyle, setMapStyle] = useState<'dark' | 'street'>('dark');
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [analyzeFeedback, setAnalyzeFeedback] = useState<string | null>(null);

  useEffect(() => {
    setAnalyzeFeedback(null);
  }, [selectedProspect?.id]);

  const mappableProspects = useMemo(
    () =>
      prospects.filter(
        (p) =>
          typeof p.latitude === 'number' &&
          typeof p.longitude === 'number' &&
          Number.isFinite(p.latitude) &&
          Number.isFinite(p.longitude)
      ),
    [prospects]
  );

  // Initialize Leaflet Map once
  useEffect(() => {
    let cancelled = false;

    loadLeafletAssets()
      .then((L) => {
        if (cancelled || !mapContainerRef.current) return;

        if (!mapInstanceRef.current) {
          const map = L.map(mapContainerRef.current, {
            center: [centerLat, centerLon],
            zoom: 11,
            zoomControl: true,
            attributionControl: true,
          });

          const overlayGroup = L.layerGroup().addTo(map);
          overlayLayerRef.current = overlayGroup;
          mapInstanceRef.current = map;

          map.on('click', (ev: any) => {
            if (ev?.latlng) {
              const nextLat = Math.round(ev.latlng.lat * 10000) / 10000;
              const nextLon = Math.round(ev.latlng.lng * 10000) / 10000;
              onChangeCenter(nextLat, nextLon);
            }
          });
        }
        setLeafletReady(true);
      })
      .catch(() => {
        if (!cancelled) setLeafletFailed(true);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!leafletReady || !mapInstanceRef.current || !window.L) return;
    const L = window.L;
    const map = mapInstanceRef.current;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const tileUrl =
      mapStyle === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const attribution =
      mapStyle === 'dark'
        ? '&copy; OpenStreetMap &copy; CARTO'
        : '&copy; OpenStreetMap contributors';

    tileLayerRef.current = L.tileLayer(tileUrl, {
      attribution,
      maxZoom: 19,
    }).addTo(map);
  }, [leafletReady, mapStyle]);

  useEffect(() => {
    if (!leafletReady || !mapInstanceRef.current || !overlayLayerRef.current || !window.L) return;
    const L = window.L;
    const map = mapInstanceRef.current;
    const group = overlayLayerRef.current;

    group.clearLayers();

    const radiusCircle = L.circle([centerLat, centerLon], {
      radius: Math.max(500, radiusKm * 1000),
      color: '#BFFF00',
      weight: 2,
      opacity: 0.75,
      fillColor: '#BFFF00',
      fillOpacity: 0.08,
      dashArray: '6 6',
    }).addTo(group);

    L.circleMarker([centerLat, centerLon], {
      radius: 7,
      color: '#09090B',
      weight: 2,
      fillColor: '#BFFF00',
      fillOpacity: 1,
    })
      .bindTooltip(`Centro Ricerca: ${locationLabel} (${radiusKm} km)`, {
        direction: 'top',
        offset: [0, -6],
      })
      .addTo(group);

    for (const p of mappableProspects) {
      const isSelected = selectedProspect?.id === p.id;
      const isNew = newlyInsertedIds?.has(p.id);
      let fill = '#F59E0B';
      if (isSelected) fill = '#FFFFFF';
      else if (isNew || p.lead_score >= 80) fill = '#BFFF00';
      else if (p.lead_score >= 60) fill = '#10B981';
      else if (p.ai_analysis) fill = '#3B82F6';

      const marker = L.circleMarker([p.latitude, p.longitude], {
        radius: isSelected ? 10 : isNew ? 8 : 6.5,
        color: isSelected ? '#BFFF00' : '#09090B',
        weight: isSelected ? 3 : 1.5,
        fillColor: fill,
        fillOpacity: 0.95,
      });

      const tooltipHtml = `<div style="font-family:sans-serif;font-size:11px;">
        <strong>${p.business_name.replace(/</g, '&lt;')}</strong><br/>
        <span>${(p.subcategory || p.category).replace(/</g, '&lt;')} · ${(p.city || 'Campania').replace(/</g, '&lt;')}</span>
        ${p.lead_score > 0 ? `<br/><span>Score: <b>${p.lead_score}/100</b></span>` : ''}
      </div>`;

      marker.bindTooltip(tooltipHtml, { direction: 'top', offset: [0, -6] });
      marker.on('click', (ev: any) => {
        L.DomEvent?.stopPropagation?.(ev);
        onSelectProspect(p);
      });

      marker.addTo(group);
    }

    const fitKey = `${centerLat.toFixed(4)}:${centerLon.toFixed(4)}:${radiusKm}`;
    if (lastFitKeyRef.current !== fitKey) {
      lastFitKeyRef.current = fitKey;
      try {
        map.fitBounds(radiusCircle.getBounds(), { padding: [22, 22], maxZoom: 15 });
      } catch {
        map.setView([centerLat, centerLon], radiusKm >= 40 ? 9 : radiusKm >= 20 ? 11 : 13);
      }
    }
  }, [
    leafletReady,
    centerLat,
    centerLon,
    radiusKm,
    locationLabel,
    mappableProspects,
    selectedProspect,
    newlyInsertedIds,
    onSelectProspect,
  ]);

  useEffect(() => {
    if (
      !leafletReady ||
      !mapInstanceRef.current ||
      !selectedProspect ||
      typeof selectedProspect.latitude !== 'number' ||
      typeof selectedProspect.longitude !== 'number'
    ) {
      return;
    }
    mapInstanceRef.current.panTo([selectedProspect.latitude, selectedProspect.longitude], {
      animate: true,
      duration: 0.45,
    });
  }, [leafletReady, selectedProspect]);

  const handleQuickAiAnalyze = async (prospect: OutreachProspectRecord) => {
    setAnalyzingId(prospect.id);
    setAnalyzeFeedback(null);
    try {
      const res = await fetch('/api/admin/outreach/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          prospect_id: prospect.id,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Errore analisi AI');
      if (json.prospect && onProspectAnalyzed) {
        onProspectAnalyzed(json.prospect);
      }
      setAnalyzeFeedback(
        `Analisi completata: Lead Score ${json.prospect?.lead_score ?? '-'}/100`
      );
    } catch (err) {
      setAnalyzeFeedback(err instanceof Error ? err.message : 'Errore analisi AI');
    } finally {
      setAnalyzingId(null);
    }
  };

  const googleMapsEmbedUrl = useMemo(() => {
    if (selectedProspect) {
      const query = [
        selectedProspect.business_name,
        selectedProspect.address,
        selectedProspect.city || 'Napoli',
      ]
        .filter(Boolean)
        .join(', ');
      return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&hl=it&z=16&output=embed`;
    }
    const zoom = radiusKm >= 60 ? 9 : radiusKm >= 25 ? 11 : 13;
    const areaQuery =
      locationLabel && !locationLabel.startsWith('Area personalizzata')
        ? `${locationLabel}, Campania, Italia`
        : `${centerLat},${centerLon}`;
    return `https://maps.google.com/maps?q=${encodeURIComponent(areaQuery)}&hl=it&z=${zoom}&output=embed`;
  }, [selectedProspect, centerLat, centerLon, locationLabel, radiusKm]);

  const selectedExternalMapsUrl = useMemo(() => {
    if (selectedProspect?.digital_signals?.googleMapsUrl) {
      return selectedProspect.digital_signals.googleMapsUrl;
    }
    if (selectedProspect) {
      const q = [
        selectedProspect.business_name,
        selectedProspect.address,
        selectedProspect.city || 'Napoli',
      ]
        .filter(Boolean)
        .join(', ');
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${centerLat},${centerLon}`;
  }, [selectedProspect, centerLat, centerLon]);

  const selectedDistance = useMemo(() => {
    if (!selectedProspect) return null;
    if (typeof selectedProspect.digital_signals?.distanceKm === 'number') {
      return selectedProspect.digital_signals.distanceKm;
    }
    if (
      typeof selectedProspect.latitude === 'number' &&
      typeof selectedProspect.longitude === 'number'
    ) {
      return haversineKm(centerLat, centerLon, selectedProspect.latitude, selectedProspect.longitude);
    }
    return null;
  }, [selectedProspect, centerLat, centerLon]);

  return (
    <SurfaceCard padding="none" className="overflow-hidden">
      {/* Top Map Toolbar */}
      <div className="px-4 sm:px-5 py-3.5 border-b border-[var(--border-subtle)] flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-[var(--bg-elevated)]">
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--rivo-volt-bg)] border border-[var(--rivo-volt-border)] text-[var(--rivo-volt-text)] shrink-0">
              <MapIcon className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-sm font-semibold text-[var(--text-primary)] leading-tight truncate">
                Mappa Interattiva Campania &amp; Preview Google Maps
              </h2>
              <p className="text-[11px] text-[var(--text-secondary)] font-mono tabular-nums truncate">
                Centro: <span className="text-[var(--text-primary)] font-medium">{locationLabel}</span> ({centerLat.toFixed(4)}, {centerLon.toFixed(4)}) · Raggio{' '}
                <span className="text-[var(--rivo-volt-text)]">{radiusKm} km</span> ·{' '}
                <span className="text-[var(--text-primary)]">{mappableProspects.length}</span> pin
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setMapStyle('dark')}
              className={cn(
                'min-h-[34px] px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors cursor-pointer',
                mapStyle === 'dark'
                  ? 'bg-[var(--rivo-volt)] text-[var(--rivo-volt-ink)] font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
            >
              <Layers className="w-3 h-3" strokeWidth={1.75} aria-hidden="true" />
              <span>Dark Maps</span>
            </button>
            <button
              type="button"
              onClick={() => setMapStyle('street')}
              className={cn(
                'min-h-[34px] px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors cursor-pointer',
                mapStyle === 'street'
                  ? 'bg-[var(--rivo-volt)] text-[var(--rivo-volt-ink)] font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
            >
              <span>Stradale OSM</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => onSearchThisArea(centerLat, centerLon)}
            disabled={searching}
            className="inline-flex min-h-[38px] items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[var(--rivo-volt-ink)] text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
            <span>{searching ? 'Scansione Area…' : 'Cerca Attività in Quest’Area'}</span>
          </button>
        </div>
      </div>

      {/* Main Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-7 relative min-h-[400px] lg:min-h-[470px] border-b lg:border-b-0 lg:border-r border-[var(--border-subtle)] bg-[var(--bg-canvas)]">
          <div ref={mapContainerRef} className="w-full h-[400px] lg:h-[470px] z-0" />

          {!leafletReady && !leafletFailed && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--bg-canvas)]/90 text-xs text-[var(--text-secondary)] gap-2 z-10">
              <div className="w-6 h-6 border-2 border-[var(--rivo-volt)] border-t-transparent rounded-full animate-spin" />
              <span>Caricamento mappa interattiva Napoli &amp; Campania…</span>
            </div>
          )}

          {leafletFailed && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[var(--bg-canvas)] text-xs text-[var(--text-secondary)] gap-3 z-10">
              <MapPin className="w-7 h-7 text-[var(--rivo-volt-text)]" strokeWidth={1.75} aria-hidden="true" />
              <p>
                Mappa interattiva Leaflet non raggiungibile in questa rete: usa il pannello Google Maps Live qui a fianco.
              </p>
            </div>
          )}

          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-[400]">
            <div className="pointer-events-auto px-3 py-1.5 rounded-lg bg-[var(--bg-canvas)]/90 border border-[var(--border-subtle)] text-[10px] text-[var(--text-secondary)] flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#BFFF00]" /> Nuovi / Priorità
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" /> Alto Potenziale
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" /> Analizzati
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" /> Da Analizzare
              </span>
            </div>

            <div className="pointer-events-auto px-2.5 py-1.5 rounded-lg bg-[var(--bg-canvas)]/90 border border-[var(--border-subtle)] text-[10px] text-[var(--text-primary)] flex items-center gap-1.5">
              <Crosshair className="w-3 h-3 text-[var(--rivo-volt-text)]" strokeWidth={1.75} aria-hidden="true" />
              <span>Clicca sulla mappa per spostare il centro di ricerca</span>
            </div>
          </div>
        </div>

        {/* Right Side: Live Google Maps Preview & Quick Prospect Card */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-[var(--bg-surface)]">
          <div className="p-4 border-b border-[var(--border-subtle)] space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-[var(--rivo-volt-text)]">
                  <Navigation className="w-3 h-3" strokeWidth={1.75} aria-hidden="true" />
                  <span>
                    {selectedProspect
                      ? 'Scheda Maps Live — Attività Selezionata'
                      : 'Anteprima Google Maps — Area Campania'}
                  </span>
                </span>
                <h3 className="font-display text-base font-bold text-[var(--text-primary)] mt-0.5 leading-snug truncate">
                  {selectedProspect ? selectedProspect.business_name : `${locationLabel} (${radiusKm} km)`}
                </h3>
              </div>

              {selectedProspect && selectedProspect.lead_score > 0 && (
                <StatusBadge tone="volt" shape="tag" className="tabular-nums">
                  {selectedProspect.lead_score}/100
                </StatusBadge>
              )}
            </div>

            {selectedProspect ? (
              <div className="space-y-1.5 text-xs text-[var(--text-secondary)]">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone="neutral" shape="tag">
                    {selectedProspect.subcategory || selectedProspect.category}
                  </StatusBadge>
                  {selectedDistance !== null && (
                    <StatusBadge tone="volt" shape="tag" className="tabular-nums">
                      {selectedDistance} km dal centro
                    </StatusBadge>
                  )}
                  {typeof selectedProspect.digital_signals?.rating === 'number' && (
                    <StatusBadge tone="warning" shape="tag" className="tabular-nums">
                      ★ {selectedProspect.digital_signals.rating} (
                      {selectedProspect.digital_signals.userRatingCount || 0})
                    </StatusBadge>
                  )}
                </div>

                <div className="flex items-start gap-1.5 text-xs text-[var(--text-primary)]">
                  <MapPin
                    className="w-3.5 h-3.5 text-[var(--rivo-volt-text)] shrink-0 mt-0.5"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  <span>
                    {[selectedProspect.address, selectedProspect.city, selectedProspect.province]
                      .filter(Boolean)
                      .join(', ') || 'Campania, Italia'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {selectedProspect.business_phone && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] font-mono text-[11px] text-[var(--text-primary)]">
                      <Phone className="w-3 h-3 text-[var(--rivo-volt-text)]" strokeWidth={1.75} aria-hidden="true" />
                      <span>{selectedProspect.business_phone}</span>
                    </span>
                  )}
                  {selectedProspect.website && (
                    <a
                      href={selectedProspect.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-primary)] hover:border-[var(--rivo-volt)] transition-colors"
                    >
                      <Globe className="w-3 h-3 text-[var(--rivo-volt-text)]" strokeWidth={1.75} aria-hidden="true" />
                      <span>{selectedProspect.website_domain || 'Sito Web'}</span>
                    </a>
                  )}
                </div>

                {selectedProspect.ai_analysis && (
                  <div className="mt-2 p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-[var(--rivo-volt-text)]">
                        <Cpu className="w-3 h-3" strokeWidth={1.75} aria-hidden="true" />
                        <span>Analisi AI Completata</span>
                      </span>
                      <span className="text-[10px] font-semibold text-[var(--accent-operational-text)]">
                        {selectedProspect.ai_analysis.classification?.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed line-clamp-3">
                      {selectedProspect.ai_analysis.executiveSummary}
                    </p>
                    {selectedProspect.ai_analysis.opportunities?.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {selectedProspect.ai_analysis.opportunities.slice(0, 3).map((opp) => (
                          <span
                            key={opp.moduleSlug}
                            className="px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[10px] text-[var(--text-secondary)]"
                          >
                            {opp.moduleName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-secondary)]">
                Clicca su qualsiasi pin nella mappa interattiva o su{' '}
                <strong className="text-[var(--text-primary)]">Anteprima Maps</strong> nella tabella risultati per ispezionare la scheda Google Maps dell&apos;attività.
              </p>
            )}
          </div>

          <div className="relative w-full h-[230px] lg:h-[250px] bg-[var(--bg-canvas)]">
            <iframe
              key={googleMapsEmbedUrl}
              title="Anteprima Google Maps Live"
              src={googleMapsEmbedUrl}
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>

          <div className="p-3.5 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] space-y-2">
            {analyzeFeedback && (
              <div
                aria-live="polite"
                className="px-2.5 py-1.5 rounded-lg bg-[var(--rivo-volt-bg)] border border-[var(--rivo-volt-border)] text-[11px] text-[var(--rivo-volt-text)] flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                <span>{analyzeFeedback}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <a
                href={selectedExternalMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[38px] items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--rivo-volt)] text-xs font-medium text-[var(--text-primary)] transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[var(--rivo-volt-text)]" strokeWidth={1.75} aria-hidden="true" />
                <span>Apri su Google Maps</span>
              </a>

              {selectedProspect && (
                <>
                  <Link
                    href={`/admin/outreach/intelligence?prospectId=${encodeURIComponent(selectedProspect.id)}`}
                    className="inline-flex min-h-[38px] items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[var(--rivo-volt-ink)] text-xs font-bold transition-colors"
                  >
                    <Cpu className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                    <span>Apri Scheda &amp; Pitch AI</span>
                  </Link>

                  <button
                    type="button"
                    disabled={analyzingId === selectedProspect.id}
                    onClick={() => handleQuickAiAnalyze(selectedProspect)}
                    className="inline-flex min-h-[38px] items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--rivo-volt)] text-[var(--text-primary)] text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {analyzingId === selectedProspect.id
                      ? 'Analisi AI…'
                      : selectedProspect.ai_analysis
                      ? 'Rianalizza AI'
                      : 'Analizza AI'}
                  </button>

                  <Link
                    href={`/admin/organizations/new?outreachProspectId=${encodeURIComponent(selectedProspect.id)}`}
                    className="inline-flex min-h-[38px] items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-operational-bg)] border border-[var(--accent-operational-border)] hover:opacity-90 text-[var(--accent-operational-text)] text-xs font-semibold transition-opacity"
                  >
                    <UserPlus className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                    <span>Converti in RIVO</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </SurfaceCard>
  );
}
