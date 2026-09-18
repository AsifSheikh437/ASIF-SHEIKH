with open('src/components/views/ReportsView.tsx', 'r') as f:
    content = f.read()

import re

# Fix employees, employees,
content = content.replace("employees, employees,", "employees,")

# Fix duplicate parameters
bad_str = "ownerWithdrawals,\n    wastageRecords,\n    payrollMode, products, ownerWithdrawals: [], wastageRecords: [], monthsCount: 12"
good_str = "products, ownerWithdrawals, wastageRecords, payrollMode, monthsCount: 12"
content = content.replace(bad_str, good_str)

with open('src/components/views/ReportsView.tsx', 'w') as f:
    f.write(content)
