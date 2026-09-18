import re

with open('src/components/Sidebar.tsx', 'r') as f:
    content = f.read()

# I will find `const { activeModule, setActiveModule, canAccess, lowStockCount, expiringBatchesCount } = useERP();`
# and add `const { t } = useLanguage();` right after.
hook_find = "  const { activeModule, setActiveModule, canAccess, lowStockCount, expiringBatchesCount } = useERP();"
hook_repl = "  const { activeModule, setActiveModule, canAccess, lowStockCount, expiringBatchesCount } = useERP();\n  const { t } = useLanguage();"
content = content.replace(hook_find, hook_repl)

# Now just dynamically translate any string inside Sidebar using t()
# It's better to just write the array explicitly. Let's replace the whole menuGroups definition.
menu_find = r"  const menuGroups: MenuGroup\[\] = \[.*?\n  \];"
menu_repl = """  const menuGroups: MenuGroup[] = [
    {
      title: t('menuGroup.core'),
      items: [
        { key: 'DASHBOARD', label: t('menu.dashboard'), icon: LayoutDashboard },
        { key: 'SALES', label: t('menu.sales'), icon: ShoppingCart, badge: 2, badgeType: 'warning' },
        { key: 'PURCHASE', label: t('menu.purchases'), icon: Truck },
        { key: 'CUSTOMERS_LEDGER', label: t('menu.customers'), icon: Users },
      ],
    },
    {
      title: t('menuGroup.inventory'),
      items: [
        { key: 'INVENTORY', label: t('menu.inventory'), icon: Package, badge: lowStockCount, badgeType: 'danger' },
        { key: 'BATCH_EXPIRY', label: t('menu.batch'), icon: CalendarClock, badge: expiringBatchesCount, badgeType: 'warning' },
        { key: 'PRODUCTION_BOM', label: t('menu.bom'), icon: ChefHat },
        { key: 'PRODUCTION_COST', label: t('menu.cost'), icon: Calculator },
      ],
    },
    {
      title: t('menuGroup.accounting'),
      items: [
        { key: 'CASH_BANK', label: t('menu.cash'), icon: Landmark },
        { key: 'EXPENSES', label: t('menu.expenses'), icon: Receipt },
        { key: 'UTILITY_RENT', label: t('menu.utility'), icon: Zap },
        { key: 'OWNER_WITHDRAWAL', label: t('menu.owner'), icon: ArrowDownCircle },
        { key: 'MASTER_LEDGERS', label: t('menu.master'), icon: BookOpen },
      ],
    },
    {
      title: t('menuGroup.hr'),
      items: [
        { key: 'TRANSPORT', label: t('menu.transport'), icon: Car },
        { key: 'HR_PAYROLL', label: t('menu.payroll'), icon: UserCheck },
        { key: 'DEPARTMENT_ASSETS', label: t('menu.assets'), icon: Cpu },
      ],
    },
    {
      title: t('menuGroup.reports'),
      items: [
        { key: 'REPORTS_PNL', label: t('menu.pnl'), icon: LineChart },
        { key: 'MONTHLY_REPORTS', label: t('menu.monthly'), icon: CalendarDays },
        { key: 'AUDIT_LOGS', label: t('menu.audit'), icon: History },
      ],
    },
    {
      title: t('menuGroup.admin'),
      items: [
        { key: 'USERS_MANAGEMENT', label: t('menu.users'), icon: Users },
        { key: 'DEV_SETTINGS', label: t('menu.dev'), icon: Sliders },
      ],
    },
  ];"""
content = re.sub(menu_find, menu_repl, content, flags=re.DOTALL)

# Translate standard UI elements
content = content.replace("<span>ফুড ইআরপি মেনুবার</span>", "<span>{t('sidebar.title')}</span>")
content = content.replace('title="মেনু বন্ধ করুন"', "title={t('sidebar.close')}")
content = content.replace('aria-label="মেনু বন্ধ করুন"', "aria-label={t('sidebar.close')}")
content = content.replace("<span>সিস্টেম একটিভ</span>", "<span>{t('sidebar.status')}</span>")

with open('src/components/Sidebar.tsx', 'w') as f:
    f.write(content)
