import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CompanySettings } from '../types';

export const generateGenericPDF = (
  title: string,
  tableElement: HTMLTableElement,
  settings: CompanySettings,
  returnBlob: boolean = false
): Blob | void => {
  const doc = new jsPDF();
  let currentY = 15;

  const pdfConfig = settings.pdfPrintConfig || {
    showAddress: true,
    showContact: true,
    showTaxId: true,
    showLogo: true,
  };

  // Company Name
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(settings.companyNameEnglish || settings.companyNameBangla || 'Company Name', 14, currentY);
  currentY += 6;

  // Address
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  if (pdfConfig.showAddress && settings.address) {
    doc.text(settings.address, 14, currentY);
    currentY += 5;
  }

  // Contact
  if (pdfConfig.showContact) {
    if (settings.phone) {
      doc.text(`Phone: ${settings.phone}`, 14, currentY);
      currentY += 5;
    }
    if (settings.email) {
      doc.text(`Email: ${settings.email}`, 14, currentY);
      currentY += 5;
    }
  }

  // Tax ID
  if (pdfConfig.showTaxId) {
    if (settings.binVatNo) {
      doc.text(`BIN/VAT: ${settings.binVatNo}`, 14, currentY);
      currentY += 5;
    }
    if (settings.tinNo) {
      doc.text(`TIN: ${settings.tinNo}`, 14, currentY);
      currentY += 5;
    }
  }

  currentY += 5;
  
  // Title
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(title, 14, currentY);
  currentY += 8;

  // Date
  doc.setFontSize(10);
  doc.text(`Generated At: ${new Date().toLocaleString()}`, 14, currentY);
  currentY += 6;

  // Extract table data
  const headers: string[][] = [];
  const rows: string[][] = [];
  
  // Clone table to ignore no-print items
  const clone = tableElement.cloneNode(true) as HTMLTableElement;
  clone.querySelectorAll('.no-print, button, input').forEach(el => el.remove());

  const thead = clone.querySelector('thead');
  if (thead) {
    const ths = thead.querySelectorAll('th');
    const headerRow = Array.from(ths).map(th => th.innerText);
    headers.push(headerRow);
  }

  const tbody = clone.querySelector('tbody');
  if (tbody) {
    const trs = tbody.querySelectorAll('tr');
    trs.forEach(tr => {
      const tds = tr.querySelectorAll('td, th');
      const row = Array.from(tds).map(td => (td as HTMLElement).innerText);
      rows.push(row);
    });
  }

  autoTable(doc, {
    head: headers,
    body: rows,
    startY: currentY + 2,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [15, 118, 110] }, // teal-700
  });

  const blob = doc.output('blob');
  if (returnBlob) {
    return blob;
  } else {
    window.dispatchEvent(new CustomEvent('preview-pdf', {
      detail: { blob, filename: `${title.replace(/ /g, '_')}_${new Date().getTime()}.pdf`, title: title }
    }));
  }
};
