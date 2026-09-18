import React from 'react';
import { useERP, ModuleKey } from '../context/ERPContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  Menu,
} from 'lucide-react';

interface BottomNavProps {
  onOpenSidebar: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenSidebar }) => {
  const { activeModule, setActiveModule, lowStockCount, canAccess } = useERP();

  const navItems: {
    key: ModuleKey | 'MENU';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    { key: 'DASHBOARD', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
    { key: 'SALES', label: 'সেলস', icon: ShoppingCart },
    { key: 'CUSTOMERS_LEDGER', label: 'লেজার', icon: Users },
    { key: 'INVENTORY', label: 'স্টক', icon: Package, badge: lowStockCount },
    { key: 'MENU', label: 'মেনু', icon: Menu },
  ];

  return (
    <nav
      id="mobile-bottom-nav"
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-1 py-1 flex items-center justify-around safe-area-pb"
    >
      {navItems.map(item => {
        const Icon = item.icon;
        const isMenu = item.key === 'MENU';
        const isActive = !isMenu && activeModule === item.key;
        
        // Hide if not accessible (unless it's the Menu button)
        if (!isMenu && !canAccess(item.key as ModuleKey)) return null;

        return (
          <button
            key={item.key}
            id={`bottom-nav-${item.key.toLowerCase()}`}
            type="button"
            onClick={() => {
              if (isMenu) {
                onOpenSidebar();
              } else {
                setActiveModule(item.key as ModuleKey);
              }
            }}
            className={`flex-1 min-h-[48px] py-1 px-1 flex flex-col items-center justify-center rounded-xl transition-all relative select-none touch-manipulation ${
              isActive
                ? 'text-teal-600 dark:text-teal-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
            }`}
          >
            <div className="relative">
              <Icon
                className={`w-5 h-5 transition-transform ${
                  isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                }`}
              />
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 bg-amber-500 text-slate-950 font-black text-[9px] rounded-full flex items-center justify-center shadow-xs ring-1 ring-white dark:ring-slate-900">
                  {item.badge}
                </span>
              )}
            </div>
            <span
              className={`text-[11px] mt-0.5 tracking-tight leading-none truncate max-w-full ${
                isActive ? 'font-bold' : ''
              }`}
            >
              {item.label}
            </span>
            {isActive && (
              <span className="w-1 h-1 bg-teal-600 dark:bg-teal-400 rounded-full mt-0.5"></span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
