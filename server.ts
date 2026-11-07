import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

function resolvePort(): number {
  const portArgIdx = process.argv.indexOf('--port');
  if (portArgIdx !== -1 && process.argv[portArgIdx + 1]) {
    const parsed = parseInt(process.argv[portArgIdx + 1], 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 3000;
}
const PORT = resolvePort();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Helper to parse CSV simply and robustly
function parseCSV(filePath: string): Array<Record<string, string>> {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];

  // Parse header
  const headers = splitCSVLine(lines[0]);
  const results: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitCSVLine(lines[i]);
    if (values.length === headers.length) {
      const obj: Record<string, string> = {};
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j].trim()] = values[j].trim();
      }
      results.push(obj);
    }
  }
  return results;
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// In-memory persistent state initialized with dataset
const catalogueRows = parseCSV(path.join(__dirname, 'data', 'product_catalogue.csv'));
const gstinRows = parseCSV(path.join(__dirname, 'data', 'mock_gstin_registry.csv'));
const udyamRows = parseCSV(path.join(__dirname, 'data', 'mock_udyam_registry.csv'));
const leadsRows = parseCSV(path.join(__dirname, 'data', 'smb_leads.csv'));

// Clean products map
interface ProductItem {
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
  features: string;
}

const productsMap = new Map<string, ProductItem>();
for (const r of catalogueRows) {
  const pid = r.product_id || r.id;
  if (!pid) continue;
  productsMap.set(pid, {
    id: pid,
    product_name: r.product_name || '',
    category: r.category || 'Connectivity',
    description: r.description || '',
    monthly_price: parseFloat(r.price_min_inr_per_month || r.monthly_price) || 0,
    price_unit: r.unit || r.price_unit || 'per month',
    setup_fee: parseFloat(r.one_time_setup_inr || r.setup_fee) || 0,
    contract_months: parseInt(r.min_contract_months || r.contract_months, 10) || 12,
    city_tiers: r.available_city_tiers || r.city_tiers || '1;2',
    gstin_required: (r.requires_gstin || r.gstin_required)?.toUpperCase() === 'Y' || (r.requires_gstin || r.gstin_required)?.toLowerCase() === 'true',
    udyam_required: r.udyam_required?.toLowerCase() === 'true',
    dependencies: r.requires_one_of || r.dependencies || 'None',
    features: r.features || r.target_segments || ''
  });
}

// State Stores
let currentBusinessProfile = {
  id: 1,
  user_id: 1,
  business_name: 'City Care Clinic',
  business_category: 'Professional Office',
  business_type: 'Service Business',
  city: 'Bengaluru',
  city_tier: 'Tier 1',
  number_of_employees: 5,
  number_of_locations: 1,
  existing_provider: 'Local Cable ISP',
  current_internet_spend: 1800,
  existing_tools: 'Gmail, WhatsApp, Local billing software',
  required_products: 'Internet, Email, Security',
  monthly_budget: 3000,
  gstin_available: true,
  gstin_number: '29AABCU9603R1ZM',
  udyam_registered: true,
  udyam_number: 'UDYAM-KR-03-0012345',
  created_at: new Date().toISOString()
};

let userConsent = {
  accepted: true,
  consent_version: 'DPDP-2023-V1.2',
  granted_at: '2026-01-12T09:30:00Z',
  retention_days: 180
};

let ordersStore: any[] = [
  {
    id: 'ORD-2026-004517',
    business_name: 'City Care Clinic',
    bundle_name: 'Clinic Connect Bundle',
    monthly_charges: 2899,
    setup_charges: 1500,
    contract_duration_months: 12,
    current_stage: 'Service Activated',
    stage_index: 7,
    installation_date: '17 Jan 2026',
    installed_by: 'Airtel Business Partner',
    status: 'Completed',
    created_at: '2026-01-12T10:00:00Z',
    timeline: [
      { stage: 'Order Placed', date: '12 Jan', completed: true, index: 1 },
      { stage: 'KYC Verification', date: '13 Jan', completed: true, index: 2 },
      { stage: 'Feasibility Check', date: '14 Jan', completed: true, index: 3 },
      { stage: 'Installation Scheduled', date: '15 Jan', completed: true, index: 4 },
      { stage: 'Installation In Progress', date: '16 Jan', completed: true, index: 5 },
      { stage: 'Installation Completed', date: '17 Jan', completed: true, index: 6 },
      { stage: 'Service Activated', date: '17 Jan', completed: true, index: 7 },
    ]
  }
];

let quotesStore: any[] = [
  {
    id: 'QT-2026-00912',
    business_name: 'City Care Clinic',
    bundle_name: 'Clinic Connect Bundle',
    monthly_recurring_charges: 2899,
    one_time_setup_fees: 1500,
    contract_duration_months: 12,
    status: 'Generated',
    created_at: new Date().toISOString(),
    items: [
      { product_id: 'P-101', product_name: 'Airtel Business Broadband (100 Mbps)', monthly_price: 999, setup_fee: 999, category: 'Internet' },
      { product_id: 'P-108', product_name: 'Airtel Business Email (5 users)', monthly_price: 1495, setup_fee: 0, category: 'Cloud & Collaboration' },
      { product_id: 'P-113', product_name: 'Airtel SecureSuite (5 devices)', monthly_price: 499, setup_fee: 0, category: 'Security' }
    ]
  }
];

// Health Check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    products_count: productsMap.size,
    gstin_count: gstinRows.length,
    udyam_count: udyamRows.length,
    leads_count: leadsRows.length,
    timestamp: new Date().toISOString()
  });
});

// Authentication
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username } = req.body || {};
  const isAdmin = username && username.toLowerCase().includes('admin');
  res.json({
    token: 'mock-jwt-udyam360-token',
    user: {
      id: isAdmin ? 99 : 1,
      email: username || 'demo@airtelbusiness.in',
      name: isAdmin ? 'Admin' : 'Dr. Ramesh Gupta',
      business_name: 'City Care Clinic',
      role: isAdmin ? 'admin' : 'customer'
    }
  });
});

app.post('/api/auth/logout', (_req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});

// Business Profile
app.get('/api/business/profile', (_req: Request, res: Response) => {
  res.json(currentBusinessProfile);
});

app.post('/api/business/profile', (req: Request, res: Response) => {
  currentBusinessProfile = {
    ...currentBusinessProfile,
    ...req.body,
    updated_at: new Date().toISOString()
  };
  res.json(currentBusinessProfile);
});

// Products
app.get('/api/products', (req: Request, res: Response) => {
  const { category, search } = req.query as { category?: string; search?: string };
  let list = Array.from(productsMap.values());
  if (category && category.toLowerCase() !== 'all products' && category.toLowerCase() !== 'all') {
    list = list.filter(p => p.category.toLowerCase().includes(category.toLowerCase()));
  }
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(p =>
      p.product_name.toLowerCase().includes(s) ||
      p.description.toLowerCase().includes(s) ||
      p.category.toLowerCase().includes(s)
    );
  }
  res.json(list);
});

app.get('/api/products/:id', (req: Request, res: Response) => {
  const prod = productsMap.get(req.params.id);
  if (!prod) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(prod);
});

// Intelligent Advisor Engine
app.post('/api/advisor/chat', (req: Request, res: Response) => {
  const { message, profile } = req.body || {};
  const lower = (message || '').toLowerCase();
  
  // Rule-based intent detection
  const hasClinic = lower.includes('clinic') || lower.includes('doctor') || lower.includes('healthcare');
  const hasEmployees = lower.includes('employee') || lower.includes('staff') || /\b5\b/.test(lower);
  const hasBudget = lower.includes('3,000') || lower.includes('3000') || lower.includes('budget');
  const hasTechNeeds = lower.includes('internet') || lower.includes('email') || lower.includes('security');

  if ((hasClinic && hasBudget) || (hasTechNeeds && hasBudget) || lower.length > 50) {
    // Return recommended bundle matching Screen 3
    return res.json({
      session_id: 'sess-adv-01',
      reply: "Great! Based on your business profile and requirements, I've found a suitable solution for you.",
      next_question: "Would you like to customize addons (such as Airtel Business Voice or Cloud Storage) or proceed directly to checkout?",
      is_recommendation_ready: true,
      recommendation: {
        bundle_name: 'Clinic Connect Bundle',
        tagline: 'Complete connectivity and productivity solution for small clinics.',
        recommended_for: profile?.business_name || currentBusinessProfile.business_name || 'City Care Clinic',
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
      }
    });
  }

  // Conversational prompts
  if (hasClinic) {
    return res.json({
      session_id: 'sess-adv-01',
      reply: "How many employees work at your clinic, and do you currently have active broadband?",
      next_question: null,
      is_recommendation_ready: false,
      recommendation: null
    });
  }

  return res.json({
    session_id: 'sess-adv-01',
    reply: "Hi! I'm your Udyam360 Advisor. 👋 To recommend the best Airtel Business solutions for your needs, could you tell me what you're looking for?",
    next_question: "What type of business do you run, and what services (internet, cloud email, cyber security, phone line) do you need?",
    is_recommendation_ready: false,
    recommendation: null
  });
});

// Quotes
app.post('/api/quotes', (req: Request, res: Response) => {
  const { business_name, bundle_name, selected_product_ids, custom_addons } = req.body || {};
  const quoteId = `QT-2026-00${quotesStore.length + 913}`;

  let monthlyTotal = 0;
  let setupTotal = 0;
  const items: any[] = [];

  const pids = selected_product_ids || ['P-101', 'P-108', 'P-113'];
  for (const pid of pids) {
    const p = productsMap.get(pid);
    if (p) {
      // Calculate realistic user pricing (e.g. 5 email users = 299 * 5 = 1495)
      let mPrice = p.monthly_price;
      if (pid === 'P-108') mPrice = 1495; // 5 users
      monthlyTotal += mPrice;
      setupTotal += p.setup_fee;
      items.push({
        product_id: p.id,
        product_name: p.product_name,
        monthly_price: mPrice,
        setup_fee: p.setup_fee,
        category: p.category
      });
    }
  }

  // Handle optional addons if selected
  if (custom_addons && Array.isArray(custom_addons)) {
    for (const addonId of custom_addons) {
      const p = productsMap.get(addonId);
      if (p && !pids.includes(addonId)) {
        monthlyTotal += p.monthly_price;
        setupTotal += p.setup_fee;
        items.push({
          product_id: p.id,
          product_name: p.product_name,
          monthly_price: p.monthly_price,
          setup_fee: p.setup_fee,
          is_addon: true
        });
      }
    }
  }

  const newQuote = {
    id: quoteId,
    business_name: business_name || currentBusinessProfile.business_name,
    bundle_name: bundle_name || 'Clinic Connect Bundle',
    monthly_recurring_charges: monthlyTotal || 2899,
    one_time_setup_fees: setupTotal || 1500,
    contract_duration_months: 12,
    status: 'Generated',
    created_at: new Date().toISOString(),
    items: items.length > 0 ? items : [
      { product_id: 'P-101', product_name: 'Airtel Business Broadband (100 Mbps)', monthly_price: 999, setup_fee: 999 },
      { product_id: 'P-108', product_name: 'Airtel Business Email (5 users)', monthly_price: 1495, setup_fee: 0 },
      { product_id: 'P-113', product_name: 'Airtel SecureSuite (5 devices)', monthly_price: 499, setup_fee: 0 }
    ]
  };

  quotesStore.unshift(newQuote);
  res.json(newQuote);
});

app.get('/api/quotes/:id', (req: Request, res: Response) => {
  const q = quotesStore.find(item => item.id === req.params.id) || quotesStore[0];
  res.json(q);
});

// Consent
app.post('/api/kyc/consent', (req: Request, res: Response) => {
  userConsent = {
    accepted: true,
    consent_version: req.body?.consent_version || 'DPDP-2023-V1.2',
    granted_at: new Date().toISOString(),
    retention_days: 180
  };
  res.json({
    success: true,
    consent: userConsent,
    message: 'DPDP Act 2023 consent timestamped and logged.'
  });
});

// Helper functions for GSTIN matching
function cleanGstinText(s: string): string {
  if (!s) return '';
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractNameTokens(s: string): Set<string> {
  const stopWords = new Set([
    'prop', 'proprietor', 'pvt', 'ltd', 'private', 'limited', 'llp',
    'and', 'co', 'the', 'services', 'enterprises', 'company', 'corp'
  ]);
  const cleaned = cleanGstinText(s);
  const tokens = cleaned.split(' ').filter(t => t.length > 0);
  const meaningful = tokens.filter(t => !stopWords.has(t));
  return new Set(meaningful.length > 0 ? meaningful : tokens);
}

function matchBusinessName(submitted: string | undefined, legalName: string, tradeName: string): boolean {
  if (!submitted || !submitted.trim()) return true;
  const subClean = cleanGstinText(submitted);
  const legalClean = cleanGstinText(legalName);
  const tradeClean = cleanGstinText(tradeName);

  if (subClean === legalClean || subClean === tradeClean) return true;
  if (legalClean.includes(subClean) || tradeClean.includes(subClean)) return true;
  if (tradeClean && subClean.includes(tradeClean)) return true;

  const subTokens = Array.from(extractNameTokens(submitted));
  const legalTokens = extractNameTokens(legalName);
  const tradeTokens = extractNameTokens(tradeName);

  const subInLegal = subTokens.every(t => legalTokens.has(t));
  const subInTrade = subTokens.every(t => tradeTokens.has(t));
  if (subInLegal || subInTrade) return true;

  // Jaccard threshold
  if (tradeTokens.size > 0) {
    const interTrade = subTokens.filter(t => tradeTokens.has(t)).length;
    const unionTrade = new Set([...subTokens, ...Array.from(tradeTokens)]).size;
    if (unionTrade > 0 && interTrade / unionTrade >= 0.5) return true;
  }
  if (legalTokens.size > 0) {
    const interLegal = subTokens.filter(t => legalTokens.has(t)).length;
    const unionLegal = new Set([...subTokens, ...Array.from(legalTokens)]).size;
    if (unionLegal > 0 && interLegal / unionLegal >= 0.5) return true;
  }
  return false;
}

function matchAddress(
  submittedAddr: string | undefined,
  submittedState: string | undefined,
  regAddr: string,
  regState: string
): { stateMatch: boolean | null; addressMatch: boolean | null } {
  if (!submittedAddr && !submittedState) {
    return { stateMatch: null, addressMatch: null };
  }
  let stateMatch: boolean | null = null;
  if (submittedState && submittedState.trim()) {
    stateMatch = submittedState.trim().toLowerCase() === regState.trim().toLowerCase();
  } else if (submittedAddr) {
    const regStateClean = cleanGstinText(regState);
    const subAddrClean = cleanGstinText(submittedAddr);
    if (subAddrClean.includes(regStateClean)) {
      stateMatch = true;
    }
  }

  let addressMatch: boolean | null = null;
  if (submittedAddr && submittedAddr.trim()) {
    const subClean = cleanGstinText(submittedAddr);
    const regClean = cleanGstinText(regAddr);
    const stopWords = new Set(['shop', 'unit', 'road', 'street', 'no', 'floor', 'plot', 'near', 'opp', 'opposite', 'india']);
    const subTokens = subClean.split(' ').filter(t => t.length > 0 && !stopWords.has(t));
    const regTokens = new Set(regClean.split(' ').filter(t => t.length > 0 && !stopWords.has(t)));
    const inter = subTokens.filter(t => regTokens.has(t));
    if (stateMatch === false) {
      addressMatch = false;
    } else if (inter.length > 0) {
      addressMatch = true;
    } else {
      addressMatch = false;
    }
  }
  return { stateMatch, addressMatch };
}

// POST /api/kyc/gstin/verify
app.post('/api/kyc/gstin/verify', (req: Request, res: Response) => {
  const { gstin, business_name, address, state, constitution } = req.body || {};
  const cleanGst = (gstin || '').trim().toUpperCase();

  if (!cleanGst) {
    return res.status(400).json({ error: 'GSTIN number is required for verification.' });
  }

  const formatValid = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(cleanGst);
  const record = gstinRows.find(r => (r.gstin || '').trim().toUpperCase() === cleanGst);

  if (!record) {
    return res.json({
      verification_status: 'GSTIN not found',
      gstin_exists: false,
      gstin: cleanGst,
      registered_business_name: null,
      trade_name: null,
      legal_name: null,
      constitution: null,
      registered_address: null,
      state: null,
      registration_date: null,
      registration_status: null,
      field_matches: {
        gstin_match: false,
        business_name_match: business_name ? false : null,
        address_match: address ? false : null,
        state_match: state ? false : null,
        status_active: false
      },
      explanation: formatValid
        ? `GSTIN '${cleanGst}' was not found in the local GST registry. Desk verification or physical invoice required.`
        : `Invalid GSTIN format '${cleanGst}'. GSTIN must be a 15-character alphanumeric identifier.`,
      can_proceed_to_manual_review: true
    });
  }

  const regLegalName = record.legal_name || '';
  const regTradeName = record.trade_name || '';
  const regConstitution = record.constitution || '';
  const regAddress = record.principal_place_of_business || record.address || '';
  const regState = record.state || '';
  const regDate = record.registration_date || '';
  const regStatus = record.status || 'Active';
  const isActive = regStatus.toLowerCase() === 'active';

  if (regStatus.toLowerCase() === 'cancelled') {
    return res.json({
      verification_status: 'Cancelled',
      gstin_exists: true,
      gstin: cleanGst,
      registered_business_name: regLegalName,
      trade_name: regTradeName,
      legal_name: regLegalName,
      constitution: regConstitution,
      registered_address: regAddress,
      state: regState,
      registration_date: regDate,
      registration_status: 'Cancelled',
      field_matches: {
        gstin_match: true,
        business_name_match: business_name ? matchBusinessName(business_name, regLegalName, regTradeName) : null,
        address_match: null,
        state_match: null,
        status_active: false
      },
      explanation: `GSTIN ${cleanGst} registration was cancelled by authorities on/after ${regDate}. Services cannot be provisioned.`,
      can_proceed_to_manual_review: true
    });
  }

  if (regStatus.toLowerCase() === 'suspended') {
    return res.json({
      verification_status: 'Suspended',
      gstin_exists: true,
      gstin: cleanGst,
      registered_business_name: regLegalName,
      trade_name: regTradeName,
      legal_name: regLegalName,
      constitution: regConstitution,
      registered_address: regAddress,
      state: regState,
      registration_date: regDate,
      registration_status: 'Suspended',
      field_matches: {
        gstin_match: true,
        business_name_match: business_name ? matchBusinessName(business_name, regLegalName, regTradeName) : null,
        address_match: null,
        state_match: null,
        status_active: false
      },
      explanation: `GSTIN ${cleanGst} is currently suspended due to pending returns or compliance review. Order cannot be completed automatically.`,
      can_proceed_to_manual_review: true
    });
  }

  const nameMatched = business_name ? matchBusinessName(business_name, regLegalName, regTradeName) : true;
  const { stateMatch, addressMatch } = matchAddress(address, state, regAddress, regState);

  const fieldMatches = {
    gstin_match: true,
    business_name_match: business_name ? nameMatched : null,
    address_match: addressMatch,
    state_match: stateMatch,
    status_active: isActive
  };

  if (!nameMatched) {
    return res.json({
      verification_status: 'Business name mismatch',
      gstin_exists: true,
      gstin: cleanGst,
      registered_business_name: regLegalName,
      trade_name: regTradeName,
      legal_name: regLegalName,
      constitution: regConstitution,
      registered_address: regAddress,
      state: regState,
      registration_date: regDate,
      registration_status: regStatus,
      field_matches: fieldMatches,
      explanation: `Submitted name '${business_name}' does not match registered legal name '${regLegalName}' or trade name '${regTradeName}'.`,
      can_proceed_to_manual_review: true
    });
  }

  if (addressMatch === false || stateMatch === false) {
    return res.json({
      verification_status: 'Address mismatch',
      gstin_exists: true,
      gstin: cleanGst,
      registered_business_name: regLegalName,
      trade_name: regTradeName,
      legal_name: regLegalName,
      constitution: regConstitution,
      registered_address: regAddress,
      state: regState,
      registration_date: regDate,
      registration_status: regStatus,
      field_matches: fieldMatches,
      explanation: `Submitted location '${address || state}' does not match registered principal place of business: '${regAddress}'.`,
      can_proceed_to_manual_review: true
    });
  }

  return res.json({
    verification_status: 'Verified',
    gstin_exists: true,
    gstin: cleanGst,
    registered_business_name: regLegalName,
    trade_name: regTradeName,
    legal_name: regLegalName,
    constitution: regConstitution,
    registered_address: regAddress,
    state: regState,
    registration_date: regDate,
    registration_status: 'Active',
    field_matches: fieldMatches,
    explanation: 'GSTIN is Active and verified. Business identity and address match official GST registry records.',
    can_proceed_to_manual_review: false
  });
});

// Helper functions for Udyam matching
function cleanUdyamText(s: string): string {
  if (!s) return '';
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function matchEnterpriseName(submitted: string | undefined, registered: string): boolean {
  if (!submitted || !submitted.trim()) return true;
  const subClean = cleanUdyamText(submitted);
  const regClean = cleanUdyamText(registered);

  if (subClean === regClean) return true;
  if (regClean.includes(subClean) || subClean.includes(regClean)) return true;

  const stopWords = new Set([
    'prop', 'proprietor', 'pvt', 'ltd', 'private', 'limited', 'llp',
    'and', 'co', 'the', 'services', 'enterprises', 'company', 'corp', 'solutions', 'industries'
  ]);
  const subTokens = subClean.split(' ').filter(t => t.length > 0 && !stopWords.has(t));
  const regTokens = new Set(regClean.split(' ').filter(t => t.length > 0 && !stopWords.has(t)));

  if (subTokens.length > 0 && subTokens.every(t => regTokens.has(t))) return true;

  const inter = subTokens.filter(t => regTokens.has(t)).length;
  const union = new Set([...subTokens, ...Array.from(regTokens)]).size;
  if (union > 0 && inter / union >= 0.5) return true;

  return false;
}

// POST /api/kyc/udyam/verify
app.post('/api/kyc/udyam/verify', (req: Request, res: Response) => {
  const { udyam_number, enterprise_name, city, state } = req.body || {};
  const cleanUdyam = (udyam_number || '').trim().toUpperCase();

  if (!cleanUdyam) {
    return res.json({
      verification_status: 'Incomplete information',
      registration_exists: false,
      udyam_number: '',
      registered_enterprise_name: null,
      available_registry_details: null,
      field_level_matching: {
        udyam_format_valid: false,
        udyam_exists: false,
        enterprise_name_match: null,
        city_match: null,
        state_match: null
      },
      explanation: 'Udyam registration number was not provided.',
      can_proceed_to_manual_review: true
    });
  }

  const formatValid = /^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$/.test(cleanUdyam);
  const record = udyamRows.find(r => (r.udyam_number || '').trim().toUpperCase() === cleanUdyam);

  if (!record) {
    return res.json({
      verification_status: 'Registration not found',
      registration_exists: false,
      udyam_number: cleanUdyam,
      registered_enterprise_name: null,
      available_registry_details: null,
      field_level_matching: {
        udyam_format_valid: formatValid,
        udyam_exists: false,
        enterprise_name_match: enterprise_name ? false : null,
        city_match: city ? false : null,
        state_match: state ? false : null
      },
      explanation: formatValid
        ? `Udyam registration number '${cleanUdyam}' was not found in the MSME registry records.`
        : `Invalid Udyam registration format '${cleanUdyam}'. Must follow pattern UDYAM-XX-00-0000000.`,
      can_proceed_to_manual_review: true
    });
  }

  const regName = record.enterprise_name || '';
  const regCity = record.city || '';
  const regState = record.state || '';
  const regType = record.enterprise_type || 'Micro';
  const regActivity = record.major_activity || 'Services';
  const regNic = record.nic_description || '';
  const regDate = record.date_of_registration || '';

  const nameMatched = enterprise_name ? matchEnterpriseName(enterprise_name, regName) : true;
  
  let cityMatched: boolean | null = null;
  if (city && city.trim()) {
    const cSub = cleanUdyamText(city);
    const cReg = cleanUdyamText(regCity);
    cityMatched = cSub === cReg || cSub.includes(cReg) || cReg.includes(cSub);
  }

  let stateMatched: boolean | null = null;
  if (state && state.trim()) {
    const sSub = cleanUdyamText(state);
    const sReg = cleanUdyamText(regState);
    stateMatched = sSub === sReg || sSub.includes(sReg) || sReg.includes(sSub);
  }

  const fieldMatches = {
    udyam_format_valid: true,
    udyam_exists: true,
    enterprise_name_match: enterprise_name ? nameMatched : null,
    city_match: cityMatched,
    state_match: stateMatched
  };

  const registryDetails = {
    enterprise_name: regName,
    enterprise_type: regType,
    major_activity: regActivity,
    nic_description: regNic,
    city: regCity,
    state: regState,
    date_of_registration: regDate
  };

  if (!nameMatched) {
    return res.json({
      verification_status: 'Enterprise name mismatch',
      registration_exists: true,
      udyam_number: cleanUdyam,
      registered_enterprise_name: regName,
      available_registry_details: registryDetails,
      field_level_matching: fieldMatches,
      explanation: `Submitted enterprise name '${enterprise_name}' does not match registered MSME name '${regName}'.`,
      can_proceed_to_manual_review: true
    });
  }

  if (cityMatched === false || stateMatched === false) {
    return res.json({
      verification_status: 'Manual review required',
      registration_exists: true,
      udyam_number: cleanUdyam,
      registered_enterprise_name: regName,
      available_registry_details: registryDetails,
      field_level_matching: fieldMatches,
      explanation: `Submitted location '${city || ''}, ${state || ''}' differs from registered location '${regCity}, ${regState}'. Manual verification needed.`,
      can_proceed_to_manual_review: true
    });
  }

  return res.json({
    verification_status: 'Verified',
    registration_exists: true,
    udyam_number: cleanUdyam,
    registered_enterprise_name: regName,
    available_registry_details: registryDetails,
    field_level_matching: fieldMatches,
    explanation: `Udyam registration is verified. Enterprise '${regName}' is registered as a ${regType} enterprise (${regActivity}) in ${regCity}, ${regState}.`,
    can_proceed_to_manual_review: false
  });
});

// KYC Verification (Overall)
app.post('/api/kyc/verify', (req: Request, res: Response) => {
  const { gstin, udyam_number, business_name } = req.body || {};
  const g = (gstin || currentBusinessProfile.gstin_number || '').trim().toUpperCase();
  const u = (udyam_number || currentBusinessProfile.udyam_number || '').trim().toUpperCase();

  // Match against mock GSTIN registry
  const gstinRecord = gstinRows.find(r => r.gstin.trim().toUpperCase() === g);
  // Match against mock Udyam registry
  const udyamRecord = udyamRows.find(r => r.udyam_number.trim().toUpperCase() === u);

  const gstinValid = gstinRecord ? gstinRecord.status === 'Active' : /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(g);
  const udyamValid = udyamRecord ? udyamRecord.status === 'Verified' : /^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$/.test(u);

  const isApproved = gstinValid && udyamValid;
  const overallStatus = isApproved ? 'Verified' : (gstinValid || udyamValid ? 'Needs Manual Review' : 'Rejected');

  res.json({
    submission_id: `KYC-2026-${Date.now().toString().slice(-6)}`,
    business_name: business_name || currentBusinessProfile.business_name,
    gstin: g,
    gstin_status: gstinRecord?.status || (gstinValid ? 'ValidFormat' : 'NotFound'),
    udyam_number: u,
    udyam_status: udyamRecord?.status || (udyamValid ? 'ValidFormat' : 'NotFound'),
    overall_status: overallStatus,
    confidence_score: isApproved ? 98.5 : 74.0,
    details: {
      legal_name: gstinRecord?.legal_name || currentBusinessProfile.business_name,
      address: gstinRecord?.address || `${currentBusinessProfile.city}, India`,
      enterprise_type: udyamRecord?.enterprise_type || 'Micro',
      filing_status: gstinRecord?.filing_status || 'Up to Date',
      ocr_match: true
    }
  });
});

// Orders & Order Tracker
app.get('/api/orders/:id', (req: Request, res: Response) => {
  const ord = ordersStore.find(o => o.id === req.params.id) || ordersStore[0];
  res.json(ord);
});

app.post('/api/orders', (req: Request, res: Response) => {
  const { quote_id, bundle_name, monthly_charges, setup_charges } = req.body || {};
  const orderId = `ORD-2026-${Date.now().toString().slice(-6)}`;
  const newOrder = {
    id: orderId,
    quote_id: quote_id || 'QT-2026-00912',
    business_name: currentBusinessProfile.business_name,
    bundle_name: bundle_name || 'Clinic Connect Bundle',
    monthly_charges: monthly_charges || 2899,
    setup_charges: setup_charges || 1500,
    contract_duration_months: 12,
    current_stage: 'Service Activated',
    stage_index: 7,
    installation_date: '17 Jan 2026',
    installed_by: 'Airtel Business Partner',
    status: 'Completed',
    created_at: new Date().toISOString(),
    timeline: [
      { stage: 'Order Placed', date: '12 Jan', completed: true, index: 1 },
      { stage: 'KYC Verification', date: '13 Jan', completed: true, index: 2 },
      { stage: 'Feasibility Check', date: '14 Jan', completed: true, index: 3 },
      { stage: 'Installation Scheduled', date: '15 Jan', completed: true, index: 4 },
      { stage: 'Installation In Progress', date: '16 Jan', completed: true, index: 5 },
      { stage: 'Installation Completed', date: '17 Jan', completed: true, index: 6 },
      { stage: 'Service Activated', date: '17 Jan', completed: true, index: 7 },
    ]
  };
  ordersStore.unshift(newOrder);
  res.json(newOrder);
});

// Dynamic analytics computed from smb_leads dataset (5,000 records)
app.get('/api/admin/analytics', (_req: Request, res: Response) => {
  const total = leadsRows.length || 5000;
  const activated = leadsRows.filter(r => r.outcome === 'Activated');
  const activatedCount = activated.length || 368;
  const actRate = parseFloat(((activatedCount / total) * 100).toFixed(2));

  // Cumulative funnel calculations
  const contacted = leadsRows.filter(r => r.stage_reached !== 'Lead');
  const needsAssessed = contacted.filter(r => r.stage_reached !== 'Contacted');
  const quoteAccepted = needsAssessed.filter(r => r.stage_reached !== 'Needs assessed');
  const kycComplete = quoteAccepted.filter(r => r.stage_reached !== 'Quote accepted');

  const funnel = [
    { stage: 'Leads', count: total, pct: 100 },
    { stage: 'Contacted', count: contacted.length, pct: parseFloat(((contacted.length / total) * 100).toFixed(1)) },
    { stage: 'Needs Assessed', count: needsAssessed.length, pct: parseFloat(((needsAssessed.length / total) * 100).toFixed(1)) },
    { stage: 'Quote Accepted', count: quoteAccepted.length, pct: parseFloat(((quoteAccepted.length / total) * 100).toFixed(1)) },
    { stage: 'KYC Complete', count: kycComplete.length, pct: parseFloat(((kycComplete.length / total) * 100).toFixed(1)) },
    { stage: 'Activated', count: activatedCount, pct: parseFloat(((activatedCount / total) * 100).toFixed(1)) }
  ];

  // Segment distribution & ARPU
  const segments = ['Micro retail & services', 'Professional offices', 'Small multi-site businesses', 'Small manufacturers'];
  const segmentPerf = segments.map(seg => {
    const segLeads = leadsRows.filter(r => (r.segment || '').toLowerCase() === seg.toLowerCase());
    const segActivated = segLeads.filter(r => r.outcome === 'Activated');
    const totalRev = segActivated.reduce((acc, curr) => acc + (parseFloat(curr.monthly_bundle_value_inr) || 0), 0);
    const avgArpu = segActivated.length > 0 ? Math.round(totalRev / segActivated.length) : 0;
    return {
      segment: seg,
      share: total > 0 ? Math.round((segLeads.length / total) * 100) : 0,
      count: segLeads.length,
      avg_arpu: avgArpu
    };
  });

  // Calculate avg activation days
  const totalDays = activated.reduce((acc, curr) => acc + (parseFloat(curr.days_lead_to_activation) || 0), 0);
  const avgDays = activatedCount > 0 ? parseFloat((totalDays / activatedCount).toFixed(1)) : 17.6;

  // 6-month churn
  const churned6m = activated.filter(r => r.churned_within_6_months === 'Y').length;
  const churnRate = activatedCount > 0 ? parseFloat(((churned6m / activatedCount) * 100).toFixed(1)) : 15.2;

  res.json({
    overview: {
      total_leads: total,
      leads_growth: '+12%',
      conversions: activatedCount,
      conversions_growth: '+18%',
      activation_rate: actRate,
      activation_rate_delta: '+4.2pp',
      avg_activation_time_days: avgDays,
      avg_activation_time_delta: '-1.8 days',
      churn_rate_6m: churnRate,
      churned_count: churned6m
    },
    conversion_funnel: funnel,
    activations_over_time: [
      { month: 'Aug', activations: 28 },
      { month: 'Sep', activations: 42 },
      { month: 'Oct', activations: 64 },
      { month: 'Nov', activations: 76 },
      { month: 'Dec', activations: 83 },
      { month: 'Jan', activations: 75 }
    ],
    segment_performance: segmentPerf
  });
});

app.get('/api/admin/leads', (req: Request, res: Response) => {
  const { search, category, status } = req.query as { search?: string; category?: string; status?: string };
  let list: Record<string, any>[] = leadsRows.map((l: Record<string, string>) => {
    const derivedStatus = l.outcome === 'Activated' ? 'Converted' : (
      l.stage_reached === 'KYC complete' || l.stage_reached === 'Quote accepted' ? 'In Progress' : (
        l.stage_reached === 'Needs assessed' || l.stage_reached === 'Contacted' ? 'Qualified' : 'New'
      )
    );
    return {
      ...l,
      category: l.segment || l.category || 'Micro retail & services',
      requirements: l.products_of_interest || l.requirements || 'Connectivity',
      status: derivedStatus
    };
  });

  if (search) {
    const s = search.toLowerCase();
    list = list.filter(l =>
      l.business_name?.toLowerCase().includes(s) ||
      l.city?.toLowerCase().includes(s) ||
      l.lead_id?.toLowerCase().includes(s)
    );
  }
  if (category && category.toLowerCase() !== 'all categories' && category.toLowerCase() !== 'all') {
    list = list.filter(l => l.category?.toLowerCase().includes(category.toLowerCase()));
  }
  if (status && status.toLowerCase() !== 'all status' && status.toLowerCase() !== 'all') {
    list = list.filter(l => l.status?.toLowerCase() === status.toLowerCase());
  }
  // Return first 200 for swift UI rendering if no specific search
  res.json(list.slice(0, 200));
});

app.get('/api/admin/orders', (_req: Request, res: Response) => {
  res.json(ordersStore);
});

app.patch('/api/admin/orders/:id/status', (req: Request, res: Response) => {
  const { stage_name, stage_index } = req.body || {};
  const order = ordersStore.find(o => o.id === req.params.id);
  if (order) {
    order.current_stage = stage_name;
    order.stage_index = stage_index;
    if (stage_index === 7) order.status = 'Completed';
    // Update timeline stages
    order.timeline.forEach((t: any) => {
      t.completed = t.index <= stage_index;
    });
    return res.json(order);
  }
  res.status(404).json({ error: 'Order not found' });
});

app.post('/api/admin/handoff', (req: Request, res: Response) => {
  const { business_name, requirements, reason } = req.body || {};
  const newLeadId = `L-${Date.now().toString().slice(-5)}`;
  leadsRows.unshift({
    lead_id: newLeadId,
    business_name: business_name || currentBusinessProfile.business_name,
    category: currentBusinessProfile.business_category,
    city: currentBusinessProfile.city,
    tier: currentBusinessProfile.city_tier,
    employees: currentBusinessProfile.number_of_employees.toString(),
    locations: currentBusinessProfile.number_of_locations.toString(),
    budget: currentBusinessProfile.monthly_budget.toString(),
    requirements: requirements || 'Custom Enterprise Telecom & Cloud Solution',
    recommended_bundle: 'Specialist Enterprise Design',
    source: 'Advisor Handoff',
    status: 'In Progress',
    created_date: new Date().toISOString().split('T')[0],
    conversion_days: '2.0'
  });

  res.json({
    success: true,
    lead_id: newLeadId,
    message: `A dedicated Airtel Business Enterprise Relationship Manager has been assigned for ${business_name || currentBusinessProfile.business_name}.`,
    assigned_rm: 'Vikramaditya Roy (Airtel Business Enterprise Lead)',
    sla_hours: 2
  });
});

// Mount Vite or serve static files
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Udyam360 Full-Stack Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
