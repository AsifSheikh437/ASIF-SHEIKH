import React, { useState } from 'react';
import { DataExportToolbar } from '../common/DataExportToolbar';
import { useERP } from '../../context/ERPContext';
import { BOMRecipe, ProductionRun } from '../../types';
import { formatCurrency, formatDate, exportToCSV } from '../../utils/formatters';
import { printDocument, exportElementToPDF } from '../../utils/printPdfUtils';
import {
  ChefHat,
  Plus,
  Play,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Package,
  Layers,
  FileText,
  Printer,
  Download,
  Eye,
  Edit,
  Trash2,
  TrendingDown,
  Calculator,
  DollarSign,
  Sparkles,
  Zap,
} from 'lucide-react';

import { RecipeCardModal } from '../production/RecipeCardModal';
import { RecipeFormModal } from '../production/RecipeFormModal';
import { ProductionRunModal } from '../production/ProductionRunModal';
import { ProductionPlannerTab } from '../production/ProductionPlannerTab';
import { ProductionWastageReportTab } from '../production/ProductionWastageReportTab';
import { ProductionCostMasterTab } from '../production/ProductionCostMasterTab';
import { ProductionRunReceiptModal } from '../production/ProductionRunReceiptModal';

type ActiveTab = 'RECIPES' | 'PLANNER' | 'RUNS' | 'WASTAGE' | 'COST_MASTER';

export const ProductionBOMView: React.FC = () => {
  const {
    bomRecipes,
    deleteBOMRecipe,
    productionRuns,
    products,
    settings,
  } = useERP();

  const [activeTab, setActiveTab] = useState<ActiveTab>('RECIPES');

  // Modals state
  const [showNewRecipeModal, setShowNewRecipeModal] = useState<boolean>(false);
  const [recipeToEdit, setRecipeToEdit] = useState<BOMRecipe | null>(null);

  const [showRunModal, setShowRunModal] = useState<boolean>(false);
  const [selectedRecipeForRun, setSelectedRecipeForRun] = useState<BOMRecipe | null>(null);
  const [initialTargetUnitsForRun, setInitialTargetUnitsForRun] = useState<number | undefined>(undefined);

  const [viewingRecipeCard, setViewingRecipeCard] = useState<BOMRecipe | null>(null);
  const [viewingRunReceipt, setViewingRunReceipt] = useState<ProductionRun | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [historySearch, setHistorySearch] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string>('');

  // Handler to launch production from anywhere
  const handleLaunchProduction = (recipe?: BOMRecipe, targetUnits?: number) => {
    setSelectedRecipeForRun(recipe || bomRecipes[0] || null);
    setInitialTargetUnitsForRun(targetUnits);
    setShowRunModal(true);
  };

  const handleProductionSuccess = (run: ProductionRun) => {
    setSuccessToast(`প্রোডাকশন সফল! ব্যাচ নং: ${run.batchNo}, উৎপাদিত: ${run.producedQuantity} ${run.unit} (একক খরচ: ${formatCurrency(run.costPerUnit, true)})`);
    setViewingRunReceipt(run);
    setTimeout(() => setSuccessToast(''), 6000);
  };

  const handleDeleteRecipe = (recipe: BOMRecipe) => {
    if (window.confirm(`আপনি কি নিশ্চিত যে "${recipe.recipeName}" রেসিপিটি মুছে ফেলতে চান?`)) {
      deleteBOMRecipe(recipe.id);
      setSuccessToast(`রেসিপি "${recipe.recipeName}" মুছে ফেলা হয়েছে।`);
      setTimeout(() => setSuccessToast(''), 4000);
    }
  };

  // Filtered recipes
  const filteredRecipes = bomRecipes.filter(r =>
    r.recipeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.finishedProductName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.recipeCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtered history runs
  const filteredRuns = productionRuns.filter(run => {
    const q = historySearch.toLowerCase();
    return (
      !historySearch ||
      run.batchNo.toLowerCase().includes(q) ||
      run.recipeName.toLowerCase().includes(q) ||
      (run.supervisor && run.supervisor.toLowerCase().includes(q))
    );
  });

  const handleExportRunsCSV = () => {
    const headers = [
      'তারিখ',
      'ব্যাচ নম্বর',
      'রেসিপি / পণ্য',
      'প্রত্যাশিত পরিমাণ',
      'প্রকৃত উৎপাদিত পরিমাণ',
      'অপচয় পরিমাণ',
      'ইল্ড (Yield %)',
      'মোট উৎপাদন ব্যয় (৳)',
      'একক প্রস্তুত ব্যয় (COGS ৳)',
      'সুপারভাইজার',
    ];
    const rows = filteredRuns.map(r => [
      r.date,
      r.batchNo,
      r.recipeName,
      r.expectedQuantity || r.producedQuantity,
      r.producedQuantity,
      r.wastageQuantity || 0,
      `${r.yieldPercent || 100}%`,
      r.totalProductionCost.toFixed(2),
      r.costPerUnit.toFixed(2),
      r.supervisor || '-',
    ]);
    exportToCSV(`Production_Runs_Log_${new Date().toISOString().substring(0, 10)}`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Main Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs print:hidden">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                প্রোডাকশন ও BOM (Recipe) ম্যানেজমেন্ট
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                স্বয়ংক্রিয় FEFO ও COGS
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              রেসিপি কার্ড স্পেসিফিকেশন, FEFO স্টক কর্তন, ইল্ড/অপচয় ট্র্যাকিং ও ক্যাপাসিটি প্ল্যানার
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              setRecipeToEdit(null);
              setShowNewRecipeModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-2xl transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 text-slate-600" />
            <span>নতুন রেসিপি তৈরি</span>
          </button>
          <button
            onClick={() => handleLaunchProduction()}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>প্রোডাকশন চালান (Run Batch)</span>
          </button>
        </div>
      </div>

      {/* Success Notification Toast */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-2xl flex items-center gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successToast}</span>
        </div>
      )}

      {/* Module Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 text-xs font-bold print:hidden">
        <button
          onClick={() => setActiveTab('RECIPES')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all whitespace-nowrap ${
            activeTab === 'RECIPES'
              ? 'bg-slate-900 text-amber-400 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ChefHat className="w-4 h-4" />
          <span>রেসিপি কার্ড ও কস্টিং ({bomRecipes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('PLANNER')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all whitespace-nowrap ${
            activeTab === 'PLANNER'
              ? 'bg-slate-900 text-amber-400 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>প্রোডাকশন প্ল্যানার ও বটলেনেক</span>
        </button>

        <button
          onClick={() => setActiveTab('RUNS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all whitespace-nowrap ${
            activeTab === 'RUNS'
              ? 'bg-slate-900 text-amber-400 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>প্রোডাকশন ব্যাচ হিস্টোরি ({productionRuns.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('WASTAGE')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all whitespace-nowrap ${
            activeTab === 'WASTAGE'
              ? 'bg-slate-900 text-amber-400 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          <span>প্রোডাকশন অপচয় রিপোর্ট</span>
        </button>

        <button
          onClick={() => setActiveTab('COST_MASTER')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all whitespace-nowrap ${
            activeTab === 'COST_MASTER'
              ? 'bg-slate-900 text-amber-400 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>কস্ট মাস্টার ও COGS শিট</span>
        </button>
      </div>

      {/* TAB 1: RECIPES GRID & CARDS */}
      {activeTab === 'RECIPES' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="রেসিপি বা খাদ্যপণ্যের নাম লিখুন..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs text-slate-500 font-medium mr-2">
                মোট রেসিপি: <span className="font-bold text-slate-800">{filteredRecipes.length} টি</span>
              </div>
              <button
                onClick={() => printDocument('recipe-list-printable', { title: 'BOM_Recipe_Master_List' })}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                title="প্রিন্ট করুন"
              >
                <Printer className="w-3.5 h-3.5" /> <span>প্রিন্ট</span>
              </button>
              <button
                onClick={() => exportElementToPDF('recipe-list-printable', 'BOM_Recipe_Master_List.pdf')}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                title="PDF ডাউনলোড"
              >
                <Download className="w-3.5 h-3.5" /> <span>PDF</span>
              </button>
            </div>
          </div>

          <div id="recipe-list-printable" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRecipes.map(recipe => {
              const outProd = products.find(p => p.id === recipe.finishedProductId);

              // Live cost calculation
              const liveRawCost = recipe.ingredients.reduce((sum, ing) => {
                const raw = products.find(p => p.id === ing.productId);
                const rate = raw?.purchasePrice || ing.unitCost || 0;
                return sum + (ing.quantity * rate);
              }, 0);
              const laborCost = recipe.laborCostPerBatch || 0;
              const overheadCost = recipe.overheadCostPerBatch || 0;
              const totalBatchCost = liveRawCost + laborCost + overheadCost;
              const costPerUnit = recipe.outputQuantity > 0 ? totalBatchCost / recipe.outputQuantity : 0;

              return (
                <div
                  key={recipe.id}
                  className="bg-white rounded-3xl border border-slate-200 hover:border-amber-400 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    {/* Top Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          {recipe.recipeCode}
                        </span>
                        <h3 className="font-bold text-slate-900 text-base mt-1 group-hover:text-amber-600 transition-colors">
                          {recipe.recipeName}
                        </h3>
                        <p className="text-xs text-slate-500">
                          পণ্য: <span className="font-semibold text-slate-800">{recipe.finishedProductName}</span>
                        </p>
                      </div>

                      <span className="px-2.5 py-1 bg-slate-100 text-slate-800 font-mono font-bold rounded-xl text-xs shrink-0 border border-slate-200">
                        {recipe.outputQuantity} {recipe.outputUnit}
                      </span>
                    </div>

                    {/* Ingredients summary */}
                    <div className="space-y-1.5 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                        <span>কাঁচামাল অনুপাত</span>
                        <span>{recipe.ingredients.length} টি উপাদান</span>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {recipe.ingredients.slice(0, 3).map((ing, i) => (
                          <div key={i} className="py-1 flex justify-between text-slate-700">
                            <span className="truncate max-w-[170px]">{ing.productName}</span>
                            <span className="font-mono font-bold text-slate-900">{ing.quantity} {ing.unit}</span>
                          </div>
                        ))}
                        {recipe.ingredients.length > 3 && (
                          <div className="pt-1 text-[11px] text-amber-700 font-bold">
                            + আরও {recipe.ingredients.length - 3} টি উপাদান
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Cost Per Unit & Total Cost Highlight */}
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100/60 p-3.5 rounded-2xl border border-amber-200/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                          প্রতি ইউনিট ব্যয় (Cost Per Unit)
                        </span>
                        <div className="text-xl font-black font-mono text-slate-950 mt-0.5">
                          {formatCurrency(costPerUnit, true)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 font-medium">ব্যাচ মোট খরচ:</span>
                        <div className="font-mono font-bold text-slate-800 text-xs mt-0.5">
                          {formatCurrency(totalBatchCost)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Warehouse stock & action buttons */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>গুদামে ফিনিশড স্টক:</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {outProd?.currentStock || 0} {recipe.outputUnit}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 print:hidden">
                      <button
                        onClick={() => setViewingRecipeCard(recipe)}
                        className="flex items-center justify-center gap-1 py-2 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-xl transition-all"
                        title="রেসিপি কার্ড দেখুন ও প্রিন্ট করুন"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                        <span>কার্ড</span>
                      </button>

                      <button
                        onClick={() => {
                          setRecipeToEdit(recipe);
                          setShowNewRecipeModal(true);
                        }}
                        className="flex items-center justify-center gap-1 py-2 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-xl transition-all"
                        title="রেসিপি সম্পাদনা"
                      >
                        <Edit className="w-3.5 h-3.5 text-slate-600" />
                        <span>এডিট</span>
                      </button>

                      <button
                        onClick={() => handleLaunchProduction(recipe)}
                        className="flex items-center justify-center gap-1 py-2 px-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-bold rounded-xl transition-all shadow-xs"
                        title="এই রেসিপি দিয়ে প্রোডাকশন চালান"
                      >
                        <Play className="w-3.5 h-3.5 fill-slate-950" />
                        <span>রান</span>
                      </button>
                    </div>

                    <div className="flex justify-end pr-1">
                      <button
                        onClick={() => handleDeleteRecipe(recipe)}
                        className="text-[10px] text-slate-400 hover:text-rose-600 font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>মুছে ফেলুন</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTION PLANNER */}
      {activeTab === 'PLANNER' && (
        <ProductionPlannerTab
          onStartProductionWithTarget={(recipe, targetUnits) => {
            handleLaunchProduction(recipe, targetUnits);
          }}
        />
      )}

      {/* TAB 3: BATCH RUNS & YIELD HISTORY */}
      {activeTab === 'RUNS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="ব্যাচ নং, পণ্য বা সুপারভাইজার খুঁজুন..."
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => printDocument('production-history-print-area', { title: 'Production_Batch_History', landscape: true })}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs"
                title="প্রোডাকশন হিস্টোরি সরাসরি প্রিন্ট করুন"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>প্রিন্ট</span>
              </button>
              <button
                onClick={() => exportElementToPDF('production-history-print-area', { filename: `Production_Batch_History_${new Date().toISOString().substring(0, 10)}.pdf`, orientation: 'landscape' })}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-xs"
                title="প্রোডাকশন হিস্টোরি PDF ডাউনলোড করুন"
              >
                <Download className="w-4 h-4" />
                <span>PDF ডাউনলোড</span>
              </button>
              <button
                onClick={handleExportRunsCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
                title="CSV এক্সেল ডাউনলোড"
              >
                <Download className="w-4 h-4" />
                <span>CSV এক্সেল</span>
              </button>
            </div>
          </div>

          <div id="production-history-print-area" className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs p-2">
            {/* Printable Letterhead */}
            <div className="hidden print:block p-4 border-b-2 border-slate-800 mb-3">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">{settings.companyNameBangla}</h1>
                  <p className="text-xs text-slate-600">{settings.companyNameEnglish} | প্রোডাকশন ব্যাচ হিস্টোরি</p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 bg-amber-500 text-slate-950 text-xs font-black rounded">ব্যাচ লগ রিপোর্ট</span>
                  <p className="text-xs text-slate-500 mt-1">তারিখ: {new Date().toLocaleDateString('bn-BD')}</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="p-4 pb-0"><DataExportToolbar filename="ProductionBOMView_Export" /></div>
<table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                    <th className="py-3 px-3.5">তারিখ</th>
                    <th className="py-3 px-3.5">ব্যাচ নম্বর</th>
                    <th className="py-3 px-3.5">রেসিপি / পণ্য</th>
                    <th className="py-3 px-3.5 text-right">উৎপাদিত পরিমাণ</th>
                    <th className="py-3 px-3.5 text-center">ইল্ড (Yield %)</th>
                    <th className="py-3 px-3.5 text-right">মোট খরচ (৳)</th>
                    <th className="py-3 px-3.5 text-right">একক খরচ (COGS)</th>
                    <th className="py-3 px-3.5">সুপারভাইজার</th>
                    <th className="py-3 px-3.5 text-center no-print">স্লিপ / অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRuns.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        কোনো প্রোডাকশন হিস্টোরি পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    filteredRuns.map(run => {
                      const yieldPct = run.yieldPercent || 100;
                      return (
                        <tr key={run.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3.5 font-mono text-slate-600">
                            {formatDate(run.date)}
                          </td>
                          <td className="py-3 px-3.5 font-mono font-bold text-amber-800">
                            {run.batchNo}
                          </td>
                          <td className="py-3 px-3.5 font-semibold text-slate-900">
                            {run.recipeName}
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900">
                            {run.producedQuantity} {run.unit}
                            {run.wastageQuantity && run.wastageQuantity > 0 ? (
                              <div className="text-[10px] text-rose-600 font-normal">
                                অপচয়: {run.wastageQuantity} {run.unit}
                              </div>
                            ) : null}
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              yieldPct >= 97 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {yieldPct}%
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(run.totalProductionCost)}
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono font-black text-amber-700">
                            {formatCurrency(run.costPerUnit, true)}
                          </td>
                          <td className="py-3 px-3.5 text-slate-600 truncate max-w-[150px]">
                            {run.supervisor || '-'}
                          </td>
                          <td className="py-3 px-3.5 text-center no-print">
                            <button
                              onClick={() => setViewingRunReceipt(run)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-[10px] transition-all"
                            >
                              স্লিপ প্রিন্ট
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PRODUCTION WASTAGE REPORT */}
      {activeTab === 'WASTAGE' && <ProductionWastageReportTab />}

      {/* TAB 5: COST MASTER & COGS */}
      {activeTab === 'COST_MASTER' && <ProductionCostMasterTab />}

      {/* MODAL 1: VIEW RECIPE CARD */}
      {viewingRecipeCard && (
        <RecipeCardModal
          recipe={viewingRecipeCard}
          onClose={() => setViewingRecipeCard(null)}
          onEdit={recipe => {
            setViewingRecipeCard(null);
            setRecipeToEdit(recipe);
            setShowNewRecipeModal(true);
          }}
          onRunProduction={recipe => {
            setViewingRecipeCard(null);
            handleLaunchProduction(recipe);
          }}
        />
      )}

      {/* MODAL 2: CREATE OR EDIT RECIPE */}
      {showNewRecipeModal && (
        <RecipeFormModal
          recipeToEdit={recipeToEdit}
          onClose={() => {
            setShowNewRecipeModal(false);
            setRecipeToEdit(null);
          }}
        />
      )}

      {/* MODAL 3: RUN PRODUCTION BATCH */}
      {showRunModal && (
        <ProductionRunModal
          initialRecipe={selectedRecipeForRun}
          initialTargetUnits={initialTargetUnitsForRun}
          onClose={() => setShowRunModal(false)}
          onSuccess={handleProductionSuccess}
        />
      )}

      {/* MODAL 4: VIEW PRODUCTION RUN COMPLETION SLIP */}
      {viewingRunReceipt && (
        <ProductionRunReceiptModal
          run={viewingRunReceipt}
          onClose={() => setViewingRunReceipt(null)}
        />
      )}
    </div>
  );
};
