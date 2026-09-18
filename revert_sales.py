import re

with open('src/components/views/SalesInvoiceView.tsx', 'r') as f:
    content = f.read()

# Remove import
content = content.replace("import { PdfPreviewModal } from '../common/PdfPreviewModal';\n", "")

# Remove state
state_find = """  const [pdfPreviewBlob, setPdfPreviewBlob] = useState<Blob | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);"""
content = content.replace(state_find, "")

# Remove handler
handle_pdf = """  const handleOpenPdfPreview = (sale: Sale) => {
    const blob = generateProfessionalInvoicePDF(sale, settings, true) as Blob;
    if (blob) {
      setPdfPreviewBlob(blob);
      setIsPreviewOpen(true);
    }
  };

  const handleOpenBatchPdfPreview = (sales: Sale[]) => {
    const blob = generateBatchProfessionalInvoicesPDF(sales, settings, true) as Blob;
    if (blob) {
      setPdfPreviewBlob(blob);
      setIsPreviewOpen(true);
    }
  };"""
content = content.replace(handle_pdf, "")

# Revert onClick
content = content.replace("handleOpenPdfPreview(previewSale)", "generateProfessionalInvoicePDF(previewSale, settings)")
content = content.replace("handleOpenBatchPdfPreview(salesToPrint)", "generateBatchProfessionalInvoicesPDF(salesToPrint, settings)")

# Remove JSX
jsx = """      <PdfPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        pdfBlob={pdfPreviewBlob}
        filename={`Invoice_${previewSale?.invoiceNo || 'Draft'}.pdf`}
        title="ইনভয়েস প্রিভিউ (Invoice Preview)"
      />"""
content = content.replace(jsx, "")

with open('src/components/views/SalesInvoiceView.tsx', 'w') as f:
    f.write(content)
