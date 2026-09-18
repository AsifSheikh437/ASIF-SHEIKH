with open('src/types.ts', 'r') as f:
    content = f.read()

content = content.replace("  visualStatus?: 'PAID' | 'PENDING' | 'OVERDUE';\n  paidAmount: number;", "  paidAmount: number;")

with open('src/types.ts', 'w') as f:
    f.write(content)
