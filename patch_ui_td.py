with open('src/components/views/DashboardView.tsx', 'r') as f:
    content = f.read()

# Replace Table Header
content = content.replace('<th className="py-3 px-4 text-right">অ্যামাউন্ট</th>', '<th className="py-3 px-4 text-right">অ্যামাউন্ট</th>\n              <th className="py-3 px-4 text-center">স্ট্যাটাস</th>')

# Replace Table Data
target_td = '<td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">{formatCurrency(tx.amount)}</td>\n                </tr>'

new_td = """<td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">{formatCurrency(tx.amount)}</td>
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
                      {tx.visualStatus === 'PAID' ? 'Paid' : tx.visualStatus === 'OVERDUE' ? 'Overdue' : 'Pending'}
                    </button>
                  </td>
                </tr>"""

content = content.replace(target_td, new_td)

# Update colSpan for empty state
content = content.replace('colSpan={5}', 'colSpan={6}')

with open('src/components/views/DashboardView.tsx', 'w') as f:
    f.write(content)
