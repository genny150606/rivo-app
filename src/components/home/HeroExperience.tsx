'use client';

import { useEffect, useRef, useState } from 'react';
import { sound } from './SoundSystem';
import { ArrowDown, Radio } from 'lucide-react';

interface HeroExperienceProps {
  onExplore?: () => void;
}

export default function HeroExperience({ onExplore }: HeroExperienceProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasTapped, setHasTapped] = useState(false);
  const [tapCount, setTapCount] = useState(0);

  // Mouse parallax coordinates (-1 to 1)
  const mouseCoords = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const [tiltStyle, setTiltStyle] = useState({});

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      mouseCoords.current.targetX = (e.clientX / innerWidth - 0.5) * 2;
      mouseCoords.current.targetY = (e.clientY / innerHeight - 0.5) * 2;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Smooth lerp loop for physical tilt
    let animId: number;
    const updateTilt = () => {
      mouseCoords.current.x += (mouseCoords.current.targetX - mouseCoords.current.x) * 0.08;
      mouseCoords.current.y += (mouseCoords.current.targetY - mouseCoords.current.y) * 0.08;

      const rotX = -mouseCoords.current.y * 14;
      const rotY = mouseCoords.current.x * 14;
      const lightX = 50 + mouseCoords.current.x * 30;
      const lightY = 50 + mouseCoords.current.y * 30;

      setTiltStyle({
        transform: `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`,
        '--light-x': `${lightX}%`,
        '--light-y': `${lightY}%`,
      } as React.CSSProperties);

      animId = requestAnimationFrame(updateTilt);
    };

    updateTilt();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  // Canvas electromagnetic wave and particle simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particle system
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      hue: number;
    }

    const particles: Particle[] = [];
    const count = 48;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.8 + 0.6,
        alpha: Math.random() * 0.4 + 0.1,
        hue: Math.random() > 0.8 ? 84 : 0, // Green accent or white
      });
    }

    // Expanding concentric shockwaves
    interface Wave {
      radius: number;
      maxRadius: number;
      alpha: number;
      speed: number;
    }

    const waves: Wave[] = [];

    // Periodic ambient pulse
    let lastWaveTime = 0;

    let renderRaf: number;
    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      // Ambient center glow
      const cx = width / 2 + mouseCoords.current.x * 20;
      const cy = height * 0.46 + mouseCoords.current.y * 20;

      const gradient = ctx.createRadialGradient(cx, cy, 20, cx, cy, 480);
      gradient.addColorStop(0, 'rgba(191, 255, 0, 0.05)');
      gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.015)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Trigger automatic subtle pulse every 3.2s
      if (time - lastWaveTime > 3200) {
        waves.push({
          radius: 40,
          maxRadius: Math.min(width, height) * 0.55,
          alpha: 0.35,
          speed: 1.8,
        });
        lastWaveTime = time;
      }

      // Draw and update shockwaves
      for (let i = waves.length - 1; i >= 0; i--) {
        const w = waves[i];
        w.radius += w.speed;
        w.alpha = Math.max(0, (1 - w.radius / w.maxRadius) * 0.4);

        if (w.radius >= w.maxRadius) {
          waves.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, w.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(191, 255, 0, ${w.alpha})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Secondary faint echo ring
        if (w.radius > 60) {
          ctx.beginPath();
          ctx.arc(cx, cy, w.radius - 24, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 255, ${w.alpha * 0.3})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
        ctx.restore();
      }

      // Draw and update micro particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx + mouseCoords.current.x * 0.1;
        p.y += p.vy + mouseCoords.current.y * 0.1;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle =
          p.hue === 84
            ? `rgba(191, 255, 0, ${p.alpha * 0.8})`
            : `rgba(255, 255, 255, ${p.alpha})`;
        ctx.fill();
      }

      renderRaf = requestAnimationFrame(render);
    };

    renderRaf = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(renderRaf);
    };
  }, []);

  const handleTagTap = () => {
    sound.playNfcPulse();
    setHasTapped(true);
    setTapCount((prev) => prev + 1);
  };

  const handleExplore = () => {
    sound.playTap();
    sound.playCinematicZoom();
    if (onExplore) {
      onExplore();
      return;
    }
    const el = document.getElementById('portal');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen w-full flex flex-col items-center justify-between pt-28 pb-12 sm:pt-32 sm:pb-16 px-4 sm:px-6 overflow-hidden bg-[#030305] select-none"
    >
      {/* Background Interactive Pulse Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-0"
      />

      {/* Top subtle hardware status pill */}
      <div className="relative z-10 flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-zinc-950/70 backdrop-blur-md text-zinc-400 text-[11px] font-mono tracking-widest uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-[#BFFF00] animate-pulse" />
        <span>PHYSICAL OS • NFC & QR INFRASTRUCTURE</span>
      </div>

      {/* Centerpiece: The RIVO Physical Touchpoint Tag */}
      <div className="relative z-10 flex flex-col items-center my-auto w-full max-w-4xl text-center">
        {/* Interactive Physical NFC Puck */}
        <div
          onClick={handleTagTap}
          style={tiltStyle}
          data-cursor="TAP"
          className="relative group cursor-pointer w-32 h-32 sm:w-40 sm:h-40 rounded-full my-6 sm:my-8 transition-shadow duration-300 flex items-center justify-center will-change-transform"
        >
          {/* Ambient Rim Lighting */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 via-zinc-800/40 to-transparent p-[1.5px] shadow-[0_0_50px_rgba(0,0,0,0.9)]">
            {/* Dark brushed titanium body */}
            <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#0a0a0d] via-[#141418] to-[#1e1e24] flex items-center justify-center relative overflow-hidden">
              
              {/* Dynamic specular light reflection tracking mouse */}
              <div
                className="absolute inset-0 opacity-40 pointer-events-none transition-opacity duration-300 group-hover:opacity-75"
                style={{
                  background:
                    'radial-gradient(circle 80px at var(--light-x, 50%) var(--light-y, 50%), rgba(255,255,255,0.22), transparent)',
                }}
              />

              {/* Concentric laser-etched micro NFC Antenna coil rings */}
              <svg
                className="w-24 h-24 sm:w-28 sm:h-28 text-zinc-600/40 group-hover:text-[#BFFF00]/40 transition-colors duration-500"
                viewBox="0 0 100 100"
                fill="none"
              >
                <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="0.7" strokeDasharray="3 2" />
                <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="0.9" />
                <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="0.8" strokeDasharray="4 2" />
                <circle cx="50" cy="50" r="22" stroke="currentColor" strokeWidth="1" />
                <circle cx="50" cy="50" r="14" stroke="currentColor" strokeWidth="0.9" />
              </svg>

              {/* Core Active Signal Transceiver */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    hasTapped
                      ? 'bg-[#BFFF00] text-black shadow-[0_0_28px_rgba(191,255,0,0.9)] scale-110'
                      : 'bg-zinc-900 border border-zinc-700/80 text-[#BFFF00] group-hover:scale-105 group-hover:border-[#BFFF00]/70'
                  }`}
                >
                  <Radio size={15} className={hasTapped ? 'animate-spin' : 'animate-pulse'} />
                </div>
                <span className="mt-1 text-[8px] font-mono tracking-widest text-zinc-400 group-hover:text-white transition-colors">
                  {hasTapped ? `TAP #${tapCount}` : 'TAP ME'}
                </span>
              </div>
            </div>
          </div>

          {/* Pulse ring animation around the tag */}
          <div className="absolute -inset-3 rounded-full border border-[#BFFF00]/30 animate-ping pointer-events-none opacity-40 [animation-duration:3s]" />
          <div className="absolute -inset-6 rounded-full border border-white/10 pointer-events-none" />
        </div>

        {/* Monolithic Cinematic Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-[-0.04em] text-white uppercase leading-[0.95] max-w-5xl font-['Space_Grotesk']">
          EVERYTHING STARTS <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-zinc-500">
            WITH A TOUCH.
          </span>
        </h1>

        {/* Crisp Subtitle */}
        <p className="mt-6 sm:mt-8 text-base sm:text-xl text-zinc-400 max-w-2xl font-normal leading-relaxed">
          Turn every physical touchpoint into a digital experience.
        </p>

        {/* Single Primary Magnetic CTA */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={handleExplore}
            data-cursor="EXPLORE"
            className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white text-black font-bold text-sm tracking-wide uppercase transition-all duration-300 hover:bg-[#BFFF00] hover:shadow-[0_0_35px_rgba(191,255,0,0.6)] active:scale-95"
          >
            <span>EXPLORE RIVO</span>
            <div className="w-5 h-5 rounded-full bg-black/10 flex items-center justify-center transition-transform group-hover:translate-y-0.5">
              <ArrowDown size={13} className="text-black" />
            </div>
          </button>
        </div>
      </div>

      {/* Bottom Scroll / Dive Indicator */}
      <div
        onClick={handleExplore}
        className="relative z-10 flex flex-col items-center gap-2 text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors duration-300"
        data-cursor="SCROLL"
      >
        <span className="text-[10px] font-mono tracking-widest uppercase">
          SCROLL TO ENTER PORTAL
        </span>
        <div className="w-5 h-8 rounded-full border border-zinc-700 flex items-start justify-center p-1">
          <span className="w-1 h-2 rounded-full bg-white animate-bounce" />
        </div>
      </div>
    </section>
  );
}
