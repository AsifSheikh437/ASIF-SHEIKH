import re

with open('src/components/views/DashboardView.tsx', 'r') as f:
    content = f.read()

# Add FileText to lucide-react imports if it's not there
if 'FileText' not in content:
    content = content.replace("FileSpreadsheet,", "FileSpreadsheet,\n  FileText,")

# Add handleExportCSV function right after handleExportExcel
csv_func = """
  // 5. CSV Export Functionality (Dashboard KPI Summary)
  const handleExportCSV = () => {
    const wb = XLSX.utils.book_new();
    const dateStamp = new Date().toISOString().slice(0, 10);
    
    const kpiData = [
      ['কোম্পানি নাম (Company Name)', settings.companyNameBangla || 'Food ERP System'],
      ['রিপোর্ট ধরন (Report Type)', 'Dashboard Executive Summary'],
      ['তারিখ (Date)', dateStamp],
      [''],
      ['প্রধান মেট্রিক্স (KPIs)', 'পরিমাণ (Amount / Taka)', 'মন্তব্য (Remarks)'],
      ['মোট ব্যাংক জমা (Cash at Bank)', totalBankBalance, `${safeBankAccounts.length} Accounts`],
      ["আজকের বিক্রয় (Today's Sales)", dynamicTodaySales, `${todaySalesCount} Invoices`],
      ['পেন্ডিং অর্ডার (Pending Orders)', pendingOrdersCount, `Total Value: ${pendingOrdersValue}`],
      ['সার্বমোট সম্পদ (Total Assets)', totalAssetsValue, `Current: ${totalCurrentAssets}, Fixed: ${totalFixedAssets}`],
      ['মোট বিক্রয় (Total Sales)', overallSalesTotal, `Total Invoices: ${safeSales.length}`],
      ['মোট ক্রয় (Total Purchase)', overallPurchaseTotal, `Total Bills: ${safePurchases.length}`],
      ['আজকের ক্রয় (Today Purchase)', todayPurchaseTotal, 'Supplier Bills'],
      ['মোট নিট লাভ (Net Profit)', pnl.netProfit, `${pnl.profitMarginPercent.toFixed(1)}% Margin`],
      ['মোট নিট ক্ষতি (Net Loss)', totalLossAmount, isLoss ? 'Loss' : 'No Net Loss'],
      ['গ্রস প্রফিট (Gross Profit)', pnl.grossProfit, 'Sales - COGS'],
      ['মোট পরিচালন খরচ (Operating Expenses)', pnl.totalOperatingExpenses, 'Daily, HR, Utility'],
      ['হাতে নগদ ক্যাশ (Cash in Hand)', cashInHand, 'Cash Box Balance'],
      ['মোট তারল্য (Total Cash & Bank)', totalCashAndBankBalance, 'Total Liquidity'],
      ['মোট কাস্টমার বকেয়া পাওনা (Receivables)', totalReceivableDues, `${safeCustomers.filter(c => c.currentDue > 0).length} Customers`],
      ['মোট সাপ্লায়ার দেনা (Payables)', totalPayableDues, `${safeSuppliers.filter(s => s.currentPayable > 0).length} Suppliers`],
      ['মোট ইনভেন্টরি স্টক মূল্য (Stock Value)', totalStockValue, `${safeProducts.length} Items`],
    ];
    
    const wsKPI = XLSX.utils.aoa_to_sheet(kpiData);
    XLSX.utils.book_append_sheet(wb, wsKPI, 'Summary');
    
    XLSX.writeFile(wb, `Food_ERP_Dashboard_Report_${dateStamp}.csv`, { bookType: 'csv' });
  };
"""

content = content.replace("  const handlePrint = () => {", csv_func + "\n  const handlePrint = () => {")

# Add the button in the UI next to Print button
button_html = """          {/* CSV Export Button */}
          <button
            id="btn-dashboard-csv"
            onClick={handleExportCSV}
            title="সকল ডেটা CSV ফাইলে ডাউনলোড করুন"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
          >
            <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span>CSV</span>
          </button>
"""

content = content.replace("          {/* PDF Download Button */}", button_html + "\n          {/* PDF Download Button */}")

with open('src/components/views/DashboardView.tsx', 'w') as f:
    f.write(content)

