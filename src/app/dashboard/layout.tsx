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
  Smartphone,
  UtensilsCrossed,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

import { ThemeToggle } from '@/components/theme-toggle';

interface NavItem {
  label: string;
  href: string;
  icon: any;
  badge?: string;
}

interface SidebarContentProps {
  pathname: string;
  navItems: NavItem[];
  onLogout: () => void;
  onNavigate?: () => void;
}

function SidebarContent({ pathname, navItems, onLogout, onNavigate }: SidebarContentProps) {
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
            priority
            className="rounded-sm"
          />
          <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-white">RIVO</span>
        </div>

        {/* Nav List */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onClick={onNavigate}
                className={`flex items-center gap-3 px-3.5 min-h-[44px] rounded-lg text-sm font-medium transition-all active:scale-[0.98] ${
                  isActive
                    ? 'bg-zinc-200/90 dark:bg-[#18181B] text-zinc-950 dark:text-[#BFFF00] font-semibold shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#18181B]/50'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer info / Theme / Logout */}
      <div className="pt-3 space-y-1.5 border-t border-zinc-200 dark:border-[#27272A]/60">
        <ThemeToggle showLabel={true} />
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3.5 min-h-[44px] rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-[#18181B]/50 active:scale-[0.98] transition-all touch-press"
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
  const [category, setCategory] = useState<string | null>(null);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function fetchOrgCategory() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !isMounted) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id, role')
          .eq('auth_user_id', user.id)
          .single();

        let targetOrgId = profile?.organization_id;
        if (!targetOrgId && profile?.role === 'admin') {
          const { data: firstOrg } = await supabase
            .from('organizations')
            .select('id')
            .limit(1)
            .single();
          targetOrgId = firstOrg?.id;
        }

        if (targetOrgId && isMounted) {
          const { data: org } = await supabase
            .from('organizations')
            .select('category')
            .eq('id', targetOrgId)
            .single();

          if (org?.category && isMounted) {
            setCategory(org.category);
          }
        }
      } catch (err) {
        console.error('Error fetching org category in layout:', err);
      }
    }

    fetchOrgCategory();
    return () => {
      isMounted = false;
    };
  }, []);

  const navItems: NavItem[] = [
    { label: 'Overview', href: '/dashboard', icon: BarChart3 },
    { label: 'Custom Hub', href: '/dashboard/custom-hub', icon: Smartphone },
    ...(category === 'restaurant'
      ? [{ label: 'Menù Canvas', href: '/dashboard/menu', icon: UtensilsCrossed, badge: 'Ristoranti' }]
      : []),
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

  // Prevent body/window scroll when mobile sidebar drawer is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [sidebarOpen]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="flex min-h-screen min-h-dvh bg-zinc-100/70 dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-zinc-200 dark:border-[#27272A] flex-col justify-between p-4 bg-white dark:bg-[#0D0D10] shrink-0 fixed inset-y-0 left-0 z-30 overflow-y-auto overscroll-contain">
        <SidebarContent pathname={pathname} navItems={navItems} onLogout={handleLogout} />
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300 gpu-layer touch-none"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] h-full max-h-screen max-h-dvh bg-white dark:bg-[#0D0D10] border-r border-zinc-200 dark:border-[#27272A] flex flex-col justify-between p-4 overflow-y-auto overscroll-contain touch-pan-y transform transition-transform duration-300 ease-out will-change-transform gpu-layer lg:hidden shadow-2xl ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Menu di navigazione mobile"
      >
        {/* Close button with >= 44x44px touch target */}
        <button
          onClick={closeSidebar}
          aria-label="Chiudi menu"
          className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#18181B] active:scale-95 transition-all touch-press z-10"
        >
          <X className="w-5 h-5" />
        </button>
        <SidebarContent pathname={pathname} navItems={navItems} onLogout={handleLogout} onNavigate={closeSidebar} />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Header */}
        <header className="h-14 lg:h-16 border-b border-zinc-200 dark:border-[#27272A] px-3 sm:px-5 lg:px-6 flex items-center justify-between bg-white/80 dark:bg-[#09090B]/90 backdrop-blur shrink-0 sticky top-0 z-20 transition-colors duration-200">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Hamburger with >= 44x44px touch target */}
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Apri menu di navigazione"
              className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#18181B] active:scale-95 transition-all touch-press"
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
                priority
                className="rounded-sm"
              />
              <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-white">RIVO</span>
            </div>

            {/* Desktop label */}
            <div className="hidden lg:block text-sm font-semibold text-zinc-800 dark:text-zinc-200">Client Portal</div>
          </div>
          <div className="flex items-center gap-2.5 sm:gap-3">
            <ThemeToggle />
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-200/60 dark:bg-zinc-800/80 border border-zinc-300/60 dark:border-zinc-700/60">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 dark:bg-[#BFFF00] shadow-[0_0_6px_rgba(16,185,129,0.8)] dark:shadow-[0_0_6px_rgba(191,255,0,0.8)] animate-pulse" />
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 hidden sm:inline">Live Network</span>
            </div>
          </div>
        </header>

        <div className="p-3 sm:p-5 md:p-6 lg:p-7 max-w-7xl w-full mx-auto min-w-0">
          {children}
        </div>
      </main>
    </div>
  );
}
