import re

with open('src/utils/invoicePdfGenerator.ts', 'r') as f:
    content = f.read()

save1_find = "  if (returnBlob) return doc.output('blob');\n  doc.save(`Invoice_${sale.invoiceNo}.pdf`);\n};"
save1_repl = """  const blob = doc.output('blob');
  if (returnBlob) return blob;
  window.dispatchEvent(new CustomEvent('preview-pdf', {
    detail: { blob, filename: `Invoice_${sale.invoiceNo}.pdf`, title: `Invoice Preview - ${sale.invoiceNo}` }
  }));
};"""
content = content.replace(save1_find, save1_repl)


save2_find = "  if (returnBlob) return doc.output('blob');\n  doc.save(`Batch_Invoices_${new Date().toISOString().substring(0, 10)}.pdf`);\n};"
save2_repl = """  const blob = doc.output('blob');
  if (returnBlob) return blob;
  window.dispatchEvent(new CustomEvent('preview-pdf', {
    detail: { blob, filename: `Batch_Invoices_${new Date().toISOString().substring(0, 10)}.pdf`, title: `Batch Invoices Preview` }
  }));
};"""
content = content.replace(save2_find, save2_repl)

with open('src/utils/invoicePdfGenerator.ts', 'w') as f:
    f.write(content)
