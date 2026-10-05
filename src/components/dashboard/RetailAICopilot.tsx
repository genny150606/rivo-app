'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
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
      content: `👋 Ciao! Sono il tuo **Assistente AI RIVO per il Retail**.\n\nInvece di compilare form manuali, puoi scrivermi o dettarmi direttamente a voce cosa vuoi fare!`,
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
      alert('La dettatura vocale non è supportata dal tuo browser. Puoi comunque scrivere normalmente!');
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
        content: `❌ Si è verificato un errore: ${err.message}`,
        timestamp: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-lime-400 via-emerald-400 to-teal-400 hover:from-lime-300 hover:to-teal-300 text-black font-bold text-xs rounded-full shadow-2xl shadow-lime-400/30 hover:scale-105 active:scale-95 transition-all duration-200 group"
        >
          <div className="relative">
            <Sparkles className="w-4 h-4 text-black animate-spin" style={{ animationDuration: '6s' }} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-600 rounded-full animate-ping" />
          </div>
          <span>Assistente Magazzino AI</span>
        </button>
      )}

      {/* Floating Copilot Modal / Drawer */}
      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 w-[95vw] sm:w-[420px] h-[580px] max-h-[90vh] bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-zinc-900 to-black border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-lime-400/20 border border-lime-400/40 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-lime-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white leading-none">RIVO Retail Copilot</h3>
                <p className="text-[10px] text-zinc-400 mt-0.5">Gestione vocale & testuale del magazzino</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-lg bg-lime-400/10 border border-lime-400/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-lime-400" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3 leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-lime-400 text-black font-medium ml-auto shadow-md'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-200'
                  }`}
                >
                  <div>{msg.content}</div>

                  {/* Interactive Action Card if product was added */}
                  {msg.actionResult && (
                    <div className="mt-3 p-2.5 bg-black/60 border border-lime-500/30 rounded-xl space-y-2 text-[11px]">
                      <div className="flex items-center gap-1.5 text-lime-400 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Carico Registrato con Successo</span>
                      </div>
                      <div className="space-y-0.5 text-zinc-300">
                        <div>Articolo: <strong>{msg.actionResult.productName}</strong></div>
                        {msg.actionResult.size && <div>Taglia: <strong>{msg.actionResult.size}</strong></div>}
                        <div>Aggiunti: <strong className="text-lime-400">+{msg.actionResult.quantityAdded} pz</strong></div>
                        {msg.actionResult.newStock !== undefined && (
                          <div>Nuova Giacenza: <strong>{msg.actionResult.newStock} pz</strong></div>
                        )}
                      </div>
                      <Link
                        href="/dashboard/inventory"
                        className="inline-flex items-center gap-1 text-[10px] text-lime-400 hover:underline pt-1 font-semibold"
                      >
                        <span>Visualizza a Magazzino</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  )}

                  <div className={`text-[9px] mt-1.5 ${msg.role === 'user' ? 'text-black/60 text-right' : 'text-zinc-500'}`}>
                    {msg.timestamp}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-zinc-300" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 items-center text-zinc-400 text-xs">
                <div className="w-6 h-6 rounded-lg bg-lime-400/10 border border-lime-400/30 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-lime-400 animate-pulse" />
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-3 py-2 text-zinc-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-lime-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-lime-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-lime-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] ml-1">Sto aggiornando il catalogo...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="px-3 py-2 bg-zinc-900/50 border-t border-zinc-800/80 flex gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
            <button
              onClick={() => handleSend('inserisci 15 Air Max 95 di taglia 43')}
              className="whitespace-nowrap px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-full border border-zinc-700 transition-colors"
            >
              +15 Air Max 95 (Tg. 43)
            </button>
            <button
              onClick={() => handleSend('aggiungi 8 mocassini Borrelli taglia 42 a 130 euro')}
              className="whitespace-nowrap px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-full border border-zinc-700 transition-colors"
            >
              +8 Mocassini Borrelli (Tg. 42)
            </button>
            <button
              onClick={() => handleSend('quali prodotti sono sotto scorta?')}
              className="whitespace-nowrap px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-full border border-zinc-700 transition-colors"
            >
              Prodotti sotto scorta
            </button>
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-black border-t border-zinc-800 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2.5 rounded-xl transition-all ${
                listening 
                  ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30' 
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
              }`}
              title={listening ? 'Ascolto in corso... tocca per fermare' : 'Dettatura vocale'}
            >
              {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              placeholder={listening ? 'Parla pure, sto ascoltando...' : 'Es: inserisci 15 Air Max 95 di taglia 43...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              disabled={loading}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400"
            />

            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="p-2.5 bg-lime-400 hover:bg-lime-300 disabled:opacity-40 text-black rounded-xl transition-all font-bold"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
