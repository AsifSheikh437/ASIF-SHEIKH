with open('src/components/common/DataExportToolbar.tsx', 'r') as f:
    content = f.read()

# Replace the fixed class with a flex inline class
content = content.replace('className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 flex flex-wrap items-center justify-end gap-2 p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/60 no-print transition-all"',
                          'className="flex flex-wrap items-center gap-2 mb-3 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs no-print transition-all"')

with open('src/components/common/DataExportToolbar.tsx', 'w') as f:
    f.write(content)

