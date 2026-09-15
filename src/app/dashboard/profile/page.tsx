'use client';

import { useState } from 'react';
import { User, Building, Mail, Phone, Globe, Save, Check } from 'lucide-react';

export default function ProfilePage() {
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState('Bar Centrale');
  const [email, setEmail] = useState('info@barcentrale.it');
  const [phone, setPhone] = useState('+39 081 5521478');
  const [website, setWebsite] = useState('https://barcentrale.it');
  const [reviewUrl, setReviewUrl] = useState('https://g.page/r/bar-centrale-reviews');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Profilo Attività</h1>
        <p className="text-sm text-zinc-400">
          Modifica le informazioni pubbliche e l'URL di destinazione principale dei chip NFC.
        </p>
      </div>

      <form onSubmit={handleSave} className="rounded-xl border border-[#27272A] bg-[#121214] p-6 space-y-4">
        {saved && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm flex items-center gap-2">
            <Check className="w-4 h-4" /> Dati aggiornati con successo
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Ragione Sociale / Nome</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Email Pubblica</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Telefono</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Sito Web</label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">URL Google Review Principale</label>
          <input
            type="url"
            value={reviewUrl}
            onChange={(e) => setReviewUrl(e.target.value)}
            className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white font-mono text-xs"
          />
          <p className="text-xs text-zinc-500 mt-1">
            Se modificato, tutti i chip NFC associati a questa destinazione reindirizzeranno automaticamente al nuovo link senza sostituire l'hardware fisico.
          </p>
        </div>

        <div className="pt-4 border-t border-[#27272A] flex justify-end">
          <button
            type="submit"
            className="bg-[#BFFF00] hover:bg-[#a8e000] text-black font-semibold text-sm px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" /> Salva Modifiche
          </button>
        </div>
      </form>
    </div>
  );
}
