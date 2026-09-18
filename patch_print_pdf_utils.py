import re

with open('src/utils/printPdfUtils.ts', 'r') as f:
    content = f.read()

export_find = """  try {
    const pdfOptions: PDFOptions = typeof options === 'string' ? { filename: options } : options;
    const { blob, filename } = await generatePDFBlob(elementOrId, pdfOptions);
    downloadPDFBlob(blob, filename);
    return true;"""
export_repl = """  try {
    const pdfOptions: PDFOptions = typeof options === 'string' ? { filename: options } : options;
    const { blob, filename } = await generatePDFBlob(elementOrId, pdfOptions);
    
    // Dispatch event to show the preview modal
    window.dispatchEvent(new CustomEvent('preview-pdf', {
      detail: { blob, filename, title: 'Report Preview' }
    }));
    
    return true;"""
content = content.replace(export_find, export_repl)

with open('src/utils/printPdfUtils.ts', 'w') as f:
    f.write(content)
