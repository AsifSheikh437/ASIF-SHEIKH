import React, { useState, useEffect } from 'react';
import { DataExportToolbar } from '../common/DataExportToolbar';
import { BOMRecipe, ProductionRun } from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  Play,
  X,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  TrendingDown,
  UserCheck,
  FileText,
  Clock,
  ShieldAlert,
} from 'lucide-react';

interface ProductionRunModalProps {
  initialRecipe?: BOMRecipe | null;
  initialTargetUnits?: number;
  onClose: () => void;
  onSuccess?: (run: ProductionRun) => void;
}

export const ProductionRunModal: React.FC<ProductionRunModalProps> = ({
  initialRecipe,
  initialTargetUnits,
  onClose,
  onSuccess,
}) => {
  const { bomRecipes, products, currentUser, executeProductionRun } = useERP();

  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(
    initialRecipe?.id || bomRecipes[0]?.id || ''
  );

  const activeRecipe = bomRecipes.find(r => r.id === selectedRecipeId) || bomRecipes[0];

  // Entry Mode: 'BATCH_COUNT' or 'TOTAL_UNITS'
  const [entryMode, setEntryMode] = useState<'BATCH_COUNT' | 'TOTAL_UNITS'>('BATCH_COUNT');
  const [batchCount, setBatchCount] = useState<number>(1);
  const [targetUnits, setTargetUnits] = useState<number>(() => {
    if (initialTargetUnits) return initialTargetUnits;
    return activeRecipe?.outputQuantity || 100;
  });

  // Calculate actual expected output units based on active mode
  const standardBatchSize = activeRecipe?.outputQuantity || 1;
  const expectedQuantity =
    entryMode === 'BATCH_COUNT'
      ? batchCount * standardBatchSize
      : targetUnits;

  // Actual output produced (for Yield & Wastage tracking)
  const [actualQuantity, setActualQuantity] = useState<number>(expectedQuantity);

  // Sync actualQuantity when expectedQuantity changes unless user manually changed it
  useEffect(() => {
    setActualQuantity(expectedQuantity);
  }, [expectedQuantity]);

  // Batch identification & dates
  const todayStr = new Date().toISOString().substring(0, 10);
  const [batchNo, setBatchNo] = useState<string>(() => {
    const d = new Date();
    const yy = d.getFullYear().toString().slice(-2);
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    const randomSeq = Math.floor(100 + Math.random() * 900);
    return `BT-${yy}${mm}-${randomSeq}`;
  });

  const [mfgDate, setMfgDate] = useState<string>(todayStr);

  // Auto calculate Expiry Date based on recipe's shelfLifeDays
  const [expDate, setExpDate] = useState<string>(() => {
    const d = new Date();
    const days = activeRecipe?.shelfLifeDays || 90;
    d.setDate(d.getDate() + days);
    return d.toISOString().substring(0, 10);
  });

  useEffect(() => {
    if (activeRecipe?.shelfLifeDays && mfgDate) {
      const d = new Date(mfgDate);
      d.setDate(d.getDate() + (activeRecipe.shelfLifeDays || 90));
      setExpDate(d.toISOString().substring(0, 10));
    }
  }, [mfgDate, activeRecipe]);

  const [supervisor, setSupervisor] = useState<string>(
    currentUser?.name ? `${currentUser.name} (${currentUser.role})` : 'প্ল্যান্ট সুপারভাইজার'
  );
  const [notes, setNotes] = useState<string>('');

  // Stock Check & Ingredient requirements
  const multiplier = expectedQuantity / standardBatchSize;

  const ingredientStockCheck = (activeRecipe?.ingredients || []).map(ing => {
    const rawProd = products.find(p => p.id === ing.productId);
    const requiredQty = Number((ing.quantity * multiplier).toFixed(2));
    const currentStock = rawProd?.currentStock || 0;
    const unitRate = rawProd?.purchasePrice || ing.unitCost || 0;
    const isSufficient = currentStock >= requiredQty;
    const shortage = isSufficient ? 0 : Number((requiredQty - currentStock).toFixed(2));
    const lineCost = requiredQty * unitRate;

    return {
      ...ing,
      requiredQty,
      currentStock,
      isSufficient,
      shortage,
      unitRate,
      lineCost,
      rawProd,
    };
  });

  const hasShortage = ingredientStockCheck.some(it => !it.isSufficient);
  const shortageItems = ingredientStockCheck.filter(it => !it.isSufficient);

  // Costs calculation
  const totalRawCost = ingredientStockCheck.reduce((sum, it) => sum + it.lineCost, 0);
  const laborCost = (activeRecipe?.laborCostPerBatch || 0) * multiplier;
  const overheadCost = (activeRecipe?.overheadCostPerBatch || 0) * multiplier;
  const totalProductionCost = totalRawCost + laborCost + overheadCost;
  const costPerUnit = actualQuantity > 0 ? totalProductionCost / actualQuantity : 0;

  // Yield & Wastage calculations
  const wastageQuantity = Math.max(0, expectedQuantity - actualQuantity);
  const yieldPercent = expectedQuantity > 0 ? Number(((actualQuantity / expectedQuantity) * 100).toFixed(2)) : 100;
  const wastagePercent = expectedQuantity > 0 ? Number(((wastageQuantity / expectedQuantity) * 100).toFixed(2)) : 0;
  const wastageFinancialLoss = wastageQuantity * costPerUnit;

  const [submissionError, setSubmissionError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError('');

    if (!activeRecipe) {
      setSubmissionError('কোনো রেসিপি পাওয়া যায়নি!');
      return;
    }

    if (hasShortage) {
      setSubmissionError('কাঁচামাল সংকট! পর্যাপ্ত স্টক ছাড়া প্রোডাকশন সম্পন্ন করা সম্ভব নয়।');
      return;
    }

    if (actualQuantity <= 0) {
      setSubmissionError('প্রকৃত উৎপাদিত পরিমাণ শূন্যের বেশি হতে হবে!');
      return;
    }

    if (!batchNo.trim()) {
      setSubmissionError('ব্যাচ নম্বর প্রদান করুন!');
      return;
    }

    setIsSubmitting(true);

    const result = executeProductionRun(
      activeRecipe.id,
      batchNo.trim(),
      actualQuantity,
      supervisor.trim(),
      mfgDate,
      expDate,
      notes.trim(),
      {
        expectedQuantity,
        laborCost,
        overheadCost,
      }
    );

    setIsSubmitting(false);

    if (result.success) {
      if (onSuccess && result.run) {
        onSuccess(result.run);
      }
      onClose();
    } else {
      setSubmissionError(result.error || 'প্রোডাকশন প্রক্রিয়ায় ত্রুটি হয়েছে!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
              <Play className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">নতুন উৎপাদন ও প্রোডাকশন ব্যাচ এন্ট্রি</h2>
              <p className="text-xs text-slate-400">
                স্বয়ংক্রিয় FEFO কাঁচামাল কর্তন, ফিনিশড গুডস স্টক বৃদ্ধি ও Yield/Wastage ট্র্যাকিং
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {submissionError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-800 font-semibold">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-rose-900">প্রোডাকশন সম্পন্ন করা সম্ভব হচ্ছে না!</div>
                <div className="mt-0.5">{submissionError}</div>
              </div>
            </div>
          )}

          {/* Top Selection & Sizing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-700">
                রেসিপি / তৈরি পণ্য নির্বাচন করুন *
              </label>
              <select
                value={selectedRecipeId}
                onChange={e => setSelectedRecipeId(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
              >
                {bomRecipes.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.finishedProductName} — {r.recipeName} (১ ব্যাচ = {r.outputQuantity} {r.outputUnit})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">উৎপাদন নির্ধারণ মোড</label>
              <div className="grid grid-cols-2 gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setEntryMode('BATCH_COUNT')}
                  className={`py-1.5 font-bold rounded-lg text-center transition-all ${
                    entryMode === 'BATCH_COUNT'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  ব্যাচ সংখ্যা
                </button>
                <button
                  type="button"
                  onClick={() => setEntryMode('TOTAL_UNITS')}
                  className={`py-1.5 font-bold rounded-lg text-center transition-all ${
                    entryMode === 'TOTAL_UNITS'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  মোট ইউনিট
                </button>
              </div>
            </div>

            {/* Sizing Input */}
            {entryMode === 'BATCH_COUNT' ? (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  কতটি ব্যাচ উৎপাদন হবে? *
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={batchCount}
                  onChange={e => setBatchCount(Math.max(0.1, Number(e.target.value)))}
                  className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[11px] text-slate-500">
                  = মোট প্রত্যাশিত: <span className="font-bold text-slate-900">{expectedQuantity} {activeRecipe?.outputUnit}</span>
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  টার্গেট ইউনিটের পরিমাণ *
                </label>
                <input
                  type="number"
                  min="1"
                  value={targetUnits}
                  onChange={e => setTargetUnits(Math.max(1, Number(e.target.value)))}
                  className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[11px] text-slate-500">
                  = ব্যাচ গুণক: <span className="font-bold text-slate-900">{multiplier.toFixed(2)} ব্যাচ</span>
                </p>
              </div>
            )}

            {/* Batch Number */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                ব্যাচ নম্বর (Batch Number) *
              </label>
              <input
                type="text"
                value={batchNo}
                onChange={e => setBatchNo(e.target.value)}
                required
                className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Supervisor */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                সুপারভাইজার / দায়িত্বপ্রাপ্ত কর্মকর্তা
              </label>
              <input
                type="text"
                value={supervisor}
                onChange={e => setSupervisor(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Dates Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>উৎপাদন তারিখ (Manufacturing Date) *</span>
              </label>
              <input
                type="date"
                value={mfgDate}
                onChange={e => setMfgDate(e.target.value)}
                required
                className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-rose-600" />
                <span>মেয়াদ উত্তীর্ণ তারিখ (Expiry Date) *</span>
              </label>
              <input
                type="date"
                value={expDate}
                onChange={e => setExpDate(e.target.value)}
                required
                className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-[10px] text-slate-500">
                শেলফ লাইফ {activeRecipe?.shelfLifeDays || 90} দিন অনুযায়ী হিসাবকৃত
              </p>
            </div>
          </div>

          {/* Stock Check & Warning Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-600" />
                <span>প্রয়োজনীয় কাঁচামাল ও রিয়েলটাইম স্টক চেকিং (FEFO কাটিং)</span>
              </h4>
              <span className="text-[11px] text-slate-500">
                FEFO লজিক: নিকটবর্তী মেয়াদের ব্যাচগুলো আগে কাটা হবে
              </span>
            </div>

            {/* Shortage Warning Banner */}
            {hasShortage ? (
              <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl space-y-2 text-rose-900">
                <div className="flex items-center gap-2 font-bold text-xs text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>সতর্কবার্তা: কাঁচামাল ঘাটতি রয়েছে! নিচের উপাদানগুলোর মজুদ অপর্যাপ্ত:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {shortageItems.map(sh => (
                    <div key={sh.productId} className="bg-white/80 p-2 rounded-xl border border-rose-200">
                      <span className="font-bold">{sh.productName}</span>: প্রয়োজন {sh.requiredQty} {sh.unit}, কিন্তু স্টকে আছে মাত্র <span className="font-bold">{sh.currentStock} {sh.unit}</span> (ঘাটতি: <span className="font-black text-rose-700">{sh.shortage} {sh.unit}</span>)
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>সকল কাঁচামাল স্টকে পর্যাপ্ত রয়েছে। স্বয়ংক্রিয় FEFO কর্তনের জন্য প্রস্তুত।</span>
              </div>
            )}

            {/* Ingredients Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                    <th className="py-2.5 px-3">কাঁচামাল</th>
                    <th className="py-2.5 px-3 text-right">প্রয়োজন</th>
                    <th className="py-2.5 px-3 text-right">বর্তমান স্টক</th>
                    <th className="py-2.5 px-3 text-right">দর (৳)</th>
                    <th className="py-2.5 px-3 text-right">খরচ (৳)</th>
                    <th className="py-2.5 px-3 text-center">স্থিতি</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ingredientStockCheck.map(item => (
                    <tr key={item.productId} className={item.isSufficient ? 'hover:bg-slate-50' : 'bg-rose-50/50'}>
                      <td className="py-2 px-3 font-semibold text-slate-800">
                        {item.productName}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {item.requiredQty} {item.unit}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600">
                        {item.currentStock} {item.unit}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-500">
                        {formatCurrency(item.unitRate, true)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(item.lineCost)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {item.isSufficient ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            পর্যাপ্ত ✅
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-200 text-rose-800">
                            ঘাটতি: {item.shortage} {item.unit} ❌
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Yield & Wastage Tracking Box */}
          <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>আউটপুট, ইল্ড (Yield %) ও অপচয় (Wastage) ট্র্যাকিং</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  রেসিপির প্রত্যাশিত আউটপুট এবং প্রকৃত উৎপাদনের পার্থক্য ও আর্থিক ক্ষতি হিসাব
                </p>
              </div>

              <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
                <span className="text-slate-400">প্রত্যাশিত আউটপুট:</span>
                <span className="font-mono font-bold text-amber-400">
                  {expectedQuantity} {activeRecipe?.outputUnit}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Actual Output Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200">
                  প্রকৃত উৎপাদন (Actual Output Qty) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={actualQuantity}
                    onChange={e => setActualQuantity(Math.max(1, Number(e.target.value)))}
                    required
                    className="w-full text-sm font-mono font-black px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-amber-400"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold">
                    {activeRecipe?.outputUnit}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  প্যাকেজিং শেষে প্রাপ্ত খাঁটি সংখ্যা
                </p>
              </div>

              {/* Yield % Gauge */}
              <div className="bg-slate-800/90 p-3.5 rounded-2xl border border-slate-700 flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  উৎপাদন হার (Yield %)
                </span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className={`text-2xl font-black font-mono ${
                    yieldPercent >= 97 ? 'text-emerald-400' : yieldPercent >= 92 ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {yieldPercent}%
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    (টার্গেটের {((actualQuantity / (expectedQuantity || 1)) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1.5">
                  <div
                    className={`h-full transition-all duration-300 ${
                      yieldPercent >= 97 ? 'bg-emerald-400' : yieldPercent >= 92 ? 'bg-amber-400' : 'bg-rose-400'
                    }`}
                    style={{ width: `${Math.min(100, yieldPercent)}%` }}
                  />
                </div>
              </div>

              {/* Wastage Summary */}
              <div className="bg-slate-800/90 p-3.5 rounded-2xl border border-slate-700 flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  অপচয় / প্রসেস লস (Wastage)
                </span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className={`text-xl font-black font-mono ${wastageQuantity > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                    {wastageQuantity} {activeRecipe?.outputUnit}
                  </span>
                  <span className="text-xs font-mono text-rose-300 font-bold">
                    {wastagePercent > 0 ? `(${wastagePercent}%)` : '০%'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 mt-1">
                  ক্ষতির আর্থিক মূল্য: <span className="font-bold text-rose-300">{formatCurrency(wastageFinancialLoss)}</span>
                </div>
              </div>
            </div>

            {wastageQuantity > 0 && (
              <div className="p-2.5 bg-rose-950/60 border border-rose-800/80 rounded-xl text-[11px] text-rose-200 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  অপচয় হওয়া {wastageQuantity} {activeRecipe?.outputUnit}-এর জন্য স্বয়ংক্রিয়ভাবে একটি ফ্যাক্টরি স্পিলেজ ভাউচার (WST-PRD-{batchNo}) তৈরি হবে এবং অপচয় রিপোর্টে যুক্ত হবে।
                </span>
              </div>
            )}
          </div>

          {/* Cost Summary & COGS Integration Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-amber-50/60 p-4 rounded-2xl border border-amber-200">
            <div className="space-y-1.5 text-xs text-slate-700">
              <div className="flex justify-between">
                <span>কাঁচামাল খরচ:</span>
                <span className="font-mono font-bold text-slate-900">{formatCurrency(totalRawCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>শ্রমিক মজুরি:</span>
                <span className="font-mono font-bold text-slate-900">{formatCurrency(laborCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>ওভারহেড ও ইউটিলিটি:</span>
                <span className="font-mono font-bold text-slate-900">{formatCurrency(overheadCost)}</span>
              </div>
              <div className="border-t border-amber-200 pt-1.5 flex justify-between font-bold text-slate-900">
                <span>সর্বমোট প্রোডাকশন ব্যয়:</span>
                <span className="font-mono text-sm font-black">{formatCurrency(totalProductionCost)}</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-amber-200 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900">
                  ইউনিট প্রতি প্রস্তুত ব্যয় (COGS Per Unit)
                </span>
                <div className="text-xl font-black font-mono text-slate-950 mt-0.5">
                  {formatCurrency(costPerUnit, true)}
                </div>
                <div className="text-[10px] text-slate-500">
                  তৈরি পণ্য স্টকে এই মূল্যে যোগ হবে ও সেলসে লাভ-ক্ষতি গণনায় ব্যবহৃত হবে।
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">
              মন্তব্য / কোয়ালিটি ইন্সপেকশন নোট
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="ব্যাচের গুণমান, ওভেন বা মেশিনের অবস্থা, কোনো বিশেষ পর্যবেক্ষণ..."
              className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={isSubmitting || hasShortage}
              className={`flex items-center gap-2 px-6 py-2.5 font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 ${
                hasShortage
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isSubmitting ? 'প্রক্রিয়াধীন...' : 'প্রোডাকশন সম্পন্ন করুন'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
