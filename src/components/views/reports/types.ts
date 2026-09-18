export type ReportPeriodPreset =
  | 'TODAY'
  | 'THIS_WEEK'
  | 'THIS_MONTH'
  | 'LAST_MONTH'
  | 'THIS_QUARTER'
  | 'THIS_YEAR'
  | 'ALL'
  | 'CUSTOM';

export interface PnLPeriodData {
  startDate: string;
  endDate: string;
  label: string;
  // Revenue
  grossSales: number;
  discountTotal: number;
  netSales: number;
  // COGS
  totalCOGS: number;
  // Gross Profit
  grossProfit: number;
  grossMarginPercent: number;
  // Operating Expenses breakdown
  operatingExpenses: {
    salesTransport: number;
    salaries: number;
    salaryMode: 'AUTOMATIC' | 'MANUAL';
    utilitiesRent: number;
    wastageLoss: number;
    generalExpenses: number;
    total: number;
  };
  // Net Profit
  netProfit: number;
  netMarginPercent: number;
  // Memo / Non-OpEx reference items
  memo: {
    purchaseTransportTracking: number;
    ownerWithdrawals: number;
  };
}

export interface ProductProfitabilityItem {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  unit: string;
  soldQuantity: number;
  totalSales: number;
  avgSellingPrice: number;
  totalCOGS: number;
  avgUnitCOGS: number;
  grossProfit: number;
  profitMarginPercent: number;
}

export interface MonthlyTrendData {
  monthKey: string; // e.g. '2026-03'
  monthLabel: string; // e.g. 'Mar 2026' / 'মার্চ ২০২৬'
  startDate: string;
  endDate: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  operatingExpenses: number;
  netProfit: number;
  salesTransport: number;
  salaries: number;
  utilitiesRent: number;
  wastageLoss: number;
  generalExpenses: number;
}

export interface ComparisonLineItem {
  id: string;
  stepNumber: string;
  labelBangla: string;
  labelEnglish: string;
  isHeader?: boolean;
  isTotal?: boolean;
  isSubItem?: boolean;
  isDeduction?: boolean;
  period1Value: number;
  period2Value: number;
  difference: number;
  percentChange: number;
  isPositiveGood: boolean; // e.g. for sales, positive diff is good. For expense, negative diff is good.
}
