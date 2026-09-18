import re

with open('src/components/views/SalesInvoiceView.tsx', 'r') as f:
    content = f.read()

import_modal = "import { PdfPreviewModal } from '../common/PdfPreviewModal';\n"
content = content.replace("import { generateProfessionalInvoicePDF", import_modal + "import { generateProfessionalInvoicePDF")

state_add = """  const [pdfPreviewBlob, setPdfPreviewBlob] = useState<Blob | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);"""
content = content.replace("const [isEmailing, setIsEmailing] = useState(false);", "const [isEmailing, setIsEmailing] = useState(false);\n" + state_add)

handle_pdf = """  const handleOpenPdfPreview = (sale: Sale) => {
    const blob = generateProfessionalInvoicePDF(sale, settings, true) as Blob;
    if (blob) {
      setPdfPreviewBlob(blob);
      setIsPreviewOpen(true);
    }
  };"""
content = content.replace("const handleEmailInvoice = async (sale: Sale) => {", handle_pdf + "\n\n  const handleEmailInvoice = async (sale: Sale) => {")

content = content.replace("onClick={() => generateProfessionalInvoicePDF(previewSale, settings)}", "onClick={() => handleOpenPdfPreview(previewSale)}")

modal_jsx = """      <PdfPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        pdfBlob={pdfPreviewBlob}
        filename={`Invoice_${previewSale?.invoiceNo || 'Draft'}.pdf`}
        title="ইনভয়েস প্রিভিউ (Invoice Preview)"
      />

    </div>
  );"""
content = content.replace("    </div>\n  );\n", modal_jsx + "\n")

with open('src/components/views/SalesInvoiceView.tsx', 'w') as f:
    f.write(content)
