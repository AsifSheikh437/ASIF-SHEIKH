import re

with open('src/components/views/DashboardView.tsx', 'r') as f:
    content = f.read()

# 1. Insert recentTransactions logic right before pendingSystemTasksCount
logic_insert = """
  const recentTransactions = useMemo(() => {
    const combined = [
      ...safeSales.map(s => ({
        id: s.id,
        date: s.date,
        type: 'SALE' as const,
        invoiceNo: s.invoiceNo,
        partyName: s.customerName,
        amount: s.grandTotal
      })),
      ...safePurchases.map(p => ({
        id: p.id,
        date: p.date,
        type: 'PURCHASE' as const,
        invoiceNo: p.billNo,
        partyName: p.supplierName,
        amount: p.grandTotal
      }))
    ];
    
    // Sort by date descending
    combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return combined.slice(0, 5);
  }, [safeSales, safePurchases]);

  // 2. Pending Orders Calculations (Sales invoices not yet delivered/cancelled)
"""
content = content.replace("  // 2. Pending Orders Calculations (Sales invoices not yet delivered/cancelled)", logic_insert)


# 2. Insert Recent Transactions UI after DailySummaryWidget
ui_insert = """      <DailySummaryWidget />

      {/* RECENT TRANSACTIONS WIDGET */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs mb-6 page-break-inside-avoid">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
          <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
            সাম্প্রতিক লেনদেন (Recent Transactions)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-y border-slate-200 dark:border-slate-700">
                <th className="py-3 px-4 font-bold">তারিখ (Date)</th>
                <th className="py-3 px-4 font-bold">ধরন (Type)</th>
                <th className="py-3 px-4 font-bold">ইনভয়েস/বিল (Invoice)</th>
                <th className="py-3 px-4 font-bold">পার্টি (Party)</th>
                <th className="py-3 px-4 text-right font-bold">পরিমাণ (Amount)</th>
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
                      {tx.type === 'SALE' ? 'সেলস (Sale)' : 'পারচেজ (Purchase)'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{tx.invoiceNo}</td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{tx.partyName}</td>
                  <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">{formatCurrency(tx.amount)}</td>
                </tr>
              ))}
              {recentTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 dark:text-slate-400">কোনো লেনদেন পাওয়া যায়নি</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
"""
content = content.replace("      <DailySummaryWidget />", ui_insert)

with open('src/components/views/DashboardView.tsx', 'w') as f:
    f.write(content)

