with open('src/utils/invoicePdfGenerator.ts', 'r') as f:
    content = f.read()

content = content.replace("let currentY = 35;", "let headerCurrentY = 35;")
content = content.replace("currentY += 5;", "headerCurrentY += 5;")
content = content.replace("14, currentY", "14, headerCurrentY")

with open('src/utils/invoicePdfGenerator.ts', 'w') as f:
    f.write(content)
