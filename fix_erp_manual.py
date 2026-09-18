with open('src/context/ERPContext.tsx', 'r') as f:
    content = f.read()

find_impl = """  const saveManualPayroll = (month: string, manualRecords: any[]) => {
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
  };"""

repl_impl = """  const saveManualPayroll = (month: string, manualRecords: any[]) => {
    const otherRecords = salaries.filter(s => !(s.month === month && s.employeeId.startsWith('MANUAL_')));
    setSalaries([...otherRecords, ...manualRecords]);
    
    const totalPaid = manualRecords.reduce((sum, r) => sum + (r.netPayable || 0), 0);
    if (totalPaid > 0) {
        setSettings(prev => ({ ...prev, cashInHandBalance: Math.max(0, prev.cashInHandBalance - totalPaid) }));
        
        const entry = {
          id: `LDG-MANUAL-${Date.now()}`,
          date: new Date().toISOString().substring(0, 10),
          voucherNo: `PAY-M-${Date.now().toString().slice(-6)}`,
          accountType: 'SALARY',
          accountTitle: `ম্যানুয়াল স্যালারি পেমেন্ট`,
          description: `${month} মাসের ম্যানুয়াল বেতন পরিশোধ`,
          debit: totalPaid,
          credit: 0,
          method: 'CASH',
          category: 'SALARY',
        };
        // @ts-ignore
        setCashBankLedgers(prev => [entry, ...prev]);
        logAudit('UPDATE', 'Manual Payroll', `Total ${totalPaid} disbursed for manual payroll (${month})`);
    }
  };"""

content = content.replace(find_impl, repl_impl)

with open('src/context/ERPContext.tsx', 'w') as f:
    f.write(content)
