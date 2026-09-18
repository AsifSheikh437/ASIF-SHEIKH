import re

with open('src/components/Sidebar.tsx', 'r') as f:
    content = f.read()

import_str = "import { useLanguage } from '../context/LanguageContext';\n"
content = content.replace("import { useERP, ModuleKey } from '../context/ERPContext';", import_str + "import { useERP, ModuleKey } from '../context/ERPContext';")

# Replace menuGroups array
menu_find = """  const menuGroups = [
    {
      title: 'সাধারণ ও কোর অপারেশন',
      items: [
        { key: 'DASHBOARD', label: 'ড্যাশবোর্ড', subLabel: 'সিস্টেম ওভারভিউ', icon: LayoutDashboard },
        { key: 'SALES', label: 'সেলস ও ইনভয়েস', subLabel: 'বিক্রয় ও বিলিং', icon: ShoppingCart, badge: 2, badgeType: 'warning' },
        { key: 'PURCHASE', label: 'পারচেজ ও সাপ্লাই', subLabel: 'ক্রয় ও সরবরাহ', icon: Truck },
        { key: 'CUSTOMERS_LEDGER', label: 'কাস্টমার ও সাপ্লায়ার', subLabel: 'পার্টি খতিয়ান', icon: Users },
      ],
    },
    {
      title: 'ইনভেন্টরি ও প্রোডাকশন',
      items: [
        { key: 'INVENTORY', label: 'ইনভেন্টরি স্টক', subLabel: 'মজুদ পরিচালনা', icon: Package },
        { key: 'BATCH_EXPIRY', label: 'ব্যাচ ও এক্সপায়ারি', subLabel: 'মেয়াদ ট্র্যাকিং', icon: CalendarClock },
        { key: 'PRODUCTION_BOM', label: 'প্রোডাকশন (BOM)', subLabel: 'রেসিপি ও উৎপাদন', icon: ChefHat },
        { key: 'PRODUCTION_COST', label: 'প্রোডাকশন খরচ', subLabel: 'কস্টিং হিসাব', icon: Calculator },
      ],
    },
    {
      title: 'অ্যাকাউন্টিং ও ফিন্যান্স',
      items: [
        { key: 'CASH_BANK', label: 'ক্যাশ ও ব্যাংক', subLabel: 'তহবিল ও লেনদেন', icon: Landmark },
        { key: 'EXPENSES', label: 'খরচ (Expenses)', subLabel: 'দৈনন্দিন ব্যয়', icon: Receipt },
        { key: 'UTILITY_RENT', label: 'ইউটিলিটি ও ভাড়া', subLabel: 'বিল ও ফি', icon: Zap },
        { key: 'OWNER_WITHDRAWAL', label: 'মালিকানার হিসাব', subLabel: 'মালিকানার হিসাব', icon: ArrowDownCircle },
        { key: 'MASTER_LEDGERS', label: 'খতিয়ান (লেজার)', subLabel: 'সকল হিসাবের খতিয়ান', icon: BookOpen },
      ],
    },
    {
      title: 'লজিস্টিকস ও মানবসম্পদ',
      items: [
        { key: 'TRANSPORT', label: 'পরিবহন ও ট্রিপ লগ', subLabel: 'যাতায়াত ও পরিবহন', icon: Car },
        { key: 'HR_PAYROLL', label: 'মানবসম্পদ ও বেতন', subLabel: 'কর্মচারী বিবরণী', icon: UserCheck },
        { key: 'DEPARTMENT_ASSETS', label: 'কারখানা ও অফিস সম্পদ', subLabel: 'স্থায়ী সম্পদ', icon: Cpu },
      ],
    },
    {
      title: 'রিপোর্টস ও অডিট',
      items: [
        { key: 'REPORTS_PNL', label: 'লাভ-ক্ষতি বিবরণী', subLabel: 'আয়-ব্যয় হিসাব', icon: LineChart },
        { key: 'MONTHLY_REPORTS', label: 'মাসিক ও প্রোডাক্ট রিপোর্ট', subLabel: 'মাসিক পরিসংখ্যান', icon: CalendarDays },
        { key: 'AUDIT_LOGS', label: 'সিস্টেম অডিট ট্রেইল', subLabel: 'সিস্টেম কার্যকলাপ', icon: History },
      ],
    },
    {
      title: 'প্রশাসন ও নিয়ন্ত্রণ',
      items: [
        { key: 'USERS_MANAGEMENT', label: 'ইউজার ম্যানেজমেন্ট', subLabel: 'ব্যবহারকারী পরিচালনা', icon: Users },
        { key: 'DEV_SETTINGS', label: 'সিস্টেম সেটিংস ও ব্যাকআপ', subLabel: 'কনফিগারেশন', icon: Sliders },
      ],
    },
  ];"""

menu_repl = """  const { t } = useLanguage();
  
  const menuGroups = [
    {
      title: t('menuGroup.core'),
      items: [
        { key: 'DASHBOARD', label: t('menu.dashboard'), subLabel: 'সিস্টেম ওভারভিউ', icon: LayoutDashboard },
        { key: 'SALES', label: t('menu.sales'), subLabel: 'বিক্রয় ও বিলিং', icon: ShoppingCart, badge: 2, badgeType: 'warning' },
        { key: 'PURCHASE', label: t('menu.purchases'), subLabel: 'ক্রয় ও সরবরাহ', icon: Truck },
        { key: 'CUSTOMERS_LEDGER', label: t('menu.customers'), subLabel: 'পার্টি খতিয়ান', icon: Users },
      ],
    },
    {
      title: t('menuGroup.inventory'),
      items: [
        { key: 'INVENTORY', label: t('menu.inventory'), subLabel: 'মজুদ পরিচালনা', icon: Package },
        { key: 'BATCH_EXPIRY', label: t('menu.batch'), subLabel: 'মেয়াদ ট্র্যাকিং', icon: CalendarClock },
        { key: 'PRODUCTION_BOM', label: t('menu.bom'), subLabel: 'রেসিপি ও উৎপাদন', icon: ChefHat },
        { key: 'PRODUCTION_COST', label: t('menu.cost'), subLabel: 'কস্টিং হিসাব', icon: Calculator },
      ],
    },
    {
      title: t('menuGroup.accounting'),
      items: [
        { key: 'CASH_BANK', label: t('menu.cash'), subLabel: 'তহবিল ও লেনদেন', icon: Landmark },
        { key: 'EXPENSES', label: t('menu.expenses'), subLabel: 'দৈনন্দিন ব্যয়', icon: Receipt },
        { key: 'UTILITY_RENT', label: t('menu.utility'), subLabel: 'বিল ও ফি', icon: Zap },
        { key: 'OWNER_WITHDRAWAL', label: t('menu.owner'), subLabel: 'মালিকানার হিসাব', icon: ArrowDownCircle },
        { key: 'MASTER_LEDGERS', label: t('menu.master'), subLabel: 'সকল হিসাবের খতিয়ান', icon: BookOpen },
      ],
    },
    {
      title: t('menuGroup.hr'),
      items: [
        { key: 'TRANSPORT', label: t('menu.transport'), subLabel: 'যাতায়াত ও পরিবহন', icon: Car },
        { key: 'HR_PAYROLL', label: t('menu.payroll'), subLabel: 'কর্মচারী বিবরণী', icon: UserCheck },
        { key: 'DEPARTMENT_ASSETS', label: t('menu.assets'), subLabel: 'স্থায়ী সম্পদ', icon: Cpu },
      ],
    },
    {
      title: t('menuGroup.reports'),
      items: [
        { key: 'REPORTS_PNL', label: t('menu.pnl'), subLabel: 'আয়-ব্যয় হিসাব', icon: LineChart },
        { key: 'MONTHLY_REPORTS', label: t('menu.monthly'), subLabel: 'মাসিক পরিসংখ্যান', icon: CalendarDays },
        { key: 'AUDIT_LOGS', label: t('menu.audit'), subLabel: 'সিস্টেম কার্যকলাপ', icon: History },
      ],
    },
    {
      title: t('menuGroup.admin'),
      items: [
        { key: 'USERS_MANAGEMENT', label: t('menu.users'), subLabel: 'ব্যবহারকারী পরিচালনা', icon: Users },
        { key: 'DEV_SETTINGS', label: t('menu.dev'), subLabel: 'কনফিগারেশন', icon: Sliders },
      ],
    },
  ];"""
content = content.replace(menu_find, menu_repl)

# Update texts
content = content.replace('<span>ফুড ইআরপি মেনুবার</span>', "<span>{t('sidebar.title')}</span>")
content = content.replace('title="মেনু বন্ধ করুন"', "title={t('sidebar.close')}")
content = content.replace('aria-label="মেনু বন্ধ করুন"', "aria-label={t('sidebar.close')}")
content = content.replace('<span>সিস্টেম একটিভ</span>', "<span>{t('sidebar.status')}</span>")

with open('src/components/Sidebar.tsx', 'w') as f:
    f.write(content)
