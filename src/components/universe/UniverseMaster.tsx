'use client';

import { useState, useEffect } from 'react';
import UniverseScene, { WorldId } from './UniverseScene';
import UniverseHUD from './UniverseHUD';
import IntroSequence from './IntroSequence';
import UniverseAccessibleGrid from './UniverseAccessibleGrid';
import RestaurantWorld from './RestaurantWorld';
import RetailWorld from './RetailWorld';
import AIWorld from './AIWorld';
import MapsWorld from './MapsWorld';
import StaffWorld from './StaffWorld';
import DataWorld from './DataWorld';
import { universeAudio } from './UniverseAudio';

export default function UniverseMaster() {
  const [activeWorld, setActiveWorld] = useState<WorldId | null>(null);
  const [isIntroComplete, setIsIntroComplete] = useState<boolean>(false);
  const [isAccessibleView, setIsAccessibleView] = useState<boolean>(false);

  // Keyboard navigation: ESC to close active world or return to nucleus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeWorld) {
          universeAudio.playClick();
          setActiveWorld(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeWorld]);

  const handleSelectWorld = (world: WorldId) => {
    setActiveWorld(world);
  };

  const handleReturnToNucleus = () => {
    setActiveWorld(null);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#020204] text-white selection:bg-[#BFFF00] selection:text-black">
      
      {/* 1. Opening Skippable Geometric Assembly Sequence */}
      {!isIntroComplete && (
        <IntroSequence onComplete={() => setIsIntroComplete(true)} />
      )}

      {/* 2. Persistent Command HUD */}
      <UniverseHUD
        activeWorld={activeWorld}
        onSelectWorld={handleSelectWorld}
        onReturnToNucleus={handleReturnToNucleus}
        onToggleAccessibleView={() => setIsAccessibleView(!isAccessibleView)}
        isAccessibleView={isAccessibleView}
      />

      {/* 3. Main Stage: 3D Universe vs Accessible 2D Grid */}
      {!isAccessibleView ? (
        <div className="absolute inset-0 z-0">
          <UniverseScene
            activeWorld={activeWorld}
            onSelectWorld={handleSelectWorld}
            onReturnToNucleus={handleReturnToNucleus}
            isIntroComplete={isIntroComplete}
          />
        </div>
      ) : (
        <div className="relative z-10 w-full h-full overflow-y-auto pt-16">
          <UniverseAccessibleGrid
            activeWorld={activeWorld}
            onSelectWorld={handleSelectWorld}
          />
        </div>
      )}

      {/* 4. Active World Interactive Simulation Modal */}
      {activeWorld && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl my-auto">
            {activeWorld === 'restaurant' && (
              <RestaurantWorld onClose={() => setActiveWorld(null)} />
            )}
            {activeWorld === 'retail' && (
              <RetailWorld onClose={() => setActiveWorld(null)} />
            )}
            {activeWorld === 'ai' && (
              <AIWorld onClose={() => setActiveWorld(null)} />
            )}
            {activeWorld === 'maps' && (
              <MapsWorld onClose={() => setActiveWorld(null)} />
            )}
            {activeWorld === 'staff' && (
              <StaffWorld onClose={() => setActiveWorld(null)} />
            )}
            {activeWorld === 'data' && (
              <DataWorld onClose={() => setActiveWorld(null)} />
            )}
          </div>
        </div>
      )}

    </div>
  );
}
