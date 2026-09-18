import { encryptData } from "../utils/cryptoUtils";
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import {
  User,
  Role,
  Product,
  BatchItem,
  Customer,
  Supplier,
  Sale,
  Purchase,
  BOMRecipe,
  ProductionRun,
  ProductionCostItem,
  TransportTrip,
  BankAccount,
  ExpenseRecord,
  UtilityRentRecord,
  OwnerWithdrawal,
  OwnerPartner,
  Employee,
  SalaryPayment,
  DepartmentAsset,
  AssetMaintenanceLog,
  AuditLog,
  CompanySettings,
  LedgerEntry,
  PayrollMode,
  StockMovement,
  WastageRecord,
  WastageReason,
  GranularPermission,
  RolePermissionMatrix,
  BackupArchiveItem,
  DriveBackupFile,
  GoogleDriveUser,
  SystemTask,
} from '../types';
import {
  connectGoogleDrive,
  disconnectGoogleDrive,
  getDriveAccessToken,
  getStoredDriveUser,
  isDriveSessionActive,
  uploadBackupToGoogleDrive,
  listGoogleDriveBackups,
  downloadBackupContentFromDrive,
  initGoogleAuth,
  getLastBackupMetadata,
  recordBackupSuccess,
  BACKUP_FOLDER_NAME,
} from '../services/googleDriveService';
import {
  INITIAL_COMPANY_SETTINGS,
  INITIAL_USERS,
  INITIAL_PRODUCTS,
  INITIAL_BATCHES,
  INITIAL_CUSTOMERS,
  INITIAL_SUPPLIERS,
  INITIAL_BANK_ACCOUNTS,
  INITIAL_BOM_RECIPES,
  INITIAL_PRODUCTION_COSTS,
  INITIAL_PRODUCTION_RUNS,
  INITIAL_SALES,
  INITIAL_PURCHASES,
  INITIAL_TRANSPORTS,
  INITIAL_EXPENSES,
  INITIAL_UTILITY_RENT,
  INITIAL_OWNER_WITHDRAWALS,
  INITIAL_OWNER_PARTNERS,
  INITIAL_EMPLOYEES,
  INITIAL_SALARIES,
  INITIAL_ASSETS,
  INITIAL_LEDGERS,
  INITIAL_AUDIT_LOGS,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_WASTAGE_RECORDS,
} from '../data/initialData';

export type ModuleKey =
  | 'DASHBOARD'
  | 'SALES'
  | 'PURCHASE'
  | 'CUSTOMERS_LEDGER'
  | 'SUPPLIERS_LEDGER'
  | 'INVENTORY'
  | 'BATCH_EXPIRY'
  | 'PRODUCTION_BOM'
  | 'PRODUCTION_COST'
  | 'TRANSPORT'
  | 'CASH_BANK'
  | 'EXPENSES'
  | 'UTILITY_RENT'
  | 'OWNER_WITHDRAWAL'
  | 'HR_PAYROLL'
  | 'DEPARTMENT_ASSETS'
  | 'MASTER_LEDGERS'
  | 'REPORTS_PNL'
  | 'MONTHLY_REPORTS'
  | 'USERS_MANAGEMENT'
  | 'DEV_SETTINGS'
  | 'AUDIT_LOGS';

const ROLE_PERMISSIONS: Record<Role, ModuleKey[]> = {
  DEVELOPER: [
    'DASHBOARD', 'SALES', 'PURCHASE', 'CUSTOMERS_LEDGER', 'SUPPLIERS_LEDGER',
    'INVENTORY', 'BATCH_EXPIRY', 'PRODUCTION_BOM', 'PRODUCTION_COST',
    'TRANSPORT', 'CASH_BANK', 'EXPENSES', 'UTILITY_RENT', 'OWNER_WITHDRAWAL',
    'HR_PAYROLL', 'DEPARTMENT_ASSETS', 'MASTER_LEDGERS', 'REPORTS_PNL',
    'MONTHLY_REPORTS', 'USERS_MANAGEMENT', 'DEV_SETTINGS', 'AUDIT_LOGS',
  ],
  ADMIN: [
    'DASHBOARD', 'SALES', 'PURCHASE', 'CUSTOMERS_LEDGER', 'SUPPLIERS_LEDGER',
    'INVENTORY', 'BATCH_EXPIRY', 'PRODUCTION_BOM', 'PRODUCTION_COST',
    'TRANSPORT', 'CASH_BANK', 'EXPENSES', 'UTILITY_RENT', 'OWNER_WITHDRAWAL',
    'HR_PAYROLL', 'DEPARTMENT_ASSETS', 'MASTER_LEDGERS', 'REPORTS_PNL',
    'MONTHLY_REPORTS', 'USERS_MANAGEMENT', 'AUDIT_LOGS',
  ],
  MANAGER: [
    'DASHBOARD', 'SALES', 'PURCHASE', 'CUSTOMERS_LEDGER', 'SUPPLIERS_LEDGER',
    'INVENTORY', 'BATCH_EXPIRY', 'PRODUCTION_BOM', 'PRODUCTION_COST',
    'TRANSPORT', 'CASH_BANK', 'EXPENSES', 'UTILITY_RENT', 'HR_PAYROLL',
    'DEPARTMENT_ASSETS', 'REPORTS_PNL', 'MONTHLY_REPORTS',
  ],
  ACCOUNTANT: [
    'DASHBOARD', 'SALES', 'PURCHASE', 'CUSTOMERS_LEDGER', 'SUPPLIERS_LEDGER',
    'CASH_BANK', 'EXPENSES', 'UTILITY_RENT', 'OWNER_WITHDRAWAL', 'HR_PAYROLL',
    'MASTER_LEDGERS', 'REPORTS_PNL', 'MONTHLY_REPORTS', 'DEPARTMENT_ASSETS',
  ],
  SALES: [
    'DASHBOARD', 'SALES', 'CUSTOMERS_LEDGER', 'INVENTORY', 'TRANSPORT',
  ],
  PURCHASE: [
    'DASHBOARD', 'PURCHASE', 'SUPPLIERS_LEDGER', 'INVENTORY',
  ],
  INVENTORY: [
    'DASHBOARD', 'INVENTORY', 'BATCH_EXPIRY', 'PRODUCTION_BOM', 'PRODUCTION_COST',
  ],
  'HR/PAYROLL': [
    'DASHBOARD', 'HR_PAYROLL', 'DEPARTMENT_ASSETS',
  ],
  VIEWER: [
    'DASHBOARD', 'SALES', 'PURCHASE', 'CUSTOMERS_LEDGER', 'SUPPLIERS_LEDGER',
    'INVENTORY', 'BATCH_EXPIRY', 'PRODUCTION_BOM', 'TRANSPORT', 'CASH_BANK',
    'REPORTS_PNL', 'MONTHLY_REPORTS', 'AUDIT_LOGS',
  ],
};

export const ALL_ERP_MODULES: { key: ModuleKey; label: string; group: string }[] = [
  { key: 'DASHBOARD', label: 'ড্যাশবোর্ড (Dashboard)', group: 'প্রধান নিয়ন্ত্রণ' },
  { key: 'SALES', label: 'সেলস ও ইনভয়েস (Sales)', group: 'সেলস ও কাস্টমার' },
  { key: 'CUSTOMERS_LEDGER', label: 'কাস্টমার লেজার (Customer Accounts)', group: 'সেলস ও কাস্টমার' },
  { key: 'PURCHASE', label: 'পারচেজ ও সাপ্লাই (Purchase Bills)', group: 'সাপ্লাই ও ক্রয়' },
  { key: 'SUPPLIERS_LEDGER', label: 'সাপ্লায়ার লেজার (Vendor Accounts)', group: 'সাপ্লাই ও ক্রয়' },
  { key: 'INVENTORY', label: 'স্টক ও ইনভেন্টরি (Stock & Items)', group: 'ইনভেন্টরি ও কারখানা' },
  { key: 'BATCH_EXPIRY', label: 'ব্যাচ ও মেয়াদ ট্র্যাকিং (Batch & Expiry)', group: 'ইনভেন্টরি ও কারখানা' },
  { key: 'PRODUCTION_BOM', label: 'প্রোডাকশন ও BOM রেসিপি (Production & Recipe)', group: 'ইনভেন্টরি ও কারখানা' },
  { key: 'PRODUCTION_COST', label: 'প্রোডাকশন কস্ট মাস্টার (Unit Costing)', group: 'ইনভেন্টরি ও কারখানা' },
  { key: 'CASH_BANK', label: 'ক্যাশ ও ব্যাংক লেজার (Cash & Bank Books)', group: 'হিসাব ও ব্যাংকিং' },
  { key: 'EXPENSES', label: 'দৈনন্দিন খরচ (Operating Expenses)', group: 'হিসাব ও ব্যাংকিং' },
  { key: 'UTILITY_RENT', label: 'মাসিক বিদ্যুৎ ও ভাড়া (Rent & Utilities)', group: 'হিসাব ও ব্যাংকিং' },
  { key: 'OWNER_WITHDRAWAL', label: 'মালিকের উত্তোলন (Partner Withdrawals)', group: 'হিসাব ও ব্যাংকিং' },
  { key: 'MASTER_LEDGERS', label: 'মাস্টার লেজার্স (General Ledger)', group: 'হিসাব ও ব্যাংকিং' },
  { key: 'TRANSPORT', label: 'পরিবহন ও ট্রিপ লগ (Fleet Logistics)', group: 'লজিস্টিকস ও মানবসম্পদ' },
  { key: 'HR_PAYROLL', label: 'এইচআর ও বেতন শিট (Staff & Payroll)', group: 'লজিস্টিকস ও মানবসম্পদ' },
  { key: 'DEPARTMENT_ASSETS', label: 'কারখানা ও অফিস সম্পদ (Fixed Assets)', group: 'লজিস্টিকস ও মানবসম্পদ' },
  { key: 'REPORTS_PNL', label: 'লাভ-ক্ষতি বিবরণী (Profit & Loss)', group: 'রিপোর্টস ও অডিট' },
  { key: 'MONTHLY_REPORTS', label: 'মাসিক ও প্রোডাক্ট রিপোর্ট (Analytics)', group: 'রিপোর্টস ও অডিট' },
  { key: 'AUDIT_LOGS', label: 'সিস্টেম অডিট ট্রেইল (Security Logs)', group: 'রিপোর্টস ও অডিট' },
  { key: 'USERS_MANAGEMENT', label: 'ইউজার ম্যানেজমেন্ট (Users & Access)', group: 'প্রশাসন ও নিয়ন্ত্রণ' },
  { key: 'DEV_SETTINGS', label: 'সিস্টেম সেটিংস ও ব্যাকআপ (Config)', group: 'প্রশাসন ও নিয়ন্ত্রণ' },
];

export const RBAC_ROLES: Role[] = [
  'ADMIN',
  'MANAGER',
  'ACCOUNTANT',
  'SALES',
  'PURCHASE',
  'INVENTORY',
  'HR/PAYROLL',
  'VIEWER',
];

export const generateDefaultRBACMatrix = (): RolePermissionMatrix => {
  const matrix: RolePermissionMatrix = {};

  RBAC_ROLES.forEach(role => {
    matrix[role] = {};
    const allowedModules = ROLE_PERMISSIONS[role] || [];

    ALL_ERP_MODULES.forEach(mod => {
      const isAllowed = allowedModules.includes(mod.key);

      if (role === 'ADMIN') {
        matrix[role][mod.key] = {
          view: mod.key !== 'DEV_SETTINGS',
          add: mod.key !== 'DEV_SETTINGS',
          edit: mod.key !== 'DEV_SETTINGS',
          delete: mod.key !== 'DEV_SETTINGS',
        };
      } else if (role === 'MANAGER') {
        matrix[role][mod.key] = {
          view: isAllowed,
          add: isAllowed && !['USERS_MANAGEMENT', 'DEV_SETTINGS', 'AUDIT_LOGS'].includes(mod.key),
          edit: isAllowed && !['USERS_MANAGEMENT', 'DEV_SETTINGS', 'AUDIT_LOGS'].includes(mod.key),
          delete: false,
        };
      } else if (role === 'ACCOUNTANT') {
        const canWrite = ['CASH_BANK', 'EXPENSES', 'UTILITY_RENT', 'OWNER_WITHDRAWAL', 'MASTER_LEDGERS', 'CUSTOMERS_LEDGER', 'SUPPLIERS_LEDGER'].includes(mod.key);
        matrix[role][mod.key] = {
          view: isAllowed,
          add: canWrite,
          edit: canWrite,
          delete: false,
        };
      } else if (role === 'SALES') {
        const canWrite = ['SALES', 'CUSTOMERS_LEDGER', 'TRANSPORT'].includes(mod.key);
        matrix[role][mod.key] = {
          view: isAllowed,
          add: canWrite,
          edit: canWrite,
          delete: false,
        };
      } else if (role === 'PURCHASE') {
        const canWrite = ['PURCHASE', 'SUPPLIERS_LEDGER'].includes(mod.key);
        matrix[role][mod.key] = {
          view: isAllowed,
          add: canWrite,
          edit: canWrite,
          delete: false,
        };
      } else if (role === 'INVENTORY') {
        const canWrite = ['INVENTORY', 'BATCH_EXPIRY', 'PRODUCTION_BOM', 'PRODUCTION_COST'].includes(mod.key);
        matrix[role][mod.key] = {
          view: isAllowed,
          add: canWrite,
          edit: canWrite,
          delete: false,
        };
      } else if (role === 'HR/PAYROLL') {
        const canWrite = ['HR_PAYROLL', 'DEPARTMENT_ASSETS'].includes(mod.key);
        matrix[role][mod.key] = {
          view: isAllowed,
          add: canWrite,
          edit: canWrite,
          delete: false,
        };
      } else {
        // VIEWER
        matrix[role][mod.key] = {
          view: isAllowed,
          add: false,
          edit: false,
          delete: false,
        };
      }
    });
  });

  return matrix;
};

interface PnLSummary {
  grossSales: number;
  discountTotal: number;
  netSales: number;
  cogs: number;
  grossProfit: number;
  operatingExpenses: {
    generalExpenses: number;
    utilityRent: number;
    transportCost: number;
    salaries: number;
    wastageLoss: number;
    total: number;
  };
  netProfit: number;
  profitMarginPercent: number;
  totalOperatingExpenses?: number;
  grossProfitMargin?: number;
  netProfitMargin?: number;
  totalDiscounts?: number;
  purchaseTransportTrackingCost?: number;
  purchaseTransportLandedCost?: number;
  salesTransportOpExCost?: number;
  ownerWithdrawalsMemo?: number;
  payrollMode?: PayrollMode;
}

interface ERPContextType {
  // Auth state
  currentUser: User | null;
  activeModule: ModuleKey;
  setActiveModule: (mod: ModuleKey) => void;
  canAccess: (mod: ModuleKey) => boolean;
  login: (username: string, password: string) => { success: boolean; message?: string };
  logout: () => void;
  changePassword: (newPassword: string) => boolean;
  resetPasswordWithRecovery: (username: string, name: string, recoveryCode: string, newPass: string) => { success: boolean; message: string };
  
  // Data state
  settings: CompanySettings;
  updateSettings: (newSettings: Partial<CompanySettings>) => void;
  users: User[];
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => { success: boolean; error?: string };
  updateUser: (id: string, update: Partial<User>) => { success: boolean; error?: string };
  deleteUser: (id: string) => { success: boolean; error?: string };
  deactivateUser: (id: string, reason?: string) => { success: boolean; error?: string };
  activateUser: (id: string) => { success: boolean; error?: string };
  resetUserPassword: (targetUserId: string, newPassword: string) => { success: boolean; error?: string };
  rolePermissionsMatrix: RolePermissionMatrix;
  updateRolePermissionsMatrix: (newMatrix: RolePermissionMatrix) => void;
  resetRolePermissionsMatrixToDefault: () => void;
  hasPermission: (mod: ModuleKey, action: 'view' | 'add' | 'edit' | 'delete') => boolean;
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, update: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  batches: BatchItem[];
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'totalBilled' | 'totalPaid' | 'currentDue'>) => Customer;
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'totalPurchased' | 'totalPaid' | 'currentPayable'>) => Supplier;
  bankAccounts: BankAccount[];
  sales: Sale[];
  addSale: (saleData: Omit<Sale, 'id' | 'invoiceNo'>) => { success: boolean; invoiceNo?: string; error?: string };
  updateSaleWorkflow: (saleId: string, updates: Partial<Sale>) => { success: boolean; error?: string };
  toggleTransactionVisualStatus: (id: string, type: 'SALE' | 'PURCHASE') => void;
  purchases: Purchase[];
  addPurchase: (purchaseData: Omit<Purchase, 'id' | 'billNo'>) => { success: boolean; billNo?: string; error?: string };
  bomRecipes: BOMRecipe[];
  addBOMRecipe: (recipe: Omit<BOMRecipe, 'id'>) => void;
  updateBOMRecipe: (id: string, update: Partial<BOMRecipe>) => void;
  deleteBOMRecipe: (id: string) => void;
  calculateProductionCapacity: (recipeId: string, targetUnits?: number) => {
    maxProducibleUnits: number;
    maxBatches: number;
    limitingIngredient: {
      productId: string;
      productName: string;
      currentStock: number;
      requiredPerBatch: number;
      unit: string;
    } | null;
    ingredientStatuses: Array<{
      productId: string;
      productName: string;
      currentStock: number;
      requiredPerBatch: number;
      unit: string;
      producibleBatches: number;
      producibleUnits: number;
      requiredForTarget: number;
      shortageForTarget: number;
    }>;
  };
  productionCosts: ProductionCostItem[];
  updateProductionCost: (id: string, update: Partial<ProductionCostItem>) => void;
  productionRuns: ProductionRun[];
  executeProductionRun: (
    recipeId: string,
    batchNo: string,
    producedQuantity: number,
    supervisor: string,
    mfgDate: string,
    expDate: string,
    notes?: string,
    options?: {
      expectedQuantity?: number;
      laborCost?: number;
      overheadCost?: number;
    }
  ) => { success: boolean; error?: string; run?: ProductionRun };
  transports: TransportTrip[];
  addTransportTrip: (trip: Omit<TransportTrip, 'id' | 'tripNo'>) => void;
  expenses: ExpenseRecord[];
  addExpense: (expense: Omit<ExpenseRecord, 'id' | 'voucherNo'>) => void;
  utilityRentRecords: UtilityRentRecord[];
  addUtilityRent: (record: Omit<UtilityRentRecord, 'id'>) => void;
  payUtilityRent: (id: string, method: 'CASH' | 'BANK', bankId?: string) => void;
  ownerWithdrawals: OwnerWithdrawal[];
  addOwnerWithdrawal: (withdrawal: Omit<OwnerWithdrawal, 'id' | 'voucherNo'>) => void;
  deleteOwnerWithdrawal: (id: string) => void;
  partners: OwnerPartner[];
  addPartner: (partner: Omit<OwnerPartner, 'id'>) => void;
  employees: Employee[];
  addEmployee: (emp: Omit<Employee, 'id'>) => void;
  salaries: SalaryPayment[];
  paySalary: (salaryData: Omit<SalaryPayment, 'id' | 'status'>) => void;
  payrollMode: PayrollMode;
  setPayrollMode: (mode: PayrollMode) => void;
  assets: DepartmentAsset[];
  addAsset: (asset: Omit<DepartmentAsset, 'id'>) => void;
  updateAsset: (id: string, update: Partial<DepartmentAsset>) => void;
  deleteAsset: (id: string) => void;
  addAssetMaintenanceLog: (assetId: string, log: Omit<AssetMaintenanceLog, 'id' | 'assetId'>) => void;
  deleteAssetMaintenanceLog: (assetId: string, logId: string) => void;
  ledgers: LedgerEntry[];
  auditLogs: AuditLog[];
  
  systemTasks: SystemTask[];
  addSystemTask: (task: Omit<SystemTask, 'id'>) => void;
  updateSystemTask: (id: string, update: Partial<SystemTask>) => void;
  
  // Ledgers Customer/Supplier actions
  receiveCustomerPayment: (customerId: string, amount: number, method: 'CASH' | 'BANK', bankId?: string, notes?: string) => void;
  paySupplierPayment: (supplierId: string, amount: number, method: 'CASH' | 'BANK', bankId?: string, notes?: string) => void;
  transferFunds: (fromTypeOrAcc: any, toTypeOrAcc: any, amountOrFromBankId: any, notesOrToBankId?: any, maybeAmount?: any, maybeNotes?: any) => { success: boolean; error?: string };

  // Calculated Metrics
  totalStockValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiringBatchesCount: number;
  expiredBatchesCount: number;
  safeBatchesCount: number;
  totalCashAndBankBalance: number;
  totalReceivableDues: number;
  totalPayableDues: number;
  todaySalesTotal: number;
  todayPurchaseTotal: number;
  getPnLSummary: (startDate?: string, endDate?: string) => PnLSummary;

  // Stock Movement & Wastage Tracking
  stockMovements: StockMovement[];
  wastageRecords: WastageRecord[];
  recordStockMovement: (movement: Omit<StockMovement, 'id' | 'balanceAfter'> & { balanceAfter?: number }) => StockMovement;
  getProductStockMovements: (productId: string) => StockMovement[];
  recordWastageWriteOff: (
    productIdOrData: string | {
      productId: string;
      batchNumber?: string;
      quantity: number;
      reason: WastageReason | string;
      remarks?: string;
      date?: string;
      approvedBy?: string;
    },
    quantity?: number,
    reason?: WastageReason | string,
    batchNumber?: string,
    remarks?: string,
    approvedBy?: string
  ) => { success: boolean; voucherNo?: string; error?: string };

  // View compatibility aliases & helpers
  adjustStock: (productId: string, delta: number, reason: string) => void;
  utilityBills: UtilityRentRecord[];
  addUtilityBill: (record: Omit<UtilityRentRecord, 'id'>) => void;
  payUtilityBill: (id: string, method: 'CASH' | 'BANK', bankId?: string) => void;
  salaryRecords: SalaryPayment[];
  processMonthlyPayroll: (month: string) => void;
  saveManualPayroll: (month: string, records: any[]) => void;
  disburseSalary: (id: string, method: 'CASH' | 'BANK', bankId?: string) => void;
  transportTrips: TransportTrip[];
  cashBankLedgers: any[];
  addBankAccount: (acc: Omit<BankAccount, 'id'>) => void;
  customerLedgers: LedgerEntry[];
  supplierLedgers: LedgerEntry[];
  collectCustomerPayment: (customerId: string, amount: number, method: 'CASH' | 'BANK', notes?: string, bankId?: string) => void;
  paySupplier: (supplierId: string, amount: number, method: 'CASH' | 'BANK', notes?: string, bankId?: string) => void;
  totalReceivables: number;
  totalPayables: number;
  updateCurrentUserAvatar: (avatarBase64: string) => void;

  // System Controls
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  lastFirebaseBackupTime: string | null;
  colorTheme: string;
  setColorTheme: (color: string) => void;
  resetToDemoData: () => void;
  exportDatabaseJSON: () => string;
  importDatabaseJSON: (jsonStr: string) => { success: boolean; error?: string };
  exportFullBackupJSON: () => string;
  importBackupJSON: (jsonStr: string) => { success: boolean; error?: string };
  backupArchive: BackupArchiveItem[];
  createBackupArchive: (label?: string, type?: 'AUTO_PRE_HARD_RESET' | 'MANUAL') => BackupArchiveItem;
  restoreFromBackupArchive: (archiveId: string) => { success: boolean; error?: string };
  deleteFromBackupArchive: (archiveId: string) => void;
  executeHardReset: (developerPassword: string) => Promise<{
    success: boolean;
    error?: string;
    autoBackupItem?: BackupArchiveItem;
    driveBackupFile?: DriveBackupFile;
  }>;
  executeGoLiveClean: (developerPassword: string) => Promise<{
    success: boolean;
    error?: string;
    autoBackupItem?: BackupArchiveItem;
    driveBackupFile?: DriveBackupFile;
  }>;

  // Google Drive Cloud Backup & Recovery
  driveUser: GoogleDriveUser | null;
  isDriveConnected: boolean;
  isBackingUpToDrive: boolean;
  isRestoringFromDrive: boolean;
  isLoadingDriveBackups: boolean;
  driveBackupsList: DriveBackupFile[];
  lastDriveBackupTime: string | null;
  lastBackupTime: string | null;
  triggerManualBackup: (label?: string) => Promise<{
    success: boolean;
    item?: BackupArchiveItem;
    driveFile?: DriveBackupFile;
    timestamp: string;
    error?: string;
  }>;
  driveNotification: { type: 'success' | 'error' | 'info'; message: string } | null;
  setDriveNotification: (notif: { type: 'success' | 'error' | 'info'; message: string } | null) => void;
  connectDrive: () => Promise<{ success: boolean; error?: string }>;
  disconnectDrive: () => Promise<void>;
  fetchDriveBackups: () => Promise<DriveBackupFile[]>;
  performDriveBackup: (
    backupType?: 'DAILY' | 'PRE_RESET' | 'PRE_GOLIVE' | 'MANUAL',
    description?: string
  ) => Promise<{ success: boolean; file?: DriveBackupFile; error?: string }>;
  restoreDriveBackup: (fileId: string) => Promise<{ success: boolean; error?: string }>;
}

const ERPContext = createContext<ERPContextType | null>(null);

const STORAGE_KEY = 'FOOD_ERP_DATA_V1';
const ERP_TAB_CHANNEL = 'food_erp_tab_sync_v1';

export const ERPProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Helper to load or fallback
  const loadStored = <T,>(key: string, fallback: T): T => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${key}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed !== null && parsed !== undefined) {
          if (Array.isArray(fallback)) {
            return (Array.isArray(parsed) ? parsed : fallback) as T;
          }
          if (typeof fallback === 'object' && typeof parsed === 'object') {
            return { ...fallback, ...parsed };
          }
          return parsed;
        }
      }
    } catch {
      // localStorage blocked or error -> fallback
    }
    return fallback;
  };

  const saveStored = <T,>(key: string, data: T) => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_${key}`, JSON.stringify(data));
    } catch {
      // ignore
    }
  };

  // State definitions
  const [isServerHydrated, setIsServerHydrated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(() => loadStored('CURRENT_USER', INITIAL_USERS[0]));
  const [activeModule, setActiveModule] = useState<ModuleKey>('DASHBOARD');
  
  const [settings, setSettings] = useState<CompanySettings>(() => {
    const loaded = loadStored('SETTINGS', INITIAL_COMPANY_SETTINGS);
    return loaded;
  });
  const [users, setUsers] = useState<User[]>(() => loadStored('USERS', INITIAL_USERS));
  const [products, setProducts] = useState<Product[]>(() => loadStored('PRODUCTS', INITIAL_PRODUCTS));
  const [batches, setBatches] = useState<BatchItem[]>(() => loadStored('BATCHES', INITIAL_BATCHES));
  const [customers, setCustomers] = useState<Customer[]>(() => loadStored('CUSTOMERS', INITIAL_CUSTOMERS));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => loadStored('SUPPLIERS', INITIAL_SUPPLIERS));
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => loadStored('BANKS', INITIAL_BANK_ACCOUNTS));
  const [sales, setSales] = useState<Sale[]>(() => loadStored('SALES', INITIAL_SALES));
  const [purchases, setPurchases] = useState<Purchase[]>(() => loadStored('PURCHASES', INITIAL_PURCHASES));
  const [bomRecipes, setBomRecipes] = useState<BOMRecipe[]>(() => loadStored('BOM', INITIAL_BOM_RECIPES));
  const [productionCosts, setProductionCosts] = useState<ProductionCostItem[]>(() => loadStored('PROD_COSTS', INITIAL_PRODUCTION_COSTS));
  const [productionRuns, setProductionRuns] = useState<ProductionRun[]>(() => loadStored('PROD_RUNS', INITIAL_PRODUCTION_RUNS));
  const [transports, setTransports] = useState<TransportTrip[]>(() => loadStored('TRANSPORTS', INITIAL_TRANSPORTS));
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => loadStored('EXPENSES', INITIAL_EXPENSES));
  const [utilityRentRecords, setUtilityRentRecords] = useState<UtilityRentRecord[]>(() => loadStored('UTILITY_RENT', INITIAL_UTILITY_RENT));
  const [ownerWithdrawals, setOwnerWithdrawals] = useState<OwnerWithdrawal[]>(() => loadStored('WITHDRAWALS', INITIAL_OWNER_WITHDRAWALS));
  const [partners, setPartners] = useState<OwnerPartner[]>(() => loadStored('PARTNERS', INITIAL_OWNER_PARTNERS));
  const [employees, setEmployees] = useState<Employee[]>(() => loadStored('EMPLOYEES', INITIAL_EMPLOYEES));
  const [salaries, setSalaries] = useState<SalaryPayment[]>(() => loadStored('SALARIES', INITIAL_SALARIES));
  const [payrollMode, setPayrollModeState] = useState<PayrollMode>(() => {
    const saved = localStorage.getItem('food_erp_payroll_mode');
    return (saved === 'MANUAL' || saved === 'AUTOMATIC') ? (saved as PayrollMode) : 'AUTOMATIC';
  });

  const setPayrollMode = (mode: PayrollMode) => {
    setPayrollModeState(mode);
    try {
      localStorage.setItem('food_erp_payroll_mode', mode);
    } catch {
      // ignore
    }
    logAudit('UPDATE', 'HR & Payroll', `পেরোল মোড পরিবর্তন করা হয়েছে: ${mode === 'AUTOMATIC' ? 'স্বয়ংক্রিয় মোড (Automatic Mode)' : 'ম্যানুয়াল মোড (Manual Mode)'}`);
  };
  const [assets, setAssets] = useState<DepartmentAsset[]>(() => loadStored('ASSETS', INITIAL_ASSETS));
  const [ledgers, setLedgers] = useState<LedgerEntry[]>(() => loadStored('LEDGERS', INITIAL_LEDGERS));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadStored('AUDIT_LOGS', INITIAL_AUDIT_LOGS));
  const [systemTasks, setSystemTasks] = useState<SystemTask[]>(() => loadStored('SYSTEM_TASKS', []));
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => loadStored('STOCK_MOVEMENTS', INITIAL_STOCK_MOVEMENTS));
  const [wastageRecords, setWastageRecords] = useState<WastageRecord[]>(() => loadStored('WASTAGE_RECORDS', INITIAL_WASTAGE_RECORDS));

  // Theme State (Light / Dark mode) with localStorage & system preference sync
  const [colorTheme, setColorThemeState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('food_erp_color_theme') || 'teal';
    }
    return 'teal';
  });

  const setColorTheme = (color: string) => {
    setColorThemeState(color);
    if (typeof window !== 'undefined') {
      localStorage.setItem('food_erp_color_theme', color);
      document.documentElement.setAttribute('data-color-theme', color);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-color-theme', colorTheme);
    }
  }, []);

  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    try {
      const savedTheme = localStorage.getItem('food_erp_theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {
      // ignore
    }
    return 'light';
  });

  useEffect(() => {
    try {
      localStorage.setItem('food_erp_theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }
    } catch {
      // ignore
    }
  }, [theme]);

  // Listen to system preference changes if user has not set a manual preference
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const savedTheme = localStorage.getItem('food_erp_theme');
      if (!savedTheme) {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
  };

  // Role Permission Matrix State
  const [rolePermissionsMatrix, setRolePermissionsMatrix] = useState<RolePermissionMatrix>(() => {
    try {
      const saved = localStorage.getItem('food_erp_rbac_matrix_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return generateDefaultRBACMatrix();
  });

  useEffect(() => {
    try {
      localStorage.setItem('food_erp_rbac_matrix_v1', JSON.stringify(rolePermissionsMatrix));
    } catch {
      // ignore
    }
  }, [rolePermissionsMatrix]);

  // Backup Archive Persistent State (survives hard reset)
  const BACKUP_ARCHIVE_STORAGE_KEY = 'FOOD_ERP_BACKUP_ARCHIVE_V1';
  const [backupArchive, setBackupArchive] = useState<BackupArchiveItem[]>(() => {
    try {
      const saved = localStorage.getItem(BACKUP_ARCHIVE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(BACKUP_ARCHIVE_STORAGE_KEY, JSON.stringify(backupArchive));
    } catch {
      // ignore
    }
  }, [backupArchive]);

  // Google Drive Cloud Backup States
  const [driveUser, setDriveUser] = useState<GoogleDriveUser | null>(() => getStoredDriveUser());
  const [isDriveConnected, setIsDriveConnected] = useState<boolean>(() => isDriveSessionActive());
  const [isBackingUpToDrive, setIsBackingUpToDrive] = useState<boolean>(false);
  const [isRestoringFromDrive, setIsRestoringFromDrive] = useState<boolean>(false);
  const [isLoadingDriveBackups, setIsLoadingDriveBackups] = useState<boolean>(false);
  const [driveBackupsList, setDriveBackupsList] = useState<DriveBackupFile[]>([]);
  const [lastFirebaseBackupTime, setLastFirebaseBackupTime] = useState<string | null>(null);
  const [lastDriveBackupTime, setLastDriveBackupTime] = useState<string | null>(
    () => getLastBackupMetadata().lastTimestamp
  );
  const LAST_BACKUP_STORAGE_KEY = 'FOOD_ERP_LAST_BACKUP_TIME_V1';
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem(LAST_BACKUP_STORAGE_KEY);
      if (stored) return stored;
      const meta = getLastBackupMetadata();
      if (meta.lastTimestamp) return meta.lastTimestamp;
      const archiveSaved = localStorage.getItem('FOOD_ERP_BACKUP_ARCHIVE_V1');
      if (archiveSaved) {
        const parsed = JSON.parse(archiveSaved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.timestamp) {
          return parsed[0].timestamp;
        }
      }
    } catch {
      // ignore
    }
    return null;
  });

  const updateLastBackupTimestamp = (timestamp: string = new Date().toISOString()) => {
    setLastBackupTime(timestamp);
    try {
      localStorage.setItem(LAST_BACKUP_STORAGE_KEY, timestamp);
    } catch {
      // ignore
    }
  };
  const [driveNotification, setDriveNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Google Drive Auth state and auto-reconnect listener
  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (user, token) => {
        setIsDriveConnected(true);
        const dUser: GoogleDriveUser = {
          email: user.email || '',
          displayName: user.displayName || user.email || 'Google User',
          photoURL: user.photoURL || undefined,
          connectedAt: new Date().toISOString(),
        };
        setDriveUser(dUser);
      },
      () => {
        setIsDriveConnected(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);


  // Scheduled daily automatic Firebase Storage backup has been disabled in favor of Google Drive backup
  useEffect(() => {
    // Legacy check - we now use Google Drive
  }, []);

  // Scheduled daily automatic backup check
  useEffect(() => {
    const checkScheduledDailyBackup = async () => {
      if (!isDriveSessionActive()) return;

      const todayStr = new Date().toISOString().substring(0, 10);
      const { lastDate } = getLastBackupMetadata();

      if (lastDate !== todayStr) {
        try {
          setIsBackingUpToDrive(true);
          const dataJson = exportDatabaseJSON();
          const company = settings.companyNameEnglish || settings.companyNameBangla || 'FoodERP';
          const file = await uploadBackupToGoogleDrive({
            dataJson,
            companyName: company,
            backupType: 'DAILY',
            description: `দৈনিক নির্ধারিত স্বয়ংক্রিয় ব্যাকআপ [Daily Schedule] - ${new Date().toLocaleDateString('bn-BD')}`,
          });

          setLastDriveBackupTime(file.createdTime);
          setDriveBackupsList(prev => [file, ...prev.filter(f => f.id !== file.id)]);
          recordBackupSuccess(file.createdTime);

          logAudit(
            'EXPORT',
            'Google Drive Backup',
            `দৈনিক স্বয়ংক্রিয় ব্যাকআপ Google Drive-এ সফলভাবে সম্পন্ন: ${file.name}`
          );
          setDriveNotification({
            type: 'success',
            message: `আজকের স্বয়ংক্রিয় দৈনিক ব্যাকআপ Google Drive-এ সফলভাবে সংরক্ষিত হয়েছে (${file.name})`,
          });
        } catch (err: any) {
          console.warn('Daily scheduled backup to Google Drive failed:', err);
          logAudit(
            'SECURITY_ALERT',
            'Google Drive Backup',
            `দৈনিক Google Drive স্বয়ংক্রিয় ব্যাকআপ ব্যর্থ হয়েছে: ${err?.message || 'নেটওয়ার্ক ত্রুটি'}`
          );
          setDriveNotification({
            type: 'error',
            message: `দৈনিক Google Drive স্বয়ংক্রিয় ব্যাকআপ ব্যর্থ হয়েছে: ${err?.message || 'নেটওয়ার্ক ত্রুটি'}`,
          });
        } finally {
          setIsBackingUpToDrive(false);
        }
      }
    };

    const timer = setTimeout(() => {
      checkScheduledDailyBackup();
    }, 3000);

    const interval = setInterval(() => {
      checkScheduledDailyBackup();
    }, 15 * 60 * 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [isDriveConnected, settings]);

  // Sync to localStorage
  useEffect(() => { saveStored('CURRENT_USER', currentUser); }, [currentUser]);
  useEffect(() => { 
    saveStored('SETTINGS', settings); 
    if (typeof document !== 'undefined') {
      document.title = settings.companyNameBangla || settings.companyNameEnglish || 'Asif Inventory Software';
    }
  }, [settings]);
  useEffect(() => { saveStored('USERS', users); }, [users]);
  useEffect(() => { saveStored('PRODUCTS', products); }, [products]);
  useEffect(() => { saveStored('BATCHES', batches); }, [batches]);
  useEffect(() => { saveStored('CUSTOMERS', customers); }, [customers]);
  useEffect(() => { saveStored('SUPPLIERS', suppliers); }, [suppliers]);
  useEffect(() => { saveStored('BANKS', bankAccounts); }, [bankAccounts]);
  useEffect(() => { saveStored('SALES', sales); }, [sales]);
  useEffect(() => { saveStored('PURCHASES', purchases); }, [purchases]);
  useEffect(() => { saveStored('BOM', bomRecipes); }, [bomRecipes]);
  useEffect(() => { saveStored('PROD_COSTS', productionCosts); }, [productionCosts]);
  useEffect(() => { saveStored('PROD_RUNS', productionRuns); }, [productionRuns]);
  useEffect(() => { saveStored('TRANSPORTS', transports); }, [transports]);
  useEffect(() => { saveStored('EXPENSES', expenses); }, [expenses]);
  useEffect(() => { saveStored('UTILITY_RENT', utilityRentRecords); }, [utilityRentRecords]);
  useEffect(() => { saveStored('WITHDRAWALS', ownerWithdrawals); }, [ownerWithdrawals]);
  useEffect(() => { saveStored('PARTNERS', partners); }, [partners]);
  useEffect(() => { saveStored('EMPLOYEES', employees); }, [employees]);
  useEffect(() => { saveStored('SALARIES', salaries); }, [salaries]);
  useEffect(() => { saveStored('ASSETS', assets); }, [assets]);
  useEffect(() => { saveStored('LEDGERS', ledgers); }, [ledgers]);
  useEffect(() => { saveStored('AUDIT_LOGS', auditLogs); }, [auditLogs]);
  useEffect(() => { saveStored('SYSTEM_TASKS', systemTasks); }, [systemTasks]);
  useEffect(() => { saveStored('STOCK_MOVEMENTS', stockMovements); }, [stockMovements]);
  useEffect(() => { saveStored('WASTAGE_RECORDS', wastageRecords); }, [wastageRecords]);

  // Helper to sync full state to server
  const syncFullStateToServer = (override?: any) => {
    const payload = override || {
      settings,
      users,
      products,
      batches,
      customers,
      suppliers,
      bankAccounts,
      sales,
      purchases,
      bomRecipes,
      productionCosts,
      productionRuns,
      transports,
      expenses,
      utilityRentRecords,
      ownerWithdrawals,
      partners,
      employees,
      salaries,
      assets,
      ledgers,
      auditLogs,
      systemTasks,
      stockMovements,
      wastageRecords,
      payrollMode,
    };
    fetch('/api/erp/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(err => console.error('Error saving full state to server:', err));
  };

  // Cross-Tab Realtime Synchronization & Server Hydration
  useEffect(() => {
    let isMounted = true;
    let channel: BroadcastChannel | null = null;

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel(ERP_TAB_CHANNEL);
        channel.onmessage = (event) => {
          if (!isMounted || !event.data) return;
          if (event.data.type === 'UPDATE_SETTINGS' && event.data.payload) {
            setSettings(event.data.payload);
            saveStored('SETTINGS', event.data.payload);
          }
        };
      } catch {}
    }

    const handleStorage = (e: StorageEvent) => {
      if (!isMounted) return;
      if (e.key === `${STORAGE_KEY}_SETTINGS` && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && typeof parsed === 'object') {
            setSettings(parsed);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    // Initial server fetch to hydrate state (crucial for new tabs, partitioned storage, or reload)
    const localHasSavedSettings = typeof window !== 'undefined' && !!localStorage.getItem(`${STORAGE_KEY}_SETTINGS`);

    fetch('/api/erp/state')
      .then(res => res.json())
      .then(res => {
        if (!isMounted) return;
        if (res.exists && res.data) {
          const s = res.data;
          // Hydrate settings: Ensures company name & logo are consistent across all tabs
          if (s.settings && typeof s.settings === 'object') {
            setSettings(prev => ({ ...prev, ...s.settings }));
            saveStored('SETTINGS', s.settings);
          }
          // If this is a new tab with empty local storage, hydrate all business data
          if (!localHasSavedSettings) {
            if (s.users) { setUsers(s.users); saveStored('USERS', s.users); }
            if (s.products) { setProducts(s.products); saveStored('PRODUCTS', s.products); }
            if (s.batches) { setBatches(s.batches); saveStored('BATCHES', s.batches); }
            if (s.customers) { setCustomers(s.customers); saveStored('CUSTOMERS', s.customers); }
            if (s.suppliers) { setSuppliers(s.suppliers); saveStored('SUPPLIERS', s.suppliers); }
            if (s.bankAccounts) { setBankAccounts(s.bankAccounts); saveStored('BANKS', s.bankAccounts); }
            if (s.sales) { setSales(s.sales); saveStored('SALES', s.sales); }
            if (s.purchases) { setPurchases(s.purchases); saveStored('PURCHASES', s.purchases); }
            if (s.bomRecipes) { setBomRecipes(s.bomRecipes); saveStored('BOM', s.bomRecipes); }
            if (s.productionCosts) { setProductionCosts(s.productionCosts); saveStored('PROD_COSTS', s.productionCosts); }
            if (s.productionRuns) { setProductionRuns(s.productionRuns); saveStored('PROD_RUNS', s.productionRuns); }
            if (s.transports) { setTransports(s.transports); saveStored('TRANSPORTS', s.transports); }
            if (s.expenses) { setExpenses(s.expenses); saveStored('EXPENSES', s.expenses); }
            if (s.utilityRentRecords) { setUtilityRentRecords(s.utilityRentRecords); saveStored('UTILITY_RENT', s.utilityRentRecords); }
            if (s.ownerWithdrawals) { setOwnerWithdrawals(s.ownerWithdrawals); saveStored('WITHDRAWALS', s.ownerWithdrawals); }
            if (s.partners) { setPartners(s.partners); saveStored('PARTNERS', s.partners); }
            if (s.employees) { setEmployees(s.employees); saveStored('EMPLOYEES', s.employees); }
            if (s.salaries) { setSalaries(s.salaries); saveStored('SALARIES', s.salaries); }
            if (s.assets) { setAssets(s.assets); saveStored('ASSETS', s.assets); }
            if (s.ledgers) { setLedgers(s.ledgers); saveStored('LEDGERS', s.ledgers); }
            if (s.auditLogs) { setAuditLogs(s.auditLogs); saveStored('AUDIT_LOGS', s.auditLogs); }
            if (s.systemTasks) { setSystemTasks(s.systemTasks); saveStored('SYSTEM_TASKS', s.systemTasks); }
            if (s.stockMovements) { setStockMovements(s.stockMovements); saveStored('STOCK_MOVEMENTS', s.stockMovements); }
            if (s.wastageRecords) { setWastageRecords(s.wastageRecords); saveStored('WASTAGE_RECORDS', s.wastageRecords); }
            if (s.payrollMode) { setPayrollModeState(s.payrollMode); }
          }
        } else {
          // If server state does not exist yet on disk, write initial current state
          syncFullStateToServer();
        }
        setIsServerHydrated(true);
      })
      .catch(err => {
        console.warn('Server state sync notice:', err);
        setIsServerHydrated(true);
      });

    return () => {
      isMounted = false;
      channel?.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Debounced background sync to server once hydrated
  useEffect(() => {
    if (!isServerHydrated) return;
    const timer = setTimeout(() => {
      syncFullStateToServer();
    }, 2000);
    return () => clearTimeout(timer);
  }, [
    isServerHydrated,
    settings,
    products,
    customers,
    suppliers,
    batches,
    sales,
    purchases,
    bankAccounts,
    expenses,
    utilityRentRecords,
    ownerWithdrawals,
    employees,
    salaries,
    systemTasks,
    assets,
    bomRecipes,
    productionRuns,
    transports,
    payrollMode,
  ]);

  // Audit logger helper
  const logAudit = (action: AuditLog['action'], module: string, details: string) => {
    const newLog: AuditLog = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userId: currentUser?.id || 'SYSTEM',
      userName: currentUser?.name || 'Guest',
      userRole: currentUser?.role || 'VIEWER',
      action,
      module,
      details,
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Auth Functions
  const canAccess = (mod: ModuleKey): boolean => {
    if (!currentUser) return false;
    if (mod === 'DEV_SETTINGS' && currentUser.role !== 'DEVELOPER') return false;
    if (currentUser.role === 'DEVELOPER') return true;
    
    // Check in dynamic RBAC matrix
    const rolePerm = rolePermissionsMatrix[currentUser.role];
    if (rolePerm && rolePerm[mod] !== undefined) {
      return !!rolePerm[mod].view;
    }

    const allowed = ROLE_PERMISSIONS[currentUser.role] || [];
    return allowed.includes(mod);
  };

  const hasPermission = (mod: ModuleKey, action: 'view' | 'add' | 'edit' | 'delete'): boolean => {
    if (!currentUser) return false;
    if (mod === 'DEV_SETTINGS' && currentUser.role !== 'DEVELOPER') return false;
    if (currentUser.role === 'DEVELOPER') return true;

    const rolePerm = rolePermissionsMatrix[currentUser.role];
    if (rolePerm && rolePerm[mod] && rolePerm[mod][action] !== undefined) {
      return !!rolePerm[mod][action];
    }
    if (action === 'view') {
      return canAccess(mod);
    }
    if (currentUser.role === 'VIEWER') return false;
    return true;
  };

  const updateRolePermissionsMatrix = (newMatrix: RolePermissionMatrix) => {
    setRolePermissionsMatrix(newMatrix);
    try {
      localStorage.setItem('food_erp_rbac_matrix_v1', JSON.stringify(newMatrix));
    } catch {
      // ignore
    }
    logAudit(
      'UPDATE',
      'Users Management',
      `রোলভিত্তিক এক্সেস কন্ট্রোল (RBAC Permission Matrix) সফলভাবে হালনাগাদ করেছেন: ${currentUser?.name || 'Admin'}`
    );
  };

  const resetRolePermissionsMatrixToDefault = () => {
    const def = generateDefaultRBACMatrix();
    setRolePermissionsMatrix(def);
    try {
      localStorage.setItem('food_erp_rbac_matrix_v1', JSON.stringify(def));
    } catch {
      // ignore
    }
    logAudit(
      'SETTINGS_RESET',
      'Users Management',
      `RBAC পারমিশন ম্যাট্রিক্স ডিফল্ট কনফিগারেশনে রিসেট করেছেন: ${currentUser?.name || 'Admin'}`
    );
  };

  const login = (username: string, pass: string): { success: boolean; message?: string } => {
    const user = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!user) {
      return { success: false, message: 'ইউজারনেম সঠিক নয়।' };
    }
    if (!user.isActive) {
      return { success: false, message: 'এই একাউন্টটি নিষ্ক্রিয় (Deactivated) করা আছে।' };
    }
    if (user.passwordHash !== pass) {
      return { success: false, message: 'ভুল পাসওয়ার্ড! অনুগ্রহ করে আবার চেষ্টা করুন।' };
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const updatedUser = { ...user, lastLogin: now };
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    logAudit('LOGIN', 'Authentication', `${user.name} (${user.role}) সফলভাবে লগইন করেছেন।`);
    return { success: true };
  };

  const logout = () => {
    if (currentUser) {
      logAudit('LOGOUT', 'Authentication', `${currentUser.name} লগআউট করেছেন।`);
    }
    setCurrentUser(null);
  };

  const changePassword = (newPassword: string): boolean => {
    if (!currentUser) return false;
    const updated = { ...currentUser, passwordHash: newPassword, mustChangePassword: false };
    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
    logAudit('PASSWORD_CHANGE', 'Authentication', `পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।`);
    return true;
  };

  const resetPasswordWithRecovery = (
    username: string,
    name: string,
    recoveryCode: string,
    newPass: string
  ): { success: boolean; message: string } => {
    const user = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!user) return { success: false, message: 'ইউজারনেম পাওয়া যায়নি।' };
    if (!user.recoveryCode || user.recoveryCode.trim().toUpperCase() !== recoveryCode.trim().toUpperCase()) {
      return { success: false, message: 'রিকভারি কোড (Recovery Code) মেলেনি!' };
    }
    const updated = { ...user, passwordHash: newPass, mustChangePassword: false };
    setUsers(prev => prev.map(u => u.id === user.id ? updated : u));
    logAudit('PASSWORD_CHANGE', 'Security', `রিকভারি কোড ব্যবহার করে ${user.name}-এর পাসওয়ার্ড রিসেট করা হয়েছে।`);
    return { success: true, message: 'পাসওয়ার্ড সফলভাবে রিসেট হয়েছে! নতুন পাসওয়ার্ড দিয়ে লগইন করুন।' };
  };

  // Settings
  const updateSettings = (newSettings: Partial<CompanySettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      saveStored('SETTINGS', updated);

      // Broadcast immediately to other tabs
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        try {
          const ch = new BroadcastChannel(ERP_TAB_CHANNEL);
          ch.postMessage({ type: 'UPDATE_SETTINGS', payload: updated });
          ch.close();
        } catch {}
      }

      // Persist immediately to server JSON database
      fetch('/api/erp/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updated }),
      }).catch(err => console.error('Failed to sync settings to server:', err));

      return updated;
    });
    logAudit('UPDATE', 'Settings', 'কোম্পানির সেটিংস আপডেট করা হয়েছে।');
  };

  // User Management
  const addUser = (newUser: Omit<User, 'id' | 'createdAt'>): { success: boolean; error?: string } => {
    const exists = users.some(u => u.username.toLowerCase() === newUser.username.trim().toLowerCase());
    if (exists) {
      return { success: false, error: 'এই ইউজারনেমটি (User ID) ইতিমধ্যে ব্যবহৃত হচ্ছে। অন্য ইউজারনেম দিন।' };
    }
    // Security: Only Developer can create a user with DEVELOPER role
    if (newUser.role === 'DEVELOPER' && currentUser?.role !== 'DEVELOPER') {
      return { success: false, error: 'অননুমোদিত রোল নির্বাচন!' };
    }

    const user: User = {
      ...newUser,
      username: newUser.username.trim(),
      id: `USR-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString().substring(0, 10),
    };
    setUsers(prev => [...prev, user]);

    // HR Integration: If Staff Category or Gender is selected, automatically sync/create in employees list
    if (newUser.category || newUser.gender) {
      setEmployees(prev => {
        const existingIdx = prev.findIndex(
          e => (newUser.phone && e.phone === newUser.phone) || e.name.toLowerCase() === newUser.name.trim().toLowerCase()
        );
        if (existingIdx >= 0) {
          const copy = [...prev];
          copy[existingIdx] = {
            ...copy[existingIdx],
            category: newUser.category || copy[existingIdx].category,
            gender: newUser.gender || copy[existingIdx].gender,
            department: (newUser.department as any) || copy[existingIdx].department,
            designation: newUser.designation || copy[existingIdx].designation,
            status: 'ACTIVE',
          };
          return copy;
        } else {
          const newEmp: Employee = {
            id: `EMP-${Date.now().toString().slice(-4)}`,
            code: `EMP-${Math.floor(100 + Math.random() * 900)}`,
            name: newUser.name.trim(),
            category: newUser.category || 'OFFICE',
            gender: newUser.gender || 'MALE',
            department: (newUser.department as any) || (newUser.category === 'MECHANICAL' ? 'PRODUCTION' : 'MANAGEMENT'),
            designation: newUser.designation || (newUser.role === 'ADMIN' ? 'অ্যাডমিনিস্ট্রেটর' : newUser.role === 'MANAGER' ? 'ম্যানেজার' : 'এক্সিকিউটিভ'),
            role: newUser.role,
            phone: newUser.phone?.trim() || '01700-000000',
            joinDate: new Date().toISOString().substring(0, 10),
            basicSalary: 18000,
            status: 'ACTIVE',
          };
          return [...prev, newEmp];
        }
      });
    }

    logAudit('CREATE', 'Users Management', `নতুন ব্যবহারকারী যোগ: ${user.name} (${user.role}) - তৈরি করেছেন: ${currentUser?.name || 'Unknown'}`);
    return { success: true };
  };

  const updateUser = (id: string, update: Partial<User>): { success: boolean; error?: string } => {
    const target = users.find(u => u.id === id);
    if (!target) return { success: false, error: 'ইউজার পাওয়া যায়নি।' };

    // SECURITY RULE: Developer's account can ONLY be modified by Developer role
    if (target.role === 'DEVELOPER' && currentUser?.role !== 'DEVELOPER') {
      return { success: false, error: 'নিরাপত্তা ত্রুটি: ইউজার পাওয়া যায়নি বা অ্যাক্সেস অননুমোদিত।' };
    }

    // If changing to DEVELOPER role, only Developer can do that
    if (update.role === 'DEVELOPER' && currentUser?.role !== 'DEVELOPER') {
      return { success: false, error: 'অননুমোদিত রোল নির্বাচন!' };
    }

    if (update.username && update.username.toLowerCase() !== target.username.toLowerCase()) {
      const exists = users.some(u => u.id !== id && u.username.toLowerCase() === update.username!.trim().toLowerCase());
      if (exists) {
        return { success: false, error: 'এই ইউজার আইডিটি অন্য একাউন্টে ব্যবহৃত হচ্ছে।' };
      }
    }

    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...update } : u));
    if (currentUser?.id === id) {
      setCurrentUser(prev => prev ? { ...prev, ...update } : null);
    }

    // HR Integration: Sync changes with employees list
    if (update.category || update.gender || update.department || update.designation || update.isActive !== undefined) {
      setEmployees(prev => prev.map(e => {
        if ((target.phone && e.phone === target.phone) || e.name.toLowerCase() === target.name.toLowerCase()) {
          return {
            ...e,
            category: update.category || e.category,
            gender: update.gender || e.gender,
            department: (update.department as any) || e.department,
            designation: update.designation || e.designation,
            status: update.isActive === false ? 'RESIGNED' : 'ACTIVE',
          };
        }
        return e;
      }));
    }

    logAudit(
      update.isActive === false ? 'SECURITY_ALERT' : 'UPDATE',
      'Users Management',
      `ইউজার তথ্য হালনাগাদ: ${target.name} (${target.username}) - ${update.isActive === false ? 'সাসপেন্ড' : 'আপডেট'}`
    );
    return { success: true };
  };

  const deactivateUser = (id: string, reason?: string): { success: boolean; error?: string } => {
    const target = users.find(u => u.id === id);
    if (!target) return { success: false, error: 'ইউজার পাওয়া যায়নি।' };
    if (target.role === 'DEVELOPER' && currentUser?.role !== 'DEVELOPER') {
      return { success: false, error: 'নিরাপত্তা ত্রুটি: ইউজার পাওয়া যায়নি বা অ্যাক্সেস অননুমোদিত।' };
    }
    if (currentUser?.id === id) {
      return { success: false, error: 'আপনি নিজের বর্তমান লগইন একাউন্ট সাসপেন্ড বা নিষ্ক্রিয় করতে পারবেন না।' };
    }

    setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: false } : u));
    setEmployees(prev => prev.map(e => ((target.phone && e.phone === target.phone) || e.name.toLowerCase() === target.name.toLowerCase()) ? { ...e, status: 'RESIGNED' } : e));

    logAudit(
      'SECURITY_ALERT',
      'Users Management',
      `অ্যাকাউন্ট নিষ্ক্রিয়/স্থগিত: ${target.name} (${target.username}) - রোল: ${target.role}। কারণ: ${reason || 'প্রশাসনিক সিদ্ধান্ত'} (কর্তৃক: ${currentUser?.name || 'Admin'})`
    );
    return { success: true };
  };

  const activateUser = (id: string): { success: boolean; error?: string } => {
    const target = users.find(u => u.id === id);
    if (!target) return { success: false, error: 'ইউজার পাওয়া যায়নি।' };

    setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: true } : u));
    setEmployees(prev => prev.map(e => ((target.phone && e.phone === target.phone) || e.name.toLowerCase() === target.name.toLowerCase()) ? { ...e, status: 'ACTIVE' } : e));

    logAudit(
      'UPDATE',
      'Users Management',
      `অ্যাকাউন্ট পুনরায় সক্রিয় করা হয়েছে: ${target.name} (${target.username}) (কর্তৃক: ${currentUser?.name || 'Admin'})`
    );
    return { success: true };
  };

  const updateCurrentUserAvatar = (avatarBase64: string) => {
    if (!currentUser) return;
    const updated = { ...currentUser, avatar: avatarBase64 };
    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
    logAudit('UPDATE', 'Users Management', `${currentUser.name}-এর প্রোফাইল ছবি আপডেট করা হয়েছে।`);
  };

  const deleteUser = (id: string): { success: boolean; error?: string } => {
    const target = users.find(u => u.id === id);
    if (!target) return { success: false, error: 'ইউজার পাওয়া যায়নি।' };

    // SECURITY: Developer cannot be deleted by non-developer, nor can current user delete themselves
    if (target.role === 'DEVELOPER' && currentUser?.role !== 'DEVELOPER') {
      return { success: false, error: 'নিরাপত্তা ত্রুটি: ইউজার পাওয়া যায়নি বা মোছা অননুমোদিত।' };
    }
    if (currentUser?.id === id) {
      return { success: false, error: 'আপনি নিজের বর্তমান লগইন একাউন্ট ডিলিট করতে পারবেন না।' };
    }

    setUsers(prev => prev.filter(u => u.id !== id));
    logAudit('DELETE', 'Users Management', `ইউজার ডিলিট করা হয়েছে: ${target.name} (${target.username})`);
    return { success: true };
  };

  const resetUserPassword = (targetUserId: string, newPassword: string): { success: boolean; error?: string } => {
    const target = users.find(u => u.id === targetUserId);
    if (!target) return { success: false, error: 'ইউজার পাওয়া যায়নি।' };

    // SECURITY RULE: Developer password cannot be changed by Admin or anyone else!
    if (target.role === 'DEVELOPER' && currentUser?.role !== 'DEVELOPER') {
      return { success: false, error: 'নিরাপত্তা ত্রুটি: ইউজার পাওয়া যায়নি বা অ্যাক্সেস অননুমোদিত।' };
    }

    // Only Admin or Developer (or user themselves) can reset passwords
    if (currentUser?.role !== 'DEVELOPER' && currentUser?.role !== 'ADMIN') {
      return { success: false, error: 'পাসওয়ার্ড রিসেট করার অনুমতি শুধুমাত্র সিস্টেম অ্যাডমিনের রয়েছে।' };
    }

    if (!newPassword || newPassword.length < 4) {
      return { success: false, error: 'পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।' };
    }

    setUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, passwordHash: newPassword, mustChangePassword: false } : u));
    if (currentUser?.id === targetUserId) {
      setCurrentUser(prev => prev ? { ...prev, passwordHash: newPassword } : null);
    }
    logAudit('PASSWORD_CHANGE', 'Users Management', `${currentUser?.name} কর্তৃক ${target.name} (${target.username})-এর পাসওয়ার্ড সফলভাবে রিসেট করা হয়েছে।`);
    return { success: true };
  };

  // Product Management
  const addProduct = (prodData: Omit<Product, 'id'>) => {
    const newProd: Product = {
      ...prodData,
      id: `PRD-${Date.now().toString().slice(-6)}`,
    };
    setProducts(prev => [...prev, newProd]);
    logAudit('CREATE', 'Stock / Inventory', `নতুন পণ্য অন্তর্ভুক্ত: ${newProd.nameBangla}`);
  };

  const updateProduct = (id: string, update: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...update } : p));
    logAudit('UPDATE', 'Stock / Inventory', `পণ্য আপডেট: ${id}`);
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    logAudit('DELETE', 'Stock / Inventory', `পণ্য ডিলিট: ${id}`);
  };

  // Customers & Suppliers
  const addCustomer = (data: Omit<Customer, 'id' | 'createdAt' | 'totalBilled' | 'totalPaid' | 'currentDue'>): Customer => {
    const newCust: Customer = {
      ...data,
      id: `CUST-${Date.now().toString().slice(-4)}`,
      totalBilled: 0,
      totalPaid: 0,
      currentDue: data.openingBalance || 0,
      createdAt: new Date().toISOString().substring(0, 10),
    };
    setCustomers(prev => [...prev, newCust]);
    logAudit('CREATE', 'Customer Ledger', `নতুন কাস্টমার নিবন্ধিত: ${newCust.name}`);
    return newCust;
  };

  const addSupplier = (data: Omit<Supplier, 'id' | 'createdAt' | 'totalPurchased' | 'totalPaid' | 'currentPayable'>): Supplier => {
    const newSup: Supplier = {
      ...data,
      id: `SUP-${Date.now().toString().slice(-4)}`,
      totalPurchased: 0,
      totalPaid: 0,
      currentPayable: data.openingBalance || 0,
      createdAt: new Date().toISOString().substring(0, 10),
    };
    setSuppliers(prev => [...prev, newSup]);
    logAudit('CREATE', 'Supplier Ledger', `নতুন সাপ্লায়ার নিবন্ধিত: ${newSup.name}`);
    return newSup;
  };

  // SALES AUTOMATION
  const addSale = (saleData: Omit<Sale, 'id' | 'invoiceNo'>): { success: boolean; invoiceNo?: string; error?: string } => {
    const dateCode = new Date().toISOString().slice(2, 7).replace('-', '');
    const rand = Math.floor(100 + Math.random() * 900);
    const invoiceNo = `INV-${dateCode}-${rand}`;

    // Check stock for all items
    for (const item of saleData.items) {
      const prod = products.find(p => p.id === item.productId);
      if (!prod) return { success: false, error: `পণ্য ${item.productName} পাওয়া যায়নি!` };
      if (prod.currentStock < item.quantity) {
        return { success: false, error: `অপর্যাপ্ত স্টক: ${prod.nameBangla} স্টকে আছে ${prod.currentStock} ${prod.unit}, কিন্তু আপনি ${item.quantity} দিতে চাচ্ছেন!` };
      }
    }

    // Deduct stock
    setProducts(prev =>
      prev.map(p => {
        const soldItem = saleData.items.find(it => it.productId === p.id);
        if (soldItem) {
          return { ...p, currentStock: Math.max(0, p.currentStock - soldItem.quantity) };
        }
        return p;
      })
    );

    // Deduct batch quantities with FEFO (First Expiry First Out)
    setBatches(prev => {
      let updatedBatches = [...prev];
      for (const item of saleData.items) {
        let remaining = item.quantity;
        // 1. If user chose specific batch manually, deduct from that chosen batch first (manual override)
        if (item.batchNumber) {
          updatedBatches = updatedBatches.map(b => {
            if (b.productId === item.productId && b.batchNumber === item.batchNumber && remaining > 0) {
              const deduct = Math.min(b.quantity, remaining);
              remaining -= deduct;
              const newQty = b.quantity - deduct;
              return { ...b, quantity: newQty, status: newQty === 0 ? 'DEPLETED' : b.status };
            }
            return b;
          });
        }
        // 2. FEFO: Auto-deduct any remaining from earliest expiring batches first
        if (remaining > 0) {
          const matchingBatches = updatedBatches
            .filter(b => b.productId === item.productId && b.quantity > 0)
            .sort((a, b) => new Date(a.expDate).getTime() - new Date(b.expDate).getTime());

          for (const match of matchingBatches) {
            if (remaining <= 0) break;
            const deduct = Math.min(match.quantity, remaining);
            remaining -= deduct;
            updatedBatches = updatedBatches.map(b => {
              if (b.id === match.id) {
                const newQty = b.quantity - deduct;
                return { ...b, quantity: newQty, status: newQty === 0 ? 'DEPLETED' : b.status };
              }
              return b;
            });
          }
        }
      }
      return updatedBatches;
    });

    // Record Stock Movements for each sold item
    const saleMovements: StockMovement[] = saleData.items.map(item => {
      const prod = products.find(p => p.id === item.productId);
      const prevStock = prod?.currentStock || 0;
      return {
        id: `MOV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        date: saleData.date || new Date().toISOString().substring(0, 10),
        productId: item.productId,
        productName: item.productName || prod?.nameBangla || '',
        type: 'SALE',
        referenceNo: invoiceNo,
        referenceNote: `বিক্রয়: ${saleData.customerName}`,
        batchNumber: item.batchNumber,
        inQty: 0,
        outQty: item.quantity,
        balanceAfter: Math.max(0, prevStock - item.quantity),
        unitCost: item.costPrice || prod?.purchasePrice || 0,
        totalValue: item.total || (item.quantity * item.unitPrice),
        createdByName: currentUser?.name || 'বিক্রয় বিভাগ',
      };
    });
    setStockMovements(prev => [...saleMovements, ...prev]);

    // Update customer ledger
    setCustomers(prev =>
      prev.map(c => {
        if (c.id === saleData.customerId) {
          return {
            ...c,
            totalBilled: c.totalBilled + saleData.grandTotal,
            totalPaid: c.totalPaid + saleData.paidAmount,
            currentDue: c.currentDue + saleData.dueAmount,
          };
        }
        return c;
      })
    );

    // If paid amount > 0, reflect in Cash / Bank
    if (saleData.paidAmount > 0) {
      if (saleData.paymentMethod === 'CASH' || (!saleData.bankAccountId && saleData.paymentMethod !== 'BANK')) {
        setSettings(prev => ({ ...prev, cashInHandBalance: prev.cashInHandBalance + saleData.paidAmount }));
      } else if (saleData.bankAccountId) {
        setBankAccounts(prev =>
          prev.map(b => b.id === saleData.bankAccountId ? { ...b, balance: b.balance + saleData.paidAmount } : b)
        );
      }

      // Add to Ledger
      const ledgerEntry: LedgerEntry = {
        id: `LDG-${Date.now()}`,
        date: saleData.date,
        voucherNo: invoiceNo,
        accountType: 'SALE',
        accountId: saleData.customerId,
        accountTitle: saleData.customerName,
        description: `বিক্রয় ইনভয়েস ${invoiceNo} বাবদ আদায়`,
        debit: 0,
        credit: saleData.paidAmount,
        createdBy: currentUser?.name || 'Sales',
      };
      setLedgers(prev => [ledgerEntry, ...prev]);
    }

    const newSale: Sale = {
      ...saleData,
      id: `SALE-${Date.now()}`,
      invoiceNo,
      workflowStep: saleData.workflowStep || 1,
      deliveryStatus: saleData.deliveryStatus || 'INVOICE_CREATED',
    };

    // If optional sales transport cost was applied, log it as a company-borne SALES transport trip (deducted from sale)
    if (saleData.transportCost && saleData.transportCost > 0) {
      const salesTrip: TransportTrip = {
        id: `TRIP-S-${Date.now()}`,
        tripNo: `TRP-S-${Date.now().toString().slice(-5)}`,
        date: saleData.date,
        vehicleNo: saleData.deliveryVehicleNo || 'কোম্পানি ডেলিভারি ভ্যান',
        driverName: saleData.deliveryPersonName || saleData.deliveryPerson || 'অন-ডিউটি ডেলিভারিম্যান',
        driverPhone: saleData.deliveryPersonPhone || saleData.deliveryPhone || '০১৭০০-০০০০০০',
        destination: `${saleData.customerName} ডেলিভারি পয়েন্ট`,
        purpose: 'SALES_DELIVERY',
        transportType: 'SALES',
        costFuel: 0,
        costTollOther: saleData.transportCost,
        fuelCost: 0,
        tollCost: 0,
        laborCost: 0,
        otherCost: saleData.transportCost,
        totalCost: saleData.transportCost,
        totalTripCost: saleData.transportCost,
        status: 'COMPLETED',
        customerId: saleData.customerId,
        customerName: saleData.customerName,
        salesInvoiceNo: invoiceNo,
        notes: `ইনভয়েস ${invoiceNo} বাবদ কোম্পানি বাহিত বিক্রয় পরিবহন ভাড়া (বিক্রয়মূল্য থেকে কর্তনকৃত)`,
        paidVia: 'CASH',
      };
      setTransports(prev => [salesTrip, ...prev]);
    }

    setSales(prev => [newSale, ...prev]);
    logAudit('CREATE', 'Sales & Invoice', `ইনভয়েস ${invoiceNo} তৈরি (মোট: ৳${saleData.grandTotal.toLocaleString()}, পরিশোধ: ৳${saleData.paidAmount.toLocaleString()})`);
    return { success: true, invoiceNo };
  };


  const toggleTransactionVisualStatus = (id: string, type: 'SALE' | 'PURCHASE') => {
    if (type === 'SALE') {
      setSales(prev => prev.map(s => {
        if (s.id === id) {
          const current = s.visualStatus || (s.dueAmount <= 0 ? 'PAID' : 'PENDING');
          let next: 'PAID' | 'PENDING' | 'OVERDUE' = 'PAID';
          if (current === 'PAID') next = 'PENDING';
          else if (current === 'PENDING') next = 'OVERDUE';
          else next = 'PAID';
          return { ...s, visualStatus: next };
        }
        return s;
      }));
    } else {
      setPurchases(prev => prev.map(p => {
        if (p.id === id) {
          const current = p.visualStatus || (p.dueAmount <= 0 ? 'PAID' : 'PENDING');
          let next: 'PAID' | 'PENDING' | 'OVERDUE' = 'PAID';
          if (current === 'PAID') next = 'PENDING';
          else if (current === 'PENDING') next = 'OVERDUE';
          else next = 'PAID';
          return { ...p, visualStatus: next };
        }
        return p;
      }));
    }
  };

  // SALES WORKFLOW MANAGEMENT (Step 1: Invoice -> Step 2: Delivery Assignment -> Step 3: Gate Pass Confirmation)
  const updateSaleWorkflow = (saleId: string, updates: Partial<Sale>): { success: boolean; error?: string } => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return { success: false, error: 'সেল রেকর্ড পাওয়া যায়নি!' };

    let nextStep: 1 | 2 | 3 = updates.workflowStep !== undefined ? updates.workflowStep : (sale.workflowStep || 1);
    let nextStatus = updates.deliveryStatus || sale.deliveryStatus || 'INVOICE_CREATED';

    if (updates.gatePassNo || updates.gatePassConfirmedAt || updates.deliveryStatus === 'DELIVERED') {
      nextStep = 3;
      nextStatus = 'DELIVERED';
    } else if ((updates.deliveryPersonName || updates.deliveryStatus === 'OUT_FOR_DELIVERY') && nextStep < 2) {
      nextStep = 2;
      nextStatus = 'OUT_FOR_DELIVERY';
    }

    setSales(prev =>
      prev.map(s => {
        if (s.id === saleId) {
          return {
            ...s,
            ...updates,
            workflowStep: nextStep,
            deliveryStatus: nextStatus,
          };
        }
        return s;
      })
    );

    const logMsg = nextStep === 3
      ? `ইনভয়েস ${sale.invoiceNo} গেট পাস #${updates.gatePassNo || sale.gatePassNo || 'GP'} নিশ্চিত ও ডেলিভারি সম্পন্ন`
      : nextStep === 2
      ? `ইনভয়েস ${sale.invoiceNo} ডেলিভারি ম্যান ${updates.deliveryPersonName || sale.deliveryPersonName || '-'} নির্ধারণ (Out for Delivery)`
      : `ইনভয়েস ${sale.invoiceNo} ওয়ার্কফ্লো আপডেট`;

    logAudit('UPDATE', 'Sales & Invoice', logMsg);
    return { success: true };
  };

  // PURCHASE AUTOMATION
  const addPurchase = (purchaseData: Omit<Purchase, 'id' | 'billNo'>): { success: boolean; billNo?: string; error?: string } => {
    const dateCode = new Date().toISOString().slice(2, 7).replace('-', '');
    const rand = Math.floor(100 + Math.random() * 900);
    const billNo = `PBILL-${dateCode}-${rand}`;

    // Add stock for each purchased item
    setProducts(prev =>
      prev.map(p => {
        const purItem = purchaseData.items.find(it => it.productId === p.id);
        if (purItem) {
          return { ...p, currentStock: p.currentStock + purItem.quantity };
        }
        return p;
      })
    );

    // Register batches
    const newBatches: BatchItem[] = purchaseData.items
      .filter(it => it.batchNumber)
      .map(it => ({
        id: `BAT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        productId: it.productId,
        batchNumber: it.batchNumber,
        quantity: it.quantity,
        initialQuantity: it.quantity,
        mfgDate: it.mfgDate || purchaseData.date,
        expDate: it.expDate || new Date(Date.now() + 180 * 86400000).toISOString().substring(0, 10),
        purchaseOrProdPrice: it.unitCost,
        supplierOrProductionRef: billNo,
        status: 'ACTIVE',
      }));

    if (newBatches.length > 0) {
      setBatches(prev => [...newBatches, ...prev]);
    }

    // Update supplier ledger
    setSuppliers(prev =>
      prev.map(s => {
        if (s.id === purchaseData.supplierId) {
          return {
            ...s,
            totalPurchased: s.totalPurchased + purchaseData.grandTotal,
            totalPaid: s.totalPaid + purchaseData.paidAmount,
            currentPayable: s.currentPayable + purchaseData.dueAmount,
          };
        }
        return s;
      })
    );

    // If paid amount > 0, deduct from cash or bank
    if (purchaseData.paidAmount > 0) {
      if (purchaseData.paymentMethod === 'CASH' || (!purchaseData.bankAccountId && purchaseData.paymentMethod !== 'BANK')) {
        setSettings(prev => ({ ...prev, cashInHandBalance: Math.max(0, prev.cashInHandBalance - purchaseData.paidAmount) }));
      } else if (purchaseData.bankAccountId) {
        setBankAccounts(prev =>
          prev.map(b => b.id === purchaseData.bankAccountId ? { ...b, balance: b.balance - purchaseData.paidAmount } : b)
        );
      }

      // Add to Ledger
      const ledgerEntry: LedgerEntry = {
        id: `LDG-${Date.now()}`,
        date: purchaseData.date,
        voucherNo: billNo,
        accountType: 'PURCHASE',
        accountId: purchaseData.supplierId,
        accountTitle: purchaseData.supplierName,
        description: `সাপ্লায়ার ক্রয় বিল ${billNo} পরিশোধ`,
        debit: purchaseData.paidAmount,
        credit: 0,
        createdBy: currentUser?.name || 'Purchase',
      };
      setLedgers(prev => [ledgerEntry, ...prev]);
    }

    const newPurchase: Purchase = {
      ...purchaseData,
      id: `PUR-${Date.now()}`,
      billNo,
    };

    setPurchases(prev => [newPurchase, ...prev]);
    logAudit('CREATE', 'Purchase / Supply', `ক্রয় বিল ${billNo} রেকর্ড (মোট: ৳${purchaseData.grandTotal.toLocaleString()}, পরিশোধ: ৳${purchaseData.paidAmount.toLocaleString()})`);
    return { success: true, billNo };
  };

  // PRODUCTION / BOM AUTOMATION
  const executeProductionRun = (
    recipeId: string,
    batchNo: string,
    producedQuantity: number,
    supervisor: string,
    mfgDate: string,
    expDate: string,
    notes?: string,
    options?: {
      expectedQuantity?: number;
      laborCost?: number;
      overheadCost?: number;
    }
  ): { success: boolean; error?: string; run?: ProductionRun } => {
    const recipe = bomRecipes.find(r => r.id === recipeId);
    if (!recipe) return { success: false, error: 'রেসিপি পাওয়া যায়নি!' };

    const expectedQty = options?.expectedQuantity ?? (recipe.outputQuantity || 1);
    const multiplier = expectedQty / (recipe.outputQuantity || 1);

    // 1. Verify enough stock of all ingredients & calculate total required
    for (const ing of recipe.ingredients) {
      const requiredQty = ing.quantity * multiplier;
      const rawProd = products.find(p => p.id === ing.productId);
      if (!rawProd) {
        return { success: false, error: `কাঁচামাল ${ing.productName} ইনভেন্টরিতে পাওয়া যায়নি!` };
      }
      if (rawProd.currentStock < requiredQty) {
        const shortage = (requiredQty - rawProd.currentStock).toFixed(2);
        return {
          success: false,
          error: `কাঁচামাল সংকট: "${rawProd.nameBangla}" প্রয়োজন ${requiredQty.toFixed(1)} ${rawProd.unit}, কিন্তু স্টকে আছে ${rawProd.currentStock} ${rawProd.unit} (ঘাটতি: ${shortage} ${rawProd.unit})!`,
        };
      }
    }

    // 2. Deduct raw materials using FEFO on batches and log stock movements
    let totalRawCost = 0;
    const newMovements: StockMovement[] = [];

    // Deduct batches with FEFO
    setBatches(prev => {
      let updatedBatches = [...prev];
      for (const ing of recipe.ingredients) {
        let remainingToDeduct = ing.quantity * multiplier;
        const matchingBatches = updatedBatches
          .filter(b => b.productId === ing.productId && b.quantity > 0)
          .sort((a, b) => new Date(a.expDate).getTime() - new Date(b.expDate).getTime());

        for (const b of matchingBatches) {
          if (remainingToDeduct <= 0) break;
          const deduct = Math.min(b.quantity, remainingToDeduct);
          remainingToDeduct -= deduct;
          updatedBatches = updatedBatches.map(existing => {
            if (existing.id === b.id) {
              const newQty = existing.quantity - deduct;
              return { ...existing, quantity: newQty, status: newQty === 0 ? 'DEPLETED' : existing.status };
            }
            return existing;
          });
        }
      }
      return updatedBatches;
    });

    // Deduct product stock and build movement records
    setProducts(prev =>
      prev.map(p => {
        const ing = recipe.ingredients.find(i => i.productId === p.id);
        if (ing) {
          const usedQty = ing.quantity * multiplier;
          const unitRate = p.purchasePrice || ing.unitCost || 0;
          const lineCost = usedQty * unitRate;
          totalRawCost += lineCost;
          const newStock = Math.max(0, p.currentStock - usedQty);

          newMovements.push({
            id: `MOV-PRD-OUT-${Date.now()}-${p.id}`,
            date: mfgDate,
            productId: p.id,
            productName: p.nameBangla,
            type: 'PRODUCTION_OUT',
            referenceNo: `PROD-${batchNo.trim()}`,
            referenceNote: `প্রোডাকশনে ব্যবহার (${recipe.finishedProductName} ব্যাচ: ${batchNo.trim()})`,
            inQty: 0,
            outQty: usedQty,
            balanceAfter: newStock,
            unitCost: unitRate,
            totalValue: lineCost,
            createdByName: supervisor,
          });

          return { ...p, currentStock: newStock };
        }
        return p;
      })
    );

    // 3. Finished Goods & Yield / Wastage Calculation
    const actualQty = producedQuantity;
    const wastageQty = Math.max(0, expectedQty - actualQty);
    const yieldPercent = expectedQty > 0 ? Number(((actualQty / expectedQty) * 100).toFixed(2)) : 100;
    const wastagePercent = expectedQty > 0 ? Number(((wastageQty / expectedQty) * 100).toFixed(2)) : 0;

    const laborCost = options?.laborCost !== undefined
      ? options.laborCost
      : (recipe.laborCostPerBatch * multiplier);
    const overheadCost = options?.overheadCost !== undefined
      ? options.overheadCost
      : (recipe.overheadCostPerBatch * multiplier);
    const totalCost = totalRawCost + laborCost + overheadCost;
    const costPerUnit = actualQty > 0 ? totalCost / actualQty : 0;

    // 4. Add finished goods to stock & update cost price for Sales COGS
    setProducts(prev =>
      prev.map(p => {
        if (p.id === recipe.finishedProductId) {
          const newStock = p.currentStock + actualQty;
          newMovements.push({
            id: `MOV-PRD-IN-${Date.now()}`,
            date: mfgDate,
            productId: p.id,
            productName: p.nameBangla,
            type: 'PRODUCTION_IN',
            referenceNo: `PROD-${batchNo.trim()}`,
            referenceNote: `নতুন ব্যাচ উৎপাদিত (${actualQty} ${recipe.outputUnit})`,
            batchNumber: batchNo.trim(),
            inQty: actualQty,
            outQty: 0,
            balanceAfter: newStock,
            unitCost: costPerUnit,
            totalValue: actualQty * costPerUnit,
            createdByName: supervisor,
          });

          return {
            ...p,
            currentStock: newStock,
            purchasePrice: costPerUnit > 0 ? Math.round(costPerUnit * 100) / 100 : p.purchasePrice,
          };
        }
        return p;
      })
    );

    // Save stock movements
    setStockMovements(prev => [...newMovements, ...prev]);

    // 5. Create batch for finished goods
    const newBatch: BatchItem = {
      id: `BAT-PRUN-${Date.now()}`,
      productId: recipe.finishedProductId,
      productName: recipe.finishedProductName,
      batchNumber: batchNo.trim(),
      quantity: actualQty,
      initialQuantity: actualQty,
      mfgDate,
      expDate,
      purchaseOrProdPrice: costPerUnit,
      supplierOrProductionRef: `PROD-${batchNo.trim()}`,
      status: 'ACTIVE',
    };
    setBatches(prev => [newBatch, ...prev]);

    // 6. If wastage > 0, generate WastageRecord
    let wastageVoucherNo: string | undefined;
    if (wastageQty > 0) {
      wastageVoucherNo = `WST-PRD-${batchNo.trim()}`;
      const wastageLoss = wastageQty * costPerUnit;
      const wastageEntry: WastageRecord = {
        id: `WST-${Date.now()}`,
        voucherNo: wastageVoucherNo,
        date: mfgDate,
        productId: recipe.finishedProductId,
        productName: recipe.finishedProductName,
        category: 'FINISHED_GOODS',
        batchNumber: batchNo.trim(),
        quantity: wastageQty,
        unit: recipe.outputUnit,
        unitCost: costPerUnit,
        totalLoss: wastageLoss,
        reason: 'FACTORY_SPILLAGE',
        remarks: `প্রোডাকশন ব্যাচ ${batchNo.trim()} চলাকালীন অপচয়/লসের হিসাব (${wastagePercent}% অপচয়)`,
        approvedBy: supervisor,
      };
      setWastageRecords(prev => [wastageEntry, ...prev]);
    }

    // 7. Record production run (Frozen snapshot of costs)
    const run: ProductionRun = {
      id: `PRUN-${Date.now()}`,
      batchNo: batchNo.trim(),
      date: mfgDate,
      recipeId: recipe.id,
      recipeName: recipe.recipeName,
      targetProductId: recipe.finishedProductId,
      expectedQuantity: expectedQty,
      producedQuantity: actualQty,
      wastageQuantity: wastageQty,
      yieldPercent,
      wastagePercent,
      unit: recipe.outputUnit,
      mfgDate,
      expDate,
      rawMaterialCost: totalRawCost,
      laborCost,
      overheadCost,
      totalProductionCost: totalCost,
      costPerUnit,
      supervisor,
      notes,
      wastageVoucherNo,
      // Compatibility aliases
      outputQuantity: actualQty,
      outputProductId: recipe.finishedProductId,
      totalRawMaterialCost: totalRawCost,
      utilityCost: overheadCost,
      packagingCost: 0,
      unitCost: costPerUnit,
    };
    setProductionRuns(prev => [run, ...prev]);

    // 8. Update Production Cost Master Sheet for this product
    setProductionCosts(prev => {
      const existing = prev.find(c => c.productId === recipe.finishedProductId);
      if (existing) {
        return prev.map(c =>
          c.productId === recipe.finishedProductId
            ? {
                ...c,
                rawMaterialCost: actualQty > 0 ? totalRawCost / actualQty : c.rawMaterialCost,
                laborCost: actualQty > 0 ? laborCost / actualQty : c.laborCost,
                overheadUtilityCost: actualQty > 0 ? overheadCost / actualQty : c.overheadUtilityCost,
                totalUnitCost: costPerUnit,
                suggestedSalePrice: Math.round(costPerUnit * (1 + (c.targetProfitMarginPercent || 25) / 100) * 10) / 10,
                updatedAt: mfgDate,
              }
            : c
        );
      } else {
        const newCostItem: ProductionCostItem = {
          id: `PC-${Date.now()}`,
          productId: recipe.finishedProductId,
          productName: recipe.finishedProductName,
          rawMaterialCost: actualQty > 0 ? totalRawCost / actualQty : 0,
          laborCost: actualQty > 0 ? laborCost / actualQty : 0,
          packagingCost: 0,
          overheadUtilityCost: actualQty > 0 ? overheadCost / actualQty : 0,
          totalUnitCost: costPerUnit,
          targetProfitMarginPercent: 25,
          suggestedSalePrice: Math.round(costPerUnit * 1.25 * 10) / 10,
          updatedAt: mfgDate,
        };
        return [...prev, newCostItem];
      }
    });

    logAudit('PRODUCTION_RUN', 'Production / BOM', `প্রোডাকশন সম্পন্ন: ${recipe.finishedProductName} (${actualQty} ${recipe.outputUnit}) ব্যাচ: ${batchNo.trim()}${wastageQty > 0 ? ` [অপচয়: ${wastageQty} ${recipe.outputUnit}]` : ''}`);
    return { success: true, run };
  };

  // Production Planner capacity calculation
  const calculateProductionCapacity = (recipeId: string, targetUnits?: number) => {
    const recipe = bomRecipes.find(r => r.id === recipeId);
    if (!recipe || recipe.outputQuantity <= 0) {
      return {
        maxProducibleUnits: 0,
        maxBatches: 0,
        limitingIngredient: null,
        ingredientStatuses: [],
      };
    }

    const standardBatch = recipe.outputQuantity;
    let minBatches = Infinity;
    let limitingIng: {
      productId: string;
      productName: string;
      currentStock: number;
      requiredPerBatch: number;
      unit: string;
    } | null = null;

    const ingredientStatuses = recipe.ingredients.map(ing => {
      const p = products.find(prod => prod.id === ing.productId);
      const stock = p?.currentStock || 0;
      const batchesPossible = ing.quantity > 0 ? stock / ing.quantity : Infinity;
      const unitsPossible = Math.floor(batchesPossible * standardBatch);

      const target = targetUnits || standardBatch;
      const requiredForTarget = (ing.quantity / standardBatch) * target;
      const shortageForTarget = Math.max(0, requiredForTarget - stock);

      if (batchesPossible < minBatches) {
        minBatches = batchesPossible;
        limitingIng = {
          productId: ing.productId,
          productName: ing.productName,
          currentStock: stock,
          requiredPerBatch: ing.quantity,
          unit: ing.unit,
        };
      }

      return {
        productId: ing.productId,
        productName: ing.productName,
        currentStock: stock,
        requiredPerBatch: ing.quantity,
        unit: ing.unit,
        producibleBatches: Math.max(0, Math.floor(batchesPossible)),
        producibleUnits: Math.max(0, unitsPossible),
        requiredForTarget: Number(requiredForTarget.toFixed(2)),
        shortageForTarget: Number(shortageForTarget.toFixed(2)),
      };
    });

    const safeMinBatches = minBatches === Infinity ? 0 : Math.max(0, Math.floor(minBatches));
    const maxProducibleUnits = safeMinBatches * standardBatch;

    return {
      maxProducibleUnits,
      maxBatches: safeMinBatches,
      limitingIngredient: limitingIng,
      ingredientStatuses,
    };
  };

  // BOM Recipes & Costing
  const addBOMRecipe = (recipe: Omit<BOMRecipe, 'id'>) => {
    const newRecipe: BOMRecipe = {
      ...recipe,
      id: `BOM-${Date.now().toString().slice(-4)}`,
      recipeCode: recipe.recipeCode || `BOM-${Date.now().toString().slice(-4)}`,
      name: recipe.recipeName,
      outputProductId: recipe.finishedProductId,
      outputProductName: recipe.finishedProductName,
      standardBatchSize: recipe.outputQuantity,
      batchUnit: recipe.outputUnit,
      updatedAt: new Date().toISOString().substring(0, 10),
    };
    setBomRecipes(prev => [...prev, newRecipe]);
    logAudit('CREATE', 'Production / BOM', `নতুন রেসিপি তৈরি: ${recipe.recipeName}`);
  };

  const updateBOMRecipe = (id: string, update: Partial<BOMRecipe>) => {
    setBomRecipes(prev => prev.map(r => r.id === id ? {
      ...r,
      ...update,
      name: update.recipeName || r.name || r.recipeName,
      outputProductId: update.finishedProductId || r.outputProductId || r.finishedProductId,
      outputProductName: update.finishedProductName || r.outputProductName || r.finishedProductName,
      standardBatchSize: update.outputQuantity || r.standardBatchSize || r.outputQuantity,
      batchUnit: update.outputUnit || r.batchUnit || r.outputUnit,
      updatedAt: new Date().toISOString().substring(0, 10),
    } : r));
    logAudit('UPDATE', 'Production / BOM', `রেসিপি আপডেট: ${id}`);
  };

  const deleteBOMRecipe = (id: string) => {
    const recipe = bomRecipes.find(r => r.id === id);
    setBomRecipes(prev => prev.filter(r => r.id !== id));
    logAudit('DELETE', 'Production / BOM', `রেসিপি মুছে ফেলা হয়েছে: ${recipe?.recipeName || id}`);
  };

  const updateProductionCost = (id: string, update: Partial<ProductionCostItem>) => {
    setProductionCosts(prev => prev.map(c => c.id === id ? { ...c, ...update, updatedAt: new Date().toISOString().substring(0, 10) } : c));
    logAudit('UPDATE', 'Production Cost Master', `কস্টিং শিট আপডেট: ${id}`);
  };

  // Payments / Collections
  const receiveCustomerPayment = (
    customerId: string,
    amount: number,
    method: 'CASH' | 'BANK',
    bankId?: string,
    notes?: string
  ) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer || amount <= 0) return;

    setCustomers(prev =>
      prev.map(c => c.id === customerId ? {
        ...c,
        totalPaid: c.totalPaid + amount,
        currentDue: Math.max(0, c.currentDue - amount),
      } : c)
    );

    if (method === 'CASH') {
      setSettings(prev => ({ ...prev, cashInHandBalance: prev.cashInHandBalance + amount }));
    } else if (bankId) {
      setBankAccounts(prev => prev.map(b => b.id === bankId ? { ...b, balance: b.balance + amount } : b));
    }

    const voucherNo = `MR-${Date.now().toString().slice(-6)}`;
    const entry: LedgerEntry = {
      id: `LDG-${Date.now()}`,
      date: new Date().toISOString().substring(0, 10),
      voucherNo,
      accountType: 'CUSTOMER',
      accountId: customer.id,
      accountTitle: customer.name,
      description: `কাস্টমার বকেয়া কালেকশন (${notes || 'নগদ/ব্যাংক জমা'})`,
      debit: 0,
      credit: amount,
      createdBy: currentUser?.name || 'Accounts',
    };
    setLedgers(prev => [entry, ...prev]);
    logAudit('UPDATE', 'Customer Ledger', `${customer.name} থেকে ৳${amount.toLocaleString()} বকেয়া আদায়।`);
  };

  const paySupplierPayment = (
    supplierId: string,
    amount: number,
    method: 'CASH' | 'BANK',
    bankId?: string,
    notes?: string
  ) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier || amount <= 0) return;

    setSuppliers(prev =>
      prev.map(s => s.id === supplierId ? {
        ...s,
        totalPaid: s.totalPaid + amount,
        currentPayable: Math.max(0, s.currentPayable - amount),
      } : s)
    );

    if (method === 'CASH') {
      setSettings(prev => ({ ...prev, cashInHandBalance: Math.max(0, prev.cashInHandBalance - amount) }));
    } else if (bankId) {
      setBankAccounts(prev => prev.map(b => b.id === bankId ? { ...b, balance: b.balance - amount } : b));
    }

    const voucherNo = `PV-${Date.now().toString().slice(-6)}`;
    const entry: LedgerEntry = {
      id: `LDG-${Date.now()}`,
      date: new Date().toISOString().substring(0, 10),
      voucherNo,
      accountType: 'SUPPLIER',
      accountId: supplier.id,
      accountTitle: supplier.name,
      description: `সাপ্লায়ার দেনা পরিশোধ (${notes || 'পেমেন্ট'})`,
      debit: amount,
      credit: 0,
      createdBy: currentUser?.name || 'Accounts',
    };
    setLedgers(prev => [entry, ...prev]);
    logAudit('UPDATE', 'Supplier Ledger', `${supplier.name}-কে ৳${amount.toLocaleString()} দেনা পরিশোধ।`);
  };

  // Adjust Stock directly (used by Inventory & Expiry)
  const adjustStock = (productId: string, delta: number, reason: string) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === productId) {
          const newStock = Math.max(0, p.currentStock + delta);
          return { ...p, currentStock: newStock };
        }
        return p;
      })
    );
    const prod = products.find(p => p.id === productId);
    logAudit('UPDATE', 'Inventory Stock', `${prod?.nameBangla || productId}-এর স্টক সমন্বয়: ${delta >= 0 ? '+' : ''}${delta} (${reason})`);
  };

  // Add Bank / Cash Account
  const addBankAccount = (acc: Omit<BankAccount, 'id'>) => {
    const newAcc: BankAccount = {
      ...acc,
      id: `BANK-${Date.now().toString().slice(-4)}`,
    };
    setBankAccounts(prev => [...prev, newAcc]);
    logAudit('CREATE', 'Cash & Bank', `নতুন অ্যাকাউন্ট যোগ: ${acc.accountName} (${acc.type})`);
  };

  // Customer & Supplier Ledgers Payment Wrappers
  const collectCustomerPayment = (
    customerId: string,
    amount: number,
    method: 'CASH' | 'BANK',
    notesOrBankId?: string,
    maybeBankId?: string
  ) => {
    const isNotesFourth = maybeBankId !== undefined || (notesOrBankId && !notesOrBankId.startsWith('BANK-'));
    const notes = isNotesFourth ? notesOrBankId : undefined;
    const bankId = isNotesFourth ? maybeBankId : notesOrBankId;
    receiveCustomerPayment(customerId, amount, method, bankId, notes);
  };

  const paySupplier = (
    supplierId: string,
    amount: number,
    method: 'CASH' | 'BANK',
    notesOrBankId?: string,
    maybeBankId?: string
  ) => {
    const isNotesFourth = maybeBankId !== undefined || (notesOrBankId && !notesOrBankId.startsWith('BANK-'));
    const notes = isNotesFourth ? notesOrBankId : undefined;
    const bankId = isNotesFourth ? maybeBankId : notesOrBankId;
    paySupplierPayment(supplierId, amount, method, bankId, notes);
  };

  // Fund Transfer supporting both (fromAccId, toAccId, amount, notes) and (fromType, toType, fromBankId, toBankId, amount, notes)
  const transferFunds = (
    arg1: any,
    arg2: any,
    arg3: any,
    arg4?: any,
    arg5?: any,
    arg6?: any
  ): { success: boolean; error?: string } => {
    let fromType: 'CASH' | 'BANK' = 'BANK';
    let toType: 'CASH' | 'BANK' = 'BANK';
    let fromBankId: string | null = null;
    let toBankId: string | null = null;
    let amount = 0;
    let notes = '';

    if (typeof arg3 === 'number') {
      // (fromAccId, toAccId, amount, notes)
      const fromAcc = bankAccounts.find(b => b.id === arg1);
      const toAcc = bankAccounts.find(b => b.id === arg2);
      fromType = arg1 === 'CASH' || fromAcc?.type === 'CASH' ? 'CASH' : 'BANK';
      toType = arg2 === 'CASH' || toAcc?.type === 'CASH' ? 'CASH' : 'BANK';
      fromBankId = arg1;
      toBankId = arg2;
      amount = arg3;
      notes = arg4 || '';
    } else {
      // (fromType, toType, fromBankId, toBankId, amount, notes)
      fromType = arg1;
      toType = arg2;
      fromBankId = arg3;
      toBankId = arg4;
      amount = Number(arg5) || 0;
      notes = arg6 || '';
    }

    if (amount <= 0) return { success: false, error: 'স্থানান্তর পরিমাণ ০ এর চেয়ে বেশি হতে হবে।' };

    // Check source balance
    if (fromType === 'CASH') {
      if (settings.cashInHandBalance < amount) {
        return { success: false, error: 'নগদ ক্যাশে পর্যাপ্ত ব্যালেন্স নেই।' };
      }
      setSettings(prev => ({ ...prev, cashInHandBalance: prev.cashInHandBalance - amount }));
    } else {
      const fromBank = bankAccounts.find(b => b.id === fromBankId);
      if (!fromBank || fromBank.balance < amount) {
        return { success: false, error: 'প্রেরক ব্যাংকে পর্যাপ্ত ব্যালেন্স নেই।' };
      }
      setBankAccounts(prev => prev.map(b => b.id === fromBankId ? { ...b, balance: b.balance - amount } : b));
    }

    // Add to target
    if (toType === 'CASH') {
      setSettings(prev => ({ ...prev, cashInHandBalance: prev.cashInHandBalance + amount }));
    } else {
      setBankAccounts(prev => prev.map(b => b.id === toBankId ? { ...b, balance: b.balance + amount } : b));
    }

    const voucherNo = `TRF-${Date.now().toString().slice(-6)}`;
    const entry: LedgerEntry = {
      id: `LDG-${Date.now()}`,
      date: new Date().toISOString().substring(0, 10),
      voucherNo,
      accountType: fromType === 'CASH' ? 'CASH' : 'BANK',
      accountTitle: 'অভ্যন্তরীণ ফান্ড ট্রান্সফার',
      description: `${fromType} থেকে ${toType} তে স্থানান্তর (${notes || ''})`,
      debit: amount,
      credit: amount,
      createdBy: currentUser?.name || 'Accounts',
    };
    setLedgers(prev => [entry, ...prev]);
    logAudit('UPDATE', 'Cash Ledger / Bank Ledger', `৳${amount.toLocaleString()} ফান্ড ট্রান্সফার (${fromType} -> ${toType})`);
    return { success: true };
  };

  // HR Payroll Management
    const saveManualPayroll = (month: string, manualRecords: any[]) => {
    const otherRecords = salaries.filter(s => !(s.month === month && s.employeeId.startsWith('MANUAL_')));
    setSalaries([...otherRecords, ...manualRecords]);
    
    const totalPaid = manualRecords.reduce((sum, r) => sum + (r.netPayable || 0), 0);
    if (totalPaid > 0) {
        setSettings(prev => ({ ...prev, cashInHandBalance: Math.max(0, prev.cashInHandBalance - totalPaid) }));
        
        const entry = {
          id: `LDG-MANUAL-${Date.now()}`,
          date: new Date().toISOString().substring(0, 10),
          voucherNo: `PAY-M-${Date.now().toString().slice(-6)}`,
          accountType: 'SALARY',
          accountTitle: `ম্যানুয়াল স্যালারি পেমেন্ট`,
          description: `${month} মাসের ম্যানুয়াল বেতন পরিশোধ`,
          debit: totalPaid,
          credit: 0,
          method: 'CASH',
          category: 'SALARY',
        };
        // @ts-ignore
        setCashBankLedgers(prev => [entry, ...prev]);
        logAudit('UPDATE', 'Manual Payroll', `Total ${totalPaid} disbursed for manual payroll (${month})`);
    }
  };

  const processMonthlyPayroll = (month: string) => {
    const existingForMonth = (salaries || []).filter(s => s.month === month);
    const existingEmpIds = new Set(existingForMonth.map(s => s.employeeId));

    const newRecords: SalaryPayment[] = (employees || [])
      .filter(e => e.status === 'ACTIVE' && !existingEmpIds.has(e.id))
      .map(e => {
        const allowance = (e.houseRentAllowance || 0) + (e.medicalAllowance || 0);
        const netPayable = e.basicSalary + allowance;
        return {
          id: `SAL-${month}-${e.id}`,
          month,
          employeeId: e.id,
          employeeName: e.name,
          designation: e.designation || e.role || '',
          basicSalary: e.basicSalary,
          allowance,
          overtime: 0,
          deduction: 0,
          netPayable,
          status: 'PENDING',
          netSalary: netPayable,
          overtimeAmount: 0,
          bonus: allowance,
          deductions: 0,
        };
      });

    if (newRecords.length > 0) {
      setSalaries(prev => [...newRecords, ...prev]);
      logAudit('CREATE', 'HR / Payroll', `${month} মাসের পে-রোল জেনারেট করা হয়েছে (${newRecords.length} জন কর্মী)`);
    }
  };

  const disburseSalary = (id: string, method: 'CASH' | 'BANK', bankId?: string) => {
    const rec = salaries.find(s => s.id === id);
    if (!rec || rec.status === 'PAID') return;

    const amount = rec.netPayable || rec.netSalary || rec.basicSalary;
    setSalaries(prev =>
      prev.map(s => s.id === id ? {
        ...s,
        status: 'PAID',
        paidDate: new Date().toISOString().substring(0, 10),
        paymentDate: new Date().toISOString().substring(0, 10),
        paidVia: method,
        bankAccountId: bankId,
      } : s)
    );

    if (method === 'CASH') {
      setSettings(prev => ({ ...prev, cashInHandBalance: Math.max(0, prev.cashInHandBalance - amount) }));
    } else if (bankId) {
      setBankAccounts(prev => prev.map(b => b.id === bankId ? { ...b, balance: b.balance - amount } : b));
    }

    const entry: LedgerEntry = {
      id: `LDG-${Date.now()}`,
      date: new Date().toISOString().substring(0, 10),
      voucherNo: `PAY-${Date.now().toString().slice(-6)}`,
      accountType: 'SALARY',
      accountTitle: `বেতন: ${rec.employeeName}`,
      description: `${rec.month} মাসের বেতন ও এলাউন্স পরিশোধ`,
      debit: amount,
      credit: 0,
      createdBy: currentUser?.name || 'HR',
    };
    setLedgers(prev => [entry, ...prev]);
    logAudit('UPDATE', 'HR / Payroll', `${rec.employeeName}-কে ${rec.month} মাসের বেতন ৳${amount} পরিশোধ সম্পন্ন`);
  };

  // Utility Bill Aliases
  const addUtilityBill = (record: Omit<UtilityRentRecord, 'id'>) => {
    addUtilityRent(record);
  };

  const payUtilityBill = (id: string, method: 'CASH' | 'BANK', bankId?: string) => {
    payUtilityRent(id, method, bankId);
  };

  // Transport, Expenses, Utility, Salary, Withdrawal, Assets
  const addTransportTrip = (trip: Omit<TransportTrip, 'id' | 'tripNo'>) => {
    const tripNo = `TRP-${new Date().toISOString().slice(2, 7).replace('-', '')}-${Math.floor(10 + Math.random() * 90)}`;
    const costFuel = trip.fuelCost ?? trip.costFuel ?? 0;
    const costTollOther = trip.tollCost ?? trip.costTollOther ?? 0;
    const laborCost = trip.laborCost || 0;
    const otherCost = trip.otherCost || 0;
    const totalCost = (costFuel + costTollOther + laborCost + otherCost) || trip.totalCost || trip.totalTripCost || 0;

    const transportType = trip.transportType || (trip.purpose === 'PURCHASE_PICKUP' ? 'PURCHASE' : 'SALES');

    const newTrip: TransportTrip = {
      ...trip,
      id: `TRIP-${Date.now()}`,
      tripNo,
      transportType,
      costFuel,
      costTollOther,
      fuelCost: costFuel,
      tollCost: costTollOther,
      laborCost,
      otherCost,
      totalCost,
      totalTripCost: totalCost,
    };
    setTransports(prev => [newTrip, ...prev]);

    // deduct cost
    if (totalCost > 0) {
      if (trip.paidVia === 'CASH') {
        setSettings(prev => ({ ...prev, cashInHandBalance: Math.max(0, prev.cashInHandBalance - totalCost) }));
      }
    }
    const typeLabel = transportType === 'PURCHASE' ? 'ক্রয় পরিবহন (Landed Cost / COGS)' : 'বিক্রয় পরিবহন (Operating Expense)';
    logAudit('CREATE', 'Transport', `${typeLabel} ট্রিপ রেকর্ড: ${tripNo} (গন্তব্য: ${trip.destination || trip.routeTo || '-'}, খরচ: ৳${totalCost})`);
  };

  const addExpense = (expense: Omit<ExpenseRecord, 'id' | 'voucherNo'>) => {
    const voucherNo = `VCH-EXP-${Date.now().toString().slice(-6)}`;
    const newExp: ExpenseRecord = { ...expense, id: `EXP-${Date.now()}`, voucherNo };
    setExpenses(prev => [newExp, ...prev]);

    // Deduct
    if (expense.paidVia === 'CASH') {
      setSettings(prev => ({ ...prev, cashInHandBalance: Math.max(0, prev.cashInHandBalance - expense.amount) }));
    } else if (expense.bankAccountId) {
      setBankAccounts(prev => prev.map(b => b.id === expense.bankAccountId ? { ...b, balance: b.balance - expense.amount } : b));
    }

    const entry: LedgerEntry = {
      id: `LDG-${Date.now()}`,
      date: expense.date,
      voucherNo,
      accountType: 'EXPENSE',
      accountTitle: expense.category,
      description: `${expense.note} (${expense.payee})`,
      debit: expense.amount,
      credit: 0,
      createdBy: currentUser?.name || 'Accounts',
    };
    setLedgers(prev => [entry, ...prev]);
    logAudit('CREATE', 'Expenses', `খরচ রেকর্ড: ${expense.category} - ৳${expense.amount}`);
  };

  const addUtilityRent = (record: Omit<UtilityRentRecord, 'id'>) => {
    const newRec: UtilityRentRecord = { ...record, id: `UTL-${Date.now()}` };
    setUtilityRentRecords(prev => [newRec, ...prev]);

    if (record.status === 'PAID') {
      if (record.paidVia === 'CASH') {
        setSettings(prev => ({ ...prev, cashInHandBalance: Math.max(0, prev.cashInHandBalance - record.amount) }));
      } else if (record.bankAccountId) {
        setBankAccounts(prev => prev.map(b => b.id === record.bankAccountId ? { ...b, balance: b.balance - record.amount } : b));
      }
    }
    logAudit('CREATE', 'Monthly Utility & Rent', `${record.type} বিল রেকর্ড: ৳${record.amount}`);
  };

  const payUtilityRent = (id: string, method: 'CASH' | 'BANK', bankId?: string) => {
    const rec = utilityRentRecords.find(r => r.id === id);
    if (!rec || rec.status === 'PAID') return;

    setUtilityRentRecords(prev =>
      prev.map(r => r.id === id ? {
        ...r,
        status: 'PAID',
        paidDate: new Date().toISOString().substring(0, 10),
        paidVia: method,
        bankAccountId: bankId,
      } : r)
    );

    if (method === 'CASH') {
      setSettings(prev => ({ ...prev, cashInHandBalance: Math.max(0, prev.cashInHandBalance - rec.amount) }));
    } else if (bankId) {
      setBankAccounts(prev => prev.map(b => b.id === bankId ? { ...b, balance: b.balance - rec.amount } : b));
    }

    logAudit('UPDATE', 'Monthly Utility & Rent', `${rec.type} বিল পরিশোধ সম্পন্ন: ৳${rec.amount}`);
  };

  const addOwnerWithdrawal = (wth: Omit<OwnerWithdrawal, 'id' | 'voucherNo'>) => {
    const voucherNo = `WTH-${Date.now().toString().slice(-6)}`;
    const paidVia = wth.paidVia || wth.paymentMethod || 'CASH';
    const reason = wth.reason || wth.purpose || 'মালিকের ব্যক্তিগত উত্তোলন';
    const purpose = wth.purpose || wth.reason || 'মালিকের ব্যক্তিগত উত্তোলন';
    
    // Find bank account name if bankId provided
    const matchedBank = wth.bankAccountId ? bankAccounts.find(b => b.id === wth.bankAccountId) : undefined;
    const bankAccountName = wth.bankAccountName || (matchedBank ? `${matchedBank.bankName} - ${matchedBank.accountName}` : undefined);

    const newWth: OwnerWithdrawal = {
      ...wth,
      id: `WTH-${Date.now()}`,
      voucherNo,
      paidVia,
      paymentMethod: paidVia,
      reason,
      purpose,
      bankAccountName,
    };
    setOwnerWithdrawals(prev => [newWth, ...prev]);

    if (paidVia === 'CASH') {
      setSettings(prev => ({ ...prev, cashInHandBalance: Math.max(0, prev.cashInHandBalance - wth.amount) }));
    } else if (wth.bankAccountId) {
      setBankAccounts(prev => prev.map(b => b.id === wth.bankAccountId ? { ...b, balance: b.balance - wth.amount } : b));
    }

    const entry: LedgerEntry = {
      id: `LDG-${Date.now()}`,
      date: wth.date,
      voucherNo,
      accountType: 'WITHDRAWAL',
      accountTitle: wth.ownerName,
      description: `স্বত্বাধিকারী উত্তোলন (মূলধন সমন্বয়): ${reason}`,
      debit: wth.amount,
      credit: 0,
      createdBy: currentUser?.name || 'Accounts',
    };
    setLedgers(prev => [entry, ...prev]);
    logAudit('CREATE', 'Owner Withdrawal', `${wth.ownerName}-এর ৳${wth.amount.toLocaleString()} উত্তোলন রেকর্ড (Equity Draw)`);
  };

  const deleteOwnerWithdrawal = (id: string) => {
    const wth = ownerWithdrawals.find(w => w.id === id);
    if (!wth) return;
    setOwnerWithdrawals(prev => prev.filter(w => w.id !== id));
    logAudit('DELETE', 'Owner Withdrawal', `উত্তোলন রেকর্ড #${wth.voucherNo || id} (৳${wth.amount.toLocaleString()}) বাতিল করা হয়েছে`);
  };

  const addPartner = (partner: Omit<OwnerPartner, 'id'>) => {
    const newPartner: OwnerPartner = {
      ...partner,
      id: `PARTNER-${Date.now().toString().slice(-4)}`,
    };
    setPartners(prev => [...prev, newPartner]);
    logAudit('CREATE', 'Owner Withdrawal', `নতুন অংশীদার/মালিক যুক্ত: ${partner.name}`);
  };

  const addEmployee = (emp: Omit<Employee, 'id'>) => {
    const newEmp: Employee = { ...emp, id: `EMP-${Date.now().toString().slice(-4)}` };
    setEmployees(prev => [...prev, newEmp]);
    logAudit('CREATE', 'HR / Manual Salary Statement', `নতুন কর্মচারী: ${emp.name} (${emp.designation})`);
  };

  const paySalary = (salaryData: Omit<SalaryPayment, 'id' | 'status'>) => {
    const newSal: SalaryPayment = {
      ...salaryData,
      id: `SAL-${Date.now()}`,
      status: 'PAID',
      paymentDate: new Date().toISOString().substring(0, 10),
    };
    setSalaries(prev => [newSal, ...prev]);

    if (salaryData.paidVia === 'CASH') {
      setSettings(prev => ({ ...prev, cashInHandBalance: Math.max(0, prev.cashInHandBalance - salaryData.netPayable) }));
    } else if (salaryData.bankAccountId) {
      setBankAccounts(prev => prev.map(b => b.id === salaryData.bankAccountId ? { ...b, balance: b.balance - salaryData.netPayable } : b));
    }

    const entry: LedgerEntry = {
      id: `LDG-${Date.now()}`,
      date: new Date().toISOString().substring(0, 10),
      voucherNo: `PAYROLL-${Date.now().toString().slice(-6)}`,
      accountType: 'SALARY',
      accountTitle: `বেতন: ${salaryData.employeeName}`,
      description: `${salaryData.month} মাসের বেতন ও এলাউন্স পরিশোধ`,
      debit: salaryData.netPayable,
      credit: 0,
      createdBy: currentUser?.name || 'HR',
    };
    setLedgers(prev => [entry, ...prev]);
    logAudit('CREATE', 'HR / Manual Salary Statement', `${salaryData.employeeName}-কে ${salaryData.month} মাসের বেতন ৳${salaryData.netPayable} পরিশোধ`);
  };

  const addSystemTask = (task: Omit<SystemTask, 'id'>) => {
    const newTask: SystemTask = {
      ...task,
      id: `TASK-${Date.now().toString().slice(-4)}`,
    };
    setSystemTasks(prev => [...prev, newTask]);
    logAudit('CREATE', 'System Tasks', `নতুন টাস্ক তৈরি: ${task.title}`);
  };

  const updateSystemTask = (id: string, update: Partial<SystemTask>) => {
    setSystemTasks(prev => prev.map(t => t.id === id ? { ...t, ...update } : t));
    logAudit('UPDATE', 'System Tasks', `টাস্ক আপডেট: ${update.title || id}`);
  };

  const addAsset = (asset: Omit<DepartmentAsset, 'id'>) => {
    const newAsset: DepartmentAsset = {
      ...asset,
      id: `AST-${Date.now().toString().slice(-4)}`,
      maintenanceLogs: asset.maintenanceLogs || [],
    };
    setAssets(prev => [...prev, newAsset]);
    logAudit('CREATE', 'Department Assets', `নতুন বিভাগীয় সম্পদ যোগ: ${asset.name} (বিভাগ: ${asset.department}, ক্রয়মূল্য: ৳${asset.cost.toLocaleString()})`);
  };

  const updateAsset = (id: string, update: Partial<DepartmentAsset>) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, ...update } : a));
    logAudit('UPDATE', 'Department Assets', `সম্পদ #${id} তথ্য আপডেট করা হয়েছে`);
  };

  const deleteAsset = (id: string) => {
    const asset = assets.find(a => a.id === id);
    setAssets(prev => prev.filter(a => a.id !== id));
    logAudit('DELETE', 'Department Assets', `সম্পদ #${asset?.code || id} (${asset?.name || ''}) মুছে ফেলা হয়েছে`);
  };

  const addAssetMaintenanceLog = (assetId: string, log: Omit<AssetMaintenanceLog, 'id' | 'assetId'>) => {
    const newLog: AssetMaintenanceLog = {
      ...log,
      id: `MNT-${Date.now()}`,
      assetId,
    };
    setAssets(prev => prev.map(a => {
      if (a.id === assetId) {
        return {
          ...a,
          maintenanceLogs: [newLog, ...(a.maintenanceLogs || [])],
        };
      }
      return a;
    }));
    logAudit('CREATE', 'Department Assets', `সম্পদ রক্ষণাবেক্ষণ/মেরামত লগ যোগ: ৳${log.cost.toLocaleString()} (${log.description})`);
  };

  const deleteAssetMaintenanceLog = (assetId: string, logId: string) => {
    setAssets(prev => prev.map(a => {
      if (a.id === assetId) {
        return {
          ...a,
          maintenanceLogs: (a.maintenanceLogs || []).filter(m => m.id !== logId),
        };
      }
      return a;
    }));
    logAudit('DELETE', 'Department Assets', `সম্পদ রক্ষণাবেক্ষণ লগ রেকর্ড মুছে ফেলা হয়েছে`);
  };

  // Purely dynamic calculated formulas (no stale values!)
  const totalStockValue = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.currentStock * p.purchasePrice), 0);
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter(p => p.currentStock <= p.minStockAlert).length;
  }, [products]);

  const outOfStockCount = useMemo(() => {
    return products.filter(p => p.currentStock <= 0).length;
  }, [products]);

  const expiringBatchesCount = useMemo(() => {
    const now = new Date();
    const thirtyDaysAhead = new Date(now.getTime() + 30 * 86400000);
    return batches.filter(b => {
      if (b.status === 'DEPLETED') return false;
      const exp = new Date(b.expDate);
      return exp <= thirtyDaysAhead;
    }).length;
  }, [batches]);

  const expiredBatchesCount = useMemo(() => {
    const now = new Date();
    return batches.filter(b => b.status === 'EXPIRED' || (b.status !== 'DEPLETED' && new Date(b.expDate) < now)).length;
  }, [batches]);

  const safeBatchesCount = useMemo(() => {
    const now = new Date();
    const thirtyDaysAhead = new Date(now.getTime() + 30 * 86400000);
    return batches.filter(b => b.status === 'ACTIVE' && new Date(b.expDate) > thirtyDaysAhead).length;
  }, [batches]);

  const recordStockMovement = (movement: Omit<StockMovement, 'id' | 'balanceAfter'> & { balanceAfter?: number }) => {
    const prod = products.find(p => p.id === movement.productId);
    const balanceAfter = movement.balanceAfter ?? (prod ? prod.currentStock : 0);
    const newMovement: StockMovement = {
      ...movement,
      balanceAfter,
      id: `MOV-${Date.now().toString().slice(-6)}`,
    };
    setStockMovements(prev => [newMovement, ...prev]);
    return newMovement;
  };

  const getProductStockMovements = (productId: string) => {
    return stockMovements.filter(m => m.productId === productId);
  };

  const recordWastageWriteOff = (
    productIdOrData: string | {
      productId: string;
      batchNumber?: string;
      quantity: number;
      reason: WastageReason | string;
      remarks?: string;
      date?: string;
      approvedBy?: string;
    },
    argQuantity?: number,
    argReason?: WastageReason | string,
    argBatchNumber?: string,
    argRemarks?: string,
    argApprovedBy?: string
  ) => {
    let productId: string;
    let quantity: number;
    let reason: WastageReason | string;
    let batchNumber: string | undefined;
    let remarks: string | undefined;
    let approvedBy: string | undefined;
    let dateStr: string | undefined;

    if (typeof productIdOrData === 'object' && productIdOrData !== null) {
      productId = productIdOrData.productId;
      quantity = productIdOrData.quantity;
      reason = productIdOrData.reason;
      batchNumber = productIdOrData.batchNumber;
      remarks = productIdOrData.remarks;
      approvedBy = productIdOrData.approvedBy;
      dateStr = productIdOrData.date;
    } else {
      productId = productIdOrData as string;
      quantity = argQuantity || 0;
      reason = argReason || 'OTHER';
      batchNumber = argBatchNumber;
      remarks = argRemarks;
      approvedBy = argApprovedBy;
    }

    const prod = products.find(p => p.id === productId);
    if (!prod || quantity <= 0) return { success: false, error: 'অবৈধ পণ্য বা পরিমাণ' };
    if (prod.currentStock < quantity) return { success: false, error: 'পর্যাপ্ত স্টক নেই' };

    const unitCost = prod.purchasePrice || 0;
    const totalLoss = quantity * unitCost;
    const voucherNo = `WST-${Date.now().toString().slice(-6)}`;

    const newRecord: WastageRecord = {
      id: `WST-REC-${Date.now().toString().slice(-6)}`,
      voucherNo,
      date: dateStr || new Date().toISOString().substring(0, 10),
      productId,
      productName: prod.nameBangla,
      category: prod.category,
      batchNumber,
      quantity,
      unit: prod.unit,
      unitCost,
      totalLoss,
      reason,
      remarks,
      approvedBy: approvedBy || currentUser?.name || 'Authorized Supervisor',
    };

    setWastageRecords(prev => [newRecord, ...prev]);
    adjustStock(productId, -quantity, `Wastage write-off: ${reason}`);
    logAudit('CREATE', 'Wastage', `${prod.nameBangla} অপচয় হিসেবে কর্তন: ${quantity} ${prod.unit} (ক্ষতি: ৳${totalLoss})`);
    return { success: true, voucherNo };
  };

  const totalCashAndBankBalance = useMemo(() => {
    const bankTotal = bankAccounts.reduce((sum, b) => sum + b.balance, 0);
    return (settings.cashInHandBalance || 0) + bankTotal;
  }, [settings.cashInHandBalance, bankAccounts]);

  const totalReceivableDues = useMemo(() => {
    return customers.reduce((sum, c) => sum + Math.max(0, c.currentDue), 0);
  }, [customers]);

  const totalPayableDues = useMemo(() => {
    return suppliers.reduce((sum, s) => sum + Math.max(0, s.currentPayable), 0);
  }, [suppliers]);

  const todayStr = useMemo(() => new Date().toISOString().substring(0, 10), []);

  const todaySalesTotal = useMemo(() => {
    return sales
      .filter(s => s.date === todayStr)
      .reduce((sum, s) => sum + s.grandTotal, 0);
  }, [sales, todayStr]);

  const todayPurchaseTotal = useMemo(() => {
    return purchases
      .filter(p => p.date === todayStr)
      .reduce((sum, p) => sum + p.grandTotal, 0);
  }, [purchases, todayStr]);

  // Comprehensive P&L calculation function
  const getPnLSummary = (startDate?: string, endDate?: string): PnLSummary => {
    const isWithin = (dateStr: string) => {
      if (startDate && dateStr < startDate) return false;
      if (endDate && dateStr > endDate) return false;
      return true;
    };

    // 1. Sales & Discounts
    let grossSales = 0;
    let discountTotal = 0;
    let cogs = 0;

    sales.forEach(sale => {
      if (isWithin(sale.date)) {
        grossSales += sale.subTotal;
        discountTotal += sale.discountAmount;

        // compute COGS from sale items
        sale.items.forEach(it => {
          cogs += (it.costPrice || 0) * it.quantity;
        });
      }
    });

    // 2. Transport Expenses Breakdown:
    // Purchase Transport (ক্রয় ট্রান্সপোর্ট): এই খরচ কোম্পানি বহন করে, কিন্তু এটা কোনো প্রোডাক্টের
    // ক্রয়মূল্যের সাথে স্বয়ংক্রিয়ভাবে যোগ/বিয়োগ হবে না। এটা শুধু একটা আলাদা রিপোর্ট/ভিউ হিসেবে থাকবে
    // (পার্টি-ভিত্তিক লিস্ট, তারিখ অনুযায়ী)। Production Cost বা COGS ক্যালকুলেশনে অটো যুক্ত হবে না।
    // Sales Transport (বিক্রয় ট্রান্সপোর্ট): ঐচ্ছিক কর্তন, Operating Expense।
    let purchaseTransportCost = 0;
    let salesTransportCost = 0;

    transports.forEach(t => {
      if (isWithin(t.date)) {
        const cost = t.totalCost || t.totalTripCost || 0;
        if (t.transportType === 'PURCHASE' || t.purpose === 'PURCHASE_PICKUP') {
          purchaseTransportCost += cost;
        } else {
          salesTransportCost += cost;
        }
      }
    });

    const totalCOGS = cogs; // Pure product COGS per revised rule (Purchase transport is purely separate tracking, not added to COGS)
    const netSales = grossSales - discountTotal;
    const grossProfit = netSales - totalCOGS;

    // 3. Operating Expenses
    const generalExpenses = expenses
      .filter(e => isWithin(e.date))
      .reduce((sum, e) => sum + e.amount, 0);

    const utilityRent = utilityRentRecords
      .filter(u => u.status === 'PAID' && isWithin(u.paidDate || u.dueDate))
      .reduce((sum, u) => sum + u.amount, 0);

    // 4. Salaries Cost based on active payrollMode:
    // Automatic Mode: calculates monthly fixed salary structure of all active employees
    // Manual Mode: calculates actual manually entered and disbursed salaries in the period
    let salariesCost = 0;
    if (payrollMode === 'AUTOMATIC') {
      salariesCost = employees
        .filter(e => e.status === 'ACTIVE')
        .reduce((sum, e) => sum + (e.basicSalary + (e.houseRentAllowance || 0) + (e.medicalAllowance || 0)), 0);
    } else {
      salariesCost = salaries
        .filter(s => isWithin(s.paymentDate || s.month))
        .reduce((sum, s) => sum + (s.netPayable || 0), 0);
    }

    const wastageLoss = (wastageRecords || [])
      .filter(w => isWithin(w.date))
      .reduce((sum, w) => sum + (w.totalLoss || (w.quantity * (w.unitCost || 0))), 0);

    const ownerWithdrawalsAmount = (ownerWithdrawals || [])
      .filter(w => isWithin(w.date))
      .reduce((sum, w) => sum + (w.amount || 0), 0);

    const totalOpEx = generalExpenses + utilityRent + salesTransportCost + salariesCost + wastageLoss;
    const netProfit = grossProfit - totalOpEx;
    const profitMarginPercent = netSales > 0 ? (netProfit / netSales) * 100 : 0;

    return {
      grossSales,
      discountTotal,
      netSales,
      cogs: totalCOGS,
      grossProfit,
      operatingExpenses: {
        generalExpenses,
        utilityRent,
        transportCost: salesTransportCost,
        salaries: salariesCost,
        wastageLoss,
        total: totalOpEx,
      },
      netProfit,
      profitMarginPercent,
      purchaseTransportTrackingCost: purchaseTransportCost,
      purchaseTransportLandedCost: purchaseTransportCost,
      salesTransportOpExCost: salesTransportCost,
      ownerWithdrawalsMemo: ownerWithdrawalsAmount,
      payrollMode,
    };
  };

  // System Management: Reset, Backup, Restore
  const resetToDemoData = () => {
    localStorage.clear();
    setSettings(INITIAL_COMPANY_SETTINGS);
    setUsers(INITIAL_USERS);
    setProducts(INITIAL_PRODUCTS);
    setBatches(INITIAL_BATCHES);
    setCustomers(INITIAL_CUSTOMERS);
    setSuppliers(INITIAL_SUPPLIERS);
    setBankAccounts(INITIAL_BANK_ACCOUNTS);
    setSales(INITIAL_SALES);
    setPurchases(INITIAL_PURCHASES);
    setBomRecipes(INITIAL_BOM_RECIPES);
    setProductionCosts(INITIAL_PRODUCTION_COSTS);
    setProductionRuns(INITIAL_PRODUCTION_RUNS);
    setTransports(INITIAL_TRANSPORTS);
    setExpenses(INITIAL_EXPENSES);
    setUtilityRentRecords(INITIAL_UTILITY_RENT);
    setOwnerWithdrawals(INITIAL_OWNER_WITHDRAWALS);
    setPartners(INITIAL_OWNER_PARTNERS);
    setEmployees(INITIAL_EMPLOYEES);
    setSalaries(INITIAL_SALARIES);
    setAssets(INITIAL_ASSETS);
    setLedgers(INITIAL_LEDGERS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setCurrentUser(INITIAL_USERS[0]);
    logAudit('SETTINGS_RESET', 'Developer Settings', 'সিস্টেম ফ্যাক্টরি ডেমো ডেটায় রিস্টোর করা হয়েছে।');
  };

  const exportDatabaseJSON = (): string => {
    const fullDB = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      settings,
      users,
      products,
      batches,
      customers,
      suppliers,
      bankAccounts,
      sales,
      purchases,
      bomRecipes,
      productionCosts,
      productionRuns,
      transports,
      expenses,
      utilityRentRecords,
      ownerWithdrawals,
      partners,
      employees,
      salaries,
      assets,
      ledgers,
      systemTasks,
      stockMovements,
      wastageRecords,
      rolePermissionsMatrix,
      payrollMode,
      auditLogs,
    };
    logAudit('EXPORT', 'Developer Settings', 'সম্পূর্ণ সিস্টেম ডেটাবেজ JSON এক্সপোর্ট করা হয়েছে।');
    return JSON.stringify(fullDB, null, 2);
  };

  const importDatabaseJSON = (jsonStr: string): { success: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed.products || !parsed.users) {
        return { success: false, error: 'ভুল ফরম্যাট! উপযুক্ত ব্যাকআপ JSON ফাইল প্রদান করুন।' };
      }
      if (parsed.settings) setSettings(parsed.settings);
      if (parsed.users) setUsers(parsed.users);
      if (parsed.products) setProducts(parsed.products);
      if (parsed.batches) setBatches(parsed.batches);
      if (parsed.customers) setCustomers(parsed.customers);
      if (parsed.suppliers) setSuppliers(parsed.suppliers);
      if (parsed.bankAccounts) setBankAccounts(parsed.bankAccounts);
      if (parsed.sales) setSales(parsed.sales);
      if (parsed.purchases) setPurchases(parsed.purchases);
      if (parsed.bomRecipes) setBomRecipes(parsed.bomRecipes);
      if (parsed.productionCosts) setProductionCosts(parsed.productionCosts);
      if (parsed.productionRuns) setProductionRuns(parsed.productionRuns);
      if (parsed.transports) setTransports(parsed.transports);
      if (parsed.expenses) setExpenses(parsed.expenses);
      if (parsed.utilityRentRecords) setUtilityRentRecords(parsed.utilityRentRecords);
      if (parsed.ownerWithdrawals) setOwnerWithdrawals(parsed.ownerWithdrawals);
      if (parsed.partners) setPartners(parsed.partners);
      if (parsed.employees) setEmployees(parsed.employees);
      if (parsed.salaries) setSalaries(parsed.salaries);
      if (parsed.assets) setAssets(parsed.assets);
      if (parsed.ledgers) setLedgers(parsed.ledgers);
      if (parsed.stockMovements) setStockMovements(parsed.stockMovements);
      if (parsed.wastageRecords) setWastageRecords(parsed.wastageRecords);
      if (parsed.rolePermissionsMatrix) setRolePermissionsMatrix(parsed.rolePermissionsMatrix);
      if (parsed.payrollMode) setPayrollModeState(parsed.payrollMode);
      if (parsed.auditLogs) setAuditLogs(parsed.auditLogs);

      logAudit('UPDATE', 'Developer Settings', 'JSON ফাইল থেকে ডেটাবেজ সফলভাবে রিস্টোর করা হয়েছে।');
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'ফাইল রিড করতে ব্যর্থ হয়েছে।' };
    }
  };

  const createBackupArchive = (label?: string, type: 'AUTO_PRE_HARD_RESET' | 'MANUAL' = 'MANUAL'): BackupArchiveItem => {
    const dataJson = exportDatabaseJSON();
    const newItem: BackupArchiveItem = {
      id: `ARCHIVE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      label: label || (type === 'AUTO_PRE_HARD_RESET' ? 'হার্ড রিসেট পূর্ববর্তী স্বয়ংক্রিয় স্ন্যাপশট' : `ম্যানুয়াল ব্যাকআপ (${new Date().toLocaleDateString('bn-BD')})`),
      type,
      triggeredBy: currentUser?.name || 'Developer',
      recordSummary: {
        salesCount: sales.length,
        purchasesCount: purchases.length,
        productsCount: products.length,
        customersCount: customers.length,
        suppliersCount: suppliers.length,
        employeesCount: employees.length,
        usersCount: users.length,
      },
      fileSizeKB: Math.round((new Blob([dataJson]).size / 1024) * 10) / 10,
      dataJson,
    };

    setBackupArchive(prev => [newItem, ...prev]);
    updateLastBackupTimestamp(newItem.timestamp);
    logAudit('EXPORT', 'Backup & Restore', `ব্যাকআপ আর্কাইভে নতুন কপি সংরক্ষণ করা হয়েছে: ${newItem.label}`);
    return newItem;
  };

  const restoreFromBackupArchive = (archiveId: string): { success: boolean; error?: string } => {
    const target = backupArchive.find(a => a.id === archiveId);
    if (!target) {
      return { success: false, error: 'ব্যাকআপ আর্কাইভ থেকে ফাইলটি পাওয়া যায়নি।' };
    }
    const res = importDatabaseJSON(target.dataJson);
    if (res.success) {
      logAudit('RESTORE_BACKUP', 'Backup & Restore', `আর্কাইভ [${target.label}] থেকে সম্পূর্ণ সিস্টেম ডেটা রিস্টোর করা হয়েছে।`);
    }
    return res;
  };

  const deleteFromBackupArchive = (archiveId: string) => {
    setBackupArchive(prev => prev.filter(a => a.id !== archiveId));
  };

  const connectDrive = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const { user, driveUser: dUser } = await connectGoogleDrive();
      setDriveUser(dUser);
      setIsDriveConnected(true);
      setDriveNotification({
        type: 'success',
        message: `Google Drive সফলভাবে সংযুক্ত হয়েছে (${dUser.email})! ব্যাকআপ ফোল্ডার: ${BACKUP_FOLDER_NAME}`,
      });
      // Fetch backups list immediately
      try {
        const files = await listGoogleDriveBackups();
        setDriveBackupsList(files);
      } catch {
        // ignore list error on first connect
      }
      return { success: true };
    } catch (err: any) {
      const errMsg = err?.message || 'Google Drive সংযোগ স্থাপন করতে ব্যর্থ হয়েছে।';
      setDriveNotification({
        type: 'error',
        message: errMsg,
      });
      return { success: false, error: errMsg };
    }
  };

  const disconnectDrive = async (): Promise<void> => {
    await disconnectGoogleDrive();
    setDriveUser(null);
    setIsDriveConnected(false);
    setDriveBackupsList([]);
    setDriveNotification({
      type: 'info',
      message: 'Google Drive সংযোগ বিচ্ছিন্ন করা হয়েছে।',
    });
  };

  const fetchDriveBackups = async (): Promise<DriveBackupFile[]> => {
    try {
      setIsLoadingDriveBackups(true);
      const files = await listGoogleDriveBackups();
      setDriveBackupsList(files);
      return files;
    } catch (err: any) {
      console.error('Failed to list Google Drive backups:', err);
      return [];
    } finally {
      setIsLoadingDriveBackups(false);
    }
  };

  const performDriveBackup = async (
    backupType: 'DAILY' | 'PRE_RESET' | 'PRE_GOLIVE' | 'MANUAL' = 'MANUAL',
    description?: string
  ): Promise<{ success: boolean; file?: DriveBackupFile; error?: string }> => {
    try {
      setIsBackingUpToDrive(true);
      const dataJson = exportDatabaseJSON();
      const company = settings.companyNameEnglish || settings.companyNameBangla || 'FoodERP';
      const file = await uploadBackupToGoogleDrive({
        dataJson,
        companyName: company,
        backupType,
        description,
      });

      setLastDriveBackupTime(file.createdTime);
      setDriveBackupsList(prev => [file, ...prev.filter(f => f.id !== file.id)]);
      recordBackupSuccess(file.createdTime);
      updateLastBackupTimestamp(file.createdTime);

      logAudit(
        'EXPORT',
        'Google Drive Backup',
        `Google Drive-এ নতুন ব্যাকআপ ফাইল সংরক্ষিত: ${file.name} (${file.sizeKB} KB)`
      );

      setDriveNotification({
        type: 'success',
        message: `Google Drive-এ ব্যাকআপ ফাইল সফলভাবে সংরক্ষিত হয়েছে (${file.name})`,
      });

      return { success: true, file };
    } catch (err: any) {
      const errMsg = err?.message || 'Google Drive আপলোড ব্যর্থ হয়েছে';
      setDriveNotification({
        type: 'error',
        message: errMsg,
      });
      return { success: false, error: errMsg };
    } finally {
      setIsBackingUpToDrive(false);
    }
  };

  const restoreDriveBackup = async (fileId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsRestoringFromDrive(true);
      const jsonStr = await downloadBackupContentFromDrive(fileId);
      const result = importDatabaseJSON(jsonStr);

      if (result.success) {
        logAudit(
          'RESTORE_BACKUP',
          'Google Drive Backup',
          `Google Drive ব্যাকআপ ফাইল (ID: ${fileId}) থেকে সম্পূর্ণ ডাটাবেজ সফলভাবে রিস্টোর করা হয়েছে।`
        );
        setDriveNotification({
          type: 'success',
          message: 'Google Drive ব্যাকআপ থেকে সম্পূর্ণ সিস্টেম ডেটা সফলভাবে রিস্টোর হয়েছে!',
        });
      } else {
        setDriveNotification({
          type: 'error',
          message: result.error || 'ব্যাকআপ রিস্টোর করতে ব্যর্থ হয়েছে।',
        });
      }
      return result;
    } catch (err: any) {
      const errMsg = err?.message || 'Google Drive থেকে ফাইল ডাউনলোড ব্যর্থ হয়েছে';
      setDriveNotification({
        type: 'error',
        message: errMsg,
      });
      return { success: false, error: errMsg };
    } finally {
      setIsRestoringFromDrive(false);
    }
  };

  const triggerManualBackup = async (
    label?: string
  ): Promise<{
    success: boolean;
    item?: BackupArchiveItem;
    driveFile?: DriveBackupFile;
    timestamp: string;
    error?: string;
  }> => {
    try {
      const nowIso = new Date().toISOString();
      const customLabel = label || `ম্যানুয়াল ডাটাবেজ ব্যাকআপ (${new Date().toLocaleDateString('bn-BD')} ${new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })})`;
      
      // 1. Create immediate state snapshot in persistent local archive
      const item = createBackupArchive(customLabel, 'MANUAL');
      updateLastBackupTimestamp(nowIso);

      // 2. If Google Drive session is active, upload simultaneously to cloud folder
      let uploadedDriveFile: DriveBackupFile | undefined;
      if (isDriveSessionActive()) {
        try {
          const driveRes = await performDriveBackup('MANUAL', `Manual DB State Backup: ${customLabel}`);
          if (driveRes.success && driveRes.file) {
            uploadedDriveFile = driveRes.file;
          }
        } catch (driveErr) {
          console.warn('Google Drive sync warning during manual backup:', driveErr);
        }
      }

      logAudit('EXPORT', 'Backup & Restore', `ম্যানুয়াল ডাটাবেজ স্টেট সেভ সফল হয়েছে: ${item.label}`);

      return {
        success: true,
        item,
        driveFile: uploadedDriveFile,
        timestamp: nowIso,
      };
    } catch (err: any) {
      const errMsg = err?.message || 'ম্যানুয়াল ডাটাবেজ ব্যাকআপ সম্পন্ন করতে সমস্যা হয়েছে।';
      return {
        success: false,
        timestamp: new Date().toISOString(),
        error: errMsg,
      };
    }
  };

  const executeHardReset = async (
    developerPassword: string
  ): Promise<{
    success: boolean;
    error?: string;
    autoBackupItem?: BackupArchiveItem;
    driveBackupFile?: DriveBackupFile;
  }> => {
    if (currentUser?.role !== 'DEVELOPER') {
      return { success: false, error: 'অননুমোদিত অ্যাক্সেস! শুধুমাত্র Developer অ্যাকাউন্ট থেকে সিস্টেম হার্ড রিসেট করা সম্ভব।' };
    }

    // Verify developer password
    const currentPass = currentUser.password?.trim() || '';
    if (!currentPass || developerPassword.trim() !== currentPass) {
      return { success: false, error: 'ভুল ডেভেলপার পাসওয়ার্ড! সঠিক পাসওয়ার্ড প্রদান করে পুনরায় চেষ্টা করুন।' };
    }

    const dataJson = exportDatabaseJSON();

    // 1. Mandatory Google Drive Auto-Backup if Google Drive is active
    let uploadedDriveBackup: DriveBackupFile | undefined;
    if (isDriveSessionActive()) {
      try {
        const company = settings.companyNameEnglish || settings.companyNameBangla || 'FoodERP';
        uploadedDriveBackup = await uploadBackupToGoogleDrive({
          dataJson,
          companyName: company,
          backupType: 'PRE_RESET',
          description: `হার্ড রিসেট পূর্ববর্তী স্বয়ংক্রিয় স্ন্যাপশট [PreReset] - ${new Date().toLocaleString('bn-BD')}`,
        });
        logAudit('EXPORT', 'Google Drive Backup', `হার্ড রিসেট পূর্ববর্তী ব্যাকআপ Google Drive-এ আপলোড সম্পন্ন: ${uploadedDriveBackup.name}`);
      } catch (err: any) {
        // As per mandate: Backup must succeed before reset proceeds!
        const errMsg = err?.message || 'Google Drive আপলোড ব্যর্থ হয়েছে';
        logAudit('SECURITY_ALERT', 'Danger Zone', `হার্ড রিসেট স্থগিত: Google Drive প্রি-রিসেট ব্যাকআপ ব্যর্থ - ${errMsg}`);
        return {
          success: false,
          error: `Google Drive-এ বাধ্যতামূলক প্রি-রিসেট ব্যাকআপ আপলোড ব্যর্থ হয়েছে! ডেটা সুরক্ষার স্বার্থে হার্ড রিসেট প্রক্রিয়া স্থগিত করা হয়েছে। (${errMsg})`,
        };
      }
    }

    // 2. Local Storage Archive & Client Download
    const autoBackup: BackupArchiveItem = {
      id: `ARCHIVE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      label: `হার্ড রিসেট পূর্ববর্তী স্বয়ংক্রিয় স্ন্যাপশট (${new Date().toLocaleDateString('bn-BD')})`,
      type: 'AUTO_PRE_HARD_RESET',
      triggeredBy: currentUser?.name || 'Developer',
      recordSummary: {
        salesCount: sales.length,
        purchasesCount: purchases.length,
        productsCount: products.length,
        customersCount: customers.length,
        suppliersCount: suppliers.length,
        employeesCount: employees.length,
        usersCount: users.length,
      },
      fileSizeKB: Math.round((new Blob([dataJson]).size / 1024) * 10) / 10,
      dataJson,
    };

    // Keep persistent backup archive intact and prepend new item
    const updatedArchives = [autoBackup, ...backupArchive];
    setBackupArchive(updatedArchives);
    try {
      localStorage.setItem(BACKUP_ARCHIVE_STORAGE_KEY, JSON.stringify(updatedArchives));
    } catch {
      // ignore
    }

    // Trigger automated client-side JSON download to user's computer
    try {
      const blob = new Blob([dataJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().substring(0, 19).replace(/[:T]/g, '_');
      link.download = `Food_ERP_AutoBackup_Before_HardReset_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      // ignore if download blocked
    }

    // 3. Clear all business data & restore factory state
    setSettings(INITIAL_COMPANY_SETTINGS);
    setUsers(INITIAL_USERS);
    setProducts(INITIAL_PRODUCTS);
    setBatches(INITIAL_BATCHES);
    setCustomers(INITIAL_CUSTOMERS);
    setSuppliers(INITIAL_SUPPLIERS);
    setBankAccounts(INITIAL_BANK_ACCOUNTS);
    setSales(INITIAL_SALES);
    setPurchases(INITIAL_PURCHASES);
    setBomRecipes(INITIAL_BOM_RECIPES);
    setProductionCosts(INITIAL_PRODUCTION_COSTS);
    setProductionRuns(INITIAL_PRODUCTION_RUNS);
    setTransports(INITIAL_TRANSPORTS);
    setExpenses(INITIAL_EXPENSES);
    setUtilityRentRecords(INITIAL_UTILITY_RENT);
    setOwnerWithdrawals(INITIAL_OWNER_WITHDRAWALS);
    setEmployees(INITIAL_EMPLOYEES);
    setSalaries(INITIAL_SALARIES);
    setAssets(INITIAL_ASSETS);
    setLedgers(INITIAL_LEDGERS);
    setStockMovements(INITIAL_STOCK_MOVEMENTS);
    setWastageRecords(INITIAL_WASTAGE_RECORDS);
    setRolePermissionsMatrix(generateDefaultRBACMatrix());
    setPayrollModeState('AUTOMATIC');
    setCurrentUser(INITIAL_USERS[0]);

    // Record Hard Reset in Audit Log
    const resetLog: AuditLog = {
      id: `AUD-${Date.now()}-RESET`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'HARD_RESET',
      module: 'Danger Zone',
      details: 'সিস্টেমের সমস্ত সেলস, পারচেজ, স্টক, লেজার ও ব্যবহারকারী ডেটা ফ্যাক্টরি রিসেট করা হয়েছে। রিসেট পূর্ববর্তী পূর্ণাঙ্গ ডেটাবেজ অটো-ব্যাকআপ হিসেবে ড্রাইভ ও লোকাল আর্কাইভে সংরক্ষিত হয়েছে।',
    };
    setAuditLogs([resetLog, ...INITIAL_AUDIT_LOGS]);

    return { success: true, autoBackupItem: autoBackup, driveBackupFile: uploadedDriveBackup };
  };

  const executeGoLiveClean = async (
    developerPassword: string
  ): Promise<{
    success: boolean;
    error?: string;
    autoBackupItem?: BackupArchiveItem;
    driveBackupFile?: DriveBackupFile;
  }> => {
    if (currentUser?.role !== 'DEVELOPER') {
      return { success: false, error: 'অননুমোদিত অ্যাক্সেস! শুধুমাত্র Developer অ্যাকাউন্ট থেকে গো-লাইভ কার্যকর করা সম্ভব।' };
    }

    const currentPass = currentUser.password?.trim() || '';
    if (!currentPass || developerPassword.trim() !== currentPass) {
      return { success: false, error: 'ভুল ডেভেলপার পাসওয়ার্ড! সঠিক পাসওয়ার্ড প্রদান করে পুনরায় চেষ্টা করুন।' };
    }

    const dataJson = exportDatabaseJSON();

    // 1. Mandatory Google Drive Auto-Backup before Go-Live if Drive session active
    let uploadedDriveBackup: DriveBackupFile | undefined;
    if (isDriveSessionActive()) {
      try {
        const company = settings.companyNameEnglish || settings.companyNameBangla || 'FoodERP';
        uploadedDriveBackup = await uploadBackupToGoogleDrive({
          dataJson,
          companyName: company,
          backupType: 'PRE_GOLIVE',
          description: `গো-লাইভ / টেস্ট ডেটা ক্লিয়ার পূর্ববর্তী স্বয়ংক্রিয় স্ন্যাপশট [PreGoLive] - ${new Date().toLocaleString('bn-BD')}`,
        });
        logAudit('EXPORT', 'Google Drive Backup', `গো-লাইভ পূর্ববর্তী ব্যাকআপ Google Drive-এ আপলোড সম্পন্ন: ${uploadedDriveBackup.name}`);
      } catch (err: any) {
        // As per mandate: Backup must succeed before reset proceeds!
        const errMsg = err?.message || 'Google Drive আপলোড ব্যর্থ হয়েছে';
        logAudit('SECURITY_ALERT', 'Danger Zone', `গো-লাইভ স্থগিত: Google Drive প্রি-গো-লাইভ ব্যাকআপ ব্যর্থ - ${errMsg}`);
        return {
          success: false,
          error: `Google Drive-এ বাধ্যতামূলক প্রি-গো-লাইভ ব্যাকআপ আপলোড ব্যর্থ হয়েছে! ডেটা সুরক্ষার স্বার্থে গো-লাইভ স্থগিত করা হয়েছে। (${errMsg})`,
        };
      }
    }

    // 2. Client-side download & in-app archive
    const autoBackup: BackupArchiveItem = {
      id: `ARCHIVE-${Date.now()}-GOLIVE`,
      timestamp: new Date().toISOString(),
      label: `গো-লাইভ টেস্ট ডেটা ক্লিয়ারেন্স পূর্ববর্তী স্বয়ংক্রিয় স্ন্যাপশট (${new Date().toLocaleDateString('bn-BD')})`,
      type: 'AUTO_PRE_HARD_RESET',
      triggeredBy: currentUser?.name || 'Developer',
      recordSummary: {
        salesCount: sales.length,
        purchasesCount: purchases.length,
        productsCount: products.length,
        customersCount: customers.length,
        suppliersCount: suppliers.length,
        employeesCount: employees.length,
        usersCount: users.length,
      },
      fileSizeKB: Math.round((new Blob([dataJson]).size / 1024) * 10) / 10,
      dataJson,
    };

    const updatedArchives = [autoBackup, ...backupArchive];
    setBackupArchive(updatedArchives);
    try {
      localStorage.setItem(BACKUP_ARCHIVE_STORAGE_KEY, JSON.stringify(updatedArchives));
    } catch {
      // ignore
    }

    // Trigger automated client-side JSON download
    try {
      const blob = new Blob([dataJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().substring(0, 19).replace(/[:T]/g, '_');
      link.download = `Food_ERP_AutoBackup_Before_GoLive_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }

    // 3. Clear only transactional test data, KEEP master items (products, suppliers, customers, bank accounts, settings, users)
    setSales([]);
    setPurchases([]);
    setProductionRuns([]);
    setProductionCosts([]);
    setTransports([]);
    setExpenses([]);
    setUtilityRentRecords([]);
    setOwnerWithdrawals([]);
    setSalaries([]);
    setStockMovements([]);
    setWastageRecords([]);
    setLedgers([]);
    setBatches([]);

    // Reset stock numbers of master products to clean state (0)
    setProducts(prev =>
      prev.map(p => ({
        ...p,
        currentStock: 0,
        currentRawStockKg: 0,
      }))
    );

    // Record Go-Live in Audit Log
    const goLiveLog: AuditLog = {
      id: `AUD-${Date.now()}-GOLIVE`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'GO_LIVE_CLEAN',
      module: 'Danger Zone',
      details: 'গো-লাইভ সম্পন্ন: সমস্ত টেস্ট লেনদেন, সেলস, পারচেজ ও খরচ মুছে ফ্রেশ স্টেট তৈরি হয়েছে। মাস্টার কনফিগারেশন অপরিবর্তিত রাখা হয়েছে।',
    };
    setAuditLogs([goLiveLog, ...auditLogs]);

    return { success: true, autoBackupItem: autoBackup, driveBackupFile: uploadedDriveBackup };
  };

  // Memoized ledgers for Customers, Suppliers, and Cash/Bank
  const customerLedgers = useMemo<LedgerEntry[]>(() => {
    const list: LedgerEntry[] = [];
    (ledgers || []).forEach(l => {
      const cId = l.customerId || (l.accountId && l.accountId.startsWith('CUST-') ? l.accountId : undefined);
      if (cId || l.accountType === 'CUSTOMER' || l.accountType === 'SALE') {
        list.push({
          ...l,
          customerId: cId || l.accountId || '',
          balance: l.balanceAfter !== undefined ? l.balanceAfter : (l.balance !== undefined ? l.balance : (l.debit || 0) - (l.credit || 0)),
        });
      }
    });

    (sales || []).forEach(s => {
      if (!list.some(it => it.voucherNo === s.invoiceNo)) {
        list.push({
          id: `CUST-LDG-${s.id}`,
          date: s.date,
          voucherNo: s.invoiceNo,
          accountType: 'SALE',
          accountId: s.customerId,
          customerId: s.customerId,
          accountTitle: s.customerName,
          description: `বিক্রয় চালান: ${s.invoiceNo}`,
          debit: s.grandTotal,
          credit: s.paidAmount,
          balance: s.dueAmount,
          createdBy: s.salesPerson || 'Sales',
        });
      }
    });

    return list;
  }, [ledgers, sales]);

  const supplierLedgers = useMemo<LedgerEntry[]>(() => {
    const list: LedgerEntry[] = [];
    (ledgers || []).forEach(l => {
      const sId = l.supplierId || (l.accountId && l.accountId.startsWith('SUP-') ? l.accountId : undefined);
      if (sId || l.accountType === 'SUPPLIER' || l.accountType === 'PURCHASE') {
        list.push({
          ...l,
          supplierId: sId || l.accountId || '',
          balance: l.balanceAfter !== undefined ? l.balanceAfter : (l.balance !== undefined ? l.balance : (l.credit || 0) - (l.debit || 0)),
        });
      }
    });

    (purchases || []).forEach(p => {
      if (!list.some(it => it.voucherNo === p.billNo)) {
        list.push({
          id: `SUP-LDG-${p.id}`,
          date: p.date,
          voucherNo: p.billNo,
          accountType: 'PURCHASE',
          accountId: p.supplierId,
          supplierId: p.supplierId,
          accountTitle: p.supplierName,
          description: `ক্রয় বিল: ${p.billNo}`,
          credit: p.grandTotal,
          debit: p.paidAmount,
          balance: p.dueAmount,
          createdBy: currentUser?.name || 'Purchase',
        });
      }
    });

    return list;
  }, [ledgers, purchases, currentUser]);

  const cashBankLedgers = useMemo<any[]>(() => {
    return (ledgers || []).map(l => ({
      id: l.id,
      date: l.date,
      accountName: l.accountName || l.accountTitle || (l.accountType === 'BANK' ? 'ব্যাংক একাউন্ট' : 'ক্যাশ ড্রয়ার'),
      description: l.description,
      debit: l.debit || 0,
      credit: l.credit || 0,
      balance: l.balanceAfter !== undefined ? l.balanceAfter : Math.abs((l.debit || 0) - (l.credit || 0)),
    }));
  }, [ledgers]);

  // View compatibility aliases
  const utilityBills = utilityRentRecords;
  const salaryRecords = salaries;
  const transportTrips = transports;
  const totalReceivables = totalReceivableDues;
  const totalPayables = totalPayableDues;
  const exportFullBackupJSON = exportDatabaseJSON;
  const importBackupJSON = importDatabaseJSON;

  // --------------------------------------------------------------------------
  // DAILY AUTO-BACKUP (ENCRYPTED JSON)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const checkAndRunAutoBackup = () => {
      try {
        const lastBackupDate = localStorage.getItem('food_erp_last_auto_backup_date');
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        
        if (lastBackupDate !== today) {
          // Trigger the backup
          const dataStr = exportDatabaseJSON();
          // Encrypt it
          const encryptedData = encryptData(dataStr);
          
          const blob = new Blob([encryptedData], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Food_ERP_Auto_Backup_${today}.json.enc`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          // Save the date so it doesn't trigger again today
          localStorage.setItem('food_erp_last_auto_backup_date', today);
        }
      } catch (err) {
        console.error('Auto-backup failed:', err);
      }
    };

    // Run this once after 5 seconds to not block initial render
    const timeout = setTimeout(checkAndRunAutoBackup, 5000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <ERPContext.Provider
      value={{
        currentUser,
        activeModule,
        setActiveModule,
        canAccess,
        login,
        logout,
        changePassword,
        resetPasswordWithRecovery,
        settings,
        updateSettings,
        users,
        addUser,
        updateUser,
        deleteUser,
        deactivateUser,
        activateUser,
        resetUserPassword,
        rolePermissionsMatrix,
        updateRolePermissionsMatrix,
        resetRolePermissionsMatrixToDefault,
        hasPermission,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        batches,
        customers,
        addCustomer,
        suppliers,
        addSupplier,
        bankAccounts,
        sales,
        addSale,
        updateSaleWorkflow,
        toggleTransactionVisualStatus,
        purchases,
        addPurchase,
        bomRecipes,
        addBOMRecipe,
        updateBOMRecipe,
        deleteBOMRecipe,
        calculateProductionCapacity,
        productionCosts,
        updateProductionCost,
        productionRuns,
        executeProductionRun,
        stockMovements,
        wastageRecords,
        recordStockMovement,
        getProductStockMovements,
        recordWastageWriteOff,
        transports,
        addTransportTrip,
        expenses,
        addExpense,
        utilityRentRecords,
        addUtilityRent,
        payUtilityRent,
        ownerWithdrawals,
        addOwnerWithdrawal,
        deleteOwnerWithdrawal,
        partners,
        addPartner,
        employees,
        addEmployee,
        salaries,
        paySalary,
        assets,
        addAsset,
        updateAsset,
        deleteAsset,
        addAssetMaintenanceLog,
        deleteAssetMaintenanceLog,
        systemTasks,
        addSystemTask,
        updateSystemTask,
        ledgers,
        auditLogs,
        receiveCustomerPayment,
        paySupplierPayment,
        transferFunds,
        totalStockValue,
        lowStockCount,
        outOfStockCount,
        expiringBatchesCount,
        expiredBatchesCount,
        safeBatchesCount,
        totalCashAndBankBalance,
        totalReceivableDues,
        totalPayableDues,
        todaySalesTotal,
        todayPurchaseTotal,
        updateCurrentUserAvatar,
        getPnLSummary,
        theme,
        toggleTheme,
        setTheme,
        lastFirebaseBackupTime,
        colorTheme,
        setColorTheme,
        resetToDemoData,
        exportDatabaseJSON,
        importDatabaseJSON,
        // New helpers & aliases
        adjustStock,
        utilityBills,
        addUtilityBill,
        payUtilityBill,
        salaryRecords,
        processMonthlyPayroll,
        saveManualPayroll,
        disburseSalary,
        payrollMode,
        setPayrollMode,
        transportTrips,
        cashBankLedgers,
        addBankAccount,
        customerLedgers,
        supplierLedgers,
        collectCustomerPayment,
        paySupplier,
        totalReceivables,
        totalPayables,
        exportFullBackupJSON,
        importBackupJSON,
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
      }}
    >
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = () => {
  const context = useContext(ERPContext);
  if (!context) {
    throw new Error('useERP must be used within an ERPProvider');
  }
  return context;
};
