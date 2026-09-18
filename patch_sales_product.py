import re

with open('src/components/views/SalesInvoiceView.tsx', 'r') as f:
    content = f.read()

select_pattern = r'<select\s+value=\{row\.productId\}\s+onChange=\{e => handleItemProductChange\(idx, e\.target\.value\)\}\s+className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"\s*>\s*\{products\.map\(p => \(\s*<option key=\{p\.id\} value=\{p\.id\}>\s*\{p\.nameBangla\} \(স্টক: \{p\.currentStock\} \{p\.unit\}\)\s*</option>\s*\)\)\}\s*</select>'

replacement = """<SearchableProductSelect
                            products={products}
                            value={row.productId}
                            onChange={(val) => handleItemProductChange(idx, val)}
                          />"""

if re.search(select_pattern, content):
    content = re.sub(select_pattern, replacement, content)
    with open('src/components/views/SalesInvoiceView.tsx', 'w') as f:
        f.write(content)
    print("Patched successfully")
else:
    print("Pattern not found")
