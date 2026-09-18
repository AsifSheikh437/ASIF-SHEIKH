import React, { useState, useEffect } from 'react';
import { User, Role } from '../../../types';
import {
  X,
  Upload,
  User as UserIcon,
  Eye,
  EyeOff,
  Lock,
  Phone,
  Mail,
  Briefcase,
  Shield,
  Building2,
  Users2,
  Sparkles,
  Camera,
  Check,
} from 'lucide-react';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: {
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
  }) => { success: boolean; error?: string };
  initialUser?: User | null;
  currentUserRole?: Role;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialUser,
  currentUserRole,
}) => {
  const isDeveloper = currentUserRole === 'DEVELOPER';
  const isEditing = !!initialUser;

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>('MANAGER');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<'MECHANICAL' | 'OFFICE'>('OFFICE');
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [department, setDepartment] = useState('MANAGEMENT');
  const [designation, setDesignation] = useState('');
  const [mustChangePassword, setMustChangePassword] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [avatar, setAvatar] = useState<string>('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (initialUser) {
      setName(initialUser.name || '');
      setUsername(initialUser.username || '');
      setPassword('');
      setRole(initialUser.role || 'MANAGER');
      setPhone(initialUser.phone || '');
      setEmail(initialUser.email || '');
      setCategory(initialUser.category || 'OFFICE');
      setGender(initialUser.gender || 'MALE');
      setDepartment(initialUser.department || 'MANAGEMENT');
      setDesignation(initialUser.designation || '');
      setMustChangePassword(!!initialUser.mustChangePassword);
      setIsActive(initialUser.isActive !== false);
      setAvatar(initialUser.avatar || '');
    } else {
      setName('');
      setUsername('');
      setPassword('');
      setRole('MANAGER');
      setPhone('');
      setEmail('');
      setCategory('OFFICE');
      setGender('MALE');
      setDepartment('MANAGEMENT');
      setDesignation('');
      setMustChangePassword(true);
      setIsActive(true);
      setAvatar('');
    }
    setFormError('');
  }, [initialUser, isOpen]);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setFormError('ছবির আকার সর্বোচ্চ ২ মেগাবাইট হতে পারবে।');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatar('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('ব্যবহারকারীর পুরো নাম প্রদান করুন।');
      return;
    }

    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '');
    if (!cleanUsername) {
      setFormError('ইউজার আইডি (Username) আবশ্যক।');
      return;
    }

    if (!isEditing && password.length < 4) {
      setFormError('নতুন ইউজারের পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।');
      return;
    }

    if (isEditing && password && password.length < 4) {
      setFormError('পাসওয়ার্ড পরিবর্তন করতে চাইলে কমপক্ষে ৪ অক্ষরের হতে হবে।');
      return;
    }

    const res = onSubmit({
      name: name.trim(),
      username: cleanUsername,
      password: password || undefined,
      role,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      category,
      gender,
      department,
      designation: designation.trim() || undefined,
      mustChangePassword,
      isActive,
      avatar: avatar || undefined,
    });

    if (!res.success) {
      setFormError(res.error || 'ইউজার তথ্য সংরক্ষণে ত্রুটি ঘটেছে।');
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl my-6 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">
                {isEditing ? 'ইউজার প্রোফাইল সম্পাদনা' : 'নতুন ইউজার ও স্টাফ তৈরি'}
              </h3>
              <p className="text-[11px] text-slate-300">
                নিরাপদ লগইন আইডি, রোল পারমিশন এবং এইচআর মডিউল তথ্য সংযোগ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium flex items-center gap-2">
              <X className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{formError}</span>
            </div>
          )}

          {/* Avatar Upload Row */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full bg-indigo-100 border-2 border-indigo-300 overflow-hidden flex items-center justify-center shadow-xs">
                {avatar ? (
                  <img
                    src={avatar}
                    alt="User Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-bold text-indigo-700">
                    {name ? name.slice(0, 2).toUpperCase() : 'USER'}
                  </span>
                )}
              </div>
              <label
                htmlFor="user-avatar-upload"
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center cursor-pointer shadow-md hover:bg-indigo-700 transition-colors"
                title="ছবি আপলোড করুন"
              >
                <Camera className="w-3.5 h-3.5" />
              </label>
              <input
                id="user-avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="font-bold text-slate-800 text-sm">প্রোফাইল ছবি (Avatar)</div>
              <p className="text-[11px] text-slate-500">
                গোলাকার প্রোফাইল ছবি যুক্ত করুন (PNG/JPG, সর্বোচ্চ ২ MB)। ছবি না দিলে নাম অনুযায়ী স্বয়ংক্রিয় ব্যাজ দেখানো হবে।
              </p>
              {avatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold underline mt-1"
                >
                  ছবি মুছে ফেলুন
                </button>
              )}
            </div>
          </div>

          {/* Basic User Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ব্যবহারকারীর পুরো নাম <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="যেমন: হাসান মাহমুদ"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ইউজার আইডি (User ID / Username) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                placeholder="যেমন: hasan.mgr"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* Password and Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>
                  {isEditing ? 'পাসওয়ার্ড (খালি রাখলে অপরিবর্তিত থাকবে)' : 'লগইন পাসওয়ার্ড'} {!isEditing && <span className="text-rose-500">*</span>}
                </span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={isEditing ? 'অপরিবর্তিত রাখতে খালি রাখুন' : 'কমপক্ষে ৪ অক্ষরের পাসওয়ার্ড'}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                দায়িত্ব / ভূমিকা (Role) <span className="text-rose-500">*</span>
              </label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as Role)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                {isDeveloper && <option value="DEVELOPER">রুট ডেভেলপার (DEVELOPER - ফুল এক্সেস)</option>}
                <option value="ADMIN">সিস্টেম অ্যাডমিন (ADMIN - সম্পূর্ণ ব্যবসায়িক নিয়ন্ত্রণ)</option>
                <option value="MANAGER">জেনারেল ম্যানেজার (MANAGER - কারখানা ও সেলস)</option>
                <option value="ACCOUNTANT">একাউন্ট্যান্ট (ACCOUNTANT - অর্থ ও লেজার)</option>
                <option value="SALES">সেলস অফিসার (SALES - বিক্রয় ও ডেলিভারি)</option>
                <option value="PURCHASE">ক্রয় অফিসার (PURCHASE - সাপ্লাই ও মাল গ্রহণ)</option>
                <option value="INVENTORY">ইনভেন্টরি অফিসার (INVENTORY - স্টক ও ব্যাচ)</option>
                <option value="HR/PAYROLL">এইচআর ও পেরোল (HR/PAYROLL - বেতন ও স্টাফ)</option>
                <option value="VIEWER">দর্শক (VIEWER - শুধুমাত্র রিপোর্ট ও তথ্য দর্শন)</option>
              </select>
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">মোবাইল নম্বর</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="01711-000000"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ইমেইল ঠিকানা</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@sonalifoods-bd.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* HR Module Integration Section */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-4">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              <span>এইচআর ও পেরোল মডিউল সংযোগ (HR Integration)</span>
            </div>
            <p className="text-[11px] text-slate-500">
              এখানে নির্ধারিত স্টাফ ক্যাটাগরি ও লিঙ্গ স্বয়ংক্রিয়ভাবে এইচআর মডিউলের মেকানিক্যাল বনাম অফিস স্টাফ সামারিতে প্রতিফলিত হবে।
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Staff Category */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  স্টাফ ক্যাটাগরি (Staff Category)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCategory('MECHANICAL')}
                    className={`py-2 px-3 rounded-xl border text-center font-semibold transition-all ${
                      category === 'MECHANICAL'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    মেকানিক্যাল স্টাফ
                    <div className="text-[9px] opacity-80 font-normal">কারখানা ও মেশিন</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategory('OFFICE')}
                    className={`py-2 px-3 rounded-xl border text-center font-semibold transition-all ${
                      category === 'OFFICE'
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    অফিস স্টাফ
                    <div className="text-[9px] opacity-80 font-normal">প্রশাসন ও হিসাব</div>
                  </button>
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  লিঙ্গ (Gender)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGender('MALE')}
                    className={`py-2 px-3 rounded-xl border text-center font-semibold transition-all ${
                      gender === 'MALE'
                        ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    পুরুষ (Male)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('FEMALE')}
                    className={`py-2 px-3 rounded-xl border text-center font-semibold transition-all ${
                      gender === 'FEMALE'
                        ? 'bg-rose-500 text-white border-rose-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    মহিলা (Female)
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">বিভাগ (Department)</label>
                <select
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="PRODUCTION">উৎপাদন বিভাগ (Production)</option>
                  <option value="SALES">সেলস ও ডিস্ট্রিবিউশন (Sales)</option>
                  <option value="ACCOUNTS">অ্যাকাউন্টস ও অর্থ (Accounts)</option>
                  <option value="MANAGEMENT">ব্যবস্থাপনা ও প্রশাসন (Management)</option>
                  <option value="QUALITY">কোয়ালিটি ও ল্যাব (Quality Assurance)</option>
                  <option value="LOGISTICS">লজিস্টিকস ও গুদাম (Logistics)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">পদবি (Designation)</label>
                <input
                  type="text"
                  value={designation}
                  onChange={e => setDesignation(e.target.value)}
                  placeholder="যেমন: সিনিয়র একাউন্ট্যান্ট বা ফোরম্যান"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Security & Access Policies */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={mustChangePassword}
                onChange={e => setMustChangePassword(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <div>
                <span className="font-semibold text-slate-800">
                  প্রথমবার লগইনে বাধ্যতামূলক পাসওয়ার্ড পরিবর্তন
                </span>
                <p className="text-[11px] text-slate-500">
                  ইউজার প্রথমবার লগইন করলে নিজের ব্যক্তিগত গোপন পাসওয়ার্ড সেট করতে বাধ্য থাকবে।
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer pt-2 border-t border-slate-200">
              <input
                type="checkbox"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <div>
                <span className="font-semibold text-slate-800">
                  অ্যাকাউন্ট স্ট্যাটাস সক্রিয় রাখুন (Active Account)
                </span>
                <p className="text-[11px] text-slate-500">
                  টিক তুলে দিলে অ্যাকাউন্ট সাময়িকভাবে নিষ্ক্রিয়/সাসপেন্ড থাকবে এবং লগইন করতে পারবে না।
                </p>
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold transition-colors"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs transition-colors"
            >
              {isEditing ? 'তথ্য আপডেট করুন' : 'ইউজার তৈরি করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
