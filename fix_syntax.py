with open('src/context/ERPContext.tsx', 'r') as f:
    content = f.read()

content = content.replace("  // SALES WORKFLOW MANAGEMENT\n (Step 1", "  // SALES WORKFLOW MANAGEMENT (Step 1")

with open('src/context/ERPContext.tsx', 'w') as f:
    f.write(content)
