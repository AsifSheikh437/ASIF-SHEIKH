import React, { useState } from 'react';
import { DataExportToolbar } from '../common/DataExportToolbar';
import { DictationButton } from '../common/DictationButton';
import { useERP } from '../../context/ERPContext';
import { Expense, ExpenseCategory } from '../../types';
import { formatCurrency, formatDate, exportToCSV } from '../../utils/formatters';
import {
  Receipt,
  Plus,
  Search,
  Download,
  DollarSign,
  TrendingDown,
  Calendar,
  X,
  CreditCard,
  Building,
  RotateCcw,
} from 'lucide-react';

export const ExpensesView: React.FC = () => {
  const {
    expenses,
    addExpense,
    bankAccounts,
    currentUser,
  } = useERP();

  const [showAddModal, setShowAddModal] = useState(false);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().substring(0, 10));
  const [category, setCategory] = useState<string>('MAINTENANCE');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK'>('CASH');
  const [selectedBankId, setSelectedBankId] = useState<string>(bankAccounts[0]?.id || '');
  const [paidTo, setPaidTo] = useState('');
  const [description, setDescription] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const handleSoftReset = () => {
    setSearchTerm('');
    setFilterCategory('ALL');
  };

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  const filteredExpenses = expenses.filter(e => {
    const pTo = (e.paidTo || e.payee || '').toLowerCase();
    const desc = (e.description || e.note || '').toLowerCase();
    const matchSearch =
      e.voucherNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pTo.includes(searchTerm.toLowerCase()) ||
      desc.includes(searchTerm.toLowerCase());
    const matchCat = filterCategory === 'ALL' ? true : e.category === filterCategory;
    return matchSearch && matchCat;
  });

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    addExpense({
      date: expenseDate,
      category,
      amount,
      paymentMethod,
      bankAccountId: paymentMethod === 'BANK' ? selectedBankId : undefined,
      paidTo: paidTo.trim() || 'সাধারণ খরচ',
      description: description.trim() || 'দৈনন্দিন ব্যয়',
      authorizedBy: currentUser?.name || 'Accounts',
    });

    setShowAddModal(false);
    setAmount(0);
    setPaidTo('');
    setDescription('');
  };

  const handleExportCSV = () => {
    const headers = ['Voucher No', 'Date', 'Category', 'Paid To', 'Amount', 'Payment Method', 'Authorized By', 'Description'];
    const rows = filteredExpenses.map(e => [
      e.voucherNo,
      e.date,
      e.category,
      e.paidTo,
      e.amount,
      e.paymentMethod,
      e.authorizedBy,
      e.description,
    ]);
    exportToCSV(`Expenses_Report_${new Date().toISOString().substring(0, 10)}`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-rose-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              দৈনন্দিন ব্যয় ও ভাউচার (Daily Expenses)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            কারখানার রক্ষণাবেক্ষণ, জ্বালানি, অতিথি আপ্যায়ন ও অন্যান্য পরিচালন ব্যয়ের হিসাব
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
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            নতুন খরচ ভাউচার
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            মোট খরচ ভাউচার এন্ট্রি
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1 font-sans">
            {expenses.length} টি ভাউচার
          </div>
          <div className="text-xs text-slate-400 mt-0.5">অডিট ট্র্যাকিং সহ</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            মোট পরিচালন খরচ (Total Expenses)
          </span>
          <div className="text-2xl font-black text-rose-600 mt-1 font-sans">
            {formatCurrency(totalExpenseAmount)}
          </div>
          <div className="text-xs text-rose-500 font-medium mt-0.5">লাভ-ক্ষতি হিসাবে সমন্বিত</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            সর্বোচ্চ ব্যয় ক্যাটাগরি
          </span>
          <div className="text-xl font-bold text-slate-800 mt-1">
            মেশিন ও ফ্যাক্টরি মেইনটেন্যান্স
          </div>
          <div className="text-xs text-slate-400 mt-0.5">নিয়মিত কারখানা তদারকি</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="ভাউচার নং বা প্রাপকের নাম দিয়ে খুঁজুন..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500"
          />
        </div>

        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="w-full sm:w-60 py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500"
        >
          <option value="ALL">সকল ক্যাটাগরি</option>
          <option value="MAINTENANCE">রক্ষণাবেক্ষণ ও যন্ত্রাংশ (Maintenance)</option>
          <option value="FUEL">জ্বালানি ও গ্যাস (Fuel)</option>
          <option value="UTILITY">বিদ্যুৎ ও ওয়াসা (Utility)</option>
          <option value="RENT">কারখানা বা অফিস ভাড়া (Rent)</option>
          <option value="SALARY">শ্রমিক মজুরি ও বেতন (Salary)</option>
          <option value="ENTERTAINMENT">আপ্যায়ন ও মেহমানদারি (Entertainment)</option>
          <option value="OTHER">অন্যান্য বিবিধ খরচ (Other)</option>
        </select>

        <button
          id="btn-expenses-soft-reset"
          onClick={handleSoftReset}
          className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
          title="ফিল্টার ও সার্চ রিসেট করুন (Soft Reset)"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>রিসেট</span>
        </button>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <div className="p-4 pb-0"><DataExportToolbar filename="ExpensesView_Export" /></div>
<table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">ভাউচার নং</th>
                <th className="py-3 px-4">তারিখ</th>
                <th className="py-3 px-4">ক্যাটাগরি</th>
                <th className="py-3 px-4">প্রাপক / Paid To</th>
                <th className="py-3 px-4">বিবরণ</th>
                <th className="py-3 px-4 text-right">টাকা (৳)</th>
                <th className="py-3 px-4">মাধ্যম</th>
                <th className="py-3 px-4">অনুমোদনকারী</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    কোনো খরচের রেকর্ড পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-rose-700">{exp.voucherNo}</td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(exp.date)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded text-[10px]">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{exp.paidTo}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{exp.description}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                      {formatCurrency(exp.amount)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-semibold">{exp.paymentMethod}</td>
                    <td className="py-3 px-4 text-slate-500">{exp.authorizedBy}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">নতুন ব্যয় ভাউচার তৈরি</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={e => setExpenseDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ক্যাটাগরি *</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  >
                    <option value="MAINTENANCE">মেশিন মেরামত ও রক্ষণাবেক্ষণ</option>
                    <option value="FUEL">জ্বালানি ও জেনারেটর তেল</option>
                    <option value="UTILITY">বিদ্যুৎ ও পানি</option>
                    <option value="RENT">কারখানা বা অফিস ভাড়া</option>
                    <option value="SALARY">শ্রমিক মজুরি</option>
                    <option value="ENTERTAINMENT">আপ্যায়ন ও চা-নাস্তা</option>
                    <option value="OTHER">বিবিধ খরচ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">প্রাপক / কার বরাবরে পরিশোধ *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={paidTo}
                    onChange={e => setPaidTo(e.target.value)}
                    placeholder="যেমন: রহিম মেকানিক বা করিম ট্রেডার্স"
                    className="w-full p-2 pr-10 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                  <DictationButton 
                    onResult={(text) => setPaidTo(prev => prev ? prev + ' ' + text : text)}
                    className="absolute right-1 top-1 w-7 h-7"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">খরচের পরিমাণ (৳) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={amount}
                  onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-rose-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">পেমেন্ট মাধ্যম *</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as 'CASH' | 'BANK')}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="CASH">নগদ ক্যাশ / পেটি ক্যাশ</option>
                    <option value="BANK">ব্যাংক একাউন্ট</option>
                  </select>
                </div>

                {paymentMethod === 'BANK' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">ব্যাংক অ্যাকাউন্ট</label>
                    <select
                      value={selectedBankId}
                      onChange={e => setSelectedBankId(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      {bankAccounts.map(b => (
                        <option key={b.id} value={b.id}>{b.accountName}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">বিস্তারিত বিবরণ বা বিল নোট</label>
                <div className="relative">
                  <input
                    type="text"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="খরচের উদ্দেশ্য বা কাজের বিবরণ লিখুন"
                    className="w-full p-2 pr-10 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                  <DictationButton 
                    onResult={(text) => setDescription(prev => prev ? prev + ' ' + text : text)}
                    className="absolute right-1 top-1 w-7 h-7"
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
                  className="px-5 py-2 bg-rose-600 text-white font-bold rounded-xl"
                >
                  ভাউচার অনুমোদন ও সেভ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
