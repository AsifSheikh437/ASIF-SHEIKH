import React from 'react';
import { PdfPreviewProvider } from './context/PdfPreviewContext';
import { LanguageProvider } from './context/LanguageContext';
import { ERPProvider, useERP } from './context/ERPContext';
import { InventoryProvider } from './context/InventoryContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { LoginModal } from './components/LoginModal';
import { WhatsAppShareFeedbackModal } from './components/common/WhatsAppShareFeedbackModal';

// Views
import { DashboardView } from './components/views/DashboardView';
import { SalesInvoiceView } from './components/views/SalesInvoiceView';
import { PurchaseSupplyView } from './components/views/PurchaseSupplyView';
import { LedgersView } from './components/views/LedgersView';
import { InventoryStockView } from './components/views/InventoryStockView';
import { BatchExpiryView } from './components/views/BatchExpiryView';
import { ProductionBOMView } from './components/views/ProductionBOMView';
import { ProductionCostView } from './components/views/ProductionCostView';
import { CashBankView } from './components/views/CashBankView';
import { ExpensesView } from './components/views/ExpensesView';
import { UtilityRentView } from './components/views/UtilityRentView';
import { OwnerWithdrawalView } from './components/views/OwnerWithdrawalView';
import { TransportView } from './components/views/TransportView';
import { HRPayrollView } from './components/views/HRPayrollView';
import { DepartmentAssetsView } from './components/views/DepartmentAssetsView';
import { ReportsView } from './components/views/ReportsView';
import { AuditLogsView } from './components/views/AuditLogsView';
import { SettingsBackupView } from './components/views/SettingsBackupView';
import { UserManagementView } from './components/views/UserManagementView';
import { OfflineIndicator } from './components/common/OfflineIndicator';

const MainLayout: React.FC = () => {
  const { currentUser, activeModule, theme, canAccess, logout } = useERP();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return false;
  });

  // Automatically adjust sidebar on window resize
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Idle Timer for Secure Session Timeout (12 hours)
  React.useEffect(() => {
    if (!currentUser) return;

    let idleTimer: ReturnType<typeof setTimeout>;
    
    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        logout();
        console.log('নিরাপত্তার স্বার্থে দীর্ঘক্ষণ নিষ্ক্রিয় থাকায় লগআউট করা হয়েছে। (Session timeout due to inactivity)');
      }, 12 * 60 * 60 * 1000); // 12 hours
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, resetIdleTimer);
    });
    
    resetIdleTimer();
    
    return () => {
      clearTimeout(idleTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetIdleTimer);
      });
    };
  }, [currentUser, logout]);

  // If not authenticated or mandatory password change is required, display login/password change screen
  if (!currentUser || currentUser.mustChangePassword) {
    return <LoginModal />;
  }

  const renderActiveModule = () => {
    // Role-based Access Control (RBAC) Screen Lock check
    if (!canAccess(activeModule)) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-500">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">অ্যাক্সেস সংরক্ষিত</h2>
          <p className="text-sm">এই পেজটি দেখার জন্য আপনার পর্যাপ্ত অনুমতি নেই।</p>
        </div>
      );
    }

    switch (activeModule) {
      case 'DASHBOARD':
        return <DashboardView />;
      case 'SALES':
        return <SalesInvoiceView />;
      case 'PURCHASE':
        return <PurchaseSupplyView />;
      case 'CUSTOMERS_LEDGER':
      case 'SUPPLIERS_LEDGER':
      case 'MASTER_LEDGERS':
        return <LedgersView />;
      case 'INVENTORY':
        return <InventoryStockView />;
      case 'BATCH_EXPIRY':
        return <BatchExpiryView />;
      case 'PRODUCTION_BOM':
        return <ProductionBOMView />;
      case 'PRODUCTION_COST':
        return <ProductionCostView />;
      case 'CASH_BANK':
        return <CashBankView />;
      case 'EXPENSES':
        return <ExpensesView />;
      case 'UTILITY_RENT':
        return <UtilityRentView />;
      case 'OWNER_WITHDRAWAL':
        return <OwnerWithdrawalView />;
      case 'TRANSPORT':
        return <TransportView />;
      case 'HR_PAYROLL':
        return <HRPayrollView />;
      case 'DEPARTMENT_ASSETS':
        return <DepartmentAssetsView />;
      case 'REPORTS_PNL':
      case 'MONTHLY_REPORTS':
        return <ReportsView />;
      case 'AUDIT_LOGS':
        return <AuditLogsView />;
      case 'USERS_MANAGEMENT':
        return <UserManagementView />;
      case 'DEV_SETTINGS':
        return <SettingsBackupView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div
      data-theme={theme}
      className={`h-screen bg-slate-50 text-slate-800 flex flex-col antialiased selection:bg-teal-600 selection:text-white overflow-hidden ${
        theme === 'dark' ? 'dark' : ''
      }`}
    >
      {/* Top Fixed Navbar */}
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Main Workspace Layout with Sidebar & Active View */}
      <div className="flex-1 flex overflow-hidden pt-16">
        {/* Responsive Collapsible Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onCloseMobile={() => setIsSidebarOpen(false)}
        />

        {/* Dynamic Central View Area */}
        <main
          id="main-content-area"
          className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 lg:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full transition-all duration-200"
        >
          {renderActiveModule()}
        </main>
      </div>

      {/* Fixed Mobile Bottom Navigation Bar (4-5 key modules + drawer trigger) */}
      <BottomNav onOpenSidebar={() => setIsSidebarOpen(true)} />
      
      <OfflineIndicator />
    </div>
  );
};

export default function App() {
  return (
    <ERPProvider>
      <LanguageProvider>
        <PdfPreviewProvider>
          <InventoryProvider>
            <MainLayout />
            <WhatsAppShareFeedbackModal />
          </InventoryProvider>
        </PdfPreviewProvider>
      </LanguageProvider>
    </ERPProvider>
  );
}
