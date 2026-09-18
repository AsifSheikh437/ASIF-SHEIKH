import React, { useState } from 'react';
import { DataExportToolbar } from '../common/DataExportToolbar';
import { useERP } from '../../context/ERPContext';
import { Customer, Supplier, CustomerLedgerEntry, SupplierLedgerEntry } from '../../types';
import { formatCurrency, formatDate, exportToCSV, cleanWhatsAppPhone } from '../../utils/formatters';
import { StatementOfAccountModal } from '../common/StatementOfAccountModal';
import { addEventToGoogleCalendar } from '../../services/googleCalendarService';
import {
  Users,
  Building,
  ArrowDownRight,
  ArrowUpRight,
  Search,
  Download,
  Printer,
  CreditCard,
  Plus,
  X,
  FileText,
  DollarSign,
  AlertCircle,
  ArrowLeft,
  MessageSquare,
  Mail,
  Send,
  Building2,
  Calendar,
  Phone,
  MapPin,
  CheckCircle2,
  RotateCcw,
  Bell,
  Copy,
  ExternalLink,
  Clock,
  Share2,
} from 'lucide-react';

export const LedgersView: React.FC = () => {
  const {
    customers,
    suppliers,
    customerLedgers,
    supplierLedgers,
    collectCustomerPayment,
    paySupplier,
    bankAccounts,
    totalReceivableDues,
    totalPayableDues,
    settings,
    addSystemTask,
  } = useERP();

  const [activeTab, setActiveTab] = useState<'CUSTOMERS' | 'SUPPLIERS'>('CUSTOMERS');
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyWithDue, setOnlyWithDue] = useState(false);

  const handleSoftReset = () => {
    setSearchTerm('');
    setOnlyWithDue(false);
    setActiveTab('CUSTOMERS');
  };

  // WhatsApp Share Dialog State for Ledgers
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [waPhoneNumber, setWaPhoneNumber] = useState('');
  const [waTargetType, setWaTargetType] = useState<'CUSTOMER' | 'SUPPLIER'>('CUSTOMER');
  const [waTargetData, setWaTargetData] = useState<{
    name: string;
    code: string;
    phone: string;
    totalDue: number;
    address?: string;
  } | null>(null);

  // Customer Payment Collection Modal
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [selectedCust, setSelectedCust] = useState<Customer | null>(null);
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [collectMethod, setCollectMethod] = useState<'CASH' | 'BANK'>('CASH');
  const [collectBankId, setCollectBankId] = useState<string>(bankAccounts[0]?.id || '');
  const [collectNotes, setCollectNotes] = useState('');

  // Calendar & Due Reminder State
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState<any>(null);
  const [calendarDate, setCalendarDate] = useState('');
  const [calendarTime, setCalendarTime] = useState('10:00');
  const [calendarNotes, setCalendarNotes] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [reminderSuccessMsg, setReminderSuccessMsg] = useState<string | null>(null);
  const [copiedSMS, setCopiedSMS] = useState(false);

  const openReminderModal = (type: 'CUSTOMER' | 'SUPPLIER', party: any) => {
    setCalendarTarget({ type, data: party });
    const today = new Date().toISOString().split('T')[0];
    setCalendarDate(today);
    setCalendarTime('10:00');
    setCalendarNotes(
      type === 'CUSTOMER'
        ? 'বকেয়া পাওনা পরিশোধ সংক্রান্ত তাগাদা'
        : 'বকেয়া বিল পরিশোধ ফলো-আপ'
    );
    setReminderSuccessMsg(null);
    setCopiedSMS(false);
    setShowCalendarModal(true);
  };

  // Supplier Payment Modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedSup, setSelectedSup] = useState<Supplier | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'CASH' | 'BANK'>('BANK');
  const [payBankId, setPayBankId] = useState<string>(bankAccounts[0]?.id || '');
  const [payNotes, setPayNotes] = useState('');

  // Statement modal
  const [viewCustomerStatement, setViewCustomerStatement] = useState<Customer | null>(null);
  const [viewSupplierStatement, setViewSupplierStatement] = useState<Supplier | null>(null);

  // Filtered lists
  const filteredCustomers = customers.filter(c => {
    const match = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm);
    const matchDue = onlyWithDue ? c.currentDue > 0 : true;
    return match && matchDue;
  });

  const filteredSuppliers = suppliers.filter(s => {
    const match = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone.includes(searchTerm);
    const matchDue = onlyWithDue ? s.currentPayable > 0 : true;
    return match && matchDue;
  });

  // Handle submit collection
  const handleSubmitCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCust || collectAmount <= 0) return;

    collectCustomerPayment(
      selectedCust.id,
      collectAmount,
      collectMethod,
      collectNotes || 'নিয়মিত বকেয়া আদায়',
      collectMethod === 'BANK' ? collectBankId : undefined
    );
    setShowCollectModal(false);
    setSelectedCust(null);
    setCollectAmount(0);
  };

  // Handle submit pay supplier
  const handleSubmitSupplierPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSup || payAmount <= 0) return;

    paySupplier(
      selectedSup.id,
      payAmount,
      payMethod,
      payNotes || 'সাপ্লায়ার বিল পরিশোধ',
      payMethod === 'BANK' ? payBankId : undefined
    );
    setShowPayModal(false);
    setSelectedSup(null);
    setPayAmount(0);
  };

  // Open WhatsApp modal for Customer Statement
  const handleOpenCustomerWhatsApp = (customer: Customer) => {
    setWaTargetType('CUSTOMER');
    setWaTargetData({
      name: customer.name,
      code: customer.code,
      phone: customer.phone,
      totalDue: customer.currentDue,
      address: customer.address,
    });
    setWaPhoneNumber(customer.phone || '');
    setShowWhatsAppModal(true);
  };

  // Open WhatsApp modal for Supplier Statement
  const handleOpenSupplierWhatsApp = (supplier: Supplier) => {
    setWaTargetType('SUPPLIER');
    setWaTargetData({
      name: `${supplier.name} (${supplier.companyName})`,
      code: supplier.code,
      phone: supplier.phone,
      totalDue: supplier.currentPayable,
      address: supplier.address,
    });
    setWaPhoneNumber(supplier.phone || '');
    setShowWhatsAppModal(true);
  };

  const getWhatsAppStatementText = (data: {
    name: string;
    code: string;
    phone: string;
    totalDue: number;
    isCustomer: boolean;
  }) => {
    const today = new Date().toLocaleDateString('bn-BD');
    return (
      `🏢 *${settings.companyName || 'ফুড ম্যানুফ্যাকচারিং অ্যান্ড ডিস্ট্রিবিউশন'}*\n` +
      `📑 *লেজার স্টেটমেন্ট ও হিসাব বিবরণী*\n` +
      `------------------------------------\n` +
      `👤 *${data.isCustomer ? 'গ্রাহক / কাস্টমার' : 'সরবরাহকারী / ভেন্ডর'}:* ${data.name}\n` +
      `🆔 *হিসাব কোড:* ${data.code}\n` +
      `📞 *ফোন নম্বর:* ${data.phone || 'N/A'}\n` +
      `📅 *বিবরণী তারিখ:* ${today}\n` +
      `------------------------------------\n` +
      `💰 *${data.isCustomer ? 'সর্বমোট অবশিষ্ট বকেয়া (Current Due)' : 'বর্তমান মোট দেনা (Current Payable)'}:* ৳${data.totalDue.toLocaleString()}\n` +
      `------------------------------------\n` +
      `অনুগ্রহ করে আপনার হিসাব ও ভাউচারের সাথে মিলিয়ে আপডেট করুন।\n` +
      `📞 যোগাযোগ: ${settings.phone || '01700-000000'} | 📍 ${settings.address || 'ঢাকা, বাংলাদেশ'}\n` +
      `আন্তরিক ধন্যবাদ!`
    );
  };

  const executeSendWhatsApp = () => {
    if (!waTargetData) return;
    let cleanPhone = waPhoneNumber.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('01')) {
      cleanPhone = '880' + cleanPhone.substring(1);
    } else if (cleanPhone.length === 10 && cleanPhone.startsWith('1')) {
      cleanPhone = '880' + cleanPhone;
    }

    const msg = getWhatsAppStatementText({
      name: waTargetData.name,
      code: waTargetData.code,
      phone: waTargetData.phone,
      totalDue: waTargetData.totalDue,
      isCustomer: waTargetType === 'CUSTOMER',
    });
    const encoded = encodeURIComponent(msg);
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;

    window.open(url, '_blank');
    setShowWhatsAppModal(false);
  };

  const handleExportCSV = () => {
    if (activeTab === 'CUSTOMERS') {
      const headers = ['Code', 'Customer Name', 'Phone', 'Address', 'Opening Due', 'Current Due'];
      const rows = filteredCustomers.map(c => [c.code, c.name, c.phone, c.address, c.openingBalance, c.currentDue]);
      exportToCSV(`Customer_Ledgers_${new Date().toISOString().substring(0, 10)}`, headers, rows);
    } else {
      const headers = ['Code', 'Supplier Name', 'Company', 'Phone', 'Current Payable'];
      const rows = filteredSuppliers.map(s => [s.code, s.name, s.companyName, s.phone, s.currentPayable]);
      exportToCSV(`Supplier_Ledgers_${new Date().toISOString().substring(0, 10)}`, headers, rows);
    }
  };

  const handleExportIndividualLedger = (party: Customer | Supplier, isCustomer: boolean) => {
    const transactions = isCustomer ? customerLedgers : supplierLedgers;
    const allForParty = transactions.filter(t => {
      if (isCustomer) {
        return t.customerId === party.id || t.accountId === party.id;
      } else {
        return t.supplierId === party.id || t.accountId === party.id;
      }
    });

    allForParty.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBal = party.openingBalance || 0;

    const headers = [
      'Sl No',
      'Date',
      'Voucher / Bill No',
      'Description',
      'Type',
      'Debit (BDT)',
      'Credit (BDT)',
      'Running Balance (BDT)'
    ];

    const rows: (string | number)[][] = [
      ['0', '-', '-', 'Opening Balance / প্রারম্ভিক জের', 'OPENING', 0, 0, runningBal]
    ];

    allForParty.forEach((tx, idx) => {
      const debit = tx.debit || 0;
      const credit = tx.credit || 0;

      if (isCustomer) {
        runningBal += debit - credit;
      } else {
        runningBal += credit - debit;
      }

      rows.push([
        (idx + 1).toString(),
        formatDate(tx.date),
        tx.voucherNo || '-',
        tx.description,
        tx.accountType || '-',
        debit,
        credit,
        runningBal
      ]);
    });

    const partyCode = party.code || party.id;
    const typeLabel = isCustomer ? 'Customer' : 'Supplier';
    exportToCSV(`${typeLabel}_Ledger_${partyCode}_${new Date().toISOString().substring(0, 10)}`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              মোট কাস্টমার বকেয়া পাওনা
            </span>
            <div className="text-2xl font-black text-rose-600 mt-1 font-sans">
              {formatCurrency(totalReceivableDues)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">{customers.length} টি নিবন্ধিত কাস্টমার</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ArrowDownRight className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              মোট সাপ্লায়ার দেনা (Payables)
            </span>
            <div className="text-2xl font-black text-amber-600 mt-1 font-sans">
              {formatCurrency(totalPayableDues)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">{suppliers.length} টি ভেন্ডর / সাপ্লায়ার</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-teal-800 to-slate-900 text-white p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-teal-300 uppercase tracking-wider">
              লেজার অটোমেশন
            </span>
            <p className="text-xs text-slate-300 mt-1">
              ইনভয়েস তৈরি বা পেমেন্ট এন্ট্রি করার সাথে সাথে ব্যালেন্স শিট রিয়েল-টাইম সমন্বয় হয়
            </p>
          </div>
          <div className="flex justify-end mt-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl"
            >
              <Download className="w-3.5 h-3.5" />
              CSV ডাউনলোড
            </button>
          </div>
        </div>
      </div>

      {/* Tabs & Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tab buttons */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('CUSTOMERS')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'CUSTOMERS'
                  ? 'bg-white text-teal-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              কাস্টমার লেজার (Customer Accounts)
            </button>
            <button
              onClick={() => setActiveTab('SUPPLIERS')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'SUPPLIERS'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building className="w-4 h-4" />
              সাপ্লায়ার লেজার (Supplier Accounts)
            </button>
          </div>

          {/* Search and Checkbox */}
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
                checked={onlyWithDue}
                onChange={e => setOnlyWithDue(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="font-semibold">শুধুমাত্র বকেয়া</span>
            </label>

            <button
              id="btn-ledgers-soft-reset"
              onClick={handleSoftReset}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              title="সার্চ ও ফিল্টার ডিফল্ট অবস্থায় ফিরিয়ে নিন (Soft Reset)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>রিসেট</span>
            </button>
          </div>
        </div>

        {/* CUSTOMERS TABLE */}
        {activeTab === 'CUSTOMERS' && (
          <div className="overflow-x-auto">
            <div className="p-4 pb-0"><DataExportToolbar filename="LedgersView_Export" /></div>
<table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">কোড</th>
                  <th className="py-2.5 px-3">কাস্টমারের নাম</th>
                  <th className="py-2.5 px-3">ফোন নম্বর</th>
                  <th className="py-2.5 px-3">ঠিকানা</th>
                  <th className="py-2.5 px-3 text-right">বর্তমান বকেয়া পাওনা</th>
                  <th className="py-2.5 px-3 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      কোনো কাস্টমার পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map(cust => (
                    <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-teal-700">{cust.code}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{cust.name}</td>
                      <td className="py-3 px-3 font-mono text-slate-600">{cust.phone}</td>
                      <td className="py-3 px-3 text-slate-500 max-w-[150px] truncate">{cust.address}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        {cust.currentDue > 0 ? (
                          <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded text-xs">
                            {formatCurrency(cust.currentDue)}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-normal">পরিশোধিত (০)</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Direct WhatsApp Action */}
                          <button
                            onClick={() => {
                              const cleanPhone = cleanWhatsAppPhone(cust.phone);
                              const msg = `আসসালামু আলাইকুম, প্রিয় ${cust.name},\n${settings.companyNameBangla} থেকে আপনার বর্তমান সর্বমোট বকেয়া ৳${cust.currentDue.toLocaleString('en-IN')}। বিস্তারিত স্টেটমেন্টের জন্য যোগাযোগ করুন। ধন্যবাদ!`;
                              const url = cleanPhone
                                ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
                                : `https://wa.me/?text=${encodeURIComponent(msg)}`;
                              window.open(url, '_blank');
                            }}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] transition-colors"
                            title={`WhatsApp চ্যাট (${cust.phone})`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          {/* Direct Email Action */}
                          {(() => {
                            const email = cust.email || '';
                            const subject = `Statement of Account - ${cust.name} (${cust.code})`;
                            const body = `বরাবর,\n${cust.name}\n\nআপনার বর্তমান সর্বমোট বকেয়া: ৳${cust.currentDue.toLocaleString('en-IN')}\n\nধন্যবাদান্তে,\n${settings.companyNameBangla}`;
                            const mailtoUrl = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                            return (
                              <a
                                href={mailtoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] transition-colors inline-flex items-center justify-center"
                                title={`ইমেইল পাঠান (${cust.email || 'ইমেইল ক্লায়েন্ট খুলুন'})`}
                              >
                                <Mail className="w-3.5 h-3.5" />
                              </a>
                            );
                          })()}

                          <button
                            onClick={() => {
                              setSelectedCust(cust);
                              setCollectAmount(cust.currentDue);
                              setShowCollectModal(true);
                            }}
                            className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold rounded-lg text-[11px] transition-colors flex items-center gap-1"
                          >
                            <DollarSign className="w-3 h-3" />
                            আদায়
                          </button>
                          <button
                            onClick={() => openReminderModal('CUSTOMER', cust)}
                            className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-lg text-[11px] transition-colors flex items-center gap-1"
                            title="বকেয়া তাগাদা ও রিমাইন্ডার"
                          >
                            <Bell className="w-3 h-3 text-purple-600" />
                            রিমাইন্ডার
                          </button>
                          <button
                            onClick={() => setViewCustomerStatement(cust)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-[11px] transition-colors flex items-center gap-1 shadow-2xs"
                            title="ব্র্যান্ডেড স্টেটমেন্ট অফ অ্যাকাউন্ট দেখুন"
                          >
                            <FileText className="w-3 h-3" />
                            বিবরণী
                          </button>
                          <button
                            onClick={() => handleExportIndividualLedger(cust, true)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] transition-colors flex items-center justify-center"
                            title="CSV লেজার ডাউনলোড"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* SUPPLIERS TABLE */}
        {activeTab === 'SUPPLIERS' && (
          <div className="overflow-x-auto">
            <div className="p-4 pb-0"><DataExportToolbar filename="LedgersView_Export" /></div>
<table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">কোড</th>
                  <th className="py-2.5 px-3">সাপ্লায়ারের নাম</th>
                  <th className="py-2.5 px-3">কোম্পানি</th>
                  <th className="py-2.5 px-3">ফোন নম্বর</th>
                  <th className="py-2.5 px-3 text-right">বর্তমান বাকি দেনা</th>
                  <th className="py-2.5 px-3 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      কোনো সাপ্লায়ার পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map(sup => (
                    <tr key={sup.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-blue-700">{sup.code}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{sup.name}</td>
                      <td className="py-3 px-3 text-slate-600">{sup.companyName}</td>
                      <td className="py-3 px-3 font-mono text-slate-600">{sup.phone}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        {sup.currentPayable > 0 ? (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs">
                            {formatCurrency(sup.currentPayable)}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-normal">০ (পরিশোধিত)</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Direct WhatsApp Action */}
                          <button
                            onClick={() => {
                              const cleanPhone = cleanWhatsAppPhone(sup.phone);
                              const msg = `আসসালামু আলাইকুম, প্রিয় ${sup.name} (${sup.companyName || ''}),\n${settings.companyNameBangla} থেকে আপনার মোট পাওনা বিল ৳${sup.currentPayable.toLocaleString('en-IN')}। বিস্তারিত স্টেটমেন্ট ও চালানের জন্য যোগাযোগ করুন।`;
                              const url = cleanPhone
                                ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
                                : `https://wa.me/?text=${encodeURIComponent(msg)}`;
                              window.open(url, '_blank');
                            }}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] transition-colors"
                            title={`WhatsApp চ্যাট (${sup.phone})`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          {/* Direct Email Action */}
                          {(() => {
                            const email = sup.email || '';
                            const subject = `Statement of Account - ${sup.name} (${sup.code})`;
                            const body = `বরাবর,\n${sup.name} (${sup.companyName || ''})\n\nবর্তমান মোট পাওনা বিল: ৳${sup.currentPayable.toLocaleString('en-IN')}\n\nধন্যবাদান্তে,\n${settings.companyNameBangla}`;
                            const mailtoUrl = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                            return (
                              <a
                                href={mailtoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] transition-colors inline-flex items-center justify-center"
                                title={`ইমেইল পাঠান (${sup.email || 'ইমেইল ক্লায়েন্ট খুলুন'})`}
                              >
                                <Mail className="w-3.5 h-3.5" />
                              </a>
                            );
                          })()}

                          <button
                            onClick={() => {
                              setSelectedSup(sup);
                              setPayAmount(sup.currentPayable);
                              setShowPayModal(true);
                            }}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-[11px] transition-colors flex items-center gap-1"
                          >
                            <CreditCard className="w-3 h-3" />
                            পরিশোধ
                          </button>
                          <button
                            onClick={() => openReminderModal('SUPPLIER', sup)}
                            className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-lg text-[11px] transition-colors flex items-center gap-1"
                            title="বকেয়া বিল ফলো-আপ ও রিমাইন্ডার"
                          >
                            <Bell className="w-3 h-3 text-purple-600" />
                            রিমাইন্ডার
                          </button>
                          <button
                            onClick={() => setViewSupplierStatement(sup)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-[11px] transition-colors flex items-center gap-1 shadow-2xs"
                            title="ব্র্যান্ডেড স্টেটমেন্ট অফ অ্যাকাউন্ট দেখুন"
                          >
                            <FileText className="w-3 h-3" />
                            বিবরণী
                          </button>
                          <button
                            onClick={() => handleExportIndividualLedger(sup, false)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] transition-colors flex items-center justify-center"
                            title="CSV লেজার ডাউনলোড"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Collect Customer Payment Modal */}
      {showCollectModal && selectedCust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">কাস্টমার বকেয়া টাকা আদায়</h3>
              <button onClick={() => setShowCollectModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">কাস্টমার:</span>
                <span className="font-bold text-slate-800">{selectedCust.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">বর্তমান বকেয়া:</span>
                <span className="font-mono font-bold text-rose-600">{formatCurrency(selectedCust.currentDue)}</span>
              </div>
            </div>

            <form onSubmit={handleSubmitCollection} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">আদায়কৃত টাকার পরিমাণ (৳) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedCust.currentDue}
                  value={collectAmount}
                  onChange={e => setCollectAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-emerald-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">জমার মাধ্যম *</label>
                <select
                  value={collectMethod}
                  onChange={e => setCollectMethod(e.target.value as 'CASH' | 'BANK')}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="CASH">ক্যাশ / পেটি ক্যাশ (Petty Cash)</option>
                  <option value="BANK">ব্যাংক অ্যাকাউন্ট / অনলাইন ট্রান্সফার</option>
                </select>
              </div>

              {collectMethod === 'BANK' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ব্যাংক সিলেক্ট করুন</label>
                  <select
                    value={collectBankId}
                    onChange={e => setCollectBankId(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {bankAccounts.map(b => (
                      <option key={b.id} value={b.id}>{b.accountName} (ব্যালেন্স: {formatCurrency(b.balance)})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">মন্তব্য বা মানি রিসিট নং</label>
                <input
                  type="text"
                  value={collectNotes}
                  onChange={e => setCollectNotes(e.target.value)}
                  placeholder="যেমন: চেক নং বা ক্যাশ রিসিট"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCollectModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 text-white font-bold rounded-xl"
                >
                  আদায় সম্পন্ন করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Supplier Modal */}
      {showPayModal && selectedSup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">সাপ্লায়ার বিল পরিশোধ</h3>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">সাপ্লায়ার:</span>
                <span className="font-bold text-slate-800">{selectedSup.name} ({selectedSup.companyName})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">মোট বাকি দেনা:</span>
                <span className="font-mono font-bold text-amber-600">{formatCurrency(selectedSup.currentPayable)}</span>
              </div>
            </div>

            <form onSubmit={handleSubmitSupplierPayment} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">পরিশোধের পরিমাণ (৳) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedSup.currentPayable}
                  value={payAmount}
                  onChange={e => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-blue-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">পরিশোধের মাধ্যম *</label>
                <select
                  value={payMethod}
                  onChange={e => setPayMethod(e.target.value as 'CASH' | 'BANK')}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="BANK">ব্যাংক অ্যাকাউন্ট / চেক</option>
                  <option value="CASH">নগদ ক্যাশ (Cash)</option>
                </select>
              </div>

              {payMethod === 'BANK' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">যে ব্যাংক থেকে পরিশোধ হবে</label>
                  <select
                    value={payBankId}
                    onChange={e => setPayBankId(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {bankAccounts.map(b => (
                      <option key={b.id} value={b.id}>{b.accountName} (ব্যালেন্স: {formatCurrency(b.balance)})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">চেক নং বা বিবরণ</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={e => setPayNotes(e.target.value)}
                  placeholder="যেমন: চেক #৯৮২১২৩ বা বিমা বিল"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl"
                >
                  পরিশোধ সম্পন্ন করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Branded Customer Statement of Account Modal */}
      {viewCustomerStatement && (
        <StatementOfAccountModal
          isOpen={!!viewCustomerStatement}
          onClose={() => setViewCustomerStatement(null)}
          partyType="CUSTOMER"
          party={viewCustomerStatement}
          transactions={customerLedgers}
          companySettings={settings}
          bankAccounts={bankAccounts}
        />
      )}

      {/* Branded Supplier Statement of Account Modal */}
      {viewSupplierStatement && (
        <StatementOfAccountModal
          isOpen={!!viewSupplierStatement}
          onClose={() => setViewSupplierStatement(null)}
          partyType="SUPPLIER"
          party={viewSupplierStatement}
          transactions={supplierLedgers}
          companySettings={settings}
          bankAccounts={bankAccounts}
        />
      )}

      {/* Due Reminder & Follow-Up Modal */}
      {showCalendarModal && calendarTarget && (() => {
        const isCustomer = calendarTarget.type === 'CUSTOMER';
        const partyName = calendarTarget.data.name || '';
        const phone = calendarTarget.data.phone || '';
        const cleanPhone = cleanWhatsAppPhone(phone);
        const amount = Number(calendarTarget.data.currentDue || calendarTarget.data.currentPayable || 0);
        const companyTitle = settings?.companyNameBangla || settings?.companyName || 'আমাদের প্রতিষ্ঠান';
        const dateFormatted = calendarDate ? formatDate(calendarDate) : 'শীঘ্রই';

        const generatedMessage = isCustomer
          ? `আসসালামু আলাইকুম ${partyName} সাহেব,\n${companyTitle} থেকে আপনার বকেয়া পাওনা ${formatCurrency(amount)} পরিশোধের বিষয়ে স্মরণ করিয়ে দেওয়া হচ্ছে।\nসম্ভাব্য পরিশোধের তারিখ: ${dateFormatted} (${calendarTime})।${calendarNotes ? `\nবিবরণ: ${calendarNotes}` : ''}\nঅনুগ্রহ করে নির্ধারিত সময়ে পরিশোধের ব্যবস্থা করবেন।\nধন্যবাদ,\n${companyTitle}`
          : `আসসালামু আলাইকুম ${partyName},\n${companyTitle} থেকে আপনার বকেয়া বিল ${formatCurrency(amount)} পরিশোধ সংক্রান্ত ফলো-আপ রিমাইন্ডার।\nপরিশোধের পরিকল্পিত তারিখ: ${dateFormatted} (${calendarTime})।${calendarNotes ? `\nবিবরণ: ${calendarNotes}` : ''}\nধন্যবাদ,\n${companyTitle}`;

        const summaryText = isCustomer
          ? `পাওনা আদায় তাগাদা: ${partyName} (${formatCurrency(amount)})`
          : `বকেয়া বিল পরিশোধ: ${partyName} (${formatCurrency(amount)})`;

        const handleSaveSystemTask = () => {
          if (!calendarDate) {
            alert('অনুগ্রহ করে তারিখ নির্বাচন করুন');
            return;
          }
          addSystemTask({
            title: summaryText,
            dueDate: `${calendarDate} ${calendarTime}`,
            status: 'PENDING',
            type: 'FOLLOW_UP',
            relatedId: calendarTarget.data.id || calendarTarget.data.code,
          });
          setReminderSuccessMsg('সিস্টেম রিমাইন্ডার হিসেবে সফলভাবে সংরক্ষিত হয়েছে! এটি ড্যাশবোর্ড ও নেভবারে দেখা যাবে।');
          setTimeout(() => setReminderSuccessMsg(null), 4000);
        };

        const handleSendWhatsApp = () => {
          if (!cleanPhone) {
            alert('গ্রাহক বা সরবরাহকারীর ফোন নম্বর পাওয়া যায়নি। অনুগ্রহ করে মোবাইল নম্বর যোগ করুন।');
            return;
          }
          addSystemTask({
            title: `[WhatsApp তাগাদা] ${summaryText}`,
            dueDate: `${calendarDate} ${calendarTime}`,
            status: 'PENDING',
            type: 'FOLLOW_UP',
            relatedId: calendarTarget.data.id || calendarTarget.data.code,
          });
          const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(generatedMessage)}`;
          window.open(waUrl, '_blank', 'noopener,noreferrer');
          setReminderSuccessMsg('হোয়াটসঅ্যাপ ওপেন হয়েছে এবং সিস্টেমে রিমাইন্ডার টাস্ক হিসেবে যুক্ত হয়েছে!');
          setTimeout(() => setReminderSuccessMsg(null), 4000);
        };

        const handleCopyText = async () => {
          try {
            if (navigator?.clipboard?.writeText) {
              await navigator.clipboard.writeText(generatedMessage);
            } else {
              throw new Error('Fallback');
            }
          } catch {
            const el = document.createElement('textarea');
            el.value = generatedMessage;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
          }
          setCopiedSMS(true);
          setTimeout(() => setCopiedSMS(false), 2500);
        };

        const handleGoogleCalendarSync = async () => {
          if (!calendarDate) {
            alert('অনুগ্রহ করে তারিখ নির্বাচন করুন');
            return;
          }
          setIsScheduling(true);

          // 1. Direct Web Google Calendar Event URL (Works 100% in all browsers without authentication)
          try {
            const dateClean = calendarDate.replace(/-/g, '');
            const timeClean = (calendarTime || '10:00').replace(':', '') + '00';
            const [h, m] = (calendarTime || '10:00').split(':').map(Number);
            const endH = String(((h || 10) + 1) % 24).padStart(2, '0');
            const endTimeClean = `${endH}${String(m || 0).padStart(2, '0')}00`;
            const datesParam = `${dateClean}T${timeClean}/${dateClean}T${endTimeClean}`;
            const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(summaryText)}&dates=${datesParam}&details=${encodeURIComponent(generatedMessage)}`;
            window.open(gCalUrl, '_blank', 'noopener,noreferrer');
          } catch (e) {
            console.error('Google Calendar URL error:', e);
          }

          // 2. Try Google Workspace API sync in background if logged in
          try {
            const startDateTime = `${calendarDate}T${calendarTime}:00+06:00`;
            const endDateObj = new Date(new Date(startDateTime).getTime() + 60 * 60 * 1000);
            await addEventToGoogleCalendar(
              summaryText,
              generatedMessage,
              new Date(startDateTime).toISOString(),
              endDateObj.toISOString()
            );
          } catch (apiErr: any) {
            console.log('Google Workspace Calendar API sync note:', apiErr?.message);
          }

          // 3. Save to System Tasks
          addSystemTask({
            title: summaryText,
            dueDate: `${calendarDate} ${calendarTime}`,
            status: 'PENDING',
            type: 'FOLLOW_UP',
            relatedId: calendarTarget.data.id || calendarTarget.data.code,
          });

          setReminderSuccessMsg('গুগল ক্যালেন্ডার উইন্ডো খোলা হয়েছে এবং সিস্টেমে রিমাইন্ডার সেভ হয়েছে!');
          setIsScheduling(false);
          setTimeout(() => setReminderSuccessMsg(null), 4000);
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-50/50 to-indigo-50/50 dark:from-slate-800/50 dark:to-slate-800/30">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-purple-600 text-white rounded-xl shadow-xs">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      {isCustomer ? 'গ্রাহক বকেয়া তাগাদা ও রিমাইন্ডার' : 'সরবরাহকারী বিল ফলো-আপ ও রিমাইন্ডার'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      সিস্টেম টাস্ক, হোয়াটসঅ্যাপ ও গুগল ক্যালেন্ডারে তাগাদা
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCalendarModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                {/* Target Profile Card */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        isCustomer ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                      }`}>
                        {isCustomer ? 'গ্রাহক' : 'সরবরাহকারী'}
                      </span>
                      <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                        {partyName}
                      </span>
                    </div>
                    {phone && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {phone}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      {isCustomer ? 'মোট পাওনা (Due)' : 'মোট বকেয়া বিল'}
                    </span>
                    <span className="text-base font-extrabold text-rose-600 dark:text-rose-400">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                </div>

                {/* Success Notification Alert */}
                {reminderSuccessMsg && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{reminderSuccessMsg}</span>
                  </div>
                )}

                {/* Date & Time Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-purple-600" />
                      রিমাইন্ডার তারিখ
                    </label>
                    <input
                      type="date"
                      required
                      value={calendarDate}
                      onChange={e => setCalendarDate(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-purple-600" />
                      সময়
                    </label>
                    <input
                      type="time"
                      required
                      value={calendarTime}
                      onChange={e => setCalendarTime(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    নোট / তাগাদার বিবরণ
                  </label>
                  <input
                    type="text"
                    value={calendarNotes}
                    onChange={e => setCalendarNotes(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="যেমন: ৩য় কিস্তির পাওনা আদায় বা চেক হস্তান্তর..."
                  />
                </div>

                {/* Message Preview */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                      বার্তা প্রিভিউ (SMS / WhatsApp)
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyText}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1 hover:underline"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedSMS ? 'কপি হয়েছে!' : 'কপি করুন'}
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800 text-[11px] leading-relaxed">
                    {generatedMessage}
                  </pre>
                </div>

                {/* Multi-Channel Action Buttons */}
                <div className="pt-2 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    রিমাইন্ডার একশন নির্বাচন করুন
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* WhatsApp Action */}
                    <button
                      type="button"
                      onClick={handleSendWhatsApp}
                      className="p-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                      title="হোয়াটসঅ্যাপে তাগাদা পাঠান"
                    >
                      <Share2 className="w-4 h-4" />
                      হোয়াটসঅ্যাপ তাগাদা
                    </button>

                    {/* Google Calendar Web & Sync */}
                    <button
                      type="button"
                      disabled={isScheduling}
                      onClick={handleGoogleCalendarSync}
                      className="p-2.5 bg-purple-600 hover:bg-purple-700 active:scale-[0.98] disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                      title="গুগল ক্যালেন্ডারে ১-ক্লিকে যোগ করুন"
                    >
                      <Calendar className="w-4 h-4" />
                      {isScheduling ? 'যুক্ত হচ্ছে...' : 'গুগল ক্যালেন্ডার'}
                    </button>

                    {/* In-App System Task & Dashboard */}
                    <button
                      type="button"
                      onClick={handleSaveSystemTask}
                      className="p-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 active:scale-[0.98] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                      title="সফটওয়্যারের ড্যাশবোর্ড টাস্ক হিসেবে সেভ করুন"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      সিস্টেম টাস্কে সেভ
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCalendarModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-white dark:hover:bg-slate-800 transition-colors"
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
