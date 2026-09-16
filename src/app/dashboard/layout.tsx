'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  BarChart3, 
  Layers, 
  MapPin, 
  Star, 
  User, 
  Settings, 
  LogOut, 
  Radio,
  Menu,
  X,
  BellRing,
  Gift,
  Award,
  Users,
  Smartphone
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: BarChart3 },
  { label: 'Custom Hub', href: '/dashboard/custom-hub', icon: Smartphone },
  { label: 'Analytics', href: '/dashboard/analytics', icon: Radio },
  { label: 'Chiamate Sala', href: '/dashboard/service', icon: BellRing },
  { label: 'Review Shield', href: '/dashboard/reviews', icon: Star },
  { label: 'Ruota & Coupon', href: '/dashboard/coupons', icon: Gift },
  { label: 'Fidelity Pass', href: '/dashboard/loyalty', icon: Award },
  { label: 'Clienti & CRM', href: '/dashboard/leads', icon: Users },
  { label: 'Devices', href: '/dashboard/devices', icon: Layers },
  { label: 'Locations', href: '/dashboard/locations', icon: MapPin },
  { label: 'Profile & Routing', href: '/dashboard/profile', icon: User },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

interface SidebarContentProps {
  pathname: string;
  onLogout: () => void;
  onNavigate?: () => void;
}

function SidebarContent({ pathname, onLogout, onNavigate }: SidebarContentProps) {
  return (
    <>
      <div>
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-3 py-4 mb-4">
          <Image
            src="/brand/rivo-icon.png"
            alt="RIVO"
            width={28}
            height={28}
            className="rounded-sm"
          />
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
                onClick={onNavigate}
                className={`flex items-center gap-3 px-3.5 min-h-[44px] rounded-lg text-sm font-medium transition-all active:scale-[0.98] ${
                  isActive
                    ? 'bg-[#18181B] text-[#BFFF00]'
                    : 'text-zinc-400 hover:text-white hover:bg-[#18181B]/50'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer info / Logout */}
      <div className="pt-4 border-t border-[#27272A]/60">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3.5 min-h-[44px] rounded-lg text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-[#18181B]/50 active:scale-[0.98] transition-all touch-press"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Esci</span>
        </button>
      </div>
    </>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="flex min-h-screen bg-[#09090B] overflow-x-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-[#27272A] flex-col justify-between p-4 bg-[#0D0D10] shrink-0 fixed inset-y-0 left-0 z-30">
        <SidebarContent pathname={pathname} onLogout={handleLogout} />
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300 gpu-layer"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[#0D0D10] border-r border-[#27272A] flex flex-col justify-between p-4 transform transition-transform duration-300 ease-out will-change-transform gpu-layer lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Menu di navigazione mobile"
      >
        {/* Close button with >= 44x44px touch target */}
        <button
          onClick={closeSidebar}
          aria-label="Chiudi menu"
          className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-[#18181B] active:scale-95 transition-all touch-press"
        >
          <X className="w-5 h-5" />
        </button>
        <SidebarContent pathname={pathname} onLogout={handleLogout} onNavigate={closeSidebar} />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto overflow-x-hidden lg:ml-64">
        {/* Header */}
        <header className="h-14 lg:h-16 border-b border-[#27272A] px-3 sm:px-5 lg:px-6 flex items-center justify-between bg-[#09090B]/90 backdrop-blur shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Hamburger with >= 44x44px touch target */}
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Apri menu di navigazione"
              className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 rounded-lg text-zinc-400 hover:text-white hover:bg-[#18181B] active:scale-95 transition-all touch-press"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile logo */}
            <div className="flex items-center gap-2 lg:hidden">
              <Image
                src="/brand/rivo-icon.png"
                alt="RIVO"
                width={22}
                height={22}
                className="rounded-sm"
              />
              <span className="font-bold text-sm tracking-tight text-white">RIVO</span>
            </div>

            {/* Desktop label */}
            <div className="hidden lg:block text-sm font-medium text-zinc-300">Client Portal</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#BFFF00] animate-pulse" />
            <span className="text-xs text-zinc-400 hidden sm:inline">Live Network</span>
          </div>
        </header>

        <div className="p-3 sm:p-5 md:p-6 lg:p-7 max-w-7xl w-full mx-auto min-w-0 overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
