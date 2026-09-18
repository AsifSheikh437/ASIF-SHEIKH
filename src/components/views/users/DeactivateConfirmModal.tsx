import React, { useState } from 'react';
import { User } from '../../../types';
import { ShieldAlert, UserX, X, AlertTriangle } from 'lucide-react';

interface DeactivateConfirmModalProps {
  user: User | null;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
}

export const DeactivateConfirmModal: React.FC<DeactivateConfirmModalProps> = ({
  user,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('প্রশাসনিক সিদ্ধান্ত / অ্যাকাউন্ট স্থগিত');

  if (!user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
        <div className="px-6 py-4 bg-gradient-to-r from-rose-700 to-rose-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <UserX className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">ইউজার সাসপেন্ড / নিষ্ক্রিয়করণ</h3>
              <p className="text-[11px] text-rose-100">{user.name} ({user.username})</p>
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
          <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold">ডাটাবেজ অখণ্ডতা নীতি (Data Integrity):</div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                ইউজার স্থায়ীভাবে মুছে ফেললে পূর্ববর্তী সেলস ইনভয়েস, পারচেজ বিল বা প্রোডাকশন রেকর্ডের অডিট ট্রেইল ক্ষতিগ্রস্ত হতে পারে। তাই অ্যাকাউন্ট <strong>নিষ্ক্রিয় / সাসপেন্ড</strong> করা নিরাপদ। প্রয়োজনে পরবর্তীতে যেকোনো সময় আবার সক্রিয় করা যাবে।
              </p>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              সাসপেন্ডের কারণ / নোট (ঐচ্ছিক)
            </label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="যেমন: কর্মবিরতি বা অন্য চাকরিতে যোগদান"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
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
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs transition-colors"
            >
              স্থগিত নিশ্চিত করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
