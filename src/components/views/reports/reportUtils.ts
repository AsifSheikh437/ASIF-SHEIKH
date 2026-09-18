import {
  Sale,
  Purchase,
  ExpenseRecord,
  UtilityBill,
  SalaryPayment,
  TransportTrip,
  WastageRecord,
  OwnerWithdrawal,
  Employee,
  Product,
  PayrollMode,
} from '../../../types';
import {
  ReportPeriodPreset,
  PnLPeriodData,
  ProductProfitabilityItem,
  MonthlyTrendData,
  ComparisonLineItem,
} from './types';

/**
 * Returns [startDate, endDate] strings in YYYY-MM-DD format for a given preset.
 */
export function getDateRangeFromPreset(preset: ReportPeriodPreset): {
  startDate: string;
  endDate: string;
  label: string;
} {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const pad = (n: number) => String(n).padStart(2, '0');

  switch (preset) {
    case 'TODAY':
      return {
        startDate: todayStr,
        endDate: todayStr,
        label: 'আজকের দিন (Today)',
      };

    case 'THIS_WEEK': {
      const d = new Date(now);
      const day = d.getDay(); // 0 is Sunday, 1 is Monday...
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
      const monday = new Date(d.setDate(diff));
      const mondayStr = `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`;
      return {
        startDate: mondayStr,
        endDate: todayStr,
        label: 'চলতি সপ্তাহ (This Week)',
      };
    }

    case 'THIS_MONTH': {
      const y = now.getFullYear();
      const m = now.getMonth();
      const startStr = `${y}-${pad(m + 1)}-01`;
      const lastDay = new Date(y, m + 1, 0).getDate();
      const endStr = `${y}-${pad(m + 1)}-${pad(lastDay)}`;
      return {
        startDate: startStr,
        endDate: endStr,
        label: 'চলতি মাস (This Month)',
      };
    }

    case 'LAST_MONTH': {
      const y = now.getFullYear();
      const m = now.getMonth() - 1;
      const targetDate = new Date(y, m, 1);
      const targetY = targetDate.getFullYear();
      const targetM = targetDate.getMonth();
      const startStr = `${targetY}-${pad(targetM + 1)}-01`;
      const lastDay = new Date(targetY, targetM + 1, 0).getDate();
      const endStr = `${targetY}-${pad(targetM + 1)}-${pad(lastDay)}`;
      return {
        startDate: startStr,
        endDate: endStr,
        label: 'গত মাস (Last Month)',
      };
    }

    case 'THIS_QUARTER': {
      const y = now.getFullYear();
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const startMonth = currentQuarter * 3;
      const startStr = `${y}-${pad(startMonth + 1)}-01`;
      const endMonth = startMonth + 2;
      const lastDay = new Date(y, endMonth + 1, 0).getDate();
      const endStr = `${y}-${pad(endMonth + 1)}-${pad(lastDay)}`;
      return {
        startDate: startStr,
        endDate: endStr,
        label: `চলতি ত্রৈমাসিক Q${currentQuarter + 1} (${y})`,
      };
    }

    case 'THIS_YEAR': {
      const y = now.getFullYear();
      return {
        startDate: `${y}-01-01`,
        endDate: `${y}-12-31`,
        label: `চলতি বছর (${y})`,
      };
    }

    case 'ALL':
    default:
      return {
        startDate: '2020-01-01',
        endDate: '2030-12-31',
        label: 'সমস্ত রেকর্ড (All Time)',
      };
  }
}

/**
 * Calculates a standard multi-step Profit & Loss statement for any date window.
 */
export function calculateDetailedPnL(params: {
  sales: Sale[];
  expenses: ExpenseRecord[];
  utilityBills: UtilityBill[];
  salaryRecords: SalaryPayment[];
  employees: Employee[];
  transportTrips: TransportTrip[];
  wastageRecords: WastageRecord[];
  ownerWithdrawals: OwnerWithdrawal[];
  products: Product[];
  payrollMode?: PayrollMode;
  startDate?: string;
  endDate?: string;
  label?: string;
}): PnLPeriodData {
  const {
    sales = [],
    expenses = [],
    utilityBills = [],
    salaryRecords = [],
    employees = [],
    transportTrips = [],
    wastageRecords = [],
    ownerWithdrawals = [],
    products = [],
    payrollMode = 'AUTOMATIC',
    startDate,
    endDate,
    label = 'পিরিয়ড',
  } = params;

  const isWithin = (dateStr?: string) => {
    if (!dateStr) return true;
    const d = dateStr.slice(0, 10);
    if (startDate && d < startDate) return false;
    if (endDate && d > endDate) return false;
    return true;
  };

  // Product price lookup map for backup COGS calculation
  const productCostMap = new Map<string, number>();
  products.forEach(p => {
    productCostMap.set(p.id, p.purchasePrice || p.sellingPrice * 0.7);
  });

  // 1. Sales & Revenue
  let grossSales = 0;
  let discountTotal = 0;
  let totalCOGS = 0;

  sales.forEach(sale => {
    if (isWithin(sale.date)) {
      grossSales += sale.subTotal || sale.grandTotal || 0;
      discountTotal += sale.discountAmount || 0;

      // COGS per sold items
      (sale.items || []).forEach(item => {
        const itemUnitCost =
          item.costPrice !== undefined && item.costPrice > 0
            ? item.costPrice
            : productCostMap.get(item.productId) || item.unitPrice * 0.7;
        totalCOGS += itemUnitCost * (item.quantity || 0);
      });
    }
  });

  const netSales = grossSales - discountTotal;
  const grossProfit = netSales - totalCOGS;
  const grossMarginPercent = netSales > 0 ? (grossProfit / netSales) * 100 : 0;

  // 2. Transport Expenses Breakdown:
  // Purchase Transport = Separate memo tracking (not in P&L)
  // Sales Transport = OpEx
  let purchaseTransportTracking = 0;
  let salesTransportOpEx = 0;

  transportTrips.forEach(t => {
    if (isWithin(t.date)) {
      const cost = t.totalCost || t.totalTripCost || 0;
      if (t.transportType === 'PURCHASE' || t.purpose === 'PURCHASE_PICKUP') {
        purchaseTransportTracking += cost;
      } else {
        salesTransportOpEx += cost;
      }
    }
  });

  // 3. Salaries Cost:
  // AUTOMATIC mode: monthly compensation of all active employees (pro-rated by months or monthly sum)
  // MANUAL mode: actual disbursed salary payments in the period
  let salariesCost = 0;
  if (payrollMode === 'AUTOMATIC') {
    salariesCost = employees
      .filter(e => e.status === 'ACTIVE')
      .reduce(
        (sum, e) =>
          sum + (e.basicSalary + (e.houseRentAllowance || 0) + (e.medicalAllowance || 0)),
        0
      );
  } else {
    salariesCost = salaryRecords
      .filter(s => isWithin(s.paymentDate || s.month))
      .reduce((sum, s) => sum + (s.netPayable || s.netSalary || 0), 0);
  }

  // 4. Utility & Rent
  const utilitiesRent = utilityBills
    .filter(u => u.status === 'PAID' && isWithin(u.paidDate || u.dueDate))
    .reduce((sum, u) => sum + (u.amount || 0), 0);

  // 5. Wastage & Production Spoilage Loss
  const wastageLoss = wastageRecords
    .filter(w => isWithin(w.date))
    .reduce((sum, w) => sum + (w.totalLoss || (w.quantity || 0) * (w.unitCost || 0)), 0);

  // 6. General Expenses (factory, maintenance, administrative, tea/meals)
  const generalExpenses = expenses
    .filter(e => isWithin(e.date))
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  // Total Operating Expenses
  const totalOpEx =
    salesTransportOpEx + salariesCost + utilitiesRent + wastageLoss + generalExpenses;

  // Net Profit / Net Loss
  const netProfit = grossProfit - totalOpEx;
  const netMarginPercent = netSales > 0 ? (netProfit / netSales) * 100 : 0;

  // Memo Items: Owner withdrawals (equity draw, not OpEx)
  const ownerWithdrawalsTotal = ownerWithdrawals
    .filter(w => isWithin(w.date))
    .reduce((sum, w) => sum + (w.amount || 0), 0);

  return {
    startDate: startDate || '',
    endDate: endDate || '',
    label,
    grossSales,
    discountTotal,
    netSales,
    totalCOGS,
    grossProfit,
    grossMarginPercent,
    operatingExpenses: {
      salesTransport: salesTransportOpEx,
      salaries: salariesCost,
      salaryMode: payrollMode,
      utilitiesRent,
      wastageLoss,
      generalExpenses,
      total: totalOpEx,
    },
    netProfit,
    netMarginPercent,
    memo: {
      purchaseTransportTracking,
      ownerWithdrawals: ownerWithdrawalsTotal,
    },
  };
}

/**
 * Calculates line-by-line comparison between Period 1 and Period 2
 */
export function calculatePnLComparison(
  p1: PnLPeriodData,
  p2: PnLPeriodData
): ComparisonLineItem[] {
  const makeItem = (
    id: string,
    stepNumber: string,
    labelBangla: string,
    labelEnglish: string,
    p1Val: number,
    p2Val: number,
    isPositiveGood: boolean,
    opts?: { isHeader?: boolean; isTotal?: boolean; isSubItem?: boolean; isDeduction?: boolean }
  ): ComparisonLineItem => {
    const diff = p1Val - p2Val;
    const percentChange = p2Val !== 0 ? (diff / Math.abs(p2Val)) * 100 : p1Val > 0 ? 100 : 0;
    return {
      id,
      stepNumber,
      labelBangla,
      labelEnglish,
      period1Value: p1Val,
      period2Value: p2Val,
      difference: diff,
      percentChange,
      isPositiveGood,
      ...opts,
    };
  };

  return [
    makeItem('gross_sales', '১', 'গ্রস খাদ্যপণ্য বিক্রয় (Gross Sales)', 'Gross Revenue', p1.grossSales, p2.grossSales, true, { isHeader: true }),
    makeItem('discounts', '—', '(−) বিক্রয় কমিশন ও ছাড় (Discounts)', 'Sales Discounts', p1.discountTotal, p2.discountTotal, false, { isSubItem: true, isDeduction: true }),
    makeItem('net_sales', '১.১', 'নিট বিক্রয় রাজস্ব (Net Sales Revenue)', 'Net Turnover', p1.netSales, p2.netSales, true, { isTotal: true }),
    makeItem('cogs', '২', '(−) বিক্রীত পণ্যের উৎপাদন খরচ (COGS)', 'Cost of Goods Sold', p1.totalCOGS, p2.totalCOGS, false, { isHeader: true, isDeduction: true }),
    makeItem('gross_profit', '৩', '= গ্রস ব্যবসায়িক লাভ (Gross Profit)', 'Gross Profit', p1.grossProfit, p2.grossProfit, true, { isTotal: true }),
    makeItem('opex_header', '৪', '(−) পরিচালন ব্যয়সমূহ (Operating Expenses)', 'Operating Expenses', p1.operatingExpenses.total, p2.operatingExpenses.total, false, { isHeader: true, isDeduction: true }),
    makeItem('sales_transport', '৪.১', 'বিক্রয় ও ডেলিভারি পরিবহন (Sales Transport)', 'Sales Delivery Transport', p1.operatingExpenses.salesTransport, p2.operatingExpenses.salesTransport, false, { isSubItem: true }),
    makeItem('salaries', '৪.২', `শ্রমিক ও কর্মকর্তাদের বেতন (${p1.operatingExpenses.salaryMode === 'AUTOMATIC' ? 'অটো' : 'ম্যানুয়াল'} মোড)`, 'Salaries & Payroll', p1.operatingExpenses.salaries, p2.operatingExpenses.salaries, false, { isSubItem: true }),
    makeItem('utilities_rent', '৪.৩', 'ফ্যাক্টরি ও গোডাউন ভাড়া, বিদ্যুৎ ও ইউটিলিটি', 'Rent & Utilities', p1.operatingExpenses.utilitiesRent, p2.operatingExpenses.utilitiesRent, false, { isSubItem: true }),
    makeItem('wastage', '৪.৪', 'ফুড অপচয় ও নষ্ট পণ্যের আর্থিক ক্ষতি', 'Wastage & Spoilage Loss', p1.operatingExpenses.wastageLoss, p2.operatingExpenses.wastageLoss, false, { isSubItem: true }),
    makeItem('general_exp', '৪.৫', 'কারখানা রক্ষণাবেক্ষণ ও অন্যান্য সাধারণ ব্যয়', 'General & Maintenance Expenses', p1.operatingExpenses.generalExpenses, p2.operatingExpenses.generalExpenses, false, { isSubItem: true }),
    makeItem('total_opex', '৪.৬', 'সর্বমোট পরিচালন ব্যয় (Total OpEx)', 'Total Operating Expenses', p1.operatingExpenses.total, p2.operatingExpenses.total, false, { isTotal: true }),
    makeItem('net_profit', '৫', '= কর পূর্ববর্তী নিট ব্যবসায়িক মুনাফা / ক্ষতি', 'Net Profit / Loss', p1.netProfit, p2.netProfit, true, { isTotal: true }),
  ];
}

/**
 * Calculates profitability for all products sold in the given date range.
 */
export function calculateProductProfitability(params: {
  sales: Sale[];
  products: Product[];
  startDate?: string;
  endDate?: string;
}): ProductProfitabilityItem[] {
  const { sales = [], products = [], startDate, endDate } = params;

  const isWithin = (dateStr?: string) => {
    if (!dateStr) return true;
    const d = dateStr.slice(0, 10);
    if (startDate && d < startDate) return false;
    if (endDate && d > endDate) return false;
    return true;
  };

  const productMap = new Map<string, Product>();
  products.forEach(p => productMap.set(p.id, p));

  // Map of productId -> accumulated metrics
  const accMap = new Map<
    string,
    {
      soldQty: number;
      totalSales: number;
      totalCOGS: number;
    }
  >();

  sales.forEach(sale => {
    if (isWithin(sale.date)) {
      (sale.items || []).forEach(item => {
        const prod = productMap.get(item.productId);
        const itemCOGS =
          item.costPrice !== undefined && item.costPrice > 0
            ? item.costPrice
            : prod?.purchasePrice || item.unitPrice * 0.7;

        const current = accMap.get(item.productId) || {
          soldQty: 0,
          totalSales: 0,
          totalCOGS: 0,
        };

        current.soldQty += item.quantity || 0;
        current.totalSales += (item.unitPrice || 0) * (item.quantity || 0);
        current.totalCOGS += itemCOGS * (item.quantity || 0);

        accMap.set(item.productId, current);
      });
    }
  });

  const result: ProductProfitabilityItem[] = [];

  accMap.forEach((data, prodId) => {
    const prod = productMap.get(prodId);
    const grossProfit = data.totalSales - data.totalCOGS;
    const margin = data.totalSales > 0 ? (grossProfit / data.totalSales) * 100 : 0;

    result.push({
      productId: prodId,
      productName: prod ? (prod.nameBangla || prod.nameEnglish) : 'Unknown Product',
      sku: prod ? (prod.code || prod.sku || prodId.slice(0, 6)) : prodId.slice(0, 6),
      category: prod ? prod.category : 'GENERAL',
      unit: prod ? prod.unit : 'pcs',
      soldQuantity: data.soldQty,
      totalSales: data.totalSales,
      avgSellingPrice: data.soldQty > 0 ? data.totalSales / data.soldQty : 0,
      totalCOGS: data.totalCOGS,
      avgUnitCOGS: data.soldQty > 0 ? data.totalCOGS / data.soldQty : 0,
      grossProfit,
      profitMarginPercent: margin,
    });
  });

  return result;
}

/**
 * Calculates monthly trends for the past N months (default: 12 months)
 */
export function calculateMonthlyTrends(params: {
  sales: Sale[];
  expenses: ExpenseRecord[];
  utilityBills: UtilityBill[];
  salaryRecords: SalaryPayment[];
  employees: Employee[];
  transportTrips: TransportTrip[];
  wastageRecords: WastageRecord[];
  ownerWithdrawals: OwnerWithdrawal[];
  products: Product[];
  payrollMode?: PayrollMode;
  monthsCount?: number;
}): MonthlyTrendData[] {
  const {
    monthsCount = 12,
    sales,
    expenses,
    utilityBills,
    salaryRecords,
    employees,
    transportTrips,
    wastageRecords,
    ownerWithdrawals,
    products,
    payrollMode,
  } = params;

  const now = new Date();
  const months: MonthlyTrendData[] = [];

  const banglaMonths = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];

  const pad = (n: number) => String(n).padStart(2, '0');

  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();

    const monthKey = `${y}-${pad(m + 1)}`;
    const monthLabel = `${banglaMonths[m]} ${y}`;
    const startDate = `${y}-${pad(m + 1)}-01`;
    const lastDay = new Date(y, m + 1, 0).getDate();
    const endDate = `${y}-${pad(m + 1)}-${pad(lastDay)}`;

    const pnl = calculateDetailedPnL({
      sales,
      expenses,
      utilityBills,
      salaryRecords,
      employees,
      transportTrips,
      wastageRecords,
      ownerWithdrawals,
      products,
      payrollMode,
      startDate,
      endDate,
      label: monthLabel,
    });

    months.push({
      monthKey,
      monthLabel,
      startDate,
      endDate,
      revenue: pnl.netSales,
      cogs: pnl.totalCOGS,
      grossProfit: pnl.grossProfit,
      operatingExpenses: pnl.operatingExpenses.total,
      netProfit: pnl.netProfit,
      salesTransport: pnl.operatingExpenses.salesTransport,
      salaries: pnl.operatingExpenses.salaries,
      utilitiesRent: pnl.operatingExpenses.utilitiesRent,
      wastageLoss: pnl.operatingExpenses.wastageLoss,
      generalExpenses: pnl.operatingExpenses.generalExpenses,
    });
  }

  return months;
}
