'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Building2,
  Layers,
  PlusCircle,
  ArrowLeft,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  LayoutDashboard,
  Radar,
  Search,
  Users,
  Cpu,
  Megaphone,
  MessageSquare,
  Kanban,
  SlidersHorizontal,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/cn';

const adminNavItems = [
  { label: 'Command Center', href: '/admin', icon: LayoutDashboard },
  { label: 'Organizzazioni', href: '/admin/organizations', icon: Building2 },
  { label: 'Tutti i Dispositivi', href: '/admin/devices', icon: Layers },
];

const outreachNavItems = [
  { label: 'Overview', href: '/admin/outreach', icon: Radar, exact: true },
  { label: 'Ricerca attività', href: '/admin/outreach/discovery', icon: Search },
  { label: 'Prospect', href: '/admin/outreach/prospects', icon: Users },
  { label: 'AI Intelligence', href: '/admin/outreach/intelligence', icon: Cpu },
  { label: 'Campagne', href: '/admin/outreach/campaigns', icon: Megaphone },
  { label: 'Comunicazioni', href: '/admin/outreach/communications', icon: MessageSquare },
  { label: 'Pipeline commerciale', href: '/admin/outreach/pipeline', icon: Kanban },
  { label: 'Impostazioni', href: '/admin/outreach/settings', icon: SlidersHorizontal },
];

interface AdminSidebarContentProps {
  pathname: string;
  onLogout: () => void;
  onNavigate?: () => void;
}

function AdminSidebarContent({ pathname, onLogout, onNavigate }: AdminSidebarContentProps) {
  return (
    <>
      <div>
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-2.5 py-3 mb-4 border-b border-[#22242A]">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#09090B] border border-[#22242A] p-1">
            <Image
              src="/brand/rivo-icon.png"
              alt="RIVO"
              width={20}
              height={20}
              className="rounded-xs"
            />
          </div>
          <div>
            <span className="font-display font-bold text-base tracking-tight text-[#F4F4F6] block leading-tight">
              RIVO
            </span>
            <span className="text-[10px] uppercase font-mono tracking-[0.14em] text-[#BFFF00]">
              Admin HQ
            </span>
          </div>
        </div>

        {/* Quick action */}
        <div className="px-1 mb-4">
          <Link
            href="/admin/organizations/new"
            onClick={onNavigate}
            className="w-full bg-[#BFFF00] hover:bg-[#CEFF33] text-[#09090B] font-bold text-xs min-h-[44px] px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
          >
            <PlusCircle className="w-4 h-4" strokeWidth={1.75} />
            <span>Nuova Attività</span>
          </Link>
        </div>

        {/* Nav List */}
        <nav className="space-y-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-3 px-3 min-h-[40px] rounded-lg text-[13px] font-medium transition-colors border-l-2',
                  isActive
                    ? 'bg-[#18191E] text-[#BFFF00] border-[#BFFF00] font-semibold'
                    : 'border-transparent text-[#A1A1AA] hover:text-[#F4F4F6] hover:bg-[#18191E]/60'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* OUTREACH Module Section */}
        <div className="mt-6 pt-5 border-t border-[#22242A]">
          <div className="px-3 mb-2 flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-[#BFFF00]">
              OUTREACH
            </span>
            <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#18191E] border border-[#22242A] text-[#A1A1AA]">
              BI &amp; SALES
            </span>
          </div>
          <nav className="space-y-0.5">
            {outreachNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center gap-2.5 px-3 min-h-[38px] rounded-lg text-xs font-medium transition-colors border-l-2',
                    isActive
                      ? 'bg-[#18191E] text-[#BFFF00] border-[#BFFF00] font-semibold'
                      : 'border-transparent text-[#A1A1AA] hover:text-[#F4F4F6] hover:bg-[#18191E]/60'
                  )}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer / Switch to client dashboard & logout */}
      <div className="pt-4 border-t border-[#22242A] space-y-1">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-3 w-full px-3 min-h-[44px] rounded-lg text-xs font-medium text-[#A1A1AA] hover:text-[#F4F4F6] hover:bg-[#18191E] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" strokeWidth={1.75} />
          <span>Portale Clienti</span>
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 min-h-[44px] rounded-lg text-xs font-medium text-[#A1A1AA] hover:text-[#F87171] hover:bg-[#EF4444]/10 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" strokeWidth={1.75} />
          <span>Esci dall&apos;Admin</span>
        </button>
      </div>
    </>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function checkAdmin() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.replace('/login');
          return;
        }
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('auth_user_id', user.id)
          .single();

        if (!isMounted) return;
        if (profile?.role !== 'admin') {
          router.replace('/dashboard');
        } else {
          setIsAdmin(true);
        }
      } catch {
        router.replace('/dashboard');
      }
    }
    checkAdmin();
    return () => {
      isMounted = false;
    };
  }, [router]);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-[#BFFF00] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-[#71717A] font-mono tracking-wider uppercase">
            Verifica privilegi RIVO…
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="dark flex min-h-screen bg-[#09090B] text-[#F4F4F6] font-sans overflow-x-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-[#22242A] flex-col justify-between p-4 bg-[#111215] shrink-0 fixed inset-y-0 left-0 z-30">
        <AdminSidebarContent pathname={pathname} onLogout={handleLogout} />
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-200"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[#111215] border-r border-[#22242A] flex flex-col justify-between p-4 transform transition-transform duration-200 ease-out lg:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Menu amministrazione mobile"
      >
        <button
          type="button"
          onClick={closeSidebar}
          aria-label="Chiudi menu"
          className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[#A1A1AA] hover:text-white hover:bg-[#18191E] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        <AdminSidebarContent
          pathname={pathname}
          onLogout={handleLogout}
          onNavigate={closeSidebar}
        />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto overflow-x-hidden lg:ml-64">
        {/* Header */}
        <header className="h-14 border-b border-[#22242A] px-4 sm:px-6 flex items-center justify-between bg-[#09090B]/95 backdrop-blur shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Apri menu amministrazione"
              className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-[#18191E] transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 lg:hidden">
              <Image
                src="/brand/rivo-icon.png"
                alt="RIVO"
                width={20}
                height={20}
                className="rounded-xs"
              />
              <span className="font-display font-bold text-sm tracking-tight text-white">
                RIVO Admin
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-2 text-xs font-mono uppercase tracking-[0.1em] text-[#A1A1AA]">
              <ShieldCheck className="w-4 h-4 text-[#BFFF00]" strokeWidth={1.75} />
              <span>Command Center Superadmin</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/admin/organizations/new"
              className="hidden sm:inline-flex items-center gap-1.5 bg-[#BFFF00] hover:bg-[#CEFF33] text-[#09090B] font-bold text-xs px-3.5 min-h-[38px] rounded-lg transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Nuova Attività</span>
            </Link>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#22242A] bg-[#111215] px-2.5 py-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#BFFF00]" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#A1A1AA] hidden sm:inline">
                Admin Online
              </span>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto min-w-0 overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
