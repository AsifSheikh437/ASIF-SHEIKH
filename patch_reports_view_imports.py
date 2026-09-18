with open('src/components/views/ReportsView.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'transportTrips,', 
    'transportTrips,\n    ownerWithdrawals,\n    wastageRecords,\n    payrollMode,'
)

content = content.replace(
    'transportTrips, products, ownerWithdrawals: [], wastageRecords: [], monthsCount: 12',
    'transportTrips, products, ownerWithdrawals, wastageRecords, payrollMode, monthsCount: 12'
)

with open('src/components/views/ReportsView.tsx', 'w') as f:
    f.write(content)
