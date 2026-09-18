with open('src/components/views/SettingsBackupView.tsx', 'r') as f:
    content = f.read()

# Fix activeTab type
content = content.replace(
    "const [activeTab, setActiveTab] = useState<'PROFILE' | 'FINANCIAL' | 'CURRENCY' | 'WORKSPACE' | 'BACKUP'>('PROFILE');",
    "const [activeTab, setActiveTab] = useState<'PROFILE' | 'FINANCIAL' | 'PDF_CONFIG' | 'CURRENCY' | 'WORKSPACE' | 'BACKUP'>('PROFILE');"
)

# Add pdfConfig state right after formData
if "const [pdfConfig, setPdfConfig]" not in content:
    content = content.replace(
        "const [formData, setFormData] = useState<CompanySettings>({ ...settings });",
        """const [formData, setFormData] = useState<CompanySettings>({ ...settings });
  const [pdfConfig, setPdfConfig] = useState(
    settings.pdfPrintConfig || {
      showAddress: true,
      showContact: true,
      showTaxId: true,
      showLogo: true,
    }
  );"""
    )

with open('src/components/views/SettingsBackupView.tsx', 'w') as f:
    f.write(content)
