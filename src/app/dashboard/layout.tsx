'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LogOut,
  Menu,
  X,
  Building2,
  ChevronRight,
  BarChart3,
  Receipt,
  ScanLine,
  Boxes,
  LayoutGrid,
  ConciergeBell,
  ShieldCheck,
  CalendarCheck,
  Users,
  Sun,
  Moon,
  ExternalLink,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/theme-toggle';
import { useTheme } from '@/components/theme-provider';
import {
  resolveSidebarNavigation,
  projectNavigationPillars,
  NavGroup,
} from '@/platform/navigation/sidebar';
import { ModuleSlug, BusinessTypeSlug } from '@/platform/modules/registry';
import { getVertical, VERTICAL_REGISTRY } from '@/platform/verticals/registry';
import RetailAICopilot from '@/components/dashboard/RetailAICopilot';
import SimpleModeToggle from '@/components/dashboard/SimpleModeToggle';
import {
  CommandPalette,
  CommandPaletteTrigger,
  type CommandItem,
  StatusBadge,
} from '@/components/ui';
import { cn } from '@/lib/cn';

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
        <div className="flex items-center gap-3 px-2.5 py-3 mb-2 border-b border-[var(--border-subtle)] pb-3.5">
          <div className="w-8 h-8 rounded-lg bg-[#09090B] border border-[#22242A] flex items-center justify-center shrink-0 p-1">
            <Image
              src="/brand/rivo-icon.png"
              alt="RIVO"
              width={20}
              height={20}
              priority
              className="rounded-xs"
            />
          </div>
          <div className="min-w-0 flex flex-col flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-sm tracking-tight text-[var(--text-primary)] leading-tight">
                RIVO
              </span>
              <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.08em] px-1.5 py-0.5 rounded bg-[#09090B] text-[#BFFF00] border border-[#22242A]">
                {systemBadge}
              </span>
            </div>
            <span className="text-[11px] font-medium text-[var(--text-secondary)] truncate mt-0.5">
              {orgName || verticalLabel}
            </span>
          </div>
        </div>

        {/* Navigation Pillars */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain pr-1 -mr-1 space-y-4 py-1"
          aria-label="Menu principale"
        >
          {loading ? (
            <div className="space-y-3 px-2 py-4 animate-pulse">
              <div className="h-3.5 w-20 bg-[var(--bg-elevated)] rounded" />
              <div className="space-y-1.5">
                <div className="h-9 bg-[var(--bg-elevated)] rounded-lg" />
                <div className="h-9 bg-[var(--bg-elevated)] rounded-lg" />
                <div className="h-9 bg-[var(--bg-elevated)] rounded-lg" />
              </div>
              <div className="h-3.5 w-24 bg-[var(--bg-elevated)] rounded pt-2" />
              <div className="space-y-1.5">
                <div className="h-9 bg-[var(--bg-elevated)] rounded-lg" />
                <div className="h-9 bg-[var(--bg-elevated)] rounded-lg" />
              </div>
            </div>
          ) : (
            navGroups.map((group) => (
              <div key={group.id} className="space-y-0.5">
                {group.label && (
                  <div className="px-3 pt-2 pb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)] select-none">
                    {group.label}
                  </div>
                )}
                <nav className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.exact
                      ? pathname === item.href
                      : pathname === item.href ||
                        (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));

                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        prefetch={true}
                        onClick={onNavigate}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          'group flex items-center gap-2.5 px-3 py-2 min-h-[40px] max-lg:min-h-[44px] rounded-lg text-[13px] font-medium transition-[background-color,color,border-color] duration-[180ms] border-l-2',
                          isActive
                            ? 'border-[var(--rivo-volt)] bg-[var(--bg-elevated)] text-[var(--text-primary)] font-semibold'
                            : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]/60'
                        )}
                      >
                        <Icon
                          className={cn(
                            'w-4 h-4 shrink-0 transition-colors',
                            isActive
                              ? 'text-[var(--rivo-volt-text)]'
                              : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
                          )}
                          strokeWidth={1.75}
                          aria-hidden="true"
                        />
                        <span className="truncate flex-1">{item.label}</span>
                        {item.badge && (
                          <span
                            className={cn(
                              'font-mono text-[10px] font-semibold tracking-wide px-1.5 py-0.5 rounded',
                              isActive
                                ? 'bg-[#09090B] text-[#BFFF00] border border-[#22242A]'
                                : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                            )}
                          >
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

      {/* Telemetry & Account Footer */}
      <div className="pt-3 space-y-2 border-t border-[var(--border-subtle)] mt-2 shrink-0">
        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--rivo-volt)]" />
            SYNC LIVE
          </span>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
            RLS
          </span>
        </div>
        <div className="space-y-1">
          <ThemeToggle showLabel={true} />
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-3.5 py-2 min-h-[44px] rounded-lg text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--accent-critical-text)] hover:bg-[var(--accent-critical-bg)] transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span>Disconnetti</span>
          </button>
        </div>
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
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [category, setCategory] = useState<BusinessTypeSlug | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('owner');
  const [activeModules, setActiveModules] = useState<Set<ModuleSlug>>(new Set());
  const [activeDeviceCount, setActiveDeviceCount] = useState<number | null>(null);
  const [firstDeviceCode, setFirstDeviceCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function loadOrgAndModules() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
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
          const [{ data: org }, { data: devicesData, count: devicesCount }] = await Promise.all([
            supabase
              .from('organizations')
              .select('name, category, business_type, business_type_id')
              .eq('id', targetOrgId)
              .single(),
            supabase
              .from('devices')
              .select('id, unique_code', { count: 'exact' })
              .eq('organization_id', targetOrgId)
              .eq('status', 'active')
              .limit(1),
          ]);

          if (isMounted) {
            if (typeof devicesCount === 'number') {
              setActiveDeviceCount(devicesCount);
            }
            if (devicesData?.[0]?.unique_code) {
              setFirstDeviceCode(devicesData[0].unique_code);
            }
          }

          let resolvedCategory: BusinessTypeSlug = 'restaurant';
          const rawCategory = (org?.category || '') as string;
          const rawBt = ((org as { business_type?: string } | null)?.business_type || '') as string;
          const candidate =
            rawCategory && rawCategory in VERTICAL_REGISTRY
              ? rawCategory
              : rawBt || rawCategory;

          if (candidate in VERTICAL_REGISTRY) {
            resolvedCategory = candidate as BusinessTypeSlug;
          } else if (candidate === 'bnb') {
            resolvedCategory = 'bb';
          } else if (candidate === 'store' || candidate === 'retail') {
            resolvedCategory = 'retail';
          }

          if (isMounted) {
            setOrgName(org?.name || null);
            setCategory(resolvedCategory);
          }

          const isBeautyOrBarber = ['salon', 'barber', 'beauty'].includes(resolvedCategory);

          const { data: orgMods } = await supabase
            .from('organization_modules')
            .select(
              `
              enabled,
              modules:module_id (
                slug
              )
            `
            )
            .eq('organization_id', targetOrgId);

          if (orgMods && orgMods.length > 0 && isMounted) {
            const enabledSet = new Set<ModuleSlug>();
            let bookingsExplicitlyDisabled = false;
            for (const om of orgMods) {
              const mod = (
                Array.isArray(om.modules) ? om.modules[0] : om.modules
              ) as { slug?: string } | null;
              if (mod?.slug === 'bookings' && om.enabled === false) {
                bookingsExplicitlyDisabled = true;
              }
              if (om.enabled && mod?.slug) {
                enabledSet.add(mod.slug as ModuleSlug);
              }
            }
            if (isBeautyOrBarber) {
              if (!bookingsExplicitlyDisabled) {
                enabledSet.add('bookings');
              }
              enabledSet.delete('table_service');
              enabledSet.delete('service_calls');
              enabledSet.delete('canva_menu');
            }
            setActiveModules(enabledSet);
          } else if (isMounted) {
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

  const legacyGroups = resolveSidebarNavigation(
    activeModules,
    userRole,
    category || undefined
  );
  const navGroups = useMemo(() => projectNavigationPillars(legacyGroups), [legacyGroups]);

  const activeNavLabel = useMemo(() => {
    for (const g of navGroups) {
      const found = g.items.find((i) =>
        i.href === '/dashboard' ? pathname === '/dashboard' : Boolean(pathname?.startsWith(i.href))
      );
      if (found) return found.label;
    }
    return null;
  }, [navGroups, pathname]);

  const vertical = category ? getVertical(category) : null;
  const verticalLabel = vertical?.name || 'RIVO Business';
  const isRetailVertical = vertical?.dashboardType === 'retail';

  const systemBadge =
    category === 'shoe_store'
      ? 'Footwear OS'
      : category === 'retail'
      ? 'Retail OS'
      : category === 'hotel' || category === 'bb'
      ? 'Hotel OS'
      : ['salon', 'barber', 'beauty'].includes(category || '')
      ? 'Beauty OS'
      : ['restaurant', 'bar', 'pizzeria', 'gelateria'].includes(category || '')
      ? 'Hospitality OS'
      : 'RIVO OS';

  // Build live Command Palette items from active pillars + workspace utilities
  const commandItems = useMemo<CommandItem[]>(() => {
    const navItems: CommandItem[] = navGroups.flatMap((group) =>
      group.items.map((item) => ({
        id: `nav-${item.id}`,
        label: item.label,
        description: item.href,
        group: group.label || 'Control Center',
        href: item.href,
        icon: item.icon,
        badge: item.badge,
      }))
    );

    const utilityItems: CommandItem[] = [
      {
        id: 'action-toggle-theme',
        label: theme === 'dark' ? 'Passa a Tema Chiaro' : 'Passa a Tema Scuro',
        description: 'Alterna modalità operativa Dark / Light',
        group: 'Azioni Rapide',
        icon: theme === 'dark' ? Sun : Moon,
        onSelect: toggleTheme,
      },
    ];

    return [...navItems, ...utilityItems];
  }, [navGroups, theme, toggleTheme]);

  // Mobile bottom navigation dock (<= 5 items including Menu button)
  const mobileDockItems = useMemo(() => {
    if (userRole === 'waiter') {
      return [
        { label: 'Chiamate', href: '/dashboard/waiter', icon: ConciergeBell },
        { label: 'Tavoli', href: '/dashboard/tables', icon: LayoutGrid },
        { label: 'Comande', href: '/dashboard/service', icon: BarChart3 },
      ];
    }
    if (isRetailVertical) {
      return [
        { label: 'Home', href: '/dashboard', icon: BarChart3, exact: true },
        { label: 'Cassa', href: '/dashboard/sales', icon: Receipt },
        { label: 'Scanner', href: '/dashboard/scanner', icon: ScanLine },
        { label: 'Stock', href: '/dashboard/inventory', icon: Boxes },
      ];
    }
    if (['salon', 'barber', 'beauty'].includes(category || '')) {
      return [
        { label: 'Home', href: '/dashboard', icon: BarChart3, exact: true },
        { label: 'Agenda', href: '/dashboard/bookings', icon: CalendarCheck },
        { label: 'Clienti', href: '/dashboard/leads', icon: Users },
        { label: 'Review', href: '/dashboard/reviews', icon: ShieldCheck },
      ];
    }
    return [
      { label: 'Sala', href: '/dashboard', icon: BarChart3, exact: true },
      { label: 'Tavoli', href: '/dashboard/tables', icon: LayoutGrid },
      { label: 'Chiamate', href: '/dashboard/waiter', icon: ConciergeBell },
      { label: 'Review', href: '/dashboard/reviews', icon: ShieldCheck },
    ];
  }, [userRole, isRetailVertical, category]);

  return (
    <div className="flex min-h-screen min-h-dvh bg-[var(--bg-canvas)] text-[var(--text-primary)] font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-[var(--border-subtle)] flex-col justify-between p-4 bg-[var(--bg-surface)] shrink-0 fixed inset-y-0 left-0 z-30 overflow-hidden">
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
          className="fixed inset-0 bg-[var(--bg-backdrop)] backdrop-blur-xs z-40 lg:hidden transition-opacity duration-200 touch-none"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] h-full max-h-dvh bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] flex flex-col justify-between p-4 overflow-y-auto overscroll-contain touch-pan-y transform transition-transform duration-200 ease-out lg:hidden shadow-2xl',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Menu di navigazione mobile"
      >
        <button
          type="button"
          onClick={closeSidebar}
          aria-label="Chiudi menu"
          className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors z-10 cursor-pointer"
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
      <main className="flex-1 flex flex-col min-w-0 lg:ml-64 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0 relative">
        <div
          className="fixed inset-0 lg:left-64 pointer-events-none z-0 bg-rivo-grid opacity-[0.05] dark:opacity-[0.20]"
          aria-hidden="true"
        />

        {/* Top Command Bar */}
        <header className="h-14 border-b border-[var(--border-subtle)] px-4 sm:px-6 lg:px-8 flex items-center justify-between glass-chrome shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Apri menu di navigazione"
              className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 lg:hidden">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#09090B] border border-[#22242A] p-1">
                <Image
                  src="/brand/rivo-icon.png"
                  alt="RIVO"
                  width={18}
                  height={18}
                  priority
                  className="rounded-xs"
                />
              </div>
              <span className="font-display font-bold text-sm tracking-tight text-[var(--text-primary)]">
                RIVO
              </span>
            </div>

            {/* Breadcrumb Context */}
            <div className="hidden lg:flex items-center gap-2 text-xs text-[var(--text-secondary)] min-w-0">
              <span className="flex items-center gap-1.5 text-[var(--text-primary)] font-semibold truncate max-w-[200px]">
                <Building2
                  className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0"
                  strokeWidth={1.75}
                />
                <span className="truncate">{orgName || 'Attività'}</span>
              </span>
              <ChevronRight className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-secondary)] shrink-0">
                {verticalLabel}
              </span>
              {activeNavLabel && (
                <>
                  <ChevronRight className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                  <span className="text-[var(--text-primary)] font-semibold truncate">
                    {activeNavLabel}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <CommandPaletteTrigger onClick={() => setCommandOpen(true)} />
            {isRetailVertical && <SimpleModeToggle />}
            <ThemeToggle />

            {firstDeviceCode && (
              <Link
                href={`/hub/${firstDeviceCode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[32px] rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--rivo-volt)] text-[11px] font-bold text-[var(--text-primary)] transition-colors"
                title="Apri la vista cliente NFC live in una nuova scheda"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--rivo-volt)] shrink-0" />
                <span>Apri Hub Live</span>
                <ExternalLink className="w-3 h-3 text-[var(--text-muted)]" aria-hidden="true" />
              </Link>
            )}

            <Link href="/dashboard/devices" className="hidden sm:inline-flex">
              <StatusBadge
                tone={activeDeviceCount === 0 ? 'warning' : 'operational'}
                variant="soft"
                size="md"
                dot
                pulse={Boolean(activeDeviceCount && activeDeviceCount > 0)}
              >
                {activeDeviceCount === null
                  ? 'Rete Attiva'
                  : activeDeviceCount > 0
                  ? `${activeDeviceCount} Nodi Attivi`
                  : 'Configura Hardware'}
              </StatusBadge>
            </Link>
          </div>
        </header>

        <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto min-w-0">{children}</div>
      </main>

      {/* Mobile Bottom Navigation Dock (< 1024px) */}
      <nav
        aria-label="Navigazione rapida mobile"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-[var(--border-subtle)] glass-chrome px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]"
      >
        <div className="grid grid-cols-5 gap-1">
          {mobileDockItems.map((item) => {
            const Icon = item.icon;
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center justify-center min-h-[44px] rounded-lg px-1 py-1 text-[10px] font-medium transition-colors',
                  active
                    ? 'text-[var(--rivo-volt-text)] bg-[var(--bg-elevated)] font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                )}
              >
                <Icon className="w-4 h-4 mb-0.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                <span className="truncate max-w-full">{item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Apri menu completo"
            className="flex flex-col items-center justify-center min-h-[44px] rounded-lg px-1 py-1 text-[10px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <Menu className="w-4 h-4 mb-0.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span>Menu</span>
          </button>
        </div>
      </nav>

      {/* Live Cmd+K Command Palette */}
      <CommandPalette items={commandItems} open={commandOpen} onOpenChange={setCommandOpen} />

      {/* Floating Retail Copilot (cleared safely above mobile bottom dock) */}
      {(activeModules.has('products') ||
        activeModules.has('inventory') ||
        activeModules.has('sales')) && <RetailAICopilot />}
    </div>
  );
}
