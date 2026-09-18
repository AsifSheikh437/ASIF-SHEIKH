import React, { useRef, useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Download, Mail, CheckCircle2, X } from 'lucide-react';
import { sendEmailViaGmail } from '../../services/gmailService';
import html2pdf from 'html2pdf.js';

interface Props {
  record: any;
  employee: any;
  onClose: () => void;
}

export const SalarySlipModal: React.FC<Props> = ({ record, employee, onClose }) => {
  const { settings } = useERP();
  const printRef = useRef<HTMLDivElement>(null);
  const [isEmailing, setIsEmailing] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    const element = printRef.current;
    
    // Add temporary styling for PDF print
    element.classList.add('bg-white', 'p-8');
    
    const opt: any = {
      margin: 0.5,
      filename: `Salary_Slip_${employee.name}_${record.month}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'a5', orientation: 'portrait' }
    };
    
    await html2pdf().from(element).set(opt).save();
    
    // Remove temporary styling
    element.classList.remove('bg-white', 'p-8');
  };

  const handleSendEmail = async () => {
    if (!employee.email) {
      alert('কর্মীর ইমেইল অ্যাড্রেস যুক্ত নেই। দয়া করে প্রোফাইল আপডেট করুন।');
      return;
    }
    
    setIsEmailing(true);
    try {
      const subject = `Salary Slip - ${record.month} - ${settings.companyNameEnglish}`;
      
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #1e293b; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">${settings.companyNameBangla}</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.8;">স্যালারি স্লিপ - ${record.month}</p>
          </div>
          <div style="padding: 20px;">
            <p><strong>কর্মীর নাম:</strong> ${employee.name}</p>
            <p><strong>পদবি/বিভাগ:</strong> ${employee.category || '-'}</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0;">মূল বেতন (Basic)</td>
                <td style="text-align: right; padding: 8px 0; font-weight: bold;">${formatCurrency(record.basicSalary)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;">ওভারটাইম / বোনাস</td>
                <td style="text-align: right; padding: 8px 0; font-weight: bold; color: green;">+ ${formatCurrency(record.overtimeAmount + record.bonusAmount)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;">অগ্রিম কর্তন (Advance Deduction)</td>
                <td style="text-align: right; padding: 8px 0; font-weight: bold; color: red;">- ${formatCurrency(record.advanceDeduction)}</td>
              </tr>
              <tr style="border-top: 2px solid #cbd5e1;">
                <td style="padding: 12px 0; font-weight: bold;">সর্বমোট প্রদান (Net Payable)</td>
                <td style="text-align: right; padding: 12px 0; font-weight: bold; font-size: 18px; color: #0f172a;">${formatCurrency(record.netPayable)}</td>
              </tr>
            </table>
            
            <div style="margin-top: 20px; padding: 15px; background-color: #f8fafc; border-radius: 6px; font-size: 14px;">
              <p style="margin: 0;"><strong>স্ট্যাটাস:</strong> পরিশোধিত</p>
              <p style="margin: 5px 0 0 0;"><strong>পরিশোধের তারিখ:</strong> ${record.paidDate ? formatDate(record.paidDate) : '-'}</p>
              <p style="margin: 5px 0 0 0;"><strong>পেমেন্ট মেথড:</strong> ${record.paymentMethod}</p>
            </div>
            
            <p style="margin-top: 30px; font-size: 12px; color: #64748b; text-align: center;">
              এটি একটি সিস্টেম জেনারেটেড স্যালারি স্লিপ, কোন স্বাক্ষরের প্রয়োজন নেই।
            </p>
          </div>
        </div>
      `;

      await sendEmailViaGmail(employee.email, subject, htmlBody);
      setEmailSuccess(true);
      setTimeout(() => setEmailSuccess(false), 3000);
    } catch (error: any) {
      alert(`ইমেইল পাঠাতে সমস্যা হয়েছে: ${error.message}`);
    } finally {
      setIsEmailing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-bold text-lg text-slate-800 dark:text-slate-200">স্যালারি স্লিপ (Salary Slip)</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto" ref={printRef}>
          {/* Slip Header */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">{settings.companyNameBangla}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{settings.addressBangla}</p>
            <div className="mt-4 inline-block px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded text-sm font-bold uppercase tracking-wider">
              Pay Slip - {record.month}
            </div>
          </div>

          {/* Employee Details */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs">কর্মীর নাম</p>
              <p className="font-bold text-slate-800 dark:text-slate-200">{employee.name}</p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs">ক্যাটাগরি/বিভাগ</p>
              <p className="font-bold text-slate-800 dark:text-slate-200">{employee.category || '-'}</p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs">যোগদানের তারিখ</p>
              <p className="font-bold text-slate-800 dark:text-slate-200">{employee.joinDate ? formatDate(employee.joinDate) : '-'}</p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs">ইমেইল</p>
              <p className="font-bold text-slate-800 dark:text-slate-200">{employee.email || '-'}</p>
            </div>
          </div>

          {/* Salary Breakdown */}
          <table className="w-full text-sm mb-6">
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <tr>
                <td className="py-2 text-slate-600 dark:text-slate-400">মূল বেতন (Basic)</td>
                <td className="py-2 text-right font-mono font-bold text-slate-800 dark:text-slate-200">{formatCurrency(record.basicSalary)}</td>
              </tr>
              <tr>
                <td className="py-2 text-slate-600 dark:text-slate-400">ওভারটাইম / বোনাস</td>
                <td className="py-2 text-right font-mono font-bold text-emerald-600">+ {formatCurrency(record.overtimeAmount + record.bonusAmount)}</td>
              </tr>
              <tr>
                <td className="py-2 text-slate-600 dark:text-slate-400">অগ্রিম কর্তন (Advance Deduction)</td>
                <td className="py-2 text-right font-mono font-bold text-rose-600">- {formatCurrency(record.advanceDeduction)}</td>
              </tr>
              <tr className="border-t-2 border-slate-200 dark:border-slate-700">
                <td className="py-3 font-bold text-slate-800 dark:text-slate-200">সর্বমোট প্রদান (Net Payable)</td>
                <td className="py-3 text-right font-mono font-black text-lg text-slate-900 dark:text-white">{formatCurrency(record.netPayable)}</td>
              </tr>
            </tbody>
          </table>

          {/* Payment Info */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">স্ট্যাটাস:</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                পরিশোধিত
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">পরিশোধের তারিখ:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{record.paidDate ? formatDate(record.paidDate) : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">মেথড:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{record.paymentMethod}</span>
            </div>
          </div>
          
          <div className="mt-8 text-center text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-4">
            এটি একটি সিস্টেম জেনারেটেড স্যালারি স্লিপ, কোন স্বাক্ষরের প্রয়োজন নেই।
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex gap-3">
          <button
            onClick={handleDownloadPDF}
            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            PDF ডাউনলোড
          </button>
          
          <button
            onClick={handleSendEmail}
            disabled={isEmailing || !employee.email || emailSuccess}
            className={`flex-1 px-4 py-2 font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 ${
              emailSuccess 
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50'
            }`}
          >
            {emailSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                ইমেইল পাঠানো হয়েছে
              </>
            ) : isEmailing ? (
              <span className="animate-pulse">পাঠানো হচ্ছে...</span>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                ইমেইল করুন
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
