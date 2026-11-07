import React, { useState } from 'react';
import { ShieldCheck, Lock, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';

interface ConsentModalProps {
  isOpen: boolean;
  onConsentGranted: () => void;
  onClose: () => void;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({ isOpen, onConsentGranted, onClose }) => {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!agreed) return;
    setLoading(true);
    try {
      await api.recordConsent('DPDP-2023-V1.2');
      onConsentGranted();
    } catch (err) {
      console.error(err);
      onConsentGranted(); // Proceed in demo
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-[#E40000]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">DPDP Act 2023 Privacy & KYC Consent</h3>
              <p className="text-xs text-slate-500">Regulatory Compliance Notice • Version DPDP-2023-V1.2</p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-900 flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Transparent Digital Verification:</span> In accordance with the Digital Personal Data Protection (DPDP) Act 2023 and Department of Telecommunications (DoT) KYC mandates, Bharti Airtel Limited requires explicit informed consent before processing business credentials.
            </div>
          </div>

          <div className="space-y-3">
            <div className="border border-slate-100 bg-slate-50/70 rounded-lg p-3.5 space-y-2">
              <div className="flex items-center space-x-2 text-slate-800 font-bold">
                <FileText className="w-4 h-4 text-[#E40000]" />
                <span>1. What information is collected?</span>
              </div>
              <p className="text-slate-600 pl-6">
                Goods and Services Tax Identification Number (GSTIN), Udyam Registration Certificate, proof of business installation premises, and authorized signatory identity proof.
              </p>
            </div>

            <div className="border border-slate-100 bg-slate-50/70 rounded-lg p-3.5 space-y-2">
              <div className="flex items-center space-x-2 text-slate-800 font-bold">
                <Lock className="w-4 h-4 text-[#E40000]" />
                <span>2. Purpose & Processing Limitation</span>
              </div>
              <p className="text-slate-600 pl-6">
                Data is strictly processed for identity authentication, credit assessment, physical line feasibility validation, and service activation. Your data is never monetized or shared with third parties.
              </p>
            </div>

            <div className="border border-slate-100 bg-slate-50/70 rounded-lg p-3.5 space-y-2">
              <div className="flex items-center space-x-2 text-slate-800 font-bold">
                <CheckCircle2 className="w-4 h-4 text-[#E40000]" />
                <span>3. Retention & Right to Erasure</span>
              </div>
              <p className="text-slate-600 pl-6">
                Verification records are retained for a maximum of 180 days for audit compliance. Customers retain the right to review, rectify, or request cryptographic deletion of KYC artifacts via grievance@airtelbusiness.in.
              </p>
            </div>
          </div>

          <label className="flex items-start space-x-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-[#E40000] rounded-xs border-slate-300 focus:ring-[#E40000]"
            />
            <span className="text-xs text-slate-700 font-medium leading-snug">
              I am the authorized signatory for this MSME and explicitly grant informed consent to Airtel Business to process uploaded documentation for telecom KYC verification.
            </span>
          </label>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!agreed || loading}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
              agreed && !loading
                ? 'bg-[#E40000] hover:bg-[#C90000] text-white shadow-xs cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {loading ? 'Recording Consent...' : 'Accept & Proceed to Upload'}
          </button>
        </div>
      </div>
    </div>
  );
};
