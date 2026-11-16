'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Mic, 
  MicOff, 
  X, 
  Minimize2, 
  Maximize2, 
  Bot, 
  User, 
  PackagePlus, 
  Boxes, 
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actionResult?: {
    type: string;
    productName: string;
    brand?: string;
    size?: string;
    color?: string;
    quantityAdded?: number;
    newStock?: number;
    productId?: string;
  };
}

export default function RetailAICopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Ciao! Sono il tuo **Assistente AI RIVO per il Retail**.\n\nInvece di compilare form manuali, puoi scrivermi o dettarmi direttamente a voce cosa vuoi fare!`,
      timestamp: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Voice recognition using browser Web Speech API
  const toggleListening = () => {
    if (listening) {
      setListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessages(prev => [
        ...prev,
        {
          id: `voice-unsupported-${Date.now()}`,
          role: 'assistant',
          content: 'La dettatura vocale non è supportata su questo browser. Puoi scrivere il comando direttamente qui sotto.',
          timestamp: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'it-IT';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
        setListening(false);
      };

      recognition.onerror = () => {
        setListening(false);
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognition.start();
    } catch (e) {
      console.warn('Speech recognition error:', e);
      setListening(false);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: 'u-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/retail-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore elaborazione');

      const botMsg: Message = {
        id: 'b-' + Date.now(),
        role: 'assistant',
        content: data.reply || 'Operazione completata.',
        timestamp: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
        actionResult: data.actionExecuted,
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: 'err-' + Date.now(),
        role: 'assistant',
        content: `Si è verificato un errore: ${err.message}`,
        timestamp: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Launcher Button (cleared above mobile bottom dock) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Apri Assistente Magazzino RIVO"
          className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 lg:bottom-6 lg:right-6 z-40 flex min-h-[44px] items-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] px-4 py-2.5 text-xs font-bold text-[var(--rivo-volt-ink)] shadow-lg transition-[background-color,transform] duration-[180ms] active:scale-[0.98] cursor-pointer"
        >
          <Bot className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          <span>Copilot Magazzino</span>
        </button>
      )}

      {/* Floating Copilot Modal / Drawer */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="RIVO Retail Copilot"
          className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 lg:bottom-6 lg:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] h-[560px] max-h-[78dvh] bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 py-3.5 bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#09090B] border border-[#22242A] flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-[#BFFF00]" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-[var(--text-primary)] leading-none">
                  RIVO Retail Copilot
                </h3>
                <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] mt-1">
                  Gestione vocale &amp; testuale stock
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Chiudi Copilot Magazzino"
              className="min-h-[38px] min-w-[38px] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs bg-[var(--bg-canvas)]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-lg bg-[#09090B] border border-[#22242A] flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-[#BFFF00]" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-xl p-3 leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-[var(--rivo-volt)] text-[var(--rivo-volt-ink)] font-medium ml-auto'
                      : 'bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)]'
                  }`}
                >
                  <div>{msg.content}</div>

                  {/* Interactive Action Card if product was added */}
                  {msg.actionResult && (
                    <div className="mt-3 p-2.5 bg-[var(--bg-elevated)] border border-[var(--accent-operational-border)] rounded-xl space-y-2 text-[11px]">
                      <div className="flex items-center gap-1.5 text-[var(--accent-operational-text)] font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Carico Registrato con Successo</span>
                      </div>
                      <div className="space-y-0.5 text-[var(--text-secondary)]">
                        <div>
                          Articolo: <strong className="text-[var(--text-primary)]">{msg.actionResult.productName}</strong>
                        </div>
                        {msg.actionResult.size && (
                          <div>
                            Taglia: <strong className="text-[var(--text-primary)]">{msg.actionResult.size}</strong>
                          </div>
                        )}
                        <div>
                          Aggiunti:{' '}
                          <strong className="font-mono text-[var(--rivo-volt-text)]">
                            +{msg.actionResult.quantityAdded} pz
                          </strong>
                        </div>
                        {msg.actionResult.newStock !== undefined && (
                          <div>
                            Nuova Giacenza:{' '}
                            <strong className="font-mono text-[var(--text-primary)]">
                              {msg.actionResult.newStock} pz
                            </strong>
                          </div>
                        )}
                      </div>
                      <Link
                        href="/dashboard/inventory"
                        className="inline-flex items-center gap-1 text-[11px] text-[var(--rivo-volt-text)] hover:underline pt-1 font-semibold"
                      >
                        <span>Visualizza a Magazzino</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  )}

                  <div
                    className={`font-mono text-[9px] mt-1.5 ${
                      msg.role === 'user' ? 'text-[#09090B]/70 text-right' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 items-center text-[var(--text-secondary)] text-xs">
                <div className="w-6 h-6 rounded-lg bg-[#09090B] border border-[#22242A] flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-[#BFFF00] animate-pulse" />
                </div>
                <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 flex items-center gap-1.5">
                  <span className="text-[11px] font-mono">Aggiornamento catalogo…</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="px-3 py-2 bg-[var(--bg-elevated)] border-t border-[var(--border-subtle)] flex gap-1.5 overflow-x-auto text-[11px]">
            <button
              type="button"
              onClick={() => handleSend('inserisci 15 Air Max 95 di taglia 43')}
              className="whitespace-nowrap px-2.5 py-1.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg border border-[var(--border-subtle)] transition-colors cursor-pointer"
            >
              +15 Air Max 95 (Tg. 43)
            </button>
            <button
              type="button"
              onClick={() => handleSend('aggiungi 8 mocassini Borrelli taglia 42 a 130 euro')}
              className="whitespace-nowrap px-2.5 py-1.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg border border-[var(--border-subtle)] transition-colors cursor-pointer"
            >
              +8 Mocassini Borrelli (Tg. 42)
            </button>
            <button
              type="button"
              onClick={() => handleSend('quali prodotti sono sotto scorta?')}
              className="whitespace-nowrap px-2.5 py-1.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg border border-[var(--border-subtle)] transition-colors cursor-pointer"
            >
              Prodotti sotto scorta
            </button>
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] flex items-center gap-2">
            <button
              type="button"
              onClick={toggleListening}
              aria-label={listening ? 'Ferma dettatura vocale' : 'Attiva dettatura vocale'}
              className={`min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg border transition-colors cursor-pointer ${
                listening
                  ? 'bg-[#B91C1C] border-transparent text-white animate-pulse'
                  : 'bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
              }`}
              title={listening ? 'Ascolto in corso... tocca per fermare' : 'Dettatura vocale'}
            >
              {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              aria-label="Comando vocale o testuale per il magazzino"
              placeholder={listening ? 'Parla pure, sto ascoltando…' : 'Es: +15 Air Max 95 taglia 43…'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              disabled={loading}
              className="flex-1 min-h-[40px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus:border-[var(--focus-ring)]"
            />

            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              aria-label="Invia comando"
              className="min-h-[40px] min-w-[40px] flex items-center justify-center bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] disabled:opacity-40 text-[var(--rivo-volt-ink)] rounded-lg transition-colors font-bold cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
