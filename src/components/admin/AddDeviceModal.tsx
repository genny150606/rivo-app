'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Plus, Loader2, X, Check } from 'lucide-react';

interface AddDeviceModalProps {
  organizationId: string;
  locations: { id: string; name: string }[];
}

export default function AddDeviceModal({ organizationId, locations }: AddDeviceModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [locationId, setLocationId] = useState(locations[0]?.id || '');
  const [type, setType] = useState<'both' | 'nfc' | 'qr'>('both');
  const [destinationUrl, setDestinationUrl] = useState('https://google.com');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const randCode = 'RIVO-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const supabase = createClient();

    const { error: insertErr } = await supabase
      .from('devices')
      .insert({
        organization_id: organizationId,
        location_id: locationId,
        name,
        type,
        unique_code: randCode,
        destination_url: destinationUrl,
        status: 'active',
      });

    if (insertErr) {
      setError(insertErr.message);
      setLoading(false);
    } else {
      setLoading(false);
      setOpen(false);
      setName('');
      router.refresh();
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-[#BFFF00] hover:bg-[#a8e000] text-black font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
      >
        <Plus className="w-3.5 h-3.5" /> Aggiungi Dispositivo
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-[#121214] border border-[#27272A] rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
          <h3 className="font-semibold text-white text-sm">Nuovo Dispositivo NFC / QR</h3>
          <button
            onClick={() => setOpen(false)}
            className="text-zinc-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Nome Dispositivo *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="es. Tavolo 5 o Ingresso"
              className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Sede Assegnata</label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Tecnologia</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="both">Entrambi (NFC + QR)</option>
              <option value="nfc">Solo NFC</option>
              <option value="qr">Solo QR Code</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">URL di Destinazione *</label>
            <input
              type="url"
              required
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
              placeholder="https://g.page/r/your-link"
              className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>

          <div className="pt-3 border-t border-[#27272A] flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white bg-zinc-800 rounded-lg"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="bg-[#BFFF00] hover:bg-[#a8e000] text-black font-semibold text-xs px-4 py-1.5 rounded-lg flex items-center gap-1 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Crea Dispositivo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
