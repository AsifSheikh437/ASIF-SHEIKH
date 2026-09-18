import { decryptData } from "../../utils/cryptoUtils";
import React, { useState, useRef, useEffect } from 'react';
import { DataExportToolbar } from '../common/DataExportToolbar';
import { useERP } from '../../context/ERPContext';
import { CompanySettings, BackupArchiveItem, DriveBackupFile } from '../../types';
import { BACKUP_FOLDER_NAME, downloadBackupContentFromDrive } from '../../services/googleDriveService';
import { formatCurrency, formatDateTime, formatDate } from '../../utils/formatters';
import {
  Building2,
  Settings,
  Database,
  Download,
  DollarSign,
  Upload,
  RotateCcw,
  ShieldCheck,
  HardDrive,
  Users,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowRight,
  Lock,
  Image as ImageIcon,
  Save,
  Phone,
  Mail,
  MapPin,
  Globe,
  FileText,
  BadgePercent,
  Coins,
  Sparkles,
  Printer,
  Trash2,
  AlertOctagon,
  KeyRound,
  Eye,
  EyeOff,
  Archive,
  RefreshCw,
  X,
  FileCheck,
  ShieldAlert,
  Cloud,
  CloudLightning,
  CloudUpload,
  Loader2,
  ExternalLink,
} from 'lucide-react';

import { WorkspaceIntegrationPanel } from './WorkspaceIntegrationPanel';
import { CurrencySettingsPanel } from './CurrencySettingsPanel';

const getRelativeTimeBengali = (timestamp: string | null): string => {
  if (!timestamp) return 'কোনো তথ্য নেই';
  try {
    const time = new Date(timestamp).getTime();
    if (isNaN(time)) return '';
    const now = Date.now();
    const diffMs = now - time;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 45) return 'এইমাত্র (Just now)';
    if (diffMin < 60) return `${diffMin} মিনিট পূর্বে`;
    if (diffHour < 24) return `${diffHour} ঘণ্টা পূর্বে`;
    if (diffDay === 1) return 'গতকাল';
    if (diffDay < 30) return `${diffDay} দিন পূর্বে`;
    return `${Math.floor(diffDay / 30)} মাস পূর্বে`;
  } catch {
    return '';
  }
};

const getBackupHealthStatus = (lastTime: string | null): 'HEALTHY' | 'WARNING' | 'ALERT' => {
  if (!lastTime) return 'ALERT';
  try {
    const time = new Date(lastTime).getTime();
    if (isNaN(time)) return 'ALERT';
    const ageHours = (Date.now() - time) / (1000 * 60 * 60);
    if (ageHours <= 24) return 'HEALTHY';
    if (ageHours <= 72) return 'WARNING';
    return 'ALERT';
  } catch {
    return 'ALERT';
  }
};

export const SettingsBackupView: React.FC = () => {
  const {
    settings,
    updateSettings,
    exportFullBackupJSON,
    importBackupJSON,
    resetToDemoData,
    currentUser,
    users,
    setActiveModule,
    backupArchive,
    createBackupArchive,
    restoreFromBackupArchive,
    deleteFromBackupArchive,
    executeHardReset,
    executeGoLiveClean,
    // Google Drive Cloud Backup
    driveUser,
    isDriveConnected,
    isBackingUpToDrive,
    isRestoringFromDrive,
    isLoadingDriveBackups,
    driveBackupsList,
    lastDriveBackupTime,
    driveNotification,
    setDriveNotification,
    connectDrive,
    disconnectDrive,
    fetchDriveBackups,
    performDriveBackup,
    restoreDriveBackup,
    lastBackupTime,
    triggerManualBackup,
    lastFirebaseBackupTime,
  } = useERP();

  const isDeveloper = currentUser?.role === 'DEVELOPER';

  const [activeTab, setActiveTab] = useState<'PROFILE' | 'FINANCIAL' | 'PDF_CONFIG' | 'CURRENCY' | 'WORKSPACE' | 'BACKUP'>('PROFILE');
  const [formData, setFormData] = useState<CompanySettings>({ ...settings });
  const [pdfConfig, setPdfConfig] = useState(
    settings.pdfPrintConfig || {
      showAddress: true,
      showContact: true,
      showTaxId: true,
      showLogo: true,
    }
  );
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingManualBackup, setIsSavingManualBackup] = useState(false);
  const [manualBackupSuccessMsg, setManualBackupSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Manual Snapshot Modal
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [snapshotLabel, setSnapshotLabel] = useState('');

  // Restore Confirmation Modal
  const [restoreConfirmModal, setRestoreConfirmModal] = useState<{
    type: 'FILE' | 'ARCHIVE' | 'DRIVE';
    archiveItem?: BackupArchiveItem;
    fileContent?: string;
    fileName?: string;
    driveFile?: DriveBackupFile;
  } | null>(null);

  // Danger Zone Hard Reset Modal State
  const [showHardResetModal, setShowHardResetModal] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2 | 3 | 'SUCCESS'>(1);
  const [agreeWarning, setAgreeWarning] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [developerPassword, setDeveloperPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetError, setResetError] = useState('');
  const [isExecutingHardReset, setIsExecutingHardReset] = useState(false);
  const [resetSuccessData, setResetSuccessData] = useState<{
    autoBackupItem?: BackupArchiveItem;
    driveBackupFile?: DriveBackupFile;
  } | null>(null);

  // Danger Zone Go-Live Clean Modal State
  const [showGoLiveModal, setShowGoLiveModal] = useState(false);
  const [goLiveStep, setGoLiveStep] = useState<1 | 2 | 'SUCCESS'>(1);
  const [goLiveAgreeWarning, setGoLiveAgreeWarning] = useState(false);
  const [goLiveConfirmText, setGoLiveConfirmText] = useState('');
  const [goLivePassword, setGoLivePassword] = useState('');
  const [goLiveShowPassword, setGoLiveShowPassword] = useState(false);
  const [goLiveError, setGoLiveError] = useState('');
  const [isExecutingGoLive, setIsExecutingGoLive] = useState(false);
  const [goLiveSuccessData, setGoLiveSuccessData] = useState<{
    autoBackupItem?: BackupArchiveItem;
    driveBackupFile?: DriveBackupFile;
  } | null>(null);

  // Google Drive connection loading state
  const [isConnectingDrive, setIsConnectingDrive] = useState(false);

  // Synchronize form state when global settings change
  useEffect(() => {
    setFormData({ ...settings });
  }, [settings]);

  const handleInputChange = (field: keyof CompanySettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'লোগো ফাইলের আকার ২ মেগাবাইটের (2MB) কম হতে হবে।' });
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      const base64 = event.target?.result as string;
      handleInputChange('logoUrl', base64);
      setMessage({ type: 'success', text: 'কোম্পানি লোগো প্রস্তুত হয়েছে। সংরক্ষণ করতে নিচের বাটনে ক্লিক করুন।' });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    handleInputChange('logoUrl', '');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyNameBangla.trim()) {
      setMessage({ type: 'error', text: 'কোম্পানির বাংলা নাম অবশ্যই পূরণ করতে হবে।' });
      return;
    }

    updateSettings({ ...formData, pdfPrintConfig: pdfConfig });
    setSaveSuccess(true);
    setMessage({
      type: 'success',
      text: 'কোম্পানি সেটিংস ও প্রোফাইল সফলভাবে সংরক্ষিত হয়েছে! সফটওয়্যারের সর্বত্র স্বয়ংক্রিয়ভাবে আপডেট সম্পন্ন হয়েছে।',
    });
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const handleDownloadBackup = () => {
    try {
      const dataStr = exportFullBackupJSON();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Food_ERP_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setMessage({
        type: 'success',
        text: 'সম্পূর্ণ ডেটা ব্যাকআপ সফলভাবে ডাউনলোড করা হয়েছে!',
      });
    } catch (e: any) {
      setMessage({ type: 'error', text: 'ব্যাকআপ ফাইলে সমস্যা হয়েছে।' });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        let content = event.target?.result as string;
        
        if (file.name.endsWith('.enc')) {
          try {
            content = decryptData(content);
            if (!content) throw new Error('Decryption failed');
          } catch (decryptErr) {
            setMessage({ type: 'error', text: 'এনক্রিপ্টেড ফাইল ডিক্রিপ্ট করতে সমস্যা হয়েছে। সঠিক ফাইল নির্বাচন করুন।' });
            return;
          }
        }

        // Verify JSON parse
        JSON.parse(content);
        setRestoreConfirmModal({
          type: 'FILE',
          fileContent: content,
          fileName: file.name,
        });
      } catch (err) {
        setMessage({ type: 'error', text: 'নির্বাচিত ফাইলটি সঠিক JSON ফরম্যাটে নেই।' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmRestore = async () => {
    if (!restoreConfirmModal) return;

    if (restoreConfirmModal.type === 'FILE' && restoreConfirmModal.fileContent) {
      const res = importBackupJSON(restoreConfirmModal.fileContent);
      if (res.success) {
        setMessage({
          type: 'success',
          text: `[${restoreConfirmModal.fileName}] ফাইল থেকে সফলভাবে সমস্ত ডেটা রিস্টোর করা হয়েছে!`,
        });
      } else {
        setMessage({
          type: 'error',
          text: res.error || 'ব্যাকআপ ফাইলটি রিস্টোর করতে ব্যর্থ হয়েছে।',
        });
      }
    } else if (restoreConfirmModal.type === 'ARCHIVE' && restoreConfirmModal.archiveItem) {
      const res = restoreFromBackupArchive(restoreConfirmModal.archiveItem.id);
      if (res.success) {
        setMessage({
          type: 'success',
          text: `আর্কাইভ স্ন্যাপশট [${restoreConfirmModal.archiveItem.label}] থেকে সম্পূর্ণ সিস্টেম ডেটা রিস্টোর করা হয়েছে!`,
        });
      } else {
        setMessage({
          type: 'error',
          text: res.error || 'আর্কাইভ থেকে ডেটা রিস্টোর করতে সমস্যা হয়েছে।',
        });
      }
    } else if (restoreConfirmModal.type === 'DRIVE' && restoreConfirmModal.driveFile) {
      const res = await restoreDriveBackup(restoreConfirmModal.driveFile.id);
      if (res.success) {
        setMessage({
          type: 'success',
          text: `Google Drive ব্যাকআপ ফাইল [${restoreConfirmModal.driveFile.name}] থেকে সম্পূর্ণ সিস্টেম ডেটা সফলভাবে রিস্টোর করা হয়েছে!`,
        });
      } else {
        setMessage({
          type: 'error',
          text: res.error || 'Google Drive থেকে ডেটা রিস্টোর করতে সমস্যা হয়েছে।',
        });
      }
    }

    setRestoreConfirmModal(null);
  };

  const handleDownloadArchiveItem = (item: BackupArchiveItem) => {
    try {
      const blob = new Blob([item.dataJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = item.timestamp.substring(0, 19).replace(/[:T]/g, '_');
      link.download = `Food_ERP_Snapshot_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      setMessage({ type: 'error', text: 'ফাইল ডাউনলোড ব্যর্থ হয়েছে।' });
    }
  };

  const handleCreateSnapshotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBackupArchive(snapshotLabel.trim() || undefined);
    setShowSnapshotModal(false);
    setSnapshotLabel('');
    setMessage({
      type: 'success',
      text: 'বর্তমান সিস্টেমের একটি নতুন ব্যাকআপ স্ন্যাপশট সফলভাবে সংরক্ষণ করা হয়েছে!',
    });
  };

  // Google Drive Handlers
  const handleConnectDrive = async () => {
    if (isConnectingDrive) return;
    try {
      setIsConnectingDrive(true);
      const res = await connectDrive();
      if (res.success) {
        setMessage({
          type: 'success',
          text: 'Google Drive সফলভাবে সংযুক্ত হয়েছে! এখন থেকে দৈনিক ও রিসেট-পূর্ববর্তী অটো-ব্যাকআপ কার্যকর থাকবে।',
        });
      } else {
        setMessage({
          type: 'error',
          text: res.error || 'Google Drive সংযোগ স্থাপন করতে ব্যর্থ হয়েছে।',
        });
      }
    } finally {
      setIsConnectingDrive(false);
    }
  };

  const handleManualDriveBackup = async () => {
    const res = await performDriveBackup('MANUAL', 'ম্যানুয়াল তাৎক্ষণিক ব্যাকআপ');
    if (res.success && res.file) {
      setMessage({
        type: 'success',
        text: `Google Drive-এ ক্লাউড ব্যাকআপ সফলভাবে সংরক্ষিত হয়েছে: ${res.file.name}`,
      });
    } else {
      setMessage({
        type: 'error',
        text: res.error || 'Google Drive ব্যাকআপ ব্যর্থ হয়েছে।',
      });
    }
  };

  const handleDownloadDriveFile = async (file: DriveBackupFile) => {
    try {
      const jsonStr = await downloadBackupContentFromDrive(file.id);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'ড্রাইভ ফাইল ডাউনলোড ব্যর্থ হয়েছে।' });
    }
  };

  // Manual Database State Backup Trigger Handler
  const handleTriggerManualBackup = async () => {
    if (isSavingManualBackup) return;
    try {
      setIsSavingManualBackup(true);
      const res = await triggerManualBackup();
      if (res.success && res.item) {
        const timeFormatted = formatDateTime(res.timestamp);
        const driveNote = res.driveFile ? ` ও Google Drive ক্লাউডে (${res.driveFile.name})` : '';
        const successText = `বর্তমান ডাটাবেজ স্টেট সফলভাবে ব্যাকআপ আর্কাইভে${driveNote} সংরক্ষিত হয়েছে (${timeFormatted})!`;
        setMessage({
          type: 'success',
          text: successText,
        });
        setManualBackupSuccessMsg(successText);
        setTimeout(() => setManualBackupSuccessMsg(null), 6000);
      } else {
        setMessage({
          type: 'error',
          text: res.error || 'ম্যানুয়াল ব্যাকআপ তৈরি করতে সমস্যা হয়েছে।',
        });
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.message || 'ম্যানুয়াল ব্যাকআপ প্রক্রিয়া চলাকালীন সমস্যা হয়েছে।',
      });
    } finally {
      setIsSavingManualBackup(false);
    }
  };

  // Hard Reset Flow Handlers
  const handleOpenHardResetModal = () => {
    setResetStep(1);
    setAgreeWarning(false);
    setConfirmText('');
    setDeveloperPassword('');
    setResetError('');
    setResetSuccessData(null);
    setShowHardResetModal(true);
  };

  const handleExecuteHardResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');

    if (!developerPassword.trim()) {
      setResetError('অনুগ্রহ করে Developer পাসওয়ার্ড প্রদান করুন।');
      return;
    }

    try {
      setIsExecutingHardReset(true);
      const res = await executeHardReset(developerPassword);
      if (!res.success) {
        setResetError(res.error || 'হার্ড রিসেট প্রক্রিয়া ব্যর্থ হয়েছে।');
        return;
      }

      setResetSuccessData({
        autoBackupItem: res.autoBackupItem,
        driveBackupFile: res.driveBackupFile,
      });
      setResetStep('SUCCESS');
    } catch (err: any) {
      setResetError(err?.message || 'হার্ড রিসেট প্রক্রিয়ায় অপ্রত্যাশিত ত্রুটি দেখা দিয়েছে।');
    } finally {
      setIsExecutingHardReset(false);
    }
  };

  // Go-Live Clean Flow Handlers
  const handleOpenGoLiveModal = () => {
    setGoLiveStep(1);
    setGoLiveAgreeWarning(false);
    setGoLiveConfirmText('');
    setGoLivePassword('');
    setGoLiveError('');
    setGoLiveSuccessData(null);
    setShowGoLiveModal(true);
  };

  const handleExecuteGoLiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGoLiveError('');

    if (!goLivePassword.trim()) {
      setGoLiveError('অনুগ্রহ করে Developer পাসওয়ার্ড প্রদান করুন।');
      return;
    }

    try {
      setIsExecutingGoLive(true);
      const res = await executeGoLiveClean(goLivePassword);
      if (!res.success) {
        setGoLiveError(res.error || 'গো-লাইভ ক্লিয়ারেন্স প্রক্রিয়া ব্যর্থ হয়েছে।');
        return;
      }

      setGoLiveSuccessData({
        autoBackupItem: res.autoBackupItem,
        driveBackupFile: res.driveBackupFile,
      });
      setGoLiveStep('SUCCESS');
    } catch (err: any) {
      setGoLiveError(err?.message || 'গো-লাইভ প্রক্রিয়ায় অপ্রত্যাশিত ত্রুটি দেখা দিয়েছে।');
    } finally {
      setIsExecutingGoLive(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-700" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              কোম্পানি পরিচিতি ও কেন্দ্রীয় সেটিংস (Company Profile & Settings)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            <span className="font-semibold text-teal-800">Single Source of Truth:</span> এখানে একবার কোম্পানির তথ্য ও লোগো নির্ধারণ করলে সাইডবার, ইনভয়েস, লেজার স্টেটমেন্ট, P&L রিপোর্ট ও প্রিন্ট লেটারহেডে নিজে থেকেই আপডেট হয়ে যাবে।
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSaveSettings}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            সেটিংস সংরক্ষণ করুন
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {message && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-semibold ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-[11px] underline opacity-80 hover:opacity-100"
          >
            বন্ধ করুন
          </button>
        </div>
      )}

      {/* Visual Backup Indicator & Manual Backup Quick Action in Settings Area */}
      {(() => {
        const backupHealth = getBackupHealthStatus(lastBackupTime);
        return (
          <div
            id="settings-backup-indicator-card"
            className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-xs ${
              backupHealth === 'HEALTHY'
                ? 'bg-gradient-to-r from-emerald-50/90 via-white to-teal-50/50 border-emerald-200'
                : backupHealth === 'WARNING'
                ? 'bg-gradient-to-r from-amber-50/90 via-white to-orange-50/50 border-amber-200'
                : 'bg-gradient-to-r from-rose-50/80 via-white to-slate-50 border-rose-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                <div className="relative shrink-0">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs ${
                      backupHealth === 'HEALTHY'
                        ? 'bg-emerald-600 text-white'
                        : backupHealth === 'WARNING'
                        ? 'bg-amber-600 text-white'
                        : 'bg-rose-600 text-white'
                    }`}
                  >
                    <Database className="w-5 h-5" />
                  </div>
                  {/* Live pulsing status light */}
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    {backupHealth === 'HEALTHY' && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-3.5 w-3.5 border-2 border-white ${
                        backupHealth === 'HEALTHY'
                          ? 'bg-emerald-500'
                          : backupHealth === 'WARNING'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                    />
                  </span>
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      ডাটাবেজ ব্যাকআপ অবস্থা (Database Backup State)
                    </span>
                    <span
                      id="backup-health-badge"
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                        backupHealth === 'HEALTHY'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : backupHealth === 'WARNING'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {backupHealth === 'HEALTHY' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>ডাটাবেজ সুরক্ষিত (Safe)</span>
                        </>
                      ) : backupHealth === 'WARNING' ? (
                        <>
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>ব্যাকআপ বাঞ্ছনীয় (Backup Recommended)</span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-3 h-3 text-rose-600" />
                          <span>কোনো ব্যাকআপ নেই (No Backup)</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-900 flex-wrap">
                    <span>সর্বশেষ ব্যাকআপ সময়:</span>
                    <span
                      id="last-backup-timestamp-display"
                      className={`font-mono ${
                        lastBackupTime ? 'text-teal-800 font-extrabold' : 'text-slate-400 font-normal'
                      }`}
                    >
                      {lastBackupTime ? formatDateTime(lastBackupTime) : 'এখনো কোনো ব্যাকআপ নেওয়া হয়নি'}
                    </span>
                    {lastBackupTime && (
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {getRelativeTimeBengali(lastBackupTime)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-600 flex-wrap pt-0.5">
                    <span className="flex items-center gap-1">
                      <Archive className="w-3.5 h-3.5 text-slate-400" />
                      সংরক্ষিত স্ন্যাপশট: <strong className="text-slate-800">{backupArchive.length} টি</strong>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Cloud className="w-3.5 h-3.5 text-slate-400" />
                      ক্লাউড সিঙ্ক:{' '}
                      <strong className={isDriveConnected ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                        {isDriveConnected ? 'Google Drive সংযুক্ত' : 'শুধুমাত্র লোকাল আর্কাইভ'}
                      </strong>
                    </span>
                    {manualBackupSuccessMsg && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-700 font-bold animate-pulse">
                          ✓ {manualBackupSuccessMsg}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-start sm:self-center shrink-0 flex-wrap">
                <button
                  id="btn-manual-backup"
                  onClick={handleTriggerManualBackup}
                  disabled={isSavingManualBackup}
                  className="flex items-center gap-2 px-4 py-2.5 bg-teal-800 hover:bg-teal-900 active:scale-95 disabled:bg-teal-800/60 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                  title="তাৎক্ষণিকভাবে বর্তমান সম্পূর্ণ সিস্টেম ডাটাবেজ স্টেটের ব্যাকআপ সেভ করুন"
                >
                  {isSavingManualBackup ? (
                    <Loader2 className="w-4 h-4 animate-spin text-teal-200" />
                  ) : (
                    <Save className="w-4 h-4 text-teal-200" />
                  )}
                  <span>{isSavingManualBackup ? 'স্টেট সংরক্ষণ হচ্ছে...' : 'Manual Backup (ম্যানুয়াল ব্যাকআপ নিন)'}</span>
                </button>

                {activeTab !== 'BACKUP' && (
                  <button
                    id="btn-switch-to-backup-tab"
                    onClick={() => setActiveTab('BACKUP')}
                    className="px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-2xs transition-colors"
                    title="ব্যাকআপ ও রিস্টোর বিস্তারিত প্যানেলে যান"
                  >
                    আর্কাইভ দেখুন
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('PROFILE')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'PROFILE'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          কোম্পানি প্রোফাইল ও লেটারহেড (Profile & Letterhead)
        </button>

        <button
          onClick={() => setActiveTab('FINANCIAL')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'FINANCIAL'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          ভ্যাট, কর ও আর্থিক নীতি (Tax, BIN & Accounts)
        </button>

        
        <button
          onClick={() => setActiveTab('PDF_CONFIG')}
          className={`px-4 py-2 text-[13px] font-bold rounded-xl transition-colors shrink-0 ${
            activeTab === 'PDF_CONFIG'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          PDF ইনভয়েস কনফিগারেশন
        </button>
        <button
          onClick={() => setActiveTab('CURRENCY')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'CURRENCY'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          মাল্টি-কারেন্সি (Multi-Currency)
        </button>

        <button
          onClick={() => setActiveTab('WORKSPACE')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'WORKSPACE'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Cloud className="w-4 h-4" />
          গুগল ওয়ার্কস্পেস (Google Workspace)
        </button>

        <button
          onClick={() => setActiveTab('BACKUP')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'BACKUP'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>ডেটা ব্যাকআপ ও সিস্টেম রিস্টোর (Backup & Storage)</span>
          {isDeveloper && (
            <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded-md uppercase">
              Danger Zone
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: COMPANY PROFILE */}
      {activeTab === 'PROFILE' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns: Edit Fields */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-teal-700" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    মৌলিক পরিচিতি ও যোগাযোগের তথ্য
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">সব ইনভয়েস ও স্টেটমেন্টে এই তথ্য প্রদর্শিত হবে</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    কোম্পানির নাম (বাংলায়) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.companyNameBangla}
                    onChange={e => handleInputChange('companyNameBangla', e.target.value)}
                    placeholder="যেমন: সোনালী ফুডস অ্যান্ড বেকারি লিঃ"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    কোম্পানির নাম (ইংরেজিতে)
                  </label>
                  <input
                    type="text"
                    value={formData.companyNameEnglish}
                    onChange={e => handleInputChange('companyNameEnglish', e.target.value)}
                    placeholder="e.g. Sonali Foods & Agro Industries Ltd."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  স্লোগান / ব্র্যান্ড ট্যাগলাইন (Tagline)
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={e => handleInputChange('tagline', e.target.value)}
                  placeholder="যেমন: সম্পূর্ণ স্বাস্থ্যসম্মত ও পুষ্টিকর খাদ্যপণ্য প্রস্তুতকারক"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    মোবাইল ও ফোন নম্বর
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => handleInputChange('phone', e.target.value)}
                    placeholder="+880 1711-234567"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    ইমেইল এড্রেস
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => handleInputChange('email', e.target.value)}
                    placeholder="info@company.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-slate-500" />
                    ওয়েবসাইট
                  </label>
                  <input
                    type="text"
                    value={formData.website || ''}
                    onChange={e => handleInputChange('website', e.target.value)}
                    placeholder="https://company.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    হেড অফিস / করপোরেট ঠিকানা
                  </label>
                  <textarea
                    rows={2}
                    value={formData.address}
                    onChange={e => handleInputChange('address', e.target.value)}
                    placeholder="অফিসের ঠিকানা..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    কারখানা / ফ্যাক্টরির ঠিকানা
                  </label>
                  <textarea
                    rows={2}
                    value={formData.factoryAddress}
                    onChange={e => handleInputChange('factoryAddress', e.target.value)}
                    placeholder="কারখানার ঠিকানা..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 resize-none"
                  />
                </div>
              </div>

              {/* Logo Management */}
              <div className="pt-3 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-teal-700" />
                  কোম্পানির লোগো (Brand Logo)
                </label>
                <div className="flex flex-wrap items-center gap-4">
                  {formData.logoUrl ? (
                    <div className="relative group">
                      <img
                        src={formData.logoUrl}
                        alt="Logo Preview"
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 object-contain rounded-xl border border-slate-300 bg-white p-1 shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-1 shadow-xs hover:bg-rose-700 transition-colors"
                        title="লোগো মুছে ফেলুন"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400">
                      <ImageIcon className="w-6 h-6 mb-1 text-slate-300" />
                      <span className="text-[9px]">নো লোগো</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition-colors"
                      >
                        লোগো ফাইল আপলোড করুন
                      </button>
                      <input
                        type="file"
                        ref={logoInputRef}
                        onChange={handleLogoUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      {formData.logoUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-xl transition-colors"
                        >
                          লোগো সরান
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      PNG, JPG, WebP অথবা SVG (সর্বোচ্চ 2MB)। স্বচ্ছ ব্যাকগ্রাউন্ড সুপারিশকৃত।
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Live Letterhead Preview */}
            <div className="space-y-4">
              <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-xs">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                    <Sparkles className="w-4 h-4" />
                    লাইভ ব্র্যান্ডেড লেটারহেড প্রিভিউ
                  </div>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                    Live Preview
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                  ইনভয়েস, কাস্টমার/সাপ্লায়ার স্টেটমেন্ট এবং লাভ-ক্ষতি রিপোর্টে আপনার হেডার ঠিক যেভাবে দেখতে পাওয়া যাবে:
                </p>

                {/* Mini Letterhead Card */}
                <div className="bg-white text-slate-900 p-4 rounded-2xl shadow-inner border border-slate-300 space-y-3">
                  <div className="flex items-start gap-3 border-b-2 border-teal-800 pb-3">
                    {formData.logoUrl ? (
                      <img
                        src={formData.logoUrl}
                        alt="Company Logo"
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 object-contain rounded-lg border border-slate-200 bg-white p-0.5 shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-teal-900 text-amber-300 flex items-center justify-center font-bold text-sm shrink-0">
                        <Building2 className="w-6 h-6 text-amber-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-teal-950 truncate leading-tight">
                        {formData.companyNameBangla || 'কোম্পানির নাম (বাংলা)'}
                      </h4>
                      <h5 className="text-[10px] font-bold text-slate-600 truncate uppercase">
                        {formData.companyNameEnglish || 'COMPANY NAME (ENGLISH)'}
                      </h5>
                      <p className="text-[9px] text-amber-700 italic truncate mt-0.5">
                        {formData.tagline || 'ব্র্যান্ড স্লোগান'}
                      </p>
                      <div className="text-[8px] text-slate-500 mt-1 leading-snug">
                        <div><span className="font-semibold text-slate-700">হেড অফিস:</span> {formData.address || 'ঠিকানা'}</div>
                        <div><span className="font-semibold text-slate-700">ফোন:</span> {formData.phone || 'ফোন'}</div>
                        <div className="font-mono text-[8px] text-slate-500">BIN: {formData.binVatNo || 'BIN-XXXXX'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center py-1 bg-slate-50 rounded text-[9px] font-bold text-slate-600">
                    STATEMENT OF ACCOUNT / SALES INVOICE
                  </div>
                </div>
              </div>

              {/* Single Source of Truth Guarantee Banner */}
              <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-3xl text-xs text-teal-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-teal-900">
                  <ShieldCheck className="w-4 h-4 text-teal-700" />
                  <span>সেন্ট্রাল ডাটাবেস গ্যারান্টি</span>
                </div>
                <p className="text-[11px] text-teal-900/80 leading-relaxed">
                  এই সেটিংস পরিবর্তন করলে সফটওয়্যারের কোথাও কোনো পুরোনো নাম অবশিষ্ট থাকবে না। সাইডবার, ইনভয়েস প্রিভিউ, লেজার, হোয়াটসঅ্যাপ শেয়ারিং ও ইমেইল ড্রাফট সরাসরি এই একই কেন্দ্রীয় অবজেক্ট থেকে তথ্য সংগ্রহ করে।
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              কোম্পানি প্রোফাইল সংরক্ষণ করুন
            </button>
          </div>
        </form>
      )}

      {/* TAB 2.5: PDF INVOICE & REPORT CONFIGURATION */}
      {activeTab === 'PDF_CONFIG' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-teal-700" />
                <h3 className="font-bold text-slate-900 text-sm">
                  PDF ইনভয়েস ও রিপোর্ট কনফিগারেশন
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">প্রিন্টেড ডকুমেন্টের ভিজ্যুয়াল আউটপুট কন্ট্রোল</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <label className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl cursor-pointer transition-colors">
                <div>
                  <div className="text-sm font-bold text-slate-800">প্রতিষ্ঠানের ঠিকানা (Address)</div>
                  <div className="text-xs text-slate-500 mt-1">ইনভয়েস ও রেকর্ডে ঠিকানা প্রদর্শন করুন</div>
                </div>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={pdfConfig.showAddress} onChange={(e) => setPdfConfig({...pdfConfig, showAddress: e.target.checked})} />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </div>
              </label>

              <label className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl cursor-pointer transition-colors">
                <div>
                  <div className="text-sm font-bold text-slate-800">যোগাযোগের তথ্য (Phone & Email)</div>
                  <div className="text-xs text-slate-500 mt-1">কন্টাক্ট নম্বর ও ইমেইল প্রিন্টে দেখান</div>
                </div>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={pdfConfig.showContact} onChange={(e) => setPdfConfig({...pdfConfig, showContact: e.target.checked})} />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </div>
              </label>

              <label className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl cursor-pointer transition-colors">
                <div>
                  <div className="text-sm font-bold text-slate-800">ট্যাক্স ও লাইসেন্স (BIN/TIN)</div>
                  <div className="text-xs text-slate-500 mt-1">সরকারি রেজিস্ট্রেশন নম্বর প্রিন্টে দেখান</div>
                </div>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={pdfConfig.showTaxId} onChange={(e) => setPdfConfig({...pdfConfig, showTaxId: e.target.checked})} />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </div>
              </label>
              
              <label className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl cursor-pointer transition-colors">
                <div>
                  <div className="text-sm font-bold text-slate-800">কোম্পানি লোগো (Logo)</div>
                  <div className="text-xs text-slate-500 mt-1">ডকুমেন্ট হেডারে ব্র্যান্ড লোগো প্রিন্ট করুন</div>
                </div>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={pdfConfig.showLogo} onChange={(e) => setPdfConfig({...pdfConfig, showLogo: e.target.checked})} />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-8 py-3.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-2xl shadow-xs transition-colors"
            >
              <Save className="w-5 h-5" />
              সেটিংস সেভ করুন
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: FINANCIAL & TAX POLICY */}
      {activeTab === 'FINANCIAL' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-700" />
                <h3 className="font-bold text-slate-900 text-sm">
                  ভ্যাট, ট্রেড লাইসেন্স ও আর্থিক কনফিগারেশন
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">ইনভয়েস ট্যাক্সেশন ও অডিট রেগুলেশন</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  BIN / VAT রেজিস্ট্রেশন নং
                </label>
                <input
                  type="text"
                  value={formData.binVatNo}
                  onChange={e => handleInputChange('binVatNo', e.target.value)}
                  placeholder="BIN-002847194-0102"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  TIN (টিন) নম্বর
                </label>
                <input
                  type="text"
                  value={formData.tinNo || ''}
                  onChange={e => handleInputChange('tinNo', e.target.value)}
                  placeholder="TIN-481920481921"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ট্রেড লাইসেন্স নম্বর (Trade License No)
                </label>
                <input
                  type="text"
                  value={formData.tradeLicenseNo}
                  onChange={e => handleInputChange('tradeLicenseNo', e.target.value)}
                  placeholder="TRAD/DNCC/049182/2024"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <BadgePercent className="w-3.5 h-3.5 text-slate-500" />
                  ডিফল্ট ভ্যাট হার (Default VAT %)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.defaultVatPercent}
                  onChange={e => handleInputChange('defaultVatPercent', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">বিক্রয় চালানে প্রযোজ্য প্রমিত ভ্যাট %</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-slate-500" />
                  মুদ্রা প্রতীক (Currency Symbol)
                </label>
                <input
                  type="text"
                  value={formData.currencySymbol}
                  onChange={e => handleInputChange('currencySymbol', e.target.value)}
                  placeholder="৳"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">যেমন: ৳, $, €, ইত্যাদি</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  প্রারম্ভিক ক্যাশ ইন হ্যান্ড ব্যালেন্স (Opening Cash)
                </label>
                <input
                  type="number"
                  value={formData.cashInHandBalance}
                  onChange={e => handleInputChange('cashInHandBalance', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">ক্যাশ কাউন্টার / মূল ভল্ট উদ্বৃত্ত</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              ট্যাক্স ও আর্থিক সেটিংস সংরক্ষণ করুন
            </button>
          </div>
        </form>
      )}

      {/* TAB: MULTI-CURRENCY */}
      {activeTab === 'CURRENCY' && (
        <CurrencySettingsPanel />
      )}

      {/* TAB: WORKSPACE INTEGRATIONS */}
      {activeTab === 'WORKSPACE' && (
        <WorkspaceIntegrationPanel />
      )}

      {/* TAB 3: BACKUP & DATABASE MANAGEMENT */}
      {activeTab === 'BACKUP' && (
        <div className="space-y-6">
          {/* Drive Notification Banner */}
          {driveNotification && (
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-semibold ${
                driveNotification.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : driveNotification.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {driveNotification.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                {driveNotification.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />}
                {driveNotification.type === 'info' && <Info className="w-5 h-5 text-blue-600 shrink-0" />}
                <span>{driveNotification.message}</span>
              </div>
              <button
                onClick={() => setDriveNotification(null)}
                className="p-1 hover:bg-black/5 rounded-lg text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* PREMIER SECTION: GOOGLE DRIVE CLOUD AUTO-BACKUP HUB */}
          <div className="bg-linear-to-br from-white to-slate-50 p-6 rounded-3xl border-2 border-teal-200 shadow-xs space-y-5 relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-teal-800 text-white flex items-center justify-center shadow-md shrink-0">
                  <Cloud className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-900 text-base">
                      Google Drive স্বয়ংক্রিয় ক্লাউড ব্যাকআপ সিস্টেম (Cloud Auto-Backup)
                    </h3>
                    {isDriveConnected ? (
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-black rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        সংযুক্ত (Connected)
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-full">
                        বিচ্ছিন্ন (Disconnected)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Google Sign-In ও Drive API-র মাধ্যমে সুরক্ষিত ফোল্ডারে (<strong className="font-mono text-teal-800">{BACKUP_FOLDER_NAME}</strong>) দৈনিক অটো-ব্যাকআপ ও রিসেট-পূর্ববর্তী বাধ্যতামূলক ব্যাকআপ।
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap self-start lg:self-center">
                {!isDriveConnected ? (
                  <button
                    id="btn-connect-google-drive"
                    onClick={handleConnectDrive}
                    disabled={isConnectingDrive}
                    className="flex items-center gap-2 px-4 py-2.5 bg-teal-800 hover:bg-teal-900 disabled:bg-teal-800/70 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    {isConnectingDrive ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CloudUpload className="w-4 h-4" />
                    )}
                    <span>{isConnectingDrive ? 'সংযুক্ত হচ্ছে...' : 'Connect Google Drive for Backup'}</span>
                  </button>
                ) : (
                  <>
                    <button
                      id="btn-manual-drive-backup"
                      onClick={handleManualDriveBackup}
                      disabled={isBackingUpToDrive}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-teal-800 hover:bg-teal-900 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                      title="Google Drive-এ বর্তমান ডাটার তাৎক্ষণিক ক্লাউড ব্যাকআপ নিন"
                    >
                      {isBackingUpToDrive ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CloudUpload className="w-4 h-4" />
                      )}
                      <span>{isBackingUpToDrive ? 'ব্যাকআপ আপলোড হচ্ছে...' : 'Backup Now (এখনই ব্যাকআপ নিন)'}</span>
                    </button>

                    <button
                      id="btn-refresh-drive-backups"
                      onClick={() => fetchDriveBackups()}
                      disabled={isLoadingDriveBackups}
                      className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                      title="Google Drive ব্যাকআপ তালিকা রিফ্রেশ করুন"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoadingDriveBackups ? 'animate-spin text-teal-700' : ''}`} />
                    </button>

                    <button
                      id="btn-disconnect-google-drive"
                      onClick={disconnectDrive}
                      className="px-3 py-2.5 border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold text-xs rounded-xl transition-colors"
                      title="Google Drive সংযোগ বিচ্ছিন্ন করুন"
                    >
                      সংযোগ বিচ্ছিন্ন
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Account Details & Status Bar */}
            {isDriveConnected && driveUser && (
              <div className="p-4 bg-white rounded-2xl border border-teal-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  {driveUser.photoURL ? (
                    <img
                      src={driveUser.photoURL}
                      alt={driveUser.displayName}
                      className="w-9 h-9 rounded-full object-cover border border-teal-300"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-sm">
                      {driveUser.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-slate-900">{driveUser.displayName}</div>
                    <div className="text-[11px] font-mono text-slate-500">{driveUser.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-[11px] text-slate-600 flex-wrap">
                  <div>
                    সংরক্ষণ ফোল্ডার: <strong className="font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded">{BACKUP_FOLDER_NAME}</strong>
                  </div>
                  <div>
                    সর্বশেষ ড্রাইভ ব্যাকআপ:{' '}
                    <strong className="text-slate-800">
                      {lastDriveBackupTime ? formatDateTime(lastDriveBackupTime) : 'এখনো নেওয়া হয়নি'}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* Automation Rules Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-1">
                <div className="font-bold text-teal-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>১. প্রতিদিন স্বয়ংক্রিয় ব্যাকআপ</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  প্রতিদিন রাত ১২টায় বা দিনের প্রথম লগইনে সম্পূর্ণ Firestore ও ব্যবসায়িক তথ্যের স্ন্যাপশট ক্লাউডে আপলোড হয়।
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-1">
                <div className="font-bold text-teal-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-700" />
                  <span>২. প্রি-রিসেট বাধ্যতামূলক সুরক্ষা</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Hard Reset বা Go-Live এর ঠিক পূর্বে ড্রাইভ ব্যাকআপ বাধ্যতামূলক। ব্যাকআপ ব্যর্থ হলে রিসেট প্রক্রিয়া স্বয়ংক্রিয়ভাবে থেমে যাবে।
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-1">
                <div className="font-bold text-teal-900 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-blue-600" />
                  <span>৩. ফোল্ডার-নির্দিষ্ট পারমিশন</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Google Drive API শুধু <span className="font-mono text-teal-800">drive.file</span> স্কোপ ব্যবহার করে—আপনার অন্য কোনো ফাইলে অ্যাপটি হাত দেবে না।
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-1">
                <div className="font-bold text-teal-900 flex items-center gap-1.5">
                  <Archive className="w-4 h-4 text-indigo-600" />
                  <span>৪. অপরিবর্তনীয় হিস্ট্রি</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  পুরনো কোনো ব্যাকআপ ফাইল অটো ডিলিট হবে না—ড্রাইভে সব তারিখের স্ন্যাপশট জমা থাকবে, ১-ক্লিকে রিস্টোর করা যাবে।
                </p>
              </div>
            </div>

            {/* Google Drive Backups List */}
            {isDriveConnected && (
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-teal-700" />
                    <h4 className="font-bold text-slate-900 text-xs">
                      Google Drive-এ রক্ষিত ব্যাকআপ ফাইলসমূহ ({driveBackupsList.length} টি)
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    সর্বশেষ তারিখ ও সময় অনুসারে সাজানো
                  </span>
                </div>

                {isLoadingDriveBackups ? (
                  <div className="py-8 text-center text-slate-400 flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-teal-700" />
                    <span className="text-xs">Google Drive থেকে ব্যাকআপ তালিকা লোড হচ্ছে...</span>
                  </div>
                ) : driveBackupsList.length === 0 ? (
                  <div className="py-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 space-y-2">
                    <Cloud className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                    <p className="text-xs">
                      <strong className="text-slate-600">{BACKUP_FOLDER_NAME}</strong> ফোল্ডারে এখনো কোনো ব্যাকআপ ফাইল নেই।
                    </p>
                    <button
                      onClick={handleManualDriveBackup}
                      disabled={isBackingUpToDrive}
                      className="px-4 py-1.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs"
                    >
                      প্রথম ব্যাকআপ এখনই নিন
                    </button>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 max-h-96 overflow-y-auto">
                    {driveBackupsList.map(file => {
                      const isPreReset = file.name.startsWith('PreReset_');
                      const isPreGoLive = file.name.startsWith('PreGoLive_');
                      const isDaily = file.name.startsWith('Backup_') && !isPreReset && !isPreGoLive;

                      return (
                        <div
                          key={file.id}
                          className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-xs text-slate-900 truncate">
                                {file.name}
                              </span>
                              {isPreReset && (
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-md">
                                  হার্ড রিসেট পূর্ববর্তী
                                </span>
                              )}
                              {isPreGoLive && (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded-md">
                                  গো-লাইভ পূর্ববর্তী
                                </span>
                              )}
                              {isDaily && (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                                  স্বয়ংক্রিয় দৈনিক
                                </span>
                              )}
                              {!isPreReset && !isPreGoLive && !isDaily && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-md">
                                  ম্যানুয়াল ব্যাকআপ
                                </span>
                              )}
                              <span className="text-[10px] font-mono text-slate-400">
                                {file.sizeKB} KB
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-slate-500">
                              <span>সংরক্ষণ সময়: <strong className="font-mono text-slate-700">{formatDateTime(file.createdTime)}</strong></span>
                              {file.description && (
                                <>
                                  <span>•</span>
                                  <span className="text-slate-600 truncate">{file.description}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                            <button
                              onClick={() =>
                                setRestoreConfirmModal({
                                  type: 'DRIVE',
                                  driveFile: file,
                                })
                              }
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs rounded-xl border border-teal-200 transition-colors"
                              title="Google Drive-এর এই ব্যাকআপটি দিয়ে সিস্টেম রিস্টোর করুন"
                            >
                              <RefreshCw className="w-3.5 h-3.5 text-teal-700" />
                              <span>রিস্টোর করুন</span>
                            </button>

                            <button
                              onClick={() => handleDownloadDriveFile(file)}
                              className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                              title="কম্পিউটারে JSON ফাইল ডাউনলোড করুন"
                            >
                              <Download className="w-4 h-4" />
                            </button>

                            {file.webViewLink && (
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                                title="Google Drive-এ ফাইলটি সরাসরি দেখুন"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
          
            {/* Firebase Daily Backup Status */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                  <CloudLightning className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">অটোমেটেড ফায়ারবেস ব্যাকআপ (Firebase Storage Backup)</h3>
                  <p className="text-xs text-slate-500">প্রতিদিন ডাটাবেসের একটি কপি ফায়ারবেস স্টোরেজে সেভ হয়</p>
                </div>
              </div>
              <div className="mt-4 p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase mb-1">স্ট্যাটাস</div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" /> অ্যাক্টিভ
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-bold text-slate-500 uppercase mb-1">সর্বশেষ ব্যাকআপ</div>
                  <div className="text-xs font-bold text-slate-700">
                    {lastFirebaseBackupTime ? formatDateTime(lastFirebaseBackupTime) : (localStorage.getItem('food_erp_last_firebase_backup_date') || 'আজ কোনো ব্যাকআপ হয়নি')}
                  </div>
                </div>
              </div>
            </div>

          {/* Top Row: Backup & Restore Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: JSON Export & Upload Restore */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <Database className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-sm">ডেটা ব্যাকআপ ও এক্সটার্নাল রিস্টোর</h3>
                </div>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  JSON Export / Import
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                আপনার সম্পূর্ণ ব্যবসায়িক হিসাব, সেলস ইনভয়েস, পারচেজ, স্টক, ব্যাচ, গ্রাহক ও কর্মচারীদের ডেটা এক ক্লিকে অফলাইন ব্যাকআপ হিসেবে ডাউনলোড করে নিরাপদ ড্রাইভে রাখতে পারেন অথবা পুরোনো ব্যাকআপ ফাইল থেকে রিস্টোর করতে পারেন।
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  id="btn-download-backup-json"
                  onClick={handleDownloadBackup}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  <Download className="w-4 h-4" />
                  ফুল ব্যাকআপ ডাউনলোড (JSON)
                </button>

                <button
                  id="btn-upload-restore-backup"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border border-indigo-200 hover:bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  ফাইল থেকে রিস্টোর (.json, .enc)
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".json,.enc"
                  className="hidden"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <HardDrive className="w-4 h-4 text-slate-400" />
                  <span>লোকাল স্টোরেজ স্ট্যাটাস:</span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  অটো-সেভ সক্রিয় (Active)
                </span>
              </div>
            </div>

            {/* Card 2: Manual Instant Snapshot */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <Archive className="w-5 h-5 text-teal-700" />
                  <h3 className="font-bold text-slate-900 text-sm">ইন-অ্যাপ স্ন্যাপশট আর্কাইভ</h3>
                </div>
                <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                  Snapshot Engine
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                কোনো বড় পরিবর্তন বা এডিটের পূর্বে ব্রাউজারের সংরক্ষিত ব্যাকআপ আর্কাইভে তৎক্ষণাৎ একটি পূর্ণাঙ্গ সিস্টেম স্ন্যাপশট সংরক্ষণ করে রাখতে পারেন। যেকোনো মুহূর্তে ১-ক্লিকে এখান থেকে পূর্বের অবস্থায় রিস্টোর করা সম্ভব।
              </p>

              <div className="pt-2">
                <button
                  id="btn-create-snapshot"
                  onClick={() => setShowSnapshotModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  <Archive className="w-4 h-4" />
                  নতুন স্ন্যাপশট তৈরি ও সংরক্ষণ করুন
                </button>
              </div>

              <div className="p-3 bg-teal-50/70 rounded-xl border border-teal-200 flex items-start gap-2 text-[11px] text-teal-950">
                <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <span>
                  সংরক্ষিত স্ন্যাপশটগুলো নিচের ব্যাকআপ আর্কাইভে জমা থাকবে এবং ব্রাউজার ক্যাশে নিরাপদভাবে এনকোডেড থাকবে।
                </span>
              </div>
            </div>
          </div>

          {/* Section: Internal Backup Archive List */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Archive className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    ব্যাকআপ আর্কাইভ তালিকা (Internal Backup Archive)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    স্বয়ংক্রিয় ও ম্যানুয়াল সংরক্ষিত স্ন্যাপশট থেকে যেকোনো মুহূর্তে ১-ক্লিকে (কনফার্মেশন সহ) রিস্টোর করুন
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
                  মোট স্ন্যাপশট: {backupArchive.length} টি
                </span>
              </div>
            </div>

            {backupArchive.length === 0 ? (
              <div className="py-10 text-center text-slate-400 space-y-2">
                <Archive className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
                <p className="text-xs">বর্তমানে কোনো অভ্যন্তরীণ ব্যাকআপ স্ন্যাপশট সংরক্ষিত নেই।</p>
                <p className="text-[11px] text-slate-400">
                  উপরের "নতুন স্ন্যাপশট তৈরি" বাটন অথবা হার্ড রিসেটের সময় স্বয়ংক্রিয় স্ন্যাপশট এখানে জমা হবে।
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {backupArchive.map(item => {
                  const isAutoPreReset = item.type === 'AUTO_PRE_HARD_RESET';
                  return (
                    <div
                      key={item.id}
                      className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 px-3 rounded-2xl transition-colors"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-slate-900">{item.label}</span>
                          {isAutoPreReset ? (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-md flex items-center gap-1">
                              <AlertOctagon className="w-3 h-3 text-rose-600" />
                              অটো-ব্যাকআপ (হার্ড রিসেট পূর্ববর্তী)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-md flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-blue-600" />
                              ম্যানুয়াল স্ন্যাপশট
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-slate-400">
                            {item.fileSizeKB} KB
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                          <span>তৈরির সময়: <strong className="font-mono text-slate-700">{formatDateTime(item.timestamp)}</strong></span>
                          <span>•</span>
                          <span>কর্তৃক: <strong className="text-slate-700">{item.triggeredBy}</strong></span>
                        </div>

                        {/* Record count pills */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium">
                            সেলস: <strong>{item.recordSummary.salesCount}</strong>
                          </span>
                          <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium">
                            পারচেজ: <strong>{item.recordSummary.purchasesCount}</strong>
                          </span>
                          <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium">
                            পণ্য: <strong>{item.recordSummary.productsCount}</strong>
                          </span>
                          <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium">
                            কাস্টমার: <strong>{item.recordSummary.customersCount}</strong>
                          </span>
                          <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium">
                            সাপ্লায়ার: <strong>{item.recordSummary.suppliersCount}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                        <button
                          onClick={() =>
                            setRestoreConfirmModal({
                              type: 'ARCHIVE',
                              archiveItem: item,
                            })
                          }
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs rounded-xl border border-teal-200 transition-colors"
                          title="এই ব্যাকআপটি সিস্টেমে রিস্টোর করুন"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-teal-700" />
                          <span>রিস্টোর করুন</span>
                        </button>

                        <button
                          onClick={() => handleDownloadArchiveItem(item)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-semibold transition-colors"
                          title="JSON ফাইল ডাউনলোড করুন"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>JSON</span>
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`আপনি কি নিশ্চিত যে [${item.label}] স্ন্যাপশটটি মুছে ফেলতে চান?`)) {
                              deleteFromBackupArchive(item.id);
                            }
                          }}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                          title="আর্কাইভ থেকে মুছুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* DANGER ZONE (RESTRICTED TO DEVELOPER ONLY) */}
          {isDeveloper && (
            <div className="bg-rose-50/50 rounded-3xl border-2 border-rose-300 p-6 space-y-4 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-rose-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shrink-0">
                    <AlertOctagon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-rose-950 text-base">
                        ⚠️ Danger Zone (সিস্টেম ফ্যাক্টরি হার্ড রিসেট)
                      </h3>
                      <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-black rounded-md uppercase tracking-wider">
                        DEVELOPER ONLY
                      </span>
                    </div>
                    <p className="text-xs text-rose-800/80 mt-0.5">
                      শুধুমাত্র Developer রোলের অ্যাকাউন্ট এই অপশন অ্যাক্সেস করতে পারবে (Admin সহ অন্যরা এটি দেখতে পারবে না)।
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
                  <button
                    id="btn-open-go-live-modal"
                    onClick={handleOpenGoLiveModal}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-all hover:shadow-amber-600/20"
                    title="স্যাম্পল ট্রানজ্যাকশন ও টেস্টিং ডেটা মুছে লাইভ অপারেশনের জন্য রেডি করুন (পণ্য, কাস্টমার, সাপ্লায়ার ও সেটিংস অক্ষত থাকবে)"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>গো-লাইভ ক্লিন (Go-Live Clean)</span>
                  </button>

                  <button
                    id="btn-open-hard-reset-modal"
                    onClick={handleOpenHardResetModal}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all hover:shadow-rose-600/20"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>হার্ড রিসেট উইজার্ড (Hard Reset)</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-rose-950/90 pt-1">
                <div className="p-3 bg-white/80 rounded-2xl border border-rose-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-900">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>১. সম্পূর্ণ ডেটা ক্লিন</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    সমস্ত সেলস, পারচেজ, স্টক, ভাউচার, হিসাব-নিকাশ ও ট্রানজ্যাকশন ডেটা মুছে ফ্যাক্টরি অবস্থায় যাবে।
                  </p>
                </div>

                <div className="p-3 bg-white/80 rounded-2xl border border-rose-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-900">
                    <Download className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>২. স্বয়ংক্রিয় অটো-ব্যাকআপ</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    রিসেট হওয়ার ঠিক পূর্ব মুহূর্তে সম্পূর্ণ ডেটাবেজ JSON আপনার কম্পিউটারে ডাউনলোড ও আর্কাইভে সেভ হবে।
                  </p>
                </div>

                <div className="p-3 bg-white/80 rounded-2xl border border-rose-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-900">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>৩. ৩-ধাপের ভেরিফিকেশন</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    সতর্কবার্তা সম্মতি, "RESET" টেক্সট ইনপুট এবং Developer পাসওয়ার্ড ভেরিফিকেশনের পরই কেবল রিসেট কার্যকর হবে।
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Users & Roles Management Overview */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    ব্যবহারকারী ও অ্যাক্সেস পারমিশন (User Accounts & Roles)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    সিস্টেম ইউজারদের আইডি ও রোল কনফিগারেশন ওভারভিউ
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModule('USERS_MANAGEMENT')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-colors shadow-2xs self-start sm:self-auto"
              >
                <span>সম্পূর্ণ ইউজার ম্যানেজমেন্ট ও পাসওয়ার্ড রিসেট</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {users
                .filter(u => currentUser?.role === 'DEVELOPER' || u.role !== 'DEVELOPER')
                .map(u => (
                  <div
                    key={u.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-900">{u.username}</span>
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-md text-[10px]">
                        {u.role}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-800">{u.name}</div>
                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 border-t border-slate-200/60">
                      <span className="flex items-center gap-1">
                        <Lock className="w-3 h-3 text-slate-400" />
                        পাসওয়ার্ড: ••••••••
                      </span>
                      <span>{u.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create Manual Snapshot */}
      {showSnapshotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-teal-700" />
                <h4 className="font-bold text-slate-900 text-sm">নতুন সিস্টেম স্ন্যাপশট তৈরি</h4>
              </div>
              <button
                onClick={() => setShowSnapshotModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSnapshotSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  স্ন্যাপশট লেবেল বা বিবরণ
                </label>
                <input
                  type="text"
                  value={snapshotLabel}
                  onChange={e => setSnapshotLabel(e.target.value)}
                  placeholder={`যেমন: মাস শেষের অডিট পূর্ববর্তী স্ন্যাপশট (${new Date().toLocaleDateString('bn-BD')})`}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  ফাঁকা রাখলে বর্তমান তারিখ ও সময় দিয়ে স্বয়ংক্রিয় নাম তৈরি হবে।
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSnapshotModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-xl shadow-xs transition-colors"
                >
                  স্ন্যাপশট সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Restore Confirmation */}
      {restoreConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">
                  ডেটাবেজ রিস্টোর নিশ্চিতকরণ (Restore Confirmation)
                </h4>
                <p className="text-xs text-slate-500">
                  {restoreConfirmModal.type === 'FILE'
                    ? `এক্সটার্নাল ফাইল: ${restoreConfirmModal.fileName}`
                    : `আর্কাইভ স্ন্যাপশট: ${restoreConfirmModal.archiveItem?.label}`}
                </p>
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950 space-y-2">
              <p className="font-bold">⚠️ সতর্কবার্তা:</p>
              <p className="text-[11px] leading-relaxed">
                এই ব্যাকআপটি রিস্টোর করলে বর্তমান সিস্টেমের সেলস, পারচেজ, স্টক এবং লেজার এই ব্যাকআপের ডেটা দ্বারা প্রতিস্থাপিত হবে। রিস্টোর সম্পন্ন হওয়ার সাথে সাথে পেজটি পুনরায় লোড হবে।
              </p>
            </div>

            {restoreConfirmModal.type === 'ARCHIVE' && restoreConfirmModal.archiveItem && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                <div className="font-bold text-slate-700">স্ন্যাপশট ডেটা বিবরণ:</div>
                <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600">
                  <div>বিক্রয়: <strong>{restoreConfirmModal.archiveItem.recordSummary.salesCount}</strong> টি</div>
                  <div>ক্রয়: <strong>{restoreConfirmModal.archiveItem.recordSummary.purchasesCount}</strong> টি</div>
                  <div>পণ্য: <strong>{restoreConfirmModal.archiveItem.recordSummary.productsCount}</strong> টি</div>
                  <div>কাস্টমার: <strong>{restoreConfirmModal.archiveItem.recordSummary.customersCount}</strong> জন</div>
                  <div>সাপ্লায়ার: <strong>{restoreConfirmModal.archiveItem.recordSummary.suppliersCount}</strong> জন</div>
                  <div>ইউজার: <strong>{restoreConfirmModal.archiveItem.recordSummary.usersCount}</strong> জন</div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRestoreConfirmModal(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs"
              >
                বাতিল
              </button>
              <button
                type="button"
                id="btn-confirm-restore"
                onClick={handleConfirmRestore}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors"
              >
                হ্যাঁ, রিস্টোর সম্পন্ন করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: GO-LIVE CLEAN (DANGER ZONE) */}
      {showGoLiveModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 border border-amber-200 animate-in fade-in zoom-in-95 space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-amber-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">
                    গো-লাইভ ক্লিয়ারেন্স উইজার্ড (Go-Live Clean)
                  </h4>
                  <p className="text-xs text-amber-700 font-semibold">
                    {goLiveStep === 1 && 'ধাপ ১/২: গো-লাইভ ক্লিয়ারেন্সের শর্ত ও নিরাপত্তা'}
                    {goLiveStep === 2 && 'ধাপ ২/২: কনফার্মেশন ও ডেভেলপার পাসওয়ার্ড যাচাই'}
                    {goLiveStep === 'SUCCESS' && 'গো-লাইভ প্রস্তুতি সফলভাবে সম্পন্ন'}
                  </p>
                </div>
              </div>

              {goLiveStep !== 'SUCCESS' && (
                <button
                  onClick={() => setShowGoLiveModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* STEP 1: WARNING & SCOPE EXPLANATION */}
            {goLiveStep === 1 && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-950 space-y-3">
                  <div className="font-bold text-sm text-amber-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>টেস্টিং ও ডেমো লেনদেন মুছে লাইভ ব্যবসার জন্য রেডি করুন</span>
                  </div>

                  <div className="space-y-2 text-[11px] text-amber-900/90">
                    <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200 space-y-1">
                      <strong className="text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        যা অপরিবর্তিত ও সুরক্ষিত থাকবে (Master Data):
                      </strong>
                      <p className="text-slate-600">
                        সমস্ত পণ্য তালিকা (Products), কাস্টমার ও সাপ্লায়ারদের তথ্য, ব্যাংক/ক্যাশ একাউন্টস, কোম্পানির সেটিংস ও ইউজার একাউন্টসমূহ।
                      </p>
                    </div>

                    <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200 space-y-1">
                      <strong className="text-rose-800 flex items-center gap-1">
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        যা ক্লিয়ার বা শূন্য (0) করা হবে (Transactional Data):
                      </strong>
                      <p className="text-slate-600">
                        সমস্ত টেস্টিং সেলস ইনভয়েস, পারচেজ ভাউচার, লেজার ট্রানজ্যাকশন, খরচ ও আয়। পণ্যের স্টক কোয়ান্টিটি 0 তে রিসেট হবে যেন আপনি ফ্রেশ ওপেনিং ব্যালেন্স দিয়ে ব্যবসা শুরু করতে পারেন।
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-amber-200/60 font-semibold text-[11px] text-emerald-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      বাধ্যতামূলক ব্যাকআপ গ্যারান্টি: ক্লিয়ারেন্সের পূর্বেই সিস্টেম স্বয়ংক্রিয়ভাবে একটি পূর্ণাঙ্গ ব্যাকআপ ক্লাউড ও পিসিতে সেভ করবে।
                    </span>
                  </div>
                </div>

                <label className="flex items-start gap-2.5 p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={goLiveAgreeWarning}
                    onChange={e => setGoLiveAgreeWarning(e.target.checked)}
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  <span className="text-[11px] text-slate-700 leading-snug font-medium">
                    আমি নিশ্চিত যে পণ্য ও মাস্টার ডেটা রেখে সমস্ত পূর্ববর্তী টেস্টিং বিক্রয় ও খরচের রেকর্ড মুছে ফ্রেশ ব্যবসা শুরু করতে চাই।
                  </span>
                </label>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowGoLiveModal(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl"
                  >
                    বাতিল
                  </button>
                  <button
                    type="button"
                    disabled={!goLiveAgreeWarning}
                    onClick={() => setGoLiveStep(2)}
                    className="flex items-center gap-1.5 px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl shadow-xs transition-colors"
                  >
                    <span>পরবর্তী ধাপ (ধাপ ২)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: CONFIRMATION TEXT & PASSWORD */}
            {goLiveStep === 2 && (
              <form onSubmit={handleExecuteGoLiveSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ১. কনফার্মেশন শব্দ টাইপ করুন <span className="text-amber-600">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mb-1.5">
                    নিশ্চিতকরণ হিসেবে নিচের বক্সে বড় হাতের অক্ষরে হুবহু <strong className="text-amber-700 font-mono px-1 py-0.5 bg-amber-50 rounded border border-amber-200">GOLIVE</strong> লিখুন:
                  </p>
                  <input
                    type="text"
                    value={goLiveConfirmText}
                    onChange={e => setGoLiveConfirmText(e.target.value.toUpperCase())}
                    placeholder="GOLIVE"
                    autoFocus
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl text-center font-mono font-black tracking-widest text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ২. Developer পাসওয়ার্ড দিন <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={goLiveShowPassword ? 'text' : 'password'}
                      value={goLivePassword}
                      onChange={e => setGoLivePassword(e.target.value)}
                      placeholder="আপনার ডেভেলপার পাসওয়ার্ড"
                      required
                      className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-xl font-mono text-xs focus:bg-white focus:border-amber-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setGoLiveShowPassword(!goLiveShowPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {goLiveShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {goLiveError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{goLiveError}</span>
                  </div>
                )}

                <div className="flex justify-between items-center gap-2 pt-2">
                  <button
                    type="button"
                    disabled={isExecutingGoLive}
                    onClick={() => setGoLiveStep(1)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl"
                  >
                    পূর্ববর্তী ধাপ
                  </button>

                  <button
                    type="submit"
                    disabled={goLiveConfirmText.trim() !== 'GOLIVE' || isExecutingGoLive}
                    className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl shadow-md transition-colors"
                  >
                    {isExecutingGoLive ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>{isExecutingGoLive ? 'প্রক্রিয়াকরণ হচ্ছে...' : 'গো-লাইভ ক্লিয়ারেন্স নিশ্চিত করুন'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* STEP SUCCESS */}
            {goLiveStep === 'SUCCESS' && (
              <div className="space-y-4 text-xs text-center py-2">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-3xl flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h4 className="font-black text-slate-900 text-lg">
                    সিস্টেম সফলভাবে লাইভ অপারেশনের জন্য প্রস্তুত!
                  </h4>
                  <p className="text-slate-500 text-xs max-w-sm mx-auto">
                    সমস্ত স্যাম্পল ও টেস্টিং লেনদেন পরিষ্কার করা হয়েছে। আপনার পণ্য ও কাস্টমার তালিকা সুরক্ষিত আছে।
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-700">
                    <Download className="w-4 h-4" />
                    <span>প্রি-গো-লাইভ স্বয়ংক্রিয় ব্যাকআপ রিপোর্ট:</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    ক্লিয়ারেন্সের পূর্বে সিস্টেম আপনার সমস্ত তথ্যের একটি ব্যাকআপ তৈরি করেছে।
                  </p>
                  {goLiveSuccessData?.driveBackupFile && (
                    <div className="text-[10px] font-mono text-emerald-800 bg-emerald-50 p-2 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Google Drive-এ সংরক্ষিত: {goLiveSuccessData.driveBackupFile.name}</span>
                    </div>
                  )}
                  {goLiveSuccessData?.autoBackupItem && (
                    <div className="text-[10px] font-mono text-slate-500 bg-white p-2 rounded-xl border border-slate-200">
                      <div>আর্কাইভ আইডি: {goLiveSuccessData.autoBackupItem.id}</div>
                      <div>ফাইলের সাইজ: {goLiveSuccessData.autoBackupItem.fileSizeKB} KB</div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowGoLiveModal(false)}
                  className="w-full py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-xl shadow-xs transition-colors"
                >
                  উইন্ডো বন্ধ করুন ও লাইভ সিস্টেমে ফিরুন
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {showHardResetModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 border border-rose-200 animate-in fade-in zoom-in-95 space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <AlertOctagon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-rose-950 text-base">
                    সিস্টেম হার্ড রিসেট (Hard Reset Wizard)
                  </h4>
                  <p className="text-xs text-rose-700 font-semibold">
                    {resetStep === 1 && 'ধাপ ১/৩: সতর্কতা ও শর্তাবলী'}
                    {resetStep === 2 && 'ধাপ ২/৩: কনফার্মেশন টেক্সট ইনপুট'}
                    {resetStep === 3 && 'ধাপ ৩/৩: ডেভেলপার পাসওয়ার্ড রি-অথেন্টিকেশন'}
                    {resetStep === 'SUCCESS' && 'হার্ড রিসেট সফলভাবে সম্পন্ন'}
                  </p>
                </div>
              </div>

              {resetStep !== 'SUCCESS' && (
                <button
                  onClick={() => setShowHardResetModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* STEP 1: WARNING POPUP */}
            {resetStep === 1 && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-rose-950 space-y-2.5">
                  <div className="font-bold text-sm text-rose-900 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>সতর্কতা: এটি সম্পূর্ণ ডেটা মুছে ফেলবে এবং ফ্যাক্টরি অবস্থায় ফিরিয়ে নেবে!</span>
                  </div>
                  <p className="leading-relaxed text-[11px] text-rose-900/90">
                    হার্ড রিসেটের ফলে আপনার বর্তমান সমস্ত বিক্রয় (Sales), ক্রয় (Purchases), স্টক ও ব্যাচ ট্রানজ্যাকশন, লেজার হিসাব, উৎপাদন রেকর্ড, পরিবহন লগ এবং তৈরি করা নতুন একাউন্টগুলো মুছে যাবে।
                  </p>
                  <div className="pt-2 border-t border-rose-200/60 font-semibold text-[11px] text-emerald-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      সুরক্ষা গ্যারান্টি: রিসেট কার্যকর হওয়ার সাথে সাথে সিস্টেম স্বয়ংক্রিয়ভাবে একটি পূর্ণাঙ্গ ব্যাকআপ JSON তৈরি করে আপনার কম্পিউটারে ডাউনলোড করবে এবং অভ্যন্তরীণ ব্যাকআপ আর্কাইভে সংরক্ষণ করবে।
                    </span>
                  </div>
                </div>

                <label className="flex items-start gap-2.5 p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeWarning}
                    onChange={e => setAgreeWarning(e.target.checked)}
                    className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                  />
                  <span className="text-[11px] text-slate-700 leading-snug font-medium">
                    আমি নিশ্চিত যে আমি এই সতর্কবার্তা পড়েছি এবং বুঝতে পারছি যে বর্তমান সমস্ত লেনদেন ডেটা মুছে সিস্টেম ফ্যাক্টরি অবস্থায় চলে যাবে।
                  </span>
                </label>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowHardResetModal(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl"
                  >
                    বাতিল
                  </button>
                  <button
                    type="button"
                    disabled={!agreeWarning}
                    onClick={() => setResetStep(2)}
                    className="flex items-center gap-1.5 px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl shadow-xs transition-colors"
                  >
                    <span>পরবর্তী ধাপ (ধাপ ২)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: CONFIRMATION TEXT INPUT ("RESET") */}
            {resetStep === 2 && (
              <div className="space-y-4 text-xs">
                <p className="text-slate-600 leading-relaxed">
                  অনিচ্ছাকৃত বা ভুলবশত রিসেট রোধ করতে, অনুগ্রহ করে নিশ্চিতকরণ হিসেবে নিচের বক্সে বড় হাতের অক্ষরে হুবহু <strong className="text-rose-600 font-mono text-sm px-1.5 py-0.5 bg-rose-50 border border-rose-200 rounded">RESET</strong> লিখুন:
                </p>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    কনফার্মেশন শব্দ টাইপ করুন <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="input-reset-confirm-text"
                    value={confirmText}
                    onChange={e => setConfirmText(e.target.value.toUpperCase())}
                    placeholder="RESET"
                    autoFocus
                    className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-center font-mono font-black tracking-widest text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none"
                  />
                  {confirmText.trim() === 'RESET' ? (
                    <span className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1 justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      কনফার্মেশন শব্দ সঠিকভাবে মিলেছে
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 text-center block mt-1">
                      হুবহু 'RESET' লিখলে পরবর্তী বাটনে ক্লিক করা যাবে
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetStep(1)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl"
                  >
                    পূর্ববর্তী ধাপ
                  </button>

                  <button
                    type="button"
                    id="btn-goto-step-3"
                    disabled={confirmText.trim() !== 'RESET'}
                    onClick={() => setResetStep(3)}
                    className="flex items-center gap-1.5 px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl shadow-xs transition-colors"
                  >
                    <span>পরবর্তী ধাপ (পাসওয়ার্ড যাচাই)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: DEVELOPER PASSWORD RE-AUTHENTICATION */}
            {resetStep === 3 && (
              <form onSubmit={handleExecuteHardResetSubmit} className="space-y-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <KeyRound className="w-4 h-4 text-indigo-600" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">লগইনরত অ্যাকাউন্ট</span>
                      <span className="font-bold text-slate-800">{currentUser?.name} ({currentUser?.username})</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-700 font-bold rounded text-[10px]">
                    {currentUser?.role}
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Developer অ্যাকাউন্টের বর্তমান পাসওয়ার্ড দিন <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="input-developer-password"
                      value={developerPassword}
                      onChange={e => setDeveloperPassword(e.target.value)}
                      placeholder="আপনার ডেভেলপার পাসওয়ার্ড"
                      autoFocus
                      required
                      className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-xl font-mono text-xs focus:bg-white focus:border-rose-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {resetError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{resetError}</span>
                  </div>
                )}

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                  পাসওয়ার্ড যাচাই নিশ্চিত হলে ব্রাউজারে একটি অটো-ব্যাকআপ ফাইল সরাসরি ডাউনলোড হবে এবং সমস্ত লেনদেন ডেটা ফ্যাক্টরি অবস্থায় রিসেট হবে।
                </div>

                <div className="flex justify-between items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetStep(2)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl"
                  >
                    পূর্ববর্তী ধাপ
                  </button>

                  <button
                    type="submit"
                    id="btn-final-execute-hard-reset"
                    className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>চূড়ান্ত হার্ড রিসেট সম্পন্ন করুন</span>
                  </button>
                </div>
              </form>
            )}

            {/* STEP SUCCESS: CONFIRMATION & AUTO-BACKUP SUMMARY */}
            {resetStep === 'SUCCESS' && (
              <div className="space-y-4 text-xs text-center py-2">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-3xl flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h4 className="font-black text-slate-900 text-lg">
                    সিস্টেম সফলভাবে ফ্যাক্টরি অবস্থায় রিসেট হয়েছে!
                  </h4>
                  <p className="text-slate-500 text-xs max-w-sm mx-auto">
                    সমস্ত সেলস, পারচেজ, স্টক ও লেজার ডেটা ফ্যাক্টরি অবস্থায় ফিরিয়ে নেওয়া হয়েছে।
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-700">
                    <Download className="w-4 h-4" />
                    <span>স্বয়ংক্রিয় ব্যাকআপ সফলভাবে সম্পন্ন:</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    রিসেট পূর্ববর্তী সমস্ত তথ্যের একটি অটো-ব্যাকআপ JSON ফাইল আপনার ডাউনলোড ফোল্ডারে পাঠানো হয়েছে এবং ব্যাকআপ আর্কাইভে নিরাপদে রাখা হয়েছে।
                  </p>
                  {resetSuccessData?.autoBackupItem && (
                    <div className="text-[10px] font-mono text-slate-500 bg-white p-2 rounded-xl border border-slate-200">
                      <div>আর্কাইভ আইডি: {resetSuccessData.autoBackupItem.id}</div>
                      <div>ফাইলের সাইজ: {resetSuccessData.autoBackupItem.fileSizeKB} KB</div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  id="btn-close-hard-reset-success"
                  onClick={() => setShowHardResetModal(false)}
                  className="w-full py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-xl shadow-xs transition-colors"
                >
                  উইন্ডো বন্ধ করুন ও ফ্রেশ সিস্টেমে ফিরুন
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

