import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useERP } from '../context/ERPContext';
import { useInventory } from '../context/InventoryContext';
import { formatCurrency } from '../utils/formatters';
import { PWAInstallButton } from './common/PWAInstallButton';
import { NotificationCenter } from './common/NotificationCenter';
import { GlobalSearchBar } from './common/GlobalSearchBar';
import {
  Menu,
  Globe,
  Bell,
  LogOut,
  Palette,
  Shield,
  UserCheck,
  AlertTriangle,
  Clock,
  Building2,
  ChevronDown,
  Camera,
  KeyRound,
  Settings,
  User as UserIcon,
  X,
  CheckCircle2,
  AlertCircle,
  Wallet,
  Users,
  Sun,
  Moon,
  ExternalLink,
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const {
    currentUser,
    logout,
    settings,
    totalCashAndBankBalance,
    lowStockCount: erpLowStockCount,
    expiringBatchesCount: erpExpiringCount,
    products,
    batches,
    customers,
    suppliers,
    systemTasks,
    setActiveModule,
    updateCurrentUserAvatar,
    changePassword,
    updateUser,
    theme,
    toggleTheme,
  } = useERP();

  const {
    totalAlertCount: inventoryAlertCount,
    criticalAlertCount,
    lowStockCount,
    expiringBatchesCount,
  } = useInventory();


  const [showAlerts, setShowAlerts] = useState(false);
  const { t, language, toggleLanguage } = useLanguage();

  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Modals
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile edit state
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone || '');
  const [profileEmail, setProfileEmail] = useState(currentUser?.email || '');
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const lowStockItems = (products || []).filter(p => p.currentStock <= p.minStockAlert);
  const thirtyDaysAhead = new Date(Date.now() + 30 * 86400000);
  const expiringItems = (batches || []).filter(b => b.status !== 'DEPLETED' && b.expDate && new Date(b.expDate) <= thirtyDaysAhead);
  const dueCustomers = (customers || []).filter(c => c.currentDue > 0).slice(0, 3);
  
  const pendingTasksCount = (systemTasks || []).filter(t => t.status !== 'COMPLETED').length;
  const totalNotifications = inventoryAlertCount + pendingTasksCount;

  // Handle Photo Upload (supports gallery and mobile camera)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('অনুগ্রহ করে শুধুমাত্র ছবি ফাইল (JPG, PNG, WebP) নির্বাচন করুন।');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const img = new Image();
      img.onload = () => {
        // Resize to max 256x256 for fast localStorage performance
        const canvas = document.createElement('canvas');
        const MAX_DIM = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          updateCurrentUserAvatar(compressedDataUrl);
        }
      };
      img.src = uploadEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!currentUser) return;
    if (currentUser.passwordHash && currentUser.passwordHash !== oldPassword) {
      setPasswordMsg({ type: 'error', text: 'বর্তমান পুরাতন পাসওয়ার্ড সঠিক নয়।' });
      return;
    }
    if (newPassword.length < 4) {
      setPasswordMsg({ type: 'error', text: 'নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'নতুন পাসওয়ার্ড ও কনফার্ম পাসওয়ার্ড মেলেনি।' });
      return;
    }

    const ok = changePassword(newPassword);
    if (ok) {
      setPasswordMsg({ type: 'success', text: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!' });
      setTimeout(() => {
        setShowChangePasswordModal(false);
        setPasswordMsg(null);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }, 1200);
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!profileName.trim()) {
      setProfileMsg({ type: 'error', text: 'নামের ঘর ফাঁকা রাখা যাবে না।' });
      return;
    }

    const res = updateUser(currentUser.id, {
      name: profileName.trim(),
      phone: profilePhone.trim(),
      email: profileEmail.trim(),
    });

    if (res.success) {
      setProfileMsg({ type: 'success', text: 'প্রোফাইল তথ্য সফলভাবে হালনাগাদ হয়েছে।' });
      setTimeout(() => {
        setShowProfileModal(false);
        setProfileMsg(null);
      }, 1000);
    } else {
      setProfileMsg({ type: 'error', text: res.error || 'হালনাগাদ করতে সমস্যা হয়েছে।' });
    }
  };

  return (
    <>
      {/* Hidden File Input for Profile Photo Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handlePhotoUpload}
        className="hidden"
        id="profile-photo-file-input"
      />

      {/* FIXED TOP HEADER BAR - Zero Overlap Layout */}
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between h-16 px-4 md:px-6 bg-white border-b border-slate-200 shadow-xs">
        {/* Left Side: Sidebar Hamburger + Company Brand Logo & Name */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          <button
            id="btn-sidebar-toggle"
            onClick={onToggleSidebar}
            aria-expanded={isSidebarOpen}
            className={`w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-colors border cursor-pointer touch-manipulation ${
              isSidebarOpen
                ? 'text-teal-700 bg-teal-50 border-teal-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent hover:border-slate-200'
            }`}
            title={isSidebarOpen ? 'সাইডবার বন্ধ করুন' : 'সাইডবার খুলুন'}
            aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={() => setActiveModule('DASHBOARD')}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none group min-w-0"
            title="ড্যাশবোর্ডে যান"
          >
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt="Logo"
                referrerPolicy="no-referrer"
                className="w-9 h-9 sm:w-10 sm:h-10 object-contain rounded-xl border border-slate-200 bg-white p-1 shadow-2xs group-hover:scale-105 transition-transform shrink-0"
              />
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-teal-700 via-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-sm sm:text-base font-bold text-slate-900 leading-tight tracking-tight group-hover:text-teal-700 transition-colors truncate max-w-[130px] min-[400px]:max-w-[190px] sm:max-w-xs">
                {settings.companyNameBangla || 'ফুড ইআরপি'}
              </span>
              <span className="text-[11px] font-medium text-slate-500 hidden sm:block truncate max-w-xs">
                {settings.companyNameEnglish || 'Food ERP Management System'}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Global Search Bar (Products, Customers & Transactions) */}
        <div className="flex-1 flex items-center justify-center max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg mx-2 sm:mx-4">
          <GlobalSearchBar />
        </div>

        {/* Right Side: Cash/Bank quick pill, Notifications Bell, User Profile Bar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Cash & Bank Quick Badge */}
          <div
            onClick={() => setActiveModule('CASH_BANK')}
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-200/80 rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
            title="ক্যাশ ও ব্যাংক লেজার দেখতে ক্লিক করুন"
          >
            <Wallet className="w-4 h-4 text-emerald-600" />
            <span>ক্যাশ ও ব্যাংক:</span>
            <span className="font-mono font-bold text-emerald-700">{formatCurrency(totalCashAndBankBalance)}</span>
          </div>

          {/* Notification Bell with Red Badge */}
          <div className="relative">
            <button
              id="btn-notifications"
              onClick={() => {
                setShowAlerts(!showAlerts);
                setShowProfileMenu(false);
              }}
              className={`w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center relative rounded-xl transition-colors border cursor-pointer ${
                showAlerts
                  ? 'bg-teal-50 text-teal-800 border-teal-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent hover:border-slate-200'
              }`}
              title={
                totalNotifications > 0
                  ? `${totalNotifications} টি ইনভেন্টরি সতর্কতা ও নোটিফিকেশন`
                  : 'নোটিফিকেশন সেন্টার (সব স্বাভাবিক)'
              }
              aria-label="Notifications"
            >
              <Bell className={`w-5 h-5 ${criticalAlertCount > 0 ? 'text-rose-600' : ''}`} />
              {totalNotifications > 0 && (
                <span className={`absolute top-1.5 right-1.5 flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-black text-white rounded-full ring-2 ring-white ${
                  criticalAlertCount > 0 ? 'bg-rose-600 animate-pulse' : 'bg-amber-600'
                }`}>
                  {totalNotifications}
                </span>
              )}
            </button>
          </div>

          {/* PWA Install Button */}
          <div className="hidden sm:block">
            <PWAInstallButton />
          </div>

          {/* Open in New Tab Button (iframe sandbox bypass for full printing & sharing) */}
          <a
            id="btn-open-new-tab"
            href={window.location.href}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-700 rounded-lg transition-colors border border-slate-200 hover:border-teal-300 text-xs font-semibold cursor-pointer shadow-2xs group"
            title="সম্পূর্ণ আলাদা ব্রাউজার ট্যাবে খুলুন (iframe এর সীমাবদ্ধতা ছাড়া প্রিন্ট ও শেয়ার করতে)"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-teal-600 transition-colors" />
            <span className="hidden md:inline">নতুন ট্যাবে খুলুন</span>
          </a>

          {/* Quick Sun / Moon Theme Toggle Button */}
          <button
            id="btn-theme-toggle"
            onClick={toggleTheme}
            className="w-11 h-11 min-w-[44px] min-h-[44px] p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-transparent hover:border-slate-200 relative group flex items-center justify-center cursor-pointer select-none"
            title={theme === 'dark' ? 'লাইট মোড চালু করুন (Switch to Light Mode)' : 'ডার্ক মোড চালু করুন (Switch to Dark Mode)'}
            aria-label="Toggle Light and Dark Mode"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600 group-hover:-rotate-12 transition-transform duration-300" />
            )}
          </button>

          {/* USER PROFILE SECTION (Avatar + Name & Role + Dropdown Menu) */}
          {currentUser && (
            <div className="relative" ref={profileMenuRef}>
              <button
                id="btn-user-profile"
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowAlerts(false);
                }}
                className="min-h-[44px] flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-100 transition-all border border-slate-200/80 bg-slate-50/50 cursor-pointer"
                title="ইউজার প্রোফাইল ও মেনু"
                aria-label="User profile menu"
              >
                {/* Circular Profile Avatar Photo */}
                <div className="relative">
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover ring-2 ring-teal-600/80 shadow-2xs"
                    />
                  ) : (
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-teal-700 to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center shadow-2xs ring-2 ring-white">
                      {currentUser.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                </div>

                {/* User Name and Role - formatted cleanly e.g. "Md. Karim • ADMIN" */}
                <div className="hidden sm:flex flex-col text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 truncate max-w-[120px] md:max-w-[140px]">
                      {currentUser.name}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[10px] font-extrabold text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded tracking-wider uppercase border border-teal-200/60">
                      {currentUser.role}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 truncate max-w-[150px]">
                    @{currentUser.username}
                  </span>
                </div>

                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showProfileMenu ? 'rotate-180 text-teal-700' : ''}`} />
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div
                  id="user-profile-dropdown"
                  className="absolute right-0 mt-2 w-64 sm:w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150"
                >
                  {/* Dropdown Header with Avatar & Quick Upload Button */}
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70 rounded-t-xl mb-1">
                    <div className="flex items-center gap-3">
                      <div className="relative group">
                        {currentUser.avatar ? (
                          <img
                            src={currentUser.avatar}
                            alt={currentUser.name}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-teal-600 shadow-xs"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-teal-700 to-teal-500 text-white font-bold text-base flex items-center justify-center shadow-xs">
                            {currentUser.name.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          title="ছবি আপলোড / পরিবর্তন করুন"
                          className="absolute inset-0 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900 text-sm truncate">
                          {currentUser.name}
                        </div>
                        <div className="text-slate-500 truncate text-[11px]">
                          {currentUser.email || `@${currentUser.username}`}
                        </div>
                        <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-teal-50 text-teal-800 font-bold rounded-md text-[10px] border border-teal-200/60">
                          <span>রোল:</span>
                          <span className="uppercase">{currentUser.role}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu Action 1: Upload Photo Button */}
                  <button
                    id="btn-upload-photo"
                    onClick={() => {
                      fileInputRef.current?.click();
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-teal-50 text-teal-800 flex items-center gap-3 font-semibold transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold">ছবি এড / পরিবর্তন করুন</div>
                      <div className="text-[10px] text-teal-600 font-normal">মোবাইল ক্যামেরা বা গ্যালারি থেকে</div>
                    </div>
                  </button>

                  {/* Menu Action 2: Profile Settings */}
                  <button
                    id="btn-profile-settings"
                    onClick={() => {
                      setShowProfileMenu(false);
                      setProfileName(currentUser.name);
                      setProfilePhone(currentUser.phone || '');
                      setProfileEmail(currentUser.email || '');
                      setProfileMsg(null);
                      setShowProfileModal(true);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-slate-700 flex items-center gap-3 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <span>প্রোফাইল সেটিংস (Profile Settings)</span>
                  </button>

                  {/* Menu Action 3: Change Password */}
                  <button
                    id="btn-change-password"
                    onClick={() => {
                      setShowProfileMenu(false);
                      setPasswordMsg(null);
                      setOldPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setShowChangePasswordModal(true);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-slate-700 flex items-center gap-3 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <span>পাসওয়ার্ড পরিবর্তন (Change Password)</span>
                  </button>

                  {/* Role-based User Management Link */}
                  {(currentUser.role === 'ADMIN' || currentUser.role === 'DEVELOPER') && (
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        setActiveModule('USERS_MANAGEMENT');
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-slate-700 flex items-center gap-3 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <span>ইউজার ম্যানেজমেন্ট ও এক্সেস</span>
                    </button>
                  )}

                  {currentUser.role === 'DEVELOPER' && (
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        setActiveModule('DEV_SETTINGS');
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-purple-50 text-purple-700 flex items-center gap-3 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                        <Shield className="w-4 h-4" />
                      </div>
                      <span className="font-semibold">ডেভেলপার কন্ট্রোল ও ব্যাকআপ</span>
                    </button>
                  )}

                  <div className="border-t border-slate-100 my-1"></div>

                  {/* Theme Mode Toggle Row in Profile Menu */}
                  <div
                    id="dropdown-theme-toggle"
                    onClick={() => toggleTheme()}
                    className="w-full px-4 py-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors select-none group"
                    title={theme === 'dark' ? 'লাইট মোডে পরিবর্তন করুন' : 'ডার্ক মোডে পরিবর্তন করুন'}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                        theme === 'dark' ? 'bg-amber-400/20 text-amber-400' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">থিম মোড (Theme)</span>
                        <span className="text-[10px] text-slate-500">
                          {theme === 'dark' ? 'ডার্ক মোড সক্রিয় (Dark Mode)' : 'লাইট মোড সক্রিয় (Light Mode)'}
                        </span>
                      </div>
                    </div>

                    {/* Animated switch toggle */}
                    <div className={`w-10 h-5 rounded-full transition-colors flex items-center p-0.5 ${
                      theme === 'dark' ? 'bg-teal-600 justify-end' : 'bg-slate-300 justify-start'
                    }`}>
                      <div className="w-4 h-4 rounded-full bg-white shadow-xs flex items-center justify-center text-[8px] font-bold">
                        {theme === 'dark' ? '🌙' : '☀️'}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 my-1"></div>

                  {/* Language Toggle Row */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLanguage();
                    }}
                    className="w-full px-4 py-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors select-none group"
                    title={language === 'bn' ? 'Switch to English' : 'বাংলায় পরিবর্তন করুন'}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors bg-slate-100 text-slate-700">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{t('nav.language')}</span>
                        <span className="text-[10px] text-slate-500">
                          {language === 'bn' ? 'বাংলা সক্রিয় (Bengali)' : 'English Active'}
                        </span>
                      </div>
                    </div>

                    {/* Animated switch toggle */}
                    <div className={`w-10 h-5 rounded-full transition-colors flex items-center p-0.5 ${
                      language === 'bn' ? 'bg-teal-600 justify-start' : 'bg-blue-600 justify-end'
                    }`}>
                      <div className="w-4 h-4 rounded-full bg-white shadow-xs flex items-center justify-center text-[8px] font-bold">
                        {language === 'bn' ? 'বাং' : 'EN'}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 my-1"></div>

                  {/* Logout Button */}
                  <button
                    id="btn-logout"
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2.5 text-rose-600 hover:bg-rose-50 flex items-center gap-3 font-semibold transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <span>লগআউট করুন (Logout)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* CHANGE PASSWORD MODAL */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">পাসওয়ার্ড পরিবর্তন করুন</h3>
                  <p className="text-xs text-slate-500">ইউজার: {currentUser?.name} (@{currentUser?.username})</p>
                </div>
              </div>
              <button
                onClick={() => setShowChangePasswordModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="p-5 space-y-4 text-xs">
              {passwordMsg && (
                <div
                  className={`p-3 rounded-xl flex items-center gap-2 ${
                    passwordMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {passwordMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{passwordMsg.text}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  বর্তমান পুরাতন পাসওয়ার্ড *
                </label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  placeholder="বর্তমান পাসওয়ার্ড টাইপ করুন"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  নতুন পাসওয়ার্ড *
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="কমপক্ষে ৪ অক্ষরের নতুন পাসওয়ার্ড"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  নতুন পাসওয়ার্ড নিশ্চিত করুন *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="আবার নতুন পাসওয়ার্ড লিখুন"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-medium"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-xs transition-colors"
                >
                  পাসওয়ার্ড সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROFILE SETTINGS MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">প্রোফাইল সেটিংস</h3>
                  <p className="text-xs text-slate-500">আপনার একাউন্টের ব্যক্তিগত তথ্য আপডেট করুন</p>
                </div>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProfileSubmit} className="p-5 space-y-4 text-xs">
              {profileMsg && (
                <div
                  className={`p-3 rounded-xl flex items-center gap-2 ${
                    profileMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {profileMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{profileMsg.text}</span>
                </div>
              )}

              {/* Profile Avatar Centerpiece */}
              <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="relative">
                  {currentUser?.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-14 h-14 rounded-full object-cover ring-2 ring-teal-600 shadow-xs"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-teal-700 to-teal-500 text-white font-bold text-lg flex items-center justify-center shadow-xs">
                      {currentUser?.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-teal-50 text-teal-800 border border-teal-200 font-bold rounded-lg transition-colors shadow-2xs"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>ছবি আপলোড / ক্যামেরা</span>
                  </button>
                  <p className="text-[10px] text-slate-400 mt-1">JPG, PNG সর্বোচ্চ ২ মেগাবাইট</p>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  পুরো নাম *
                </label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={e => setProfileName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ইউজার আইডি (Username)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={currentUser?.username || ''}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-100 text-slate-500 rounded-xl cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    রোল (Role)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={currentUser?.role || ''}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-100 text-teal-800 font-bold uppercase rounded-xl cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  মোবাইল নম্বর
                </label>
                <input
                  type="text"
                  value={profilePhone}
                  onChange={e => setProfilePhone(e.target.value)}
                  placeholder="যেমন: 01712-345678"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ইমেইল অ্যাড্রেস
                </label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={e => setProfileEmail(e.target.value)}
                  placeholder="যেমন: user@example.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-2 mt-2">
                  কর্পোরেট কালার থিম (Corporate Color Theme)
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { id: 'teal', name: 'Default', color: 'bg-teal-500' },
                    { id: 'blue', name: 'Ocean', color: 'bg-blue-500' },
                    { id: 'rose', name: 'Sunset', color: 'bg-rose-500' },
                    { id: 'violet', name: 'Royal', color: 'bg-violet-500' },
                    { id: 'orange', name: 'Warm', color: 'bg-orange-500' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          localStorage.setItem('food_erp_color_theme', t.id);
                          document.documentElement.setAttribute('data-color-theme', t.id);
                          // For a more immediate state update if the context has setColorTheme we could use it,
                          // but the user's setting is immediately applied via the DOM element attribute.
                        }
                      }}
                      className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <div className={`w-5 h-5 rounded-full mb-1 ${t.color}`}></div>
                      <span className="text-[9px] font-bold text-slate-600 text-center leading-tight">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-medium"
                >
                  বন্ধ করুন
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-xs transition-colors"
                >
                  তথ্য সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <NotificationCenter isOpen={showAlerts} onClose={() => setShowAlerts(false)} />
    </>
  );
};
