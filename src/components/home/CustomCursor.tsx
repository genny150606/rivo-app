'use client';

import { useEffect, useRef, useState } from 'react';

export default function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLDivElement | null>(null);

  const mousePos = useRef({ x: -100, y: -100 });
  const dotPos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    // Only enable custom cursor on fine pointers (desktop mouse)
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    if (!isFinePointer) return;

    setEnabled(true);

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);

      // Inspect target element for cursor cues
      const target = e.target as HTMLElement | null;
      if (target) {
        const interactiveEl = target.closest('[data-cursor], button, a, [role="button"], input, select');
        if (interactiveEl) {
          setIsHovering(true);
          const cursorAttr = interactiveEl.getAttribute('data-cursor');
          setLabel(cursorAttr || null);
        } else {
          setIsHovering(false);
          setLabel(null);
        }
      }
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);
    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    // Smooth RAF physics loop with damping lerp
    const render = () => {
      // Dot follows briskly
      dotPos.current.x += (mousePos.current.x - dotPos.current.x) * 0.35;
      dotPos.current.y += (mousePos.current.y - dotPos.current.y) * 0.35;

      // Ring trails with soft elastic inertia
      ringPos.current.x += (mousePos.current.x - ringPos.current.x) * 0.15;
      ringPos.current.y += (mousePos.current.y - ringPos.current.y) * 0.15;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${dotPos.current.x}px, ${dotPos.current.y}px, 0) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0) translate(-50%, -50%)`;
      }
      if (labelRef.current) {
        labelRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0) translate(-50%, -50%)`;
      }

      rafId.current = requestAnimationFrame(render);
    };

    rafId.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [isVisible]);

  if (!enabled) return null;

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-[99999] transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden="true"
    >
      {/* Precision Core Dot */}
      <div
        ref={dotRef}
        className={`absolute top-0 left-0 w-2 h-2 rounded-full pointer-events-none transition-transform duration-100 ease-out ${
          isClicking
            ? 'scale-150 bg-white'
            : isHovering
            ? 'scale-75 bg-[#BFFF00]'
            : 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]'
        }`}
      />

      {/* Trailing Fluid Inertia Ring */}
      <div
        ref={ringRef}
        className={`absolute top-0 left-0 rounded-full pointer-events-none border transition-all duration-300 ease-out flex items-center justify-center ${
          label
            ? 'w-16 h-16 border-[#BFFF00]/60 bg-[#BFFF00]/10 shadow-[0_0_24px_rgba(191,255,0,0.25)]'
            : isHovering
            ? 'w-11 h-11 border-white/50 bg-white/5 shadow-[0_0_16px_rgba(255,255,255,0.15)]'
            : isClicking
            ? 'w-7 h-7 border-[#BFFF00] scale-90'
            : 'w-7 h-7 border-white/20'
        }`}
      />

      {/* Dynamic Contextual Micro-Label */}
      {label && (
        <div
          ref={labelRef}
          className="absolute top-0 left-0 pointer-events-none flex items-center justify-center"
        >
          <span className="text-[9px] tracking-widest font-mono font-bold text-white uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] select-none">
            {label}
          </span>
        </div>
      )}
    </div>
  );
}
