import React from 'react';
import { ProductionRun } from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { printDocument, exportElementToPDF } from '../../utils/printPdfUtils';
import {
  Printer,
  Download,
  X,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Clock,
  UserCheck,
  Layers,
  Sparkles,
  DollarSign,
} from 'lucide-react';

interface ProductionRunReceiptModalProps {
  run: ProductionRun;
  onClose: () => void;
}

export const ProductionRunReceiptModal: React.FC<ProductionRunReceiptModalProps> = ({
  run,
  onClose,
}) => {
  const { settings, bomRecipes, products } = useERP();

  const recipe = bomRecipes.find(r => r.id === run.recipeId);
  const finishedProd = products.find(p => p.id === run.targetProductId);

  const handlePrint = () => {
    printDocument('production-run-slip-content', { title: `Production_Batch_${run.batchNo}` });
  };

  const handleExportPDF = () => {
    exportElementToPDF('production-run-slip-content', `Production_Batch_${run.batchNo}.pdf`);
  };

  const expected = run.expectedQuantity || run.producedQuantity;
  const actual = run.producedQuantity;
  const wastage = run.wastageQuantity || Math.max(0, expected - actual);
  const yieldPct = run.yieldPercent || (expected > 0 ? (actual / expected) * 100 : 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto print:shadow-none print:border-none print:w-full print:max-w-none">
        {/* Top Control Bar (Hidden on Print) */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">প্রোডাকশন ব্যাচ কমপ্লিশন স্লিপ ({run.batchNo})</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition-all"
              title="ব্যাচ স্লিপ সরাসরি প্রিন্ট করুন"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>প্রিন্ট স্লিপ</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-xs"
              title="ব্যাচ স্লিপ PDF ডাউনলোড করুন"
            >
              <Download className="w-4 h-4" />
              <span>PDF ডাউনলোড</span>
            </button>
            <button
              onClick={onClose}
              className="modal-close-btn p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1"
              title="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div id="production-run-slip-content" className="p-6 sm:p-8 space-y-6 text-slate-800 bg-white">
          {/* Company Letterhead */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b-2 border-slate-900">
            <div className="flex items-center gap-4">
              {settings.companyLogoUrl ? (
                <img
                  src={settings.companyLogoUrl}
                  alt={settings.companyNameBangla}
                  className="w-14 h-14 object-contain rounded-xl border border-slate-200"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-black text-xl flex items-center justify-center">
                  {settings.companyNameBangla.slice(0, 1)}
                </div>
              )}
              <div>
                <h1 className="text-xl font-black text-slate-900">
                  {settings.companyNameBangla}
                </h1>
                <p className="text-xs text-slate-500">
                  {settings.factoryAddress || settings.companyAddress}
                </p>
                <p className="text-xs text-slate-500">
                  ফোন: {settings.companyPhone}
                </p>
              </div>
            </div>

            <div className="sm:text-right bg-slate-50 p-3 rounded-2xl border border-slate-200 shrink-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                BATCH PRODUCTION CERTIFICATE
              </div>
              <div className="text-base font-black text-amber-700 font-mono mt-0.5">
                ব্যাচ: {run.batchNo}
              </div>
              <div className="text-xs text-slate-600 mt-1">
                তারিখ: {formatDate(run.date)}
              </div>
            </div>
          </div>

          {/* Batch Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            <div className="space-y-1.5">
              <div>
                <span className="text-slate-500">উৎপাদিত পণ্য:</span>{' '}
                <span className="font-bold text-slate-900">{run.recipeName || finishedProd?.nameBangla}</span>
              </div>
              <div>
                <span className="text-slate-500">রেসিপি রেফারেন্স:</span>{' '}
                <span className="font-mono font-semibold text-slate-700">{run.recipeId}</span>
              </div>
              <div>
                <span className="text-slate-500">সুপারভাইজার:</span>{' '}
                <span className="font-semibold text-slate-800">{run.supervisor}</span>
              </div>
            </div>

            <div className="space-y-1.5 sm:text-right">
              <div>
                <span className="text-slate-500">উৎপাদন তারিখ (MFG):</span>{' '}
                <span className="font-mono font-semibold text-slate-900">{formatDate(run.mfgDate)}</span>
              </div>
              <div>
                <span className="text-slate-500">মেয়াদোত্তীর্ণের তারিখ (EXP):</span>{' '}
                <span className="font-mono font-bold text-rose-700">{formatDate(run.expDate)}</span>
              </div>
              <div>
                <span className="text-slate-500">ফিনিশড গুডস স্ট্যাটাস:</span>{' '}
                <span className="font-bold text-emerald-700">স্টকে অন্তর্ভুক্ত ✅</span>
              </div>
            </div>
          </div>

          {/* Yield & Quantity KPI Grid */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-slate-100 rounded-2xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500">প্রত্যাশিত উৎপাদন</span>
              <div className="text-base font-black font-mono text-slate-900 mt-1">
                {expected} {run.unit}
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
              <span className="text-[10px] uppercase font-bold text-emerald-800">প্রকৃত আউটপুট (Actual)</span>
              <div className="text-base font-black font-mono text-emerald-950 mt-1">
                {actual} {run.unit}
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
              <span className="text-[10px] uppercase font-bold text-amber-800">ইল্ড হার (Yield %)</span>
              <div className="text-base font-black font-mono text-amber-950 mt-1">
                {yieldPct.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Wastage Info if any */}
          {wastage > 0 && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-900">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  প্রসেস লস / অপচয়: <span className="font-bold">{wastage} {run.unit}</span> (ভাউচার: {run.wastageVoucherNo || `WST-PRD-${run.batchNo}`})
                </span>
              </div>
              <div className="font-mono font-bold text-rose-800">
                ক্ষতি: {formatCurrency(wastage * (run.costPerUnit || 0))}
              </div>
            </div>
          )}

          {/* Cost Breakdown */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-2 text-xs">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              উৎপাদন ব্যয় বিভাজন (Cost Breakdown)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[10px]">কাঁচামাল খরচ:</span>
                <div className="font-mono font-bold text-slate-900">{formatCurrency(run.rawMaterialCost)}</div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[10px]">শ্রমিক মজুরি:</span>
                <div className="font-mono font-bold text-slate-900">{formatCurrency(run.laborCost)}</div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[10px]">ওভারহেড ও ইউটিলিটি:</span>
                <div className="font-mono font-bold text-slate-900">{formatCurrency(run.overheadCost)}</div>
              </div>
              <div className="bg-amber-100/70 p-2.5 rounded-xl border border-amber-300">
                <span className="text-amber-900 text-[10px] font-bold">মোট ব্যাচ ব্যয়:</span>
                <div className="font-mono font-black text-amber-950">{formatCurrency(run.totalProductionCost)}</div>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center text-sm font-bold text-slate-900 bg-white p-3 rounded-xl border border-slate-200 mt-2">
              <span>প্রতি ইউনিট উৎপাদন খরচ (COGS Per Unit):</span>
              <span className="text-base font-black font-mono text-amber-700">
                {formatCurrency(run.costPerUnit, true)} / {run.unit}
              </span>
            </div>
          </div>

          {/* Notes */}
          {run.notes && (
            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-700">মন্তব্য: </span>
              {run.notes}
            </div>
          )}

          {/* Signatures */}
          <div className="pt-10 grid grid-cols-3 gap-6 text-center text-xs text-slate-600 border-t border-slate-200">
            <div>
              <div className="border-t border-slate-400 pt-1 font-semibold text-slate-800">
                প্রোডাকশন অপারেটর
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">স্বাক্ষর</div>
            </div>
            <div>
              <div className="border-t border-slate-400 pt-1 font-semibold text-slate-800">
                প্ল্যান্ট সুপারভাইজার
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">{run.supervisor}</div>
            </div>
            <div>
              <div className="border-t border-slate-400 pt-1 font-semibold text-slate-800">
                কোয়ালিটি কন্ট্রোল (QC)
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">অনুমোদন ও সিল</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
