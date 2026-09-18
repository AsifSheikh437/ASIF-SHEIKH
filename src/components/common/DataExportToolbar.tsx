import React from 'react';

import { Download, FileText, Printer, FileSpreadsheet, Share2, Mail } from 'lucide-react';
import * as XLSX from 'xlsx';
import { generateGenericPDF } from '../../utils/genericPdfGenerator';
import { triggerPrint } from '../../utils/formatters';
import { useERP } from '../../context/ERPContext';

interface DataExportToolbarProps {
  filename: string;
  tableSelector?: string;
  onPdfClick?: () => void;
  onExcelClick?: () => void;
}

export const DataExportToolbar: React.FC<DataExportToolbarProps> = ({
  filename,
  tableSelector = 'table',
  onPdfClick,
  onExcelClick
}) => {
  const { settings } = useERP();
  
  const getTableData = () => {
    const tables = document.querySelectorAll(tableSelector);
    let table: Element | null = null;
    for (let i = 0; i < tables.length; i++) {
      const rect = (tables[i] as HTMLElement).getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        table = tables[i];
        break;
      }
    }
    if (!table && tables.length > 0) table = tables[0];
    return table;
  };

  const handleExcel = () => {
    if (onExcelClick) {
      onExcelClick();
      return;
    }
    const table = getTableData();
    if (!table) { alert('এক্সপোর্ট করার মত কোনো ডাটা পাওয়া যায়নি।'); return; }

    const clone = table.cloneNode(true) as HTMLTableElement;
    clone.querySelectorAll('.no-print, button, input, select, textarea').forEach(el => el.remove());

    const wb = XLSX.utils.table_to_book(clone, { sheet: 'রিপোর্ট' });
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const handleCSV = () => {
    const table = getTableData();
    if (!table) { alert('এক্সপোর্ট করার মত ডাটা পাওয়া যায়নি।'); return; }
    
    const clone = table.cloneNode(true) as HTMLTableElement;
    clone.querySelectorAll('.no-print, button, input').forEach(el => el.remove());
    
    const wb = XLSX.utils.table_to_book(clone, { sheet: 'Sheet 1', raw: true });
    const csvContent = XLSX.utils.sheet_to_csv(wb.Sheets['Sheet 1']);
    
    // Add Company Header
    const companyHeader = `${settings?.companyNameBangla || 'কোম্পানি'}\n${filename}\n\n`;
    
    const blob = new Blob(['\uFEFF' + companyHeader + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleGoogleSheets = () => {
    handleCSV();
    // Open Google Sheets import in a new tab
    window.open('https://docs.google.com/spreadsheets/u/0/', '_blank');
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`*${settings?.companyNameBangla || 'কোম্পানি'}*
নতুন রিপোর্ট তৈরি হয়েছে: ${filename}
দয়া করে সংযুক্ত ফাইলটি দেখুন।`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleGmail = () => {
    const subject = encodeURIComponent(`${settings?.companyNameBangla || 'কোম্পানি'} - রিপোর্ট: ${filename}`);
    const body = encodeURIComponent(`নতুন রিপোর্ট তৈরি হয়েছে: ${filename}
দয়া করে সিস্টেম থেকে রিপোর্টটি দেখুন বা সংযুক্ত ফাইল চেক করুন।`);
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=&su=${subject}&body=${body}`, '_blank');
  };

  const handlePDF = () => {
    if (onPdfClick) {
      onPdfClick();
    } else {
      const table = getTableData();
      if (!table) { alert('এক্সপোর্ট করার মত ডাটা পাওয়া যায়নি।'); return; }
      generateGenericPDF(filename, table as HTMLTableElement, settings);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-3 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs no-print transition-all">
      <span className="text-xs font-bold text-slate-600 dark:text-slate-300 mr-1 hidden sm:inline-block">ডাটা এক্সপোর্ট:</span>
      
      {/* EXCEL (.xlsx) EXPORT BUTTON */}
      <button
        onClick={handleExcel}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
        title="এক্সেল ফাইল (.xlsx) ডাউনলোড করুন"
      >
        <FileSpreadsheet className="w-3.5 h-3.5" /> এক্সেল (.xlsx)
      </button>

      {/* PDF BUTTON */}
      <button
        onClick={handlePDF}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
        title="পিডিএফ ফাইল সংরক্ষণ বা দেখুন"
      >
        <FileText className="w-3.5 h-3.5" /> পিডিএফ
      </button>
      
      {/* PRINT BUTTON */}
      <button
        onClick={triggerPrint}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
        title="সরাসরি প্রিন্ট করুন"
      >
        <Printer className="w-3.5 h-3.5" /> প্রিন্ট
      </button>
      
      {/* CSV BUTTON */}
      <button
        onClick={handleCSV}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
        title="সিএসভি ফাইল ডাউনলোড করুন"
      >
        <Download className="w-3.5 h-3.5" /> সিএসভি
      </button>

      {/* GOOGLE SHEETS */}
      <button
        onClick={handleGoogleSheets}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
        title="গুগল শিট-এ ওপেন করুন"
      >
        <FileSpreadsheet className="w-3.5 h-3.5" /> গুগল শিট
      </button>
      
      {/* WHATSAPP */}
      <button
        onClick={handleWhatsApp}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
        title="হোয়াটসঅ্যাপে শেয়ার করুন"
      >
        <Share2 className="w-3.5 h-3.5" /> হোয়াটসঅ্যাপ
      </button>
      
      {/* GMAIL */}
      <button
        onClick={handleGmail}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
        title="ইমেইলে শেয়ার করুন"
      >
        <Mail className="w-3.5 h-3.5" /> ইমেইল
      </button>
    </div>
  );
};
