import re

with open('src/components/views/DailySummaryWidget.tsx', 'r') as f:
    content = f.read()

# 1. Imports
content = content.replace("ArrowDownRight, Banknote", "ArrowDownRight, Banknote, PieChart, AlertTriangle")

# 2. Logic
logic = """  const { todaySalesTotal, todaySalesCount, todayPurchaseTotal, todayPurchaseCount, cashInHand, monthProfitMargin, monthSales, monthPurchases, isLoss } = useMemo(() => {
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
  }, [sales, purchases, totalCashAndBankBalance]);"""

content = re.sub(r'  const { todaySalesTotal.*?totalCashAndBankBalance\]\);', logic, content, flags=re.DOTALL)

# 3. Grid sizing
content = content.replace('className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"', 'className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"')

# 4. New Card
new_card = """      {/* Profit Margin Card */}
      <div className={`bg-gradient-to-br ${isLoss ? 'from-orange-500 to-red-600' : 'from-indigo-500 to-indigo-700'} rounded-2xl p-5 text-white shadow-lg relative overflow-hidden`}>
        <div className="absolute -right-6 -top-6 opacity-10">
          <PieChart className="w-32 h-32" />
        </div>
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1 opacity-90">
              <PieChart className="w-5 h-5" />
              <h3 className="font-bold text-sm">Monthly Margin (মাসিক মার্জিন)</h3>
            </div>
            <div className="text-3xl font-black mt-2">
              {isLoss ? '-' : '+'}{formatCurrency(monthProfitMargin)}
            </div>
          </div>
          <div className={`mt-4 flex items-center gap-2 text-xs font-semibold ${isLoss ? 'bg-red-900/30' : 'bg-white/20'} w-fit px-3 py-1 rounded-full backdrop-blur-sm`}>
            {isLoss ? <AlertTriangle className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
            <span>{isLoss ? 'Gross Loss This Month' : 'Gross Profit This Month'}</span>
          </div>
        </div>
      </div>
    </div>"""

content = content.replace("    </div>\n  );\n};", new_card + "\n  );\n};")

with open('src/components/views/DailySummaryWidget.tsx', 'w') as f:
    f.write(content)

