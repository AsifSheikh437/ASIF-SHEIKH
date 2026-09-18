import re

with open('src/utils/genericPdfGenerator.ts', 'r') as f:
    content = f.read()

# Change save
save_find = """  if (returnBlob) {
    return doc.output('blob');
  } else {
    doc.save(`${title.replace(/ /g, '_')}_${new Date().getTime()}.pdf`);
  }
};"""
save_repl = """  const blob = doc.output('blob');
  if (returnBlob) {
    return blob;
  } else {
    window.dispatchEvent(new CustomEvent('preview-pdf', {
      detail: { blob, filename: `${title.replace(/ /g, '_')}_${new Date().getTime()}.pdf`, title: title }
    }));
  }
};"""
content = content.replace(save_find, save_repl)

with open('src/utils/genericPdfGenerator.ts', 'w') as f:
    f.write(content)
