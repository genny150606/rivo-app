'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import {
  UtensilsCrossed,
  Sparkles,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Edit3,
  Check,
  CheckCircle2,
  AlertCircle,
  Eye,
  Smartphone,
  Sliders,
  Image as ImageIcon,
  Tag,
  Euro,
  ArrowRight,
  Flame,
  Search,
  X,
  Layers,
  ChefHat,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Info,
  CheckCheck,
  Upload,
  FolderOpen,
  Loader2,
  Camera,
  FileText,
  Wand2,
} from 'lucide-react';
import {
  CanvaMenuConfig,
  CanvaMenuCategory,
  CanvaMenuItem,
  CanvaMenuPreset,
  CanvaFontFamily,
  CANVA_PRESETS,
  CANVA_FONT_OPTIONS,
  ACCENT_COLOR_PALETTES,
  MENU_TAGS_PRESETS,
  FOOD_PHOTOS_CATALOG,
  FoodPhotoItem,
  getDefaultCanvaMenuConfig,
} from '@/lib/canva-menu';
import { hapticTap, hapticSuccess, hapticWarning } from '@/lib/haptics';

export default function CanvaMenuStudioPage() {
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveToast, setSaveToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Organization & Profile info
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState('');
  const [orgCategory, setOrgCategory] = useState<string | null>(null);
  const [rawHubConfig, setRawHubConfig] = useState<Record<string, any>>({});

  // Menu Configuration State
  const [menuConfig, setMenuConfig] = useState<CanvaMenuConfig>(() => getDefaultCanvaMenuConfig());

  // Navigation & View Mode
  const [activeStudioTab, setActiveStudioTab] = useState<'design' | 'categories' | 'options'>('design');
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('');

  // Modals state
  const [showDishModal, setShowDishModal] = useState(false);
  const [editingDishTarget, setEditingDishTarget] = useState<{ categoryId: string; dish?: CanvaMenuItem } | null>(null);
  const [dishForm, setDishForm] = useState<{
    id?: string;
    name: string;
    description: string;
    price: number | string;
    isPopular: boolean;
    isAvailable: boolean;
    tags: string[];
    photoUrl: string;
  }>({
    name: '',
    description: '',
    price: 12,
    isPopular: false,
    isAvailable: true,
    tags: [],
    photoUrl: '',
  });

  // Photo Upload & File Picker
  const [uploadingDishPhoto, setUploadingDishPhoto] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Photo Catalog Picker Modal
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [photoFilterCategory, setPhotoFilterCategory] = useState('Tutti');
  const [photoSearchQuery, setPhotoSearchQuery] = useState('');

  // AI Dish Enhancer State
  const [aiEnhancing, setAiEnhancing] = useState(false);

  // AI Menu Scanner State
  const [showAiScannerModal, setShowAiScannerModal] = useState(false);
  const [aiScanning, setAiScanning] = useState(false);
  const [aiScanInputMode, setAiScanInputMode] = useState<'photo' | 'text'>('photo');
  const [aiScanPhotoBase64, setAiScanPhotoBase64] = useState<string | null>(null);
  const [aiScanText, setAiScanText] = useState('');
  const [aiScanResults, setAiScanResults] = useState<CanvaMenuCategory[] | null>(null);
  const [aiScanMergeMode, setAiScanMergeMode] = useState<'replace' | 'append'>('replace');
  const scanFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Seleziona un file immagine valido (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      alert("L'immagine supera la dimensione massima di 8MB.");
      return;
    }

    setUploadingDishPhoto(true);
    setUploadError(null);
    hapticTap();

    try {
      if (orgId) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('orgId', orgId);

        const res = await fetch('/api/upload/dish-photo', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            setDishForm((prev) => ({ ...prev, photoUrl: data.url }));
            hapticSuccess();
            setUploadingDishPhoto(false);
            return;
          }
        }
      }

      // Fallback: local FileReader data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setDishForm((prev) => ({ ...prev, photoUrl: result }));
          hapticSuccess();
        }
        setUploadingDishPhoto(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.warn('Upload error, using local file reader preview:', err);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setDishForm((prev) => ({ ...prev, photoUrl: result }));
          hapticSuccess();
        }
        setUploadingDishPhoto(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAiEnhanceDish = async () => {
    if (!dishForm.name.trim()) return;
    setAiEnhancing(true);
    hapticTap();
    try {
      const res = await fetch('/api/ai/dish-enhancer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dishName: dishForm.name,
          rawIngredients: dishForm.description,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.description) {
          setDishForm((prev) => {
            const newTags = Array.from(new Set([...prev.tags, ...(data.tags || [])]));
            return {
              ...prev,
              description: data.description,
              tags: newTags,
            };
          });
          hapticSuccess();
        }
      }
    } catch (err) {
      console.error('AI enhancer error:', err);
    } finally {
      setAiEnhancing(false);
    }
  };

  const handleScanFileUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setAiScanPhotoBase64(e.target?.result as string);
      hapticTap();
    };
    reader.readAsDataURL(file);
  };

  const handleStartAiScan = async () => {
    if (!aiScanPhotoBase64 && !aiScanText.trim()) {
      alert('Inserisci una foto del menù o incolla il testo prima di avviare la scansione.');
      return;
    }
    setAiScanning(true);
    hapticTap();
    try {
      const res = await fetch('/api/ai/menu-scanner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: aiScanInputMode === 'photo' ? aiScanPhotoBase64 : undefined,
          text: aiScanInputMode === 'text' ? aiScanText : undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.categories && data.categories.length > 0) {
          setAiScanResults(data.categories);
          hapticSuccess();
        } else {
          alert('Nessun piatto identificato. Prova con una foto più nitida o incolla il testo del menù.');
        }
      } else {
        const err = await res.json();
        alert(`Errore scansione: ${err.error || 'Impossibile elaborare il menù'}`);
      }
    } catch (err) {
      console.error('Scan error:', err);
      alert('Si è verificato un errore durante la scansione AI.');
    } finally {
      setAiScanning(false);
    }
  };

  const handleApplyAiScanResults = () => {
    if (!aiScanResults || aiScanResults.length === 0) return;
    hapticSuccess();
    if (aiScanMergeMode === 'replace') {
      setMenuConfig((prev) => ({
        ...prev,
        categories: aiScanResults,
      }));
      if (aiScanResults[0]) {
        setActiveCategoryTab(aiScanResults[0].id);
      }
    } else {
      setMenuConfig((prev) => ({
        ...prev,
        categories: [...prev.categories, ...aiScanResults],
      }));
    }
    setShowAiScannerModal(false);
    setAiScanResults(null);
    setAiScanPhotoBase64(null);
    setAiScanText('');
    setToastMessage('Menù digitalizzato con AI e importato!');
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 4000);
  };

  // Category Add Modal
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatSubtitle, setNewCatSubtitle] = useState('');

  // Load organization and menu configuration
  useEffect(() => {
    loadOrgData();
  }, []);

  async function loadOrgData() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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

      if (!targetOrgId) {
        setLoading(false);
        return;
      }

      setOrgId(targetOrgId);

      const { data: org, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', targetOrgId)
        .single();

      if (error) throw error;

      if (org) {
        setOrgName(org.name || 'Ristorante');
        setOrgCategory(org.category || null);
        const existingHubConfig = (org.hub_config as Record<string, any>) || {};
        setRawHubConfig(existingHubConfig);

        if (existingHubConfig.canvaMenu) {
          setMenuConfig(existingHubConfig.canvaMenu as CanvaMenuConfig);
        } else {
          // Initialize with rich default config
          setMenuConfig(getDefaultCanvaMenuConfig());
        }
      }
    } catch (err) {
      console.error('Error loading organization in Canva Menu Studio:', err);
    } finally {
      setLoading(false);
    }
  }

  // Set default active category tab when categories are available
  useEffect(() => {
    if (menuConfig.categories.length > 0 && !activeCategoryTab) {
      setActiveCategoryTab(menuConfig.categories[0].id);
    }
  }, [menuConfig.categories, activeCategoryTab]);

  // Selected Category
  const currentCategory = useMemo(() => {
    return menuConfig.categories.find((c) => c.id === activeCategoryTab) || menuConfig.categories[0];
  }, [menuConfig.categories, activeCategoryTab]);

  // Filtered Photo Catalog
  const filteredPhotos = useMemo(() => {
    return FOOD_PHOTOS_CATALOG.filter((item) => {
      const matchCat = photoFilterCategory === 'Tutti' || item.category === photoFilterCategory;
      const matchQuery = !photoSearchQuery.trim() || item.name.toLowerCase().includes(photoSearchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [photoFilterCategory, photoSearchQuery]);

  // Save handler
  const handleSaveMenu = async () => {
    if (!orgId) return;
    setSaving(true);
    try {
      const updatedHubConfig = {
        ...rawHubConfig,
        canvaMenu: menuConfig,
      };

      const { error } = await supabase
        .from('organizations')
        .update({
          hub_config: updatedHubConfig,
        })
        .eq('id', orgId);

      if (error) throw error;

      setRawHubConfig(updatedHubConfig);
      hapticSuccess();
      setToastMessage('Menù Canvas salvato con successo!');
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 3500);
    } catch (err) {
      console.error('Error saving Canva menu:', err);
      hapticWarning();
      setToastMessage('Errore durante il salvataggio. Riprova.');
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 3500);
    } finally {
      setSaving(false);
    }
  };

  // Reset to default example menu
  const handleResetDefault = () => {
    hapticTap();
    if (confirm('Sei sicuro di voler ripristinare il Menù d\'esempio con tutti i piatti consigliati?')) {
      const def = getDefaultCanvaMenuConfig();
      setMenuConfig(def);
      if (def.categories.length > 0) {
        setActiveCategoryTab(def.categories[0].id);
      }
      hapticSuccess();
      setToastMessage('Menù d\'esempio ripristinato! Clicca Salva per confermare.');
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 3500);
    }
  };

  // Preset Selector
  const handleSelectPreset = (presetKey: CanvaMenuPreset) => {
    hapticTap();
    const preset = CANVA_PRESETS[presetKey];
    setMenuConfig((prev) => ({
      ...prev,
      preset: presetKey,
      fontFamily: preset.defaultFont,
      accentColor: preset.defaultAccent,
    }));
  };

  // Open Add/Edit Dish Modal
  const openDishModal = (categoryId: string, dish?: CanvaMenuItem) => {
    hapticTap();
    setEditingDishTarget({ categoryId, dish });
    if (dish) {
      setDishForm({
        id: dish.id,
        name: dish.name,
        description: dish.description,
        price: dish.price,
        isPopular: !!dish.isPopular,
        isAvailable: dish.isAvailable !== false,
        tags: [...(dish.tags || [])],
        photoUrl: dish.photoUrl || '',
      });
    } else {
      setDishForm({
        name: '',
        description: '',
        price: 14,
        isPopular: false,
        isAvailable: true,
        tags: [],
        photoUrl: FOOD_PHOTOS_CATALOG[Math.floor(Math.random() * FOOD_PHOTOS_CATALOG.length)].url,
      });
    }
    setShowDishModal(true);
  };

  // Save Dish
  const handleSaveDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishForm.name.trim() || !editingDishTarget) return;

    const parsedPrice = typeof dishForm.price === 'string' ? parseFloat(dishForm.price) || 0 : dishForm.price;

    setMenuConfig((prev) => {
      const nextCategories = prev.categories.map((cat) => {
        if (cat.id !== editingDishTarget.categoryId) return cat;

        let nextItems: CanvaMenuItem[];
        if (dishForm.id) {
          // Update existing
          nextItems = cat.items.map((it) =>
            it.id === dishForm.id
              ? {
                  ...it,
                  name: dishForm.name.trim(),
                  description: dishForm.description.trim(),
                  price: parsedPrice,
                  isPopular: dishForm.isPopular,
                  isAvailable: dishForm.isAvailable,
                  tags: dishForm.tags,
                  photoUrl: dishForm.photoUrl.trim(),
                }
              : it
          );
        } else {
          // Add new
          const newDish: CanvaMenuItem = {
            id: `dish_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            name: dishForm.name.trim(),
            description: dishForm.description.trim(),
            price: parsedPrice,
            isPopular: dishForm.isPopular,
            isAvailable: dishForm.isAvailable,
            tags: dishForm.tags,
            photoUrl: dishForm.photoUrl.trim(),
          };
          nextItems = [...cat.items, newDish];
        }

        return {
          ...cat,
          items: nextItems,
        };
      });

      return {
        ...prev,
        categories: nextCategories,
      };
    });

    hapticSuccess();
    setShowDishModal(false);
  };

  // Delete Dish
  const handleDeleteDish = (categoryId: string, dishId: string) => {
    hapticWarning();
    setMenuConfig((prev) => ({
      ...prev,
      categories: prev.categories.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              items: cat.items.filter((item) => item.id !== dishId),
            }
          : cat
      ),
    }));
  };

  // Toggle Dish Availability
  const handleToggleAvailability = (categoryId: string, dishId: string) => {
    hapticTap();
    setMenuConfig((prev) => ({
      ...prev,
      categories: prev.categories.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              items: cat.items.map((item) =>
                item.id === dishId ? { ...item, isAvailable: !item.isAvailable } : item
              ),
            }
          : cat
      ),
    }));
  };

  // Add Category
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newCatId = `cat_${Date.now()}`;
    const newCat: CanvaMenuCategory = {
      id: newCatId,
      name: newCatName.trim(),
      subtitle: newCatSubtitle.trim() || undefined,
      dishes: [],
      items: [],
    };

    setMenuConfig((prev) => ({
      ...prev,
      categories: [...prev.categories, newCat],
    }));

    setActiveCategoryTab(newCatId);
    setNewCatName('');
    setNewCatSubtitle('');
    setShowAddCatModal(false);
    hapticSuccess();
  };

  // Delete Category
  const handleDeleteCategory = (categoryId: string) => {
    hapticWarning();
    if (menuConfig.categories.length <= 1) {
      alert('Devi mantenere almeno una categoria nel menù.');
      return;
    }
    if (confirm('Sei sicuro di voler eliminare questa categoria e tutti i suoi piatti?')) {
      setMenuConfig((prev) => {
        const filtered = prev.categories.filter((c) => c.id !== categoryId);
        setActiveCategoryTab(filtered[0]?.id || '');
        return {
          ...prev,
          categories: filtered,
        };
      });
    }
  };

  // Tag Toggle in dish form
  const toggleDishTag = (tag: string) => {
    hapticTap();
    setDishForm((prev) => {
      const exists = prev.tags.includes(tag);
      return {
        ...prev,
        tags: exists ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
      };
    });
  };

  // Photo Selected from Catalog
  const handleSelectPhoto = (url: string) => {
    hapticTap();
    setDishForm((prev) => ({ ...prev, photoUrl: url }));
    setShowPhotoPicker(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center animate-pulse">
          <UtensilsCrossed className="w-6 h-6 text-amber-500 animate-spin" />
        </div>
        <div className="text-center">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Caricamento Menù Canvas Studio</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Sincronizzazione catalogo gastronomico in corso...</p>
        </div>
      </div>
    );
  }

  // RESTRICTION CHECK: If category is not 'restaurant', show exclusive locked screen
  if (orgCategory !== 'restaurant') {
    return (
      <div className="max-w-3xl mx-auto py-8 sm:py-14 px-4">
        <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-b from-amber-500/10 via-zinc-900/60 to-zinc-900/90 dark:from-amber-500/15 dark:via-[#121415] dark:to-[#0d0f10] p-6 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-md">
          <div className="absolute -right-12 -top-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <UtensilsCrossed className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Settore Ristorazione Esclusivo
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white mt-1">
                Funzionalità Esclusiva per Ristorazione
              </h1>
            </div>
          </div>

          <div className="space-y-4 text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">
            <p>
              Il <strong>Menù Canvas avanzato</strong> è riservato esclusivamente a <strong>Ristoranti, Bistrot, Pizzerie, Trattorie e Wine Bar</strong>.
            </p>
            <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-black/40 border border-zinc-200 dark:border-white/10 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="text-xs">
                <span>Il tuo settore attuale è impostato su: </span>
                <span className="font-bold text-amber-500 uppercase tracking-wider">{orgCategory || 'Non specificato'}</span>.
              </div>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Gestisci un locale gastronomico? Puoi modificare il settore di appartenenza nella sezione <strong>Profilo &amp; Routing</strong> per sbloccare all&apos;istante il designer visivo per il menù.
            </p>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/dashboard/profile"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              <span>Vai a Profilo &amp; Routing</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-sm transition-all"
            >
              <span>Torna alla Dashboard</span>
            </Link>
          </div>

          {/* Feature highlights */}
          <div className="mt-10 pt-8 border-t border-zinc-200 dark:border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-xl bg-white/50 dark:bg-white/5 border border-zinc-200/50 dark:border-white/5">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <ChefHat className="w-3.5 h-3.5 text-amber-500" />
                <span>5 Template Preset Canva</span>
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                Lavagna Bistrot, Fine Dining Oro, Trattoria Tradizione, Modern Editorial e Botanical.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/50 dark:bg-white/5 border border-zinc-200/50 dark:border-white/5">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                <span>Foto HD Gastronomia</span>
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                Catalogo fotografico ad altissima risoluzione per antipasti, primi, carni e dessert.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/50 dark:bg-white/5 border border-zinc-200/50 dark:border-white/5">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
                <span>Ordini &amp; Comande al Tavolo</span>
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                I clienti ordinano direttamente dal tavolo con sincronizzazione immediata alla cassa.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // RESTAURANT USER: Render Full Canva Studio
  const currentPresetMeta = CANVA_PRESETS[menuConfig.preset] || CANVA_PRESETS['fine-dining'];

  return (
    <div className="space-y-6 pb-24">
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-500 text-white font-semibold text-xs shadow-2xl animate-fade-in border border-emerald-400/50">
          <CheckCheck className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-xs">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  Menù Canvas Studio
                </h1>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  Ristoranti
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Progetta il menù digitale stile Canva per {orgName}. Stili visivi, catalogo foto HD e simulatore smartphone.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              hapticTap();
              setShowAiScannerModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-600 dark:text-purple-400 font-bold text-xs transition-all active:scale-95 touch-press cursor-pointer shadow-xs"
            title="Digitalizza menù cartaceo da foto o testo con AI"
          >
            <Camera className="w-3.5 h-3.5 text-purple-500" />
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Scansiona Cartaceo con AI</span>
            <span className="sm:hidden">Scanner AI</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefault}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs transition-all active:scale-95 touch-press cursor-pointer"
            title="Ripristina piatti ed impostazioni d'esempio"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ripristina Menù d&apos;Esempio</span>
            <span className="sm:hidden">Ripristina</span>
          </button>

          <button
            type="button"
            onClick={handleSaveMenu}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95 touch-press cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                <span>Salvataggio...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Salva Configurazione Menù</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Switcher (Editor vs Simulator) */}
      <div className="flex lg:hidden rounded-2xl bg-zinc-200 dark:bg-zinc-900 p-1 border border-zinc-300/60 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setMobileView('editor')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mobileView === 'editor'
              ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-sm'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Editor &amp; Piatti</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileView('preview')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mobileView === 'preview'
              ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-sm'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Simulatore Live</span>
        </button>
      </div>

      {/* Main Studio Grid: 2 Columns (Controls on Left / Smartphone on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ======================================================================= */}
        {/* LEFT COLUMN: CONTROLS & DESIGNER (7 COLS on lg) */}
        {/* ======================================================================= */}
        <div className={`lg:col-span-7 space-y-6 ${mobileView === 'preview' ? 'hidden lg:block' : 'block'}`}>
          {/* Studio Sub-Navigation Tabs */}
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-zinc-200/80 dark:bg-[#121415] border border-zinc-300/70 dark:border-white/5">
            <button
              type="button"
              onClick={() => setActiveStudioTab('design')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeStudioTab === 'design'
                  ? 'bg-white dark:bg-[#1a1d1f] text-zinc-950 dark:text-[#BFFF00] shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Stile &amp; Template</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveStudioTab('categories')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeStudioTab === 'categories'
                  ? 'bg-white dark:bg-[#1a1d1f] text-zinc-950 dark:text-[#BFFF00] shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Categorie &amp; Piatti</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveStudioTab('options')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeStudioTab === 'options'
                  ? 'bg-white dark:bg-[#1a1d1f] text-zinc-950 dark:text-[#BFFF00] shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Ordini al Tavolo &amp; Info</span>
            </button>
          </div>

          {/* TAB 1: DESIGN, TEMPLATES, TYPOGRAPHY, PALETTES */}
          {activeStudioTab === 'design' && (
            <div className="space-y-6 animate-fade-in">
              {/* Preset Visuale Stile Canva */}
              <div className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#121415] p-5 sm:p-6 space-y-4 shadow-sm">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Template Grafico Canva Preset</span>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Scegli l&apos;identità visiva ideale per la tua atmosfera culinaria.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {(Object.keys(CANVA_PRESETS) as CanvaMenuPreset[]).map((pKey) => {
                    const preset = CANVA_PRESETS[pKey];
                    const isSelected = menuConfig.preset === pKey;
                    return (
                      <div
                        key={pKey}
                        onClick={() => handleSelectPreset(pKey)}
                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all duration-200 text-left relative group ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-500/15 shadow-md'
                            : 'border-zinc-200 dark:border-white/10 hover:border-zinc-400 dark:hover:border-white/25 bg-zinc-50/50 dark:bg-black/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-white/10 text-zinc-800 dark:text-zinc-200">
                            {preset.badge}
                          </span>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-zinc-950 shadow-xs">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-white group-hover:text-amber-500 transition-colors">
                          {preset.name}
                        </h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                          {preset.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tipografia & Font */}
              <div className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#121415] p-5 sm:p-6 space-y-4 shadow-sm">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <ChefHat className="w-4 h-4 text-sky-400" />
                    <span>Tipografia &amp; Carattere Tipografico</span>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Definisce il tono editoriale dei titoli dei piatti e delle sezioni.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {CANVA_FONT_OPTIONS.map((f) => {
                    const isSelected = menuConfig.fontFamily === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          hapticTap();
                          setMenuConfig((prev) => ({ ...prev, fontFamily: f.id }));
                        }}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-sky-500 bg-sky-500/10 dark:bg-sky-500/15 ring-1 ring-sky-500/30'
                            : 'border-zinc-200 dark:border-white/10 hover:border-zinc-400 dark:hover:border-white/20 bg-zinc-50/50 dark:bg-black/20'
                        }`}
                      >
                        <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">
                          {f.name}
                        </div>
                        <div
                          className="text-sm mt-1 truncate text-zinc-600 dark:text-zinc-300 font-medium"
                          style={{ fontFamily: f.style }}
                        >
                          Sapori &amp; Tradizione
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Colore Accento Prezzi & Badge */}
              <div className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#121415] p-5 sm:p-6 space-y-4 shadow-sm">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Euro className="w-4 h-4 text-emerald-400" />
                    <span>Colore Accento Prezzi &amp; Badge</span>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Evidenzia i prezzi in €, i tag speciali e i pulsanti d&apos;ordine.
                  </p>
                </div>

                {/* Preset Palettes */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {ACCENT_COLOR_PALETTES.map((pal) => {
                    const isSelected = (menuConfig.accentColor || '#f59e0b').toLowerCase() === pal.color.toLowerCase();
                    return (
                      <button
                        key={pal.color}
                        type="button"
                        onClick={() => {
                          hapticTap();
                          setMenuConfig((prev) => ({ ...prev, accentColor: pal.color }));
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                          isSelected
                            ? 'border-white bg-zinc-200 dark:bg-white/15 ring-2 ring-white/40'
                            : 'border-zinc-300 dark:border-white/10 hover:border-zinc-400 dark:hover:border-white/30 bg-zinc-50 dark:bg-black/20'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full shadow-inner shrink-0"
                          style={{ backgroundColor: pal.color }}
                        />
                        <span className="text-zinc-800 dark:text-zinc-200">{pal.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Color Picker & Custom Hex */}
                <div className="pt-2 flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-white/15 bg-zinc-50 dark:bg-black/40">
                    <input
                      type="color"
                      value={menuConfig.accentColor}
                      onChange={(e) => setMenuConfig((prev) => ({ ...prev, accentColor: e.target.value }))}
                      className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-none"
                    />
                    <input
                      type="text"
                      value={menuConfig.accentColor}
                      onChange={(e) => setMenuConfig((prev) => ({ ...prev, accentColor: e.target.value }))}
                      className="w-24 text-xs font-mono font-bold uppercase bg-transparent text-zinc-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <span className="text-xs text-zinc-500">Colore personalizzato</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CATEGORIE & GESTIONE PIATTI */}
          {activeStudioTab === 'categories' && (
            <div className="space-y-6 animate-fade-in">
              {/* Category selector pills & Add Category Button */}
              <div className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#121415] p-5 sm:p-6 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-200 dark:border-white/5">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-amber-500" />
                      <span>Sezioni del Menù ({menuConfig.categories.length})</span>
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Seleziona una portata per visualizzare, ordinare e modificare i singoli piatti.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddCatModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Nuova Categoria</span>
                  </button>
                </div>

                {/* Categories Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {menuConfig.categories.map((cat) => {
                    const isActive = cat.id === currentCategory?.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          hapticTap();
                          setActiveCategoryTab(cat.id);
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                          isActive
                            ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 shadow-md scale-[1.02]'
                            : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10'
                        }`}
                      >
                        <span>{cat.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${isActive ? 'bg-white/20 dark:bg-black/20' : 'bg-black/10 dark:bg-white/10'}`}>
                          {cat.items.length}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Current Category Info & Actions */}
                {currentCategory && (
                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <span>{currentCategory.name}</span>
                        {currentCategory.subtitle && (
                          <span className="text-[11px] font-normal text-zinc-500 dark:text-zinc-400 italic">
                            — {currentCategory.subtitle}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {currentCategory.items.length} piatti registrati in questa sezione
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openDishModal(currentCategory.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Aggiungi Piatto</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(currentCategory.id)}
                        className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Elimina questa categoria"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Dish List inside current category */}
              {currentCategory && (
                <div className="space-y-3">
                  {currentCategory.items.length === 0 ? (
                    <div className="p-8 rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 text-center space-y-3">
                      <ChefHat className="w-8 h-8 mx-auto text-zinc-400" />
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        Nessun piatto presente in <strong>{currentCategory.name}</strong>.
                      </div>
                      <button
                        type="button"
                        onClick={() => openDishModal(currentCategory.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs shadow-sm hover:bg-amber-400 transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Crea Primo Piatto</span>
                      </button>
                    </div>
                  ) : (
                    currentCategory.items.map((dish) => (
                      <div
                        key={dish.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          dish.isAvailable
                            ? 'bg-white dark:bg-[#121415] border-zinc-200 dark:border-white/10 shadow-sm'
                            : 'bg-zinc-100/60 dark:bg-zinc-900/40 border-dashed border-zinc-300 dark:border-zinc-800 opacity-65'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          {/* Dish Image & Info */}
                          <div className="flex items-start gap-3.5 min-w-0">
                            {dish.photoUrl ? (
                              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-zinc-200 dark:border-white/10">
                                <Image
                                  src={dish.photoUrl}
                                  alt={dish.name}
                                  fill
                                  sizes="(max-width: 640px) 64px, 80px"
                                  className="object-cover"
                                />
                                {dish.isPopular && (
                                  <div className="absolute top-1 left-1 bg-amber-500 text-zinc-950 p-0.5 rounded-md shadow-xs">
                                    <Flame className="w-3 h-3 fill-current" />
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 text-zinc-400">
                                <UtensilsCrossed className="w-6 h-6" />
                              </div>
                            )}

                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                                  {dish.name}
                                </h4>
                                <span
                                  className="text-xs font-extrabold px-2 py-0.5 rounded-md"
                                  style={{
                                    backgroundColor: `${menuConfig.accentColor}20`,
                                    color: menuConfig.accentColor,
                                  }}
                                >
                                  €{typeof dish.price === 'number' ? dish.price.toFixed(2) : dish.price}
                                </span>
                                {!dish.isAvailable && (
                                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-red-500/20 text-red-500">
                                    Esaurito
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                                {dish.description || 'Nessuna descrizione specificata.'}
                              </p>

                              {/* Tags */}
                              {dish.tags && dish.tags.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                  {dish.tags.map((t) => (
                                    <span
                                      key={t}
                                      className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300"
                                    >
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5 sm:self-center shrink-0">
                            <button
                              type="button"
                              onClick={() => handleToggleAvailability(currentCategory.id, dish.id)}
                              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                                dish.isAvailable
                                  ? 'bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200'
                                  : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                              }`}
                              title="Cambia disponibilità del piatto"
                            >
                              {dish.isAvailable ? 'Disponibile' : 'Esaurito'}
                            </button>

                            <button
                              type="button"
                              onClick={() => openDishModal(currentCategory.id, dish)}
                              className="p-2 rounded-xl bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200 dark:hover:bg-white/20 text-zinc-700 dark:text-zinc-200 transition-all cursor-pointer"
                              title="Modifica piatto"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteDish(currentCategory.id, dish.id)}
                              className="p-2 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
                              title="Elimina piatto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ORDINI AL TAVOLO & INFO GENERALI */}
          {activeStudioTab === 'options' && (
            <div className="space-y-6 animate-fade-in">
              {/* Switch Ordini al Tavolo */}
              <div className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#121415] p-5 sm:p-6 space-y-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-emerald-500" />
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                        Ordini al Tavolo Diretti
                      </h3>
                      {menuConfig.tableOrdersEnabled ? (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                          Attivi
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-zinc-500/20 text-zinc-400">
                          Solo Consultazione
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Consente ai clienti di aggiungere portate al carrello e inoltrare l&apos;ordine direttamente alla cassa o al gestionale RIVO.
                    </p>
                  </div>

                  {/* Switch Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      hapticTap();
                      setMenuConfig((prev) => ({
                        ...prev,
                        tableOrdersEnabled: !prev.tableOrdersEnabled,
                      }));
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      menuConfig.tableOrdersEnabled ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        menuConfig.tableOrdersEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Avvisi & Notifiche per la clientela */}
              <div className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#121415] p-5 sm:p-6 space-y-4 shadow-sm">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-500" />
                    <span>Nota / Informativa sul Menù</span>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Testo mostrato sotto il titolo (es. informazioni su allergeni, coperto, provenienza materie prime).
                  </p>
                </div>

                <div>
                  <textarea
                    rows={3}
                    value={menuConfig.restaurantNotice || ''}
                    onChange={(e) => setMenuConfig((prev) => ({ ...prev, restaurantNotice: e.target.value }))}
                    placeholder="Es. Il coperto include il cestino di pane fatto in casa. Comunicare eventuali intolleranze al nostro staff."
                    className="w-full text-xs p-3 rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-black/40 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                {/* Immagine di Copertina Testata */}
                <div className="pt-2 space-y-2">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
                    URL Immagine di Copertina Testata (opzionale)
                  </label>
                  <input
                    type="url"
                    value={menuConfig.coverImageUrl || ''}
                    onChange={(e) => setMenuConfig((prev) => ({ ...prev, coverImageUrl: e.target.value }))}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-black/40 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================================= */}
        {/* RIGHT COLUMN: REALISTIC LIVE SMARTPHONE SIMULATOR (5 COLS on lg) */}
        {/* ======================================================================= */}
        <div className={`lg:col-span-5 ${mobileView === 'editor' ? 'hidden lg:block' : 'block'} sticky top-20`}>
          <div className="flex items-center justify-between px-2 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">
              <Eye className="w-4 h-4 text-emerald-500" />
              <span>Anteprima Live Ospiti (Mockup)</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-white/10 font-mono text-zinc-600 dark:text-zinc-400">
              {menuConfig.preset}
            </span>
          </div>

          {/* Smartphone Hardware Frame */}
          <div className="relative mx-auto w-full max-w-[340px] sm:max-w-[360px] rounded-[48px] p-3 bg-zinc-900 dark:bg-black border-4 border-zinc-700/80 dark:border-zinc-800 shadow-2xl shadow-black/80">
            {/* Dynamic Island / Notch */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-4 bg-black rounded-full z-30 flex items-center justify-end px-3">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-800" />
            </div>

            {/* Screen Inner Viewport */}
            <div
              className={`w-full h-[620px] rounded-[38px] overflow-y-auto overflow-x-hidden relative scrollbar-none transition-colors duration-300 ${currentPresetMeta.bgClass} ${currentPresetMeta.textClass}`}
              style={{
                fontFamily: CANVA_FONT_OPTIONS.find((f) => f.id === menuConfig.fontFamily)?.style,
              }}
            >
              {/* Cover Image Banner */}
              <div className="relative w-full h-32 overflow-hidden">
                {menuConfig.coverImageUrl ? (
                  <Image
                    src={menuConfig.coverImageUrl}
                    alt="Cover"
                    fill
                    sizes="360px"
                    className="object-cover opacity-80"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-amber-600/40 via-red-600/30 to-purple-800/40" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                {/* Badge Overlay */}
                <div className="absolute top-7 left-4">
                  <span
                    className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm"
                    style={{
                      backgroundColor: menuConfig.accentColor,
                      color: '#000',
                    }}
                  >
                    {currentPresetMeta.badge}
                  </span>
                </div>
              </div>

              {/* Restaurant Header Details */}
              <div className="px-4 -mt-6 relative z-10 space-y-1">
                <h2 className="text-xl font-bold tracking-tight text-white drop-shadow-md">
                  {orgName}
                </h2>
                {menuConfig.restaurantNotice && (
                  <p className="text-[10px] opacity-80 leading-relaxed font-sans">
                    {menuConfig.restaurantNotice}
                  </p>
                )}

                {menuConfig.tableOrdersEnabled && (
                  <div className="pt-1 flex items-center gap-1.5 text-[10px] font-sans text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Ordini al tavolo attivi per questo dispositivo</span>
                  </div>
                )}
              </div>

              {/* Sticky Category Chips inside phone */}
              <div className="sticky top-0 z-20 px-3 py-2.5 backdrop-blur-md bg-black/40 border-y border-white/10 my-3 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                {menuConfig.categories.map((cat) => (
                  <span
                    key={cat.id}
                    className="px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap"
                    style={{
                      backgroundColor:
                        cat.id === currentCategory?.id
                          ? menuConfig.accentColor
                          : 'rgba(255,255,255,0.1)',
                      color: cat.id === currentCategory?.id ? '#000' : '#fff',
                    }}
                  >
                    {cat.name}
                  </span>
                ))}
              </div>

              {/* Categories & Dishes Content */}
              <div className="px-3.5 pb-24 space-y-5">
                {menuConfig.categories.map((category) => (
                  <div key={category.id} className="space-y-2.5">
                    <div className="border-b border-white/10 pb-1 flex items-baseline justify-between">
                      <h3
                        className="text-sm font-bold tracking-wide uppercase"
                        style={{ color: menuConfig.accentColor }}
                      >
                        {category.name}
                      </h3>
                      {category.subtitle && (
                        <span className="text-[9px] opacity-60 font-sans">{category.subtitle}</span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {category.items.map((item) => (
                        <div
                          key={item.id}
                          className={`p-2.5 rounded-xl border transition-all ${currentPresetMeta.cardBgClass}`}
                        >
                          <div className="flex gap-2.5">
                            {item.photoUrl && (
                              <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-white/10">
                                <Image
                                  src={item.photoUrl}
                                  alt={item.name}
                                  fill
                                  sizes="56px"
                                  className="object-cover"
                                />
                                {item.isPopular && (
                                  <div className="absolute top-0.5 right-0.5 bg-amber-400 text-black p-0.5 rounded-sm">
                                    <Flame className="w-2.5 h-2.5 fill-current" />
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-1">
                                <h4 className="text-xs font-bold leading-snug truncate">
                                  {item.name}
                                </h4>
                                <span
                                  className="text-xs font-black shrink-0 font-sans"
                                  style={{ color: menuConfig.accentColor }}
                                >
                                  €{typeof item.price === 'number' ? item.price.toFixed(2) : item.price}
                                </span>
                              </div>

                              <p className="text-[10px] opacity-75 line-clamp-2 mt-0.5 leading-snug font-sans">
                                {item.description}
                              </p>

                              {item.tags && item.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1 font-sans">
                                  {item.tags.slice(0, 2).map((t) => (
                                    <span
                                      key={t}
                                      className="text-[8px] px-1.5 py-0.2 rounded bg-white/10 opacity-80"
                                    >
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Interactive order button inside phone simulator */}
                          {menuConfig.tableOrdersEnabled && (
                            <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between font-sans">
                              <span className="text-[9px] opacity-60">Tavolo 4</span>
                              <button
                                type="button"
                                onClick={() => hapticTap()}
                                className="px-2 py-0.5 rounded-md text-[9px] font-bold text-black flex items-center gap-1 active:scale-95 transition-transform"
                                style={{ backgroundColor: menuConfig.accentColor }}
                              >
                                <Plus className="w-2.5 h-2.5 stroke-[3]" />
                                <span>Aggiungi</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Floating Bottom Table Orders Bar in Smartphone */}
              {menuConfig.tableOrdersEnabled && (
                <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-2xl bg-zinc-950/95 border border-white/15 backdrop-blur-md flex items-center justify-between shadow-2xl font-sans">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-black font-black text-xs"
                      style={{ backgroundColor: menuConfig.accentColor }}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-white">Il tuo Tavolo</div>
                      <div className="text-[8px] text-zinc-400">Pronto per l&apos;invio</div>
                    </div>
                  </div>

                  <span
                    className="text-[10px] font-black px-2.5 py-1 rounded-lg text-black"
                    style={{ backgroundColor: menuConfig.accentColor }}
                  >
                    Invia Comanda
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* MODAL: ADD / EDIT DISH */}
      {/* ======================================================================= */}
      {showDishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#151719] border border-zinc-200 dark:border-white/10 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  {dishForm.id ? 'Modifica Piatto' : 'Aggiungi Nuovo Piatto'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDishModal(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDish} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Nome del Piatto *
                </label>
                <input
                  type="text"
                  required
                  value={dishForm.name}
                  onChange={(e) => setDishForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Es. Spaghettoni alla Carbonara d'Autore"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-black/40 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Prezzo in € *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={dishForm.price}
                    onChange={(e) => setDishForm((prev) => ({ ...prev, price: e.target.value }))}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-black/40 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="flex items-center gap-3 pt-5">
                  <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dishForm.isPopular}
                      onChange={(e) => setDishForm((prev) => ({ ...prev, isPopular: e.target.checked }))}
                      className="rounded border-zinc-400 text-amber-500 focus:ring-amber-400"
                    />
                    <span>Piatto Top / Popolare</span>
                  </label>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Descrizione &amp; Ingredienti
                  </label>
                  <button
                    type="button"
                    disabled={aiEnhancing || !dishForm.name.trim()}
                    onClick={handleAiEnhanceDish}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-500 hover:text-amber-400 disabled:opacity-40 transition-colors cursor-pointer"
                    title="Genera testo gourmet ed estrai allergeni in automatico con l'AI"
                  >
                    {aiEnhancing ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                        <span>Generazione AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        <span>✨ Perfeziona con AI</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={dishForm.description}
                  onChange={(e) => setDishForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Es. Pasta trafilata al bronzo, guanciale croccante, pecorino DOP e pepe nero tostato."
                  className="w-full text-xs p-3 rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-black/40 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Tag Allergene & Specialità */}
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                  Tag, Allergeni &amp; Note
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {MENU_TAGS_PRESETS.map((tag) => {
                    const selected = dishForm.tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleDishTag(tag)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                          selected
                            ? 'bg-amber-500 text-black border-amber-400 font-bold'
                            : 'bg-zinc-100 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Foto Piatto (Upload da Dispositivo, Catalog o URL) */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
                    Fotografia del Piatto
                  </label>
                  <span className="text-[10px] text-zinc-400">JPG, PNG, WEBP fino a 8MB</span>
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  accept="image/png, image/jpeg, image/webp, image/gif"
                  className="hidden"
                />

                {/* Dropzone & Device Upload Area */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    if (e.dataTransfer.files?.[0]) {
                      handleFileUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`relative p-3.5 rounded-2xl border-2 border-dashed transition-all ${
                    isDragOver
                      ? 'border-amber-500 bg-amber-500/10 scale-[1.01]'
                      : 'border-zinc-300 dark:border-white/15 bg-zinc-50/50 dark:bg-white/[0.02] hover:border-zinc-400 dark:hover:border-white/25'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    {/* Thumbnail preview if photo exists */}
                    {dishForm.photoUrl ? (
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-zinc-200 dark:border-white/20 shadow-md group">
                        <Image
                          src={dishForm.photoUrl}
                          alt="Anteprima piatto"
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDishForm((prev) => ({ ...prev, photoUrl: '' }));
                            hapticTap();
                          }}
                          className="absolute top-1 right-1 p-1 rounded-full bg-black/75 hover:bg-red-600 text-white transition-colors"
                          title="Rimuovi foto"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-white/5 flex flex-col items-center justify-center text-zinc-400 shrink-0">
                        {uploadingDishPhoto ? (
                          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                        ) : (
                          <Upload className="w-6 h-6 text-zinc-400" />
                        )}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex-1 w-full space-y-2 text-center sm:text-left">
                      <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                        {/* Choose from device file button */}
                        <button
                          type="button"
                          disabled={uploadingDishPhoto}
                          onClick={() => {
                            hapticTap();
                            fileInputRef.current?.click();
                          }}
                          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                          {uploadingDishPhoto ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Caricamento in corso...</span>
                            </>
                          ) : (
                            <>
                              <FolderOpen className="w-3.5 h-3.5" />
                              <span>Scegli dal tuo Dispositivo</span>
                            </>
                          )}
                        </button>

                        {/* HD Catalog button */}
                        <button
                          type="button"
                          onClick={() => {
                            hapticTap();
                            setShowPhotoPicker(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                          <span>Catalogo Cibo HD</span>
                        </button>
                      </div>

                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Trascina qui la foto oppure scatta dal telefono o seleziona dalla galleria.
                      </p>

                      {/* Direct URL input */}
                      <div className="pt-0.5">
                        <input
                          type="url"
                          value={dishForm.photoUrl}
                          onChange={(e) => setDishForm((prev) => ({ ...prev, photoUrl: e.target.value }))}
                          placeholder="Oppure incolla un URL immagine web..."
                          className="w-full text-[11px] px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-black/40 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowDishModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  {dishForm.id ? 'Aggiorna Piatto' : 'Inserisci Piatto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL: FOOD PHOTO CATALOG PICKER */}
      {/* ======================================================================= */}
      {showPhotoPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-[#151719] border border-zinc-200 dark:border-white/10 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-white/10 shrink-0">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-amber-500" />
                  <span>Catalogo Foto Gastronomiche HD</span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Seleziona uno scatto professionale ottimizzato per la visualizzazione menù.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPhotoPicker(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter pills & search */}
            <div className="space-y-2 shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {['Tutti', 'Antipasti', 'Primi', 'Secondi', 'Pizze', 'Dolci', 'Vini & Cocktail'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setPhotoFilterCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                      photoFilterCategory === cat
                        ? 'bg-amber-500 text-black'
                        : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={photoSearchQuery}
                  onChange={(e) => setPhotoSearchQuery(e.target.value)}
                  placeholder="Cerca piatto (es. tartare, carbonara, tiramisù)..."
                  className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-black/40 text-zinc-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Direct Device Upload Banner */}
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                    Hai già la foto reale del tuo piatto?
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                    Caricala subito dalla fotocamera o dai file del tuo dispositivo.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowPhotoPicker(false);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shrink-0 cursor-pointer shadow-sm transition-all active:scale-95"
              >
                Carica dal File
              </button>
            </div>

            {/* Photo Grid */}
            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3 p-1">
              {filteredPhotos.map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => handleSelectPhoto(photo.url)}
                  className="group relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-white/10 aspect-video cursor-pointer hover:border-amber-500 transition-all shadow-xs"
                >
                  <Image
                    src={photo.url}
                    alt={photo.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-2.5">
                    <span className="text-[11px] font-bold text-white line-clamp-1 drop-shadow-sm">
                      {photo.name}
                    </span>
                    <span className="text-[9px] text-amber-400 font-semibold">
                      {photo.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL: ADD CATEGORY */}
      {/* ======================================================================= */}
      {showAddCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#151719] border border-zinc-200 dark:border-white/10 p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Nuova Categoria Menù
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCatModal(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Nome Categoria *
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Es. Primi Piatti d'Autore, Pizze Gourmet, Dolci..."
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-black/40 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Sottotitolo / Didascalia (opzionale)
                </label>
                <input
                  type="text"
                  value={newCatSubtitle}
                  onChange={(e) => setNewCatSubtitle(e.target.value)}
                  placeholder="Es. Pasta fresca fatta in casa e risotti mantecati"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-black/40 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCatModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  Crea Categoria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL: AI MENU SCANNER */}
      {/* ======================================================================= */}
      {showAiScannerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-[#151719] border border-zinc-200 dark:border-white/10 p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-white/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                    <span>Scanner Menù Cartaceo con AI</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Trasforma una foto del tuo menù cartaceo o un testo in categorie e piatti interattivi.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAiScannerModal(false);
                  setAiScanResults(null);
                }}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* If Results are ready, show preview and import */}
            {aiScanResults ? (
              <div className="flex-1 overflow-y-auto space-y-4 py-2">
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Scansione completata: rilevate {aiScanResults.length} categorie e {aiScanResults.reduce((acc, c) => acc + c.dishes.length, 0)} piatti!</span>
                  </div>
                </div>

                {/* Import Mode Options */}
                <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 space-y-2">
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
                    Modalità di importazione:
                  </span>
                  <div className="flex flex-col sm:flex-row gap-3 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-zinc-800 dark:text-zinc-200">
                      <input
                        type="radio"
                        name="mergeMode"
                        checked={aiScanMergeMode === 'replace'}
                        onChange={() => setAiScanMergeMode('replace')}
                        className="text-amber-500"
                      />
                      <span>Sostituisci il menù attuale</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-zinc-800 dark:text-zinc-200">
                      <input
                        type="radio"
                        name="mergeMode"
                        checked={aiScanMergeMode === 'append'}
                        onChange={() => setAiScanMergeMode('append')}
                        className="text-amber-500"
                      />
                      <span>Aggiungi alle categorie esistenti</span>
                    </label>
                  </div>
                </div>

                {/* Extracted Categories Preview */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                    Anteprima categorie estratte:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {aiScanResults.map((cat, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
                            {cat.name}
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 font-mono font-bold">
                            {cat.dishes.length} piatti
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                          {cat.dishes.map((d) => d.name).slice(0, 3).join(', ')}
                          {cat.dishes.length > 3 && '...'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setAiScanResults(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer"
                  >
                    Rifai scansione
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyAiScanResults}
                    className="px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Conferma e Importa nel Menù</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-1 flex-1 overflow-y-auto">
                {/* Input mode switcher */}
                <div className="flex rounded-2xl bg-zinc-100 dark:bg-white/5 p-1 border border-zinc-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setAiScanInputMode('photo')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      aiScanInputMode === 'photo'
                        ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs'
                        : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5 text-purple-400" />
                    <span>Foto Menù Cartaceo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiScanInputMode('text')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      aiScanInputMode === 'text'
                        ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs'
                        : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>Incolla Testo Menù</span>
                  </button>
                </div>

                {/* Hidden scan file input */}
                <input
                  type="file"
                  ref={scanFileInputRef}
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleScanFileUpload(e.target.files[0]);
                    }
                  }}
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                />

                {aiScanInputMode === 'photo' ? (
                  <div className="space-y-3">
                    <div
                      onClick={() => scanFileInputRef.current?.click()}
                      className="p-6 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-white/15 hover:border-purple-400 dark:hover:border-purple-400 bg-zinc-50/50 dark:bg-white/[0.02] flex flex-col items-center justify-center text-center cursor-pointer transition-all"
                    >
                      {aiScanPhotoBase64 ? (
                        <div className="relative w-full max-h-48 rounded-xl overflow-hidden shadow-md">
                          <img
                            src={aiScanPhotoBase64}
                            alt="Anteprima foto menù"
                            className="w-full h-44 object-contain rounded-xl"
                          />
                          <span className="inline-block mt-2 text-xs text-purple-400 font-semibold underline">
                            Clicca per cambiare foto
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-2">
                            <Upload className="w-6 h-6" />
                          </div>
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                            Carica una foto del menù cartaceo o scatta dal telefono
                          </span>
                          <span className="text-[11px] text-zinc-400 mt-1">
                            PNG, JPG, WEBP fino a 10MB
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
                      Incolla il testo del tuo menù:
                    </label>
                    <textarea
                      rows={6}
                      value={aiScanText}
                      onChange={(e) => setAiScanText(e.target.value)}
                      placeholder="Esempio:
ANTIPASTI
- Tagliere di Salumi Tipici: 14€
- Crostone ai Funghi Porcini: 9€

PRIMI PIATTI
- Spaghetti alla Carbonara: 13€
- Risotto al Tartufo: 16€"
                      className="w-full text-xs p-3 rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-black/40 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                    />
                  </div>
                )}

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowAiScannerModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    type="button"
                    disabled={aiScanning || (!aiScanPhotoBase64 && !aiScanText.trim())}
                    onClick={handleStartAiScan}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                  >
                    {aiScanning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Lettura ed estrazione AI in corso...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Avvia Scansione AI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
