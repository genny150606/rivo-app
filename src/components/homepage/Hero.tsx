'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const animationBase = "transition-all duration-1000 ease-out motion-reduce:transition-none motion-reduce:transform-none motion-reduce:opacity-100";
  const beforeMount = "opacity-0 translate-y-8";
  const afterMount = "opacity-100 translate-y-0";

  return (
    <section className="relative min-h-[100svh] pt-32 pb-16 px-4 md:px-6 flex flex-col items-center justify-center overflow-hidden bg-[#09090B]">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-lime-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Text Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
        
        {/* Badge */}
        <div className={`${animationBase} delay-100 ${mounted ? afterMount : beforeMount}`}>
          <span className="inline-flex items-center border border-zinc-700 bg-zinc-800/50 text-zinc-300 text-xs px-3 py-1 rounded-full mb-8 backdrop-blur-sm">
            Piattaforma B2B per attività fisiche
          </span>
        </div>

        {/* Headline */}
        <h1 className={`text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] mb-6 ${animationBase} delay-300 ${mounted ? afterMount : beforeMount}`}>
          Il tuo business fisico.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">Connesso.</span>
        </h1>

        {/* Subtitle */}
        <p className={`text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 ${animationBase} delay-500 ${mounted ? afterMount : beforeMount}`}>
          Una piattaforma che trasforma ogni interazione fisica con i tuoi clienti in un'esperienza digitale misurabile.
        </p>

        {/* CTAs */}
        <div className={`flex flex-col sm:flex-row items-center gap-4 ${animationBase} delay-700 ${mounted ? afterMount : beforeMount}`}>
          <Link href="#scopri" className="flex items-center justify-center w-full sm:w-auto bg-lime-500 hover:bg-lime-400 text-black font-semibold rounded-lg px-6 py-3 text-base transition-colors group">
            Scopri RIVO
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="#" className="flex items-center justify-center w-full sm:w-auto border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/30 text-white rounded-lg px-6 py-3 text-base transition-all">
            Richiedi una demo
          </Link>
        </div>
      </div>

      {/* Hero Visual Area (Ecosystem Diagram) */}
      <div className={`relative z-0 mt-20 w-full max-w-5xl aspect-square md:aspect-video mx-auto flex items-center justify-center ${animationBase} delay-1000 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <style>{`
          @keyframes orbit {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes orbit-reverse {
            0% { transform: rotate(360deg); }
            100% { transform: rotate(0deg); }
          }
          @keyframes pulse-ring {
            0% { transform: scale(0.8); opacity: 0.5; }
            100% { transform: scale(1.5); opacity: 0; }
          }
          .orbit-container {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .orbit-ring {
            border: 1px dashed rgba(255, 255, 255, 0.05);
            border-radius: 50%;
            position: absolute;
          }
          .orbit-1 { width: 280px; height: 280px; animation: orbit 25s linear infinite; }
          .orbit-2 { width: 440px; height: 440px; animation: orbit-reverse 40s linear infinite; }
          .orbit-3 { width: 620px; height: 620px; animation: orbit 55s linear infinite; }
          
          .node {
            position: absolute;
            background: #18181B;
            border: 1px solid #27272A;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #A1A1AA;
            font-size: 11px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
          }
          .node-small { width: 40px; height: 40px; }
          .node-large { width: 56px; height: 56px; }
          
          .orbit-node-top { position: absolute; top: 0; left: 50%; transform: translate(-50%, -50%); }
          .orbit-node-bottom { position: absolute; bottom: 0; left: 50%; transform: translate(-50%, 50%); }
          .orbit-node-left { position: absolute; top: 50%; left: 0; transform: translate(-50%, -50%); }
          .orbit-node-right { position: absolute; top: 50%; right: 0; transform: translate(50%, -50%); }
          
          .anti-orbit-1 { animation: orbit-reverse 25s linear infinite; }
          .anti-orbit-2 { animation: orbit 40s linear infinite; }
          .anti-orbit-3 { animation: orbit-reverse 55s linear infinite; }

          @media (prefers-reduced-motion: reduce) {
            .orbit-1, .orbit-2, .orbit-3, 
            .anti-orbit-1, .anti-orbit-2, .anti-orbit-3 {
              animation: none !important;
            }
          }
        `}</style>

        <div className="orbit-container">
          {/* Central Node */}
          <div className="relative z-10 flex items-center justify-center">
            <div className="absolute inset-0 bg-lime-500 rounded-full blur-xl opacity-30 animate-pulse motion-reduce:animate-none"></div>
            <div className="absolute inset-0 border-2 border-lime-500 rounded-full motion-reduce:animate-none" style={{ animation: 'pulse-ring 3s cubic-bezier(0.215, 0.61, 0.355, 1) infinite' }}></div>
            <div className="w-20 h-20 bg-zinc-900 border border-lime-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(132,204,22,0.3)] z-10">
              <span className="text-lime-500 font-bold text-xl tracking-tighter">RIVO</span>
            </div>
          </div>

          {/* Orbit 1 */}
          <div className="orbit-ring orbit-1 hidden md:block">
            <div className="orbit-node-top node node-small">
              <div className="anti-orbit-1">NFC</div>
            </div>
            <div className="orbit-node-bottom node node-small">
              <div className="anti-orbit-1">QR</div>
            </div>
          </div>

          {/* Orbit 2 */}
          <div className="orbit-ring orbit-2 hidden md:block">
            <div className="orbit-node-top node node-large">
              <div className="anti-orbit-2 text-center leading-tight">Review</div>
            </div>
            <div className="orbit-node-bottom node node-large">
              <div className="anti-orbit-2 text-center leading-tight">Smart<br/>Bill</div>
            </div>
            <div className="orbit-node-left node node-large">
              <div className="anti-orbit-2 text-center leading-tight">CRM</div>
            </div>
            <div className="orbit-node-right node node-large">
              <div className="anti-orbit-2 text-center leading-tight">Loyalty</div>
            </div>
          </div>

          {/* Orbit 3 */}
          <div className="orbit-ring orbit-3 hidden lg:block">
            <div className="orbit-node-top node node-large">
              <div className="anti-orbit-3 text-center leading-tight">Service</div>
            </div>
            <div className="orbit-node-bottom node node-large">
              <div className="anti-orbit-3 text-center leading-tight">Menu</div>
            </div>
            <div className="orbit-node-left node node-large">
              <div className="anti-orbit-3 text-center leading-tight">Stats</div>
            </div>
          </div>
        </div>
        
        {/* Bottom Gradient Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#09090B] to-transparent pointer-events-none" />
      </div>
    </section>
  );
}
