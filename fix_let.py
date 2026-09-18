with open('src/utils/invoicePdfGenerator.ts', 'r') as f:
    content = f.read()

content = content.replace("let currentY = finalY + 10;", "currentY = finalY + 10;")
content = content.replace("let currentY = 35;", "let currentY = 35;")

with open('src/utils/invoicePdfGenerator.ts', 'w') as f:
    f.write(content)
