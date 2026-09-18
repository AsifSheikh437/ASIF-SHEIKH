import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Download,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Paperclip,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  SharePdfEventDetail,
  downloadPDFBlob,
} from '../../utils/printPdfUtils';
import { cleanWhatsAppPhone } from '../../utils/formatters';

export const WhatsAppShareFeedbackModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<
    'IDLE' | 'GENERATING' | 'SUCCESS_NATIVE' | 'FALLBACK_READY' | 'ERROR'
  >('IDLE');
  const [filename, setFilename] = useState<string>('Statement.pdf');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [messageText, setMessageText] = useState<string>('');
  const [blob, setBlob] = useState<Blob | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleEvent = (event: Event) => {
      const customEv = event as CustomEvent<SharePdfEventDetail>;
      const detail = customEv.detail;
      if (!detail) return;

      if (detail.type === 'START_GENERATING') {
        setFilename(detail.filename);
        setStatus('GENERATING');
        setIsOpen(true);
      } else if (detail.type === 'SUCCESS_NATIVE') {
        setStatus('SUCCESS_NATIVE');
        setTimeout(() => {
          setIsOpen(false);
          setStatus('IDLE');
        }, 1800);
      } else if (detail.type === 'FALLBACK_READY') {
        setFilename(detail.filename);
        setPhoneNumber(detail.phoneNumber || '');
        setMessageText(detail.messageText);
        setBlob(detail.blob);
        setStatus('FALLBACK_READY');
        setIsOpen(true);
      } else if (detail.type === 'ERROR') {
        setFilename(detail.filename);
        setErrorMessage(detail.errorMessage || 'PDF তৈরি করা যায়নি, আবার চেষ্টা করুন।');
        setStatus('ERROR');
        setIsOpen(true);
      } else if (detail.type === 'CLOSE') {
        setIsOpen(false);
        setStatus('IDLE');
      }
    };

    window.addEventListener('food-erp-share-pdf-event', handleEvent);
    return () => {
      window.removeEventListener('food-erp-share-pdf-event', handleEvent);
    };
  }, []);

  if (!isOpen || status === 'IDLE') return null;

  const handleReDownload = () => {
    if (blob) {
      downloadPDFBlob(blob, filename);
    }
  };

  const handleReOpenWhatsApp = () => {
    const cleanPhone = cleanWhatsAppPhone(phoneNumber);
    const encoded = encodeURIComponent(messageText);
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(waUrl, '_blank');
  };

  const handleClose = () => {
    setIsOpen(false);
    setStatus('IDLE');
  };

  return (
    <div
      id="whatsapp-share-feedback-backdrop"
      className="fixed inset-0 z-9999 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="whatsapp-share-feedback-card"
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 text-slate-800"
      >
        {/* =========================================================================
            STATE 1: GENERATING PDF
            ========================================================================= */}
        {status === 'GENERATING' && (
          <div className="p-8 sm:p-10 text-center space-y-5">
            <div className="relative w-18 h-18 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-teal-100 animate-ping opacity-35" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-lg shadow-teal-500/30">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                প্রফেশনাল PDF তৈরি হচ্ছে...
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                উচ্চ রেজোলিউশন (2x Scale) রেন্ডারিং ও বাংলা ফন্ট প্রসেস করা হচ্ছে। অনুগ্রহ করে কয়েক সেকেন্ড অপেক্ষা করুন...
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 text-[11px] font-mono font-medium text-slate-600 border border-slate-200">
              <FileText className="w-3.5 h-3.5 text-teal-600" />
              <span>{filename}</span>
            </div>
          </div>
        )}

        {/* =========================================================================
            STATE 2: NATIVE SHARE SUCCESS
            ========================================================================= */}
        {status === 'SUCCESS_NATIVE' && (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                শেয়ার উইন্ডো সফলভাবে চালু হয়েছে!
              </h3>
              <p className="text-xs text-slate-500">
                WhatsApp সিলেক্ট করে সরাসরি অ্যাটাচড PDF পাঠান।
              </p>
            </div>
          </div>
        )}

        {/* =========================================================================
            STATE 3: FALLBACK READY (PDF DOWNLOADED + WA CHAT OPENED)
            ========================================================================= */}
        {status === 'FALLBACK_READY' && (
          <div>
            {/* Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-800 text-white flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-emerald-300 shrink-0 border border-white/20">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-900/60 text-[10px] font-semibold text-emerald-200 border border-emerald-500/40 mb-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>WhatsApp চ্যাট ও ফাইল রেডি</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight text-white leading-snug">
                    PDF ডাউনলোড হয়েছে ✅
                  </h3>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="p-1 text-emerald-200 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
                title="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instruction Body */}
            <div className="p-5 sm:p-6 space-y-4 text-xs">
              {/* Primary Notification Box (as requested) */}
              <div className="p-3.5 bg-emerald-50 border-2 border-emerald-200/80 rounded-2xl flex items-start gap-3">
                <Paperclip className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-emerald-900 text-xs sm:text-sm">
                    WhatsApp চ্যাটে গিয়ে ফাইলটি Attach করুন (📎 বাটনে ক্লিক করে)
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                    ব্রাউজার সিকিউরিটি পলিসির কারণে ফাইলটি স্বয়ংক্রিয়ভাবে ডাউনলোড করা হয়েছে এবং সাথে সাথে WhatsApp চ্যাট ওপেন করা হয়েছে।
                  </div>
                </div>
              </div>

              {/* Document File Info Card */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-2 font-mono">
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="font-bold text-slate-800 text-[11px] truncate">
                      {filename}
                    </div>
                    <div className="text-[10px] text-slate-400 font-sans">
                      A4 Corporate PDF • অ্যাটাচমেন্টের জন্য প্রস্তুত
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleReDownload}
                  className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-100 text-teal-700 border border-slate-200 rounded-xl text-[11px] font-bold shadow-2xs transition-colors"
                  title="পুনরায় ডাউনলোড করুন"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>পুনরায় ডাউনলোড</span>
                </button>
              </div>

              {/* 3 Step Guide */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  সহজ ৩টি ধাপ:
                </div>
                <div className="space-y-2 text-slate-700">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      ১
                    </span>
                    <p className="leading-relaxed text-[11px]">
                      আপনার ডিভাইসে <strong className="text-slate-900 font-mono">{filename}</strong> ফাইলটি ডাউনলোড হয়েছে (ডাউনলোড ফোল্ডারে)।
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      ২
                    </span>
                    <p className="leading-relaxed text-[11px]">
                      ব্রাউজারের নতুন ট্যাবে নির্দিষ্ট নম্বরের WhatsApp চ্যাট ওপেন হয়েছে।
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      ৩
                    </span>
                    <p className="leading-relaxed text-[11px]">
                      WhatsApp চ্যাটের নিচের <strong className="text-emerald-800">📎 (Attach)</strong> আইকনে ক্লিক করে <strong className="text-slate-900">Document</strong> সিলেক্ট করুন এবং ডাউনলোড হওয়া PDF ফাইলটি পাঠিয়ে দিন।
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
              <a
                href={(() => {
                  const cleanPhone = cleanWhatsAppPhone(phoneNumber);
                  const encoded = encodeURIComponent(messageText);
                  return cleanPhone
                    ? `https://wa.me/${cleanPhone}?text=${encoded}`
                    : `https://wa.me/?text=${encoded}`;
                })()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp চ্যাট খুলুন</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>

              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                সম্পন্ন / ঠিক আছে
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STATE 4: ERROR STATE
            ========================================================================= */}
        {status === 'ERROR' && (
          <div className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-3 text-rose-600 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  PDF তৈরি করা যায়নি
                </h3>
                <p className="text-[11px] text-slate-500">
                  ডকুমেন্ট রেন্ডার করতে সাময়িক বিঘ্ন ঘটেছে
                </p>
              </div>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 leading-relaxed font-mono">
              {errorMessage}
            </div>

            <p className="text-xs text-slate-500">
              অনুগ্রহ করে নিশ্চিত করুন ডকুমেন্টটি স্ক্রিনে দৃশ্যমান রয়েছে এবং পুনরায় চেষ্টা করুন।
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
