import re

with open('src/components/views/ReportsView.tsx', 'r') as f:
    content = f.read()

# Add imports for MonthlyTrends and pushFinancialDataToSheet
import_add = """import { AIInsightsTab } from './reports/AIInsightsTab';
import { calculateMonthlyTrends } from './reports/reportUtils';
import { pushFinancialDataToSheet } from '../../services/googleSheetsService';
import { RefreshCw, ExternalLink } from 'lucide-react';"""

content = content.replace("import { AIInsightsTab } from './reports/AIInsightsTab';", import_add)

# Add state and logic for syncing
state_add = """  const pnlSummary = getPnLSummary ? getPnLSummary() : {
    netSales: 0,
    grossProfit: 0,
    profitMarginPercent: 0,
    operatingExpenses: { total: 0 },
    netProfit: 0,
  };

  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [sheetsUrl, setSheetsUrl] = useState<string | null>(null);
  
  const handleSyncToSheets = async () => {
    setIsSyncingSheets(true);
    setSheetsUrl(null);
    try {
      const monthlyData = calculateMonthlyTrends({
        sales, expenses, utilityBills, salaryRecords, employees,
        transportTrips, products, ownerWithdrawals: [], wastageRecords: [], monthsCount: 12
      });
      
      const dashboardData = [
        ['Metric', 'Value', 'Generated At'],
        ['Total Sales Revenue', pnlSummary.netSales, new Date().toLocaleString()],
        ['Gross Profit', pnlSummary.grossProfit, ''],
        ['Operating Expenses', pnlSummary.operatingExpenses.total, ''],
        ['Net Profit', pnlSummary.netProfit, ''],
        ['Profit Margin', `${pnlSummary.profitMarginPercent.toFixed(1)}%`, ''],
        ['Net Working Capital', totalCashAndBankBalance + totalReceivables - totalPayables, '']
      ];

      const ledgerHeader = ['Month', 'Revenue', 'COGS', 'Gross Profit', 'Operating Expenses', 'Salaries', 'Utilities', 'Net Profit'];
      const ledgerData = [
        ledgerHeader,
        ...monthlyData.map(m => [
          m.monthLabel,
          m.revenue,
          m.cogs,
          m.grossProfit,
          m.operatingExpenses,
          m.salaries,
          m.utilitiesRent,
          m.netProfit
        ])
      ];

      const res = await pushFinancialDataToSheet(settings.companyNameBangla || 'FoodERP', dashboardData, ledgerData);
      if (res.success) {
        setSheetsUrl(res.url);
        alert('Google Sheets এ সফলভাবে ডেটা সিঙ্ক হয়েছে!');
      }
    } catch (err: any) {
      alert(`Google Sheets সিঙ্ক ব্যর্থ হয়েছে: ${err.message}`);
    } finally {
      setIsSyncingSheets(false);
    }
  };"""

content = content.replace("""  const pnlSummary = getPnLSummary ? getPnLSummary() : {
    netSales: 0,
    grossProfit: 0,
    profitMarginPercent: 0,
    operatingExpenses: { total: 0 },
    netProfit: 0,
  };""", state_add)

button_add = """                <Mail className="w-4 h-4" />
                <span>Email সামারি</span>
              </a>
            );
          })()}
          
          {/* Sync to Sheets Button */}
          <button
            onClick={handleSyncToSheets}
            disabled={isSyncingSheets}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs disabled:opacity-50"
            title="Google Sheets এ লাইভ রিপোর্ট সিঙ্ক করুন"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncingSheets ? 'animate-spin' : ''}`} />
            <span>{isSyncingSheets ? 'Syncing...' : 'Sheets Sync'}</span>
          </button>
          
          {sheetsUrl && (
            <a
              href={sheetsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors shadow-xs"
              title="Open Google Sheet"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open Sheet</span>
            </a>
          )}
        </div>"""

content = content.replace("""                <Mail className="w-4 h-4" />
                <span>Email সামারি</span>
              </a>
            );
          })()}
        </div>""", button_add)

with open('src/components/views/ReportsView.tsx', 'w') as f:
    f.write(content)
