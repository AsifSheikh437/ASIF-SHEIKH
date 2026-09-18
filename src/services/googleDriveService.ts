import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { DriveBackupFile, GoogleDriveUser } from '../types';

// The requested Google Workspace Scopes
export const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

// Initialize Firebase App instance safely (prevent duplicate initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app); // Exporting auth might be useful, or we can just use the token

// Provider with required scopes
const provider = new GoogleAuthProvider();
SCOPES.forEach(scope => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account',
});

// Cache the access token in memory (NEVER store in localStorage for security compliance)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const getAccessToken = (): string | null => cachedAccessToken;

// Local storage keys for non-sensitive connection metadata
const DRIVE_USER_STORAGE_KEY = 'food_erp_drive_user_meta';
const DRIVE_FOLDER_STORAGE_KEY = 'food_erp_drive_folder_id';
const LAST_AUTO_BACKUP_DATE_KEY = 'food_erp_last_auto_backup_date';
const LAST_BACKUP_TIMESTAMP_KEY = 'food_erp_last_backup_timestamp';

export const BACKUP_FOLDER_NAME = 'Food_ERP_Backups';

/**
 * Initialize Auth State listener
 */
export const initGoogleAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token not in memory (e.g., page refresh)
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Connect to Google Drive via Google Sign-In popup with drive.file scope
 */
export const connectGoogleDrive = async (): Promise<{
  user: User;
  accessToken: string;
  driveUser: GoogleDriveUser;
}> => {
  if (isSigningIn) {
    throw new Error('সাইন-ইন পপআপ ইতিমধ্যে চালু আছে। অনুগ্রহ করে উইন্ডোটি চেক করুন।');
  }

  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error('Google ড্রাইভ অ্যাক্সেস টোকেন পাওয়া যায়নি। পুনরায় সাইন-ইন করুন।');
    }

    cachedAccessToken = credential.accessToken;

    const driveUser: GoogleDriveUser = {
      email: result.user.email || '',
      displayName: result.user.displayName || result.user.email || 'Google User',
      photoURL: result.user.photoURL || undefined,
      connectedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(DRIVE_USER_STORAGE_KEY, JSON.stringify(driveUser));
    } catch {
      // ignore storage failure
    }

    return {
      user: result.user,
      accessToken: cachedAccessToken,
      driveUser,
    };
  } catch (error: any) {
    if (error?.code === 'auth/cancelled-popup-request') {
      console.warn('Google Drive sign-in popup cancelled by user or replaced.');
      throw new Error('পূর্ববর্তী সাইন-ইন রিকোয়েস্ট বাতিল করা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    }
    if (error?.code === 'auth/popup-closed-by-user') {
      console.warn('Google Drive sign-in popup closed by user before completion.');
      throw new Error('Google সাইন-ইন উইন্ডো বন্ধ করা হয়েছে। আপনি পরবর্তীতে যেকোনো সময় Google Drive সংযোগ করতে পারেন।');
    }
    if (error?.code === 'auth/popup-blocked') {
      console.warn('Google Drive sign-in popup was blocked by browser.');
      throw new Error('ব্রাউজার পপআপ ব্লক করেছে। ব্রাউজারের অ্যাড্রেস বার থেকে পপআপ এলাও (Allow) করুন।');
    }
    console.error('Google Drive connection error:', error);
    throw new Error(error?.message || 'Google Drive সংযোগ স্থাপন করতে ব্যর্থ হয়েছে।');
  } finally {
    isSigningIn = false;
  }
};

/**
 * Disconnect Google Drive
 */
export const disconnectGoogleDrive = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch {
    // ignore
  }
  cachedAccessToken = null;
  try {
    localStorage.removeItem(DRIVE_USER_STORAGE_KEY);
    localStorage.removeItem(DRIVE_FOLDER_STORAGE_KEY);
  } catch {
    // ignore
  }
};

/**
 * Retrieve current cached access token
 */
export const getDriveAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Check if Google Drive metadata is stored in localStorage
 */
export const getStoredDriveUser = (): GoogleDriveUser | null => {
  try {
    const raw = localStorage.getItem(DRIVE_USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Check if Google Drive is currently connected with a valid token
 */
export const isDriveSessionActive = (): boolean => {
  return !!cachedAccessToken;
};

/**
 * Get or set the last backup date/time
 */
export const getLastBackupMetadata = (): { lastDate: string | null; lastTimestamp: string | null } => {
  try {
    return {
      lastDate: localStorage.getItem(LAST_AUTO_BACKUP_DATE_KEY),
      lastTimestamp: localStorage.getItem(LAST_BACKUP_TIMESTAMP_KEY),
    };
  } catch {
    return { lastDate: null, lastTimestamp: null };
  }
};

export const recordBackupSuccess = (timestamp: string = new Date().toISOString()): void => {
  try {
    const todayStr = timestamp.substring(0, 10);
    localStorage.setItem(LAST_AUTO_BACKUP_DATE_KEY, todayStr);
    localStorage.setItem(LAST_BACKUP_TIMESTAMP_KEY, timestamp);
  } catch {
    // ignore
  }
};

/**
 * Locate or create the dedicated 'Food_ERP_Backups' folder on Google Drive
 */
export const getOrCreateBackupFolder = async (accessToken: string): Promise<string> => {
  // Check cached folder ID
  const cachedFolderId = localStorage.getItem(DRIVE_FOLDER_STORAGE_KEY);
  if (cachedFolderId) {
    try {
      // Verify the folder still exists and is accessible
      const verifyRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${cachedFolderId}?fields=id,name,trashed`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (verifyRes.ok) {
        const data = await verifyRes.json();
        if (!data.trashed && data.id) {
          return data.id;
        }
      }
    } catch {
      // continue to query by name
    }
  }

  // 1. Search for existing folder by name
  const query = encodeURIComponent(
    `name = '${BACKUP_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  );
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&spaces=drive`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!searchRes.ok) {
    const errText = await searchRes.text();
    throw new Error(`Google Drive ফোল্ডার অনুসন্ধান ব্যর্থ হয়েছে: ${errText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    const folderId = searchData.files[0].id;
    localStorage.setItem(DRIVE_FOLDER_STORAGE_KEY, folderId);
    return folderId;
  }

  // 2. Create the folder if not found
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: BACKUP_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Food ERP System Automatic and Manual Database Backups',
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Google Drive-এ '${BACKUP_FOLDER_NAME}' ফোল্ডার তৈরি করতে ব্যর্থ হয়েছে: ${errText}`);
  }

  const createData = await createRes.json();
  localStorage.setItem(DRIVE_FOLDER_STORAGE_KEY, createData.id);
  return createData.id;
};

/**
 * Helper to generate clear, structured backup file names
 * e.g. Backup_[CompanyName]_2026-09-13_23-59-00.json
 *      PreReset_Backup_[CompanyName]_2026-09-13_23-59-00.json
 *      PreGoLive_Backup_[CompanyName]_2026-09-13_23-59-00.json
 */
export const generateBackupFileName = (
  companyName: string,
  backupType: 'DAILY' | 'PRE_RESET' | 'PRE_GOLIVE' | 'MANUAL' = 'MANUAL'
): string => {
  const cleanName = (companyName || 'FoodERP')
    .replace(/[^\w\u0980-\u09FF]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 24);

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(
    now.getHours()
  )}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

  let prefix = 'Backup';
  if (backupType === 'PRE_RESET') {
    prefix = 'PreReset_Backup';
  } else if (backupType === 'PRE_GOLIVE') {
    prefix = 'PreGoLive_Backup';
  } else if (backupType === 'DAILY') {
    prefix = 'Daily_Backup';
  } else if (backupType === 'MANUAL') {
    prefix = 'Manual_Backup';
  }

  return `${prefix}_${cleanName}_${dateStr}.json`;
};

/**
 * Determine backup type and company name from file name
 */
export const parseBackupFileInfo = (fileName: string): {
  backupType: 'DAILY' | 'PRE_RESET' | 'PRE_GOLIVE' | 'MANUAL';
  companyName?: string;
} => {
  let backupType: 'DAILY' | 'PRE_RESET' | 'PRE_GOLIVE' | 'MANUAL' = 'MANUAL';
  if (fileName.startsWith('PreReset_Backup')) {
    backupType = 'PRE_RESET';
  } else if (fileName.startsWith('PreGoLive_Backup')) {
    backupType = 'PRE_GOLIVE';
  } else if (fileName.startsWith('Daily_Backup')) {
    backupType = 'DAILY';
  } else if (fileName.startsWith('Backup_')) {
    backupType = 'DAILY';
  }

  const parts = fileName.split('_');
  const companyName = parts.length > 2 ? parts[parts.length - 3] : undefined;

  return { backupType, companyName };
};

/**
 * Upload a complete JSON backup to Google Drive with automatic retry logic (3 attempts with backoff)
 */
export const uploadBackupToGoogleDrive = async (params: {
  dataJson: string;
  companyName: string;
  backupType: 'DAILY' | 'PRE_RESET' | 'PRE_GOLIVE' | 'MANUAL';
  description?: string;
  maxRetries?: number;
}): Promise<DriveBackupFile> => {
  const { dataJson, companyName, backupType, description, maxRetries = 3 } = params;

  const accessToken = await getDriveAccessToken();
  if (!accessToken) {
    throw new Error(
      'Google Drive সংযুক্ত নেই অথবা সেশন মেয়াদোত্তীর্ণ হয়েছে। সেটিংস থেকে "Connect Google Drive" সম্পন্ন করুন।'
    );
  }

  const folderId = await getOrCreateBackupFolder(accessToken);
  const fileName = generateBackupFileName(companyName, backupType);

  const fileMetadata = {
    name: fileName,
    parents: [folderId],
    description:
      description ||
      `Food ERP System Backup [${backupType}] for ${companyName} at ${new Date().toISOString()}`,
    mimeType: 'application/json',
  };

  const boundary = '-------FoodERPBackupBoundary9876543210';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(fileMetadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    dataJson +
    closeDelimiter;

  let lastError: Error | null = null;

  // Retry logic with exponential backoff
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,createdTime,description',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google Drive API HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      recordBackupSuccess(result.createdTime || new Date().toISOString());

      const sizeKB = result.size
        ? Math.round((parseInt(result.size, 10) / 1024) * 10) / 10
        : Math.round((new Blob([dataJson]).size / 1024) * 10) / 10;

      return {
        id: result.id,
        name: result.name || fileName,
        size: result.size,
        sizeKB,
        createdTime: result.createdTime || new Date().toISOString(),
        description: result.description,
        backupType,
        companyName,
      };
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`Google Drive upload attempt ${attempt}/${maxRetries} failed:`, lastError.message);

      if (attempt < maxRetries) {
        // Wait with backoff before next attempt: 1.5s, 3s
        await new Promise(resolve => setTimeout(resolve, attempt * 1500));
      }
    }
  }

  throw new Error(
    `Google Drive-এ ব্যাকআপ আপলোড ব্যর্থ হয়েছে (${maxRetries} বার চেষ্টার পরেও): ${
      lastError?.message || 'অজানা ত্রুটি'
    }`
  );
};

/**
 * List all backup files inside 'Food_ERP_Backups' folder on Google Drive
 */
export const listGoogleDriveBackups = async (): Promise<DriveBackupFile[]> => {
  const accessToken = await getDriveAccessToken();
  if (!accessToken) {
    throw new Error(
      'Google Drive সংযুক্ত নেই। ব্যাকআপ তালিকা দেখতে "Connect Google Drive" সম্পন্ন করুন।'
    );
  }

  const folderId = await getOrCreateBackupFolder(accessToken);
  const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,size,createdTime,modifiedTime,description)&orderBy=createdTime desc&pageSize=100`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Drive থেকে ব্যাকআপ ফাইল তালিকা আনতে ব্যর্থ হয়েছে: ${errText}`);
  }

  const data = await response.json();
  const files: any[] = data.files || [];

  return files.map(file => {
    const { backupType, companyName } = parseBackupFileInfo(file.name || '');
    const sizeKB = file.size
      ? Math.round((parseInt(file.size, 10) / 1024) * 10) / 10
      : 0;

    return {
      id: file.id,
      name: file.name,
      size: file.size,
      sizeKB,
      createdTime: file.createdTime,
      modifiedTime: file.modifiedTime,
      description: file.description,
      backupType,
      companyName,
    };
  });
};

/**
 * Download a backup file's raw JSON text content from Google Drive
 */
export const downloadBackupContentFromDrive = async (fileId: string): Promise<string> => {
  const accessToken = await getDriveAccessToken();
  if (!accessToken) {
    throw new Error('Google Drive সংযুক্ত নেই। ফাইল ডাউনলোড করতে লগইন প্রয়োজন।');
  }

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Drive থেকে ফাইল কনটেন্ট ডাউনলোড ব্যর্থ হয়েছে: ${errText}`);
  }

  return await response.text();
};
