import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { HumanHandoffModal } from './components/common/HumanHandoffModal';

// Screens
import { LandingPage } from './components/screens/LandingPage';
import { BusinessProfileSetup } from './components/screens/BusinessProfileSetup';
import { IntelligentAdvisor } from './components/screens/IntelligentAdvisor';
import { ProductCatalogue } from './components/screens/ProductCatalogue';
import { BundleComparisonCheckout } from './components/screens/BundleComparisonCheckout';
import { SmartKycVerification } from './components/screens/SmartKycVerification';
import { OrderTracker } from './components/screens/OrderTracker';
import { AdminDashboardOverview } from './components/screens/AdminDashboardOverview';
import { AdminLeadsOrders } from './components/screens/AdminLeadsOrders';

const MainContent: React.FC = () => {
  const { screen, toastMessage } = useApp();

  const renderScreen = () => {
    switch (screen) {
      case 'landing':
        return <LandingPage />;
      case 'profile':
        return <BusinessProfileSetup />;
      case 'advisor':
        return <IntelligentAdvisor />;
      case 'catalogue':
        return <ProductCatalogue />;
      case 'checkout':
        return <BundleComparisonCheckout />;
      case 'kyc':
        return <SmartKycVerification />;
      case 'order':
        return <OrderTracker />;
      case 'admin_overview':
        return <AdminDashboardOverview />;
      case 'admin_leads':
        return <AdminLeadsOrders />;
      default:
        return <LandingPage />;
    }
  };

  const isLanding = screen === 'landing';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-[#E40000] selection:text-white">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        {!isLanding && <Sidebar />}

        <main className={`flex-1 overflow-y-auto bg-slate-50/50 ${!isLanding ? 'pb-16 md:pb-0' : ''}`}>
          {renderScreen()}
        </main>
      </div>

      <HumanHandoffModal />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center space-x-2 animate-fade-in border border-slate-800">
          <div className="w-2 h-2 rounded-full bg-[#E40000] animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
