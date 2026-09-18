import re

with open('src/components/views/DashboardView.tsx', 'r') as f:
    content = f.read()

# 1. Imports
content = content.replace("  FileText,\n  Download,", "  FileText,\n  Download,\n  Search,\n  Filter,")

# 2. States
state_insert = """  // Chart configuration state
  const [txSearchQuery, setTxSearchQuery] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState<'ALL' | 'SALE' | 'PURCHASE'>('ALL');
  const [trendDays"""
content = content.replace("  // Chart configuration state\n  const [trendDays", state_insert)

# 3. Modify recentTransactions logic
old_logic = """  const recentTransactions = useMemo(() => {
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
  }, [safeSales, safePurchases]);"""

new_logic = """  const recentTransactions = useMemo(() => {
    let combined = [
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
  }, [safeSales, safePurchases, txSearchQuery, txTypeFilter]);"""

content = content.replace(old_logic, new_logic)


# 4. Modify UI
old_ui = """      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs mb-6 page-break-inside-avoid">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
          <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
            সাম্প্রতিক লেনদেন (Recent Transactions)
          </h3>
        </div>"""

new_ui = """      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs mb-6 page-break-inside-avoid">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
              সাম্প্রতিক লেনদেন (Recent Transactions)
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
                All
              </button>
              <button
                onClick={() => setTxTypeFilter('SALE')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  txTypeFilter === 'SALE'
                    ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 shadow-2xs border border-teal-200 dark:border-teal-800/50'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Sales
              </button>
              <button
                onClick={() => setTxTypeFilter('PURCHASE')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  txTypeFilter === 'PURCHASE'
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-2xs border border-blue-200 dark:border-blue-800/50'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Purchases
              </button>
            </div>
          </div>
        </div>"""
        
content = content.replace(old_ui, new_ui)

with open('src/components/views/DashboardView.tsx', 'w') as f:
    f.write(content)

