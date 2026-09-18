import React, { useState, useMemo, useEffect, useRef } from 'react';

import { SearchableProductSelect } from "../common/SearchableProductSelect";
import { ManualUnitInput } from '../common/ManualUnitInput';
import { DataExportToolbar } from '../common/DataExportToolbar';
import { useERP } from '../../context/ERPContext';
import { PurchaseItem, Purchase } from '../../types';
import { formatCurrency, formatDate, exportToCSV, cleanWhatsAppPhone, numberToWordsBDT } from '../../utils/formatters';
import { printDocument, exportElementToPDF } from '../../utils/printPdfUtils';
import { ReportPrintModal } from '../common/ReportPrintModal';
import { useAutoSaveDraft } from '../../hooks/useAutoSaveDraft';
import { DraftAutoSaveBanner, AutoSaveStatusBadge } from '../common/DraftAutoSaveBanner';
import {
  Truck,
  Plus,
  Trash2,
  Printer,
  Download,
  Search,
  CheckCircle2,
  AlertCircle,
  Building,
  Building2,
  Calendar,
  X,
  MessageSquare,
  Mail,
  ArrowLeft,
  FileText,
  RotateCcw,
} from 'lucide-react';

export const PurchaseSupplyView: React.FC = () => {
  const {
    products,
    suppliers,
    addSupplier,
    purchases,
    addPurchase,
    bankAccounts,
    currentUser,
    settings,
  } = useERP();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().substring(0, 10));

  const [selectedCurrency, setSelectedCurrency] = useState(settings.baseCurrency || 'BDT');
  const [exchangeRate, setExchangeRate] = useState(1);

  const [items, setItems] = useState<PurchaseItem[]>([
    {
      productId: products.find(p => p.category === 'RAW_MATERIAL')?.id || products[0]?.id || '',
      productName: products.find(p => p.category === 'RAW_MATERIAL')?.nameBangla || products[0]?.nameBangla || '',
      unit: products.find(p => p.category === 'RAW_MATERIAL')?.unit || 'kg',
      quantity: 100,
      unitCost: products.find(p => p.category === 'RAW_MATERIAL')?.purchasePrice || 50,
      total: (products.find(p => p.category === 'RAW_MATERIAL')?.purchasePrice || 50) * 100,
      batchNumber: `BAT-${new Date().toISOString().slice(2, 7).replace('-', '')}-01`,
      mfgDate: new Date().toISOString().substring(0, 10),
      expDate: new Date(Date.now() + 180 * 86400000).toISOString().substring(0, 10),
    },
  ]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [otherCost, setOtherCost] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK' | 'DUE' | 'PARTIAL'>('BANK');
  const [selectedBankId, setSelectedBankId] = useState<string>(bankAccounts[0]?.id || '');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Quick Add Supplier Modal
  const [showNewSupModal, setShowNewSupModal] = useState(false);
  const [newSupName, setNewSupName] = useState('');
  const [newSupCompany, setNewSupCompany] = useState('');
  const [newSupPhone, setNewSupPhone] = useState('');
  const [newSupAddress, setNewSupAddress] = useState('');

  // View purchase modal
  const [previewPurchase, setPreviewPurchase] = useState<Purchase | null>(null);
  const [showRegisterPrintModal, setShowRegisterPrintModal] = useState<boolean>(false);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');

  const handleSoftReset = () => {
    setSearchTerm('');
    setFilterSupplier('');
  };

  // Auto-save input draft to localStorage every few seconds
  const currentPurchaseDraft = useMemo(() => ({
    selectedSupplierId,
    purchaseDate,
    items,
    discountAmount,
    otherCost,
    paidAmount,
    paymentMethod,
    selectedBankId,
    notes,
  }), [
    selectedSupplierId,
    purchaseDate,
    items,
    discountAmount,
    otherCost,
    paidAmount,
    paymentMethod,
    selectedBankId,
    notes,
  ]);

  const purchaseDraft = useAutoSaveDraft({
    key: 'erp_draft_purchase_supply',
    data: currentPurchaseDraft,
    enabled: showCreateModal || items.length > 0,
    intervalMs: 3000,
    onRestore: (draft) => {
      if (draft.selectedSupplierId) setSelectedSupplierId(draft.selectedSupplierId);
      if (draft.purchaseDate) setPurchaseDate(draft.purchaseDate);
      if (draft.items && Array.isArray(draft.items) && draft.items.length > 0) setItems(draft.items);
      if (typeof draft.discountAmount === 'number') setDiscountAmount(draft.discountAmount);
      if (typeof draft.otherCost === 'number') setOtherCost(draft.otherCost);
      if (typeof draft.paidAmount === 'number') setPaidAmount(draft.paidAmount);
      if (draft.paymentMethod) setPaymentMethod(draft.paymentMethod);
      if (draft.selectedBankId) setSelectedBankId(draft.selectedBankId);
      if (typeof draft.notes === 'string') setNotes(draft.notes);
    },
  });

  const handleRestorePurchaseDraft = () => {
    purchaseDraft.restoreDraft();
    purchaseDraft.dismissDraftNotification();
  };

  const hasRestoredRef = useRef(false);
  useEffect(() => {
    if (purchaseDraft.hasSavedDraft && !hasRestoredRef.current) {
      purchaseDraft.restoreDraft();
      setShowCreateModal(true);
      hasRestoredRef.current = true;
    }
  }, [purchaseDraft.hasSavedDraft, purchaseDraft]);

  const handleDiscardPurchaseDraft = () => {
    purchaseDraft.clearDraft();
  };

  const subTotal = items.reduce((sum, it) => sum + (it.unitCost * it.quantity), 0);
  const grandTotal = Math.max(0, subTotal - discountAmount) + otherCost;
  const dueAmount = Math.max(0, grandTotal - paidAmount);

  const handleItemProductChange = (index: number, prodId: string) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;

    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      productId: prod.id,
      productName: prod.nameBangla,
      unit: prod.unit,
      unitCost: prod.purchasePrice,
      total: prod.purchasePrice * newItems[index].quantity,
    };
    setItems(newItems);
  };


  const handleItemUnitChange = (index: number, unit: string) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      unit: unit,
    };
    setItems(newItems);
  };

  const handleItemQtyChange = (index: number, qty: number) => {
    const newItems = [...items];
    const safeQty = Math.max(1, qty);
    newItems[index] = {
      ...newItems[index],
      quantity: safeQty,
      total: safeQty * newItems[index].unitCost,
    };
    setItems(newItems);
  };

  const handleItemCostChange = (index: number, cost: number) => {
    const newItems = [...items];
    const safeCost = Math.max(0, cost);
    newItems[index] = {
      ...newItems[index],
      unitCost: safeCost,
      total: safeCost * newItems[index].quantity,
    };
    setItems(newItems);
  };

  const handleItemFieldChange = (index: number, field: keyof PurchaseItem, val: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: val };
    setItems(newItems);
  };

  const addItemRow = () => {
    const defaultProd = products.find(p => p.category === 'RAW_MATERIAL') || products[0];
    const randBatch = `BAT-${Date.now().toString().slice(-4)}`;
    setItems(prev => [
      ...prev,
      {
        productId: defaultProd.id,
        productName: defaultProd.nameBangla,
        unit: defaultProd.unit,
        quantity: 50,
        unitCost: defaultProd.purchasePrice,
        total: defaultProd.purchasePrice * 50,
        batchNumber: randBatch,
        mfgDate: new Date().toISOString().substring(0, 10),
        expDate: new Date(Date.now() + 180 * 86400000).toISOString().substring(0, 10),
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleCreatePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const sup = suppliers.find(s => s.id === selectedSupplierId);
    if (!sup) {
      setFormError('অনুগ্রহ করে সাপ্লায়ার নির্বাচন করুন।');
      return;
    }

    const res = addPurchase({
      currency: selectedCurrency,
      exchangeRate: exchangeRate,
      foreignTotal: selectedCurrency !== (settings.baseCurrency || 'BDT') ? grandTotal / exchangeRate : undefined,
      date: purchaseDate,
      supplierId: sup.id,
      supplierName: sup.name,
      items,
      subTotal,
      discountAmount,
      otherCost,
      grandTotal,
      paidAmount,
      dueAmount,
      paymentMethod,
      bankAccountId: paymentMethod === 'BANK' ? selectedBankId : undefined,
      notes,
      receivedBy: currentUser?.name || 'Procurement',
    });

    if (!res.success) {
      setFormError(res.error || 'পারচেজ এন্ট্রি ব্যর্থ হয়েছে।');
      return;
    }

    // Success -> clear draft and close modal
    purchaseDraft.clearDraft();
    setShowCreateModal(false);
  };

  const handleQuickAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName.trim()) return;
    const added = addSupplier({
      code: `SUP-${Date.now().toString().slice(-4)}`,
      name: newSupName.trim(),
      companyName: newSupCompany.trim() || newSupName.trim(),
      phone: newSupPhone.trim(),
      address: newSupAddress.trim(),
      openingBalance: 0,
    });
    setSelectedSupplierId(added.id);
    setShowNewSupModal(false);
    setNewSupName('');
    setNewSupCompany('');
    setNewSupPhone('');
    setNewSupAddress('');
  };

  const filteredPurchases = purchases.filter(p => {
    const matchSearch =
      p.billNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSup = filterSupplier ? p.supplierId === filterSupplier : true;
    return matchSearch && matchSup;
  });

  // Totals for purchase register
  const registerTotals = filteredPurchases.reduce(
    (acc, p) => {
      acc.total += p.grandTotal;
      acc.paid += p.paidAmount;
      acc.due += p.dueAmount;
      return acc;
    },
    { total: 0, paid: 0, due: 0 }
  );

  const renderPurchaseRegisterSchedule = () => (
    <div className="space-y-6">
      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            মোট ক্রয় বিল সংখ্যা
          </span>
          <div className="text-xl font-black font-mono text-slate-900 mt-1">
            {filteredPurchases.length} টি
          </div>
          <span className="text-[10px] text-slate-500">অনুমোদিত বিলসমূহ</span>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            মোট ক্রয়মূল্য (Grand Total)
          </span>
          <div className="text-xl font-black font-mono text-blue-700 mt-1">
            {formatCurrency(registerTotals.total)}
          </div>
          <span className="text-[10px] text-slate-500">সর্বমোট ইনভেন্টরি ক্রয়</span>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            মোট পরিশোধিত (Paid)
          </span>
          <div className="text-xl font-black font-mono text-emerald-700 mt-1">
            {formatCurrency(registerTotals.paid)}
          </div>
          <span className="text-[10px] text-slate-500">নগদ ও ব্যাংক পরিশোধ</span>
        </div>

        <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200">
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
            মোট বাকি দেনা (Payable Due)
          </span>
          <div className="text-xl font-black font-mono text-amber-900 mt-1">
            {formatCurrency(registerTotals.due)}
          </div>
          <span className="text-[10px] text-amber-700 font-semibold">সাপ্লায়ার দেনা</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <div className="p-4 pb-0"><DataExportToolbar filename="PurchaseSupplyView_Export" /></div>
<table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white font-bold text-[11px]">
              <th className="py-3 px-3">বিল নং</th>
              <th className="py-3 px-3">তারিখ</th>
              <th className="py-3 px-3">সাপ্লায়ারের নাম</th>
              <th className="py-3 px-3 text-right">বিল টাকা</th>
              <th className="py-3 px-3 text-right">পরিশোধ</th>
              <th className="py-3 px-3 text-right">বকেয়া দেনা</th>
              <th className="py-3 px-3 text-center">পেমেন্ট মেথড</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredPurchases.map((purchase) => (
              <tr key={purchase.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-2 px-3 font-mono font-bold text-blue-700">
                  {purchase.billNo}
                </td>
                <td className="py-2 px-3 text-slate-600">
                  {formatDate(purchase.date)}
                </td>
                <td className="py-2 px-3 font-medium text-slate-900">
                  {purchase.supplierName}
                </td>
                <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                  {formatCurrency(purchase.grandTotal)}
                </td>
                <td className="py-2 px-3 text-right font-mono text-emerald-700 font-semibold">
                  {formatCurrency(purchase.paidAmount)}
                </td>
                <td className="py-2 px-3 text-right font-mono">
                  {purchase.dueAmount > 0 ? (
                    <span className="text-amber-800 font-bold">
                      {formatCurrency(purchase.dueAmount)}
                    </span>
                  ) : (
                    <span className="text-slate-400">০</span>
                  )}
                </td>
                <td className="py-2 px-3 text-center">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">
                    {purchase.paymentMethod}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
              <td colSpan={3} className="py-3 px-3 text-right">
                সর্বমোট যোগফল ({filteredPurchases.length} টি বিল):
              </td>
              <td className="py-3 px-3 text-right font-mono text-blue-900">
                {formatCurrency(registerTotals.total)}
              </td>
              <td className="py-3 px-3 text-right font-mono text-emerald-800">
                {formatCurrency(registerTotals.paid)}
              </td>
              <td className="py-3 px-3 text-right font-mono text-amber-900">
                {formatCurrency(registerTotals.due)}
              </td>
              <td className="py-3 px-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );

  const handleExportCSV = () => {
    const headers = ['Bill No', 'Date', 'Supplier', 'Grand Total', 'Paid', 'Due', 'Payment Method', 'Received By'];
    const rows = filteredPurchases.map(p => [
      p.billNo,
      p.date,
      p.supplierName,
      p.grandTotal,
      p.paidAmount,
      p.dueAmount,
      p.paymentMethod,
      p.receivedBy,
    ]);
    exportToCSV(`Purchase_Report_${new Date().toISOString().substring(0, 10)}`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              সাপ্লাই ও পারচেজ (Purchase / Supply)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            কাঁচামাল ও পণ্য ক্রয়, অটো স্টক বৃদ্ধি, ব্যাচ এন্ট্রি ও সাপ্লায়ার লেজার সমন্বয়
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" />
            CSV এক্সপোর্ট
          </button>
          <button
            id="btn-purchase-register-print-view"
            onClick={() => setShowRegisterPrintModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            title="সকল ক্রয় বিল ও সাপ্লাই রেজিস্টারের প্রিন্ট ভিউ খুলুন"
          >
            <Printer className="w-4 h-4 text-indigo-200" />
            <span>Print View (রেজিস্টার)</span>
          </button>
          <button
            id="btn-open-new-purchase-modal"
            onClick={() => {
              setPaidAmount(grandTotal);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            নতুন ক্রয় বিল যোগ করুন
          </button>
        </div>
      </div>



      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="বিল নম্বর বা সাপ্লায়ারের নাম দিয়ে খুঁজুন..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <select
          value={filterSupplier}
          onChange={e => setFilterSupplier(e.target.value)}
          className="w-full sm:w-60 py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">সকল সাপ্লায়ার</option>
          {suppliers.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <button
          id="btn-purchase-soft-reset"
          onClick={handleSoftReset}
          className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
          title="সার্চ ও সাপ্লায়ার ফিল্টার ডিফল্ট অবস্থায় ফিরিয়ে নিন (Soft Reset)"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>রিসেট</span>
        </button>
      </div>

      {/* Purchase List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <div className="p-4 pb-0"><DataExportToolbar filename="PurchaseSupplyView_Export" /></div>
<table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">বিল নং</th>
                <th className="py-3 px-4">তারিখ</th>
                <th className="py-3 px-4">সাপ্লায়ার</th>
                <th className="py-3 px-4 text-right">বিল টাকা</th>
                <th className="py-3 px-4 text-right">পরিশোধ</th>
                <th className="py-3 px-4 text-right">বকেয়া</th>
                <th className="py-3 px-4">পেমেন্ট মেথড</th>
                <th className="py-3 px-4 text-center">ভিউ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    কোনো ক্রয়ের তথ্য পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredPurchases.map(purchase => (
                  <tr key={purchase.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">
                      {purchase.billNo}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {formatDate(purchase.date)}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {purchase.supplierName}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(purchase.grandTotal)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 font-semibold">
                      {formatCurrency(purchase.paidAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {purchase.dueAmount > 0 ? (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-bold rounded">
                          {formatCurrency(purchase.dueAmount)}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">০</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded text-[10px]">
                        {purchase.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        id={`btn-purchase-print-view-${purchase.id}`}
                        onClick={() => setPreviewPurchase(purchase)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-indigo-200"
                        title="ক্রয় ভাউচার প্রিন্ট ভিউ খুলুন"
                      >
                        <Printer className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Print View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Purchase Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">নতুন ক্রয় / সাপ্লাই এন্ট্রি</h3>
                <p className="text-xs text-slate-400">কাঁচামাল বা পণ্যের ব্যাচ, পরিমাণ ও সাপ্লায়ার সিলেক্ট করুন</p>
              </div>
              <div className="flex items-center gap-3">
                <AutoSaveStatusBadge
                  isSaving={purchaseDraft.isSaving}
                  lastSavedAt={purchaseDraft.lastSavedAt}
                />
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  title="বন্ধ করুন"
                  aria-label="বন্ধ করুন"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {formError && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreatePurchaseSubmit} className="p-6 space-y-6 text-xs">
              {/* Draft auto-save restoration banner */}
              {purchaseDraft.hasSavedDraft && (
                <DraftAutoSaveBanner
                  hasSavedDraft={purchaseDraft.hasSavedDraft}
                  savedTimeFormatted={purchaseDraft.savedTimeFormatted}
                  onRestore={handleRestorePurchaseDraft}
                  onDiscard={handleDiscardPurchaseDraft}
                  onDismiss={purchaseDraft.dismissDraftNotification}
                />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">সাপ্লায়ার নির্বাচন করুন *</label>
                    <button
                      type="button"
                      onClick={() => setShowNewSupModal(true)}
                      className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      নতুন সাপ্লায়ার যোগ
                    </button>
                  </div>
                  <select
                    required
                    value={selectedSupplierId}
                    onChange={e => setSelectedSupplierId(e.target.value)}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500 font-medium"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.companyName}) - দেনা: {formatCurrency(s.currentPayable)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">বিল তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={purchaseDate}
                    onChange={e => setPurchaseDate(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">মুদ্রা (Currency)</label>
                  <select
                    value={selectedCurrency}
                    onChange={e => {
                      const curr = e.target.value;
                      setSelectedCurrency(curr);
                      if (curr === (settings.baseCurrency || 'BDT')) {
                        setExchangeRate(1);
                      } else {
                        const rate = settings.currencies?.find(c => c.code === curr)?.rate || 1;
                        setExchangeRate(rate);
                      }
                    }}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500"
                  >
                    <option value={settings.baseCurrency || 'BDT'}>{settings.baseCurrency || 'BDT'} (Base)</option>
                    {settings.currencies?.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.code} (1 {settings.baseCurrency || 'BDT'} = {c.rate})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                    ক্রয়কৃত পণ্য ও ব্যাচ বিবরণ
                  </span>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    আইটেম যোগ করুন
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((row, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-3 rounded-xl border border-slate-200 space-y-2"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                        <div className="sm:col-span-4">
                          <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">কাঁচামাল / পণ্য</label>
                          <SearchableProductSelect
                            products={products}
                            value={row.productId}
                            onChange={(val) => handleItemProductChange(idx, val)}
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">পরিমাণ</label>
                          <input
                            type="number"
                            min="1"
                            value={row.quantity}
                            onChange={e => handleItemQtyChange(idx, parseFloat(e.target.value) || 1)}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-right font-mono"
                          />
                        </div>
                        
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">একক (পিস/কেজি)</label>
                          <ManualUnitInput
                            value={row.unit}
                            onChange={val => handleItemUnitChange(idx, val)}
                            placeholder="পিস/কেজি/কার্টুন..."
                            compact
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">একক ক্রয়মূল্য (৳)</label>
                          <input
                            type="number"
                            min="0"
                            value={row.unitCost}
                            onChange={e => handleItemCostChange(idx, parseFloat(e.target.value) || 0)}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-right font-mono"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">ব্যাচ নম্বর</label>
                          <input
                            type="text"
                            value={row.batchNumber}
                            onChange={e => handleItemFieldChange(idx, 'batchNumber', e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs"
                          />
                        </div>

                        <div className="sm:col-span-1 flex items-center justify-between sm:justify-end gap-2">
                          <div className="text-right">
                            <span className="block text-[10px] text-slate-400 font-semibold">টোটাল</span>
                            <span className="font-mono font-bold text-slate-900">{formatCurrency(row.total)}</span>
                          </div>
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItemRow(idx)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Batch Expiry Row */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100 text-[11px]">
                        <div>
                          <span className="text-slate-500 mr-1">উৎপাদন তারিখ:</span>
                          <input
                            type="date"
                            value={row.mfgDate || ''}
                            onChange={e => handleItemFieldChange(idx, 'mfgDate', e.target.value)}
                            className="p-1 bg-slate-50 border border-slate-200 rounded text-[11px]"
                          />
                        </div>
                        <div>
                          <span className="text-slate-500 mr-1">মেয়াদ উত্তীর্ণের তারিখ:</span>
                          <input
                            type="date"
                            value={row.expDate || ''}
                            onChange={e => handleItemFieldChange(idx, 'expDate', e.target.value)}
                            className="p-1 bg-slate-50 border border-slate-200 rounded text-[11px]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment & Other Costs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">ছাড় / ডিসকাউন্ট (৳)</label>
                      <input
                        type="number"
                        min="0"
                        value={discountAmount}
                        onChange={e => setDiscountAmount(parseFloat(e.target.value) || 0)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-right font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">আনলোডিং / অন্যান্য খরচ</label>
                      <input
                        type="number"
                        min="0"
                        value={otherCost}
                        onChange={e => setOtherCost(parseFloat(e.target.value) || 0)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-right font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">নোট বা রেফারেন্স</label>
                    <input
                      type="text"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="যেমন: ট্রাক চালান নং, ওজন স্লিপ"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-2 text-xs border-l sm:border-slate-200 sm:pl-6">
                  <div className="flex justify-between text-slate-600">
                    <span>সাব-টোটাল:</span>
                    <span className="font-mono">{formatCurrency(subTotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>ডিসকাউন্ট:</span>
                    <span className="font-mono text-rose-600">- {formatCurrency(discountAmount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>অন্যান্য খরচ:</span>
                    <span className="font-mono text-slate-800">+ {formatCurrency(otherCost)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                    <span>মোট ক্রয়মূল্য:</span>
                    <div className="text-right">
                      <span className="font-mono text-blue-700">{formatCurrency(grandTotal)}</span>
                      {selectedCurrency !== (settings.baseCurrency || 'BDT') && (
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {selectedCurrency} {(grandTotal / exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">পেমেন্ট মাধ্যম</label>
                        <select
                          value={paymentMethod}
                          onChange={e => {
                            const val = e.target.value as typeof paymentMethod;
                            setPaymentMethod(val);
                            if (val === 'DUE') setPaidAmount(0);
                            else if (val === 'CASH' || val === 'BANK') setPaidAmount(grandTotal);
                          }}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                        >
                          <option value="BANK">ব্যাংক একাউন্ট</option>
                          <option value="CASH">নগদ ক্যাশ (Cash)</option>
                          <option value="PARTIAL">আংশিক প্রদান</option>
                          <option value="DUE">সম্পূর্ণ বকেয়া</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">পরিশোধিত টাকা</label>
                        <input
                          type="number"
                          min="0"
                          max={grandTotal}
                          value={paidAmount}
                          onChange={e => setPaidAmount(parseFloat(e.target.value) || 0)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-right font-mono font-bold text-emerald-700"
                        />
                      </div>
                    </div>

                    {paymentMethod === 'BANK' && (
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">ব্যাংক নির্বাচন</label>
                        <select
                          value={selectedBankId}
                          onChange={e => setSelectedBankId(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                        >
                          {bankAccounts.map(b => (
                            <option key={b.id} value={b.id}>{b.accountName} (ব্যালেন্স: {formatCurrency(b.balance)})</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="flex justify-between items-center bg-amber-50 p-2.5 rounded-lg border border-amber-100 font-bold">
                      <span className="text-amber-700">বাকি দেনা (Payable Due):</span>
                      <span className="font-mono text-amber-700 text-sm">{formatCurrency(dueAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  id="btn-submit-purchase"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors"
                >
                  ক্রয় সম্পন্ন ও স্টক আপডেট করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Supplier Modal */}
      {showNewSupModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <h4 className="font-bold text-slate-800 text-sm mb-3">নতুন সাপ্লায়ার যোগ করুন</h4>
            <form onSubmit={handleQuickAddSupplier} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">সাপ্লায়ার / ব্যক্তির নাম *</label>
                <input
                  type="text"
                  required
                  value={newSupName}
                  onChange={e => setNewSupName(e.target.value)}
                  placeholder="যেমন: সিটি সুগার সাপ্লায়ার্স"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">কোম্পানির নাম</label>
                <input
                  type="text"
                  value={newSupCompany}
                  onChange={e => setNewSupCompany(e.target.value)}
                  placeholder="যেমন: City Group Ltd."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">মোবাইল নম্বর *</label>
                <input
                  type="text"
                  required
                  value={newSupPhone}
                  onChange={e => setNewSupPhone(e.target.value)}
                  placeholder="01819-xxxxxx"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ঠিকানা</label>
                <input
                  type="text"
                  value={newSupAddress}
                  onChange={e => setNewSupAddress(e.target.value)}
                  placeholder="কারখানা বা অফিসের ঠিকানা"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewSupModal(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded-lg"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Branded Purchase Voucher / Supply Bill Modal */}
      {previewPurchase && (() => {
        const sup = suppliers.find(s => s.id === previewPurchase.supplierId);
        const cleanPhone = sup?.phone ? cleanWhatsAppPhone(sup.phone) : '';
        const email = sup?.email || '';

        const handleSendWhatsApp = () => {
          const msg = `আসসালামু আলাইকুম, প্রিয় ${previewPurchase.supplierName},\n${settings.companyNameBangla} থেকে ক্রয় ভাউচার:\nবিল নং: ${previewPurchase.billNo}\nতারিখ: ${formatDate(previewPurchase.date)}\nসর্বমোট বিল: ৳${previewPurchase.grandTotal.toLocaleString('en-IN')}\nপরিশোধিত: ৳${previewPurchase.paidAmount.toLocaleString('en-IN')}\nবাকি দেনা: ৳${previewPurchase.dueAmount.toLocaleString('en-IN')}\n\nধন্যবাদান্তে,\n${settings.companyNameBangla}`;
          const url = cleanPhone
            ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
            : `https://wa.me/?text=${encodeURIComponent(msg)}`;
          window.open(url, '_blank');
        };

        const mailtoUrl = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(
          `Purchase Voucher ${previewPurchase.billNo} – ${settings.companyNameBangla}`
        )}&body=${encodeURIComponent(
          `বরাবর,\n${previewPurchase.supplierName}\n\nআপনার প্রেরিত পণ্যের ক্রয় বিল অনুমোদন করা হয়েছে:\n\nবিল নং: ${previewPurchase.billNo}\nতারিখ: ${formatDate(previewPurchase.date)}\nসর্বমোট বিল: ৳${previewPurchase.grandTotal.toLocaleString('en-IN')}\nপরিশোধিত: ৳${previewPurchase.paidAmount.toLocaleString('en-IN')}\nবাকি দেনা: ৳${previewPurchase.dueAmount.toLocaleString('en-IN')}\n\nধন্যবাদান্তে,\n${settings.companyNameBangla}\nফোন: ${settings.phone}`
        )}`;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
            <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
              {/* Toolbar - Screen only */}
              <div className="p-3 sm:px-6 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2.5 print:hidden">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-xs sm:text-sm text-white">ক্রয় চালান ও রসিদ (Purchase Voucher)</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                        Print View
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">বিল নং: {previewPurchase.billNo}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSendWhatsApp}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                    title="WhatsApp-এ ক্রয় ভাউচার পাঠান"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </button>

                  <a
                    href={mailtoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                    title={email ? `ইমেইলে ক্রয় বিল পাঠান (${email})` : 'ইমেইল ক্লায়েন্ট খুলুন'}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Email {email ? `(${email})` : ''}</span>
                  </a>

                  <button
                    onClick={() => printDocument('purchase-voucher-printable-content', { title: `Purchase_Voucher_${previewPurchase.billNo}` })}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
                    title="ক্রয় ভাউচার প্রিন্ট করুন"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>প্রিন্ট</span>
                  </button>

                  <button
                    onClick={() => exportElementToPDF('purchase-voucher-printable-content', { filename: `Purchase_Voucher_${previewPurchase.billNo}.pdf` })}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold rounded-lg border border-slate-700 transition-colors shadow-xs cursor-pointer"
                    title="ক্রয় ভাউচার PDF ডাউনলোড করুন"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="hidden sm:inline">PDF</span>
                  </button>

                  <button
                    onClick={() => setPreviewPurchase(null)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
                    title="বন্ধ করুন"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Branded Voucher Area */}
              <div id="purchase-voucher-printable-content" className="p-6 sm:p-8 overflow-y-auto space-y-6 print:p-0 print:overflow-visible text-slate-800">
                {/* Letterhead Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b-2 border-slate-900">
                  <div className="flex items-center gap-3.5">
                    <div className="w-13 h-13 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black text-xl shadow-md border border-teal-500">
                      {settings.companyNameEnglish ? settings.companyNameEnglish.charAt(0) : 'E'}
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        {settings.companyNameBangla}
                      </h1>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {settings.companyNameEnglish}
                      </p>
                      <p className="text-[11px] text-slate-600 mt-1 max-w-md leading-relaxed">
                        {settings.address} | ফোন: {settings.phone} | ইমেইল: {settings.email}
                      </p>
                      {(settings.taxNumber || settings.tradeLicense) && (
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {settings.taxNumber ? `BIN/TIN: ${settings.taxNumber}` : ''}
                          {settings.taxNumber && settings.tradeLicense ? ' | ' : ''}
                          {settings.tradeLicense ? `ট্রেড লাইসেন্স: ${settings.tradeLicense}` : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="sm:text-right bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-slate-200 w-full sm:w-auto">
                    <span className="inline-block px-3 py-1 bg-slate-900 text-white text-[11px] font-bold uppercase tracking-widest rounded-md mb-1.5">
                      PURCHASE VOUCHER
                    </span>
                    <div className="font-mono text-xs text-slate-700">
                      <span className="text-slate-500">বিল নং:</span> <span className="font-bold text-slate-900">{previewPurchase.billNo}</span>
                    </div>
                    <div className="font-mono text-xs text-slate-700">
                      <span className="text-slate-500">তারিখ:</span> <span className="font-bold">{formatDate(previewPurchase.date)}</span>
                    </div>
                  </div>
                </div>

                {/* Party & Bill Meta Boxes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Supplier Box */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      সরবরাহকারী / ভেন্ডর বিবরণ (Supplier Details)
                    </div>
                    <div className="text-sm font-bold text-slate-900">{previewPurchase.supplierName}</div>
                    {sup?.companyName && (
                      <div className="text-xs text-slate-600 font-medium">{sup.companyName}</div>
                    )}
                    <div className="text-xs text-slate-600 mt-1 font-mono">
                      ফোন: <span className="font-semibold text-slate-900">{sup?.phone || 'তথ্য নেই'}</span>
                    </div>
                    {sup?.email && (
                      <div className="text-xs text-slate-600 font-mono">ইমেইল: {sup.email}</div>
                    )}
                    {sup?.address && (
                      <div className="text-xs text-slate-500 mt-0.5">{sup.address}</div>
                    )}
                  </div>

                  {/* Bill Details Box */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        চালান ও অর্থপরিশোধ তথ্য (Payment & Receiving)
                      </div>
                      <div className="text-xs text-slate-700 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500">পেমেন্ট মেথড:</span>
                          <span className="font-semibold text-slate-900">{previewPurchase.paymentMethod}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">গৃহীত কর্মকর্তা:</span>
                          <span className="font-semibold text-slate-900">{previewPurchase.receivedBy}</span>
                        </div>
                        {previewPurchase.notes && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">মন্তব্য:</span>
                            <span className="text-slate-800">{previewPurchase.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 text-center w-12">#</th>
                        <th className="py-2.5 px-3">পণ্য বা কাঁচামালের বিবরণ</th>
                        <th className="py-2.5 px-3 text-center">ব্যাচ নং</th>
                        <th className="py-2.5 px-3 text-right">পরিমাণ</th>
                        <th className="py-2.5 px-3 text-right">দর (৳)</th>
                        <th className="py-2.5 px-3 text-right">মোট টাকা (৳)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {previewPurchase.items.map((it, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 text-center font-mono text-slate-400">{i + 1}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{it.productName}</td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-500">{it.batchNumber || '-'}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-900 font-medium">
                            {it.quantity} {it.unit}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-700">{formatCurrency(it.unitCost)}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(it.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Financial Summary & Amount in Words */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                  <div className="sm:col-span-7 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      কথায় (Amount in Words):
                    </div>
                    <div className="font-semibold text-slate-800 italic">
                      {numberToWordsBDT(previewPurchase.grandTotal)}
                    </div>
                  </div>

                  <div className="sm:col-span-5 bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>সর্বমোট ক্রয় বিল:</span>
                      <span className="font-mono font-bold text-slate-900">{formatCurrency(previewPurchase.grandTotal)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>পরিশোধিত টাকা:</span>
                      <span className="font-mono">{formatCurrency(previewPurchase.paidAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-300">
                      <span className="font-bold text-slate-800">বাকি পাওনা দেনা:</span>
                      <span className={`font-mono text-sm font-black ${previewPurchase.dueAmount > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
                        {formatCurrency(previewPurchase.dueAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4-Tier Signatures Block */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-12 text-center text-xs">
                  <div>
                    <div className="border-t border-slate-400 pt-1.5 font-bold text-slate-700">
                      তৈরি করেছেন
                    </div>
                    <div className="text-[10px] text-slate-400">স্টোর / অফিসার</div>
                  </div>
                  <div>
                    <div className="border-t border-slate-400 pt-1.5 font-bold text-slate-700">
                      গৃহীত স্বাক্ষর
                    </div>
                    <div className="text-[10px] text-slate-400">গোডাউন ইন-চার্জ</div>
                  </div>
                  <div>
                    <div className="border-t border-slate-400 pt-1.5 font-bold text-slate-700">
                      হিসাব বিভাগ
                    </div>
                    <div className="text-[10px] text-slate-400">অনুমোদিত স্বাক্ষর</div>
                  </div>
                  <div>
                    <div className="border-t border-slate-400 pt-1.5 font-bold text-slate-700">
                      সাপ্লায়ার স্বাক্ষর
                    </div>
                    <div className="text-[10px] text-slate-400">প্রতিনিধি</div>
                  </div>
                </div>

                <div className="text-center text-[10px] text-slate-400 pt-4 border-t border-slate-100">
                  This is a computer-generated official purchase voucher and requires authorized company seals.
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Purchase Register Clean Print Modal */}
      <ReportPrintModal
        isOpen={showRegisterPrintModal}
        onClose={() => setShowRegisterPrintModal(false)}
        title="ক্রয় ও কাঁচামাল সরবরাহ রেজিস্টার রিপোর্ট"
        subtitle="অনুমোদিত ক্রয় বিল, ইনভেন্টরি সরবরাহ এবং সাপ্লায়ার দেনা বিবরণী"
        periodLabel={`মোট রেকর্ড: ${filteredPurchases.length} টি বিল`}
        documentId="purchase-register-print-sheet"
        landscape={true}
      >
        {renderPurchaseRegisterSchedule()}
      </ReportPrintModal>
    </div>
  );
};
