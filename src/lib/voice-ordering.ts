// ============================================================================
// RIVO AI VOICE ORDERING ENGINE
// Speech recognition with fuzzy dish matching & kitchen notes extraction
// ============================================================================

import { CanvaDish } from './canva-menu';

export interface VoiceOrderItem {
  dish: CanvaDish;
  quantity: number;
}

export interface VoiceOrderResult {
  transcript: string;
  matchedItems: VoiceOrderItem[];
  extractedNotes: string;
}

// Italian number word converter
const NUMBER_WORDS: Record<string, number> = {
  un: 1,
  uno: 1,
  una: 1,
  'un\'': 1,
  due: 2,
  tre: 3,
  quattro: 4,
  cinque: 5,
  sei: 6,
  sette: 7,
  otto: 8,
  nove: 9,
  dieci: 10,
};

function extractQuantity(textBefore: string): number {
  const words = textBefore.trim().split(/\s+/);
  const lastWord = words[words.length - 1]?.toLowerCase();
  if (lastWord && NUMBER_WORDS[lastWord]) {
    return NUMBER_WORDS[lastWord];
  }
  const digitMatch = lastWord?.match(/\d+/);
  if (digitMatch) {
    return parseInt(digitMatch[0], 10);
  }
  return 1;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

export function matchSpokenDishes(transcript: string, availableDishes: CanvaDish[]): VoiceOrderResult {
  const lowerTranscript = transcript.toLowerCase();
  const matchedMap = new Map<string, { dish: CanvaDish; quantity: number }>();

  // Extract special notes like "senza...", "ben cott...", "poco..."
  const notesMatches = lowerTranscript.match(/\b(senza\s+[\w\s,]+|ben\s+cotta?|al\s+sangue|media\s+cottura|poco\s+[\w\s]+|senza\s+ghiaccio|senza\s+cipolla|senza\s+glutine)\b/gi);
  const extractedNotes = notesMatches ? notesMatches.join(', ') : '';

  for (const dish of availableDishes) {
    const dishTokens = dish.name
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2);

    if (dishTokens.length === 0) continue;

    // Check how many tokens are present in transcript
    let matchedTokens = 0;
    for (const token of dishTokens) {
      if (lowerTranscript.includes(token)) {
        matchedTokens++;
      }
    }

    const matchRatio = matchedTokens / dishTokens.length;

    // Direct substring match or high token match
    const directMatch = lowerTranscript.includes(dish.name.toLowerCase());
    if (directMatch || matchRatio >= 0.6) {
      // Find where in transcript it occurred to detect preceding quantity
      const searchIndex = lowerTranscript.indexOf(dishTokens[0]);
      let qty = 1;
      if (searchIndex > 0) {
        const textBefore = lowerTranscript.substring(Math.max(0, searchIndex - 20), searchIndex);
        qty = extractQuantity(textBefore);
      }

      matchedMap.set(dish.id, {
        dish,
        quantity: qty,
      });
    }
  }

  return {
    transcript,
    matchedItems: Array.from(matchedMap.values()),
    extractedNotes,
  };
}

export class VoiceOrderRecognizer {
  private recognition: any = null;
  private isListening = false;

  constructor(
    private onResult: (transcript: string, isFinal: boolean) => void,
    private onError: (error: string) => void,
    private onEnd: () => void
  ) {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'it-IT';

        this.recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          if (finalTranscript) {
            this.onResult(finalTranscript, true);
          } else if (interimTranscript) {
            this.onResult(interimTranscript, false);
          }
        };

        this.recognition.onerror = (event: any) => {
          this.isListening = false;
          this.onError(event.error || 'Errore riconoscimento vocale');
        };

        this.recognition.onend = () => {
          this.isListening = false;
          this.onEnd();
        };
      }
    }
  }

  start(): boolean {
    if (!this.recognition) return false;
    if (this.isListening) return true;

    try {
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (err) {
      console.warn('Speech recognition start failed:', err);
      return false;
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (err) {
        console.warn('Speech recognition stop error:', err);
      }
      this.isListening = false;
    }
  }
}
