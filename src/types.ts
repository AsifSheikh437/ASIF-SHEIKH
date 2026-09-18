export type Role = 
  | 'DEVELOPER'
  | 'ADMIN'
  | 'MANAGER'
  | 'ACCOUNTANT'
  | 'SALES'
  | 'PURCHASE'
  | 'INVENTORY'
  | 'HR/PAYROLL'
  | 'VIEWER';

export interface User {
  id: string; // e.g. 'USR-001' or 'admin'
  name: string;
  username: string; // login identifier
  passwordHash?: string; // demo plain or hashed
  password?: string;
  role: Role;
  email?: string;
  phone?: string;
  category?: 'MECHANICAL' | 'OFFICE'; // HR Staff Category (মেকানিক্যাল / অফিস)
  gender?: 'MALE' | 'FEMALE'; // HR Gender (পুরুষ / মহিলা)
  department?: string;
  designation?: string;
  recoveryCode?: string; // for password recovery
  mustChangePassword?: boolean;
  isActive: boolean;
  avatar?: string; // base64 or URL
  createdAt: string;
  lastLogin?: string;
}

export interface GranularPermission {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
}

export type RolePermissionMatrix = Record<string, Record<string, GranularPermission>>;

export type UnitType = string;

export type ProductCategory = 'RAW_MATERIAL' | 'FINISHED_GOODS' | 'PACKAGING' | 'SEMI_FINISHED';

export interface Product {
  id: string;
  code?: string;
  sku?: string; // alias for code
  name?: string;
  nameBangla: string;
  nameEnglish: string;
  category: ProductCategory;
  unit: UnitType;
  purchasePrice: number; // cost price per unit
  sellingPrice: number; // retail/wholesale price per unit
  salePrice?: number;
  currentStock: number;
  minStockAlert: number;
  location?: string; // warehouse rack/zone
  image?: string;
  averageCost?: number;
  createdAt?: string;
}

export type StockMovementType = 
  | 'PURCHASE'
  | 'SALE'
  | 'PRODUCTION_IN'
  | 'PRODUCTION_OUT'
  | 'ADJUSTMENT'
  | 'WASTAGE';

export interface StockMovement {
  id: string;
  date: string;
  productId: string;
  productName: string;
  type: StockMovementType;
  referenceNo: string; // e.g. PUR-1001, INV-1002, PROD-BT-01, ADJ-001, WST-001
  referenceNote?: string;
  batchNumber?: string;
  inQty: number;
  outQty: number;
  balanceAfter: number;
  unitCost?: number;
  totalValue?: number;
  createdByName?: string;
}

export type WastageReason = 
  | 'EXPIRED'
  | 'DAMAGED_TRANSIT'
  | 'QUALITY_DEFECT'
  | 'FACTORY_SPILLAGE'
  | 'PEST_INFESTATION'
  | 'OTHER';

export interface WastageRecord {
  id: string;
  voucherNo: string;
  date: string;
  productId: string;
  productName: string;
  category?: ProductCategory;
  batchNumber?: string;
  quantity: number;
  unit: UnitType;
  unitCost: number;
  totalLoss: number;
  reason: WastageReason | string;
  remarks?: string;
  approvedBy: string;
}

export interface BatchItem {
  id: string;
  productId: string;
  productName?: string;
  batchNumber: string;
  quantity: number;
  initialQuantity: number;
  mfgDate: string;
  expDate: string;
  purchaseOrProdPrice: number;
  supplierOrProductionRef?: string;
  status: 'ACTIVE' | 'DEPLETED' | 'EXPIRED' | 'EXPIRING_SOON';
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  openingBalance: number;
  totalBilled: number;
  totalPaid: number;
  currentDue: number;
  createdAt: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  companyName: string;
  phone: string;
  email?: string;
  address: string;
  openingBalance: number;
  totalPurchased: number;
  totalPaid: number;
  currentPayable: number;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  unit: UnitType;
  quantity: number;
  unitPrice: number;
  batchNumber?: string;
  total: number;
  costPrice: number; // to compute real COGS
  unitCost?: number;
}

export interface Sale {
  id: string;
  invoiceNo: string;
  date: string;
  invoiceDate?: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  items: SaleItem[];
  subTotal: number;
  discountType: 'FLAT' | 'PERCENT';
  discountValue: number;
  discountAmount: number;
  vatPercent: number;
  vatAmount: number;
  transportCost: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: 'CASH' | 'BANK' | 'DUE' | 'PARTIAL';
  bankAccountId?: string;
  notes?: string;
  servedBy: string;

  // Multi-currency
  visualStatus?: 'PAID' | 'PENDING' | 'OVERDUE';
  currency?: string;
  exchangeRate?: number;
  foreignTotal?: number;

  // Additional tracking fields
  vehicleNo?: string;
  deliveredAt?: string;
  totalAmount?: number;
  salesPerson?: string;

  // 3-Step Confirmation Workflow
  workflowStep?: 1 | 2 | 3; // 1: Invoice Created, 2: Out for Delivery, 3: Delivered / Gate Pass Confirmed
  deliveryStatus?: 'INVOICE_CREATED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  deliveryPersonName?: string;
  deliveryPerson?: string;
  deliveryPersonPhone?: string;
  deliveryPhone?: string;
  deliveryVehicleNo?: string;
  deliveryAssignedAt?: string;
  gatePassNo?: string;
  gatePassConfirmedAt?: string;
  gatePassConfirmedBy?: string;
  gatePassNotes?: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  unit: UnitType;
  quantity: number;
  unitCost: number;
  total: number;
  batchNumber: string;
  mfgDate?: string;
  expDate?: string;
}

export interface Purchase {
  id: string;
  billNo: string;
  date: string;
  purchaseDate?: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  subTotal: number;
  discountAmount: number;
  otherCost: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: 'CASH' | 'BANK' | 'DUE' | 'PARTIAL';
  bankAccountId?: string;
  notes?: string;
  receivedBy?: string;

  // Multi-currency
  visualStatus?: 'PAID' | 'PENDING' | 'OVERDUE';
  currency?: string;
  exchangeRate?: number;
  foreignTotal?: number;
}

export interface BOMIngredient {
  productId: string; // Raw material or packaging
  productName: string;
  quantity: number; // qty required for the target output batch
  unit: UnitType;
  unitCost: number;
  totalCost?: number;
  rawMaterialId?: string; // alias
}

export interface BOMRecipe {
  id: string;
  recipeCode: string;
  recipeName: string;
  finishedProductId: string;
  finishedProductName: string;
  outputQuantity: number; // batch size (e.g. 100 packets)
  outputUnit: UnitType;
  shelfLifeDays?: number; // default shelf life in days
  laborCostType?: 'FIXED' | 'PERCENT';
  laborCostValue?: number;
  laborCostPerBatch: number;
  overheadCostType?: 'FIXED' | 'PERCENT';
  overheadCostValue?: number;
  overheadCostPerBatch: number;
  ingredients: BOMIngredient[];
  totalRawMaterialCost?: number;
  totalBatchCost: number;
  costPerUnit: number;
  instructions?: string;
  updatedAt?: string;
  // Compatibility aliases
  name?: string;
  outputProductId?: string;
  outputProductName?: string;
  productName?: string;
  standardBatchSize?: number;
  batchUnit?: string;
}

export interface ProductionRun {
  id: string;
  batchNo: string;
  date: string;
  recipeId: string;
  recipeName: string;
  targetProductId: string;
  expectedQuantity?: number; // Expected output by recipe
  producedQuantity: number; // Actual output achieved
  wastageQuantity?: number; // Wastage / loss in production
  yieldPercent?: number; // Yield %
  wastagePercent?: number; // Wastage %
  unit: UnitType;
  mfgDate: string;
  expDate: string;
  rawMaterialCost: number;
  laborCost: number;
  overheadCost: number;
  totalProductionCost: number;
  costPerUnit: number;
  supervisor: string;
  notes?: string;
  wastageVoucherNo?: string;
  // Compatibility aliases
  outputQuantity?: number;
  outputProductId?: string;
  totalRawMaterialCost?: number;
  utilityCost?: number;
  packagingCost?: number;
  unitCost?: number;
}

export interface ProductionCostItem {
  id: string;
  productId: string;
  productName: string;
  rawMaterialCost: number;
  laborCost: number;
  packagingCost: number;
  overheadUtilityCost: number;
  totalUnitCost: number;
  targetProfitMarginPercent: number;
  suggestedSalePrice: number;
  updatedAt: string;
}

export interface TransportTrip {
  id: string;
  tripNo: string;
  date: string;
  vehicleNo: string;
  driverName: string;
  driverPhone: string;
  destination: string;
  purpose: 'DELIVERY' | 'PURCHASE_PICKUP' | 'INTERNAL_TRANSFER' | string;
  costFuel: number;
  costTollOther: number;
  totalCost: number;
  paidVia: 'CASH' | 'BANK' | string;
  status: 'SCHEDULED' | 'IN_TRANSIT' | 'COMPLETED' | string;
  notes?: string;
  // Transport Classification
  transportType?: 'PURCHASE' | 'SALES' | 'INTERNAL'; // PURCHASE = Landed/COGS, SALES = OpEx
  supplierId?: string;
  supplierName?: string;
  purchaseBillNo?: string;
  customerId?: string;
  customerName?: string;
  salesInvoiceNo?: string;
  gatePassNo?: string;
  // UI aliases
  routeFrom?: string;
  routeTo?: string;
  fuelCost?: number;
  tollCost?: number;
  laborCost?: number;
  otherCost?: number;
  totalTripCost?: number;
  associatedInvoiceNo?: string;
}

export interface BankAccount {
  id: string;
  accountName: string; // e.g., Islami Bank Bangladesh, BRAC Bank, bKash Merchant
  accountNumber: string;
  bankName?: string;
  branch?: string;
  balance: number;
  type: 'BANK' | 'MFS' | 'CASH' | 'MOBILE_BANKING' | string; // MFS = bKash/Nagad
}

export interface LedgerEntry {
  id: string;
  date: string;
  voucherNo: string;
  accountType: 'CASH' | 'BANK' | 'CUSTOMER' | 'SUPPLIER' | 'EXPENSE' | 'SALARY' | 'UTILITY' | 'WITHDRAWAL' | 'SALE' | 'PURCHASE' | string;
  accountId?: string; // customerId, supplierId, bankAccountId, etc.
  customerId?: string;
  supplierId?: string;
  accountName?: string;
  accountTitle: string;
  description: string;
  debit: number; // money received or expense recognized
  credit: number; // money paid out or liability
  balance?: number;
  balanceAfter?: number;
  referenceId?: string; // sale id, purchase id, etc.
  createdBy: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
}

export interface ExpenseRecord {
  id: string;
  voucherNo: string;
  date: string;
  category: string;
  amount: number;
  paidVia?: 'CASH' | 'BANK';
  bankAccountId?: string;
  payee?: string;
  paidTo?: string;
  paymentMethod?: 'CASH' | 'BANK' | string;
  authorizedBy?: string;
  description?: string;
  note?: string;
  recordedBy?: string;
}

export interface UtilityRentRecord {
  id: string;
  month: string; // e.g. "2026-08"
  type?: 'RENT' | 'ELECTRICITY' | 'GAS' | 'WATER' | 'GENERATOR_FUEL' | 'INTERNET_MISC' | string;
  billType?: 'RENT' | 'ELECTRICITY' | 'GAS' | 'WATER' | 'GENERATOR_FUEL' | 'INTERNET_MISC' | string;
  billNo?: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status?: 'PAID' | 'DUE' | 'PENDING' | string;
  paidVia?: 'CASH' | 'BANK';
  bankAccountId?: string;
  notes?: string;
}

export interface OwnerPartner {
  id: string;
  name: string;
  roleTitle?: string;
  designation?: string;
  sharePercentage?: number;
  phone?: string;
  email?: string;
  initialCapital?: number;
}

export interface OwnerWithdrawal {
  id: string;
  voucherNo: string;
  date: string;
  ownerId?: string;
  ownerName: string;
  amount: number;
  paidVia: 'CASH' | 'BANK';
  paymentMethod?: 'CASH' | 'BANK';
  bankAccountId?: string;
  bankAccountName?: string;
  reason: string;
  purpose?: string;
  recordedBy?: string;
  notes?: string;
}

export interface Employee {
  id: string;
  code?: string;
  name: string;
  designation?: string;
  role?: string;
  department?: 'PRODUCTION' | 'SALES' | 'ACCOUNTS' | 'MANAGEMENT' | 'LOGISTICS' | 'QUALITY' | string;
  category?: 'MECHANICAL' | 'OFFICE'; // মেকানিক্যাল স্টাফ vs অফিস স্টাফ
  gender?: 'MALE' | 'FEMALE'; // পুরুষ স্টাফ vs মহিলা স্টাফ
  phone: string;
  joinDate: string;
  basicSalary: number;
  advanceSalary?: number; // মোট অগ্রিম (Advance)
  houseRentAllowance?: number;
  medicalAllowance?: number;
  nid?: string; // NID কার্ড নম্বর (যেমন: ১৯১২৮৪৭১৯২)
  bloodGroup?: string; // রক্তের গ্রুপ (যেমন: A+, B+, O+, AB+)
  photoUrl?: string; // ছবি (বা অবতার)
  issueDate?: string; // আইডি কার্ড ইস্যুর তারিখ
  emergencyContact?: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED' | string;
}

export type PayrollMode = 'AUTOMATIC' | 'MANUAL';

export interface SalaryPayment {
  id: string;
  month: string; // "2026-08"
  employeeId: string;
  employeeName: string;
  designation?: string;
  category?: 'MECHANICAL' | 'OFFICE';
  gender?: 'MALE' | 'FEMALE';
  basicSalary: number;
  allowance?: number;
  overtime?: number;
  deduction?: number;
  advanceDeduction?: number;
  netPayable?: number;
  status: 'PAID' | 'UNPAID' | 'PENDING' | string;
  paymentDate?: string;
  paidDate?: string;
  paidVia?: 'CASH' | 'BANK' | string;
  bankAccountId?: string;
  // UI aliases
  netSalary?: number;
  overtimeAmount?: number;
  bonus?: number;
  deductions?: number;
}

export interface AssetMaintenanceLog {
  id: string;
  assetId: string;
  date: string;
  cost: number;
  description: string;
  servicedBy?: string;
  recordedBy?: string;
  nextServiceDate?: string;
}

export interface DepartmentAsset {
  id: string;
  code: string;
  name: string;
  department: 'PRODUCTION' | 'OFFICE' | 'SALES' | 'LOGISTICS' | 'PACKAGING' | 'UTILITY_POWER' | string;
  purchaseDate: string;
  cost: number;
  usefulLifeYears?: number;
  salvageValue?: number;
  currentValue: number;
  condition: 'EXCELLENT' | 'GOOD' | 'NEEDS_REPAIR' | 'DAMAGED';
  status?: 'ACTIVE' | 'UNDER_MAINTENANCE' | 'DISPOSED';
  location: string;
  assignedTo?: string;
  serialNumber?: string;
  maintenanceLogs?: AssetMaintenanceLog[];
  notes?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: Role;
  action: 'LOGIN' | 'LOGOUT' | 'PASSWORD_CHANGE' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'SETTINGS_RESET' | 'HARD_RESET' | 'RESTORE_BACKUP' | 'PRODUCTION_RUN' | 'SECURITY_ALERT' | 'GO_LIVE_CLEAN';
  module: string;
  details: string;
  ipAddress?: string;
}

export interface BackupArchiveItem {
  id: string;
  timestamp: string;
  label: string;
  type: 'AUTO_PRE_HARD_RESET' | 'MANUAL';
  triggeredBy: string;
  recordSummary: {
    salesCount: number;
    purchasesCount: number;
    productsCount: number;
    customersCount: number;
    suppliersCount: number;
    employeesCount: number;
    usersCount: number;
  };
  fileSizeKB: number;
  dataJson: string;
}

export interface DriveBackupFile {
  id: string;
  name: string;
  size?: string;
  sizeKB: number;
  createdTime: string;
  modifiedTime?: string;
  description?: string;
  backupType?: 'DAILY' | 'PRE_RESET' | 'PRE_GOLIVE' | 'MANUAL';
  companyName?: string;
  webViewLink?: string;
}

export interface GoogleDriveUser {
  email: string;
  displayName: string;
  photoURL?: string;
  connectedAt: string;
}

export interface CurrencyRate {
  code: string;
  symbol: string;
  rate: number;
}

export interface SystemTask {
  id: string;
  title: string;
  dueDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  type: 'APPROVAL' | 'MAINTENANCE' | 'FOLLOW_UP' | 'OTHER';
  relatedId?: string;
}

export interface CompanySettings {
  pdfPrintConfig?: {
    showAddress: boolean;
    showContact: boolean;
    showTaxId: boolean;
    showLogo: boolean;
  };
  companyNameBangla: string;
  companyNameEnglish: string;
  tagline: string;
  logoUrl?: string;
  website?: string;
  phone: string;
  email: string;
  address: string;
  factoryAddress: string;
  binVatNo: string;
  tinNo?: string;
  tradeLicenseNo: string;
  defaultVatPercent: number;
  currencySymbol: string;
  cashInHandBalance: number;
  baseCurrency?: string;
  currencies?: CurrencyRate[];
  theme?: 'DEFAULT' | 'OCEAN' | 'FOREST' | 'SUNSET' | 'CORPORATE_BLUE' | 'DARK_NIGHT';
  name?: string;
  companyName?: string;
  companyLogo?: string;
  taxNumber?: string;
  tradeLicense?: string;
  nameBangla?: string;
  binNumber?: string;
  tinNumber?: string;
  addressBangla?: string;
  companyLogoUrl?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
}

// Aliases for component convenience
export type Batch = BatchItem;
export type Expense = ExpenseRecord;
export type SalaryRecord = SalaryPayment;
export type CustomerLedgerEntry = LedgerEntry;
export type SupplierLedgerEntry = LedgerEntry;
export type UtilityBill = UtilityRentRecord;
