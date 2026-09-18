import React from 'react';
import { RotateCcw, Trash2, CheckCircle2, Clock, Cloud, X } from 'lucide-react';

interface DraftAutoSaveBannerProps {
  hasSavedDraft: boolean;
  savedTimeFormatted: string | null;
  onRestore: () => void;
  onDiscard: () => void;
  onDismiss?: () => void;
}

export const DraftAutoSaveBanner: React.FC<DraftAutoSaveBannerProps> = ({
  hasSavedDraft,
  savedTimeFormatted,
  onRestore,
  onDiscard,
  onDismiss,
}) => {
  if (!hasSavedDraft) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/60 rounded-2xl p-3.5 mb-4 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
              <span>অসম্পূর্ণ কাজের খসড়া পাওয়া গেছে!</span>
              <span className="px-1.5 py-0.2 bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 rounded text-[10px] font-semibold">
                সংরক্ষিত
              </span>
            </h4>
            <p className="text-[11px] text-amber-800 dark:text-amber-300/80 mt-0.5">
              পৃষ্ঠা রিফ্রেশ বা অসাবধানতাবশত বন্ধ হয়ে গেলেও আপনার ইনপুট ডাটা সংরক্ষিত রয়েছে{' '}
              {savedTimeFormatted && (
                <span className="font-semibold underline">({savedTimeFormatted})</span>
              )}।
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            type="button"
            onClick={onRestore}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            title="সংরক্ষিত ড্রাফট ডাটা ফর্মে লোড করুন"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ড্রাফট পুনরুদ্ধার করুন</span>
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            title="সংরক্ষিত ড্রাফট মুছে নতুন করে শুরু করুন"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>মুছে ফেলুন</span>
          </button>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              title="বার্তাটি বন্ধ করুন"
              aria-label="বার্তাটি বন্ধ করুন"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface AutoSaveStatusBadgeProps {
  isSaving: boolean;
  lastSavedAt: Date | null;
}

export const AutoSaveStatusBadge: React.FC<AutoSaveStatusBadgeProps> = ({
  isSaving,
  lastSavedAt,
}) => {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
      <Cloud className={`w-3 h-3 ${isSaving ? 'text-amber-500 animate-pulse' : 'text-emerald-500'}`} />
      {isSaving ? (
        <span className="text-amber-600 dark:text-amber-400 font-bold">স্বয়ংক্রিয় সংরক্ষণ হচ্ছে...</span>
      ) : lastSavedAt ? (
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
          <span>অটো-সেভ: {lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </span>
      ) : (
        <span>অটো-সেভ সক্রিয়</span>
      )}
    </div>
  );
};
