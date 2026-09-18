import React, { useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import { Brain, ArrowRight, Package, TrendingUp, AlertTriangle } from 'lucide-react';

export const ProcurementForecast: React.FC = () => {
  const { sales, products } = useERP();

  const forecastData = useMemo(() => {
    // 1. Get current date and 90 days ago
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // 2. Filter sales from the last 90 days
    const recentSales = sales.filter(
      (sale) => new Date(sale.date) >= ninetyDaysAgo
    );

    // 3. Aggregate quantity sold per product over 90 days
    const productSalesMap: Record<string, number> = {};
    recentSales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!productSalesMap[item.productId]) {
          productSalesMap[item.productId] = 0;
        }
        productSalesMap[item.productId] += item.quantity;
      });
    });

    // 4. Calculate velocity and forecast
    // We assume 90 days period. Daily velocity = total_sold / 90.
    // Target buffer = 30 days of stock.
    const analysis = products.map((product) => {
      const soldIn90Days = productSalesMap[product.id] || 0;
      const dailyVelocity = soldIn90Days / 90;
      const forecast30Days = dailyVelocity * 30;
      const currentStock = product.currentStock || 0;
      
      let suggestion = 0;
      let status: 'SAFE' | 'WARNING' | 'CRITICAL' = 'SAFE';

      if (currentStock < forecast30Days) {
        suggestion = Math.ceil(forecast30Days - currentStock);
        if (currentStock < forecast30Days * 0.5) {
          status = 'CRITICAL';
        } else {
          status = 'WARNING';
        }
      }

      return {
        product,
        soldIn90Days,
        dailyVelocity,
        forecast30Days: Math.ceil(forecast30Days),
        currentStock,
        suggestion,
        status,
      };
    });

    // 5. Sort by suggestion descending (items needing most restock first)
    return analysis
      .filter((item) => item.suggestion > 0)
      .sort((a, b) => b.suggestion - a.suggestion)
      .slice(0, 10); // Top 10 suggestions
  }, [sales, products]);

  if (forecastData.length === 0) {
    return null; // Nothing to suggest
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-indigo-200 shadow-sm relative overflow-hidden page-break-inside-avoid">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-10 opacity-50"></div>
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              ML-Powered Procurement Forecast
            </h3>
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full border border-indigo-100">
              Beta
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            গত ৯০ দিনের সেলস ভেলোসিটি বিশ্লেষণ করে পরবর্তী ৩০ দিনের জন্য সম্ভাব্য প্রয়োজনীয় স্টক সাজেশন
          </p>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-600 font-semibold border-y border-slate-200">
              <th className="py-2.5 px-4 w-1/3">প্রোডাক্ট (Product)</th>
              <th className="py-2.5 px-3 text-right">বর্তমান স্টক</th>
              <th className="py-2.5 px-3 text-right">৯০ দিনে বিক্রি</th>
              <th className="py-2.5 px-3 text-right">৩০ দিনের ফোরকাস্ট</th>
              <th className="py-2.5 px-4 text-right">প্রস্তাবিত সংগ্রহ (Restock)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {forecastData.map((item, index) => (
              <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {item.status === 'CRITICAL' ? (
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                    ) : (
                      <Package className="w-4 h-4 text-amber-500" />
                    )}
                    <span className="font-bold text-slate-800">{item.product.name}</span>
                  </div>
                </td>
                <td className="py-3 px-3 text-right">
                  <span className="font-semibold text-slate-700">
                    {item.currentStock} {item.product.unit}
                  </span>
                </td>
                <td className="py-3 px-3 text-right text-slate-600">
                  {item.soldIn90Days} {item.product.unit}
                </td>
                <td className="py-3 px-3 text-right">
                  <span className="font-medium text-indigo-600">
                    {item.forecast30Days} {item.product.unit}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg border border-indigo-100">
                    <span>+{item.suggestion}</span>
                    <span className="text-[10px] text-indigo-500 font-normal">{item.product.unit}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
