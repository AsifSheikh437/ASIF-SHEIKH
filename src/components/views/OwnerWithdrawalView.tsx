import React, { useState, useMemo } from 'react';
import { DataExportToolbar } from '../common/DataExportToolbar';
import { useERP } from '../../context/ERPContext';
import { formatCurrency, formatDate, exportToCSV } from '../../utils/formatters';
import { OwnerStatementModal } from './OwnerStatementModal';
import { OwnerPartner } from '../../types';
import {
  ArrowDownCircle,
  Plus,
  Download,
  Wallet,
  Landmark,
  ShieldCheck,
  User,
  Users,
  X,
  FileText,
  Trash2,
  Search,
  SlidersHorizontal,
  CreditCard,
  AlertCircle,
  Building2,
  Calendar,
} from 'lucide-react';

export const OwnerWithdrawalView: React.FC = () => {
  const {
    ownerWithdrawals,
    addOwnerWithdrawal,
    deleteOwnerWithdrawal,
    partners,
    addPartner,
    bankAccounts,
    settings,
    currentUser,
  } = useERP();

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPartnersModal, setShowPartnersModal] = useState(false);
  const [showNewPartnerForm, setShowNewPartnerForm] = useState(false);
  const [statementModalState, setStatementModalState] = useState<{
    isOpen: boolean;
    partnerId: string;
  }>({
    isOpen: false,
    partnerId: 'ALL',
  });

  // Filter state
  const [selectedPartnerFilter, setSelectedPartnerFilter] = useState<string>('ALL');
  const [selectedMethodFilter, setSelectedMethodFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // New withdrawal form fields
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>(() => partners[0]?.id || '');
  const [customOwnerName, setCustomOwnerName] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK'>('BANK');
  const [selectedBankId, setSelectedBankId] = useState<string>(() => bankAccounts[0]?.id || '');
  const [purpose, setPurpose] = useState('ব্যক্তিগত পারিবারিক খরচ');
  const [notes, setNotes] = useState('');

  // New partner form fields
  const [newPartnerName, setNewPartnerName] = useState('');
  const [newPartnerDesignation, setNewPartnerDesignation] = useState('ব্যবস্থাপনা অংশীদার');
  const [newPartnerShare, setNewPartnerShare] = useState<number | ''>(50);
  const [newPartnerCapital, setNewPartnerCapital] = useState<number | ''>('');
  const [newPartnerPhone, setNewPartnerPhone] = useState('');
  const [newPartnerEmail, setNewPartnerEmail] = useState('');

  // Quick purpose suggestions
  const purposeSuggestions = [
    'ব্যক্তিগত পারিবারিক খরচ',
    'চিকিৎসা ও ওষুধ ব্যয়',
    'সন্তানের সেমিস্টার ও শিক্ষা ফি',
    'বাসা ও ফ্ল্যাট সংস্কার ব্যয়',
    'ব্যক্তিগত বিনিয়োগ ও সঞ্চয়',
    'হজ্ব ও ধর্মীয় সফর তহবিল',
    'জরুরি ব্যক্তিগত প্রয়োজন',
  ];

  // Calculated metrics
  const totalWithdrawalAllTime = useMemo(() => {
    return ownerWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
  }, [ownerWithdrawals]);

  const thisMonthWithdrawal = useMemo(() => {
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return ownerWithdrawals
      .filter(w => w.date.startsWith(currentMonthPrefix))
      .reduce((sum, w) => sum + (w.amount || 0), 0);
  }, [ownerWithdrawals]);

  // Per partner calculations
  const partnerStats = useMemo(() => {
    return partners.map(p => {
      const partnerWithdrawals = ownerWithdrawals.filter(w => {
        if (w.ownerId && w.ownerId === p.id) return true;
        if (w.ownerName && w.ownerName.toLowerCase().includes(p.name.toLowerCase())) return true;
        return false;
      });
      const totalDrawings = partnerWithdrawals.reduce((s, w) => s + w.amount, 0);
      const remainingCapital = (p.initialCapital || 0) - totalDrawings;

      return {
        ...p,
        totalDrawings,
        transactionCount: partnerWithdrawals.length,
        remainingCapital,
      };
    });
  }, [partners, ownerWithdrawals]);

  // Filtered and enriched list with Running Balance
  const filteredWithdrawals = useMemo(() => {
    let list = [...ownerWithdrawals];

    // Filter by partner
    if (selectedPartnerFilter !== 'ALL') {
      const targetPartner = partners.find(p => p.id === selectedPartnerFilter);
      list = list.filter(w => {
        if (w.ownerId && w.ownerId === selectedPartnerFilter) return true;
        if (targetPartner && w.ownerName && w.ownerName.toLowerCase().includes(targetPartner.name.toLowerCase())) return true;
        return false;
      });
    }

    // Filter by payment method
    if (selectedMethodFilter !== 'ALL') {
      list = list.filter(w => (w.paymentMethod || w.paidVia) === selectedMethodFilter);
    }

    // Search term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(w =>
        w.ownerName.toLowerCase().includes(q) ||
        (w.purpose && w.purpose.toLowerCase().includes(q)) ||
        (w.reason && w.reason.toLowerCase().includes(q)) ||
        (w.voucherNo && w.voucherNo.toLowerCase().includes(q)) ||
        (w.notes && w.notes.toLowerCase().includes(q))
      );
    }

    // Sort chronologically ascending to compute running total, then reverse for display
    const chronological = [...list].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let running = 0;
    const withRunning = chronological.map(item => {
      running += item.amount;
      return {
        ...item,
        runningTotal: running,
      };
    });

    return withRunning.reverse();
  }, [ownerWithdrawals, selectedPartnerFilter, selectedMethodFilter, searchTerm, partners]);

  // Selected bank or cash balance check
  const selectedBank = bankAccounts.find(b => b.id === selectedBankId);
  const currentAvailableFunds = paymentMethod === 'BANK'
    ? (selectedBank?.balance || 0)
    : settings.cashInHandBalance;

  // Handlers
  const handleOpenAddModal = (partnerId?: string) => {
    if (partnerId && partnerId !== 'ALL') {
      setSelectedOwnerId(partnerId);
    } else if (partners.length > 0 && !selectedOwnerId) {
      setSelectedOwnerId(partners[0].id);
    }
    setAmount('');
    setNotes('');
    setShowAddModal(true);
  };

  const handleCreateWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;

    let targetOwnerName = '';
    let targetOwnerId: string | undefined = undefined;

    if (selectedOwnerId === 'CUSTOM') {
      targetOwnerName = customOwnerName.trim() || 'স্বত্বাধিকারী';
    } else {
      const matched = partners.find(p => p.id === selectedOwnerId);
      if (matched) {
        targetOwnerName = matched.name;
        targetOwnerId = matched.id;
      } else {
        targetOwnerName = 'স্বত্বাধিকারী';
      }
    }

    const matchedBank = paymentMethod === 'BANK' ? bankAccounts.find(b => b.id === selectedBankId) : undefined;
    const bankAccountName = matchedBank ? `${matchedBank.bankName} - ${matchedBank.accountName}` : undefined;

    addOwnerWithdrawal({
      date,
      ownerId: targetOwnerId,
      ownerName: targetOwnerName,
      amount: numAmount,
      paidVia: paymentMethod,
      paymentMethod,
      bankAccountId: paymentMethod === 'BANK' ? selectedBankId : undefined,
      bankAccountName,
      purpose: purpose.trim(),
      reason: purpose.trim(),
      notes: notes.trim() || undefined,
    });

    setShowAddModal(false);
    setAmount('');
    setNotes('');
  };

  const handleCreatePartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartnerName.trim()) return;

    addPartner({
      name: newPartnerName.trim(),
      designation: newPartnerDesignation.trim(),
      sharePercentage: typeof newPartnerShare === 'number' ? newPartnerShare : 50,
      initialCapital: typeof newPartnerCapital === 'number' ? newPartnerCapital : 0,
      phone: newPartnerPhone.trim() || undefined,
      email: newPartnerEmail.trim() || undefined,
    });

    setNewPartnerName('');
    setNewPartnerCapital('');
    setNewPartnerPhone('');
    setNewPartnerEmail('');
    setShowNewPartnerForm(false);
  };

  const handleExportCSV = () => {
    const headers = [
      'তারিখ (Date)',
      'ভাউচার নং (Voucher No)',
      'স্বত্বাধিকারী / পার্টনার (Owner/Partner)',
      'উত্তোলনের খাত ও উদ্দেশ্য (Purpose)',
      'উত্তোলন মাধ্যম (Method)',
      'ব্যাংক অ্যাকাউন্ট (Bank Info)',
      'উত্তোলিত টাকা (Amount ৳)',
      'নোট (Notes)',
    ];

    const rows = filteredWithdrawals.map(w => [
      w.date,
      w.voucherNo || '-',
      w.ownerName,
      w.purpose || w.reason || '-',
      w.paymentMethod || w.paidVia || 'CASH',
      w.bankAccountName || '-',
      w.amount,
      w.notes || '-',
    ]);

    exportToCSV(`Owner_Withdrawals_${new Date().toISOString().substring(0, 10)}`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                মালিকের উত্তোলন ও মূলধন হিসাব (Owner Drawings & Equity)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                স্বত্বাধিকারী/অংশীদারদের তহবিল উত্তোলন, ব্যাংক-স্টেটমেন্ট স্টাইল রানিং লেজার ও ইকুইটি সমন্বয়
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowPartnersModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors shadow-2xs"
          >
            <Users className="w-4 h-4 text-purple-600" />
            পার্টনার তালিকা ({partners.length})
          </button>

          <button
            onClick={() => setStatementModalState({ isOpen: true, partnerId: selectedPartnerFilter })}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-xl border border-purple-200 transition-colors shadow-2xs"
          >
            <FileText className="w-4 h-4" />
            অফিসিয়াল ব্যাংক-স্টেটমেন্ট ভিউ
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            CSV এক্সপোর্ট
          </button>

          <button
            onClick={() => handleOpenAddModal()}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            নতুন উত্তোলন এন্ট্রি
          </button>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Withdrawals */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              সর্বমোট পুঞ্জীভূত উত্তোলন
            </span>
            <div className="text-2xl font-black text-purple-700 mt-1 font-sans">
              {formatCurrency(totalWithdrawalAllTime)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              মোট {ownerWithdrawals.length} টি উত্তোলন লেনদেন রেকর্ড
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <ArrowDownCircle className="w-6 h-6" />
          </div>
        </div>

        {/* This Month's Withdrawals */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              চলতি মাসের উত্তোলন
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1 font-sans">
              {formatCurrency(thisMonthWithdrawal)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              বর্তমান ক্যালেন্ডার মাসে উত্তোলিত মোট তহবিল
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Accounting Policy Notice Card */}
        <div className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-300" />
            <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
              ইকুইটি ও P&L নীতি নির্দেশিকা
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            এই উত্তোলন <strong>P&L পরিচালন ব্যয়ে (OpEx) যুক্ত হয় না</strong>; এটি নিট লাভের ওপর প্রভাব ফেলে না। এটি সরাসরি ব্যালেন্স শিটের ওনার্স ইকুইটি/ক্যাপিটাল থেকে সমন্বয়যোগ্য।
          </p>
        </div>
      </div>

      {/* 3. Partner Cards Strip */}
      {partners.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-purple-600" />
              অংশীদার ভিত্তিক উত্তোলন সংক্ষিপ্তি ({partners.length} জন অংশীদার)
            </h3>
            <span className="text-[11px] text-slate-400">
              কার্ডে ক্লিক করে একক স্টেটমেন্ট ও উত্তোলন করুন
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {partnerStats.map(p => (
              <div
                key={p.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  selectedPartnerFilter === p.id
                    ? 'border-purple-500 bg-purple-50/50 shadow-xs'
                    : 'border-slate-200 bg-slate-50/70 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">
                      {p.name}
                    </span>
                    <span className="text-[11px] text-purple-700 font-semibold">
                      {p.designation} {p.sharePercentage ? `(${p.sharePercentage}%)` : ''}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-600 font-semibold">
                    {p.transactionCount} টি এন্ট্রি
                  </span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">উত্তোলন</span>
                    <span className="font-bold font-mono text-purple-700">
                      {formatCurrency(p.totalDrawings)}
                    </span>
                  </div>

                  {p.initialCapital ? (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">অবশিষ্ট মূলধন</span>
                      <span className={`font-bold font-mono ${p.remainingCapital >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                        {formatCurrency(p.remainingCapital)}
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="mt-3 pt-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenAddModal(p.id)}
                    className="flex-1 py-1 px-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    উত্তোলন
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatementModalState({ isOpen: true, partnerId: p.id })}
                    className="py-1 px-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1"
                  >
                    <FileText className="w-3 h-3 text-purple-600" />
                    স্টেটমেন্ট
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="পার্টনার, উদ্দেশ্য, ভাউচার সার্চ..."
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-purple-500"
            />
          </div>

          {/* Partner filter dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold">অংশীদার:</span>
            <select
              value={selectedPartnerFilter}
              onChange={e => setSelectedPartnerFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
            >
              <option value="ALL">সকল পার্টনার (All)</option>
              {partners.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Method filter dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold">মাধ্যম:</span>
            <select
              value={selectedMethodFilter}
              onChange={e => setSelectedMethodFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
            >
              <option value="ALL">সকল মাধ্যম (All)</option>
              <option value="BANK">ব্যাংক অ্যাকাউন্ট</option>
              <option value="CASH">ক্যাশ ড্রয়ার</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">
            দেখানো হচ্ছে: <strong className="text-slate-700">{filteredWithdrawals.length}</strong> টি রেকর্ড
          </span>
          {(selectedPartnerFilter !== 'ALL' || selectedMethodFilter !== 'ALL' || searchTerm) && (
            <button
              onClick={() => {
                setSelectedPartnerFilter('ALL');
                setSelectedMethodFilter('ALL');
                setSearchTerm('');
              }}
              className="text-[11px] text-purple-600 hover:text-purple-800 font-semibold underline"
            >
              রিসেট
            </button>
          )}
        </div>
      </div>

      {/* 5. Main Withdrawals Table with Bank-Statement Style Columns */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-800 text-sm">
              উত্তোলন লেজার তালিকা (Withdrawal Running Ledger)
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-semibold">
              ব্যাংক স্টেটমেন্ট স্টাইল
            </span>
          </div>

          <button
            onClick={() => setStatementModalState({ isOpen: true, partnerId: selectedPartnerFilter })}
            className="text-xs font-semibold text-purple-700 hover:text-purple-800 flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5" />
            পূর্ণাঙ্গ প্রিন্ট স্টেটমেন্ট দেখুন
          </button>
        </div>

        <div className="overflow-x-auto">
          <div className="p-4 pb-0"><DataExportToolbar filename="OwnerWithdrawalView_Export" /></div>
<table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-28">তারিখ</th>
                <th className="py-3 px-4 w-28">ভাউচার নং</th>
                <th className="py-3 px-4">স্বত্বাধিকারী / পার্টনার</th>
                <th className="py-3 px-4">উত্তোলনের খাত ও বিবরণ</th>
                <th className="py-3 px-4">মাধ্যম</th>
                <th className="py-3 px-4 text-right">উত্তোলিত টাকা (৳)</th>
                <th className="py-3 px-4 text-right font-bold text-slate-900 bg-slate-50/80">রানিং ব্যালেন্স (৳)</th>
                <th className="py-3 px-4 text-center w-24">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    <div className="max-w-sm mx-auto space-y-2">
                      <p className="font-medium text-slate-500">কোনো উত্তোলন রেকর্ড পাওয়া যায়নি।</p>
                      <button
                        onClick={() => handleOpenAddModal()}
                        className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold shadow-2xs hover:bg-purple-700 transition-colors"
                      >
                        নতুন উত্তোলন রেকর্ড করুন
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredWithdrawals.map(w => (
                  <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {formatDate(w.date)}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700 whitespace-nowrap">
                      {w.voucherNo || `WTH-${w.id.slice(-4)}`}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{w.ownerName}</span>
                      {w.ownerId && (
                        <span className="text-[10px] text-slate-400 font-mono">ID: {w.ownerId}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div className="font-medium">{w.purpose || w.reason || 'ব্যক্তিগত উত্তোলন'}</div>
                      {w.notes && (
                        <div className="text-[11px] text-slate-400 mt-0.5">{w.notes}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        (w.paymentMethod || w.paidVia) === 'BANK'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {(w.paymentMethod || w.paidVia) === 'BANK' ? 'ব্যাংক' : 'ক্যাশ'}
                      </span>
                      {w.bankAccountName && (
                        <span className="text-[10px] text-slate-500 block truncate max-w-[140px]" title={w.bankAccountName}>
                          {w.bankAccountName}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-purple-700 text-sm">
                      {formatCurrency(w.amount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 bg-slate-50/50">
                      {formatCurrency(w.runningTotal)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setStatementModalState({ isOpen: true, partnerId: w.ownerId || 'ALL' })}
                          className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="স্টেটমেন্ট দেখুন"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`আপনি কি নিশ্চিত যে ${w.ownerName}-এর ৳${w.amount} উত্তোলনের এই রেকর্ডটি বাতিল করবেন?`)) {
                              deleteOwnerWithdrawal(w.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="রেকর্ড মুছুন"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* 6. Add Withdrawal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">নতুন মালিকের উত্তোলন রেকর্ড</h3>
                  <p className="text-[11px] text-slate-500">মূলধন/ইকুইটি হিসাব থেকে ফান্ড ড্রয়িংস এন্ট্রি</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWithdrawal} className="space-y-3 text-xs">
              {/* Date */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">তারিখ *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:bg-white focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {/* Owner / Partner Selection Dropdown */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">স্বত্বাধিকারী / অংশীদার নির্বাচন *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setShowPartnersModal(true);
                      setShowNewPartnerForm(true);
                    }}
                    className="text-[11px] text-purple-600 font-semibold hover:underline"
                  >
                    + নতুন পার্টনার যোগ
                  </button>
                </div>
                <select
                  value={selectedOwnerId}
                  onChange={e => setSelectedOwnerId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-1 focus:ring-purple-500"
                >
                  {partners.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.designation} {p.sharePercentage ? `(${p.sharePercentage}%)` : ''}
                    </option>
                  ))}
                  <option value="CUSTOM">+ অন্যান্য / কাস্টম নাম টাইপ করুন</option>
                </select>
              </div>

              {selectedOwnerId === 'CUSTOM' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">স্বত্বাধিকারীর পূর্ণ নাম *</label>
                  <input
                    type="text"
                    required
                    value={customOwnerName}
                    onChange={e => setCustomOwnerName(e.target.value)}
                    placeholder="মালিকের নাম লিখুন"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">টাকার পরিমাণ (BDT ৳) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">৳</span>
                  <input
                    type="number"
                    required
                    min="1"
                    value={amount}
                    onChange={e => setAmount(e.target.value ? parseFloat(e.target.value) : '')}
                    placeholder="০.০০"
                    className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-base font-bold text-purple-700 focus:bg-white focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2 pt-1">
                <label className="block font-semibold text-slate-700">উত্তোলনের মাধ্যম ও তহবিল উৎস *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('BANK')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border font-bold transition-all ${
                      paymentMethod === 'BANK'
                        ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-2xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Landmark className="w-4 h-4" />
                    ব্যাংক একাউন্ট
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border font-bold transition-all ${
                      paymentMethod === 'CASH'
                        ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-2xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                    ক্যাশ ড্রয়ার (Cash)
                  </button>
                </div>
              </div>

              {/* Bank Account Selection if BANK */}
              {paymentMethod === 'BANK' ? (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ব্যাংক একাউন্ট নির্বাচন *</label>
                  <select
                    value={selectedBankId}
                    onChange={e => setSelectedBankId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white"
                  >
                    {bankAccounts.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.bankName} - {b.accountName} (ব্যালেন্স: {formatCurrency(b.balance)})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-600 flex justify-between items-center text-[11px]">
                  <span>ক্যাশ ইন হ্যান্ড ব্যালেন্স:</span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(settings.cashInHandBalance)}</span>
                </div>
              )}

              {/* Fund Availability Warning */}
              {typeof amount === 'number' && amount > currentAvailableFunds && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>
                    সতর্কতা: বর্তমান উপলভ্য তহবিলের ({formatCurrency(currentAvailableFunds)}) চেয়ে উত্তোলনের পরিমাণ বেশি।
                  </span>
                </div>
              )}

              {/* Purpose / Suggestions */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">উত্তোলনের খাত বা উদ্দেশ্য *</label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {purposeSuggestions.map(sug => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setPurpose(sug)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors ${
                        purpose === sug
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                  placeholder="যেমন: ব্যক্তিগত জরুরি পারিবারিক প্রয়োজন"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">অতিরিক্ত নোট বা রেফারেন্স (ঐচ্ছিক)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="যেমন: চেক নং #104928"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-xs transition-colors"
                >
                  উত্তোলন সম্পন্ন করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Partners Management Modal */}
      {showPartnersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">স্বত্বাধিকারী ও অংশীদার ব্যবস্থাপনা</h3>
                  <p className="text-[11px] text-slate-500">পার্টনার প্রোফাইল, প্রারম্ভিক মূলধন ও শেয়ার পার্সেন্টেজ</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPartnersModal(false);
                  setShowNewPartnerForm(false);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of Partners */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">বর্তমান অংশীদারগণ ({partners.length})</span>
                {!showNewPartnerForm && (
                  <button
                    type="button"
                    onClick={() => setShowNewPartnerForm(true)}
                    className="flex items-center gap-1 text-purple-600 font-bold hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    নতুন পার্টনার যুক্ত করুন
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {partners.map(p => {
                  const pWithdrawals = ownerWithdrawals.filter(w => w.ownerId === p.id || w.ownerName.toLowerCase().includes(p.name.toLowerCase()));
                  const totalD = pWithdrawals.reduce((s, w) => s + w.amount, 0);

                  return (
                    <div key={p.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-slate-50/70">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{p.name}</span>
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px] font-semibold border border-purple-200">
                            {p.designation}
                          </span>
                          {p.sharePercentage ? (
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold">
                              {p.sharePercentage}% শেয়ার
                            </span>
                          ) : null}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap gap-x-3">
                          {p.phone && <span>ফোন: {p.phone}</span>}
                          {p.email && <span>ইমেইল: {p.email}</span>}
                          {p.initialCapital ? <span>প্রারম্ভিক মূলধন: {formatCurrency(p.initialCapital)}</span> : null}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block uppercase tracking-wider">মোট উত্তোলন</span>
                          <span className="font-mono font-bold text-purple-700">{formatCurrency(totalD)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowPartnersModal(false);
                            setStatementModalState({ isOpen: true, partnerId: p.id });
                          }}
                          className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold rounded-lg text-xs transition-colors"
                        >
                          স্টেটমেন্ট
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add New Partner Form */}
              {showNewPartnerForm && (
                <form onSubmit={handleCreatePartner} className="p-4 bg-purple-50/50 rounded-2xl border border-purple-200 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-purple-950 text-xs">নতুন অংশীদার / স্বত্বাধিকারী তথ্য ফরম</h4>
                    <button
                      type="button"
                      onClick={() => setShowNewPartnerForm(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">অংশীদারের নাম *</label>
                      <input
                        type="text"
                        required
                        value={newPartnerName}
                        onChange={e => setNewPartnerName(e.target.value)}
                        placeholder="যেমন: ইঞ্জি: মো: হাসান মাহমুদ"
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">পদবী / ভূমিকা</label>
                      <input
                        type="text"
                        value={newPartnerDesignation}
                        onChange={e => setNewPartnerDesignation(e.target.value)}
                        placeholder="যেমন: ব্যবস্থাপনা অংশীদার / ডিরেক্টর"
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">শেয়ারের অনুপাত (%)</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={newPartnerShare}
                        onChange={e => setNewPartnerShare(e.target.value ? parseFloat(e.target.value) : '')}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">প্রারম্ভিক মূলধন (৳)</label>
                      <input
                        type="number"
                        min="0"
                        value={newPartnerCapital}
                        onChange={e => setNewPartnerCapital(e.target.value ? parseFloat(e.target.value) : '')}
                        placeholder="যেমন: ৫০০০০০০"
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">মোবাইল নম্বর (হোয়াটসঅ্যাপ)</label>
                      <input
                        type="text"
                        value={newPartnerPhone}
                        onChange={e => setNewPartnerPhone(e.target.value)}
                        placeholder="01712345678"
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">ইমেইল ঠিকানা</label>
                      <input
                        type="email"
                        value={newPartnerEmail}
                        onChange={e => setNewPartnerEmail(e.target.value)}
                        placeholder="partner@example.com"
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowNewPartnerForm(false)}
                      className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs shadow-2xs"
                    >
                      পার্টনার সংরক্ষণ করুন
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 8. Full Bank-Statement Modal */}
      <OwnerStatementModal
        isOpen={statementModalState.isOpen}
        onClose={() => setStatementModalState(prev => ({ ...prev, isOpen: false }))}
        initialPartnerId={statementModalState.partnerId}
        partners={partners}
        withdrawals={ownerWithdrawals}
        companySettings={settings}
        bankAccounts={bankAccounts}
      />
    </div>
  );
};
