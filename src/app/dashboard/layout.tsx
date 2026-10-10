'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LogOut, 
  Menu, 
  X, 
  Command,
  Building2,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/theme-toggle';
import { resolveSidebarNavigation, NavGroup } from '@/platform/navigation/sidebar';
import { ModuleSlug, BusinessTypeSlug } from '@/platform/modules/registry';
import { getVertical, VERTICAL_REGISTRY } from '@/platform/verticals/registry';
import RetailAICopilot from '@/components/dashboard/RetailAICopilot';

interface SidebarContentProps {
  pathname: string;
  navGroups: NavGroup[];
  orgName: string | null;
  verticalLabel: string;
  systemBadge: string;
  loading: boolean;
  onLogout: () => void;
  onNavigate?: () => void;
}

function SidebarContent({
  pathname,
  navGroups,
  orgName,
  verticalLabel,
  systemBadge,
  loading,
  onLogout,
  onNavigate,
}: SidebarContentProps) {
  return (
    <>
      <div className="flex flex-col min-h-0 flex-1">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-3 py-3.5 mb-2 border-b border-zinc-200/70 dark:border-white/[0.06] pb-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-950 dark:bg-zinc-100 flex items-center justify-center shadow-xs shrink-0 p-1">
            <Image
              src="/brand/rivo-icon.png"
              alt="RIVO"
              width={22}
              height={22}
              priority
              className="rounded-xs dark:invert-0"
            />
          </div>
          <div className="min-w-0 flex flex-col flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-zinc-950 dark:text-white leading-tight">RIVO</span>
              <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/60">
                {systemBadge}
              </span>
            </div>
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 truncate">
              {orgName || verticalLabel}
            </span>
          </div>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto overscroll-contain pr-1 -mr-1 space-y-4 py-1" aria-label="Menu principale">
          {loading ? (
            <div className="space-y-3 px-2 py-4 animate-pulse">
              <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="space-y-1.5">
                <div className="h-9 bg-zinc-100 dark:bg-zinc-900 rounded-lg" />
                <div className="h-9 bg-zinc-100 dark:bg-zinc-900 rounded-lg" />
                <div className="h-9 bg-zinc-100 dark:bg-zinc-900 rounded-lg" />
              </div>
              <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded pt-2" />
              <div className="space-y-1.5">
                <div className="h-9 bg-zinc-100 dark:bg-zinc-900 rounded-lg" />
                <div className="h-9 bg-zinc-100 dark:bg-zinc-900 rounded-lg" />
              </div>
            </div>
          ) : (
            navGroups.map((group) => (
              <div key={group.id} className="space-y-0.5">
                {group.label && (
                  <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 select-none">
                    {group.label}
                  </div>
                )}
                <nav className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.exact
                      ? pathname === item.href
                      : pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));

                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        prefetch={true}
                        onClick={onNavigate}
                        className={`group flex items-center gap-2.5 px-3 py-2 min-h-[38px] rounded-lg text-[13px] font-medium transition-all duration-150 active:scale-[0.99] ${
                          isActive
                            ? 'bg-zinc-900 text-white dark:bg-zinc-800 dark:text-zinc-100 shadow-xs'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive 
                            ? 'text-white dark:text-zinc-100' 
                            : 'text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200'
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
            ))
          )}
        </div>
      </div>

      {/* Footer / Account / Theme */}
      <div className="pt-3 space-y-1 border-t border-zinc-200/80 dark:border-zinc-800/80 mt-2 shrink-0">
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
  const [category, setCategory] = useState<BusinessTypeSlug | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('owner');
  const [activeModules, setActiveModules] = useState<Set<ModuleSlug>>(new Set());
  const [loading, setLoading] = useState(true);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function loadOrgAndModules() {
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
            .select('name, category, business_type, business_type_id')
            .eq('id', targetOrgId)
            .single();

          let resolvedCategory: BusinessTypeSlug = 'shoe_store';
          const candidate = ((org as any)?.business_type || org?.category || 'shoe_store') as string;
          if (candidate in VERTICAL_REGISTRY) {
            resolvedCategory = candidate as BusinessTypeSlug;
          } else if (candidate === 'store' || candidate === 'retail') {
            resolvedCategory = 'shoe_store';
          } else {
            resolvedCategory = 'restaurant';
          }

          if (isMounted) {
            setOrgName(org?.name || null);
            setCategory(resolvedCategory);
          }

          // Fetch organization modules
          const { data: orgMods } = await supabase
            .from('organization_modules')
            .select(`
              enabled,
              modules:module_id (
                slug
              )
            `)
            .eq('organization_id', targetOrgId);

          if (orgMods && orgMods.length > 0 && isMounted) {
            const enabledSet = new Set<ModuleSlug>();
            for (const om of orgMods) {
              const mod = (Array.isArray(om.modules) ? om.modules[0] : om.modules) as { slug?: string } | null;
              if (om.enabled && mod?.slug) {
                enabledSet.add(mod.slug as ModuleSlug);
              }
            }
            setActiveModules(enabledSet);
          } else if (isMounted) {
            // Preset fallback based on vertical registry
            const vertical = getVertical(resolvedCategory);
            setActiveModules(new Set<ModuleSlug>(vertical.defaultModules));
          }
        }
      } catch (err) {
        console.error('Error fetching org modules in layout:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadOrgAndModules();
    return () => {
      isMounted = false;
    };
  }, []);

  // Prevent body/window scroll when mobile drawer is open
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

  const navGroups = resolveSidebarNavigation(
    activeModules,
    userRole,
    category || undefined
  );

  const vertical = category ? getVertical(category) : null;
  const verticalLabel = vertical?.name || 'RIVO Business';

  const systemBadge = category === 'shoe_store' 
    ? 'Footwear OS' 
    : category === 'retail' 
    ? 'Retail OS' 
    : (category === 'hotel' || category === 'bb')
    ? 'Hotel OS'
    : ['restaurant', 'bar', 'pizzeria', 'gelateria'].includes(category || '')
    ? 'Hospitality OS'
    : 'Modular OS';

  return (
    <div className="flex min-h-screen min-h-dvh bg-zinc-50 dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 transition-colors duration-200 font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-zinc-200/80 dark:border-white/[0.06] flex-col justify-between p-4 bg-white dark:bg-[#0C0D0E] shrink-0 fixed inset-y-0 left-0 z-30 overflow-hidden">
        <SidebarContent 
          pathname={pathname} 
          navGroups={navGroups} 
          orgName={orgName}
          verticalLabel={verticalLabel}
          systemBadge={systemBadge}
          loading={loading}
          onLogout={handleLogout} 
        />
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
        <button
          onClick={closeSidebar}
          aria-label="Chiudi menu"
          className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all touch-press z-10"
        >
          <X className="w-5 h-5" />
        </button>
        <SidebarContent 
          pathname={pathname} 
          navGroups={navGroups} 
          orgName={orgName}
          verticalLabel={verticalLabel}
          systemBadge={systemBadge}
          loading={loading}
          onLogout={handleLogout} 
          onNavigate={closeSidebar} 
        />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Top Header */}
        <header className="h-14 lg:h-16 border-b border-zinc-200/80 dark:border-white/[0.06] px-4 sm:px-6 lg:px-8 flex items-center justify-between bg-white/80 dark:bg-[#09090B]/85 backdrop-blur-md shrink-0 sticky top-0 z-20 transition-colors duration-200">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Hamburger */}
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

            {/* Breadcrumb Context */}
            <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
              <span className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-200 font-semibold">
                <Building2 className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                {orgName || 'Attività'}
              </span>
              <ChevronRight className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
              <span className="text-zinc-700 dark:text-zinc-300 capitalize">{verticalLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Command search preview indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-lg select-none">
              <Command className="w-3.5 h-3.5" />
              <span className="text-[11px] font-mono">⌘K</span>
            </div>

            <ThemeToggle />

            {/* Live operational badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[11px] font-semibold hidden sm:inline tracking-tight">Rete Operativa</span>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto min-w-0">
          {children}
        </div>
      </main>

      {/* Floating Retail AI Copilot for voice & natural language inventory actions */}
      {(activeModules.has('products') || activeModules.has('inventory') || activeModules.has('sales')) && (
        <RetailAICopilot />
      )}
    </div>
  );
}
