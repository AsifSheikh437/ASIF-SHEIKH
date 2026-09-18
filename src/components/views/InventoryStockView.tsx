import React, { useState } from 'react';
import { DataExportToolbar } from '../common/DataExportToolbar';
import { StockImportModal } from '../common/StockImportModal';
import { useERP } from '../../context/ERPContext';
import { Product, ProductCategory, UnitType } from '../../types';
import { formatCurrency, exportToCSV } from '../../utils/formatters';
import { printDocument, exportElementToPDF } from '../../utils/printPdfUtils';
import {
  Package,
  Plus,
  Search,
  Download,
  Printer,
  AlertTriangle,
  SlidersHorizontal,
  RefreshCw,
  X,
  CheckCircle2,
  FileSpreadsheet,
  RotateCcw,
} from 'lucide-react';

export const InventoryStockView: React.FC = () => {
  const {
    products,
    addProduct,
    adjustStock,
    totalStockValue,
    lowStockCount,
    settings,
  } = useERP();

  const [activeCategory, setActiveCategory] = useState<'ALL' | ProductCategory>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);

  const handleSoftReset = () => {
    setActiveCategory('ALL');
    setSearchTerm('');
    setFilterLowStockOnly(false);
  };

  // New Product Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [newSku, setNewSku] = useState('');
  const [newNameBangla, setNewNameBangla] = useState('');
  const [newNameEnglish, setNewNameEnglish] = useState('');
  const [newCategory, setNewCategory] = useState<ProductCategory>('FINISHED_GOODS');
  const [newUnit, setNewUnit] = useState<UnitType>('packet');
  const [newPurchasePrice, setNewPurchasePrice] = useState<number>(0);
  const [newSellingPrice, setNewSellingPrice] = useState<number>(0);
  const [newOpeningStock, setNewOpeningStock] = useState<number>(0);
  const [newMinStockAlert, setNewMinStockAlert] = useState<number>(20);

  // Stock Adjustment Modal
  const [adjustTargetProduct, setAdjustTargetProduct] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustType, setAdjustType] = useState<'ADD' | 'SUBTRACT'>('SUBTRACT');
  const [adjustReason, setAdjustReason] = useState('পণ্য নষ্ট / ড্যামেজ');

  // Fuzzy search implementation
  const fuzzyMatch = (str: string | undefined | null, pattern: string) => {
    if (!str) return false;
    const cleanPattern = pattern.toLowerCase().replace(/\s/g, '');
    const cleanStr = str.toLowerCase();
    
    if (cleanStr.includes(cleanPattern)) return true;
    
    let patternIdx = 0;
    let strIdx = 0;
    while (patternIdx < cleanPattern.length && strIdx < cleanStr.length) {
      if (cleanPattern[patternIdx] === cleanStr[strIdx]) {
        patternIdx++;
      }
      strIdx++;
    }
    return patternIdx === cleanPattern.length;
  };

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchCat = activeCategory === 'ALL' ? true : p.category === activeCategory;
    
    let matchSearch = true;
    if (searchTerm.trim()) {
        const term = searchTerm.trim();
        matchSearch = fuzzyMatch(p.nameBangla, term) || 
                      fuzzyMatch(p.nameEnglish, term) || 
                      fuzzyMatch(p.sku, term) ||
                      fuzzyMatch(p.id, term);
    }

    const matchLowStock = filterLowStockOnly ? p.currentStock <= p.minStockAlert : true;
    return matchCat && matchSearch && matchLowStock;
  });

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNameBangla.trim()) return;

    addProduct({
      sku: newSku.trim() || `PRD-${Date.now().toString().slice(-4)}`,
      nameBangla: newNameBangla.trim(),
      nameEnglish: newNameEnglish.trim() || newNameBangla.trim(),
      category: newCategory,
      unit: newUnit as UnitType,
      purchasePrice: newPurchasePrice,
      sellingPrice: newSellingPrice,
      currentStock: newOpeningStock,
      minStockAlert: newMinStockAlert,
    });

    setShowAddModal(false);
    setNewSku('');
    setNewNameBangla('');
    setNewNameEnglish('');
    setNewPurchasePrice(0);
    setNewSellingPrice(0);
    setNewOpeningStock(0);
  };

  const handleAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTargetProduct || adjustQty <= 0) return;

    const finalDelta = adjustType === 'ADD' ? adjustQty : -adjustQty;
    adjustStock(adjustTargetProduct.id, finalDelta, adjustReason);
    setAdjustTargetProduct(null);
    setAdjustQty(0);
  };

  const handleExportCSV = () => {
    const headers = ['SKU', 'Name (Bangla)', 'Category', 'Unit', 'Stock', 'Purchase Price', 'Selling Price', 'Total Valuation'];
    const rows = filteredProducts.map(p => [
      p.sku,
      p.nameBangla,
      p.category,
      p.unit,
      p.currentStock,
      p.purchasePrice,
      p.sellingPrice,
      p.currentStock * p.purchasePrice,
    ]);
    exportToCSV(`Inventory_Stock_${new Date().toISOString().substring(0, 10)}`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-teal-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              স্টক ও ইনভেন্টরি মাস্টার (Stock & Inventory)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            কাঁচামাল, ফিনিশড ফুড ও প্যাকেজিং এর রিয়েল-টাইম স্টক, ভ্যালুয়েশন ও রি-অর্ডার নোটিফিকেশন
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => printDocument('stock-ledger-print-area', { title: 'Stock_Inventory_Ledger', landscape: true })}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            title="স্টক লেজার সরাসরি প্রিন্ট করুন"
          >
            <Printer className="w-4 h-4 text-teal-400" />
            প্রিন্ট
          </button>
          <button
            onClick={() => exportElementToPDF('stock-ledger-print-area', { filename: `Stock_Inventory_Ledger_${new Date().toISOString().substring(0, 10)}.pdf`, orientation: 'landscape' })}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            title="স্টক লেজার PDF ফাইল ডাউনলোড করুন"
          >
            <Download className="w-4 h-4" />
            PDF ডাউনলোড
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            title="Excel/CSV ডাউনলোড"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            নতুন পণ্য যোগ করুন
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Import CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            মোট ইনভেন্টরি ভ্যালুয়েশন
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1 font-sans">
            {formatCurrency(totalStockValue)}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">ক্রয়মূল্যের ওপর ভিত্তি করে হিসাবকৃত</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            নিবন্ধিত পণ্যের সংখ্যা
          </span>
          <div className="text-2xl font-black text-teal-700 mt-1 font-sans">
            {products.length} টি আইটেম
          </div>
          <div className="text-xs text-slate-400 mt-0.5">কাঁচামাল + ফিনিশড খাদ্যপণ্য</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            কম স্টক সতর্কতা (Re-order)
          </span>
          <div className="text-2xl font-black text-rose-600 mt-1 font-sans">
            {lowStockCount} টি আইটেম
          </div>
          <div className="text-xs text-rose-500 font-medium mt-0.5">তাৎক্ষণিক রি-অর্ডার প্রয়োজন</div>
        </div>
      </div>

      {/* Filter and Tab Section */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveCategory('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeCategory === 'ALL' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              সব পণ্য ({products.length})
            </button>
            <button
              onClick={() => setActiveCategory('RAW_MATERIAL')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeCategory === 'RAW_MATERIAL' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              কাঁচামাল (Raw)
            </button>
            <button
              onClick={() => setActiveCategory('FINISHED_GOODS')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeCategory === 'FINISHED_GOODS' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ফিনিশড গুডস (Food)
            </button>
            <button
              onClick={() => setActiveCategory('PACKAGING')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeCategory === 'PACKAGING' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              প্যাকেজিং
            </button>
          </div>

          {/* Search & Low Stock Checkbox */}
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="নাম বা কোড দিয়ে খুঁজুন..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filterLowStockOnly}
                onChange={e => setFilterLowStockOnly(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="font-semibold text-rose-700">কম স্টক</span>
            </label>

            <button
              id="btn-stock-soft-reset"
              onClick={handleSoftReset}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              title="স্টক ক্যাটাগরি, সার্চ ও ফিল্টার ডিফল্টে ফিরিয়ে নিন (Soft Reset)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>রিসেট</span>
            </button>
          </div>
        </div>

        {/* Products Table Desktop */}
        <div id="stock-ledger-print-area" className="bg-white rounded-2xl p-2">
          {/* Printable Letterhead */}
          <div className="hidden print:block p-4 border-b-2 border-slate-800 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold text-slate-900">{settings.companyNameBangla}</h1>
                <p className="text-xs text-slate-600">{settings.companyNameEnglish} | {settings.tagline}</p>
                <p className="text-[11px] text-slate-500">ঠিকানা: {settings.address} | ফোন: {settings.phone}</p>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 bg-slate-900 text-white text-xs font-bold rounded">ইনভেন্টরি ও স্টক লেজার</span>
                <p className="text-xs text-slate-500 mt-1 font-mono">তারিখ: {new Date().toLocaleDateString('bn-BD')}</p>
                <p className="text-xs text-slate-700 font-bold">মোট স্টক মূল্য: {formatCurrency(totalStockValue)}</p>
              </div>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <div className="p-4 pb-0"><DataExportToolbar filename="InventoryStockView_Export" /></div>
<table className="w-full text-left text-xs min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">এসকেইউ (SKU)</th>
                  <th className="py-2.5 px-3">খাদ্যপণ্য / কাঁচামাল</th>
                  <th className="py-2.5 px-3">ক্যাটাগরি</th>
                  <th className="py-2.5 px-3 text-right">বর্তমান স্টক</th>
                  <th className="py-2.5 px-3 text-right">ক্রয়মূল্য</th>
                  <th className="py-2.5 px-3 text-right">বিক্রয়মূল্য</th>
                  <th className="py-2.5 px-3 text-right">মোট স্টক ভ্যালু</th>
                  <th className="py-2.5 px-3 text-center">স্ট্যাটাস</th>
                  <th className="py-2.5 px-3 text-center no-print">অ্যাডজাস্ট</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      কোনো পণ্য পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(p => {
                    const isLow = p.currentStock <= p.minStockAlert;
                    const itemStockValue = p.currentStock * p.purchasePrice;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-700">{p.sku}</td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{p.nameBangla}</div>
                          <div className="text-[11px] text-slate-400">{p.nameEnglish}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-sm">
                          <span className={isLow ? 'text-rose-600' : 'text-slate-900'}>
                            {p.currentStock} {p.unit}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">
                          {formatCurrency(p.purchasePrice)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-teal-700">
                          {p.sellingPrice > 0 ? formatCurrency(p.sellingPrice) : '-'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(itemStockValue)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isLow ? (
                            <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-bold rounded text-[10px] inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              কম স্টক!
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-semibold rounded text-[10px]">
                              পর্যাপ্ত
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center no-print">
                          <button
                            onClick={() => {
                              setAdjustTargetProduct(p);
                              setAdjustQty(0);
                            }}
                            className="px-2 py-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg text-[11px] transition-colors flex items-center gap-1 mx-auto"
                            title="ম্যানুয়াল স্টক অ্যাডজাস্ট"
                          >
                            <SlidersHorizontal className="w-3 h-3" />
                            অ্যাডজাস্ট
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Dedicated Stock Card View */}
          <div className="md:hidden space-y-3 p-1">
            {filteredProducts.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                কোনো পণ্য পাওয়া যায়নি।
              </div>
            ) : (
              filteredProducts.map(p => {
                const isLow = p.currentStock <= p.minStockAlert;
                const itemStockValue = p.currentStock * p.purchasePrice;

                return (
                  <div
                    key={p.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isLow
                        ? 'border-rose-300 bg-rose-50/30'
                        : 'border-slate-200 bg-white'
                    } shadow-xs space-y-2.5`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{p.nameBangla}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{p.sku} | {p.nameEnglish}</div>
                      </div>
                      {isLow ? (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-full text-[10px] inline-flex items-center gap-1 shrink-0 animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          কম স্টক
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold rounded-full text-[10px] shrink-0">
                          পর্যাপ্ত
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-slate-50 rounded-xl">
                        <span className="text-[11px] text-slate-500 block">বর্তমান স্টক</span>
                        <span className={`text-base font-black font-mono ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                          {p.currentStock} {p.unit}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-xl text-right">
                        <span className="text-[11px] text-slate-500 block">স্টক মূল্য</span>
                        <span className="text-base font-black font-mono text-teal-800">
                          {formatCurrency(itemStockValue)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                      <span className="text-slate-500">
                        দর: {p.sellingPrice > 0 ? formatCurrency(p.sellingPrice) : formatCurrency(p.purchasePrice)}
                      </span>
                      <button
                        onClick={() => {
                          setAdjustTargetProduct(p);
                          setAdjustQty(0);
                        }}
                        className="min-h-[44px] px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                        title="ম্যানুয়াল স্টক অ্যাডজাস্ট"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>অ্যাডজাস্ট</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-none sm:rounded-3xl min-h-screen sm:min-h-0 shadow-2xl p-5 sm:p-6 border-0 sm:border border-slate-200 animate-in fade-in zoom-in-95 my-0 sm:my-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">নতুন খাদ্যপণ্য বা কাঁচামাল এন্ট্রি</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
                title="বন্ধ করুন"
                aria-label="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">পণ্যের নাম (বাংলা) *</label>
                  <input
                    type="text"
                    required
                    value={newNameBangla}
                    onChange={e => setNewNameBangla(e.target.value)}
                    placeholder="যেমন: প্রিমিয়াম বিস্কুট"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">পণ্যের নাম (ইংরেজি)</label>
                  <input
                    type="text"
                    value={newNameEnglish}
                    onChange={e => setNewNameEnglish(e.target.value)}
                    placeholder="e.g. Premium Biscuit"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ক্যাটাগরি *</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as ProductCategory)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="FINISHED_GOODS">ফিনিশড গুডস (Finished Food)</option>
                    <option value="RAW_MATERIAL">কাঁচামাল (Raw Material)</option>
                    <option value="PACKAGING">প্যাকেজিং (Packaging)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">পরিমাপের একক *</label>
                  <select
                    value={newUnit}
                    onChange={e => setNewUnit(e.target.value as UnitType)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="packet">packet (প্যাকেট)</option>
                    <option value="box">box (কার্টুন/বক্স)</option>
                    <option value="kg">kg (কেজি)</option>
                    <option value="liter">liter (লিটার)</option>
                    <option value="piece">piece (পিস)</option>
                    <option value="sack">sack (বস্তা)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ক্রয়মূল্য / কস্ট দর (৳) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newPurchasePrice}
                    onChange={e => setNewPurchasePrice(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">বিক্রয়মূল্য (৳)</label>
                  <input
                    type="number"
                    min="0"
                    value={newSellingPrice}
                    onChange={e => setNewSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">প্রারম্ভিক স্টক (Opening Stock)</label>
                  <input
                    type="number"
                    min="0"
                    value={newOpeningStock}
                    onChange={e => setNewOpeningStock(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">মিনিমাম স্টক অ্যালার্ট সীমা</label>
                  <input
                    type="number"
                    min="1"
                    value={newMinStockAlert}
                    onChange={e => setNewMinStockAlert(parseFloat(e.target.value) || 20)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 text-white font-bold rounded-xl"
                >
                  পণ্য সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjustTargetProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-none sm:rounded-3xl min-h-screen sm:min-h-0 shadow-2xl p-5 sm:p-6 border-0 sm:border border-slate-200 animate-in fade-in zoom-in-95 my-0 sm:my-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">স্টক সংশোধন ও অ্যাডজাস্টমেন্ট</h3>
              <button
                onClick={() => setAdjustTargetProduct(null)}
                className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
                title="বন্ধ করুন"
                aria-label="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">পণ্য:</span>
                <span className="font-bold text-slate-800">{adjustTargetProduct.nameBangla}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">বর্তমান স্টক:</span>
                <span className="font-mono font-bold text-teal-700">{adjustTargetProduct.currentStock} {adjustTargetProduct.unit}</span>
              </div>
            </div>

            <form onSubmit={handleAdjustStock} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">অ্যাডজাস্টমেন্ট ধরণ *</label>
                <select
                  value={adjustType}
                  onChange={e => setAdjustType(e.target.value as 'ADD' | 'SUBTRACT')}
                  className="w-full p-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="SUBTRACT">স্টক কমানো (ঘাটতি / নষ্ট / মেয়াদোত্তীর্ণ)</option>
                  <option value="ADD">স্টক বাড়ানো (উদ্বৃত্ত / পাওয়া গেছে)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  সংশোধিত পরিমাণ ({adjustTargetProduct.unit}) *
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  required
                  min="1"
                  value={adjustQty}
                  onChange={e => setAdjustQty(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">কারণ বা অডিট নোট *</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  placeholder="যেমন: ফ্যাক্টরি ড্যামেজ, ডেট এক্সপায়ার, বা শারীরিক গণনা সমন্বয়"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setAdjustTargetProduct(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 text-white font-bold rounded-xl"
                >
                  স্টক আপডেট নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Import Modal */}
      <StockImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        products={products}
        onImport={(adjustments, mode) => {
          adjustments.forEach(adj => {
            adjustStock(adj.productId, adj.delta, `CSV Import - ${mode}`);
          });
        }}
      />
    </div>
  );
};
