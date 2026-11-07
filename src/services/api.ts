import {
  BusinessProfile,
  Product,
  BundleRecommendation,
  Quote,
  Order,
  Lead,
  AdminAnalytics,
  GSTINVerificationResult
} from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || ''; // Empty in local dev: Vite proxies /api to FastAPI

export const api = {
  // Authentication
  async login(username: string) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    return res.json();
  },

  async logout() {
    const res = await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST' });
    return res.json();
  },

  // Business Profile
  async getProfile(): Promise<BusinessProfile> {
    const res = await fetch(`${API_BASE}/api/business/profile`);
    return res.json();
  },

  async updateProfile(profile: Partial<BusinessProfile>): Promise<BusinessProfile> {
    const res = await fetch(`${API_BASE}/api/business/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    return res.json();
  },

  // Products
  async getProducts(category?: string, search?: string): Promise<Product[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    const res = await fetch(`${API_BASE}/api/products?${params.toString()}`);
    return res.json();
  },

  async getProduct(id: string): Promise<Product> {
    const res = await fetch(`${API_BASE}/api/products/${id}`);
    return res.json();
  },

  // Advisor Chat
  async sendAdvisorChat(message: string, profile?: Partial<BusinessProfile>) {
    const res = await fetch(`${API_BASE}/api/advisor/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: 'udyam360-local-session', message, profile })
    });
    return res.json() as Promise<{
      session_id: string;
      reply: string;
      next_question: string | null;
      is_recommendation_ready: boolean;
      recommendation: BundleRecommendation | null;
    }>;
  },

  // Quotes
  async createQuote(data: {
    business_name: string;
    bundle_name: string;
    selected_product_ids: string[];
    custom_addons?: string[];
  }): Promise<Quote> {
    const res = await fetch(`${API_BASE}/api/quotes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getQuote(id: string): Promise<Quote> {
    const res = await fetch(`${API_BASE}/api/quotes/${id}`);
    return res.json();
  },

  // KYC
  async recordConsent(consentVersion = 'DPDP-2023-V1.2') {
    const res = await fetch(`${API_BASE}/api/kyc/consent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consent_version: consentVersion })
    });
    return res.json();
  },

  async uploadKycDocument(file: File, documentType: 'gst' | 'udyam' | 'address' | 'signatory', businessName = '') {
    const form = new FormData();
    form.append('file', file);
    form.append('document_type', documentType);
    form.append('business_name', businessName);
    const res = await fetch(`${API_BASE}/api/kyc/upload`, { method: 'POST', body: form });
    if (!res.ok) throw new Error((await res.json()).detail || 'KYC upload failed');
    return res.json();
  },

  async verifyGSTIN(data: {
    gstin: string;
    business_name?: string;
    address?: string;
    state?: string;
    constitution?: string;
  }): Promise<GSTINVerificationResult> {
    const res = await fetch(`${API_BASE}/api/kyc/gstin/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async verifyUdyam(data: {
    udyam_number: string;
    enterprise_name?: string;
    city?: string;
    state?: string;
  }): Promise<import('../types').UdyamVerificationResult> {
    const res = await fetch(`${API_BASE}/api/kyc/udyam/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async verifyKYC(data: {
    gstin?: string;
    udyam_number?: string;
    business_name: string;
  }) {
    const res = await fetch(`${API_BASE}/api/kyc/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Orders
  async createOrder(data: {
    quote_id?: string;
    bundle_name: string;
    monthly_charges: number;
    setup_charges: number;
    contract_duration_months?: number;
  }): Promise<Order> {
    const res = await fetch(`${API_BASE}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getOrder(id: string): Promise<Order> {
    const res = await fetch(`${API_BASE}/api/orders/${id}`);
    return res.json();
  },

  // Admin
  async getAdminAnalytics(): Promise<AdminAnalytics> {
    const res = await fetch(`${API_BASE}/api/admin/analytics`);
    return res.json();
  },

  async getAdminLeads(search?: string, category?: string, status?: string): Promise<Lead[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    if (status) params.append('status', status);
    const res = await fetch(`${API_BASE}/api/admin/leads?${params.toString()}`);
    return res.json();
  },

  async updateOrderStatus(id: string, stage_name: string, stage_index: number): Promise<Order> {
    const res = await fetch(`${API_BASE}/api/admin/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage_name, stage_index })
    });
    return res.json();
  },

  async humanHandoff(data: {
    business_name: string;
    requirements: string;
    reason: string;
  }) {
    const res = await fetch(`${API_BASE}/api/admin/handoff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  }
};
