// ============================================================================
// SERVICE CALL SOUND ENGINE FOR RIVO DASHBOARD
// Ultra-reliable Web Audio API synthesis (0 network latency, 100% offline capable)
// ============================================================================

export type ServiceSoundId =
  | 'reception_bell'
  | 'kitchen_ding'
  | 'gentle_chime'
  | 'zen_gong'
  | 'marimba_pop'
  | 'radar_alert';

export interface ServiceSoundOption {
  id: ServiceSoundId;
  name: string;
  tagline: string;
  category: string;
  iconName: string;
}

export const SERVICE_SOUND_OPTIONS: ServiceSoundOption[] = [
  {
    id: 'reception_bell',
    name: 'Campanello Reception',
    tagline: 'Doppio tono classico hotel & banco cassa (Do-Sol)',
    category: 'Classico',
    iconName: 'Bell',
  },
  {
    id: 'kitchen_ding',
    name: 'Campana Inox Cucina',
    tagline: 'Squillante tocco metallico da pass chef ad alta udibilità',
    category: 'Ristorazione',
    iconName: 'UtensilsCrossed',
  },
  {
    id: 'gentle_chime',
    name: 'Carillon Armonico',
    tagline: 'Arpeggio ascendente a 3 note, morbido e rilassante',
    category: 'Elegante',
    iconName: 'Music',
  },
  {
    id: 'zen_gong',
    name: 'Gong Zen 432Hz',
    tagline: 'Tono caldo e profondo con riverbero per wine bar e lounge',
    category: 'Fine Dining',
    iconName: 'Sparkles',
  },
  {
    id: 'marimba_pop',
    name: 'Marimba Digitale',
    tagline: 'Doppio tocco ritmato e moderno stile percussione in legno',
    category: 'Moderno',
    iconName: 'Radio',
  },
  {
    id: 'radar_alert',
    name: 'Radar Alta Udibilità',
    tagline: 'Doppio impulso deciso per locali affollati o terrazze estive',
    category: 'Locali Rumorosi',
    iconName: 'Volume2',
  },
];

function getAudioContext(): AudioContext | null {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    return new AudioCtx();
  } catch (e) {
    console.warn('AudioContext not supported:', e);
    return null;
  }
}

export function playServiceSound(soundId: ServiceSoundId = 'reception_bell', volumeMultiplier: number = 1) {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const t = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(Math.min(1, Math.max(0.1, volumeMultiplier)), t);
    masterGain.connect(ctx.destination);

    switch (soundId) {
      case 'reception_bell': {
        // High-clarity 2-tone hotel desk bell (D5 -> A5)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, t); // D5
        gain1.gain.setValueAtTime(0.4, t);
        gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc1.connect(gain1);
        gain1.connect(masterGain);
        osc1.start(t);
        osc1.stop(t + 0.35);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, t + 0.14); // A5
        gain2.gain.setValueAtTime(0.001, t);
        gain2.gain.setValueAtTime(0.45, t + 0.14);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
        osc2.connect(gain2);
        gain2.connect(masterGain);
        osc2.start(t + 0.14);
        osc2.stop(t + 0.7);
        break;
      }

      case 'kitchen_ding': {
        // Bright metallic kitchen pass bell (1046Hz C6 with metallic harmonics)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1046.5, t); // C6
        osc.frequency.exponentialRampToValueAtTime(1030, t + 0.8);
        gain.gain.setValueAtTime(0.55, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(t);
        osc.stop(t + 0.85);

        // Harmonic overtone for metallic ring
        const oscHarm = ctx.createOscillator();
        const gainHarm = ctx.createGain();
        oscHarm.type = 'triangle';
        oscHarm.frequency.setValueAtTime(2093, t); // C7 harmonic
        gainHarm.gain.setValueAtTime(0.2, t);
        gainHarm.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        oscHarm.connect(gainHarm);
        gainHarm.connect(masterGain);
        oscHarm.start(t);
        oscHarm.stop(t + 0.4);
        break;
      }

      case 'gentle_chime': {
        // Ascending 3-note arpeggio (C5 -> E5 -> G5)
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = t + i * 0.11;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.001, t);
          gain.gain.setValueAtTime(0.35, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(start);
          osc.stop(start + 0.45);
        });
        break;
      }

      case 'zen_gong': {
        // Deep 432Hz warm harmonic gong with long decay
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(432, t);
        osc.frequency.exponentialRampToValueAtTime(428, t + 1.2);
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(t);
        osc.stop(t + 1.2);

        // Sub harmonic warmth
        const sub = ctx.createOscillator();
        const subGain = ctx.createGain();
        sub.type = 'triangle';
        sub.frequency.setValueAtTime(216, t);
        subGain.gain.setValueAtTime(0.25, t);
        subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
        sub.connect(subGain);
        subGain.connect(masterGain);
        sub.start(t);
        sub.stop(t + 0.9);
        break;
      }

      case 'marimba_pop': {
        // 2 rhythmic wooden marimba pops
        const pops = [
          { freq: 698.46, time: t },
          { freq: 932.33, time: t + 0.13 },
        ];
        pops.forEach((p) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(p.freq, p.time);
          gain.gain.setValueAtTime(0.001, t);
          gain.gain.setValueAtTime(0.5, p.time);
          gain.gain.exponentialRampToValueAtTime(0.001, p.time + 0.25);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(p.time);
          osc.stop(p.time + 0.25);
        });
        break;
      }

      case 'radar_alert': {
        // High-pitch dual radar pulse for noisy environments
        const pulses = [t, t + 0.16];
        pulses.forEach((pulseTime) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(987.77, pulseTime); // B5
          osc.frequency.exponentialRampToValueAtTime(1318.5, pulseTime + 0.1); // E6
          gain.gain.setValueAtTime(0.001, t);
          gain.gain.setValueAtTime(0.5, pulseTime);
          gain.gain.exponentialRampToValueAtTime(0.001, pulseTime + 0.15);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(pulseTime);
          osc.stop(pulseTime + 0.15);
        });
        break;
      }

      default: {
        // Fallback default
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(masterGain);
        osc.frequency.setValueAtTime(587.33, t);
        osc.frequency.setValueAtTime(880, t + 0.15);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        osc.start(t);
        osc.stop(t + 0.6);
        break;
      }
    }
  } catch (err) {
    console.warn('Error playing synthesized service sound:', err);
  }
}
