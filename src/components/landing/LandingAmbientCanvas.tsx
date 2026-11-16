'use client';

/**
 * Architectural background grid for the public RIVO landing experience.
 * Replaces continuous requestAnimationFrame particle loops with zero-CPU CSS geometry.
 */
export default function LandingAmbientCanvas() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
    >
      {/* Precision 48px architectural coordinate grid */}
      <div
        className="absolute inset-0 bg-rivo-grid opacity-[0.38]"
        style={{
          maskImage:
            'radial-gradient(ellipse 85% 65% at 50% 12%, rgba(0,0,0,1) 45%, rgba(0,0,0,0.18) 80%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 85% 65% at 50% 12%, rgba(0,0,0,1) 45%, rgba(0,0,0,0.18) 80%, transparent 100%)',
        }}
      />

      {/* Crisp top horizon hairline */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#BFFF00]/35 to-transparent" />
    </div>
  );
}
