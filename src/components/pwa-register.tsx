'use client';

import { useEffect } from 'react';

/**
 * Componente per la registrazione sicura del Service Worker di RIVO.
 * - Registra '/sw.js' con scope '/' dopo l'evento 'load' del browser.
 * - Gestione resiliente per SSR, iframe protetti, localhost e browser senza supporto Service Worker.
 */
export function PwaRegister() {
  useEffect(() => {
    // Controllo sicurezza: ambiente client e supporto Service Worker
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const registerWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        if (process.env.NODE_ENV === 'development') {
          console.log('[PWA] Service Worker registrato con successo. Scope:', registration.scope);
        }

        // Rilevamento aggiornamenti disponibili
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.addEventListener('statechange', () => {
            if (
              installingWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              if (process.env.NODE_ENV === 'development') {
                console.log('[PWA] Nuovo Service Worker installato e pronto all\'attivazione.');
              }
            }
          });
        });
      } catch (error) {
        // Nessun blocco UI su localhost o contesti non sicuri / dev tools
        if (process.env.NODE_ENV === 'development') {
          console.warn('[PWA] Registrazione Service Worker fallita:', error);
        }
      }
    };

    // Assicura la registrazione solo dopo il caricamento completo per preservare le prestazioni della pagina
    if (document.readyState === 'complete') {
      registerWorker();
    } else {
      window.addEventListener('load', registerWorker);
      return () => {
        window.removeEventListener('load', registerWorker);
      };
    }
  }, []);

  return null;
}

export default PwaRegister;
