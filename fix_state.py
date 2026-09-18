with open('src/components/views/SettingsBackupView.tsx', 'r') as f:
    content = f.read()

import re

state_find = """  const [activeTab, setActiveTab] = useState<'PROFILE' | 'FINANCIAL' | 'PDF_CONFIG' | 'CURRENCY' | 'WORKSPACE' | 'BACKUP' | 'DEVELOPER' | 'ROLE_MGT'>('PROFILE');"""
state_repl = """  const [activeTab, setActiveTab] = useState<'PROFILE' | 'FINANCIAL' | 'PDF_CONFIG' | 'CURRENCY' | 'WORKSPACE' | 'BACKUP' | 'DEVELOPER' | 'ROLE_MGT' | 'PDF_CONFIG'>('PROFILE');"""
content = content.replace(state_find, state_repl)

# For invoice generator
with open('src/utils/invoicePdfGenerator.ts', 'r') as f:
    inv = f.read()

inv = inv.replace("currentY = finalY + 10;", "let currentY = finalY + 10;")

with open('src/utils/invoicePdfGenerator.ts', 'w') as f:
    f.write(inv)

