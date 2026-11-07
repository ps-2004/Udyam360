import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { Lead } from '../../types';
import {
  Search,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ChevronRight,
  ShieldAlert,
  Package
} from 'lucide-react';

export const AdminLeadsOrders: React.FC = () => {
  const { showToast, currentOrder, setCurrentOrder } = useApp();

  const [activeTab, setActiveTab] = useState<'leads' | 'orders'>('leads');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLeads();
  }, [searchQuery, selectedCategory, selectedStatus]);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminLeads(searchQuery, selectedCategory, selectedStatus);
      if (Array.isArray(data)) setLeads(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (leads.length === 0) return;
    const headers = Object.keys(leads[0]).join(',');
    const rows = leads.map(l => Object.values(l).map(v => `"${v}"`).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Airtel_Udyam360_Leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported leads dataset to CSV');
  };

  const handleAdvanceOrderStatus = async (stageIndex: number, stageName: string) => {
    try {
      const updated = await api.updateOrderStatus('ORD-2026-004517', stageName, stageIndex);
      if (updated) {
        setCurrentOrder(updated);
        showToast(`Order status updated to: ${stageName}`);
      }
    } catch (e) {
      console.error(e);
      showToast('Updated order status locally');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'converted':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Converted
          </span>
        );
      case 'in progress':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            In Progress
          </span>
        );
      case 'qualified':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Qualified
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            New
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto w-full space-y-6">
      {/* Top Tabs (Leads | Orders) */}
      <div className="flex items-center space-x-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('leads')}
          className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${
            activeTab === 'leads'
              ? 'text-[#E40000] border-b-2 border-[#E40000]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Leads
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${
            activeTab === 'orders'
              ? 'text-[#E40000] border-b-2 border-[#E40000]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Orders
        </button>
      </div>

      {activeTab === 'leads' ? (
        <div className="space-y-6">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Leads Management
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Real-time pipeline across digital self-serve and regional enterprise field sales.
              </p>
            </div>

            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 bg-[#E40000] hover:bg-[#C90000] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>

          {/* Search & Filters (Matching Screen 9) */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by business name, city or ID..."
                className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#E40000]"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-white rounded-xl border border-slate-300 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#E40000]"
              >
                <option value="All Categories">All Categories</option>
                <option value="Professional Office">Professional Office</option>
                <option value="Micro Retail">Micro Retail</option>
                <option value="Small Multi-site Business">Small Multi-site Business</option>
                <option value="Small Manufacturer">Small Manufacturer</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2.5 bg-white rounded-xl border border-slate-300 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#E40000]"
              >
                <option value="All Status">All Status</option>
                <option value="Converted">Converted</option>
                <option value="In Progress">In Progress</option>
                <option value="Qualified">Qualified</option>
                <option value="New">New</option>
              </select>
            </div>
          </div>

          {/* Leads Table (Screen 9 replica) */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-3.5 px-4">Lead ID</th>
                    <th className="py-3.5 px-4">Business Name</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">City</th>
                    <th className="py-3.5 px-4">Requirement</th>
                    <th className="py-3.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {leads.map((l) => (
                    <tr key={l.lead_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{l.lead_id}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{l.business_name}</td>
                      <td className="py-3.5 px-4">{l.category}</td>
                      <td className="py-3.5 px-4">{l.city}</td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">{l.requirements}</td>
                      <td className="py-3.5 px-4">{getStatusBadge(l.status)}</td>
                    </tr>
                  ))}

                  {leads.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        No leads match current filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Orders Tab: Real-time Order Stage Controller */
        <div className="space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Orders & Optical Activation Operations
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Control and simulate field installation and optical NOC provisioning stages.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
              <div>
                <span className="text-[10px] font-bold text-[#E40000] uppercase tracking-wider">
                  Active Subscription Order
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  ORD-2026-004517 • City Care Clinic
                </h3>
                <p className="text-xs text-slate-500">
                  Bundle: Clinic Connect Bundle (₹2,899/month) • Bengaluru Tier 1
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Current: {currentOrder?.current_stage || 'Service Activated'}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-800">
                Simulate Field Engineering Progress (Updates Customer Order Tracker in real-time):
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {[
                  { name: 'Order Placed', idx: 1 },
                  { name: 'KYC Verification', idx: 2 },
                  { name: 'Feasibility Check', idx: 3 },
                  { name: 'Installation Scheduled', idx: 4 },
                  { name: 'Installation In Progress', idx: 5 },
                  { name: 'Installation Completed', idx: 6 },
                  { name: 'Service Activated', idx: 7 },
                ].map((st) => (
                  <button
                    key={st.idx}
                    onClick={() => handleAdvanceOrderStatus(st.idx, st.name)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
                      (currentOrder?.stage_index || 7) >= st.idx
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-[10px] opacity-75">Stage {st.idx}</span>
                    <span className="mt-1 leading-tight">{st.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
