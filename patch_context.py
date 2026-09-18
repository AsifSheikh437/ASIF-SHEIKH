import re

with open('src/context/ERPContext.tsx', 'r') as f:
    content = f.read()

target = "  useEffect(() => { saveStored('SETTINGS', settings); }, [settings]);"
replacement = """  useEffect(() => { 
    saveStored('SETTINGS', settings); 
    if (typeof document !== 'undefined') {
      document.title = settings.companyNameBangla || settings.companyNameEnglish || 'ERP System';
    }
  }, [settings]);"""

content = content.replace(target, replacement)

with open('src/context/ERPContext.tsx', 'w') as f:
    f.write(content)

