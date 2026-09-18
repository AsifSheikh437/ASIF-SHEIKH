import re

with open('src/components/views/DashboardView.tsx', 'r') as f:
    content = f.read()

alert_code = """
        {/* DASHBOARD NOTIFICATION SYSTEM: LOW STOCK ALERTS */}
        {lowStockCount > 0 && (
          <div className="mb-6 bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-950/40 dark:to-orange-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 shadow-sm relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10 pointer-events-none">
              <AlertTriangle className="w-32 h-32 text-rose-600" />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                  </span>
                  <h3 className="text-rose-800 dark:text-rose-300 font-black text-sm uppercase tracking-wide">
                    প্রোঅ্যাকটিভ পারচেজিং অ্যালার্ট (Proactive Purchasing Alert)
                  </h3>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-sm font-medium mb-3">
                  আপনার ইনভেন্টরিতে <span className="font-black text-rose-600 dark:text-rose-400 text-base">{lowStockCount}টি</span> পণ্য সর্বনিম্ন স্টকের (Minimum Threshold) নিচে নেমে এসেছে। নিরবচ্ছিন্ন উৎপাদন ও বিক্রি চালু রাখতে এখনই এগুলো রি-অর্ডার করুন।
                </p>
                
                <div className="flex flex-wrap gap-2 mb-2 md:mb-0">
                  {lowStockProducts.slice(0, 5).map(p => (
                    <div key={p.id} className="bg-white/80 dark:bg-slate-900/80 border border-rose-100 dark:border-rose-800 rounded-lg px-2.5 py-1.5 text-xs flex items-center gap-2 shadow-sm">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{p.nameBangla}</span>
                      <span className="bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 px-1.5 py-0.5 rounded font-mono font-bold">
                        {p.currentStock} {p.unit}
                      </span>
                    </div>
                  ))}
                  {lowStockCount > 5 && (
                    <div className="bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs flex items-center shadow-sm text-slate-600 dark:text-slate-400 font-bold">
                      +{lowStockCount - 5} আরও
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex-shrink-0 md:pl-5 md:border-l md:border-rose-200/60 dark:md:border-rose-800/60 flex flex-col items-center justify-center min-w-[220px]">
                <button
                  onClick={() => setShowRequisitionModal(true)}
                  className="w-full group flex items-center justify-center gap-2 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                >
                  <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  ১-ক্লিক রিকুইজিশন
                </button>
                <button 
                  onClick={() => setActiveModule('INVENTORY')}
                  className="mt-3 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 underline underline-offset-2 transition-colors"
                >
                  ইনভেন্টরি স্টক যাচাই করুন →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ROW 1: THE 4 DYNAMIC PRIMARY KPI CARDS */}"""

old_target = """        {/* ROW 1: THE 4 DYNAMIC PRIMARY KPI CARDS */}"""

if old_target in content:
    content = content.replace(old_target, alert_code)
    with open('src/components/views/DashboardView.tsx', 'w') as f:
        f.write(content)
    print("Injected successfully.")
else:
    print("Could not find the target string.")
