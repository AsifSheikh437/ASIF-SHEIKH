import re

with open('src/components/views/DashboardView.tsx', 'r') as f:
    content = f.read()

# Destructure it
content = content.replace("const { sales, purchases, totalCashAndBankBalance } = useERP();", "const { sales, purchases, totalCashAndBankBalance, toggleTransactionVisualStatus } = useERP();")

# Map it in combined array
map_sale_old = """      ...safeSales.map(s => ({
        id: s.id,
        date: s.date,
        type: 'SALE' as const,
        invoiceNo: s.invoiceNo,
        partyName: s.customerName,
        amount: s.grandTotal
      })),"""
map_sale_new = """      ...safeSales.map(s => ({
        id: s.id,
        date: s.date,
        type: 'SALE' as const,
        invoiceNo: s.invoiceNo,
        partyName: s.customerName,
        amount: s.grandTotal,
        visualStatus: s.visualStatus || (s.dueAmount <= 0 ? 'PAID' : 'PENDING')
      })),"""
content = content.replace(map_sale_old, map_sale_new)

map_pur_old = """      ...safePurchases.map(p => ({
        id: p.id,
        date: p.date,
        type: 'PURCHASE' as const,
        invoiceNo: p.billNo,
        partyName: p.supplierName,
        amount: p.grandTotal
      }))"""
map_pur_new = """      ...safePurchases.map(p => ({
        id: p.id,
        date: p.date,
        type: 'PURCHASE' as const,
        invoiceNo: p.billNo,
        partyName: p.supplierName,
        amount: p.grandTotal,
        visualStatus: p.visualStatus || (p.dueAmount <= 0 ? 'PAID' : 'PENDING')
      }))"""
content = content.replace(map_pur_old, map_pur_new)

# Table Header
content = content.replace("<th className=\"p-3 text-right\">অ্যামাউন্ট</th>", "<th className=\"p-3 text-right\">অ্যামাউন্ট</th>\n              <th className=\"p-3 text-center\">স্ট্যাটাস</th>")

# Table Row
table_td_old = """                  <td className="p-3 text-right font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(tx.amount)}
                  </td>
                </tr>"""

table_td_new = """                  <td className="p-3 text-right font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(tx.amount)}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => toggleTransactionVisualStatus(tx.id, tx.type)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all shadow-xs hover:shadow-md active:scale-95 ${
                        tx.visualStatus === 'PAID' 
                          ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border border-teal-200 dark:border-teal-800'
                          : tx.visualStatus === 'OVERDUE'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                      }`}
                    >
                      {tx.visualStatus === 'PAID' ? 'Paid' : tx.visualStatus === 'OVERDUE' ? 'Overdue' : 'Pending'}
                    </button>
                  </td>
                </tr>"""
content = content.replace(table_td_old, table_td_new)


with open('src/components/views/DashboardView.tsx', 'w') as f:
    f.write(content)

