'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Map as MapIcon,
  MapPin,
  Layers,
  Crosshair,
  ExternalLink,
  Sparkles,
  UserPlus,
  Phone,
  Globe,
  Navigation,
  Search,
  CheckCircle2,
} from 'lucide-react';
import type { OutreachProspectRecord } from '@/lib/outreach/types';

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

  // Cleanup map instance on component unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Switch tile layer when mapStyle changes
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

  // Draw search radius circle, center pin, and prospect pins
  useEffect(() => {
    if (!leafletReady || !mapInstanceRef.current || !overlayLayerRef.current || !window.L) return;
    const L = window.L;
    const map = mapInstanceRef.current;
    const group = overlayLayerRef.current;

    group.clearLayers();

    // 1. Live Search Radius Circle
    const radiusCircle = L.circle([centerLat, centerLon], {
      radius: Math.max(500, radiusKm * 1000),
      color: '#BFFF00',
      weight: 2,
      opacity: 0.75,
      fillColor: '#BFFF00',
      fillOpacity: 0.08,
      dashArray: '6 6',
    }).addTo(group);

    // 2. Search Center Crosshair Marker
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

    // 3. Prospect Markers
    for (const p of mappableProspects) {
      const isSelected = selectedProspect?.id === p.id;
      const isNew = newlyInsertedIds?.has(p.id);
      let fill = '#F59E0B'; // waiting analysis / default
      if (isSelected) fill = '#FFFFFF';
      else if (isNew || p.lead_score >= 80) fill = '#BFFF00';
      else if (p.lead_score >= 60) fill = '#22C55E';
      else if (p.ai_analysis) fill = '#38BDF8';

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

    // Fit bounds only when center/radius changes
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

  // Smooth pan to selected prospect when clicked from table
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
          action: 'analyze_prospect',
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

  // Compute Google Maps Embed URL for either the selected prospect or the Napoli/Campania search center
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
    <div className="bg-[#121214] border border-[#27272A] rounded-xl overflow-hidden">
      {/* Top Map Toolbar */}
      <div className="px-5 py-3.5 border-b border-[#27272A] flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-[#0D0D10]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#BFFF00]/15 border border-[#BFFF00]/40 text-[#BFFF00]">
              <MapIcon className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-[#FAFAFA] leading-tight">
                Mappa Interattiva Campania & Preview Google Maps
              </h2>
              <p className="text-[11px] text-[#A1A1AA]">
                Centro: <span className="text-[#FAFAFA] font-medium">{locationLabel}</span> ({centerLat.toFixed(4)}, {centerLon.toFixed(4)}) · Raggio{' '}
                <span className="text-[#BFFF00] font-mono">{radiusKm} km</span> ·{' '}
                <span className="font-mono text-[#FAFAFA]">{mappableProspects.length}</span> pin geolocalizzati
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Layer Switcher */}
          <div className="inline-flex rounded-lg bg-[#121214] border border-[#27272A] p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setMapStyle('dark')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors ${
                mapStyle === 'dark'
                  ? 'bg-[#BFFF00] text-[#09090B] font-semibold'
                  : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
              }`}
            >
              <Layers className="w-3 h-3" />
              Dark Maps
            </button>
            <button
              type="button"
              onClick={() => setMapStyle('street')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors ${
                mapStyle === 'street'
                  ? 'bg-[#BFFF00] text-[#09090B] font-semibold'
                  : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
              }`}
            >
              Stradale OSM
            </button>
          </div>

          <button
            type="button"
            onClick={() => onSearchThisArea(centerLat, centerLon)}
            disabled={searching}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#BFFF00] hover:bg-[#A8E600] text-[#09090B] text-xs font-bold transition-colors disabled:opacity-50"
          >
            <Search className="w-3.5 h-3.5" />
            {searching ? 'Scansione Area...' : 'Cerca Attività in Quest’Area'}
          </button>
        </div>
      </div>

      {/* Main Split View: Interactive Pin Map (Left) + Live Google Maps Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Interactive Leaflet Map Canvas */}
        <div className="lg:col-span-7 relative min-h-[400px] lg:min-h-[470px] border-b lg:border-b-0 lg:border-r border-[#27272A] bg-[#09090B]">
          <div ref={mapContainerRef} className="w-full h-[400px] lg:h-[470px] z-0" />

          {!leafletReady && !leafletFailed && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#09090B]/90 text-xs text-[#A1A1AA] gap-2 z-10">
              <div className="w-6 h-6 border-2 border-[#BFFF00] border-t-transparent rounded-full animate-spin" />
              <span>Caricamento mappa interattiva Napoli & Campania...</span>
            </div>
          )}

          {leafletFailed && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#09090B] text-xs text-[#A1A1AA] gap-3 z-10">
              <MapPin className="w-7 h-7 text-[#BFFF00]" />
              <p>Mappa interattiva Leaflet non raggiungibile in questa rete: usa il pannello Google Maps Live qui a fianco.</p>
            </div>
          )}

          {/* Legend & Click-to-Center Hint */}
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-[400]">
            <div className="pointer-events-auto px-3 py-1.5 rounded-lg bg-[#09090B]/90 backdrop-blur border border-[#27272A] text-[10px] text-[#A1A1AA] flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#BFFF00]" /> Nuovi / Priorità
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" /> Alto Potenziale
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8]" /> Analizzati
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" /> Da Analizzare
              </span>
            </div>

            <div className="pointer-events-auto px-2.5 py-1.5 rounded-lg bg-[#09090B]/90 backdrop-blur border border-[#27272A] text-[10px] text-[#FAFAFA] flex items-center gap-1.5">
              <Crosshair className="w-3 h-3 text-[#BFFF00]" />
              <span>Clicca sulla mappa per spostare il centro di ricerca</span>
            </div>
          </div>
        </div>

        {/* Right Side: Live Google Maps Preview & Quick Prospect Card */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-[#121214]">
          <div className="p-4 border-b border-[#27272A] space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-[#BFFF00]">
                  <Navigation className="w-3 h-3" />
                  {selectedProspect ? 'Scheda Maps Live — Attività Selezionata' : 'Anteprima Google Maps — Area Campania'}
                </span>
                <h3 className="text-base font-bold text-[#FAFAFA] mt-0.5 leading-snug">
                  {selectedProspect ? selectedProspect.business_name : `${locationLabel} (${radiusKm} km)`}
                </h3>
              </div>

              {selectedProspect && selectedProspect.lead_score > 0 && (
                <span className="shrink-0 px-2 py-1 rounded bg-[#BFFF00]/15 border border-[#BFFF00]/40 text-[#BFFF00] font-mono text-xs font-bold">
                  {selectedProspect.lead_score}/100
                </span>
              )}
            </div>

            {selectedProspect ? (
              <div className="space-y-1.5 text-xs text-[#A1A1AA]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#18181B] border border-[#27272A] text-[#FAFAFA] text-[11px]">
                    {selectedProspect.subcategory || selectedProspect.category}
                  </span>
                  {selectedDistance !== null && (
                    <span className="px-2 py-0.5 rounded bg-[#18181B] border border-[#27272A] text-[#BFFF00] font-mono text-[11px]">
                      {selectedDistance} km dal centro
                    </span>
                  )}
                  {typeof selectedProspect.digital_signals?.rating === 'number' && (
                    <span className="px-2 py-0.5 rounded bg-[#18181B] border border-[#27272A] text-amber-300 font-mono text-[11px]">
                      ★ {selectedProspect.digital_signals.rating} ({selectedProspect.digital_signals.userRatingCount || 0})
                    </span>
                  )}
                </div>

                <div className="flex items-start gap-1.5 text-xs text-[#D4D4D8]">
                  <MapPin className="w-3.5 h-3.5 text-[#BFFF00] shrink-0 mt-0.5" />
                  <span>
                    {[selectedProspect.address, selectedProspect.city, selectedProspect.province]
                      .filter(Boolean)
                      .join(', ') || 'Campania, Italia'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {selectedProspect.business_phone && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#0D0D10] border border-[#27272A] font-mono text-[11px] text-[#FAFAFA]">
                      <Phone className="w-3 h-3 text-[#BFFF00]" />
                      {selectedProspect.business_phone}
                    </span>
                  )}
                  {selectedProspect.website && (
                    <a
                      href={selectedProspect.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#0D0D10] border border-[#27272A] text-[11px] text-[#FAFAFA] hover:border-[#BFFF00]"
                    >
                      <Globe className="w-3 h-3 text-[#BFFF00]" />
                      {selectedProspect.website_domain || 'Sito Web'}
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#A1A1AA]">
                Clicca su qualsiasi pin nella mappa interattiva o su <strong className="text-[#FAFAFA]">Anteprima Maps</strong> nella tabella risultati per ispezionare la scheda Google Maps dell&apos;attività.
              </p>
            )}
          </div>

          {/* Embedded Google Maps Live Frame */}
          <div className="relative w-full h-[230px] lg:h-[250px] bg-[#09090B]">
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

          {/* Footer Action Buttons */}
          <div className="p-3.5 border-t border-[#27272A] bg-[#0D0D10] space-y-2">
            {analyzeFeedback && (
              <div className="px-2.5 py-1.5 rounded bg-[#BFFF00]/10 border border-[#BFFF00]/30 text-[11px] text-[#BFFF00] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{analyzeFeedback}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <a
                href={selectedExternalMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181B] border border-[#27272A] hover:border-[#BFFF00] text-xs font-medium text-[#FAFAFA] transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#BFFF00]" />
                Apri su Google Maps
              </a>

              {selectedProspect && (
                <>
                  <button
                    type="button"
                    disabled={analyzingId === selectedProspect.id}
                    onClick={() => handleQuickAiAnalyze(selectedProspect)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#BFFF00] hover:bg-[#A8E600] text-[#09090B] text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {analyzingId === selectedProspect.id ? 'Analisi AI...' : 'Analizza AI'}
                  </button>

                  <Link
                    href={`/admin/organizations/new?outreachProspectId=${encodeURIComponent(selectedProspect.id)}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 hover:bg-emerald-500/25 text-emerald-300 text-xs font-semibold transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Converti in RIVO
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
