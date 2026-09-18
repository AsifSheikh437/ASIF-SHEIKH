import re

with open('src/components/Navbar.tsx', 'r') as f:
    content = f.read()

# 1. Add Globe icon to imports
content = content.replace("Menu,", "Menu,\n  Globe,")

# 2. Add useLanguage import
import_str = "import { useLanguage } from '../context/LanguageContext';\n"
content = content.replace("import { useERP } from '../context/ERPContext';", import_str + "import { useERP } from '../context/ERPContext';")

# 3. Add useLanguage hook
hook_find = "  const { currentUser, toggleTheme, theme, totalNotifications, unreadNotifications, notifications, markAllNotificationsRead } = useERP();"
hook_repl = "  const { currentUser, toggleTheme, theme, totalNotifications, unreadNotifications, notifications, markAllNotificationsRead } = useERP();\n  const { t, language, toggleLanguage } = useLanguage();"
content = content.replace(hook_find, hook_repl)

# 4. Insert Language Toggle Row
toggle_find = """                  <div className="border-t border-slate-100 my-1"></div>

                  {/* Logout Button */}"""

toggle_repl = """                  <div className="border-t border-slate-100 my-1"></div>

                  {/* Language Toggle Row */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLanguage();
                    }}
                    className="w-full px-4 py-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors select-none group"
                    title={language === 'bn' ? 'Switch to English' : 'বাংলায় পরিবর্তন করুন'}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors bg-slate-100 text-slate-700">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{t('nav.language')}</span>
                        <span className="text-[10px] text-slate-500">
                          {language === 'bn' ? 'বাংলা সক্রিয় (Bengali)' : 'English Active'}
                        </span>
                      </div>
                    </div>

                    {/* Animated switch toggle */}
                    <div className={`w-10 h-5 rounded-full transition-colors flex items-center p-0.5 ${
                      language === 'bn' ? 'bg-teal-600 justify-start' : 'bg-blue-600 justify-end'
                    }`}>
                      <div className="w-4 h-4 rounded-full bg-white shadow-xs flex items-center justify-center text-[8px] font-bold">
                        {language === 'bn' ? 'বাং' : 'EN'}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 my-1"></div>

                  {/* Logout Button */}"""
content = content.replace(toggle_find, toggle_repl)


with open('src/components/Navbar.tsx', 'w') as f:
    f.write(content)
