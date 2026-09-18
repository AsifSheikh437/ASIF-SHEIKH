import React, { useState, useMemo, useRef } from 'react';
import { OwnerPartner, OwnerWithdrawal, CompanySettings, BankAccount } from '../../types';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  cleanWhatsAppPhone,
  numberToWordsBDT,
  exportToCSV,
} from '../../utils/formatters';
import { printDocument, exportElementToPDF } from '../../utils/printPdfUtils';
import {
  X,
  Printer,
  Download,
  FileSpreadsheet,
  MessageSquare,
  Mail,
  Calendar,
  Building2,
  Phone,
  User,
  ShieldCheck,
  CheckCircle2,
  Copy,
  ExternalLink,
  Wallet,
  Landmark,
} from 'lucide-react';

interface OwnerStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPartnerId?: string; // 'ALL' or partner.id
  partners: OwnerPartner[];
  withdrawals: OwnerWithdrawal[];
  companySettings: CompanySettings;
  bankAccounts: BankAccount[];
}

export const OwnerStatementModal: React.FC<OwnerStatementModalProps> = ({
  isOpen,
  onClose,
  initialPartnerId = 'ALL',
  partners,
  withdrawals,
  companySettings,
  bankAccounts,
}) => {
  const statementRef = useRef<HTMLDivElement>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(initialPartnerId);
  const [periodFilter, setPeriodFilter] = useState<'ALL' | 'THIS_MONTH' | 'LAST_30_DAYS' | 'CUSTOM'>('ALL');
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().substring(0, 10);
  });
  const [customEndDate, setCustomEndDate] = useState(() => new Date().toISOString().substring(0, 10));

  // WhatsApp / Email modal state
  const [showShareModal, setShowShareModal] = useState<'NONE' | 'WHATSAPP' | 'EMAIL'>('NONE');
  const [sharePhone, setSharePhone] = useState('');
  const [shareEmail, setShareEmail] = useState('');
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Sync initial partner on open
  React.useEffect(() => {
    setSelectedPartnerId(initialPartnerId);
  }, [initialPartnerId, isOpen]);

  const currentPartner = useMemo(() => {
    if (selectedPartnerId === 'ALL') return null;
    return partners.find(p => p.id === selectedPartnerId) || null;
  }, [selectedPartnerId, partners]);

  // Set share defaults when partner changes
  React.useEffect(() => {
    if (currentPartner) {
      setSharePhone(currentPartner.phone || '');
      setShareEmail(currentPartner.email || '');
    } else {
      setSharePhone(companySettings.phone || '');
      setShareEmail(companySettings.email || '');
    }
  }, [currentPartner, companySettings]);

  // Filter withdrawals
  const { statementList, fromDateStr, toDateStr, totalPeriodAmount } = useMemo(() => {
    // 1. Partner filter
    let list = withdrawals.slice();
    if (selectedPartnerId !== 'ALL') {
      const p = partners.find(it => it.id === selectedPartnerId);
      list = list.filter(w => {
        if (w.ownerId && w.ownerId === selectedPartnerId) return true;
        if (p && w.ownerName && w.ownerName.toLowerCase().includes(p.name.toLowerCase())) return true;
        return false;
      });
    }

    // Sort ascending by date for ledger running balance
    list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 2. Period filter
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (periodFilter === 'THIS_MONTH') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (periodFilter === 'LAST_30_DAYS') {
      startDate = new Date();
      startDate.setDate(now.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
    } else if (periodFilter === 'CUSTOM') {
      if (customStartDate) {
        startDate = new Date(customStartDate);
        startDate.setHours(0, 0, 0, 0);
      }
      if (customEndDate) {
        endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59);
      }
    }

    let fromStr = 'শুরু থেকে';
    let toStr = 'বর্তমান পর্যন্ত';

    if (startDate) {
      fromStr = formatDate(startDate.toISOString());
    }
    if (endDate) {
      toStr = formatDate(endDate.toISOString());
    }

    const filtered = list.filter(w => {
      const t = new Date(w.date).getTime();
      if (startDate && t < startDate.getTime()) return false;
      if (endDate && t > endDate.getTime()) return false;
      return true;
    });

    let runningSum = 0;
    const enriched = filtered.map((w, index) => {
      runningSum += w.amount;
      return {
        ...w,
        sl: index + 1,
        runningTotal: runningSum,
      };
    });

    return {
      statementList: enriched,
      fromDateStr: fromStr,
      toDateStr: toStr,
      totalPeriodAmount: runningSum,
    };
  }, [withdrawals, selectedPartnerId, partners, periodFilter, customStartDate, customEndDate]);

  if (!isOpen) return null;

  // Print handler
  const handlePrint = () => {
    printDocument('owner-withdrawal-statement-sheet');
  };

  // PDF Export
  const handleExportPDF = () => {
    const filename = `Owner_Withdrawal_Statement_${currentPartner ? currentPartner.name.replace(/\s+/g, '_') : 'All_Partners'}_${new Date().toISOString().substring(0, 10)}`;
    exportElementToPDF('owner-withdrawal-statement-sheet', filename);
  };

  // CSV Export
  const handleExportCSV = () => {
    const filename = `Owner_Withdrawal_Statement_${currentPartner ? currentPartner.name.replace(/\s+/g, '_') : 'All'}_${new Date().toISOString().substring(0, 10)}`;
    const headers = [
      'ক্রম (SL)',
      'তারিখ (Date)',
      'ভাউচার নং (Voucher No)',
      'অংশীদার / স্বত্বাধিকারী (Partner Name)',
      'উত্তোলনের কারণ ও বিবরণ (Purpose/Particulars)',
      'পেমেন্ট মেথড (Payment Method)',
      'ব্যাংক অ্যাকাউন্ট (Bank Details)',
      'উত্তোলিত অর্থ (Amount BDT)',
      'পুঞ্জীভূত মোট (Cumulative Total BDT)',
    ];

    const rows = statementList.map(item => [
      item.sl,
      item.date,
      item.voucherNo || '-',
      item.ownerName,
      item.purpose || item.reason || 'ব্যক্তিগত উত্তোলন',
      item.paymentMethod || item.paidVia || 'CASH',
      item.bankAccountName || '-',
      item.amount,
      item.runningTotal,
    ]);

    // Summary row
    rows.push([
      '',
      '',
      '',
      'সর্বমোট উত্তোলন (Total)',
      '',
      '',
      '',
      totalPeriodAmount,
      totalPeriodAmount,
    ]);

    exportToCSV(filename, headers, rows);
  };

  // WhatsApp Message Generator
  const generateWhatsAppMessage = () => {
    const partnerTitle = currentPartner ? currentPartner.name : 'সম্মানিত অংশীদারবৃন্দ';
    const lines = [
      `*${companySettings.name}*`,
      `স্বত্বাধিকারী মূলধন উত্তোলন স্টেটমেন্ট`,
      `---------------------------------`,
      `অংশীদার: ${partnerTitle}`,
      `সময়সীমা: ${fromDateStr} হতে ${toDateStr}`,
      `মোট উত্তোলিত অর্থ: ${formatCurrency(totalPeriodAmount)}`,
      `কথায়: ${numberToWordsBDT(totalPeriodAmount)}`,
      `মোট উত্তোলন লেনদেন: ${statementList.length} টি`,
      ``,
      `*লেনদেনের সংক্ষিপ্ত বিবরণ:*`,
      ...statementList.slice(-5).map(item => `• ${formatDate(item.date)}: ${formatCurrency(item.amount)} (${item.purpose || 'ব্যক্তিগত'})`),
      statementList.length > 5 ? `...এবং আরও ${statementList.length - 5}টি লেনদেন` : '',
      `---------------------------------`,
      `হিসাব প্রস্তুতের তারিখ: ${formatDate(new Date().toISOString())}`,
      `_এই উত্তোলন মূলধন সমন্বয় হিসেবে গণ্য_`,
    ].filter(Boolean);

    return lines.join('\n');
  };

  const handleSendWhatsApp = () => {
    const cleaned = cleanWhatsAppPhone(sharePhone);
    const message = encodeURIComponent(generateWhatsAppMessage());
    if (cleaned) {
      window.open(`https://wa.me/${cleaned}?text=${message}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${message}`, '_blank');
    }
    setShowShareModal('NONE');
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent(`মালিকের উত্তোলন স্টেটমেন্ট - ${companySettings.name}`);
    const body = encodeURIComponent(generateWhatsAppMessage());
    window.location.href = `mailto:${shareEmail}?subject=${subject}&body=${body}`;
    setShowShareModal('NONE');
  };

  const handleCopyClipboard = () => {
    navigator.clipboard.writeText(generateWhatsAppMessage());
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[96vh] animate-in fade-in zoom-in-95">
        
        {/* Top Modal Controls Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-200 bg-slate-50/80 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                স্বত্বাধিকারী উত্তোলন লেজার ও ব্যাংক-স্টেটমেন্ট
              </h2>
              <p className="text-xs text-slate-500">
                অফিসিয়াল ফরম্যাটে পার্টনার ড্রয়িংস ও ক্যাপিটাল অ্যাডজাস্টমেন্ট স্টেটমেন্ট
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
              title="প্রিন্ট করুন"
            >
              <Printer className="w-3.5 h-3.5 text-purple-600" />
              <span className="hidden sm:inline">প্রিন্ট</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
              title="PDF ডাউনলোড"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">PDF</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
              title="CSV/Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            <button
              onClick={() => setShowShareModal('WHATSAPP')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg transition-colors"
              title="WhatsApp শেয়ার"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              onClick={() => setShowShareModal('EMAIL')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-semibold rounded-lg transition-colors"
              title="Email শেয়ার"
            >
              <Mail className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Email</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Toolbar inside Modal */}
        <div className="p-3 sm:px-6 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Partner Selector */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-purple-600" />
              অংশীদার / পার্টনার:
            </span>
            <select
              value={selectedPartnerId}
              onChange={e => setSelectedPartnerId(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
            >
              <option value="ALL">সকল পার্টনার (সম্মিলিত স্টেটমেন্ট)</option>
              {partners.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.sharePercentage ? `(${p.sharePercentage}%)` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Period Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-600 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              সময়সীমা:
            </span>
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
              {(['ALL', 'THIS_MONTH', 'LAST_30_DAYS', 'CUSTOM'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPeriodFilter(mode)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    periodFilter === mode
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {mode === 'ALL' && 'সর্বমোট'}
                  {mode === 'THIS_MONTH' && 'চলতি মাস'}
                  {mode === 'LAST_30_DAYS' && 'গত ৩০ দিন'}
                  {mode === 'CUSTOM' && 'কাস্টম'}
                </button>
              ))}
            </div>

            {periodFilter === 'CUSTOM' && (
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={e => setCustomStartDate(e.target.value)}
                  className="bg-white border border-slate-200 rounded-md px-2 py-1 text-[11px]"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={e => setCustomEndDate(e.target.value)}
                  className="bg-white border border-slate-200 rounded-md px-2 py-1 text-[11px]"
                />
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Printable Statement Sheet */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/50">
          <div
            id="owner-withdrawal-statement-sheet"
            ref={statementRef}
            className="bg-white border border-slate-200 rounded-xl p-6 sm:p-10 shadow-xs max-w-4xl mx-auto text-slate-800 font-sans"
          >
            {/* Header: Company Information */}
            <div className="border-b-2 border-slate-800 pb-5 mb-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 text-center sm:text-left">
                <div className="flex items-center gap-3">
                  {companySettings.logoUrl ? (
                    <img
                      src={companySettings.logoUrl}
                      alt={companySettings.name}
                      className="w-16 h-16 object-contain rounded-lg border border-slate-200 p-1"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-purple-700 text-white flex items-center justify-center font-bold text-xl shadow-xs">
                      {companySettings.name.slice(0, 2)}
                    </div>
                  )}
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {companySettings.name}
                    </h1>
                    {companySettings.nameBangla && (
                      <div className="text-sm font-semibold text-slate-600">
                        {companySettings.nameBangla}
                      </div>
                    )}
                    {companySettings.tagline && (
                      <p className="text-xs text-purple-700 font-medium italic mt-0.5">
                        {companySettings.tagline}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-0.5 sm:text-right">
                  <p className="flex items-center justify-center sm:justify-end gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{companySettings.address}</span>
                  </p>
                  {companySettings.factoryAddress && (
                    <p className="text-[11px] text-slate-500">
                      কারখানা: {companySettings.factoryAddress}
                    </p>
                  )}
                  <p className="flex items-center justify-center sm:justify-end gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>ফোন: {companySettings.phone}</span>
                    {companySettings.email && <span>| ইমেইল: {companySettings.email}</span>}
                  </p>
                  {(companySettings.binNumber || companySettings.tinNumber) && (
                    <p className="text-[11px] text-slate-500 font-mono">
                      {companySettings.binNumber ? `BIN: ${companySettings.binNumber} ` : ''}
                      {companySettings.tinNumber ? `TIN: ${companySettings.tinNumber}` : ''}
                    </p>
                  )}
                </div>
              </div>

              {/* Statement Title Badge */}
              <div className="mt-6 text-center">
                <div className="inline-block px-5 py-1.5 bg-slate-900 text-white rounded-full text-xs sm:text-sm font-bold tracking-wider uppercase shadow-xs">
                  স্বত্বাধিকারী মূলধন উত্তোলন বিবরণী (Owner Drawings Statement)
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  ব্যাংক-স্টেটমেন্ট স্টাইল বিস্তারিত ক্যাপিটাল ও ইকুইটি ড্রয়িংস রেকর্ড
                </p>
              </div>
            </div>

            {/* Statement Particulars / Metadata Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-xs">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-28">অংশীদার / স্বত্বাধিকারী:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {currentPartner ? currentPartner.name : 'সকল স্বত্বাধিকারীর সম্মিলিত অ্যাকাউন্ট'}
                  </span>
                </div>
                {currentPartner && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 w-28">পদবী / শেয়ার:</span>
                      <span className="font-semibold text-purple-700">
                        {currentPartner.designation || 'অংশীদার'} {currentPartner.sharePercentage ? `(${currentPartner.sharePercentage}% অংশীদারি)` : ''}
                      </span>
                    </div>
                    {currentPartner.phone && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 w-28">মোবাইল নম্বর:</span>
                        <span className="font-mono text-slate-800">{currentPartner.phone}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-28">হিসাবরক্ষণ ধরন:</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    মালিকের ইকুইটি ড্রয়িংস (Equity / Capital Adjustment)
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 sm:border-l sm:border-slate-200 sm:pl-4">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-28">বিবরণীর সময়সীমা:</span>
                  <span className="font-semibold text-slate-900">{fromDateStr} হতে {toDateStr}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-28">প্রস্তুতের তারিখ:</span>
                  <span className="font-mono text-slate-700">{formatDateTime(new Date().toISOString())}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-28">মুদ্রা:</span>
                  <span className="font-bold text-slate-800">বাংলাদেশী টাকা (BDT ৳)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-28">মোট লেনদেন:</span>
                  <span className="font-bold text-purple-800 font-mono">{statementList.length} টি</span>
                </div>
              </div>
            </div>

            {/* Statement Ledger Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl mb-6">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3 w-10 text-center">ক্রম</th>
                    <th className="py-2.5 px-3 w-24">তারিখ</th>
                    <th className="py-2.5 px-3 w-28">ভাউচার নং</th>
                    <th className="py-2.5 px-3">অংশীদার</th>
                    <th className="py-2.5 px-3">উত্তোলনের কারণ / খাত</th>
                    <th className="py-2.5 px-3">মাধ্যম</th>
                    <th className="py-2.5 px-3 text-right">উত্তোলন (৳)</th>
                    <th className="py-2.5 px-3 text-right font-bold text-slate-900">পুঞ্জীভূত মোট (৳)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {statementList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                        নির্বাচিত সময়সীমায় কোনো উত্তোলন রেকর্ড পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    statementList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{item.sl}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                          {formatDate(item.date)}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-700 whitespace-nowrap">
                          {item.voucherNo || `WTH-${item.id.slice(-4)}`}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {item.ownerName}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          <span className="font-medium">{item.purpose || item.reason || 'ব্যক্তিগত উত্তোলন'}</span>
                          {item.notes && <span className="text-[11px] text-slate-400 block">{item.notes}</span>}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                            (item.paymentMethod || item.paidVia) === 'BANK'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {(item.paymentMethod || item.paidVia) === 'BANK' ? 'ব্যাংক' : 'ক্যাশ'}
                          </span>
                          {item.bankAccountName && (
                            <span className="text-[10px] text-slate-500 block truncate max-w-[120px]" title={item.bankAccountName}>
                              {item.bankAccountName}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-purple-700">
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 bg-slate-50/50">
                          {formatCurrency(item.runningTotal)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                    <td colSpan={6} className="py-3 px-4 text-right uppercase text-[11px] tracking-wider">
                      বিবরণীর সর্বমোট উত্তোলন (Grand Total):
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-sm text-purple-800">
                      {formatCurrency(totalPeriodAmount)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-sm text-slate-900 bg-slate-200/50">
                      {formatCurrency(totalPeriodAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* In Words & Capital Summary Block */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 text-xs">
                <span className="font-bold text-purple-900 block mb-1">টাকার পরিমাণ (কথায়):</span>
                <p className="font-semibold text-purple-800 leading-relaxed">
                  {numberToWordsBDT(totalPeriodAmount)}
                </p>
                <div className="mt-3 pt-3 border-t border-purple-200/60 text-[11px] text-purple-900/80 space-y-1">
                  <div className="flex items-center gap-1 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                    হিসাবরক্ষণ নীতিমালা (Accounting Policy Notice):
                  </div>
                  <p className="text-slate-600 leading-normal">
                    এই উত্তোলন কোনো পরিচালন ব্যয় (P&L Expense) নয়। এটি কোম্পানির নিট মুনাফা হ্রাসের কারণ নয়, বরং সরাসরি মালিকের মূলধন/ইকুইটি হিসাব থেকে কর্তনযোগ্য।
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
                <span className="font-bold text-slate-800 block border-b border-slate-200 pb-1">
                  মূলধন ও ইকুইটি স্থিতি (Equity Position Summary)
                </span>
                {currentPartner ? (
                  <>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>প্রারম্ভিক বিনিয়োগ / মূলধন:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {currentPartner.initialCapital ? formatCurrency(currentPartner.initialCapital) : '৳০'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-purple-700">
                      <span>নির্বাচিত সময়সীমায় উত্তোলন:</span>
                      <span className="font-mono font-bold">
                        (-) {formatCurrency(totalPeriodAmount)}
                      </span>
                    </div>
                    {currentPartner.initialCapital ? (
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200 font-bold text-slate-900">
                        <span>অবশিষ্ট মূলধন (Estimated Net Equity):</span>
                        <span className={`font-mono text-sm ${
                          (currentPartner.initialCapital - totalPeriodAmount) >= 0 ? 'text-emerald-700' : 'text-red-600'
                        }`}>
                          {formatCurrency(currentPartner.initialCapital - totalPeriodAmount)}
                        </span>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="space-y-1.5 text-slate-600">
                    <div className="flex justify-between items-center">
                      <span>মোট নিবন্ধিত অংশীদার:</span>
                      <span className="font-bold text-slate-900">{partners.length} জন</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>মোট সম্মিলিত উত্তোলন:</span>
                      <span className="font-mono font-bold text-purple-700">{formatCurrency(totalPeriodAmount)}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 pt-1">
                      একক পার্টনারের বিস্তারিত দেখতে ওপরের ড্রপডাউন থেকে নির্দিষ্ট নাম সিলেক্ট করুন।
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Official Signature Blocks */}
            <div className="pt-10 mt-8 border-t border-slate-200 grid grid-cols-3 gap-4 text-center text-xs">
              <div>
                <div className="w-36 h-12 border-b border-slate-400 mx-auto mb-2 flex items-end justify-center pb-1">
                  <span className="text-[10px] text-slate-400 italic">প্রস্তুতকারী</span>
                </div>
                <span className="font-bold text-slate-700 block">হিসাব সহকারী</span>
                <span className="text-[10px] text-slate-400 block">Accounts Dept.</span>
              </div>

              <div>
                <div className="w-36 h-12 border-b border-slate-400 mx-auto mb-2 flex items-end justify-center pb-1">
                  <span className="text-[10px] text-slate-400 italic">যাচাইকৃত</span>
                </div>
                <span className="font-bold text-slate-700 block">প্রধান হিসাব কর্মকর্তা</span>
                <span className="text-[10px] text-slate-400 block">Head of Accounts</span>
              </div>

              <div>
                <div className="w-36 h-12 border-b border-slate-400 mx-auto mb-2 flex items-end justify-center pb-1">
                  <span className="text-[10px] text-slate-400 italic">স্বাক্ষর</span>
                </div>
                <span className="font-bold text-slate-800 block">
                  {currentPartner ? currentPartner.name : 'স্বত্বাধিকারী / অংশীদার'}
                </span>
                <span className="text-[10px] text-slate-400 block">Partner / Director</span>
              </div>
            </div>

            {/* Footer Tagline */}
            <div className="mt-8 pt-3 border-t border-slate-100 text-center text-[10px] text-slate-400">
              কম্পিউটার জেনারেটেড অফিসিয়াল স্টেটমেন্ট • খাদ্য উৎপাদন ও বিতরণ ইআরপি সফটওয়্যার
            </div>
          </div>
        </div>

        {/* Share Modal Dialog (WhatsApp / Email) */}
        {showShareModal !== 'NONE' && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-2xs animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl p-5 w-full max-w-md border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  {showShareModal === 'WHATSAPP' ? (
                    <MessageSquare className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Mail className="w-5 h-5 text-purple-600" />
                  )}
                  <h3 className="font-bold text-slate-800 text-sm">
                    {showShareModal === 'WHATSAPP' ? 'হোয়াটসঅ্যাপে স্টেটমেন্ট পাঠান' : 'ইমেইলে স্টেটমেন্ট পাঠান'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowShareModal('NONE')}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {showShareModal === 'WHATSAPP' ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      মোবাইল নম্বর (হোয়াটসঅ্যাপ):
                    </label>
                    <input
                      type="text"
                      value={sharePhone}
                      onChange={e => setSharePhone(e.target.value)}
                      placeholder="01712345678"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:bg-white focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-40 overflow-y-auto font-mono text-[11px] text-slate-700 whitespace-pre-line">
                    {generateWhatsAppMessage()}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={handleCopyClipboard}
                      className="flex items-center gap-1 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors font-medium text-xs"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copiedNotification ? 'কপি হয়েছে!' : 'টেক্সট কপি করুন'}
                    </button>

                    <button
                      type="button"
                      onClick={handleSendWhatsApp}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors text-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      WhatsApp খুলুন
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      প্রাপকের ইমেইল ঠিকানা:
                    </label>
                    <input
                      type="email"
                      value={shareEmail}
                      onChange={e => setShareEmail(e.target.value)}
                      placeholder="partner@company.com"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setShowShareModal('NONE')}
                      className="px-3 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50"
                    >
                      বাতিল
                    </button>

                    <a
                      href={`mailto:${shareEmail}?subject=${encodeURIComponent(`মালিকের উত্তোলন স্টেটমেন্ট - ${companySettings.name}`)}&body=${encodeURIComponent(generateWhatsAppMessage())}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShowShareModal('NONE')}
                      className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-xs transition-colors text-xs"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      ইমেইল ড্রাফট করুন {shareEmail ? `(${shareEmail})` : ''}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
