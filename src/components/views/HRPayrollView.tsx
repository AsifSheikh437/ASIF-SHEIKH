import React, { useState, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { DataExportToolbar } from '../common/DataExportToolbar';
import { useERP } from '../../context/ERPContext';
import { Employee, SalaryRecord } from '../../types';
import { formatCurrency, formatDate, exportToCSV } from '../../utils/formatters';
import { printDocument } from '../../utils/printPdfUtils';
import { SalarySlipModal } from '../common/SalarySlipModal';
import { CompanyIDCardManager } from '../hr/CompanyIDCardManager';
import {
  Users,
  UserPlus,
  CreditCard,
  DollarSign,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  Printer,
  X,
  Search,
  Wrench,
  Building2,
  Sliders,
  Sparkles,
  RotateCcw,
  FileText
} from 'lucide-react';


const ManualPayrollSheet = ({ selectedMonth, saveManualPayroll, salaryRecords }: { selectedMonth: string, saveManualPayroll: (m: string, r: any[]) => void, salaryRecords: any[] }) => {
  const [officeSalary, setOfficeSalary] = React.useState(0);
  const [officeAdvance, setOfficeAdvance] = React.useState(0);
  
  const [mechSalary, setMechSalary] = React.useState(0);
  const [mechAdvance, setMechAdvance] = React.useState(0);
  
  const [maleSalary, setMaleSalary] = React.useState(0);
  const [maleAdvance, setMaleAdvance] = React.useState(0);
  
  const [femaleSalary, setFemaleSalary] = React.useState(0);
  const [femaleAdvance, setFemaleAdvance] = React.useState(0);

  // Load existing if any
  React.useEffect(() => {
    const existing = salaryRecords.filter(s => s.month === selectedMonth && s.employeeId.startsWith('MANUAL_'));
    existing.forEach(s => {
      if (s.employeeId === 'MANUAL_OFFICE') { setOfficeSalary(s.basicSalary); setOfficeAdvance(s.advanceDeduction || 0); }
      if (s.employeeId === 'MANUAL_MECH') { setMechSalary(s.basicSalary); setMechAdvance(s.advanceDeduction || 0); }
      if (s.employeeId === 'MANUAL_MALE') { setMaleSalary(s.basicSalary); setMaleAdvance(s.advanceDeduction || 0); }
      if (s.employeeId === 'MANUAL_FEMALE') { setFemaleSalary(s.basicSalary); setFemaleAdvance(s.advanceDeduction || 0); }
    });
  }, [selectedMonth, salaryRecords]);

  const handleSave = () => {
    const records = [
      {
        id: `SAL-${selectedMonth}-MANUAL_OFFICE`,
        month: selectedMonth,
        employeeId: 'MANUAL_OFFICE',
        employeeName: 'অফিস স্টাফ',
        basicSalary: officeSalary,
        advanceDeduction: officeAdvance,
        netPayable: Math.max(0, officeSalary - officeAdvance),
        status: 'PAID',
        paymentDate: new Date().toISOString().split('T')[0],
      },
      {
        id: `SAL-${selectedMonth}-MANUAL_MECH`,
        month: selectedMonth,
        employeeId: 'MANUAL_MECH',
        employeeName: 'মেকানিকাল ষ্টাফ',
        basicSalary: mechSalary,
        advanceDeduction: mechAdvance,
        netPayable: Math.max(0, mechSalary - mechAdvance),
        status: 'PAID',
        paymentDate: new Date().toISOString().split('T')[0],
      },
      {
        id: `SAL-${selectedMonth}-MANUAL_MALE`,
        month: selectedMonth,
        employeeId: 'MANUAL_MALE',
        employeeName: 'পুরুষ কর্মচারী',
        basicSalary: maleSalary,
        advanceDeduction: maleAdvance,
        netPayable: Math.max(0, maleSalary - maleAdvance),
        status: 'PAID',
        paymentDate: new Date().toISOString().split('T')[0],
      },
      {
        id: `SAL-${selectedMonth}-MANUAL_FEMALE`,
        month: selectedMonth,
        employeeId: 'MANUAL_FEMALE',
        employeeName: 'মহিলা কর্মচারী',
        basicSalary: femaleSalary,
        advanceDeduction: femaleAdvance,
        netPayable: Math.max(0, femaleSalary - femaleAdvance),
        status: 'PAID',
        paymentDate: new Date().toISOString().split('T')[0],
      }
    ];
    saveManualPayroll(selectedMonth, records);
    alert('ম্যানুয়াল স্যালারি সফলভাবে সেভ হয়েছে এবং ক্যাশ থেকে কর্তন করা হয়েছে।');
  };

  const grandTotal = 
    Math.max(0, officeSalary - officeAdvance) + 
    Math.max(0, mechSalary - mechAdvance) + 
    Math.max(0, maleSalary - maleAdvance) + 
    Math.max(0, femaleSalary - femaleAdvance);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
      <h3 className="font-bold text-slate-800 text-lg mb-4 text-center">ম্যানুয়াল স্যালারি এন্ট্রি শিট ({selectedMonth})</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Office Staff */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <h4 className="font-bold text-indigo-700 mb-3">অফিস স্টাফ</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">অফিস স্টাফ মূল বেতন</label>
              <input type="number" value={officeSalary || ''} onChange={e => setOfficeSalary(Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm font-mono" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-rose-600 mb-1">অফিস স্টাফ অগ্রিম বেতন (কর্তন)</label>
              <input type="number" value={officeAdvance || ''} onChange={e => setOfficeAdvance(Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm font-mono text-rose-600" />
            </div>
            <div className="pt-2 border-t flex justify-between font-bold">
              <span>নেট প্রদেয়:</span>
              <span>{Math.max(0, officeSalary - officeAdvance).toLocaleString('en-IN')} ৳</span>
            </div>
          </div>
        </div>

        {/* Mechanical Staff */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <h4 className="font-bold text-indigo-700 mb-3">মেকানিকাল ষ্টাফ</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">মেকানিকাল ষ্টাফ মূল বেতন</label>
              <input type="number" value={mechSalary || ''} onChange={e => setMechSalary(Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm font-mono" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-rose-600 mb-1">অগ্রিম বেতন (কর্তন)</label>
              <input type="number" value={mechAdvance || ''} onChange={e => setMechAdvance(Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm font-mono text-rose-600" />
            </div>
            <div className="pt-2 border-t flex justify-between font-bold">
              <span>নেট প্রদেয়:</span>
              <span>{Math.max(0, mechSalary - mechAdvance).toLocaleString('en-IN')} ৳</span>
            </div>
          </div>
        </div>

        {/* Male Employee */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <h4 className="font-bold text-indigo-700 mb-3">পুরুষ কর্মচারী</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">পুরুষ কর্মচারী মূল বেতন</label>
              <input type="number" value={maleSalary || ''} onChange={e => setMaleSalary(Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm font-mono" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-rose-600 mb-1">অগ্রিম বেতন (কর্তন)</label>
              <input type="number" value={maleAdvance || ''} onChange={e => setMaleAdvance(Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm font-mono text-rose-600" />
            </div>
            <div className="pt-2 border-t flex justify-between font-bold">
              <span>নেট প্রদেয়:</span>
              <span>{Math.max(0, maleSalary - maleAdvance).toLocaleString('en-IN')} ৳</span>
            </div>
          </div>
        </div>

        {/* Female Employee */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <h4 className="font-bold text-indigo-700 mb-3">মহিলা কর্মচারী</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">মহিলা কর্মচারী মূল বেতন</label>
              <input type="number" value={femaleSalary || ''} onChange={e => setFemaleSalary(Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm font-mono" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-rose-600 mb-1">অগ্রিম বেতন (কর্তন)</label>
              <input type="number" value={femaleAdvance || ''} onChange={e => setFemaleAdvance(Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm font-mono text-rose-600" />
            </div>
            <div className="pt-2 border-t flex justify-between font-bold">
              <span>নেট প্রদেয়:</span>
              <span>{Math.max(0, femaleSalary - femaleAdvance).toLocaleString('en-IN')} ৳</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-indigo-50 border-2 border-indigo-200 rounded-xl flex items-center justify-between">
        <div className="text-indigo-900 font-bold text-lg">সর্বমোট প্রদেয় বেতন:</div>
        <div className="text-indigo-900 font-black text-2xl font-mono">{grandTotal.toLocaleString('en-IN')} ৳</div>
      </div>
      
      <div className="mt-4 flex justify-end">
        <button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition-colors flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          বেতন পরিশোধ ও সেভ করুন
        </button>
      </div>
    </div>
  );
};


export const HRPayrollView: React.FC = () => {
  const {
    employees,
    addEmployee,
    salaryRecords,
    processMonthlyPayroll,
    disburseSalary,
    saveManualPayroll,
    bankAccounts,
    payrollMode,
    setPayrollMode,
    settings,
  } = useERP();

  const [activeTab, setActiveTab] = useState<'EMPLOYEES' | 'PAYROLL' | 'ID_CARDS'>('EMPLOYEES');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));

  // Add Employee Modal
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [empName, setEmpName] = useState('');
  const [empRole, setEmpRole] = useState('');
  const [empDepartment, setEmpDepartment] = useState('PRODUCTION');
  const [empCategory, setEmpCategory] = useState<'MECHANICAL' | 'OFFICE'>('MECHANICAL');
  const [empGender, setEmpGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [empPhone, setEmpPhone] = useState('');
  const [empSalary, setEmpSalary] = useState<number>(15000);
  const [empHouseRent, setEmpHouseRent] = useState<number>(0);
  const [empMedical, setEmpMedical] = useState<number>(0);

  // Disburse Salary Modal
  const [payingRecord, setPayingRecord] = useState<SalaryRecord | null>(null);
  const [payMethod, setPayMethod] = useState<'CASH' | 'BANK'>('BANK');
  const [selectedBankId, setSelectedBankId] = useState<string>(bankAccounts[0]?.id || '');

  // Salary Slip Modal
  const [slipRecord, setSlipRecord] = useState<{ record: SalaryRecord; employee: Employee } | null>(null);

  const [searchTerm, setSearchTerm] = useState('');

  const handleSoftReset = () => {
    setSearchTerm('');
    setSelectedMonth(new Date().toISOString().substring(0, 7));
    setActiveTab('EMPLOYEES');
  };

  const filteredEmployees = employees.filter(e =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentMonthRecords = salaryRecords.filter(s => s.month === selectedMonth);
  const totalPayrollBudget = employees.filter(e => e.status === 'ACTIVE').reduce((sum, e) => sum + e.basicSalary, 0);

  // Category & Gender Summary Aggregations (Mechanical, Office, Male, Female)
  const hrSummary = useMemo(() => {
    let mechanicalCount = 0;
    let mechanicalSalary = 0;
    let officeCount = 0;
    let officeSalary = 0;
    let maleCount = 0;
    let maleSalary = 0;
    let femaleCount = 0;
    let femaleSalary = 0;

    employees.filter(e => e.status === 'ACTIVE').forEach(emp => {
      const isMech = emp.category === 'MECHANICAL' || 
        emp.department === 'PRODUCTION' || 
        emp.department === 'PACKAGING' || 
        emp.department === 'LOGISTICS' || 
        emp.role?.toLowerCase().includes('অপারেটর') || 
        emp.role?.toLowerCase().includes('ড্রাইভার');

      if (isMech) {
        mechanicalCount++;
        mechanicalSalary += emp.basicSalary;
      } else {
        officeCount++;
        officeSalary += emp.basicSalary;
      }

      const isFemale = emp.gender === 'FEMALE' || emp.role?.toLowerCase().includes('মহিলা');
      if (isFemale) {
        femaleCount++;
        femaleSalary += emp.basicSalary;
      } else {
        maleCount++;
        maleSalary += emp.basicSalary;
      }
    });

    return {
      mechanicalCount,
      mechanicalSalary,
      officeCount,
      officeSalary,
      maleCount,
      maleSalary,
      femaleCount,
      femaleSalary,
    };
  }, [employees]);

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName.trim() || !empRole.trim()) return;

    addEmployee({
      name: empName.trim(),
      role: empRole.trim(),
      department: empDepartment,
      category: empCategory,
      gender: empGender,
      phone: empPhone.trim(),
      basicSalary: empSalary,
      houseRentAllowance: empHouseRent,
      medicalAllowance: empMedical,
      joinDate: new Date().toISOString().substring(0, 10),
      status: 'ACTIVE',
    });

    setShowAddEmpModal(false);
    setEmpName('');
    setEmpRole('');
    setEmpPhone('');
    setEmpSalary(15000);
    setEmpHouseRent(0);
    setEmpMedical(0);
  };

  const handleProcessPayroll = () => {
    processMonthlyPayroll(selectedMonth);
    setActiveTab('PAYROLL');
  };

  const handleConfirmDisbursement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingRecord) return;

    disburseSalary(
      payingRecord.id,
      payMethod,
      payMethod === 'BANK' ? selectedBankId : undefined
    );
    setPayingRecord(null);
  };

  const handleExportEmployeesCSV = () => {
    const headers = ['ID', 'Name', 'Role', 'Department', 'Phone', 'Basic Salary (BDT)', 'Status', 'Join Date'];
    const rows = employees.map(e => [
      e.id,
      e.name,
      e.role,
      e.department,
      e.phone,
      e.basicSalary,
      e.status,
      e.joinDate,
    ]);
    exportToCSV(`Employees_Directory_${new Date().toISOString().substring(0, 10)}`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              এইচআর ও পেরোল ব্যবস্থাপনা (HR & Payroll)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            কারখানার কর্মী ও কর্মকর্তা তালিকা, উপস্থিতি, ওভারটাইম এবং মাসিক বেতন শিট
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Payroll Mode Quick Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs">
            <span className="text-slate-600 font-semibold">P&L পেরোল মোড:</span>
            <button
              onClick={() => setPayrollMode(payrollMode === 'AUTOMATIC' ? 'MANUAL' : 'AUTOMATIC')}
              className={`px-2 py-0.5 rounded-lg font-bold transition-colors ${
                payrollMode === 'AUTOMATIC'
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'bg-indigo-600 text-white shadow-2xs'
              }`}
              title="ক্লিক করে মোড পরিবর্তন করুন"
            >
              {payrollMode === 'AUTOMATIC' ? '⚡ অটোমেটিক' : '📋 ম্যানুয়াল শিট'}
            </button>
          </div>

          <button
            onClick={handleExportEmployeesCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" />
            কর্মী CSV
          </button>
          <button
            onClick={() => setShowAddEmpModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            নতুন কর্মী যোগ
          </button>
        </div>
      </div>

      {/* Category-Based Summary Cards (Mechanical, Office, Male, Female) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              ক্যাটাগরি-ভিত্তিক জনবল ও পে-রোল বিশ্লেষণ (Category & Demographic Breakdown)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            মোট সক্রিয় জনবল: <strong className="text-slate-900">{employees.filter(e => e.status === 'ACTIVE').length} জন</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Mechanical Staff */}
          <div className="p-3.5 rounded-xl border border-cyan-200 bg-gradient-to-br from-cyan-50/70 to-blue-50/50">
            <div className="flex items-center justify-between text-cyan-900">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-cyan-700" />
                মেকানিক্যাল স্টাফ
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-cyan-100 text-cyan-900">
                {hrSummary.mechanicalCount} জন
              </span>
            </div>
            <div className="text-lg font-black text-cyan-950 mt-2 font-mono">
              {formatCurrency(hrSummary.mechanicalSalary)}
            </div>
            <div className="text-[10px] text-cyan-800/80 mt-0.5">ফ্যাক্টরি মেশিন ও প্রোডাকশন কর্মী</div>
          </div>

          {/* Card 2: Office Staff */}
          <div className="p-3.5 rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50/70 to-indigo-50/50">
            <div className="flex items-center justify-between text-purple-900">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-purple-700" />
                অফিস ও প্রশাসন স্টাফ
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 text-purple-900">
                {hrSummary.officeCount} জন
              </span>
            </div>
            <div className="text-lg font-black text-purple-950 mt-2 font-mono">
              {formatCurrency(hrSummary.officeSalary)}
            </div>
            <div className="text-[10px] text-purple-800/80 mt-0.5">অ্যাকাউন্টস, সেলস ও ম্যানেজমেন্ট</div>
          </div>

          {/* Card 3: Male Staff */}
          <div className="p-3.5 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/70 to-slate-50/50">
            <div className="flex items-center justify-between text-blue-900">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-700" />
                পুরুষ স্টাফ (Male)
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-900">
                {hrSummary.maleCount} জন
              </span>
            </div>
            <div className="text-lg font-black text-blue-950 mt-2 font-mono">
              {formatCurrency(hrSummary.maleSalary)}
            </div>
            <div className="text-[10px] text-blue-800/80 mt-0.5">মোট কর্মীর {((hrSummary.maleCount / (employees.length || 1)) * 100).toFixed(0)}%</div>
          </div>

          {/* Card 4: Female Staff */}
          <div className="p-3.5 rounded-xl border border-rose-200 bg-gradient-to-br from-rose-50/70 to-pink-50/50">
            <div className="flex items-center justify-between text-rose-900">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-rose-700" />
                মহিলা স্টাফ (Female)
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-900">
                {hrSummary.femaleCount} জন
              </span>
            </div>
            <div className="text-lg font-black text-rose-950 mt-2 font-mono">
              {formatCurrency(hrSummary.femaleSalary)}
            </div>
            <div className="text-[10px] text-rose-800/80 mt-0.5">প্যাকেজিং ও কোয়ালিটি কন্ট্রোল</div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            মোট সক্রিয় কর্মী
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1 font-sans">
            {employees.filter(e => e.status === 'ACTIVE').length} জন
          </div>
          <div className="text-xs text-slate-400 mt-0.5">ফ্যাক্টরি ও অফিস স্টাফ</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            মাসিক বেসিক বেতন বাজেট
          </span>
          <div className="text-2xl font-black text-indigo-600 mt-1 font-sans">
            {formatCurrency(totalPayrollBudget)}
          </div>
          <div className="text-xs text-indigo-500 font-medium mt-0.5">প্রতি মাসের নির্ধারিত পে-রোল</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            চলতি মাসের বেতন শিট ({selectedMonth})
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1 font-sans">
            {currentMonthRecords.filter(r => r.status === 'PAID').length} / {currentMonthRecords.length} পরিশোধিত
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {currentMonthRecords.length === 0 ? 'বেতন শিট জেনারেট করা হয়নি' : 'বেতন বিতরণ চলমান'}
          </div>
        </div>
      </div>

      {/* Navigation Tabs & Process Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('EMPLOYEES')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'EMPLOYEES'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            কর্মী তালিকা (Employees)
          </button>
          <button
            onClick={() => setActiveTab('PAYROLL')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'PAYROLL'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            মাসিক পেরোল ও স্যালারি শিট (Payroll Sheet)
          </button>
          <button
            onClick={() => setActiveTab('ID_CARDS')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'ID_CARDS'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            আইডি কার্ড (ID Cards)
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="p-1.5 text-xs bg-white border border-slate-200 rounded-xl font-mono"
          />
          <button
            onClick={handleProcessPayroll}
            className="flex items-center gap-1 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5" />
            মাসিক বেতন জেনারেট করুন
          </button>
          <button
            id="btn-hr-soft-reset"
            onClick={handleSoftReset}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
            title="ফিল্টার ও সার্চ রিসেট করুন (Soft Reset)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>রিসেট</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Employee Directory */}
      {activeTab === 'EMPLOYEES' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-bold text-slate-800 text-sm">সকল কর্মকর্তা ও কর্মচারী</h3>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="নাম বা পদবি দিয়ে খুঁজুন..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="p-4 pb-0"><DataExportToolbar filename="HRPayrollView_Export" /></div>
<table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">নাম</th>
                  <th className="py-3 px-4">ক্যাটাগরি</th>
                  <th className="py-3 px-4">লিঙ্গ</th>
                  <th className="py-3 px-4">পদবি (Role)</th>
                  <th className="py-3 px-4">বিভাগ (Department)</th>
                  <th className="py-3 px-4">মোবাইল নম্বর</th>
                  <th className="py-3 px-4 text-right">মূল বেতন</th>
                  <th className="py-3 px-4">যোগদান</th>
                  <th className="py-3 px-4 text-center">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map(emp => {
                  const isMech = emp.category === 'MECHANICAL' || 
                    emp.department === 'PRODUCTION' || 
                    emp.department === 'PACKAGING' || 
                    emp.department === 'LOGISTICS';
                  const isFemale = emp.gender === 'FEMALE';

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{emp.name}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isMech ? 'bg-cyan-100 text-cyan-900' : 'bg-purple-100 text-purple-900'
                        }`}>
                          {isMech ? 'মেকানিক্যাল' : 'অফিস'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          isFemale ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {isFemale ? 'মহিলা' : 'পুরুষ'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{emp.role}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold">
                          {emp.department}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{emp.phone}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-indigo-700">
                        {formatCurrency(emp.basicSalary)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{formatDate(emp.joinDate)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded text-[10px]">
                          {emp.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Payroll Sheet */}
      {activeTab === 'PAYROLL' && payrollMode === 'MANUAL' && (
        <ManualPayrollSheet selectedMonth={selectedMonth} saveManualPayroll={saveManualPayroll} salaryRecords={salaryRecords} />
      )}
      
      {activeTab === 'PAYROLL' && payrollMode !== 'MANUAL' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">স্যালারি ও পে-স্লিপ শিট ({selectedMonth})</h3>
              <p className="text-xs text-slate-500">বেতন পরিশোধ করলে তা ক্যাশ বা ব্যাংক একাউন্ট থেকে কর্তন হবে</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="p-4 pb-0"><DataExportToolbar filename="HRPayrollView_Export" /></div>
<table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">কর্মীর নাম</th>
                  <th className="py-3 px-4 text-right">মূল বেতন</th>
                  <th className="py-3 px-4 text-right">ওভারটাইম / বোনাস</th>
                  <th className="py-3 px-4 text-right">কর্তন / অগ্রিম</th>
                  <th className="py-3 px-4 text-right font-bold text-slate-900">নেট প্রদেয় বেতন</th>
                  <th className="py-3 px-4 text-center">স্ট্যাটাস</th>
                  <th className="py-3 px-4 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentMonthRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      এই মাসের জন্য কোনো স্যালারি শিট এখনো তৈরি করা হয়নি। উপরের "মাসিক বেতন জেনারেট করুন" বাটনে ক্লিক করুন।
                    </td>
                  </tr>
                ) : (
                  currentMonthRecords.map(rec => (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{rec.employeeName}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">{formatCurrency(rec.basicSalary)}</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-700">+{formatCurrency(rec.overtimeAmount + rec.bonus)}</td>
                      <td className="py-3 px-4 text-right font-mono text-rose-600">-{formatCurrency(rec.deductions)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-indigo-700 text-sm">
                        {formatCurrency(rec.netSalary)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {rec.status === 'PAID' ? (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded text-[10px]">
                            পরিশোধিত ✓
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-800 font-bold rounded text-[10px]">
                            অপেক্ষমাণ
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {rec.status === 'PENDING' ? (
                          <button
                            onClick={() => setPayingRecord(rec)}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[11px] transition-colors inline-flex items-center gap-1"
                          >
                            <CreditCard className="w-3 h-3" />
                            বেতন দিন
                          </button>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-slate-400 font-mono text-[11px]">
                              {rec.paidDate && formatDate(rec.paidDate)}
                            </span>
                            <button
                              onClick={() => {
                                const matchedEmp = employees.find(e => e.id === rec.employeeId);
                                if (matchedEmp) {
                                  setSlipRecord({ record: rec, employee: matchedEmp });
                                }
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded text-[11px] transition-colors inline-flex items-center gap-1"
                              title="স্যালারি স্লিপ"
                            >
                              <FileText className="w-3 h-3" />
                              স্লিপ
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddEmpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">নতুন কর্মী যোগ করুন</h3>
              <button onClick={() => setShowAddEmpModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">নাম *</label>
                <input
                  type="text"
                  required
                  value={empName}
                  onChange={e => setEmpName(e.target.value)}
                  placeholder="যেমন: মো: আবুল বাশার"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ক্যাটাগরি *</label>
                  <select
                    value={empCategory}
                    onChange={e => setEmpCategory(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-cyan-900"
                  >
                    <option value="MECHANICAL">মেকানিক্যাল (মেশিন/কারখানা)</option>
                    <option value="OFFICE">অফিস (প্রশাসন/হিসাব/সেলস)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">লিঙ্গ (Gender) *</label>
                  <select
                    value={empGender}
                    onChange={e => setEmpGender(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  >
                    <option value="MALE">পুরুষ (Male)</option>
                    <option value="FEMALE">মহিলা (Female)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">পদবি (Role) *</label>
                  <input
                    type="text"
                    required
                    value={empRole}
                    onChange={e => setEmpRole(e.target.value)}
                    placeholder="যেমন: প্রোডাকশন অপারেটর"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">বিভাগ (Department)</label>
                  <select
                    value={empDepartment}
                    onChange={e => setEmpDepartment(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  >
                    <option value="PRODUCTION">প্রোডাকশন (Factory)</option>
                    <option value="PACKAGING">প্যাকেজিং (Packaging)</option>
                    <option value="SALES">সেলস ও মার্কেটিং (Sales)</option>
                    <option value="DELIVERY">ডেলিভারি ও ড্রাইভার</option>
                    <option value="ACCOUNTS">হিসাব ও অ্যাডমিন</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ফোন নম্বর</label>
                  <input
                    type="text"
                    value={empPhone}
                    onChange={e => setEmpPhone(e.target.value)}
                    placeholder="017xxxxxxxx"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">মাসিক মূল বেতন (৳) *</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    value={empSalary}
                    onChange={e => setEmpSalary(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-indigo-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">বাড়ি ভাড়া ভাতা (ঐচ্ছিক)</label>
                  <input
                    type="number"
                    min="0"
                    value={empHouseRent}
                    onChange={e => setEmpHouseRent(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">চিকিৎসা ভাতা (ঐচ্ছিক)</label>
                  <input
                    type="number"
                    min="0"
                    value={empMedical}
                    onChange={e => setEmpMedical(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddEmpModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disburse Salary Modal */}
      {payingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">বেতন প্রদান অনুমোদন</h3>
              <button onClick={() => setPayingRecord(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">কর্মীর নাম:</span>
                <span className="font-bold text-slate-800">{payingRecord.employeeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">মাস:</span>
                <span className="font-mono font-bold text-slate-800">{payingRecord.month}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">নেট প্রদেয় বেতন:</span>
                <span className="font-mono font-bold text-indigo-700 text-sm">{formatCurrency(payingRecord.netSalary)}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmDisbursement} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">বেতন প্রদানের মাধ্যম *</label>
                <select
                  value={payMethod}
                  onChange={e => setPayMethod(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="BANK">ব্যাংক ট্রান্সফার / অনলাইন স্যালারি</option>
                  <option value="CASH">নগদ ক্যাশ খাম (Cash)</option>
                </select>
              </div>

              {payMethod === 'BANK' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ব্যাংক একাউন্ট</label>
                  <select
                    value={selectedBankId}
                    onChange={e => setSelectedBankId(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    {bankAccounts.map(b => (
                      <option key={b.id} value={b.id}>{b.accountName} (ব্যালেন্স: {formatCurrency(b.balance)})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setPayingRecord(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl"
                >
                  বেতন পরিশোধ নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ID CARDS TAB --- */}
      {activeTab === 'ID_CARDS' && (
        <CompanyIDCardManager />
      )}

      {/* Salary Slip Modal */}
      {slipRecord && (
        <SalarySlipModal
          record={slipRecord.record}
          employee={slipRecord.employee}
          onClose={() => setSlipRecord(null)}
        />
      )}
    </div>
  );
};
