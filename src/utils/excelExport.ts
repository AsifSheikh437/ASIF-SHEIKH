import * as XLSX from 'xlsx';
import { Product, Sale } from '../types';

/**
 * Category translation helper to pure Bengali
 */
const getCategoryNameBn = (cat?: string): string => {
  switch (cat) {
    case 'FINISHED_GOODS':
      return 'তৈরি খাদ্যপণ্য (ফিনিশড গুডস)';
    case 'RAW_MATERIAL':
      return 'কাঁচামাল';
    case 'PACKAGING':
      return 'প্যাকেজিং সামগ্রী';
    case 'SPICES':
      return 'মসলা ও ফ্লেভার';
    case 'CHEMICALS':
      return 'রাসায়নিক ও প্রিজারভেটিভ';
    case 'OTHER':
    default:
      return 'অন্যান্য সামগ্রী';
  }
};

/**
 * Delivery status translation helper to pure Bengali
 */
const getDeliveryStatusBn = (status?: string): string => {
  switch (status) {
    case 'DELIVERED':
      return 'সরবরাহ সম্পন্ন';
    case 'DISPATCHED':
      return 'বিতরণ পথে';
    case 'PACKED':
      return 'প্যাকিং সম্পন্ন';
    case 'PENDING':
      return 'অপেক্ষমাণ';
    case 'CANCELLED':
      return 'বাতিলকৃত';
    default:
      return status || 'অপেক্ষমাণ';
  }
};

/**
 * Payment method translation helper to pure Bengali
 */
const getPaymentMethodBn = (method?: string): string => {
  switch (method) {
    case 'CASH':
      return 'নগদ ক্যাশ';
    case 'BANK':
      return 'ব্যাংক ট্রান্সফার';
    case 'CHEQUE':
      return 'চেক';
    case 'MOBILE_BANKING':
      return 'মোবাইল ব্যাংকিং (বিকাশ/নগদ)';
    case 'DUE':
      return 'বকেয়া';
    default:
      return method || 'নগদ';
  }
};

/**
 * Export any HTML Table directly to Excel (.xlsx) with clean Bengali headers
 */
export const exportTableToExcel = (
  tableOrSelector: HTMLTableElement | string,
  filename: string = 'রিপোর্ট',
  sheetName: string = 'রিপোর্ট ডাটা'
) => {
  try {
    let table: HTMLTableElement | null = null;
    if (typeof tableOrSelector === 'string') {
      table = document.querySelector(tableOrSelector) as HTMLTableElement;
    } else {
      table = tableOrSelector;
    }

    if (!table) {
      console.warn('এক্সপোর্ট করার জন্য টেবিল পাওয়া যায়নি');
      return false;
    }

    // Clone table and remove non-printable elements
    const clone = table.cloneNode(true) as HTMLTableElement;
    clone.querySelectorAll('.no-print, button, input, select, textarea').forEach(el => el.remove());

    const wb = XLSX.utils.table_to_book(clone, { sheet: sheetName });
    XLSX.writeFile(wb, `${filename}.xlsx`);
    return true;
  } catch (error) {
    console.error('এক্সেল এক্সপোর্টে ত্রুটি:', error);
    return false;
  }
};

/**
 * Dedicated Inventory Report Excel (.xlsx) Exporter with structured data
 */
export const exportInventoryReportToExcel = (
  products: Product[],
  filename: string = `ইনভেন্টরি_স্টক_রিপোর্ট_${new Date().toISOString().split('T')[0]}`
) => {
  try {
    if (!products || products.length === 0) {
      alert('এক্সপোর্ট করার মত কোনো পণ্যের তথ্য নেই');
      return false;
    }

    let totalStockQty = 0;
    let totalStockValue = 0;

    const dataRows = products.map((p, idx) => {
      const stockQty = Number(p.currentStock || 0);
      const buyPrice = Number(p.purchasePrice || 0);
      const sellPrice = Number(p.sellingPrice || 0);
      const stockValue = stockQty * buyPrice;

      totalStockQty += stockQty;
      totalStockValue += stockValue;

      const isLowStock = stockQty <= (p.minStockAlert ?? 20);

      return {
        'ক্রমিক নং': idx + 1,
        'এসকেইউ / কোড': p.sku || p.id,
        'পণ্যের নাম (বাংলা)': p.nameBangla,
        'পণ্যের নাম (ইংরেজি)': p.nameEnglish || '',
        'ক্যাটাগরি': getCategoryNameBn(p.category),
        'পরিমাপের একক': p.unit || 'পিস',
        'বর্তমান মজুদ (স্টক)': stockQty,
        'ক্রয়মূল্য (টাকা)': buyPrice,
        'বিক্রয়মূল্য (টাকা)': sellPrice,
        'মোট স্টক মূল্য (টাকা)': Math.round(stockValue),
        'সতর্কবার্তা সীমা': p.minStockAlert ?? 20,
        'স্টক অবস্থা': isLowStock ? 'স্বল্প স্টক (সতর্কতা)' : 'পর্যাপ্ত মজুদ',
      };
    });

    // Summary Row
    const summaryRow = {
      'ক্রমিক নং': 'সর্বমোট',
      'এসকেইউ / কোড': `মোট পণ্য: ${products.length} টি`,
      'পণ্যের নাম (বাংলা)': '',
      'পণ্যের নাম (ইংরেজি)': '',
      'ক্যাটাগরি': '',
      'পরিমাপের একক': '',
      'বর্তমান মজুদ (স্টক)': totalStockQty,
      'ক্রয়মূল্য (টাকা)': '',
      'বিক্রয়মূল্য (টাকা)': '',
      'মোট স্টক মূল্য (টাকা)': Math.round(totalStockValue),
      'সতর্কবার্তা সীমা': '',
      'স্টক অবস্থা': '',
    };

    const worksheet = XLSX.utils.json_to_sheet([...dataRows, summaryRow]);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 10 }, // ক্রমিক নং
      { wch: 16 }, // এসকেইউ
      { wch: 28 }, // নাম বাংলা
      { wch: 22 }, // নাম ইংরেজি
      { wch: 24 }, // ক্যাটাগরি
      { wch: 14 }, // একক
      { wch: 18 }, // স্টক
      { wch: 16 }, // ক্রয়মূল্য
      { wch: 16 }, // বিক্রয়মূল্য
      { wch: 20 }, // স্টক মূল্য
      { wch: 16 }, // সতর্কবার্তা
      { wch: 20 }, // অবস্থা
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ইনভেন্টরি স্টক');

    XLSX.writeFile(workbook, `${filename}.xlsx`);
    return true;
  } catch (error) {
    console.error('ইনভেন্টরি এক্সেল তৈরিতে সমস্যা:', error);
    alert('ইনভেন্টরি এক্সেল ডাউনলোড করার সময় ত্রুটি হয়েছে');
    return false;
  }
};

/**
 * Dedicated Sales Report Excel (.xlsx) Exporter with structured data
 */
export const exportSalesReportToExcel = (
  sales: Sale[],
  filename: string = `বিক্রয়_ইনভয়েস_রিপোর্ট_${new Date().toISOString().split('T')[0]}`
) => {
  try {
    if (!sales || sales.length === 0) {
      alert('এক্সপোর্ট করার মত কোনো বিক্রয় ইনভয়েস নেই');
      return false;
    }

    let sumSubTotal = 0;
    let sumDiscount = 0;
    let sumGrandTotal = 0;
    let sumPaid = 0;
    let sumDue = 0;

    const dataRows = sales.map((s, idx) => {
      const subTotal = Number(s.subTotal || 0);
      const discount = Number(s.discountAmount || 0);
      const grandTotal = Number(s.grandTotal || 0);
      const paid = Number(s.paidAmount || 0);
      const due = Number(s.dueAmount || 0);

      sumSubTotal += subTotal;
      sumDiscount += discount;
      sumGrandTotal += grandTotal;
      sumPaid += paid;
      sumDue += due;

      const itemsSummary = (s.items || [])
        .map(i => `${i.productName || 'পণ্য'} (${i.quantity} ${i.unit || ''})`)
        .join('; ');

      return {
        'ক্রমিক': idx + 1,
        'ইনভয়েস নম্বর': (s as any).invoiceNumber || s.invoiceNo || s.id,
        'তারিখ': (s as any).invoiceDate || s.date,
        'গ্রাহকের নাম': s.customerName || 'খুচরা ক্রেতা',
        'গ্রাহকের ফোন': s.customerPhone || '',
        'পণ্যের বিবরণ ও পরিমাণ': itemsSummary,
        'মোট বিল (টাকা)': subTotal,
        'ছাড় / ডিসকাউন্ট (টাকা)': discount,
        'সর্বমোট দেয় টাকা': grandTotal,
        'পরিশোধিত টাকা': paid,
        'বকেয়া টাকা': due,
        'পেমেন্ট মাধ্যম': getPaymentMethodBn(s.paymentMethod),
        'ডেলিভারি অবস্থা': getDeliveryStatusBn(s.deliveryStatus),
      };
    });

    // Summary Row
    const summaryRow = {
      'ক্রমিক': 'সর্বমোট',
      'ইনভয়েস নম্বর': `মোট ইনভয়েস: ${sales.length} টি`,
      'তারিখ': '',
      'গ্রাহকের নাম': '',
      'গ্রাহকের ফোন': '',
      'পণ্যের বিবরণ ও পরিমাণ': '',
      'মোট বিল (টাকা)': sumSubTotal,
      'ছাড় / ডিসকাউন্ট (টাকা)': sumDiscount,
      'সর্বমোট দেয় টাকা': sumGrandTotal,
      'পরিশোধিত টাকা': sumPaid,
      'বকেয়া টাকা': sumDue,
      'পেমেন্ট মাধ্যম': '',
      'ডেলিভারি অবস্থা': '',
    };

    const worksheet = XLSX.utils.json_to_sheet([...dataRows, summaryRow]);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 8 },  // ক্রমিক
      { wch: 18 }, // ইনভয়েস নং
      { wch: 14 }, // তারিখ
      { wch: 24 }, // গ্রাহক
      { wch: 16 }, // ফোন
      { wch: 35 }, // বিবরণ
      { wch: 16 }, // সাবটোটাল
      { wch: 18 }, // ডিসকাউন্ট
      { wch: 18 }, // গ্র্যান্ড টোটাল
      { wch: 16 }, // পরিশোধ
      { wch: 16 }, // বকেয়া
      { wch: 20 }, // পেমেন্ট মাধ্যম
      { wch: 18 }, // অবস্থা
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'বিক্রয় রিপোর্ট');

    XLSX.writeFile(workbook, `${filename}.xlsx`);
    return true;
  } catch (error) {
    console.error('বিক্রয় এক্সেল তৈরিতে সমস্যা:', error);
    alert('বিক্রয় এক্সেল ডাউনলোড করার সময় ত্রুটি হয়েছে');
    return false;
  }
};
