import React, { useState } from 'react';
import { DataExportToolbar } from '../common/DataExportToolbar';
import { BOMRecipe, BOMIngredient, UnitType } from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatCurrency } from '../../utils/formatters';
import { SearchableProductSelect } from '../common/SearchableProductSelect';
import { ManualUnitInput } from '../common/ManualUnitInput';
import {
  X,
  Plus,
  Trash2,
  ChefHat,
  Layers,
  HelpCircle,
  Save,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

interface RecipeFormModalProps {
  recipeToEdit?: BOMRecipe | null;
  onClose: () => void;
}

export const RecipeFormModal: React.FC<RecipeFormModalProps> = ({
  recipeToEdit,
  onClose,
}) => {
  const { products, addBOMRecipe, updateBOMRecipe } = useERP();

  // Finished Goods list for product selection
  const finishedProducts = products.filter(p => p.category === 'FINISHED_GOODS');
  const rawAndPackagingProducts = products.filter(p => p.category !== 'FINISHED_GOODS');

  // Initial state setup
  const [selectedProductId, setSelectedProductId] = useState<string>(
    recipeToEdit?.finishedProductId || finishedProducts[0]?.id || ''
  );
  const [recipeCode, setRecipeCode] = useState<string>(
    recipeToEdit?.recipeCode || `BOM-${Date.now().toString().slice(-4)}`
  );
  const [recipeName, setRecipeName] = useState<string>(
    recipeToEdit?.recipeName || ''
  );
  const [outputQuantity, setOutputQuantity] = useState<number>(
    recipeToEdit?.outputQuantity || 100
  );
  const [outputUnit, setOutputUnit] = useState<UnitType>(
    (recipeToEdit?.outputUnit as UnitType) || 'packet'
  );
  const [shelfLifeDays, setShelfLifeDays] = useState<number>(
    recipeToEdit?.shelfLifeDays || 90
  );
  const [instructions, setInstructions] = useState<string>(
    recipeToEdit?.instructions || ''
  );

  // Costing setup
  const [laborCostType, setLaborCostType] = useState<'FIXED' | 'PERCENT'>(
    recipeToEdit?.laborCostType || 'FIXED'
  );
  const [laborCostValue, setLaborCostValue] = useState<number>(
    recipeToEdit?.laborCostValue ?? (recipeToEdit?.laborCostPerBatch || 0)
  );

  const [overheadCostType, setOverheadCostType] = useState<'FIXED' | 'PERCENT'>(
    recipeToEdit?.overheadCostType || 'FIXED'
  );
  const [overheadCostValue, setOverheadCostValue] = useState<number>(
    recipeToEdit?.overheadCostValue ?? (recipeToEdit?.overheadCostPerBatch || 0)
  );

  // Ingredients state
  const [ingredients, setIngredients] = useState<BOMIngredient[]>(() => {
    if (recipeToEdit && recipeToEdit.ingredients.length > 0) {
      return recipeToEdit.ingredients;
    }
    // Default initial row
    const firstRaw = rawAndPackagingProducts[0];
    if (firstRaw) {
      return [
        {
          productId: firstRaw.id,
          productName: firstRaw.nameBangla,
          quantity: 1,
          unit: firstRaw.unit,
          unitCost: firstRaw.purchasePrice,
          totalCost: firstRaw.purchasePrice,
        },
      ];
    }
    return [];
  });

  const [error, setError] = useState<string>('');

  // Auto-fill recipe name and unit when finished product changes
  const handleFinishedProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = finishedProducts.find(p => p.id === prodId);
    if (prod) {
      if (!recipeToEdit) {
        setRecipeName(`${prod.nameBangla} রেসিপি (${outputQuantity} ${prod.unit} ব্যাচ)`);
        setOutputUnit(prod.unit);
      }
    }
  };

  // Ingredient row mutations
  const handleAddIngredient = () => {
    const raw = rawAndPackagingProducts.find(
      p => !ingredients.some(ing => ing.productId === p.id)
    ) || rawAndPackagingProducts[0];

    if (!raw) return;

    setIngredients(prev => [
      ...prev,
      {
        productId: raw.id,
        productName: raw.nameBangla,
        quantity: 1,
        unit: raw.unit,
        unitCost: raw.purchasePrice,
        totalCost: raw.purchasePrice,
      },
    ]);
  };

  const handleRemoveIngredient = (index: number) => {
    if (ingredients.length <= 1) {
      setError('রেসিপিতে কমপক্ষে একটি কাঁচামাল থাকা আবশ্যক!');
      return;
    }
    setError('');
    setIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const handleIngredientProductChange = (index: number, newProdId: string) => {
    const raw = rawAndPackagingProducts.find(p => p.id === newProdId);
    if (!raw) return;

    setIngredients(prev =>
      prev.map((ing, i) =>
        i === index
          ? {
              ...ing,
              productId: raw.id,
              productName: raw.nameBangla,
              unit: raw.unit,
              unitCost: raw.purchasePrice,
            }
          : ing
      )
    );
  };


  const handleIngredientUnitChange = (index: number, unit: string) => {
    const newIngs = [...ingredients];
    newIngs[index].unit = unit as UnitType;
    setIngredients(newIngs);
  };

  const handleIngredientQtyChange = (index: number, qty: number) => {
    setIngredients(prev =>
      prev.map((ing, i) => (i === index ? { ...ing, quantity: Math.max(0, qty) } : ing))
    );
  };

  const handleIngredientCostChange = (index: number, cost: number) => {
    setIngredients(prev =>
      prev.map((ing, i) => (i === index ? { ...ing, unitCost: Math.max(0, cost) } : ing))
    );
  };

  // Live Cost Calculations
  const totalRawMaterialCost = ingredients.reduce(
    (sum, ing) => sum + (ing.quantity * (ing.unitCost || 0)),
    0
  );

  const calculatedLaborCost =
    laborCostType === 'PERCENT'
      ? (totalRawMaterialCost * laborCostValue) / 100
      : laborCostValue;

  const calculatedOverheadCost =
    overheadCostType === 'PERCENT'
      ? (totalRawMaterialCost * overheadCostValue) / 100
      : overheadCostValue;

  const totalBatchCost = totalRawMaterialCost + calculatedLaborCost + calculatedOverheadCost;
  const costPerUnit = outputQuantity > 0 ? totalBatchCost / outputQuantity : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const finishedProd = finishedProducts.find(p => p.id === selectedProductId);
    if (!finishedProd) {
      setError('একটি তৈরি পণ্য (Finished Good) নির্বাচন করুন!');
      return;
    }

    if (!recipeName.trim()) {
      setError('রেসিপির একটি স্পষ্ট নাম লিখুন!');
      return;
    }

    if (outputQuantity <= 0) {
      setError('ব্যাচ সাইজ ১ বা তার বেশি হতে হবে!');
      return;
    }

    if (ingredients.length === 0) {
      setError('কমপক্ষে একটি উপাদান যোগ করুন!');
      return;
    }

    for (const ing of ingredients) {
      if (ing.quantity <= 0) {
        setError(`"${ing.productName}" এর পরিমাণ অবশ্যই শুন্যের চেয়ে বেশি হতে হবে!`);
        return;
      }
    }

    const payload: Omit<BOMRecipe, 'id'> = {
      recipeCode: recipeCode.trim(),
      recipeName: recipeName.trim(),
      finishedProductId: finishedProd.id,
      finishedProductName: finishedProd.nameBangla,
      outputQuantity,
      outputUnit: outputUnit as UnitType,
      shelfLifeDays,
      ingredients,
      totalRawMaterialCost,
      laborCostPerBatch: calculatedLaborCost,
      overheadCostPerBatch: calculatedOverheadCost,
      laborCostType,
      laborCostValue,
      overheadCostType,
      overheadCostValue,
      totalBatchCost,
      costPerUnit,
      instructions,
      updatedAt: new Date().toISOString().substring(0, 10),
    };

    if (recipeToEdit) {
      updateBOMRecipe(recipeToEdit.id, payload);
    } else {
      addBOMRecipe(payload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">
                {recipeToEdit ? 'রেসিপি কার্ড সম্পাদনা' : 'নতুন রেসিপি কার্ড ও উৎপাদন প্রণালী তৈরি'}
              </h2>
              <p className="text-xs text-slate-400">
                কাঁচামালের তালিকা, অনুপাত, লেবার ও ওভারহেড নির্ধারণ করে সঠিক একক উৎপাদন খরচ হিসেব করুন
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs text-rose-800 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Basic Specification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                তৈরি পণ্য নির্বাচন করুন * (২-৩ অক্ষর লিখে সার্চ করুন)
              </label>
              <SearchableProductSelect
                products={finishedProducts}
                value={selectedProductId}
                onChange={handleFinishedProductChange}
                placeholder="তৈরি পণ্য খুঁজুন বা ২-৩ অক্ষর লিখুন..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                রেসিপি কোড *
              </label>
              <input
                type="text"
                value={recipeCode}
                onChange={e => setRecipeCode(e.target.value)}
                required
                className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                স্ট্যান্ডার্ড শেলফ লাইফ (দিন)
              </label>
              <input
                type="number"
                min="1"
                value={shelfLifeDays}
                onChange={e => setShelfLifeDays(Number(e.target.value))}
                className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                placeholder="যেমন: ৯০"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                রেসিপির পূর্ণ নাম *
              </label>
              <input
                type="text"
                value={recipeName}
                onChange={e => setRecipeName(e.target.value)}
                required
                placeholder="যেমন: বাটার টোস্ট রেসিপি (প্রতি ১০০ প্যাকেট ব্যাচ)"
                className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                স্ট্যান্ডার্ড ব্যাচ সাইজ *
              </label>
              <input
                type="number"
                min="1"
                value={outputQuantity}
                onChange={e => setOutputQuantity(Number(e.target.value))}
                required
                className="w-full text-xs font-bold font-mono px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                আউটপুট একক (পিস / কার্টুন / কেজি) *
              </label>
              <ManualUnitInput
                value={outputUnit}
                onChange={(val) => setOutputUnit(val as UnitType)}
                placeholder="পিস, কার্টুন, কেজি..."
              />
            </div>
          </div>

          {/* Raw Materials / Ingredients Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  প্রয়োজনীয় কাঁচামাল ও প্যাকেজিং উপাদান তালিকা
                </h3>
              </div>
              <button
                type="button"
                onClick={handleAddIngredient}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>কাঁচামাল যোগ করুন</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">উপাদান নির্বাচন</th>
                    <th className="py-2.5 px-3 text-right">প্রয়োজনীয় পরিমাণ</th>
                    <th className="py-2.5 px-3 text-center min-w-[130px]">একক (পিস/কার্টুন/কেজি)</th>
                    <th className="py-2.5 px-3 text-right">বর্তমান দর (৳)</th>
                    <th className="py-2.5 px-3 text-right">লাইন খরচ (৳)</th>
                    <th className="py-2.5 px-3 text-center w-10">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ingredients.map((ing, idx) => {
                    const lineTotal = ing.quantity * (ing.unitCost || 0);
                    return (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-slate-400 text-center w-8">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <SearchableProductSelect
                            products={rawAndPackagingProducts}
                            value={ing.productId}
                            onChange={(val) => handleIngredientProductChange(idx, val)}
                            placeholder="উপাদান খুঁজুন..."
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={ing.quantity}
                            onChange={e => handleIngredientQtyChange(idx, Number(e.target.value))}
                            className="w-24 text-right font-mono font-bold text-xs px-2 py-1 bg-white border border-slate-300 rounded-lg"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center font-semibold text-slate-600">
                          <ManualUnitInput
                            value={ing.unit}
                            onChange={val => handleIngredientUnitChange(idx, val)}
                            placeholder="পিস/কার্টুন/কেজি..."
                            compact
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={ing.unitCost}
                            onChange={e => handleIngredientCostChange(idx, Number(e.target.value))}
                            className="w-24 text-right font-mono text-xs px-2 py-1 bg-white border border-slate-300 rounded-lg"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                          {formatCurrency(lineTotal)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveIngredient(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end text-xs font-bold text-slate-700 pr-2">
              <span>মোট কাঁচামাল লাইন খরচ: </span>
              <span className="font-mono text-amber-700 ml-2 font-black">{formatCurrency(totalRawMaterialCost)}</span>
            </div>
          </div>

          {/* Direct Labor & Factory Overhead */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            {/* Direct Labor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  শ্রমিক মজুরি (Direct Labor Cost)
                </label>
                <div className="flex bg-white rounded-lg p-0.5 border border-slate-200 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setLaborCostType('FIXED')}
                    className={`px-2 py-0.5 rounded-md transition-all ${
                      laborCostType === 'FIXED' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-600'
                    }`}
                  >
                    নির্দিষ্ট (৳)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLaborCostType('PERCENT')}
                    className={`px-2 py-0.5 rounded-md transition-all ${
                      laborCostType === 'PERCENT' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-600'
                    }`}
                  >
                    কাঁচামালের %
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={laborCostValue}
                  onChange={e => setLaborCostValue(Number(e.target.value))}
                  className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                  placeholder={laborCostType === 'FIXED' ? 'টাকার পরিমাণ' : 'শতাংশ (%)'}
                />
                <div className="shrink-0 font-mono text-xs font-black text-slate-800 bg-white px-3 py-2 rounded-xl border border-slate-200">
                  = {formatCurrency(calculatedLaborCost)}
                </div>
              </div>
            </div>

            {/* Factory Overhead */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  কারখানা ওভারহেড ও বিদ্যুৎ বিল
                </label>
                <div className="flex bg-white rounded-lg p-0.5 border border-slate-200 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setOverheadCostType('FIXED')}
                    className={`px-2 py-0.5 rounded-md transition-all ${
                      overheadCostType === 'FIXED' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-600'
                    }`}
                  >
                    নির্দিষ্ট (৳)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverheadCostType('PERCENT')}
                    className={`px-2 py-0.5 rounded-md transition-all ${
                      overheadCostType === 'PERCENT' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-600'
                    }`}
                  >
                    কাঁচামালের %
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={overheadCostValue}
                  onChange={e => setOverheadCostValue(Number(e.target.value))}
                  className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                  placeholder={overheadCostType === 'FIXED' ? 'টাকার পরিমাণ' : 'শতাংশ (%)'}
                />
                <div className="shrink-0 font-mono text-xs font-black text-slate-800 bg-white px-3 py-2 rounded-xl border border-slate-200">
                  = {formatCurrency(calculatedOverheadCost)}
                </div>
              </div>
            </div>
          </div>

          {/* Preparation Instructions / SOP */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              প্রস্তুতি নির্দেশিকা ও কোয়ালিটি প্যারামিটার
            </label>
            <textarea
              rows={2}
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="উপাদান মেশানোর প্রক্রিয়া, তাপমাত্রা, বেকিং সময় বা প্যাকেজিং নির্দেশনা..."
              className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Grand Real-time Cost Highlights Banner */}
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 p-5 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 bg-amber-400/60 px-2 py-0.5 rounded-md">
                স্বয়ংক্রিয় খরচ হিসাব
              </span>
              <div className="text-xs font-medium text-amber-950">
                কাঁচামাল: <span className="font-bold">{formatCurrency(totalRawMaterialCost)}</span> + লেবার: <span className="font-bold">{formatCurrency(calculatedLaborCost)}</span> + ওভারহেড: <span className="font-bold">{formatCurrency(calculatedOverheadCost)}</span>
              </div>
              <div className="text-sm font-bold text-slate-900">
                মোট স্ট্যান্ডার্ড ব্যাচ খরচ: <span className="font-black text-base">{formatCurrency(totalBatchCost)}</span>
              </div>
            </div>

            <div className="bg-slate-950 text-white px-5 py-3 rounded-2xl border border-amber-400/30 text-right shadow-xs">
              <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                একক উৎপাদন খরচ (Cost Per Unit)
              </div>
              <div className="text-2xl font-black font-mono text-white mt-0.5">
                {formatCurrency(costPerUnit, true)}
              </div>
              <div className="text-[10px] text-slate-300">
                প্রতি {outputUnit}
              </div>
            </div>
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
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl transition-all shadow-md active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{recipeToEdit ? 'আপডেট সেভ করুন' : 'রেসিপি কার্ড সংরক্ষণ করুন'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
