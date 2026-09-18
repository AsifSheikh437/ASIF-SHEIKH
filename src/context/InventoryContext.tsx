import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { Product, BatchItem as Batch, ProductCategory } from '../types';
import { useERP } from './ERPContext';

export type AlertType = 
  | 'OUT_OF_STOCK'
  | 'LOW_STOCK'
  | 'EXPIRED_BATCH'
  | 'CRITICAL_EXPIRY_BATCH'
  | 'UPCOMING_EXPIRY_BATCH';

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface RealtimeInventoryAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  subtitle: string;
  details: string;
  productId?: string;
  productNameBangla?: string;
  productNameEnglish?: string;
  category?: ProductCategory;
  batchNumber?: string;
  currentStock?: number;
  minThreshold?: number;
  unit?: string;
  expDate?: string;
  daysRemaining?: number;
  timestamp: string;
  actionModule: 'INVENTORY' | 'BATCH_EXPIRY' | 'PURCHASE' | 'SALES';
  actionLabel: string;
}

export interface InventoryContextType {
  // Raw Data from context
  products: Product[];
  batches: Batch[];
  
  // Filtered Alert Subsets
  lowStockItems: Product[];
  outOfStockItems: Product[];
  expiringBatches: Batch[]; // within 30 days
  criticalBatches: Batch[]; // within 7 days
  expiredBatches: Batch[];   // already expired
  
  // Real-time Metrics & Counts
  lowStockCount: number;
  outOfStockCount: number;
  expiringBatchesCount: number;
  expiredBatchesCount: number;
  criticalAlertCount: number;
  totalAlertCount: number;
  
  // Real-time Alert Stream
  alerts: RealtimeInventoryAlert[];
  
  // Dismissed Alerts Management
  dismissedAlertIds: string[];
  dismissAlert: (alertId: string) => void;
  dismissAllAlerts: () => void;
  resetDismissedAlerts: () => void;
  
  // Quick Actions / Navigation
  navigateToModule: (module: 'INVENTORY' | 'BATCH_EXPIRY' | 'PURCHASE' | 'SALES') => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
    products = [], 
    batches = [], 
    setActiveModule 
  } = useERP();

  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('erp_dismissed_inventory_alerts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save dismissed alerts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('erp_dismissed_inventory_alerts', JSON.stringify(dismissedAlertIds));
    } catch {
      // ignore
    }
  }, [dismissedAlertIds]);

  // Derived low stock items
  const outOfStockItems = useMemo(() => {
    return products.filter(p => p.currentStock <= 0);
  }, [products]);

  const lowStockItems = useMemo(() => {
    return products.filter(p => p.currentStock > 0 && p.currentStock <= p.minStockAlert);
  }, [products]);

  // Derived batch expiry data
  const now = new Date();
  const todayTimestamp = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const { expiredBatches, criticalBatches, expiringBatches } = useMemo(() => {
    const expired: Batch[] = [];
    const critical: Batch[] = [];
    const upcoming: Batch[] = [];

    (batches || []).forEach(b => {
      if (b.status === 'DEPLETED') return;
      if (!b.expDate) return;

      const expDateObj = new Date(b.expDate);
      if (isNaN(expDateObj.getTime())) return;

      const expTimestamp = new Date(expDateObj.getFullYear(), expDateObj.getMonth(), expDateObj.getDate()).getTime();
      const diffDays = Math.ceil((expTimestamp - todayTimestamp) / (1000 * 60 * 60 * 24));

      if (diffDays < 0 || b.status === 'EXPIRED') {
        expired.push(b);
      } else if (diffDays <= 7) {
        critical.push(b);
      } else if (diffDays <= 30) {
        upcoming.push(b);
      }
    });

    return {
      expiredBatches: expired,
      criticalBatches: critical,
      expiringBatches: [...critical, ...upcoming],
    };
  }, [batches, todayTimestamp]);

  // Unified Real-Time Alerts Generator
  const alerts = useMemo<RealtimeInventoryAlert[]>(() => {
    const list: RealtimeInventoryAlert[] = [];

    // 1. Out of Stock Items (Critical)
    outOfStockItems.forEach(p => {
      list.push({
        id: `out-stock-${p.id}`,
        type: 'OUT_OF_STOCK',
        severity: 'critical',
        title: `${p.nameBangla} - স্টক শূন্য!`,
        subtitle: `কোড: ${p.sku || p.id} • ${p.nameEnglish}`,
        details: `বর্তমান মজুদ ০ ${p.unit}। সর্বনিম্ন প্রয়োজনীয় সীমা ${p.minStockAlert} ${p.unit}। উৎপাদন ও বিক্রয়ে ব্যাঘাত ঘটার সম্ভাবনা।`,
        productId: p.id,
        productNameBangla: p.nameBangla,
        productNameEnglish: p.nameEnglish,
        category: p.category,
        currentStock: p.currentStock,
        minThreshold: p.minStockAlert,
        unit: p.unit,
        timestamp: 'এখনই জরুরি',
        actionModule: 'PURCHASE',
        actionLabel: 'দ্রুত কাঁচামাল/পণ্য অর্ডার',
      });
    });

    // 2. Expired Batches (Critical)
    expiredBatches.forEach(b => {
      const prod = products.find(p => p.id === b.productId);
      const prodName = prod?.nameBangla || b.productName || 'অজ্ঞাত খাদ্যপণ্য';
      const expDateObj = new Date(b.expDate);
      const diffDays = Math.abs(Math.ceil((expDateObj.getTime() - todayTimestamp) / (1000 * 60 * 60 * 24)));

      list.push({
        id: `expired-${b.id}`,
        type: 'EXPIRED_BATCH',
        severity: 'critical',
        title: `মেয়াদোত্তীর্ণ ব্যাচ: ${b.batchNumber}`,
        subtitle: `${prodName} • পরিমাণ: ${b.quantity} ${prod?.unit || 'একক'}`,
        details: `${diffDays === 0 ? 'আজই' : `${diffDays} দিন পূর্বে`} মেয়াদ শেষ হয়েছে (${b.expDate})। অবিলম্বে আলাদা করুন বা নষ্ট পণ্য হিসেবে লিপিবদ্ধ করুন।`,
        productId: b.productId,
        productNameBangla: prodName,
        batchNumber: b.batchNumber,
        currentStock: b.quantity,
        expDate: b.expDate,
        daysRemaining: -diffDays,
        timestamp: 'মেয়াদ উত্তীর্ণ',
        actionModule: 'BATCH_EXPIRY',
        actionLabel: 'ব্যাচ কোয়ারেন্টাইন / অডিট',
      });
    });

    // 3. Critical Expiry Batches (< 7 days) (Critical/Warning)
    criticalBatches.forEach(b => {
      const prod = products.find(p => p.id === b.productId);
      const prodName = prod?.nameBangla || b.productName || 'খাদ্যপণ্য';
      const expDateObj = new Date(b.expDate);
      const diffDays = Math.max(0, Math.ceil((expDateObj.getTime() - todayTimestamp) / (1000 * 60 * 60 * 24)));

      list.push({
        id: `crit-exp-${b.id}`,
        type: 'CRITICAL_EXPIRY_BATCH',
        severity: 'critical',
        title: `মেয়াদ শেষের অতি নিকটে: ${b.batchNumber}`,
        subtitle: `${prodName} • আর মাত্র ${diffDays === 0 ? 'আজই শেষ দিন' : `${diffDays} দিন বাকি`}`,
        details: `ব্যাচ মজুদে এখনো ${b.quantity} ${prod?.unit || 'একক'} রয়েছে। মেয়াদ: ${b.expDate}। FEFO পদ্ধতিতে দ্রুত বিক্রয় বা ব্যবহারে অগ্রাধিকার দিন।`,
        productId: b.productId,
        productNameBangla: prodName,
        batchNumber: b.batchNumber,
        currentStock: b.quantity,
        expDate: b.expDate,
        daysRemaining: diffDays,
        timestamp: `আর ${diffDays} দিন`,
        actionModule: 'SALES',
        actionLabel: 'ডিসকাউন্ট বা বিশেষ বিক্রয়',
      });
    });

    // 4. Low Stock Items (Warning)
    lowStockItems.forEach(p => {
      list.push({
        id: `low-stock-${p.id}`,
        type: 'LOW_STOCK',
        severity: 'warning',
        title: `${p.nameBangla} - মজুদ আশঙ্কাজনক কম`,
        subtitle: `কোড: ${p.sku || p.id} • ক্যাটাগরি: ${p.category === 'RAW_MATERIAL' ? 'কাঁচামাল' : p.category === 'FINISHED_GOODS' ? 'তৈরি খাদ্য' : 'প্যাকেজিং'}`,
        details: `বর্তমান স্টক ${p.currentStock} ${p.unit} (অ্যালার্ট লেভেল: ${p.minStockAlert} ${p.unit})। নতুন সাপ্লাই ক্রয়ের উদ্যোগ নিন।`,
        productId: p.id,
        productNameBangla: p.nameBangla,
        productNameEnglish: p.nameEnglish,
        category: p.category,
        currentStock: p.currentStock,
        minThreshold: p.minStockAlert,
        unit: p.unit,
        timestamp: 'সতর্কতা',
        actionModule: 'INVENTORY',
        actionLabel: 'ইনভেন্টরি স্টক যাচাই',
      });
    });

    // 5. Upcoming Expiry Batches (8 to 30 days) (Info/Warning)
    expiringBatches
      .filter(b => !criticalBatches.some(cb => cb.id === b.id) && !expiredBatches.some(eb => eb.id === b.id))
      .forEach(b => {
        const prod = products.find(p => p.id === b.productId);
        const prodName = prod?.nameBangla || b.productName || 'খাদ্যপণ্য';
        const expDateObj = new Date(b.expDate);
        const diffDays = Math.max(0, Math.ceil((expDateObj.getTime() - todayTimestamp) / (1000 * 60 * 60 * 24)));

        list.push({
          id: `upcoming-exp-${b.id}`,
          type: 'UPCOMING_EXPIRY_BATCH',
          severity: 'warning',
          title: `আসন্ন মেয়াদ উত্তীর্ণের ব্যাচ: ${b.batchNumber}`,
          subtitle: `${prodName} • অবশিষ্ট দিন: ${diffDays} দিন`,
          details: `মেয়াদ: ${b.expDate}। স্টকে আছে ${b.quantity} ${prod?.unit || 'একক'}। প্রথম প্রস্তুত পণ্য আগে বিক্রি নিশ্চিত করুন।`,
          productId: b.productId,
          productNameBangla: prodName,
          batchNumber: b.batchNumber,
          currentStock: b.quantity,
          expDate: b.expDate,
          daysRemaining: diffDays,
          timestamp: `আর ${diffDays} দিন`,
          actionModule: 'BATCH_EXPIRY',
          actionLabel: 'ব্যাচ শিডিউল দেখুন',
        });
      });

    return list;
  }, [outOfStockItems, lowStockItems, expiredBatches, criticalBatches, expiringBatches, products, todayTimestamp]);

  // Active (non-dismissed) counts
  const activeAlerts = useMemo(() => {
    return alerts.filter(a => !dismissedAlertIds.includes(a.id));
  }, [alerts, dismissedAlertIds]);

  const criticalAlertCount = useMemo(() => {
    return activeAlerts.filter(a => a.severity === 'critical').length;
  }, [activeAlerts]);

  const dismissAlert = (alertId: string) => {
    setDismissedAlertIds(prev => prev.includes(alertId) ? prev : [...prev, alertId]);
  };

  const dismissAllAlerts = () => {
    setDismissedAlertIds(alerts.map(a => a.id));
  };

  const resetDismissedAlerts = () => {
    setDismissedAlertIds([]);
  };

  const navigateToModule = (module: 'INVENTORY' | 'BATCH_EXPIRY' | 'PURCHASE' | 'SALES') => {
    setActiveModule(module);
  };

  const value: InventoryContextType = {
    products,
    batches,
    lowStockItems,
    outOfStockItems,
    expiringBatches,
    criticalBatches,
    expiredBatches,
    lowStockCount: lowStockItems.length,
    outOfStockCount: outOfStockItems.length,
    expiringBatchesCount: expiringBatches.length,
    expiredBatchesCount: expiredBatches.length,
    criticalAlertCount,
    totalAlertCount: activeAlerts.length,
    alerts: activeAlerts,
    dismissedAlertIds,
    dismissAlert,
    dismissAllAlerts,
    resetDismissedAlerts,
    navigateToModule,
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = (): InventoryContextType => {
  const context = useContext(InventoryContext);
  if (context) {
    return context;
  }

  // Fallback if accessed outside InventoryProvider directly from ERPContext
  // This guarantees zero crashes anywhere in the app
  try {
    const erp = useERP();
    const products = erp?.products || [];
    const batches = erp?.batches || [];

    const now = new Date();
    const todayTimestamp = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const lowStockItems = products.filter(p => p.currentStock <= p.minStockAlert && p.currentStock > 0);
    const outOfStockItems = products.filter(p => p.currentStock <= 0);

    const expiredBatches = batches.filter(b => b.status === 'EXPIRED' || (b.status !== 'DEPLETED' && b.expDate && new Date(b.expDate).getTime() < todayTimestamp));
    const expiringBatches = batches.filter(b => {
      if (b.status === 'DEPLETED' || !b.expDate) return false;
      const expTime = new Date(b.expDate).getTime();
      return expTime >= todayTimestamp && expTime <= todayTimestamp + 30 * 86400000;
    });
    const criticalBatches = batches.filter(b => {
      if (b.status === 'DEPLETED' || !b.expDate) return false;
      const expTime = new Date(b.expDate).getTime();
      return expTime >= todayTimestamp && expTime <= todayTimestamp + 7 * 86400000;
    });

    return {
      products,
      batches,
      lowStockItems,
      outOfStockItems,
      expiringBatches,
      criticalBatches,
      expiredBatches,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      expiringBatchesCount: expiringBatches.length,
      expiredBatchesCount: expiredBatches.length,
      criticalAlertCount: outOfStockItems.length + expiredBatches.length + criticalBatches.length,
      totalAlertCount: lowStockItems.length + outOfStockItems.length + expiringBatches.length + expiredBatches.length,
      alerts: [],
      dismissedAlertIds: [],
      dismissAlert: () => {},
      dismissAllAlerts: () => {},
      resetDismissedAlerts: () => {},
      navigateToModule: (mod: any) => erp.setActiveModule(mod),
    };
  } catch {
    return {
      products: [],
      batches: [],
      lowStockItems: [],
      outOfStockItems: [],
      expiringBatches: [],
      criticalBatches: [],
      expiredBatches: [],
      lowStockCount: 0,
      outOfStockCount: 0,
      expiringBatchesCount: 0,
      expiredBatchesCount: 0,
      criticalAlertCount: 0,
      totalAlertCount: 0,
      alerts: [],
      dismissedAlertIds: [],
      dismissAlert: () => {},
      dismissAllAlerts: () => {},
      resetDismissedAlerts: () => {},
      navigateToModule: () => {},
    };
  }
};
