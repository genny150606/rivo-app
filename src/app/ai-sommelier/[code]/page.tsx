'use client';

import { useEffect, useState, useRef, use } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Wine,
  Send,
  Bot,
  ArrowLeft,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}

interface SommelierPageProps {
  params: Promise<{ code: string }>;
}

const PRESET_QUESTIONS = [
  'Vino per piatti di carne',
  'Miglior abbinamento pesce',
  'Opzioni senza glutine o intolleranze',
  'Dolce della casa consigliato',
];

export default function AiSommelierPage({ params }: SommelierPageProps) {
  const resolvedParams = use(params);
  const code = resolvedParams.code ? resolvedParams.code.toUpperCase() : '';

  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState<{ id: string; name: string; organization_id: string } | null>(null);
  const [org, setOrg] = useState<{ name: string } | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [typing, setTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      if (!code) {
        setLoading(false);
        return;
      }

      const { data: dev } = await supabase
        .from('devices')
        .select('id, name, organization_id')
        .eq('unique_code', code)
        .single();

      if (dev) {
        setDevice(dev);
        if (dev.organization_id) {
          const { data: orgData } = await supabase
            .from('public_organizations')
            .select('name')
            .eq('id', dev.organization_id)
            .single();
          if (orgData) {
            setOrg(orgData);
            setMessages([
              {
                id: 'welcome',
                sender: 'ai',
                text: `Buonasera e benvenuto da ${orgData.name}! Sono il tuo Sommelier e Maître di sala virtuale. Chiedimi qualsiasi consiglio su abbinamenti vini, piatti della cucina o intolleranze alimentari.`,
              },
            ]);
          }
        }
      }
      setLoading(false);
    }

    loadData();
  }, [code]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || typing || !device) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setTyping(true);

    try {
      const res = await fetch('/api/ai/sommelier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: device.organization_id,
          prompt: textToSend.trim(),
          conversationHistory: messages.slice(-4),
        }),
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: data.reply,
          },
        ]);
      }
    } catch (err) {
      console.warn('Sommelier chat error:', err);
    } finally {
      setTyping(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen min-h-dvh bg-[#09090B] flex items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-[#111215] border border-[#22242A] flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-[#BFFF00] animate-spin motion-reduce:animate-none" />
        </div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="min-h-screen min-h-dvh bg-[#09090B] bg-rivo-grid text-[#F4F4F6] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-14 h-14 rounded-2xl border border-red-500/20 bg-red-500/10 flex items-center justify-center mb-3 text-red-400">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold">Dispositivo non trovato</h2>
        <Link
          href={`/hub/${code}`}
          className="mt-4 min-h-[48px] px-5 py-2.5 rounded-xl bg-[#18191E] border border-[#22242A] hover:border-white/20 text-white text-xs font-semibold inline-flex items-center justify-center"
        >
          Torna all&apos;Hub
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-dvh bg-[#09090B] bg-rivo-grid text-[#F4F4F6] flex flex-col justify-between p-4 sm:p-5 overflow-x-hidden relative selection:bg-[#BFFF00] selection:text-[#09090B]">
      {/* TOP NAVIGATION: BACK TO HUB */}
      <nav className="w-full max-w-md mx-auto flex items-center justify-between gap-2 z-10 pb-3 border-b border-[#22242A]">
        <Link
          href={`/hub/${code}`}
          className="inline-flex items-center gap-1.5 px-3.5 min-h-[48px] rounded-xl bg-[#111215] hover:bg-[#18191E] border border-[#22242A] text-xs font-semibold text-[#E4E4E7] hover:text-white transition-colors active:scale-[0.98]"
        >
          <ArrowLeft className="w-4 h-4 text-[#BFFF00]" />
          <span>Torna all&apos;Hub</span>
        </Link>

        <span className="inline-flex items-center gap-1.5 px-3 min-h-[36px] rounded-full bg-[#111215] border border-[#22242A] text-[11px] font-mono text-[#D4D4D8]">
          <Wine className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-white font-semibold">AI Sommelier</span>
        </span>
      </nav>

      {/* CHAT MESSAGES SCROLL CONTAINER */}
      <main className="max-w-md w-full mx-auto flex-1 flex flex-col justify-end overflow-hidden z-10 py-3">
        {org?.name && (
          <div className="text-center pb-3">
            <h1 className="text-sm font-bold text-white">{org.name}</h1>
            <p className="text-[11px] text-[#A1A1AA]">Sommelier &amp; Maître di Sala Virtuale</p>
          </div>
        )}
        <div className="overflow-y-auto space-y-3 pr-1 max-h-[58vh] sm:max-h-[62vh]">
          {messages.map((msg) => {
            const isAi = msg.sender === 'ai';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2 ${isAi ? 'justify-start' : 'justify-end'}`}
              >
                {isAi && (
                  <div className="w-8 h-8 rounded-xl bg-[#18191E] border border-[#22242A] text-[#BFFF00] flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed max-w-[82%] shadow-md ${
                    isAi
                      ? 'bg-[#111215] border border-[#22242A] text-[#F4F4F6]'
                      : 'bg-[#BFFF00] text-[#09090B] font-semibold'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}

          {typing && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#18191E] border border-[#22242A] text-[#BFFF00] flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="rounded-2xl px-3.5 py-3 bg-[#111215] border border-[#22242A] text-xs text-[#A1A1AA] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#BFFF00] animate-bounce motion-reduce:animate-none" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#BFFF00] animate-bounce motion-reduce:animate-none [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#BFFF00] animate-bounce motion-reduce:animate-none [animation-delay:0.4s]" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </main>

      {/* QUICK PRESET CHIPS & INPUT DOCKED AT BOTTOM */}
      <footer className="w-full max-w-md mx-auto z-10 pt-2 pb-1 space-y-2.5">
        {/* Quick prompt pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {PRESET_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => sendMessage(q)}
              disabled={typing}
              className="shrink-0 min-h-[44px] text-xs px-3.5 rounded-xl bg-[#111215] hover:bg-[#18191E] border border-[#22242A] text-[#E4E4E7] transition-colors cursor-pointer disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(inputText);
          }}
          className="flex items-center gap-2"
        >
          <label htmlFor="sommelier-prompt" className="sr-only">
            Chiedi un consiglio al Sommelier
          </label>
          <input
            id="sommelier-prompt"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Chiedi un consiglio sul menù..."
            className="flex-1 min-h-[48px] bg-[#111215] border border-[#22242A] rounded-xl px-3.5 text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-[#BFFF00]"
          />
          <button
            type="submit"
            aria-label="Invia domanda al Sommelier"
            disabled={!inputText.trim() || typing}
            className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl bg-[#BFFF00] hover:bg-[#d2ff4d] text-[#09090B] flex items-center justify-center shrink-0 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-1 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111215] border border-[#22242A] text-[11px] font-mono text-[#A1A1AA]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#BFFF00]" />
            <span>AI Sommelier • Powered by</span>
            <strong className="text-white font-bold tracking-wide">RIVO</strong>
          </div>
        </div>
      </footer>
    </div>
  );
}
