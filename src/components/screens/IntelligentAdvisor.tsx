import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { BundleRecommendation } from '../../types';
import {
  Send,
  Sparkles,
  Layers,
  ArrowRight,
  Shield,
  Wifi,
  Mail,
  ChevronRight,
  CheckCircle,
  Headphones
} from 'lucide-react';

interface ChatItem {
  id: string;
  sender: 'advisor' | 'user';
  text: string;
  recommendation?: BundleRecommendation | null;
  timestamp: string;
}

export const IntelligentAdvisor: React.FC = () => {
  const { profile, setScreen, setCurrentRecommendation, setHandoffModalOpen, showToast } = useApp();

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Initial seed matching Screen 3
  const [messages, setMessages] = useState<ChatItem[]>([
    {
      id: 'm-1',
      sender: 'advisor',
      text: "Hi! I'm your Udyam360 Advisor. 👋\nTo recommend the right solutions, could you tell me what you're looking for?",
      timestamp: '10:02 AM'
    },
    {
      id: 'm-2',
      sender: 'user',
      text: "I run a small clinic with 5 employees. I need reliable internet, cloud email and data security. My budget is around ₹3,000 per month.",
      timestamp: '10:03 AM'
    },
    {
      id: 'm-3',
      sender: 'advisor',
      text: "Great! Based on your business profile and requirements, I've found a suitable solution for you.",
      recommendation: {
        bundle_name: 'Clinic Connect Bundle',
        tagline: 'Complete connectivity and productivity solution for small clinics.',
        recommended_for: profile.business_name || 'City Care Clinic',
        monthly_cost: 2899,
        setup_cost: 1500,
        contract_months: 12,
        tags: ['Broadband', 'Cloud Email', 'Security'],
        products: [
          { id: 'P-101', name: 'Airtel Business Broadband (100 Mbps)', price: 999, setup: 999 },
          { id: 'P-108', name: 'Airtel Business Email (5 users)', price: 1495, setup: 0 },
          { id: 'P-113', name: 'Airtel SecureSuite (5 devices)', price: 499, setup: 0 }
        ],
        why_recommended: [
          'Matches your requirements (internet, email, security)',
          'Fits within your ₹3,000/month budget',
          'Suitable for Professional Offices (Clinics)'
        ]
      },
      timestamp: '10:03 AM'
    }
  ]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatItem = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await api.sendAdvisorChat(textToSend, profile);
      const advMsg: ChatItem = {
        id: `a-${Date.now()}`,
        sender: 'advisor',
        text: res.reply,
        recommendation: res.recommendation,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, advMsg]);
      if (res.recommendation) {
        setCurrentRecommendation(res.recommendation);
      }
    } catch (err) {
      console.error(err);
      showToast('Advisor engine responded locally');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (rec: BundleRecommendation) => {
    setCurrentRecommendation(rec);
    setScreen('checkout');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)] flex flex-col justify-between">
      {/* Title Header */}
      <div className="pb-4 border-b border-slate-200 shrink-0 flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <span>Business Advisor</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-50 text-[#E40000] font-semibold border border-rose-200">
              Deterministic AI
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Let's find the best Airtel Business solutions for your needs.
          </p>
        </div>

        <button
          onClick={() => setHandoffModalOpen(true)}
          className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <Headphones className="w-3.5 h-3.5 text-slate-500" />
          <span>Need Human Support?</span>
        </button>
      </div>

      {/* Chat Messages Feed */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6 pr-2">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            {/* Bubble Header */}
            <div className="flex items-center space-x-2 mb-1.5 px-1">
              {msg.sender === 'advisor' ? (
                <div className="w-6 h-6 rounded-full bg-[#E40000] text-white flex items-center justify-center text-[10px] font-bold">
                  a
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                  RG
                </div>
              )}
              <span className="text-[11px] font-bold text-slate-700">
                {msg.sender === 'advisor' ? 'Udyam360 Advisor' : profile.business_name}
              </span>
              <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
            </div>

            {/* Bubble Content */}
            <div
              className={`max-w-xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-rose-50 text-slate-900 border border-rose-200 font-medium rounded-tr-none'
                  : 'bg-white text-slate-800 border border-slate-200 shadow-2xs rounded-tl-none whitespace-pre-line'
              }`}
            >
              {msg.text}
            </div>

            {/* Embedded Recommendation Card (Screen 3 style) */}
            {msg.recommendation && (
              <div className="mt-4 w-full max-w-xl bg-white border border-slate-200 rounded-2xl p-5 shadow-md">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Recommended for {msg.recommendation.recommended_for}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Budget Compatible
                  </span>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left info */}
                  <div className="flex items-start space-x-3.5">
                    <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#E40000] shrink-0">
                      <Layers className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">
                        {msg.recommendation.bundle_name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 max-w-xs line-clamp-1">
                        {msg.recommendation.tagline}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {msg.recommendation.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Pricing & Action */}
                  <div className="text-left sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <p className="text-lg font-black text-slate-900 leading-none">
                      ₹{msg.recommendation.monthly_cost.toLocaleString('en-IN')}{' '}
                      <span className="text-xs font-normal text-slate-500">/month</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      + ₹{msg.recommendation.setup_cost.toLocaleString('en-IN')} setup
                    </p>
                    <button
                      onClick={() => handleViewDetails(msg.recommendation!)}
                      className="mt-3 inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#E40000] hover:bg-[#C90000] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <span>View Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Why this bundle highlights */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1">
                  {msg.recommendation.why_recommended.map((why, i) => (
                    <div key={i} className="flex items-center space-x-2 text-[11px] text-slate-600">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{why}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-2 text-xs text-slate-400 pl-8">
            <span className="w-2 h-2 rounded-full bg-[#E40000] animate-bounce" />
            <span className="w-2 h-2 rounded-full bg-[#E40000] animate-bounce [animation-delay:0.2s]" />
            <span className="w-2 h-2 rounded-full bg-[#E40000] animate-bounce [animation-delay:0.4s]" />
            <span>Analyzing catalogue dependencies and scoring rules...</span>
          </div>
        )}
      </div>

      {/* Suggested Quick Inquiries */}
      <div className="py-2 flex items-center space-x-2 overflow-x-auto no-scrollbar shrink-0">
        <span className="text-[10px] font-bold text-slate-400 shrink-0">Suggestions:</span>
        <button
          onClick={() => handleSendMessage("We run a retail grocery shop with 4 staff and need fast broadband with POS SIM under ₹2,500/month")}
          className="shrink-0 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-medium transition-colors cursor-pointer"
        >
          Retail shop with POS (₹2,500)
        </button>
        <button
          onClick={() => handleSendMessage("We are a multi-site business with 3 branch offices needing SD-WAN and 1TB cloud storage")}
          className="shrink-0 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-medium transition-colors cursor-pointer"
        >
          Multi-branch SD-WAN & Storage
        </button>
        <button
          onClick={() => handleSendMessage("Need a dedicated 1:1 leased line and next-gen cyber firewall for our manufacturing plant")}
          className="shrink-0 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-medium transition-colors cursor-pointer"
        >
          1:1 Leased Line & Firewall
        </button>
      </div>

      {/* Bottom Message Input Box (Matching Screen 3) */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="pt-2 border-t border-slate-200 shrink-0 flex items-center space-x-3"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#E40000] shadow-2xs"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || loading}
          className={`w-11 h-11 rounded-xl flex items-center justify-center text-white transition-all shadow-xs cursor-pointer ${
            inputMessage.trim() && !loading
              ? 'bg-[#E40000] hover:bg-[#C90000]'
              : 'bg-slate-300 cursor-not-allowed'
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
