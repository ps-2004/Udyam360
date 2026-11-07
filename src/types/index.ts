export interface BusinessProfile {
  id?: number;
  business_name: string;
  business_category: string;
  business_type: string;
  city: string;
  city_tier: string;
  number_of_employees: number;
  number_of_locations: number;
  existing_provider?: string;
  current_internet_spend?: number;
  existing_tools?: string;
  required_products?: string;
  monthly_budget: number;
  gstin_available: boolean;
  gstin_number?: string;
  udyam_registered: boolean;
  udyam_number?: string;
  created_at?: string;
}

export interface Product {
  id: string;
  product_name: string;
  category: string;
  description: string;
  monthly_price: number;
  price_unit: string;
  setup_fee: number;
  contract_months: number;
  city_tiers: string;
  gstin_required: boolean;
  udyam_required: boolean;
  dependencies: string;
  features?: string;
}

export interface BundleRecommendation {
  bundle_name: string;
  tagline: string;
  recommended_for: string;
  monthly_cost: number;
  setup_cost: number;
  contract_months: number;
  tags: string[];
  products: Array<{
    id: string;
    name: string;
    price: number;
    setup: number;
  }>;
  why_recommended: string[];
  eligibility_warnings?: string[];
}

export interface QuoteItem {
  product_id: string;
  product_name: string;
  monthly_price: number;
  setup_fee: number;
  category?: string;
  is_addon?: boolean;
}

export interface Quote {
  id: string;
  business_name: string;
  bundle_name: string;
  monthly_recurring_charges: number;
  one_time_setup_fees: number;
  contract_duration_months: number;
  status: string;
  items: QuoteItem[];
  created_at: string;
}

export interface TimelineStage {
  stage: string;
  date: string;
  completed: boolean;
  index: number;
}

export interface Order {
  id: string;
  quote_id?: string;
  business_name: string;
  bundle_name: string;
  monthly_charges: number;
  setup_charges: number;
  contract_duration_months: number;
  current_stage: string;
  stage_index: number;
  installation_date?: string;
  installed_by?: string;
  status: string;
  timeline: TimelineStage[];
  created_at?: string;
}

export interface Lead {
  lead_id: string;
  business_name: string;
  category: string;
  city: string;
  tier?: string;
  employees?: string;
  locations?: string;
  budget?: string;
  requirements: string;
  recommended_bundle?: string;
  source?: string;
  status: 'New' | 'Qualified' | 'In Progress' | 'Converted' | string;
  created_date?: string;
  conversion_days?: string;
}

export interface AdminAnalytics {
  overview: {
    total_leads: number;
    leads_growth: string;
    conversions: number;
    conversions_growth: string;
    activation_rate: number;
    activation_rate_delta: string;
    avg_activation_time_days: number;
    avg_activation_time_delta: string;
  };
  conversion_funnel: Array<{
    stage: string;
    count: number;
    pct: number;
  }>;
  activations_over_time: Array<{
    month: string;
    activations: number;
  }>;
  segment_performance: Array<{
    segment: string;
    share: number;
    avg_arpu: number;
  }>;
}

export interface GSTINVerificationResult {
  verification_status:
    | 'Verified'
    | 'GSTIN not found'
    | 'Cancelled'
    | 'Suspended'
    | 'Business name mismatch'
    | 'Address mismatch'
    | 'Manual review required';
  gstin_exists: boolean;
  gstin: string;
  registered_business_name?: string | null;
  trade_name?: string | null;
  legal_name?: string | null;
  constitution?: string | null;
  registered_address?: string | null;
  state?: string | null;
  registration_date?: string | null;
  registration_status?: string | null;
  field_matches: {
    gstin_match: boolean;
    business_name_match?: boolean | null;
    address_match?: boolean | null;
    state_match?: boolean | null;
    status_active: boolean;
  };
  explanation: string;
  can_proceed_to_manual_review: boolean;
}

export interface UdyamVerificationResult {
  verification_status:
    | 'Verified'
    | 'Registration not found'
    | 'Enterprise name mismatch'
    | 'Incomplete information'
    | 'Manual review required';
  registration_exists: boolean;
  udyam_number: string;
  registered_enterprise_name?: string | null;
  available_registry_details?: {
    enterprise_name: string;
    enterprise_type: string;
    major_activity: string;
    nic_description: string;
    city: string;
    state: string;
    date_of_registration: string;
  } | null;
  field_level_matching: {
    udyam_format_valid: boolean;
    udyam_exists: boolean;
    enterprise_name_match?: boolean | null;
    city_match?: boolean | null;
    state_match?: boolean | null;
  };
  explanation: string;
  can_proceed_to_manual_review: boolean;
}

export type AppScreen =
  | 'landing'
  | 'profile'
  | 'advisor'
  | 'catalogue'
  | 'checkout'
  | 'kyc'
  | 'order'
  | 'admin_overview'
  | 'admin_leads';

