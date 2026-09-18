with open('src/components/views/SettingsBackupView.tsx', 'r') as f:
    content = f.read()

import re

# Add state for PDF print config
state_find = """  const [formData, setFormData] = useState<ERPSettings>(settings);"""
state_repl = """  const [formData, setFormData] = useState<ERPSettings>(settings);
  const [pdfConfig, setPdfConfig] = useState(
    settings.pdfPrintConfig || {
      showAddress: true,
      showContact: true,
      showTaxId: true,
      showLogo: true,
    }
  );"""
content = content.replace(state_find, state_repl)

# Update handleSaveSettings
save_find = """  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSaveMessage('সেটিংস সফলভাবে আপডেট ও সংরক্ষিত হয়েছে!');
    setTimeout(() => setSaveMessage(null), 3000);
  };"""
save_repl = """  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({ ...formData, pdfPrintConfig: pdfConfig });
    setSaveMessage('সেটিংস সফলভাবে আপডেট ও সংরক্ষিত হয়েছে!');
    setTimeout(() => setSaveMessage(null), 3000);
  };"""
content = content.replace(save_find, save_repl)

# Add PDF configuration UI
ui_find = """      {/* TAB 2: FINANCIAL & TAX POLICY */}"""
ui_repl = """      {/* TAB 2.5: PDF INVOICE & REPORT CONFIGURATION */}
      {activeTab === 'PDF_CONFIG' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-teal-700" />
                <h3 className="font-bold text-slate-900 text-sm">
                  PDF ইনভয়েস ও রিপোর্ট কনফিগারেশন
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">প্রিন্টেড ডকুমেন্টের ভিজ্যুয়াল আউটপুট কন্ট্রোল</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <label className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl cursor-pointer transition-colors">
                <div>
                  <div className="text-sm font-bold text-slate-800">প্রতিষ্ঠানের ঠিকানা (Address)</div>
                  <div className="text-xs text-slate-500 mt-1">ইনভয়েস ও রেকর্ডে ঠিকানা প্রদর্শন করুন</div>
                </div>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={pdfConfig.showAddress} onChange={(e) => setPdfConfig({...pdfConfig, showAddress: e.target.checked})} />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </div>
              </label>

              <label className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl cursor-pointer transition-colors">
                <div>
                  <div className="text-sm font-bold text-slate-800">যোগাযোগের তথ্য (Phone & Email)</div>
                  <div className="text-xs text-slate-500 mt-1">কন্টাক্ট নম্বর ও ইমেইল প্রিন্টে দেখান</div>
                </div>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={pdfConfig.showContact} onChange={(e) => setPdfConfig({...pdfConfig, showContact: e.target.checked})} />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </div>
              </label>

              <label className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl cursor-pointer transition-colors">
                <div>
                  <div className="text-sm font-bold text-slate-800">ট্যাক্স ও লাইসেন্স (BIN/TIN)</div>
                  <div className="text-xs text-slate-500 mt-1">সরকারি রেজিস্ট্রেশন নম্বর প্রিন্টে দেখান</div>
                </div>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={pdfConfig.showTaxId} onChange={(e) => setPdfConfig({...pdfConfig, showTaxId: e.target.checked})} />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </div>
              </label>
              
              <label className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl cursor-pointer transition-colors">
                <div>
                  <div className="text-sm font-bold text-slate-800">কোম্পানি লোগো (Logo)</div>
                  <div className="text-xs text-slate-500 mt-1">ডকুমেন্ট হেডারে ব্র্যান্ড লোগো প্রিন্ট করুন</div>
                </div>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={pdfConfig.showLogo} onChange={(e) => setPdfConfig({...pdfConfig, showLogo: e.target.checked})} />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-8 py-3.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-2xl shadow-xs transition-colors"
            >
              <Save className="w-5 h-5" />
              সেটিংস সেভ করুন
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: FINANCIAL & TAX POLICY */}"""
content = content.replace(ui_find, ui_repl)

# Add Tab Button
tab_find = """        <button
          onClick={() => setActiveTab('CURRENCY')}"""
tab_repl = """        <button
          onClick={() => setActiveTab('PDF_CONFIG')}
          className={`px-4 py-2 text-[13px] font-bold rounded-xl transition-colors shrink-0 ${
            activeTab === 'PDF_CONFIG'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          PDF ইনভয়েস কনফিগারেশন
        </button>
        <button
          onClick={() => setActiveTab('CURRENCY')}"""
content = content.replace(tab_find, tab_repl)

# Fix useState types
state_type_find = """  const [activeTab, setActiveTab] = useState<'PROFILE' | 'FINANCIAL' | 'CURRENCY' | 'WORKSPACE' | 'BACKUP' | 'DEVELOPER' | 'ROLE_MGT'>('PROFILE');"""
state_type_repl = """  const [activeTab, setActiveTab] = useState<'PROFILE' | 'FINANCIAL' | 'PDF_CONFIG' | 'CURRENCY' | 'WORKSPACE' | 'BACKUP' | 'DEVELOPER' | 'ROLE_MGT'>('PROFILE');"""
content = content.replace(state_type_find, state_type_repl)

with open('src/components/views/SettingsBackupView.tsx', 'w') as f:
    f.write(content)
