import React, { useState, useMemo } from 'react';
import { DataExportToolbar } from '../../../components/common/DataExportToolbar';
import { useERP } from '../../../context/ERPContext';
import { formatCurrency, formatDate, exportToCSV } from '../../../utils/formatters';
import { printDocument, exportElementToPDF } from '../../../utils/printPdfUtils';
import { ReportPeriodPreset } from './types';
import { ReportPrintModal } from '../../common/ReportPrintModal';
import {
  getDateRangeFromPreset,
  calculateDetailedPnL,
  calculatePnLComparison,
} from './reportUtils';
import { exportToGoogleSheets } from '../../../services/googleSheetsService';
import {
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Printer,
  Download,
  FileSpreadsheet,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Info,
  DollarSign,
  Scale,
  Percent,
  Layers,
  HelpCircle,
  Truck,
  Users,
  Zap,
  Trash2,
  Receipt,
  Eye,
  RotateCcw,
} from 'lucide-react';

interface Props {
  initialStartDate?: string;
  initialEndDate?: string;
}

export const PnLStatementTab: React.FC<Props> = ({
  initialStartDate,
  initialEndDate,
}) => {
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
  } = useERP();

  // Preset & Custom dates for Period 1
  const [p1Preset, setP1Preset] = useState<ReportPeriodPreset>('THIS_MONTH');
  const [p1Start, setP1Start] = useState<string>(() => {
    if (initialStartDate) return initialStartDate;
    return getDateRangeFromPreset('THIS_MONTH').startDate;
  });
  const [p1End, setP1End] = useState<string>(() => {
    if (initialEndDate) return initialEndDate;
    return getDateRangeFromPreset('THIS_MONTH').endDate;
  });

  // Comparison mode toggle & Period 2 settings
  const [comparisonMode, setComparisonMode] = useState<boolean>(false);
  const [p2Preset, setP2Preset] = useState<ReportPeriodPreset>('LAST_MONTH');
  const [p2Start, setP2Start] = useState<string>(() => {
    return getDateRangeFromPreset('LAST_MONTH').startDate;
  });
  const [p2End, setP2End] = useState<string>(() => {
    return getDateRangeFromPreset('LAST_MONTH').endDate;
  });

  // Dedicated Print View Modal state
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [isExportingSheet, setIsExportingSheet] = useState<boolean>(false);

  // When P1 preset changes
  const handleP1PresetChange = (preset: ReportPeriodPreset) => {
    setP1Preset(preset);
    if (preset !== 'CUSTOM') {
      const { startDate, endDate } = getDateRangeFromPreset(preset);
      setP1Start(startDate);
      setP1End(endDate);
    }
  };

  // When P2 preset changes
  const handleP2PresetChange = (preset: ReportPeriodPreset) => {
    setP2Preset(preset);
    if (preset !== 'CUSTOM') {
      const { startDate, endDate } = getDateRangeFromPreset(preset);
      setP2Start(startDate);
      setP2End(endDate);
    }
  };

  // Compute Period 1 P&L
  const p1Data = useMemo(() => {
    return calculateDetailedPnL({
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
      startDate: p1Start,
      endDate: p1End,
      label: p1Preset === 'CUSTOM' ? `${p1Start} হতে ${p1End}` : getDateRangeFromPreset(p1Preset).label,
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
    p1Start,
    p1End,
    p1Preset,
  ]);

  // Compute Period 2 P&L (if comparison active)
  const p2Data = useMemo(() => {
    if (!comparisonMode) return null;
    return calculateDetailedPnL({
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
      startDate: p2Start,
      endDate: p2End,
      label: p2Preset === 'CUSTOM' ? `${p2Start} হতে ${p2End}` : getDateRangeFromPreset(p2Preset).label,
    });
  }, [
    comparisonMode,
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
    p2Start,
    p2End,
    p2Preset,
  ]);

  // Comparison line items
  const comparisonItems = useMemo(() => {
    if (!comparisonMode || !p2Data) return [];
    return calculatePnLComparison(p1Data, p2Data);
  }, [comparisonMode, p1Data, p2Data]);

  // Export handlers
  const handlePrint = () => {
    printDocument('pnl-statement-print-sheet', {
      title: `Profit_Loss_Statement_${p1Start}_to_${p1End}`,
      landscape: comparisonMode,
    });
  };

  const handleExportPDF = () => {
    exportElementToPDF('pnl-statement-print-sheet', {
      filename: `Profit_Loss_Statement_${p1Start}_to_${p1End}.pdf`,
      orientation: comparisonMode ? 'landscape' : 'portrait',
    });
  };

  const handleSoftReset = () => {
    setP1Preset('THIS_MONTH');
    const { startDate, endDate } = getDateRangeFromPreset('THIS_MONTH');
    setP1Start(startDate);
    setP1End(endDate);
    setComparisonMode(false);
    setP2Preset('LAST_MONTH');
    const p2Range = getDateRangeFromPreset('LAST_MONTH');
    setP2Start(p2Range.startDate);
    setP2End(p2Range.endDate);
  };

  const handleExportCSV = () => {
    if (comparisonMode && p2Data) {
      const headers = [
        'Line Item',
        `Period 1 (${p1Start} to ${p1End})`,
        `Period 2 (${p2Start} to ${p2End})`,
        'Difference (BDT)',
        'Change (%)',
      ];
      const rows = comparisonItems.map(item => [
        item.labelEnglish,
        item.period1Value,
        item.period2Value,
        item.difference,
        `${item.percentChange.toFixed(2)}%`,
      ]);
      exportToCSV(`PnL_Comparison_${p1Start}_vs_${p2Start}`, headers, rows);
    } else {
      const headers = ['Accounting Step', 'Line Item Description', 'Amount (BDT)', '% of Net Revenue'];
      const net = p1Data.netSales || 1;
      const rows = [
        ['1. Revenue', 'Gross Food Sales Revenue', p1Data.grossSales, `${((p1Data.grossSales / net) * 100).toFixed(1)}%`],
        ['1. Revenue', 'Less: Sales Discounts', p1Data.discountTotal, `${((p1Data.discountTotal / net) * 100).toFixed(1)}%`],
        ['1. Revenue', 'Net Sales Revenue', p1Data.netSales, '100.0%'],
        ['2. COGS', 'Cost of Goods Sold (Production Cost)', p1Data.totalCOGS, `${((p1Data.totalCOGS / net) * 100).toFixed(1)}%`],
        ['3. Gross Profit', 'Gross Operating Profit', p1Data.grossProfit, `${p1Data.grossMarginPercent.toFixed(1)}%`],
        ['4. OpEx', 'Sales & Delivery Transport', p1Data.operatingExpenses.salesTransport, `${((p1Data.operatingExpenses.salesTransport / net) * 100).toFixed(1)}%`],
        ['4. OpEx', `Staff Salaries (${p1Data.operatingExpenses.salaryMode})`, p1Data.operatingExpenses.salaries, `${((p1Data.operatingExpenses.salaries / net) * 100).toFixed(1)}%`],
        ['4. OpEx', 'Factory Rent & Utilities', p1Data.operatingExpenses.utilitiesRent, `${((p1Data.operatingExpenses.utilitiesRent / net) * 100).toFixed(1)}%`],
        ['4. OpEx', 'Wastage & Spoilage Loss', p1Data.operatingExpenses.wastageLoss, `${((p1Data.operatingExpenses.wastageLoss / net) * 100).toFixed(1)}%`],
        ['4. OpEx', 'General & Maintenance Expenses', p1Data.operatingExpenses.generalExpenses, `${((p1Data.operatingExpenses.generalExpenses / net) * 100).toFixed(1)}%`],
        ['4. OpEx', 'Total Operating Expenses', p1Data.operatingExpenses.total, `${((p1Data.operatingExpenses.total / net) * 100).toFixed(1)}%`],
        ['5. Net Profit', 'Net Operating Profit / Loss', p1Data.netProfit, `${p1Data.netMarginPercent.toFixed(1)}%`],
        ['Memo Item', 'Purchase Transport Tracking (Non-OpEx)', p1Data.memo.purchaseTransportTracking, 'Memo'],
        ['Memo Item', 'Owner Capital Withdrawals (Non-OpEx)', p1Data.memo.ownerWithdrawals, 'Memo'],
      ];
      exportToCSV(`Profit_Loss_Statement_${p1Start}_to_${p1End}`, headers, rows);
    }
  };

  const handleExportToGoogleSheets = async () => {
    setIsExportingSheet(true);
    try {
      let headers: string[];
      let rows: any[][];
      let title: string;
      
      if (comparisonMode && p2Data) {
        title = `PnL_Comparison_${p1Start}_vs_${p2Start}`;
        headers = [
          'Line Item',
          `Period 1 (${p1Start} to ${p1End})`,
          `Period 2 (${p2Start} to ${p2End})`,
          'Difference (BDT)',
          'Change (%)',
        ];
        rows = comparisonItems.map(item => [
          item.labelEnglish,
          item.period1Value,
          item.period2Value,
          item.difference,
          `${item.percentChange.toFixed(2)}%`,
        ]);
      } else {
        title = `Profit_Loss_Statement_${p1Start}_to_${p1End}`;
        headers = ['Accounting Step', 'Line Item Description', 'Amount (BDT)', '% of Net Revenue'];
        const net = p1Data.netSales || 1;
        rows = [
          ['1. Revenue', 'Gross Food Sales Revenue', p1Data.grossSales, `${((p1Data.grossSales / net) * 100).toFixed(1)}%`],
          ['1. Revenue', 'Less: Sales Discounts', p1Data.discountTotal, `${((p1Data.discountTotal / net) * 100).toFixed(1)}%`],
          ['1. Revenue', 'Net Sales Revenue', p1Data.netSales, '100.0%'],
          ['2. COGS', 'Cost of Goods Sold (Production Cost)', p1Data.totalCOGS, `${((p1Data.totalCOGS / net) * 100).toFixed(1)}%`],
          ['3. Gross Profit', 'Gross Operating Profit', p1Data.grossProfit, `${p1Data.grossMarginPercent.toFixed(1)}%`],
          ['4. OpEx', 'Sales & Delivery Transport', p1Data.operatingExpenses.salesTransport, `${((p1Data.operatingExpenses.salesTransport / net) * 100).toFixed(1)}%`],
          ['4. OpEx', `Staff Salaries (${p1Data.operatingExpenses.salaryMode})`, p1Data.operatingExpenses.salaries, `${((p1Data.operatingExpenses.salaries / net) * 100).toFixed(1)}%`],
          ['4. OpEx', 'Factory Rent & Utilities', p1Data.operatingExpenses.utilitiesRent, `${((p1Data.operatingExpenses.utilitiesRent / net) * 100).toFixed(1)}%`],
          ['4. OpEx', 'Wastage & Spoilage Loss', p1Data.operatingExpenses.wastageLoss, `${((p1Data.operatingExpenses.wastageLoss / net) * 100).toFixed(1)}%`],
          ['4. OpEx', 'General & Maintenance Expenses', p1Data.operatingExpenses.generalExpenses, `${((p1Data.operatingExpenses.generalExpenses / net) * 100).toFixed(1)}%`],
          ['4. OpEx', 'Total Operating Expenses', p1Data.operatingExpenses.total, `${((p1Data.operatingExpenses.total / net) * 100).toFixed(1)}%`],
          ['5. Net Profit', 'Net Operating Profit / Loss', p1Data.netProfit, `${p1Data.netMarginPercent.toFixed(1)}%`],
          ['Memo Item', 'Purchase Transport Tracking (Non-OpEx)', p1Data.memo.purchaseTransportTracking, 'Memo'],
          ['Memo Item', 'Owner Capital Withdrawals (Non-OpEx)', p1Data.memo.ownerWithdrawals, 'Memo'],
        ];
      }
      
      const url = await exportToGoogleSheets(title, headers, rows);
      alert(`Google Sheet-এ সফলভাবে এক্সপোর্ট হয়েছে!\n\nLink: ${url}`);
      window.open(url, '_blank');
    } catch (err: any) {
      alert(err.message || 'Google Sheets এক্সপোর্ট ব্যর্থ হয়েছে। সেটিংস থেকে Google Drive কানেক্ট করা আছে কি না যাচাই করুন।');
    } finally {
      setIsExportingSheet(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Card (Filters, Presets, Comparison Mode, Actions) */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Scale className="w-5 h-5 text-indigo-600" />
              প্রফিট অ্যান্ড লস (P&L) প্যারামিটার ও বিশ্লেষণ
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              আন্তর্জাতিক অ্যাকাউন্টিং স্ট্যান্ডার্ড অনুযায়ী মাল্টি-স্টেপ সিঁড়ি ফরম্যাট ও পিরিয়ড তুলনা
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-pnl-soft-reset"
              onClick={handleSoftReset}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              title="ফিল্টার ও পিরিয়ড ডিফল্টে ফিরিয়ে আনুন (Soft Reset)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>রিসেট ফিল্টার</span>
            </button>

            <button
              onClick={() => setComparisonMode(!comparisonMode)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                comparisonMode
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Layers className="w-4 h-4" />
              {comparisonMode ? 'তুলনা মোড বন্ধ করুন' : 'তুলনামূলক বিশ্লেষণ (Compare)'}
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              title="CSV/Excel ফরম্যাটে ডাউনলোড"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Excel/CSV
            </button>

            <button
              onClick={handleExportToGoogleSheets}
              disabled={isExportingSheet}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-green-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              title="Google Sheets-এ এক্সপোর্ট করুন"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
              {isExportingSheet ? 'এক্সপোর্ট হচ্ছে...' : 'Google Sheets'}
            </button>

            {/* Dedicated Print View Button */}
            <button
              id="btn-pnl-print-view"
              onClick={() => setShowPrintModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              title="প্রিন্টার-বান্ধব পূর্ণাঙ্গ প্রিন্ট ভিউ লেআউট খুলুন"
            >
              <Printer className="w-4 h-4 text-indigo-200" />
              <span>Print View</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              title="অডিটেড PDF ডাউনলোড করুন"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              PDF ডাউনলোড
            </button>
          </div>
        </div>

        {/* Date Presets and Selectors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          {/* Period 1 (Main Period) */}
          <div className="space-y-2 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                প্রধান সময়কাল (Period 1)
              </span>
              <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200/60">
                {p1Start} হতে {p1End}
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ['TODAY', 'আজ'],
                  ['THIS_WEEK', 'চলতি সপ্তাহ'],
                  ['THIS_MONTH', 'চলতি মাস'],
                  ['LAST_MONTH', 'গত মাস'],
                  ['THIS_QUARTER', 'ত্রৈমাসিক'],
                  ['THIS_YEAR', 'চলতি বছর'],
                  ['ALL', 'সর্বকালের'],
                ] as [ReportPeriodPreset, string][]
              ).map(([preset, label]) => (
                <button
                  key={preset}
                  onClick={() => handleP1PresetChange(preset)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all ${
                    p1Preset === preset
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Custom Range Inputs */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                  হতে (From Date)
                </label>
                <input
                  type="date"
                  value={p1Start}
                  onChange={e => {
                    setP1Start(e.target.value);
                    setP1Preset('CUSTOM');
                  }}
                  className="w-full text-xs font-mono px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                  পর্যন্ত (To Date)
                </label>
                <input
                  type="date"
                  value={p1End}
                  onChange={e => {
                    setP1End(e.target.value);
                    setP1Preset('CUSTOM');
                  }}
                  className="w-full text-xs font-mono px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Period 2 (Comparison Period) - only visible if comparisonMode is active */}
          {comparisonMode ? (
            <div className="space-y-2 bg-amber-50/50 p-3.5 rounded-2xl border border-amber-200 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  তুলনামূলক সময়কাল (Period 2 - Comparison)
                </span>
                <span className="text-[11px] font-mono text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-lg border border-amber-300/60">
                  {p2Start} হতে {p2End}
                </span>
              </div>

              {/* Quick Presets for Period 2 */}
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    ['LAST_MONTH', 'গত মাস'],
                    ['THIS_MONTH', 'চলতি মাস'],
                    ['THIS_QUARTER', 'ত্রৈমাসিক'],
                    ['THIS_YEAR', 'চলতি বছর'],
                    ['ALL', 'সমস্ত'],
                  ] as [ReportPeriodPreset, string][]
                ).map(([preset, label]) => (
                  <button
                    key={preset}
                    onClick={() => handleP2PresetChange(preset)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all ${
                      p2Preset === preset
                        ? 'bg-amber-600 text-white font-bold'
                        : 'bg-white text-slate-600 hover:bg-amber-100/70 border border-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Custom Range Inputs for Period 2 */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                    হতে (From Date)
                  </label>
                  <input
                    type="date"
                    value={p2Start}
                    onChange={e => {
                      setP2Start(e.target.value);
                      setP2Preset('CUSTOM');
                    }}
                    className="w-full text-xs font-mono px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                    পর্যন্ত (To Date)
                  </label>
                  <input
                    type="date"
                    value={p2End}
                    onChange={e => {
                      setP2End(e.target.value);
                      setP2Preset('CUSTOM');
                    }}
                    className="w-full text-xs font-mono px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center p-6 bg-slate-50/40 rounded-2xl border border-dashed border-slate-200 text-center">
              <div className="space-y-1">
                <Info className="w-5 h-5 text-slate-400 mx-auto" />
                <div className="text-xs font-semibold text-slate-600">
                  তুলনামূলক বিশ্লেষণ করতে চান?
                </div>
                <p className="text-[11px] text-slate-400 max-w-xs">
                  উপরে &ldquo;তুলনামূলক বিশ্লেষণ&rdquo; বাটনে ক্লিক করে পাশাপাশি দুই মাসের আয়-ব্যয় ও প্রবৃদ্ধির হার দেখুন।
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Printable Financial Statement Card */}
      <div
        id="pnl-statement-print-sheet"
        className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 md:p-8 space-y-6"
      >
        {/* Corporate Letterhead Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b-2 border-slate-900">
          <div className="flex items-center gap-3.5">
            {settings.companyLogo ? (
              <img
                src={settings.companyLogo}
                alt="Logo"
                className="w-14 h-14 object-contain rounded-xl border border-slate-200 p-1"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-13 h-13 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md border border-indigo-500">
                {settings.companyNameEnglish ? settings.companyNameEnglish.charAt(0) : 'E'}
              </div>
            )}
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {settings.companyNameBangla}
              </h1>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {settings.companyNameEnglish}
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5 max-w-md leading-relaxed">
                {settings.address} | ফোন: {settings.phone} {settings.email ? `| ইমেইল: ${settings.email}` : ''}
              </p>
              {(settings.taxNumber || settings.tradeLicense) && (
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  {settings.taxNumber ? `BIN/TIN: ${settings.taxNumber}` : ''}
                  {settings.taxNumber && settings.tradeLicense ? ' | ' : ''}
                  {settings.tradeLicense ? `ট্রেড লাইসেন্স: ${settings.tradeLicense}` : ''}
                </p>
              )}
            </div>
          </div>

          <div className="sm:text-right bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-slate-200 w-full sm:w-auto">
            <span className="inline-block px-3 py-1 bg-indigo-900 text-white text-[11px] font-bold uppercase tracking-widest rounded-md mb-1.5">
              {comparisonMode ? 'COMPARATIVE PROFIT & LOSS STATEMENT' : 'PROFIT & LOSS STATEMENT'}
            </span>
            <div className="font-mono text-xs text-slate-700">
              <span className="text-slate-500">রিপোর্ট পিরিয়ড:</span>{' '}
              <span className="font-bold text-slate-900">
                {formatDate(p1Start)} হতে {formatDate(p1End)}
              </span>
            </div>
            {comparisonMode && p2Data && (
              <div className="font-mono text-xs text-amber-800">
                <span className="text-slate-500">তুলনার পিরিয়ড:</span>{' '}
                <span className="font-bold">
                  {formatDate(p2Start)} হতে {formatDate(p2End)}
                </span>
              </div>
            )}
            <div className="font-mono text-[11px] text-slate-500 mt-0.5">
              প্রস্তুত সময়: {formatDate(new Date().toISOString())} {new Date().toLocaleTimeString('bn-BD')}
            </div>
          </div>
        </div>

        {/* Quick KPI Banner (Period 1 Highlights) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              নিট বিক্রয় রাজস্ব (Net Sales)
            </span>
            <div className="text-lg font-black font-mono text-slate-900 mt-0.5">
              {formatCurrency(p1Data.netSales)}
            </div>
            <span className="text-[10px] text-slate-500">গ্রস বিক্রয়: {formatCurrency(p1Data.grossSales)}</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              গ্রস প্রফিট মার্জিন
            </span>
            <div className="text-lg font-black font-mono text-teal-700 mt-0.5">
              {p1Data.grossMarginPercent.toFixed(1)}%
            </div>
            <span className="text-[10px] text-slate-500">মোট গ্রস লাভ: {formatCurrency(p1Data.grossProfit)}</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              মোট পরিচালন ব্যয় (OpEx)
            </span>
            <div className="text-lg font-black font-mono text-rose-600 mt-0.5">
              {formatCurrency(p1Data.operatingExpenses.total)}
            </div>
            <span className="text-[10px] text-slate-500">রেভিনিউ-এর {((p1Data.operatingExpenses.total / (p1Data.netSales || 1)) * 100).toFixed(1)}%</span>
          </div>

          <div
            className={`p-3.5 rounded-2xl border ${
              p1Data.netProfit >= 0
                ? 'bg-emerald-50 border-emerald-300'
                : 'bg-rose-50 border-rose-300'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              নিট মুনাফা / ক্ষতি (Net Profit)
            </span>
            <div
              className={`text-lg font-black font-mono mt-0.5 ${
                p1Data.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {formatCurrency(p1Data.netProfit)}
            </div>
            <span className="text-[10px] font-bold">
              নিট মার্জিন: {p1Data.netMarginPercent.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* COMPARISON VIEW TABLE (When comparison mode is active) */}
        {comparisonMode && p2Data ? (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <div className="p-4 pb-0"><DataExportToolbar filename="PnLStatementTab_Export" /></div>
<table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold text-[11px] tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">ক্রম</th>
                    <th className="py-3 px-4">হিসাবের বিবরণী (Line Item)</th>
                    <th className="py-3 px-4 text-right">
                      {p1Preset === 'CUSTOM' ? 'পিরিয়ড ১' : getDateRangeFromPreset(p1Preset).label}
                      <span className="block text-[9px] font-normal text-slate-300 font-mono">
                        {p1Start} – {p1End}
                      </span>
                    </th>
                    <th className="py-3 px-4 text-right bg-slate-800">
                      {p2Preset === 'CUSTOM' ? 'পিরিয়ড ২' : getDateRangeFromPreset(p2Preset).label}
                      <span className="block text-[9px] font-normal text-slate-300 font-mono">
                        {p2Start} – {p2End}
                      </span>
                    </th>
                    <th className="py-3 px-4 text-right">পার্থক্য (Change ৳)</th>
                    <th className="py-3 px-4 text-center">প্রবৃদ্ধি (% Growth)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {comparisonItems.map((item, idx) => {
                    const isPositive = item.difference >= 0;
                    // Determine if the change is favorable or unfavorable
                    const isGood = item.isPositiveGood ? isPositive : !isPositive;

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          item.isTotal
                            ? 'bg-slate-100/80 font-bold'
                            : item.isHeader
                            ? 'bg-slate-50 font-bold'
                            : 'hover:bg-slate-50/50'
                        } ${item.id === 'net_profit' ? (item.period1Value >= 0 ? 'bg-emerald-50/80' : 'bg-rose-50/80') : ''}`}
                      >
                        <td className="py-2.5 px-4 text-center font-mono text-slate-500 text-[11px]">
                          {item.stepNumber}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className={`${item.isSubItem ? 'pl-5' : ''}`}>
                            <span className={`${item.isTotal || item.isHeader ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                              {item.labelBangla}
                            </span>
                            <span className="block text-[10px] text-slate-400 font-normal">
                              {item.labelEnglish}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(item.period1Value)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-700 bg-slate-50/60">
                          {formatCurrency(item.period2Value)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono">
                          <span
                            className={
                              item.difference === 0
                                ? 'text-slate-500'
                                : isGood
                                ? 'text-emerald-700 font-bold'
                                : 'text-rose-700 font-bold'
                            }
                          >
                            {item.difference > 0 ? '+' : ''}
                            {formatCurrency(item.difference)}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {item.difference === 0 ? (
                            <span className="text-slate-400 text-[11px] font-mono">০.০%</span>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                                isGood
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {item.percentChange > 0 ? (
                                <ArrowUpRight className="w-3 h-3" />
                              ) : (
                                <ArrowDownRight className="w-3 h-3" />
                              )}
                              {Math.abs(item.percentChange).toFixed(1)}%
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* STANDARD MULTI-STEP STAIRCASE P&L FORMAT */
          <div className="space-y-4 text-xs">
            {/* Step 1: Revenue */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="bg-slate-100 px-4 py-2.5 font-bold text-slate-800 flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center text-[10px] font-mono">
                    ১
                  </span>
                  বিক্রয় রেভিনিউ (Operating Revenue / Sales Turnover)
                </span>
                <span className="font-mono text-slate-500 text-[11px]">টাকা (৳)</span>
              </div>
              <div className="divide-y divide-slate-100 px-4 py-1">
                <div className="py-2 flex justify-between text-slate-700 pl-6">
                  <span>গ্রস খাদ্যপণ্য বিক্রয় রাজস্ব (Gross Sales)</span>
                  <span className="font-mono font-semibold">{formatCurrency(p1Data.grossSales)}</span>
                </div>
                {p1Data.discountTotal > 0 && (
                  <div className="py-2 flex justify-between text-slate-600 pl-6">
                    <span className="flex items-center gap-1.5">
                      <span className="text-rose-600 font-bold">(−)</span>
                      বিক্রয় কমিশন ও ইনভয়েস ছাড় (Discounts & Rebates)
                    </span>
                    <span className="font-mono text-rose-600">({formatCurrency(p1Data.discountTotal)})</span>
                  </div>
                )}
                <div className="py-2.5 flex justify-between items-center font-bold text-slate-900 bg-slate-50/80 px-2 rounded-xl">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                    নিট বিক্রয় রাজস্ব (Net Sales Turnover)
                  </span>
                  <span className="font-mono text-sm font-black text-slate-900">
                    {formatCurrency(p1Data.netSales)}
                  </span>
                </div>
              </div>
            </div>

            {/* Step 2: Cost of Goods Sold (COGS) */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="bg-slate-100 px-4 py-2.5 font-bold text-slate-800 flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-rose-600 text-white flex items-center justify-center text-[10px] font-mono">
                    ২
                  </span>
                  (−) বিক্রীত পণ্যের উৎপাদন ব্যয় (Cost of Goods Sold - COGS)
                </span>
                <span className="font-mono text-slate-500 text-[11px]">উৎপাদন কস্ট</span>
              </div>
              <div className="divide-y divide-slate-100 px-4 py-1">
                <div className="py-2 flex justify-between text-slate-700 pl-6">
                  <div>
                    <span>বিক্রিত খাদ্যের কাঁচামাল, রেসিপি বোম ও সরাসরি উৎপাদন প্রক্রিয়াকরণ ব্যয়</span>
                    <span className="block text-[10px] text-slate-400">
                      Calculated from actual production runs, BOM formulation, and sold inventory cost
                    </span>
                  </div>
                  <span className="font-mono font-semibold text-rose-600">
                    ({formatCurrency(p1Data.totalCOGS)})
                  </span>
                </div>

                {/* Gross Profit Callout */}
                <div className="py-2.5 flex justify-between items-center font-bold text-teal-900 bg-teal-50/80 px-2 rounded-xl border border-teal-200/60">
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-teal-600 text-white flex items-center justify-center text-[10px] font-mono">
                      ৩
                    </span>
                    = মোট ব্যবসায়িক লাভ (Gross Operating Profit)
                  </span>
                  <div className="text-right">
                    <span className="font-mono text-sm font-black">{formatCurrency(p1Data.grossProfit)}</span>
                    <span className="block text-[10px] text-teal-700 font-mono">
                      মার্জিন: {p1Data.grossMarginPercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Operating Expenses (OpEx) Breakdown */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="bg-slate-100 px-4 py-2.5 font-bold text-slate-800 flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-rose-600 text-white flex items-center justify-center text-[10px] font-mono">
                    ৪
                  </span>
                  (−) পরিচালন ব্যয়সমূহ (Operating Expenses - OpEx)
                </span>
                <span className="font-mono text-slate-500 text-[11px]">ক্যাটাগরি ভিত্তিক</span>
              </div>
              <div className="divide-y divide-slate-100 px-4 py-1">
                {/* 1. Sales Transport */}
                <div className="py-2 flex justify-between items-center text-slate-700 pl-6">
                  <div className="flex items-center gap-2">
                    <Truck className="w-3.5 h-3.5 text-indigo-500" />
                    <div>
                      <span>পণ্য বিক্রয় ও ডেলিভারি পরিবহন (Sales Delivery Transport)</span>
                      <span className="block text-[10px] text-slate-400">
                        কাস্টমার ডেলিভারি ট্রিপ, গাড়ির ফুয়েল ও টোল খরচ
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-semibold text-rose-600">
                    {formatCurrency(p1Data.operatingExpenses.salesTransport)}
                  </span>
                </div>

                {/* 2. Salary/HR */}
                <div className="py-2 flex justify-between items-center text-slate-700 pl-6">
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    <div>
                      <span>
                        শ্রমিক ও কর্মকর্তাদের বেতন (Salaries & Payroll)
                        <span className="ml-2 text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                          {p1Data.operatingExpenses.salaryMode === 'AUTOMATIC' ? 'অটো পে-রোল মোড' : 'ম্যানুয়াল পে-রোল মোড'}
                        </span>
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        কারখানা শ্রমিক মজুরি, অফিস স্টাফ ও ফিল্ড অফিসারদের সম্মানী
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-semibold text-rose-600">
                    {formatCurrency(p1Data.operatingExpenses.salaries)}
                  </span>
                </div>

                {/* 3. Utilities & Rent */}
                <div className="py-2 flex justify-between items-center text-slate-700 pl-6">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <div>
                      <span>মাসিক বিদ্যুৎ, কারখানা ও গোডাউন ভাড়া (Factory Rent & Utilities)</span>
                      <span className="block text-[10px] text-slate-400">
                        কারখানা বিদ্যুৎ, গ্যাস, ওয়াসা ও গুদাম ভাড়া বিল
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-semibold text-rose-600">
                    {formatCurrency(p1Data.operatingExpenses.utilitiesRent)}
                  </span>
                </div>

                {/* 4. Wastage / Spoilage Loss */}
                <div className="py-2 flex justify-between items-center text-slate-700 pl-6">
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <div>
                      <span>ওয়েস্টেজ ও নষ্ট পণ্যের আর্থিক ক্ষতি (Wastage / Production Loss)</span>
                      <span className="block text-[10px] text-slate-400">
                        মেয়াদোত্তীর্ণ, ক্ষতিগ্রস্ত, কোয়ালিটি রিজেক্টেড কাঁচামাল ও ফিনিশড ফুড
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-semibold text-rose-600">
                    {formatCurrency(p1Data.operatingExpenses.wastageLoss)}
                  </span>
                </div>

                {/* 5. General Expenses */}
                <div className="py-2 flex justify-between items-center text-slate-700 pl-6">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-3.5 h-3.5 text-slate-500" />
                    <div>
                      <span>অন্যান্য সাধারণ ও কারখানা মেরামত ব্যয় (General & Maintenance)</span>
                      <span className="block text-[10px] text-slate-400">
                        মেশিনারিজ স্পেয়ার পার্টস, স্টেশনারি, আপ্যায়ন ও বিবিধ কারখানা ব্যয়
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-semibold text-rose-600">
                    {formatCurrency(p1Data.operatingExpenses.generalExpenses)}
                  </span>
                </div>

                {/* Total OpEx Callout */}
                <div className="py-2.5 flex justify-between items-center font-bold text-rose-900 bg-rose-50/80 px-2 rounded-xl border border-rose-200/60">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                    মোট পরিচালন ব্যয় (Total Operating Expenses)
                  </span>
                  <span className="font-mono text-sm font-black text-rose-700">
                    ({formatCurrency(p1Data.operatingExpenses.total)})
                  </span>
                </div>
              </div>
            </div>

            {/* Step 4: Net Profit / Net Loss Banner */}
            <div
              className={`p-6 rounded-3xl border-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm ${
                p1Data.netProfit >= 0
                  ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-emerald-400'
                  : 'bg-gradient-to-r from-rose-50 via-orange-50 to-rose-50 border-rose-400'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-7 h-7 rounded-xl text-white flex items-center justify-center font-mono font-bold text-xs ${
                      p1Data.netProfit >= 0 ? 'bg-emerald-600' : 'bg-rose-600'
                    }`}
                  >
                    ৫
                  </span>
                  <span className="text-sm font-black tracking-wide text-slate-900 uppercase">
                    কর পূর্ববর্তী নিট ব্যবসায়িক মুনাফা / ক্ষতি (Net Operating Profit / Loss)
                  </span>
                </div>
                <p className="text-xs text-slate-600 pl-9">
                  গ্রস লাভ থেকে সর্বমোট পরিচালন ব্যয় বাদ দিয়ে প্রকৃত ব্যবসায়িক অর্জিত আয়
                </p>
                <div className="pl-9 pt-1 flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-700">
                    নিট মুনাফা মার্জিন:
                  </span>
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                      p1Data.netProfit >= 0
                        ? 'bg-emerald-200/80 text-emerald-900'
                        : 'bg-rose-200/80 text-rose-900'
                    }`}
                  >
                    {p1Data.netMarginPercent.toFixed(2)}%
                  </span>
                </div>
              </div>

              <div className="sm:text-right w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                <div className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                  {p1Data.netProfit >= 0 ? 'মোট নিট লাভ' : 'মোট নিট ক্ষতি'}
                </div>
                <div
                  className={`text-2xl sm:text-3xl font-black font-mono tracking-tight mt-0.5 ${
                    p1Data.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {formatCurrency(p1Data.netProfit)}
                </div>
              </div>
            </div>

            {/* MEMO / NON-OPEX ITEMS (Clarified per user instructions) */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>মেমো / অ-পরিচালন হিসাব রেফারেন্স (Memo & Balance Sheet Items):</span>
                <span className="text-[10px] font-normal text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  নোট: এগুলো P&L হিসাবের অন্তর্ভুক্ত নয়
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                কোম্পানির অ্যাকাউন্টিং নীতিমালা অনুযায়ী, ক্রয়কৃত মালামালের পরিবহন ব্যয় (Purchase Transport) এবং মালিকের ব্যক্তিগত মূলধন উত্তোলন (Owner Withdrawal) এই P&L স্টেটমেন্টে অপারেটিং ব্যয় হিসেবে অন্তর্ভুক্ত হয় না। অডিট রেফারেন্সের সুবিধার্থে নিচে প্রদর্শিত হল:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-slate-700">ক্রয় পরিবহন ট্র্যাকিং (Purchase Transport):</span>
                    <span className="block text-[10px] text-slate-400">সাপ্লায়ার থেকে কাঁচামাল পরিবহন ট্রিপ ব্যয়</span>
                  </div>
                  <span className="font-mono font-bold text-slate-800">
                    {formatCurrency(p1Data.memo.purchaseTransportTracking)}
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-slate-700">স্বত্বাধিকারীর মূলধন উত্তোলন (Owner Withdrawal):</span>
                    <span className="block text-[10px] text-slate-400">ব্যবসায়ের ইকুইটি মূলধন থেকে উত্তোলন</span>
                  </div>
                  <span className="font-mono font-bold text-slate-800">
                    {formatCurrency(p1Data.memo.ownerWithdrawals)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4-Tier Audited Financial Certification Signatures */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-12 text-center text-xs">
          <div>
            <div className="border-t border-slate-400 pt-1.5 font-bold text-slate-800">
              হিসাব কর্মকর্তা
            </div>
            <div className="text-[10px] text-slate-400">Prepared by Accountant</div>
          </div>
          <div>
            <div className="border-t border-slate-400 pt-1.5 font-bold text-slate-800">
              অভ্যন্তরীণ নিরীক্ষক
            </div>
            <div className="text-[10px] text-slate-400">Audited by Internal Auditor</div>
          </div>
          <div>
            <div className="border-t border-slate-400 pt-1.5 font-bold text-slate-800">
              প্রধান অর্থ কর্মকর্তা
            </div>
            <div className="text-[10px] text-slate-400">Chief Financial Officer</div>
          </div>
          <div>
            <div className="border-t border-slate-400 pt-1.5 font-bold text-slate-800">
              ব্যবস্থাপনা পরিচালক
            </div>
            <div className="text-[10px] text-slate-400">Managing Director</div>
          </div>
        </div>

        <div className="text-center text-[10px] text-slate-400 pt-4 border-t border-slate-100 font-mono">
          This is an official certified computer-generated financial statement generated from Food ERP.
        </div>
      </div>
    </div>
  );
};
