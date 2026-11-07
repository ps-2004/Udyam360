import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Check,
  Package,
  Calendar,
  UserCheck,
  ShieldCheck,
  Download,
  Headphones,
  Sparkles,
  Wifi
} from 'lucide-react';

export const OrderTracker: React.FC = () => {
  const { currentOrder, profile, setHandoffModalOpen, showToast } = useApp();

  // 7-Stage Timeline exactly matching Screen 7
  const stages = [
    { name: 'Order Placed', date: '12 Jan', index: 1, completed: true },
    { name: 'KYC Verification', date: '13 Jan', index: 2, completed: true },
    { name: 'Feasibility Check', date: '14 Jan', index: 3, completed: true },
    { name: 'Installation Scheduled', date: '15 Jan', index: 4, completed: true },
    { name: 'Installation In Progress', date: '16 Jan', index: 5, completed: true },
    { name: 'Installation Completed', date: '17 Jan', index: 6, completed: true },
    { name: 'Service Activated', date: '17 Jan', index: 7, completed: true }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto w-full space-y-6 sm:space-y-8">
      {/* Top Header Card (Matching Screen 7) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Order Details
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Order ID: <strong className="text-slate-800 font-mono">ORD-2026-004517</strong>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Service Activated</span>
            </span>
          </div>
        </div>

        {/* 7-Stage Horizontal Stepper (Screen 7 replica) */}
        <div className="pt-6 pb-4 overflow-x-auto">
          <div className="flex justify-between items-center sm:hidden pb-2 text-[10px] text-slate-400 font-semibold">
            <span>Progress: 7/7 Stages Complete</span>
            <span>Swipe for full timeline →</span>
          </div>
          <div className="min-w-[650px] sm:min-w-[700px] flex items-center justify-between relative px-2">
            {/* Background connecting line */}
            <div className="absolute top-4 left-6 right-6 h-0.5 bg-emerald-500 z-0" />

            {stages.map((st) => (
              <div key={st.index} className="flex flex-col items-center relative z-10 text-center w-24">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  <Check className="w-4 h-4 stroke-[2.5]" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 mt-2.5 leading-tight">
                  {st.name}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 font-medium">
                  {st.date}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Detail Cards (Matching Screen 7 bottom) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Card: Order Summary */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base pb-3 border-b border-slate-100">
            Order Summary
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Bundle:</span>
              <span className="font-bold text-slate-900">Clinic Connect Bundle</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Monthly Charges:</span>
              <span className="font-bold text-slate-900">₹2,899</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Setup Charges:</span>
              <span className="font-bold text-slate-900">₹1,500</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Contract Duration:</span>
              <span className="font-bold text-slate-900">12 months</span>
            </div>
          </div>
        </div>

        {/* Right Card: Installation Details */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base pb-3 border-b border-slate-100">
            Installation Details
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center space-x-2 text-slate-700">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-slate-500">Installation Date:</span>
              <span className="font-bold text-slate-900">17 Jan 2026</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-700">
              <UserCheck className="w-4 h-4 text-slate-400" />
              <span className="text-slate-500">Installed By:</span>
              <span className="font-bold text-slate-900">Airtel Business Partner</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-slate-500">Status:</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Completed
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SLA & Quick Action Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#E40000] flex items-center justify-center font-bold">
            <Wifi className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">
              Optical Line Status: 100 Mbps Symmetric Active
            </p>
            <p className="text-[11px] text-slate-500">
              OLT: Indiranagar Feeder #14 • IP: 182.72.104.22 (Static Managed)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => showToast('Service Agreement SLA PDF downloaded')}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#E40000]" />
            <span>Service SLA Agreement</span>
          </button>
          <button
            onClick={() => setHandoffModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#E40000] hover:bg-[#C90000] text-white text-xs font-bold shadow-xs cursor-pointer"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Contact Account Team</span>
          </button>
        </div>
      </div>
    </div>
  );
};
