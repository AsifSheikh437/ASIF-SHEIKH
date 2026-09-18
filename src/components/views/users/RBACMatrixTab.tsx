import React, { useState, useEffect } from 'react';
import { DataExportToolbar } from '../../../components/common/DataExportToolbar';
import { useERP } from '../../../context/ERPContext';
import { Role, RolePermissionMatrix } from '../../../types';
import { ALL_ERP_MODULES, RBAC_ROLES } from '../../../context/ERPContext';
import { exportElementToPDF, printDocument } from '../../../utils/printPdfUtils';
import {
  Shield,
  Check,
  X,
  Save,
  RotateCcw,
  Printer,
  FileText,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  Lock,
  Crown,
  Eye,
  PlusCircle,
  Edit,
  Trash2,
} from 'lucide-react';

const ROLE_LABELS: Record<Role, { name: string; tag: string; color: string }> = {
  DEVELOPER: { name: 'রুট ডেভেলপার', tag: 'Developer', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  ADMIN: { name: 'সিস্টেম অ্যাডমিন', tag: 'Admin', color: 'bg-rose-100 text-rose-800 border-rose-300' },
  MANAGER: { name: 'জেনারেল ম্যানেজার', tag: 'Manager', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  ACCOUNTANT: { name: 'একাউন্ট্যান্ট', tag: 'Accountant', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  SALES: { name: 'সেলস অফিসার', tag: 'Sales', color: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
  PURCHASE: { name: 'ক্রয় ও সাপ্লাই', tag: 'Purchase', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  INVENTORY: { name: 'ইনভেন্টরি অফিসার', tag: 'Inventory', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  'HR/PAYROLL': { name: 'এইচআর ও পেরোল', tag: 'HR/Payroll', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  VIEWER: { name: 'দর্শক', tag: 'Viewer', color: 'bg-slate-100 text-slate-700 border-slate-300' },
};

export const RBACMatrixTab: React.FC = () => {
  const {
    currentUser,
    rolePermissionsMatrix,
    updateRolePermissionsMatrix,
    resetRolePermissionsMatrixToDefault,
    settings,
  } = useERP();

  const [matrixState, setMatrixState] = useState<RolePermissionMatrix>(() => {
    return JSON.parse(JSON.stringify(rolePermissionsMatrix));
  });

  const [isDirty, setIsDirty] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  useEffect(() => {
    setMatrixState(JSON.parse(JSON.stringify(rolePermissionsMatrix)));
    setIsDirty(false);
  }, [rolePermissionsMatrix]);

  const handleToggle = (
    role: Role,
    moduleKey: string,
    action: 'view' | 'add' | 'edit' | 'delete'
  ) => {
    setMatrixState(prev => {
      const copy = { ...prev };
      if (!copy[role]) copy[role] = {};
      if (!copy[role][moduleKey]) {
        copy[role][moduleKey] = { view: false, add: false, edit: false, delete: false };
      }
      const currentVal = !!copy[role][moduleKey][action];
      const newVal = !currentVal;

      copy[role][moduleKey] = {
        ...copy[role][moduleKey],
        [action]: newVal,
      };

      // If add/edit/delete is enabled, view must automatically be enabled
      if (newVal && (action === 'add' || action === 'edit' || action === 'delete')) {
        copy[role][moduleKey].view = true;
      }
      // If view is disabled, all permissions for this module are turned off
      if (!newVal && action === 'view') {
        copy[role][moduleKey].add = false;
        copy[role][moduleKey].edit = false;
        copy[role][moduleKey].delete = false;
      }

      return copy;
    });
    setIsDirty(true);
    setSaveSuccess(false);
  };

  const handleSave = () => {
    updateRolePermissionsMatrix(matrixState);
    setIsDirty(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const handleResetToDefault = () => {
    if (confirm('আপনি কি নিশ্চিত যে সকল রোলের পারমিশন ডিফল্ট সিস্টেমে রিসেট করতে চান?')) {
      resetRolePermissionsMatrixToDefault();
      setIsDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    }
  };

  const handleGrantAllForRole = (role: Role) => {
    setMatrixState(prev => {
      const copy = { ...prev };
      if (!copy[role]) copy[role] = {};
      ALL_ERP_MODULES.forEach(mod => {
        // DEV_SETTINGS is only for Developer
        const isDevSetting = mod.key === 'DEV_SETTINGS';
        copy[role][mod.key] = {
          view: !isDevSetting,
          add: !isDevSetting,
          edit: !isDevSetting,
          delete: !isDevSetting,
        };
      });
      return copy;
    });
    setIsDirty(true);
  };

  const handleRevokeAllForRole = (role: Role) => {
    setMatrixState(prev => {
      const copy = { ...prev };
      if (!copy[role]) copy[role] = {};
      ALL_ERP_MODULES.forEach(mod => {
        copy[role][mod.key] = {
          view: false,
          add: false,
          edit: false,
          delete: false,
        };
      });
      return copy;
    });
    setIsDirty(true);
  };

  const handlePrint = () => {
    printDocument('rbac-matrix-printable-area', {
      title: `${settings.companyName || 'Food ERP'} - রোলভিত্তিক এক্সেস কন্ট্রোল ও পারমিশন ম্যাট্রিক্স`,
      landscape: true,
    });
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      await exportElementToPDF('rbac-matrix-printable-area', {
        filename: `RBAC_Permission_Matrix_${new Date().toISOString().substring(0, 10)}.pdf`,
        orientation: 'landscape',
      });
    } finally {
      setIsExportingPDF(false);
    }
  };

  const isDeveloper = currentUser?.role === 'DEVELOPER';

  // Group modules by category (hide DEV_SETTINGS from non-developers)
  const visibleModulesList = ALL_ERP_MODULES.filter(m => isDeveloper || m.key !== 'DEV_SETTINGS');
  const moduleGroups = visibleModulesList.reduce((acc, m) => {
    if (!acc[m.group]) acc[m.group] = [];
    acc[m.group].push(m);
    return acc;
  }, {} as Record<string, typeof ALL_ERP_MODULES>);

  return (
    <div className="space-y-6">
      {/* Top Banner with Developer Note & Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                রোলভিত্তিক এক্সেস কন্ট্রোল (RBAC Permission Matrix)
                {isDirty && (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-semibold animate-pulse">
                    সংরক্ষণের অপেক্ষায়
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                মডিউলভিত্তিক View, Add, Edit এবং Delete পারমিশন নির্ধারণ করুন যা সাথে সাথে সংশ্লিষ্ট রোলের সব ইউজারের ক্ষেত্রে কার্যকর হবে
              </p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors shadow-2xs"
            title="ম্যাট্রিক্স প্রিন্ট করুন"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            প্রিন্ট
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-xl transition-colors shadow-2xs disabled:opacity-50"
            title="PDF ডাউনলোড করুন"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            {isExportingPDF ? 'তৈরি হচ্ছে...' : 'PDF ডাউনলোড'}
          </button>

          <button
            type="button"
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            title="ডিফল্ট পারমিশনে ফিরে যান"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            ডিফল্ট রিসেট
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty}
            className={`flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl shadow-xs transition-all ${
              isDirty
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white animate-bounce-subtle'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            পারমিশন সংরক্ষণ করুন
          </button>
        </div>
      </div>

      {/* Security Info & Legend Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isDeveloper ? (
          <div className="md:col-span-2 p-4 rounded-2xl bg-gradient-to-r from-purple-900 to-indigo-950 text-white border border-purple-800 flex items-center gap-3.5 text-xs shadow-xs">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="font-bold text-sm text-purple-100 flex items-center gap-2">
                রুট ডেভেলপার (Developer) বিশেষ অধিকার
                <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30">
                  100% Unrestricted
                </span>
              </div>
              <p className="text-purple-200 text-[11px] mt-0.5 leading-relaxed">
                সিস্টেম ও রুট ডেভেলপার একাউন্ট সব মডিউলে স্বয়ংক্রিয়ভাবে সম্পূর্ণ এক্সেস (View, Add, Edit, Delete) ধারণ করে, যা ম্যাট্রিক্স পরিবর্তনের দ্বারা সীমিত করা যায় না।
              </p>
            </div>
          </div>
        ) : (
          <div className="md:col-span-2 p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white border border-slate-800 flex items-center gap-3.5 text-xs shadow-xs">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
              <Shield className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
                রোলভিত্তিক নিরাপত্তা নীতি ও অধিকার ব্যবস্থাপনা
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Enterprise Security
                </span>
              </div>
              <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                প্রতিটি রোলের জন্য সুনির্দিষ্ট মডিউল পারমিশন (দেখা, তৈরি, সম্পাদনা, মুছে ফেলা) কার্যকর। প্রয়োজন অনুসারে চেকমার্ক পরিবর্তন করে "সংরক্ষণ করুন" বাটনে চাপ দিন।
              </p>
            </div>
          </div>
        )}

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-center text-xs space-y-2">
          <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">পারমিশন সংকেত ও কালার কোড:</div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-700">
              <span className="w-5 h-5 rounded bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">V</span>
              <span>View (দেখা)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700">
              <span className="w-5 h-5 rounded bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-[10px]">A</span>
              <span>Add (তৈরি)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700">
              <span className="w-5 h-5 rounded bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-[10px]">E</span>
              <span>Edit (সম্পাদনা)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700">
              <span className="w-5 h-5 rounded bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-[10px]">D</span>
              <span>Delete (মুছে ফেলা)</span>
            </div>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>রোলভিত্তিক এক্সেস কন্ট্রোল ম্যাট্রিক্স সফলভাবে সংরক্ষিত হয়েছে এবং তাত্ক্ষণিকভাবে প্রয়োগ করা হয়েছে!</span>
        </div>
      )}

      {/* Main RBAC Table Printable Container */}
      <div
        id="rbac-matrix-printable-area"
        className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden p-1 sm:p-2"
      >
        {/* Printable Official Header */}
        <div className="hidden print:block p-4 border-b border-slate-200 mb-3 text-slate-800">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{settings.companyName || 'Sonali Foods Limited'}</h1>
              <p className="text-xs text-slate-600">{settings.address || 'Dhaka, Bangladesh'} | ফোন: {settings.phone || 'N/A'}</p>
              <p className="text-sm font-semibold text-indigo-800 mt-1">রোলভিত্তিক অ্যাক্সেস কন্ট্রোল ও অথরাইজেশন ম্যাট্রিক্স (RBAC Matrix)</p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p>তারিখ: {new Date().toLocaleDateString('bn-BD')}</p>
              <p>নিয়ন্ত্রণ: কোম্পানি পলিসি ও আইটি অডিট অনুমোদিত</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="p-4 pb-0"><DataExportToolbar filename="RBACMatrixTab_Export" /></div>
<table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white border-b border-slate-800">
                <th className="py-4 px-4 font-bold text-slate-200 min-w-[240px] sticky left-0 bg-slate-900 z-10">
                  মডিউল ও কার্যাবলি (Module)
                </th>
                {RBAC_ROLES.map(role => (
                  <th key={role} className="py-3 px-3 min-w-[130px] text-center border-l border-slate-800">
                    <div className="font-bold text-xs">{ROLE_LABELS[role]?.name}</div>
                    <div className="text-[10px] text-indigo-300 font-mono font-normal">({ROLE_LABELS[role]?.tag})</div>
                    <div className="flex items-center justify-center gap-1.5 mt-2 no-print">
                      <button
                        type="button"
                        onClick={() => handleGrantAllForRole(role)}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-emerald-300 font-semibold"
                        title="এই রোলের জন্য সব পারমিশন চালু করুন"
                      >
                        সব অন
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRevokeAllForRole(role)}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-rose-300 font-semibold"
                        title="এই রোলের জন্য সব পারমিশন বন্ধ করুন"
                      >
                        সব অফ
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {Object.entries(moduleGroups).map(([groupName, modules]) => (
                <React.Fragment key={groupName}>
                  {/* Category Header Row */}
                  <tr className="bg-indigo-50/70 border-y border-indigo-100 font-bold text-indigo-900">
                    <td colSpan={RBAC_ROLES.length + 1} className="py-2.5 px-4 text-xs tracking-wide flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                      <span>{groupName}</span>
                    </td>
                  </tr>

                  {modules.map(m => (
                    <tr key={m.key} className="hover:bg-slate-50 transition-colors">
                      {/* Module Name Row */}
                      <td className="py-3 px-4 font-semibold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-100 shadow-xs">
                        <div className="text-xs">{m.label.split('(')[0]}</div>
                        <div className="text-[10px] text-slate-400 font-mono font-normal">
                          {m.label.includes('(') ? m.label.split('(')[1].replace(')', '') : m.key}
                        </div>
                      </td>

                      {/* Role Columns */}
                      {RBAC_ROLES.map(role => {
                        const perm = matrixState[role]?.[m.key] || {
                          view: false,
                          add: false,
                          edit: false,
                          delete: false,
                        };

                        const isDevSetting = m.key === 'DEV_SETTINGS';
                        if (isDevSetting) {
                          return (
                            <td key={role} className="py-3 px-2 text-center border-l border-slate-100 bg-slate-50">
                              <span className="text-[10px] text-slate-400 font-mono">লকড (Locked)</span>
                            </td>
                          );
                        }

                        return (
                          <td key={role} className="py-3 px-2 text-center border-l border-slate-100">
                            <div className="flex items-center justify-center gap-1">
                              {/* View Checkbox */}
                              <button
                                type="button"
                                onClick={() => handleToggle(role, m.key, 'view')}
                                className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold transition-all ${
                                  perm.view
                                    ? 'bg-blue-600 text-white shadow-2xs'
                                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                }`}
                                title="View: পেজ ও মেনু দেখা"
                              >
                                V
                              </button>

                              {/* Add Checkbox */}
                              <button
                                type="button"
                                onClick={() => handleToggle(role, m.key, 'add')}
                                className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold transition-all ${
                                  perm.add
                                    ? 'bg-emerald-600 text-white shadow-2xs'
                                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                }`}
                                title="Add: নতুন তথ্য বা এন্ট্রি যোগ করা"
                              >
                                A
                              </button>

                              {/* Edit Checkbox */}
                              <button
                                type="button"
                                onClick={() => handleToggle(role, m.key, 'edit')}
                                className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold transition-all ${
                                  perm.edit
                                    ? 'bg-amber-600 text-white shadow-2xs'
                                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                }`}
                                title="Edit: বিদ্যমান তথ্য পরিবর্তন করা"
                              >
                                E
                              </button>

                              {/* Delete Checkbox */}
                              <button
                                type="button"
                                onClick={() => handleToggle(role, m.key, 'delete')}
                                className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold transition-all ${
                                  perm.delete
                                    ? 'bg-rose-600 text-white shadow-2xs'
                                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                }`}
                                title="Delete: রেকর্ড মুছে ফেলা"
                              >
                                D
                              </button>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Printable Official Footer Signatures */}
        <div className="hidden print:flex justify-between items-end pt-12 px-6 pb-4 mt-6 border-t border-slate-200 text-xs text-slate-700">
          <div className="text-center">
            <div className="w-40 border-t border-slate-400 mb-1"></div>
            <p>প্রস্তুতকারক (Prepared By)</p>
          </div>
          <div className="text-center">
            <div className="w-40 border-t border-slate-400 mb-1"></div>
            <p>আইটি ও সিস্টেম অডিটর (IT Auditor)</p>
          </div>
          <div className="text-center">
            <div className="w-40 border-t border-slate-400 mb-1"></div>
            <p>ব্যবস্থাপনা পরিচালক (Managing Director)</p>
          </div>
        </div>
      </div>
    </div>
  );
};
