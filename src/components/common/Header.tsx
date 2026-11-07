import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Globe,
  User,
  ShieldAlert,
  ArrowRight,
  LogIn,
  LogOut,
  Menu,
  X,
  Building2,
  MessageSquareText,
  Layers,
  FileText,
  ShieldCheck,
  PackageCheck,
  LayoutDashboard,
  Users,
  Headphones
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    screen,
    setScreen,
    language,
    setLanguage,
    userRole,
    setUserRole,
    profile,
    showToast,
    mobileMenuOpen,
    setMobileMenuOpen,
    setHandoffModalOpen
  } = useApp();

  const isLanding = screen === 'landing';
  const isAdminView = screen === 'admin_overview' || screen === 'admin_leads';

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 px-3 sm:px-6 lg:px-8 flex items-center justify-between shadow-xs">
        {/* Left: Mobile Menu Toggle & Brand Logo */}
        <div className="flex items-center space-x-2.5">
          {/* Hamburger on Mobile */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-[#E40000]" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Airtel Udyam360 Brand Logo */}
          <div
            className="flex items-center space-x-2 cursor-pointer select-none"
            onClick={() => {
              setScreen(isAdminView ? 'admin_overview' : 'landing');
              setMobileMenuOpen(false);
            }}
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#E40000] flex items-center justify-center text-white font-black text-xs sm:text-sm tracking-tighter shadow-xs shrink-0">
              a
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="font-extrabold text-[#E40000] text-base sm:text-lg tracking-tight">airtel</span>
              <span className="text-slate-800 text-[10px] sm:text-xs font-semibold tracking-wide uppercase">business</span>
              <span className="text-slate-300 mx-1 font-light hidden xs:inline">|</span>
              <span className="font-bold text-slate-900 text-sm sm:text-lg tracking-tight hidden xs:inline">Udyam360</span>
            </div>

            {isAdminView && (
              <span className="ml-1 sm:ml-2 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-[#E40000] text-white tracking-wide shrink-0">
                Admin
              </span>
            )}
          </div>
        </div>

        {/* Landing Page Desktop Navigation Links */}
        {isLanding && (
          <nav className="hidden lg:flex items-center space-x-7 text-xs sm:text-sm font-semibold text-slate-600">
            <button onClick={() => setScreen('catalogue')} className="hover:text-[#E40000] transition-colors cursor-pointer">
              {language === 'hi' ? 'उत्पाद' : 'Products'}
            </button>
            <button onClick={() => setScreen('advisor')} className="hover:text-[#E40000] transition-colors cursor-pointer">
              {language === 'hi' ? 'समाधान' : 'Solutions'}
            </button>
            <button onClick={() => setScreen('order')} className="hover:text-[#E40000] transition-colors cursor-pointer">
              {language === 'hi' ? 'प्रक्रिया' : 'How it Works'}
            </button>
            <button onClick={() => setScreen('profile')} className="hover:text-[#E40000] transition-colors cursor-pointer">
              {language === 'hi' ? 'व्यवसाय' : 'For Businesses'}
            </button>
          </nav>
        )}

        {/* Right Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-3">
          {/* Language Switcher */}
          <button
            onClick={() => {
              const next = language === 'en' ? 'hi' : 'en';
              setLanguage(next);
              showToast(next === 'hi' ? 'भाषा बदलकर हिंदी कर दी गई है' : 'Switched language to English');
            }}
            className="flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 rounded-md text-[11px] sm:text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer"
            title="Toggle Language"
          >
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden xs:inline">{language === 'en' ? 'EN' : 'हिंदी'}</span>
          </button>

          {/* Portal Switcher (Customer vs Admin) */}
          <button
            onClick={() => {
              if (isAdminView) {
                setUserRole('customer');
                setScreen('profile');
                showToast('Switched to Customer Portal');
              } else {
                setUserRole('admin');
                setScreen('admin_overview');
                showToast('Switched to Airtel Admin Operations Portal');
              }
              setMobileMenuOpen(false);
            }}
            className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer ${
              isAdminView
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                : 'bg-rose-50 text-[#E40000] hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isAdminView ? 'Customer Portal' : 'Admin Portal'}</span>
          </button>

          {/* Auth CTA or User Profile */}
          {isLanding ? (
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <button
                onClick={() => setScreen('profile')}
                className="hidden sm:inline-block px-3.5 py-1.5 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer"
              >
                {language === 'hi' ? 'लॉग इन' : 'Login'}
              </button>
              <button
                onClick={() => setScreen('profile')}
                className="flex items-center space-x-1.5 bg-[#E40000] hover:bg-[#C90000] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <span>{language === 'hi' ? 'शुरू करें' : 'Get Started'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-1 sm:space-x-2">
              <div className="flex items-center space-x-2 pl-1 sm:pl-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs border border-slate-200 shrink-0">
                  {isAdminView ? 'AD' : 'RG'}
                </div>
                <div className="hidden xl:block text-left">
                  <p className="text-xs font-bold text-slate-800 leading-none">
                    {isAdminView ? 'Admin' : profile.business_name}
                  </p>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    {isAdminView ? 'Enterprise Operations' : profile.city}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setScreen('landing');
                  showToast('Logged out to home screen');
                }}
                title="Logout"
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Responsive Mobile Drawer Menu (Sliding Overlay) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between p-5 z-10 animate-in slide-in-from-left duration-200">
            <div className="space-y-4">
              {/* Drawer Brand Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-full bg-[#E40000] text-white flex items-center justify-center font-bold text-xs">
                    a
                  </div>
                  <span className="font-extrabold text-[#E40000] text-base">airtel</span>
                  <span className="font-bold text-slate-900 text-base">Udyam360</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                  {isAdminView ? 'Admin Controls' : 'MSME Solutions'}
                </p>

                {isAdminView ? (
                  <>
                    <button
                      onClick={() => {
                        setScreen('admin_overview');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-bold ${
                        screen === 'admin_overview' ? 'bg-rose-50 text-[#E40000]' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Overview Analytics</span>
                    </button>
                    <button
                      onClick={() => {
                        setScreen('admin_leads');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-bold ${
                        screen === 'admin_leads' ? 'bg-rose-50 text-[#E40000]' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>Leads & Orders Pipeline</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setScreen('landing');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-bold ${
                        screen === 'landing' ? 'bg-rose-50 text-[#E40000]' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                      <span>Home</span>
                    </button>
                    <button
                      onClick={() => {
                        setScreen('profile');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-bold ${
                        screen === 'profile' ? 'bg-rose-50 text-[#E40000]' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                      <span>Business Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        setScreen('advisor');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-bold ${
                        screen === 'advisor' ? 'bg-rose-50 text-[#E40000]' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <MessageSquareText className="w-4 h-4" />
                      <span>Business Advisor (Chat)</span>
                    </button>
                    <button
                      onClick={() => {
                        setScreen('catalogue');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-bold ${
                        screen === 'catalogue' ? 'bg-rose-50 text-[#E40000]' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Layers className="w-4 h-4" />
                      <span>Product Catalogue</span>
                    </button>
                    <button
                      onClick={() => {
                        setScreen('checkout');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-bold ${
                        screen === 'checkout' ? 'bg-rose-50 text-[#E40000]' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      <span>Bundle & Quotes</span>
                    </button>
                    <button
                      onClick={() => {
                        setScreen('kyc');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-bold ${
                        screen === 'kyc' ? 'bg-rose-50 text-[#E40000]' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Smart KYC Verification</span>
                    </button>
                    <button
                      onClick={() => {
                        setScreen('order');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-bold ${
                        screen === 'order' ? 'bg-rose-50 text-[#E40000]' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <PackageCheck className="w-4 h-4" />
                      <span>Order Activation Tracker</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Actions inside drawer */}
            <div className="pt-4 border-t border-slate-200 space-y-2">
              <button
                onClick={() => {
                  setHandoffModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <Headphones className="w-4 h-4 text-[#E40000]" />
                <span>Contact Account Manager</span>
              </button>

              <div className="text-[11px] text-slate-400 text-center pt-1">
                Airtel 24x7 NOC Support: 1800-103-4444
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
