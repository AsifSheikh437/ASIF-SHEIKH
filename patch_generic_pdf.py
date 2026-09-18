import re

with open('src/utils/genericPdfGenerator.ts', 'r') as f:
    content = f.read()

# Change signature
sig_find = """export const generateGenericPDF = (
  title: string,
  tableElement: HTMLTableElement,
  settings: CompanySettings
) => {"""
sig_repl = """export const generateGenericPDF = (
  title: string,
  tableElement: HTMLTableElement,
  settings: CompanySettings,
  returnBlob: boolean = false
): Blob | void => {"""
content = content.replace(sig_find, sig_repl)

# Change save
save_find = """  doc.save(`${title.replace(/ /g, '_')}_${new Date().getTime()}.pdf`);
};"""
save_repl = """  if (returnBlob) {
    return doc.output('blob');
  } else {
    doc.save(`${title.replace(/ /g, '_')}_${new Date().getTime()}.pdf`);
  }
};"""
content = content.replace(save_find, save_repl)

with open('src/utils/genericPdfGenerator.ts', 'w') as f:
    f.write(content)
