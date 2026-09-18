/**
 * Currency, Date and Export formatters for Food ERP Management System
 */

const bengaliNumbers = {
  '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
  '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
};

export function toBengaliNumber(str: string | number): string {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[0-9]/g, (match) => bengaliNumbers[match as keyof typeof bengaliNumbers]);
}

export function formatCurrency(amount: number | undefined | null, includeDecimals = false): string {
  let currencyCode = "BDT";
  try {
    const rawData = localStorage.getItem("erp_settings");
    if (rawData) {
      const parsed = JSON.parse(rawData);
      if (parsed.baseCurrency) {
        currencyCode = parsed.baseCurrency;
      }
    }
  } catch(e) {}

  if (amount === undefined || amount === null || isNaN(amount)) {
    amount = 0;
  }
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  if (currencyCode === "BDT") {
    const formattedNum = absAmount.toLocaleString("bn-BD", {
      minimumFractionDigits: includeDecimals ? 2 : 0,
      maximumFractionDigits: includeDecimals ? 2 : 0,
    });
    return `${isNegative ? "-" : ""}৳${formattedNum}`;
  }
  
  return new Intl.NumberFormat("bn-BD", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  }).format(amount);
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return toBengaliNumber(dateString);
    return d.toLocaleDateString('bn-BD', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return toBengaliNumber(dateString);
  }
}

export function formatDateTime(dateTimeString?: string): string {
  if (!dateTimeString) return '-';
  try {
    const d = new Date(dateTimeString);
    if (isNaN(d.getTime())) return toBengaliNumber(dateTimeString);
    return d.toLocaleString('bn-BD', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return toBengaliNumber(dateTimeString);
  }
}

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const processCell = (cell: string | number) => {
    const str = cell === undefined || cell === null ? '' : String(cell);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = [
    headers.map(processCell).join(','),
    ...rows.map(row => row.map(processCell).join(',')),
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function triggerPrint() {
  window.print();
}

/**
 * Formats a phone number for WhatsApp wa.me links
 * e.g. "01712-334455" -> "8801712334455"
 */
export function cleanWhatsAppPhone(rawPhone?: string): string {
  if (!rawPhone) return '';
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('880')) {
    return digits;
  }
  if (digits.startsWith('0')) {
    return `88${digits}`;
  }
  return `880${digits}`;
}

/**
 * Converts numbers into Bengali In-Words representation for official receipts & statements
 */
export function numberToWordsBDT(amount: number): string {
  if (!amount || isNaN(amount) || amount <= 0) return 'শূন্য টাকা মাত্র';

  const ones = ['', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়'];
  const teens = ['দশ', 'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোলো', 'সতেরো', 'আঠারো', 'উনিশ'];
  const tens = ['', '', 'বিশ', 'ত্রিশ', 'চল্লিশ', 'পঞ্চাশ', 'ষাট', 'সত্তর', 'আশি', 'নব্বই'];

  function convertTwoDigits(n: number): string {
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    const t = Math.floor(n / 10);
    const o = n % 10;
    return tens[t] + (o > 0 ? ' ' + ones[o] : '');
  }

  let num = Math.floor(amount);
  let words = '';

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundred = Math.floor(num / 100);
  const remaining = num % 100;

  if (crore > 0) {
    words += `${convertTwoDigits(crore)} কোটি `;
  }
  if (lakh > 0) {
    words += `${convertTwoDigits(lakh)} লক্ষ `;
  }
  if (thousand > 0) {
    words += `${convertTwoDigits(thousand)} হাজার `;
  }
  if (hundred > 0) {
    words += `${ones[hundred]} শত `;
  }
  if (remaining > 0) {
    words += `${convertTwoDigits(remaining)} `;
  }

  return `${words.trim()} টাকা মাত্র`;
}
