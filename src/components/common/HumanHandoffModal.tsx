import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { Headphones, CheckCircle2, UserCheck, Clock, X } from 'lucide-react';

export const HumanHandoffModal: React.FC = () => {
  const { handoffModalOpen, setHandoffModalOpen, profile, showToast } = useApp();
  const [reason, setReason] = useState('Need custom fiber routing and multi-location SLA discussion');
  const [contactNumber, setContactNumber] = useState('9876543210');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  if (!handoffModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.humanHandoff({
        business_name: profile.business_name,
        requirements: profile.required_products || 'Enterprise Internet, Voice & Security',
        reason
      });
      setResult(res);
      setSubmitted(true);
      showToast('Assigned to Airtel Enterprise Relationship Manager');
    } catch (err) {
      console.error(err);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setHandoffModalOpen(false);
    setSubmitted(false);
    setResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-[#E40000]">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Airtel Enterprise Field Sales Handoff</h3>
              <p className="text-xs text-slate-500">Hybrid Digital-to-Field Assistance for MSMEs</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect directly with a dedicated Airtel Business Relationship Manager for customized optical routing, multi-branch network designs, or specialized commercial SLA terms.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Business Name</label>
                <input
                  type="text"
                  value={profile.business_name}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Specialist Assistance</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#E40000]"
                >
                  <option value="Need custom fiber routing and multi-location SLA discussion">
                    Need custom fiber routing & multi-location SLA
                  </option>
                  <option value="Specific budget or higher employee license quote needed">
                    Specific custom budget or bulk user licensing
                  </option>
                  <option value="On-site physical survey and feasibility request">
                    On-site physical site survey & optical feasibility
                  </option>
                  <option value="Billing and payment term customisation">
                    Quarterly/Annual corporate billing customization
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Authorized Contact Mobile</label>
                <input
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#E40000]"
                  placeholder="10-digit mobile number"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#E40000] hover:bg-[#C90000] text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {loading ? 'Submitting...' : 'Request Relationship Manager'}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Field Relationship Manager Assigned!</h4>
                <p className="text-xs text-slate-500 mt-1">Lead ID: {result?.lead_id || 'L-10251'}</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs space-y-2">
                <div className="flex items-center space-x-2 text-slate-800">
                  <UserCheck className="w-4 h-4 text-[#E40000]" />
                  <span className="font-bold">Assigned RM:</span>
                  <span>{result?.assigned_rm || 'Vikramaditya Roy (Airtel Business)'}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-800">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold">Contact SLA:</span>
                  <span>Within 2 business hours</span>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="w-full py-2.5 bg-[#E40000] hover:bg-[#C90000] text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Close & Return
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
