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
  Calendar, 
  RefreshCw,
  Plus,
  ShoppingBag,
  CreditCard,
  Edit3,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { Customer } from '@/platform/retail/types';

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

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [custRes, leadsRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/leads'),
      ]);

      const [custData, leadsData] = await Promise.all([
        custRes.json().catch(() => ({ customers: [] })),
        leadsRes.json().catch(() => ({ leads: [] })),
      ]);

      if (custRes.ok) setCustomers(custData.customers || []);
      if (leadsRes.ok) setLeads(leadsData.leads || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore nel caricamento clienti e lead';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      const res = await fetch(`/api/customers?id=${c.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore recupero scheda cliente');
      setSelectedCustomer({
        ...data.customer,
        sales: data.sales || [],
      });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Errore');
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
      const headers = ['Nome', 'Cognome', 'Telefono', 'Email', 'Punti Fidelity', 'Totale Speso (€)', 'Numero Acquisti', 'Ultimo Acquisto'];
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

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
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

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
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
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
            <Users className="w-3.5 h-3.5 text-lime-500 dark:text-[#bfff00]" />
            <span>Retail Customer Relationship Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Clienti & CRM
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-2xl">
            Anagrafica clienti, storico acquisti scontrino per scontrino, punti fidelity e contatti acquisiti.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center justify-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 px-3.5 py-2.5 rounded-xl text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-2xs"
          >
            <Download className="w-4 h-4 text-zinc-500" />
            <span className="hidden md:inline">Esporta CSV</span>
          </button>

          <button
            onClick={handleOpenCreateCustomer}
            className="inline-flex items-center justify-center gap-2 bg-[#bfff00] text-black px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-[#a8e600] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nuovo Cliente</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xs">
          <span className="text-xs text-zinc-500 font-medium">Clienti Anagrafica</span>
          <div className="text-2xl font-bold text-zinc-950 dark:text-white font-mono mt-1">
            {stats.totalCustomers}
          </div>
          <span className="text-[11px] text-zinc-400 mt-1 block">
            Profili cliente registrati
          </span>
        </div>

        <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xs">
          <span className="text-xs text-zinc-500 font-medium">Spesa Totale Cumulata</span>
          <div className="text-2xl font-bold text-lime-600 dark:text-[#bfff00] font-mono mt-1">
            € {stats.totalSpent.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-zinc-400 mt-1 block">
            Fatturato generato dai clienti
          </span>
        </div>

        <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xs">
          <span className="text-xs text-zinc-500 font-medium">Scontrino Medio Cliente</span>
          <div className="text-2xl font-bold text-zinc-950 dark:text-white font-mono mt-1">
            € {stats.avgBasket.toFixed(2)}
          </div>
          <span className="text-[11px] text-zinc-400 mt-1 block">
            Su {stats.totalPurchases} acquisti
          </span>
        </div>

        <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xs">
          <span className="text-xs text-zinc-500 font-medium">Contatti & Leads Raccolti</span>
          <div className="text-2xl font-bold text-zinc-950 dark:text-white font-mono mt-1">
            {leads.length}
          </div>
          <span className="text-[11px] text-zinc-400 mt-1 block">
            Da Wi-Fi, NFC, Fidelity & Ruota
          </span>
        </div>
      </div>

      {/* Tabs Switcher and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'customers'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-[#bfff00]" />
            <span>Anagrafica Clienti ({customers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('leads')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'leads'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Lead Raccolti Wi-Fi/NFC ({leads.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder={activeTab === 'customers' ? 'Cerca cliente, telefono, email...' : 'Cerca lead o contatto...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Content based on Tab */}
      {loading ? (
        <div className="p-16 text-center text-zinc-400 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#bfff00]" />
          <span className="text-xs">Caricamento anagrafiche in corso...</span>
        </div>
      ) : activeTab === 'customers' ? (
        /* Tab 1: Customers Table */
        <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Contatti</th>
                  <th className="px-4 py-3 text-right">Spesa Totale</th>
                  <th className="px-4 py-3 text-right">Acquisti</th>
                  <th className="px-4 py-3 text-center">Punti Fidelity</th>
                  <th className="px-4 py-3">Ultimo Acquisto</th>
                  <th className="px-4 py-3 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-zinc-400">
                      Nessun cliente trovato. Clicca &quot;Nuovo Cliente&quot; per registrare il primo profilo.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-zinc-950 dark:text-white">
                        <div>{c.first_name} {c.last_name || ''}</div>
                        {c.tax_code && (
                          <span className="text-[10px] text-zinc-400 block font-mono font-normal">
                            CF: {c.tax_code}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-500">
                        {c.phone && (
                          <div className="flex items-center gap-1 font-mono text-[11px]">
                            <Phone className="w-3 h-3 text-zinc-400" />
                            <span>{c.phone}</span>
                          </div>
                        )}
                        {c.email && (
                          <div className="flex items-center gap-1 text-[11px]">
                            <Mail className="w-3 h-3 text-zinc-400" />
                            <span>{c.email}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-zinc-950 dark:text-white">
                        € {Number(c.total_spent || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-600 dark:text-zinc-300">
                        {c.purchases_count || 0} ordini
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-lime-500/10 text-lime-600 dark:text-[#bfff00] border border-lime-500/20">
                          <Award className="w-3 h-3" />
                          <span>{c.fidelity_points || 0} pt</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 font-mono text-[11px]">
                        {c.last_purchase_at ? new Date(c.last_purchase_at).toLocaleDateString('it-IT') : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleViewCustomer(c)}
                            className="text-xs font-medium text-lime-600 dark:text-[#bfff00] hover:underline"
                          >
                            Scheda & Acquisti
                          </button>
                          <button
                            onClick={() => handleOpenEditCustomer(c)}
                            className="p-1 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Tab 2: Leads Table (Wi-Fi, NFC, Wheel, Loyalty contacts) */
        <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Contatto</th>
                  <th className="px-4 py-3">Nome Indicato</th>
                  <th className="px-4 py-3">Canale Acquisizione</th>
                  <th className="px-4 py-3">Data e Ora</th>
                  <th className="px-4 py-3 text-right">Azione</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-zinc-400">
                      Nessun contatto lead registrato tramite QR/NFC.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((l) => (
                    <tr key={l.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-zinc-900 dark:text-white">
                        {l.contact}
                      </td>
                      <td className="px-4 py-3 text-zinc-500">
                        {l.name || 'Anonimo'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {l.source === 'wifi' && <Wifi className="w-3 h-3 text-blue-500" />}
                          {l.source === 'wheel' && <Gift className="w-3 h-3 text-pink-500" />}
                          {l.source === 'loyalty' && <Award className="w-3 h-3 text-amber-500" />}
                          <span className="capitalize">{l.source}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 font-mono text-[11px]">
                        {new Date(l.created_at).toLocaleString('it-IT')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handlePromoteLeadToCustomer(l)}
                          className="text-xs font-semibold text-lime-600 dark:text-[#bfff00] hover:underline"
                        >
                          Converti in Cliente
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT CUSTOMER MODAL */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#bfff00]" />
                <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
                  {editingCustomer ? 'Modifica Scheda Cliente' : 'Nuovo Cliente'}
                </h2>
              </div>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCustomer} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Mario"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Cognome
                  </label>
                  <input
                    type="text"
                    placeholder="Rossi"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Telefono / WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="+39 333 1234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="mario.rossi@email.it"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Codice Fiscale
                  </label>
                  <input
                    type="text"
                    placeholder="RSSMRA80A01F205X"
                    value={taxCode}
                    onChange={(e) => setTaxCode(e.target.value.toUpperCase())}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Punti Fidelity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={fidelityPoints}
                    onChange={(e) => setFidelityPoints(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Note Preferenze Cliente (Taglia abituale, gusti, ecc.)
                </label>
                <textarea
                  rows={2}
                  placeholder="es. Preferisce sneakers numero 42, interessato a nuovi arrivi brand Borrelli..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={savingCustomer}
                  className="inline-flex items-center gap-2 bg-[#bfff00] text-black px-5 py-2 rounded-xl text-xs font-semibold hover:bg-[#a8e600] disabled:opacity-50"
                >
                  {savingCustomer && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingCustomer ? 'Aggiorna Profilo' : 'Crea Profilo Cliente'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW CUSTOMER PROFILE & PURCHASE HISTORY MODAL */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#bfff00]" />
                <div>
                  <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
                    {selectedCustomer.first_name} {selectedCustomer.last_name || ''}
                  </h2>
                  <span className="text-xs text-zinc-400">
                    Cliente dal {new Date(selectedCustomer.created_at).toLocaleDateString('it-IT')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick customer stat pills */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] text-zinc-400 font-semibold uppercase">Spesa Storica</span>
                <div className="text-base font-bold font-mono text-zinc-950 dark:text-white mt-0.5">
                  € {Number(selectedCustomer.total_spent || 0).toFixed(2)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] text-zinc-400 font-semibold uppercase">Acquisti Effettuati</span>
                <div className="text-base font-bold font-mono text-zinc-950 dark:text-white mt-0.5">
                  {selectedCustomer.purchases_count || 0}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] text-zinc-400 font-semibold uppercase">Punti Fidelity</span>
                <div className="text-base font-bold font-mono text-lime-600 dark:text-[#bfff00] mt-0.5">
                  {selectedCustomer.fidelity_points || 0} pt
                </div>
              </div>
            </div>

            {selectedCustomer.notes && (
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs">
                <span className="font-semibold text-zinc-400 block mb-0.5">Note Cliente:</span>
                <p className="text-zinc-700 dark:text-zinc-300">{selectedCustomer.notes}</p>
              </div>
            )}

            {/* Purchase History */}
            <div className="space-y-2 border-t border-zinc-200 dark:border-zinc-800 pt-3">
              <h3 className="text-xs font-bold text-zinc-950 dark:text-white uppercase tracking-wider">
                Storico Scontrini & Acquisti ({selectedCustomer.sales?.length || 0})
              </h3>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {!selectedCustomer.sales || selectedCustomer.sales.length === 0 ? (
                  <div className="py-8 text-center text-xs text-zinc-400">
                    Nessun acquisto ancora registrato a cassa per questo cliente.
                  </div>
                ) : (
                  selectedCustomer.sales.map((s) => (
                    <div
                      key={s.id}
                      className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-zinc-950 dark:text-white">
                          {s.sale_number}
                        </span>
                        <span className="font-mono font-bold text-lime-600 dark:text-[#bfff00]">
                          € {Number(s.total_amount).toFixed(2)}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 flex items-center justify-between">
                        <span>{new Date(s.created_at).toLocaleString('it-IT')}</span>
                        <span className="capitalize">{s.payment_method}</span>
                      </div>
                      {s.items && s.items.length > 0 && (
                        <div className="pt-1 border-t border-zinc-200/50 dark:border-zinc-800/50 text-[11px] text-zinc-500 space-y-0.5">
                          {s.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span>{it.product_name} {it.variant_name ? `(${it.variant_name})` : ''} × {it.quantity}</span>
                              <span className="font-mono">€ {Number(it.total_price).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-white"
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
