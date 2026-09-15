'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  BarChart3, 
  Layers, 
  MapPin, 
  Star, 
  User, 
  Settings, 
  LogOut, 
  Radio
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: BarChart3 },
  { label: 'Analytics', href: '/dashboard/analytics', icon: Radio },
  { label: 'Devices', href: '/dashboard/devices', icon: Layers },
  { label: 'Locations', href: '/dashboard/locations', icon: MapPin },
  { label: 'Reviews', href: '/dashboard/reviews', icon: Star },
  { label: 'Profile', href: '/dashboard/profile', icon: User },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="flex min-h-screen bg-[#09090B]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#27272A] flex flex-col justify-between p-4 bg-[#0D0D10] shrink-0">
        <div>
          {/* Brand */}
          <div className="flex items-center gap-2 px-3 py-4 mb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-[#BFFF00]" />
            <span className="font-bold text-lg tracking-tight text-white">RIVO</span>
          </div>

          {/* Nav List */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#18181B] text-[#BFFF00]'
                      : 'text-zinc-400 hover:text-white hover:bg-[#18181B]/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer info / Logout */}
        <div className="pt-4 border-t border-[#27272A]/60">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-[#18181B]/50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Esci
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 border-b border-[#27272A] px-8 flex items-center justify-between bg-[#09090B]/80 backdrop-blur shrink-0 sticky top-0 z-10">
          <div className="text-sm font-medium text-zinc-300">Client Portal</div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#BFFF00] animate-pulse" />
            <span className="text-xs text-zinc-400">Live Network</span>
          </div>
        </header>

        <div className="p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
