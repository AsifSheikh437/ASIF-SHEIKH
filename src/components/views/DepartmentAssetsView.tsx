import React, { useState, useMemo, useRef } from 'react';
import { DataExportToolbar } from '../common/DataExportToolbar';
import { useERP } from '../../context/ERPContext';
import { DepartmentAsset, AssetMaintenanceLog } from '../../types';
import { formatCurrency, formatDate, formatDateTime, exportToCSV } from '../../utils/formatters';
import { printDocument, exportElementToPDF } from '../../utils/printPdfUtils';
import {
  Cpu,
  Plus,
  Wrench,
  Search,
  Filter,
  Download,
  Printer,
  FileSpreadsheet,
  Building2,
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle,
  X,
  Trash2,
  Edit,
  DollarSign,
  TrendingDown,
  ShieldAlert,
  FileText,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';

// Department names in Bangla
const DEPARTMENTS = [
  { id: 'ALL', name: 'সকল বিভাগ (All Departments)' },
  { id: 'PRODUCTION', name: 'উৎপাদন ও কারখানা (Production)' },
  { id: 'OFFICE', name: 'হেড অফিস ও প্রশাসন (Office / Admin)' },
  { id: 'PACKAGING', name: 'প্যাকেজিং সেকশন (Packaging)' },
  { id: 'LOGISTICS', name: 'পরিবহন ও লজিস্টিকস (Logistics / Fleet)' },
  { id: 'SALES', name: 'সেলস ও আউটলেট (Sales & Outlets)' },
  { id: 'UTILITY_POWER', name: 'বিদ্যুৎ ও জেনারেটর (Utility / Power)' },
];

export const DepartmentAssetsView: React.FC = () => {
  const {
    assets,
    addAsset,
    updateAsset,
    deleteAsset,
    addAssetMaintenanceLog,
    deleteAssetMaintenanceLog,
    settings,
  } = useERP();

  // Filters
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [selectedCondition, setSelectedCondition] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<DepartmentAsset | null>(null);
  const [activeMaintenanceAsset, setActiveMaintenanceAsset] = useState<DepartmentAsset | null>(null);
  const [showPrintRegisterModal, setShowPrintRegisterModal] = useState(false);

  // Add / Edit Form State
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formDepartment, setFormDepartment] = useState('PRODUCTION');
  const [formPurchaseDate, setFormPurchaseDate] = useState(new Date().toISOString().substring(0, 10));
  const [formCost, setFormCost] = useState<number | ''>('');
  const [formUsefulLifeYears, setFormUsefulLifeYears] = useState<number | ''>(5);
  const [formSalvageValue, setFormSalvageValue] = useState<number | ''>(0);
  const [formCondition, setFormCondition] = useState<'EXCELLENT' | 'GOOD' | 'NEEDS_REPAIR' | 'DAMAGED'>('GOOD');
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'UNDER_MAINTENANCE' | 'DISPOSED'>('ACTIVE');
  const [formLocation, setFormLocation] = useState('মেইন কারখানা ফ্লোর');
  const [formAssignedTo, setFormAssignedTo] = useState('');
  const [formSerialNumber, setFormSerialNumber] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Maintenance Form State (inside maintenance modal)
  const [maintDate, setMaintDate] = useState(new Date().toISOString().substring(0, 10));
  const [maintCost, setMaintCost] = useState<number | ''>('');
  const [maintDesc, setMaintDesc] = useState('রুটিন ওভারহোলিং ও পার্টস পরিবর্তন');
  const [maintServicedBy, setMaintServicedBy] = useState('');
  const [maintNextServiceDate, setMaintNextServiceDate] = useState('');

  // Helper to calculate straight-line depreciation for any asset
  const calculateDepreciation = (asset: DepartmentAsset) => {
    const cost = asset.cost || 0;
    const salvage = asset.salvageValue || 0;
    const usefulYears = asset.usefulLifeYears || 5;
    const depreciableBasis = Math.max(0, cost - salvage);

    const annualDepreciation = depreciableBasis / usefulYears;
    const monthlyDepreciation = annualDepreciation / 12;

    const purchase = new Date(asset.purchaseDate);
    const now = new Date();
    const monthsElapsed = Math.max(
      0,
      (now.getFullYear() - purchase.getFullYear()) * 12 + (now.getMonth() - purchase.getMonth())
    );

    const maxMonths = usefulYears * 12;
    const effectiveMonths = Math.min(monthsElapsed, maxMonths);

    const accumulatedDepreciation = Math.min(depreciableBasis, Math.round(monthlyDepreciation * effectiveMonths));
    const currentBookValue = Math.max(salvage, cost - accumulatedDepreciation);
    const percentDepreciated = depreciableBasis > 0 ? Math.min(100, Math.round((accumulatedDepreciation / depreciableBasis) * 100)) : 100;

    // Maintenance spend sum
    const totalMaintenanceCost = (asset.maintenanceLogs || []).reduce((sum, m) => sum + (m.cost || 0), 0);

    return {
      cost,
      salvage,
      usefulYears,
      annualDepreciation,
      monthlyDepreciation,
      monthsElapsed,
      effectiveMonths,
      accumulatedDepreciation,
      currentBookValue,
      percentDepreciated,
      totalMaintenanceCost,
    };
  };

  // Enriched assets list with depreciation metrics
  const enrichedAssets = useMemo(() => {
    return assets.map(a => ({
      ...a,
      dep: calculateDepreciation(a),
    }));
  }, [assets]);

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return enrichedAssets.filter(a => {
      if (selectedDepartment !== 'ALL' && a.department !== selectedDepartment) return false;
      if (selectedCondition !== 'ALL' && a.condition !== selectedCondition) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches =
          a.name.toLowerCase().includes(q) ||
          a.code.toLowerCase().includes(q) ||
          (a.location && a.location.toLowerCase().includes(q)) ||
          (a.assignedTo && a.assignedTo.toLowerCase().includes(q)) ||
          (a.serialNumber && a.serialNumber.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [enrichedAssets, selectedDepartment, selectedCondition, searchTerm]);

  // Overall KPI Metrics
  const metrics = useMemo(() => {
    let totalCost = 0;
    let totalAccumulatedDep = 0;
    let totalCurrentBookValue = 0;
    let totalMaintenanceSpend = 0;

    enrichedAssets.forEach(a => {
      totalCost += a.dep.cost;
      totalAccumulatedDep += a.dep.accumulatedDepreciation;
      totalCurrentBookValue += a.dep.currentBookValue;
      totalMaintenanceSpend += a.dep.totalMaintenanceCost;
    });

    return {
      totalCost,
      totalAccumulatedDep,
      totalCurrentBookValue,
      totalMaintenanceSpend,
      totalCount: enrichedAssets.length,
    };
  }, [enrichedAssets]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingAsset(null);
    setFormCode(`AST-${Date.now().toString().slice(-4)}`);
    setFormName('');
    setFormDepartment('PRODUCTION');
    setFormPurchaseDate(new Date().toISOString().substring(0, 10));
    setFormCost('');
    setFormUsefulLifeYears(5);
    setFormSalvageValue(0);
    setFormCondition('GOOD');
    setFormStatus('ACTIVE');
    setFormLocation('মেইন কারখানা ফ্লোর');
    setFormAssignedTo('');
    setFormSerialNumber('');
    setFormNotes('');
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (asset: DepartmentAsset) => {
    setEditingAsset(asset);
    setFormCode(asset.code || '');
    setFormName(asset.name || '');
    setFormDepartment(asset.department || 'PRODUCTION');
    setFormPurchaseDate(asset.purchaseDate || new Date().toISOString().substring(0, 10));
    setFormCost(asset.cost || 0);
    setFormUsefulLifeYears(asset.usefulLifeYears || 5);
    setFormSalvageValue(asset.salvageValue || 0);
    setFormCondition(asset.condition || 'GOOD');
    setFormStatus(asset.status || 'ACTIVE');
    setFormLocation(asset.location || '');
    setFormAssignedTo(asset.assignedTo || '');
    setFormSerialNumber(asset.serialNumber || '');
    setFormNotes(asset.notes || '');
    setShowAddModal(true);
  };

  // Submit Add / Edit
  const handleSubmitAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const costNum = typeof formCost === 'number' ? formCost : parseFloat(formCost);
    if (!costNum || costNum <= 0) return;

    const usefulLifeNum = typeof formUsefulLifeYears === 'number' ? formUsefulLifeYears : parseFloat(formUsefulLifeYears) || 5;
    const salvageNum = typeof formSalvageValue === 'number' ? formSalvageValue : parseFloat(formSalvageValue) || 0;

    if (editingAsset) {
      updateAsset(editingAsset.id, {
        code: formCode.trim() || editingAsset.code,
        name: formName.trim(),
        department: formDepartment,
        purchaseDate: formPurchaseDate,
        cost: costNum,
        usefulLifeYears: usefulLifeNum,
        salvageValue: salvageNum,
        condition: formCondition,
        status: formStatus,
        location: formLocation.trim(),
        assignedTo: formAssignedTo.trim() || undefined,
        serialNumber: formSerialNumber.trim() || undefined,
        notes: formNotes.trim() || undefined,
      });
    } else {
      addAsset({
        code: formCode.trim() || `AST-${Date.now().toString().slice(-4)}`,
        name: formName.trim(),
        department: formDepartment,
        purchaseDate: formPurchaseDate,
        cost: costNum,
        usefulLifeYears: usefulLifeNum,
        salvageValue: salvageNum,
        currentValue: costNum, // will be dynamically computed
        condition: formCondition,
        status: formStatus,
        location: formLocation.trim(),
        assignedTo: formAssignedTo.trim() || undefined,
        serialNumber: formSerialNumber.trim() || undefined,
        notes: formNotes.trim() || undefined,
        maintenanceLogs: [],
      });
    }

    setShowAddModal(false);
    setEditingAsset(null);
  };

  // Add Maintenance Log
  const handleAddMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMaintenanceAsset) return;
    const numCost = typeof maintCost === 'number' ? maintCost : parseFloat(maintCost);
    if (isNaN(numCost) || numCost < 0) return;

    addAssetMaintenanceLog(activeMaintenanceAsset.id, {
      date: maintDate,
      cost: numCost,
      description: maintDesc.trim(),
      servicedBy: maintServicedBy.trim() || undefined,
      nextServiceDate: maintNextServiceDate.trim() || undefined,
    });

    setMaintCost('');
    setMaintDesc('রুটিন ওভারহোলিং ও পার্টস পরিবর্তন');
    setMaintServicedBy('');
    setMaintNextServiceDate('');
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'সম্পদ কোড (Asset Code)',
      'সম্পদের নাম ও মডেল (Asset Name)',
      'বিভাগ (Department)',
      'ক্রয়ের তারিখ (Purchase Date)',
      'ক্রয়মূল্য (Historical Cost ৳)',
      'কার্যকাল বছর (Useful Life)',
      'ভগ্নাবশেষ মূল্য (Salvage ৳)',
      'বার্ষিক অবচয় (Annual Dep. ৳)',
      'পুঞ্জীভূত অবচয় (Acc. Dep. ৳)',
      'বর্তমান বুক ভ্যালু (Net Book Value ৳)',
      'অবস্থা (Condition)',
      'স্ট্যাটাস (Status)',
      'অবস্থান (Location)',
      'দায়িত্বপ্রাপ্ত ব্যক্তি (Assigned To)',
      'মেরামত ব্যয় (Maintenance Spent ৳)',
    ];

    const rows = filteredAssets.map(a => [
      a.code,
      a.name,
      a.department,
      a.purchaseDate,
      a.dep.cost,
      a.dep.usefulYears,
      a.dep.salvage,
      Math.round(a.dep.annualDepreciation),
      a.dep.accumulatedDepreciation,
      a.dep.currentBookValue,
      a.condition,
      a.status || 'ACTIVE',
      a.location,
      a.assignedTo || '-',
      a.dep.totalMaintenanceCost,
    ]);

    exportToCSV(`Fixed_Assets_Register_${new Date().toISOString().substring(0, 10)}`, headers, rows);
  };

  // Print Asset Register Sheet
  const handlePrint = () => {
    printDocument('assets-register-sheet');
  };

  // PDF Export
  const handleExportPDF = () => {
    exportElementToPDF('assets-register-sheet', `Asset_Register_${new Date().toISOString().substring(0, 10)}`);
  };

  return (
    <div className="space-y-6">
      {/* 1. Top Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                কারখানা ও অফিস সম্পদ ব্যবস্থাপনা (Fixed & Department Assets)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                স্থায়ী সম্পদ ট্র্যাকিং, স্ট্রেট-লাইন অবচয় হিসাব (Straight-Line Depreciation), বুক ভ্যালু ও মেরামত লগ
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowPrintRegisterModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold rounded-xl border border-teal-200 transition-colors shadow-2xs"
          >
            <FileText className="w-4 h-4" />
            অফিসিয়াল অ্যাসেট রেজিস্টার
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            CSV এক্সপোর্ট
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            নতুন সম্পদ যোগ করুন
          </button>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Historical Cost */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              মোট সম্পদের অর্জিত মূল্য
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1 font-sans">
              {formatCurrency(metrics.totalCost)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              মোট {metrics.totalCount} টি নিবন্ধিত সম্পদ
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Accumulated Depreciation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" />
              পুঞ্জীভূত অবচয় (Acc. Dep.)
            </span>
            <div className="text-2xl font-black text-amber-600 mt-1 font-sans">
              {formatCurrency(metrics.totalAccumulatedDep)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              স্ট্রেট-লাইন মডেলে মোট কর্তনকৃত অবচয়
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        {/* Current Net Book Value */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              বর্তমান নিট পুস্তক মূল্য (Book Value)
            </span>
            <div className="text-2xl font-black text-emerald-700 mt-1 font-sans">
              {formatCurrency(metrics.totalCurrentBookValue)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              ব্যালেন্স শিট প্রস্তুতযোগ্য আসল বর্তমান মূল্য
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Total Maintenance Cost */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
              <Wrench className="w-3.5 h-3.5" />
              মোট মেরামত ও সার্ভিসিং
            </span>
            <div className="text-2xl font-black text-blue-700 mt-1 font-sans">
              {formatCurrency(metrics.totalMaintenanceSpend)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              সম্পদ রক্ষণাবেক্ষণ ও লাইফ এক্সটেনশন ব্যয়
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Wrench className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Department Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
        {/* Department Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-3">
          {DEPARTMENTS.map(dept => {
            const count = dept.id === 'ALL'
              ? enrichedAssets.length
              : enrichedAssets.filter(a => a.department === dept.id).length;
            const isSelected = selectedDepartment === dept.id;

            return (
              <button
                key={dept.id}
                type="button"
                onClick={() => setSelectedDepartment(dept.id)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{dept.name}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isSelected ? 'bg-teal-700 text-teal-100' : 'bg-slate-200 text-slate-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Condition Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="সম্পদের নাম, কোড, অবস্থান, অপারেটর..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* Condition Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-semibold">যন্ত্রের অবস্থা:</span>
              <select
                value={selectedCondition}
                onChange={e => setSelectedCondition(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
              >
                <option value="ALL">সকল অবস্থা (All)</option>
                <option value="EXCELLENT">চমৎকার (Excellent)</option>
                <option value="GOOD">ভালো (Good)</option>
                <option value="NEEDS_REPAIR">মেরামত প্রয়োজন (Needs Repair)</option>
                <option value="DAMAGED">ক্ষতিগ্রস্ত / নিষ্ক্রিয় (Damaged)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">
              দেখানো হচ্ছে: <strong className="text-slate-700">{filteredAssets.length}</strong> টি সম্পদ
            </span>
            {(selectedDepartment !== 'ALL' || selectedCondition !== 'ALL' || searchTerm) && (
              <button
                onClick={() => {
                  setSelectedDepartment('ALL');
                  setSelectedCondition('ALL');
                  setSearchTerm('');
                }}
                className="text-teal-600 hover:text-teal-800 font-semibold underline text-[11px]"
              >
                রিসেট
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Assets Register Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-800 text-sm">
              বিভাগীয় স্থায়ী সম্পদ ও অবচয় রেজিস্টার
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded bg-teal-100 text-teal-700 font-semibold">
              স্ট্রেট-লাইন অবচয় ফর্মুলা
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline">
              বার্ষিক অবচয় = (ক্রয়মূল্য - ভগ্নাবশেষ) ÷ বছর
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="p-4 pb-0"><DataExportToolbar filename="DepartmentAssetsView_Export" /></div>
<table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-28">কোড / ট্যাগ নং</th>
                <th className="py-3 px-4">সম্পদের নাম ও স্পেসিফিকেশন</th>
                <th className="py-3 px-4">বিভাগ ও অবস্থান</th>
                <th className="py-3 px-4 w-24">ক্রয় তারিখ</th>
                <th className="py-3 px-4 text-right">ক্রয়মূল্য (৳)</th>
                <th className="py-3 px-4 text-right">পুঞ্জীভূত অবচয় (৳)</th>
                <th className="py-3 px-4 text-right font-bold text-slate-900 bg-slate-50/80">
                  বুক ভ্যালু (৳)
                </th>
                <th className="py-3 px-4 text-center">অবস্থা / স্ট্যাটাস</th>
                <th className="py-3 px-4 text-center w-28">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="max-w-sm mx-auto space-y-2">
                      <p className="font-medium text-slate-500">কোনো সম্পদ পাওয়া যায়নি।</p>
                      <button
                        onClick={handleOpenAdd}
                        className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold shadow-2xs hover:bg-teal-700 transition-colors"
                      >
                        নতুন সম্পদ নিবন্ধন করুন
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAssets.map(asset => {
                  const hasLogs = (asset.maintenanceLogs || []).length > 0;

                  return (
                    <tr key={asset.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Code */}
                      <td className="py-3 px-4 font-mono font-bold text-teal-700 whitespace-nowrap">
                        {asset.code}
                      </td>

                      {/* Name & Details */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{asset.name}</div>
                        <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-2 mt-0.5">
                          {asset.serialNumber && <span>S/N: {asset.serialNumber}</span>}
                          {asset.assignedTo && <span>দায়িত্বে: {asset.assignedTo}</span>}
                        </div>
                      </td>

                      {/* Department & Location */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {asset.department}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-0.5">{asset.location}</div>
                      </td>

                      {/* Purchase Date */}
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {formatDate(asset.purchaseDate)}
                        <span className="text-[10px] text-slate-400 block font-sans">
                          {asset.dep.usefulYears} বছর মেয়াদ
                        </span>
                      </td>

                      {/* Purchase Cost */}
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                        {formatCurrency(asset.dep.cost)}
                      </td>

                      {/* Accumulated Depreciation & Progress */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-mono font-semibold text-amber-700">
                          {formatCurrency(asset.dep.accumulatedDepreciation)}
                        </div>
                        <div className="w-20 ml-auto bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className="bg-amber-500 h-full rounded-full"
                            style={{ width: `${asset.dep.percentDepreciated}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono">
                          {asset.dep.percentDepreciated}% অবচয়
                        </span>
                      </td>

                      {/* Current Book Value */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 text-sm bg-slate-50/50">
                        {formatCurrency(asset.dep.currentBookValue)}
                      </td>

                      {/* Condition & Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            asset.condition === 'EXCELLENT'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : asset.condition === 'GOOD'
                              ? 'bg-teal-50 text-teal-700 border border-teal-200'
                              : asset.condition === 'NEEDS_REPAIR'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {asset.condition === 'EXCELLENT' && 'চমৎকার'}
                          {asset.condition === 'GOOD' && 'ভালো'}
                          {asset.condition === 'NEEDS_REPAIR' && 'মেরামত প্রয়োজন'}
                          {asset.condition === 'DAMAGED' && 'ক্ষতিগ্রস্ত'}
                        </span>
                        {asset.status === 'UNDER_MAINTENANCE' && (
                          <span className="block text-[10px] text-amber-600 font-semibold mt-0.5">
                            মেরামতাধীন
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Maintenance Log Trigger */}
                          <button
                            type="button"
                            onClick={() => setActiveMaintenanceAsset(asset)}
                            className={`p-1.5 rounded-lg transition-colors relative ${
                              hasLogs
                                ? 'text-blue-600 hover:bg-blue-50'
                                : 'text-slate-400 hover:text-blue-600 hover:bg-slate-100'
                            }`}
                            title="রক্ষণাবেক্ষণ ও সার্ভিসিং লগ"
                          >
                            <Wrench className="w-4 h-4" />
                            {hasLogs && (
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 absolute top-1 right-1" />
                            )}
                          </button>

                          {/* Edit Trigger */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(asset)}
                            className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            title="সম্পদ তথ্য এডিট"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Delete Trigger */}
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`আপনি কি নিশ্চিত যে "${asset.name}" (${asset.code}) সম্পদটি ডিলিট করতে চান?`)) {
                                deleteAsset(asset.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="সম্পদ মুছুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Add / Edit Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {editingAsset ? 'সম্পদ তথ্য পরিবর্তন / এডিট' : 'নতুন কারখানা ও অফিস সম্পদ নিবন্ধন'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    স্থায়ী সম্পদ কোড, ক্রয়মূল্য, আনুমানিক আয়ুষ্কাল ও অবচয় প্যারামিটার
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAsset} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Code */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ট্যাগ / সম্পদ কোড *</label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={e => setFormCode(e.target.value)}
                    placeholder="যেমন: PRD-OVEN-01"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:bg-white focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                {/* Name */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">সম্পদের নাম ও মডেল *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="যেমন: ইন্ডাস্ট্রিয়াল ওভেন বেকারি মেশিন"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">বিভাগ (Department) *</label>
                  <select
                    value={formDepartment}
                    onChange={e => setFormDepartment(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white"
                  >
                    <option value="PRODUCTION">উৎপাদন ও কারখানা (Production)</option>
                    <option value="OFFICE">হেড অফিস ও প্রশাসন (Office / Admin)</option>
                    <option value="PACKAGING">প্যাকেজিং সেকশন (Packaging)</option>
                    <option value="LOGISTICS">লজিস্টিকস ও পরিবহন (Logistics / Fleet)</option>
                    <option value="SALES">সেলস ও শোরুম (Sales & Outlets)</option>
                    <option value="UTILITY_POWER">বিদ্যুৎ ও জেনারেটর (Utility / Power)</option>
                  </select>
                </div>

                {/* Purchase Date */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ক্রয়ের তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={formPurchaseDate}
                    onChange={e => setFormPurchaseDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:bg-white"
                  />
                </div>

                {/* Cost */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ক্রয়মূল্য / অর্জিত খরচ (৳) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formCost}
                    onChange={e => setFormCost(e.target.value ? parseFloat(e.target.value) : '')}
                    placeholder="যেমন: ৩৫০,০০০"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-teal-700 focus:bg-white"
                  />
                </div>

                {/* Useful Life Years */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    আনুমানিক আয়ুষ্কাল (বছর) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="50"
                    value={formUsefulLifeYears}
                    onChange={e => setFormUsefulLifeYears(e.target.value ? parseFloat(e.target.value) : '')}
                    placeholder="যেমন: ৫ বা ১০ বছর"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:bg-white"
                  />
                </div>

                {/* Salvage Value */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ভগ্নাবশেষ মূল্য / স্ক্র্যাপ ভ্যালু (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formSalvageValue}
                    onChange={e => setFormSalvageValue(e.target.value ? parseFloat(e.target.value) : '')}
                    placeholder="যেমন: ২০,০০০"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:bg-white"
                  />
                </div>

                {/* Condition */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">বর্তমান শারীরিক অবস্থা *</label>
                  <select
                    value={formCondition}
                    onChange={e => setFormCondition(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white"
                  >
                    <option value="EXCELLENT">চমৎকার (Excellent)</option>
                    <option value="GOOD">ভালো (Good)</option>
                    <option value="NEEDS_REPAIR">মেরামত প্রয়োজন (Needs Repair)</option>
                    <option value="DAMAGED">ক্ষতিগ্রস্ত / নষ্ট (Damaged)</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">অপারেটিং স্ট্যাটাস *</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white"
                  >
                    <option value="ACTIVE">সক্রিয় ও চলমান (Active)</option>
                    <option value="UNDER_MAINTENANCE">মেরামতাধীন (Under Maintenance)</option>
                    <option value="DISPOSED">বাতিল / অপসারিত (Disposed)</option>
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">অবস্থান / রুম / ফ্লোর *</label>
                  <input
                    type="text"
                    required
                    value={formLocation}
                    onChange={e => setFormLocation(e.target.value)}
                    placeholder="যেমন: বেকারি শেড, ২য় তলা"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>

                {/* Assigned Operator */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">দায়িত্বপ্রাপ্ত ব্যক্তি / ইন-চার্জ</label>
                  <input
                    type="text"
                    value={formAssignedTo}
                    onChange={e => setFormAssignedTo(e.target.value)}
                    placeholder="যেমন: অপারেটর রফিকুল ইসলাম"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>

                {/* Serial Number */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">সিরিয়াল নম্বর / চেসিস নং</label>
                  <input
                    type="text"
                    value={formSerialNumber}
                    onChange={e => setFormSerialNumber(e.target.value)}
                    placeholder="যেমন: SN-2024-8849"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:bg-white"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">অতিরিক্ত বিবরণ বা ওয়ারেন্টি তথ্য</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="যেমন: ৩ বছরের কম্প্রেসর ওয়ারেন্টি রয়েছে"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-xs transition-colors"
                >
                  {editingAsset ? 'তথ্য আপডেট করুন' : 'সম্পদ সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Maintenance Logs Modal */}
      {activeMaintenanceAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    রক্ষণাবেক্ষণ ও সার্ভিসিং লগ: {activeMaintenanceAsset.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    কোড: {activeMaintenanceAsset.code} | বিভাগ: {activeMaintenanceAsset.department}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveMaintenanceAsset(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Asset Quick Summary in Modal */}
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-[10px] text-blue-600 block">মূল ক্রয়মূল্য</span>
                <span className="font-mono font-bold text-slate-800">
                  {formatCurrency(activeMaintenanceAsset.cost)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-blue-600 block">বর্তমান পুস্তক মূল্য</span>
                <span className="font-mono font-bold text-emerald-700">
                  {formatCurrency(calculateDepreciation(activeMaintenanceAsset).currentBookValue)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-blue-600 block">মোট মেরামত ব্যয়</span>
                <span className="font-mono font-bold text-blue-700">
                  {formatCurrency(calculateDepreciation(activeMaintenanceAsset).totalMaintenanceCost)}
                </span>
              </div>
            </div>

            {/* Add Maintenance Entry Form */}
            <form onSubmit={handleAddMaintenance} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs">
              <h4 className="font-bold text-slate-800 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                নতুন সার্ভিসিং / মেরামত রেকর্ড যোগ করুন
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-600 mb-0.5">তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={maintDate}
                    onChange={e => setMaintDate(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-0.5">মেরামত খরচ (৳) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={maintCost}
                    onChange={e => setMaintCost(e.target.value ? parseFloat(e.target.value) : '')}
                    placeholder="টাকার পরিমাণ"
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-blue-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-0.5">সার্ভিস প্রদানকারী / টেকনিশিয়ান</label>
                  <input
                    type="text"
                    value={maintServicedBy}
                    onChange={e => setMaintServicedBy(e.target.value)}
                    placeholder="টেকনিশিয়ান নাম"
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <label className="block text-slate-600 mb-0.5">মেরামতের বিবরণ ও যন্ত্রাংশ পরিবর্তন *</label>
                  <input
                    type="text"
                    required
                    value={maintDesc}
                    onChange={e => setMaintDesc(e.target.value)}
                    placeholder="যেমন: বিয়ারিং পরিবর্তন ও লুব্রিকেশন"
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-0.5">পরবর্তী সার্ভিস ডিউ তারিখ</label>
                  <input
                    type="date"
                    value={maintNextServiceDate}
                    onChange={e => setMaintNextServiceDate(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-2xs transition-colors"
                >
                  মেরামত লগ যোগ করুন
                </button>
              </div>
            </form>

            {/* Maintenance History List */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-700">পূর্ববর্তী মেরামত ও সার্ভিসিং ইতিহাস</h4>

              {(!activeMaintenanceAsset.maintenanceLogs || activeMaintenanceAsset.maintenanceLogs.length === 0) ? (
                <p className="text-slate-400 py-6 text-center italic bg-slate-50 rounded-xl">
                  এই সম্পদের জন্য এখনো কোনো রক্ষণাবেক্ষণ বা মেরামত রেকর্ড নথিভুক্ত করা হয়নি।
                </p>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {activeMaintenanceAsset.maintenanceLogs.map(log => (
                    <div key={log.id} className="p-3 bg-white flex items-center justify-between hover:bg-slate-50/70">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-500 font-semibold">{formatDate(log.date)}</span>
                          <span className="font-bold text-slate-900">{log.description}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap gap-x-3">
                          {log.servicedBy && <span>টেকনিশিয়ান: {log.servicedBy}</span>}
                          {log.nextServiceDate && <span>পরবর্তী সার্ভিস: {formatDate(log.nextServiceDate)}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-blue-700 text-sm">
                          {formatCurrency(log.cost)}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('আপনি কি এই মেরামত রেকর্ডটি মুছে ফেলতে চান?')) {
                              deleteAssetMaintenanceLog(activeMaintenanceAsset.id, log.id);
                              // Sync local state reference
                              setActiveMaintenanceAsset(prev => prev ? {
                                ...prev,
                                maintenanceLogs: (prev.maintenanceLogs || []).filter(m => m.id !== log.id),
                              } : null);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 rounded"
                          title="রেকর্ড মুছুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. Official Printable Asset Register Modal */}
      {showPrintRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[96vh] animate-in fade-in zoom-in-95">
            {/* Modal Controls */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50/80 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-sm">অফিসিয়াল অ্যাসেট ও অবচয় রেজিস্টার শিট</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                >
                  <Printer className="w-3.5 h-3.5 text-teal-600" />
                  প্রিন্ট
                </button>

                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  PDF
                </button>

                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  Excel
                </button>

                <button
                  onClick={() => setShowPrintRegisterModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Printable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/50">
              <div
                id="assets-register-sheet"
                className="bg-white border border-slate-200 rounded-xl p-6 sm:p-10 shadow-xs max-w-4xl mx-auto text-slate-800 font-sans"
              >
                {/* Header: Company Info */}
                <div className="border-b-2 border-slate-800 pb-5 mb-6">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 text-center sm:text-left">
                    <div className="flex items-center gap-3">
                      {settings.logoUrl ? (
                        <img
                          src={settings.logoUrl}
                          alt={settings.name}
                          className="w-16 h-16 object-contain rounded-lg border border-slate-200 p-1"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold text-xl shadow-xs">
                          {settings.name.slice(0, 2)}
                        </div>
                      )}
                      <div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                          {settings.name}
                        </h1>
                        {settings.nameBangla && (
                          <div className="text-sm font-semibold text-slate-600">
                            {settings.nameBangla}
                          </div>
                        )}
                        {settings.tagline && (
                          <p className="text-xs text-teal-700 font-medium italic mt-0.5">
                            {settings.tagline}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 space-y-0.5 sm:text-right">
                      <p className="flex items-center justify-center sm:justify-end gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{settings.address}</span>
                      </p>
                      {settings.factoryAddress && (
                        <p className="text-[11px] text-slate-500">
                          কারখানা: {settings.factoryAddress}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-500">
                        ফোন: {settings.phone} | ইমেইল: {settings.email}
                      </p>
                    </div>
                  </div>

                  {/* Register Title Badge */}
                  <div className="mt-6 text-center">
                    <div className="inline-block px-5 py-1.5 bg-slate-900 text-white rounded-full text-xs sm:text-sm font-bold tracking-wider uppercase shadow-xs">
                      বিভাগীয় স্থায়ী সম্পদ ও অবচয় রেজিস্টার (Fixed Assets & Depreciation Register)
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      স্ট্রেট-লাইন অবচয় হিসাব ও নিট বুক ভ্যালু বিবরণী • রিপোর্ট তারিখ: {formatDate(new Date().toISOString())}
                    </p>
                  </div>
                </div>

                {/* Summary Strip */}
                <div className="grid grid-cols-3 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3 mb-6 text-center text-xs">
                  <div>
                    <span className="text-slate-500 block">মোট অর্জিত মূল্য</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {formatCurrency(metrics.totalCost)}
                    </span>
                  </div>
                  <div>
                    <span className="text-amber-600 block font-semibold">মোট পুঞ্জীভূত অবচয়</span>
                    <span className="font-mono font-bold text-amber-700 text-sm">
                      {formatCurrency(metrics.totalAccumulatedDep)}
                    </span>
                  </div>
                  <div>
                    <span className="text-emerald-700 block font-semibold">মোট বর্তমান পুস্তক মূল্য</span>
                    <span className="font-mono font-bold text-emerald-800 text-sm">
                      {formatCurrency(metrics.totalCurrentBookValue)}
                    </span>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl mb-6">
                  <div className="p-4 pb-0"><DataExportToolbar filename="DepartmentAssetsView_Export" /></div>
<table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 px-3">ট্যাগ নং</th>
                        <th className="py-2.5 px-3">সম্পদের বিবরণ</th>
                        <th className="py-2.5 px-3">বিভাগ</th>
                        <th className="py-2.5 px-3">ক্রয় তারিখ</th>
                        <th className="py-2.5 px-3 text-right">ক্রয়মূল্য (৳)</th>
                        <th className="py-2.5 px-3 text-right">পুঞ্জীভূত অবচয় (৳)</th>
                        <th className="py-2.5 px-3 text-right font-bold text-slate-900">বুক ভ্যালু (৳)</th>
                        <th className="py-2.5 px-3 text-center">অবস্থা</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredAssets.map(a => (
                        <tr key={a.id}>
                          <td className="py-2 px-3 font-mono font-bold text-teal-800">{a.code}</td>
                          <td className="py-2 px-3">
                            <span className="font-semibold text-slate-900">{a.name}</span>
                            <span className="text-[10px] text-slate-400 block">{a.location}</span>
                          </td>
                          <td className="py-2 px-3">{a.department}</td>
                          <td className="py-2 px-3 font-mono text-slate-600">{formatDate(a.purchaseDate)}</td>
                          <td className="py-2 px-3 text-right font-mono">{formatCurrency(a.dep.cost)}</td>
                          <td className="py-2 px-3 text-right font-mono text-amber-700">{formatCurrency(a.dep.accumulatedDepreciation)}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">{formatCurrency(a.dep.currentBookValue)}</td>
                          <td className="py-2 px-3 text-center font-semibold text-[10px]">{a.condition}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                        <td colSpan={4} className="py-2.5 px-3 text-right uppercase text-[11px]">সর্বমোট (Total):</td>
                        <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(metrics.totalCost)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-amber-800">{formatCurrency(metrics.totalAccumulatedDep)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-800">{formatCurrency(metrics.totalCurrentBookValue)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Signatures */}
                <div className="pt-10 mt-8 border-t border-slate-200 grid grid-cols-3 gap-4 text-center text-xs">
                  <div>
                    <div className="w-36 h-12 border-b border-slate-400 mx-auto mb-2 flex items-end justify-center pb-1">
                      <span className="text-[10px] text-slate-400 italic">প্রস্তুতকারী</span>
                    </div>
                    <span className="font-bold text-slate-700 block">স্টোর ও অ্যাসেট অফিসার</span>
                    <span className="text-[10px] text-slate-400 block">Asset Controller</span>
                  </div>

                  <div>
                    <div className="w-36 h-12 border-b border-slate-400 mx-auto mb-2 flex items-end justify-center pb-1">
                      <span className="text-[10px] text-slate-400 italic">কারিগরি যাচাই</span>
                    </div>
                    <span className="font-bold text-slate-700 block">প্ল্যান্ট ম্যানেজার / চিফ ইঞ্জিনিয়ার</span>
                    <span className="text-[10px] text-slate-400 block">Plant Engineer</span>
                  </div>

                  <div>
                    <div className="w-36 h-12 border-b border-slate-400 mx-auto mb-2 flex items-end justify-center pb-1">
                      <span className="text-[10px] text-slate-400 italic">অনুমোদন</span>
                    </div>
                    <span className="font-bold text-slate-800 block">পরিচালক / প্রধান হিসাব কর্মকর্তা</span>
                    <span className="text-[10px] text-slate-400 block">Director of Finance</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
