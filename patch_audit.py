import re

with open('src/components/views/AuditLogsView.tsx', 'r') as f:
    content = f.read()

# 1. Update state
state_find = """  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [isExportingPDF, setIsExportingPDF] = useState(false);"""
state_repl = """  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('ALL');
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const uniqueUsers = Array.from(new Set(auditLogs.map(log => log.userName)));"""
content = content.replace(state_find, state_repl)

# 2. Update soft reset
reset_find = """  const handleSoftReset = () => {
    setSearchTerm('');
    setFilterAction('ALL');
  };"""
reset_repl = """  const handleSoftReset = () => {
    setSearchTerm('');
    setFilterAction('ALL');
    setStartDate('');
    setEndDate('');
    setSelectedUser('ALL');
  };"""
content = content.replace(reset_find, reset_repl)

# 3. Update filter logic
filter_find = """  const filteredLogs = auditLogs.filter(log => {
    const matchSearch =
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());

    const matchAction = filterAction === 'ALL' ? true : log.action.includes(filterAction);

    return matchSearch && matchAction;
  });"""
filter_repl = """  const filteredLogs = auditLogs.filter(log => {
    const matchSearch =
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());

    const matchAction = filterAction === 'ALL' ? true : log.action.includes(filterAction);
    const matchUser = selectedUser === 'ALL' ? true : log.userName === selectedUser;

    const logDate = new Date(log.timestamp).toISOString().split('T')[0];
    const matchStartDate = startDate ? logDate >= startDate : true;
    const matchEndDate = endDate ? logDate <= endDate : true;

    return matchSearch && matchAction && matchUser && matchStartDate && matchEndDate;
  });"""
content = content.replace(filter_find, filter_repl)

# 4. Update UI
ui_find = """      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="ইউজারের নাম, অ্যাকশন বা বিবরণ দিয়ে অনুসন্ধান করুন..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <select
          value={filterAction}
          onChange={e => setFilterAction(e.target.value)}
          className="w-full sm:w-56 py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="ALL">সকল অ্যাকশন</option>
          <option value="LOGIN">লগইন কার্যক্রম (Login)</option>
          <option value="SALE">বিক্রয় ইনভয়েস (Sale)</option>
          <option value="PURCHASE">পারচেজ ও মাল গ্রহণ (Purchase)</option>
          <option value="PRODUCTION">উৎপাদন ও রান (Production)</option>
          <option value="STOCK">স্টক সমন্বয় (Stock)</option>
          <option value="EXPENSE">খরচ ও উত্তোলন (Expense)</option>
          <option value="SECURITY">নিরাপত্তা ও অ্যাক্সেস (Security/RBAC)</option>
        </select>

        <button
          id="btn-audit-soft-reset"
          onClick={handleSoftReset}
          className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
          title="অডিট লগ ফিল্টার রিসেট করুন (Soft Reset)"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>রিসেট</span>
        </button>
      </div>"""
ui_repl = """      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="ইউজারের নাম, অ্যাকশন বা বিবরণ দিয়ে অনুসন্ধান করুন..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap hidden sm:inline">তারিখ হতে:</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full sm:w-auto py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
              title="শুরুর তারিখ"
            />
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap hidden sm:inline">পর্যন্ত:</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full sm:w-auto py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
              title="শেষের তারিখ"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <div className="flex items-center gap-2 flex-1 w-full">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
              className="flex-1 py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">সকল মডিউল/অ্যাকশন</option>
              <option value="LOGIN">লগইন কার্যক্রম (Login)</option>
              <option value="SALE">বিক্রয় ইনভয়েস (Sale)</option>
              <option value="PURCHASE">পারচেজ ও মাল গ্রহণ (Purchase)</option>
              <option value="PRODUCTION">উৎপাদন ও রান (Production)</option>
              <option value="STOCK">স্টক সমন্বয় (Stock)</option>
              <option value="EXPENSE">খরচ ও উত্তোলন (Expense)</option>
              <option value="SECURITY">নিরাপত্তা ও অ্যাক্সেস (Security/RBAC)</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2 flex-1 w-full">
            <UserCheck className="w-4 h-4 text-slate-400" />
            <select
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
              className="flex-1 py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">সকল ইউজার</option>
              {uniqueUsers.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
          </div>

          <button
            id="btn-audit-soft-reset"
            onClick={handleSoftReset}
            className="flex justify-center items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap w-full sm:w-auto"
            title="অডিট লগ ফিল্টার রিসেট করুন (Soft Reset)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>রিসেট ফিল্টার</span>
          </button>
        </div>
      </div>"""
content = content.replace(ui_find, ui_repl)

with open('src/components/views/AuditLogsView.tsx', 'w') as f:
    f.write(content)
