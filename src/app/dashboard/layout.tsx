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
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-3 py-3.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center shadow-xs shrink-0 p-1">
            <Image
              src="/brand/rivo-icon.png"
              alt="RIVO"
              width={22}
              height={22}
              priority
              className="rounded-xs dark:invert-0"
            />
          </div>
          <div className="min-w-0 flex flex-col">
            <span className="font-bold text-sm tracking-tight text-zinc-950 dark:text-white leading-tight">RIVO</span>
            <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 tracking-tight">Hospitality OS</span>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="space-y-0.5" aria-label="Menu principale">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onClick={onNavigate}
                className={`group flex items-center gap-3 px-3 py-2 min-h-[40px] rounded-lg text-[13px] font-medium transition-all duration-150 active:scale-[0.99] ${
                  isActive
                    ? 'bg-zinc-900 text-white dark:bg-zinc-800 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive 
                    ? 'text-white dark:text-zinc-100' 
                    : 'text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200'
                }`} />
                <span className="truncate flex-1">{item.label}</span>
                {item.badge && (
                  <span className={`text-[10px] font-semibold tracking-wide px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-white/20 text-white dark:bg-white/15 dark:text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/60'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Account / Theme */}
      <div className="pt-3 space-y-1 border-t border-zinc-200/80 dark:border-zinc-800/80">
        <ThemeToggle showLabel={true} />
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-2 min-h-[40px] rounded-lg text-[13px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/80 dark:hover:bg-rose-950/20 transition-all touch-press"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Disconnetti</span>
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
  const [userRole, setUserRole] = useState<string | null>(null);

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

        if (profile?.role && isMounted) {
          setUserRole(profile.role);
        }

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

  const isStaffRole = userRole === 'waiter';

  const navItems: NavItem[] = isStaffRole
    ? [
        { label: 'Il Mio Turno', href: '/dashboard/waiter', icon: BellRing, badge: 'Live' },
        { label: 'Sala & Tavoli', href: '/dashboard/tables', icon: Layers },
      ]
    : [
        { label: 'Overview', href: '/dashboard', icon: BarChart3 },
        { label: 'Sala & Tavoli', href: '/dashboard/tables', icon: Layers, badge: 'Staff' },
        { label: 'Gestione Staff', href: '/dashboard/staff', icon: Users, badge: 'Team' },
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
    <div className="flex min-h-screen min-h-dvh bg-zinc-50 dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 transition-colors duration-200 font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-zinc-200/80 dark:border-white/[0.06] flex-col justify-between p-4 bg-white dark:bg-[#0C0D0E] shrink-0 fixed inset-y-0 left-0 z-30 overflow-y-auto overscroll-contain">
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
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] h-full max-h-screen max-h-dvh bg-white dark:bg-[#0C0D0E] border-r border-zinc-200/80 dark:border-white/[0.06] flex flex-col justify-between p-4 overflow-y-auto overscroll-contain touch-pan-y transform transition-transform duration-300 ease-out will-change-transform gpu-layer lg:hidden shadow-2xl ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Menu di navigazione mobile"
      >
        {/* Close button with >= 44x44px touch target */}
        <button
          onClick={closeSidebar}
          aria-label="Chiudi menu"
          className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all touch-press z-10"
        >
          <X className="w-5 h-5" />
        </button>
        <SidebarContent pathname={pathname} navItems={navItems} onLogout={handleLogout} onNavigate={closeSidebar} />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Header */}
        <header className="h-14 lg:h-16 border-b border-zinc-200/80 dark:border-white/[0.06] px-4 sm:px-6 lg:px-8 flex items-center justify-between bg-white/80 dark:bg-[#09090B]/85 backdrop-blur-md shrink-0 sticky top-0 z-20 transition-colors duration-200">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Hamburger with >= 44x44px touch target */}
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Apri menu di navigazione"
              className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all touch-press"
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
                className="rounded-xs"
              />
              <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-white">RIVO</span>
            </div>

            {/* Desktop label */}
            <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <span>Attività</span>
              <span>/</span>
              <span className="text-zinc-900 dark:text-zinc-200 font-semibold capitalize">{category === 'restaurant' ? 'Ristorazione' : 'Retail & Business'}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
              <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300 hidden sm:inline tracking-tight">Rete Operativa</span>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto min-w-0">
          {children}
        </div>
      </main>
    </div>
  );
}
