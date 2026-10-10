'use client';

import { useEffect, useRef, useState } from 'react';
import { sound } from './SoundSystem';
import { ArrowRight, Layers, Sparkles, Zap } from 'lucide-react';

export default function NfcPortal() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0); // 0 to 1
  const [activeDolly, setActiveDolly] = useState(0.2); // Smooth lerped progress

  useEffect(() => {
    const handleScroll = () => {
      const el = sectionRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate how far through the 250vh section we've scrolled
      const totalDist = el.offsetHeight - windowHeight;
      const currentProgress = Math.max(0, Math.min(1, -rect.top / totalDist));
      setScrollProgress(currentProgress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth lerp progress
  useEffect(() => {
    let raf: number;
    const lerp = () => {
      setActiveDolly((prev) => {
        const diff = scrollProgress - prev;
        if (Math.abs(diff) < 0.001) return scrollProgress;
        return prev + diff * 0.12;
      });
      raf = requestAnimationFrame(lerp);
    };
    raf = requestAnimationFrame(lerp);
    return () => cancelAnimationFrame(raf);
  }, [scrollProgress]);

  // Tag scale transforms from 1x to 12x
  const scale = 1 + activeDolly * 9.5;
  const opacityPhysical = Math.max(0, 1 - activeDolly * 2.2);
  const opacityDigital = Math.max(0, Math.min(1, (activeDolly - 0.35) * 2));
  const portalGlow = Math.min(1, activeDolly * 1.8);

  return (
    <section
      id="portal"
      ref={sectionRef}
      className="relative h-[220vh] w-full bg-[#030305] text-white"
    >
      {/* Pinned Viewport Container */}
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden">
        
        {/* Background Depth Atmosphere */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at 50% 50%, rgba(191, 255, 0, ${portalGlow * 0.18}), rgba(0, 0, 0, 0.95) 75%)`,
          }}
        />

        {/* Cinematic Grid Floor Perspective */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            transform: `perspective(600px) rotateX(65deg) translateY(${activeDolly * 120}px)`,
            transformOrigin: 'bottom center',
          }}
        />

        {/* The Giant Zooming NFC Portal Core */}
        <div
          className="relative z-10 flex items-center justify-center will-change-transform pointer-events-none"
          style={{
            transform: `scale(${scale})`,
            transition: 'transform 0.05s linear',
          }}
        >
          {/* Physical Antenna Chassis */}
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full border border-zinc-700/80 bg-gradient-to-tr from-zinc-950 via-zinc-900 to-zinc-800 flex items-center justify-center shadow-[0_0_80px_rgba(0,0,0,1)]">
            
            {/* Concentric Copper Induction Coil Tracks */}
            <svg
              className="absolute inset-0 w-full h-full text-zinc-500/40"
              viewBox="0 0 200 200"
              fill="none"
            >
              {[15, 25, 35, 45, 55, 65, 75, 85, 95].map((r, i) => (
                <circle
                  key={i}
                  cx="100"
                  cy="100"
                  r={r}
                  stroke="currentColor"
                  strokeWidth="0.8"
                  strokeDasharray={i % 2 === 0 ? '4 2' : 'none'}
                />
              ))}
            </svg>

            {/* Glowing Wormhole Center */}
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 relative overflow-hidden"
              style={{
                boxShadow: `0 0 ${40 + activeDolly * 120}px rgba(191, 255, 0, ${0.4 + activeDolly * 0.6})`,
                backgroundColor: activeDolly > 0.4 ? '#BFFF00' : '#141416',
              }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.9),transparent_70%)] animate-pulse" />
              <Zap
                size={36}
                className={activeDolly > 0.4 ? 'text-black animate-ping' : 'text-[#BFFF00]'}
              />
            </div>
          </div>
        </div>

        {/* Phase A: Physical Label Overlay */}
        <div
          className="absolute z-20 flex flex-col items-center text-center px-4 pointer-events-none transition-opacity duration-300"
          style={{
            opacity: opacityPhysical,
            transform: `translateY(${-activeDolly * 60}px)`,
          }}
        >
          <span className="px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-700 text-zinc-400 text-xs font-mono tracking-widest uppercase mb-4">
            PHASE 01 • THE PHYSICAL ANCHOR
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-['Space_Grotesk'] text-zinc-200">
            A REAL SURFACE IN SPACE.
          </h2>
          <p className="mt-2 text-zinc-400 text-sm sm:text-base max-w-md">
            Tables, counters, walls, products. Inert matter waiting for digital intent.
          </p>
        </div>

        {/* Phase B: Digital Warp Portal Overlay (reveals as camera enters tag) */}
        <div
          className="absolute z-30 flex flex-col items-center text-center px-4 max-w-4xl pointer-events-none transition-opacity duration-300"
          style={{
            opacity: opacityDigital,
            transform: `scale(${0.85 + activeDolly * 0.15}) translateY(${(1 - activeDolly) * 40}px)`,
          }}
        >
          {/* Bridge indicator */}
          <div className="flex items-center gap-3 mb-6 px-4 py-1.5 rounded-full bg-black/60 border border-[#BFFF00]/40 backdrop-blur-md">
            <span className="text-zinc-400 text-[11px] font-mono tracking-wider">PHYSICAL</span>
            <ArrowRight size={14} className="text-[#BFFF00] animate-pulse" />
            <span className="text-[#BFFF00] text-[11px] font-mono font-bold tracking-wider">DIGITAL OS</span>
          </div>

          {/* Core Manifesto Headline */}
          <h2 className="text-4xl sm:text-7xl lg:text-8xl font-black tracking-[-0.03em] uppercase leading-none font-['Space_Grotesk']">
            ONE TAP. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#BFFF00] via-white to-[#38BDF8]">
              INFINITE POSSIBILITIES.
            </span>
          </h2>

          <p className="mt-6 text-base sm:text-2xl text-zinc-300 max-w-2xl font-light leading-relaxed">
            RIVO gives the physical world an interface. Without downloading an app. Without typing a URL. In 0.2 seconds.
          </p>

          {/* Interactive Scrub Guide / Hint */}
          <div className="mt-8 flex items-center gap-2 text-zinc-500 text-xs font-mono">
            <Sparkles size={14} className="text-[#BFFF00]" />
            <span>KEEP SCROLLING TO ENTER THE LIVING EXPERIENCE CONSTELLATION</span>
          </div>
        </div>

        {/* Camera Progress Indicator Bar at Bottom of Pinned View */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-1.5 rounded-full bg-zinc-950/80 border border-zinc-800 text-[10px] font-mono text-zinc-400">
          <span>PORTAL DEPTH</span>
          <div className="w-24 h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#BFFF00] transition-all duration-75"
              style={{ width: `${Math.round(activeDolly * 100)}%` }}
            />
          </div>
          <span className="text-zinc-200 font-bold">{Math.round(activeDolly * 100)}%</span>
        </div>

      </div>
    </section>
  );
}
