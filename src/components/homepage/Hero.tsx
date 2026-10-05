'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, ShieldCheck, Zap, Layers, Smartphone } from 'lucide-react';
import HeroGlobe3D from './HeroGlobe3D';

export default function Hero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const animationBase = "transition-all duration-1000 ease-out motion-reduce:transition-none motion-reduce:transform-none motion-reduce:opacity-100";
  const beforeMount = "opacity-0 translate-y-8";
  const afterMount = "opacity-100 translate-y-0";

  return (
    <section className="relative min-h-[100svh] pt-28 md:pt-36 pb-20 px-4 md:px-6 flex flex-col justify-center overflow-hidden bg-[#09090B]">
      {/* Dynamic Background Neon Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-lime-500/[0.07] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-2/3 right-10 w-[400px] h-[400px] bg-indigo-600/[0.08] rounded-full blur-[130px] pointer-events-none" />

      {/* Main Grid: Text on Left/Center, 3D Interactive WebGL on Right */}
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        
        {/* Left Column: Copy & Conversions (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
          
          {/* Badge */}
          <div className={`${animationBase} delay-100 ${mounted ? afterMount : beforeMount}`}>
            <span className="inline-flex items-center gap-2 border border-lime-400/30 bg-lime-400/10 text-lime-400 text-xs px-3.5 py-1.5 rounded-full font-mono tracking-wide backdrop-blur-md shadow-lg shadow-lime-500/10">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Piattaforma Phygital & AI • Retail & Hospitality</span>
            </span>
          </div>

          {/* Headline */}
          <h1 className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.08] ${animationBase} delay-300 ${mounted ? afterMount : beforeMount}`}>
            Il tuo business fisico.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 via-lime-200 to-indigo-300">
              Connesso con l’AI.
            </span>
          </h1>

          {/* Subtitle */}
          <p className={`text-base sm:text-lg md:text-xl text-zinc-400 max-w-xl leading-relaxed ${animationBase} delay-500 ${mounted ? afterMount : beforeMount}`}>
            Collega i tuoi touchpoint reali (Stand NFC, scanner scatole, cassa rapida) al gestionale cloud. Riduci l&apos;inventario dell&apos;82% e trasforma ogni visita in fedeltà.
          </p>

          {/* Primary Action Buttons (Instant Demo Access + Hardware Request) */}
          <div className={`flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto pt-2 ${animationBase} delay-700 ${mounted ? afterMount : beforeMount}`}>
            <Link 
              href="/dashboard" 
              className="flex items-center justify-center w-full sm:w-auto bg-lime-400 hover:bg-lime-300 text-black font-extrabold rounded-2xl px-7 py-4 text-sm md:text-base shadow-xl shadow-lime-400/25 active:scale-[0.98] transition-all group"
            >
              <span>Esplora Dashboard Demo</span>
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link 
              href="#scanner-interattivo" 
              className="flex items-center justify-center w-full sm:w-auto border border-zinc-700 hover:border-zinc-500 bg-zinc-900/80 hover:bg-zinc-800 text-white font-bold rounded-2xl px-6 py-4 text-sm md:text-base backdrop-blur-md transition-all active:scale-[0.98]"
            >
              <Zap className="mr-2 w-4 h-4 text-lime-400" />
              <span>Simulatore Scanner Live</span>
            </Link>
          </div>

          {/* Trust Guarantees */}
          <div className={`flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4 text-xs text-zinc-500 font-medium ${animationBase} delay-900 ${mounted ? afterMount : beforeMount}`}>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-lime-400" />
              Nessuna carta di credito
            </span>
            <span className="text-zinc-700">•</span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-lime-400" />
              Accesso istantaneo
            </span>
            <span className="text-zinc-700">•</span>
            <span className="flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-lime-400" />
              Compatibile iOS & Android
            </span>
          </div>

        </div>

        {/* Right Column: 3D Holographic WebGL Globe (5 cols) */}
        <div className={`lg:col-span-5 flex items-center justify-center ${animationBase} delay-700 ${mounted ? afterMount : beforeMount}`}>
          <HeroGlobe3D />
        </div>

      </div>

      {/* Bottom Subtle Gradient Fade to Next Section */}
      <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-[#09090B] to-transparent pointer-events-none" />
    </section>
  );
}
