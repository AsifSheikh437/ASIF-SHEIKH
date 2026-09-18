import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useERP, ModuleKey } from '../context/ERPContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Truck,
  Users,
  Building,
  Package,
  CalendarClock,
  ChefHat,
  Calculator,
  Car,
  Landmark,
  Receipt,
  Zap,
  ArrowDownCircle,
  UserCheck,
  Cpu,
  BookOpen,
  LineChart,
  CalendarDays,
  Sliders,
  History,
  X,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
}

interface MenuItem {
  key: ModuleKey;
  label: string;
  subLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  badgeType?: 'warning' | 'danger' | 'info';
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const { activeModule, setActiveModule, canAccess, lowStockCount, expiringBatchesCount } = useERP();
  const { t } = useLanguage();

  const menuGroups: MenuGroup[] = [
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
  ];

  const handleItemClick = (key: ModuleKey) => {
    setActiveModule(key);
    // On mobile devices (< 768px), auto-dismiss the slide-in drawer.
    // On desktop, the sidebar persists so the user can easily switch views.
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Screen Dimming Backdrop */}
      {isOpen && (
        <div
          id="sidebar-mobile-backdrop"
          onClick={onCloseMobile}
          className="fixed inset-0 z-45 bg-slate-950/70 backdrop-blur-xs md:hidden transition-opacity cursor-pointer"
          aria-hidden="true"
        />
      )}

      {/* Corporate Enterprise Sidebar Container / Slide-in Drawer */}
      <aside
        id="app-corporate-sidebar"
        aria-label="Corporate ERP Navigation"
        className={`fixed md:static top-0 md:top-auto left-0 bottom-0 z-50 md:z-30 h-full bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col transition-all duration-300 ease-in-out select-none shadow-2xl md:shadow-none w-[85%] max-w-[320px] md:max-w-none ${
          isOpen
            ? 'translate-x-0 pointer-events-auto visible md:w-72'
            : '-translate-x-full pointer-events-none invisible md:visible md:translate-x-0 md:w-0 md:overflow-hidden md:border-r-0 md:pointer-events-none'
        }`}
      >
        {/* Mobile Header Close Bar */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800 md:hidden bg-slate-950/80">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-ping"></div>
            <span className="font-bold text-white text-sm">{t('sidebar.title')}</span>
          </div>
          <button
            onClick={onCloseMobile}
            className="w-11 h-11 flex items-center justify-center text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            title={t('sidebar.close')}
            aria-label={t('sidebar.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 text-xs scrollbar-thin scrollbar-thumb-slate-700">
          {menuGroups.map((group, groupIdx) => {
            const accessibleItems = group.items.filter(item => canAccess(item.key));
            if (accessibleItems.length === 0) return null;

            return (
              <div key={groupIdx} className="space-y-1">
                {/* Clean Corporate Section Label */}
                <div className="px-3 pt-2 text-[11px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center justify-between">
                  <span>{group.title}</span>
                  <div className="h-px flex-1 ml-3 bg-slate-800/80"></div>
                </div>

                <div className="space-y-1 mt-1">
                  {accessibleItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activeModule === item.key;

                    return (
                      <button
                        key={item.key}
                        id={`nav-item-${item.key.toLowerCase()}`}
                        onClick={() => handleItemClick(item.key)}
                        className={`w-full min-h-[44px] flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-150 relative group cursor-pointer touch-manipulation ${
                          isActive
                            ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white font-bold shadow-md ring-1 ring-teal-400/30'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white font-medium'
                        }`}
                      >
                        {/* Active Left Indicator Pill */}
                        {isActive && (
                          <span className="absolute left-1 top-2 bottom-2 w-1 bg-white rounded-full"></span>
                        )}

                        <div className="flex items-center gap-2.5 min-w-0 pl-1">
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-transform duration-150 ${
                              isActive
                                ? 'text-white scale-110'
                                : 'text-slate-400 group-hover:text-teal-400 group-hover:scale-105'
                            }`}
                          />
                          <div className="flex flex-col truncate">
                            <span className="truncate leading-tight">{item.label}</span>
                          </div>
                        </div>

                        {/* Numeric Alerts Badge */}
                        {item.badge !== undefined && item.badge > 0 && (
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-black rounded-full shrink-0 ${
                              isActive
                                ? 'bg-white text-teal-800'
                                : item.badgeType === 'danger'
                                ? 'bg-rose-500/90 text-white'
                                : 'bg-amber-500/90 text-slate-950 font-extrabold'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar Corporate Footer */}
        <div className="p-3 border-t border-slate-800/90 bg-slate-950/60 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-semibold text-slate-300">{t('sidebar.status')}</span>
          </div>
          <span className="text-teal-400 font-mono text-[10px] bg-teal-950/60 px-1.5 py-0.5 rounded border border-teal-800/40">
            Enterprise ERP
          </span>
        </div>
      </aside>
    </>
  );
};
