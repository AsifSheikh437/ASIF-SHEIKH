with open('src/components/views/SettingsBackupView.tsx', 'r') as f:
    content = f.read()

import re

# Update handleSaveSettings
save_find = """    updateSettings(formData);
    setSaveSuccess(true);"""
save_repl = """    updateSettings({ ...formData, pdfPrintConfig: pdfConfig });
    setSaveSuccess(true);"""
content = content.replace(save_find, save_repl)

with open('src/components/views/SettingsBackupView.tsx', 'w') as f:
    f.write(content)
