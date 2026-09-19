'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { ArrowRight, Loader2, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Check user role and status from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('auth_user_id', data.user.id)
        .single();

      if (profile?.status === 'deactivated') {
        await supabase.auth.signOut();
        setErrorMsg('Questo account collaboratore è stato disattivato dal responsabile.');
        setLoading(false);
        return;
      }

      if (profile?.status === 'suspended') {
        await supabase.auth.signOut();
        setErrorMsg('Questo account collaboratore è temporaneamente sospeso.');
        setLoading(false);
        return;
      }

      if (profile?.role === 'admin') {
        router.push('/admin');
      } else if (profile?.role === 'waiter') {
        router.push('/dashboard/waiter');
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 bg-[#09090B]">
      <div className="w-full max-w-md bg-[#121214] border border-[#27272A] rounded-xl p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2.5 mb-2">
            <Image
              src="/brand/rivo-icon.png"
              alt="RIVO"
              width={32}
              height={32}
              className="rounded-sm"
            />
            <span className="text-xl font-bold tracking-tight text-white">RIVO</span>
          </div>
          <p className="text-sm text-zinc-400 text-center">Accedi alla piattaforma di gestione</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-sm text-red-400">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@azienda.it"
              className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-white hover:bg-zinc-200 text-black font-semibold text-sm min-h-[44px] py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 touch-press"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Accedi</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#27272A]/50 text-center">
          <p className="text-xs text-zinc-500">
            Accesso riservato. Gli account sono creati esclusivamente dagli amministratori RIVO.
          </p>
        </div>
      </div>
    </div>
  );
}
