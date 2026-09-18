import re

with open('src/utils/invoicePdfGenerator.ts', 'r') as f:
    content = f.read()

sig1_find = "export const generateProfessionalInvoicePDF = (sale: Sale, settings: CompanySettings) => {"
sig1_repl = "export const generateProfessionalInvoicePDF = (sale: Sale, settings: CompanySettings, returnBlob: boolean = false): Blob | void => {"
content = content.replace(sig1_find, sig1_repl)

save1_find = "  doc.save(`Invoice_${sale.invoiceNo}.pdf`);\n};"
save1_repl = "  if (returnBlob) return doc.output('blob');\n  doc.save(`Invoice_${sale.invoiceNo}.pdf`);\n};"
content = content.replace(save1_find, save1_repl)

sig2_find = "export const generateBatchProfessionalInvoicesPDF = (sales: Sale[], settings: CompanySettings) => {"
sig2_repl = "export const generateBatchProfessionalInvoicesPDF = (sales: Sale[], settings: CompanySettings, returnBlob: boolean = false): Blob | void => {"
content = content.replace(sig2_find, sig2_repl)

save2_find = "  doc.save(`Batch_Invoices_${new Date().toISOString().substring(0, 10)}.pdf`);\n};"
save2_repl = "  if (returnBlob) return doc.output('blob');\n  doc.save(`Batch_Invoices_${new Date().toISOString().substring(0, 10)}.pdf`);\n};"
content = content.replace(save2_find, save2_repl)

with open('src/utils/invoicePdfGenerator.ts', 'w') as f:
    f.write(content)
