import React, { useState } from 'react';
import { Employee, CompanySettings } from '../../types';
import { CompanyIDCard } from './CompanyIDCard';
import { useERP } from '../../context/ERPContext';
import {
  Printer,
  Edit3,
  Search,
  Filter,
  Check,
  X,
  CreditCard,
  Eye,
  Download,
  Users,
  Building2,
  Sparkles,
  Phone,
  Calendar,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import { printDocument, exportElementToPDF } from '../../utils/printPdfUtils';

interface CompanyIDCardManagerProps {
  onClose?: () => void;
}

export const CompanyIDCardManager: React.FC<CompanyIDCardManagerProps> = ({ onClose }) => {
  const { employees, updateEmployee, settings } = useERP();

  const [selectedEmpId, setSelectedEmpId] = useState<string>(employees[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [cardSideView, setCardSideView] = useState<'BOTH' | 'FRONT' | 'BACK'>('BOTH');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Edit modal form states
  const [editName, setEditName] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editJoinDate, setEditJoinDate] = useState('');
  const [editNid, setEditNid] = useState('');
  const [editBloodGroup, setEditBloodGroup] = useState('B+');
  const [editCode, setEditCode] = useState('');
  const [editIssueDate, setEditIssueDate] = useState('16-07-2026');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');

  // Filtered employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.designation || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.phone || '').includes(searchQuery) ||
      (emp.code || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = selectedDept === 'ALL' || emp.department === selectedDept;

    return matchesSearch && matchesDept;
  });

  const activeEmployee = employees.find(e => e.id === selectedEmpId) || employees[0];

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setEditName(emp.name);
    setEditDesignation(emp.designation || emp.role || 'Staff');
    setEditPhone(emp.phone);
    setEditJoinDate(emp.joinDate);
    setEditNid(emp.nid || '1992269458000012');
    setEditBloodGroup(emp.bloodGroup || 'B+');
    setEditCode(emp.code || emp.id.replace('EMP-', '') || '01');
    setEditIssueDate(emp.issueDate || '16-07-2026');
    setEditPhotoUrl(emp.photoUrl || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    updateEmployee(editingEmployee.id, {
      name: editName.trim(),
      designation: editDesignation.trim(),
      role: editDesignation.trim(),
      phone: editPhone.trim(),
      joinDate: editJoinDate,
      nid: editNid.trim(),
      bloodGroup: editBloodGroup,
      code: editCode.trim(),
      issueDate: editIssueDate.trim(),
      photoUrl: editPhotoUrl.trim() || undefined,
    });

    setEditingEmployee(null);
  };

  const handlePrintSingle = () => {
    if (!activeEmployee) return;
    printDocument('single-id-card-print-container', {
      title: `ID_Card_${activeEmployee.name.replace(/\s+/g, '_')}_${activeEmployee.code || activeEmployee.id}`,
    });
  };

  const handlePrintAll = () => {
    printDocument('all-id-cards-print-container', {
      title: `Company_ID_Cards_${settings.companyNameEnglish || 'SharminFood'}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                কোম্পানির অফিশিয়াল আইডি কার্ড (Official Employee ID Cards)
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-200">
                  CR80 Standard
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                কোম্পানির নির্ধারিত ডিজাইন অনুযায়ী পিভিসি ও পেপার আইডি কার্ড (উভয় পাশ, কিউআর কোড ও সিগনেচার সহ)
              </p>
            </div>
          </div>
        </div>

        {/* View Mode & Print Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap no-print">
          {/* Card Side View Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <button
              type="button"
              onClick={() => setCardSideView('BOTH')}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                cardSideView === 'BOTH'
                  ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              উভয় পাশ
            </button>
            <button
              type="button"
              onClick={() => setCardSideView('FRONT')}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                cardSideView === 'FRONT'
                  ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              সামনে
            </button>
            <button
              type="button"
              onClick={() => setCardSideView('BACK')}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                cardSideView === 'BACK'
                  ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              পেছনে
            </button>
          </div>

          {/* Print Single Card Button */}
          <button
            type="button"
            onClick={handlePrintSingle}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            title="নির্বাচিত কার্ডটি প্রিন্ট করুন"
          >
            <Printer className="w-4 h-4" />
            <span>এই কার্ডটি প্রিন্ট</span>
          </button>

          {/* Batch Print All Cards */}
          <button
            type="button"
            onClick={handlePrintAll}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            title="সকল কর্মচারীর আইডি কার্ড একসাথে প্রিন্ট করুন"
          >
            <Layers className="w-4 h-4" />
            <span>সকল কার্ড প্রিন্ট ({employees.length})</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Workspace: Left Employee List & Search, Right Interactive Card Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Employee Selection & Filters (lg:col-span-4) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col h-[560px]">
          <div className="space-y-2.5 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="নাম, পদবি বা আইডি কোড খুঁজুন..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold">মোট কর্মচারী: {employees.length} জন</span>
              <span className="text-[11px] text-teal-600 font-bold font-mono">
                {filteredEmployees.length} জন দৃশ্যমান
              </span>
            </div>
          </div>

          {/* Employee List Scrollable Area */}
          <div className="flex-1 overflow-y-auto mt-2 space-y-2 pr-1">
            {filteredEmployees.map(emp => {
              const isSelected = emp.id === (activeEmployee?.id || '');
              return (
                <div
                  key={emp.id}
                  onClick={() => setSelectedEmpId(emp.id)}
                  className={`p-3 rounded-xl cursor-pointer border transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-300 dark:border-teal-700 shadow-2xs'
                      : 'bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 border-slate-200/60 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-slate-300">
                      {emp.photoUrl ? (
                        <img src={emp.photoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        emp.name.slice(0, 1)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {emp.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {emp.designation || emp.role || 'Staff'} • ID: {emp.code || emp.id}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        handleOpenEdit(emp);
                      }}
                      className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950 rounded-lg transition-colors"
                      title="আইডি কার্ডের তথ্য পরিবর্তন করুন"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredEmployees.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-xs">
                কোনো কর্মচারী পাওয়া যায়নি।
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Selected Employee Interactive Preview Stage (lg:col-span-8) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          {activeEmployee ? (
            <div>
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
                    <span>কার্ড প্রিভিউ: {activeEmployee.name}</span>
                    <span className="text-xs font-mono font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-800">
                      {activeEmployee.code || activeEmployee.id}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {activeEmployee.designation || activeEmployee.role} • যোগদানের তারিখ: {activeEmployee.joinDate}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(activeEmployee)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-teal-600" />
                    <span>তথ্য সম্পাদন (Edit)</span>
                  </button>
                </div>
              </div>

              {/* Centered Printable / Display Stage */}
              <div className="bg-gradient-to-b from-slate-100 to-slate-200/80 dark:from-slate-800/80 dark:to-slate-900/80 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center min-h-[420px]">
                <div id="single-id-card-print-container" className="print:m-0 print:p-0">
                  <CompanyIDCard
                    employee={activeEmployee}
                    settings={settings}
                    side={cardSideView}
                  />
                </div>
              </div>

              {/* ID Card Specifications Footer Note */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-4">
                  <span>📐 মাপ: <strong>2.125" × 3.375" (CR80)</strong></span>
                  <span>🖨️ প্রিন্ট সাপোর্ট: <strong>পিভিসি কার্ড প্রিন্টার / লেমিনেটিং পেপার</strong></span>
                </div>
                <div className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ডিজিটাল কিউআর কোড ভেরিফিকেশন যুক্ত</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400">
              প্রিভিউ দেখার জন্য তালিকা থেকে একজন কর্মচারী নির্বাচন করুন।
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HIDDEN BATCH PRINT CONTAINER (Contains all employees formatted for print)  */}
      {/* ========================================================================= */}
      <div className="hidden">
        <div id="all-id-cards-print-container" className="p-4 bg-white">
          <div className="text-center mb-6 pb-2 border-b border-slate-300">
            <h1 className="text-xl font-black text-slate-900 uppercase">
              {settings.companyNameEnglish || 'M/S SHARMIN Food'}
            </h1>
            <p className="text-xs text-slate-600">সকল কর্মচারীর আইডি কার্ড ব্যাচ প্রিন্ট শীট (CR80 Standard)</p>
          </div>

          <div className="grid grid-cols-2 gap-6 justify-center">
            {employees.map(emp => (
              <div key={emp.id} className="page-break-inside-avoid flex justify-center">
                <CompanyIDCard
                  employee={emp}
                  settings={settings}
                  side={cardSideView}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* QUICK EDIT EMPLOYEE CARD DETAILS MODAL                                    */}
      {/* ========================================================================= */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-400">
                  <Edit3 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  আইডি কার্ড তথ্য সম্পাদন: {editingEmployee.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingEmployee(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    কর্মচারীর নাম (Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    পদবি (Designation) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editDesignation}
                    onChange={e => setEditDesignation(e.target.value)}
                    placeholder="Marketing manager"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    আইডি কোড (ID No) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editCode}
                    onChange={e => setEditCode(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    মোবাইল নম্বর (Mobile) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    রক্তের গ্রুপ (Blood Group)
                  </label>
                  <select
                    value={editBloodGroup}
                    onChange={e => setEditBloodGroup(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-rose-600"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    এনআইডি নং (NID No)
                  </label>
                  <input
                    type="text"
                    value={editNid}
                    onChange={e => setEditNid(e.target.value)}
                    placeholder="1992269458000012"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    যোগদানের তারিখ (Joining Date)
                  </label>
                  <input
                    type="date"
                    value={editJoinDate}
                    onChange={e => setEditJoinDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ইস্যুর তারিখ (Card Issue Date)
                  </label>
                  <input
                    type="text"
                    value={editIssueDate}
                    onChange={e => setEditIssueDate(e.target.value)}
                    placeholder="16-07-2026"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ছবি লিংক (Photo URL)
                  </label>
                  <input
                    type="text"
                    value={editPhotoUrl}
                    onChange={e => setEditPhotoUrl(e.target.value)}
                    placeholder="https://... (ঐচ্ছিক)"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-xs transition-colors"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
