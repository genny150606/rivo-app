'use client';

import { useEffect, useState, useRef, use } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Wine, 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  ChevronRight, 
  AlertCircle 
} from 'lucide-react';

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
  'Quale vino mi consigli con la carne? 🥩',
  'Cosa si abbina meglio con il pesce? 🐟',
  'Ci sono piatti senza glutine o lattosio? 🌾',
  'Qual è il dolce della casa più richiesto? 🍰',
];

export default function AiSommelierPage({ params }: SommelierPageProps) {
  const resolvedParams = use(params);
  const code = resolvedParams.code ? resolvedParams.code.toUpperCase() : '';

  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState<{ id: string; organization_id: string } | null>(null);
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
        .select('id, organization_id')
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
                text: `Buonasera e benvenuto da ${orgData.name}! Sono il tuo Sommelier e Maître di sala virtuale. Chiedimi qualsiasi consiglio su abbinamenti vini, carni, pesce o intolleranze alimentari. ✨🍷`,
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
    if (!textToSend.trim() || typing) return;

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
          organization_id: device?.organization_id,
          message: textToSend.trim(),
        }),
      });

      const data = await res.json();
      const aiReplyText = data.reply || 'Scusa, si è verificato un errore momentaneo. Chiedi al cameriere per assistenza al tavolo!';

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: aiReplyText,
        },
      ]);
    } catch (e) {
      console.warn('AI error:', e);
    } finally {
      setTyping(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center p-4">
        <div className="w-12 h-12 border-2 border-[#BFFF00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col justify-between selection:bg-[#BFFF00] selection:text-black">
      {/* Top Bar */}
      <header className="sticky top-0 z-20 bg-[#121214]/90 backdrop-blur-md border-b border-[#27272A] px-4 py-3">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#BFFF00]/15 text-[#BFFF00] flex items-center justify-center border border-[#BFFF00]/30 shadow-md shadow-[#BFFF00]/10 shrink-0">
            <Wine className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>AI Sommelier & Maître</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#BFFF00]/20 text-[#BFFF00]">GEMINI</span>
            </h1>
            <span className="text-[11px] text-zinc-400">{org?.name || 'Assistente al Tavolo'}</span>
          </div>
        </div>
      </header>

      {/* Chat Conversation Area */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 space-y-3 overflow-y-auto">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-end gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'ai' && (
              <div className="w-7 h-7 rounded-lg bg-[#18181B] border border-[#27272A] text-[#BFFF00] flex items-center justify-center shrink-0 mb-1">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-md ${
                m.sender === 'user'
                  ? 'bg-[#BFFF00] text-black font-medium rounded-br-none'
                  : 'bg-[#18181B] text-zinc-100 border border-[#27272A] rounded-bl-none'
              }`}
            >
              {m.text}
            </div>

            {m.sender === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-400 flex items-center justify-center shrink-0 mb-1">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {typing && (
          <div className="flex items-center gap-2 text-zinc-500 text-xs pl-9">
            <div className="flex items-center gap-1 bg-[#18181B] border border-[#27272A] px-3 py-2 rounded-2xl">
              <span className="w-1.5 h-1.5 rounded-full bg-[#BFFF00] animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#BFFF00] animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#BFFF00] animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>Il Sommelier sta pensando...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </main>

      {/* Suggestion Chips */}
      <div className="max-w-md w-full mx-auto px-4 pb-2">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
          {PRESET_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => sendMessage(q)}
              className="text-[11px] whitespace-nowrap bg-[#18181B] hover:bg-zinc-800 text-zinc-300 border border-[#27272A] rounded-full px-3 py-1.5 transition-colors shrink-0 touch-press"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input Bar */}
      <footer className="sticky bottom-0 bg-[#121214] border-t border-[#27272A] p-3">
        <form onSubmit={handleFormSubmit} className="max-w-md mx-auto flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Chiedi un consiglio sul vino o sul menù..."
            className="flex-1 min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#BFFF00]"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || typing}
            className="w-11 h-11 bg-[#BFFF00] hover:bg-[#a8e000] text-black rounded-xl flex items-center justify-center shrink-0 transition-all touch-press disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </footer>
    </div>
  );
}
