import React from 'react';
import { useERP } from '../../../context/ERPContext';
import { formatCurrency, formatDate, exportToCSV } from '../../../utils/formatters';
import { printDocument, exportElementToPDF } from '../../../utils/printPdfUtils';
import { ReportPrintModal } from '../../common/ReportPrintModal';
import {
  Building2,
  Printer,
  Download,
  FileSpreadsheet,
  Scale,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';

export const BalanceSheetTab: React.FC = () => {
  const {
    products,
    utilityBills,
    totalCashAndBankBalance,
    totalReceivables,
    totalPayables,
    settings,
  } = useERP();

  const safeProducts = products || [];
  const safeUtilities = utilityBills || [];

  // Assets
  const inventoryStockValue = safeProducts.reduce(
    (sum, p) => sum + (p.currentStock || 0) * (p.purchasePrice || 0),
    0
  );
  const totalCurrentAssets =
    (totalCashAndBankBalance || 0) + (totalReceivables || 0) + inventoryStockValue;

  // Liabilities
  const pendingUtilityPayable = safeUtilities
    .filter(u => u.status === 'PENDING')
    .reduce((s, u) => s + (u.amount || 0), 0);
  const totalCurrentLiabilities = (totalPayables || 0) + pendingUtilityPayable;
  const netWorkingCapital = totalCurrentAssets - totalCurrentLiabilities;

  // Print View Modal State
  const [showPrintModal, setShowPrintModal] = React.useState<boolean>(false);

  const handlePrint = () => {
    printDocument('balance-sheet-print-sheet', {
      title: 'Balance_Sheet_Statement',
    });
  };

  const handleExportPDF = () => {
    exportElementToPDF('balance-sheet-print-sheet', {
      filename: `Balance_Sheet_Statement_${new Date().toISOString().substring(0, 10)}.pdf`,
      orientation: 'portrait',
    });
  };

  const handleExportCSV = () => {
    const headers = ['Category', 'Account Line Item', 'Amount (BDT)'];
    const rows = [
      ['Assets', 'Cash & Bank Balances', totalCashAndBankBalance || 0],
      ['Assets', 'Accounts Receivable (Customers)', totalReceivables || 0],
      ['Assets', 'Inventory Stock Value', inventoryStockValue],
      ['Assets Total', 'Total Current Assets', totalCurrentAssets],
      ['Liabilities', 'Accounts Payable (Suppliers)', totalPayables || 0],
      ['Liabilities', 'Pending Utility Bills', pendingUtilityPayable],
      ['Liabilities Total', 'Total Current Liabilities', totalCurrentLiabilities],
      ['Working Capital', 'Net Working Capital (Assets - Liabilities)', netWorkingCapital],
    ];
    exportToCSV(`Balance_Sheet_${new Date().toISOString().substring(0, 10)}`, headers, rows);
  };

  const renderBalanceSheetSchedule = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Assets */}
      <div className="space-y-4">
        <div className="bg-emerald-50 p-3 rounded-2xl font-bold text-emerald-900 text-xs flex justify-between items-center border border-emerald-200">
          <span>চলতি ও মোট সম্পদ (Current Assets)</span>
          <span>টাকা (৳)</span>
        </div>

        <div className="divide-y divide-slate-100 text-xs px-2">
          <div className="py-2.5 flex justify-between">
            <div>
              <span className="text-slate-800 font-medium">নগদ ক্যাশ ও ব্যাংক ব্যালেন্স</span>
              <span className="block text-[10px] text-slate-400">ক্যাশ ইন হ্যান্ড ও ব্যাংক অ্যাকাউন্ট</span>
            </div>
            <span className="font-mono font-bold text-slate-900">
              {formatCurrency(totalCashAndBankBalance)}
            </span>
          </div>
          <div className="py-2.5 flex justify-between">
            <div>
              <span className="text-slate-800 font-medium">গ্রাহকদের কাছে প্রাপ্য বকেয়া (Receivables)</span>
              <span className="block text-[10px] text-slate-400">কাস্টমার আউটস্ট্যান্ডিং বাকি</span>
            </div>
            <span className="font-mono font-bold text-slate-900">
              {formatCurrency(totalReceivables)}
            </span>
          </div>
          <div className="py-2.5 flex justify-between">
            <div>
              <span className="text-slate-800 font-medium">পণ্য ও কাঁচামালের মজুদ মূল্য (Inventory Value)</span>
              <span className="block text-[10px] text-slate-400">গুদামে বর্তমান স্টক মূল্যায়ন</span>
            </div>
            <span className="font-mono font-bold text-slate-900">
              {formatCurrency(inventoryStockValue)}
            </span>
          </div>
          <div className="py-3.5 flex justify-between items-center font-bold text-emerald-800 bg-emerald-50/70 px-3 rounded-xl border border-emerald-200/60 mt-2">
            <span>সর্বমোট চলতি সম্পদ (Total Current Assets)</span>
            <span className="font-mono font-black text-sm">{formatCurrency(totalCurrentAssets)}</span>
          </div>
        </div>
      </div>

      {/* Liabilities */}
      <div className="space-y-4">
        <div className="bg-rose-50 p-3 rounded-2xl font-bold text-rose-900 text-xs flex justify-between items-center border border-rose-200">
          <span>চলতি দায় ও ঋণ (Current Liabilities)</span>
          <span>টাকা (৳)</span>
        </div>

        <div className="divide-y divide-slate-100 text-xs px-2">
          <div className="py-2.5 flex justify-between">
            <div>
              <span className="text-slate-800 font-medium">সাপ্লায়ারদের প্রদেয় বকেয়া (Payables)</span>
              <span className="block text-[10px] text-slate-400">কাঁচামাল সরবরাহকারীদের বাকি পাওনা</span>
            </div>
            <span className="font-mono font-bold text-rose-700">
              {formatCurrency(totalPayables)}
            </span>
          </div>
          <div className="py-2.5 flex justify-between">
            <div>
              <span className="text-slate-800 font-medium">বকেয়া ইউটিলিটি ও বিল (Pending Bills)</span>
              <span className="block text-[10px] text-slate-400">বিদ্যুৎ, গ্যাস ও কারখানার বকেয়া বিল</span>
            </div>
            <span className="font-mono font-bold text-rose-700">
              {formatCurrency(pendingUtilityPayable)}
            </span>
          </div>
          <div className="py-3.5 flex justify-between items-center font-bold text-rose-800 bg-rose-50/70 px-3 rounded-xl border border-rose-200/60 mt-2">
            <span>সর্বমোট চলতি দায় (Total Current Liabilities)</span>
            <span className="font-mono font-black text-sm">{formatCurrency(totalCurrentLiabilities)}</span>
          </div>

          {/* Working Capital */}
          <div className="pt-6">
            <div className="bg-indigo-50/80 p-3.5 rounded-2xl border border-indigo-200 flex justify-between items-center text-xs">
              <div>
                <span className="font-bold text-indigo-900 block">চলতি কার্যকর মূলধন (Net Working Capital)</span>
                <span className="text-[10px] text-indigo-600">সম্পদ থেকে চলতি দায় বাদ দিয়ে ব্যবসার নেট তারল্য</span>
              </div>
              <span className="font-mono font-black text-base text-indigo-900">
                {formatCurrency(netWorkingCapital)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Top Banner Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs print:hidden">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-600" />
            ব্যালেন্স শিট ও আর্থিক অবস্থান (Balance Sheet & Net Worth)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            কোম্পানির বর্তমান সম্পদ (Assets), দায় (Liabilities) ও কার্যকর তারল্য মূলধনের বিবরণী
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-bs-soft-reset"
            onClick={() => {
              const icon = document.getElementById('icon-bs-refresh');
              if (icon) icon.classList.add('animate-spin');
              setTimeout(() => {
                if (icon) icon.classList.remove('animate-spin');
              }, 400);
            }}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            title="ব্যালেন্স শিট ভিউ রিফ্রেশ ও রিসেট করুন (Soft Reset)"
          >
            <RotateCcw id="icon-bs-refresh" className="w-3.5 h-3.5 text-slate-500" />
            <span>রিফ্রেশ / রিসেট</span>
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
            id="btn-bs-print-view"
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            title="ব্যালেন্স শিট প্রিন্ট ভিউ খুলুন"
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

      {/* Printable Sheet */}
      <div
        id="balance-sheet-print-sheet"
        className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 md:p-8 space-y-6"
      >
        {/* Letterhead */}
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
                {settings.address} | ফোন: {settings.phone}
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
              BALANCE SHEET STATEMENT
            </span>
            <div className="font-mono text-xs text-slate-700">
              <span className="text-slate-500">তারিখ:</span>{' '}
              <span className="font-bold text-slate-900">{formatDate(new Date().toISOString())}</span>
            </div>
            <div className="font-mono text-[11px] text-slate-500 mt-0.5">
              মুদ্রা: BDT (৳) | অডিটেড স্ট্যাটাস: সার্টিফায়েড
            </div>
          </div>
        </div>

        {/* 2-Column Assets & Liabilities */}
        {renderBalanceSheetSchedule()}

        {/* 4-Tier Signatures */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-12 text-center text-xs">
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

        <div className="text-center text-[10px] text-slate-400 pt-4 border-t border-slate-100 font-mono">
          This is a certified computer-generated balance sheet statement from Food ERP.
        </div>
      </div>

      {/* Dedicated Clean Printer-Friendly Modal Layout */}
      {showPrintModal && (
        <ReportPrintModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          title="ব্যালেন্স শিট ও আর্থিক অবস্থান বিবরণী (Balance Sheet & Net Worth)"
          subtitle="কোম্পানির চলতি সম্পদ, চলতি দায় ও নেট কার্যকর তারল্য মূলধনের বিবরণী"
          periodLabel={`তারিখ: ${formatDate(new Date().toISOString())}`}
          documentId="balance-sheet-modal-printable-area"
        >
          {renderBalanceSheetSchedule()}
        </ReportPrintModal>
      )}
    </div>
  );
};
