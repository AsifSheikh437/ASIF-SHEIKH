import re

with open('src/components/common/DataExportToolbar.tsx', 'r') as f:
    content = f.read()

content = content.replace("import React, { useState } from 'react';", "import React from 'react';")
content = content.replace("import { PdfPreviewModal } from './PdfPreviewModal';\n", "")

state_add = """export const DataExportToolbar: React.FC<DataExportToolbarProps> = ({ filename, tableSelector = 'table', onPdfClick }) => {
  const [pdfPreviewBlob, setPdfPreviewBlob] = useState<Blob | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);"""
content = content.replace(state_add, "export const DataExportToolbar: React.FC<DataExportToolbarProps> = ({ filename, tableSelector = 'table', onPdfClick }) => {")

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
handle_pdf_find = """  const handlePDF = () => {
    if (onPdfClick) {
      onPdfClick();
    } else {
      const table = getTableData();
      if (!table) { alert('এক্সপোর্ট করার মত ডাটা পাওয়া যায়নি।'); return; }
      generateGenericPDF(filename, table as HTMLTableElement, settings);
    }
  };"""
content = content.replace(handle_pdf_repl, handle_pdf_find)


jsx = """      <PdfPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        pdfBlob={pdfPreviewBlob}
        filename={`${filename}.pdf`}
        title="রিপোর্ট প্রিভিউ (Report Preview)"
      />"""
content = content.replace(jsx, "")

with open('src/components/common/DataExportToolbar.tsx', 'w') as f:
    f.write(content)
