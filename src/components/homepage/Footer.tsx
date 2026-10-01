import Link from 'next/link';
import { Globe, ArrowUpRight, Mail, MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#09090B] border-t border-zinc-800 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Column 1: Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded bg-lime-500 flex items-center justify-center shrink-0">
                <span className="text-zinc-900 font-bold">R</span>
              </div>
              <span className="font-bold text-zinc-100 tracking-wide text-xl">RIVO</span>
            </div>
            <ul className="space-y-4">
              <li><Link href="#" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Prodotto</Link></li>
              <li><Link href="#come-funziona" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Come funziona</Link></li>
              <li><Link href="#" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Soluzioni</Link></li>
              <li><Link href="#" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Demo</Link></li>
            </ul>
          </div>

          {/* Column 2: Prodotto */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-6">Prodotto</h3>
            <ul className="space-y-4">
              <li><Link href="#" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Smart Router</Link></li>
              <li><Link href="#" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Review Shield</Link></li>
              <li><Link href="#" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">CRM</Link></li>
              <li><Link href="#" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Loyalty</Link></li>
              <li><Link href="#" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Analytics</Link></li>
              <li><Link href="#" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Staff</Link></li>
            </ul>
          </div>

          {/* Column 3: Soluzioni */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-6">Soluzioni</h3>
            <ul className="space-y-4">
              <li><Link href="#" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Ristoranti</Link></li>
              <li><Link href="#" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Bar</Link></li>
              <li><Link href="#" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Hotel</Link></li>
              <li><Link href="#" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Retail</Link></li>
              <li><Link href="#" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Servizi</Link></li>
            </ul>
          </div>

          {/* Column 4: Azienda */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-6">Azienda</h3>
            <ul className="space-y-4">
              <li><Link href="#" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Chi siamo</Link></li>
              <li><Link href="#" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Contatti</Link></li>
              <li><Link href="/login" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Accedi</Link></li>
            </ul>
          </div>

          {/* Column 5: Legal */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-6">Legal</h3>
            <ul className="space-y-4">
              <li><Link href="#" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Cookie Policy</Link></li>
              <li><Link href="#" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Termini di Servizio</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-zinc-500">
            © 2026 RIVO. Tutti i diritti riservati.
          </p>
          <div className="flex items-center gap-4 text-zinc-500">
            <Link href="#" className="hover:text-zinc-300 transition-colors" aria-label="Website">
              <Globe size={20} />
            </Link>
            <Link href="#" className="hover:text-zinc-300 transition-colors" aria-label="Link">
              <ArrowUpRight size={20} />
            </Link>
            <Link href="#" className="hover:text-zinc-300 transition-colors" aria-label="Email">
              <Mail size={20} />
            </Link>
            <Link href="#" className="hover:text-zinc-300 transition-colors" aria-label="Contatti">
              <MessageCircle size={20} />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
