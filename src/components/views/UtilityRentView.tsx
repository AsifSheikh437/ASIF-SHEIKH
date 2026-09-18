import React, { useState } from 'react';
import { DataExportToolbar } from '../common/DataExportToolbar';
import { useERP } from '../../context/ERPContext';
import { UtilityBill } from '../../types';
import { formatCurrency, formatDate, exportToCSV } from '../../utils/formatters';
import {
  Zap,
  Flame,
  Droplet,
  Building,
  Fuel,
  Wifi,
  CheckCircle2,
  AlertCircle,
  Plus,
  Download,
  X,
  CreditCard,
} from 'lucide-react';

export const UtilityRentView: React.FC = () => {
  const {
    utilityBills,
    addUtilityBill,
    payUtilityBill,
    bankAccounts,
  } = useERP();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
  const [billType, setBillType] = useState<UtilityBill['billType']>('ELECTRICITY');
  const [amount, setAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 10 * 86400000).toISOString().substring(0, 10));
  const [notes, setNotes] = useState('');

  // Payment modal
  const [payingBill, setPayingBill] = useState<UtilityBill | null>(null);
  const [payMethod, setPayMethod] = useState<'CASH' | 'BANK'>('BANK');
  const [selectedBankId, setSelectedBankId] = useState<string>(bankAccounts[0]?.id || '');

  const totalMonthlyBills = utilityBills.reduce((s, b) => s + b.amount, 0);
  const totalPaid = utilityBills.filter(b => b.status === 'PAID').reduce((s, b) => s + b.amount, 0);
  const totalPending = utilityBills.filter(b => b.status === 'PENDING').reduce((s, b) => s + b.amount, 0);

  const getBillIcon = (type: UtilityBill['billType']) => {
    switch (type) {
      case 'ELECTRICITY': return <Zap className="w-4 h-4 text-amber-500" />;
      case 'GAS': return <Flame className="w-4 h-4 text-orange-500" />;
      case 'WATER': return <Droplet className="w-4 h-4 text-blue-500" />;
      case 'RENT': return <Building className="w-4 h-4 text-indigo-500" />;
      case 'GENERATOR_FUEL': return <Fuel className="w-4 h-4 text-rose-500" />;
      case 'INTERNET': return <Wifi className="w-4 h-4 text-cyan-500" />;
      default: return <Zap className="w-4 h-4 text-slate-500" />;
    }
  };

  const handleCreateBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    addUtilityBill({
      month: selectedMonth,
      billType,
      amount,
      dueDate,
      notes: notes.trim(),
    });

    setShowAddModal(false);
    setAmount(0);
    setNotes('');
  };

  const handleConfirmPayBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingBill) return;

    payUtilityBill(
      payingBill.id,
      payMethod,
      payMethod === 'BANK' ? selectedBankId : undefined
    );
    setPayingBill(null);
  };

  const handleExportCSV = () => {
    const headers = ['Month', 'Bill Type', 'Amount', 'Due Date', 'Status', 'Paid Date', 'Notes'];
    const rows = utilityBills.map(b => [
      b.month,
      b.billType,
      b.amount,
      b.dueDate,
      b.status,
      b.paidDate || '-',
      b.notes || '-',
    ]);
    exportToCSV(`Utility_Bills_Report_${new Date().toISOString().substring(0, 10)}`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              মাসিক ইউটিলিটি ও ফ্যাক্টরি ভাড়া (Utility & Rent)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            বিদ্যুৎ, গ্যাস, পানি, জেনারেটর ডিজেল ও ফ্যাক্টরি স্পেস ভাড়ার মাসিক বিল হিসাব
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" />
            CSV ডাউনলোড
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            নতুন বিল যোগ করুন
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            মোট মাসিক ইউটিলিটি বিল
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1 font-sans">
            {formatCurrency(totalMonthlyBills)}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">{utilityBills.length} টি বিল রেকর্ড</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            পরিশোধিত বিল
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-1 font-sans">
            {formatCurrency(totalPaid)}
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-0.5">ক্যাশ বা ব্যাংক থেকে ডিসপ্যাচ</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            বকেয়া পেন্ডিং বিল
          </span>
          <div className="text-2xl font-black text-rose-600 mt-1 font-sans">
            {formatCurrency(totalPending)}
          </div>
          <div className="text-xs text-rose-500 font-medium mt-0.5">সময়মতো পরিশোধ করুন</div>
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">বিল তালিকা ও পেমেন্ট স্ট্যাটাস</h3>
          <span className="text-xs text-slate-400">রিয়েল-টাইম হিসাব</span>
        </div>

        <div className="overflow-x-auto">
          <div className="p-4 pb-0"><DataExportToolbar filename="UtilityRentView_Export" /></div>
<table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">মাস</th>
                <th className="py-3 px-4">বিলের ধরণ</th>
                <th className="py-3 px-4 text-right">বিলের পরিমাণ</th>
                <th className="py-3 px-4">পরিশোধের শেষ তারিখ</th>
                <th className="py-3 px-4">মন্তব্য</th>
                <th className="py-3 px-4 text-center">স্ট্যাটাস</th>
                <th className="py-3 px-4 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {utilityBills.map(b => (
                <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">{b.month}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      {getBillIcon(b.billType)}
                      <span>{b.billType}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    {formatCurrency(b.amount)}
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono">{formatDate(b.dueDate)}</td>
                  <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{b.notes || '-'}</td>
                  <td className="py-3 px-4 text-center">
                    {b.status === 'PAID' ? (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded text-[10px]">
                        পরিশোধিত ({formatDate(b.paidDate || '')})
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-800 font-bold rounded text-[10px]">
                        বকেয়া পেন্ডিং
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {b.status === 'PENDING' && (
                      <button
                        onClick={() => setPayingBill(b)}
                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-[11px] transition-colors inline-flex items-center gap-1"
                      >
                        <CreditCard className="w-3 h-3" />
                        পরিশোধ করুন
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Utility Bill Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">নতুন মাসিক ইউটিলিটি বা ভাড়া বিল</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBill} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">মাস (YYYY-MM) *</label>
                  <input
                    type="month"
                    required
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">বিলের ধরণ *</label>
                  <select
                    value={billType}
                    onChange={e => setBillType(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  >
                    <option value="ELECTRICITY">বিদ্যুৎ বিল (Electricity)</option>
                    <option value="GAS">গ্যাস বিল (Gas)</option>
                    <option value="RENT">কারখানা বা গোডাউন ভাড়া (Rent)</option>
                    <option value="WATER">পানি ও ওয়াসা (Water)</option>
                    <option value="GENERATOR_FUEL">জেনারেটর তেল ও ডিজেল (Generator Fuel)</option>
                    <option value="INTERNET">ইন্টারনেট ও যোগাযোগ (Internet)</option>
                    <option value="OTHER">অন্যান্য বিল</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">টাকার পরিমাণ (৳) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={amount}
                  onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-amber-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">পরিশোধের শেষ তারিখ *</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">মিটার নং বা রেফারেন্স নোট</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="যেমন: ডেসকো মিটার নং ৩৯২৮১ বা গোডাউন-২"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
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
                  className="px-5 py-2 bg-amber-600 text-white font-bold rounded-xl"
                >
                  বিল যোগ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Bill Modal */}
      {payingBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">বিল পরিশোধ নিশ্চিতকরণ</h3>
              <button onClick={() => setPayingBill(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">বিলের ধরণ:</span>
                <span className="font-bold text-slate-800">{payingBill.billType} ({payingBill.month})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">পরিশোধের পরিমাণ:</span>
                <span className="font-mono font-bold text-amber-700">{formatCurrency(payingBill.amount)}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmPayBill} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">পেমেন্ট মাধ্যম *</label>
                <select
                  value={payMethod}
                  onChange={e => setPayMethod(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="BANK">ব্যাংক অ্যাকাউন্ট / অনলাইন বিল পে</option>
                  <option value="CASH">ক্যাশ / পেটি ক্যাশ</option>
                </select>
              </div>

              {payMethod === 'BANK' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ব্যাংক অ্যাকাউন্ট</label>
                  <select
                    value={selectedBankId}
                    onChange={e => setSelectedBankId(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    {bankAccounts.map(b => (
                      <option key={b.id} value={b.id}>{b.accountName} (মজুদ: {formatCurrency(b.balance)})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setPayingBill(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 text-white font-bold rounded-xl"
                >
                  পরিশোধ সম্পন্ন করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
