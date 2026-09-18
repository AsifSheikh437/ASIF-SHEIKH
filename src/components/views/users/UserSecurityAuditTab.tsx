import React, { useState } from 'react';
import { DataExportToolbar } from '../../../components/common/DataExportToolbar';
import { useERP } from '../../../context/ERPContext';
import { formatDate } from '../../../utils/formatters';
import { ShieldCheck, Search, Clock, User, Filter, AlertTriangle, ArrowRight } from 'lucide-react';

interface UserSecurityAuditTabProps {
  onNavigateToFullLogs?: () => void;
}

export const UserSecurityAuditTab: React.FC<UserSecurityAuditTabProps> = ({
  onNavigateToFullLogs,
}) => {
  const { auditLogs, currentUser } = useERP();
  const [searchTerm, setSearchTerm] = useState('');

  const isDeveloper = currentUser?.role === 'DEVELOPER';

  // Filter logs relevant to Security, Users, Password, RBAC, and Login, hiding developer from non-developers
  const securityLogs = auditLogs
    .filter(log => {
      if (isDeveloper) return true;
      if (log.userRole === 'DEVELOPER' || log.userId === 'USR-DEV') return false;
      const lowerDetails = log.details.toLowerCase();
      if (lowerDetails.includes('developer') || lowerDetails.includes('ডেভেলপার')) return false;
      return true;
    })
    .filter(log => {
      const isSecurityRelated =
        log.action.includes('USER') ||
        log.action.includes('PASSWORD') ||
        log.action.includes('RBAC') ||
        log.action.includes('LOGIN') ||
        log.action.includes('SECURITY') ||
        log.details.toLowerCase().includes('password') ||
        log.details.toLowerCase().includes('user') ||
        log.details.toLowerCase().includes('role');

      const matchSearch =
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase());

      return isSecurityRelated && matchSearch;
    });

  const getBadgeStyle = (action: string) => {
    if (action.includes('PASSWORD') || action.includes('RESET')) {
      return 'bg-amber-100 text-amber-800 border-amber-300';
    }
    if (action.includes('DEACTIVATE') || action.includes('SUSPEND')) {
      return 'bg-rose-100 text-rose-800 border-rose-300';
    }
    if (action.includes('ADD') || action.includes('CREATE')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
    if (action.includes('RBAC') || action.includes('PERMISSION')) {
      return 'bg-purple-100 text-purple-800 border-purple-300';
    }
    if (action.includes('LOGIN')) {
      return 'bg-blue-100 text-blue-800 border-blue-300';
    }
    return 'bg-slate-100 text-slate-700 border-slate-300';
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">
              ইউজার ও নিরাপত্তা অডিট রেকর্ড (User & Security Audit Trail)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            নতুন ইউজার তৈরি, পাসওয়ার্ড রিসেট, রোল বা পারমিশন পরিবর্তন ও সাসপেনশনের স্বয়ংক্রিয় অডিট লগ
          </p>
        </div>

        {onNavigateToFullLogs && (
          <button
            onClick={onNavigateToFullLogs}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-xl transition-colors shrink-0"
          >
            <span>সম্পূর্ণ সিস্টেম অডিট লগ দেখুন</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="নিরাপত্তা কার্যক্রম ও ইউজার নাম দিয়ে খুঁজুন..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <div className="p-4 pb-0"><DataExportToolbar filename="UserSecurityAuditTab_Export" /></div>
<table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">সময় ও তারিখ</th>
                <th className="py-3 px-4">কর্তৃপক্ষ (Performer)</th>
                <th className="py-3 px-4">রোল</th>
                <th className="py-3 px-4">অ্যাকশন টাইপ</th>
                <th className="py-3 px-4">কার্যক্রমের বিবরণ (Details)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {securityLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    কোনো নিরাপত্তা সংক্রান্ত অডিট লগ পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                securityLogs.map(log => (
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
                      <span className={`px-2.5 py-0.5 border font-mono font-bold rounded text-[10px] ${getBadgeStyle(log.action)}`}>
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
      </div>
    </div>
  );
};
