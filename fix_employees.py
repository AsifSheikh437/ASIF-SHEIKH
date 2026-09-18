with open('src/components/views/ReportsView.tsx', 'r') as f:
    content = f.read()

content = content.replace("salaryRecords,", "salaryRecords,\n    employees,")

with open('src/components/views/ReportsView.tsx', 'w') as f:
    f.write(content)
