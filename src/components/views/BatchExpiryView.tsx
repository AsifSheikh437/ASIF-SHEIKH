import React, { useState } from 'react';
import { DataExportToolbar } from '../common/DataExportToolbar';
import { useERP } from '../../context/ERPContext';
import { BatchItem } from '../../types';
import { formatDate, exportToCSV } from '../../utils/formatters';
import {
  CalendarClock,
  Search,
  Download,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Trash2,
  Filter,
  RotateCcw,
} from 'lucide-react';

export const BatchExpiryView: React.FC = () => {
  const { batches, products, adjustStock, expiringBatchesCount } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const handleSoftReset = () => {
    setSearchTerm('');
    setFilterStatus('ALL');
  };

  // Helper to resolve product name
  const getProductName = (b: { productId: string; productName?: string }) => {
    const prod = (products || []).find(p => p.id === b.productId);
    return prod?.nameBangla || prod?.nameEnglish || b.productName || b.productId;
  };

  // Compute days left
  const calculateDaysLeft = (expDateStr: string) => {
    if (!expDateStr) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(expDateStr);
    expDate.setHours(0, 0, 0, 0);
    const diffTime = expDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filteredBatches = (batches || []).filter(b => {
    const prodName = getProductName(b);
    const matchSearch =
      (b.batchNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      prodName.toLowerCase().includes(searchTerm.toLowerCase());

    const daysLeft = calculateDaysLeft(b.expDate);
    let computedStatus: string = b.status;
    if (b.quantity <= 0) computedStatus = 'DEPLETED';
    else if (daysLeft < 0) computedStatus = 'EXPIRED';
    else if (daysLeft <= 30) computedStatus = 'EXPIRING_SOON';
    else computedStatus = 'ACTIVE';

    const matchStatus = filterStatus === 'ALL' ? true : computedStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleDiscardExpiredBatch = (batch: BatchItem) => {
    if (confirm(`আপনি কি ব্যাচ ${batch.batchNumber} (${batch.quantity} ইউনিট) সম্পূর্ণ বাতিল/ড্যামেজ হিসেবে স্টক থেকে কমাতে চান?`)) {
      adjustStock(batch.productId, -batch.quantity, `মেয়াদ উত্তীর্ণ ব্যাচ অপসারণ: ${batch.batchNumber}`);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Batch Number', 'Product Name', 'Quantity', 'MFG Date', 'EXP Date', 'Days Left', 'Status'];
    const rows = filteredBatches.map(b => {
      const days = calculateDaysLeft(b.expDate);
      return [b.batchNumber, getProductName(b), b.quantity, b.mfgDate, b.expDate, days, b.status];
    });
    exportToCSV(`Batch_Expiry_Report_${new Date().toISOString().substring(0, 10)}`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-rose-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              ব্যাচ ও মেয়াদোত্তীর্ণ ট্র্যাকিং (Batch & Expiry)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            খাদ্যপণ্যের প্রতিটি ব্যাচের উৎপাদন ও মেয়াদোত্তীর্ণ তারিখের স্বয়ংক্রিয় দিন গণনা ও অ্যালার্ট
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
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            মোট সক্রিয় ব্যাচ
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1 font-sans">
            {batches.filter(b => b.quantity > 0).length} টি ব্যাচ
          </div>
          <div className="text-xs text-slate-400 mt-0.5">উৎপাদন ও পারচেজ ব্যাচ</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            মেয়াদ শেষের পথে (৩০ দিনের কম)
          </span>
          <div className="text-2xl font-black text-rose-600 mt-1 font-sans">
            {expiringBatchesCount} টি ব্যাচ
          </div>
          <div className="text-xs text-rose-500 font-medium mt-0.5">দ্রুত বাজারজাতকরণ বা ডিসকাউন্ট প্রয়োজন</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            নিরাপদ দীর্ঘমেয়াদি ব্যাচ
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-1 font-sans">
            {batches.filter(b => calculateDaysLeft(b.expDate) > 60 && b.quantity > 0).length} টি ব্যাচ
          </div>
          <div className="text-xs text-slate-400 mt-0.5">৬০ দিনের বেশি মেয়াদ বাকি</div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="ব্যাচ নম্বর বা পণ্যের নাম দিয়ে খুঁজুন..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500"
          />
        </div>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="w-full sm:w-60 py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500"
        >
          <option value="ALL">সকল স্ট্যাটাস</option>
          <option value="EXPIRING_SOON">মেয়াদ শেষের পথে (≤ ৩০ দিন)</option>
          <option value="EXPIRED">মেয়াদোত্তীর্ণ (Expired)</option>
          <option value="ACTIVE">সক্রিয় ও নিরাপদ (Active)</option>
          <option value="DEPLETED">স্টক সমাপ্ত (Depleted)</option>
        </select>

        <button
          id="btn-batch-soft-reset"
          onClick={handleSoftReset}
          className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
          title="ব্যাচ ফিল্টার ও সার্চ রিসেট করুন (Soft Reset)"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>রিসেট</span>
        </button>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <div className="p-4 pb-0"><DataExportToolbar filename="BatchExpiryView_Export" /></div>
<table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">ব্যাচ নম্বর</th>
                <th className="py-3 px-4">খাদ্যপণ্যের নাম</th>
                <th className="py-3 px-4 text-right">মজুদ পরিমাণ</th>
                <th className="py-3 px-4">উৎপাদন তারিখ</th>
                <th className="py-3 px-4">মেয়াদোত্তীর্ণ তারিখ</th>
                <th className="py-3 px-4 text-center">অবশিষ্ট দিন</th>
                <th className="py-3 px-4 text-center">স্ট্যাটাস</th>
                <th className="py-3 px-4 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    কোনো ব্যাচের তথ্য পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredBatches.map(b => {
                  const daysLeft = calculateDaysLeft(b.expDate);
                  const isExpired = daysLeft < 0;
                  const isExpiringSoon = daysLeft >= 0 && daysLeft <= 30;

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {b.batchNumber}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {getProductName(b)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        {b.quantity > 0 ? (
                          <span className="text-slate-900">{b.quantity} ইউনিট</span>
                        ) : (
                          <span className="text-slate-400 font-normal">০ (সমাপ্ত)</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono">
                        {formatDate(b.mfgDate)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {formatDate(b.expDate)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        {b.quantity <= 0 ? (
                          <span className="text-slate-400">-</span>
                        ) : isExpired ? (
                          <span className="text-rose-600 font-bold">মেয়াদোত্তীর্ণ!</span>
                        ) : (
                          <span className={isExpiringSoon ? 'text-amber-600 font-bold' : 'text-emerald-700'}>
                            {daysLeft} দিন বাকি
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {b.quantity <= 0 ? (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-semibold">
                            স্টক শূন্য
                          </span>
                        ) : isExpired ? (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-700 font-bold rounded text-[10px] flex items-center justify-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            মেয়াদ শেষ
                          </span>
                        ) : isExpiringSoon ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded text-[10px] flex items-center justify-center gap-1">
                            <Clock className="w-3 h-3" />
                            শীঘ্রই শেষ
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-semibold rounded text-[10px]">
                            নিরাপদ
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {b.quantity > 0 && isExpired && (
                          <button
                            onClick={() => handleDiscardExpiredBatch(b)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-semibold"
                            title="ড্যামেজ হিসেবে স্টক বাদ দিন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
