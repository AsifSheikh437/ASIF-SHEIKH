import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import {
  Building2,
  Lock,
  User,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Shield,
  Zap,
  Users2,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react';
import { LoginMascotAnimation } from './LoginMascotAnimation';

export const LoginModal: React.FC = () => {
  const {
    currentUser,
    login,
    changePassword,
    resetPasswordWithRecovery,
    users,
    settings,
  } = useERP();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Password Recovery state
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recUsername, setRecUsername] = useState('');
  const [recName, setRecName] = useState('');
  const [recCode, setRecCode] = useState('');
  const [recNewPassword, setRecNewPassword] = useState('');
  const [recoveryError, setRecoveryError] = useState('');

  // First-time mandatory password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passChangeError, setPassChangeError] = useState('');

  // Strict Guard: If user is authenticated and does not need mandatory password change,
  // NEVER render any DOM elements. This guarantees zero z-index overlap or event interception on other pages.
  if (currentUser && !currentUser.mustChangePassword) {
    return null;
  }

  // If user is logged in but mustChangePassword flag is true
  if (currentUser && currentUser.mustChangePassword) {
    const handleMandatoryChange = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newPassword || newPassword.length < 4) {
        setPassChangeError('পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।');
        return;
      }
      if (newPassword !== confirmPassword) {
        setPassChangeError('নতুন পাসওয়ার্ড ও কনফার্ম পাসওয়ার্ড মেলেনি!');
        return;
      }
      changePassword(newPassword);
    };

    return (
      <div id="mandatory-password-change-modal" className="fixed inset-0 z-[80] pointer-events-auto flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 md:p-8 animate-in fade-in zoom-in-95">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-center text-slate-900">
            বাধ্যতামূলক পাসওয়ার্ড পরিবর্তন
          </h2>
          <p className="text-xs text-center text-slate-500 mt-1 mb-6">
            নিরাপত্তার স্বার্থে প্রথমবার লগইনের পর আপনার ব্যক্তিগত গোপন পাসওয়ার্ড সেট করুন।
          </p>

          {passChangeError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passChangeError}</span>
            </div>
          )}

          <form onSubmit={handleMandatoryChange} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">নতুন পাসওয়ার্ড</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="নতুন পাসওয়ার্ড লিখুন"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-sans"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">কনফার্ম পাসওয়ার্ড</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="পাসওয়ার্ড পুনরায় লিখুন"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-sans"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition-all mt-2 cursor-pointer"
            >
              পাসওয়ার্ড সেভ করুন ও সিস্টেমে প্রবেশ করুন
            </button>
          </form>
        </div>
      </div>
    );
  }

  // If already logged in, do not render login screen
  if (currentUser) {
    return null;
  }

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    const res = login(username, password);
    if (!res.success) {
      setErrorMessage(res.message || 'লগইন ব্যর্থ হয়েছে।');
    }
  };

  const handleQuickLogin = (roleUser: typeof users[0]) => {
    setUsername(roleUser.username);
    setPassword(roleUser.passwordHash);
    const res = login(roleUser.username, roleUser.passwordHash);
    if (!res.success) {
      setErrorMessage(res.message || 'লগইন ব্যর্থ হয়েছে।');
    }
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    if (!recNewPassword || recNewPassword.length < 4) {
      setRecoveryError('নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।');
      return;
    }
    const res = resetPasswordWithRecovery(recUsername, recName, recCode, recNewPassword);
    if (!res.success) {
      setRecoveryError(res.message);
    } else {
      setShowRecoveryModal(false);
      setSuccessMessage(res.message);
      setUsername(recUsername);
      setPassword(recNewPassword);
    }
  };

  return (
    <div id="food-erp-login-modal" className="fixed inset-0 z-[70] pointer-events-auto flex items-center justify-center p-3 sm:p-5 md:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-slate-100 overflow-y-auto">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphism / 3D Container */}
      <div className="relative w-full max-w-5xl bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.06)] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-300">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
          
          {/* LEFT SIDE: BRANDING PANEL WITH CHARACTER ANIMATION */}
          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between relative bg-gradient-to-b from-slate-900/90 via-teal-950/40 to-slate-950/90 border-b lg:border-b-0 lg:border-r border-white/10">
            {/* Top Branding */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-teal-500/25 border border-teal-400/30">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white drop-shadow-xs">
                    {settings.companyNameBangla || 'ফুড ইআরপি সিস্টেম'}
                  </h1>
                  <p className="text-[11px] text-teal-300 font-medium">
                    {settings.companyNameEnglish || 'Food ERP & Factory Management'}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-300/80 line-clamp-2 leading-relaxed">
                {settings.tagline || 'সম্পূর্ণ স্বাস্থ্যসম্মত ও অটোমেটেড খাদ্যপণ্য প্রস্তুতকারক সিস্টেম'}
              </p>
            </div>

            {/* MASCOT ANIMATION STAGE (The requested character animation) */}
            <div className="my-4 sm:my-6">
              <div className="relative rounded-2xl bg-slate-950/60 border border-teal-500/20 shadow-inner overflow-hidden backdrop-blur-xs p-2">
                {/* Stage Header Badge */}
                <div className="flex items-center justify-between px-3 pt-2 pb-1 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5 font-medium text-teal-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    ইআরপি অ্যাসিস্ট্যান্ট
                  </span>
                  <span className="text-[10px] text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-md border border-slate-700/50">
                    স্বাগত উপস্থাপনা
                  </span>
                </div>

                {/* SVG Animated Character & Box Reveal */}
                <LoginMascotAnimation
                  companyName={settings.companyNameBangla}
                  themeColor="#0d9488"
                />
              </div>
            </div>

            {/* Bottom Security & Value Props */}
            <div className="space-y-2 pt-2">
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div className="p-2 rounded-xl bg-slate-800/40 border border-slate-700/50 text-slate-300 flex flex-col items-center text-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span className="font-semibold">নিরাপদ ডেটা</span>
                  <span className="text-[9px] text-slate-400">AES-256 বিট</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-800/40 border border-slate-700/50 text-slate-300 flex flex-col items-center text-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="font-semibold">অটোমেশন</span>
                  <span className="text-[9px] text-slate-400">রিয়েল-টাইম</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-800/40 border border-slate-700/50 text-slate-300 flex flex-col items-center text-center gap-1">
                  <Users2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="font-semibold">রোল অ্যাক্সেস</span>
                  <span className="text-[9px] text-slate-400">মাল্টি-ইউজার</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 text-center pt-2">
                © {new Date().getFullYear()} {settings.companyNameEnglish || 'Food ERP System'}. সর্বস্বত্ব সংরক্ষিত।
              </p>
            </div>
          </div>

          {/* RIGHT SIDE: CLEAN, PROFESSIONAL LOGIN FORM (STRICTLY SERIOUS & POLISHED) */}
          <div className="lg:col-span-7 bg-white text-slate-900 p-6 sm:p-8 md:p-10 flex flex-col justify-between">
            <div>
              {/* Form Title */}
              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-[11px] font-bold mb-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  নিরাপদ এন্টারপ্রাইজ পোর্টাল
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  সিস্টেমে লগইন করুন
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  আপনার ইউজার আইডি ও পাসওয়ার্ড প্রদান করে ড্যাশবোর্ডে প্রবেশ করুন।
                </p>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                {/* Username / User ID */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    ইউজার আইডি বা ইউজারনেম (User ID / Username)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      id="input-login-username"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="যেমন: admin, manager, sales, operator"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-900 font-sans transition-all text-xs"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-semibold text-slate-700">
                      পাসওয়ার্ড (Password)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setRecoveryError('');
                        setShowRecoveryModal(true);
                      }}
                      className="text-teal-600 hover:text-teal-800 font-medium hover:underline text-[11px] cursor-pointer"
                    >
                      পাসওয়ার্ড ভুলে গেছেন?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      id="input-login-password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-900 font-sans transition-all text-xs"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  id="btn-login-submit"
                  className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-bold rounded-xl shadow-lg shadow-teal-700/20 active:translate-y-0.5 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>লগইন করুন (Sign In)</span>
                  <ArrowRight className="w-4 h-4 ml-1 opacity-80" />
                </button>
              </form>
            </div>

          </div>

        </div>
      </div>

      {/* Password Recovery Modal */}
      {showRecoveryModal && (
        <div id="food-erp-password-recovery-modal" className="fixed inset-0 z-[90] pointer-events-auto flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-800 text-sm">পাসওয়ার্ড রিকভারি ফর্ম</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRecoveryModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              আপনার ইউজারনেম ও গোপন রিকভারি কোড (যেমন: REC-ADM-002, REC-MGR-003) প্রদান করে নতুন পাসওয়ার্ড সেট করুন।
            </p>

            {recoveryError && (
              <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {recoveryError}
              </div>
            )}

            <form onSubmit={handleRecoverySubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ইউজারনেম</label>
                <input
                  type="text"
                  required
                  value={recUsername}
                  onChange={e => setRecUsername(e.target.value)}
                  placeholder="যেমন: admin, manager, sales"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-teal-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">গোপন রিকভারি কোড</label>
                <input
                  type="text"
                  required
                  value={recCode}
                  onChange={e => setRecCode(e.target.value)}
                  placeholder="যেমন: REC-ADM-002 বা REC-MGR-003"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-teal-500 uppercase font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">নতুন পাসওয়ার্ড</label>
                <input
                  type="password"
                  required
                  value={recNewPassword}
                  onChange={e => setRecNewPassword(e.target.value)}
                  placeholder="কমপক্ষে ৪ অক্ষরের নতুন পাসওয়ার্ড"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-teal-500 text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRecoveryModal(false)}
                  className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  পাসওয়ার্ড রিসেট করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
