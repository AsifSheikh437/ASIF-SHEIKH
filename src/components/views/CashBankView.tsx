import React, { useState } from 'react';
import { DataExportToolbar } from '../common/DataExportToolbar';
import { useERP } from '../../context/ERPContext';
import { formatCurrency, formatDate, exportToCSV } from '../../utils/formatters';
import {
  Landmark,
  Wallet,
  ArrowRightLeft,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Download,
  X,
  CreditCard,
  Building,
  RotateCcw,
} from 'lucide-react';

export const CashBankView: React.FC = () => {
  const {
    bankAccounts,
    addBankAccount,
    cashBankLedgers,
    transferFunds,
    totalCashAndBankBalance,
  } = useERP();

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [fromAccId, setFromAccId] = useState(bankAccounts[0]?.id || '');
  const [toAccId, setToAccId] = useState(bankAccounts[1]?.id || '');
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [transferNotes, setTransferNotes] = useState('');
  const [transferError, setTransferError] = useState('');

  const [showAddAccModal, setShowAddAccModal] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<'BANK' | 'CASH' | 'MOBILE_BANKING'>('BANK');
  const [newAccNumber, setNewAccNumber] = useState('');
  const [newOpeningBalance, setNewOpeningBalance] = useState<number>(0);

  const [searchTerm, setSearchTerm] = useState('');

  const filteredLedger = cashBankLedgers.filter(l =>
    l.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.accountName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');

    if (fromAccId === toAccId) {
      setTransferError('প্রেরক এবং প্রাপক অ্যাকাউন্ট একই হতে পারে না।');
      return;
    }

    const fromAcc = bankAccounts.find(a => a.id === fromAccId);
    if (!fromAcc || fromAcc.balance < transferAmount) {
      setTransferError('প্রেরক অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই।');
      return;
    }

    transferFunds(fromAccId, toAccId, transferAmount, transferNotes || 'অভ্যন্তরীণ তহবিল স্থানান্তর');
    setShowTransferModal(false);
    setTransferAmount(0);
    setTransferNotes('');
  };

  const handleAddAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim()) return;

    addBankAccount({
      accountName: newAccName.trim(),
      type: newAccType,
      accountNumber: newAccNumber.trim(),
      balance: newOpeningBalance,
    });

    setShowAddAccModal(false);
    setNewAccName('');
    setNewAccNumber('');
    setNewOpeningBalance(0);
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Account', 'Description', 'Inflow (Debit)', 'Outflow (Credit)', 'Balance'];
    const rows = filteredLedger.map(l => [
      l.date,
      l.accountName,
      l.description,
      l.debit,
      l.credit,
      l.balance,
    ]);
    exportToCSV(`Cash_Bank_Ledger_${new Date().toISOString().substring(0, 10)}`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              ক্যাশ ও ব্যাংক লেজার (Cash & Bank Accounts)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            কোম্পানির নগদ ক্যাশ ড্রয়ার, পেটি ক্যাশ ও ব্যাংক একাউন্ট ব্যালেন্স এবং ফান্ড ট্রান্সফার
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
            onClick={() => setShowAddAccModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            নতুন অ্যাকাউন্ট
          </button>
          <button
            onClick={() => setShowTransferModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <ArrowRightLeft className="w-4 h-4" />
            ফান্ড ট্রান্সফার করুন
          </button>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-800 text-sm">সক্রিয় ক্যাশ ও ব্যাংক অ্যাকাউন্ট ({bankAccounts.length} টি)</h3>
          <div className="text-xs text-slate-500 font-semibold">
            সর্বমোট তারল্য: <span className="text-emerald-700 font-mono font-black text-sm">{formatCurrency(totalCashAndBankBalance)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {bankAccounts.map(acc => (
            <div
              key={acc.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {acc.type}
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  {acc.type === 'CASH' ? <Wallet className="w-4 h-4" /> : <Landmark className="w-4 h-4" />}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm leading-tight">{acc.accountName}</h4>
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">{acc.accountNumber || 'নগদ ড্রয়ার'}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                <span className="text-xs text-slate-500">মজুদ ব্যালেন্স:</span>
                <span className="text-base font-black font-mono text-emerald-700">
                  {formatCurrency(acc.balance)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cash & Bank Transaction Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-bold text-slate-800 text-sm">লেনদেন হিস্ট্রি (Cash & Bank Transactions)</h3>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="বিবরণ দিয়ে লেনদেন খুঁজুন..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            {searchTerm && (
              <button
                id="btn-cashbank-soft-reset"
                onClick={() => setSearchTerm('')}
                className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                title="সার্চ রিসেট করুন"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>রিসেট</span>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="p-4 pb-0"><DataExportToolbar filename="CashBankView_Export" /></div>
<table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">তারিখ</th>
                <th className="py-3 px-4">অ্যাকাউন্ট</th>
                <th className="py-3 px-4">লেনদেনের বিবরণ</th>
                <th className="py-3 px-4 text-right">আগমী টাকা (Debit In)</th>
                <th className="py-3 px-4 text-right">ব্যয় / পেমেন্ট (Credit Out)</th>
                <th className="py-3 px-4 text-right">ব্যালেন্স</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    কোনো লেনদেন পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredLedger.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500">{formatDate(l.date)}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{l.accountName}</td>
                    <td className="py-3 px-4 text-slate-600">{l.description}</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 font-bold">
                      {l.debit > 0 ? `+ ${formatCurrency(l.debit)}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-rose-600 font-bold">
                      {l.credit > 0 ? `- ${formatCurrency(l.credit)}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(l.balance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fund Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">অভ্যন্তরীণ ফান্ড ট্রান্সফার</h3>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {transferError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {transferError}
              </div>
            )}

            <form onSubmit={handleTransferSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">প্রেরক অ্যাকাউন্ট (From Account) *</label>
                <select
                  value={fromAccId}
                  onChange={e => setFromAccId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {bankAccounts.map(a => (
                    <option key={a.id} value={a.id}>{a.accountName} (মজুদ: {formatCurrency(a.balance)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">প্রাপক অ্যাকাউন্ট (To Account) *</label>
                <select
                  value={toAccId}
                  onChange={e => setToAccId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {bankAccounts.map(a => (
                    <option key={a.id} value={a.id}>{a.accountName} (মজুদ: {formatCurrency(a.balance)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ট্রান্সফার টাকার পরিমাণ (৳) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={transferAmount}
                  onChange={e => setTransferAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-emerald-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">রেফারেন্স বা মন্তব্য</label>
                <input
                  type="text"
                  value={transferNotes}
                  onChange={e => setTransferNotes(e.target.value)}
                  placeholder="যেমন: ব্যাংক থেকে ক্যাশ উত্তোলন"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl"
                >
                  ট্রান্সফার সম্পন্ন করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Bank Account Modal */}
      {showAddAccModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">নতুন ক্যাশ বা ব্যাংক অ্যাকাউন্ট যোগ</h3>
              <button onClick={() => setShowAddAccModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAccountSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">অ্যাকাউন্টের নাম *</label>
                <input
                  type="text"
                  required
                  value={newAccName}
                  onChange={e => setNewAccName(e.target.value)}
                  placeholder="যেমন: ইসলামী ব্যাংক বাংলাদেশ বা রকেট অ্যাকাউন্ট"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">অ্যাকাউন্টের ধরণ *</label>
                  <select
                    value={newAccType}
                    onChange={e => setNewAccType(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="BANK">ব্যাংক অ্যাকাউন্ট (Bank)</option>
                    <option value="CASH">ক্যাশ ড্রয়ার (Cash)</option>
                    <option value="MOBILE_BANKING">মোবাইল ব্যাংকিং (MFS)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">অ্যাকাউন্ট নম্বর</label>
                  <input
                    type="text"
                    value={newAccNumber}
                    onChange={e => setNewAccNumber(e.target.value)}
                    placeholder="হিসাব নং"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">প্রারম্ভিক ব্যালেন্স (Opening Balance)</label>
                <input
                  type="number"
                  min="0"
                  value={newOpeningBalance}
                  onChange={e => setNewOpeningBalance(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddAccModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl"
                >
                  অ্যাকাউন্ট সংরক্ষণ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
