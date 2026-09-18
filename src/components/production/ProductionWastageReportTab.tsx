import React, { useState, useMemo } from 'react';
import { DataExportToolbar } from '../common/DataExportToolbar';
import { useERP } from '../../context/ERPContext';
import { formatCurrency, formatDate, exportToCSV } from '../../utils/formatters';
import {
  TrendingDown,
  Printer,
  Download,
  Search,
  Calendar,
  AlertTriangle,
  Percent,
  Sparkles,
  CheckCircle2,
  Filter,
} from 'lucide-react';

export const ProductionWastageReportTab: React.FC = () => {
  const { productionRuns, wastageRecords, settings } = useERP();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');

  // Collect all runs with wastage or calculate from runs
  const wastageRows = useMemo(() => {
    return productionRuns
      .filter(run => (run.wastageQuantity || 0) > 0 || (run.yieldPercent || 100) < 100)
      .map(run => {
        const expected = run.expectedQuantity || run.producedQuantity;
        const actual = run.producedQuantity;
        const wastageQty = run.wastageQuantity || Math.max(0, expected - actual);
        const yieldPct = run.yieldPercent || (expected > 0 ? (actual / expected) * 100 : 100);
        const wastagePct = run.wastagePercent || (expected > 0 ? (wastageQty / expected) * 100 : 0);
        const unitCost = run.costPerUnit || 0;
        const lossAmount = wastageQty * unitCost;

        return {
          id: run.id,
          date: run.date,
          batchNo: run.batchNo,
          voucherNo: run.wastageVoucherNo || `WST-PRD-${run.batchNo}`,
          productName: run.recipeName || 'তৈরি পণ্য',
          unit: run.unit,
          expected,
          actual,
          wastageQty,
          yieldPct: Number(yieldPct.toFixed(1)),
          wastagePct: Number(wastagePct.toFixed(1)),
          unitCost,
          lossAmount,
          supervisor: run.supervisor || 'সুপারভাইজার',
          notes: run.notes || 'উৎপাদনকালীন প্রসেস লস / ডিফেক্ট',
        };
      })
      .filter(item => {
        const matchesSearch =
          !searchTerm ||
          item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.batchNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.voucherNo.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFrom = !filterDateFrom || item.date >= filterDateFrom;
        const matchesTo = !filterDateTo || item.date <= filterDateTo;

        return matchesSearch && matchesFrom && matchesTo;
      });
  }, [productionRuns, searchTerm, filterDateFrom, filterDateTo]);

  // KPIs
  const totalWastageUnits = wastageRows.reduce((sum, r) => sum + r.wastageQty, 0);
  const totalFinancialLoss = wastageRows.reduce((sum, r) => sum + r.lossAmount, 0);
  const avgYield =
    productionRuns.length > 0
      ? productionRuns.reduce((sum, r) => sum + (r.yieldPercent || 100), 0) / productionRuns.length
      : 100;

  const handleExportCSV = () => {
    const headers = [
      'তারিখ',
      'ভাউচার নং',
      'ব্যাচ নং',
      'পণ্য / রেসিপি',
      'প্রত্যাশিত আউটপুট',
      'প্রকৃত আউটপুট',
      'অপচয় পরিমাণ',
      'ইল্ড হার (Yield %)',
      'অপচয় হার (Wastage %)',
      'একক প্রস্তুত ব্যয় (৳)',
      'মোট আর্থিক ক্ষতি (৳)',
      'অনুমোদনকারী সুপারভাইজার',
      'মন্তব্য',
    ];

    const rows = wastageRows.map(r => [
      r.date,
      r.voucherNo,
      r.batchNo,
      r.productName,
      `${r.expected} ${r.unit}`,
      `${r.actual} ${r.unit}`,
      `${r.wastageQty} ${r.unit}`,
      `${r.yieldPct}%`,
      `${r.wastagePct}%`,
      r.unitCost.toFixed(2),
      r.lossAmount.toFixed(2),
      r.supervisor,
      r.notes,
    ]);

    exportToCSV(`Production_Wastage_Report_${new Date().toISOString().substring(0, 10)}`, headers, rows);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Print Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs print:border-none print:shadow-none">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-rose-600" />
            <span>প্রোডাকশন অপচয় ও ইল্ড বিশ্লেষণ রিপোর্ট (Yield & Wastage Log)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            প্রতিটি ব্যাচের প্রত্যাশিত আউটপুট বনাম প্রকৃত উৎপাদনের পার্থক্য ও কারখানা প্রসেস লস ট্র্যাকিং
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>প্রিন্ট / PDF</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
          >
            <Download className="w-4 h-4" />
            <span>এক্সেল (CSV)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-rose-50 border border-rose-200 p-5 rounded-3xl shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
            মোট আর্থিক অপচয় (Financial Loss)
          </span>
          <div className="text-3xl font-black font-mono text-rose-950 mt-2">
            {formatCurrency(totalFinancialLoss)}
          </div>
          <p className="text-xs text-rose-700 mt-1 font-medium">
            মোট {totalWastageUnits} ইউনিট প্রসেস লস
          </p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-3xl shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            সার্বিক কারখানা ইল্ড (Average Yield Rate)
          </span>
          <div className="text-3xl font-black font-mono text-emerald-950 mt-2">
            {avgYield.toFixed(1)}%
          </div>
          <p className="text-xs text-emerald-700 mt-1 font-medium">
            স্ট্যান্ডার্ড টার্গেট: ৯৫% বা তদূর্ধ্ব
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 p-5 rounded-3xl shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
            লজিক্যাল ব্যাচ অপচয় ইভেন্ট
          </span>
          <div className="text-3xl font-black font-mono text-amber-950 mt-2">
            {wastageRows.length} টি ব্যাচ
          </div>
          <p className="text-xs text-amber-700 mt-1 font-medium">
            স্পিলেজ বা প্যাকেজিং ত্রুটির রেকর্ড
          </p>
        </div>
      </div>

      {/* Search & Date Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-slate-200 print:hidden">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="পণ্য, ব্যাচ নং বা ভাউচার খুঁজুন..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 shrink-0">তারিখ হতে:</span>
          <input
            type="date"
            value={filterDateFrom}
            onChange={e => setFilterDateFrom(e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 shrink-0">পর্যন্ত:</span>
          <input
            type="date"
            value={filterDateTo}
            onChange={e => setFilterDateTo(e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl"
          />
        </div>
      </div>

      {/* Wastage Records Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <div className="p-4 pb-0"><DataExportToolbar filename="ProductionWastageReportTab_Export" /></div>
<table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                <th className="py-3 px-3.5">তারিখ ও ভাউচার</th>
                <th className="py-3 px-3.5">ব্যাচ নং</th>
                <th className="py-3 px-3.5">তৈরি পণ্য / রেসিপি</th>
                <th className="py-3 px-3.5 text-right">প্রত্যাশিত</th>
                <th className="py-3 px-3.5 text-right">প্রকৃত</th>
                <th className="py-3 px-3.5 text-right">অপচয় (Wastage)</th>
                <th className="py-3 px-3.5 text-center">ইল্ড (Yield %)</th>
                <th className="py-3 px-3.5 text-right">ক্ষতির পরিমাণ (৳)</th>
                <th className="py-3 px-3.5">অনুমোদনকারী</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {wastageRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">কোনো অপচয় রেকর্ড পাওয়া যায়নি</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      সবগুলো ব্যাচে পূর্ণ ১০০% উৎপাদন সম্পন্ন হয়েছে অথবা ফিল্টার অনুযায়ী তথ্য নেই।
                    </p>
                  </td>
                </tr>
              ) : (
                wastageRows.map(row => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3.5 font-semibold text-slate-900">
                      <div>{formatDate(row.date)}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{row.voucherNo}</div>
                    </td>
                    <td className="py-3 px-3.5 font-mono font-bold text-amber-800">
                      {row.batchNo}
                    </td>
                    <td className="py-3 px-3.5 font-medium text-slate-800">
                      {row.productName}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-slate-600">
                      {row.expected} {row.unit}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900">
                      {row.actual} {row.unit}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-black text-rose-700">
                      {row.wastageQty} {row.unit}
                      <span className="text-[10px] text-rose-500 font-normal ml-1">
                        ({row.wastagePct}%)
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        row.yieldPct >= 97 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {row.yieldPct}%
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-black text-rose-700">
                      {formatCurrency(row.lossAmount)}
                    </td>
                    <td className="py-3 px-3.5 text-xs text-slate-600">
                      <div>{row.supervisor}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs">{row.notes}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
