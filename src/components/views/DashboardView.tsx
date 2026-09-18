import React, { useState, useMemo, useEffect } from 'react';
import { DataExportToolbar } from '../common/DataExportToolbar';
import { useERP } from '../../context/ERPContext';
import { formatCurrency, toBengaliNumber } from '../../utils/formatters';
import { ProcurementForecast } from './ProcurementForecast';
import { DailySummaryWidget } from './DailySummaryWidget';
import * as XLSX from 'xlsx';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Truck,
  Package,
  Wallet,
  Building,
  Users,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  FileSpreadsheet,
  FileText,
  Download,
  Search,
  Filter,
  Calendar,
  BarChart3,
  LineChart as LineChartIcon,
  Clock,
  CheckCircle2,
  Phone,
  ShieldCheck,
  ChevronRight,
  Receipt,
  Layers,
  RefreshCw,
  Play,
  Pause,
  Landmark,
  Sparkles,
  Boxes,
  ListTodo,
  ArrowRight,
  Bell,
  AlertCircle,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    todaySalesTotal,
    todayPurchaseTotal,
    totalStockValue,
    totalCashAndBankBalance,
    totalReceivableDues,
    totalPayableDues,
    settings,
    products,
    batches,
    sales,
    purchases,
    productionRuns,
    customers,
    suppliers,
    bankAccounts,
    expenses,
    assets,
    systemTasks,
    updateSystemTask,
    getPnLSummary,
    setActiveModule,
    theme,
    addPurchase,
    currentUser,
    toggleTransactionVisualStatus,
    utilityBills,
    salaryRecords,
    wastageRecords,
  } = useERP();

  // Auto-refresh interval state & timer
  const REFRESH_OPTIONS = [
    { value: 0, label: 'অফ (ম্যানুয়াল)' },
    { value: 10, label: '১০ সেকেন্ড' },
    { value: 30, label: '৩০ সেকেন্ড' },
    { value: 60, label: '১ মিনিট' },
    { value: 120, label: '২ মিনিট' },
    { value: 300, label: '৫ মিনিট' },
  ];

  const [refreshInterval, setRefreshInterval] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('food_erp_dashboard_refresh_interval');
      return saved !== null ? Number(saved) : 30; // default 30s
    } catch {
      return 30;
    }
  });

  const [countdown, setCountdown] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('food_erp_dashboard_refresh_interval');
      const val = saved !== null ? Number(saved) : 30;
      return val > 0 ? val : 30;
    } catch {
      return 30;
    }
  });

  const [showRequisitionModal, setShowRequisitionModal] = useState(false);
  const [selectedSupplierForReq, setSelectedSupplierForReq] = useState<string>('');

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(() => new Date());

  const handleTriggerRefresh = () => {
    setIsRefreshing(true);
    setLastRefreshedAt(new Date());
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
    if (refreshInterval > 0) {
      setCountdown(refreshInterval);
    }
  };

  const handleIntervalChange = (newInterval: number) => {
    setRefreshInterval(newInterval);
    setCountdown(newInterval > 0 ? newInterval : 0);
    try {
      localStorage.setItem('food_erp_dashboard_refresh_interval', String(newInterval));
    } catch {
      // ignore
    }
    if (newInterval > 0 && isPaused) {
      setIsPaused(false);
    }
  };

  // Timer effect for auto-refresh
  useEffect(() => {
    if (refreshInterval <= 0 || isPaused) {
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleTriggerRefresh();
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [refreshInterval, isPaused]);

  // Chart configuration state
  const [txSearchQuery, setTxSearchQuery] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState<'ALL' | 'SALE' | 'PURCHASE'>('ALL');
  const [trendDays, setTrendDays] = useState<7 | 14 | 30>(7);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [monthChartView, setMonthChartView] = useState<'OVERALL' | 'WEEKLY' | 'DAILY'>('WEEKLY');
  const [hoveredPoint, setHoveredPoint] = useState<{
    date: string;
    sales: number;
    purchases: number;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  // Due list filter
  const [dueTab, setDueTab] = useState<'ALL' | 'CUSTOMERS' | 'SUPPLIERS'>('ALL');

  const safeProducts = products || [];
  const safeSales = sales || [];
  const safePurchases = purchases || [];
  const safeCustomers = customers || [];
  const safeSuppliers = suppliers || [];
  const safeBankAccounts = bankAccounts || [];
  const safeAssets = assets || [];
  const safeSystemTasks = systemTasks || [];

  // 1. Total Assets Calculations (Current Assets + Fixed/Department Assets)
  const cashInHand = settings.cashInHandBalance || 0;
  const totalBankBalance = safeBankAccounts.reduce((sum, b) => sum + (b.balance || 0), 0);

  const totalFixedAssets = useMemo(() => {
    return safeAssets.reduce((sum, a) => sum + (a.currentValue ?? a.cost ?? 0), 0);
  }, [safeAssets]);

  const totalCurrentAssets = useMemo(() => {
    return (cashInHand || 0) + (totalBankBalance || 0) + (totalReceivableDues || 0) + (totalStockValue || 0);
  }, [cashInHand, totalBankBalance, totalReceivableDues, totalStockValue]);

  const totalAssetsValue = totalCurrentAssets + totalFixedAssets;

  // Compute Tasks and Reminders
  const tasksAndReminders = useMemo(() => {
    const tasks = [];
    
    // 1. Pending Supplier Payments
    const pendingPurchases = (purchases || []).filter(p => p.dueAmount > 0 && p.visualStatus !== 'PAID');
    pendingPurchases.forEach(p => {
      tasks.push({
        id: `pay-${p.id}`,
        title: `বকেয়া পেমেন্ট: ${p.supplierName}`,
        description: `ইনভয়েস ${p.billNo} - বকেয়া ৳${p.dueAmount.toLocaleString('en-IN')}`,
        type: 'PAYMENT',
        date: p.date,
        priority: p.dueAmount > 50000 ? 'HIGH' : 'MEDIUM'
      });
    });

    // 2. Upcoming / Recent Production Batches
    // Just show the most recent planned or produced batches as reminders
    const recentRuns = (productionRuns || []).slice(0, 3);
    recentRuns.forEach(r => {
      tasks.push({
        id: `prod-${r.id}`,
        title: `প্রোডাকশন ব্যাচ: ${r.recipeName}`,
        description: `ব্যাচ ${r.batchNo} - ${r.producedQuantity} ${r.unit} উৎপাদিত`,
        type: 'PRODUCTION',
        date: r.date,
        priority: 'LOW'
      });
    });

    // 3. User & Customer/Supplier Follow-up Reminders
    (systemTasks || []).filter(t => t.status !== 'COMPLETED').forEach(t => {
      tasks.push({
        id: t.id,
        title: t.title,
        description: t.dueDate ? `অনুসরণের তারিখ: ${t.dueDate}` : 'পেন্ডিং রিমাইন্ডার',
        type: 'FOLLOW_UP',
        date: t.dueDate || new Date().toISOString(),
        priority: 'HIGH',
        isSystemTask: true,
        originalTask: t,
      });
    });
    
    // Sort by priority and date
    return tasks.sort((a, b) => {
      const pMap = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      if (pMap[a.priority] !== pMap[b.priority]) {
        return pMap[b.priority] - pMap[a.priority];
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }).slice(0, 8); // Limit to top 8
  }, [purchases, productionRuns, systemTasks]);


  const recentTransactions = useMemo(() => {
    let combined = [
      ...safeSales.map(s => ({
        id: s.id,
        date: s.date,
        type: 'SALE' as const,
        invoiceNo: s.invoiceNo,
        partyName: s.customerName,
        amount: s.grandTotal,
        visualStatus: s.visualStatus || (s.dueAmount <= 0 ? 'PAID' : 'PENDING')
      })),
      ...safePurchases.map(p => ({
        id: p.id,
        date: p.date,
        type: 'PURCHASE' as const,
        invoiceNo: p.billNo,
        partyName: p.supplierName,
        amount: p.grandTotal,
        visualStatus: p.visualStatus || (p.dueAmount <= 0 ? 'PAID' : 'PENDING')
      }))
    ];
    
    // Sort by date descending
    combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    if (txSearchQuery.trim()) {
      const q = txSearchQuery.toLowerCase().trim();
      combined = combined.filter(tx => 
        tx.invoiceNo.toLowerCase().includes(q) ||
        tx.partyName.toLowerCase().includes(q) ||
        tx.date.includes(q) ||
        new Date(tx.date).toLocaleDateString('bn-BD').includes(q)
      );
    }

    if (txTypeFilter !== 'ALL') {
      combined = combined.filter(tx => tx.type === txTypeFilter);
    }
    
    // If filtering, show up to 10 results, else top 5 recent
    return combined.slice(0, txSearchQuery.trim() || txTypeFilter !== 'ALL' ? 10 : 5);
  }, [safeSales, safePurchases, txSearchQuery, txTypeFilter]);

  // 2. Pending Orders Calculations (Sales invoices not yet delivered/cancelled)

  const pendingSystemTasksCount = useMemo(() => {
    return safeSystemTasks.filter(t => t.status !== 'COMPLETED').length;
  }, [safeSystemTasks]);

  const pendingSalesOrders = useMemo(() => {
    return safeSales.filter(s => {
      const isCancelled = s.deliveryStatus === 'CANCELLED';
      const isDelivered = (s.workflowStep || 1) === 3 || s.deliveryStatus === 'DELIVERED';
      return !isCancelled && !isDelivered;
    });
  }, [safeSales]);

  const pendingOrdersCount = pendingSalesOrders.length;
  const pendingOrdersValue = useMemo(() => {
    return pendingSalesOrders.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
  }, [pendingSalesOrders]);

  const pendingStep1Count = useMemo(() => {
    return pendingSalesOrders.filter(s => (s.workflowStep || 1) === 1).length;
  }, [pendingSalesOrders]);

  const pendingStep2Count = useMemo(() => {
    return pendingSalesOrders.filter(s => (s.workflowStep || 1) === 2).length;
  }, [pendingSalesOrders]);

  // Low Stock / Stock Alert Calculation
  const lowStockProducts = useMemo(() => {
    return safeProducts.filter(p => (p.currentStock ?? 0) <= (p.minStockAlert ?? 20));
  }, [safeProducts]);
  const lowStockCount = lowStockProducts.length;

  // Visual Alert Thresholds
  const PENDING_ORDERS_ALERT_THRESHOLD = 10;
  const isPendingOrdersAlert = pendingOrdersCount > PENDING_ORDERS_ALERT_THRESHOLD;
  const STOCK_ALERT_THRESHOLD = 3;
  const isStockAlert = lowStockCount >= STOCK_ALERT_THRESHOLD;

  // 3. Today's Sales Calculation
  const todayInvoicesList = useMemo(() => {
    const todayISO = new Date().toISOString().split('T')[0];
    return safeSales.filter(s => s.invoiceDate === todayISO || s.date === todayISO);
  }, [safeSales, lastRefreshedAt]);

  const todaySalesCount = todayInvoicesList.length;
  const todayCashCollected = useMemo(() => {
    return todayInvoicesList.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
  }, [todayInvoicesList]);

  const todayDueAmount = useMemo(() => {
    return todayInvoicesList.reduce((sum, s) => sum + (s.dueAmount || 0), 0);
  }, [todayInvoicesList]);

  const dynamicTodaySales = useMemo(() => {
    const sumToday = todayInvoicesList.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
    return Math.max(todaySalesTotal || 0, sumToday);
  }, [todayInvoicesList, todaySalesTotal]);

  // P&L calculation
  const pnl = useMemo(() => {
    return getPnLSummary ? getPnLSummary() : {
      grossSales: 0,
      discountTotal: 0,
      netSales: 0,
      cogs: 0,
      grossProfit: 0,
      grossProfitMargin: 0,
      operatingExpenses: {
        generalExpenses: 0,
        utilityRent: 0,
        transportCost: 0,
        salaries: 0,
        wastageLoss: 0,
        total: 0,
      },
      totalOperatingExpenses: 0,
      netProfit: 0,
      profitMarginPercent: 0,
      netProfitMargin: 0,
      totalDiscounts: 0,
    };
  }, [getPnLSummary]);

  // Total Sales & Total Purchases overall
  const overallSalesTotal = useMemo(() => {
    return safeSales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
  }, [safeSales]);

  const overallPurchaseTotal = useMemo(() => {
    return safePurchases.reduce((sum, p) => sum + (p.grandTotal || 0), 0);
  }, [safePurchases]);

  // Profit vs Loss breakdown
  const isLoss = pnl.netProfit < 0;
  const totalProfitAmount = Math.max(0, pnl.netProfit);
  const totalLossAmount = isLoss ? Math.abs(pnl.netProfit) : 0;

  // 1. Sales & Purchase Trend by Date (Last N days)
  const trendData = useMemo(() => {
    const result: { date: string; displayDate: string; sales: number; purchases: number; expenses: number; count: number }[] = [];
    const now = new Date();

    for (let i = trendDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const isoDate = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString('bn-BD', { month: 'short', day: 'numeric' });

      // Calculate sales on this date
      const daySales = safeSales
        .filter(s => s.invoiceDate === isoDate || s.date === isoDate)
        .reduce((sum, s) => sum + (s.grandTotal || 0), 0);

      const daySalesCount = safeSales.filter(s => s.invoiceDate === isoDate || s.date === isoDate).length;

      // Calculate purchases on this date
      const dayPurchases = safePurchases
        .filter(p => p.purchaseDate === isoDate || p.date === isoDate)
        .reduce((sum, p) => sum + (p.grandTotal || 0), 0);

      // Calculate other expenses
      const dayExpenses = (expenses || [])
        .filter(e => e.date === isoDate)
        .reduce((sum, e) => sum + (e.amount || 0), 0);

      result.push({
        date: isoDate,
        displayDate,
        sales: daySales,
        purchases: dayPurchases,
        expenses: dayPurchases + dayExpenses,
        count: daySalesCount,
      });
    }
    return result;
  }, [trendDays, safeSales, safePurchases, expenses]);

  const maxTrendValue = useMemo(() => {
    const maxVal = Math.max(
      ...trendData.map(d => Math.max(d.sales, d.purchases, d.expenses)),
      5000
    );
    return Math.ceil(maxVal * 1.15); // Add 15% headroom
  }, [trendData]);

  const totalTrendSales = trendData.reduce((s, d) => s + d.sales, 0);
  const avgDailySales = Math.round(totalTrendSales / trendDays);

  // 1b. Current Month Sales vs Total Expenses Analytics (Recharts BarChart)
  const currentMonthAnalytics = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIdx = now.getMonth(); // 0 to 11
    const monthPadded = String(currentMonthIdx + 1).padStart(2, '0');
    const currentMonthPrefix = `${currentYear}-${monthPadded}`; // e.g. "2026-09"
    
    const monthNameBn = now.toLocaleDateString('bn-BD', { month: 'long', year: 'numeric' });
    const monthNameEn = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Days in current month
    const totalDaysInMonth = new Date(currentYear, currentMonthIdx + 1, 0).getDate();

    // 1. Current Month Sales
    const currentMonthSalesList = safeSales.filter(s => {
      const d = s.invoiceDate || s.date;
      return d && d.startsWith(currentMonthPrefix);
    });
    const totalMonthSales = currentMonthSalesList.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
    const totalMonthSalesOrders = currentMonthSalesList.length;

    // 2. Current Month Expenses Breakdown:
    // a. General Operating Expenses
    const currentMonthGenExpenses = (expenses || [])
      .filter(e => e.date && e.date.startsWith(currentMonthPrefix))
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    // b. Purchases (Raw materials & supplies procurement)
    const currentMonthPurchases = safePurchases
      .filter(p => {
        const d = p.purchaseDate || p.date;
        return d && d.startsWith(currentMonthPrefix);
      })
      .reduce((sum, p) => sum + (p.grandTotal || 0), 0);

    // c. Utility & Rent
    const currentMonthUtilities = (utilityBills || [])
      .filter(u => {
        const d = u.paidDate || u.dueDate || '';
        return d.startsWith(currentMonthPrefix);
      })
      .reduce((sum, u) => sum + (u.amount || 0), 0);

    // d. Salaries & Wages
    const currentMonthSalaries = (salaryRecords || [])
      .filter(s => {
        const d = s.paymentDate || s.month || '';
        return d.startsWith(currentMonthPrefix);
      })
      .reduce((sum, s) => sum + (s.netPayable || 0), 0);

    // e. Wastage / Damage loss
    const currentMonthWastage = (wastageRecords || [])
      .filter(w => w.date && w.date.startsWith(currentMonthPrefix))
      .reduce((sum, w) => sum + (w.totalLoss || (w.quantity * (w.unitCost || 0))), 0);

    // Overall total expenses for the current month
    const totalMonthExpenses = currentMonthGenExpenses + currentMonthPurchases + currentMonthUtilities + currentMonthSalaries + currentMonthWastage;
    
    const netProfitOrLoss = totalMonthSales - totalMonthExpenses;
    const profitMargin = totalMonthSales > 0 ? (netProfitOrLoss / totalMonthSales) * 100 : 0;
    const expenseRatio = totalMonthSales > 0 ? (totalMonthExpenses / totalMonthSales) * 100 : 0;

    // Daily breakdown for the month
    const dailyData: { day: number; date: string; label: string; sales: number; expenses: number; purchases: number; otherExpenses: number }[] = [];
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dayPadded = String(day).padStart(2, '0');
      const isoDate = `${currentMonthPrefix}-${dayPadded}`;
      const daySales = safeSales
        .filter(s => (s.invoiceDate || s.date) === isoDate)
        .reduce((sum, s) => sum + (s.grandTotal || 0), 0);

      const dayPurchases = safePurchases
        .filter(p => (p.purchaseDate || p.date) === isoDate)
        .reduce((sum, p) => sum + (p.grandTotal || 0), 0);

      const dayGenExp = (expenses || [])
        .filter(e => e.date === isoDate)
        .reduce((sum, e) => sum + (e.amount || 0), 0);

      const dayUtil = (utilityBills || [])
        .filter(u => (u.paidDate || u.dueDate) === isoDate)
        .reduce((sum, u) => sum + (u.amount || 0), 0);

      const daySal = (salaryRecords || [])
        .filter(s => (s.paymentDate || s.month) === isoDate)
        .reduce((sum, s) => sum + (s.netPayable || 0), 0);

      const dayWastage = (wastageRecords || [])
        .filter(w => w.date === isoDate)
        .reduce((sum, w) => sum + (w.totalLoss || (w.quantity * (w.unitCost || 0))), 0);

      const dayTotalExp = dayPurchases + dayGenExp + dayUtil + daySal + dayWastage;

      dailyData.push({
        day,
        date: isoDate,
        label: `${day} ${now.toLocaleDateString('bn-BD', { month: 'short' })}`,
        sales: daySales,
        expenses: dayTotalExp,
        purchases: dayPurchases,
        otherExpenses: dayGenExp + dayUtil + daySal + dayWastage,
      });
    }

    // Weekly breakdown for the month
    const weeklyData = [
      { name: '১ম সপ্তাহ (১-৭)', range: '১-৭ তারিখ', sales: 0, expenses: 0 },
      { name: '২য় সপ্তাহ (৮-১৪)', range: '৮-১৪ তারিখ', sales: 0, expenses: 0 },
      { name: '৩য় সপ্তাহ (১৫-২১)', range: '১৫-২১ তারিখ', sales: 0, expenses: 0 },
      { name: '৪র্থ সপ্তাহ (২২-২৮)', range: '২২-২৮ তারিখ', sales: 0, expenses: 0 },
      ...(totalDaysInMonth > 28 ? [{ name: `৫ম সপ্তাহ (২৯-${totalDaysInMonth})`, range: `২৯-${totalDaysInMonth} তারিখ`, sales: 0, expenses: 0 }] : []),
    ];

    dailyData.forEach(d => {
      let weekIdx = 0;
      if (d.day <= 7) weekIdx = 0;
      else if (d.day <= 14) weekIdx = 1;
      else if (d.day <= 21) weekIdx = 2;
      else if (d.day <= 28) weekIdx = 3;
      else weekIdx = 4;

      if (weeklyData[weekIdx]) {
        weeklyData[weekIdx].sales += d.sales;
        weeklyData[weekIdx].expenses += d.expenses;
      }
    });

    // Overall aggregate comparison bars
    const overallComparisonData = [
      {
        category: 'চলতি মাসের মোট বিক্রয়',
        categoryEn: 'Total Sales',
        amount: totalMonthSales,
        fill: theme === 'dark' ? '#14b8a6' : '#0d9488',
      },
      {
        category: 'চলতি মাসের মোট ব্যয়',
        categoryEn: 'Total Expenses',
        amount: totalMonthExpenses,
        fill: theme === 'dark' ? '#fb7185' : '#e11d48',
      },
      {
        category: netProfitOrLoss >= 0 ? 'নিট লাভ (Surplus)' : 'নিট ঘাটতি (Deficit)',
        categoryEn: 'Net Profit/Loss',
        amount: Math.abs(netProfitOrLoss),
        fill: netProfitOrLoss >= 0 
          ? (theme === 'dark' ? '#38bdf8' : '#0284c7') 
          : (theme === 'dark' ? '#f43f5e' : '#be123c'),
      }
    ];

    return {
      monthNameBn,
      monthNameEn,
      totalMonthSales,
      totalMonthExpenses,
      totalMonthSalesOrders,
      currentMonthPurchases,
      currentMonthGenExpenses,
      currentMonthUtilities,
      currentMonthSalaries,
      currentMonthWastage,
      netProfitOrLoss,
      profitMargin,
      expenseRatio,
      dailyData,
      weeklyData,
      overallComparisonData,
    };
  }, [safeSales, safePurchases, expenses, utilityBills, salaryRecords, wastageRecords, theme]);

  // 2. Product Analytics: Sold quantity, revenue, cost, profit, margin
  const productAnalytics = useMemo(() => {
    const map: Record<string, {
      id: string;
      name: string;
      category: string;
      unit: string;
      unitsSold: number;
      revenue: number;
      cogs: number;
      profit: number;
      margin: number;
      currentStock: number;
    }> = {};

    // Initialize map from product inventory
    safeProducts.forEach(p => {
      map[p.id] = {
        id: p.id,
        name: p.nameBangla || p.name,
        category: p.category,
        unit: p.unit,
        unitsSold: 0,
        revenue: 0,
        cogs: 0,
        profit: 0,
        margin: 0,
        currentStock: p.currentStock,
      };
    });

    // Populate from all sales items
    safeSales.forEach(s => {
      (s.items || []).forEach(item => {
        if (!map[item.productId]) {
          map[item.productId] = {
            id: item.productId,
            name: item.productName,
            category: 'FINISHED_GOODS',
            unit: 'piece',
            unitsSold: 0,
            revenue: 0,
            cogs: 0,
            profit: 0,
            margin: 0,
            currentStock: 0,
          };
        }
        const record = map[item.productId];
        const qty = item.quantity || 0;
        const rev = item.total || 0;
        // Cost estimation: from item.unitCost or product.purchasePrice
        const unitCost = item.unitCost || (safeProducts.find(p => p.id === item.productId)?.purchasePrice || 0);
        const cost = qty * unitCost;

        record.unitsSold += qty;
        record.revenue += rev;
        record.cogs += cost;
      });
    });

    // Compute profit and margins
    const list = Object.values(map).map(p => {
      const profit = p.revenue - p.cogs;
      const margin = p.revenue > 0 ? (profit / p.revenue) * 100 : 0;
      return { ...p, profit, margin };
    });

    // Top Selling Products (Sorted by revenue/qty desc)
    const topSelling = [...list]
      .filter(p => p.unitsSold > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Least Selling Products (Lowest sales or 0 sales)
    const leastSelling = [...list]
      .sort((a, b) => a.unitsSold - b.unitsSold)
      .slice(0, 5);

    // Most Profitable Products (Highest total profit)
    const mostProfitable = [...list]
      .filter(p => p.revenue > 0)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5);

    // Least Profitable Products (Lowest profit or negative profit)
    const leastProfitable = [...list]
      .filter(p => p.revenue > 0)
      .sort((a, b) => a.profit - b.profit)
      .slice(0, 5);

    return { topSelling, leastSelling, mostProfitable, leastProfitable };
  }, [safeProducts, safeSales]);

  // 3. Party-wise Due List (Sorted largest to smallest)
  const partyDueList = useMemo(() => {
    const list: {
      id: string;
      name: string;
      type: 'CUSTOMER' | 'SUPPLIER';
      phone?: string;
      address?: string;
      dueAmount: number;
    }[] = [];

    if (dueTab === 'ALL' || dueTab === 'CUSTOMERS') {
      safeCustomers
        .filter(c => (c.currentDue || 0) > 0)
        .forEach(c => {
          list.push({
            id: c.id,
            name: c.name,
            type: 'CUSTOMER',
            phone: c.phone,
            address: c.address,
            dueAmount: c.currentDue,
          });
        });
    }

    if (dueTab === 'ALL' || dueTab === 'SUPPLIERS') {
      safeSuppliers
        .filter(s => (s.currentPayable || 0) > 0)
        .forEach(s => {
          list.push({
            id: s.id,
            name: s.name,
            type: 'SUPPLIER',
            phone: s.phone,
            address: s.address,
            dueAmount: s.currentPayable,
          });
        });
    }

    // Sort descending by due amount (বড় বকেয়া থেকে ছোট বকেয়া)
    return list.sort((a, b) => b.dueAmount - a.dueAmount);
  }, [safeCustomers, safeSuppliers, dueTab]);

  // 4. Excel Export Functionality (Multi-sheet corporate workbook)
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const currentDate = new Date().toLocaleDateString('bn-BD');

    // Sheet 1: KPI Summary
    const kpiData = [
      ['কোম্পানির নাম', settings.companyNameBangla || 'ফুড ইআরপি সিস্টেম'],
      ['রিপোর্টের ধরন', 'এক্সিকিউটিভ ড্যাশবোর্ড প্রধান আর্থিক ও পরিচালনা সারসংক্ষেপ'],
      ['তারিখ', new Date().toISOString().split('T')[0]],
      [''],
      ['প্রধান সূচক (মেট্রিক্স)', 'পরিমাণ (টাকা)', 'মন্তব্য'],
      ['মোট ব্যাংক জমা', totalBankBalance, `${safeBankAccounts.length} টি ব্যাংক একাউন্ট`],
      ['আজকের মোট বিক্রয়', dynamicTodaySales, `${todaySalesCount} টি ইনভয়েস`],
      ['অপেক্ষমাণ অর্ডার', pendingOrdersCount, `মোট মূল্য: ${formatCurrency(pendingOrdersValue)}`],
      ['সর্বমোট সম্পদ', totalAssetsValue, `চলতি: ${formatCurrency(totalCurrentAssets)}, স্থায়ী: ${formatCurrency(totalFixedAssets)}`],
      ['সর্বমোট বিক্রয়', overallSalesTotal, `মোট ইনভয়েস: ${safeSales.length} টি`],
      ['সর্বমোট ক্রয়', overallPurchaseTotal, `মোট বিল: ${safePurchases.length} টি`],
      ['আজকের ক্রয়', todayPurchaseTotal, 'সাপ্লায়ার বিল'],
      ['মোট নিট লাভ', pnl.netProfit, `${pnl.profitMarginPercent.toFixed(1)}% মার্জিন`],
      ['মোট নিট ক্ষতি', totalLossAmount, isLoss ? 'ক্ষতিগ্রস্থ' : 'কোনো নিট ক্ষতি নেই'],
      ['গ্রস প্রফিট', pnl.grossProfit, 'বিক্রয় - পণ্যের ক্রয়মূল্য'],
      ['মোট পরিচালন খরচ', pnl.totalOperatingExpenses, 'দৈনন্দিন খরচ, বেতন, ইউটিলিটি'],
      ['হাতে নগদ ক্যাশ', cashInHand, 'নগদ ক্যাশবাক্স ব্যালেন্স'],
      ['মোট নগদ ও ব্যাংক তারল্য', totalCashAndBankBalance, 'সর্বমোট নগদ ও ব্যাংক তহবিল'],
      ['গ্রাহকদের নিকট মোট বকেয়া পাওনা', totalReceivableDues, `${safeCustomers.filter(c => c.currentDue > 0).length} জন গ্রাহক`],
      ['সরবরাহকারীদের মোট দেনা', totalPayableDues, `${safeSuppliers.filter(s => s.currentPayable > 0).length} জন সরবরাহকারী`],
      ['ইনভেন্টরি মজুদের বর্তমান বাজারমূল্য', totalStockValue, `${safeProducts.length} ধরণের খাদ্যপণ্য ও কাঁচামাল`],
    ];
    const wsKPI = XLSX.utils.aoa_to_sheet(kpiData);
    XLSX.utils.book_append_sheet(wb, wsKPI, 'সারসংক্ষেপ');

    // Sheet 2: Top & Least Selling Products
    const salesProductsData = [
      ['সর্বোচ্চ বিক্রিত পণ্যসমূহ'],
      ['ক্রমিক', 'পণ্য নাম', 'বিক্রিত পরিমাণ', 'মোট বিক্রয় রাজস্ব (টাকা)'],
      ...productAnalytics.topSelling.map((p, idx) => [idx + 1, p.name, `${p.unitsSold} ${p.unit}`, p.revenue]),
      [''],
      ['কম বিক্রিত পণ্যসমূহ'],
      ['ক্রমিক', 'পণ্য নাম', 'বিক্রিত পরিমাণ', 'বর্তমান গুদাম স্টক'],
      ...productAnalytics.leastSelling.map((p, idx) => [idx + 1, p.name, `${p.unitsSold} ${p.unit}`, `${p.currentStock} ${p.unit}`]),
    ];
    const wsSales = XLSX.utils.aoa_to_sheet(salesProductsData);
    XLSX.utils.book_append_sheet(wb, wsSales, 'পণ্য বিক্রয়');

    // Sheet 3: Product Profitability
    const profitData = [
      ['সর্বোচ্চ লাভজনক পণ্যসমূহ'],
      ['ক্রমিক', 'পণ্য নাম', 'বিক্রয় রাজস্ব', 'উৎপাদন/ক্রয় ব্যয়', 'মোট লাভ (টাকা)', 'মার্জিন %'],
      ...productAnalytics.mostProfitable.map((p, idx) => [
        idx + 1,
        p.name,
        p.revenue,
        p.cogs,
        p.profit,
        `${p.margin.toFixed(1)}%`,
      ]),
      [''],
      ['কম লাভজনক পণ্যসমূহ'],
      ['ক্রমিক', 'পণ্য নাম', 'বিক্রয় রাজস্ব', 'উৎপাদন/ক্রয় ব্যয়', 'মোট লাভ (টাকা)', 'মার্জিন %'],
      ...productAnalytics.leastProfitable.map((p, idx) => [
        idx + 1,
        p.name,
        p.revenue,
        p.cogs,
        p.profit,
        `${p.margin.toFixed(1)}%`,
      ]),
    ];
    const wsProfit = XLSX.utils.aoa_to_sheet(profitData);
    XLSX.utils.book_append_sheet(wb, wsProfit, 'পণ্য মুনাফা');

    // Sheet 4: Party-wise Due List
    const duesData = [
      ['গ্রাহক ও সরবরাহকারীদের দেনা-পাওনা বিবরণী'],
      ['ক্রমিক', 'পার্টির নাম', 'ধরন', 'মোবাইল নম্বর', 'ঠিকানা', 'বকেয়ার পরিমাণ (টাকা)'],
      ...partyDueList.map((party, idx) => [
        idx + 1,
        party.name,
        party.type === 'CUSTOMER' ? 'গ্রাহকের নিকট পাওনা' : 'সরবরাহকারীর নিকট দেনা',
        party.phone || '-',
        party.address || '-',
        party.dueAmount,
      ]),
    ];
    const wsDues = XLSX.utils.aoa_to_sheet(duesData);
    XLSX.utils.book_append_sheet(wb, wsDues, 'বকেয়া হিসাব');

    // Write file
    const dateStamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Food_ERP_Dashboard_Report_${dateStamp}.xlsx`);
  };


  // 5. CSV Export Functionality (Dashboard KPI Summary)
  const handleExportCSV = () => {
    const wb = XLSX.utils.book_new();
    const dateStamp = new Date().toISOString().slice(0, 10);
    
    const kpiData = [
      ['কোম্পানির নাম', settings.companyNameBangla || 'ফুড ইআরপি সিস্টেম'],
      ['রিপোর্টের ধরন', 'ড্যাশবোর্ড প্রধান আর্থিক ও পরিচালনা সারসংক্ষেপ'],
      ['তারিখ', dateStamp],
      [''],
      ['প্রধান সূচক (মেট্রিক্স)', 'পরিমাণ (টাকা)', 'মন্তব্য'],
      ['মোট ব্যাংক জমা', totalBankBalance, `${safeBankAccounts.length} টি অ্যাকাউন্ট`],
      ['আজকের মোট বিক্রয়', dynamicTodaySales, `${todaySalesCount} টি ইনভয়েস`],
      ['অপেক্ষমাণ অর্ডার', pendingOrdersCount, `মোট মূল্য: ${pendingOrdersValue}`],
      ['সর্বমোট সম্পদ', totalAssetsValue, `চলতি: ${totalCurrentAssets}, স্থায়ী: ${totalFixedAssets}`],
      ['সর্বমোট বিক্রয়', overallSalesTotal, `মোট ইনভয়েস: ${safeSales.length} টি`],
      ['সর্বমোট ক্রয়', overallPurchaseTotal, `মোট বিল: ${safePurchases.length} টি`],
      ['আজকের মোট ক্রয়', todayPurchaseTotal, 'সাপ্লায়ার বিল'],
      ['মোট নিট লাভ', pnl.netProfit, `${pnl.profitMarginPercent.toFixed(1)}% মার্জিন`],
      ['মোট নিট ক্ষতি', totalLossAmount, isLoss ? 'ক্ষতি' : 'কোনো নিট ক্ষতি নেই'],
      ['মোট গ্রস প্রফিট', pnl.grossProfit, 'বিক্রয় - উৎপাদিত পণ্যের ব্যয়'],
      ['মোট পরিচালন খরচ', pnl.totalOperatingExpenses, 'দৈনন্দিন, বেতন ও ইউটিলিটি'],
      ['হাতে নগদ ক্যাশ', cashInHand, 'ক্যাশ বক্সের ব্যালেন্স'],
      ['মোট নগদ ও ব্যাংক তারল্য', totalCashAndBankBalance, 'সর্বমোট লিকুইডিটি'],
      ['গ্রাহকদের নিকট মোট বকেয়া পাওনা', totalReceivableDues, `${safeCustomers.filter(c => c.currentDue > 0).length} জন গ্রাহক`],
      ['সাপ্লায়ারদের মোট দেনা বা পাওনাদার', totalPayableDues, `${safeSuppliers.filter(s => s.currentPayable > 0).length} জন সরবরাহকারী`],
      ['ইনভেন্টরি মজুদের বর্তমান বাজারমূল্য', totalStockValue, `${safeProducts.length} টি পণ্য`],
    ];
    
    const wsKPI = XLSX.utils.aoa_to_sheet(kpiData);
    XLSX.utils.book_append_sheet(wb, wsKPI, 'Summary');
    
    XLSX.writeFile(wb, `Food_ERP_Dashboard_Report_${dateStamp}.csv`, { bookType: 'csv' });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* PRINT-ONLY COMPANY LETTERHEAD & REPORT HEADER */}
      <div className="hidden print-only p-4 border-b-2 border-slate-900 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            {settings.logoUrl && (
              <img
                src={settings.logoUrl}
                alt="Logo"
                referrerPolicy="no-referrer"
                className="w-12 h-12 object-contain rounded border border-slate-300 p-0.5"
              />
            )}
            <div>
              <h1 className="text-2xl font-black text-slate-950">
                {settings.companyNameBangla || 'ফুড ইআরপি সিস্টেম'}
              </h1>
              <p className="text-xs text-slate-600">
                {settings.companyNameEnglish || 'Food ERP System'} | {settings.address || ''}
              </p>
              <p className="text-xs text-slate-600">
                ফোন: {settings.phone || ''} | ইমেইল: {settings.email || ''}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold uppercase text-slate-900">ড্যাশবোর্ড মাস্টার রিপোর্ট</div>
            <div className="text-xs text-slate-600">তারিখ: {new Date().toLocaleDateString('bn-BD')}</div>
            <div className="text-xs text-slate-500">সময়: {new Date().toLocaleTimeString('bn-BD')}</div>
          </div>
        </div>
      </div>

      {/* TOP HEADER TOOLBAR: Title, Live Status, Auto-Refresh & Print/PDF/Excel Export Options */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs no-print">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              এক্সিকিউটিভ মাস্টার ড্যাশবোর্ড
            </h2>
            <span className="px-2 py-0.5 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 text-[10px] font-bold rounded-full border border-teal-200 dark:border-teal-800">
              লাইভ অটো ক্যালকুলেটেড
            </span>
            {refreshInterval > 0 && !isPaused && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold rounded-full border border-emerald-200 dark:border-emerald-800/60">
                <Clock className="w-3 h-3 text-emerald-600" />
                অটো-রিফ্রেশ: {countdown}s
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            প্রতিটি সেলস ইনভয়েস, পারচেজ বিল, প্রোডাকশন ও লেজার ট্রানজেকশনের সাথে রিয়েল-টাইম সিঙ্ক • সর্বশেষ আপডেট: <span className="font-semibold text-slate-700 dark:text-slate-300">{lastRefreshedAt.toLocaleTimeString('bn-BD')}</span>
          </p>
        </div>

        {/* Export & Quick Actions Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Manual Refresh Button */}
          <button
            id="btn-top-refresh"
            onClick={handleTriggerRefresh}
            disabled={isRefreshing}
            title="এখনই ড্যাশবোর্ড ডেটা রিফ্রেশ করুন"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-teal-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'আপডেট হচ্ছে...' : 'রিফ্রেশ'}</span>
          </button>

          {/* Print Button */}
          <button
            id="btn-dashboard-print"
            onClick={handlePrint}
            title="ড্যাশবোর্ড রিপোর্ট সরাসরি প্রিন্ট করুন"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
          >
            <Printer className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span>প্রিন্ট</span>
          </button>

          {/* CSV Export Button */}
          <button
            id="btn-dashboard-csv"
            onClick={handleExportCSV}
            title="সকল ডেটা CSV ফাইলে ডাউনলোড করুন"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
          >
            <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span>CSV</span>
          </button>

          {/* PDF Download Button */}
          <button
            id="btn-dashboard-pdf"
            onClick={handlePrint}
            title="পিডিএফ রিপোর্ট সংরক্ষণ করুন"
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 text-rose-800 dark:text-rose-300 font-bold text-xs rounded-xl border border-rose-200 dark:border-rose-900 transition-colors shadow-2xs"
          >
            <Download className="w-4 h-4 text-rose-600" />
            <span>PDF রিপোর্ট</span>
          </button>

          {/* Excel (XLSX) Export Button */}
          <button
            id="btn-dashboard-excel"
            onClick={handleExportExcel}
            title="সকল ডেটা এক্সেল ফাইলে (XLSX) ডাউনলোড করুন"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel এক্সপোর্ট</span>
          </button>
        </div>
      </div>

      <DailySummaryWidget />

      {/* RECENT TRANSACTIONS & TASKS WIDGET */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs page-break-inside-avoid">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
              সাম্প্রতিক লেনদেন
            </h3>
          </div>
          
          {/* Global Search and Filter Bar for Transactions */}
          <div className="flex items-center gap-2 w-full sm:w-auto no-print">
            <div className="relative flex-1 sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="পার্টি, ইনভয়েস বা তারিখ খুঁজুন..."
                value={txSearchQuery}
                onChange={(e) => setTxSearchQuery(e.target.value)}
                className="block w-full pl-9 pr-3 py-1.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>
            
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <button
                onClick={() => setTxTypeFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  txTypeFilter === 'ALL'
                    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                সকল
              </button>
              <button
                onClick={() => setTxTypeFilter('SALE')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  txTypeFilter === 'SALE'
                    ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 shadow-2xs border border-teal-200 dark:border-teal-800/50'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                বিক্রয়
              </button>
              <button
                onClick={() => setTxTypeFilter('PURCHASE')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  txTypeFilter === 'PURCHASE'
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-2xs border border-blue-200 dark:border-blue-800/50'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                ক্রয়
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-y border-slate-200 dark:border-slate-700">
                <th className="py-3 px-4 font-bold">তারিখ</th>
                <th className="py-3 px-4 font-bold">ধরন</th>
                <th className="py-3 px-4 font-bold">ইনভয়েস বা বিল নং</th>
                <th className="py-3 px-4 font-bold">গ্রাহক বা সরবরাহকারী</th>
                <th className="py-3 px-4 text-right font-bold">পরিমাণ</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((tx, idx) => (
                <tr key={`${tx.type}-${tx.id}-${idx}`} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-medium">{new Date(tx.date).toLocaleDateString('bn-BD')}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold ${
                      tx.type === 'SALE' 
                        ? 'bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800/50' 
                        : 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50'
                    }`}>
                      {tx.type === 'SALE' ? 'বিক্রয়' : 'ক্রয়'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{tx.invoiceNo}</td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{tx.partyName}</td>
                  <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">{formatCurrency(tx.amount)}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => toggleTransactionVisualStatus(tx.id, tx.type)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all shadow-sm hover:shadow-md active:scale-95 ${
                        tx.visualStatus === 'PAID' 
                          ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border border-teal-200 dark:border-teal-800'
                          : tx.visualStatus === 'OVERDUE'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                      }`}
                    >
                      {tx.visualStatus === 'PAID' ? 'পরিশোধিত' : tx.visualStatus === 'OVERDUE' ? 'মেয়াদোত্তীর্ণ' : 'অপেক্ষমাণ'}
                    </button>
                  </td>
                </tr>
              ))}
              {recentTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 dark:text-slate-400">কোনো লেনদেন পাওয়া যায়নি</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* TASKS & REMINDERS WIDGET */}
      <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs page-break-inside-avoid flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
              জরুরি টাস্ক ও রিমাইন্ডার
            </h3>
          </div>
          <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {tasksAndReminders.length}টি অপেক্ষমাণ
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          {tasksAndReminders.length > 0 ? (
            tasksAndReminders.map(task => (
              <div key={task.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex gap-3 hover:shadow-sm transition-all">
                <div className="shrink-0 mt-0.5">
                  {task.type === 'PAYMENT' ? (
                    <AlertCircle className={`w-4 h-4 ${task.priority === 'HIGH' ? 'text-rose-500' : 'text-amber-500'}`} />
                  ) : task.type === 'FOLLOW_UP' ? (
                    <Calendar className="w-4 h-4 text-purple-600" />
                  ) : (
                    <Boxes className="w-4 h-4 text-indigo-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight mb-1">
                    {task.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {task.description}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-mono">
                    {new Date(task.date).toLocaleDateString('bn-BD')}
                  </p>
                </div>
                {task.isSystemTask && (
                  <button
                    onClick={() => updateSystemTask(task.id, { status: 'COMPLETED' })}
                    className="self-center p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-slate-400 hover:text-emerald-600 rounded-lg text-xs transition-colors shrink-0"
                    title="সম্পন্ন হিসেবে চিহ্নিত করুন"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 py-10">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 opacity-50" />
              <p className="text-xs">কোনো পেন্ডিং টাস্ক নেই!</p>
            </div>
          )}
        </div>
      </div>
    </div>


      {/* ========================================================================= */}
      {/* CURRENT MONTH TOTAL SALES VS. TOTAL EXPENSES (RECHARTS BAR CHART SECTION) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs mb-6 page-break-inside-avoid">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="p-2 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 rounded-xl border border-teal-200 dark:border-teal-800">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                চলতি মাসের বিক্রয় বনাম মোট ব্যয় (Current Month: Sales vs. Expenses)
              </h3>
              <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-full border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {currentMonthAnalytics.monthNameBn} ({currentMonthAnalytics.monthNameEn})
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              চলতি মাসের সর্বমোট বিক্রয় আয় এবং সকল ব্যবসায়িক খরচের (ক্রয়, দৈনিক খরচ, বেতন, ইউটিলিটি) রিয়েল-টাইম তুলনামূলক বার চার্ট
            </p>
          </div>

          {/* View Mode Toggle Controls */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs self-start md:self-auto no-print">
            <button
              type="button"
              onClick={() => setMonthChartView('OVERALL')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                monthChartView === 'OVERALL'
                  ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>সর্বমোট তুলনা</span>
            </button>
            <button
              type="button"
              onClick={() => setMonthChartView('WEEKLY')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                monthChartView === 'WEEKLY'
                  ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>সাপ্তাহিক বিভাজন</span>
            </button>
            <button
              type="button"
              onClick={() => setMonthChartView('DAILY')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                monthChartView === 'DAILY'
                  ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>দৈনিক ট্র্যাকার</span>
            </button>
          </div>
        </div>

        {/* Current Month High-Level KPI Summary Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 my-4">
          {/* Card 1: Total Sales */}
          <div className="p-3.5 bg-gradient-to-br from-teal-50 to-emerald-50/40 dark:from-teal-950/40 dark:to-emerald-950/20 rounded-xl border border-teal-200 dark:border-teal-800/60 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-800 dark:text-teal-300">চলতি মাসের মোট বিক্রয়</span>
              <span className="p-1 bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 rounded-md">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-xl font-black text-teal-950 dark:text-teal-200 font-mono mt-1">
              {formatCurrency(currentMonthAnalytics.totalMonthSales)}
            </div>
            <div className="text-[11px] text-teal-700 dark:text-teal-400 mt-1 flex items-center justify-between">
              <span>মোট ইনভয়েস: {toBengaliNumber(currentMonthAnalytics.totalMonthSalesOrders)} টি</span>
              <span className="font-semibold">১০০% বেঞ্চমার্ক</span>
            </div>
          </div>

          {/* Card 2: Total Expenses */}
          <div className="p-3.5 bg-gradient-to-br from-rose-50 to-red-50/40 dark:from-rose-950/40 dark:to-red-950/20 rounded-xl border border-rose-200 dark:border-rose-800/60 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-800 dark:text-rose-300">চলতি মাসের মোট ব্যয়</span>
              <span className="p-1 bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 rounded-md">
                <ArrowDownRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-xl font-black text-rose-950 dark:text-rose-200 font-mono mt-1">
              {formatCurrency(currentMonthAnalytics.totalMonthExpenses)}
            </div>
            <div className="text-[11px] text-rose-700 dark:text-rose-400 mt-1 flex items-center justify-between">
              <span>বিক্রয়ের বিপরীতে ব্যয়:</span>
              <span className="font-bold">{currentMonthAnalytics.expenseRatio.toFixed(1)}%</span>
            </div>
          </div>

          {/* Card 3: Net Profit / Loss */}
          <div className={`p-3.5 rounded-xl border shadow-2xs ${
            currentMonthAnalytics.netProfitOrLoss >= 0
              ? 'bg-gradient-to-br from-sky-50 to-blue-50/40 dark:from-sky-950/40 dark:to-blue-950/20 border-sky-200 dark:border-sky-800/60'
              : 'bg-gradient-to-br from-amber-50 to-orange-50/40 dark:from-amber-950/40 dark:to-orange-950/20 border-amber-200 dark:border-amber-800/60'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold ${
                currentMonthAnalytics.netProfitOrLoss >= 0 ? 'text-sky-800 dark:text-sky-300' : 'text-amber-800 dark:text-amber-300'
              }`}>
                {currentMonthAnalytics.netProfitOrLoss >= 0 ? 'নিট উদ্বৃত্ত বা লাভ' : 'নিট ঘাটতি বা লোকসান'}
              </span>
              <span className={`p-1 rounded-md ${
                currentMonthAnalytics.netProfitOrLoss >= 0 
                  ? 'bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300' 
                  : 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300'
              }`}>
                {currentMonthAnalytics.netProfitOrLoss >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              </span>
            </div>
            <div className={`text-xl font-black font-mono mt-1 ${
              currentMonthAnalytics.netProfitOrLoss >= 0 ? 'text-sky-950 dark:text-sky-200' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {formatCurrency(Math.abs(currentMonthAnalytics.netProfitOrLoss))}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
              <span>মুনাফা মার্জিন:</span>
              <span className="font-bold">{currentMonthAnalytics.profitMargin.toFixed(1)}%</span>
            </div>
          </div>

          {/* Card 4: Expense Breakdown Highlights */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">ব্যয় সংক্রান্ত বিভাজন</span>
            <div className="space-y-1 mt-1 text-[11px]">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>কাঁচামাল/ক্রয়:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-200">{formatCurrency(currentMonthAnalytics.currentMonthPurchases)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>পরিচালন ও ইউটিলিটি:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-200">{formatCurrency(currentMonthAnalytics.currentMonthGenExpenses + currentMonthAnalytics.currentMonthUtilities)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>বেতন ও অন্যান্য:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-200">{formatCurrency(currentMonthAnalytics.currentMonthSalaries + currentMonthAnalytics.currentMonthWastage)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recharts Bar Chart Container */}
        <div className="w-full h-72 sm:h-88 mt-3 pt-2 select-none">
          <ResponsiveContainer width="100%" height="100%">
            {monthChartView === 'OVERALL' ? (
              /* 1. OVERALL AGGREGATE TOTALS BAR CHART */
              <BarChart
                data={currentMonthAnalytics.overallComparisonData}
                margin={{ top: 20, right: 30, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e2e4f' : '#e2e8f0'} />
                <XAxis
                  dataKey="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fontWeight: 600, fill: theme === 'dark' ? '#cbd5e1' : '#334155' }}
                  dy={12}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: theme === 'dark' ? '#94a3b8' : '#64748b' }}
                  tickFormatter={(val) => val >= 100000 ? `${(val / 100000).toFixed(1)}L` : val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                />
                <Tooltip
                  cursor={{ fill: theme === 'dark' ? '#1e293b' : '#f1f5f9' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1">
                          <p className="font-bold text-slate-200 border-b border-slate-700 pb-1">{item.category}</p>
                          <p className="text-slate-400 text-[11px]">{item.categoryEn}</p>
                          <p className="font-mono text-base font-bold text-teal-400">{formatCurrency(item.amount)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]} maxBarSize={90}>
                  {currentMonthAnalytics.overallComparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            ) : monthChartView === 'WEEKLY' ? (
              /* 2. WEEKLY BREAKDOWN COMPARISON BAR CHART */
              <BarChart
                data={currentMonthAnalytics.weeklyData}
                margin={{ top: 20, right: 30, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e2e4f' : '#e2e8f0'} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fontWeight: 600, fill: theme === 'dark' ? '#cbd5e1' : '#334155' }}
                  dy={12}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: theme === 'dark' ? '#94a3b8' : '#64748b' }}
                  tickFormatter={(val) => val >= 100000 ? `${(val / 100000).toFixed(1)}L` : val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                />
                <Tooltip
                  cursor={{ fill: theme === 'dark' ? '#1e293b' : '#f1f5f9' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const diff = data.sales - data.expenses;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs min-w-44 space-y-1.5">
                          <div className="font-bold text-slate-200 border-b border-slate-700 pb-1 flex justify-between items-center">
                            <span>{data.name}</span>
                            <span className="text-[10px] text-slate-400">{data.range}</span>
                          </div>
                          <div className="flex justify-between font-mono">
                            <span className="text-teal-400 font-bold">বিক্রয়:</span>
                            <span className="font-bold">{formatCurrency(data.sales)}</span>
                          </div>
                          <div className="flex justify-between font-mono">
                            <span className="text-rose-400 font-bold">ব্যয়:</span>
                            <span className="font-bold">{formatCurrency(data.expenses)}</span>
                          </div>
                          <div className="flex justify-between font-mono border-t border-slate-800 pt-1 text-[11px]">
                            <span className="text-slate-300">নিট ব্যবধান:</span>
                            <span className={`font-bold ${diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: 15, fontSize: '12px' }}
                  iconType="circle"
                />
                <Bar
                  name="মোট বিক্রয়"
                  dataKey="sales"
                  fill={theme === 'dark' ? '#14b8a6' : '#0d9488'}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={45}
                />
                <Bar
                  name="মোট ব্যয়"
                  dataKey="expenses"
                  fill={theme === 'dark' ? '#fb7185' : '#e11d48'}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={45}
                />
              </BarChart>
            ) : (
              /* 3. DAILY TRACKER PROGRESSION BAR CHART */
              <BarChart
                data={currentMonthAnalytics.dailyData}
                margin={{ top: 20, right: 30, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e2e4f' : '#e2e8f0'} />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: theme === 'dark' ? '#94a3b8' : '#64748b' }}
                  dy={12}
                  interval="preserveStartEnd"
                  minTickGap={20}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: theme === 'dark' ? '#94a3b8' : '#64748b' }}
                  tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                />
                <Tooltip
                  cursor={{ fill: theme === 'dark' ? '#1e293b' : '#f1f5f9' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const diff = data.sales - data.expenses;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs min-w-44 space-y-1.5">
                          <div className="font-bold text-slate-200 border-b border-slate-700 pb-1">
                            {data.label} ({data.date})
                          </div>
                          <div className="flex justify-between font-mono">
                            <span className="text-teal-400 font-bold">বিক্রয়:</span>
                            <span className="font-bold">{formatCurrency(data.sales)}</span>
                          </div>
                          <div className="flex justify-between font-mono">
                            <span className="text-rose-400 font-bold">ব্যয়:</span>
                            <span className="font-bold">{formatCurrency(data.expenses)}</span>
                          </div>
                          <div className="flex justify-between font-mono border-t border-slate-800 pt-1 text-[11px]">
                            <span className="text-slate-300">উদ্বৃত্ত:</span>
                            <span className={`font-bold ${diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: 15, fontSize: '12px' }}
                  iconType="circle"
                />
                <Bar
                  name="দৈনিক বিক্রয়"
                  dataKey="sales"
                  fill={theme === 'dark' ? '#14b8a6' : '#0d9488'}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  name="দৈনিক ব্যয়"
                  dataKey="expenses"
                  fill={theme === 'dark' ? '#fb7185' : '#e11d48'}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>


      {/* TOP SECTION: SALES & PURCHASE TREND CHART (PROMINENT FULL-WIDTH GRAPH) */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs page-break-inside-avoid">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-600" />
              <h3 className="font-bold text-slate-900 text-base">
                বিক্রয় ও ক্রয়ের তুলনামূলক ট্রেন্ড বিশ্লেষণ
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              গত {trendDays} দিনের দৈনিক বিক্রয় রেভিনিউ ও পারচেজ খরচের সামগ্রিক গ্রাফ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 no-print">
            {/* Chart Type Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setChartType('line')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
                  chartType === 'line'
                    ? 'bg-white text-teal-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LineChartIcon className="w-3.5 h-3.5" />
                <span>লাইন চার্ট</span>
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
                  chartType === 'bar'
                    ? 'bg-white text-teal-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>বার চার্ট</span>
              </button>
            </div>

            {/* Date Range Selector */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setTrendDays(7)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  trendDays === 7 ? 'bg-white text-teal-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ৭ দিন
              </button>
              <button
                onClick={() => setTrendDays(14)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  trendDays === 14 ? 'bg-white text-teal-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ১৪ দিন
              </button>
              <button
                onClick={() => setTrendDays(30)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  trendDays === 30 ? 'bg-white text-teal-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ৩০ দিন
              </button>
            </div>
          </div>
        </div>

        {/* Quick Summary Pill Strip above Chart */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100">
            <span className="text-[11px] font-bold text-teal-800 uppercase">নির্দিষ্ট সময়ের মোট বিক্রয়</span>
            <div className="text-base sm:text-lg font-black text-teal-900 font-sans mt-0.5">
              {formatCurrency(totalTrendSales)}
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
            <span className="text-[11px] font-bold text-slate-600 uppercase">দৈনিক গড় বিক্রয়</span>
            <div className="text-base sm:text-lg font-black text-slate-800 font-sans mt-0.5">
              {formatCurrency(avgDailySales)}
            </div>
          </div>
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
            <span className="text-[11px] font-bold text-blue-800 uppercase">নির্দিষ্ট সময়ের মোট ক্রয়</span>
            <div className="text-base sm:text-lg font-black text-blue-900 font-sans mt-0.5">
              {formatCurrency(trendData.reduce((s, d) => s + d.purchases, 0))}
            </div>
          </div>
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <span className="text-[11px] font-bold text-emerald-800 uppercase">মোট ইনভয়েস সংখ্যা</span>
            <div className="text-base sm:text-lg font-black text-emerald-900 font-sans mt-0.5">
              {trendData.reduce((s, d) => s + d.count, 0)} টি
            </div>
          </div>
        </div>

        {/* Interactive Recharts Chart Rendering */}
        <div className="relative w-full h-64 sm:h-80 mt-3 select-none bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0d9488" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="purchaseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e2e4f' : '#e2e8f0'} />
                <XAxis 
                  dataKey="displayDate" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: theme === 'dark' ? '#94a3b8' : '#64748b' }} 
                  dy={10}
                  interval="preserveStartEnd"
                  minTickGap={30}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: theme === 'dark' ? '#94a3b8' : '#94a3b8' }} 
                  tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl border border-slate-700 text-xs w-48">
                          <div className="font-bold text-slate-300 border-b border-slate-800 pb-1 mb-1.5 flex justify-between">
                            <span>{data.displayDate}</span>
                            <span className="text-teal-400">{data.count} টি অর্ডার</span>
                          </div>
                          <div className="flex justify-between font-mono">
                            <span className="text-teal-400 font-bold">আয়/বিক্রয়:</span>
                            <span className="font-bold">{formatCurrency(data.sales)}</span>
                          </div>
                          <div className="flex justify-between font-mono mt-0.5">
                            <span className="text-blue-400 font-bold">ক্রয়:</span>
                            <span className="font-bold">{formatCurrency(data.purchases)}</span>
                          </div>
                          <div className="flex justify-between font-mono mt-0.5">
                            <span className="text-rose-400 font-bold">মোট ব্যয়:</span>
                            <span className="font-bold">{formatCurrency(data.expenses)}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                  cursor={{ stroke: theme === 'dark' ? '#334155' : '#e2e8f0', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line 
                  type="monotone" 
                  name="আয় বা বিক্রয়"
                  dataKey="sales" 
                  stroke={theme === 'dark' ? '#2dd4bf' : '#0d9488'} 
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: theme === 'dark' ? '#10192d' : '#ffffff' }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  name="পণ্য ক্রয়"
                  dataKey="purchases" 
                  stroke={theme === 'dark' ? '#38bdf8' : '#60a5fa'} 
                  strokeWidth={2.5}
                  dot={{ r: 4, strokeWidth: 2, fill: theme === 'dark' ? '#10192d' : '#ffffff' }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  name="মোট পরিচালন ও অন্যান্য ব্যয়"
                  dataKey="expenses" 
                  stroke={theme === 'dark' ? '#fb7185' : '#e11d48'} 
                  strokeWidth={2.5}
                  dot={{ r: 4, strokeWidth: 2, fill: theme === 'dark' ? '#10192d' : '#ffffff' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            ) : (
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e2e4f' : '#e2e8f0'} />
                <XAxis 
                  dataKey="displayDate" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: theme === 'dark' ? '#94a3b8' : '#64748b' }} 
                  dy={10}
                  interval="preserveStartEnd"
                  minTickGap={30}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: theme === 'dark' ? '#94a3b8' : '#94a3b8' }} 
                  tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl border border-slate-700 text-xs w-48">
                          <div className="font-bold text-slate-300 border-b border-slate-800 pb-1 mb-1.5 flex justify-between">
                            <span>{data.displayDate}</span>
                            <span className="text-teal-400">{data.count} টি অর্ডার</span>
                          </div>
                          <div className="flex justify-between font-mono">
                            <span className="text-teal-400 font-bold">আয়/বিক্রয়:</span>
                            <span className="font-bold">{formatCurrency(data.sales)}</span>
                          </div>
                          <div className="flex justify-between font-mono mt-0.5">
                            <span className="text-blue-400 font-bold">ক্রয়:</span>
                            <span className="font-bold">{formatCurrency(data.purchases)}</span>
                          </div>
                          <div className="flex justify-between font-mono mt-0.5">
                            <span className="text-rose-400 font-bold">মোট ব্যয়:</span>
                            <span className="font-bold">{formatCurrency(data.expenses)}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                  cursor={{ fill: theme === 'dark' ? '#1e293b' : '#f1f5f9' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar name="মোট ব্যয়" dataKey="expenses" fill={theme === 'dark' ? '#fb7185' : '#fda4af'} radius={[2, 2, 0, 0]} />
                <Bar name="পণ্য ক্রয়" dataKey="purchases" fill={theme === 'dark' ? '#38bdf8' : '#93c5fd'} radius={[2, 2, 0, 0]} />
                <Bar name="আয় বা বিক্রয়" dataKey="sales" fill={theme === 'dark' ? '#2dd4bf' : '#0d9488'} radius={[2, 2, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* DYNAMIC KPI CARDS SECTION (WITH AUTO-REFRESH INTERVALS) */}
      <div className="space-y-4 page-break-inside-avoid">
        {/* KPI Section Control Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Layers className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                ডায়নামিক ব্যবসায়িক নির্দেশক
              </h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 text-[11px] font-bold rounded-full border border-teal-200 dark:border-teal-800">
                <Sparkles className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                অটো-রিফ্রেশ সিঙ্ক
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              সর্বশেষ আপডেট: <span className="font-semibold text-slate-700 dark:text-slate-300">{lastRefreshedAt.toLocaleTimeString('bn-BD')}</span>
              {refreshInterval > 0 && !isPaused && (
                <span className="ml-2 text-teal-600 dark:text-teal-400 font-medium">
                  (পরবর্তী অটো-আপডেট: <strong className="font-mono">{countdown}</strong> সেকেন্ডে)
                </span>
              )}
            </p>
          </div>

          {/* Quick Auto-Refresh Control Bar */}
          <div className="flex flex-wrap items-center gap-2 no-print">
            {/* Interval Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <Clock className="w-3.5 h-3.5 text-slate-500 ml-1" />
              <span className="text-slate-600 dark:text-slate-400 text-[11px] font-medium hidden md:inline">ব্যবধান:</span>
              <select
                id="select-auto-refresh-interval"
                value={refreshInterval}
                onChange={(e) => handleIntervalChange(Number(e.target.value))}
                className="bg-transparent border-0 text-slate-800 dark:text-slate-200 font-semibold text-xs py-0.5 px-1 focus:ring-0 cursor-pointer"
                title="অটো-রিফ্রেশ সময় ব্যবধান নির্বাচন করুন"
              >
                {REFRESH_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Pause / Resume Button (Only if interval > 0) */}
            {refreshInterval > 0 && (
              <button
                id="btn-auto-refresh-pause-play"
                onClick={() => setIsPaused(prev => !prev)}
                title={isPaused ? "অটো-রিফ্রেশ পুনরায় চালু করুন" : "অটো-রিফ্রেশ সাময়িক থামান"}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-2xs ${
                  isPaused
                    ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {isPaused ? <Play className="w-3.5 h-3.5 text-amber-600 fill-amber-600" /> : <Pause className="w-3.5 h-3.5 text-slate-600" />}
                <span className="text-[11px]">{isPaused ? 'চালু করুন' : 'পজ'}</span>
              </button>
            )}

            {/* Manual Refresh Now Button */}
            <button
              id="btn-dashboard-refresh-now"
              onClick={handleTriggerRefresh}
              disabled={isRefreshing}
              title="এখনই ড্যাশবোর্ড ডেটা রিফ্রেশ করুন"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all disabled:opacity-75"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'রিফ্রেশ হচ্ছে...' : 'রিফ্রেশ'}</span>
            </button>
          </div>
        </div>


        {/* DASHBOARD NOTIFICATION SYSTEM: LOW STOCK ALERTS */}
        {lowStockCount > 0 && (
          <div className="mb-6 bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-950/40 dark:to-orange-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 shadow-sm relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10 pointer-events-none">
              <AlertTriangle className="w-32 h-32 text-rose-600" />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                  </span>
                  <h3 className="text-rose-800 dark:text-rose-300 font-black text-sm uppercase tracking-wide">
                    জরুরি পণ্য ক্রয় সংক্রান্ত সতর্কবার্তা
                  </h3>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-sm font-medium mb-3">
                  আপনার ইনভেন্টরিতে <span className="font-black text-rose-600 dark:text-rose-400 text-base">{lowStockCount}টি</span> পণ্য সর্বনিম্ন মজুদের নিচে নেমে এসেছে। নিরবচ্ছিন্ন উৎপাদন ও বিক্রি চালু রাখতে এখনই এগুলো রি-অর্ডার করুন।
                </p>
                
                <div className="flex flex-wrap gap-2 mb-2 md:mb-0">
                  {lowStockProducts.slice(0, 5).map(p => (
                    <div key={p.id} className="bg-white/80 dark:bg-slate-900/80 border border-rose-100 dark:border-rose-800 rounded-lg px-2.5 py-1.5 text-xs flex items-center gap-2 shadow-sm">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{p.nameBangla}</span>
                      <span className="bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 px-1.5 py-0.5 rounded font-mono font-bold">
                        {p.currentStock} {p.unit}
                      </span>
                    </div>
                  ))}
                  {lowStockCount > 5 && (
                    <div className="bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs flex items-center shadow-sm text-slate-600 dark:text-slate-400 font-bold">
                      +{lowStockCount - 5} আরও
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex-shrink-0 md:pl-5 md:border-l md:border-rose-200/60 dark:md:border-rose-800/60 flex flex-col items-center justify-center min-w-[220px]">
                <button
                  onClick={() => setShowRequisitionModal(true)}
                  className="w-full group flex items-center justify-center gap-2 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                >
                  <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  ১-ক্লিক রিকুইজিশন
                </button>
                <button 
                  onClick={() => setActiveModule('INVENTORY')}
                  className="mt-3 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 underline underline-offset-2 transition-colors"
                >
                  ইনভেন্টরি স্টক যাচাই করুন →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ROW 1: THE 4 DYNAMIC PRIMARY KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Cash at Bank (ব্যাংক ব্যালেন্স) */}
          <div
            id="kpi-cash-at-bank"
            onClick={() => setActiveModule('CASH_BANK')}
            className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border transition-all cursor-pointer group select-none relative overflow-hidden shadow-xs hover:shadow-md ${
              isRefreshing
                ? 'border-indigo-400 ring-2 ring-indigo-400/40'
                : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  ব্যাংক ব্যালেন্স
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-400">
                    {safeBankAccounts.length} টি সক্রিয় ব্যাংক হিসাব
                  </span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Building className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-sans tracking-tight">
                {formatCurrency(totalBankBalance)}
              </div>
              <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-slate-500 dark:text-slate-400">নগদ + ব্যাংক তহবিল:</span>
                <span className="font-bold text-indigo-700 dark:text-indigo-400 font-mono">
                  {formatCurrency(totalCashAndBankBalance)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                <span>হাতে নগদ: {formatCurrency(cashInHand)}</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold group-hover:underline flex items-center gap-0.5">
                  ব্যাংক মডিউল →
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Today's Sales (আজকের বিক্রয়) */}
          <div
            id="kpi-todays-sales"
            onClick={() => setActiveModule('SALES')}
            className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border transition-all cursor-pointer group select-none relative overflow-hidden shadow-xs hover:shadow-md ${
              isRefreshing
                ? 'border-emerald-400 ring-2 ring-emerald-400/40'
                : 'border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  আজকের মোট বিক্রয়
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    {todaySalesCount} টি ইনভয়েস ইস্যু
                  </span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <ShoppingCart className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-sans tracking-tight">
                {formatCurrency(dynamicTodaySales)}
              </div>
              <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-slate-500 dark:text-slate-400">নগদ আদায়:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                  {formatCurrency(todayCashCollected)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                <span>বকেয়া চালান: {formatCurrency(todayDueAmount)}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold group-hover:underline flex items-center gap-0.5">
                  সেলস মডিউল →
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Pending Orders (অপেক্ষমান অর্ডার) */}
          <div
            id="kpi-pending-orders"
            onClick={() => setActiveModule('SALES')}
            className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border transition-all cursor-pointer group select-none relative overflow-hidden shadow-xs hover:shadow-md ${
              isRefreshing
                ? 'border-amber-400 ring-2 ring-amber-400/40'
                : isPendingOrdersAlert
                ? 'border-rose-400 dark:border-rose-600 ring-2 ring-rose-400/50 bg-rose-50/20 dark:bg-rose-950/20 shadow-rose-100 dark:shadow-none'
                : pendingOrdersCount > 0
                ? 'border-amber-200 dark:border-amber-900/60 hover:border-amber-400 dark:hover:border-amber-500'
                : 'border-slate-200 dark:border-slate-800 hover:border-teal-400'
            }`}
          >
            {/* Top Alert Banner if exceeds threshold */}
            {isPendingOrdersAlert && (
              <div className="absolute top-0 right-0 left-0 bg-rose-600 text-white text-[10px] font-bold py-0.5 px-3 flex items-center justify-between animate-pulse">
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  সতর্কতা: অপেক্ষমাণ অর্ডার &gt; {PENDING_ORDERS_ALERT_THRESHOLD}টি!
                </span>
                <span className="underline text-[9px]">ডেলিভারি দিন</span>
              </div>
            )}

            <div className={`flex items-center justify-between ${isPendingOrdersAlert ? 'mt-2' : ''}`}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    অপেক্ষমাণ অর্ডারসমূহ
                  </span>
                  {isPendingOrdersAlert && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 dark:bg-rose-900/80 dark:text-rose-200 border border-rose-300 dark:border-rose-700">
                      জরুরি
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`w-2 h-2 rounded-full ${isPendingOrdersAlert ? 'bg-rose-600 animate-ping' : pendingOrdersCount > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                  <span className={`text-[11px] font-semibold ${isPendingOrdersAlert ? 'text-rose-700 dark:text-rose-400 font-bold' : pendingOrdersCount > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                    {pendingOrdersCount > 0 ? `${pendingOrdersCount} টি ডেলিভারি অপেক্ষমান` : 'সকল অর্ডার সরবরাহকৃত'}
                  </span>
                </div>
              </div>
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors ${
                isPendingOrdersAlert
                  ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 group-hover:bg-rose-600 group-hover:text-white'
                  : pendingOrdersCount > 0
                  ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white'
                  : 'bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 group-hover:bg-teal-600 group-hover:text-white'
              }`}>
                <Package className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-sans tracking-tight flex items-baseline gap-2">
                <span>{pendingOrdersCount}</span>
                <span className="text-base font-bold text-slate-500 dark:text-slate-400">টি অর্ডার</span>
                {isPendingOrdersAlert && (
                  <span className="ml-auto text-xs font-bold text-rose-600 dark:text-rose-400 animate-pulse">
                    ⚠️ উচ্চ পেন্ডিং
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-slate-500 dark:text-slate-400">পেন্ডিং মোট মূল্য:</span>
                <span className={`font-bold font-mono ${isPendingOrdersAlert ? 'text-rose-700 dark:text-rose-400' : 'text-amber-700 dark:text-amber-400'}`}>
                  {formatCurrency(pendingOrdersValue)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                <span>নতুন: {pendingStep1Count} | পথে: {pendingStep2Count}</span>
                <span className={`${isPendingOrdersAlert ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-amber-600 dark:text-amber-400 font-semibold'} group-hover:underline flex items-center gap-0.5`}>
                  অর্ডার দেখুন →
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Total Assets (সার্বমোট সম্পদ) */}
          <div
            id="kpi-total-assets"
            onClick={() => setActiveModule('DEPARTMENT_ASSETS')}
            className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border transition-all cursor-pointer group select-none relative overflow-hidden shadow-xs hover:shadow-md ${
              isRefreshing
                ? 'border-purple-400 ring-2 ring-purple-400/40'
                : 'border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  সর্বমোট বাণিজ্যিক সম্পদ
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-400">
                    চলতি ও স্থায়ী বাণিজ্যিক মূলধন
                  </span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Landmark className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-sans tracking-tight">
                {formatCurrency(totalAssetsValue)}
              </div>
              <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-slate-500 dark:text-slate-400">চলতি সম্পদ:</span>
                <span className="font-bold text-purple-700 dark:text-purple-400 font-mono">
                  {formatCurrency(totalCurrentAssets)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                <span>স্থায়ী সম্পদ: {formatCurrency(totalFixedAssets)}</span>
                <span className="text-purple-600 dark:text-purple-400 font-semibold group-hover:underline flex items-center gap-0.5">
                  সম্পদ রেজিস্টার →
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 1.5: SYSTEM TASKS & NOTIFICATIONS SUMMARY */}
        {pendingSystemTasksCount > 0 && (
          <div 
            onClick={() => {
              const el = document.querySelector('.lucide-bell');
              if (el) {
                const btn = el.closest('button');
                if (btn) btn.click();
              }
            }}
            className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                <ListTodo className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">সিস্টেম টাস্ক ও কাজ পেন্ডিং রয়েছে</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">আপনার {pendingSystemTasksCount} টি কাজ বা অনুমোদন বাকি আছে।</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-sm font-bold">
              <span>দেখুন</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        )}

        {/* ROW 2: OVERALL OPERATIONAL & BALANCE HEALTH CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Sales (Overall) */}
          <div
            id="kpi-total-sales"
            onClick={() => setActiveModule('SALES')}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-teal-400 hover:shadow-sm transition-all cursor-pointer group select-none"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                সর্বমোট বিক্রয়
              </span>
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
                <ShoppingCart className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-sans">
                {formatCurrency(overallSalesTotal)}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-slate-500 dark:text-slate-400">মোট চালান:</span>
                <span className="font-bold text-teal-700 dark:text-teal-400 font-mono">{safeSales.length} টি</span>
              </div>
            </div>
          </div>

          {/* Total Purchase (Overall) */}
          <div
            id="kpi-total-purchase"
            onClick={() => setActiveModule('PURCHASE')}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer group select-none"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                সর্বমোট ক্রয়
              </span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Truck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-sans">
                {formatCurrency(overallPurchaseTotal)}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-slate-500 dark:text-slate-400">আজকের ক্রয়:</span>
                <span className="font-bold text-blue-700 dark:text-blue-400 font-mono">{formatCurrency(todayPurchaseTotal)}</span>
              </div>
            </div>
          </div>

          {/* Total Profit */}
          <div
            id="kpi-total-profit"
            onClick={() => setActiveModule('REPORTS_PNL')}
            className="bg-emerald-50/70 dark:bg-emerald-950/30 p-5 rounded-2xl border border-emerald-300 dark:border-emerald-800/80 shadow-xs hover:border-emerald-500 hover:shadow-sm transition-all cursor-pointer group select-none"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                মোট নিট লাভ
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-sans">
                {formatCurrency(totalProfitAmount)}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-emerald-200/80 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                <span>গ্রস: {formatCurrency(pnl.grossProfit)}</span>
                <span className="font-bold bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded text-[11px]">
                  {pnl.profitMarginPercent.toFixed(1)}% মার্জিন
                </span>
              </div>
            </div>
          </div>

          {/* Total Stock Value & Stock Alert */}
          <div
            id="kpi-stock-value"
            className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border transition-all group relative overflow-hidden shadow-xs hover:shadow-md ${
              isStockAlert
                ? 'border-rose-400 dark:border-rose-600 ring-2 ring-rose-400/50 bg-rose-50/20 dark:bg-rose-950/20 shadow-rose-100 dark:shadow-none'
                : lowStockCount > 0
                ? 'border-amber-300 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-950/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-amber-400 hover:shadow-sm'
            }`}
          >
            {/* Top Stock Alert Banner if threshold reached */}
            {isStockAlert && (
              <div className="absolute top-0 right-0 left-0 bg-rose-600 text-white text-[10px] font-bold py-0.5 px-3 flex items-center justify-between animate-pulse cursor-pointer" onClick={() => setActiveModule('INVENTORY')}>
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  স্টক সতর্কতা: {lowStockCount}টি খাদ্যের মজুত সংকটজনক!
                </span>
                <span className="underline text-[9px]">স্টক দেখুন</span>
              </div>
            )}

            <div className={`flex items-center justify-between ${isStockAlert ? 'mt-2' : ''} cursor-pointer`} onClick={() => setActiveModule('INVENTORY')}>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    ইনভেন্টরি মজুত মূল্য ও সতর্কতা
                  </span>
                  {lowStockCount > 0 ? (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      isStockAlert
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/80 dark:text-rose-200 border border-rose-300 dark:border-rose-700'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/80 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                    }`}>
                      {lowStockCount} সতর্ক
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      পর্যাপ্ত
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`w-2 h-2 rounded-full ${isStockAlert ? 'bg-rose-600 animate-ping' : lowStockCount > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                  <span className={`text-[11px] font-semibold ${isStockAlert ? 'text-rose-700 dark:text-rose-400 font-bold' : lowStockCount > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'}`}>
                    {lowStockCount > 0 ? `${lowStockCount}টি খাদ্যের মজুত শেষ পর্যায়ে` : 'সকল পণ্যের স্টক সন্তোষজনক'}
                  </span>
                </div>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                isStockAlert
                  ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 group-hover:bg-rose-600 group-hover:text-white'
                  : 'bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white'
              }`}>
                {isStockAlert ? <AlertTriangle className="w-5 h-5" /> : <Boxes className="w-5 h-5" />}
              </div>
            </div>
            <div className="mt-3 cursor-pointer" onClick={() => setActiveModule('INVENTORY')}>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-sans flex items-baseline justify-between">
                <span>{formatCurrency(totalStockValue)}</span>
                {lowStockCount > 0 && (
                  <span className={`text-xs font-bold ${isStockAlert ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-amber-600'}`}>
                    ⚠️ {lowStockCount} আইটেম লো
                  </span>
                )}
              </div>
            </div>
            
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              {lowStockCount > 0 ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRequisitionModal(true);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold transition-all shadow-xs"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  ১-ক্লিক ক্রয় রিকুইজিশন
                </button>
              ) : (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">মোট আইটেম:</span>
                  <span className="font-bold text-amber-700 dark:text-amber-400">{safeProducts.length} প্রকার খাদ্যপণ্য</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ROW 3: CASH, RECEIVABLES & PAYABLES */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Cash Balance */}
          <div
            id="kpi-cash-balance"
            onClick={() => setActiveModule('CASH_BANK')}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-400 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                হাতে নগদ ক্যাশ
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-sans">
                {formatCurrency(cashInHand)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                <span>অফিস ক্যাশবাক্স ব্যালেন্স</span>
                <span className="text-teal-700 dark:text-teal-400 font-bold">ক্যাশ বুক →</span>
              </div>
            </div>
          </div>

          {/* Total Receivables */}
          <div
            id="kpi-total-receivables"
            onClick={() => setActiveModule('CUSTOMERS_LEDGER')}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-rose-400 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                গ্রাহকের নিকট মোট বকেয়া পাওনা
              </span>
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-sans">
                {formatCurrency(totalReceivableDues)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                <span>কাস্টমারদের কাছে মোট বাকি</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">{safeCustomers.filter(c => c.currentDue > 0).length} জন বাকি</span>
              </div>
            </div>
          </div>

          {/* Total Payables */}
          <div
            id="kpi-total-payables"
            onClick={() => setActiveModule('SUPPLIERS_LEDGER')}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-400 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                সরবরাহকারীদের নিকট মোট দেনা
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <Truck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-sans">
                {formatCurrency(totalPayableDues)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                <span>সাপ্লায়ার বাকি বিল</span>
                <span className="font-bold text-amber-700 dark:text-amber-400">{safeSuppliers.filter(s => s.currentPayable > 0).length} সাপ্লায়ার</span>
              </div>
            </div>
          </div>
        </div>
      </div>

            {/* ML-POWERED PROCUREMENT FORECAST */}
      <ProcurementForecast />

      {/* ANALYTICS SECTION: TOP & LEAST SELLING, MOST & LEAST PROFITABLE PRODUCTS */}
      <div className="space-y-4 page-break-inside-avoid">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-teal-600" />
            <span>পণ্য বিশ্লেষণ ও লাভ-ক্ষতি র্যাঙ্কিং</span>
          </h3>
          <span className="text-xs text-slate-400">খাদ্যপণ্য পারফর্মেন্স</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Box 1: Top Selling Products */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-teal-500"></div>
                  <h4 className="font-bold text-xs text-slate-800 uppercase">সর্বোচ্চ বিক্রিত পণ্য</h4>
                </div>
                <span className="text-[10px] text-teal-600 font-bold">বেশি বিক্রিত</span>
              </div>

              <div className="mt-3 space-y-2.5 text-xs">
                {productAnalytics.topSelling.length === 0 && (
                  <div className="p-4 text-center text-slate-400">কোনো বিক্রয় পাওয়া যায়নি</div>
                )}
                {productAnalytics.topSelling.map((p, idx) => (
                  <div key={idx} className="p-2 bg-slate-50/80 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                      <span className="w-5 h-5 rounded-md bg-teal-100 text-teal-800 font-black text-[10px] flex items-center justify-center shrink-0">
                        {toBengaliNumber(idx + 1)}
                      </span>
                      <div className="truncate">
                        <div className="font-bold text-slate-900 truncate">{p.name}</div>
                        <div className="text-[10px] text-slate-500">{p.unitsSold} {p.unit} বিক্রিত</div>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-teal-700 shrink-0">{formatCurrency(p.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => setActiveModule('SALES')}
              className="mt-3 w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition-colors text-center"
            >
              সব সেলস রিপোর্ট দেখুন →
            </button>
          </div>

          {/* Box 2: Least Selling Products */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                  <h4 className="font-bold text-xs text-slate-800 uppercase">সর্বনিম্ন বিক্রিত পণ্য</h4>
                </div>
                <span className="text-[10px] text-amber-700 font-bold">কম বিক্রিত</span>
              </div>

              <div className="mt-3 space-y-2.5 text-xs">
                {productAnalytics.leastSelling.length === 0 && (
                  <div className="p-4 text-center text-slate-400">কোনো খাদ্যপণ্য নেই</div>
                )}
                {productAnalytics.leastSelling.map((p, idx) => (
                  <div key={idx} className="p-2 bg-slate-50/80 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                      <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-800 font-black text-[10px] flex items-center justify-center shrink-0">
                        {toBengaliNumber(idx + 1)}
                      </span>
                      <div className="truncate">
                        <div className="font-bold text-slate-900 truncate">{p.name}</div>
                        <div className="text-[10px] text-slate-500">স্টক আছে: {p.currentStock} {p.unit}</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 shrink-0">
                      {p.unitsSold} {p.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => setActiveModule('INVENTORY')}
              className="mt-3 w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition-colors text-center"
            >
              ইনভেন্টরি স্টক দেখুন →
            </button>
          </div>

          {/* Box 3: Most Profitable Products */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                  <h4 className="font-bold text-xs text-slate-800 uppercase">সর্বাধিক লাভজনক পণ্য</h4>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold">সর্বোচ্চ লাভ</span>
              </div>

              <div className="mt-3 space-y-2.5 text-xs">
                {productAnalytics.mostProfitable.length === 0 && (
                  <div className="p-4 text-center text-slate-400">কোনো তথ্য নেই</div>
                )}
                {productAnalytics.mostProfitable.map((p, idx) => (
                  <div key={idx} className="p-2 bg-emerald-50/40 rounded-xl flex items-center justify-between border border-emerald-100/60">
                    <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                      <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 font-black text-[10px] flex items-center justify-center shrink-0">
                        {toBengaliNumber(idx + 1)}
                      </span>
                      <div className="truncate">
                        <div className="font-bold text-slate-900 truncate">{p.name}</div>
                        <div className="text-[10px] text-emerald-700 font-semibold">{p.margin.toFixed(1)}% মার্জিন</div>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-emerald-700 shrink-0">{formatCurrency(p.profit)}</span>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => setActiveModule('REPORTS_PNL')}
              className="mt-3 w-full py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-lg transition-colors text-center"
            >
              পূর্ণ মুনাফা বিবরণী →
            </button>
          </div>

          {/* Box 4: Least Profitable Products */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                  <h4 className="font-bold text-xs text-slate-800 uppercase">সর্বনিম্ন লাভজনক পণ্য</h4>
                </div>
                <span className="text-[10px] text-rose-700 font-bold">কম/শূন্য লাভ</span>
              </div>

              <div className="mt-3 space-y-2.5 text-xs">
                {productAnalytics.leastProfitable.length === 0 && (
                  <div className="p-4 text-center text-slate-400">কোনো তথ্য নেই</div>
                )}
                {productAnalytics.leastProfitable.map((p, idx) => (
                  <div key={idx} className="p-2 bg-slate-50 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                      <span className="w-5 h-5 rounded-md bg-rose-100 text-rose-800 font-black text-[10px] flex items-center justify-center shrink-0">
                        {toBengaliNumber(idx + 1)}
                      </span>
                      <div className="truncate">
                        <div className="font-bold text-slate-900 truncate">{p.name}</div>
                        <div className="text-[10px] text-slate-500">মার্জিন: {p.margin.toFixed(1)}%</div>
                      </div>
                    </div>
                    <span className={`font-mono font-bold shrink-0 ${p.profit < 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                      {formatCurrency(p.profit)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => setActiveModule('PRODUCTION_COST')}
              className="mt-3 w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition-colors text-center"
            >
              কস্ট মাস্টার এডজাস্ট করুন →
            </button>
          </div>
        </div>
      </div>

      {/* PARTY-WISE DUE LIST (SORTED TABLE: LARGEST DUE TO SMALLEST DUE) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 page-break-inside-avoid">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-teal-600" />
              <h3 className="font-bold text-slate-900 text-base">
                পার্টিভিত্তিক দেনা-পাওনা বিবরণী
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              বড় বকেয়া থেকে ছোট বকেয়া ক্রমানুসারে সাজানো
            </p>
          </div>

          {/* Tab Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold no-print">
            <button
              onClick={() => setDueTab('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dueTab === 'ALL'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              সকল বকেয়া ({partyDueList.length})
            </button>
            <button
              onClick={() => setDueTab('CUSTOMERS')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dueTab === 'CUSTOMERS'
                  ? 'bg-white text-rose-700 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              কাস্টমার পাওনা ({safeCustomers.filter(c => c.currentDue > 0).length})
            </button>
            <button
              onClick={() => setDueTab('SUPPLIERS')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dueTab === 'SUPPLIERS'
                  ? 'bg-white text-amber-700 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              সাপ্লায়ার দেনা ({safeSuppliers.filter(s => s.currentPayable > 0).length})
            </button>
          </div>
        </div>

        {/* Transparent, Clean Corporate Table */}
        <div className="erp-table-container">
          <div className="p-4 pb-0"><DataExportToolbar filename="DashboardView_Export" /></div>
<table className="erp-table">
            <thead>
              <tr>
                <th className="w-12 text-center">#</th>
                <th>পার্টির নাম</th>
                <th>ধরন</th>
                <th>মোবাইল নম্বর</th>
                <th>ঠিকানা</th>
                <th className="text-right">বকেয়ার পরিমাণ</th>
                <th className="text-center no-print">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {partyDueList.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                    কোনো বকেয়া পাওয়া যায়নি। সব দেনা-পাওনা পরিশোধিত!
                  </td>
                </tr>
              )}
              {partyDueList.map((item, idx) => (
                <tr key={`${item.type}-${item.id}`}>
                  <td className="text-center font-bold text-slate-400">{toBengaliNumber(idx + 1)}</td>
                  <td>
                    <div className="font-bold text-slate-900">{item.name}</div>
                    <div className="text-[10px] text-slate-400">আইডি: {item.id}</div>
                  </td>
                  <td>
                    {item.type === 'CUSTOMER' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                        <Users className="w-3 h-3 text-rose-600" />
                        কাস্টমার পাওনা
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <Truck className="w-3 h-3 text-amber-600" />
                        সাপ্লায়ার দেনা
                      </span>
                    )}
                  </td>
                  <td>
                    {item.phone ? (
                      <div className="flex items-center gap-1 text-slate-600 font-mono text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{item.phone}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="text-slate-600 max-w-xs truncate">{item.address || '-'}</td>
                  <td className="text-right">
                    <span
                      className={`font-black font-sans text-sm ${
                        item.type === 'CUSTOMER' ? 'text-rose-600' : 'text-amber-700'
                      }`}
                    >
                      {formatCurrency(item.dueAmount)}
                    </span>
                  </td>
                  <td className="text-center no-print">
                    <button
                      onClick={() =>
                        setActiveModule(
                          item.type === 'CUSTOMER' ? 'CUSTOMERS_LEDGER' : 'SUPPLIERS_LEDGER'
                        )
                      }
                      className="px-2.5 py-1 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                    >
                      <span>লেজার</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* REQUISITION MODAL */}
      {showRequisitionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
              <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-indigo-600" />
                ১-ক্লিক ক্রয় রিকুইজিশন
              </h2>
              <button
                onClick={() => setShowRequisitionModal(false)}
                className="p-1.5 hover:bg-rose-100 text-slate-500 hover:text-rose-600 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
              <div className="mb-4 bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-xl border border-indigo-100 dark:border-indigo-800 text-sm text-indigo-800 dark:text-indigo-300">
                নিম্নোক্ত আইটেমগুলো তাদের সর্বনিম্ন স্টকের নিচে রয়েছে। এগুলো সরাসরি ক্রয়ের তালিকায় যুক্ত করতে <strong>সাপ্লায়ার</strong> নির্বাচন করে সাবমিট করুন।
              </div>
              
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">সাপ্লায়ার নির্বাচন করুন *</label>
                <select
                  value={selectedSupplierForReq}
                  onChange={e => setSelectedSupplierForReq(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="">-- সাপ্লায়ার নির্বাচন --</option>
                  {suppliers.map(sup => (
                    <option key={sup.id} value={sup.id}>{sup.name} ({sup.companyName})</option>
                  ))}
                </select>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2 px-3">পণ্য</th>
                      <th className="py-2 px-3 text-right">বর্তমান স্টক</th>
                      <th className="py-2 px-3 text-right">অ্যালার্ট লেভেল</th>
                      <th className="py-2 px-3 text-right">রিকুইজিশন পরিমাণ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {lowStockProducts.map(p => (
                      <tr key={p.id}>
                        <td className="py-2 px-3 font-bold">{p.nameBangla} ({p.nameEnglish})</td>
                        <td className="py-2 px-3 text-right text-rose-600 font-bold">{p.currentStock} {p.unit}</td>
                        <td className="py-2 px-3 text-right text-amber-600">{p.minStockAlert || 20} {p.unit}</td>
                        <td className="py-2 px-3 text-right">
                          <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                            {Math.max((p.minStockAlert || 20) * 2 - (p.currentStock || 0), 10)} {p.unit}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3">
              <button
                onClick={() => setShowRequisitionModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-sm transition-colors"
              >
                বাতিল
              </button>
              <button
                onClick={() => {
                  if (!selectedSupplierForReq) {
                    alert('সাপ্লায়ার নির্বাচন করুন!');
                    return;
                  }
                  
                  const sup = suppliers.find(s => s.id === selectedSupplierForReq);
                  
                  const items = lowStockProducts.map(p => {
                    const reqQty = Math.max((p.minStockAlert || 20) * 2 - (p.currentStock || 0), 10);
                    return {
                      productId: p.id,
                      productName: p.nameBangla,
                      unit: p.unit,
                      quantity: reqQty,
                      unitCost: p.purchasePrice,
                      total: reqQty * p.purchasePrice,
                      batchNumber: `AUTO-${new Date().getTime().toString().slice(-4)}`
                    };
                  });
                  
                  const subTotal = items.reduce((acc, item) => acc + item.total, 0);
                  
                  addPurchase({
                    date: new Date().toISOString().split('T')[0],
                    supplierId: sup!.id,
                    supplierName: sup!.name,
                    items,
                    subTotal,
                    discountAmount: 0,
                    otherCost: 0,
                    grandTotal: subTotal,
                    paidAmount: 0,
                    dueAmount: subTotal,
                    paymentMethod: 'CASH',
                    receivedBy: currentUser?.name || 'Store Manager',
                    notes: 'Auto-generated via Low Stock 1-Click Requisition'
                  });
                  
                  setShowRequisitionModal(false);
                  setActiveModule('PURCHASE');
                }}
                disabled={!selectedSupplierForReq}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-colors flex items-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                পারচেজ এন্ট্রি তৈরি করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
