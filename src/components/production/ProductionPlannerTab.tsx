import React, { useState } from 'react';
import { DataExportToolbar } from '../common/DataExportToolbar';
import { BOMRecipe } from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatCurrency, exportToCSV } from '../../utils/formatters';
import {
  Calculator,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Package,
  ArrowRight,
  Layers,
  Sparkles,
  Download,
  Printer,
  Play,
  ShoppingCart,
  Zap,
} from 'lucide-react';

interface ProductionPlannerTabProps {
  onStartProductionWithTarget?: (recipe: BOMRecipe, targetUnits: number) => void;
}

export const ProductionPlannerTab: React.FC<ProductionPlannerTabProps> = ({
  onStartProductionWithTarget,
}) => {
  const { bomRecipes, products, calculateProductionCapacity, settings } = useERP();

  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(
    bomRecipes[0]?.id || ''
  );

  const selectedRecipe = bomRecipes.find(r => r.id === selectedRecipeId) || bomRecipes[0];

  // Target units input by user for requirement / deficit simulation
  const [targetUnits, setTargetUnits] = useState<number>(
    selectedRecipe ? selectedRecipe.outputQuantity * 2 : 200
  );

  // When recipe changes, reset target to 2 standard batches
  const handleRecipeChange = (id: string) => {
    setSelectedRecipeId(id);
    const r = bomRecipes.find(item => item.id === id);
    if (r) {
      setTargetUnits(r.outputQuantity * 2);
    }
  };

  const capacityData = selectedRecipe
    ? calculateProductionCapacity(selectedRecipe.id, targetUnits)
    : {
        maxProducibleUnits: 0,
        maxBatches: 0,
        limitingIngredient: null,
        ingredientStatuses: [],
      };

  const hasShortagesForTarget = capacityData.ingredientStatuses.some(
    s => s.shortageForTarget > 0
  );

  const totalDeficitCost = capacityData.ingredientStatuses.reduce((sum, s) => {
    const raw = products.find(p => p.id === s.productId);
    const rate = raw?.purchasePrice || 0;
    return sum + (s.shortageForTarget * rate);
  }, 0);

  const handleExportCSV = () => {
    if (!selectedRecipe) return;

    const headers = [
      'কাঁচামালের নাম',
      'একক',
      '১ ব্যাচে প্রয়োজন',
      'বর্তমান স্টক মজুদ',
      'বর্তমান মজুদে সর্বোচ্চ ইউনিট',
      `টার্গেট (${targetUnits} ${selectedRecipe.outputUnit}) প্রয়োজন`,
      'ঘাটতি (ক্রয় করতে হবে)',
    ];

    const rows = capacityData.ingredientStatuses.map(s => [
      s.productName,
      s.unit,
      s.requiredPerBatch,
      s.currentStock,
      s.producibleUnits,
      s.requiredForTarget,
      s.shortageForTarget > 0 ? s.shortageForTarget : 0,
    ]);

    exportToCSV(`Production_Plan_${selectedRecipe.recipeCode}_Target_${targetUnits}`, headers, rows);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!selectedRecipe) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
        <Calculator className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-bold text-slate-700">কোনো রেসিপি পাওয়া যায়নি</h3>
        <p className="text-xs text-slate-500 mt-1">প্রথমে একটি রেসিপি তৈরি করুন।</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Toolbar */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-xl border border-slate-700 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30">
              <Zap className="w-3.5 h-3.5" />
              <span>ইন্টেলিজেন্ট প্রোডাকশন প্ল্যানার ও বটলেনেক অ্যানালাইসিস</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              বর্তমান কাঁচামাল মজুদে কত উৎপাদন সম্ভব?
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              সিস্টেম প্রতিটি উপাদানের বর্তমান গুদাম স্টক যাচাই করে সর্বোচ্চ উৎপাদন সীমা এবং সবচেয়ে সীমিত কাঁচামাল (Bottleneck Limiting Ingredient) স্বয়ংক্রিয়ভাবে চিহ্নিত করে।
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0 print:hidden">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-all border border-slate-700"
            >
              <Printer className="w-4 h-4" />
              <span>প্রিন্ট প্ল্যান</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-all border border-slate-700"
            >
              <Download className="w-4 h-4" />
              <span>CSV এক্সেল</span>
            </button>
          </div>
        </div>
      </div>

      {/* Selector & Interactive Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs print:border-none print:shadow-none">
        <div className="md:col-span-2 space-y-1">
          <label className="text-xs font-bold text-slate-700">
            তৈরি পণ্য / রেসিপি নির্বাচন করুন
          </label>
          <select
            value={selectedRecipeId}
            onChange={e => handleRecipeChange(e.target.value)}
            className="w-full text-xs font-bold px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
          >
            {bomRecipes.map(r => (
              <option key={r.id} value={r.id}>
                {r.finishedProductName} — {r.recipeName} (স্ট্যান্ডার্ড ব্যাচ: {r.outputQuantity} {r.outputUnit})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">
            পরিকল্পিত উৎপাদনের লক্ষ্য (Target Units)
          </label>
          <div className="relative">
            <input
              type="number"
              min="1"
              value={targetUnits}
              onChange={e => setTargetUnits(Math.max(1, Number(e.target.value)))}
              className="w-full text-sm font-mono font-bold px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
            />
            <span className="absolute right-3.5 top-3 text-xs text-slate-500 font-semibold">
              {selectedRecipe.outputUnit}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards: Max Capacity, Max Batches, Limiting Ingredient */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Max Units */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">
              বর্তমান স্টকে সর্বোচ্চ উৎপাদন
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black font-mono text-slate-900">
              {capacityData.maxProducibleUnits}
              <span className="text-sm font-bold text-slate-500 ml-1.5">
                {selectedRecipe.outputUnit}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              বর্তমান কোনো কাঁচামাল ক্রয় না করেই তৈরি সম্ভব
            </p>
          </div>
        </div>

        {/* Card 2: Max Batches */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">
              সর্বোচ্চ সম্পূর্ণ ব্যাচ
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black font-mono text-blue-900">
              {capacityData.maxBatches}
              <span className="text-sm font-bold text-slate-500 ml-1.5">ব্যাচ</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              প্রতি ব্যাচে {selectedRecipe.outputQuantity} {selectedRecipe.outputUnit}
            </p>
          </div>
        </div>

        {/* Card 3: Limiting Bottleneck */}
        <div className="p-5 rounded-3xl bg-rose-50 border-2 border-rose-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-800">
            <span className="text-xs font-bold uppercase tracking-wider">
              সীমাবদ্ধকারী কাঁচামাল (Bottleneck)
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {capacityData.limitingIngredient ? (
              <div>
                <div className="text-lg font-black text-rose-950 truncate">
                  {capacityData.limitingIngredient.productName}
                </div>
                <p className="text-xs text-rose-800 mt-0.5">
                  স্টকে আছে: <span className="font-bold">{capacityData.limitingIngredient.currentStock} {capacityData.limitingIngredient.unit}</span> (প্রতি ব্যাচে লাগে {capacityData.limitingIngredient.requiredPerBatch} {capacityData.limitingIngredient.unit})
                </p>
              </div>
            ) : (
              <div className="text-sm font-bold text-emerald-800">
                সকল উপাদান সুষম অনুপাতে আছে
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Target Feasibility Status Banner */}
      <div className={`p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        hasShortagesForTarget
          ? 'bg-amber-50/80 border-amber-200 text-amber-950'
          : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
      }`}>
        <div className="flex items-center gap-3.5">
          {hasShortagesForTarget ? (
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs font-bold">
              <AlertCircle className="w-6 h-6" />
            </div>
          ) : (
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          )}
          <div>
            <h4 className="text-sm sm:text-base font-black">
              {hasShortagesForTarget
                ? `টার্গেট ${targetUnits} ${selectedRecipe.outputUnit} উৎপাদনের জন্য কাঁচামাল ক্রয় প্রয়োজন!`
                : `পর্যাপ্ত কাঁচামাল মজুদ আছে! টার্গেট ${targetUnits} ${selectedRecipe.outputUnit} অবিলম্বে উৎপাদন সম্ভব।`}
            </h4>
            <p className="text-xs mt-0.5 opacity-90">
              {hasShortagesForTarget
                ? `ঘাটতি কাঁচামাল ক্রয় করতে আনুমানিক ব্যয় হবে ${formatCurrency(totalDeficitCost)}`
                : 'সকল উপাদান গুদামে বিদ্যমান, এখনই প্রোডাকশন ব্যাচ রান করতে পারেন।'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 print:hidden">
          {onStartProductionWithTarget && (
            <button
              onClick={() => onStartProductionWithTarget(selectedRecipe, targetUnits)}
              disabled={hasShortagesForTarget}
              className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all shadow-xs ${
                hasShortagesForTarget
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-600 text-slate-950 active:scale-95'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>টার্গেট অনুযায়ী প্রোডাকশন শুরু করুন</span>
            </button>
          )}
        </div>
      </div>

      {/* Detailed Material Requirement Breakdown Table */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-600" />
            <span>উপাদানভিত্তিক প্রাপ্যতা ও চাহিদা বিশ্লেষণ (Material Breakdown)</span>
          </h3>
          <span className="text-xs text-slate-500">
            টার্গেট: {targetUnits} {selectedRecipe.outputUnit}
          </span>
        </div>

        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">কাঁচামাল</th>
                <th className="py-2.5 px-3 text-right">১ ব্যাচে প্রয়োজন</th>
                <th className="py-2.5 px-3 text-right">বর্তমান স্টক</th>
                <th className="py-2.5 px-3 text-right">বর্তমান স্টকে সক্ষমতা</th>
                <th className="py-2.5 px-3 text-right">টার্গেটে মোট প্রয়োজন</th>
                <th className="py-2.5 px-3 text-right">ঘাটতি (ক্রয় করতে হবে)</th>
                <th className="py-2.5 px-3 text-center">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {capacityData.ingredientStatuses.map((item, idx) => {
                const isLimiting = capacityData.limitingIngredient?.productId === item.productId;
                const isShort = item.shortageForTarget > 0;

                return (
                  <tr
                    key={item.productId}
                    className={`transition-colors ${
                      isLimiting
                        ? 'bg-rose-50/70 font-medium'
                        : isShort
                        ? 'bg-amber-50/40'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono text-slate-400 text-center w-8">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span>{item.productName}</span>
                        {isLimiting && (
                          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-rose-600 text-white uppercase tracking-wider">
                            বটলেনেক
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      {item.requiredPerBatch} {item.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {item.currentStock} {item.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-900">
                      {item.producibleUnits} {selectedRecipe.outputUnit}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {item.requiredForTarget} {item.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-rose-700">
                      {item.shortageForTarget > 0 ? (
                        <span>{item.shortageForTarget} {item.unit}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {item.shortageForTarget <= 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          পর্যাপ্ত ✅
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          ঘাটতি ❌
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
    </div>
  );
};
