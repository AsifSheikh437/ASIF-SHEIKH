with open('src/components/common/DataExportToolbar.tsx', 'r') as f:
    content = f.read()

# Add import for generic PDF generator
import_str = "import { generateGenericPDF } from '../../utils/genericPdfGenerator';\n"
if "generateGenericPDF" not in content:
    content = content.replace("import { triggerPrint }", import_str + "import { triggerPrint }")

# Update handlePDF to use generic PDF generator
handlepdf_find = """  const handlePDF = () => {
    if (onPdfClick) {
      onPdfClick();
    } else {
      triggerPrint();
    }
  };"""
handlepdf_repl = """  const handlePDF = () => {
    if (onPdfClick) {
      onPdfClick();
    } else {
      const table = getTableData();
      if (!table) { alert('এক্সপোর্ট করার মত ডাটা পাওয়া যায়নি।'); return; }
      generateGenericPDF(filename, table as HTMLTableElement, settings);
    }
  };"""
content = content.replace(handlepdf_find, handlepdf_repl)

# Update styling of the container to be floating
# Currently: className="flex flex-wrap items-center justify-end gap-2 mb-4 no-print bg-slate-50 p-2 rounded-xl border border-slate-200"
# Floating: className="fixed bottom-6 right-6 z-50 flex items-center gap-2 p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 no-print transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)]"

ui_find = 'className="flex flex-wrap items-center justify-end gap-2 mb-4 no-print bg-slate-50 p-2 rounded-xl border border-slate-200"'
ui_repl = 'className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 flex flex-wrap items-center justify-end gap-2 p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/60 no-print transition-all"'
content = content.replace(ui_find, ui_repl)

with open('src/components/common/DataExportToolbar.tsx', 'w') as f:
    f.write(content)
