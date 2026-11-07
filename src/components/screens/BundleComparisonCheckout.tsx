import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { generateQuotePDF } from '../../utils/pdfGenerator';
import {
  Check,
  CheckCircle2,
  ArrowRight,
  Download,
  ShieldCheck,
  Sparkles,
  Info,
  Layers,
  FileText
} from 'lucide-react';

export const BundleComparisonCheckout: React.FC = () => {
  const {
    profile,
    currentRecommendation,
    currentQuote,
    setCurrentQuote,
    setScreen,
    showToast
  } = useApp();

  // Selection states matching Screen 5
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({
    'P-101': true, // Airtel Business Broadband (100 Mbps)
    'P-108': true, // Airtel Business Email (5 users)
    'P-113': true, // Airtel SecureSuite (5 devices)
    'P-117': false, // Airtel Business Voice
    'P-110': false  // Airtel Cloud Storage (100 GB)
  });

  const availableOptions = [
    { id: 'P-101', name: 'Airtel Business Broadband (100 Mbps)', price: 999, setup: 999, category: 'Internet', primary: true },
    { id: 'P-108', name: 'Airtel Business Email (5 users)', price: 1495, setup: 0, category: 'Cloud & Collaboration', primary: true },
    { id: 'P-113', name: 'Airtel SecureSuite (5 devices)', price: 499, setup: 0, category: 'Security', primary: true },
    { id: 'P-117', name: 'Airtel Business Voice', price: 399, setup: 499, category: 'Voice', primary: false },
    { id: 'P-110', name: 'Airtel Cloud Storage (100 GB)', price: 299, setup: 0, category: 'Cloud & Collaboration', primary: false }
  ];

  const handleToggle = (id: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Calculate real-time totals
  const totals = useMemo(() => {
    let monthly = 0;
    let setup = 0;
    availableOptions.forEach(opt => {
      if (selectedItems[opt.id]) {
        monthly += opt.price;
        setup += opt.setup;
      }
    });
    return {
      monthly: monthly || 2899,
      setup: setup || 1500
    };
  }, [selectedItems]);

  const handleProceedToKyc = async () => {
    const activeIds = Object.keys(selectedItems).filter(k => selectedItems[k]);
    try {
      const newQuote = await api.createQuote({
        business_name: profile.business_name,
        bundle_name: currentRecommendation?.bundle_name || 'Clinic Connect Bundle',
        selected_product_ids: activeIds
      });
      setCurrentQuote(newQuote);
      showToast('Quotation saved to database. Proceeding to Smart KYC.');
    } catch (err) {
      console.error(err);
    }
    setScreen('kyc');
  };

  const handleDownloadPdf = () => {
    const activeItems = availableOptions
      .filter(o => selectedItems[o.id])
      .map(o => ({
        product_id: o.id,
        product_name: o.name,
        monthly_price: o.price,
        setup_fee: o.setup,
        category: o.category
      }));

    const quoteToExport = currentQuote || {
      id: 'QT-2026-00912',
      business_name: profile.business_name,
      bundle_name: currentRecommendation?.bundle_name || 'Clinic Connect Bundle',
      monthly_recurring_charges: totals.monthly,
      one_time_setup_fees: totals.setup,
      contract_duration_months: 12,
      status: 'Generated',
      items: activeItems,
      created_at: new Date().toISOString()
    };

    generateQuotePDF(quoteToExport, profile);
    showToast('Downloaded Airtel Business Quotation PDF');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto w-full">
      {/* Title */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Compare & Build Your Bundle
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Transparent enterprise pricing with zero hidden surcharges or surprise fees.
          </p>
        </div>

        <button
          onClick={handleDownloadPdf}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
        >
          <Download className="w-4 h-4 text-[#E40000]" />
          <span>Download Quote PDF</span>
        </button>
      </div>

      {/* Main Grid: Left Recommended Bundle vs Right Customize Selection (Screen 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Recommended Bundle [Best for You] */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-800">
              Recommended Bundle
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#E40000] text-white tracking-wide">
              Best for You
            </span>
          </div>

          <div>
            <h3 className="text-xl font-black text-slate-900">
              {currentRecommendation?.bundle_name || 'Clinic Connect Bundle'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Complete connectivity and productivity solution for small clinics and healthcare centers.
            </p>
          </div>

          {/* Included Features Checklist (Green checks matching Screen 5) */}
          <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
            <div className="flex items-center space-x-2.5 text-xs text-slate-700 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Airtel Business Broadband (100 Mbps)</span>
            </div>
            <div className="flex items-center space-x-2.5 text-xs text-slate-700 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Airtel Business Email (5 users)</span>
            </div>
            <div className="flex items-center space-x-2.5 text-xs text-slate-700 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Airtel SecureSuite (5 devices)</span>
            </div>
          </div>

          {/* Price Header */}
          <div className="pt-2">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">
              ₹2,899{' '}
              <span className="text-xs sm:text-sm font-normal text-slate-500">/month</span>
            </p>
            <p className="text-xs text-slate-400 mt-1.5">
              + ₹1,500 one-time setup
            </p>
          </div>

          {/* Callout Box: Why this bundle? (Matching Screen 5) */}
          <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-4 space-y-2.5">
            <p className="text-xs font-bold text-[#E40000] flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Why this bundle?</span>
            </p>
            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex items-start space-x-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span>Matches your requirements (internet, email, security)</span>
              </div>
              <div className="flex items-start space-x-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span>Fits within your ₹3,000/month budget</span>
              </div>
              <div className="flex items-start space-x-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span>Suitable for Professional Offices (Clinics)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Customize Your Selection & Price Summary (Screen 5) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
            <h3 className="font-bold text-slate-900 text-base">
              Customize Your Selection
            </h3>

            {/* Checkbox Options */}
            <div className="space-y-2.5">
              {availableOptions.map(opt => {
                const isChecked = !!selectedItems[opt.id];
                return (
                  <label
                    key={opt.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                      isChecked
                        ? 'border-[#E40000]/40 bg-rose-50/30'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggle(opt.id)}
                        className="w-4 h-4 text-[#E40000] rounded-xs border-slate-300 focus:ring-[#E40000]"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">
                          {opt.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {opt.category}
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-slate-900">
                      ₹{opt.price.toLocaleString('en-IN')}
                    </span>
                  </label>
                );
              })}
            </div>

            {/* Price Summary Container (Matching Screen 5) */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Price Summary
              </h4>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Monthly Recurring Charges</span>
                  <span className="font-bold text-slate-900">
                    ₹{totals.monthly.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>One-time Setup Fees</span>
                  <span className="font-bold text-slate-900">
                    ₹{totals.setup.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-sm font-black text-slate-900">
                  <span>Total (Monthly)</span>
                  <span className="text-lg text-[#E40000]">
                    ₹{totals.monthly.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Red CTA: Proceed to KYC */}
              <button
                onClick={handleProceedToKyc}
                className="w-full mt-4 flex items-center justify-center space-x-2 bg-[#E40000] hover:bg-[#C90000] text-white py-3.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                <span>Proceed to KYC</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
