import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { AdminAnalytics } from '../../types';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Building,
  Layers
} from 'lucide-react';

export const AdminDashboardOverview: React.FC = () => {
  const { setScreen } = useApp();

  const [analytics, setAnalytics] = useState<AdminAnalytics>({
    overview: {
      total_leads: 4892,
      leads_growth: '+12%',
      conversions: 1126,
      conversions_growth: '+18%',
      activation_rate: 92.8,
      activation_rate_delta: '+4.2pp',
      avg_activation_time_days: 5.4,
      avg_activation_time_delta: '-1.8 days'
    },
    conversion_funnel: [
      { stage: 'Leads', count: 4892, pct: 100 },
      { stage: 'Qualified', count: 3214, pct: 66 },
      { stage: 'Quoted', count: 1985, pct: 41 },
      { stage: 'Ordered', count: 1326, pct: 27 },
      { stage: 'Activated', count: 1126, pct: 23 }
    ],
    activations_over_time: [
      { month: 'Aug', activations: 310 },
      { month: 'Sep', activations: 440 },
      { month: 'Oct', activations: 620 },
      { month: 'Nov', activations: 790 },
      { month: 'Dec', activations: 940 },
      { month: 'Jan', activations: 1126 }
    ],
    segment_performance: [
      { segment: 'Micro Retail & Services', share: 38, avg_arpu: 1999 },
      { segment: 'Professional Offices', share: 28, avg_arpu: 2899 },
      { segment: 'Small Multi-site Businesses', share: 18, avg_arpu: 6999 },
      { segment: 'Small Manufacturers', share: 16, avg_arpu: 8499 }
    ]
  });

  useEffect(() => {
    api.getAdminAnalytics().then(data => {
      if (data && data.overview) setAnalytics(data);
    }).catch(console.error);
  }, []);

  const funnelColors = [
    '#E40000', // Deep Airtel Red
    '#F03D3D', // Medium Red
    '#FA6E6E', // Coral Red
    '#FFA1A1', // Light Salmon
    '#FFCCCC'  // Soft Rose
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto w-full space-y-6 sm:space-y-8">
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
          Dashboard Overview
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Business acquisition and activation insights
        </p>
      </div>

      {/* 4 Metrics Cards (Matching Screen 8 top) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Leads */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Leads</span>
            <span className="flex items-center text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200">
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
              {analytics.overview.leads_growth}
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">
            {analytics.overview.total_leads.toLocaleString('en-IN')}
          </p>
        </div>

        {/* Card 2: Conversions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Conversions</span>
            <span className="flex items-center text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200">
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
              {analytics.overview.conversions_growth}
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">
            {analytics.overview.conversions.toLocaleString('en-IN')}
          </p>
        </div>

        {/* Card 3: Activation Rate */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Activation Rate</span>
            <span className="flex items-center text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200">
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
              {analytics.overview.activation_rate_delta}
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">
            {analytics.overview.activation_rate}%
          </p>
        </div>

        {/* Card 4: Avg. Activation Time */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Avg. Activation Time</span>
            <span className="flex items-center text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200">
              <ArrowDownRight className="w-3 h-3 mr-0.5" />
              {analytics.overview.avg_activation_time_delta}
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">
            {analytics.overview.avg_activation_time_days} days
          </p>
        </div>
      </div>

      {/* Two Analytics Charts: Conversion Funnel vs Activations Over Time (Matching Screen 8) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Conversion Funnel (Historical) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Conversion Funnel <span className="text-slate-400 font-normal text-xs">(Historical)</span>
            </h3>
            <span className="text-[11px] font-bold text-slate-500">SMB Leads Dataset</span>
          </div>

          <div className="space-y-3 pt-2">
            {analytics.conversion_funnel.map((item, index) => {
              return (
                <div key={item.stage} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{item.stage}</span>
                    <span className="font-mono">
                      {item.count.toLocaleString('en-IN')}{' '}
                      <span className="text-slate-400 font-normal">({item.pct}%)</span>
                    </span>
                  </div>

                  {/* Funnel Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${item.pct}%`,
                        backgroundColor: funnelColors[index] || '#E40000'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Activations Over Time Line Chart (Screen 8) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Activations Over Time
            </h3>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Steady +38% MoM Acceleration
            </span>
          </div>

          {/* SVG Line Chart */}
          <div className="pt-2">
            <div className="h-44 w-full relative">
              <svg viewBox="0 0 500 160" className="w-full h-full overflow-visible">
                {/* Horizontal Grid lines */}
                <line x1="40" y1="20" x2="480" y2="20" stroke="#E2E8F0" strokeDasharray="3 3" />
                <line x1="40" y1="65" x2="480" y2="65" stroke="#E2E8F0" strokeDasharray="3 3" />
                <line x1="40" y1="110" x2="480" y2="110" stroke="#E2E8F0" strokeDasharray="3 3" />
                <line x1="40" y1="145" x2="480" y2="145" stroke="#CBD5E1" />

                {/* Y-axis Labels */}
                <text x="25" y="24" fontSize="10" fill="#94A3B8" textAnchor="end">1,200</text>
                <text x="25" y="69" fontSize="10" fill="#94A3B8" textAnchor="end">900</text>
                <text x="25" y="114" fontSize="10" fill="#94A3B8" textAnchor="end">600</text>
                <text x="25" y="148" fontSize="10" fill="#94A3B8" textAnchor="end">300</text>

                {/* Area Gradient Under Curve */}
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E40000" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#E40000" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Coordinates:
                    Aug (310) -> x: 60, y: 144
                    Sep (440) -> x: 140, y: 128
                    Oct (620) -> x: 220, y: 104
                    Nov (790) -> x: 300, y: 80
                    Dec (940) -> x: 380, y: 58
                    Jan (1126) -> x: 460, y: 32
                */}
                <polygon
                  points="60,144 140,128 220,104 300,80 380,58 460,32 460,145 60,145"
                  fill="url(#chartGradient)"
                />

                <polyline
                  fill="none"
                  stroke="#E40000"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points="60,144 140,128 220,104 300,80 380,58 460,32"
                />

                {/* Data Points */}
                {[
                  { cx: 60, cy: 144, val: '310' },
                  { cx: 140, cy: 128, val: '440' },
                  { cx: 220, cy: 104, val: '620' },
                  { cx: 300, cy: 80, val: '790' },
                  { cx: 380, cy: 58, val: '940' },
                  { cx: 460, cy: 32, val: '1,126' },
                ].map((pt, i) => (
                  <g key={i}>
                    <circle cx={pt.cx} cy={pt.cy} r="5" fill="#E40000" stroke="#FFFFFF" strokeWidth="2.5" />
                  </g>
                ))}

                {/* X-axis Month Labels */}
                <text x="60" y="160" fontSize="10" fill="#64748B" textAnchor="middle" fontWeight="bold">Aug</text>
                <text x="140" y="160" fontSize="10" fill="#64748B" textAnchor="middle" fontWeight="bold">Sep</text>
                <text x="220" y="160" fontSize="10" fill="#64748B" textAnchor="middle" fontWeight="bold">Oct</text>
                <text x="300" y="160" fontSize="10" fill="#64748B" textAnchor="middle" fontWeight="bold">Nov</text>
                <text x="380" y="160" fontSize="10" fill="#64748B" textAnchor="middle" fontWeight="bold">Dec</text>
                <text x="460" y="160" fontSize="10" fill="#E40000" textAnchor="middle" fontWeight="bold">Jan</text>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Segment Performance Breakdown */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">
            MSME Segment Performance & Average ARPU
          </h3>
          <button
            onClick={() => setScreen('admin_leads')}
            className="text-xs font-bold text-[#E40000] hover:underline cursor-pointer"
          >
            View All Leads →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {analytics.segment_performance.map((seg) => (
            <div key={seg.segment} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
              <p className="text-xs font-bold text-slate-800">{seg.segment}</p>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-lg font-black text-slate-900">{seg.share}% share</span>
                <span className="text-xs font-semibold text-[#E40000]">₹{seg.avg_arpu.toLocaleString('en-IN')} ARPU</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
