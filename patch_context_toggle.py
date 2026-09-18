with open('src/context/ERPContext.tsx', 'r') as f:
    content = f.read()

# Add to context type
context_type = "  updateSaleWorkflow: (saleId: string, updates: Partial<Sale>) => { success: boolean; error?: string };"
if 'toggleTransactionVisualStatus:' not in content:
    content = content.replace(context_type, context_type + "\n  toggleTransactionVisualStatus: (id: string, type: 'SALE' | 'PURCHASE') => void;")

# Add implementation
impl_code = """
  const toggleTransactionVisualStatus = (id: string, type: 'SALE' | 'PURCHASE') => {
    if (type === 'SALE') {
      setSales(prev => prev.map(s => {
        if (s.id === id) {
          const current = s.visualStatus || (s.dueAmount <= 0 ? 'PAID' : 'PENDING');
          let next: 'PAID' | 'PENDING' | 'OVERDUE' = 'PAID';
          if (current === 'PAID') next = 'PENDING';
          else if (current === 'PENDING') next = 'OVERDUE';
          else next = 'PAID';
          return { ...s, visualStatus: next };
        }
        return s;
      }));
    } else {
      setPurchases(prev => prev.map(p => {
        if (p.id === id) {
          const current = p.visualStatus || (p.dueAmount <= 0 ? 'PAID' : 'PENDING');
          let next: 'PAID' | 'PENDING' | 'OVERDUE' = 'PAID';
          if (current === 'PAID') next = 'PENDING';
          else if (current === 'PENDING') next = 'OVERDUE';
          else next = 'PAID';
          return { ...p, visualStatus: next };
        }
        return p;
      }));
    }
  };

  // SALES WORKFLOW MANAGEMENT
"""
content = content.replace("  // SALES WORKFLOW MANAGEMENT", impl_code)

# Add to exports
exports = "        updateSaleWorkflow,"
if 'toggleTransactionVisualStatus,' not in content:
    content = content.replace(exports, exports + "\n        toggleTransactionVisualStatus,")

with open('src/context/ERPContext.tsx', 'w') as f:
    f.write(content)
