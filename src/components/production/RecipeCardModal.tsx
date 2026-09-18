import React from 'react';
import { DataExportToolbar } from '../common/DataExportToolbar';
import { BOMRecipe } from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatCurrency, formatDate, exportToCSV } from '../../utils/formatters';
import { printDocument, exportElementToPDF } from '../../utils/printPdfUtils';
import {
  ChefHat,
  Printer,
  Download,
  X,
  Play,
  Edit,
  Clock,
  Layers,
  Sparkles,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';

interface RecipeCardModalProps {
  recipe: BOMRecipe;
  onClose: () => void;
  onEdit?: (recipe: BOMRecipe) => void;
  onRunProduction?: (recipe: BOMRecipe) => void;
}

export const RecipeCardModal: React.FC<RecipeCardModalProps> = ({
  recipe,
  onClose,
  onEdit,
  onRunProduction,
}) => {
  const { settings, products } = useERP();

  // Calculate live ingredient costs based on current stock/purchase prices
  const ingredientsWithLiveCost = recipe.ingredients.map(ing => {
    const rawProd = products.find(p => p.id === ing.productId);
    const liveRate = rawProd?.purchasePrice || ing.unitCost || 0;
    const liveLineTotal = ing.quantity * liveRate;
    const currentStock = rawProd?.currentStock || 0;
    const isAvailable = currentStock >= ing.quantity;

    return {
      ...ing,
      liveRate,
      liveLineTotal,
      currentStock,
      isAvailable,
      rawProd,
    };
  });

  const totalRawCost = ingredientsWithLiveCost.reduce((sum, it) => sum + it.liveLineTotal, 0);
  const laborCost = recipe.laborCostPerBatch || 0;
  const overheadCost = recipe.overheadCostPerBatch || 0;
  const totalBatchCost = totalRawCost + laborCost + overheadCost;
  const costPerUnit = recipe.outputQuantity > 0 ? totalBatchCost / recipe.outputQuantity : 0;

  const handlePrint = () => {
    printDocument('recipe-printable-content', { title: `Recipe_${recipe.recipeCode}_${recipe.productName}` });
  };

  const handleExportPDF = () => {
    const filename = `Recipe_${recipe.recipeCode}_${recipe.productName.replace(/\s+/g, '_')}.pdf`;
    exportElementToPDF('recipe-printable-content', filename);
  };

  const handleExportCSV = () => {
    const headers = ['উপাদান কোড', 'কাঁচামালের নাম', 'প্রয়োজনীয় পরিমাণ', 'একক', 'বর্তমান দর (৳)', 'লাইন খরচ (৳)', 'স্টক মজুদ'];
    const rows = ingredientsWithLiveCost.map(ing => [
      ing.productId,
      ing.productName,
      ing.quantity,
      ing.unit,
      ing.liveRate,
      ing.liveLineTotal,
      ing.currentStock,
    ]);
    rows.push(['-', 'শ্রমিক মজুরি (Labor Cost)', '-', '-', '-', laborCost, '-']);
    rows.push(['-', 'ফ্যাক্টরি ওভারহেড (Overhead)', '-', '-', '-', overheadCost, '-']);
    rows.push(['-', 'মোট ব্যাচ খরচ (Total Batch Cost)', '-', '-', '-', totalBatchCost, '-']);
    rows.push(['-', `একক খরচ (Cost Per ${recipe.outputUnit})`, '-', '-', '-', costPerUnit.toFixed(2), '-']);

    exportToCSV(`Recipe_Card_${recipe.recipeCode}`, headers, rows);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white w-full max-w-4xl rounded-none sm:rounded-3xl min-h-screen sm:min-h-0 shadow-2xl border-0 sm:border border-slate-200 overflow-hidden my-0 sm:my-auto print:shadow-none print:border-none print:w-full print:max-w-none">
        {/* Top Control Bar (Hidden on Print) */}
        <div className="print:hidden flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">অফিসিয়াল রেসিপি কার্ড ও উৎপাদন প্রণালী</h2>
              <p className="text-xs text-slate-400">কোড: {recipe.recipeCode} • ব্যাচ সাইজ: {recipe.outputQuantity} {recipe.outputUnit}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition-all active:scale-95"
              title="রেসিপি কার্ড সরাসরি প্রিন্ট করুন"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>প্রিন্ট</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-xs"
              title="রেসিপি কার্ড PDF ডাউনলোড করুন"
            >
              <Download className="w-4 h-4" />
              <span>PDF ডাউনলোড</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition-all"
              title="CSV / Excel ডাউনলোড"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>এক্সেল</span>
            </button>
            {onRunProduction && (
              <button
                onClick={() => {
                  onClose();
                  onRunProduction(recipe);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>প্রোডাকশন চালান</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="modal-close-btn w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
              title="বন্ধ করুন"
              aria-label="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div id="recipe-printable-content" className="p-6 sm:p-8 space-y-6 text-slate-800 bg-white">
          {/* Company Header (Automated from Settings) */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b-2 border-slate-900">
            <div className="flex items-center gap-4">
              {settings.companyLogoUrl ? (
                <img
                  src={settings.companyLogoUrl}
                  alt={settings.companyNameBangla}
                  className="w-16 h-16 object-contain rounded-xl border border-slate-200"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 font-black text-2xl flex items-center justify-center shadow-xs">
                  {settings.companyNameBangla.slice(0, 1)}
                </div>
              )}
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {settings.companyNameBangla}
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  {settings.companyNameEnglish}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  {settings.factoryAddress || settings.companyAddress}
                </p>
                <p className="text-xs text-slate-500">
                  মোবাইল: {settings.companyPhone} • ইমেইল: {settings.companyEmail}
                </p>
              </div>
            </div>

            <div className="sm:text-right bg-amber-50/80 p-3 rounded-2xl border border-amber-200/70 shrink-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                STANDARD OPERATING RECIPE (BOM)
              </div>
              <div className="text-base font-black text-slate-900 font-mono mt-0.5">
                {recipe.recipeCode}
              </div>
              <div className="text-xs text-slate-600 mt-1">
                তারিখ: {formatDate(recipe.updatedAt || new Date().toISOString().substring(0, 10))}
              </div>
            </div>
          </div>

          {/* Product Overview Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="sm:col-span-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                তৈরি পণ্য
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-0.5">
                {recipe.finishedProductName}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                রেসিপির নাম: <span className="font-semibold text-slate-700">{recipe.recipeName}</span>
              </p>
            </div>

            <div className="flex sm:flex-col sm:items-end justify-between border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  স্ট্যান্ডার্ড ব্যাচ সাইজ
                </span>
                <div className="text-base font-black text-amber-700 font-mono mt-0.5">
                  {recipe.outputQuantity} {recipe.outputUnit}
                </div>
              </div>
              {recipe.shelfLifeDays && (
                <div className="text-xs text-slate-500 mt-1">
                  মেয়াদকাল: <span className="font-semibold text-slate-800">{recipe.shelfLifeDays} দিন</span>
                </div>
              )}
            </div>
          </div>

          {/* Bill of Materials (Raw Materials Table) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-600" />
                <span>প্রয়োজনীয় কাঁচামাল ও প্যাকেজিং তালিকা (Ingredients Breakdown)</span>
              </h4>
              <span className="text-xs text-slate-500 font-medium">
                উপাদান সংখ্যা: {recipe.ingredients.length} টি
              </span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">কাঁচামাল ও প্যাকেজিং উপাদান</th>
                    <th className="py-2.5 px-3 text-right">প্রয়োজনীয় পরিমাণ</th>
                    <th className="py-2.5 px-3 text-right">বর্তমান স্টক দর (৳)</th>
                    <th className="py-2.5 px-3 text-right">লাইন খরচ (৳)</th>
                    <th className="py-2.5 px-3 text-right">ব্যয় অংশ (%)</th>
                    <th className="py-2.5 px-3 text-center print:hidden">স্টক স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ingredientsWithLiveCost.map((item, idx) => {
                    const costShare = totalRawCost > 0 ? (item.liveLineTotal / totalRawCost) * 100 : 0;
                    return (
                      <tr key={item.productId || idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-slate-400 text-center w-8">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          <div>{item.productName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{item.productId}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          {formatCurrency(item.liveRate, true)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                          {formatCurrency(item.liveLineTotal)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-500 text-[11px]">
                          {costShare.toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3 text-center print:hidden">
                          {item.isAvailable ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              মজুদ: {item.currentStock} {item.unit}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              ঘাটতি! স্টক: {item.currentStock}
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

          {/* Cost Summary Breakdown with Prominent Unit Cost Highlight */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Left: Preparation SOP / Instructions */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
              <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                প্রস্তুতি নির্দেশনা ও কোয়ালিটি নির্দেশিকা (SOP)
              </h5>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {recipe.instructions || 'রেসিপি প্রস্তুতকালে হাইজিন ও স্ট্যান্ডার্ড ওভেন তাপমাত্রা বজায় রাখুন। সঠিক ওজন নিশ্চিত করুন।'}
              </p>
            </div>

            {/* Right: Costing Breakdown Table & Highlights */}
            <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>কাঁচামাল খরচ:</span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(totalRawCost)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>
                    শ্রমিক মজুরি:
                    {recipe.laborCostType === 'PERCENT' && (
                      <span className="text-[11px] text-slate-500 ml-1">({recipe.laborCostValue}%)</span>
                    )}
                  </span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(laborCost)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>
                    কারখানা ওভারহেড ও গ্যাস/বিদ্যুৎ:
                    {recipe.overheadCostType === 'PERCENT' && (
                      <span className="text-[11px] text-slate-500 ml-1">({recipe.overheadCostValue}%)</span>
                    )}
                  </span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(overheadCost)}</span>
                </div>
                <div className="border-t border-amber-200/80 pt-2 flex justify-between font-bold text-slate-800">
                  <span>মোট স্ট্যান্ডার্ড ব্যাচ উৎপাদন খরচ:</span>
                  <span className="font-mono text-base font-black text-slate-900">{formatCurrency(totalBatchCost)}</span>
                </div>
              </div>

              {/* Highlighting Cost Per Unit (Total ÷ Batch Size) */}
              <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-4 rounded-xl shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-100">
                    একক উৎপাদন খরচ (Cost Per Unit)
                  </span>
                  <div className="text-xs text-amber-200 mt-0.5">
                    মোট ব্যাচ খরচ ÷ {recipe.outputQuantity} {recipe.outputUnit}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
                    {formatCurrency(costPerUnit, true)}
                  </div>
                  <div className="text-[10px] text-amber-100 font-semibold">
                    প্রতি {recipe.outputUnit}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Signatures for Print Authorization */}
          <div className="pt-10 grid grid-cols-3 gap-8 text-center text-xs text-slate-600 border-t border-slate-200">
            <div>
              <div className="border-t border-slate-400 pt-1 font-semibold text-slate-800">
                রেসিপি প্রস্তুতকারক ও শেফ
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">স্বাক্ষর ও তারিখ</div>
            </div>
            <div>
              <div className="border-t border-slate-400 pt-1 font-semibold text-slate-800">
                কোয়ালিটি কন্ট্রোল অফিসার
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">অনুমোদন ও সিল</div>
            </div>
            <div>
              <div className="border-t border-slate-400 pt-1 font-semibold text-slate-800">
                প্ল্যান্ট ও কারখানা ম্যানেজার
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">চূড়ান্ত অনুমোদন</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
