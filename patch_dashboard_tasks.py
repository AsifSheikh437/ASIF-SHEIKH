import re

with open('src/components/views/DashboardView.tsx', 'r') as f:
    content = f.read()

# 1. Imports
if 'Bell' not in content:
    content = content.replace("  ListTodo,\n  ArrowRight,", "  ListTodo,\n  ArrowRight,\n  Bell,\n  AlertCircle,")

# 2. useERP destruct
content = content.replace("    purchases,", "    purchases,\n    productionRuns,")

# 3. Compute tasks
tasks_compute = """  const totalAssetsValue = totalCurrentAssets + totalFixedAssets;

  // Compute Tasks and Reminders
  const tasksAndReminders = useMemo(() => {
    const tasks = [];
    
    // 1. Pending Supplier Payments
    const pendingPurchases = (purchases || []).filter(p => p.dueAmount > 0 && p.visualStatus !== 'PAID');
    pendingPurchases.forEach(p => {
      tasks.push({
        id: `pay-${p.id}`,
        title: `বকেয়া পেমেন্ট: ${p.supplierName}`,
        description: `ইনভয়েস ${p.billNo} - বকেয়া ৳${p.dueAmount.toLocaleString('en-IN')}`,
        type: 'PAYMENT',
        date: p.date,
        priority: p.dueAmount > 50000 ? 'HIGH' : 'MEDIUM'
      });
    });

    // 2. Upcoming / Recent Production Batches
    // Just show the most recent planned or produced batches as reminders
    const recentRuns = (productionRuns || []).slice(0, 3);
    recentRuns.forEach(r => {
      tasks.push({
        id: `prod-${r.id}`,
        title: `প্রোডাকশন ব্যাচ: ${r.recipeName}`,
        description: `ব্যাচ ${r.batchNo} - ${r.producedQuantity} ${r.unit} উৎপাদিত`,
        type: 'PRODUCTION',
        date: r.date,
        priority: 'LOW'
      });
    });
    
    // Sort by priority and date
    return tasks.sort((a, b) => {
      const pMap = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      if (pMap[a.priority] !== pMap[b.priority]) {
        return pMap[b.priority] - pMap[a.priority];
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }).slice(0, 5); // Limit to top 5
  }, [purchases, productionRuns]);"""

content = content.replace("  const totalAssetsValue = totalCurrentAssets + totalFixedAssets;", tasks_compute)


# 4. UI Wrapper
ui_old_start = """      {/* RECENT TRANSACTIONS WIDGET */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs mb-6 page-break-inside-avoid">"""
ui_new_start = """      {/* RECENT TRANSACTIONS & TASKS WIDGET */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs page-break-inside-avoid">"""
content = content.replace(ui_old_start, ui_new_start)

# Finding the end of the recent transactions table div to close the lg:col-span-2 and start lg:col-span-1
ui_old_end = """              )}
            </tbody>
          </table>
        </div>
      </div>"""
ui_new_end = """              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* TASKS & REMINDERS WIDGET */}
      <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs page-break-inside-avoid flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
              টাস্ক ও রিমাইন্ডার (Tasks)
            </h3>
          </div>
          <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {tasksAndReminders.length} Pending
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          {tasksAndReminders.length > 0 ? (
            tasksAndReminders.map(task => (
              <div key={task.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex gap-3 hover:shadow-sm transition-all">
                <div className="shrink-0 mt-0.5">
                  {task.type === 'PAYMENT' ? (
                    <AlertCircle className={`w-4 h-4 ${task.priority === 'HIGH' ? 'text-rose-500' : 'text-amber-500'}`} />
                  ) : (
                    <Boxes className="w-4 h-4 text-indigo-500" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight mb-1">
                    {task.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {task.description}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-mono">
                    {new Date(task.date).toLocaleDateString('bn-BD')}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 py-10">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 opacity-50" />
              <p className="text-xs">কোনো পেন্ডিং টাস্ক নেই!</p>
            </div>
          )}
        </div>
      </div>
    </div>"""

content = content.replace(ui_old_end, ui_new_end)

with open('src/components/views/DashboardView.tsx', 'w') as f:
    f.write(content)

