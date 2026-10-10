'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'rivo_simple_mode';
const EVENT_NAME = 'rivo_simple_mode_change';

/**
 * Checks if Simple Mode is currently active in localStorage or URL query string
 */
export function getSimpleModeInitial(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('simple') === 'true' || urlParams.get('simple') === '1') {
      return true;
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'true';
  } catch {
    return false;
  }
}

/**
 * Sets Simple Mode and broadcasts the event across the application
 */
export function setSimpleMode(enabled: boolean): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
    
    // Also toggle a class on <html> or <body> for global CSS styling if needed
    if (enabled) {
      document.documentElement.classList.add('simple-mode');
    } else {
      document.documentElement.classList.remove('simple-mode');
    }

    // Dispatch custom event for real-time reactivity in all open components
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { enabled } }));
  } catch (err) {
    console.warn('Failed to persist simple mode:', err);
  }
}

export type UseSimpleModeReturn = [boolean, (val?: boolean) => void] & {
  isSimple: boolean;
  setSimple: (val?: boolean) => void;
  toggleSimple: (val?: boolean) => void;
};

/**
 * React hook to read and toggle Simple Mode with real-time cross-component sync
 */
export function useSimpleMode(): UseSimpleModeReturn {
  const [isSimple, setIsSimple] = useState<boolean>(false);

  useEffect(() => {
    // Initial check on mount
    const initial = getSimpleModeInitial();
    setIsSimple(initial);
    if (initial) {
      document.documentElement.classList.add('simple-mode');
    }

    const handleModeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ enabled: boolean }>;
      if (customEvent.detail !== undefined && typeof customEvent.detail.enabled === 'boolean') {
        setIsSimple(customEvent.detail.enabled);
      } else {
        setIsSimple(getSimpleModeInitial());
      }
    };

    window.addEventListener(EVENT_NAME, handleModeChange);
    window.addEventListener('storage', handleModeChange);

    return () => {
      window.removeEventListener(EVENT_NAME, handleModeChange);
      window.removeEventListener('storage', handleModeChange);
    };
  }, []);

  const toggle = useCallback((forcedValue?: boolean) => {
    const next = forcedValue !== undefined ? forcedValue : !isSimple;
    setIsSimple(next);
    setSimpleMode(next);
  }, [isSimple]);

  const result = [isSimple, toggle] as UseSimpleModeReturn;
  result.isSimple = isSimple;
  result.setSimple = toggle;
  result.toggleSimple = toggle;

  return result;
}
