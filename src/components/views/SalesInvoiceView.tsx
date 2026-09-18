import React, { useState, useMemo, useEffect, useRef } from 'react';

import { SearchableProductSelect } from "../common/SearchableProductSelect";
import { ManualUnitInput } from '../common/ManualUnitInput';
import { DataExportToolbar } from '../common/DataExportToolbar';
import { DictationButton } from '../common/DictationButton';
import { useERP } from '../../context/ERPContext';
import { SaleItem, Sale } from '../../types';
import { formatCurrency, toBengaliNumber, formatDate, exportToCSV } from '../../utils/formatters';
import { printDocument, exportElementToPDF, shareAsPDF } from '../../utils/printPdfUtils';
import { generateProfessionalInvoicePDF, generateBatchProfessionalInvoicesPDF } from '../../utils/invoicePdfGenerator';
import { sendEmailViaGmail } from '../../services/gmailService';
import { ReportPrintModal } from '../common/ReportPrintModal';
import { useAutoSaveDraft } from '../../hooks/useAutoSaveDraft';
import { DraftAutoSaveBanner, AutoSaveStatusBadge } from '../common/DraftAutoSaveBanner';
import {
  ShoppingCart,
  Plus,
  Trash2,
  Printer,
  Download,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
  Calendar,
  X,
  CreditCard,
  ArrowLeft,
  MessageSquare,
  Mail,
  Send,
  Truck,
  Clock,
  ShieldCheck,
  ChevronRight,
  UserCheck,
  ArrowRight,
  PackageCheck,
  RotateCcw,
  Phone,
} from 'lucide-react';

export const SalesInvoiceView: React.FC = () => {
  const {
    products,
    batches,
    customers,
    addCustomer,
    sales,
    addSale,
    updateSaleWorkflow,
    employees,
    bankAccounts,
    currentUser,
    settings,
  } = useERP();

  // Sales 3-Step Confirmation Workflow state
  const [workflowTab, setWorkflowTab] = useState<'ALL' | 'PENDING' | 'DELIVERED'>('ALL');
  const [selectedSaleForWorkflow, setSelectedSaleForWorkflow] = useState<Sale | null>(null);
  const [workflowModalMode, setWorkflowModalMode] = useState<'ASSIGN' | 'GATEPASS' | 'TIMELINE' | null>(null);
  const [wfDeliveryPerson, setWfDeliveryPerson] = useState('');
  const [wfDeliveryPhone, setWfDeliveryPhone] = useState('');
  const [wfVehicleNo, setWfVehicleNo] = useState('');
  const [wfGatePassNo, setWfGatePassNo] = useState('');
  const [wfNotes, setWfNotes] = useState('');

  // Create Sale Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().substring(0, 10));
  const [selectedCurrency, setSelectedCurrency] = useState(settings.baseCurrency || 'BDT');
  const [exchangeRate, setExchangeRate] = useState(1);

  const [items, setItems] = useState<SaleItem[]>([
    {
      productId: products.find(p => p.category === 'FINISHED_GOODS')?.id || products[0]?.id || '',
      productName: products.find(p => p.category === 'FINISHED_GOODS')?.nameBangla || products[0]?.nameBangla || '',
      unit: products.find(p => p.category === 'FINISHED_GOODS')?.unit || 'packet',
      quantity: 10,
      unitPrice: products.find(p => p.category === 'FINISHED_GOODS')?.sellingPrice || 50,
      total: (products.find(p => p.category === 'FINISHED_GOODS')?.sellingPrice || 50) * 10,
      costPrice: products.find(p => p.category === 'FINISHED_GOODS')?.purchasePrice || 35,
    },
  ]);
  const [discountType, setDiscountType] = useState<'FLAT' | 'PERCENT'>('FLAT');
  const [discountVal, setDiscountVal] = useState<number>(0);
  const [vatPercent, setVatPercent] = useState<number>(settings.defaultVatPercent || 5);
  const [transportCost, setTransportCost] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK' | 'DUE' | 'PARTIAL'>('CASH');
  const [selectedBankId, setSelectedBankId] = useState<string>(bankAccounts[0]?.id || '');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Add Customer on-the-fly state
  const [showNewCustModal, setShowNewCustModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  // Invoice Print Preview state
  const [previewSale, setPreviewSale] = useState<Sale | null>(null);
  const [showRegisterPrintModal, setShowRegisterPrintModal] = useState<boolean>(false);

  // WhatsApp Share Dialog State
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [waPhoneNumber, setWaPhoneNumber] = useState('');

  // Email Share Dialog State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Search & Filter state for Sales History Table
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [selectedSales, setSelectedSales] = useState<string[]>([]);

  const handleToggleSelectSale = (saleId: string) => {
    setSelectedSales(prev => prev.includes(saleId) ? prev.filter(id => id !== saleId) : [...prev, saleId]);
  };

  const handleSelectAllSales = (filteredSalesList: Sale[]) => {
    if (selectedSales.length === filteredSalesList.length && filteredSalesList.length > 0) {
      setSelectedSales([]);
    } else {
      setSelectedSales(filteredSalesList.map(s => s.id));
    }
  };

  const handleSoftReset = () => {
    setSearchTerm('');
    setFilterCustomer('');
    setWorkflowTab('ALL');
  };

  // Auto-save input draft to localStorage every few seconds
  const currentSalesDraft = useMemo(() => ({
    selectedCustomerId,
    saleDate,
    items,
    discountType,
    discountVal,
    vatPercent,
    transportCost,
    paidAmount,
    paymentMethod,
    selectedBankId,
    notes,
  }), [
    selectedCustomerId,
    saleDate,
    items,
    discountType,
    discountVal,
    vatPercent,
    transportCost,
    paidAmount,
    paymentMethod,
    selectedBankId,
    notes,
  ]);

  const salesDraft = useAutoSaveDraft({
    key: 'erp_draft_sales_invoice',
    data: currentSalesDraft,
    enabled: showCreateModal || items.length > 0,
    intervalMs: 3000,
    onRestore: (draft) => {
      if (draft.selectedCustomerId) setSelectedCustomerId(draft.selectedCustomerId);
      if (draft.saleDate) setSaleDate(draft.saleDate);
      if (draft.items && Array.isArray(draft.items) && draft.items.length > 0) setItems(draft.items);
      if (draft.discountType) setDiscountType(draft.discountType);
      if (typeof draft.discountVal === 'number') setDiscountVal(draft.discountVal);
      if (typeof draft.vatPercent === 'number') setVatPercent(draft.vatPercent);
      if (typeof draft.transportCost === 'number') setTransportCost(draft.transportCost);
      if (typeof draft.paidAmount === 'number') setPaidAmount(draft.paidAmount);
      if (draft.paymentMethod) setPaymentMethod(draft.paymentMethod);
      if (draft.selectedBankId) setSelectedBankId(draft.selectedBankId);
      if (typeof draft.notes === 'string') setNotes(draft.notes);
    },
  });

  const handleRestoreSalesDraft = () => {
    salesDraft.restoreDraft();
    salesDraft.dismissDraftNotification();
  };

  const hasRestoredRef = useRef(false);
  useEffect(() => {
    if (salesDraft.hasSavedDraft && !hasRestoredRef.current) {
      salesDraft.restoreDraft();
      setShowCreateModal(true);
      hasRestoredRef.current = true;
    }
  }, [salesDraft.hasSavedDraft, salesDraft]);

  const handleDiscardSalesDraft = () => {
    salesDraft.clearDraft();
  };

  // Compute live subtotal & grand totals
  const subTotal = items.reduce((sum, it) => sum + (it.unitPrice * it.quantity), 0);
  const discountAmount = discountType === 'PERCENT' ? (subTotal * discountVal) / 100 : discountVal;
  const taxableAmount = Math.max(0, subTotal - discountAmount);
  const vatAmount = (taxableAmount * vatPercent) / 100;
  // Per revised rules: Sales transport cost is borne by company and deducted from sales price (OpEx)
  const grandTotal = Math.max(0, taxableAmount + vatAmount - transportCost);
  const dueAmount = Math.max(0, grandTotal - paidAmount);

  // Handle item row changes
  const handleItemProductChange = (index: number, prodId: string) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;

    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      productId: prod.id,
      productName: prod.nameBangla,
      unit: prod.unit,
      unitPrice: prod.sellingPrice,
      costPrice: prod.purchasePrice,
      total: prod.sellingPrice * newItems[index].quantity,
    };
    setItems(newItems);
  };

  const handleItemQtyChange = (index: number, qty: number) => {
    const newItems = [...items];
    const safeQty = Math.max(1, qty);
    newItems[index] = {
      ...newItems[index],
      quantity: safeQty,
      total: safeQty * newItems[index].unitPrice,
    };
    setItems(newItems);
  };

  const handleItemPriceChange = (index: number, price: number) => {
    const newItems = [...items];
    const safePrice = Math.max(0, price);
    newItems[index] = {
      ...newItems[index],
      unitPrice: safePrice,
      total: safePrice * newItems[index].quantity,
    };
    setItems(newItems);
  };

  const handleItemBatchChange = (index: number, batchNo: string) => {
    const newItems = [...items];
    newItems[index].batchNumber = batchNo;
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

  const addItemRow = () => {
    const defaultProd = products.find(p => p.category === 'FINISHED_GOODS') || products[0];
    setItems(prev => [
      ...prev,
      {
        productId: defaultProd.id,
        productName: defaultProd.nameBangla,
        unit: defaultProd.unit,
        quantity: 1,
        unitPrice: defaultProd.sellingPrice,
        costPrice: defaultProd.purchasePrice,
        total: defaultProd.sellingPrice,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Submit sale
  const handleCreateSaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (items.length === 0) {
      setFormError('কমপক্ষে একটি পণ্য ইনভয়েসে যোগ করুন।');
      return;
    }

    const cust = customers.find(c => c.id === selectedCustomerId);
    if (!cust) {
      setFormError('অনুগ্রহ করে কাস্টমার নির্বাচন করুন।');
      return;
    }

    const res = addSale({
      currency: selectedCurrency,
      exchangeRate: exchangeRate,
      foreignTotal: selectedCurrency !== (settings.baseCurrency || 'BDT') ? grandTotal / exchangeRate : undefined,
      date: saleDate,
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone,
      items,
      subTotal,
      discountType,
      discountValue: discountVal,
      discountAmount,
      vatPercent,
      vatAmount,
      transportCost,
      grandTotal,
      paidAmount,
      dueAmount,
      paymentMethod,
      bankAccountId: paymentMethod === 'BANK' ? selectedBankId : undefined,
      notes,
      servedBy: currentUser?.name || 'Sales Staff',
    });

    if (!res.success) {
      setFormError(res.error || 'সেল এন্ট্রি ব্যর্থ হয়েছে।');
      return;
    }

    // Success -> clear draft and close modal
    salesDraft.clearDraft();
    setShowCreateModal(false);
    const createdSale = sales.find(s => s.invoiceNo === res.invoiceNo);
    if (createdSale) {
      setPreviewSale(createdSale);
    }
  };

  // Handle Quick Add Customer
  const handleQuickAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;
    const added = addCustomer({
      code: `CUS-${Date.now().toString().slice(-4)}`,
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      address: newCustAddress.trim(),
      openingBalance: 0,
    });
    setSelectedCustomerId(added.id);
    setShowNewCustModal(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
  };

  // WhatsApp Share Handlers
  const handleOpenWhatsAppDialog = (sale: Sale) => {
    let cleanPhone = (sale.customerPhone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('01')) {
      cleanPhone = '880' + cleanPhone.substring(1);
    } else if (cleanPhone.length === 10 && cleanPhone.startsWith('1')) {
      cleanPhone = '880' + cleanPhone;
    }
    setWaPhoneNumber(cleanPhone);
    setShowWhatsAppModal(true);
  };

  const getWhatsAppMessageText = (sale: Sale) => {
    const itemsSummary = (sale.items || [])
      .map((it, idx) => `${toBengaliNumber(idx + 1)}. ${it.productName} (${it.quantity} ${it.unit}) - ৳${it.total.toLocaleString()}`)
      .join('\n');

    return (
      `*${settings.companyNameBangla || 'ফুড ইআরপি সিস্টেম'}*\n` +
      `------------------------------------\n` +
      `🧾 *ইনভয়েস নাম্বার:* ${sale.invoiceNo}\n` +
      `📅 *তারিখ:* ${formatDate(sale.date)}\n` +
      `👤 *কাস্টমারের নাম:* ${sale.customerName}\n` +
      (sale.customerPhone ? `📞 *মোবাইল:* ${sale.customerPhone}\n` : '') +
      `------------------------------------\n` +
      `🛒 *পণ্যের বিবরণ:*\n${itemsSummary}\n` +
      `------------------------------------\n` +
      `💵 *সাব-টোটাল:* ৳${sale.subTotal.toLocaleString()}\n` +
      (sale.discountAmount > 0 ? `🔻 *ডিসকাউন্ট:* -৳${sale.discountAmount.toLocaleString()}\n` : '') +
      (sale.vatAmount > 0 ? `🏛️ *ভ্যাট (${sale.vatPercent}%):* +৳${sale.vatAmount.toLocaleString()}\n` : '') +
      (sale.transportCost > 0 ? `🚚 *পরিবহন খরচ কর্তন:* -৳${sale.transportCost.toLocaleString()}\n` : '') +
      `💰 *সর্বমোট বিল:* ৳${sale.grandTotal.toLocaleString()}\n` +
      `✅ *পরিশোধিত:* ৳${sale.paidAmount.toLocaleString()}\n` +
      (sale.dueAmount > 0 ? `⚠️ *বকেয়া পাওনা:* ৳${sale.dueAmount.toLocaleString()}\n` : `🎉 *স্ট্যাটাস:* সম্পূর্ণ পরিশোধিত\n`) +
      `------------------------------------\n` +
      `অনুমোদিত কর্মকর্তা: ${sale.servedBy}\n` +
      `আমাদের পণ্য কেনার জন্য আন্তরিক ধন্যবাদ!`
    );
  };

  const executeSendWhatsApp = async () => {
    if (!previewSale) return;
    let cleanPhone = waPhoneNumber.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('01')) {
      cleanPhone = '880' + cleanPhone.substring(1);
    } else if (cleanPhone.length === 10 && cleanPhone.startsWith('1')) {
      cleanPhone = '880' + cleanPhone;
    }

    const msg = getWhatsAppMessageText(previewSale);
    setShowWhatsAppModal(false);

    // Give a small delay to guarantee invoice-print-area DOM node is ready in the document
    setTimeout(async () => {
      await shareAsPDF({
        elementOrId: 'invoice-print-area',
        fileName: `Invoice_${previewSale.invoiceNo}.pdf`,
        phoneNumber: cleanPhone,
        messageText: msg,
        title: `ইনভয়েস - ${previewSale.invoiceNo} (${previewSale.customerName})`,
        orientation: 'portrait',
        margin: [8, 8, 8, 8],
      });
    }, 50);
  };

  // Email Share Handlers
  const handleOpenEmailDialog = (sale: Sale) => {
    const cust = customers.find(c => c.name === sale.customerName);
    setEmailAddress(cust?.email || '');
    setShowEmailModal(true);
  };

  const executeSendEmail = async () => {
    if (!previewSale || !emailAddress.trim()) return;
    setIsSendingEmail(true);
    try {
      const subject = `ইনভয়েস - ${previewSale.invoiceNo} (${settings.companyNameBangla || 'ফুড ইআরপি সিস্টেম'})`;
      const body = getWhatsAppMessageText(previewSale).replace(/\n/g, '<br/>').replace(/\*/g, '<b>').replace(/<\/b>/g, '</b>'); // Basic HTML formatting
      await sendEmailViaGmail(emailAddress.trim(), subject, body);
      alert('ইমেইল সফলভাবে পাঠানো হয়েছে!');
      setShowEmailModal(false);
    } catch (err: any) {
      alert(err.message || 'ইমেইল পাঠাতে সমস্যা হয়েছে।');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Sales 3-Step Confirmation Workflow counts & filters
  const pendingSalesCount = useMemo(() => {
    return sales.filter(s => (s.workflowStep || 1) < 3 || s.deliveryStatus !== 'DELIVERED').length;
  }, [sales]);

  const deliveredSalesCount = useMemo(() => {
    return sales.filter(s => (s.workflowStep || 1) === 3 || s.deliveryStatus === 'DELIVERED').length;
  }, [sales]);

  // Filtered sales including 3-step workflow status
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const matchSearch =
        s.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.customerPhone && s.customerPhone.includes(searchTerm)) ||
        (s.deliveryPerson && s.deliveryPerson.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.gatePassNo && s.gatePassNo.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCust = filterCustomer ? s.customerId === filterCustomer : true;

      const isDelivered = (s.workflowStep || 1) === 3 || s.deliveryStatus === 'DELIVERED';
      let matchWorkflow = true;
      if (workflowTab === 'PENDING') {
        matchWorkflow = !isDelivered;
      } else if (workflowTab === 'DELIVERED') {
        matchWorkflow = isDelivered;
      }

      return matchSearch && matchCust && matchWorkflow;
    });
  }, [sales, searchTerm, filterCustomer, workflowTab]);

  // Totals for sales register
  const salesTotals = filteredSales.reduce(
    (acc, s) => {
      acc.total += s.grandTotal;
      acc.paid += s.paidAmount;
      acc.due += s.dueAmount;
      return acc;
    },
    { total: 0, paid: 0, due: 0 }
  );

  const renderSalesRegisterSchedule = () => (
    <div className="space-y-6">
      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            মোট ইনভয়েস সংখ্যা
          </span>
          <div className="text-xl font-black font-mono text-slate-900 mt-1">
            {filteredSales.length} টি
          </div>
          <span className="text-[10px] text-slate-500">ফিল্টারকৃত বিক্রয় চালান</span>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            মোট বিক্রয়মূল্য (Sales Revenue)
          </span>
          <div className="text-xl font-black font-mono text-teal-700 mt-1">
            {formatCurrency(salesTotals.total)}
          </div>
          <span className="text-[10px] text-slate-500">সর্বমোট ইনভয়েস মূল্য</span>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            মোট আদায় (Collected)
          </span>
          <div className="text-xl font-black font-mono text-emerald-700 mt-1">
            {formatCurrency(salesTotals.paid)}
          </div>
          <span className="text-[10px] text-slate-500">নগদ ও ব্যাংক আদায়</span>
        </div>

        <div className="bg-rose-50 p-3.5 rounded-2xl border border-rose-200">
          <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">
            মোট বকেয়া (Receivable Due)
          </span>
          <div className="text-xl font-black font-mono text-rose-700 mt-1">
            {formatCurrency(salesTotals.due)}
          </div>
          <span className="text-[10px] text-rose-600 font-semibold">কাস্টমার বকেয়া</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <div className="p-4 pb-0"><DataExportToolbar filename="SalesInvoiceView_Export" /></div>
<table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white font-bold text-[11px]">
              <th className="py-3 px-3">ইনভয়েস নং</th>
              <th className="py-3 px-3">তারিখ</th>
              <th className="py-3 px-3">গ্রাহক / প্রতিষ্ঠান</th>
              <th className="py-3 px-3">ওয়ার্কফ্লো ধাপ</th>
              <th className="py-3 px-3 text-right">বিল টাকা</th>
              <th className="py-3 px-3 text-right">পরিশোধ</th>
              <th className="py-3 px-3 text-right">বকেয়া</th>
              <th className="py-3 px-3 text-center">পেমেন্ট মেথড</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredSales.map((sale) => (
              <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-2 px-3 font-mono font-bold text-teal-800">
                  {sale.invoiceNo}
                </td>
                <td className="py-2 px-3 text-slate-600">
                  {formatDate(sale.date)}
                </td>
                <td className="py-2 px-3">
                  <div className="font-bold text-slate-900">{sale.customerName}</div>
                  {sale.customerPhone && (
                    <div className="text-[10px] text-slate-500">{sale.customerPhone}</div>
                  )}
                </td>
                <td className="py-2 px-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    sale.workflowStep === 3
                      ? 'bg-emerald-100 text-emerald-800'
                      : sale.workflowStep === 2
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {sale.workflowStep === 3 ? 'সম্পন্ন' : sale.workflowStep === 2 ? 'গেট পাস সম্পন্ন' : 'চালান প্রস্তুত'}
                  </span>
                </td>
                <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                  {formatCurrency(sale.grandTotal)}
                </td>
                <td className="py-2 px-3 text-right font-mono text-emerald-700 font-semibold">
                  {formatCurrency(sale.paidAmount)}
                </td>
                <td className="py-2 px-3 text-right font-mono">
                  {sale.dueAmount > 0 ? (
                    <span className="text-rose-700 font-bold">
                      {formatCurrency(sale.dueAmount)}
                    </span>
                  ) : (
                    <span className="text-slate-400">০</span>
                  )}
                </td>
                <td className="py-2 px-3 text-center">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">
                    {sale.paymentMethod}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
              <td colSpan={4} className="py-3 px-3 text-right">
                সর্বমোট ({filteredSales.length} টি ইনভয়েস):
              </td>
              <td className="py-3 px-3 text-right font-mono text-teal-900">
                {formatCurrency(salesTotals.total)}
              </td>
              <td className="py-3 px-3 text-right font-mono text-emerald-800">
                {formatCurrency(salesTotals.paid)}
              </td>
              <td className="py-3 px-3 text-right font-mono text-rose-800">
                {formatCurrency(salesTotals.due)}
              </td>
              <td className="py-3 px-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>


    </div>
  );

  // Step 2: Open Delivery Assignment Modal
  const handleOpenAssignModal = (sale: Sale) => {
    setSelectedSaleForWorkflow(sale);
    setWfDeliveryPerson(sale.deliveryPersonName || employees[0]?.name || 'মো. রহমত আলী (ডেলিভারি ভ্যান)');
    setWfDeliveryPhone(sale.deliveryPersonPhone || employees[0]?.phone || '01712-345678');
    setWfVehicleNo(sale.deliveryVehicleNo || 'ঢাকা মেট্রো-ন ১২-৩৪৫৬');
    setWfNotes(sale.notes || '');
    setWorkflowModalMode('ASSIGN');
  };

  const handleSaveDeliveryAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSaleForWorkflow || !wfDeliveryPerson.trim()) return;

    updateSaleWorkflow(selectedSaleForWorkflow.id, {
      workflowStep: 2,
      deliveryStatus: 'OUT_FOR_DELIVERY',
      deliveryPerson: wfDeliveryPerson.trim(),
      deliveryPhone: wfDeliveryPhone.trim(),
      vehicleNo: wfVehicleNo.trim(),
      notes: wfNotes.trim() || undefined,
    });

    setWorkflowModalMode(null);
    setSelectedSaleForWorkflow(null);
  };

  // Step 3: Open Gate Pass Confirmation Modal
  const handleOpenGatePassModal = (sale: Sale) => {
    setSelectedSaleForWorkflow(sale);
    setWfGatePassNo(sale.gatePassNo || `GP-${new Date().getFullYear()}-${String(Math.floor(100 + Math.random() * 900))}`);
    setWfNotes(sale.notes || '');
    setWorkflowModalMode('GATEPASS');
  };

  const handleSaveGatePass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSaleForWorkflow || !wfGatePassNo.trim()) return;

    updateSaleWorkflow(selectedSaleForWorkflow.id, {
      workflowStep: 3,
      deliveryStatus: 'DELIVERED',
      gatePassNo: wfGatePassNo.trim(),
      deliveredAt: new Date().toISOString(),
      notes: wfNotes.trim() || undefined,
    });

    setWorkflowModalMode(null);
    setSelectedSaleForWorkflow(null);
  };

  // Open Full Workflow Timeline Modal
  const handleOpenTimelineModal = (sale: Sale) => {
    setSelectedSaleForWorkflow(sale);
    setWorkflowModalMode('TIMELINE');
  };

  const handleExportCSV = () => {
    const headers = ['Invoice No', 'Date', 'Customer', 'Workflow Step', 'Status', 'Delivery Person', 'Gate Pass No', 'Grand Total', 'Paid', 'Due'];
    const rows = filteredSales.map(s => [
      s.invoiceNo,
      s.date,
      s.customerName,
      s.workflowStep === 3 ? 'Step 3: Delivered' : s.workflowStep === 2 ? 'Step 2: Out for Delivery' : 'Step 1: Invoice Created',
      s.deliveryStatus || 'INVOICED',
      s.deliveryPerson || '-',
      s.gatePassNo || '-',
      s.grandTotal,
      s.paidAmount,
      s.dueAmount,
    ]);
    exportToCSV(`Sales_Report_${workflowTab}_${new Date().toISOString().substring(0, 10)}`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-teal-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              সেলস ও ইনভয়েস ম্যানেজমেন্ট (Sales & Invoice)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            অটো স্টক হ্রাস, কাস্টমার লেজার সমন্বয় ও তাৎক্ষণিক ইনভয়েস প্রিন্ট
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
            id="btn-sales-register-print-view"
            onClick={() => setShowRegisterPrintModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            title="সকল বিক্রয় ও ইনভয়েস রেজিস্টারের প্রিন্ট ভিউ খুলুন"
          >
            <Printer className="w-4 h-4 text-indigo-200" />
            <span>Print View (রেজিস্টার)</span>
          </button>
          <button
            id="btn-open-new-sale-modal"
            onClick={() => {
              setPaidAmount(grandTotal);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            নতুন ইনভয়েস তৈরি করুন
          </button>
        </div>
      </div>



      {/* 3-Step Confirmation Workflow Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setWorkflowTab('ALL')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            workflowTab === 'ALL'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>সব বিক্রয় (All Sales)</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${workflowTab === 'ALL' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-800'}`}>
            {sales.length}
          </span>
        </button>

        <button
          onClick={() => setWorkflowTab('PENDING')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            workflowTab === 'PENDING'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-500" />
          <span>পেন্ডিং ওয়ার্কফ্লো (অসম্পূর্ণ ধাপ)</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
            workflowTab === 'PENDING' ? 'bg-amber-700 text-white' : 'bg-amber-200 text-amber-950'
          }`}>
            {pendingSalesCount}
          </span>
        </button>

        <button
          onClick={() => setWorkflowTab('DELIVERED')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            workflowTab === 'DELIVERED'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-teal-50 text-teal-900 hover:bg-teal-100 border border-teal-200'
          }`}
        >
          <PackageCheck className="w-4 h-4 text-teal-600" />
          <span>গেট পাস কনফার্মড ও ডেলিভারি সম্পন্ন</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
            workflowTab === 'DELIVERED' ? 'bg-teal-800 text-white' : 'bg-teal-200 text-teal-950'
          }`}>
            {deliveredSalesCount}
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="ইনভয়েস নং, কাস্টমার, ডেলিভারি ম্যান বা গেট পাস দিয়ে সার্চ করুন..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <select
          value={filterCustomer}
          onChange={e => setFilterCustomer(e.target.value)}
          className="w-full sm:w-60 py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
        >
          <option value="">সকল কাস্টমার</option>
          {customers.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <button
          id="btn-sales-soft-reset"
          onClick={handleSoftReset}
          className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
          title="সার্চ ও কাস্টমার ফিল্টার ডিফল্ট অবস্থায় ফিরিয়ে নিন (Soft Reset)"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>রিসেট</span>
        </button>
      </div>

      {/* Sales History Table with 3-Step Confirmation Workflow */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <div className="p-4 pb-0 flex items-center justify-between">
            <DataExportToolbar filename="SalesInvoiceView_Export" />
            {selectedSales.length > 0 && (
              <button
                onClick={() => {
                  const salesToPrint = filteredSales.filter(s => selectedSales.includes(s.id));
                  generateBatchProfessionalInvoicesPDF(salesToPrint, settings);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs"
              >
                <FileText className="w-3.5 h-3.5" />
                ব্যাচ PDF ডাউনলোড ({selectedSales.length})
              </button>
            )}
          </div>
<table className="w-full text-left text-xs min-w-[750px]">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                    checked={selectedSales.length > 0 && selectedSales.length === filteredSales.length}
                    onChange={() => handleSelectAllSales(filteredSales)}
                  />
                </th>
                <th className="py-3 px-3.5">ইনভয়েস ও তারিখ</th>
                <th className="py-3 px-3.5">কাস্টমার</th>
                <th className="py-3 px-3.5 min-w-[280px]">৩-ধাপের ইনভয়েস ও ডেলিভারি অগ্রগতি</th>
                <th className="py-3 px-3.5 text-right">মোট টাকা</th>
                <th className="py-3 px-3.5 text-right">বকেয়া</th>
                <th className="py-3 px-3.5 text-center">পরবর্তী পদক্ষেপ</th>
                <th className="py-3 px-3 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    কোনো বিক্রয় রেকর্ড পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredSales.map(sale => {
                  const step = sale.workflowStep || 1;
                  const isStep1Done = true; // Invoiced is always done
                  const isStep2Done = step >= 2;
                  const isStep3Done = step >= 3;

                  return (
                    <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3.5 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                          checked={selectedSales.includes(sale.id)}
                          onChange={() => handleToggleSelectSale(sale.id)}
                        />
                      </td>
                      {/* Invoice & Date */}
                      <td className="py-3 px-3.5 font-mono">
                        <div className="font-bold text-teal-800">{sale.invoiceNo}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {formatDate(sale.date)}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900">{sale.customerName}</div>
                        <div className="text-[11px] text-slate-500">{sale.customerPhone || 'ফোন নম্বর নেই'}</div>
                      </td>

                      {/* 3-Step Confirmation Workflow Stepper */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          {/* Step 1: Invoice Created */}
                          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="font-semibold">১. ইনভয়েস</span>
                          </div>

                          <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />

                          {/* Step 2: Delivery Assigned */}
                          <div
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg border ${
                              isStep2Done
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
                            }`}
                          >
                            {isStep2Done ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            )}
                            <div>
                              <span className="font-semibold">২. ডেলিভারি</span>
                              {sale.deliveryPerson && (
                                <span className="block text-[9px] text-slate-500 font-mono truncate max-w-[80px]">
                                  {sale.deliveryPerson}
                                </span>
                              )}
                            </div>
                          </div>

                          <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />

                          {/* Step 3: Gate Pass Confirmed */}
                          <div
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg border ${
                              isStep3Done
                                ? 'bg-teal-50 text-teal-900 border-teal-200'
                                : 'bg-slate-50 text-slate-500 border-slate-200'
                            }`}
                          >
                            {isStep3Done ? (
                              <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            )}
                            <div>
                              <span className="font-semibold">৩. গেট পাস</span>
                              {sale.gatePassNo && (
                                <span className="block text-[9px] text-teal-700 font-mono font-bold">
                                  {sale.gatePassNo}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Grand Total */}
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(sale.grandTotal)}
                      </td>

                      {/* Due Amount */}
                      <td className="py-3 px-3.5 text-right font-mono">
                        {sale.dueAmount > 0 ? (
                          <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-bold rounded">
                            {formatCurrency(sale.dueAmount)}
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-semibold">পরিশোধিত</span>
                        )}
                      </td>

                      {/* Next Step Action Button */}
                      <td className="py-3 px-3.5 text-center">
                        {step === 1 ? (
                          <button
                            onClick={() => handleOpenAssignModal(sale)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-bold shadow-xs transition-colors"
                          >
                            <UserCheck className="w-3 h-3" />
                            ডেলিভারি চালক দিন
                          </button>
                        ) : step === 2 ? (
                          <button
                            onClick={() => handleOpenGatePassModal(sale)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition-colors"
                          >
                            <ShieldCheck className="w-3 h-3" />
                            গেট পাস কনফার্ম করুন
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ডেলিভারি সম্পন্ন
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenTimelineModal(sale)}
                            className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="ওয়ার্কফ্লো টাইমলাইন ও তথ্য দেখুন"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                          <button
                            id={`btn-sale-print-view-${sale.id}`}
                            onClick={() => setPreviewSale(sale)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border border-indigo-200"
                            title="ইনভয়েস প্রিন্ট ভিউ ও পরিচ্ছন্ন প্রিন্ট লেআউট খুলুন"
                          >
                            <Printer className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Print View</span>
                          </button>
                          <button
                            onClick={() => {
                              setPreviewSale(sale);
                              handleOpenWhatsAppDialog(sale);
                            }}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors inline-flex items-center gap-1 font-semibold"
                            title="PDF ইনভয়েস সহ WhatsApp-এ পাঠান"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setPreviewSale(sale);
                              handleOpenEmailDialog(sale);
                            }}
                            className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center gap-1 font-semibold"
                            title="ইনভয়েস ইমেইলের মাধ্যমে পাঠান"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Dedicated Card Layout */}
        <div className="md:hidden divide-y divide-slate-100 p-2.5 space-y-3">
          {selectedSales.length > 0 && (
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  checked={selectedSales.length > 0 && selectedSales.length === filteredSales.length}
                  onChange={() => handleSelectAllSales(filteredSales)}
                />
                সব নির্বাচন করুন
              </label>
              <button
                onClick={() => {
                  const salesToPrint = filteredSales.filter(s => selectedSales.includes(s.id));
                  generateBatchProfessionalInvoicesPDF(salesToPrint, settings);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg transition-colors shadow-xs"
              >
                <FileText className="w-3 h-3" />
                ব্যাচ PDF ({selectedSales.length})
              </button>
            </div>
          )}
          {filteredSales.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">
              কোনো বিক্রয় রেকর্ড পাওয়া যায়নি।
            </div>
          ) : (
            filteredSales.map(sale => {
              const step = sale.workflowStep || 1;
              return (
                <div
                  key={sale.id}
                  className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 relative"
                >
                  {/* Card Header: Invoice No + Date + Workflow Badge */}
                  <div className="flex items-center justify-between gap-2 pl-6">
                    <div className="absolute left-3 top-4">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                        checked={selectedSales.includes(sale.id)}
                        onChange={() => handleToggleSelectSale(sale.id)}
                      />
                    </div>
                    <div>
                      <span className="font-mono font-bold text-teal-800 dark:text-teal-400 text-sm">
                        {sale.invoiceNo}
                      </span>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {formatDate(sale.date)}
                      </div>
                    </div>
                    {step === 1 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        ১. চালক বাকি
                      </span>
                    ) : step === 2 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        ২. গেট পাস বাকি
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        ৩. সম্পন্ন
                      </span>
                    )}
                  </div>

                  {/* Customer Info */}
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {sale.customerName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {sale.customerPhone || 'ফোন নম্বর নেই'}
                      </div>
                    </div>
                    {sale.customerPhone && (
                      <a
                        href={`tel:${sale.customerPhone}`}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200 min-w-[40px] min-h-[40px]"
                        title="সরাসরি কল করুন"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  {/* Financial Details */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                      <span className="text-[11px] text-slate-500 block">মোট বিল</span>
                      <span className="text-base font-black font-mono text-slate-900 dark:text-slate-100">
                        {formatCurrency(sale.totalAmount)}
                      </span>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-right">
                      <span className="text-[11px] text-slate-500 block">বকেয়া</span>
                      {sale.dueAmount > 0 ? (
                        <span className="text-base font-black font-mono text-rose-600">
                          {formatCurrency(sale.dueAmount)}
                        </span>
                      ) : (
                        <span className="text-sm font-bold text-emerald-600">পরিশোধিত</span>
                      )}
                    </div>
                  </div>

                  {/* Quick Mobile Action Buttons */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      type="button"
                      id={`btn-mobile-sale-print-view-${sale.id}`}
                      onClick={() => setPreviewSale(sale)}
                      className="min-h-[44px] flex items-center justify-center gap-1 px-2 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      title="ইনভয়েস প্রিন্ট ভিউ খুলুন"
                    >
                      <Printer className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Print View</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewSale(sale);
                        handleOpenWhatsAppDialog(sale);
                      }}
                      className="min-h-[44px] flex items-center justify-center gap-1 px-2 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                    {step === 1 ? (
                      <button
                        type="button"
                        onClick={() => handleOpenAssignModal(sale)}
                        className="min-h-[44px] flex items-center justify-center gap-1 px-2 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>চালক দিন</span>
                      </button>
                    ) : step === 2 ? (
                      <button
                        type="button"
                        onClick={() => handleOpenGatePassModal(sale)}
                        className="min-h-[44px] flex items-center justify-center gap-1 px-2 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>গেট পাস</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenTimelineModal(sale)}
                        className="min-h-[44px] flex items-center justify-center gap-1 px-2 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-medium cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>টাইমলাইন</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create Sale Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-4xl bg-white rounded-none sm:rounded-3xl min-h-screen sm:min-h-0 shadow-2xl border-0 sm:border border-slate-200 overflow-hidden my-0 sm:my-6 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-slate-900 p-4 sm:p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">নতুন সেলস ইনভয়েস তৈরি</h3>
                <p className="text-xs text-slate-400">কাস্টমার সিলেক্ট করে খাদ্যপণ্য যোগ করুন</p>
              </div>
              <div className="flex items-center gap-3">
                <AutoSaveStatusBadge
                  isSaving={salesDraft.isSaving}
                  lastSavedAt={salesDraft.lastSavedAt}
                />
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
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

            <form onSubmit={handleCreateSaleSubmit} className="p-6 space-y-6 text-xs">
              {/* Draft auto-save restoration banner */}
              {salesDraft.hasSavedDraft && (
                <DraftAutoSaveBanner
                  hasSavedDraft={salesDraft.hasSavedDraft}
                  savedTimeFormatted={salesDraft.savedTimeFormatted}
                  onRestore={handleRestoreSalesDraft}
                  onDiscard={handleDiscardSalesDraft}
                  onDismiss={salesDraft.dismissDraftNotification}
                />
              )}

              {/* Customer, Date & Currency Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">কাস্টমার নির্বাচন করুন *</label>
                    <button
                      type="button"
                      onClick={() => setShowNewCustModal(true)}
                      className="text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      নতুন কাস্টমার যোগ
                    </button>
                  </div>
                  <select
                    required
                    value={selectedCustomerId}
                    onChange={e => setSelectedCustomerId(e.target.value)}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-500 font-medium"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone}) - বকেয়া: {formatCurrency(c.currentDue)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">চালান তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={saleDate}
                    onChange={e => setSaleDate(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-500"
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
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-500"
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

              {/* Items List */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                    পণ্য তালিকা (Product Items)
                  </span>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 font-bold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    আইটেম যোগ করুন
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((row, idx) => {
                    const productObj = products.find(p => p.id === row.productId);
                    const currentStock = productObj?.currentStock || 0;
                    const availableBatches = batches.filter(b => b.productId === row.productId && b.quantity > 0);

                    return (
                      <div
                        key={idx}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-white p-3 rounded-xl border border-slate-200 items-center"
                      >
                        {/* Product Selector */}
                        <div className="sm:col-span-3">
                          <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">পণ্য</label>
                          <SearchableProductSelect
                            products={products}
                            value={row.productId}
                            onChange={(val) => handleItemProductChange(idx, val)}
                          />
                          <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between">
                            <span>স্টকে আছে: {currentStock} {productObj?.unit}</span>
                            {currentStock < row.quantity && (
                              <span className="text-rose-600 font-bold">স্টক ঘাটতি!</span>
                            )}
                          </div>
                        </div>

                        {/* Batch Selector */}
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">ব্যাচ (ঐচ্ছিক)</label>
                          <select
                            value={row.batchNumber || ''}
                            onChange={e => handleItemBatchChange(idx, e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                          >
                            <option value="">ডিফল্ট ব্যাচ</option>
                            {availableBatches.map(b => (
                              <option key={b.id} value={b.batchNumber}>
                                {b.batchNumber} (মেয়াদ: {b.expDate})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity */}
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">
                            পরিমাণ
                          </label>
                          <input
                            type="number"
                            inputMode="decimal"
                            min="1"
                            value={row.quantity}
                            onChange={e => handleItemQtyChange(idx, parseFloat(e.target.value) || 1)}
                            className="w-full p-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-right font-mono text-base"
                          />
                        </div>

                        {/* Unit (Manual & Quick Select) */}
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">
                            একক (পিস/কার্টুন/কেজি)
                          </label>
                          <ManualUnitInput
                            value={row.unit}
                            onChange={val => handleItemUnitChange(idx, val)}
                            placeholder="পিস, কার্টুন, কেজি..."
                            compact
                          />
                        </div>

                        {/* Unit Price */}
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">একক দর (৳)</label>
                          <input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            value={row.unitPrice}
                            onChange={e => handleItemPriceChange(idx, parseFloat(e.target.value) || 0)}
                            className="w-full p-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-right font-mono text-base"
                          />
                        </div>

                        {/* Total & Delete */}
                        <div className="sm:col-span-1 flex items-center justify-between sm:justify-end gap-2">
                          <div className="text-right">
                            <span className="block text-[10px] text-slate-400 font-semibold">মোট</span>
                            <span className="font-mono font-bold text-slate-900">{formatCurrency(row.total)}</span>
                          </div>
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItemRow(idx)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                              title="আইটেম মুছুন"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Discount, VAT, Transport, and Payment terms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">ডিসকাউন্ট টাইপ</label>
                      <select
                        value={discountType}
                        onChange={e => setDiscountType(e.target.value as 'FLAT' | 'PERCENT')}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                      >
                        <option value="FLAT">নির্দিষ্ট টাকা (Flat ৳)</option>
                        <option value="PERCENT">শতাংশ (%)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">ডিসকাউন্ট মান</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        value={discountVal}
                        onChange={e => setDiscountVal(parseFloat(e.target.value) || 0)}
                        className="w-full p-2.5 min-h-[44px] bg-white border border-slate-200 rounded-xl text-right font-mono text-base"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">ভ্যাট হার (%)</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        value={vatPercent}
                        onChange={e => setVatPercent(parseFloat(e.target.value) || 0)}
                        className="w-full p-2.5 min-h-[44px] bg-white border border-slate-200 rounded-xl text-right font-mono text-base"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        পরিবহন খরচ (বিক্রয়মূল্য থেকে কর্তন)
                      </label>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        value={transportCost}
                        onChange={e => setTransportCost(parseFloat(e.target.value) || 0)}
                        placeholder="ঐচ্ছিক পরিবহন কর্তন"
                        className="w-full p-2.5 min-h-[44px] bg-white border border-slate-200 rounded-xl text-right font-mono text-base"
                      />
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        কোম্পানি বহন করবে (অপারেটিং খরচ), বিল থেকে মাইনাস হবে
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">নোট বা বিশেষ নির্দেশনা</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="যেমন: ডেলিভারি ভ্যান নম্বর বা রিসিভারের বিবরণ"
                        className="w-full p-2 pr-10 bg-white border border-slate-200 rounded-lg"
                      />
                      <DictationButton 
                        onResult={(text) => setNotes(prev => prev ? prev + ' ' + text : text)}
                        className="absolute right-1 top-1 w-7 h-7"
                      />
                    </div>
                  </div>
                </div>

                {/* Calculation Summary */}
                <div className="space-y-2 text-xs border-l sm:border-slate-200 sm:pl-6">
                  <div className="flex justify-between text-slate-600">
                    <span>সাব-টোটাল:</span>
                    <span className="font-mono font-semibold">{formatCurrency(subTotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>ডিসকাউন্ট:</span>
                    <span className="font-mono text-rose-600">- {formatCurrency(discountAmount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>ভ্যাট ({vatPercent}%):</span>
                    <span className="font-mono text-slate-800">+ {formatCurrency(vatAmount)}</span>
                  </div>
                  {transportCost > 0 && (
                    <div className="flex justify-between text-rose-700 font-medium">
                      <span>পরিবহন খরচ কর্তন:</span>
                      <span className="font-mono">- {formatCurrency(transportCost)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                    <span>সর্বমোট (Grand Total):</span>
                    <div className="text-right">
                      <span className="font-mono text-teal-700">{formatCurrency(grandTotal)}</span>
                      {selectedCurrency !== (settings.baseCurrency || 'BDT') && (
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {selectedCurrency} {(grandTotal / exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Inputs */}
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
                          <option value="CASH">নগদ ক্যাশ (Cash)</option>
                          <option value="BANK">ব্যাংক অ্যাকাউন্ট / বিকাশ</option>
                          <option value="PARTIAL">আংশিক জমা (Partial)</option>
                          <option value="DUE">সম্পূর্ণ বাকি (Full Due)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">জমা টাকার পরিমাণ</label>
                        <input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          max={grandTotal}
                          value={paidAmount}
                          onChange={e => setPaidAmount(parseFloat(e.target.value) || 0)}
                          className="w-full p-2.5 min-h-[44px] bg-white border border-slate-200 rounded-xl text-right font-mono font-bold text-emerald-700 text-base"
                        />
                      </div>
                    </div>

                    {paymentMethod === 'BANK' && (
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">ব্যাংক একাউন্ট সিলেক্ট করুন</label>
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

                    <div className="flex justify-between items-center bg-rose-50 p-2.5 rounded-lg border border-rose-100 font-bold">
                      <span className="text-rose-700">অবশিষ্ট বকেয়া (Due):</span>
                      <span className="font-mono text-rose-700 text-sm">{formatCurrency(dueAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
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
                  id="btn-submit-sale"
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-xs transition-colors"
                >
                  ইনভয়েস সম্পন্ন করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Customer Modal */}
      {showNewCustModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <h4 className="font-bold text-slate-800 text-sm mb-3">নতুন কাস্টমার যোগ করুন</h4>
            <form onSubmit={handleQuickAddCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">কাস্টমার / প্রতিষ্ঠানের নাম *</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={e => setNewCustName(e.target.value)}
                  placeholder="যেমন: ধানমন্ডি বেকারি অ্যান্ড ফুডস"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">মোবাইল নম্বর *</label>
                <input
                  type="text"
                  required
                  value={newCustPhone}
                  onChange={e => setNewCustPhone(e.target.value)}
                  placeholder="01711-xxxxxx"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ঠিকানা</label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={e => setNewCustAddress(e.target.value)}
                  placeholder="দোকান / এলাকার ঠিকানা"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewCustModal(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 text-white font-bold rounded-lg"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Printable View Modal */}
      {previewSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-3xl bg-white rounded-none sm:rounded-3xl min-h-screen sm:min-h-0 shadow-2xl border-0 sm:border border-slate-200 overflow-hidden my-0 sm:my-6">
            {/* Action Bar */}
            <div className="p-3 sm:p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2.5 print:hidden border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-teal-400" />
                  অফিসিয়াল ইনভয়েস প্রিভিউ ({previewSale.invoiceNo})
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                  Print View
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Cancel / Exit button */}
                <button
                  onClick={() => setPreviewSale(null)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-lg transition-colors border border-slate-700 shadow-xs"
                  title="প্রিন্ট না করে বের হয়ে আগের স্ক্রিনে ফিরুন"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
                  বাতিল / বের হন
                </button>

                {/* WhatsApp button */}
                <button
                  onClick={() => handleOpenWhatsAppDialog(previewSale)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs"
                  title="হোয়াটসঅ্যাপে ইনভয়েসের তথ্য পাঠান"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  WhatsApp
                </button>

                {/* Email button */}
                <button
                  onClick={() => handleOpenEmailDialog(previewSale)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs"
                  title="ইমেইলের মাধ্যমে ইনভয়েস পাঠান"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Email
                </button>

                {/* Print button */}
                <button
                  onClick={() => printDocument('invoice-print-area', { title: `Invoice_${previewSale.invoiceNo}` })}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs"
                  title="ইনভয়েস সরাসরি প্রিন্ট করুন"
                >
                  <Printer className="w-3.5 h-3.5 text-teal-400" />
                  প্রিন্ট
                </button>

                {/* PDF Download buttons */}
                <button
                  onClick={() => exportElementToPDF('invoice-print-area', `Invoice_${previewSale.invoiceNo}.pdf`)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs"
                  title="ইনভয়েস PDF ফাইল ডাউনলোড করুন (Image)"
                >
                  <Download className="w-3.5 h-3.5" />
                  PDF (Image)
                </button>
                <button
                  onClick={() => generateProfessionalInvoicePDF(previewSale, settings)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs"
                  title="Professional Vector PDF Download"
                >
                  <FileText className="w-3.5 h-3.5" />
                  PDF (Vector)
                </button>

                <button
                  onClick={() => setPreviewSale(null)}
                  className="modal-close-btn w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 ml-1 cursor-pointer"
                  title="বন্ধ করুন"
                  aria-label="বন্ধ করুন"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Area */}
            <div id="invoice-print-area" className="p-8 text-slate-900 text-xs font-sans space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                <div className="flex items-start gap-3">
                  {settings.logoUrl && (
                    <img
                      src={settings.logoUrl}
                      alt="Logo"
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 object-contain rounded-xl border border-slate-200 bg-white p-1 shrink-0"
                    />
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-teal-800">
                      {settings.companyNameBangla}
                    </h2>
                    <p className="text-xs font-semibold text-slate-600">
                      {settings.companyNameEnglish}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
                      {settings.address} | ফোন: {settings.phone}
                    </p>
                    <div className="mt-1 text-[10px] text-slate-500 font-mono">
                      BIN / VAT নং: {settings.binVatNo} | লাইসেন্স: {settings.tradeLicenseNo}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-block px-3 py-1 bg-slate-100 font-bold text-slate-800 rounded-lg text-sm mb-1 uppercase tracking-wider">
                    ক্যাশ মেমো / ইনভয়েস
                  </div>
                  <div className="font-mono text-xs font-bold text-teal-700">
                    নং: {previewSale.invoiceNo}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    তারিখ: {formatDate(previewSale.date)}
                  </div>
                </div>
              </div>

              {/* Bill To */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    বিল প্রাপক (Customer Details)
                  </div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">
                    {previewSale.customerName}
                  </div>
                  <div className="text-slate-600 mt-0.5">
                    মোবাইল: {previewSale.customerPhone || 'প্রযোজ্য নয়'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    ডেলিভারি ও পেমেন্ট
                  </div>
                  <div className="text-slate-700 mt-0.5">
                    পেমেন্ট মেথড: <span className="font-bold">{previewSale.paymentMethod}</span>
                  </div>
                  <div className="text-slate-500">
                    সেলস এক্সিকিউটিভ: {previewSale.servedBy}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold text-[11px]">
                  <tr>
                    <th className="p-2.5 border-b border-slate-200">ক্রম</th>
                    <th className="p-2.5 border-b border-slate-200">খাদ্যপণ্যের বিবরণ</th>
                    <th className="p-2.5 border-b border-slate-200 text-center">ব্যাচ নং</th>
                    <th className="p-2.5 border-b border-slate-200 text-right">পরিমাণ</th>
                    <th className="p-2.5 border-b border-slate-200 text-right">একক দর</th>
                    <th className="p-2.5 border-b border-slate-200 text-right">মোট টাকা</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {previewSale.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 text-center font-mono">{toBengaliNumber(idx + 1)}</td>
                      <td className="p-2.5 font-medium">{it.productName}</td>
                      <td className="p-2.5 text-center font-mono text-slate-500">{it.batchNumber || '-'}</td>
                      <td className="p-2.5 text-right font-mono">{it.quantity} {it.unit}</td>
                      <td className="p-2.5 text-right font-mono">{formatCurrency(it.unitPrice)}</td>
                      <td className="p-2.5 text-right font-mono font-bold">{formatCurrency(it.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Calculation Breakdown */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1.5 text-right text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>সাব-টোটাল:</span>
                    <span className="font-mono">{formatCurrency(previewSale.subTotal)}</span>
                  </div>
                  {previewSale.discountAmount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>ডিসকাউন্ট:</span>
                      <span className="font-mono">- {formatCurrency(previewSale.discountAmount)}</span>
                    </div>
                  )}
                  {previewSale.vatAmount > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>ভ্যাট ({previewSale.vatPercent}%):</span>
                      <span className="font-mono">+ {formatCurrency(previewSale.vatAmount)}</span>
                    </div>
                  )}
                  {previewSale.transportCost > 0 && (
                    <div className="flex justify-between text-rose-700 font-medium">
                      <span>পরিবহন খরচ কর্তন:</span>
                      <span className="font-mono">- {formatCurrency(previewSale.transportCost)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-slate-300">
                    <span>সর্বমোট টাকা:</span>
                    <span className="font-mono text-teal-700">{formatCurrency(previewSale.grandTotal)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>পরিশোধিত টাকা:</span>
                    <span className="font-mono">{formatCurrency(previewSale.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-rose-600 bg-rose-50 p-1.5 rounded">
                    <span>বর্তমান বকেয়া (Due):</span>
                    <span className="font-mono">{formatCurrency(previewSale.dueAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 pt-16 text-center text-xs">
                <div>
                  <div className="w-44 border-t border-slate-400 mx-auto pt-1 font-semibold text-slate-700">
                    ক্রেতার স্বাক্ষর
                  </div>
                </div>
                <div>
                  <div className="w-44 border-t border-slate-400 mx-auto pt-1 font-semibold text-slate-700">
                    অনুমোদিত কর্মকর্তার স্বাক্ষর
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Modal Action Bar (Hidden in Print) */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <button
                onClick={() => setPreviewSale(null)}
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-colors shadow-xs"
              >
                <ArrowLeft className="w-4 h-4 text-slate-500" />
                বাতিল / আগের স্ক্রিনে ফিরুন (Exit)
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => handleOpenWhatsAppDialog(previewSale)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
                >
                  <MessageSquare className="w-4 h-4" />
                  WhatsApp
                </button>

                {(() => {
                  const cust = customers.find(c => c.id === previewSale.customerId);
                  const email = cust?.email || '';
                  const subject = `Sales Invoice ${previewSale.invoiceNo} – ${settings.companyNameBangla}`;
                  const body = `বরাবর,\n${previewSale.customerName}\nমোবাইল: ${previewSale.customerPhone || ''}\n\nআপনার বিক্রয় চালান বিস্তারিত:\nচালান নং: ${previewSale.invoiceNo}\nতারিখ: ${formatDate(previewSale.date)}\nসর্বমোট বিল: ${formatCurrency(previewSale.grandTotal)}\nপরিশোধিত: ${formatCurrency(previewSale.paidAmount)}\nবকেয়া: ${formatCurrency(previewSale.dueAmount)}\n\nধন্যবাদান্তে,\n${settings.companyNameBangla}\nফোন: ${settings.phone}`;
                  const mailtoUrl = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                  return (
                    <a
                      href={mailtoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
                      title={email ? `ইমেইল পাঠান: ${email}` : 'ইমেইল ক্লায়েন্ট খুলুন'}
                    >
                      <Mail className="w-4 h-4" />
                      <span>Email {email ? `(${email})` : ''}</span>
                    </a>
                  );
                })()}

                <button
                  onClick={() => printDocument('invoice-print-area', { title: `Invoice_${previewSale.invoiceNo}` })}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
                  title="চালান সরাসরি প্রিন্ট করুন"
                >
                  <Printer className="w-4 h-4 text-teal-400" />
                  প্রিন্ট চালান
                </button>

                <button
                  onClick={() => exportElementToPDF('invoice-print-area', `Invoice_${previewSale.invoiceNo}.pdf`)}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
                  title="চালান PDF ফাইল ডাউনলোড করুন"
                >
                  <Download className="w-4 h-4" />
                  PDF ডাউনলোড
                </button>
                <button
                  onClick={() => generateProfessionalInvoicePDF(previewSale, settings)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
                  title="Professional Vector PDF Download"
                >
                  <FileText className="w-4 h-4" />
                  PDF (Vector)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Send Confirmation / Edit Phone Modal */}
      {showWhatsAppModal && previewSale && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-emerald-700">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">ইনভয়েস PDF সহ WhatsApp-এ পাঠান</h3>
                  <p className="text-[11px] text-slate-500">প্রকৃত PDF ফাইল তৈরি করে WhatsApp-এ সরাসরি পাঠানোর ব্যবস্থা করা হবে</p>
                </div>
              </div>
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  গ্রাহকের WhatsApp মোবাইল নম্বর
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={waPhoneNumber}
                    onChange={e => setWaPhoneNumber(e.target.value)}
                    placeholder="যেমন: 01711234567 বা 8801711234567"
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  নম্বর ফাঁকা রাখলে WhatsApp ওপেন হয়ে প্রাপক নির্বাচনের সুযোগ দিবে।
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  বার্তার প্রিভিউ (Message Content)
                </label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-700 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                  {getWhatsAppMessageText(previewSale)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowWhatsAppModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50"
              >
                বাতিল
              </button>

              <button
                type="button"
                onClick={executeSendWhatsApp}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>PDF সহ WhatsApp-এ পাঠান</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Send Confirmation Modal */}
      {showEmailModal && previewSale && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-blue-700">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">ইনভয়েস ইমেইলের মাধ্যমে পাঠান</h3>
                  <p className="text-[11px] text-slate-500">Google Workspace (Gmail) ব্যবহার করে ইমেইল পাঠানো হবে</p>
                </div>
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  গ্রাহকের ইমেইল অ্যাড্রেস
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={emailAddress}
                    onChange={e => setEmailAddress(e.target.value)}
                    placeholder="যেমন: example@gmail.com"
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  বার্তার প্রিভিউ (Email Content)
                </label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-700 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                  {getWhatsAppMessageText(previewSale)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50"
                disabled={isSendingEmail}
              >
                বাতিল
              </button>

              <button
                type="button"
                onClick={executeSendEmail}
                disabled={isSendingEmail || !emailAddress.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSendingEmail ? 'পাঠানো হচ্ছে...' : 'ইমেইল পাঠান'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Step 2: Assign Delivery Person Modal */}
      {workflowModalMode === 'ASSIGN' && selectedSaleForWorkflow && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-amber-700">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">ধাপ ২: ডেলিভারি অ্যাসাইনমেন্ট (Delivery Assignment)</h3>
                  <p className="text-[11px] text-slate-500 font-mono">ইনভয়েস: {selectedSaleForWorkflow.invoiceNo} | ক্রেতা: {selectedSaleForWorkflow.customerName}</p>
                </div>
              </div>
              <button
                onClick={() => setWorkflowModalMode(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDeliveryAssignment} className="space-y-3.5 text-xs">
              <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 text-amber-900 text-[11px] space-y-1">
                <div className="font-bold">ডেলিভারি নির্দেশিকা:</div>
                <p>পণ্য ফ্যাক্টরি বা গোডাউন থেকে ডেলিভারির জন্য প্রস্তুত। অনুগ্রহ করে ডেলিভারি চালক ও যানবাহনের তথ্য প্রদান করুন।</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  কর্মচারী তালিকা থেকে নির্বাচন করুন (ঐচ্ছিক)
                </label>
                <select
                  onChange={e => {
                    const emp = employees.find(em => em.id === e.target.value);
                    if (emp) {
                      setWfDeliveryPerson(emp.name);
                      setWfDeliveryPhone(emp.phone);
                    }
                  }}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">কর্মচারী নির্বাচন করুন...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.designation}) - {emp.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ডেলিভারি ম্যান / চালকের নাম *
                  </label>
                  <input
                    type="text"
                    required
                    value={wfDeliveryPerson}
                    onChange={e => setWfDeliveryPerson(e.target.value)}
                    placeholder="যেমন: জামাল উদ্দিন"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    চালকের মোবাইল নম্বর
                  </label>
                  <input
                    type="text"
                    value={wfDeliveryPhone}
                    onChange={e => setWfDeliveryPhone(e.target.value)}
                    placeholder="01711-xxxxxx"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ডেলিভারি গাড়ি / ভ্যানের নম্বর
                </label>
                <input
                  type="text"
                  value={wfVehicleNo}
                  onChange={e => setWfVehicleNo(e.target.value)}
                  placeholder="যেমন: ঢাকা মেট্রো-ন ১২-৩৪৫৬"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ডেলিভারি নোট বা রুট
                </label>
                <input
                  type="text"
                  value={wfNotes}
                  onChange={e => setWfNotes(e.target.value)}
                  placeholder="যেমন: সকাল ১০টার মধ্যে মিরপুর শোরুমে পৌঁছাতে হবে"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setWorkflowModalMode(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                  ডেলিভারি নির্ধারণ করুন (পরবর্তী ধাপ: গেট পাস)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Workflow Step 3: Gate Pass Confirmation Modal */}
      {workflowModalMode === 'GATEPASS' && selectedSaleForWorkflow && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-teal-800">
                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">ধাপ ৩: গেট পাস কনফার্মেশন (Gate Pass Verification)</h3>
                  <p className="text-[11px] text-slate-500 font-mono">ইনভয়েস: {selectedSaleForWorkflow.invoiceNo}</p>
                </div>
              </div>
              <button
                onClick={() => setWorkflowModalMode(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGatePass} className="space-y-4 text-xs">
              <div className="bg-teal-50/70 p-3 rounded-xl border border-teal-200 text-teal-950 text-[11px] space-y-1">
                <div className="font-bold">গেট পাস কনফার্মেশন ও ডেলিভারি সম্পন্ন:</div>
                <p>ফ্যাক্টরি গেট থেকে মাল বেরিয়ে যাওয়ার সময় গেট পাস ইস্যু ও যাচাই করা হয়। নম্বর এন্ট্রি করলে অর্ডারটি 'DELIVERED' সম্পন্ন হিসেবে গণ্য হবে।</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">ক্রেতার নাম:</span>
                  <span className="font-bold text-slate-900">{selectedSaleForWorkflow.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">নির্ধারিত ডেলিভারি ম্যান:</span>
                  <span className="font-medium text-slate-800">{selectedSaleForWorkflow.deliveryPerson || 'নির্ধারিত'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">গাড়ির নম্বর:</span>
                  <span className="font-mono text-slate-800">{selectedSaleForWorkflow.deliveryVehicleNo || 'ঢাকা মেট্রো-ন ১২-৩৪৫৬'}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  গেট পাস নম্বর (Gate Pass No) *
                </label>
                <input
                  type="text"
                  required
                  value={wfGatePassNo}
                  onChange={e => setWfGatePassNo(e.target.value)}
                  placeholder="যেমন: GP-2026-0042"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-teal-800 text-sm focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  সিকিউরিটি ও ভেরিফিকেশন নোট (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={wfNotes}
                  onChange={e => setWfNotes(e.target.value)}
                  placeholder="যেমন: গেট ইনচার্জ রহিম কর্তৃক পরীক্ষিত ও অনুমোদিত"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setWorkflowModalMode(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-xs transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  গেট পাস কনফার্ম করুন (ডেলিভারি সম্পন্ন)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Workflow Timeline Modal */}
      {workflowModalMode === 'TIMELINE' && selectedSaleForWorkflow && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-teal-800">
                <Clock className="w-5 h-5 text-teal-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">অর্ডার ও ডেলিভারি ওয়ার্কফ্লো টাইমলাইন</h3>
                  <p className="text-[11px] text-slate-500 font-mono">ইনভয়েস: {selectedSaleForWorkflow.invoiceNo}</p>
                </div>
              </div>
              <button
                onClick={() => setWorkflowModalMode(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Timeline View */}
            <div className="py-2 space-y-6">
              {/* Step 1 */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                    ১
                  </div>
                  <div className="w-0.5 h-12 bg-emerald-600 mt-1" />
                </div>
                <div className="text-xs pt-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>ইনভয়েস ও বিক্রয় তৈরি</span>
                    <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded font-semibold">সম্পন্ন</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">তারিখ: {formatDate(selectedSaleForWorkflow.date)} | এক্সিকিউটিভ: {selectedSaleForWorkflow.servedBy}</p>
                  <p className="text-slate-600 font-mono text-[11px]">মোট মূল্য: {formatCurrency(selectedSaleForWorkflow.grandTotal)}</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    (selectedSaleForWorkflow.workflowStep || 1) >= 2 ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white animate-pulse'
                  }`}>
                    ২
                  </div>
                  <div className={`w-0.5 h-12 mt-1 ${
                    (selectedSaleForWorkflow.workflowStep || 1) >= 3 ? 'bg-emerald-600' : 'bg-slate-200'
                  }`} />
                </div>
                <div className="text-xs pt-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>ডেলিভারি পার্সন অ্যাসাইনমেন্ট</span>
                    {(selectedSaleForWorkflow.workflowStep || 1) >= 2 ? (
                      <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded font-semibold">সম্পন্ন</span>
                    ) : (
                      <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[10px] rounded font-semibold">চলমান (Pending)</span>
                    )}
                  </div>
                  {(selectedSaleForWorkflow.workflowStep || 1) >= 2 ? (
                    <div className="text-slate-600 text-[11px] mt-0.5">
                      <p>চালক: <span className="font-semibold text-slate-900">{selectedSaleForWorkflow.deliveryPerson}</span> ({selectedSaleForWorkflow.deliveryPhone || 'N/A'})</p>
                      <p>যানবাহন: {selectedSaleForWorkflow.deliveryVehicleNo || 'ঢাকা মেট্রো-ন ১২-৩৪৫৬'}</p>
                    </div>
                  ) : (
                    <div className="mt-1">
                      <button
                        onClick={() => {
                          setWorkflowModalMode('ASSIGN');
                        }}
                        className="px-2.5 py-1 bg-amber-600 text-white rounded-lg text-[10px] font-bold"
                      >
                        এখনই চালক নির্ধারণ করুন
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    (selectedSaleForWorkflow.workflowStep || 1) >= 3 ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    ৩
                  </div>
                </div>
                <div className="text-xs pt-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>গেট পাস কনফার্মেশন ও ডেলিভারি সম্পন্ন</span>
                    {(selectedSaleForWorkflow.workflowStep || 1) >= 3 ? (
                      <span className="px-1.5 py-0.2 bg-teal-100 text-teal-900 text-[10px] rounded font-semibold">সম্পন্ন ও ভেরিফাইড</span>
                    ) : (
                      <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 text-[10px] rounded font-semibold">অপেক্ষমান</span>
                    )}
                  </div>
                  {(selectedSaleForWorkflow.workflowStep || 1) >= 3 ? (
                    <div className="text-slate-600 text-[11px] mt-0.5">
                      <p>গেট পাস নম্বর: <span className="font-mono font-bold text-teal-800">{selectedSaleForWorkflow.gatePassNo}</span></p>
                      <p>ডেলিভারির তারিখ: {formatDate(selectedSaleForWorkflow.deliveredAt || selectedSaleForWorkflow.date)}</p>
                    </div>
                  ) : (
                    (selectedSaleForWorkflow.workflowStep || 1) === 2 && (
                      <div className="mt-1">
                        <button
                          onClick={() => {
                            setWorkflowModalMode('GATEPASS');
                          }}
                          className="px-2.5 py-1 bg-teal-700 text-white rounded-lg text-[10px] font-bold"
                        >
                          গেট পাস কনফার্ম করুন
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setWorkflowModalMode(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sales Register Clean Print Modal */}
      <ReportPrintModal
        isOpen={showRegisterPrintModal}
        onClose={() => setShowRegisterPrintModal(false)}
        title="বিক্রয় চালান ও ইনভয়েস রেজিস্টার রিপোর্ট"
        subtitle="অনুমোদিত বিক্রয় চালান, পণ্য ডেলিভারি এবং কাস্টমার বকেয়া আদায় বিবরণী"
        periodLabel={`মোট রেকর্ড: ${filteredSales.length} টি ইনভয়েস (${workflowTab === 'ALL' ? 'সকল' : workflowTab === 'PENDING' ? 'পেন্ডিং' : 'ডেলিভার্ড'})`}
        documentId="sales-register-print-sheet"
        landscape={true}
      >
        {renderSalesRegisterSchedule()}
      </ReportPrintModal>


    </div>
  );
};
