import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Sale, CompanySettings } from '../types';

// Helper to format currency safely for jsPDF without Unicode fonts
const formatPDFCurrency = (amount: number): string => {
  return 'BDT ' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Map Bengali to English for common units if needed, or just let them print.
// Note: Bengali text will likely not render correctly in standard jsPDF without a unicode font.
// We will strip or transliterate if necessary, but for now we'll just output the raw string.
const safeString = (str: string | undefined): string => {
  if (!str) return '';
  return str;
};

export const generateProfessionalInvoicePDF = (sale: Sale, settings: CompanySettings, returnBlob: boolean = false): Blob | void => {
  const doc = new jsPDF();
  
  // Set document properties
  doc.setProperties({
    title: `Invoice_${sale.invoiceNo}`,
    subject: 'Sales Invoice',
    author: settings.companyNameEnglish || 'Company',
  });

  // Header
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('INVOICE', 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  
  // Company Info
  doc.text(safeString(settings.companyNameEnglish || settings.companyNameBangla || 'Company Name'), 14, 30);
  doc.text(safeString(settings.address), 14, 35);
  doc.text(`Phone: ${safeString(settings.phone)}`, 14, 40);
  if (settings.email) {
    doc.text(`Email: ${safeString(settings.email)}`, 14, 45);
  }

  // Invoice Details
  const rightColumnX = 140;
  doc.text(`Invoice No: ${sale.invoiceNo}`, rightColumnX, 30);
  doc.text(`Date: ${new Date(sale.date).toLocaleDateString('en-GB')}`, rightColumnX, 35);
  doc.text(`Payment Method: ${sale.paymentMethod}`, rightColumnX, 40);
  
  let statusText = 'PAID';
  if (sale.dueAmount > 0) {
    statusText = sale.paidAmount > 0 ? 'PARTIAL' : 'DUE';
  }
  doc.text(`Status: ${statusText}`, rightColumnX, 45);

  // Bill To
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Bill To:', 14, 60);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Customer: ${safeString(sale.customerName)}`, 14, 66);
  if (sale.customerPhone) {
    doc.text(`Phone: ${safeString(sale.customerPhone)}`, 14, 71);
  }

  // Table
  const tableData = sale.items.map((item, index) => [
    (index + 1).toString(),
    safeString(item.productName),
    safeString(item.batchNumber || '-'),
    `${item.quantity} ${item.unit}`,
    formatPDFCurrency(item.unitPrice),
    formatPDFCurrency(item.total)
  ]);

  (doc as any).autoTable({
    startY: 85,
    head: [['#', 'Item Description', 'Batch', 'Qty', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [13, 148, 136], textColor: [255, 255, 255] }, // teal-600
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 25 },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 35, halign: 'right' },
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY || 85;

  // Totals
  const totalX = 135;
  const valX = 196;
  
  let currentY = finalY + 10;
  
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  
  doc.text('Subtotal:', totalX, currentY);
  doc.text(formatPDFCurrency(sale.subTotal), valX, currentY, { align: 'right' });
  
  if (sale.discountAmount > 0) {
    currentY += 6;
    doc.text(`Discount (${sale.discountType === 'PERCENT' ? sale.discountValue + '%' : 'Flat'}):`, totalX, currentY);
    doc.text('-' + formatPDFCurrency(sale.discountAmount), valX, currentY, { align: 'right' });
  }

  if (sale.vatAmount > 0) {
    currentY += 6;
    doc.text(`VAT (${sale.vatPercent}%):`, totalX, currentY);
    doc.text('+' + formatPDFCurrency(sale.vatAmount), valX, currentY, { align: 'right' });
  }

  if (sale.transportCost > 0) {
    currentY += 6;
    doc.text('Transport/Delivery:', totalX, currentY);
    doc.text('+' + formatPDFCurrency(sale.transportCost), valX, currentY, { align: 'right' });
  }

  currentY += 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Grand Total:', totalX, currentY);
  doc.text(formatPDFCurrency(sale.grandTotal), valX, currentY, { align: 'right' });

  currentY += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Paid Amount:', totalX, currentY);
  doc.text(formatPDFCurrency(sale.paidAmount), valX, currentY, { align: 'right' });

  currentY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(sale.dueAmount > 0 ? 225 : 15, sale.dueAmount > 0 ? 29 : 23, sale.dueAmount > 0 ? 72 : 42);
  doc.text('Due Amount:', totalX, currentY);
  doc.text(formatPDFCurrency(sale.dueAmount), valX, currentY, { align: 'right' });

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Thank you for your business!', 14, 280);
  doc.text('This is a system generated invoice.', 14, 285);

  // Save the PDF
  const blob = doc.output('blob');
  if (returnBlob) return blob;
  window.dispatchEvent(new CustomEvent('preview-pdf', {
    detail: { blob, filename: `Invoice_${sale.invoiceNo}.pdf`, title: `Invoice Preview - ${sale.invoiceNo}` }
  }));
};

export const generateBatchProfessionalInvoicesPDF = (sales: Sale[], settings: CompanySettings, returnBlob: boolean = false): Blob | void => {
  if (!sales || sales.length === 0) return;

  const doc = new jsPDF();
  
  doc.setProperties({
    title: `Batch_Invoices`,
    subject: 'Sales Invoices Batch',
    author: settings.companyNameEnglish || 'Company',
  });

  sales.forEach((sale, index) => {
    if (index > 0) {
      doc.addPage();
    }

    // Header
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('INVOICE', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    
    // Company Info
    doc.text(safeString(settings.companyNameEnglish || settings.companyNameBangla || 'Company Name'), 14, 30);
    let headerCurrentY = 35;
    if (settings.pdfPrintConfig?.showAddress !== false) {
      doc.text(safeString(settings.address), 14, headerCurrentY);
      headerCurrentY += 5;
    }
    if (settings.pdfPrintConfig?.showContact !== false) {
      doc.text(`Phone: ${safeString(settings.phone)}`, 14, headerCurrentY);
      headerCurrentY += 5;
      if (settings.email) {
        doc.text(`Email: ${safeString(settings.email)}`, 14, headerCurrentY);
        headerCurrentY += 5;
      }
    }

    // Invoice Details
    const rightColumnX = 140;
    doc.text(`Invoice No: ${sale.invoiceNo}`, rightColumnX, 30);
    doc.text(`Date: ${new Date(sale.date).toLocaleDateString('en-GB')}`, rightColumnX, 35);
    doc.text(`Payment Method: ${sale.paymentMethod}`, rightColumnX, 40);
    
    let statusText = 'PAID';
    if (sale.dueAmount > 0) {
      statusText = sale.paidAmount > 0 ? 'PARTIAL' : 'DUE';
    }
    doc.text(`Status: ${statusText}`, rightColumnX, 45);

    // Bill To
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Bill To:', 14, 60);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Customer: ${safeString(sale.customerName)}`, 14, 66);
    if (sale.customerPhone) {
      doc.text(`Phone: ${safeString(sale.customerPhone)}`, 14, 71);
    }

    // Table
    const tableData = sale.items.map((item, itemIndex) => [
      (itemIndex + 1).toString(),
      safeString(item.productName),
      safeString(item.batchNumber || '-'),
      `${item.quantity} ${item.unit}`,
      formatPDFCurrency(item.unitPrice),
      formatPDFCurrency(item.total)
    ]);

    (doc as any).autoTable({
      startY: 85,
      head: [['#', 'Item Description', 'Batch', 'Qty', 'Unit Price', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [13, 148, 136], textColor: [255, 255, 255] }, // teal-600
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 25 },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' },
        5: { cellWidth: 35, halign: 'right' },
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 85;

    // Totals
    const totalX = 135;
    const valX = 196;
    
    let currentY = finalY + 10;
    
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    
    doc.text('Subtotal:', totalX, currentY);
    doc.text(formatPDFCurrency(sale.subTotal), valX, currentY, { align: 'right' });
    
    if (sale.discountAmount > 0) {
      currentY += 6;
      doc.text(`Discount (${sale.discountType === 'PERCENT' ? sale.discountValue + '%' : 'Flat'}):`, totalX, currentY);
      doc.text('-' + formatPDFCurrency(sale.discountAmount), valX, currentY, { align: 'right' });
    }

    if (sale.vatAmount > 0) {
      currentY += 6;
      doc.text(`VAT (${sale.vatPercent}%):`, totalX, currentY);
      doc.text('+' + formatPDFCurrency(sale.vatAmount), valX, currentY, { align: 'right' });
    }

    if (sale.transportCost > 0) {
      currentY += 6;
      doc.text('Transport/Delivery:', totalX, currentY);
      doc.text('+' + formatPDFCurrency(sale.transportCost), valX, currentY, { align: 'right' });
    }

    currentY += 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Grand Total:', totalX, currentY);
    doc.text(formatPDFCurrency(sale.grandTotal), valX, currentY, { align: 'right' });

    currentY += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Paid Amount:', totalX, currentY);
    doc.text(formatPDFCurrency(sale.paidAmount), valX, currentY, { align: 'right' });

    currentY += 6;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(sale.dueAmount > 0 ? 225 : 15, sale.dueAmount > 0 ? 29 : 23, sale.dueAmount > 0 ? 72 : 42);
    doc.text('Due Amount:', totalX, currentY);
    doc.text(formatPDFCurrency(sale.dueAmount), valX, currentY, { align: 'right' });

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Thank you for your business!', 14, 280);
    doc.text('This is a system generated invoice.', 14, 285);
  });

  // Save the PDF
  const blob = doc.output('blob');
  if (returnBlob) return blob;
  window.dispatchEvent(new CustomEvent('preview-pdf', {
    detail: { blob, filename: `Batch_Invoices_${new Date().toISOString().substring(0, 10)}.pdf`, title: `Batch Invoices Preview` }
  }));
};
