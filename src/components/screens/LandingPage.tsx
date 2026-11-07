import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Wifi,
  Cloud,
  ShieldCheck,
  Building2,
  ArrowRight,
  CheckCircle,
  Zap,
  Clock,
  Shield,
  Layers,
  Sparkles
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { setScreen, language } = useApp();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white text-slate-900 flex flex-col justify-between">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-16 lg:py-20 px-6 lg:px-16 max-w-7xl mx-auto w-full">
        {/* Background Subtle Ambient Glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-rose-50 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Typography & CTAs */}
          <div className="lg:col-span-7 space-y-6 z-10">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-rose-50 border border-rose-200 rounded-full text-xs font-bold text-[#E40000]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Airtel SYNC YTL MSME Initiative 2026</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
              Your Business.
              <br />
              Connected.{' '}
              <span className="text-[#E40000] inline-block relative">
                Simplified.
                <span className="absolute left-0 bottom-1 w-full h-1.5 bg-[#E40000]/20 rounded-full" />
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-xl font-normal leading-relaxed">
              {language === 'hi'
                ? 'एक सरल डिजिटल यात्रा में सही व्यावसायिक कनेक्टिविटी और क्लाउड समाधान खोजें, चुनें और सक्रिय करें।'
                : 'Discover, choose and activate the right business connectivity solutions in one simple digital journey.'}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => setScreen('profile')}
                className="flex items-center space-x-2 bg-[#E40000] hover:bg-[#C90000] text-white px-7 py-3.5 rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all transform active:scale-95 cursor-pointer"
              >
                <span>{language === 'hi' ? 'शुरू करें' : 'Get Started'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setScreen('profile')}
                className="px-6 py-3.5 rounded-lg text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              >
                {language === 'hi' ? 'लॉग इन' : 'Login'}
              </button>
            </div>

            {/* Quick Trust Badges */}
            <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs text-slate-500 font-medium">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Zero Physical Paperwork</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>DPDP Act 2023 Compliant</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>5-7 Day Activation SLA</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual from reference mockup */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-full max-w-md aspect-4/3 sm:aspect-square rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-gradient-to-br from-rose-50 via-white to-slate-100 flex flex-col justify-end p-6">
              {/* Reference image preview overlay or stylized owner portrait */}
              <div className="absolute inset-0 bg-cover bg-center opacity-90" style={{
                backgroundImage: 'url(/assets/aistudio/image_fc46b4e9.png)',
                backgroundPosition: '16% 16%',
                backgroundSize: '290%'
              }} />
              
              <div className="relative z-10 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-lg border border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-[#E40000] text-white flex items-center justify-center font-bold text-sm">
                    a
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Dr. Ramesh Gupta</p>
                    <p className="text-[11px] text-slate-500">City Care Clinic, Bengaluru</p>
                  </div>
                  <span className="ml-auto px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
                    Active SLA
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-2.5 italic">
                  "Udyam360 tailored our clinic's broadband, Google Workspace, and data security in under 10 minutes."
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Feature Cards (Directly matching Screen 1 bottom) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-14">
          {/* Card 1: Business Internet */}
          <div
            onClick={() => setScreen('catalogue')}
            className="p-6 rounded-xl border border-slate-200 bg-white hover:border-[#E40000]/40 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-[#E40000] flex items-center justify-center mb-4 group-hover:bg-[#E40000] group-hover:text-white transition-colors">
              <Wifi className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Business Internet</h3>
            <p className="text-xs text-slate-500">Reliable & high-speed fibre with 99.9% uptime SLA.</p>
          </div>

          {/* Card 2: Cloud & Collaboration */}
          <div
            onClick={() => setScreen('catalogue')}
            className="p-6 rounded-xl border border-slate-200 bg-white hover:border-[#E40000]/40 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-[#E40000] flex items-center justify-center mb-4 group-hover:bg-[#E40000] group-hover:text-white transition-colors">
              <Cloud className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Cloud & Collaboration</h3>
            <p className="text-xs text-slate-500">Work from anywhere with Workspace & 365.</p>
          </div>

          {/* Card 3: Security */}
          <div
            onClick={() => setScreen('catalogue')}
            className="p-6 rounded-xl border border-slate-200 bg-white hover:border-[#E40000]/40 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-[#E40000] flex items-center justify-center mb-4 group-hover:bg-[#E40000] group-hover:text-white transition-colors">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Security</h3>
            <p className="text-xs text-slate-500">Keep your business safe from cyber threats & malware.</p>
          </div>

          {/* Card 4: Business Solutions */}
          <div
            onClick={() => setScreen('catalogue')}
            className="p-6 rounded-xl border border-slate-200 bg-white hover:border-[#E40000]/40 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-[#E40000] flex items-center justify-center mb-4 group-hover:bg-[#E40000] group-hover:text-white transition-colors">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Business Solutions</h3>
            <p className="text-xs text-slate-500">Built for MSMEs with transparent, itemised pricing.</p>
          </div>
        </div>
      </section>

      {/* How it Works Banner */}
      <section className="bg-slate-50 border-t border-slate-200 py-12 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900">How Udyam360 Works</h2>
            <p className="text-xs text-slate-500 mt-1">Four seamless steps from business discovery to optical activation</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 text-center relative">
              <div className="w-8 h-8 rounded-full bg-[#E40000] text-white font-bold text-xs flex items-center justify-center mx-auto mb-3">1</div>
              <h4 className="font-bold text-sm text-slate-800">Business Profile</h4>
              <p className="text-xs text-slate-500 mt-1">Specify team size, locations, and monthly budget.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 text-center relative">
              <div className="w-8 h-8 rounded-full bg-[#E40000] text-white font-bold text-xs flex items-center justify-center mx-auto mb-3">2</div>
              <h4 className="font-bold text-sm text-slate-800">Intelligent Match</h4>
              <p className="text-xs text-slate-500 mt-1">Receive tailored bundles from our 25-product catalogue.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 text-center relative">
              <div className="w-8 h-8 rounded-full bg-[#E40000] text-white font-bold text-xs flex items-center justify-center mx-auto mb-3">3</div>
              <h4 className="font-bold text-sm text-slate-800">Smart KYC</h4>
              <p className="text-xs text-slate-500 mt-1">Instant local GSTIN and Udyam registry validation.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 text-center relative">
              <div className="w-8 h-8 rounded-full bg-[#E40000] text-white font-bold text-xs flex items-center justify-center mx-auto mb-3">4</div>
              <h4 className="font-bold text-sm text-slate-800">Activation Tracker</h4>
              <p className="text-xs text-slate-500 mt-1">Track fiber installation through 7 transparent stages.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-6 lg:px-16 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Bharti Airtel Limited. Udyam360 MSME Digital Initiative.</p>
          <div className="flex items-center space-x-6">
            <span className="hover:text-slate-800 cursor-pointer">DPDP Act Compliance</span>
            <span className="hover:text-slate-800 cursor-pointer">Enterprise SLAs</span>
            <span className="hover:text-slate-800 cursor-pointer">DoT Telecom Guidelines</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
