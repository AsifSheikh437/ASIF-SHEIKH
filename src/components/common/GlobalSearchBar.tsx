import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  Search,
  X,
  Package,
  Users,
  Receipt,
  ShoppingCart,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Tag,
  Phone,
  MapPin,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Building2,
  Calendar,
} from 'lucide-react';
import { ModuleKey } from '../../context/ERPContext';

type FilterCategory = 'ALL' | 'PRODUCTS' | 'CUSTOMERS' | 'TRANSACTIONS';

interface SearchResultItem {
  id: string;
  type: 'PRODUCT' | 'CUSTOMER' | 'SALE' | 'PURCHASE';
  title: string;
  subtitle: string;
  details: string;
  categoryTag: string;
  badgeLabel: string;
  badgeClass: string;
  metric?: string;
  metricLabel?: string;
  metricBadgeClass?: string;
  secondaryInfo?: string;
  targetModule: ModuleKey;
  raw: any;
}

export const GlobalSearchBar: React.FC = () => {
  const { products, customers, sales, purchases, setActiveModule, canAccess } = useERP();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('ALL');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [previewItem, setPreviewItem] = useState<SearchResultItem | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut: Ctrl+K or Cmd+K to open, Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        if (previewItem) {
          setPreviewItem(null);
        } else {
          setIsOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, previewItem]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
      setSelectedCategory('ALL');
      setSelectedIndex(0);
      setPreviewItem(null);
    }
  }, [isOpen]);

  // Translate category names for display
  const formatProductCategory = (cat: string) => {
    switch (cat) {
      case 'FINISHED_GOODS':
        return 'তৈরি পণ্য';
      case 'RAW_MATERIAL':
        return 'কাঁচামাল';
      case 'PACKAGING':
        return 'প্যাকেজিং';
      case 'SEMI_FINISHED':
        return 'অর্ধ-প্রস্তুত';
      default:
        return cat;
    }
  };

  // Compute all matching items across Products, Customers, and Transactions
  const allResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    const results: SearchResultItem[] = [];

    // 1. PRODUCTS
    products.forEach(p => {
      const nameBn = (p.nameBangla || '').toLowerCase();
      const nameEn = (p.nameEnglish || p.name || '').toLowerCase();
      const sku = (p.sku || p.code || '').toLowerCase();
      const category = (p.category || '').toLowerCase();
      const categoryBn = formatProductCategory(p.category).toLowerCase();
      const location = (p.location || '').toLowerCase();

      const matches =
        !q ||
        nameBn.includes(q) ||
        nameEn.includes(q) ||
        sku.includes(q) ||
        category.includes(q) ||
        categoryBn.includes(q) ||
        location.includes(q);

      if (matches) {
        let stockBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        if (p.currentStock <= 0) {
          stockBadge = 'bg-rose-50 text-rose-700 border-rose-200';
        } else if (p.currentStock <= p.minStockAlert) {
          stockBadge = 'bg-amber-50 text-amber-700 border-amber-200';
        }

        results.push({
          id: `PRD-${p.id}`,
          type: 'PRODUCT',
          title: p.nameBangla || p.nameEnglish || p.name || 'নামহীন পণ্য',
          subtitle: `SKU: ${p.sku || p.code || 'N/A'} • ${formatProductCategory(p.category)}`,
          details: `বিক্রয়: ${formatCurrency(p.salePrice ?? p.sellingPrice ?? 0)} • ক্রয়: ${formatCurrency(p.purchasePrice || 0)}`,
          categoryTag: 'পণ্য',
          badgeLabel: 'পণ্য (Product)',
          badgeClass: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800',
          metric: `${p.currentStock} ${p.unit}`,
          metricLabel: 'মজুদ',
          metricBadgeClass: stockBadge,
          secondaryInfo: p.location ? `অবস্থান: ${p.location}` : undefined,
          targetModule: 'INVENTORY',
          raw: p,
        });
      }
    });

    // 2. CUSTOMERS
    customers.forEach(c => {
      const name = (c.name || '').toLowerCase();
      const code = (c.code || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      const address = (c.address || '').toLowerCase();
      const email = (c.email || '').toLowerCase();

      const matches =
        !q ||
        name.includes(q) ||
        code.includes(q) ||
        phone.includes(q) ||
        address.includes(q) ||
        email.includes(q);

      if (matches) {
        const hasDue = c.currentDue > 0;
        results.push({
          id: `CUST-${c.id}`,
          type: 'CUSTOMER',
          title: c.name,
          subtitle: `কোড: ${c.code} • 📞 ${c.phone}`,
          details: c.address || 'ঠিকানা উল্লেখ নেই',
          categoryTag: 'কাস্টমার',
          badgeLabel: 'কাস্টমার (Customer)',
          badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
          metric: formatCurrency(c.currentDue),
          metricLabel: hasDue ? 'বকেয়া বাকি' : 'পরিশোধিত',
          metricBadgeClass: hasDue
            ? 'bg-amber-50 text-amber-800 border-amber-200'
            : 'bg-emerald-50 text-emerald-700 border-emerald-200',
          secondaryInfo: `মোট ক্রয়: ${formatCurrency(c.totalBilled)}`,
          targetModule: 'CUSTOMERS_LEDGER',
          raw: c,
        });
      }
    });

    // 3. TRANSACTIONS: SALES
    sales.forEach(s => {
      const invNo = (s.invoiceNo || '').toLowerCase();
      const custName = (s.customerName || '').toLowerCase();
      const phone = (s.customerPhone || '').toLowerCase();
      const notes = (s.notes || '').toLowerCase();
      const servedBy = (s.servedBy || '').toLowerCase();
      const date = (s.date || s.invoiceDate || '').toLowerCase();
      const itemsMatch = s.items?.some(i => (i.productName || '').toLowerCase().includes(q));

      const matches =
        !q ||
        invNo.includes(q) ||
        custName.includes(q) ||
        phone.includes(q) ||
        notes.includes(q) ||
        servedBy.includes(q) ||
        date.includes(q) ||
        itemsMatch;

      if (matches) {
        const total = s.grandTotal || s.totalAmount || 0;
        const due = s.dueAmount || 0;
        results.push({
          id: `SALE-${s.id}`,
          type: 'SALE',
          title: `ইনভয়েস: ${s.invoiceNo}`,
          subtitle: `গ্রাহক: ${s.customerName} • 📅 ${formatDate(s.date || s.invoiceDate)}`,
          details: `${s.items?.length || 0} টি আইটেম • পদ্ধতি: ${s.paymentMethod || 'CASH'}`,
          categoryTag: 'ট্রানজ্যাকশন',
          badgeLabel: 'সেলস ইনভয়েস',
          badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
          metric: formatCurrency(total),
          metricLabel: 'মোট বিক্রয়',
          metricBadgeClass: due > 0
            ? 'bg-amber-50 text-amber-800 border-amber-200'
            : 'bg-teal-50 text-teal-800 border-teal-200',
          secondaryInfo: due > 0 ? `বাকি: ${formatCurrency(due)}` : 'পরিশোধিত',
          targetModule: 'SALES',
          raw: s,
        });
      }
    });

    // 4. TRANSACTIONS: PURCHASES
    purchases.forEach(p => {
      const billNo = (p.billNo || '').toLowerCase();
      const suppName = (p.supplierName || '').toLowerCase();
      const notes = (p.notes || '').toLowerCase();
      const date = (p.date || p.purchaseDate || '').toLowerCase();
      const itemsMatch = p.items?.some(i => (i.productName || '').toLowerCase().includes(q));

      const matches =
        !q ||
        billNo.includes(q) ||
        suppName.includes(q) ||
        notes.includes(q) ||
        date.includes(q) ||
        itemsMatch;

      if (matches) {
        const total = p.grandTotal || 0;
        const due = p.dueAmount || 0;
        results.push({
          id: `PUR-${p.id}`,
          type: 'PURCHASE',
          title: `পারচেজ বিল: ${p.billNo}`,
          subtitle: `সরবরাহকারী: ${p.supplierName} • 📅 ${formatDate(p.date || p.purchaseDate)}`,
          details: `${p.items?.length || 0} টি কাঁচামাল/পণ্য • পদ্ধতি: ${p.paymentMethod || 'CASH'}`,
          categoryTag: 'ট্রানজ্যাকশন',
          badgeLabel: 'পারচেজ বিল',
          badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
          metric: formatCurrency(total),
          metricLabel: 'মোট বিল',
          metricBadgeClass: due > 0
            ? 'bg-rose-50 text-rose-800 border-rose-200'
            : 'bg-indigo-50 text-indigo-800 border-indigo-200',
          secondaryInfo: due > 0 ? `বকেয়া: ${formatCurrency(due)}` : 'পরিশোধিত',
          targetModule: 'PURCHASE',
          raw: p,
        });
      }
    });

    return results;
  }, [query, products, customers, sales, purchases]);

  // Filtered by selected tab
  const filteredResults = useMemo(() => {
    if (selectedCategory === 'ALL') return allResults;
    if (selectedCategory === 'PRODUCTS') return allResults.filter(r => r.type === 'PRODUCT');
    if (selectedCategory === 'CUSTOMERS') return allResults.filter(r => r.type === 'CUSTOMER');
    if (selectedCategory === 'TRANSACTIONS') return allResults.filter(r => r.type === 'SALE' || r.type === 'PURCHASE');
    return allResults;
  }, [allResults, selectedCategory]);

  // Counts for tabs
  const counts = useMemo(() => {
    return {
      all: allResults.length,
      products: allResults.filter(r => r.type === 'PRODUCT').length,
      customers: allResults.filter(r => r.type === 'CUSTOMER').length,
      transactions: allResults.filter(r => r.type === 'SALE' || r.type === 'PURCHASE').length,
    };
  }, [allResults]);

  // Keyboard navigation through search list
  const handleKeyDownInInput = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filteredResults.length - 1 ? prev + 1 : prev));
      scrollActiveItemIntoView(selectedIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
      scrollActiveItemIntoView(selectedIndex - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        handleNavigateToResult(filteredResults[selectedIndex]);
      }
    }
  };

  const scrollActiveItemIntoView = (index: number) => {
    if (!listContainerRef.current) return;
    const elements = listContainerRef.current.querySelectorAll('.search-result-row');
    if (elements[index]) {
      elements[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  };

  const handleNavigateToResult = (item: SearchResultItem) => {
    if (canAccess(item.targetModule)) {
      setActiveModule(item.targetModule);
      setIsOpen(false);
    } else {
      alert('আপনার বর্তমান ইউজার রোলে এই মডিউলে প্রবেশের অনুমতি নেই।');
    }
  };

  const getItemIcon = (type: SearchResultItem['type']) => {
    switch (type) {
      case 'PRODUCT':
        return <Package className="w-5 h-5 text-teal-600 dark:text-teal-400" />;
      case 'CUSTOMER':
        return <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case 'SALE':
        return <Receipt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'PURCHASE':
        return <ShoppingCart className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
    }
  };

  return (
    <>
      {/* 1. TOP NAVBAR TRIGGER (Desktop Search Input + Mobile Icon Button) */}
      <div className="flex items-center">
        {/* Desktop trigger pill */}
        <button
          id="btn-global-search-desktop"
          type="button"
          onClick={() => setIsOpen(true)}
          className="hidden md:flex items-center gap-2.5 px-3 py-1.5 w-44 lg:w-64 xl:w-80 text-xs text-slate-500 hover:text-slate-900 bg-slate-100/80 hover:bg-slate-100 border border-slate-200 hover:border-teal-400/80 rounded-xl transition-all shadow-2xs group cursor-pointer select-none"
          title="পণ্য, কাস্টমার বা ট্রানজ্যাকশন সার্চ করুন (Ctrl + K)"
        >
          <Search className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors shrink-0" />
          <span className="truncate flex-1 text-left font-medium">পণ্য, কাস্টমার, ইনভয়েস...</span>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-2xs">
            <span className="text-[11px]">⌘</span>K
          </kbd>
        </button>

        {/* Mobile trigger icon button */}
        <button
          id="btn-global-search-mobile"
          type="button"
          onClick={() => setIsOpen(true)}
          className="md:hidden w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
          title="গ্লোবাল সার্চ (পণ্য, কাস্টমার, ট্রানজ্যাকশন)"
          aria-label="Search ERP"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>

      {/* 2. COMMAND PALETTE MODAL / BACKDROP */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-3 sm:pt-14 md:pt-18 px-3 sm:px-4 no-print animate-in fade-in duration-150">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Search Palette Card */}
          <div
            id="global-search-palette"
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden z-10 max-h-[88vh] animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-label="ERP গ্লোবাল সার্চ"
          >
            {/* Top Search Input Box */}
            <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-100 dark:border-teal-900/50">
                <Search className="w-5 h-5" />
              </div>

              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDownInInput}
                placeholder="যেকোনো পণ্য, কাস্টমার নাম, ফোন, বা ইনভয়েস নং লিখুন..."
                className="flex-1 bg-transparent border-none text-slate-900 dark:text-white placeholder-slate-400 text-sm sm:text-base font-medium focus:outline-hidden focus:ring-0"
              />

              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="মুছে ফেলুন"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-200 transition-colors"
                title="বন্ধ করুন"
              >
                ESC
              </button>
            </div>

            {/* Category Filter Tabs */}
            <div className="px-3 sm:px-4 py-2.5 bg-slate-50/75 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('ALL');
                  setSelectedIndex(0);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  selectedCategory === 'ALL'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>সকল ফলাফল</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                  selectedCategory === 'ALL' ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-700'
                }`}>
                  {counts.all}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('PRODUCTS');
                  setSelectedIndex(0);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  selectedCategory === 'PRODUCTS'
                    ? 'bg-teal-700 text-white shadow-2xs ring-1 ring-teal-600'
                    : 'bg-white dark:bg-slate-800 text-teal-800 dark:text-teal-300 hover:bg-teal-50 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>পণ্য ও স্টক</span>
                <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono bg-teal-100 dark:bg-teal-900 text-teal-900 dark:text-teal-100">
                  {counts.products}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('CUSTOMERS');
                  setSelectedIndex(0);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  selectedCategory === 'CUSTOMERS'
                    ? 'bg-indigo-700 text-white shadow-2xs ring-1 ring-indigo-600'
                    : 'bg-white dark:bg-slate-800 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-50 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>কাস্টমার</span>
                <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono bg-indigo-100 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100">
                  {counts.customers}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('TRANSACTIONS');
                  setSelectedIndex(0);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  selectedCategory === 'TRANSACTIONS'
                    ? 'bg-emerald-700 text-white shadow-2xs ring-1 ring-emerald-600'
                    : 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>ট্রানজ্যাকশন</span>
                <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono bg-emerald-100 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100">
                  {counts.transactions}
                </span>
              </button>
            </div>

            {/* Results List Section */}
            <div
              ref={listContainerRef}
              className="overflow-y-auto flex-1 p-2 sm:p-3 divide-y divide-slate-100 dark:divide-slate-800/60"
            >
              {filteredResults.length > 0 ? (
                filteredResults.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleNavigateToResult(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`search-result-row group relative flex items-center justify-between gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-teal-50/90 dark:bg-teal-950/40 ring-1 ring-teal-500/50 shadow-2xs'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      {/* Left: Icon + Titles */}
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                          {getItemIcon(item.type)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">
                              {item.title}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${item.badgeClass}`}>
                              {item.badgeLabel}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            {item.subtitle}
                          </div>

                          <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 truncate font-medium">
                            {item.details}
                          </div>

                          {item.secondaryInfo && (
                            <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                              {item.secondaryInfo}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Metrics + Action button */}
                      <div className="flex items-center gap-3 shrink-0 pl-2 text-right">
                        {item.metric && (
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] text-slate-400 font-medium">
                              {item.metricLabel}
                            </span>
                            <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border font-mono ${item.metricBadgeClass || 'bg-slate-100 text-slate-800'}`}>
                              {item.metric}
                            </span>
                          </div>
                        )}

                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-teal-600 group-hover:text-white text-slate-400 flex items-center justify-center transition-colors">
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                /* No Results State */
                <div className="py-10 px-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                    "{query}" এর সাথে মিলিয়ে কোনো ফলাফল পাওয়া যায়নি
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    প্রোডাক্টের নাম, SKU কোড, কাস্টমার নাম, মোবাইল নম্বর বা ইনভয়েস নম্বর দিয়ে আবার চেষ্টা করুন।
                  </p>

                  <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
                    <button
                      onClick={() => setQuery('')}
                      className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                    >
                      সার্চ রিসেট করুন
                    </button>
                    <button
                      onClick={() => setSelectedCategory('ALL')}
                      className="px-3 py-1.5 text-xs bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg font-medium transition-colors"
                    >
                      সব ক্যাটাগরি দেখুন
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Navigation Footer */}
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline">কিবোর্ড শর্টকাট:</span>
                <span className="inline-flex items-center gap-1 font-mono">
                  <kbd className="px-1 py-0.2 bg-white dark:bg-slate-800 border rounded text-[10px]">↑</kbd>
                  <kbd className="px-1 py-0.2 bg-white dark:bg-slate-800 border rounded text-[10px]">↓</kbd>
                  <span className="text-[10px]">নেভিগেট</span>
                </span>
                <span className="inline-flex items-center gap-1 font-mono">
                  <kbd className="px-1 py-0.2 bg-white dark:bg-slate-800 border rounded text-[10px]">↵</kbd>
                  <span className="text-[10px]">খুলুন</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-teal-700 dark:text-teal-400 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>মোট {counts.all} টি রেকর্ড ইনডেক্স করা</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
