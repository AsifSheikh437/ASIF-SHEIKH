with open('src/utils/invoicePdfGenerator.ts', 'r') as f:
    content = f.read()

import re

# Find and replace address handling in standard invoice
standard_header_find = """    doc.text(safeString(settings.companyNameEnglish || settings.companyNameBangla || 'Company Name'), 14, 30);
    doc.text(safeString(settings.address), 14, 35);
    doc.text(`Phone: ${safeString(settings.phone)}`, 14, 40);
    if (settings.email) {
      doc.text(`Email: ${safeString(settings.email)}`, 14, 45);
    }"""
standard_header_repl = """    doc.text(safeString(settings.companyNameEnglish || settings.companyNameBangla || 'Company Name'), 14, 30);
    let currentY = 35;
    if (settings.pdfPrintConfig?.showAddress !== false) {
      doc.text(safeString(settings.address), 14, currentY);
      currentY += 5;
    }
    if (settings.pdfPrintConfig?.showContact !== false) {
      doc.text(`Phone: ${safeString(settings.phone)}`, 14, currentY);
      currentY += 5;
      if (settings.email) {
        doc.text(`Email: ${safeString(settings.email)}`, 14, currentY);
        currentY += 5;
      }
    }"""
content = content.replace(standard_header_find, standard_header_repl)

# Update POS invoice logic
pos_header_find = """    // Company Details
    doc.setFontSize(8);
    let yPos = 18;
    
    // Address
    const addressLines = doc.splitTextToSize(safeString(settings.address), 60);
    addressLines.forEach((line: string) => {
      doc.text(line, centerX, yPos, { align: 'center' });
      yPos += 4;
    });

    doc.text(`Phone: ${safeString(settings.phone)}`, centerX, yPos, { align: 'center' });
    yPos += 4;"""
pos_header_repl = """    // Company Details
    doc.setFontSize(8);
    let yPos = 18;
    
    // Address
    if (settings.pdfPrintConfig?.showAddress !== false) {
      const addressLines = doc.splitTextToSize(safeString(settings.address), 60);
      addressLines.forEach((line: string) => {
        doc.text(line, centerX, yPos, { align: 'center' });
        yPos += 4;
      });
    }

    if (settings.pdfPrintConfig?.showContact !== false) {
      doc.text(`Phone: ${safeString(settings.phone)}`, centerX, yPos, { align: 'center' });
      yPos += 4;
    }"""
content = content.replace(pos_header_find, pos_header_repl)

with open('src/utils/invoicePdfGenerator.ts', 'w') as f:
    f.write(content)
