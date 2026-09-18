import React, { useState } from 'react';
import { DataExportToolbar } from '../common/DataExportToolbar';
import { useERP } from '../../context/ERPContext';
import { User, Role } from '../../types';
import { UsersDirectoryTab } from './users/UsersDirectoryTab';
import { RBACMatrixTab } from './users/RBACMatrixTab';
import { UserSecurityAuditTab } from './users/UserSecurityAuditTab';
import { UserFormModal } from './users/UserFormModal';
import { PasswordResetModal } from './users/PasswordResetModal';
import { DeactivateConfirmModal } from './users/DeactivateConfirmModal';
import {
  Users,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Crown,
  CheckCircle2,
  AlertTriangle,
  History,
  Lock,
} from 'lucide-react';

export const UserManagementView: React.FC = () => {
  const {
    users,
    currentUser,
    addUser,
    updateUser,
    resetUserPassword,
    deactivateUser,
    activateUser,
    deleteUser,
    setActiveModule,
  } = useERP();

  const isDeveloper = currentUser?.role === 'DEVELOPER';

  const [activeTab, setActiveTab] = useState<'users' | 'rbac' | 'audit'>('users');
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resetTargetUser, setResetTargetUser] = useState<User | null>(null);
  const [deactivateTargetUser, setDeactivateTargetUser] = useState<User | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => {
      setFeedback(null);
    }, 4500);
  };

  // Handlers
  const handleOpenAddModal = () => {
    setEditingUser(null);
    setShowAddEditModal(true);
  };

  const handleOpenEditModal = (user: User) => {
    // Developer isolation check
    if (!isDeveloper && user.role === 'DEVELOPER') {
      showToast('error', 'নিরাপত্তা ত্রুটি: ইউজার পাওয়া যায়নি বা এই অ্যাকাউন্টে অ্যাক্সেস অননুমোদিত।');
      return;
    }
    setEditingUser(user);
    setShowAddEditModal(true);
  };

  const handleFormSubmit = (userData: {
    name: string;
    username: string;
    password?: string;
    role: Role;
    phone?: string;
    email?: string;
    category?: 'MECHANICAL' | 'OFFICE';
    gender?: 'MALE' | 'FEMALE';
    department?: string;
    designation?: string;
    mustChangePassword: boolean;
    isActive: boolean;
    avatar?: string;
  }) => {
    if (editingUser) {
      // Editing existing user
      const res = updateUser(editingUser.id, userData);
      if (res.success) {
        showToast('success', `ইউজার "${userData.name}"-এর তথ্য সফলভাবে আপডেট ও এইচআর মডিউলে সিঙ্ক করা হয়েছে।`);
      }
      return res;
    } else {
      // Adding new user
      if (!userData.password) {
        return { success: false, error: 'পাসওয়ার্ড প্রদান করুন।' };
      }
      const res = addUser({
        name: userData.name,
        username: userData.username,
        password: userData.password,
        role: userData.role,
        phone: userData.phone,
        email: userData.email,
        category: userData.category,
        gender: userData.gender,
        department: userData.department,
        designation: userData.designation,
        mustChangePassword: userData.mustChangePassword,
        isActive: userData.isActive,
        avatar: userData.avatar,
      });
      if (res.success) {
        showToast('success', `নতুন ইউজার "${userData.name}" (${userData.username}) সফলভাবে তৈরি ও এইচআর মডিউলে যুক্ত হয়েছে।`);
      }
      return res;
    }
  };

  const handleResetPassword = (user: User) => {
    if (!isDeveloper && user.role === 'DEVELOPER') {
      showToast('error', 'নিরাপত্তা ত্রুটি: এই অ্যাকাউন্টে অ্যাক্সেস অননুমোদিত।');
      return;
    }
    setResetTargetUser(user);
  };

  const handleConfirmPasswordReset = (newPass: string) => {
    if (!resetTargetUser) return { success: false, error: 'ইউজার পাওয়া যায়নি।' };
    const res = resetUserPassword(resetTargetUser.id, newPass);
    if (res.success) {
      showToast('success', `ইউজার "${resetTargetUser.name}"-এর জন্য নতুন পাসওয়ার্ড সেট করা হয়েছে। পরবর্তী লগইনে পরিবর্তন বাধ্যতামূলক।`);
    }
    return res;
  };

  const handleDeactivate = (user: User) => {
    if (user.id === currentUser?.id) {
      showToast('error', 'আপনি নিজের সক্রিয় অ্যাকাউন্ট সাসপেন্ড করতে পারবেন না।');
      return;
    }
    if (!isDeveloper && user.role === 'DEVELOPER') {
      showToast('error', 'নিরাপত্তা ত্রুটি: এই অ্যাকাউন্টে অ্যাক্সেস অননুমোদিত।');
      return;
    }
    setDeactivateTargetUser(user);
  };

  const handleConfirmDeactivation = (reason?: string) => {
    if (!deactivateTargetUser) return;
    const res = deactivateUser(deactivateTargetUser.id, reason);
    if (res.success) {
      showToast('success', `ইউজার "${deactivateTargetUser.name}" সফলভাবে সাসপেন্ড/নিষ্ক্রিয় করা হয়েছে।`);
    } else {
      showToast('error', res.error || 'সাসপেন্ড করা সম্ভব হয়নি।');
    }
  };

  const handleActivate = (userId: string) => {
    const res = activateUser(userId);
    if (res.success) {
      showToast('success', 'ইউজার অ্যাকাউন্ট সফলভাবে পুনরায় সক্রিয় করা হয়েছে।');
    } else {
      showToast('error', res.error || 'পুনরায় সক্রিয় করা সম্ভব হয়নি।');
    }
  };

  const handleDelete = (user: User) => {
    if (!isDeveloper) {
      showToast('error', 'ডাটাবেজের অখণ্ডতার স্বার্থে স্থায়ী ডিলিট অপশন সীমিত। অ্যাকাউন্ট স্থগিত করতে "সাসপেন্ড" ব্যবহার করুন।');
      return;
    }
    if (user.id === currentUser?.id) {
      showToast('error', 'নিজের অ্যাকাউন্ট ডিলিট করা যাবে না।');
      return;
    }
    if (user.role === 'DEVELOPER') {
      showToast('error', 'এই অ্যাকাউন্ট মোছা অননুমোদিত।');
      return;
    }

    if (confirm(`সতর্কতা: আপনি কি নিশ্চিত যে "${user.name}" স্থায়ীভাবে মুছে ফেলতে চান? এতে ঐতিহাসিক লেনদেনের লিঙ্ক বিচ্ছিন্ন হতে পারে।`)) {
      const res = deleteUser(user.id);
      if (res.success) {
        showToast('success', `ইউজার "${user.name}" স্থায়ীভাবে মুছে ফেলা হয়েছে।`);
      } else {
        showToast('error', res.error || 'ডিলিট সম্পন্ন হয়নি।');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                ব্যবহারকারী ব্যবস্থাপনা ও নিরাপত্তা কন্ট্রোল
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-normal">
                  Users Management & RBAC
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ইউজার ডিরেক্টরি, এইচআর স্টাফ সিঙ্ক, রোলভিত্তিক পারমিশন ম্যাট্রিক্স এবং অপরিবর্তনীয় অডিট ট্রেইল
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          নতুন ইউজার তৈরি করুন
        </button>
      </div>

      {/* Security Status Protocol Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="font-bold flex items-center gap-2 text-sm text-indigo-100">
              নিরাপত্তা নীতি ও এনক্রিপশন সুরক্ষা
              {isDeveloper && (
                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  <Crown className="w-3 h-3 text-amber-400" />
                  রুট ডেভেলপার মোড
                </span>
              )}
            </div>
            <p className="text-slate-300 text-[11px] mt-1 leading-relaxed max-w-3xl">
              {isDeveloper ? (
                <span>
                  আপনি <strong>Developer</strong> হিসেবে লগইন আছেন। আপনার আইডি ও পাসওয়ার্ড এডমিন সহ অন্য কেউ দেখতে বা পরিবর্তন করতে পারে না। আপনি যেকোনো ইউজারের পাসওয়ার্ড রিসেট ও পারমিশন ম্যাট্রিক্স কাস্টমাইজ করতে পারেন।
                </span>
              ) : (
                <span>
                  আপনি <strong>Admin</strong> হিসেবে লগইন আছেন। আপনি সিস্টেমের সকল ইউজার তৈরি, তথ্য পরিবর্তন, রোল নিয়ন্ত্রণ এবং পাসওয়ার্ড রিসেট করতে পারবেন।
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 bg-white/10 px-3 py-1.5 rounded-xl text-[11px] text-slate-200">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>পাসওয়ার্ড হ্যাশ এনক্রিপ্টেড ও সুরক্ষিত</span>
        </div>
      </div>

      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-semibold animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 text-xs px-2 py-1"
          >
            বন্ধ
          </button>
        </div>
      )}

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all ${
            activeTab === 'users'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>ব্যবহারকারী তালিকা (Users Directory)</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">
            {users.filter(u => isDeveloper || u.role !== 'DEVELOPER').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('rbac')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all ${
            activeTab === 'rbac'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>এক্সেস কন্ট্রোল ও RBAC ম্যাট্রিক্স</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all ${
            activeTab === 'audit'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>ইউজার ও সিকিউরিটি অডিট ট্রেইল</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'users' && (
        <UsersDirectoryTab
          onAddUser={handleOpenAddModal}
          onEditUser={handleOpenEditModal}
          onResetPassword={handleResetPassword}
          onDeactivateUser={handleDeactivate}
          onActivateUser={handleActivate}
          onDeleteUser={handleDelete}
        />
      )}

      {activeTab === 'rbac' && <RBACMatrixTab />}

      {activeTab === 'audit' && (
        <UserSecurityAuditTab
          onNavigateToFullLogs={() => {
            if (setActiveModule) {
              setActiveModule('AUDIT_LOGS' as any);
            }
          }}
        />
      )}

      {/* Modals */}
      <UserFormModal
        isOpen={showAddEditModal}
        onClose={() => setShowAddEditModal(false)}
        onSubmit={handleFormSubmit}
        initialUser={editingUser}
        currentUserRole={currentUser?.role}
      />

      <PasswordResetModal
        user={resetTargetUser}
        onClose={() => setResetTargetUser(null)}
        onReset={handleConfirmPasswordReset}
      />

      <DeactivateConfirmModal
        user={deactivateTargetUser}
        onClose={() => setDeactivateTargetUser(null)}
        onConfirm={handleConfirmDeactivation}
      />
    </div>
  );
};
