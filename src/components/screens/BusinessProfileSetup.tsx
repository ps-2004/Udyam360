import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowRight, CheckCircle2, Building, ShieldCheck } from 'lucide-react';

export const BusinessProfileSetup: React.FC = () => {
  const { profile, setProfile, saveProfile, setScreen, showToast, language } = useApp();

  const [activeStep, setActiveStep] = useState(1);
  const [formData, setFormData] = useState({
    business_name: profile.business_name || 'City Care Clinic',
    business_category: profile.business_category || 'Professional Office',
    business_type: profile.business_type || 'Service Business',
    city: profile.city || 'Bengaluru',
    city_tier: profile.city_tier || 'Tier 1',
    number_of_employees: profile.number_of_employees || 5,
    number_of_locations: profile.number_of_locations || 1,
    monthly_budget: profile.monthly_budget || 3000,
    gstin_available: profile.gstin_available !== false,
    gstin_number: profile.gstin_number || '29AABCU9603R1ZM',
    udyam_registered: profile.udyam_registered !== false,
    udyam_number: profile.udyam_number || 'UDYAM-KR-03-0012345',
    existing_provider: profile.existing_provider || 'Local Cable ISP',
    current_internet_spend: profile.current_internet_spend || 1800,
    required_products: profile.required_products || 'Internet, Email, Security'
  });

  const steps = [
    { num: 1, label: 'Business Details' },
    { num: 2, label: 'Operations' },
    { num: 3, label: 'Current Setup' },
    { num: 4, label: 'Requirements' },
    { num: 5, label: 'Review & Submit' }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveProfile(formData);
    showToast('Profile saved. Starting intelligent business consultation.');
    setScreen('advisor');
  };

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Stepper (Horizontal on mobile/tablet, Vertical on desktop) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex lg:flex-col overflow-x-auto lg:overflow-visible gap-2 pb-2 lg:pb-0 no-scrollbar">
            {steps.map(s => {
              const isActive = s.num === activeStep;
              return (
                <div
                  key={s.num}
                  onClick={() => setActiveStep(s.num)}
                  className={`flex items-center space-x-2.5 p-2 lg:p-2.5 rounded-lg cursor-pointer transition-all shrink-0 ${
                    isActive ? 'bg-rose-50 border border-rose-200' : 'bg-white lg:bg-transparent border lg:border-0 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-6 h-6 lg:w-7 lg:h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                      isActive
                        ? 'bg-[#E40000] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {s.num}
                  </div>
                  <span
                    className={`text-xs font-semibold whitespace-nowrap ${
                      isActive ? 'text-[#E40000] font-bold' : 'text-slate-600'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="hidden lg:block bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 mt-6">
            <div className="flex items-center space-x-2 text-[#E40000] font-bold mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>DPDP Protected</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Your business records are used purely for local deterministic product matching and KYC validation.
            </p>
          </div>
        </div>

        {/* Right Form Container (matching Screen 2) */}
        <div className="lg:col-span-9 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="mb-6 pb-4 border-b border-slate-100">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Create Your Business Profile
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Tell us about your business so we can recommend the right solutions.
            </p>
          </div>

          <form onSubmit={handleNext} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Business Name */}
              <div className="space-y-1.5 sm:col-span-1">
                <label className="block text-xs font-bold text-slate-700">
                  Business Name <span className="text-[#E40000]">*</span>
                </label>
                <input
                  type="text"
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 font-medium focus:ring-1 focus:ring-[#E40000] focus:border-[#E40000] outline-none"
                  placeholder="e.g. City Care Clinic"
                />
              </div>

              {/* Business Category */}
              <div className="space-y-1.5 sm:col-span-1">
                <label className="block text-xs font-bold text-slate-700">
                  Business Category <span className="text-[#E40000]">*</span>
                </label>
                <select
                  name="business_category"
                  value={formData.business_category}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 font-medium focus:ring-1 focus:ring-[#E40000] focus:border-[#E40000] outline-none bg-white"
                >
                  <option value="Professional Office">Professional Office</option>
                  <option value="Micro Retail">Micro Retail</option>
                  <option value="Small Multi-site Business">Small Multi-site Business</option>
                  <option value="Small Manufacturer">Small Manufacturer</option>
                </select>
              </div>

              {/* Business Type */}
              <div className="space-y-1.5 sm:col-span-1">
                <label className="block text-xs font-bold text-slate-700">
                  Business Type <span className="text-[#E40000]">*</span>
                </label>
                <select
                  name="business_type"
                  value={formData.business_type}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 font-medium focus:ring-1 focus:ring-[#E40000] focus:border-[#E40000] outline-none bg-white"
                >
                  <option value="Service Business">Service Business</option>
                  <option value="Retail & Trading">Retail & Trading</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Healthcare & Diagnostics">Healthcare & Diagnostics</option>
                </select>
              </div>

              {/* City */}
              <div className="space-y-1.5 sm:col-span-1">
                <label className="block text-xs font-bold text-slate-700">
                  City <span className="text-[#E40000]">*</span>
                </label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 font-medium focus:ring-1 focus:ring-[#E40000] focus:border-[#E40000] outline-none bg-white"
                >
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="New Delhi">New Delhi</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Surat">Surat</option>
                  <option value="Chennai">Chennai</option>
                  <option value="Pune">Pune</option>
                  <option value="Kolkata">Kolkata</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Jaipur">Jaipur</option>
                  <option value="Ahmedabad">Ahmedabad</option>
                </select>
              </div>

              {/* City Tier */}
              <div className="space-y-1.5 sm:col-span-1">
                <label className="block text-xs font-bold text-slate-700">
                  City Tier <span className="text-[#E40000]">*</span>
                </label>
                <select
                  name="city_tier"
                  value={formData.city_tier}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 font-medium focus:ring-1 focus:ring-[#E40000] focus:border-[#E40000] outline-none bg-white"
                >
                  <option value="Tier 1">Tier 1 (Metro / Major City)</option>
                  <option value="Tier 2">Tier 2 (Emerging Industrial Hub)</option>
                  <option value="Tier 3">Tier 3 (Township / Semi-urban)</option>
                </select>
              </div>

              {/* Number of Employees */}
              <div className="space-y-1.5 sm:col-span-1">
                <label className="block text-xs font-bold text-slate-700">
                  Number of Employees <span className="text-[#E40000]">*</span>
                </label>
                <input
                  type="number"
                  name="number_of_employees"
                  min="1"
                  max="500"
                  value={formData.number_of_employees}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 font-medium focus:ring-1 focus:ring-[#E40000] focus:border-[#E40000] outline-none"
                />
              </div>

              {/* Number of Locations */}
              <div className="space-y-1.5 sm:col-span-1">
                <label className="block text-xs font-bold text-slate-700">
                  Number of Locations <span className="text-[#E40000]">*</span>
                </label>
                <input
                  type="number"
                  name="number_of_locations"
                  min="1"
                  max="50"
                  value={formData.number_of_locations}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 font-medium focus:ring-1 focus:ring-[#E40000] focus:border-[#E40000] outline-none"
                />
              </div>

              {/* Monthly Budget */}
              <div className="space-y-1.5 sm:col-span-1">
                <label className="block text-xs font-bold text-slate-700">
                  Monthly Budget (₹) <span className="text-[#E40000]">*</span>
                </label>
                <input
                  type="number"
                  name="monthly_budget"
                  min="500"
                  step="100"
                  value={formData.monthly_budget}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 font-medium focus:ring-1 focus:ring-[#E40000] focus:border-[#E40000] outline-none"
                />
              </div>
            </div>

            {/* GSTIN & Udyam Radios (Matching Screen 2) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              {/* GSTIN Available */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  GSTIN Available? <span className="text-[#E40000]">*</span>
                </label>
                <div className="flex items-center space-x-6">
                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="gstin_available"
                      checked={formData.gstin_available === true}
                      onChange={() => setFormData(prev => ({ ...prev, gstin_available: true }))}
                      className="text-[#E40000] focus:ring-[#E40000]"
                    />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="gstin_available"
                      checked={formData.gstin_available === false}
                      onChange={() => setFormData(prev => ({ ...prev, gstin_available: false }))}
                      className="text-[#E40000] focus:ring-[#E40000]"
                    />
                    <span>No</span>
                  </label>
                </div>
                {formData.gstin_available && (
                  <input
                    type="text"
                    name="gstin_number"
                    value={formData.gstin_number}
                    onChange={handleChange}
                    placeholder="e.g. 29AABCU9603R1ZM"
                    className="mt-2.5 w-full px-3 py-1.5 bg-white rounded-md border border-slate-300 text-xs font-mono font-medium focus:ring-1 focus:ring-[#E40000] outline-none"
                  />
                )}
              </div>

              {/* Udyam Registered */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Udyam Registered? <span className="text-[#E40000]">*</span>
                </label>
                <div className="flex items-center space-x-6">
                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="udyam_registered"
                      checked={formData.udyam_registered === true}
                      onChange={() => setFormData(prev => ({ ...prev, udyam_registered: true }))}
                      className="text-[#E40000] focus:ring-[#E40000]"
                    />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="udyam_registered"
                      checked={formData.udyam_registered === false}
                      onChange={() => setFormData(prev => ({ ...prev, udyam_registered: false }))}
                      className="text-[#E40000] focus:ring-[#E40000]"
                    />
                    <span>No</span>
                  </label>
                </div>
                {formData.udyam_registered && (
                  <input
                    type="text"
                    name="udyam_number"
                    value={formData.udyam_number}
                    onChange={handleChange}
                    placeholder="e.g. UDYAM-KR-03-0012345"
                    className="mt-2.5 w-full px-3 py-1.5 bg-white rounded-md border border-slate-300 text-xs font-mono font-medium focus:ring-1 focus:ring-[#E40000] outline-none"
                  />
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 flex items-center justify-end">
              <button
                type="submit"
                className="flex items-center space-x-2 bg-[#E40000] hover:bg-[#C90000] text-white px-8 py-3 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
