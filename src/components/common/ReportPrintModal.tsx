import React from 'react';
import { useERP } from '../../context/ERPContext';
import { formatDate, formatDateTime } from '../../utils/formatters';
import { printDocument, exportElementToPDF } from '../../utils/printPdfUtils';
import {
  Printer,
  Download,
  X,
  ArrowLeft,
  FileText,
  Building2,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

export interface ReportPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  periodLabel?: string;
  documentId: string;
  landscape?: boolean;
  children: React.ReactNode;
  onCustomPdfDownload?: () => void;
  extraActions?: React.ReactNode;
}

export const ReportPrintModal: React.FC<ReportPrintModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  periodLabel,
  documentId,
  landscape = false,
  children,
  onCustomPdfDownload,
  extraActions,
}) => {
  const { settings, currentUser } = useERP();

  if (!isOpen) return null;

  const handlePrint = () => {
    printDocument(documentId, {
      title: `${title.replace(/\s+/g, '_')}_${new Date().toISOString().substring(0, 10)}`,
      landscape,
    });
  };

  const handlePdf = () => {
    if (onCustomPdfDownload) {
      onCustomPdfDownload();
    } else {
      exportElementToPDF(documentId, {
        filename: `${title.replace(/\s+/g, '_')}_${new Date().toISOString().substring(0, 10)}.pdf`,
        orientation: landscape ? 'landscape' : 'portrait',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div
        className={`w-full ${
          landscape ? 'max-w-6xl' : 'max-w-4xl'
        } bg-white rounded-none sm:rounded-3xl min-h-screen sm:min-h-0 shadow-2xl border-0 sm:border border-slate-200 overflow-hidden my-0 sm:my-6 flex flex-col animate-in fade-in zoom-in-95`}
      >
        {/* Screen-only Action / Toolbar */}
        <div className="p-3 sm:px-6 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 print:hidden sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-xs sm:text-sm text-white">
                  {title}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                  প্রিন্ট ভিউ
                </span>
              </div>
              {periodLabel && (
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {periodLabel}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {extraActions}

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
              title="রিপোর্ট সরাসরি প্রিন্ট করুন"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>প্রিন্ট করুন</span>
            </button>

            <button
              type="button"
              onClick={handlePdf}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold rounded-xl border border-slate-700 transition-colors shadow-xs cursor-pointer"
              title="PDF ফাইল ডাউনলোড করুন"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>PDF ডাউনলোড</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
              title="বন্ধ করে আগের পর্দায় ফিরুন"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>বাতিল</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="modal-close-btn w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div
          id={documentId}
          className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-900 bg-white font-sans print:p-0 print:overflow-visible print:bg-white"
        >
          {/* Official Letterhead */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b-2 border-slate-900">
            <div className="flex items-start gap-3.5">
              {settings.logoUrl || settings.companyLogo ? (
                <img
                  src={settings.logoUrl || settings.companyLogo}
                  alt="Company Logo"
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 object-contain rounded-xl border border-slate-200 bg-white p-1 shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-indigo-700 text-white flex items-center justify-center font-black text-2xl shadow-xs border border-indigo-600 shrink-0">
                  {settings.companyNameEnglish ? settings.companyNameEnglish.charAt(0) : 'F'}
                </div>
              )}
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {settings.companyNameBangla}
                </h1>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {settings.companyNameEnglish}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-lg leading-relaxed">
                  {settings.address} | ফোন: {settings.phone} {settings.email ? `| ইমেইল: ${settings.email}` : ''}
                </p>
                {(settings.binVatNo || settings.tradeLicenseNo || settings.taxNumber || settings.tradeLicense) && (
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {settings.binVatNo ? `BIN/VAT: ${settings.binVatNo}` : settings.taxNumber ? `TIN/BIN: ${settings.taxNumber}` : ''}
                    {(settings.binVatNo || settings.taxNumber) && (settings.tradeLicenseNo || settings.tradeLicense) ? ' | ' : ''}
                    {settings.tradeLicenseNo ? `ট্রেড লাইসেন্স: ${settings.tradeLicenseNo}` : settings.tradeLicense ? `ট্রেড লাইসেন্স: ${settings.tradeLicense}` : ''}
                  </p>
                )}
              </div>
            </div>

            <div className="text-left sm:text-right bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-slate-200 w-full sm:w-auto">
              <span className="inline-block px-3 py-1 bg-slate-900 text-white text-[11px] font-bold uppercase tracking-widest rounded-md mb-1.5">
                OFFICIAL REPORT
              </span>
              <div className="font-bold text-slate-900 text-sm">{title}</div>
              {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
              {periodLabel && (
                <div className="text-[11px] font-mono text-indigo-700 font-semibold mt-0.5">
                  {periodLabel}
                </div>
              )}
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                প্রিন্ট তারিখ: {formatDate(new Date().toISOString())} ({new Date().toLocaleTimeString('bn-BD')})
              </div>
            </div>
          </div>

          {/* Report Body Content */}
          <div className="space-y-6">
            {children}
          </div>

          {/* Formal Audit / Corporate Signature Blocks */}
          <div className="pt-10 border-t border-slate-200 grid grid-cols-3 gap-6 text-center text-xs page-break-inside-avoid">
            <div>
              <div className="border-t border-dashed border-slate-400 pt-2 font-bold text-slate-800">
                প্রস্তুতকারী (Prepared By)
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {currentUser?.name || 'অ্যাকাউন্টস অফিসার'}
              </div>
            </div>

            <div>
              <div className="border-t border-dashed border-slate-400 pt-2 font-bold text-slate-800">
                যাচাইকারী (Audited & Checked)
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                প্রধান হিসাবরক্ষক / অডিটর
              </div>
            </div>

            <div>
              <div className="border-t border-dashed border-slate-400 pt-2 font-bold text-slate-800">
                অনুমোদনকারী কর্তৃপক্ষ
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                ব্যবস্থাপনা পরিচালক / স্বত্বাধিকারী
              </div>
            </div>
          </div>

          {/* System Footer Note */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>{settings.companyNameBangla} | স্বয়ংক্রিয় ফুড ইআরপি সিস্টেম দ্বারা প্রস্তুতকৃত</span>
            <span>পৃষ্ঠা: ১/১ | Confidential & Proprietary</span>
          </div>
        </div>
      </div>
    </div>
  );
};
