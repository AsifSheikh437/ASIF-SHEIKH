import React, { useState } from 'react';
import { User } from '../../../types';
import { KeyRound, Eye, EyeOff, X, AlertCircle, ShieldAlert, Check } from 'lucide-react';

interface PasswordResetModalProps {
  user: User | null;
  onClose: () => void;
  onReset: (newPass: string) => { success: boolean; error?: string };
}

export const PasswordResetModal: React.FC<PasswordResetModalProps> = ({
  user,
  onClose,
  onReset,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  if (!user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 4) {
      setError('পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('উভয় পাসওয়ার্ড মেলেনি! অনুগ্রহ করে যাচাই করুন।');
      return;
    }

    const res = onReset(newPassword);
    if (!res.success) {
      setError(res.error || 'পাসওয়ার্ড রিসেট ব্যর্থ হয়েছে।');
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
        <div className="px-6 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">পাসওয়ার্ড রিসেট ও পরিবর্তন</h3>
              <p className="text-[11px] text-amber-100">ইউজার: {user.name} ({user.username})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-slate-500 text-[11px]">টার্গেট ইউজার:</div>
            <div className="font-bold text-slate-800 text-sm">{user.name}</div>
            <div className="text-slate-600 font-mono text-[11px]">আইডি: {user.username} | রোল: {user.role}</div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              নতুন পাসওয়ার্ড <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="কমপক্ষে ৪ অক্ষর"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              নতুন পাসওয়ার্ড নিশ্চিত করুন (Confirm Password) <span className="text-rose-500">*</span>
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="একই পাসওয়ার্ড পুনরায় লিখুন"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs transition-colors"
            >
              পাসওয়ার্ড সেট করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
