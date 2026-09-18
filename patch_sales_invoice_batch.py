import re

with open('src/components/views/SalesInvoiceView.tsx', 'r') as f:
    content = f.read()

handle_batch_pdf = """  const handleOpenBatchPdfPreview = (sales: Sale[]) => {
    const blob = generateBatchProfessionalInvoicesPDF(sales, settings, true) as Blob;
    if (blob) {
      setPdfPreviewBlob(blob);
      setIsPreviewOpen(true);
    }
  };"""
content = content.replace("  const handleOpenPdfPreview = (sale: Sale) => {", handle_batch_pdf + "\n\n  const handleOpenPdfPreview = (sale: Sale) => {")

content = content.replace("generateBatchProfessionalInvoicesPDF(salesToPrint, settings);", "handleOpenBatchPdfPreview(salesToPrint);")

with open('src/components/views/SalesInvoiceView.tsx', 'w') as f:
    f.write(content)
