import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useInventory, AlertType, RealtimeInventoryAlert } from '../../context/InventoryContext';
import { useERP } from '../../context/ERPContext';
import { 
  X, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Package, 
  ArrowRight,
  TrendingDown,
  Volume2,
  VolumeX,
  Search,
  ShoppingCart,
  Layers,
  Calendar,
  EyeOff,
  RotateCcw,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { formatDate, formatCurrency } from '../../utils/formatters';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLDivElement>;
}

type FilterTab = 'ALL' | 'LOW_STOCK' | 'EXPIRY' | 'CRITICAL';

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const { 
    alerts, 
    totalAlertCount, 
    lowStockCount, 
    outOfStockCount, 
    expiringBatchesCount, 
    expiredBatchesCount, 
    criticalAlertCount,
    dismissAlert,
    dismissAllAlerts,
    resetDismissedAlerts,
    dismissedAlertIds,
    navigateToModule 
  } = useInventory();

  const { products, batches } = useERP();

  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      return localStorage.getItem('erp_notification_sound') !== 'false';
    } catch {
      return true;
    }
  });

  const panelRef = useRef<HTMLDivElement>(null);

  // Play subtle synthetic audio chime when critical alert is active & opened
  const playAlertChime = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio autoplay policy catch
    }
  };

  // Toggle sound setting
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    try {
      localStorage.setItem('erp_notification_sound', String(next));
    } catch {
      // ignore
    }
    if (next) {
      playAlertChime();
    }
  };

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll on mobile when opened
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (criticalAlertCount > 0) {
        playAlertChime();
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Filter alerts by tab and search
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      // Tab filter
      if (activeTab === 'LOW_STOCK') {
        if (alert.type !== 'LOW_STOCK' && alert.type !== 'OUT_OF_STOCK') return false;
      } else if (activeTab === 'EXPIRY') {
        if (
          alert.type !== 'EXPIRED_BATCH' && 
          alert.type !== 'CRITICAL_EXPIRY_BATCH' && 
          alert.type !== 'UPCOMING_EXPIRY_BATCH'
        ) return false;
      } else if (activeTab === 'CRITICAL') {
        if (alert.severity !== 'critical') return false;
      }

      // Search filter
      if (searchTerm.trim()) {
        const query = searchTerm.trim().toLowerCase();
        const matchesTitle = alert.title.toLowerCase().includes(query);
        const matchesSubtitle = alert.subtitle.toLowerCase().includes(query);
        const matchesDetails = alert.details.toLowerCase().includes(query);
        const matchesBatch = alert.batchNumber?.toLowerCase().includes(query);
        const matchesProductBn = alert.productNameBangla?.toLowerCase().includes(query);
        const matchesProductEn = alert.productNameEnglish?.toLowerCase().includes(query);

        if (!matchesTitle && !matchesSubtitle && !matchesDetails && !matchesBatch && !matchesProductBn && !matchesProductEn) {
          return false;
        }
      }

      return true;
    });
  }, [alerts, activeTab, searchTerm]);

  if (!isOpen) return null;

  const stockAlertsCount = lowStockCount + outOfStockCount;
  const batchAlertsCount = expiringBatchesCount + expiredBatchesCount;

  return (
    <div className="fixed inset-0 z-[100] no-print">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Floating Dropdown Panel in Navbar / Drawer layout */}
      <div 
        ref={panelRef}
        className="fixed top-2 sm:top-16 right-2 sm:right-4 md:right-8 w-[calc(100vw-16px)] sm:w-[480px] max-h-[calc(100vh-24px)] sm:max-h-[85vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-label="ইনভেন্টরি নোটিফিকেশন সেন্টার"
      >
        
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border border-teal-200/60 dark:border-teal-800/60 shadow-2xs">
              <Package className="w-5 h-5" />
              {totalAlertCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                  নোটিফিকেশন সেন্টার
                </h2>
                {totalAlertCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
                    {totalAlertCount} টি সক্রিয়
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                    সব ঠিক আছে
                  </span>
                )}
              </div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                রিয়েল-টাইম কম স্টক ও ব্যাচ মেয়াদ সতর্কতা
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Audio Toggle */}
            <button
              onClick={toggleSound}
              type="button"
              className={`p-2 rounded-xl transition-colors ${
                soundEnabled 
                  ? 'text-teal-700 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-950/30' 
                  : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={soundEnabled ? 'সাউন্ড অ্যালার্ট সক্রিয় (ক্লিক করে মিউট করুন)' : 'সাউন্ড অ্যালার্ট বন্ধ (ক্লিক করে চালু করুন)'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              type="button"
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              title="বন্ধ করুন (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="px-4 pt-3 pb-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shrink-0">
          <div className="flex items-center gap-1.5 min-w-max">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <span>সকল</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                activeTab === 'ALL' ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900' : 'bg-slate-200 dark:bg-slate-700'
              }`}>
                {totalAlertCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('LOW_STOCK')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'LOW_STOCK'
                  ? 'bg-amber-600 text-white shadow-2xs ring-1 ring-amber-500'
                  : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 hover:bg-amber-100'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>কম স্টক</span>
              <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                {stockAlertsCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('EXPIRY')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'EXPIRY'
                  ? 'bg-rose-600 text-white shadow-2xs ring-1 ring-rose-500'
                  : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>ব্যাচ মেয়াদ</span>
              <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono bg-rose-200/60 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200">
                {batchAlertsCount}
              </span>
            </button>

            {criticalAlertCount > 0 && (
              <button
                onClick={() => setActiveTab('CRITICAL')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                  activeTab === 'CRITICAL'
                    ? 'bg-red-700 text-white shadow-2xs ring-1 ring-red-600'
                    : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 hover:bg-red-200 animate-pulse'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>জরুরি</span>
                <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono bg-red-200 dark:bg-red-900 text-red-900 dark:text-red-100">
                  {criticalAlertCount}
                </span>
              </button>
            )}
          </div>

          {/* Quick Mark Read / Dismiss actions */}
          {totalAlertCount > 0 && (
            <button
              onClick={dismissAllAlerts}
              type="button"
              className="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 underline underline-offset-2 whitespace-nowrap shrink-0 ml-1"
              title="সবগুলো সতর্কতা সাময়িক সরিয়ে রাখুন"
            >
              সব পরিষ্কার
            </button>
          )}

          {dismissedAlertIds.length > 0 && totalAlertCount === 0 && (
            <button
              onClick={resetDismissedAlerts}
              type="button"
              className="text-[11px] font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 flex items-center gap-1 whitespace-nowrap shrink-0 ml-1"
              title="পূর্বে লুকানো সতর্কতা পুনঃপ্রদর্শন করুন"
            >
              <RotateCcw className="w-3 h-3" />
              রিসেট
            </button>
          )}
        </div>

        {/* Search within alerts */}
        {alerts.length > 3 && (
          <div className="px-4 py-2 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="পণ্য, ব্যাচ কোড বা বিবরণ দিয়ে ফিল্টার করুন..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-teal-500 text-slate-800 dark:text-slate-200 placeholder-slate-400"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Scrollable Alert List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 divide-y divide-slate-100/80 dark:divide-slate-800/80 max-h-[58vh]">
          {filteredAlerts.length === 0 ? (
            <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3 shadow-2xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                {searchTerm ? 'কোনো ফলাফল পাওয়া যায়নি' : 'কোনো সতর্কতা নেই! সব স্বাভাবিক'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
                {searchTerm
                  ? `"${searchTerm}" এর সাথে মিলে এমন কোনো স্টক বা ব্যাচ অ্যালার্ট নেই।`
                  : 'আপনার সকল খাদ্যপণ্যের মজুদ সন্তোষজনক এবং আসন্ন ৩০ দিনের মধ্যে মেয়াদ শেষের কোনো ঝুঁকি নেই।'}
              </p>
              
              {dismissedAlertIds.length > 0 && !searchTerm && (
                <button
                  onClick={resetDismissedAlerts}
                  className="mt-4 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  পূর্বের বাতিলকৃত ({dismissedAlertIds.length} টি) সতর্কতা দেখুন
                </button>
              )}
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const isOutOfStock = alert.type === 'OUT_OF_STOCK';
              const isLowStock = alert.type === 'LOW_STOCK';
              const isExpired = alert.type === 'EXPIRED_BATCH';
              const isCriticalExpiry = alert.type === 'CRITICAL_EXPIRY_BATCH';
              const isUpcomingExpiry = alert.type === 'UPCOMING_EXPIRY_BATCH';

              // Stock level progress percentage
              const stockRatio = (alert.minThreshold && alert.currentStock !== undefined)
                ? Math.min(100, Math.max(0, (alert.currentStock / alert.minThreshold) * 100))
                : 0;

              return (
                <div 
                  key={alert.id}
                  className={`pt-3.5 first:pt-0 group transition-all`}
                >
                  <div className={`p-3.5 rounded-xl border transition-all shadow-2xs ${
                    isOutOfStock 
                      ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 hover:border-rose-300'
                      : isExpired
                      ? 'bg-red-50/60 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 hover:border-red-300'
                      : isCriticalExpiry
                      ? 'bg-orange-50/60 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/50 hover:border-orange-300'
                      : isLowStock
                      ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 hover:border-amber-300'
                      : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}>
                    
                    {/* Header line of the card */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Severity Badge */}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black tracking-wide uppercase ${
                          isOutOfStock 
                            ? 'bg-rose-600 text-white' 
                            : isExpired
                            ? 'bg-red-600 text-white'
                            : isCriticalExpiry
                            ? 'bg-orange-600 text-white'
                            : isLowStock
                            ? 'bg-amber-500 text-white'
                            : 'bg-blue-600 text-white'
                        }`}>
                          {isOutOfStock && <AlertTriangle className="w-3 h-3" />}
                          {isExpired && <Clock className="w-3 h-3" />}
                          {isCriticalExpiry && <AlertCircle className="w-3 h-3" />}
                          {isLowStock && <TrendingDown className="w-3 h-3" />}
                          {isOutOfStock ? 'স্টক শূন্য (০)' : isExpired ? 'মেয়াদোত্তীর্ণ' : isCriticalExpiry ? 'জরুরি মেয়াদ' : isLowStock ? 'কম স্টক' : 'আসন্ন মেয়াদ'}
                        </span>

                        {/* Category or Batch Code Tag */}
                        {alert.batchNumber && (
                          <span className="px-1.5 py-0.5 bg-slate-200/80 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded text-[10px] font-mono font-bold">
                            ব্যাচ #{alert.batchNumber}
                          </span>
                        )}

                        <span className="text-[10px] text-slate-400 font-medium">
                          {alert.timestamp}
                        </span>
                      </div>

                      {/* Dismiss Single Alert */}
                      <button
                        onClick={() => dismissAlert(alert.id)}
                        type="button"
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition-colors"
                        title="এই অ্যালার্টটি সাময়িক লুকান"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Title and details */}
                    <div className="mt-2">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                        {alert.title}
                      </h4>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                        {alert.subtitle}
                      </p>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-1.5 leading-relaxed bg-white/60 dark:bg-slate-900/50 p-2 rounded-lg border border-black/5 dark:border-white/5">
                        {alert.details}
                      </p>
                    </div>

                    {/* Progress Bar for Stock or Days Countdown */}
                    {alert.minThreshold !== undefined && alert.currentStock !== undefined && (
                      <div className="mt-2.5">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                          <span>মজুদ অনুপাত ({alert.currentStock} / {alert.minThreshold} {alert.unit})</span>
                          <span className={isOutOfStock ? 'text-rose-600' : 'text-amber-600'}>
                            {Math.round(stockRatio)}% অবশিষ্ট
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              isOutOfStock ? 'bg-rose-600 w-0' : stockRatio < 30 ? 'bg-rose-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${stockRatio}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Interactive Action Buttons */}
                    <div className="mt-3 pt-2.5 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          navigateToModule(alert.actionModule);
                          onClose();
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                          isOutOfStock || isExpired
                            ? 'bg-rose-700 hover:bg-rose-800 text-white'
                            : isCriticalExpiry
                            ? 'bg-orange-700 hover:bg-orange-800 text-white'
                            : 'bg-teal-700 hover:bg-teal-800 text-white'
                        }`}
                      >
                        {alert.actionModule === 'PURCHASE' && <ShoppingCart className="w-3.5 h-3.5" />}
                        {alert.actionModule === 'BATCH_EXPIRY' && <Clock className="w-3.5 h-3.5" />}
                        {alert.actionModule === 'SALES' && <Layers className="w-3.5 h-3.5" />}
                        {alert.actionModule === 'INVENTORY' && <Package className="w-3.5 h-3.5" />}
                        <span>{alert.actionLabel}</span>
                        <ArrowRight className="w-3 h-3 ml-0.5" />
                      </button>

                      {/* Secondary quick navigation button */}
                      <button
                        onClick={() => {
                          navigateToModule(alert.type.includes('BATCH') ? 'BATCH_EXPIRY' : 'INVENTORY');
                          onClose();
                        }}
                        className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-teal-700 dark:hover:text-teal-400 px-2 py-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      >
                        বিস্তারিত দেখুন
                      </button>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info & stats */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span>পণ্য: <strong className="text-slate-800 dark:text-slate-200">{(products || []).length}</strong></span>
            <span>•</span>
            <span>সক্রিয় ব্যাচ: <strong className="text-slate-800 dark:text-slate-200">{(batches || []).filter(b => b.status === 'ACTIVE').length}</strong></span>
          </div>

          <button
            onClick={() => {
              navigateToModule('INVENTORY');
              onClose();
            }}
            className="font-bold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1"
          >
            <span>ইনভেন্টরি রিপোর্ট</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

      </div>
    </div>
  );
};
