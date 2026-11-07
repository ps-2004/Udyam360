import React from 'react';
import { useApp } from '../../context/AppContext';
import { AppScreen } from '../../types';
import {
  Home,
  Building2,
  MessageSquareText,
  Layers,
  FileText,
  ShieldCheck,
  PackageCheck,
  Headphones,
  LayoutDashboard,
  Users,
  Package,
  BarChart3,
  UserCheck
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { screen, setScreen, language, setHandoffModalOpen } = useApp();

  const isAdminView = screen === 'admin_overview' || screen === 'admin_leads';

  const customerNav: Array<{ screen: AppScreen; label: string; labelHi: string; icon: React.ReactNode }> = [
    { screen: 'landing', label: 'Home', labelHi: 'होम', icon: <Home className="w-4 h-4" /> },
    { screen: 'profile', label: 'Business Profile', labelHi: 'बिजनेस प्रोफाइल', icon: <Building2 className="w-4 h-4" /> },
    { screen: 'advisor', label: 'Business Advisor', labelHi: 'बिजनेस एडवाइजर', icon: <MessageSquareText className="w-4 h-4" /> },
    { screen: 'catalogue', label: 'Product Catalogue', labelHi: 'उत्पाद कैटलॉग', icon: <Layers className="w-4 h-4" /> },
    { screen: 'checkout', label: 'My Quotes', labelHi: 'मेरे कोट्स', icon: <FileText className="w-4 h-4" /> },
    { screen: 'kyc', label: 'KYC Verification', labelHi: 'केवाईसी सत्यापन', icon: <ShieldCheck className="w-4 h-4" /> },
    { screen: 'order', label: 'My Orders', labelHi: 'मेरे ऑर्डर्स', icon: <PackageCheck className="w-4 h-4" /> },
  ];

  const adminNav = [
    { id: 'admin_overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'admin_leads', label: 'Leads', icon: <Users className="w-4 h-4" /> },
    { id: 'admin_kyc', label: 'KYC Management', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'admin_orders', label: 'Orders', icon: <Package className="w-4 h-4" /> },
    { id: 'admin_analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'admin_users', label: 'Users', icon: <UserCheck className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Desktop/Tablet Sidebar (Hidden on Mobile screens < md) */}
      <aside className="hidden md:flex w-56 lg:w-60 bg-white border-r border-slate-200 shrink-0 flex-col justify-between py-6">
        <div className="px-3 space-y-1">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            {isAdminView ? 'Operations Portal' : 'Enterprise Journey'}
          </p>

          {isAdminView ? (
            adminNav.map((item) => {
              const isActive =
                (item.id === 'admin_overview' && screen === 'admin_overview') ||
                (item.id === 'admin_leads' && screen === 'admin_leads') ||
                (item.id === 'admin_kyc' && screen === 'admin_leads') ||
                (item.id === 'admin_orders' && screen === 'admin_leads') ||
                (item.id === 'admin_analytics' && screen === 'admin_overview');

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'admin_overview' || item.id === 'admin_analytics') {
                      setScreen('admin_overview');
                    } else {
                      setScreen('admin_leads');
                    }
                  }}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs lg:text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-rose-50 text-[#E40000] font-bold border-l-4 border-[#E40000]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className={isActive ? 'text-[#E40000]' : 'text-slate-500'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })
          ) : (
            customerNav.map((item) => {
              const isActive = screen === item.screen;
              return (
                <button
                  key={item.screen}
                  onClick={() => setScreen(item.screen)}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs lg:text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-rose-50 text-[#E40000] font-bold border-l-4 border-[#E40000]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className={isActive ? 'text-[#E40000]' : 'text-slate-500'}>
                    {item.icon}
                  </span>
                  <span>{language === 'hi' ? item.labelHi : item.label}</span>
                </button>
              );
            })
          )}

          {!isAdminView && (
            <button
              onClick={() => setHandoffModalOpen(true)}
              className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs lg:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer mt-2"
            >
              <Headphones className="w-4 h-4 text-slate-500" />
              <span>{language === 'hi' ? 'सहायता / संपर्क' : 'Support'}</span>
            </button>
          )}
        </div>

        <div className="px-4 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="font-bold text-slate-800">
                {isAdminView ? 'Airtel NOC Live' : '24x7 NOC Support'}
              </p>
            </div>
            <p className="text-slate-500 text-[11px] mt-1">
              {isAdminView ? 'Bangalore Core OLT' : '1800-103-4444 (Toll-Free)'}
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (Visible only on mobile devices) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-3 flex items-center justify-around shadow-lg">
        {isAdminView ? (
          <>
            <button
              onClick={() => setScreen('admin_overview')}
              className={`flex flex-col items-center py-1 px-2.5 text-[10px] font-bold ${
                screen === 'admin_overview' ? 'text-[#E40000]' : 'text-slate-500'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="mt-0.5">Overview</span>
            </button>
            <button
              onClick={() => setScreen('admin_leads')}
              className={`flex flex-col items-center py-1 px-2.5 text-[10px] font-bold ${
                screen === 'admin_leads' ? 'text-[#E40000]' : 'text-slate-500'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="mt-0.5">Leads</span>
            </button>
            <button
              onClick={() => setScreen('profile')}
              className="flex flex-col items-center py-1 px-2.5 text-[10px] font-bold text-slate-500"
            >
              <Building2 className="w-4 h-4" />
              <span className="mt-0.5">Customer</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setScreen('advisor')}
              className={`flex flex-col items-center py-1 px-2 text-[10px] font-bold ${
                screen === 'advisor' ? 'text-[#E40000]' : 'text-slate-500'
              }`}
            >
              <MessageSquareText className="w-4 h-4" />
              <span className="mt-0.5">Advisor</span>
            </button>
            <button
              onClick={() => setScreen('catalogue')}
              className={`flex flex-col items-center py-1 px-2 text-[10px] font-bold ${
                screen === 'catalogue' ? 'text-[#E40000]' : 'text-slate-500'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span className="mt-0.5">Catalogue</span>
            </button>
            <button
              onClick={() => setScreen('checkout')}
              className={`flex flex-col items-center py-1 px-2 text-[10px] font-bold ${
                screen === 'checkout' ? 'text-[#E40000]' : 'text-slate-500'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="mt-0.5">Quotes</span>
            </button>
            <button
              onClick={() => setScreen('kyc')}
              className={`flex flex-col items-center py-1 px-2 text-[10px] font-bold ${
                screen === 'kyc' ? 'text-[#E40000]' : 'text-slate-500'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="mt-0.5">KYC</span>
            </button>
            <button
              onClick={() => setScreen('order')}
              className={`flex flex-col items-center py-1 px-2 text-[10px] font-bold ${
                screen === 'order' ? 'text-[#E40000]' : 'text-slate-500'
              }`}
            >
              <PackageCheck className="w-4 h-4" />
              <span className="mt-0.5">Order</span>
            </button>
          </>
        )}
      </nav>
    </>
  );
};
