import re

with open('src/components/common/DataExportToolbar.tsx', 'r') as f:
    content = f.read()

import_str = "import React, { useState } from 'react';\n"
content = content.replace("import React from 'react';", import_str)

import_modal = "import { PdfPreviewModal } from './PdfPreviewModal';\n"
content = content.replace("import { generateGenericPDF }", import_modal + "import { generateGenericPDF }")

state_add = """export const DataExportToolbar: React.FC<DataExportToolbarProps> = ({ filename, tableSelector = 'table', onPdfClick }) => {
  const [pdfPreviewBlob, setPdfPreviewBlob] = useState<Blob | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);"""
content = content.replace("export const DataExportToolbar: React.FC<DataExportToolbarProps> = ({ filename, tableSelector = 'table', onPdfClick }) => {", state_add)

handle_pdf_find = """  const handlePDF = () => {
    if (onPdfClick) {
      onPdfClick();
    } else {
      const table = getTableData();
      if (!table) { alert('এক্সপোর্ট করার মত ডাটা পাওয়া যায়নি।'); return; }
      generateGenericPDF(filename, table as HTMLTableElement, settings);
    }
  };"""
handle_pdf_repl = """  const handlePDF = () => {
    if (onPdfClick) {
      onPdfClick();
    } else {
      const table = getTableData();
      if (!table) { alert('এক্সপোর্ট করার মত ডাটা পাওয়া যায়নি।'); return; }
      const blob = generateGenericPDF(filename, table as HTMLTableElement, settings, true) as Blob;
      if (blob) {
        setPdfPreviewBlob(blob);
        setIsPreviewOpen(true);
      }
    }
  };"""
content = content.replace(handle_pdf_find, handle_pdf_repl)

return_find = """      <button onClick={handleGmail} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[11px] font-bold rounded-lg shadow-sm transition-colors" title="Gmail এ শেয়ার করুন">
        <Mail className="w-3.5 h-3.5" /> Gmail
      </button>
    </div>
  );"""
return_repl = """      <button onClick={handleGmail} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[11px] font-bold rounded-lg shadow-sm transition-colors" title="Gmail এ শেয়ার করুন">
        <Mail className="w-3.5 h-3.5" /> Gmail
      </button>

      <PdfPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        pdfBlob={pdfPreviewBlob}
        filename={`${filename}.pdf`}
        title="রিপোর্ট প্রিভিউ (Report Preview)"
      />
    </div>
  );"""
content = content.replace(return_find, return_repl)

with open('src/components/common/DataExportToolbar.tsx', 'w') as f:
    f.write(content)
