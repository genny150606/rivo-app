import Link from 'next/link';
import { 
  Building2, 
  Layers, 
  Activity, 
  ShieldCheck, 
  Plus, 
  ArrowRight,
  LogOut
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#09090B]">
      {/* Sidebar Admin */}
      <aside className="w-64 border-r border-[#27272A] flex flex-col justify-between p-4 bg-[#0D0D10] shrink-0">
        <div>
          <div className="flex items-center gap-2 px-3 py-4 mb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="font-bold text-lg tracking-tight text-white">RIVO ADMIN</span>
          </div>

          <nav className="space-y-1">
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-[#18181B] transition-colors"
            >
              <Activity className="w-4 h-4" />
              Panoramica Globale
            </Link>
            <Link
              href="/admin/organizations"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-[#18181B] transition-colors"
            >
              <Building2 className="w-4 h-4" />
              Organizzazioni
            </Link>
            <Link
              href="/admin/devices"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-[#18181B] transition-colors"
            >
              <Layers className="w-4 h-4" />
              Tutti i Dispositivi
            </Link>
          </nav>
        </div>

        <div className="pt-4 border-t border-[#27272A]/60">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-[#18181B]/50 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            Torna alla App
          </Link>
        </div>
      </aside>

      {/* Admin Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 border-b border-[#27272A] px-8 flex items-center justify-between bg-[#09090B]/80 backdrop-blur shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            Amministratore Master
          </div>
        </header>

        <div className="p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
