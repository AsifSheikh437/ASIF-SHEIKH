import re

with open('src/context/LanguageContext.tsx', 'r') as f:
    content = f.read()

# I will just write a new LanguageContext.tsx completely to avoid regex issues.
new_content = """import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type Language = 'en' | 'bn';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  bn: {
    // TopBar
    'nav.profileSettings': 'প্রোফাইল সেটিংস',
    'nav.updateInfo': 'আপনার একাউন্টের ব্যক্তিগত তথ্য আপডেট করুন',
    'nav.close': 'বন্ধ করুন',
    'nav.save': 'তথ্য সংরক্ষণ করুন',
    'nav.uploadPhoto': 'ছবি আপলোড / ক্যামেরা',
    'nav.photoHint': 'JPG, PNG সর্বোচ্চ ২ মেগাবাইট',
    'nav.fullName': 'পুরো নাম *',
    'nav.username': 'ইউজার আইডি (Username)',
    'nav.role': 'রোল (Role)',
    'nav.mobile': 'মোবাইল নম্বর',
    'nav.email': 'ইমেইল অ্যাড্রেস',
    'nav.theme': 'কর্পোরেট কালার থিম (Corporate Color Theme)',
    'nav.language': 'ভাষা পরিবর্তন (Language)',
    'nav.logout': 'লগআউট',
    'nav.notifications': 'নোটিফিকেশন',
    
    // Menu Groups
    'menuGroup.core': 'সাধারণ ও কোর অপারেশন',
    'menuGroup.inventory': 'ইনভেন্টরি ও প্রোডাকশন',
    'menuGroup.accounting': 'অ্যাকাউন্টিং ও ফিন্যান্স',
    'menuGroup.hr': 'লজিস্টিকস ও মানবসম্পদ',
    'menuGroup.reports': 'রিপোর্টস ও অডিট',
    'menuGroup.admin': 'প্রশাসন ও নিয়ন্ত্রণ',

    // Menu Items
    'menu.dashboard': 'ড্যাশবোর্ড',
    'menu.sales': 'সেলস ও ইনভয়েস',
    'menu.purchases': 'পারচেজ ও সাপ্লাই',
    'menu.customers': 'কাস্টমার ও সাপ্লায়ার',
    'menu.inventory': 'ইনভেন্টরি স্টক',
    'menu.batch': 'ব্যাচ ও এক্সপায়ারি',
    'menu.bom': 'প্রোডাকশন (BOM)',
    'menu.cost': 'প্রোডাকশন খরচ',
    'menu.cash': 'ক্যাশ ও ব্যাংক',
    'menu.expenses': 'খরচ (Expenses)',
    'menu.utility': 'ইউটিলিটি ও ভাড়া',
    'menu.owner': 'মালিকানার হিসাব',
    'menu.master': 'খতিয়ান (লেজার)',
    'menu.transport': 'পরিবহন ও ট্রিপ লগ',
    'menu.payroll': 'মানবসম্পদ ও বেতন',
    'menu.assets': 'কারখানা ও অফিস সম্পদ',
    'menu.pnl': 'লাভ-ক্ষতি বিবরণী',
    'menu.monthly': 'মাসিক ও প্রোডাক্ট রিপোর্ট',
    'menu.audit': 'সিস্টেম অডিট ট্রেইল',
    'menu.users': 'ইউজার ম্যানেজমেন্ট',
    'menu.dev': 'সিস্টেম সেটিংস ও ব্যাকআপ',
    
    // UI Elements
    'sidebar.title': 'ফুড ইআরপি মেনুবার',
    'sidebar.close': 'মেনু বন্ধ করুন',
    'sidebar.status': 'সিস্টেম একটিভ',
  },
  en: {
    // TopBar
    'nav.profileSettings': 'Profile Settings',
    'nav.updateInfo': 'Update your account personal information',
    'nav.close': 'Close',
    'nav.save': 'Save Information',
    'nav.uploadPhoto': 'Upload Photo / Camera',
    'nav.photoHint': 'JPG, PNG max 2 MB',
    'nav.fullName': 'Full Name *',
    'nav.username': 'Username',
    'nav.role': 'Role',
    'nav.mobile': 'Mobile Number',
    'nav.email': 'Email Address',
    'nav.theme': 'Corporate Color Theme',
    'nav.language': 'Language',
    'nav.logout': 'Log Out',
    'nav.notifications': 'Notifications',

    // Menu Groups
    'menuGroup.core': 'Core Operations',
    'menuGroup.inventory': 'Inventory & Production',
    'menuGroup.accounting': 'Accounting & Finance',
    'menuGroup.hr': 'Logistics & HR',
    'menuGroup.reports': 'Reports & Audits',
    'menuGroup.admin': 'Administration',

    // Menu Items
    'menu.dashboard': 'Dashboard',
    'menu.sales': 'Sales & Invoices',
    'menu.purchases': 'Purchases & Supply',
    'menu.customers': 'Customers & Suppliers',
    'menu.inventory': 'Inventory Stock',
    'menu.batch': 'Batch & Expiry',
    'menu.bom': 'Production (BOM)',
    'menu.cost': 'Production Costing',
    'menu.cash': 'Cash & Bank',
    'menu.expenses': 'Expenses',
    'menu.utility': 'Utility & Rent',
    'menu.owner': 'Owner Equity',
    'menu.master': 'Master Ledgers',
    'menu.transport': 'Transport & Trip Log',
    'menu.payroll': 'HR & Payroll',
    'menu.assets': 'Factory & Office Assets',
    'menu.pnl': 'Profit & Loss',
    'menu.monthly': 'Monthly & Product Reports',
    'menu.audit': 'System Audit Trail',
    'menu.users': 'User Management',
    'menu.dev': 'System Settings & Backup',

    // UI Elements
    'sidebar.title': 'Food ERP Menu',
    'sidebar.close': 'Close Menu',
    'sidebar.status': 'System Active',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('bn');

  useEffect(() => {
    const savedLang = localStorage.getItem('food_erp_language') as Language;
    if (savedLang === 'en' || savedLang === 'bn') {
      setLanguage(savedLang);
    }
  }, []);

  const toggleLanguage = () => {
    setLanguage(prev => {
      const newLang = prev === 'bn' ? 'en' : 'bn';
      localStorage.setItem('food_erp_language', newLang);
      return newLang;
    });
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
"""
with open('src/context/LanguageContext.tsx', 'w') as f:
    f.write(new_content)
