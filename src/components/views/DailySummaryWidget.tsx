import React, { useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import { formatCurrency, toBengaliNumber } from '../../utils/formatters';
import { TrendingUp, ShoppingCart, Wallet, ArrowUpRight, ArrowDownRight, Banknote, PieChart, AlertTriangle } from 'lucide-react';

export const DailySummaryWidget: React.FC = () => {
  const { sales, purchases, totalCashAndBankBalance, theme } = useERP();

  const { todaySalesTotal, todaySalesCount, todayPurchaseTotal, todayPurchaseCount, cashInHand, monthProfitMargin, monthSales, monthPurchases, isLoss } = useMemo(() => {
    const today = new Date().toISOString().substring(0, 10);
    const currentMonth = today.substring(0, 7); // YYYY-MM
    
    // Safely filter today's sales
    const todaySales = (sales || []).filter(
      s => s.date === today && s.deliveryStatus !== 'CANCELLED'
    );
    const sTotal = todaySales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
    const sCount = todaySales.length;

    // Safely filter today's purchases
    const todayPurchases = (purchases || []).filter(
      p => p.date === today
    );
    const pTotal = todayPurchases.reduce((sum, p) => sum + (p.grandTotal || 0), 0);
    const pCount = todayPurchases.length;
    
    // Calculate Monthly Margin (Sales - Purchases for current month)
    const currentMonthSales = (sales || []).filter(
      s => s.date.startsWith(currentMonth) && s.deliveryStatus !== 'CANCELLED'
    ).reduce((sum, s) => sum + (s.grandTotal || 0), 0);
    
    const currentMonthPurchases = (purchases || []).filter(
      p => p.date.startsWith(currentMonth)
    ).reduce((sum, p) => sum + (p.grandTotal || 0), 0);
    
    const margin = currentMonthSales - currentMonthPurchases;
    const isLoss = margin < 0;

    return {
      todaySalesTotal: sTotal,
      todaySalesCount: sCount,
      todayPurchaseTotal: pTotal,
      todayPurchaseCount: pCount,
      cashInHand: totalCashAndBankBalance,
      monthProfitMargin: Math.abs(margin),
      monthSales: currentMonthSales,
      monthPurchases: currentMonthPurchases,
      isLoss: isLoss
    };
  }, [sales, purchases, totalCashAndBankBalance]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Daily Sales Card */}
      <div className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-6 -top-6 opacity-10">
          <TrendingUp className="w-32 h-32" />
        </div>
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1 opacity-90">
              <ShoppingCart className="w-5 h-5" />
              <h3 className="font-bold text-sm">আজকের মোট বিক্রয়</h3>
            </div>
            <div className="text-3xl font-black mt-2">
              {formatCurrency(todaySalesTotal)}
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>আজকে {toBengaliNumber(todaySalesCount)} টি বিক্রয় অর্ডার</span>
          </div>
        </div>
      </div>

      {/* Daily Purchases Card */}
      <div className="bg-gradient-to-br from-rose-500 to-rose-700 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-6 -top-6 opacity-10">
          <ShoppingCart className="w-32 h-32" />
        </div>
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1 opacity-90">
              <ShoppingCart className="w-5 h-5" />
              <h3 className="font-bold text-sm">আজকের মোট ক্রয়</h3>
            </div>
            <div className="text-3xl font-black mt-2">
              {formatCurrency(todayPurchaseTotal)}
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>আজকে {toBengaliNumber(todayPurchaseCount)} টি ক্রয় চালান</span>
          </div>
        </div>
      </div>

      {/* Current Cash/Bank Balance */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-6 -top-6 opacity-10">
          <Wallet className="w-32 h-32" />
        </div>
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1 opacity-90">
              <Wallet className="w-5 h-5" />
              <h3 className="font-bold text-sm">মোট নগদ ও ব্যাংক তহবিল</h3>
            </div>
            <div className="text-3xl font-black mt-2">
              {formatCurrency(cashInHand)}
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
            <Banknote className="w-3.5 h-3.5" />
            <span>বর্তমানে ব্যবহারযোগ্য ব্যালেন্স</span>
          </div>
        </div>
      </div>
      {/* Profit Margin Card */}
      <div className={`bg-gradient-to-br ${isLoss ? 'from-orange-500 to-red-600' : 'from-indigo-500 to-indigo-700'} rounded-2xl p-5 text-white shadow-lg relative overflow-hidden`}>
        <div className="absolute -right-6 -top-6 opacity-10">
          <PieChart className="w-32 h-32" />
        </div>
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1 opacity-90">
              <PieChart className="w-5 h-5" />
              <h3 className="font-bold text-sm">চলতি মাসের বাণিজ্যিক উদ্বৃত্ত</h3>
            </div>
            <div className="text-3xl font-black mt-2">
              {isLoss ? '-' : '+'}{formatCurrency(monthProfitMargin)}
            </div>
          </div>
          <div className={`mt-4 flex items-center gap-2 text-xs font-semibold ${isLoss ? 'bg-red-900/30' : 'bg-white/20'} w-fit px-3 py-1 rounded-full backdrop-blur-sm`}>
            {isLoss ? <AlertTriangle className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
            <span>{isLoss ? 'চলতি মাসে গ্রস ক্ষতি' : 'চলতি মাসে গ্রস মুনাফা'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
