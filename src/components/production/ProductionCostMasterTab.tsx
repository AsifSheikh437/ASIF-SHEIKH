import React, { useState } from 'react';
import { DataExportToolbar } from '../common/DataExportToolbar';
import { useERP } from '../../context/ERPContext';
import { formatCurrency, formatDate, exportToCSV } from '../../utils/formatters';
import {
  DollarSign,
  TrendingUp,
  Printer,
  Download,
  Percent,
  Sliders,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const ProductionCostMasterTab: React.FC = () => {
  const { products, productionCosts, bomRecipes, settings } = useERP();

  const [simulatedMargin, setSimulatedMargin] = useState<number>(30);

  // Finished Goods list with their real-time or recorded cost master data
  const finishedProducts = products.filter(p => p.category === 'FINISHED_GOODS');

  const costRows = finishedProducts.map(prod => {
    const costItem = productionCosts.find(c => c.productId === prod.id);
    const recipe = bomRecipes.find(r => r.finishedProductId === prod.id);

    // Derived or recorded costs
    const rawCost = costItem?.rawMaterialCost || (recipe && recipe.outputQuantity > 0 ? recipe.totalRawMaterialCost / recipe.outputQuantity : prod.purchasePrice * 0.7);
    const laborCost = costItem?.laborCost || (recipe && recipe.outputQuantity > 0 ? recipe.laborCostPerBatch / recipe.outputQuantity : prod.purchasePrice * 0.15);
    const overheadCost = costItem?.overheadUtilityCost || (recipe && recipe.outputQuantity > 0 ? recipe.overheadCostPerBatch / recipe.outputQuantity : prod.purchasePrice * 0.15);
    const packagingCost = costItem?.packagingCost || 0;

    const totalCost = costItem?.totalUnitCost || prod.purchasePrice || (rawCost + laborCost + overheadCost + packagingCost);
    const targetMargin = costItem?.targetProfitMarginPercent || simulatedMargin;
    const suggestedPrice = Math.round(totalCost * (1 + targetMargin / 100) * 10) / 10;
    const currentSalePrice = prod.salePrice || 0;
    const profitPerUnit = currentSalePrice - totalCost;
    const currentMarginPct = currentSalePrice > 0 ? (profitPerUnit / currentSalePrice) * 100 : 0;

    const simulatedPrice = Math.round(totalCost * (1 + simulatedMargin / 100) * 10) / 10;

    return {
      prod,
      recipe,
      rawCost,
      laborCost,
      overheadCost,
      packagingCost,
      totalCost,
      targetMargin,
      suggestedPrice,
      currentSalePrice,
      profitPerUnit,
      currentMarginPct,
      simulatedPrice,
      updatedAt: costItem?.updatedAt || prod.createdAt || '2026-09-01',
    };
  });

  const handleExportCSV = () => {
    const headers = [
      'পণ্য কোড',
      'তৈরি পণ্যের নাম',
      'কাঁচামাল ব্যয় (৳)',
      'শ্রমিক মজুরি (৳)',
      'ওভারহেড ও ইউটিলিটি (৳)',
      'প্যাকেজিং (৳)',
      'মোট একক প্রস্তুত ব্যয় (COGS ৳)',
      'টার্গেট মার্জিন (%)',
      'প্রস্তাবিত বিক্রয়মূল্য (৳)',
      'বর্তমান ক্যাটালগ মূল্য (৳)',
      'একক নিট মুনাফা (৳)',
      'বর্তমান মার্জিন (%)',
    ];

    const rows = costRows.map(r => [
      r.prod.id,
      r.prod.nameBangla,
      r.rawCost.toFixed(2),
      r.laborCost.toFixed(2),
      r.overheadCost.toFixed(2),
      r.packagingCost.toFixed(2),
      r.totalCost.toFixed(2),
      `${r.targetMargin}%`,
      r.suggestedPrice.toFixed(2),
      r.currentSalePrice.toFixed(2),
      r.profitPerUnit.toFixed(2),
      `${r.currentMarginPct.toFixed(1)}%`,
    ]);

    exportToCSV(`Production_Cost_Master_${new Date().toISOString().substring(0, 10)}`, headers, rows);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs print:border-none print:shadow-none">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-600" />
            <span>প্রোডাকশন কস্ট মাস্টার ও COGS শিট (Cost of Goods Sold)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            প্রতিটি তৈরি পণ্যের কাঁচামাল, মজুরি ও ওভারহেড ভেঙে সঠিক ইউনিট কস্ট ও বিক্রয় মুনাফা বিশ্লেষণ
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>প্রিন্ট শিট</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
          >
            <Download className="w-4 h-4" />
            <span>CSV এক্সেল</span>
          </button>
        </div>
      </div>

      {/* Interactive Margin Simulator Slider */}
      <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent p-5 rounded-3xl border border-amber-200/80 flex flex-col md:flex-row md:items-center justify-between gap-5 print:hidden">
        <div className="space-y-1 max-w-md">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
            <Sliders className="w-4 h-4 text-amber-600" />
            <span>প্রফিট মার্জিন সিমুলেটর (Target Markup Simulator)</span>
          </div>
          <p className="text-xs text-slate-600">
            মার্জিন স্লাইডার পরিবর্তন করে দেখুন বিভিন্ন মুনাফা হারে প্রতিটি পণ্যের বিক্রয়মূল্য কত হওয়া উচিত।
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0 bg-white p-3 rounded-2xl border border-amber-200 shadow-xs">
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>টার্গেট গ্রস মার্জিন:</span>
              <span className="font-mono text-amber-600 font-black">{simulatedMargin}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="70"
              step="5"
              value={simulatedMargin}
              onChange={e => setSimulatedMargin(Number(e.target.value))}
              className="w-48 accent-amber-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Cost Master Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <div className="p-4 pb-0"><DataExportToolbar filename="ProductionCostMasterTab_Export" /></div>
<table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                <th className="py-3 px-3.5">তৈরি পণ্য (Finished Product)</th>
                <th className="py-3 px-3.5 text-right">কাঁচামাল</th>
                <th className="py-3 px-3.5 text-right">মজুরি</th>
                <th className="py-3 px-3.5 text-right">ওভারহেড</th>
                <th className="py-3 px-3.5 text-right bg-amber-50/70 text-amber-950 font-black">
                  মোট COGS (একক ব্যয়)
                </th>
                <th className="py-3 px-3.5 text-right">বর্তমান বিক্রয়মূল্য</th>
                <th className="py-3 px-3.5 text-right">নিট লাভ (৳)</th>
                <th className="py-3 px-3.5 text-center">মুনাফার হার (%)</th>
                <th className="py-3 px-3.5 text-right font-bold text-amber-800">
                  {simulatedMargin}% মার্জিনে প্রস্তাবিত
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {costRows.map(row => (
                <tr key={row.prod.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3.5 font-semibold text-slate-900">
                    <div>{row.prod.nameBangla}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {row.prod.id} • {row.prod.unit}
                    </div>
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono text-slate-600">
                    {formatCurrency(row.rawCost, true)}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono text-slate-600">
                    {formatCurrency(row.laborCost, true)}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono text-slate-600">
                    {formatCurrency(row.overheadCost, true)}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono font-black text-slate-950 bg-amber-50/40 text-sm">
                    {formatCurrency(row.totalCost, true)}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900">
                    {formatCurrency(row.currentSalePrice)}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-700">
                    {row.profitPerUnit > 0 ? `+${formatCurrency(row.profitPerUnit, true)}` : formatCurrency(row.profitPerUnit, true)}
                  </td>
                  <td className="py-3 px-3.5 text-center font-mono">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      row.currentMarginPct >= 25
                        ? 'bg-emerald-100 text-emerald-800'
                        : row.currentMarginPct >= 15
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {row.currentMarginPct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono font-black text-amber-700 text-sm">
                    {formatCurrency(row.simulatedPrice, true)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Informational Footer on COGS & P&L Synchronization */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3 text-xs text-slate-600">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold text-slate-800">অটোমেটেড COGS ইন্টিগ্রেশন:</span> প্রোডাকশন চলাকালীন প্রতিটি ব্যাচে নির্ধারিত সঠিক উৎপাদন খরচ স্বয়ংক্রিয়ভাবে পণ্যের ক্রয়মূল্য (Average Cost) হিসেবে সংরক্ষিত হয়। সেলস ও ইনভয়েস মডিউলে কোনো পণ্য বিক্রি হলে লাভ-ক্ষতি (P&L) রিপোর্টে এই COGS মান ব্যবহার করে গ্রস প্রফিট স্বয়ংক্রিয়ভাবে গণনা করা হয়।
        </div>
      </div>
    </div>
  );
};
