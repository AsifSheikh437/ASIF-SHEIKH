with open('src/components/views/HRPayrollView.tsx', 'r') as f:
    content = f.read()

import re

# Add saveManualPayroll to the destructured context hook
hook_find = """    processMonthlyPayroll,
    disburseSalary,"""
hook_repl = """    processMonthlyPayroll,
    disburseSalary,
    saveManualPayroll,"""

content = content.replace(hook_find, hook_repl)

# Now we find where activeTab === 'PAYROLL' is handled.
payroll_tab_regex = r"(\{activeTab === 'PAYROLL' && \(\s*<div className=\"bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden\">.*?\)\})"

# Oh wait, regex for html can be brittle. I'll just find the exact block or inject right after the payroll table.
# Wait, if payrollMode === 'MANUAL', we show the manual component instead of the automatic one.

# Let's write the Manual Component directly in HRPayrollView.
manual_comp = """
const ManualPayrollSheet = ({ selectedMonth, saveManualPayroll, salaryRecords }: { selectedMonth: string, saveManualPayroll: (m: string, r: any[]) => void, salaryRecords: any[] }) => {
  const [officeSalary, setOfficeSalary] = React.useState(0);
  const [officeAdvance, setOfficeAdvance] = React.useState(0);
  
  const [mechSalary, setMechSalary] = React.useState(0);
  const [mechAdvance, setMechAdvance] = React.useState(0);
  
  const [maleSalary, setMaleSalary] = React.useState(0);
  const [maleAdvance, setMaleAdvance] = React.useState(0);
  
  const [femaleSalary, setFemaleSalary] = React.useState(0);
  const [femaleAdvance, setFemaleAdvance] = React.useState(0);

  // Load existing if any
  React.useEffect(() => {
    const existing = salaryRecords.filter(s => s.month === selectedMonth && s.employeeId.startsWith('MANUAL_'));
    existing.forEach(s => {
      if (s.employeeId === 'MANUAL_OFFICE') { setOfficeSalary(s.basicSalary); setOfficeAdvance(s.advanceDeduction || 0); }
      if (s.employeeId === 'MANUAL_MECH') { setMechSalary(s.basicSalary); setMechAdvance(s.advanceDeduction || 0); }
      if (s.employeeId === 'MANUAL_MALE') { setMaleSalary(s.basicSalary); setMaleAdvance(s.advanceDeduction || 0); }
      if (s.employeeId === 'MANUAL_FEMALE') { setFemaleSalary(s.basicSalary); setFemaleAdvance(s.advanceDeduction || 0); }
    });
  }, [selectedMonth, salaryRecords]);

  const handleSave = () => {
    const records = [
      {
        id: `SAL-${selectedMonth}-MANUAL_OFFICE`,
        month: selectedMonth,
        employeeId: 'MANUAL_OFFICE',
        employeeName: 'অফিস স্টাফ',
        basicSalary: officeSalary,
        advanceDeduction: officeAdvance,
        netPayable: Math.max(0, officeSalary - officeAdvance),
        status: 'PAID',
        paymentDate: new Date().toISOString().split('T')[0],
      },
      {
        id: `SAL-${selectedMonth}-MANUAL_MECH`,
        month: selectedMonth,
        employeeId: 'MANUAL_MECH',
        employeeName: 'মেকানিকাল ষ্টাফ',
        basicSalary: mechSalary,
        advanceDeduction: mechAdvance,
        netPayable: Math.max(0, mechSalary - mechAdvance),
        status: 'PAID',
        paymentDate: new Date().toISOString().split('T')[0],
      },
      {
        id: `SAL-${selectedMonth}-MANUAL_MALE`,
        month: selectedMonth,
        employeeId: 'MANUAL_MALE',
        employeeName: 'পুরুষ কর্মচারী',
        basicSalary: maleSalary,
        advanceDeduction: maleAdvance,
        netPayable: Math.max(0, maleSalary - maleAdvance),
        status: 'PAID',
        paymentDate: new Date().toISOString().split('T')[0],
      },
      {
        id: `SAL-${selectedMonth}-MANUAL_FEMALE`,
        month: selectedMonth,
        employeeId: 'MANUAL_FEMALE',
        employeeName: 'মহিলা কর্মচারী',
        basicSalary: femaleSalary,
        advanceDeduction: femaleAdvance,
        netPayable: Math.max(0, femaleSalary - femaleAdvance),
        status: 'PAID',
        paymentDate: new Date().toISOString().split('T')[0],
      }
    ];
    saveManualPayroll(selectedMonth, records);
    alert('ম্যানুয়াল স্যালারি সফলভাবে সেভ হয়েছে এবং ক্যাশ থেকে কর্তন করা হয়েছে।');
  };

  const grandTotal = 
    Math.max(0, officeSalary - officeAdvance) + 
    Math.max(0, mechSalary - mechAdvance) + 
    Math.max(0, maleSalary - maleAdvance) + 
    Math.max(0, femaleSalary - femaleAdvance);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
      <h3 className="font-bold text-slate-800 text-lg mb-4 text-center">ম্যানুয়াল স্যালারি এন্ট্রি শিট ({selectedMonth})</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Office Staff */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <h4 className="font-bold text-indigo-700 mb-3">অফিস স্টাফ</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">অফিস স্টাফ মূল বেতন</label>
              <input type="number" value={officeSalary || ''} onChange={e => setOfficeSalary(Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm font-mono" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-rose-600 mb-1">অফিস স্টাফ অগ্রিম বেতন (কর্তন)</label>
              <input type="number" value={officeAdvance || ''} onChange={e => setOfficeAdvance(Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm font-mono text-rose-600" />
            </div>
            <div className="pt-2 border-t flex justify-between font-bold">
              <span>নেট প্রদেয়:</span>
              <span>{Math.max(0, officeSalary - officeAdvance).toLocaleString('en-IN')} ৳</span>
            </div>
          </div>
        </div>

        {/* Mechanical Staff */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <h4 className="font-bold text-indigo-700 mb-3">মেকানিকাল ষ্টাফ</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">মেকানিকাল ষ্টাফ মূল বেতন</label>
              <input type="number" value={mechSalary || ''} onChange={e => setMechSalary(Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm font-mono" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-rose-600 mb-1">অগ্রিম বেতন (কর্তন)</label>
              <input type="number" value={mechAdvance || ''} onChange={e => setMechAdvance(Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm font-mono text-rose-600" />
            </div>
            <div className="pt-2 border-t flex justify-between font-bold">
              <span>নেট প্রদেয়:</span>
              <span>{Math.max(0, mechSalary - mechAdvance).toLocaleString('en-IN')} ৳</span>
            </div>
          </div>
        </div>

        {/* Male Employee */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <h4 className="font-bold text-indigo-700 mb-3">পুরুষ কর্মচারী</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">পুরুষ কর্মচারী মূল বেতন</label>
              <input type="number" value={maleSalary || ''} onChange={e => setMaleSalary(Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm font-mono" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-rose-600 mb-1">অগ্রিম বেতন (কর্তন)</label>
              <input type="number" value={maleAdvance || ''} onChange={e => setMaleAdvance(Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm font-mono text-rose-600" />
            </div>
            <div className="pt-2 border-t flex justify-between font-bold">
              <span>নেট প্রদেয়:</span>
              <span>{Math.max(0, maleSalary - maleAdvance).toLocaleString('en-IN')} ৳</span>
            </div>
          </div>
        </div>

        {/* Female Employee */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <h4 className="font-bold text-indigo-700 mb-3">মহিলা কর্মচারী</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">মহিলা কর্মচারী মূল বেতন</label>
              <input type="number" value={femaleSalary || ''} onChange={e => setFemaleSalary(Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm font-mono" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-rose-600 mb-1">অগ্রিম বেতন (কর্তন)</label>
              <input type="number" value={femaleAdvance || ''} onChange={e => setFemaleAdvance(Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm font-mono text-rose-600" />
            </div>
            <div className="pt-2 border-t flex justify-between font-bold">
              <span>নেট প্রদেয়:</span>
              <span>{Math.max(0, femaleSalary - femaleAdvance).toLocaleString('en-IN')} ৳</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-indigo-50 border-2 border-indigo-200 rounded-xl flex items-center justify-between">
        <div className="text-indigo-900 font-bold text-lg">সর্বমোট প্রদেয় বেতন:</div>
        <div className="text-indigo-900 font-black text-2xl font-mono">{grandTotal.toLocaleString('en-IN')} ৳</div>
      </div>
      
      <div className="mt-4 flex justify-end">
        <button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition-colors flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          বেতন পরিশোধ ও সেভ করুন
        </button>
      </div>
    </div>
  );
};
"""

content = content.replace("export const HRPayrollView: React.FC = () => {", manual_comp + "\n\nexport const HRPayrollView: React.FC = () => {")

# Now inject it conditionally where the payroll sheet is rendered
find_payroll_start = "{activeTab === 'PAYROLL' && ("
repl_payroll_start = """{activeTab === 'PAYROLL' && payrollMode === 'MANUAL' && (
        <ManualPayrollSheet selectedMonth={selectedMonth} saveManualPayroll={saveManualPayroll} salaryRecords={salaryRecords} />
      )}
      
      {activeTab === 'PAYROLL' && payrollMode !== 'MANUAL' && ("""

content = content.replace(find_payroll_start, repl_payroll_start)

with open('src/components/views/HRPayrollView.tsx', 'w') as f:
    f.write(content)
