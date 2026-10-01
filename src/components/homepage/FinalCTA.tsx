import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="relative py-32 bg-[#09090B] overflow-hidden">
      {/* Radial Gradient Background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] bg-lime-500/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-6xl font-bold text-[#f4f4f5] tracking-tight mb-6">
          Il tuo business è già fisico.<br className="hidden md:block" /> Adesso rendilo connesso.
        </h2>
        
        <p className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto">
          Ti mostriamo RIVO direttamente sul tuo business.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/demo" 
            className="flex items-center justify-center gap-2 px-8 py-4 bg-lime-500 hover:bg-lime-400 text-zinc-950 font-semibold rounded-lg transition-colors w-full sm:w-auto"
          >
            Richiedi una demo
            <ArrowRight size={20} />
          </Link>
          
          <Link 
            href="#come-funziona" 
            className="flex items-center justify-center gap-2 px-8 py-4 bg-transparent hover:bg-zinc-800/50 text-zinc-300 font-medium rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors w-full sm:w-auto"
          >
            Scopri come funziona
          </Link>
        </div>
      </div>
    </section>
  );
}
