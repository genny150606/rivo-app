'use client';

import { useEffect, useState, useRef, use } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Wine, 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  ArrowLeft,
  AlertCircle 
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
            .from('organizations')
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
        <div className="w-14 h-14 rounded-2xl bg-[#18181B] border border-[#27272A] flex items-center justify-center animate-pulse">
          <Wine className="w-7 h-7 text-purple-400 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="min-h-screen min-h-dvh bg-[#09090B] text-white flex flex-col items-center justify-center p-4 text-center">
        <div className="w-14 h-14 rounded-2xl border border-red-500/20 bg-red-500/10 flex items-center justify-center mb-3 text-red-400">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold">Dispositivo non trovato</h2>
        <Link
          href={`/hub/${code}`}
          className="mt-3 px-4 py-2 rounded-xl bg-zinc-800 text-white text-xs font-semibold"
        >
          Torna all&apos;Hub
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-dvh h-screen sm:h-dvh bg-[#09090B] text-zinc-100 flex flex-col justify-between p-3 sm:p-5 overflow-hidden relative selection:bg-[#BFFF00] selection:text-black">
      {/* Top ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-purple-500/10 blur-[120px] pointer-events-none rounded-full" />

      {/* TOP NAVIGATION: BACK TO HUB */}
      <nav className="w-full max-w-md mx-auto flex items-center justify-between z-10 pb-2">
        <Link
          href={`/hub/${code}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-medium text-zinc-300 hover:text-white transition-all active:scale-95 min-h-[40px]"
        >
          <ArrowLeft className="w-4 h-4 text-purple-400" />
          <span>Torna all&apos;Hub</span>
        </Link>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 border border-white/10 text-[11px] text-zinc-400">
          <Wine className="w-3 h-3 text-purple-400" />
          <span className="text-white font-medium">AI Sommelier</span>
        </span>
      </nav>

      {/* CHAT MESSAGES SCROLL CONTAINER */}
      <main className="max-w-md w-full mx-auto flex-1 flex flex-col justify-end overflow-hidden z-10 py-1">
        <div className="overflow-y-auto space-y-2.5 pr-1 max-h-[60vh] sm:max-h-[65vh]">
          {messages.map((msg) => {
            const isAi = msg.sender === 'ai';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2 ${isAi ? 'justify-start' : 'justify-end'}`}
              >
                {isAi && (
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`rounded-2xl p-3 text-xs leading-relaxed max-w-[82%] shadow-md ${
                    isAi
                      ? 'bg-[#18181B] border border-zinc-800 text-zinc-200'
                      : 'bg-purple-600 text-white font-medium'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}

          {typing && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="rounded-2xl p-3 bg-[#18181B] border border-zinc-800 text-xs text-zinc-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </main>

      {/* QUICK PRESET CHIPS & INPUT DOCKED AT BOTTOM */}
      <footer className="w-full max-w-md mx-auto z-10 pt-2 pb-1 space-y-2">
        {/* Quick prompt pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {PRESET_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => sendMessage(q)}
              disabled={typing}
              className="shrink-0 text-[10px] px-2.5 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-zinc-300 transition-colors"
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
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Chiedi un consiglio sul menù..."
            className="flex-1 min-h-[42px] bg-[#18181B] border border-[#27272A] rounded-xl px-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || typing}
            className="w-10 h-10 rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shrink-0 transition-colors disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </footer>
    </div>
  );
}
