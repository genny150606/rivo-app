import { Star, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

export default function ReviewsPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Google Reviews Hub</h1>
        <p className="text-sm text-zinc-400">
          Monitoraggio e conversione dei tap NFC in recensioni a 5 stelle certificate su Google Business.
        </p>
      </div>

      {/* Hero card / Feature readiness */}
      <div className="rounded-xl border border-[#27272A] bg-gradient-to-b from-[#18181B] to-[#121214] p-8 relative overflow-hidden">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#BFFF00]/10 flex items-center justify-center text-[#BFFF00]">
            <Star className="w-5 h-5 fill-[#BFFF00]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Integrazione Google Business API</h2>
            <span className="text-xs text-zinc-500 font-mono">STATUS: ARCHITECTURE READY / COMING SOON</span>
          </div>
        </div>

        <p className="text-sm text-zinc-300 leading-relaxed max-w-2xl mb-6">
          Il sistema RIVO è predisposto per collegarsi nativamente con l'API di Google Business Profile. Ogni volta che un cliente tocca il chip NFC al tavolo o in cassa, viene indirizzato al flusso di recensione diretto. Prossimamente potrai sincronizzare automaticamente le nuove recensioni e calcolare il ROI esatto di conversione.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#27272A]/80">
          <div className="space-y-1">
            <span className="text-xs text-zinc-500 block">Indirizzamento Smart</span>
            <span className="text-sm font-medium text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#BFFF00]" /> Deep Link diretto
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-zinc-500 block">Verifica Tap</span>
            <span className="text-sm font-medium text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#BFFF00]" /> Tracciamento 100% reale
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-zinc-500 block">Sincronizzazione API</span>
            <span className="text-sm font-medium text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-400" /> In rilascio Q3
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
