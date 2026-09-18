with open('src/data/initialData.ts', 'r') as f:
    content = f.read()

import re

search = """export const initialSettings: ERPSettings = {
  companyNameBangla: 'সোনালী ফুডস অ্যান্ড বেকারি লিঃ',"""

replace = """export const initialSettings: ERPSettings = {
  pdfPrintConfig: {
    showAddress: true,
    showContact: true,
    showTaxId: true,
    showLogo: true,
  },
  companyNameBangla: 'সোনালী ফুডস অ্যান্ড বেকারি লিঃ',"""

content = content.replace(search, replace)

with open('src/data/initialData.ts', 'w') as f:
    f.write(content)
