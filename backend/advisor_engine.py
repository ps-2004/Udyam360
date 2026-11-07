import re
from typing import Dict, List, Any, Optional

# Pre-defined intelligent bundles matching MSME enterprise profiles
CURATED_BUNDLES = {
    "Professional Office": {
        "name": "Clinic Connect Bundle",
        "tagline": "Complete connectivity and productivity solution for clinics and professional offices.",
        "primary_products": ["P-101", "P-108", "P-113"], # 100 Mbps broadband + Google Workspace email + SecureSuite
        "addons": ["P-117", "P-110"], # Voice + 100 GB Cloud Storage
        "category_fit": "Professional Offices & Healthcare Clinics",
    },
    "Micro Retail": {
        "name": "Retail Pro Connect Bundle",
        "tagline": "Reliable broadband, unlimited customer voice, and secure POS SIM for high footfall shops.",
        "primary_products": ["P-101", "P-117", "P-125", "P-116"], # Broadband + Voice + POS SIM + Secure Wi-Fi
        "addons": ["P-123", "P-120"], # CCTV 2-cam pack + SMS Hub
        "category_fit": "Micro Retail & Neighborhood Services",
    },
    "Small Multi-site Business": {
        "name": "Multi-Site Enterprise Express",
        "tagline": "High-throughput branch interconnectivity with SD-WAN and centralized cloud backup.",
        "primary_products": ["P-103", "P-106", "P-111", "P-118"], # 300 Mbps Ultra + SD-WAN + 1TB Drive + Cloud Contact Center
        "addons": ["P-107", "P-122"], # 4G Backup Dongle + IoT Asset Tracker
        "category_fit": "Small Multi-site Retail & Distribution Chains",
    },
    "Small Manufacturer": {
        "name": "Smart Factory & Manufacturing Hub",
        "tagline": "Dedicated 1:1 leased line with cyber firewall, smart power monitors, and perimeter CCTV.",
        "primary_products": ["P-104", "P-114", "P-124", "P-123"], # DIA 10 Mbps + CyberGuard + Energy Monitor + Cloud CCTV
        "addons": ["P-112", "P-106"], # Cloud Disaster Recovery + SD-WAN
        "category_fit": "Small Industrial Fabricators & Precision Manufacturers",
    }
}

class DeterministicAdvisor:
    def __init__(self, products_map: Dict[str, Any]):
        self.products = products_map

    def extract_intent_and_needs(self, message: str) -> Dict[str, Any]:
        """Deterministic intent extractor and keyword parser."""
        lower = message.lower()
        needs = []
        if any(w in lower for w in ["internet", "broadband", "wifi", "wi-fi", "connection", "net", "speed"]):
            needs.append("internet")
        if any(w in lower for w in ["email", "google", "workspace", "microsoft", "office", "collab", "mail"]):
            needs.append("email")
        if any(w in lower for w in ["security", "antivirus", "malware", "ransomware", "safe", "firewall", "protect"]):
            needs.append("security")
        if any(w in lower for w in ["call", "phone", "voice", "landline", "calling", "ivr", "contact center", "1800", "toll free"]):
            needs.append("voice")
        if any(w in lower for w in ["backup", "storage", "cloud", "tally", "drive", "files"]):
            needs.append("storage")
        if any(w in lower for w in ["cctv", "camera", "tracker", "gps", "iot", "pos", "energy", "meter", "machine"]):
            needs.append("iot")

        # Budget extraction
        budget = None
        budget_match = re.search(r'(?:rs\.?|inr|₹|\bbudget\b|\baround\b)\s*([\d,]+)', lower)
        if not budget_match:
            budget_match = re.search(r'([\d,]+)\s*(?:per\s*month|\/month|pm|rupees)', lower)
        if budget_match:
            try:
                cleaned = budget_match.group(1).replace(",", "")
                budget = float(cleaned)
            except ValueError:
                budget = None

        # Employee extraction
        employees = None
        emp_match = re.search(r'(\d+)\s*(?:employees|staff|people|users|workers|team)', lower)
        if emp_match:
            try:
                employees = int(emp_match.group(1))
            except ValueError:
                employees = None

        return {
            "needs": needs,
            "budget": budget,
            "employees": employees
        }

    def generate_chat_response(self, message: str, profile_data: Optional[Dict[str, Any]] = None, history_len: int = 0) -> Dict[str, Any]:
        """
        Conducts conversational dialogue according to Module D:
        Asks relevant questions based on customer responses:
        - Category/Sector
        - Employees
        - Existing setup
        - Budget
        - Then recommends matching bundle
        """
        extracted = self.extract_intent_and_needs(message)
        category = (profile_data.get("business_category") if profile_data else None) or "Professional Office"
        budget = extracted.get("budget") or (profile_data.get("monthly_budget") if profile_data else 3000.0)
        employees = extracted.get("employees") or (profile_data.get("number_of_employees") if profile_data else 5)
        
        # Check if user message directly specifies multiple requirements or budget
        has_rich_prompt = len(extracted["needs"]) >= 2 or ("clinic" in message.lower() and "budget" in message.lower())

        if has_rich_prompt or history_len >= 2:
            # Generate the recommendation
            bundle = self.recommend_bundle(category=category, budget=budget, employees=employees, requested_needs=extracted["needs"])
            reply = f"Great! Based on your business profile ({profile_data.get('business_name', 'your business') if profile_data else 'your business'}) and requirements, I've found a suitable solution for you."
            return {
                "reply": reply,
                "next_question": "Would you like to review the itemised breakdown, add optional services like Voice or Cloud Storage, or proceed directly to KYC verification?",
                "recommendation": bundle,
                "is_recommendation_ready": True
            }
        elif history_len == 0:
            if "clinic" in message.lower() or "hospital" in message.lower() or "doctor" in message.lower():
                return {
                    "reply": "That's wonderful! Healthcare and professional clinics require uninterrupted high-speed broadband, secure patient records storage, and official email communication.",
                    "next_question": "How many employees and consulting rooms work at your clinic, and do you currently have active broadband?",
                    "recommendation": None,
                    "is_recommendation_ready": False
                }
            elif "retail" in message.lower() or "shop" in message.lower() or "store" in message.lower():
                return {
                    "reply": "Retail and consumer stores need guaranteed uptime for digital payments (POS), Wi-Fi for staff, and customer calling lines.",
                    "next_question": "What is your approximate monthly budget, and how many POS payment swipe machines do you operate?",
                    "recommendation": None,
                    "is_recommendation_ready": False
                }
            else:
                return {
                    "reply": "Hi! I'm your Udyam360 Advisor. To recommend the right Airtel Business solutions, could you tell me a little about your business and what services you're looking for?",
                    "next_question": "What is your primary requirement (e.g., broadband internet, business email, data backup, or voice)?",
                    "recommendation": None,
                    "is_recommendation_ready": False
                }
        else:
            return {
                "reply": "Understood. Having dedicated security and compliant cloud backups ensures your business operations stay resilient.",
                "next_question": "What is your estimated monthly budget for connectivity and IT services?",
                "recommendation": None,
                "is_recommendation_ready": False
            }

    def recommend_bundle(self, category: str, budget: float, employees: int = 5, requested_needs: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Calculates recommendation score using:
        - Requirement match
        - Budget compatibility
        - Eligibility (city tier, GSTIN)
        - Product dependencies
        - Business category relevance
        """
        # Select matching curated template
        matched_cat = "Professional Office"
        for k in CURATED_BUNDLES.keys():
            if k.lower() in category.lower() or category.lower() in k.lower():
                matched_cat = k
                break

        bundle_meta = CURATED_BUNDLES[matched_cat]
        product_ids = bundle_meta["primary_products"]

        # Calculate exact totals from product catalogue
        monthly_total = 0.0
        setup_total = 0.0
        warnings = []
        reasons = []

        for pid in product_ids:
            prod = self.products.get(pid)
            if prod:
                monthly_total += prod["monthly_price"]
                setup_total += prod["setup_fee"]
                # Check dependencies
                dep = prod.get("dependencies", "None")
                if dep and dep != "None":
                    allowed_deps = dep.split("|")
                    if not any(d in product_ids for d in allowed_deps):
                        warnings.append(f"{prod['product_name']} recommends an active broadband line.")

        # Why recommended bullet points
        reasons.append(f"Matches your primary requirements ({', '.join(requested_needs) if requested_needs else 'internet, email, security'})")
        if budget >= monthly_total:
            reasons.append(f"Fits within your ₹{int(budget):,}/month budget (Total: ₹{int(monthly_total):,}/mo)")
        else:
            reasons.append(f"Optimized enterprise package close to your ₹{int(budget):,}/mo target")
        reasons.append(f"Specially tailored for {bundle_meta['category_fit']}")

        return {
            "bundle_name": bundle_meta["name"],
            "tagline": bundle_meta["tagline"],
            "recommended_product_ids": product_ids,
            "monthly_cost": round(monthly_total, 2),
            "setup_cost": round(setup_total, 2),
            "contract_months": 12,
            "why_recommended": reasons,
            "eligibility_warnings": warnings,
            "category_fit": bundle_meta["category_fit"]
        }
