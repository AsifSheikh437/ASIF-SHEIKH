import re

with open('src/components/views/SettingsBackupView.tsx', 'r') as f:
    content = f.read()

# Add import
if "import { decryptData } from '../../utils/cryptoUtils';" not in content:
    content = content.replace("import { formatDateTime } from '../../utils/formatters';", "import { formatDateTime } from '../../utils/formatters';\nimport { decryptData } from '../../utils/cryptoUtils';")

old_handleFileSelect = """  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const content = event.target?.result as string;
        // Verify JSON parse
        JSON.parse(content);
        setRestoreConfirmModal({
          type: 'FILE',
          fileContent: content,
          fileName: file.name,
        });
      } catch (err) {
        setMessage({ type: 'error', text: 'নির্বাচিত ফাইলটি সঠিক JSON ফরম্যাটে নেই।' });
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be re-selected if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };"""

new_handleFileSelect = """  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        let content = event.target?.result as string;
        
        // Decrypt if it's an encrypted backup
        if (file.name.endsWith('.enc')) {
          try {
            content = decryptData(content);
            if (!content) throw new Error('Decryption failed');
          } catch (decryptErr) {
            setMessage({ type: 'error', text: 'এনক্রিপ্টেড ফাইল ডিক্রিপ্ট করতে সমস্যা হয়েছে। সঠিক ফাইল নির্বাচন করুন।' });
            return;
          }
        }

        // Verify JSON parse
        JSON.parse(content);
        setRestoreConfirmModal({
          type: 'FILE',
          fileContent: content,
          fileName: file.name,
        });
      } catch (err) {
        setMessage({ type: 'error', text: 'নির্বাচিত ফাইলটি সঠিক JSON ফরম্যাটে নেই।' });
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be re-selected if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };"""

content = content.replace(old_handleFileSelect, new_handleFileSelect)

# Also update the file input accept attribute
content = content.replace('accept=".json"', 'accept=".json,.enc"')
content = content.replace('ফাইল থেকে রিস্টোর (.json)', 'ফাইল থেকে রিস্টোর (.json, .enc)')

with open('src/components/views/SettingsBackupView.tsx', 'w') as f:
    f.write(content)

