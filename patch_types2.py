with open('src/types.ts', 'r') as f:
    content = f.read()

import re

search = """export interface CompanySettings {
  companyNameBangla: string;"""

replace = """export interface CompanySettings {
  pdfPrintConfig?: {
    showAddress: boolean;
    showContact: boolean;
    showTaxId: boolean;
    showLogo: boolean;
  };
  companyNameBangla: string;"""

content = content.replace(search, replace)

with open('src/types.ts', 'w') as f:
    f.write(content)
