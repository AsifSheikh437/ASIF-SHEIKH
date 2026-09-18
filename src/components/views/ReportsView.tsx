import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { PnLStatementTab } from './reports/PnLStatementTab';
import { ProductProfitabilityTab } from './reports/ProductProfitabilityTab';
import { MonthlyDashboardTab } from './reports/MonthlyDashboardTab';
import { BalanceSheetTab } from './reports/BalanceSheetTab';
import { AIInsightsTab } from './reports/AIInsightsTab';
import { calculateMonthlyTrends } from './reports/reportUtils';
import { pushFinancialDataToSheet } from '../../services/googleSheetsService';
import {
  RefreshCw,
  ExternalLink,
  FileSpreadsheet,
  Scale,
  Package,
  Activity,
  MessageSquare,
  Mail,
  Printer,
  Download,
  Building2,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const {
    sales,
    purchases,
    expenses,
    utilityBills,
    salaryRecords,
    employees,
    transportTrips,
    ownerWithdrawals,
    wastageRecords,
    payrollMode,
    products,
    totalCashAndBankBalance,
    totalReceivables,
    totalPayables,
    settings,
    getPnLSummary,
  } = useERP();

  const [activeTab, setActiveTab] = useState<'PL' | 'PRODUCT_PROFIT' | 'MONTHLY' | 'BALANCE_SHEET' | 'AI_INSIGHTS'>('PL');
  const [drilldownDates, setDrilldownDates] = useState<{ start: string; end: string } | null>(null);

  // Quick summary for WhatsApp / Email
  const pnlSummary = getPnLSummary ? getPnLSummary() : {
    netSales: 0,
    grossProfit: 0,
    profitMarginPercent: 0,
    operatingExpenses: { total: 0 },
    netProfit: 0,
  };

  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [sheetsUrl, setSheetsUrl] = useState<string | null>(null);
  
  const handleSyncToSheets = async () => {
    setIsSyncingSheets(true);
    setSheetsUrl(null);
    try {
      const monthlyData = calculateMonthlyTrends({
        sales, expenses, utilityBills, salaryRecords,
    employees,
        transportTrips,
    products, ownerWithdrawals, wastageRecords, payrollMode, monthsCount: 12
      });
      
      const dashboardData = [
        ['Metric', 'Value', 'Generated At'],
        ['Total Sales Revenue', pnlSummary.netSales, new Date().toLocaleString()],
        ['Gross Profit', pnlSummary.grossProfit, ''],
        ['Operating Expenses', pnlSummary.operatingExpenses.total, ''],
        ['Net Profit', pnlSummary.netProfit, ''],
        ['Profit Margin', `${pnlSummary.profitMarginPercent.toFixed(1)}%`, ''],
        ['Net Working Capital', totalCashAndBankBalance + totalReceivables - totalPayables, '']
      ];

      const ledgerHeader = ['Month', 'Revenue', 'COGS', 'Gross Profit', 'Operating Expenses', 'Salaries', 'Utilities', 'Net Profit'];
      const ledgerData = [
        ledgerHeader,
        ...monthlyData.map(m => [
          m.monthLabel,
          m.revenue,
          m.cogs,
          m.grossProfit,
          m.operatingExpenses,
          m.salaries,
          m.utilitiesRent,
          m.netProfit
        ])
      ];

      const res = await pushFinancialDataToSheet(settings.companyNameBangla || 'FoodERP', dashboardData, ledgerData);
      if (res.success) {
        setSheetsUrl(res.url);
        alert('Google Sheets এ সফলভাবে ডেটা সিঙ্ক হয়েছে!');
      }
    } catch (err: any) {
      alert(`Google Sheets সিঙ্ক ব্যর্থ হয়েছে: ${err.message}`);
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const handleDrilldownFromMonth = (startDate: string, endDate: string) => {
    setDrilldownDates({ start: startDate, end: endDate });
    setActiveTab('PL');
  };

  const inventoryStockValue = (products || []).reduce(
    (sum, p) => sum + (p.currentStock || 0) * (p.purchasePrice || 0),
    0
  );
  const totalAssets = (totalCashAndBankBalance || 0) + (totalReceivables || 0) + inventoryStockValue;
  const pendingUtility = (utilityBills || [])
    .filter(u => u.status === 'PENDING')
    .reduce((s, u) => s + (u.amount || 0), 0);
  const totalLiabilities = (totalPayables || 0) + pendingUtility;
  const netWorkingCapital = totalAssets - totalLiabilities;

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs print:hidden">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                অডিট ও ফাইন্যান্সিয়াল রিপোর্ট ও P&L
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-normal">
                  Reports & P&L Module
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                স্ট্যান্ডার্ড P&L সিঁড়ি বিবরণী, পিরিয়ড তুলনা, প্রোডাক্ট প্রফিট্যাবিলিটি ও মাসিক গতিধারা
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* WhatsApp Share Report Summary */}
          <button
            onClick={() => {
              const msg = `*${settings.companyNameBangla} - আর্থিক প্রতিবেদন সারসংক্ষেপ*\nতারিখ: ${formatDate(new Date().toISOString())}\n\n• মোট বিক্রয় রাজস্ব: ৳${pnlSummary.netSales.toLocaleString('en-IN')}\n• গ্রস প্রফিট: ৳${pnlSummary.grossProfit.toLocaleString('en-IN')}\n• মোট পরিচালন ব্যয়: ৳${pnlSummary.operatingExpenses.total.toLocaleString('en-IN')}\n• নিট মুনাফা: ৳${pnlSummary.netProfit.toLocaleString('en-IN')} (${pnlSummary.profitMarginPercent.toFixed(1)}%)\n• নেট কার্যকর মূলধন: ৳${netWorkingCapital.toLocaleString('en-IN')}\n\nবিস্তারিত অডিটেড রিপোর্টের জন্য ERP সিস্টেমে প্রবেশ করুন।`;
              window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
            title="হোয়াটসঅ্যাপে আর্থিক সারাংশ পাঠান"
          >
            <MessageSquare className="w-4 h-4" />
            WhatsApp সামারি
          </button>

          {/* Email Share Report */}
          {(() => {
            const subject = `Financial Performance Report – ${settings.companyNameBangla}`;
            const body = `ব্যবস্থাপনা পর্ষদ বরাবর,\n${settings.companyNameBangla}\n\nআর্থিক সারসংক্ষেপ বিবরণী:\nতারিখ: ${formatDate(new Date().toISOString())}\n\n১. মোট বিক্রয় রাজস্ব: ৳${pnlSummary.netSales.toLocaleString('en-IN')}\n২. গ্রস প্রফিট: ৳${pnlSummary.grossProfit.toLocaleString('en-IN')}\n৩. মোট পরিচালন ব্যয়: ৳${pnlSummary.operatingExpenses.total.toLocaleString('en-IN')}\n৪. নিট ব্যবসায়িক মুনাফা: ৳${pnlSummary.netProfit.toLocaleString('en-IN')} (${pnlSummary.profitMarginPercent.toFixed(1)}%)\n৫. নেট কার্যকর মূলধন: ৳${netWorkingCapital.toLocaleString('en-IN')}\n\nধন্যবাদান্তে,\nহিসাব ও অর্থ বিভাগ\n${settings.companyNameBangla}`;
            const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            return (
              <a
                href={mailtoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
                title="ইমেইলে রিপোর্ট সারাংশ পাঠান (ইমেইল ক্লায়েন্ট খুলুন)"
              >
                <Mail className="w-4 h-4" />
                <span>Email সামারি</span>
              </a>
            );
          })()}
          
          {/* Sync to Sheets Button */}
          <button
            onClick={handleSyncToSheets}
            disabled={isSyncingSheets}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs disabled:opacity-50"
            title="Google Sheets এ লাইভ রিপোর্ট সিঙ্ক করুন"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncingSheets ? 'animate-spin' : ''}`} />
            <span>{isSyncingSheets ? 'Syncing...' : 'Sheets Sync'}</span>
          </button>
          
          {sheetsUrl && (
            <a
              href={sheetsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors shadow-xs"
              title="Open Google Sheet"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open Sheet</span>
            </a>
          )}
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-1 print:hidden">
        <button
          onClick={() => {
            setActiveTab('PL');
            setDrilldownDates(null);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all ${
            activeTab === 'PL'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>লাভ-ক্ষতি বিবরণী ও তুলনা (P&L Statement)</span>
        </button>

        <button
          onClick={() => setActiveTab('PRODUCT_PROFIT')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all ${
            activeTab === 'PRODUCT_PROFIT'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>প্রোডাক্টভিত্তিক লাভ-ক্ষতি (Product Profitability)</span>
        </button>

        <button
          onClick={() => setActiveTab('MONTHLY')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all ${
            activeTab === 'MONTHLY'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>মাসিক ড্যাশবোর্ড ও ট্রেন্ড (Monthly Trends)</span>
        </button>

        <button
          onClick={() => setActiveTab('BALANCE_SHEET')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all ${
            activeTab === 'BALANCE_SHEET'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>ব্যালেন্স শিট ও আর্থিক অবস্থান (Balance Sheet)</span>
        </button>
        <button
          onClick={() => setActiveTab('AI_INSIGHTS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all ${
            activeTab === 'AI_INSIGHTS'
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>এআই ইনসাইটস (AI Insights)</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'PL' && (
        <PnLStatementTab
          key={`${drilldownDates?.start}-${drilldownDates?.end}`}
          initialStartDate={drilldownDates?.start}
          initialEndDate={drilldownDates?.end}
        />
      )}

      {activeTab === 'PRODUCT_PROFIT' && <ProductProfitabilityTab />}

      {activeTab === 'MONTHLY' && (
        <MonthlyDashboardTab onDrillDownToMonth={handleDrilldownFromMonth} />
      )}

      {activeTab === 'BALANCE_SHEET' && <BalanceSheetTab />}
      {activeTab === 'AI_INSIGHTS' && <AIInsightsTab />}
    </div>
  );
};
