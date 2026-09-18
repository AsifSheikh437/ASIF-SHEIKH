import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 transition"
      >
        <Download className="w-4 h-4" />
        অ্যাপ ইনস্টল করুন (অ্যাপ ইনস্টল করুন)
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <Download className="w-4 h-4" />
          iOS-এ ইনস্টল করুন
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">iPhone / iPad-এ ইনস্টল করুন</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                ১. সাফারি টুলবারের <strong>Share</strong> বাটনে চাপুন।<br />
                ২. নিচে গিয়ে <strong>Add to Home Screen</strong> চাপুন।
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-lg bg-slate-100 py-2 text-sm font-medium text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
