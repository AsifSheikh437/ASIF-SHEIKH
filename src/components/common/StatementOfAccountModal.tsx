import React, { useState, useMemo } from 'react';
import { Customer, Supplier, LedgerEntry, CompanySettings, BankAccount } from '../../types';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  cleanWhatsAppPhone,
  numberToWordsBDT,
  exportToCSV,
} from '../../utils/formatters';
import { printDocument, exportElementToPDF, shareAsPDF } from '../../utils/printPdfUtils';
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
  MapPin,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Send,
  ChevronDown,
} from 'lucide-react';

interface StatementOfAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  partyType: 'CUSTOMER' | 'SUPPLIER';
  party: Customer | Supplier;
  transactions: LedgerEntry[];
  companySettings: CompanySettings;
  bankAccounts: BankAccount[];
}

export const StatementOfAccountModal: React.FC<StatementOfAccountModalProps> = ({
  isOpen,
  onClose,
  partyType,
  party,
  transactions,
  companySettings,
  bankAccounts,
}) => {
  // Period filter
  const [periodFilter, setPeriodFilter] = useState<'ALL' | 'THIS_MONTH' | 'LAST_30_DAYS' | 'CUSTOM'>('ALL');
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().substring(0, 10);
  });
  const [customEndDate, setCustomEndDate] = useState(() => new Date().toISOString().substring(0, 10));

  // Quick edit email / phone for sending
  const [partyEmail, setPartyEmail] = useState(party.email || '');
  const [partyPhone, setPartyPhone] = useState(party.phone || '');
  const [copiedNotification, setCopiedNotification] = useState(false);

  if (!isOpen) return null;

  const isCustomer = partyType === 'CUSTOMER';
  const customer = isCustomer ? (party as Customer) : null;
  const supplier = !isCustomer ? (party as Supplier) : null;

  // Filter transactions by selected period
  const { filteredTx, openingBalanceBeforePeriod, fromDateStr, toDateStr } = useMemo(() => {
    const allForParty = transactions.filter(t => {
      if (isCustomer) {
        return t.customerId === party.id || t.accountId === party.id;
      } else {
        return t.supplierId === party.id || t.accountId === party.id;
      }
    });

    // Sort ascending by date
    allForParty.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let startDate: Date | null = null;
    let endDate: Date | null = null;
    const now = new Date();

    if (periodFilter === 'THIS_MONTH') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (periodFilter === 'LAST_30_DAYS') {
      startDate = new Date();
      startDate.setDate(now.getDate() - 30);
      endDate = new Date();
    } else if (periodFilter === 'CUSTOM') {
      if (customStartDate) startDate = new Date(customStartDate);
      if (customEndDate) {
        endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59);
      }
    }

    let opBal = party.openingBalance || 0;
    const periodTx: LedgerEntry[] = [];

    allForParty.forEach(tx => {
      const txDate = new Date(tx.date);
      if (startDate && txDate < startDate) {
        // Accumulate into opening balance before this period
        if (isCustomer) {
          opBal += (tx.debit || 0) - (tx.credit || 0);
        } else {
          opBal += (tx.credit || 0) - (tx.debit || 0);
        }
      } else if (!endDate || txDate <= endDate) {
        periodTx.push(tx);
      }
    });

    return {
      filteredTx: periodTx,
      openingBalanceBeforePeriod: opBal,
      fromDateStr: startDate ? formatDate(startDate.toISOString()) : formatDate(party.createdAt || '2026-01-01'),
      toDateStr: endDate ? formatDate(endDate.toISOString()) : formatDate(new Date().toISOString()),
    };
  }, [transactions, party, isCustomer, periodFilter, customStartDate, customEndDate]);

  // Calculate table rows with running balance
  const { tableRows, totalPeriodDebit, totalPeriodCredit, finalClosingBalance } = useMemo(() => {
    let currentRunBal = openingBalanceBeforePeriod;
    let sumDebit = 0;
    let sumCredit = 0;

    const rows = filteredTx.map((tx, idx) => {
      const debit = tx.debit || 0;
      const credit = tx.credit || 0;
      sumDebit += debit;
      sumCredit += credit;

      if (isCustomer) {
        currentRunBal = currentRunBal + debit - credit;
      } else {
        currentRunBal = currentRunBal + credit - debit;
      }

      return {
        sl: idx + 1,
        date: tx.date,
        voucherNo: tx.voucherNo || `VCH-${tx.id.slice(-5)}`,
        description: tx.description || (isCustomer ? 'বিক্রয় ও বিলিং' : 'পণ্য ক্রয় চালান'),
        type: tx.accountType || (debit > credit ? 'INVOICE' : 'PAYMENT'),
        debit,
        credit,
        runningBalance: currentRunBal,
      };
    });

    return {
      tableRows: rows,
      totalPeriodDebit: sumDebit,
      totalPeriodCredit: sumCredit,
      finalClosingBalance: currentRunBal,
    };
  }, [filteredTx, openingBalanceBeforePeriod, isCustomer]);

  // Reference number & timestamps (Bank style)
  const statementRefNo = useMemo(() => {
    const codePart = party.code.replace(/[^a-zA-Z0-9]/g, '');
    const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    return `STMT-${codePart}-${datePart}-01`;
  }, [party.code]);

  const statementPrintDateTime = useMemo(() => {
    return formatDateTime(new Date().toISOString());
  }, []);

  // Outstanding status
  const currentTotalDue = isCustomer
    ? (customer?.currentDue ?? finalClosingBalance)
    : (supplier?.currentPayable ?? finalClosingBalance);

  const isDueOutstanding = currentTotalDue > 0;

  // WhatsApp Message Generator
  const whatsAppMessage = useMemo(() => {
    const greeting = `আসসালামু আলাইকুম, প্রিয় ${party.name},\n${companySettings.companyNameBangla} থেকে আপনার অফিশিয়াল হিসাব বিবরণী (Statement of Account):`;
    const partyInfo = `\n👤 পার্টি কোড: ${party.code}\n📅 বিবরণীর তারিখ: ${formatDate(new Date().toISOString())}\n⏱️ সময়কাল: ${fromDateStr} হতে ${toDateStr}`;
    const financialInfo = `\n\n💰 প্রারম্ভিক জের: ${formatCurrency(openingBalanceBeforePeriod)}\n📈 মোট ডেবিট: ${formatCurrency(totalPeriodDebit)}\n📉 মোট ক্রেডিট (পরিশোধ): ${formatCurrency(totalPeriodCredit)}\n\n⚠️ সর্বমোট বর্তমান বকেয়া: ${formatCurrency(currentTotalDue)} (${numberToWordsBDT(currentTotalDue)})`;
    const bankNotice = `\n\n🏦 পরিশোধের ব্যাংক হিসাব:\n১. ইসলামী ব্যাংক: ${bankAccounts[0]?.accountNumber || '20501140028912'}\n২. বিকাশ মার্চেন্ট: 01711234567\n\nবিস্তারিত স্টেটমেন্ট সংযুক্ত করা হয়েছে। যেকোনো প্রয়োজনে হিসাব শাখায় যোগাযোগ করুন: ${companySettings.phone}.\nধন্যবাদান্তে,\nহিসাব বিভাগ, ${companySettings.companyNameBangla}`;

    return `${greeting}${partyInfo}${financialInfo}${bankNotice}`;
  }, [
    party,
    companySettings,
    fromDateStr,
    toDateStr,
    openingBalanceBeforePeriod,
    totalPeriodDebit,
    totalPeriodCredit,
    currentTotalDue,
    bankAccounts,
  ]);

  // Email Subject & Body Generator
  const emailSubject = `Statement of Account – ${party.name} (${party.code}) – ${formatDate(new Date().toISOString())}`;
  const emailBody = useMemo(() => {
    return `বরাবর,
${party.name}
${supplier?.companyName ? `প্রতিষ্ঠান: ${supplier.companyName}\n` : ''}ঠিকানা: ${party.address}
মোবাইল: ${partyPhone}

বিষয়: অফিশিয়াল হিসাব বিবরণী (Statement of Account) সংক্রান্ত।

মহোদয়/মহোদয়া,
${companySettings.companyNameBangla} (${companySettings.companyNameEnglish})-এর পক্ষ থেকে শুভেচ্ছা গ্রহণ করুন। আপনার অ্যাকাউন্ট বিবরণী নিম্নে প্রদান করা হলো:

========================================
স্টেটমেন্ট রেফারেন্স: ${statementRefNo}
তারিখ: ${statementPrintDateTime}
সময়কাল: ${fromDateStr} হতে ${toDateStr}
মুদ্রা: BDT (বাংলাদেশী টাকা)
========================================

হিসাব সারসংক্ষেপ:
- প্রারম্ভিক জের (Opening Balance): ${formatCurrency(openingBalanceBeforePeriod)}
- মোট ডেবিট (Total Debit): ${formatCurrency(totalPeriodDebit)}
- মোট ক্রেডিট (Total Credit / Paid): ${formatCurrency(totalPeriodCredit)}
----------------------------------------
- বর্তমান সর্বমোট বকেয়া (Closing Balance): ${formatCurrency(currentTotalDue)}
কথায়: ${numberToWordsBDT(currentTotalDue)}
----------------------------------------

বকেয়া পরিশোধের জন্য ব্যাংক হিসাব তথ্য:
১. ${bankAccounts[0]?.accountName || 'ইসলামী ব্যাংক বাংলাদেশ পিএলসি'}: হিসাব নং- ${bankAccounts[0]?.accountNumber || '20501140028912'} (শাখা: তেজগাঁও কর্পোরেট শাখা)
২. ${bankAccounts[1]?.accountName || 'ব্র্যাক ব্যাংক পিএলসি'}: হিসাব নং- ${bankAccounts[1]?.accountNumber || '15012048991001'} (শাখা: গুলশান শাখা)
৩. বিকাশ মার্চেন্ট পেমেন্ট: 01711234567

যেকোনো হিসাব বা ইনভয়েস সংক্রান্ত তথ্যের জন্য অনুগ্রহ করে যোগাযোগ করুন:
হিসাব বিভাগ, ${companySettings.companyNameBangla}
ফোন: ${companySettings.phone}
ইমেইল: ${companySettings.email}
ঠিকানা: ${companySettings.address}

ধন্যবাদান্তে,
সোনালী ফুডস অ্যান্ড বেকারি লিঃ`;
  }, [
    party,
    supplier,
    partyPhone,
    companySettings,
    statementRefNo,
    statementPrintDateTime,
    fromDateStr,
    toDateStr,
    openingBalanceBeforePeriod,
    totalPeriodDebit,
    totalPeriodCredit,
    currentTotalDue,
    bankAccounts,
  ]);

  // PDF Share to WhatsApp Master Action (Attaches real PDF file or triggers seamless fallback)
  const handleOpenWhatsApp = async () => {
    const cleanPartyName = party.name.replace(/[^a-zA-Z0-9\u0980-\u09FF_-]/g, '_');
    const statementFileName = `Statement_${cleanPartyName}_${party.code || 'DOC'}_${new Date()
      .toISOString()
      .substring(0, 10)}.pdf`;

    await shareAsPDF({
      elementOrId: 'statement-printable-document',
      fileName: statementFileName,
      phoneNumber: partyPhone,
      messageText: whatsAppMessage,
      title: `${party.name} - Official Statement of Account (${party.code || ''})`,
      orientation: 'portrait',
      margin: [8, 8, 8, 8],
    });
  };

  // Auto-Mail Link URL
  const targetEmail = partyEmail.trim();
  const mailtoUrl = `mailto:${encodeURIComponent(targetEmail)}?subject=${encodeURIComponent(
    emailSubject
  )}&body=${encodeURIComponent(emailBody)}`;

  // Copy WhatsApp text to clipboard
  const handleCopyMessage = () => {
    navigator.clipboard.writeText(whatsAppMessage);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Sl No',
      'Date',
      'Voucher / Bill No',
      'Description',
      'Type',
      'Debit (BDT)',
      'Credit (BDT)',
      'Running Balance (BDT)',
    ];
    const rows = [
      ['0', fromDateStr, '-', 'Opening Balance / প্রারম্ভিক জের', 'OPENING', 0, 0, openingBalanceBeforePeriod],
      ...tableRows.map(r => [
        r.sl,
        r.date,
        r.voucherNo,
        r.description,
        r.type,
        r.debit,
        r.credit,
        r.runningBalance,
      ]),
      ['TOTAL', '-', '-', 'Period Summary', '-', totalPeriodDebit, totalPeriodCredit, finalClosingBalance],
    ];
    exportToCSV(`Statement_${party.code}_${new Date().toISOString().substring(0, 10)}`, headers, rows);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div className="w-full max-w-5xl bg-white rounded-none sm:rounded-3xl min-h-screen sm:min-h-0 shadow-2xl border-0 sm:border border-slate-200 overflow-hidden my-0 sm:my-6 print:border-none print:shadow-none print:rounded-none print:my-0">
        {/* =========================================================================
            TOP ACTION TOOLBAR (Hidden during window.print)
            ========================================================================= */}
        <div className="p-3 sm:p-5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 print:hidden border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base text-white">
                  {isCustomer ? 'কাস্টমার লেজার বিবরণী' : 'সাপ্লায়ার লেজার স্টেটমেন্ট'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-900/60 text-teal-300 border border-teal-700">
                  {party.code}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {party.name} {supplier?.companyName ? `(${supplier.companyName})` : ''}
              </p>
            </div>
          </div>

          {/* Period Filter Dropdown & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Period selector */}
            <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700 text-xs">
              <button
                onClick={() => setPeriodFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  periodFilter === 'ALL' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                সকল
              </button>
              <button
                onClick={() => setPeriodFilter('THIS_MONTH')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  periodFilter === 'THIS_MONTH' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                চলতি মাস
              </button>
              <button
                onClick={() => setPeriodFilter('LAST_30_DAYS')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  periodFilter === 'LAST_30_DAYS' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                গত ৩০ দিন
              </button>
              <button
                onClick={() => setPeriodFilter('CUSTOM')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  periodFilter === 'CUSTOM' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                কাস্টম
              </button>
            </div>

            {/* Custom date range inputs */}
            {periodFilter === 'CUSTOM' && (
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={e => setCustomStartDate(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-slate-200"
                />
                <span className="text-slate-500">-</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={e => setCustomEndDate(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-slate-200"
                />
              </div>
            )}

            {/* WhatsApp Auto Click-to-Chat with Attached PDF Button */}
            <button
              onClick={handleOpenWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              title={`WhatsApp-এ PDF স্টেটমেন্ট পাঠান (${partyPhone})`}
            >
              <MessageSquare className="w-4 h-4 text-white" />
              <span>WhatsApp (PDF)</span>
            </button>

            {/* Email Auto Mailto Button */}
            <a
              href={mailtoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              title={`ইমেইল ক্লায়েন্টে স্টেটমেন্ট পাঠান (${partyEmail || 'ইমেইল নেই'})`}
            >
              <Mail className="w-4 h-4 text-white" />
              <span>Email</span>
            </a>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl border border-slate-700 transition-colors"
              title="Excel/CSV ডাউনলোড"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            </button>

            {/* Print Button */}
            <button
              onClick={() => printDocument('statement-printable-document', { title: `Statement_${party.name}_${party.code}` })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
              title="স্টেটমেন্ট সরাসরি প্রিন্ট করুন"
            >
              <Printer className="w-4 h-4 text-teal-400" />
              <span>প্রিন্ট</span>
            </button>

            {/* PDF Download Button */}
            <button
              onClick={() => exportElementToPDF('statement-printable-document', `Statement_${party.name.replace(/\s+/g, '_')}_${new Date().toISOString().substring(0, 7)}.pdf`)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              title="স্টেটমেন্ট PDF ফাইল ডাউনলোড করুন"
            >
              <Download className="w-4 h-4" />
              <span>PDF ডাউনলোড</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="modal-close-btn w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
              title="বন্ধ করুন"
              aria-label="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Optional Quick Communication Bar if user needs to quickly check or modify the contact details */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 print:hidden gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-semibold text-slate-700">WhatsApp নম্বর:</span>
              <input
                type="text"
                value={partyPhone}
                onChange={e => setPartyPhone(e.target.value)}
                placeholder="01712-xxxxxx"
                className="px-2 py-0.5 bg-white border border-slate-300 rounded font-mono text-xs w-36 text-slate-800"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-semibold text-slate-700">ইমেইল:</span>
              <input
                type="text"
                value={partyEmail}
                onChange={e => setPartyEmail(e.target.value)}
                placeholder="customer@example.com"
                className="px-2 py-0.5 bg-white border border-slate-300 rounded text-xs w-48 text-slate-800"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMessage}
              className="text-[11px] text-slate-600 hover:text-slate-900 flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs hover:bg-slate-100"
            >
              <Copy className="w-3 h-3 text-slate-500" />
              {copiedNotification ? 'কপি হয়েছে!' : 'মেসেজ টেক্সট কপি করুন'}
            </button>
          </div>
        </div>

        {/* =========================================================================
            STATEMENT PRINTABLE DOCUMENT (A4 Corporate Letterhead Style)
            ========================================================================= */}
        <div id="statement-printable-document" className="p-6 sm:p-10 text-slate-900 font-sans space-y-6 bg-white">
          {/* 1. CORPORATE LETTERHEAD */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-teal-800 pb-5 gap-4">
            <div className="flex items-start gap-3.5">
              {/* Company Logo Icon Badge */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-800 via-teal-900 to-slate-900 text-amber-300 flex flex-col items-center justify-center p-2 shadow-md shrink-0 border border-teal-700/50">
                <Building2 className="w-7 h-7 text-amber-400" />
                <span className="text-[7px] font-black uppercase tracking-wider text-teal-200 mt-0.5">ESTD 2018</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-teal-900 tracking-tight leading-tight">
                  {companySettings.companyNameBangla}
                </h1>
                <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  {companySettings.companyNameEnglish}
                </h2>
                <p className="text-[11px] text-amber-700 font-medium italic mt-0.5">
                  {companySettings.tagline}
                </p>
                <div className="text-[10px] text-slate-500 space-y-0.5 mt-1 leading-snug">
                  <div>
                    <span className="font-semibold text-slate-700">হেড অফিস:</span> {companySettings.address}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">ফ্যাক্টরি:</span> {companySettings.factoryAddress}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">ফোন:</span> {companySettings.phone} |{' '}
                    <span className="font-semibold text-slate-700">ইমেইল:</span> {companySettings.email}
                  </div>
                  <div className="font-mono text-[9px] text-slate-500">
                    BIN / VAT নং: {companySettings.binVatNo} | ট্রেড লাইসেন্স: {companySettings.tradeLicenseNo}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Bank-style Statement Metadata Box */}
            <div className="sm:text-right w-full sm:w-auto bg-slate-50 p-3.5 rounded-2xl border border-slate-200 sm:min-w-[240px]">
              <div className="inline-block px-3 py-1 bg-teal-900 text-white rounded-lg text-xs font-black uppercase tracking-wider mb-2">
                STATEMENT OF ACCOUNT
              </div>
              <div className="text-xs font-bold text-slate-800">
                {isCustomer ? 'হিসাব বিবরণী (কাস্টমার লেজার)' : 'হিসাব বিবরণী (সাপ্লায়ার লেজার)'}
              </div>
              <div className="mt-2 text-[11px] text-slate-600 space-y-1 font-mono">
                <div className="flex justify-between sm:justify-end gap-3">
                  <span className="text-slate-500 font-sans">রেফারেন্স নং:</span>
                  <span className="font-bold text-teal-800">{statementRefNo}</span>
                </div>
                <div className="flex justify-between sm:justify-end gap-3">
                  <span className="text-slate-500 font-sans">ইস্যুর তারিখ:</span>
                  <span className="font-semibold text-slate-800">{statementPrintDateTime}</span>
                </div>
                <div className="flex justify-between sm:justify-end gap-3">
                  <span className="text-slate-500 font-sans">সময়কাল (Period):</span>
                  <span className="font-bold text-slate-900">{fromDateStr} - {toDateStr}</span>
                </div>
                <div className="flex justify-between sm:justify-end gap-3">
                  <span className="text-slate-500 font-sans">মুদ্রা (Currency):</span>
                  <span className="font-semibold text-slate-700">BDT (৳)</span>
                </div>
                <div className="flex justify-between sm:justify-end gap-3 pt-1 border-t border-slate-200">
                  <span className="text-slate-500 font-sans">অ্যাকাউন্ট স্ট্যাটাস:</span>
                  <span
                    className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                      isDueOutstanding
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {isDueOutstanding ? 'বকেয়া আছে (Outstanding)' : 'পরিশোধিত (Cleared)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. PARTY (CUSTOMER/SUPPLIER) PROFILE DETAILS BOX */}
          <div className="rounded-2xl border border-slate-300 bg-slate-50/70 p-4 sm:p-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  {isCustomer ? 'গ্রাহক / কাস্টমার প্রোফাইল (Account Details)' : 'সাপ্লায়ার প্রোফাইল (Vendor Details)'}
                </h3>
              </div>
              <span className="text-[11px] font-mono font-bold text-teal-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                পার্টি কোড: {party.code}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2.5 gap-x-6 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">নাম ও স্বত্বাধিকারী:</span>
                <span className="font-bold text-slate-900 text-sm">{party.name}</span>
                {supplier?.companyName && (
                  <div className="text-slate-600 font-medium text-[11px]">{supplier.companyName}</div>
                )}
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">মোবাইল ও যোগাযোগ:</span>
                <div className="font-mono font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3 text-teal-600" />
                  {partyPhone || party.phone}
                </div>
                <div className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5">
                  <Mail className="w-3 h-3 text-blue-500" />
                  {partyEmail || party.email || 'ইমেইল নিবন্ধিত নেই'}
                </div>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">ঠিকানা ও এলাকা:</span>
                <div className="text-slate-700 flex items-start gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-rose-500 shrink-0 mt-0.5" />
                  <span>{party.address || 'ঠিকানা দেওয়া নেই'}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  নিবন্ধন তারিখ: {formatDate(party.createdAt || '2026-01-01')}
                </div>
              </div>
            </div>
          </div>

          {/* 3. MINI FINANCIAL KPI SUMMARY BAR */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 text-[10px] font-semibold block">প্রারম্ভিক জের (Opening Balance):</span>
              <span className="text-sm font-mono font-bold text-slate-800">
                {formatCurrency(openingBalanceBeforePeriod)}
              </span>
            </div>

            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
              <span className="text-blue-700 text-[10px] font-semibold block">
                {isCustomer ? 'মোট বিক্রয় / বিল (Total Debit):' : 'মোট বিল পরিশোধ (Total Paid):'}
              </span>
              <span className="text-sm font-mono font-bold text-blue-900">
                {formatCurrency(totalPeriodDebit)}
              </span>
            </div>

            <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
              <span className="text-emerald-700 text-[10px] font-semibold block">
                {isCustomer ? 'মোট জমা / আদায় (Total Paid):' : 'মোট পণ্য ক্রয় (Total Billed):'}
              </span>
              <span className="text-sm font-mono font-bold text-emerald-900">
                {formatCurrency(totalPeriodCredit)}
              </span>
            </div>

            <div
              className={`p-3 rounded-xl border ${
                isDueOutstanding
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              <span className="text-[10px] font-bold block uppercase tracking-wider">
                {isCustomer ? 'বর্তমান মোট বকেয়া (Net Due):' : 'বর্তমান প্রদেয় দেনা (Net Payable):'}
              </span>
              <span className="text-base font-mono font-black">
                {formatCurrency(currentTotalDue)}
              </span>
            </div>
          </div>

          {/* 4. TRANSACTION STATEMENT TABLE */}
          <div className="overflow-hidden border border-slate-300 rounded-xl shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3 w-24">তারিখ</th>
                  <th className="py-2.5 px-3 w-28">চালান / ভাউচার</th>
                  <th className="py-2.5 px-3">লেনদেনের বিবরণ (Particulars)</th>
                  <th className="py-2.5 px-3 text-right w-24">
                    {isCustomer ? 'ডেবিট (+বিক্রয়)' : 'ডেবিট (-পরিশোধ)'}
                  </th>
                  <th className="py-2.5 px-3 text-right w-24">
                    {isCustomer ? 'ক্রেডিট (-জমা)' : 'ক্রেডিট (+ক্রয়)'}
                  </th>
                  <th className="py-2.5 px-3 text-right w-28 bg-slate-900 text-amber-300">
                    অবশিষ্ট জের (Balance)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {/* Row 1: Opening Balance */}
                <tr className="bg-slate-50 font-semibold text-slate-700">
                  <td className="py-2 px-3 text-center text-slate-400 font-mono">-</td>
                  <td className="py-2 px-3 font-mono text-slate-600">{fromDateStr}</td>
                  <td className="py-2 px-3 font-mono text-slate-400">-</td>
                  <td className="py-2 px-3 font-bold text-slate-800 italic">
                    প্রারম্ভিক ব্যালেন্স (Opening Balance B/F)
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-400">-</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-400">-</td>
                  <td className="py-2 px-3 text-right font-mono font-bold bg-slate-100 text-slate-900">
                    {formatCurrency(openingBalanceBeforePeriod)}
                  </td>
                </tr>

                {tableRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 bg-white">
                      এই নির্বাচিত সময়সীমার মধ্যে কোনো লেনদেন পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  tableRows.map((row, index) => {
                    const isEven = index % 2 === 1;
                    return (
                      <tr
                        key={index}
                        className={`transition-colors ${isEven ? 'bg-slate-50/60' : 'bg-white'}`}
                      >
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                          {row.sl}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                          {formatDate(row.date)}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-teal-800">
                          {row.voucherNo}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-900">{row.description}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                          {row.debit > 0 ? formatCurrency(row.debit) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-700">
                          {row.credit > 0 ? formatCurrency(row.credit) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold bg-slate-50/80 text-slate-900">
                          {formatCurrency(row.runningBalance)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                  <td colSpan={4} className="py-3 px-3 text-right uppercase tracking-wider text-xs">
                    মোট সময়কালীন লেনদেন (Period Total):
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-xs text-slate-900">
                    {formatCurrency(totalPeriodDebit)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-xs text-emerald-700">
                    {formatCurrency(totalPeriodCredit)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-xs bg-slate-200 text-slate-900">
                    -
                  </td>
                </tr>
                <tr
                  className={`border-t-2 ${
                    isDueOutstanding
                      ? 'bg-rose-100 text-rose-950 border-rose-300'
                      : 'bg-emerald-100 text-emerald-950 border-emerald-300'
                  }`}
                >
                  <td colSpan={4} className="py-3 px-3 text-right font-black uppercase text-xs">
                    সর্বশেষ মোট বকেয়া জের (Closing Balance):
                  </td>
                  <td colSpan={3} className="py-3 px-3 text-right font-mono font-black text-sm">
                    {formatCurrency(currentTotalDue)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 5. IN-WORDS AMOUNT REPRESENTATION */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-700">বকেয়ার পরিমাণ কথায়:</span>{' '}
              <span className="font-bold text-teal-900 italic">{numberToWordsBDT(currentTotalDue)}</span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              মোট রেকর্ড: {tableRows.length} টি
            </div>
          </div>

          {/* 6. BANK ACCOUNT PAYMENT INSTRUCTIONS */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
              <CreditCard className="w-4 h-4 text-teal-700" />
              <span>বকেয়া বিল পরিশোধের অফিসিয়াল ব্যাংক তথ্য (Payment Channels)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
              {bankAccounts.slice(0, 3).map(acc => (
                <div key={acc.id} className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-800">{acc.accountName}</div>
                  <div className="font-mono text-xs font-bold text-teal-700 mt-0.5">
                    A/C: {acc.accountNumber}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {acc.branch || 'তেজগাঁও কর্পোরেট শাখা, ঢাকা'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 7. OFFICIAL 4-TIER SIGNATURE BLOCK */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center text-xs text-slate-700 page-break-inside-avoid">
            <div>
              <div className="border-t border-slate-400 pt-2 font-bold text-slate-800">
                প্রস্তুতকারী (Prepared By)
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">অ্যাকাউন্টস অফিসার</div>
            </div>

            <div>
              <div className="border-t border-slate-400 pt-2 font-bold text-slate-800">
                যাচাইকারী (Verified By)
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">প্রধান হিসাবরক্ষক</div>
            </div>

            <div>
              <div className="border-t border-slate-400 pt-2 font-bold text-slate-800">
                অনুমোদিত স্বাক্ষর (Authorized Signatory)
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">ব্যবস্থাপনা পরিচালক / সিএফও</div>
            </div>

            <div>
              <div className="border-t border-slate-400 pt-2 font-bold text-slate-800">
                পার্টির স্বীকৃতি (Party Acceptance)
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">সিল ও স্বাক্ষর</div>
            </div>
          </div>

          {/* 8. FOOTER LEGAL DISCLAIMER */}
          <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 leading-relaxed">
            <p>
              এটি একটি কম্পিউটার দ্বারা স্বয়ংক্রিয়ভাবে তৈরি হিসাব স্টেটমেন্ট (Computer Generated Statement of Account)।
            </p>
            <p>
              কোনো অমিল পরিলক্ষিত হলে স্টেটমেন্ট ইস্যুর ৭ (সাত) কার্যদিবসের মধ্যে প্রতিষ্ঠানের হিসাব বিভাগে যোগাযোগ করার অনুরোধ করা হলো।
            </p>
            <p className="font-semibold text-slate-500 mt-1">
              {companySettings.companyNameEnglish} • Empowering Food Industry With Integrity
            </p>
          </div>
        </div>

        {/* =========================================================================
            BOTTOM MODAL FOOTER ACTIONS (Hidden during print)
            ========================================================================= */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <button
            onClick={onClose}
            className="px-5 py-2 border border-slate-300 text-slate-700 hover:bg-slate-200 rounded-xl font-bold text-xs transition-colors"
          >
            বন্ধ করুন (Exit)
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleOpenWhatsApp}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              title="প্রফেশনাল PDF ফাইল সহ WhatsApp-এ স্টেটমেন্ট পাঠান"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp-এ PDF স্টেটমেন্ট পাঠান</span>
            </button>

            <a
              href={mailtoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              title={`ইমেইল পাঠান: ${targetEmail || 'ইমেইল ক্লায়েন্ট খুলুন'}`}
            >
              <Mail className="w-4 h-4" />
              <span>Email পাঠান {targetEmail ? `(${targetEmail})` : ''}</span>
            </a>

            <button
              onClick={() => printDocument('statement-printable-document', { title: `Statement_${party.name}_${party.code}` })}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              title="স্টেটমেন্ট সরাসরি প্রিন্ট করুন"
            >
              <Printer className="w-4 h-4 text-teal-400" />
              <span>প্রিন্ট স্টেটমেন্ট</span>
            </button>

            <button
              onClick={() => exportElementToPDF('statement-printable-document', `Statement_${party.name.replace(/\s+/g, '_')}_${new Date().toISOString().substring(0, 7)}.pdf`)}
              className="flex items-center gap-2 px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              title="স্টেটমেন্ট PDF ফাইল ডাউনলোড করুন"
            >
              <Download className="w-4 h-4" />
              <span>PDF ডাউনলোড</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
