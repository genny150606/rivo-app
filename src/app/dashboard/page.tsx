import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { 
  Smartphone, 
  QrCode, 
  Layers, 
  Activity, 
  ArrowUpRight, 
  Radio, 
  BellRing, 
  ExternalLink,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { getVertical } from '@/platform/verticals/registry';
import { BusinessTypeSlug } from '@/platform/modules/registry';
import RetailDashboardOverview from '@/components/dashboard/RetailDashboardOverview';

export const dynamic = 'force-dynamic';

interface InteractionSummary {
  interaction_type: string;
  timestamp: string;
  device_id: string;
}

interface DeviceSummary {
  id: string;
  name: string;
  unique_code: string;
}

export default async function DashboardOverview() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  let orgName = 'La tua attività';
  let totalInteractions = 0;
  let nfcInteractions = 0;
  let qrInteractions = 0;
  let activeDevicesCount = 0;
  let totalDevicesCount = 0;
  let recentInteractions: InteractionSummary[] = [];
  const deviceMap = new Map<string, string>();
  let activeServiceCallsCount = 0;

  if (user) {
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

    if (targetOrgId) {
      const { data: org } = await supabase
        .from('organizations')
        .select('name, category, business_type')
        .eq('id', targetOrgId)
        .single();
      if (org) orgName = org.name;

      const bType = ((org as any)?.business_type || org?.category || 'restaurant') as BusinessTypeSlug;
      const vertical = getVertical(bType);
      const isRetail = vertical?.dashboardType === 'retail';

      // RETAIL VERTICAL DASHBOARD BRANCH
      if (isRetail) {
        // Fetch retail sales
        const { data: retailSales } = await supabase
          .from('sales')
          .select(`
            id,
            sale_number,
            status,
            total_amount,
            subtotal,
            cost_total,
            gross_margin,
            payment_method,
            operator_name,
            created_at,
            customer:customers (first_name, last_name),
            items:sale_items (
              product_name,
              variant_name,
              quantity,
              unit_price,
              total_price
            )
          `)
          .eq('organization_id', targetOrgId)
          .order('created_at', { ascending: false })
          .limit(100);

        // Fetch retail stock balances
        const { data: balances } = await supabase
          .from('inventory_balances')
          .select(`
            id,
            quantity_on_hand,
            variant:product_variants (
              id,
              size,
              color,
              reorder_threshold,
              cost_price,
              sale_price,
              product:products (
                id,
                name,
                brand,
                cost_price,
                sale_price
              )
            )
          `)
          .eq('organization_id', targetOrgId);

        // Count customers and products
        const { count: custCount } = await supabase
          .from('customers')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', targetOrgId);

        const { count: prodCount } = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', targetOrgId);

        const formattedSales = (retailSales || []).map((s: any) => ({
          ...s,
          customer_name: s.customer ? `${s.customer.first_name} ${s.customer.last_name || ''}`.trim() : null,
        }));

        return (
          <RetailDashboardOverview
            orgId={targetOrgId}
            orgName={org?.name || 'Retail Store'}
            businessType={bType}
            sales={formattedSales}
            balances={(balances as any) || []}
            customersCount={custCount || 0}
            totalProductsCount={prodCount || 0}
          />
        );
      }

      // RESTAURANT / HOSPITALITY FLEET CONTROL ROOM BRANCH
      const { data: interactions } = await supabase
        .from('interactions')
        .select('interaction_type, timestamp, device_id')
        .eq('organization_id', targetOrgId)
        .order('timestamp', { ascending: false });

      if (interactions) {
        totalInteractions = interactions.length;
        nfcInteractions = interactions.filter((i) => i.interaction_type === 'nfc').length;
        qrInteractions = interactions.filter((i) => i.interaction_type === 'qr').length;
        recentInteractions = interactions.slice(0, 8) as InteractionSummary[];
      }

      // Fetch devices for label mapping
      const { data: devices } = await supabase
        .from('devices')
        .select('id, name, unique_code, status')
        .eq('organization_id', targetOrgId);

      if (devices) {
        totalDevicesCount = devices.length;
        activeDevicesCount = devices.filter((d) => d.status === 'active').length;
        devices.forEach((d: DeviceSummary) => {
          deviceMap.set(d.id, d.name || d.unique_code || 'Tavolo / Postazione');
        });
      }

      // Fetch active service calls count
      const { count: pendingCalls } = await supabase
        .from('service_calls')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', targetOrgId)
        .in('status', ['pending', 'in_progress']);

      activeServiceCallsCount = pendingCalls || 0;
    }
  }

  const nfcRatio = totalInteractions > 0 ? Math.round((nfcInteractions / totalInteractions) * 100) : 0;
  const qrRatio = totalInteractions > 0 ? Math.round((qrInteractions / totalInteractions) * 100) : 0;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header with Organization Context & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200/80 dark:border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              {orgName}
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-700/60">
              Live Fleet
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Control Room unificata per ingressi contactless, richieste di servizio e telemetria dei tavoli.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeServiceCallsCount > 0 && (
            <Link
              href="/dashboard/service"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-colors"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>{activeServiceCallsCount} in Sala</span>
            </Link>
          )}
          <Link
            href="/dashboard/analytics"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition-colors"
          >
            <span>Analisi Dettagliata</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Metric Cards - Linear / Stripe Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Interactions */}
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-white/[0.07] rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-xs hover:border-zinc-300 dark:hover:border-white/[0.12] transition-colors">
          <div>
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-3">
              <span className="text-[11px] font-medium uppercase tracking-wider">Interazioni Totali</span>
              <Activity className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            </div>
            <div className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 font-mono">
              {totalInteractions.toLocaleString('it-IT')}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
            <span>Volume complessivo</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-200">Sincronizzato</span>
          </div>
        </div>

        {/* NFC Tap Card */}
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-white/[0.07] rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-xs hover:border-zinc-300 dark:hover:border-white/[0.12] transition-colors">
          <div>
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-3">
              <span className="text-[11px] font-medium uppercase tracking-wider">Tap NFC Fisici</span>
              <Smartphone className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            </div>
            <div className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 font-mono">
              {nfcInteractions.toLocaleString('it-IT')}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px]">
            <span className="text-zinc-500 dark:text-zinc-400">Mix di accesso</span>
            <span className="font-medium font-mono text-emerald-600 dark:text-emerald-400">
              {nfcRatio}% quota
            </span>
          </div>
        </div>

        {/* QR Code Scans */}
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-white/[0.07] rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-xs hover:border-zinc-300 dark:hover:border-white/[0.12] transition-colors">
          <div>
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-3">
              <span className="text-[11px] font-medium uppercase tracking-wider">Scansioni QR Code</span>
              <QrCode className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            </div>
            <div className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 font-mono">
              {qrInteractions.toLocaleString('it-IT')}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px]">
            <span className="text-zinc-500 dark:text-zinc-400">Mix di accesso</span>
            <span className="font-medium font-mono text-blue-600 dark:text-blue-400">
              {qrRatio}% quota
            </span>
          </div>
        </div>

        {/* Active Smart Devices */}
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-white/[0.07] rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-xs hover:border-zinc-300 dark:hover:border-white/[0.12] transition-colors">
          <div>
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-3">
              <span className="text-[11px] font-medium uppercase tracking-wider">Dispositivi Attivi</span>
              <Radio className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            </div>
            <div className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 font-mono">
              {activeDevicesCount}
              <span className="text-sm font-normal text-zinc-400 ml-1">/ {totalDevicesCount}</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px]">
            <span className="text-zinc-500 dark:text-zinc-400">Rete hardware</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Telemetry & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Hub Telemetry Breakdown */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-white/[0.07] rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">
                Canali di Acquisizione
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Ripartizione del traffico cliente tra tecnologia Near-Field e codici ottici.
              </p>
            </div>
            <span className="text-xs font-mono text-zinc-400">Aggiornato in tempo reale</span>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs mb-1.5 font-medium">
                <span className="text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-500" /> Tap NFC (High Intent)
                </span>
                <span className="font-mono text-zinc-950 dark:text-zinc-100">{nfcInteractions} ({nfcRatio}%)</span>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${nfcRatio}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5 font-medium">
                <span className="text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-blue-500" /> Scansioni QR (Fotocamera)
                </span>
                <span className="font-mono text-zinc-950 dark:text-zinc-100">{qrInteractions} ({qrRatio}%)</span>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${qrRatio}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
            <span>Hardware RIVO attivo sul punto vendita</span>
            <Link 
              href="/dashboard/devices" 
              className="text-zinc-900 dark:text-zinc-200 font-medium hover:underline inline-flex items-center gap-1"
            >
              Configura Tag NFC & QR <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Right: Live Stream of Recent Scans */}
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-white/[0.07] rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Live Feed Interazioni
              </h2>
              <span className="text-[11px] text-zinc-400 font-mono">ultimi eventi</span>
            </div>

            <div className="space-y-3">
              {recentInteractions.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-400">
                  Nessuna interazione recente registrata.
                </div>
              ) : (
                recentInteractions.map((evt, idx) => {
                  const label = deviceMap.get(evt.device_id) || 'Tavolo / Punto Interattivo';
                  const isNfc = evt.interaction_type === 'nfc';
                  const timeStr = new Date(evt.timestamp).toLocaleTimeString('it-IT', {
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between text-xs py-1.5 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        {isNfc ? (
                          <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                            <Smartphone className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-md bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                            <QrCode className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-zinc-900 dark:text-zinc-100 block">
                            {label}
                          </span>
                          <span className="text-[10px] text-zinc-400 uppercase tracking-wider">
                            {isNfc ? 'Tap NFC' : 'Scansione Ottica'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-zinc-400">{timeStr}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 text-center">
            <Link
              href="/dashboard/analytics"
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors font-medium"
            >
              Apri archivio completo interazioni →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
