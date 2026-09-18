import re

with open('src/components/views/reports/MonthlyDashboardTab.tsx', 'r') as f:
    content = f.read()

new_chart = """        </div>
        
        {/* NEW: Revenue vs Operational Expenses Bar Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                মাসিক রাজস্ব বনাম পরিচালন ব্যয় (Revenue vs Operational Expenses)
              </h4>
              <p className="text-[11px] text-slate-500">
                প্রতি মাসের আয় এবং ব্যয়ের সরাসরি তুলনামূলক বিশ্লেষণ
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-md bg-indigo-600"></span> রাজস্ব (Revenue)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-md bg-rose-500"></span> ব্যয় (Expenses)
              </span>
            </div>
          </div>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e2e4f' : '#f1f5f9'} />
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fontSize: 10, fill: theme === 'dark' ? '#94a3b8' : '#64748b' }}
                  angle={-20}
                  textAnchor="end"
                  height={45}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: theme === 'dark' ? '#94a3b8' : '#64748b' }}
                  tickFormatter={v => `৳${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: number, name: string) => [`৳${val.toLocaleString('en-IN')}`, name === 'revenue' ? 'রাজস্ব' : 'পরিচালন ব্যয়']}
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#0d1527' : '#ffffff',
                    borderColor: theme === 'dark' ? '#1e2e4f' : '#e2e8f0',
                    color: theme === 'dark' ? '#f8fafc' : '#1e293b',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.4)',
                  }}
                  labelStyle={{ fontWeight: 'bold', color: theme === 'dark' ? '#38bdf8' : '#1e293b' }}
                />
                <Bar dataKey="revenue" name="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="operatingExpenses" name="operatingExpenses" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Month Cards Grid (Interactive Drilldown) */}"""

content = content.replace("        </div>\n\n        {/* Month Cards Grid (Interactive Drilldown) */}", new_chart)
content = content.replace("        </div>\n        {/* Month Cards Grid (Interactive Drilldown) */}", new_chart)


with open('src/components/views/reports/MonthlyDashboardTab.tsx', 'w') as f:
    f.write(content)
