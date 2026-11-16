'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Users,
  Download,
  Search,
  Wifi,
  Gift,
  Award,
  Mail,
  Phone,
  Plus,
  Edit3,
  X,
  Loader2,
  AlertCircle,
  DollarSign,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import { Customer } from '@/platform/retail/types';
import {
  EmptyState,
  KpiCard,
  PageHeader,
  SegmentedControl,
  StatusBadge,
  SurfaceCard,
} from '@/components/ui';
import { formatItCurrency } from '@/lib/chart-theme';

interface LeadItem {
  id: string;
  name: string | null;
  contact: string;
  source: 'wifi' | 'wheel' | 'loyalty';
  created_at: string;
}

interface CustomerWithSales extends Customer {
  sales?: Array<{
    id: string;
    sale_number: string;
    status: string;
    total_amount: number;
    payment_method: string;
    created_at: string;
    items?: Array<{
      product_name: string;
      variant_name: string | null;
      quantity: number;
      unit_price: number;
      total_price: number;
    }>;
  }>;
}

export default function CustomersAndLeadsPage() {
  const [activeTab, setActiveTab] = useState<'customers' | 'leads'>('customers');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');

  // Customer Modal State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [notes, setNotes] = useState('');
  const [fidelityPoints, setFidelityPoints] = useState('0');
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // View Customer Purchase History Modal
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithSales | null>(null);
  const [loadingCustomerDetails, setLoadingCustomerDetails] = useState(false);

  const fetchCustomersAndLeads = useCallback(async () => {
    const [custRes, leadsRes] = await Promise.all([
      fetch('/api/customers'),
      fetch('/api/leads'),
    ]);

    const [custData, leadsData] = await Promise.all([
      custRes.json().catch(() => ({ customers: [] })),
      leadsRes.json().catch(() => ({ leads: [] })),
    ]);

    return {
      customers: custRes.ok ? (custData.customers || []) : null,
      leads: leadsRes.ok ? (leadsData.leads || []) : null,
    };
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCustomersAndLeads();
      if (data.customers) setCustomers(data.customers);
      if (data.leads) setLeads(data.leads);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore nel caricamento clienti e lead';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [fetchCustomersAndLeads]);

  useEffect(() => {
    let active = true;
    async function initLeads() {
      try {
        const data = await fetchCustomersAndLeads();
        if (!active) return;
        setError(null);
        if (data.customers) setCustomers(data.customers);
        if (data.leads) setLeads(data.leads);
      } catch (err: unknown) {
        if (!active) return;
        const msg = err instanceof Error ? err.message : 'Errore nel caricamento clienti e lead';
        setError(msg);
      } finally {
        if (active) setLoading(false);
      }
    }
    void initLeads();
    return () => {
      active = false;
    };
  }, [fetchCustomersAndLeads]);

  // Escape key closes open modals
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (selectedCustomer) {
        setSelectedCustomer(null);
      } else if (isCustomerModalOpen) {
        setIsCustomerModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isCustomerModalOpen, selectedCustomer]);

  // Open Create Customer
  const handleOpenCreateCustomer = () => {
    setEditingCustomer(null);
    setFirstName('');
    setLastName('');
    setPhone('');
    setEmail('');
    setTaxCode('');
    setBirthdate('');
    setNotes('');
    setFidelityPoints('0');
    setModalError(null);
    setIsCustomerModalOpen(true);
  };

  // Open Edit Customer
  const handleOpenEditCustomer = (c: Customer) => {
    setEditingCustomer(c);
    setFirstName(c.first_name);
    setLastName(c.last_name || '');
    setPhone(c.phone || '');
    setEmail(c.email || '');
    setTaxCode(c.tax_code || '');
    setBirthdate(c.birthdate || '');
    setNotes(c.notes || '');
    setFidelityPoints((c.fidelity_points || 0).toString());
    setModalError(null);
    setIsCustomerModalOpen(true);
  };

  // View Customer Details & Purchases
  const handleViewCustomer = async (c: Customer) => {
    try {
      setLoadingCustomerDetails(true);
      setError(null);
      const res = await fetch(`/api/customers?id=${c.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore recupero scheda cliente');
      setSelectedCustomer({
        ...data.customer,
        sales: data.sales || [],
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Errore recupero scheda cliente');
    } finally {
      setLoadingCustomerDetails(false);
    }
  };

  // Save Customer Submit
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingCustomer(true);
      setModalError(null);

      const url = '/api/customers';
      const method = editingCustomer ? 'PATCH' : 'POST';
      const body = {
        id: editingCustomer?.id,
        first_name: firstName.trim(),
        last_name: lastName.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        tax_code: taxCode.trim() || null,
        birthdate: birthdate || null,
        notes: notes.trim() || null,
        fidelity_points: parseInt(fidelityPoints, 10) || 0,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore salvataggio cliente');

      setIsCustomerModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore';
      setModalError(msg);
    } finally {
      setSavingCustomer(false);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (activeTab === 'customers') {
      if (customers.length === 0) return;
      const headers = [
        'Nome',
        'Cognome',
        'Telefono',
        'Email',
        'Punti Fidelity',
        'Totale Speso (€)',
        'Numero Acquisti',
        'Ultimo Acquisto',
      ];
      const rows = customers.map((c) => [
        `"${c.first_name}"`,
        `"${c.last_name || ''}"`,
        `"${c.phone || ''}"`,
        `"${c.email || ''}"`,
        c.fidelity_points || 0,
        Number(c.total_spent || 0).toFixed(2),
        c.purchases_count || 0,
        `"${c.last_purchase_at ? new Date(c.last_purchase_at).toLocaleDateString('it-IT') : ''}"`,
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `RIVO_Clienti_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      if (leads.length === 0) return;
      const headers = ['Nome', 'Contatto', 'Canale Origine', 'Data Registrazione'];
      const rows = leads.map((l) => [
        `"${l.name || 'Anonimo'}"`,
        `"${l.contact}"`,
        `"${l.source}"`,
        `"${new Date(l.created_at).toLocaleString('it-IT')}"`,
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `RIVO_Leads_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Convert Lead to Customer Quick Action
  const handlePromoteLeadToCustomer = (l: LeadItem) => {
    setEditingCustomer(null);
    setFirstName(l.name || 'Cliente');
    setLastName('');
    if (l.contact.includes('@')) {
      setEmail(l.contact);
      setPhone('');
    } else {
      setPhone(l.contact);
      setEmail('');
    }
    setNotes(`Acquisito da canale: ${l.source}`);
    setFidelityPoints('0');
    setModalError(null);
    setIsCustomerModalOpen(true);
  };

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase().trim();
    return customers.filter(
      (c) =>
        c.first_name.toLowerCase().includes(q) ||
        (c.last_name || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.tax_code || '').toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return leads;
    const q = searchQuery.toLowerCase().trim();
    return leads.filter(
      (l) =>
        (l.name && l.name.toLowerCase().includes(q)) ||
        l.contact.toLowerCase().includes(q) ||
        l.source.toLowerCase().includes(q)
    );
  }, [leads, searchQuery]);

  // Customer Stats KPI
  const stats = useMemo(() => {
    let totalSpent = 0;
    let totalPurchases = 0;
    for (const c of customers) {
      totalSpent += Number(c.total_spent) || 0;
      totalPurchases += c.purchases_count || 0;
    }
    const avgBasket = totalPurchases > 0 ? totalSpent / totalPurchases : 0;
    return { totalCustomers: customers.length, totalSpent, totalPurchases, avgBasket };
  }, [customers]);

  return (
    <div className="space-y-6 min-w-0">
      <PageHeader
        eyebrow="Retail Customer Relationship Management"
        title="Clienti & CRM"
        description="Anagrafica clienti, storico acquisti scontrino per scontrino, punti fidelity e contatti acquisiti."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportCsv}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-[var(--text-primary)] px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-[var(--text-secondary)]" strokeWidth={1.75} aria-hidden="true" />
              <span>Esporta CSV</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreateCustomer}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] px-4 py-2 rounded-lg text-xs font-bold transition-[background-color,transform] duration-[180ms] active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
              <span>Nuovo Cliente</span>
            </button>
          </div>
        }
      />

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Clienti Anagrafica"
          value={stats.totalCustomers}
          icon={Users}
          tone="neutral"
          context="Profili cliente registrati"
          loading={loading}
        />
        <KpiCard
          label="Spesa Totale Cumulata"
          value={formatItCurrency(stats.totalSpent)}
          icon={DollarSign}
          tone="volt"
          context="Fatturato generato dai clienti"
          loading={loading}
        />
        <KpiCard
          label="Scontrino Medio Cliente"
          value={formatItCurrency(stats.avgBasket)}
          icon={TrendingUp}
          tone="neutral"
          context={`Su ${stats.totalPurchases} acquisti`}
          loading={loading}
        />
        <KpiCard
          label="Contatti & Leads Raccolti"
          value={leads.length}
          icon={Wifi}
          tone="telemetry"
          context="Da Wi-Fi, NFC, Fidelity & Ruota"
          loading={loading}
        />
      </div>

      {/* Tabs Switcher and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
        <div className="overflow-x-auto max-w-full">
          <SegmentedControl
            ariaLabel="Vista anagrafica"
            size="sm"
            value={activeTab}
            onChange={setActiveTab}
            options={[
              {
                value: 'customers',
                label: 'Anagrafica Clienti',
                icon: UserCheck,
                badge: customers.length,
              },
              {
                value: 'leads',
                label: 'Lead Raccolti Wi-Fi/NFC',
                icon: Wifi,
                badge: leads.length,
              },
            ]}
          />
        </div>

        <div className="relative w-full sm:w-72 min-w-0">
          <label htmlFor="crm-search" className="sr-only">
            Cerca clienti o lead
          </label>
          <Search
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <input
            id="crm-search"
            name="crmSearch"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'customers'
                ? 'Cerca cliente, telefono, email…'
                : 'Cerca lead o contatto…'
            }
            className="w-full min-h-[44px] bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-lg pl-9 pr-3 text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus-visible:border-[var(--text-primary)] transition-colors"
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="p-4 rounded-xl bg-[var(--accent-critical-bg)] border border-[var(--accent-critical-border)] text-[var(--accent-critical-text)] text-xs flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Chiudi errore"
            className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg hover:bg-[var(--bg-surface)]/40 shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Content based on Tab */}
      {loading ? (
        <SurfaceCard loading />
      ) : activeTab === 'customers' ? (
        /* Tab 1: Customers Table */
        <SurfaceCard radius="xl" padding="none">
          {filteredCustomers.length === 0 ? (
            <div className="p-5">
              <EmptyState
                compact
                icon={Users}
                title="Nessun cliente trovato"
                description='Nessun cliente trovato. Clicca "Nuovo Cliente" per registrare il primo profilo.'
                primaryAction={
                  customers.length === 0
                    ? {
                        label: 'Nuovo Cliente',
                        onClick: handleOpenCreateCustomer,
                        icon: Plus,
                      }
                    : undefined
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-mono text-[11px] uppercase tracking-[0.08em]">
                  <tr>
                    <th className="px-4 py-3.5 font-medium">Cliente</th>
                    <th className="px-4 py-3.5 font-medium">Contatti</th>
                    <th className="px-4 py-3.5 text-right font-medium">Spesa Totale</th>
                    <th className="px-4 py-3.5 text-right font-medium">Acquisti</th>
                    <th className="px-4 py-3.5 text-center font-medium">Punti Fidelity</th>
                    <th className="px-4 py-3.5 font-medium">Ultimo Acquisto</th>
                    <th className="px-4 py-3.5 text-right font-medium">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {filteredCustomers.map((c) => (
                    <tr
                      key={c.id}
                      className="min-h-[48px] hover:bg-[var(--bg-elevated)]/60 transition-colors"
                    >
                      <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">
                        <div>
                          {c.first_name} {c.last_name || ''}
                        </div>
                        {c.tax_code && (
                          <span
                            translate="no"
                            className="text-[11px] text-[var(--text-muted)] block font-mono font-normal"
                          >
                            CF: {c.tax_code}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">
                        {c.phone && (
                          <div className="flex items-center gap-1.5 font-mono tabular-nums text-[11px]">
                            <Phone className="w-3 h-3 text-[var(--text-muted)]" strokeWidth={1.75} aria-hidden="true" />
                            <span>{c.phone}</span>
                          </div>
                        )}
                        {c.email && (
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <Mail className="w-3 h-3 text-[var(--text-muted)]" strokeWidth={1.75} aria-hidden="true" />
                            <span>{c.email}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-[var(--text-primary)]">
                        {formatItCurrency(Number(c.total_spent || 0))}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-[var(--text-secondary)]">
                        {c.purchases_count || 0} ordini
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge tone="volt" icon={Award} mono>
                          {c.fidelity_points || 0} pt
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)] font-mono tabular-nums text-[11px]">
                        {c.last_purchase_at
                          ? new Date(c.last_purchase_at).toLocaleDateString('it-IT')
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={loadingCustomerDetails}
                            onClick={() => handleViewCustomer(c)}
                            className="min-h-[44px] px-2.5 text-xs font-semibold text-[var(--rivo-volt-text)] hover:underline cursor-pointer disabled:opacity-50"
                          >
                            Scheda & Acquisti
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditCustomer(c)}
                            aria-label={`Modifica ${c.first_name} ${c.last_name || ''}`.trim()}
                            title="Modifica cliente"
                            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SurfaceCard>
      ) : (
        /* Tab 2: Leads Table (Wi-Fi, NFC, Wheel, Loyalty contacts) */
        <SurfaceCard radius="xl" padding="none">
          {filteredLeads.length === 0 ? (
            <div className="p-5">
              <EmptyState
                compact
                icon={Wifi}
                title="Nessun contatto lead registrato"
                description="Nessun contatto lead registrato tramite QR/NFC."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-mono text-[11px] uppercase tracking-[0.08em]">
                  <tr>
                    <th className="px-4 py-3.5 font-medium">Contatto</th>
                    <th className="px-4 py-3.5 font-medium">Nome Indicato</th>
                    <th className="px-4 py-3.5 font-medium">Canale Acquisizione</th>
                    <th className="px-4 py-3.5 font-medium">Data e Ora</th>
                    <th className="px-4 py-3.5 text-right font-medium">Azione</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {filteredLeads.map((l) => (
                    <tr
                      key={l.id}
                      className="min-h-[48px] hover:bg-[var(--bg-elevated)]/60 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono tabular-nums font-medium text-[var(--text-primary)]">
                        {l.contact}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">
                        {l.name || 'Anonimo'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          tone={
                            l.source === 'wifi'
                              ? 'telemetry'
                              : l.source === 'wheel'
                              ? 'volt'
                              : 'warning'
                          }
                          icon={
                            l.source === 'wifi'
                              ? Wifi
                              : l.source === 'wheel'
                              ? Gift
                              : Award
                          }
                          mono
                        >
                          {l.source}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)] font-mono tabular-nums text-[11px]">
                        {new Date(l.created_at).toLocaleString('it-IT')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handlePromoteLeadToCustomer(l)}
                          className="min-h-[44px] px-2.5 text-xs font-semibold text-[var(--rivo-volt-text)] hover:underline cursor-pointer"
                        >
                          Converti in Cliente
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SurfaceCard>
      )}

      {/* CREATE / EDIT CUSTOMER MODAL */}
      {isCustomerModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="customer-modal-title"
          onClick={() => setIsCustomerModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-backdrop)] backdrop-blur-sm overscroll-contain"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto overscroll-contain"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[var(--rivo-volt-bg)] border border-[var(--rivo-volt-border)] flex items-center justify-center text-[var(--rivo-volt-text)] shrink-0">
                  <Users className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                </div>
                <h2
                  id="customer-modal-title"
                  className="font-display text-base sm:text-lg font-bold text-[var(--text-primary)] truncate"
                >
                  {editingCustomer ? 'Modifica Scheda Cliente' : 'Nuovo Cliente'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(false)}
                aria-label="Chiudi modale"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {modalError && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-[var(--accent-critical-bg)] border border-[var(--accent-critical-border)] text-[var(--accent-critical-text)] text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCustomer} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="cust-first-name"
                    className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
                  >
                    Nome *
                  </label>
                  <input
                    id="cust-first-name"
                    name="firstName"
                    type="text"
                    required
                    placeholder="Mario…"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full min-h-[44px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus-visible:border-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="cust-last-name"
                    className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
                  >
                    Cognome
                  </label>
                  <input
                    id="cust-last-name"
                    name="lastName"
                    type="text"
                    placeholder="Rossi…"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full min-h-[44px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus-visible:border-[var(--text-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="cust-phone"
                    className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
                  >
                    Telefono / WhatsApp
                  </label>
                  <input
                    id="cust-phone"
                    name="phone"
                    type="tel"
                    placeholder="+39 333 1234567…"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full min-h-[44px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] font-mono placeholder:text-[var(--text-muted)] focus:outline-none focus-visible:border-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="cust-email"
                    className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
                  >
                    Email
                  </label>
                  <input
                    id="cust-email"
                    name="email"
                    type="email"
                    spellCheck={false}
                    placeholder="mario.rossi@email.it…"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full min-h-[44px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus-visible:border-[var(--text-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="cust-tax-code"
                    className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
                  >
                    Codice Fiscale
                  </label>
                  <input
                    id="cust-tax-code"
                    name="taxCode"
                    type="text"
                    spellCheck={false}
                    placeholder="RSSMRA80A01F205X…"
                    value={taxCode}
                    onChange={(e) => setTaxCode(e.target.value.toUpperCase())}
                    className="w-full min-h-[44px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] font-mono placeholder:text-[var(--text-muted)] focus:outline-none focus-visible:border-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="cust-fidelity-points"
                    className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
                  >
                    Punti Fidelity
                  </label>
                  <input
                    id="cust-fidelity-points"
                    name="fidelityPoints"
                    type="number"
                    min="0"
                    value={fidelityPoints}
                    onChange={(e) => setFidelityPoints(e.target.value)}
                    className="w-full min-h-[44px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] font-mono tabular-nums focus:outline-none focus-visible:border-[var(--text-primary)]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="cust-notes"
                  className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
                >
                  Note Preferenze Cliente (Taglia abituale, gusti, ecc.)
                </label>
                <textarea
                  id="cust-notes"
                  name="notes"
                  rows={2}
                  placeholder="es. Preferisce sneakers numero 42, interessato a nuovi arrivi brand Borrelli…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus-visible:border-[var(--text-primary)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="min-h-[44px] px-4 py-2 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={savingCustomer}
                  className="min-h-[44px] inline-flex items-center gap-2 bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] px-5 py-2 rounded-lg text-xs font-bold disabled:opacity-50 active:scale-[0.98] transition-[background-color,transform] duration-[180ms] cursor-pointer"
                >
                  {savingCustomer && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
                  <span>{editingCustomer ? 'Aggiorna Profilo' : 'Crea Profilo Cliente'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW CUSTOMER PROFILE & PURCHASE HISTORY MODAL */}
      {selectedCustomer && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="customer-detail-title"
          onClick={() => setSelectedCustomer(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-backdrop)] backdrop-blur-sm overscroll-contain"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl max-w-2xl w-full p-5 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto overscroll-contain"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[var(--rivo-volt-bg)] border border-[var(--rivo-volt-border)] flex items-center justify-center text-[var(--rivo-volt-text)] shrink-0">
                  <UserCheck className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h2
                    id="customer-detail-title"
                    className="font-display text-lg font-bold text-[var(--text-primary)] truncate"
                  >
                    {selectedCustomer.first_name} {selectedCustomer.last_name || ''}
                  </h2>
                  <span className="text-xs font-mono tabular-nums text-[var(--text-muted)]">
                    Cliente dal {new Date(selectedCustomer.created_at).toLocaleDateString('it-IT')}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                aria-label="Chiudi scheda cliente"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Quick customer stat pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                <span className="text-[11px] font-mono text-[var(--text-muted)] font-semibold uppercase tracking-wider">
                  Spesa Storica
                </span>
                <div className="text-base font-bold font-mono tabular-nums text-[var(--text-primary)] mt-1">
                  {formatItCurrency(Number(selectedCustomer.total_spent || 0))}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                <span className="text-[11px] font-mono text-[var(--text-muted)] font-semibold uppercase tracking-wider">
                  Acquisti Effettuati
                </span>
                <div className="text-base font-bold font-mono tabular-nums text-[var(--text-primary)] mt-1">
                  {selectedCustomer.purchases_count || 0}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                <span className="text-[11px] font-mono text-[var(--text-muted)] font-semibold uppercase tracking-wider">
                  Punti Fidelity
                </span>
                <div className="text-base font-bold font-mono tabular-nums text-[var(--rivo-volt-text)] mt-1">
                  {selectedCustomer.fidelity_points || 0} pt
                </div>
              </div>
            </div>

            {selectedCustomer.notes && (
              <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs">
                <span className="font-semibold text-[var(--text-muted)] block mb-1">
                  Note Cliente:
                </span>
                <p className="text-[var(--text-primary)]">{selectedCustomer.notes}</p>
              </div>
            )}

            {/* Purchase History */}
            <div className="space-y-2.5 border-t border-[var(--border-subtle)] pt-3">
              <h3 className="text-xs font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider tabular-nums">
                Storico Scontrini & Acquisti ({selectedCustomer.sales?.length || 0})
              </h3>

              <div className="space-y-2 max-h-60 overflow-y-auto overscroll-contain">
                {!selectedCustomer.sales || selectedCustomer.sales.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                    Nessun acquisto ancora registrato a cassa per questo cliente.
                  </div>
                ) : (
                  selectedCustomer.sales.map((s) => (
                    <div
                      key={s.id}
                      className="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-[var(--text-primary)]">
                          {s.sale_number}
                        </span>
                        <span className="font-mono tabular-nums font-bold text-[var(--rivo-volt-text)]">
                          {formatItCurrency(Number(s.total_amount))}
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between gap-2">
                        <span className="font-mono tabular-nums">
                          {new Date(s.created_at).toLocaleString('it-IT')}
                        </span>
                        <span className="capitalize">{s.payment_method}</span>
                      </div>
                      {s.items && s.items.length > 0 && (
                        <div className="pt-1.5 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)] space-y-0.5">
                          {s.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between gap-2">
                              <span className="truncate">
                                {it.product_name} {it.variant_name ? `(${it.variant_name})` : ''} ×{' '}
                                <span className="font-mono tabular-nums">{it.quantity}</span>
                              </span>
                              <span className="font-mono tabular-nums shrink-0">
                                {formatItCurrency(Number(it.total_price))}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="min-h-[44px] px-4 py-2 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-strong)] text-xs font-semibold text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
