import React, { useState } from 'react';
import { DataExportToolbar } from '../common/DataExportToolbar';
import { useERP } from '../../context/ERPContext';
import { formatDate, exportToCSV } from '../../utils/formatters';
import { exportElementToPDF, printDocument } from '../../utils/printPdfUtils';
import {
  ShieldAlert,
  Search,
  Download,
  Filter,
  UserCheck,
  Clock,
  Activity,
  Printer,
  FileText,
  Building2,
  RotateCcw,
} from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const { auditLogs, settings, currentUser } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('ALL');
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const isDeveloper = currentUser?.role === 'DEVELOPER';

  // Base logs: Non-developers (including Admin) cannot see any Developer logs or Developer references
  const baseLogs = auditLogs.filter(log => {
    if (isDeveloper) return true;
    if (log.userRole === 'DEVELOPER' || log.userId === 'USR-DEV') return false;
    const lowerDetails = log.details.toLowerCase();
    if (lowerDetails.includes('developer') || lowerDetails.includes('ডেভেলপার')) return false;
    return true;
  });

  const uniqueUsers = Array.from(new Set(baseLogs.map(log => log.userName)));

  const handleSoftReset = () => {
    setSearchTerm('');
    setFilterAction('ALL');
    setStartDate('');
    setEndDate('');
    setSelectedUser('ALL');
  };

  const filteredLogs = baseLogs.filter(log => {
    const matchSearch =
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());

    const matchAction = filterAction === 'ALL' ? true : log.action.includes(filterAction);
    const matchUser = selectedUser === 'ALL' ? true : log.userName === selectedUser;

    let matchDate = true;
    if (startDate) {
      matchDate = matchDate && log.timestamp >= startDate;
    }
    if (endDate) {
      matchDate = matchDate && log.timestamp <= endDate + ' 23:59:59';
    }

    return matchSearch && matchAction && matchUser && matchDate;
  });

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'User Name', 'Role', 'Action', 'Details'];
    const rows = filteredLogs.map(l => [
      l.timestamp,
      l.userName,
      l.userRole,
      l.action,
      l.details,
    ]);
    exportToCSV(`Audit_Trail_Log_${new Date().toISOString().substring(0, 10)}`, headers, rows);
  };

  const handlePrint = () => {
    printDocument('audit-trail-printable-area', {
      title: `${settings.companyName || 'Food ERP'} - অডিট ট্রেইল ও অ্যাক্টিভিটি রিপোর্ট`,
      landscape: true,
    });
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      await exportElementToPDF('audit-trail-printable-area', {
        filename: `Audit_Trail_Report_${new Date().toISOString().substring(0, 10)}.pdf`,
        orientation: 'landscape',
      });
    } finally {
      setIsExportingPDF(false);
    }
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('SALE')) return 'bg-teal-50 text-teal-700 border-teal-200';
    if (action.includes('PURCHASE')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (action.includes('PRODUCTION')) return 'bg-amber-50 text-amber-800 border-amber-200';
    if (action.includes('STOCK')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (action.includes('EXPENSE')) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (action.includes('LOGIN')) return 'bg-slate-100 text-slate-700 border-slate-200';
    if (action.includes('SECURITY')) return 'bg-rose-100 text-rose-800 border-rose-300';
    return 'bg-slate-50 text-slate-600 border-slate-200';
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              সিস্টেম অডিট ও ইউজার ট্র্যাকিং (Audit Trail & Activity Log)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            কে, কখন, কোন মডিউলে কি পরিবর্তন বা এন্ট্রি করেছেন তার সম্পূর্ণ অপরিবর্তনীয় অডিট হিস্ট্রি
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors shadow-2xs"
            title="প্রিন্ট করুন"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            প্রিন্ট
          </button>
          <button
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-xl transition-colors shadow-2xs disabled:opacity-50"
            title="PDF ডাউনলোড করুন"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            {isExportingPDF ? 'তৈরি হচ্ছে...' : 'PDF এক্সপোর্ট'}
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" />
            CSV এক্সপোর্ট
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="ইউজারের নাম, অ্যাকশন বা বিবরণ দিয়ে অনুসন্ধান করুন..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap hidden sm:inline">তারিখ হতে:</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full sm:w-auto py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
              title="শুরুর তারিখ"
            />
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap hidden sm:inline">পর্যন্ত:</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full sm:w-auto py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
              title="শেষের তারিখ"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <div className="flex items-center gap-2 flex-1 w-full">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
              className="flex-1 py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">সকল মডিউল/অ্যাকশন</option>
              <option value="LOGIN">লগইন কার্যক্রম (Login)</option>
              <option value="SALE">বিক্রয় ইনভয়েস (Sale)</option>
              <option value="PURCHASE">পারচেজ ও মাল গ্রহণ (Purchase)</option>
              <option value="PRODUCTION">উৎপাদন ও রান (Production)</option>
              <option value="STOCK">স্টক সমন্বয় (Stock)</option>
              <option value="EXPENSE">খরচ ও উত্তোলন (Expense)</option>
              <option value="SECURITY">নিরাপত্তা ও অ্যাক্সেস (Security/RBAC)</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2 flex-1 w-full">
            <UserCheck className="w-4 h-4 text-slate-400" />
            <select
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
              className="flex-1 py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">সকল ইউজার</option>
              {uniqueUsers.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
          </div>

          <button
            id="btn-audit-soft-reset"
            onClick={handleSoftReset}
            className="flex justify-center items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap w-full sm:w-auto"
            title="অডিট লগ ফিল্টার রিসেট করুন (Soft Reset)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>রিসেট ফিল্টার</span>
          </button>
        </div>
      </div>

      {/* Printable Area Container */}
      <div
        id="audit-trail-printable-area"
        className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-1 sm:p-2"
      >
        {/* Printable Official Header (visible during print & PDF) */}
        <div className="hidden print:block p-4 border-b border-slate-200 mb-3 text-slate-800">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{settings.companyName || 'Sonali Foods Limited'}</h1>
              <p className="text-xs text-slate-600">{settings.address || 'Dhaka, Bangladesh'} | ফোন: {settings.phone || 'N/A'}</p>
              <p className="text-sm font-semibold text-indigo-800 mt-1">সিস্টেম অ্যাক্টিভিটি ও নিরাপত্তা অডিট ট্রেইল রিপোর্ট (Audit Trail Log)</p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p>প্রিন্টের তারিখ: {new Date().toLocaleDateString('bn-BD')} {new Date().toLocaleTimeString('bn-BD')}</p>
              <p>মোট অডিট রেকর্ড: {filteredLogs.length} টি</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="p-4 pb-0"><DataExportToolbar filename="AuditLogsView_Export" /></div>
<table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">সময় ও তারিখ</th>
                <th className="py-3 px-4">ব্যবহারকারী (User)</th>
                <th className="py-3 px-4">রোল (Role)</th>
                <th className="py-3 px-4">অ্যাকশন টাইপ</th>
                <th className="py-3 px-4">বিস্তারিত কার্যক্রম (Details)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    কোনো অডিট লগ পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{log.userName}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded text-[10px]">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 border font-mono font-bold rounded text-[10px] ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 leading-relaxed font-mono text-[11px]">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Printable Official Footer Signatures */}
        <div className="hidden print:flex justify-between items-end pt-12 px-6 pb-4 mt-6 border-t border-slate-200 text-xs text-slate-700">
          <div className="text-center">
            <div className="w-36 border-t border-slate-400 mb-1"></div>
            <p>প্রস্তুতকারক (Prepared By)</p>
          </div>
          <div className="text-center">
            <div className="w-36 border-t border-slate-400 mb-1"></div>
            <p>আইটি / সিস্টেম অডিটর (IT Auditor)</p>
          </div>
          <div className="text-center">
            <div className="w-36 border-t border-slate-400 mb-1"></div>
            <p>ব্যবস্থাপনা পরিচালক (Managing Director)</p>
          </div>
        </div>
      </div>
    </div>
  );
};
