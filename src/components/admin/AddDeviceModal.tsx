'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Plus, Loader2, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

interface AddDeviceModalProps {
  organizationId: string;
  locations: { id: string; name: string }[];
}

const PRESET_NAMES = [
  'Vetrina Principale',
  'Banco Cassa',
  'Camerino 1',
  'Camerino 2',
  'Corner Ingresso',
  'Tavolo 1',
  'Bancone Bar',
] as const;

export default function AddDeviceModal({ organizationId, locations }: AddDeviceModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [locationId, setLocationId] = useState(locations[0]?.id || '');
  const [type, setType] = useState<'both' | 'nfc' | 'qr'>('both');
  const [destinationUrl, setDestinationUrl] = useState('https://google.com');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const randCode = 'RIVO-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const supabase = createClient();

    const { error: insertErr } = await supabase.from('devices').insert({
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
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] px-3.5 py-2 text-xs font-bold text-[var(--rivo-volt-ink)] transition-[background-color,transform] duration-[180ms] active:scale-[0.98] cursor-pointer"
      >
        <Plus className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
        <span>Aggiungi Dispositivo</span>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 overscroll-contain"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-device-title"
    >
      <div
        className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-2xl p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)] block">
              HARDWARE PROVISIONING
            </span>
            <h3 id="add-device-title" className="font-display font-semibold text-[var(--text-primary)] text-base">
              Nuovo Dispositivo NFC / QR
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Chiudi finestra"
            className="min-h-[44px] min-w-[44px] -mr-2 -my-2 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="p-3 bg-[var(--accent-critical-bg)] border border-[var(--accent-critical-border)] text-[var(--accent-critical-text)] text-xs rounded-lg flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5 gap-2">
              <label htmlFor="device-name-input" className="block text-xs font-medium text-[var(--text-secondary)]">
                Nome Dispositivo *
              </label>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">Preset rapidi:</span>
            </div>
            <input
              id="device-name-input"
              name="deviceName"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="es. Banco Cassa, Vetrina o Tavolo 5…"
              className="w-full min-h-[44px] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--rivo-volt)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {PRESET_NAMES.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setName(preset)}
                  className={cn(
                    'text-[11px] min-h-[28px] px-2.5 py-0.5 rounded-md border transition-colors cursor-pointer',
                    name === preset
                      ? 'bg-[var(--rivo-volt)] text-[var(--rivo-volt-ink)] font-bold border-[var(--rivo-volt)]'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-subtle)]'
                  )}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="device-location-select" className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Sede Assegnata
            </label>
            <select
              id="device-location-select"
              name="locationId"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full min-h-[44px] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--rivo-volt)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="device-type-select" className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Tecnologia
            </label>
            <select
              id="device-type-select"
              name="deviceType"
              value={type}
              onChange={(e) => setType(e.target.value as 'both' | 'nfc' | 'qr')}
              className="w-full min-h-[44px] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--rivo-volt)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]"
            >
              <option value="both">Entrambi (NFC + QR)</option>
              <option value="nfc">Solo NFC</option>
              <option value="qr">Solo QR Code</option>
            </select>
          </div>

          <div>
            <label htmlFor="device-destination-url" className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              URL di Destinazione *
            </label>
            <input
              id="device-destination-url"
              name="destinationUrl"
              type="url"
              required
              spellCheck={false}
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
              placeholder="https://g.page/r/your-link"
              className="w-full min-h-[44px] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--rivo-volt)] rounded-lg px-3 py-2 text-xs font-mono text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
          </div>

          <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="min-h-[44px] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-lg transition-colors cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="min-h-[44px] bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[var(--rivo-volt-ink)] font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Creazione…</span>
                </>
              ) : (
                'Crea Dispositivo'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
