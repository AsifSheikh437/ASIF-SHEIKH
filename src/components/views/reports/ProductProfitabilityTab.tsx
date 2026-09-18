import React, { useState, useMemo } from 'react';
import { DataExportToolbar } from '../../../components/common/DataExportToolbar';
import { useERP } from '../../../context/ERPContext';
import { formatCurrency, toBengaliNumber, formatDate, exportToCSV } from '../../../utils/formatters';
import { printDocument, exportElementToPDF } from '../../../utils/printPdfUtils';
import { ReportPrintModal } from '../../common/ReportPrintModal';
import { ReportPeriodPreset, ProductProfitabilityItem } from './types';
import {
  getDateRangeFromPreset,
  calculateProductProfitability,
} from './reportUtils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from 'recharts';
import {
  Package,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Search,
  Printer,
  Download,
  FileSpreadsheet,
  BarChart3,
  Calendar,
  Layers,
  Filter,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';

type SortField =
  | 'productName'
  | 'soldQuantity'
  | 'totalSales'
  | 'totalCOGS'
  | 'grossProfit'
  | 'profitMarginPercent';

export const ProductProfitabilityTab: React.FC = () => {
  const { sales, products, settings } = useERP();

  // Period Preset & Date selection
  const [periodPreset, setPeriodPreset] = useState<ReportPeriodPreset>('THIS_MONTH');
  const [startDate, setStartDate] = useState<string>(() => {
    return getDateRangeFromPreset('THIS_MONTH').startDate;
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return getDateRangeFromPreset('THIS_MONTH').endDate;
  });

  // Search & Category filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('grossProfit');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Print View Modal State
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Handle Preset change
  const handlePresetChange = (preset: ReportPeriodPreset) => {
    setPeriodPreset(preset);
    if (preset !== 'CUSTOM') {
      const { startDate: s, endDate: e } = getDateRangeFromPreset(preset);
      setStartDate(s);
      setEndDate(e);
    }
  };

  // Calculate profitability list
  const profitabilityList = useMemo(() => {
    return calculateProductProfitability({
      sales,
      products,
      startDate,
      endDate,
    });
  }, [sales, products, startDate, endDate]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Filtered and Sorted list
  const filteredSortedList = useMemo(() => {
    return profitabilityList
      .filter(item => {
        const matchesSearch =
          item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.sku.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory =
          categoryFilter === 'ALL' || item.category === categoryFilter;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (typeof valA === 'string') {
          return sortOrder === 'asc'
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }

        return sortOrder === 'asc' ? valA - valB : valB - valA;
      });
  }, [profitabilityList, searchQuery, categoryFilter, sortField, sortOrder]);

  // Summary Totals
  const totals = useMemo(() => {
    const totalQty = profitabilityList.reduce((s, i) => s + i.soldQuantity, 0);
    const totalRev = profitabilityList.reduce((s, i) => s + i.totalSales, 0);
    const totalCOGS = profitabilityList.reduce((s, i) => s + i.totalCOGS, 0);
    const totalGross = totalRev - totalCOGS;
    const avgMargin = totalRev > 0 ? (totalGross / totalRev) * 100 : 0;
    return { totalQty, totalRev, totalCOGS, totalGross, avgMargin };
  }, [profitabilityList]);

  // Top 5 Most Profitable Products
  const top5Profitable = useMemo(() => {
    return [...profitabilityList]
      .sort((a, b) => b.grossProfit - a.grossProfit)
      .slice(0, 5)
      .map(p => ({
        name: p.productName.length > 15 ? p.productName.substring(0, 15) + '...' : p.productName,
        fullName: p.productName,
        profit: p.grossProfit,
        margin: p.profitMarginPercent,
        sales: p.totalSales,
      }));
  }, [profitabilityList]);

  // Top 5 Least Profitable Products (lowest margin / lowest gross profit)
  const bottom5Profitable = useMemo(() => {
    return [...profitabilityList]
      .sort((a, b) => a.grossProfit - b.grossProfit)
      .slice(0, 5)
      .map(p => ({
        name: p.productName.length > 15 ? p.productName.substring(0, 15) + '...' : p.productName,
        fullName: p.productName,
        profit: p.grossProfit,
        margin: p.profitMarginPercent,
        sales: p.totalSales,
      }));
  }, [profitabilityList]);

  // Toggle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Export handlers
  const handlePrint = () => {
    printDocument('product-profitability-print-sheet', {
      title: `Product_Profitability_${startDate}_to_${endDate}`,
      landscape: true,
    });
  };

  const handleExportPDF = () => {
    exportElementToPDF('product-profitability-print-sheet', {
      filename: `Product_Profitability_${startDate}_to_${endDate}.pdf`,
      orientation: 'landscape',
    });
  };

  const handleSoftReset = () => {
    setPeriodPreset('THIS_MONTH');
    const { startDate: s, endDate: e } = getDateRangeFromPreset('THIS_MONTH');
    setStartDate(s);
    setEndDate(e);
    setSearchQuery('');
    setCategoryFilter('ALL');
    setSortField('grossProfit');
    setSortOrder('desc');
  };

  const handleExportCSV = () => {
    const headers = [
      'Product Name',
      'SKU',
      'Category',
      'Sold Qty',
      'Unit',
      'Total Sales (BDT)',
      'Avg Unit Price (BDT)',
      'Total COGS (BDT)',
      'Gross Profit (BDT)',
      'Profit Margin (%)',
    ];
    const rows = filteredSortedList.map(item => [
      item.productName,
      item.sku,
      item.category,
      item.soldQuantity,
      item.unit,
      item.totalSales,
      item.avgSellingPrice.toFixed(2),
      item.totalCOGS,
      item.grossProfit,
      `${item.profitMarginPercent.toFixed(2)}%`,
    ]);
    exportToCSV(`Product_Profitability_${startDate}_to_${endDate}`, headers, rows);
  };

  const renderProfitabilityContent = () => (
    <div className="space-y-5">
      {/* Summary Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase">মোট বিক্রিত পরিমাণ</span>
          <div className="text-base font-black font-mono text-slate-900 mt-0.5">
            {totals.totalQty.toLocaleString('en-IN')} Units
          </div>
        </div>

        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase">মোট বিক্রয় মূল্য (Revenue)</span>
          <div className="text-base font-black font-mono text-slate-900 mt-0.5">
            {formatCurrency(totals.totalRev)}
          </div>
        </div>

        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase">মোট উৎপাদন খরচ (COGS)</span>
          <div className="text-base font-black font-mono text-rose-600 mt-0.5">
            {formatCurrency(totals.totalCOGS)}
          </div>
        </div>

        <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
          <span className="text-[10px] font-bold text-emerald-800 uppercase">সর্বমোট অর্জিত গ্রস লাভ</span>
          <div className="text-base font-black font-mono text-emerald-800 mt-0.5">
            {formatCurrency(totals.totalGross)}
          </div>
          <span className="text-[10px] text-emerald-700 font-bold">গড় মার্জিন: {totals.avgMargin.toFixed(1)}%</span>
        </div>
      </div>

      {/* Profitability Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <div className="p-4 pb-0"><DataExportToolbar filename="ProductProfitabilityTab_Export" /></div>
<table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white font-bold text-[11px]">
              <th className="py-3 px-3 w-10 text-center">#</th>
              <th
                className="py-3 px-3 cursor-pointer hover:bg-slate-800 transition-colors"
                onClick={() => handleSort('productName')}
              >
                <div className="flex items-center gap-1">
                  <span>প্রোডাক্টের নাম ও SKU</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-800 transition-colors"
                onClick={() => handleSort('soldQuantity')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>বিক্রিত পরিমাণ</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-800 transition-colors"
                onClick={() => handleSort('totalSales')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>মোট বিক্রয় (৳)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-800 transition-colors"
                onClick={() => handleSort('totalCOGS')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>উৎপাদন ব্যয় COGS (৳)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-800 transition-colors bg-slate-800"
                onClick={() => handleSort('grossProfit')}
              >
                <div className="flex items-center justify-end gap-1 text-emerald-300">
                  <span>গ্রস লাভ (Gross Profit)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                className="py-3 px-3 text-center cursor-pointer hover:bg-slate-800 transition-colors"
                onClick={() => handleSort('profitMarginPercent')}
              >
                <div className="flex items-center justify-center gap-1">
                  <span>মার্জিন %</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredSortedList.length > 0 ? (
              filteredSortedList.map((item, idx) => {
                const isProfit = item.grossProfit >= 0;
                return (
                  <tr key={item.productId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-center font-mono text-slate-400 text-[11px]">
                      {toBengaliNumber(idx + 1)}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{item.productName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        SKU: {item.sku} | ক্যাটাগরি: {item.category}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800">
                      {item.soldQuantity.toLocaleString('en-IN')} <span className="text-[10px] text-slate-400">{item.unit}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(item.totalSales)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-rose-600">
                      {formatCurrency(item.totalCOGS)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black bg-slate-50/60">
                      <span className={isProfit ? 'text-emerald-700' : 'text-rose-700'}>
                        {formatCurrency(item.grossProfit)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-mono font-bold text-[10px] ${
                          item.profitMarginPercent >= 25
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.profitMarginPercent >= 10
                            ? 'bg-blue-100 text-blue-800'
                            : item.profitMarginPercent > 0
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.profitMarginPercent.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                  কোনো প্রোডাক্ট বা বিক্রির রেকর্ড খুঁজে পাওয়া যায়নি
                </td>
              </tr>
            )}
          </tbody>
          {filteredSortedList.length > 0 && (
            <tfoot>
              <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                <td colSpan={2} className="py-3 px-3 text-right">সর্বমোট (Totals):</td>
                <td className="py-3 px-3 text-right font-mono">
                  {totals.totalQty.toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-3 text-right font-mono">
                  {formatCurrency(totals.totalRev)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-rose-700">
                  {formatCurrency(totals.totalCOGS)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-emerald-800 font-black">
                  {formatCurrency(totals.totalGross)}
                </td>
                <td className="py-3 px-3 text-center font-mono text-emerald-800">
                  {totals.avgMargin.toFixed(1)}%
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Filters & Actions Banner */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-600" />
              প্রোডাক্টভিত্তিক লাভ-ক্ষতি ও মার্জিন বিশ্লেষণ
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              প্রতিটি খাদ্যপণ্যের মোট বিক্রয়, উৎপাদন খরচ (COGS), অর্জিত গ্রস প্রফিট এবং শতকরা মার্জিন
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-product-soft-reset"
              onClick={handleSoftReset}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              title="ফিল্টার, সার্চ ও সর্টিং ডিফল্টে ফিরিয়ে নিন (Soft Reset)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>রিসেট ফিল্টার</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Excel/CSV
            </button>

            {/* Dedicated Print View Button */}
            <button
              id="btn-product-print-view"
              onClick={() => setShowPrintModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              title="প্রোডাক্ট প্রফিটেবিলিটি রিপোর্ট প্রিন্ট ভিউ খুলুন"
            >
              <Printer className="w-4 h-4 text-indigo-200" />
              <span>Print View</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              PDF ডাউনলোড
            </button>
          </div>
        </div>

        {/* Date presets & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                ['TODAY', 'আজ'],
                ['THIS_WEEK', 'চলতি সপ্তাহ'],
                ['THIS_MONTH', 'চলতি মাস'],
                ['LAST_MONTH', 'গত মাস'],
                ['THIS_QUARTER', 'ত্রৈমাসিক'],
                ['THIS_YEAR', 'চলতি বছর'],
                ['ALL', 'সমস্ত'],
              ] as [ReportPeriodPreset, string][]
            ).map(([preset, label]) => (
              <button
                key={preset}
                onClick={() => handlePresetChange(preset)}
                className={`px-3 py-1 text-xs font-medium rounded-xl transition-all ${
                  periodPreset === preset
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Date range inputs */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={e => {
                setStartDate(e.target.value);
                setPeriodPreset('CUSTOM');
              }}
              className="text-xs font-mono px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-xs text-slate-400">হতে</span>
            <input
              type="date"
              value={endDate}
              onChange={e => {
                setEndDate(e.target.value);
                setPeriodPreset('CUSTOM');
              }}
              className="text-xs font-mono px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="পণ্য বা SKU দিয়ে সার্চ করুন..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-44"
            >
              <option value="ALL">সকল ক্যাটাগরি</option>
              {categories.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Top 5 Most & Least Profitable Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden">
        {/* Top 5 Most Profitable */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              টপ ৫ লাভজনক প্রোডাক্ট (Highest Gross Profit)
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">টাকা (৳)</span>
          </div>

          {top5Profitable.length > 0 ? (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={top5Profitable} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `৳${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
                  <Tooltip
                    formatter={(val: number) => [`৳${val.toLocaleString('en-IN')}`, 'গ্রস লাভ']}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                  />
                  <Bar dataKey="profit" fill="#059669" radius={[0, 6, 6, 0]}>
                    {top5Profitable.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#047857' : '#10b981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-xs text-slate-400">
              এই সময়কালে বিক্রির রেকর্ড পাওয়া যায়নি
            </div>
          )}
        </div>

        {/* Top 5 Least Profitable */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-600" />
              টপ ৫ কম-লাভজনক প্রোডাক্ট (Lowest Gross Profit)
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">টাকা (৳)</span>
          </div>

          {bottom5Profitable.length > 0 ? (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bottom5Profitable} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `৳${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
                  <Tooltip
                    formatter={(val: number) => [`৳${val.toLocaleString('en-IN')}`, 'গ্রস লাভ']}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                  />
                  <Bar dataKey="profit" fill="#f43f5e" radius={[0, 6, 6, 0]}>
                    {bottom5Profitable.map((entry, index) => (
                      <Cell key={`cell-bottom-${index}`} fill={index === 0 ? '#be123c' : '#fb7185'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-xs text-slate-400">
              এই সময়কালে বিক্রির রেকর্ড পাওয়া যায়নি
            </div>
          )}
        </div>
      </div>

      {/* Main Table Printable Area */}
      <div
        id="product-profitability-print-sheet"
        className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 md:p-8 space-y-5"
      >
        {/* Statement Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b-2 border-slate-900">
          <div className="flex items-center gap-3">
            {settings.companyLogo ? (
              <img
                src={settings.companyLogo}
                alt="Logo"
                className="w-12 h-12 object-contain rounded-xl border border-slate-200 p-1"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg">
                {settings.companyNameEnglish ? settings.companyNameEnglish.charAt(0) : 'E'}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-slate-900">{settings.companyNameBangla}</h2>
              <p className="text-xs text-slate-500 uppercase tracking-wider">{settings.companyNameEnglish}</p>
              <p className="text-[11px] text-slate-600">{settings.address} | ফোন: {settings.phone}</p>
            </div>
          </div>

          <div className="sm:text-right">
            <span className="inline-block px-3 py-1 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider rounded-md mb-1">
              PRODUCT PROFITABILITY REPORT
            </span>
            <div className="text-xs font-mono text-slate-700">
              পিরিয়ড: <span className="font-bold">{formatDate(startDate)} হতে {formatDate(endDate)}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              প্রস্তুত: {formatDate(new Date().toISOString())}
            </div>
          </div>
        </div>

        {/* Statement Content */}
        {renderProfitabilityContent()}

        {/* 4-Tier Signatures */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-10 text-center text-xs">
          <div>
            <div className="border-t border-slate-400 pt-1.5 font-bold text-slate-700">হিসাব কর্মকর্তা</div>
            <div className="text-[10px] text-slate-400">Prepared by</div>
          </div>
          <div>
            <div className="border-t border-slate-400 pt-1.5 font-bold text-slate-700">অভ্যন্তরীণ নিরীক্ষক</div>
            <div className="text-[10px] text-slate-400">Audited by</div>
          </div>
          <div>
            <div className="border-t border-slate-400 pt-1.5 font-bold text-slate-700">প্রধান অর্থ কর্মকর্তা</div>
            <div className="text-[10px] text-slate-400">CFO Approval</div>
          </div>
          <div>
            <div className="border-t border-slate-400 pt-1.5 font-bold text-slate-700">ব্যবস্থাপনা পরিচালক</div>
            <div className="text-[10px] text-slate-400">Managing Director</div>
          </div>
        </div>
      </div>

      {/* Dedicated Clean Printer-Friendly Modal Layout */}
      {showPrintModal && (
        <ReportPrintModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          title="প্রোডাক্টভিত্তিক লাভ-ক্ষতি ও মার্জিন বিশ্লেষণ (Product Profitability)"
          subtitle="খাদ্যপণ্যের বিক্রয়, উৎপাদন খরচ (COGS), মোট লাভ ও মার্জিন প্রতিবেদন"
          periodLabel={`সময়কাল: ${formatDate(startDate)} হতে ${formatDate(endDate)}`}
          documentId="product-profitability-modal-printable-area"
          landscape={true}
        >
          {renderProfitabilityContent()}
        </ReportPrintModal>
      )}
    </div>
  );
};
