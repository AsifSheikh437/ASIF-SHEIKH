import re
with open('src/types.ts', 'r') as f:
    content = f.read()

# Add visualStatus to Sale
if 'visualStatus?:' not in content:
    content = content.replace("currency?: string;", "visualStatus?: 'PAID' | 'PENDING' | 'OVERDUE';\n  currency?: string;")
    content = content.replace("paidAmount: number;", "visualStatus?: 'PAID' | 'PENDING' | 'OVERDUE';\n  paidAmount: number;", 1) # Purchase

with open('src/types.ts', 'w') as f:
    f.write(content)
