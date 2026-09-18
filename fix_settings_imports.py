with open('src/components/views/SettingsBackupView.tsx', 'r') as f:
    content = f.read()

import re

# Add Printer to lucide-react imports if it's not there
if 'Printer,' not in content:
    content = content.replace('  Settings,\n', '  Printer,\n  Settings,\n')

with open('src/components/views/SettingsBackupView.tsx', 'w') as f:
    f.write(content)
