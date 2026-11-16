'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Radio,
  ShieldCheck,
  TrendingUp,
  Smartphone,
  QrCode,
  Star,
  Store,
  Utensils,
  Zap,
  Layers,
  Eye,
  Cpu,
  LayoutGrid,
} from 'lucide-react';

type ConceptId = 'A' | 'B' | 'C';

const CONCEPT_META: Record<
  ConceptId,
  {
    code: string;
    name: string;
    subtitle: string;
    verdict: string;
    badge: string;
    summary: string;
    strengths: string[];
    tradeoff: string;
  }
> = {
  A: {
    code: 'CONCEPT A',
    name: 'RIVO CONTROL',
    subtitle: 'Enterprise Control Center',
    verdict: 'SELECTED — Primary B2B Platform Spine',
    badge: 'RECOMMENDED',
    summary:
      'Disciplined 1px structural hairline grid, Carbon/Alabaster dual polarity for 8-hour shift comfort, JetBrains Mono tabular telemetry, and surgical RIVO Volt (#BFFF00) focal indicators.',
    strengths: [
      'Seamless Dark Mode telemetry & high-contrast Light Mode ERP tables',
      'Asymmetric 8/4 layout hierarchy eliminating identical 4-card rows',
      'Strict 8px/12px/16px concentric geometry across all SaaS modules',
    ],
    tradeoff: 'Requires restrained editorial typography above the fold on / so marketing never reads purely utilitarian.',
  },
  B: {
    code: 'CONCEPT B',
    name: 'RIVO FUTURE',
    subtitle: 'Hardware Signal Telemetry',
    verdict: 'ADOPTED FOR — Simulator Trace & Scanner/Device Views',
    badge: 'EXPERIMENTAL',
    summary:
      'High-contrast OLED #050506 backdrop with exposed 24px technical coordinate grids, oscilloscope Volt signal beams, and hardware handshake framing.',
    strengths: [
      'Unmistakably showcases RIVO NTAG 424 NFC hardware & <0.4s latency',
      'Exceptional differentiation on Hero Tap-to-Cloud Simulator & Barcode Scanner',
      'High precision instrument feel for Admin & Hardware diagnostics',
    ],
    tradeoff: 'Too dense and high-contrast for 8-hour daytime accounting tables or warm restaurant guest menus.',
  },
  C: {
    code: 'CONCEPT C',
    name: 'RIVO EDITORIAL',
    subtitle: 'Curated Architectural Minimalist',
    verdict: 'ADOPTED FOR — Hero Headline Restraint & Guest /hub/[code]',
    badge: 'CURATED',
    summary:
      'Warm stone/alabaster and deep matte ink surfaces, oversized typographic scale, generous negative space, and calm borderless tonal steps.',
    strengths: [
      'Elevates luxury boutique and fine-dining hospitality perception',
      'Zero cognitive friction for diners tapping physical NFC table stands',
      'Calm visual authority that lets physical hardware renders breathe',
    ],
    tradeoff: 'Excessive whitespace reduces information density needed by cashiers and multi-location venue managers.',
  },
};

export default function ConceptsShowcasePage() {
  const [activeConcept, setActiveConcept] = useState<ConceptId>('A');
  const [controlTheme, setControlTheme] = useState<'dark' | 'light'>('dark');
  const [futurePulseActive, setFuturePulseActive] = useState(true);

  const meta = CONCEPT_META[activeConcept];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#09090B] text-[#F4F4F6] font-sans antialiased">
      {/* Top Evaluation Bar */}
      <header className="sticky top-0 z-40 border-b border-[#22242A] bg-[#09090B]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-3 min-w-0">
            <Link
              href="/"
              className="inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-lg border border-[#22242A] bg-[#111215] px-3 py-1.5 text-xs font-medium text-[#A1A1AA] transition-colors hover:border-[#32353E] hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Torna a RIVO</span>
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-[#BFFF00]" />
                <span className="truncate font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-[#A1A1AA]">
                  DESIGN REVOLUTION // CONCEPTS
                </span>
              </div>
              <h1 className="truncate text-sm font-bold tracking-tight text-white sm:text-lg">
                RIVO Visual Direction Suite
              </h1>
            </div>
          </div>

          {/* Concept Switcher */}
          <div
            role="tablist"
            aria-label="Seleziona Visual Concept"
            className="flex w-full sm:w-auto flex-wrap items-center gap-1 rounded-xl border border-[#22242A] bg-[#111215] p-1"
          >
            {(['A', 'B', 'C'] as ConceptId[]).map((id) => {
              const selected = activeConcept === id;
              return (
                <button
                  key={id}
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveConcept(id)}
                  className={`flex-1 sm:flex-initial min-h-[40px] sm:min-h-[36px] rounded-lg px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer ${
                    selected
                      ? 'bg-[#BFFF00] text-[#09090B]'
                      : 'text-[#A1A1AA] hover:bg-[#18191E] hover:text-white'
                  }`}
                >
                  <span className="font-mono">{id}:</span>{' '}
                  {CONCEPT_META[id].name.replace('RIVO ', '')}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 space-y-6 sm:space-y-8 min-w-0 overflow-x-hidden">
        {/* Concept Rationale Banner */}
        <section className="grid grid-cols-1 gap-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6 lg:grid-cols-12 min-w-0">
          <div className="lg:col-span-7 space-y-3 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-md bg-[#BFFF00] px-2.5 py-1 font-mono text-[11px] font-bold tracking-wider text-zinc-950">
                {meta.code}
              </span>
              <span className="rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1 font-mono text-[11px] tracking-wider text-zinc-100">
                {meta.badge}
              </span>
              <span className="font-mono text-xs text-emerald-400">{meta.verdict}</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-white">
              {meta.name} — <span className="text-zinc-400 font-normal">{meta.subtitle}</span>
            </h2>
            <p className="text-sm leading-relaxed text-zinc-300 max-w-2xl">{meta.summary}</p>
          </div>

          <div className="lg:col-span-5 grid grid-cols-1 gap-3 border-t border-zinc-800 pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0 min-w-0">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400 mb-2">
                Punti di Forza Strutturali
              </div>
              <ul className="space-y-1.5">
                {meta.strengths.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-xs text-zinc-100">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#BFFF00]" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-black/50 px-3 py-2 text-xs text-zinc-300">
              <span className="font-mono text-[10px] uppercase tracking-wider text-amber-400 mr-2">
                Trade-off:
              </span>
              {meta.tradeoff}
            </div>
          </div>
        </section>

        {/* Interactive Rendered Canvas */}
        {activeConcept === 'A' && (
          <section
            aria-label="Concept A RIVO Control Interactive Prototype"
            className={`rounded-2xl border transition-colors duration-200 ${
              controlTheme === 'dark'
                ? 'border-[#22242A] bg-[#09090B] text-[#F4F4F6]'
                : 'border-[#CFD4DC] bg-[#F6F7F9] text-[#09090B]'
            } overflow-hidden`}
          >
            {/* Control Mock App Shell */}
            <div
              className={`flex flex-wrap items-center justify-between gap-4 border-b px-4 sm:px-6 py-4 min-w-0 ${
                controlTheme === 'dark'
                  ? 'border-[#22242A] bg-[#111215] text-[#F4F4F6]'
                  : 'border-[#E4E6EB] bg-white text-[#09090B]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#BFFF00] font-mono text-sm font-black text-[#09090B]">
                  R
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-sm font-bold tracking-tight ${
                        controlTheme === 'dark' ? 'text-[#F4F4F6]' : 'text-[#09090B]'
                      }`}
                    >
                      RIVO CONTROL
                    </span>
                    <span className="rounded bg-[#09090B] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#BFFF00] border border-[#22242A]">
                      HOSPITALITY + RETAIL
                    </span>
                  </div>
                  <p
                    className={`truncate font-mono text-[11px] ${
                      controlTheme === 'dark' ? 'text-[#71717A]' : 'text-[#6B7280]'
                    }`}
                  >
                    ORG // OSTERIA DEL PORTO &amp; BORRELLI LAB · SYNC 14MS
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div
                  className={`inline-flex rounded-lg border p-0.5 ${
                    controlTheme === 'dark'
                      ? 'border-[#22242A] bg-[#09090B]'
                      : 'border-[#E4E6EB] bg-[#F0F2F5]'
                  }`}
                >
                  <button
                    onClick={() => setControlTheme('dark')}
                    className={`min-h-[34px] rounded-md px-3 font-mono text-xs font-medium transition-colors cursor-pointer ${
                      controlTheme === 'dark'
                        ? 'bg-[#18191E] text-white'
                        : 'text-[#4B5563] hover:text-[#09090B]'
                    }`}
                  >
                    Dark Control
                  </button>
                  <button
                    onClick={() => setControlTheme('light')}
                    className={`min-h-[34px] rounded-md px-3 font-mono text-xs font-medium transition-colors cursor-pointer ${
                      controlTheme === 'light'
                        ? 'bg-white text-[#09090B] shadow-xs'
                        : 'text-[#A1A1AA] hover:text-white'
                    }`}
                  >
                    Light ERP
                  </button>
                </div>
                <button className="min-h-[38px] rounded-lg bg-[#BFFF00] px-3.5 text-xs font-bold text-[#09090B] hover:bg-[#CEFF33] transition-colors cursor-pointer">
                  + Provision NFC Node
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-6 min-w-0">
              {/* 4 Precision KPIs */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    label: 'TAP NFC / 24H',
                    value: '1,428',
                    delta: '+18.4% vs 7g',
                    tone: controlTheme === 'dark' ? 'text-[#BFFF00]' : 'text-[#15803D]',
                  },
                  {
                    label: 'GOOGLE RATING INDEX',
                    value: '4.92 ★',
                    delta: '96.4% Shield Pass',
                    tone: 'text-[#10B981]',
                  },
                  {
                    label: 'NODI HARDWARE ONLINE',
                    value: '28 / 28',
                    delta: '100% NTAG 424 Active',
                    tone: controlTheme === 'dark' ? 'text-[#F4F4F6]' : 'text-[#09090B]',
                  },
                  {
                    label: 'MARGINE REALE RETAIL',
                    value: '54.2%',
                    delta: '€ 3,512.40 oggi',
                    tone: controlTheme === 'dark' ? 'text-[#BFFF00]' : 'text-[#15803D]',
                  },
                ].map((kpi) => (
                  <div
                    key={kpi.label}
                    className={`rounded-xl border p-5 min-w-0 ${
                      controlTheme === 'dark'
                        ? 'border-[#22242A] bg-[#111215] text-[#F4F4F6]'
                        : 'border-[#E4E6EB] bg-white text-[#09090B]'
                    }`}
                  >
                    <div
                      className={`font-mono text-[10px] uppercase tracking-[0.14em] ${
                        controlTheme === 'dark' ? 'text-[#71717A]' : 'text-[#6B7280]'
                      }`}
                    >
                      {kpi.label}
                    </div>
                    <div
                      className={`mt-2 font-mono text-2xl font-bold tabular-nums tracking-tight ${
                        controlTheme === 'dark' ? 'text-[#F4F4F6]' : 'text-[#09090B]'
                      }`}
                    >
                      {kpi.value}
                    </div>
                    <div className={`mt-1.5 font-mono text-xs font-medium tabular-nums ${kpi.tone}`}>
                      {kpi.delta}
                    </div>
                  </div>
                ))}
              </div>

              {/* Asymmetric 8/4 Split */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 min-w-0">
                <div
                  className={`lg:col-span-8 rounded-xl border min-w-0 ${
                    controlTheme === 'dark'
                      ? 'border-[#22242A] bg-[#111215] text-[#F4F4F6]'
                      : 'border-[#E4E6EB] bg-white text-[#09090B]'
                  } overflow-hidden`}
                >
                  <div
                    className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 sm:px-5 py-4 ${
                      controlTheme === 'dark' ? 'border-[#22242A]' : 'border-[#E4E6EB]'
                    }`}
                  >
                    <div className="min-w-0">
                      <h3
                        className={`text-sm font-semibold ${
                          controlTheme === 'dark' ? 'text-[#F4F4F6]' : 'text-[#09090B]'
                        }`}
                      >
                        Stream Hardware Fisico-Digitale
                      </h3>
                      <p
                        className={`text-xs ${
                          controlTheme === 'dark' ? 'text-[#A1A1AA]' : 'text-[#4B5563]'
                        }`}
                      >
                        Telemetria live da tavoli, banchi cassa e hub recensioni
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#10B981]/10 px-2.5 py-1 font-mono text-[11px] font-medium text-[#10B981] shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                      LIVE STREAM
                    </span>
                  </div>
                  <div className="divide-y divide-[#22242A]/20">
                    {[
                      {
                        node: 'RIVO-TAV04',
                        zone: 'Sala Principale · Tavolo 04',
                        action: 'Richiesta Conto POS',
                        latency: '14ms',
                        time: '19:42:08',
                      },
                      {
                        node: 'RIVO-FMT1GW',
                        zone: 'Cassa 01 · Borrelli Calzature',
                        action: 'Apple Wallet Loyalty +50pt',
                        latency: '19ms',
                        time: '19:41:51',
                      },
                      {
                        node: 'RIVO-TAV11',
                        zone: 'Dehors · Tavolo 11',
                        action: 'Review Shield 5★ -> Google Maps',
                        latency: '11ms',
                        time: '19:40:14',
                      },
                    ].map((row) => (
                      <div
                        key={row.node}
                        className={`flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3.5 text-sm ${
                          controlTheme === 'dark'
                            ? 'border-b border-[#22242A] hover:bg-[#18191E] text-[#F4F4F6]'
                            : 'border-b border-[#E4E6EB] hover:bg-[#F0F2F5] text-[#09090B]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="rounded bg-[#09090B] px-2 py-1 font-mono text-[11px] font-semibold text-[#BFFF00] border border-[#32353E] shrink-0">
                            {row.node}
                          </span>
                          <div className="min-w-0">
                            <div
                              className={`font-medium text-xs sm:text-sm truncate ${
                                controlTheme === 'dark' ? 'text-[#F4F4F6]' : 'text-[#09090B]'
                              }`}
                            >
                              {row.action}
                            </div>
                            <div
                              className={`text-xs truncate ${
                                controlTheme === 'dark' ? 'text-[#71717A]' : 'text-[#6B7280]'
                              }`}
                            >
                              {row.zone}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 font-mono text-xs tabular-nums shrink-0">
                          <span className="text-[#10B981]">{row.latency}</span>
                          <span
                            className={
                              controlTheme === 'dark' ? 'text-[#71717A]' : 'text-[#6B7280]'
                            }
                          >
                            {row.time}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className={`lg:col-span-4 rounded-xl border p-5 space-y-4 min-w-0 ${
                    controlTheme === 'dark'
                      ? 'border-[#22242A] bg-[#111215] text-[#F4F4F6]'
                      : 'border-[#E4E6EB] bg-white text-[#09090B]'
                  }`}
                >
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#71717A]">
                    DISTRIBUZIONE CANALI
                  </div>
                  {[
                    { label: 'Digital Menu & Hub', pct: 48, bar: 'bg-[#BFFF00]' },
                    { label: 'Google Review Shield', pct: 31, bar: 'bg-[#10B981]' },
                    { label: 'Apple Wallet Loyalty', pct: 21, bar: 'bg-[#3B82F6]' },
                  ].map((ch) => (
                    <div key={ch.label} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span
                          className={controlTheme === 'dark' ? 'text-[#F4F4F6]' : 'text-[#09090B]'}
                        >
                          {ch.label}
                        </span>
                        <span
                          className={`font-mono tabular-nums ${
                            controlTheme === 'dark' ? 'text-[#F4F4F6]' : 'text-[#09090B]'
                          }`}
                        >
                          {ch.pct}%
                        </span>
                      </div>
                      <div
                        className={`h-2 w-full overflow-hidden rounded-full ${
                          controlTheme === 'dark' ? 'bg-[#1F2128]' : 'bg-[#E8EBEF]'
                        }`}
                      >
                        <div className={`h-full ${ch.bar}`} style={{ width: `${ch.pct}%` }} />
                      </div>
                    </div>
                  ))}
                  <div
                    className={`mt-4 rounded-lg border p-3 text-xs ${
                      controlTheme === 'dark'
                        ? 'border-[#22242A] bg-[#18191E] text-[#A1A1AA]'
                        : 'border-[#E4E6EB] bg-[#F0F2F5] text-[#4B5563]'
                    }`}
                  >
                    Modalità duale verificata: Zero testi invisibili o superfici spezzate tra tema
                    scuro e tema chiaro.
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeConcept === 'B' && (
          <section
            aria-label="Concept B RIVO Future Telemetry Prototype"
            className="relative overflow-hidden rounded-2xl border border-[#22242A] bg-[#050506] p-6 sm:p-8"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(34,36,42,0.45) 1px, transparent 1px), linear-gradient(to bottom, rgba(34,36,42,0.45) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          >
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#22242A] pb-4">
              <div className="flex items-center gap-3">
                <Cpu className="h-5 w-5 text-[#BFFF00]" />
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#BFFF00]">
                  TELEMETRY MATRIX // NODE RIVO-NTAG424-X9
                </span>
              </div>
              <button
                onClick={() => setFuturePulseActive((p) => !p)}
                className="min-h-[38px] rounded border border-[#BFFF00]/40 bg-[#BFFF00]/10 px-3.5 font-mono text-xs font-semibold text-[#BFFF00] hover:bg-[#BFFF00] hover:text-[#09090B] transition-colors"
              >
                {futurePulseActive ? 'PAUSE HANDSHAKE TRACE' : 'TRIGGER NFC TAP TRACE'}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-center">
              <div className="lg:col-span-5 rounded-xl border border-[#2E3138] bg-[#0B0C0F]/95 p-5 space-y-4">
                <div className="flex items-center justify-between font-mono text-[10px] text-[#71717A]">
                  <span>+ HW_INTERFACE</span>
                  <span className="text-[#BFFF00]">ISO 14443-A</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-[#BFFF00]/50 bg-[#111215]">
                    <Radio className="h-7 w-7 text-[#BFFF00]" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">Physical NFC Puck Stand</div>
                    <div className="font-mono text-xs text-[#A1A1AA]">
                      CRYPTOUID: 04:A2:F9:1C:80:01
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                  <div className="rounded border border-[#22242A] bg-[#09090B] p-2.5">
                    <div className="text-[10px] text-[#71717A]">EDGE LATENCY</div>
                    <div className="text-base font-bold text-[#BFFF00]">14.2 ms</div>
                  </div>
                  <div className="rounded border border-[#22242A] bg-[#09090B] p-2.5">
                    <div className="text-[10px] text-[#71717A]">ZERO-APP OPEN</div>
                    <div className="text-base font-bold text-white">380 ms</div>
                  </div>
                </div>
              </div>

              {/* Signal Conduit */}
              <div className="lg:col-span-2 flex flex-col items-center justify-center gap-2 py-2">
                <div className="font-mono text-[10px] tracking-widest text-[#71717A]">
                  TLS 1.3 STREAM
                </div>
                <div className="relative h-1 w-full rounded bg-[#22242A] overflow-hidden">
                  <div
                    className={`h-full w-1/2 bg-[#BFFF00] transition-transform duration-700 ${
                      futurePulseActive ? 'translate-x-full' : 'translate-x-0'
                    }`}
                  />
                </div>
                <span className="font-mono text-[11px] text-[#BFFF00]">/t/[code] -&gt; EDGE</span>
              </div>

              <div className="lg:col-span-5 rounded-xl border border-[#2E3138] bg-[#0B0C0F]/95 p-5 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between text-[10px] text-[#71717A]">
                  <span>+ CLOUD_OUTBOX</span>
                  <span className="text-[#10B981]">SYNCED</span>
                </div>
                <div className="rounded border border-[#22242A] bg-[#050506] p-3 space-y-1 text-[#A1A1AA]">
                  <div>
                    <span className="text-[#BFFF00]">POST</span> /api/telemetry/scan{' '}
                    <span className="text-[#10B981]">200 OK</span>
                  </div>
                  <div>node_id: &quot;RIVO-FMT1GW&quot;</div>
                  <div>route_target: &quot;/hub/borrelli&quot;</div>
                  <div>offline_fallback: &quot;indexeddb_ready&quot;</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeConcept === 'C' && (
          <section
            aria-label="Concept C RIVO Editorial Prototype"
            style={{ backgroundColor: '#FAF9F6', color: '#141413' }}
            className="rounded-2xl border border-stone-200 bg-stone-50 text-stone-900 p-6 sm:p-10 space-y-8 min-w-0"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-6">
              <div className="text-xs font-medium tracking-[0.18em] uppercase text-stone-600">
                Osteria del Porto · Table Touchpoint
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-3.5 py-1.5 text-xs font-semibold text-stone-50">
                <span className="h-2 w-2 rounded-full bg-[#BFFF00]" />
                RIVO Guest Experience
              </span>
            </div>

            <div className="max-w-2xl space-y-4">
              <h3 className="text-3xl sm:text-5xl font-bold tracking-[-0.035em] leading-[1.05] text-stone-900">
                Ospitalità fisica, senza alcuna attesa.
              </h3>
              <p className="text-base sm:text-lg leading-relaxed text-stone-600">
                Un singolo tocco sul tavolo apre il menu multilingua, permette il saldo immediato e
                protegge la reputazione Google con discrezione editoriale.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                {
                  title: 'Menu Stagionale',
                  desc: 'Allergeni filtrabili e abbinamenti cantina in 380 millisecondi.',
                  cta: 'Sfoglia Carta',
                },
                {
                  title: 'Servizio al Tavolo',
                  desc: 'Chiamata discreta al cameriere o richiesta conto diviso.',
                  cta: 'Richiedi Assistenza',
                },
                {
                  title: 'Racconta la tua Visita',
                  desc: 'Valutazione privata immediata o pubblicazione su Google Maps.',
                  cta: 'Lascia Opinione',
                },
              ].map((card, i) => (
                <div
                  key={card.title}
                  className="flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-white p-6 sm:p-7 shadow-xs space-y-6"
                >
                  <div className="space-y-2.5">
                    <span className="font-mono text-xs text-stone-500">0{i + 1}</span>
                    <h4 className="text-xl font-semibold tracking-tight text-stone-900">
                      {card.title}
                    </h4>
                    <p className="text-sm leading-relaxed text-stone-600">{card.desc}</p>
                  </div>
                  <button
                    className={`min-h-[44px] w-full rounded-xl px-4 text-sm font-semibold transition-colors cursor-pointer ${
                      i === 0
                        ? 'bg-[#BFFF00] text-zinc-950 hover:bg-lime-300'
                        : 'bg-stone-100 text-stone-900 hover:bg-stone-200'
                    }`}
                  >
                    {card.cta}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Decision Matrix Footer */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#BFFF00]">
                DECISIONE ARCHITETTURALE UFFICIALE
              </div>
              <h3 className="text-lg font-bold text-white">
                Sistema Unificato: Concept A (Control) + innesti mirati B &amp; C
              </h3>
              <p className="text-sm text-zinc-400">
                Dashboard, Admin &amp; Retail ERP usano Concept A (Light/Dark) · Hero Simulator &amp;
                Scanner usano tracce Concept B · Customer Hub usa il respiro Concept C.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <Link
                href="/demo/retail"
                className="min-h-[44px] inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:border-[#BFFF00]/50"
              >
                <Store className="h-4 w-4 text-[#BFFF00]" />
                <span>Apri Demo Retail Live</span>
              </Link>
              <Link
                href="/login"
                className="min-h-[44px] inline-flex items-center gap-2 rounded-lg bg-[#BFFF00] px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-lime-300"
              >
                <span>Accedi alla Control Room</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
