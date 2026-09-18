import React, { useState } from 'react';
import { DataExportToolbar } from '../common/DataExportToolbar';
import { useERP } from '../../context/ERPContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  Calculator,
  Percent,
  TrendingUp,
  Package,
  Layers,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

export const ProductionCostView: React.FC = () => {
  const { products, bomRecipes, productionRuns } = useERP();

  const [markupPercent, setMarkupPercent] = useState<number>(30);

  // Analyze products with production recipe or runs
  const finishedGoods = products.filter(p => p.category === 'FINISHED_GOODS');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-teal-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              প্রোডাকশন কস্ট মাস্টার ও প্রফিট মার্জিন (Production Cost Master)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            প্রতিটি খাদ্যপণ্যের কাঁচামাল, মজুরি, প্যাকেজিং ও ওভারহেড যোগ করে ইউনিট কস্ট এবং লাভ মার্জিন নির্ধারণ
          </p>
        </div>

        {/* Global Markup Simulator Slider */}
        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
          <span className="text-xs font-bold text-slate-700">টার্গেট প্রফিট মার্জিন:</span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="10"
              max="70"
              step="5"
              value={markupPercent}
              onChange={e => setMarkupPercent(parseFloat(e.target.value))}
              className="w-24 accent-teal-600 cursor-pointer"
            />
            <span className="font-mono font-bold text-teal-700 text-xs w-10">{markupPercent}%</span>
          </div>
        </div>
      </div>

      {/* Product Cost Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <div className="p-4 pb-0"><DataExportToolbar filename="ProductionCostView_Export" /></div>
<table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">খাদ্যপণ্যের নাম</th>
                <th className="py-3 px-4 text-right">কাঁচামাল খরচ (৳)</th>
                <th className="py-3 px-4 text-right">শ্রমিক মজুরি (৳)</th>
                <th className="py-3 px-4 text-right">ইউটিলিটি ও গ্যাস (৳)</th>
                <th className="py-3 px-4 text-right">প্যাকেজিং (৳)</th>
                <th className="py-3 px-4 text-right font-bold text-slate-900">মোট ইউনিট খরচ</th>
                <th className="py-3 px-4 text-right text-teal-700">টার্গেট দর ({markupPercent}%)</th>
                <th className="py-3 px-4 text-right font-bold">বর্তমান বিক্রয়মূল্য</th>
                <th className="py-3 px-4 text-right">বর্তমান লাভ (৳)</th>
                <th className="py-3 px-4 text-center">লাভ %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {finishedGoods.map(p => {
                const latestRun = productionRuns.find(r => r.outputProductId === p.id);
                const unitCost = latestRun ? latestRun.unitCost : p.purchasePrice;

                // Estimated breakdowns
                const rawCost = latestRun ? (latestRun.totalRawMaterialCost / latestRun.outputQuantity) : (unitCost * 0.7);
                const labor = latestRun ? (latestRun.laborCost / latestRun.outputQuantity) : (unitCost * 0.12);
                const util = latestRun ? (latestRun.utilityCost / latestRun.outputQuantity) : (unitCost * 0.08);
                const pack = latestRun ? (latestRun.packagingCost / latestRun.outputQuantity) : (unitCost * 0.1);

                const suggestedSellingPrice = unitCost * (1 + markupPercent / 100);
                const currentProfitBDT = p.sellingPrice - unitCost;
                const currentProfitPercent = unitCost > 0 ? ((p.sellingPrice - unitCost) / unitCost) * 100 : 0;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{p.nameBangla}</div>
                      <div className="text-[11px] text-slate-400">{p.unit} প্রতি</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {formatCurrency(rawCost)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {formatCurrency(labor)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {formatCurrency(util)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {formatCurrency(pack)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                      {formatCurrency(unitCost)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-teal-700">
                      {formatCurrency(suggestedSellingPrice)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(p.sellingPrice)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold">
                      <span className={currentProfitBDT >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                        {formatCurrency(currentProfitBDT)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          currentProfitPercent >= 25
                            ? 'bg-emerald-50 text-emerald-700'
                            : currentProfitPercent > 0
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {currentProfitPercent.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      

      {/* Batch-wise Profit Margin Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden mt-6">
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">ব্যাচভিত্তিক প্রফিট মার্জিন (Batch Profitability)</h3>
            <p className="text-xs text-slate-500 mt-0.5">প্রতিটি নির্দিষ্ট প্রোডাকশন ব্যাচের প্রকৃত খরচ এবং লাভ</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="p-4 pb-0"><DataExportToolbar filename="ProductionBatchProfit_Export" /></div>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">তারিখ ও ব্যাচ</th>
                <th className="py-3 px-4">খাদ্যপণ্য</th>
                <th className="py-3 px-4 text-right">উৎপাদন (Qty)</th>
                <th className="py-3 px-4 text-right">ইউনিট কস্ট (৳)</th>
                <th className="py-3 px-4 text-right">বিক্রয়মূল্য (৳)</th>
                <th className="py-3 px-4 text-right">মোট খরচ (৳)</th>
                <th className="py-3 px-4 text-right">মোট সম্ভাব্য আয় (৳)</th>
                <th className="py-3 px-4 text-right">ব্যাচ প্রফিট (৳)</th>
                <th className="py-3 px-4 text-center">লাভ %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productionRuns.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(run => {
                const productId = run.outputProductId || run.targetProductId;
                const product = products.find(p => p.id === productId);
                const sellingPrice = product ? product.sellingPrice : 0;
                
                const qty = run.outputQuantity || run.producedQuantity || 0;
                const costPerUnit = run.unitCost || run.costPerUnit || 0;
                const totalCost = run.totalProductionCost || (qty * costPerUnit);
                
                const totalRevenue = qty * sellingPrice;
                const profitBDT = totalRevenue - totalCost;
                const profitPercent = totalCost > 0 ? (profitBDT / totalCost) * 100 : 0;
                
                return (
                  <tr key={run.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{run.batchNo}</div>
                      <div className="text-[11px] text-slate-500">{formatDate(run.date)}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{product?.nameBangla || run.recipeName}</div>
                      <div className="text-[11px] text-slate-400">{run.unit || product?.unit}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-700">
                      {qty}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {formatCurrency(costPerUnit)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {formatCurrency(sellingPrice)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-rose-600">
                      {formatCurrency(totalCost)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-600">
                      {formatCurrency(totalRevenue)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      <span className={profitBDT >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                        {formatCurrency(profitBDT)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          profitPercent >= 25
                            ? 'bg-emerald-50 text-emerald-700'
                            : profitPercent > 0
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {profitPercent.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
              {productionRuns.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    কোনো প্রোডাকশন ব্যাচ পাওয়া যায়নি
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Informative Guidance */}
      <div className="bg-teal-50/70 p-4 rounded-2xl border border-teal-200 text-xs text-teal-900 space-y-1 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">সিস্টেম অটোমেশন নোট:</span>
          <p className="mt-0.5 text-slate-600">
            প্রতিটি প্রোডাকশন রান সম্পন্ন হওয়ার সাথে সাথে কাঁচামালের বাজারমূল্য ও শ্রম খরচের সমন্বয়ে এই চার্টের ইউনিট কস্ট স্বয়ংক্রিয়ভাবে হালনাগাদ হয়। এর ফলে আপনি পণ্যের প্রকৃত উৎপাদন খরচ এবং সঠিক বিক্রয়মূল্য নিশ্চিত করতে পারবেন।
          </p>
        </div>
      </div>
    </div>
  );
};
