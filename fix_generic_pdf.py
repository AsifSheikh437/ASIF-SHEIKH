with open('src/utils/genericPdfGenerator.ts', 'r') as f:
    content = f.read()

# Fix types
content = content.replace("const headers = [];", "const headers: string[][] = [];")
content = content.replace("const rows = [];", "const rows: string[][] = [];")

with open('src/utils/genericPdfGenerator.ts', 'w') as f:
    f.write(content)
