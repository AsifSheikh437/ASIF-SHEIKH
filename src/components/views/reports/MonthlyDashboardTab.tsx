import React, { useState, useMemo } from 'react';
import { DataExportToolbar } from '../../../components/common/DataExportToolbar';
import { useERP } from '../../../context/ERPContext';
import { formatCurrency, formatDate, exportToCSV } from '../../../utils/formatters';
import { printDocument, exportElementToPDF } from '../../../utils/printPdfUtils';
import { ReportPrintModal } from '../../common/ReportPrintModal';
import { MonthlyTrendData } from './types';
import { calculateMonthlyTrends, calculateDetailedPnL } from './reportUtils';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  PieChart as PieChartIcon,
  BarChart3,
  ArrowRight,
  Printer,
  Download,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  Info,
  DollarSign,
  Activity,
  Truck,
  Users,
  Zap,
  Trash2,
  Receipt,
  X,
  RotateCcw,
} from 'lucide-react';

interface Props {
  onDrillDownToMonth?: (startDate: string, endDate: string) => void;
}

const EXPENSE_COLORS = ['#6366f1', '#3b82f6', '#f59e0b', '#ef4444', '#64748b'];

export const MonthlyDashboardTab: React.FC<Props> = ({ onDrillDownToMonth }) => {
  const {
    sales,
    purchases,
    expenses,
    utilityBills,
    salaryRecords,
    employees,
    transportTrips,
    wastageRecords,
    ownerWithdrawals,
    products,
    payrollMode,
    settings,
    theme,
  } = useERP();

  const [monthsCount, setMonthsCount] = useState<6 | 12>(12);
  const [chartType, setChartType] = useState<'AREA' | 'BAR'>('AREA');
  const [selectedMonthModal, setSelectedMonthModal] = useState<MonthlyTrendData | null>(null);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Compute monthly trends
  const monthlyData = useMemo(() => {
    return calculateMonthlyTrends({
      sales,
      expenses,
      utilityBills,
      salaryRecords,
      employees,
      transportTrips,
      wastageRecords,
      ownerWithdrawals,
      products,
      payrollMode,
      monthsCount,
    });
  }, [
    sales,
    expenses,
    utilityBills,
    salaryRecords,
    employees,
    transportTrips,
    wastageRecords,
    ownerWithdrawals,
    products,
    payrollMode,
    monthsCount,
  ]);

  // Total summary for selected timeframe
  const periodTotals = useMemo(() => {
    const rev = monthlyData.reduce((s, m) => s + m.revenue, 0);
    const cogs = monthlyData.reduce((s, m) => s + m.cogs, 0);
    const gross = monthlyData.reduce((s, m) => s + m.grossProfit, 0);
    const opex = monthlyData.reduce((s, m) => s + m.operatingExpenses, 0);
    const net = monthlyData.reduce((s, m) => s + m.netProfit, 0);
    const margin = rev > 0 ? (net / rev) * 100 : 0;
    return { rev, cogs, gross, opex, net, margin };
  }, [monthlyData]);

  // Category-wise Expense Breakdown across the entire selected months
  const expenseBreakdown = useMemo(() => {
    const salesTransport = monthlyData.reduce((s, m) => s + m.salesTransport, 0);
    const salaries = monthlyData.reduce((s, m) => s + m.salaries, 0);
    const utilitiesRent = monthlyData.reduce((s, m) => s + m.utilitiesRent, 0);
    const wastageLoss = monthlyData.reduce((s, m) => s + m.wastageLoss, 0);
    const generalExpenses = monthlyData.reduce((s, m) => s + m.generalExpenses, 0);
    const total = salesTransport + salaries + utilitiesRent + wastageLoss + generalExpenses || 1;

    return [
      { name: 'বিক্রয় পরিবহন (Sales Transport)', shortName: 'পরিবহন', value: salesTransport, percent: (salesTransport / total) * 100, icon: Truck },
      { name: 'শ্রমিক ও কর্মকর্তাদের বেতন (Salaries)', shortName: 'বেতন/HR', value: salaries, percent: (salaries / total) * 100, icon: Users },
      { name: 'ফ্যাক্টরি ও গোডাউন ভাড়া, বিদ্যুৎ (Rent & Utility)', shortName: 'ভাড়া ও বিদ্যুৎ', value: utilitiesRent, percent: (utilitiesRent / total) * 100, icon: Zap },
      { name: 'ফুড ওয়েস্টেজ ও নষ্ট পণ্যের ক্ষতি (Wastage)', shortName: 'ওয়েস্টেজ ক্ষতি', value: wastageLoss, percent: (wastageLoss / total) * 100, icon: Trash2 },
      { name: 'সাধারণ ও রক্ষণাবেক্ষণ ব্যয় (General)', shortName: 'সাধারণ ব্যয়', value: generalExpenses, percent: (generalExpenses / total) * 100, icon: Receipt },
    ].filter(item => item.value > 0);
  }, [monthlyData]);

  // Export handlers
  const handlePrint = () => {
    printDocument('monthly-dashboard-print-area', {
      title: `Monthly_Financial_Trends_${monthsCount}_Months`,
      landscape: true,
    });
  };

  const handleExportPDF = () => {
    exportElementToPDF('monthly-dashboard-print-area', {
      filename: `Monthly_Financial_Trends_${monthsCount}_Months.pdf`,
      orientation: 'landscape',
    });
  };

  const handleSoftReset = () => {
    setMonthsCount(12);
    setChartType('AREA');
    setSelectedMonthModal(null);
  };

  const handleExportCSV = () => {
    const headers = [
      'Month',
      'Start Date',
      'End Date',
      'Net Revenue (BDT)',
      'COGS (BDT)',
      'Gross Profit (BDT)',
      'Total OpEx (BDT)',
      'Sales Transport (BDT)',
      'Salaries (BDT)',
      'Rent & Utilities (BDT)',
      'Wastage Loss (BDT)',
      'General Expense (BDT)',
      'Net Profit / Loss (BDT)',
    ];
    const rows = monthlyData.map(m => [
      m.monthLabel,
      m.startDate,
      m.endDate,
      m.revenue,
      m.cogs,
      m.grossProfit,
      m.operatingExpenses,
      m.salesTransport,
      m.salaries,
      m.utilitiesRent,
      m.wastageLoss,
      m.generalExpenses,
      m.netProfit,
    ]);
    exportToCSV(`Monthly_Financial_Summary_${monthsCount}_Months`, headers, rows);
  };

  const renderMonthlyPerformanceSchedule = () => (
    <div className="space-y-6">
      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {monthsCount} মাসের মোট রেভিনিউ
          </span>
          <div className="text-lg font-black font-mono text-slate-900 mt-1">
            {formatCurrency(periodTotals.rev)}
          </div>
          <span className="text-[10px] text-slate-500">খাদ্যপণ্য নিট বিক্রয়</span>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            মোট উৎপাদন খরচ (COGS)
          </span>
          <div className="text-lg font-black font-mono text-rose-600 mt-1">
            {formatCurrency(periodTotals.cogs)}
          </div>
          <span className="text-[10px] text-slate-500">গ্রস লাভ: {formatCurrency(periodTotals.gross)}</span>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            মোট পরিচালন ব্যয় (OpEx)
          </span>
          <div className="text-lg font-black font-mono text-amber-700 mt-1">
            {formatCurrency(periodTotals.opex)}
          </div>
          <span className="text-[10px] text-slate-500">পরিবহন, বেতন ও অন্যান্য</span>
        </div>

        <div className={`p-3.5 rounded-2xl border ${periodTotals.net >= 0 ? 'bg-emerald-50 border-emerald-300' : 'bg-rose-50 border-rose-300'}`}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            সর্বমোট অর্জিত নিট মুনাফা
          </span>
          <div className={`text-lg font-black font-mono mt-1 ${periodTotals.net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {formatCurrency(periodTotals.net)}
          </div>
          <span className="text-[10px] font-bold text-slate-600">
            মার্জিন: {periodTotals.rev > 0 ? ((periodTotals.net / periodTotals.rev) * 100).toFixed(1) : 0}%
          </span>
        </div>
      </div>

      {/* Detailed Monthly Performance Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <div className="p-4 pb-0"><DataExportToolbar filename="MonthlyDashboardTab_Export" /></div>
<table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white font-bold text-[11px]">
              <th className="py-3 px-3">মাস</th>
              <th className="py-3 px-3 text-right">বিক্রয় রেভিনিউ</th>
              <th className="py-3 px-3 text-right">উৎপাদন খরচ (COGS)</th>
              <th className="py-3 px-3 text-right text-teal-300">গ্রস লাভ</th>
              <th className="py-3 px-3 text-right">পরিচালন ব্যয় (OpEx)</th>
              <th className="py-3 px-3 text-right">নিট লাভ / ক্ষতি</th>
              <th className="py-3 px-3 text-center">মার্জিন %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {monthlyData.map((m) => {
              const isProfit = m.netProfit >= 0;
              const margin = m.revenue > 0 ? (m.netProfit / m.revenue) * 100 : 0;
              return (
                <tr key={m.monthKey} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-slate-900">{m.monthLabel}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {formatDate(m.startDate)} - {formatDate(m.endDate)}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    {formatCurrency(m.revenue)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-rose-600">
                    {formatCurrency(m.cogs)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-teal-800 bg-slate-50/50">
                    {formatCurrency(m.grossProfit)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-amber-700">
                    {formatCurrency(m.operatingExpenses)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-black">
                    <span className={isProfit ? 'text-emerald-700' : 'text-rose-700'}>
                      {formatCurrency(m.netProfit)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] ${margin >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {margin.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
              <td className="py-3 px-3 text-right font-bold">সর্বমোট ({monthsCount} মাস):</td>
              <td className="py-3 px-3 text-right font-mono font-bold">{formatCurrency(periodTotals.rev)}</td>
              <td className="py-3 px-3 text-right font-mono font-bold text-rose-700">{formatCurrency(periodTotals.cogs)}</td>
              <td className="py-3 px-3 text-right font-mono text-teal-900 font-black">{formatCurrency(periodTotals.gross)}</td>
              <td className="py-3 px-3 text-right font-mono font-bold text-amber-800">{formatCurrency(periodTotals.opex)}</td>
              <td className={`py-3 px-3 text-right font-mono font-black ${periodTotals.net >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
                {formatCurrency(periodTotals.net)}
              </td>
              <td className="py-3 px-3 text-center font-mono font-bold text-emerald-800">
                {periodTotals.rev > 0 ? ((periodTotals.net / periodTotals.rev) * 100).toFixed(1) : 0}%
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Control Banner */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              মাসিক আর্থিক গতিধারা ও অ্যানালিটিক্স ড্যাশবোর্ড
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              গত {monthsCount} মাসের রেভিনিউ, অপারেটিং খরচ এবং নিট মুনাফা ট্রেন্ড ও ক্যাটাগরি বিশ্লেষণ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Timeframe selector */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setMonthsCount(6)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  monthsCount === 6 ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                গত ৬ মাস
              </button>
              <button
                onClick={() => setMonthsCount(12)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  monthsCount === 12 ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                গত ১২ মাস
              </button>
            </div>

            {/* Chart type toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setChartType('AREA')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  chartType === 'AREA' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500'
                }`}
              >
                এরিয়া
              </button>
              <button
                onClick={() => setChartType('BAR')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  chartType === 'BAR' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500'
                }`}
              >
                বার
              </button>
            </div>

            <button
              id="btn-monthly-soft-reset"
              onClick={handleSoftReset}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              title="ভিউ ডিফল্টে রিসেট করুন (Soft Reset)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>রিসেট</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              CSV
            </button>

            {/* Dedicated Print View Button */}
            <button
              id="btn-monthly-print-view"
              onClick={() => setShowPrintModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              title="মাসিক আর্থিক রিপোর্ট ও স্টেটমেন্ট প্রিন্ট ভিউ খুলুন"
            >
              <Printer className="w-4 h-4 text-indigo-200" />
              <span>Print View</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Printable Area */}
      <div id="monthly-dashboard-print-area" className="space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {monthsCount} মাসের মোট রেভিনিউ
            </span>
            <div className="text-xl font-black font-mono text-slate-900 mt-1">
              {formatCurrency(periodTotals.rev)}
            </div>
            <span className="text-[10px] text-slate-400">খাদ্যপণ্য নিট বিক্রয়</span>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {monthsCount} মাসের মোট উৎপাদন কস্ট (COGS)
            </span>
            <div className="text-xl font-black font-mono text-rose-600 mt-1">
              {formatCurrency(periodTotals.cogs)}
            </div>
            <span className="text-[10px] text-slate-400">মোট গ্রস লাভ: {formatCurrency(periodTotals.gross)}</span>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              মোট পরিচালন ব্যয় (OpEx)
            </span>
            <div className="text-xl font-black font-mono text-amber-700 mt-1">
              {formatCurrency(periodTotals.opex)}
            </div>
            <span className="text-[10px] text-slate-400">পরিবহন, বেতন, ইউটিলিটি, ওয়েস্টেজ</span>
          </div>

          <div
            className={`p-4 rounded-3xl border ${
              periodTotals.net >= 0
                ? 'bg-emerald-50 border-emerald-300'
                : 'bg-rose-50 border-rose-300'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              সর্বমোট অর্জিত নিট মুনাফা
            </span>
            <div
              className={`text-xl font-black font-mono mt-1 ${
                periodTotals.net >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {formatCurrency(periodTotals.net)}
            </div>
            <span className="text-[10px] font-bold">
              গড় নিট মার্জিন: {periodTotals.margin.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Charts Grid: Multi-series Trend Chart & Expense Donut Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Multi-series Trend Chart (Revenue, Expenses, Net Profit) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  আর্থিক পারফরম্যান্সের মাসিক ট্রেন্ড (Revenue vs OpEx vs Net Profit)
                </h4>
                <p className="text-[11px] text-slate-500">
                  যেকোনো মাসের বিস্তারিত দেখতে নিচে সেই মাসের কার্ডে ক্লিক করুন
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-indigo-600"></span> রেভিনিউ
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-rose-500"></span> পরিচালন ব্যয়
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span> নিট লাভ
                </span>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'AREA' ? (
                  <AreaChart data={monthlyData} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorOpex" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e2e4f' : '#f1f5f9'} />
                    <XAxis
                      dataKey="monthLabel"
                      tick={{ fontSize: 10, fill: theme === 'dark' ? '#94a3b8' : '#64748b' }}
                      angle={-20}
                      textAnchor="end"
                      height={45}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: theme === 'dark' ? '#94a3b8' : '#64748b' }}
                      tickFormatter={v => `৳${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(val: number) => [`৳${val.toLocaleString('en-IN')}`, '']}
                      contentStyle={{
                        backgroundColor: theme === 'dark' ? '#0d1527' : '#ffffff',
                        borderColor: theme === 'dark' ? '#1e2e4f' : '#e2e8f0',
                        color: theme === 'dark' ? '#f8fafc' : '#1e293b',
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.4)',
                      }}
                      labelStyle={{ fontWeight: 'bold', color: theme === 'dark' ? '#38bdf8' : '#1e293b' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="রেভিনিউ"
                      stroke="#4f46e5"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRev)"
                    />
                    <Area
                      type="monotone"
                      dataKey="operatingExpenses"
                      name="পরিচালন ব্যয়"
                      stroke="#f43f5e"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorOpex)"
                    />
                    <Area
                      type="monotone"
                      dataKey="netProfit"
                      name="নিট লাভ"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorNet)"
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={monthlyData} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e2e4f' : '#f1f5f9'} />
                    <XAxis
                      dataKey="monthLabel"
                      tick={{ fontSize: 10, fill: theme === 'dark' ? '#94a3b8' : '#64748b' }}
                      angle={-20}
                      textAnchor="end"
                      height={45}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: theme === 'dark' ? '#94a3b8' : '#64748b' }}
                      tickFormatter={v => `৳${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(val: number) => [`৳${val.toLocaleString('en-IN')}`, '']}
                      contentStyle={{
                        backgroundColor: theme === 'dark' ? '#0d1527' : '#ffffff',
                        borderColor: theme === 'dark' ? '#1e2e4f' : '#e2e8f0',
                        color: theme === 'dark' ? '#f8fafc' : '#1e293b',
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.4)',
                      }}
                      labelStyle={{ fontWeight: 'bold', color: theme === 'dark' ? '#38bdf8' : '#1e293b' }}
                    />
                    <Bar dataKey="revenue" name="রেভিনিউ" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="operatingExpenses" name="পরিচালন ব্যয়" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="netProfit" name="নিট লাভ" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Expense Breakdown Donut Chart */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-indigo-600" />
                পরিচালন ব্যয়ের খাতভিত্তিক বণ্টন (OpEx %)
              </h4>
              <p className="text-[11px] text-slate-500">
                পরিবহন, বেতন, ইউটিলিটি ও ওয়েস্টেজের শতকরা অনুপাত
              </p>
            </div>

            {expenseBreakdown.length > 0 ? (
              <div className="space-y-4">
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {expenseBreakdown.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: number) => [`৳${val.toLocaleString('en-IN')}`, 'মোট ব্যয়']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend Breakdown */}
                <div className="space-y-2 text-xs divide-y divide-slate-100">
                  {expenseBreakdown.map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between pt-1.5 text-slate-700">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: EXPENSE_COLORS[idx % EXPENSE_COLORS.length] }}
                        />
                        <span className="truncate max-w-[150px]">{item.shortName}</span>
                      </div>
                      <div className="font-mono text-right shrink-0">
                        <span className="font-bold text-slate-900">{formatCurrency(item.value)}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5 font-normal">
                          ({item.percent.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-44 flex items-center justify-center text-xs text-slate-400">
                কোনো খরচের রেকর্ড পাওয়া যায়নি
              </div>
            )}
          </div>
        </div>
        
        {/* NEW: Revenue vs Operational Expenses Bar Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                মাসিক রাজস্ব বনাম পরিচালন ব্যয় (Revenue vs Operational Expenses)
              </h4>
              <p className="text-[11px] text-slate-500">
                প্রতি মাসের আয় এবং ব্যয়ের সরাসরি তুলনামূলক বিশ্লেষণ
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-md bg-indigo-600"></span> রাজস্ব (Revenue)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-md bg-rose-500"></span> ব্যয় (Expenses)
              </span>
            </div>
          </div>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e2e4f' : '#f1f5f9'} />
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fontSize: 10, fill: theme === 'dark' ? '#94a3b8' : '#64748b' }}
                  angle={-20}
                  textAnchor="end"
                  height={45}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: theme === 'dark' ? '#94a3b8' : '#64748b' }}
                  tickFormatter={v => `৳${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: number, name: string) => [`৳${val.toLocaleString('en-IN')}`, name === 'revenue' ? 'রাজস্ব' : 'পরিচালন ব্যয়']}
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#0d1527' : '#ffffff',
                    borderColor: theme === 'dark' ? '#1e2e4f' : '#e2e8f0',
                    color: theme === 'dark' ? '#f8fafc' : '#1e293b',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.4)',
                  }}
                  labelStyle={{ fontWeight: 'bold', color: theme === 'dark' ? '#38bdf8' : '#1e293b' }}
                />
                <Bar dataKey="revenue" name="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="operatingExpenses" name="operatingExpenses" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Month Cards Grid (Interactive Drilldown) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                মাসভিত্তিক P&L কার্ড সমূহ (মাসে ক্লিক করে বিস্তারিত দেখুন)
              </h4>
              <p className="text-xs text-slate-500">
                যেকোনো মাসের কার্ডে ক্লিক করলে সরাসরি সেই মাসের সম্পূর্ণ P&L স্টেটমেন্ট ও হিসাব ড্রিল-ডাউন হবে
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">মোট {monthlyData.length} টি মাস</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {monthlyData.map(m => {
              const isProfit = m.netProfit >= 0;
              return (
                <div
                  key={m.monthKey}
                  onClick={() => setSelectedMonthModal(m)}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer bg-slate-50/50 hover:bg-white group"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                    <span className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {m.monthLabel}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                  </div>

                  <div className="pt-2.5 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>রেভিনিউ:</span>
                      <span className="font-mono font-semibold text-slate-900">{formatCurrency(m.revenue)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>পরিচালন ব্যয়:</span>
                      <span className="font-mono text-rose-600">{formatCurrency(m.operatingExpenses)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1.5 border-t border-slate-100">
                      <span className="font-bold text-[11px] text-slate-700">নিট প্রফিট:</span>
                      <span
                        className={`font-mono font-black ${
                          isProfit ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {formatCurrency(m.netProfit)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Month Detail Drilldown Modal */}
      {selectedMonthModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedMonthModal.monthLabel} — বিস্তারিত P&L সারসংক্ষেপ
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500">
                    {selectedMonthModal.startDate} হতে {selectedMonthModal.endDate}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedMonthModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drilldown Steps */}
            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-800">১. নিট বিক্রয় রেভিনিউ</span>
                  <span className="block text-[10px] text-slate-400">খাদ্যপণ্য বিক্রির অর্জিত রাজস্ব</span>
                </div>
                <span className="font-mono font-black text-sm text-slate-900">
                  {formatCurrency(selectedMonthModal.revenue)}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-800">২. উৎপাদন ব্যয় (COGS)</span>
                  <span className="block text-[10px] text-slate-400">কাঁচামাল ও সরাসরি খাদ্য প্রক্রিয়াকরণ</span>
                </div>
                <span className="font-mono font-bold text-rose-600">
                  ({formatCurrency(selectedMonthModal.cogs)})
                </span>
              </div>

              <div className="bg-teal-50/80 p-3 rounded-xl border border-teal-200 flex justify-between items-center">
                <div>
                  <span className="font-bold text-teal-900">৩. অর্জিত গ্রস লাভ (Gross Profit)</span>
                  <span className="block text-[10px] text-teal-700">
                    মার্জিন: {selectedMonthModal.revenue > 0 ? ((selectedMonthModal.grossProfit / selectedMonthModal.revenue) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <span className="font-mono font-black text-sm text-teal-900">
                  {formatCurrency(selectedMonthModal.grossProfit)}
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block">৪. পরিচালন ব্যয়সমূহ (OpEx Breakdown):</span>
                <div className="divide-y divide-slate-200/60 pl-2 text-[11px]">
                  <div className="py-1 flex justify-between text-slate-600">
                    <span>বিক্রয় ও ডেলিভারি পরিবহন:</span>
                    <span className="font-mono">{formatCurrency(selectedMonthModal.salesTransport)}</span>
                  </div>
                  <div className="py-1 flex justify-between text-slate-600">
                    <span>শ্রমিক ও কর্মকর্তাদের বেতন:</span>
                    <span className="font-mono">{formatCurrency(selectedMonthModal.salaries)}</span>
                  </div>
                  <div className="py-1 flex justify-between text-slate-600">
                    <span>ভাড়া, বিদ্যুৎ ও ইউটিলিটি:</span>
                    <span className="font-mono">{formatCurrency(selectedMonthModal.utilitiesRent)}</span>
                  </div>
                  <div className="py-1 flex justify-between text-slate-600">
                    <span>ফুড ওয়েস্টেজ ক্ষতি:</span>
                    <span className="font-mono">{formatCurrency(selectedMonthModal.wastageLoss)}</span>
                  </div>
                  <div className="py-1 flex justify-between text-slate-600">
                    <span>সাধারণ ও রক্ষণাবেক্ষণ:</span>
                    <span className="font-mono">{formatCurrency(selectedMonthModal.generalExpenses)}</span>
                  </div>
                  <div className="pt-1.5 flex justify-between font-bold text-rose-700">
                    <span>মোট পরিচালন ব্যয়:</span>
                    <span className="font-mono">({formatCurrency(selectedMonthModal.operatingExpenses)})</span>
                  </div>
                </div>
              </div>

              {/* Net Profit Banner */}
              <div
                className={`p-4 rounded-2xl border-2 flex items-center justify-between ${
                  selectedMonthModal.netProfit >= 0
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                    : 'bg-rose-50 border-rose-400 text-rose-900'
                }`}
              >
                <div>
                  <span className="font-black text-xs uppercase tracking-wider block">
                    ৫. কর পূর্ববর্তী নিট মুনাফা / ক্ষতি
                  </span>
                  <span className="text-[11px] font-mono">
                    নিট মার্জিন:{' '}
                    {selectedMonthModal.revenue > 0
                      ? ((selectedMonthModal.netProfit / selectedMonthModal.revenue) * 100).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
                <div className="text-xl font-black font-mono">
                  {formatCurrency(selectedMonthModal.netProfit)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              {onDrillDownToMonth && (
                <button
                  onClick={() => {
                    const start = selectedMonthModal.startDate;
                    const end = selectedMonthModal.endDate;
                    setSelectedMonthModal(null);
                    onDrillDownToMonth(start, end);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span>পূর্ণাঙ্গ স্টেটমেন্ট ট্যাবে খুলুন</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setSelectedMonthModal(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printer-Friendly Report Print Modal */}
      <ReportPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        title="মাসিক আর্থিক গতিধারা ও পারফরম্যান্স স্টেটমেন্ট"
        subtitle={`গত ${monthsCount} মাসের তুলনামূলক উৎপাদন, পরিচালন ব্যয় ও নিট মুনাফা পর্যালোচনা`}
        periodLabel={`বিশ্লেষণ সময়কাল: গত ${monthsCount} মাস (${monthlyData[0]?.monthLabel || ''} — ${monthlyData[monthlyData.length - 1]?.monthLabel || ''})`}
        documentId="monthly-trends-report-print-sheet"
        landscape={true}
      >
        {renderMonthlyPerformanceSchedule()}
      </ReportPrintModal>
    </div>
  );
};
