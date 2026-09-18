import re

with open('src/context/ERPContext.tsx', 'r') as f:
    content = f.read()

# Add a one-time migration in the settings load
target = "const [settings, setSettings] = useState<CompanySettings>(() => loadStored('SETTINGS', INITIAL_COMPANY_SETTINGS));"
replacement = """const [settings, setSettings] = useState<CompanySettings>(() => {
    const loaded = loadStored('SETTINGS', INITIAL_COMPANY_SETTINGS);
    if (loaded.companyNameBangla === 'সোনালী ফুডস অ্যান্ড বেকারি লিঃ' || loaded.companyNameBangla === 'ফুড ইআরপি সিস্টেম') {
        return { ...loaded, companyNameBangla: 'আসিফ ইনভেন্টরি সফটওয়্যার', companyNameEnglish: 'Asif Inventory Software', address: 'ঢাকা, বাংলাদেশ', factoryAddress: 'ঢাকা, বাংলাদেশ' };
    }
    return loaded;
});"""

content = content.replace(target, replacement)

with open('src/context/ERPContext.tsx', 'w') as f:
    f.write(content)

