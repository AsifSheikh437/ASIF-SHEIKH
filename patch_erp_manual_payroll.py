with open('src/context/ERPContext.tsx', 'r') as f:
    content = f.read()

# Add saveManualPayroll function signature to ERPContextType
sig_find = "processMonthlyPayroll: (month: string) => void;"
sig_repl = "processMonthlyPayroll: (month: string) => void;\n  saveManualPayroll: (month: string, records: any[]) => void;"

if sig_find in content:
    content = content.replace(sig_find, sig_repl)
else:
    print("Failed to find signature.")

# Add function implementation
impl_find = "const processMonthlyPayroll = (month: string) => {"
impl_repl = """  const saveManualPayroll = (month: string, manualRecords: any[]) => {
    // Check if there are existing manual records for this month, maybe replace them?
    const otherRecords = salaries.filter(s => !(s.month === month && s.employeeId.startsWith('MANUAL_')));
    setSalaries([...otherRecords, ...manualRecords]);
    
    // Also deduct from Cash if they are marked as PAID.
    // For simplicity, we just save them as PAID and deduct the total.
    const totalPaid = manualRecords.reduce((sum, r) => sum + (r.netPayable || 0), 0);
    if (totalPaid > 0) {
        addCashBankTransaction({
          date: new Date().toISOString().split('T')[0],
          type: 'OUT',
          amount: totalPaid,
          category: 'SALARY',
          description: `ম্যানুয়াল স্যালারি পেমেন্ট (${month})`,
          method: 'CASH',
        });
        logAudit('HR', 'Manual Payroll', `Total ${totalPaid} disbursed for manual payroll (${month})`);
    }
  };

  const processMonthlyPayroll = (month: string) => {"""

if impl_find in content:
    content = content.replace(impl_find, impl_repl)
else:
    print("Failed to find impl.")

export_find = "processMonthlyPayroll,"
export_repl = "processMonthlyPayroll,\n        saveManualPayroll,"

if export_find in content:
    content = content.replace(export_find, export_repl)
else:
    print("Failed to find export.")

with open('src/context/ERPContext.tsx', 'w') as f:
    f.write(content)
