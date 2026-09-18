import React, { useState } from 'react';
import { DataExportToolbar } from '../../../components/common/DataExportToolbar';
import { useERP } from '../../../context/ERPContext';
import { User, Role } from '../../../types';
import { formatDate } from '../../../utils/formatters';
import {
  Users,
  Search,
  Filter,
  UserCheck,
  UserX,
  KeyRound,
  Edit2,
  Trash2,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  Clock,
  Briefcase,
  AlertCircle,
  Sparkles,
  Crown,
  LayoutGrid,
  List,
  RotateCcw,
} from 'lucide-react';

interface UsersDirectoryTabProps {
  onAddUser: () => void;
  onEditUser: (user: User) => void;
  onResetPassword: (user: User) => void;
  onDeactivateUser: (user: User) => void;
  onActivateUser: (userId: string) => void;
  onDeleteUser: (user: User) => void;
}

const ROLE_BADGES: Record<Role, { label: string; en: string; style: string }> = {
  DEVELOPER: { label: 'রুট ডেভেলপার', en: 'Developer', style: 'bg-purple-100 text-purple-800 border-purple-200' },
  ADMIN: { label: 'সিস্টেম অ্যাডমিন', en: 'Admin', style: 'bg-rose-100 text-rose-800 border-rose-200' },
  MANAGER: { label: 'জেনারেল ম্যানেজার', en: 'Manager', style: 'bg-blue-100 text-blue-800 border-blue-200' },
  ACCOUNTANT: { label: 'একাউন্ট্যান্ট', en: 'Accountant', style: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  SALES: { label: 'সেলস অফিসার', en: 'Sales', style: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  PURCHASE: { label: 'ক্রয় অফিসার', en: 'Purchase', style: 'bg-amber-100 text-amber-800 border-amber-200' },
  INVENTORY: { label: 'ইনভেন্টরি অফিসার', en: 'Inventory', style: 'bg-orange-100 text-orange-800 border-orange-200' },
  'HR/PAYROLL': { label: 'এইচআর ও পেরোল', en: 'HR/Payroll', style: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  VIEWER: { label: 'দর্শক', en: 'Viewer', style: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export const UsersDirectoryTab: React.FC<UsersDirectoryTabProps> = ({
  onAddUser,
  onEditUser,
  onResetPassword,
  onDeactivateUser,
  onActivateUser,
  onDeleteUser,
}) => {
  const { users, currentUser } = useERP();

  const isDeveloper = currentUser?.role === 'DEVELOPER';

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'MECHANICAL' | 'OFFICE'>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const handleSoftReset = () => {
    setSearchTerm('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
    setCategoryFilter('ALL');
    setViewMode('table');
  };

  // STRICT SECURITY RULE: Developer account is hidden from non-developers!
  const visibleUsers = users.filter(user => {
    if (!isDeveloper && user.role === 'DEVELOPER') {
      return false; // NEVER show developer to Admin or anyone else!
    }

    const matchSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone && user.phone.includes(searchTerm)) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchRole = roleFilter === 'ALL' || user.role === roleFilter;

    const isActive = user.isActive !== false;
    const matchStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'ACTIVE'
        ? isActive
        : !isActive;

    const matchCategory =
      categoryFilter === 'ALL' || (user.category && user.category === categoryFilter);

    return matchSearch && matchRole && matchStatus && matchCategory;
  });

  // Calculate summary counts
  const nonDevUsers = users.filter(u => isDeveloper || u.role !== 'DEVELOPER');
  const totalCount = nonDevUsers.length;
  const activeCount = nonDevUsers.filter(u => u.isActive !== false).length;
  const inactiveCount = nonDevUsers.filter(u => u.isActive === false).length;
  const mechanicalCount = nonDevUsers.filter(u => u.category === 'MECHANICAL').length;
  const officeCount = nonDevUsers.filter(u => u.category === 'OFFICE' || !u.category).length;

  return (
    <div className="space-y-6">
      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-indigo-600" />
            মোট ব্যবহারকারী
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{totalCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">সিস্টেমে নিবন্ধিত একাউন্ট</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            সক্রিয় একাউন্ট (Active)
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{activeCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">লগইন ও কার্যক্রম অনুমোদিত</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-amber-700 flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-amber-600" />
            মেকানিক্যাল স্টাফ (HR)
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">{mechanicalCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">কারখানা ও মেশিন টেকনিশিয়ান</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-blue-700 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-blue-600" />
            অফিস স্টাফ (HR)
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-2">{officeCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">প্রশাসন, একাউন্টস ও সেলস</div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="ইউজারের নাম, ইউজার আইডি, মোবাইল বা ইমেইল দিয়ে খুঁজুন..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
          >
            <option value="ALL">সকল রোল (All Roles)</option>
            {isDeveloper && <option value="DEVELOPER">রুট ডেভেলপার</option>}
            <option value="ADMIN">সিস্টেম অ্যাডমিন</option>
            <option value="MANAGER">জেনারেল ম্যানেজার</option>
            <option value="ACCOUNTANT">একাউন্ট্যান্ট</option>
            <option value="SALES">সেলস অফিসার</option>
            <option value="PURCHASE">ক্রয় অফিসার</option>
            <option value="INVENTORY">ইনভেন্টরি অফিসার</option>
            <option value="HR/PAYROLL">এইচআর ও পেরোল</option>
            <option value="VIEWER">দর্শক (Viewer)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
          >
            <option value="ALL">সকল স্ট্যাটাস</option>
            <option value="ACTIVE">সক্রিয় (Active)</option>
            <option value="INACTIVE">স্থগিত / নিষ্ক্রিয় (Suspended)</option>
          </select>

          {/* Staff Category Filter */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value as any)}
            className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
          >
            <option value="ALL">সকল ক্যাটাগরি</option>
            <option value="MECHANICAL">মেকানিক্যাল স্টাফ</option>
            <option value="OFFICE">অফিস স্টাফ</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-0.5">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500'
              }`}
              title="টেবিল ভিউ"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'cards' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500'
              }`}
              title="কার্ড ভিউ"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Soft Reset Button */}
          <button
            id="btn-users-soft-reset"
            onClick={handleSoftReset}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
            title="ইউজার লিস্ট ফিল্টার ও সার্চ রিসেট করুন (Soft Reset)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>রিসেট</span>
          </button>
        </div>
      </div>

      {/* Users View: Table or Cards */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <div className="p-4 pb-0"><DataExportToolbar filename="UsersDirectoryTab_Export" /></div>
<table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">ইউজার ও প্রোফাইল ছবি</th>
                  <th className="py-3 px-4">ইউজার আইডি (User ID)</th>
                  <th className="py-3 px-4">দায়িত্ব (Role)</th>
                  <th className="py-3 px-4">এইচআর ক্যাটাগরি ও লিঙ্গ</th>
                  <th className="py-3 px-4">স্ট্যাটাস (Status)</th>
                  <th className="py-3 px-4">সর্বশেষ লগইন</th>
                  <th className="py-3 px-4 text-right">কার্যক্রম (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      কোনো ব্যবহারকারী পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  visibleUsers.map(u => {
                    const isActive = u.isActive !== false;
                    const roleBadge = ROLE_BADGES[u.role] || {
                      label: u.role,
                      en: u.role,
                      style: 'bg-slate-100 text-slate-700 border-slate-200',
                    };

                    const isSelf = currentUser?.id === u.id;
                    const isTargetDev = u.role === 'DEVELOPER';

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Profile Photo & Name */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-700 shadow-2xs">
                                {u.avatar ? (
                                  <img
                                    src={u.avatar}
                                    alt={u.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xs text-indigo-700 bg-indigo-50 w-full h-full flex items-center justify-center">
                                    {u.name ? u.name.slice(0, 2).toUpperCase() : 'US'}
                                  </span>
                                )}
                              </div>
                              {isActive ? (
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                              ) : (
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-slate-400 border-2 border-white" />
                              )}
                            </div>

                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                {u.name}
                                {isSelf && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 font-semibold">
                                    আপনি
                                  </span>
                                )}
                                {isTargetDev && (
                                  <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {u.phone || u.email || 'যোগাযোগ নম্বর নেই'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Username */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-800 text-[11px]">
                            {u.username}
                          </span>
                        </td>

                        {/* Role Badge */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex flex-col px-2.5 py-1 rounded-lg border font-semibold text-[11px] ${roleBadge.style}`}>
                            <span>{roleBadge.label}</span>
                            <span className="text-[9px] opacity-75 font-mono">{roleBadge.en}</span>
                          </span>
                        </td>

                        {/* HR Category & Gender */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold w-fit ${
                                u.category === 'MECHANICAL'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              }`}
                            >
                              {u.category === 'MECHANICAL' ? 'মেকানিক্যাল স্টাফ' : 'অফিস স্টাফ'}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {u.gender === 'FEMALE' ? 'মহিলা (Female)' : 'পুরুষ (Male)'}
                              {u.department ? ` • ${u.department}` : ''}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-[10px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                              সক্রিয় (Active)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-semibold text-[10px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              স্থগিত (Suspended)
                            </span>
                          )}
                        </td>

                        {/* Last Login Time */}
                        <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                          {u.lastLogin ? (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{formatDate(u.lastLogin)}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">এখনো লগইন করেনি</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Edit Button */}
                            <button
                              onClick={() => onEditUser(u)}
                              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="প্রোফাইল ও এইচআর তথ্য এডিট"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Reset Password Button */}
                            <button
                              onClick={() => onResetPassword(u)}
                              className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="পাসওয়ার্ড রিসেট করুন"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>

                            {/* Deactivate / Activate Button */}
                            {isActive ? (
                              <button
                                onClick={() => onDeactivateUser(u)}
                                disabled={isSelf || (isTargetDev && !isDeveloper)}
                                className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                title="অ্যাকাউন্ট স্থগিত / নিষ্ক্রিয় করুন"
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => onActivateUser(u.id)}
                                className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="অ্যাকাউন্ট পুনরায় সক্রিয় করুন"
                              >
                                <UserCheck className="w-4 h-4" />
                              </button>
                            )}

                            {/* Hard Delete (protected) */}
                            {isDeveloper && !isSelf && (
                              <button
                                onClick={() => onDeleteUser(u)}
                                className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                                title="স্থায়ীভাবে মুছে ফেলুন (Developer Only)"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
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
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleUsers.map(u => {
            const isActive = u.isActive !== false;
            const roleBadge = ROLE_BADGES[u.role] || {
              label: u.role,
              en: u.role,
              style: 'bg-slate-100 text-slate-700 border-slate-200',
            };
            const isSelf = currentUser?.id === u.id;
            const isTargetDev = u.role === 'DEVELOPER';

            return (
              <div
                key={u.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-700 shadow-2xs">
                          {u.avatar ? (
                            <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-bold text-indigo-700 bg-indigo-50 w-full h-full flex items-center justify-center">
                              {u.name ? u.name.slice(0, 2).toUpperCase() : 'US'}
                            </span>
                          )}
                        </div>
                        {isActive ? (
                          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                        ) : (
                          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-slate-400 border-2 border-white" />
                        )}
                      </div>

                      <div>
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          {u.name}
                          {isTargetDev && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                        </div>
                        <div className="font-mono text-xs text-indigo-600 font-semibold">
                          @{u.username}
                        </div>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-xl border text-[10px] font-bold ${roleBadge.style}`}>
                      {roleBadge.label}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">এইচআর ক্যাটাগরি:</span>
                      <span className="font-semibold text-slate-800">
                        {u.category === 'MECHANICAL' ? 'মেকানিক্যাল স্টাফ' : 'অফিস স্টাফ'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">লিঙ্গ:</span>
                      <span className="font-semibold text-slate-800">
                        {u.gender === 'FEMALE' ? 'মহিলা' : 'পুরুষ'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">সর্বশেষ লগইন:</span>
                      <span className="font-mono text-slate-700 text-[11px]">
                        {u.lastLogin ? formatDate(u.lastLogin) : 'এখনো লগইন করেনি'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <div>
                    {isActive ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                        সক্রিয়
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                        স্থগিত
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditUser(u)}
                      className="px-2 py-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium"
                    >
                      এডিট
                    </button>
                    <button
                      onClick={() => onResetPassword(u)}
                      className="px-2 py-1 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg font-medium"
                    >
                      পাসওয়ার্ড
                    </button>
                    {isActive ? (
                      <button
                        onClick={() => onDeactivateUser(u)}
                        disabled={isSelf || (isTargetDev && !isDeveloper)}
                        className="px-2 py-1 text-rose-600 hover:bg-rose-50 rounded-lg font-medium disabled:opacity-30"
                      >
                        স্থগিত
                      </button>
                    ) : (
                      <button
                        onClick={() => onActivateUser(u.id)}
                        className="px-2 py-1 text-emerald-600 hover:bg-emerald-50 rounded-lg font-medium"
                      >
                        সক্রিয়
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
