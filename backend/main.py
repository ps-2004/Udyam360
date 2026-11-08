import os
import csv
import json
import datetime
from typing import List, Optional

import pandas as pd
from fastapi import (
    FastAPI, Depends, HTTPException, Query, status,
    UploadFile, File, Form
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from llm_advisor import extract_business_requirements
from database import engine, Base, SessionLocal, get_db
import models
import schemas
from advisor_engine import DeterministicAdvisor
from ocr_service import LocalKycVerificationService
from gstin_service import LocalGSTINService
from udyam_service import LocalUdyamService
from analyze_leads import run_lead_analysis


# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Udyam360 REST API - Airtel Business",
    description=(
        "Enterprise API powering MSME acquisition, product discovery, "
        "smart KYC, and order activation tracking for Indian MSMEs."
    ),
    version="1.0.0"
)

# CORS configuration
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


# ============================================================
# DATASET PATHS
# ============================================================

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

CATALOGUE_PATH = os.path.join(
    base_dir, "data", "product_catalogue.csv"
)

if not os.path.exists(CATALOGUE_PATH):
    CATALOGUE_PATH = "/data/product_catalogue.csv"

LEADS_PATH = os.path.join(
    base_dir, "data", "smb_leads.csv"
)

if not os.path.exists(LEADS_PATH):
    LEADS_PATH = "/data/smb_leads.csv"


# ============================================================
# HISTORICAL LEADS LOADING
# ============================================================

def ensure_historical_leads_loaded():
    if os.path.exists(LEADS_PATH):
        db = SessionLocal()

        try:
            count = db.query(models.HistoricalLead).count()

            if count < 5000:
                df = pd.read_csv(LEADS_PATH)

                df.to_sql(
                    "historical_leads",
                    con=engine,
                    if_exists="replace",
                    index=False
                )

                print(
                    f"[Database] Loaded {len(df)} historical leads "
                    "into SQLite table 'historical_leads'."
                )

        except Exception as e:
            print(
                f"[Database Error] Populating historical leads: {e}"
            )

        finally:
            db.close()


ensure_historical_leads_loaded()


# ============================================================
# PRODUCT CATALOGUE LOADING
# ============================================================

PRODUCTS_MAP = {}

if not os.path.exists(CATALOGUE_PATH):
    raise FileNotFoundError(
        f"Product catalogue not found at {CATALOGUE_PATH}. "
        "Place product_catalogue.csv in the project-root data/ folder."
    )

with open(
    CATALOGUE_PATH,
    mode="r",
    encoding="utf-8-sig",
    newline=""
) as f:

    reader = csv.DictReader(f)

    required_columns = {
        "product_id",
        "category",
        "product_name",
        "description",
        "unit",
        "price_min_inr_per_month",
        "price_max_inr_per_month",
        "one_time_setup_inr",
        "min_contract_months",
        "available_city_tiers",
        "min_employees",
        "min_sites",
        "requires_gstin",
        "requires_one_of",
        "target_segments"
    }

    missing_columns = required_columns.difference(
        reader.fieldnames or []
    )

    if missing_columns:
        raise ValueError(
            "Product catalogue is missing required columns: "
            + ", ".join(sorted(missing_columns))
        )

    for row in reader:

        product_id = row["product_id"].strip()

        if not product_id:
            continue

        price_min = float(
            row["price_min_inr_per_month"] or 0
        )

        price_max = float(
            row["price_max_inr_per_month"] or price_min
        )

        PRODUCTS_MAP[product_id] = {
            "id": product_id,
            "product_name": row["product_name"].strip(),
            "category": row["category"].strip(),
            "description": row["description"].strip(),

            # Existing UI displays a single price.
            # Use catalogue minimum and expose the range separately.
            "monthly_price": price_min,
            "monthly_price_max": price_max,

            "price_unit": row["unit"].strip(),

            "setup_fee": float(
                row["one_time_setup_inr"] or 0
            ),

            "contract_months": int(
                row["min_contract_months"] or 1
            ),

            "city_tiers": row["available_city_tiers"].strip(),

            "gstin_required": (
                row["requires_gstin"].strip().upper() == "Y"
            ),

            "udyam_required": False,

            "dependencies": row["requires_one_of"].strip(),

            "features": row["description"].strip(),

            "min_employees": int(
                row["min_employees"] or 1
            ),

            "min_sites": int(
                row["min_sites"] or 1
            ),

            "target_segments": row["target_segments"].strip(),

            "typical_install_days": int(
                row["typical_install_days"] or 0
            ),
        }


if not PRODUCTS_MAP:
    raise ValueError(
        "Product catalogue loaded, but it contains no products."
    )

print(
    f"[Catalogue] Loaded {len(PRODUCTS_MAP)} products "
    f"from {CATALOGUE_PATH}"
)


# ============================================================
# SERVICE INITIALIZATION
# ============================================================

advisor = DeterministicAdvisor(PRODUCTS_MAP)

kyc_service = LocalKycVerificationService()
gstin_service = LocalGSTINService()
udyam_service = LocalUdyamService()


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Udyam360 Backend",
        "products_loaded": len(PRODUCTS_MAP),
        "timestamp": datetime.datetime.utcnow().isoformat()
    }


# ============================================================
# AUTHENTICATION
# ============================================================

@app.post("/api/auth/login")
def login(payload: dict):

    # Local mock authentication
    username = payload.get(
        "username",
        "demo@airtelbusiness.in"
    )

    role = (
        "admin"
        if "admin" in username.lower()
        else "customer"
    )

    return {
        "token": "mock-jwt-token-udyam360-airtel",
        "user": {
            "id": 1,
            "email": username,
            "name": (
                "Dr. Ramesh Gupta (City Care Clinic)"
                if role == "customer"
                else "Airtel Enterprise Operations Admin"
            ),
            "role": role
        }
    }


@app.post("/api/auth/logout")
def logout():
    return {
        "message": "Logged out successfully"
    }


# ============================================================
# BUSINESS PROFILE
# ============================================================

@app.post(
    "/api/business/profile",
    response_model=schemas.BusinessProfileResponse
)
def create_or_update_profile(
    profile_in: schemas.BusinessProfileCreate,
    db: Session = Depends(get_db)
):

    db_profile = db.query(
        models.BusinessProfile
    ).first()

    if not db_profile:

        db_profile = models.BusinessProfile(
            **profile_in.dict(),
            user_id=1
        )

        db.add(db_profile)

    else:

        for key, value in profile_in.dict().items():
            setattr(db_profile, key, value)

    db.commit()
    db.refresh(db_profile)

    return db_profile


@app.get(
    "/api/business/profile",
    response_model=schemas.BusinessProfileResponse
)
def get_business_profile(
    db: Session = Depends(get_db)
):

    profile = db.query(
        models.BusinessProfile
    ).first()

    if not profile:

        profile = models.BusinessProfile(
            user_id=1,
            business_name="City Care Clinic",
            business_category="Professional Office",
            business_type="Service Business",
            city="Bengaluru",
            city_tier="Tier 1",
            number_of_employees=5,
            number_of_locations=1,
            monthly_budget=3000.0,
            gstin_available=True,
            gstin_number="29AABCU9603R1ZM",
            udyam_registered=True,
            udyam_number="UDYAM-KR-03-0012345",
            required_products="Internet, Email, Security"
        )

        db.add(profile)
        db.commit()
        db.refresh(profile)

    return profile


# ============================================================
# PRODUCT CATALOGUE API
# ============================================================

@app.get(
    "/api/products",
    response_model=List[schemas.ProductResponse]
)
def get_products(
    category: Optional[str] = None,
    search: Optional[str] = None
):

    prods = list(PRODUCTS_MAP.values())

    if category and category.lower() not in {
        "all products", "all"
    }:

        prods = [
            p for p in prods
            if category.lower() in p["category"].lower()
        ]

    if search:

        s = search.lower()

        prods = [
            p for p in prods
            if (
                s in p["product_name"].lower()
                or s in p["description"].lower()
                or s in p["category"].lower()
            )
        ]

    return prods


@app.get("/api/products/{id}", response_model=schemas.ProductResponse)
def get_product_by_id(id: str):

    if id not in PRODUCTS_MAP:
        raise HTTPException(
            status_code=404,
            detail="Product not found in catalogue"
        )

    return PRODUCTS_MAP[id]


# ============================================================
# ADVISOR HELPERS
# ============================================================

def infer_business_category(message: str):
    """Infer a clearly stated business segment from the latest user message."""
    text = (message or "").lower()

    if any(term in text for term in (
        "retail", "shop", "store", "dukaan", "dukan", "kirana"
    )):
        return "Micro Retail"

    if any(term in text for term in (
        "manufacturer", "manufacturing", "factory", "production unit"
    )):
        return "Small Manufacturer"

    if any(term in text for term in (
        "multi-site", "multisite", "multiple branches", "multiple locations"
    )):
        return "Small Multi-site Business"

    if any(term in text for term in (
        "clinic", "hospital", "doctor", "healthcare", "professional office", "office"
    )):
        return "Professional Office"

    return None


def infer_explicit_needs(message: str):
    """Deterministic safety net for needs that must not be conflated."""
    text = (message or "").lower()
    needs = []

    if any(term in text for term in (
        "cctv", "camera", "surveillance", "video monitoring", "कैमरा"
    )):
        needs.append("cctv")

    return needs


def format_inr(value):
    """Format a numeric value as Indian Rupees."""
    return f"₹{float(value):,.0f}"


def business_display_label(business_name, category, language="English"):
    """Avoid exposing internal fallback strings such as 'your business'."""
    name = (business_name or "").strip()
    if name and name.lower() not in {"your business", "business", "unknown"}:
        return name

    category_key = (category or "").strip().lower()
    labels = {
        "micro retail": {"hinglish": "aapki retail shop", "hindi": "आपकी रिटेल दुकान", "english": "your retail shop"},
        "professional office": {"hinglish": "aapke office/clinic", "hindi": "आपके ऑफिस/क्लिनिक", "english": "your office or clinic"},
        "small multi-site business": {"hinglish": "aapke multi-location business", "hindi": "आपके कई स्थानों वाले व्यवसाय", "english": "your multi-site business"},
        "small manufacturer": {"hinglish": "aapki manufacturing unit", "hindi": "आपकी मैन्युफैक्चरिंग यूनिट", "english": "your manufacturing unit"},
    }
    lang = (language or "english").strip().lower()
    return labels.get(category_key, {}).get(lang, labels.get(category_key, {}).get("english", "your business"))


def build_advisor_reply(
    language,
    recommendation,
    budget,
    business_name
):
    """
    Build a factual explanation from verified catalogue data.
    No second LLM call is made.
    """

    language = (
        language or "English"
    ).strip().lower()

    bundle_name = recommendation["bundle_name"]
    monthly_cost = recommendation["monthly_cost"]
    setup_cost = recommendation["setup_cost"]
    contract_months = recommendation["contract_months"]

    products = recommendation.get("products", [])

    product_lines = []

    for product in products:

        quantity_text = (
            f" × {product.get('quantity', 1)}"
            if product.get("quantity", 1) > 1
            else ""
        )

        range_text = ""

        if (
            product.get("unit_price_min") is not None
            and product.get("unit_price_max") is not None
        ):

            if (
                product["unit_price_min"]
                != product["unit_price_max"]
            ):

                range_text = (
                    f" (catalogue unit range: "
                    f"{format_inr(product['unit_price_min'])}–"
                    f"{format_inr(product['unit_price_max'])})"
                )

        if product.get("contract_months") is not None:
            term_months = int(product["contract_months"])
            month_word = "month" if term_months == 1 else "months"
            contract_text = (
                f"; minimum contract: {term_months} {month_word}"
            )
        else:
            contract_text = ""

        product_lines.append(
            f"- **{product['name']}**{quantity_text} — "
            f"{format_inr(product['price'])}/month line estimate"
            f"{range_text}; "
            f"setup: {format_inr(product['setup'])}"
            f"{contract_text}."
        )

    product_breakdown = "\n".join(product_lines)

    if not products:
        if language == "hinglish":
            return (
                f"Aapke {business_name} ke liye abhi diye gaye budget mein koi eligible product combination available nahi hai.\n\n"
                f"Requested needs: {', '.join(recommendation.get('unmet_needs', []))}. "
                "Budget ya eligibility details revise karein; ₹0 ko valid recommendation na samjhein."
            )
        return (
            f"No eligible product combination is currently available for {business_name} "
            f"within the stated monthly budget of {format_inr(budget)}. "
            f"Uncovered needs: {', '.join(recommendation.get('unmet_needs', []))}. "
            "Please revise the budget or eligibility details. No recommendation has been made."
        )

    if language == "hindi":

        return (
            f"**{bundle_name}** आपके व्यवसाय "
            f"**{business_name}** के लिए सुझाया गया है।\n\n"
            f"इसमें शामिल उत्पाद:\n{product_breakdown}\n\n"
            f"**कुल मासिक लागत:** {format_inr(monthly_cost)}\n"
            f"**सेटअप लागत:** {format_inr(setup_cost)}\n"
            f"**उत्पाद-वार न्यूनतम अनुबंध अवधि ऊपर दी गई है।** "
            f"सबसे लंबी अवधि: {contract_months} महीने\n\n"
            + (
                f"यह अनुमान आपके {format_inr(budget)} "
                "मासिक बजट के भीतर है।"
                if recommendation.get("budget_fit", False)
                else f"यह अनुमान आपके {format_inr(budget)} "
                     "मासिक बजट से अधिक है।"
            )
        )

    if language == "hinglish":

        return (
            f"**{bundle_name}** aapke business "
            f"**{business_name}** ke liye recommend kiya gaya hai.\n\n"
            f"**Included products:**\n{product_breakdown}\n\n"
            f"**Total monthly cost:** {format_inr(monthly_cost)}\n"
            f"**Setup cost:** {format_inr(setup_cost)}\n"
            f"**Product-wise minimum contract terms are listed above.** "
            f"Longest term: {contract_months} months\n\n"
            + (
                f"Yeh estimate aapke {format_inr(budget)} "
                "monthly budget ke andar hai."
                if recommendation.get("budget_fit", False)
                else f"Yeh estimate aapke {format_inr(budget)} "
                     "monthly budget se zyada hai."
            )
        )

    return (
        f"**{bundle_name}** is recommended for "
        f"**{business_name}**.\n\n"
        f"**Included products:**\n{product_breakdown}\n\n"
        f"**Total monthly cost:** {format_inr(monthly_cost)}\n"
        f"**Setup cost:** {format_inr(setup_cost)}\n"
        f"**Product-wise minimum contract terms are listed above.** "
        f"Longest term: {contract_months} months\n\n"
        + (
            f"This estimate is within your monthly budget "
            f"of {format_inr(budget)}."
            if recommendation.get("budget_fit", False)
            else f"This estimate exceeds your monthly budget "
                 f"of {format_inr(budget)}."
        )
    )


def build_missing_info_reply(language, missing_fields):
    """Ask for missing profile information."""

    field = missing_fields[0] if missing_fields else None

    questions = {

        "hindi": {
            "business_category": (
                "आपका व्यवसाय किस प्रकार का है—"
                "क्लिनिक, दुकान, ऑफिस या मैन्युफैक्चरिंग?"
            ),
            "employees": (
                "आपके व्यवसाय में कितने कर्मचारी काम करते हैं?"
            ),
            "monthly_budget": (
                "आपका अनुमानित मासिक बजट कितना है (₹ में)?"
            )
        },

        "hinglish": {
            "business_category": (
                "Aapka business kis type ka hai—"
                "clinic, shop, office ya manufacturing?"
            ),
            "employees": (
                "Aapke business mein kitne employees kaam karte hain?"
            ),
            "monthly_budget": (
                "Aapka approximate monthly budget kitna hai (₹ mein)?"
            )
        },

        "english": {
            "business_category": (
                "What type of business do you operate—"
                "clinic, shop, office, or manufacturing?"
            ),
            "employees": (
                "How many employees work in your business?"
            ),
            "monthly_budget": (
                "What is your approximate monthly budget in INR?"
            )
        }
    }

    lang_key = (
        language or "English"
    ).strip().lower()

    if lang_key not in questions:
        lang_key = "english"

    return questions[lang_key].get(
        field,
        "Please share a little more information about your business."
    )


# ============================================================
# ADVISOR CHAT API
# ============================================================

@app.post(
    "/api/advisor/chat",
    response_model=schemas.AdvisorChatResponse
)
async def advisor_chat(
    chat_in: schemas.AdvisorChatRequest,
    db: Session = Depends(get_db)
):

    profile = (
        chat_in.profile.dict()
        if chat_in.profile
        else None
    )

    # Never load the first profile in the database for a new chat. That
    # caused unrelated sessions to inherit stale names, employee counts,
    # categories and budgets. Context is accepted only when supplied by this
    # request; chat session persistence can be added with an explicit
    # session_id-to-profile mapping later.
    profile = profile or {}
    language = "Hinglish" if any(
        term in (chat_in.message or "").lower()
        for term in ("meri", "mera", "mujhe", "chahiye", "dukaan", "hai", "ke liye", "karna")
    ) else "English"

    # Capture the saved business context before the latest message updates it.
    # Otherwise a newly inferred category can overwrite the old category and
    # make a stale business name appear valid.
    saved_business_category = profile.get("business_category")
    language = "English"

    # OpenRouter is an enhancement, never a dependency for recommendation.
    # If the free model is rate-limited, returns empty content, or errors,
    # continue with deterministic extraction from the user's message.
    extracted = {}
    try:
        extracted = await extract_business_requirements(
            chat_in.message, profile
        ) or {}
        if extracted.get("language"):
            language = extracted["language"]
    except Exception as llm_exc:
        print(f"[Advisor LLM fallback] {type(llm_exc).__name__}: {llm_exc}")

    try:

        # Explicit segment words in the latest message take precedence over
        # a stale demo profile (for example, a retail shop vs City Care Clinic).
        message_category = infer_business_category(chat_in.message)

        category = (
            message_category
            or extracted.get("business_category")
            or profile.get("business_category")
        )

        business_context_changed = bool(
            message_category
            and saved_business_category
            and advisor._segment_code(message_category)
                != advisor._segment_code(saved_business_category)
        )

        employees = (
            extracted.get("employees")
            or profile.get("number_of_employees")
        )

        budget = (
            extracted.get("monthly_budget")
            or profile.get("monthly_budget")
        )

        deterministic_extract = advisor.extract_intent_and_needs(
            chat_in.message
        )

        if deterministic_extract.get("employees") is not None:
            employees = deterministic_extract["employees"]

        if deterministic_extract.get("budget") is not None:
            budget = deterministic_extract["budget"]

        allowed_needs = {
            "internet",
            "email",
            "security",
            "voice",
            "storage",
            "iot",
            "cctv"
        }

        raw_needs = extracted.get("needs", [])

        if not isinstance(raw_needs, list):
            raw_needs = []

        requested_needs = [
            need.strip().lower()
            for need in raw_needs
            if (
                isinstance(need, str)
                and need.strip().lower() in allowed_needs
            )
        ]

        # Keep surveillance distinct from endpoint security and generic IoT,
        # even if the LLM groups "camera" under IoT.
        # Merge deterministic keyword matches with the LLM output. The LLM
        # can miss a plainly stated need; it must not be the only source of truth.
        deterministic_needs = deterministic_extract.get("needs", [])
        requested_needs.extend(
            need for need in deterministic_needs
            if need in allowed_needs
        )
        explicit_needs = infer_explicit_needs(chat_in.message)
        requested_needs.extend(explicit_needs)
        requested_needs = list(dict.fromkeys(requested_needs))

        message_lower = (chat_in.message or "").lower()
        if "cctv" in explicit_needs:
            # "CCTV security" means physical video surveillance. Do not
            # silently turn it into endpoint cybersecurity or generic IoT.
            cyber_terms = (
                "cybersecurity", "cyber security", "antivirus",
                "endpoint", "firewall", "malware", "ransomware"
            )
            other_iot_terms = (
                "tracker", "gps", "pos", "sensor", "iot",
                "asset tracking", "energy monitor"
            )
            if not any(term in message_lower for term in cyber_terms):
                requested_needs = [
                    need for need in requested_needs
                    if need != "security"
                ]
            if not any(term in message_lower for term in other_iot_terms):
                requested_needs = [
                    need for need in requested_needs
                    if need != "iot"
                ]

        # Validate employee count.
        if employees is not None:

            try:
                employees = int(employees)

            except (TypeError, ValueError):
                employees = None

            if (
                employees is not None
                and (employees < 1 or employees > 100000)
            ):
                employees = None

        # Validate monthly budget.
        if budget is not None:

            try:
                budget = float(budget)

            except (TypeError, ValueError):
                budget = None

            if (
                budget is not None
                and (budget <= 0 or budget > 100000000)
            ):
                budget = None

        if category:
            profile["business_category"] = category

        if employees is not None:
            profile["number_of_employees"] = employees

        if budget is not None:
            profile["monthly_budget"] = budget

        # Check required information.
        missing_fields = []

        if not category:
            missing_fields.append("business_category")

        if not employees:
            missing_fields.append("employees")

        if not budget:
            missing_fields.append("monthly_budget")

        if missing_fields:

            return {
                "session_id": chat_in.session_id,
                "reply": build_missing_info_reply(
                    language,
                    missing_fields
                ),
                "next_question": None,
                "recommendation": None,
                "is_recommendation_ready": False
            }

        # Do not invent a default bundle when the user has not stated a product need.
        if not requested_needs:
            no_need_reply = {
                "hinglish": "Aapke business ke liye sahi products suggest karne ke liye batayein: internet, employee mobile lines, CCTV, business calling, billing/POS, ya cloud backup mein se kya chahiye?",
                "hindi": "आपके व्यवसाय के लिए सही उत्पाद सुझाने हेतु बताएं: इंटरनेट, कर्मचारियों के मोबाइल कनेक्शन, CCTV, बिज़नेस कॉलिंग, बिलिंग/POS या क्लाउड बैकअप में से क्या चाहिए?",
                "english": "Which services do you need: business internet, employee mobile lines, CCTV, business calling, billing/POS, or cloud backup?"
            }.get((language or "english").strip().lower(), "Which business services do you need?")
            return {
                "session_id": chat_in.session_id,
                "reply": no_need_reply,
                "next_question": no_need_reply,
                "recommendation": None,
                "is_recommendation_ready": False
            }


        # Do not carry a saved business name into a different business
        # described in the current message (e.g. clinic -> retail shop).
        if business_context_changed:
            profile["business_name"] = "your business"
        elif not profile.get("business_name"):
            profile["business_name"] = "your business"

        # Generate recommendation from the real catalogue.
        raw_rec = advisor.recommend_bundle(
            category=category,
            budget=budget,
            employees=employees,
            requested_needs=requested_needs,
            city_tier=profile.get("city_tier"),
            gstin_available=bool(
                profile.get("gstin_available", False)
            ),
            sites=int(
                profile.get("number_of_locations") or 1
            )
        )

        # Build product details from catalogue records.
        recommended_products = []
        tags = []

        product_costs = raw_rec.get(
            "product_costs",
            {}
        )

        for product_id in raw_rec.get(
            "recommended_product_ids",
            []
        ):

            product = PRODUCTS_MAP.get(product_id)

            if not product:
                continue

            cost = product_costs.get(
                product_id,
                {}
            )

            recommended_products.append({
                "id": product_id,
                "name": product["product_name"],

                "price": cost.get(
                    "monthly_cost",
                    product["monthly_price"]
                ),

                "setup": cost.get(
                    "setup_cost",
                    product["setup_fee"]
                ),

                "quantity": cost.get(
                    "quantity",
                    1
                ),

                "unit": product["price_unit"],

                "unit_price_min": product["monthly_price"],

                "unit_price_max": product["monthly_price_max"],

                "contract_months": product["contract_months"],

                "typical_install_days": product[
                    "typical_install_days"
                ]
            })

            if product["category"] not in tags:
                tags.append(product["category"])

        recommendation = {
            "bundle_name": raw_rec["bundle_name"],
            "tagline": raw_rec["tagline"],

            "recommended_for": business_display_label(
                profile.get("business_name"), category, language
            ),

            "monthly_cost": raw_rec["monthly_cost"],
            "setup_cost": raw_rec["setup_cost"],
            # Kept for existing frontend compatibility. This is the longest
            # minimum term, not a claim that every selected product has this term.
            "contract_months": raw_rec["contract_months"],
            "contract_duration_note": (
                "Product-wise minimum contract terms are provided per item; "
                "this field is the longest selected product term."
            ),

            "tags": tags,
            "products": recommended_products,

            "why_recommended": raw_rec["why_recommended"],

            "eligibility_warnings": raw_rec.get(
                "eligibility_warnings",
                []
            ),

            "unmet_needs": raw_rec.get(
                "unmet_needs",
                []
            ),

            "budget_fit": raw_rec.get(
                "budget_fit",
                False
            ),

            "budget": raw_rec.get(
                "budget",
                budget
            )
        }

        # Build explanation locally from catalogue data.
        business_name = business_display_label(
            profile.get("business_name"), category, language
        )

        reply = build_advisor_reply(
            language=language,
            recommendation=recommendation,
            budget=budget,
            business_name=business_name
        )

        if employees > 1 and "voice" not in requested_needs:
            employee_note = {
                "hinglish": f"Note: {employees} employees ka count eligibility ke liye use hua hai. Individual employee mobile lines is estimate mein include nahi hain, kyunki aapne unhe explicitly request nahi kiya.",
                "hindi": f"ध्यान दें: {employees} कर्मचारियों की संख्या eligibility के लिए उपयोग की गई है। अलग-अलग मोबाइल कनेक्शन इस अनुमान में शामिल नहीं हैं, क्योंकि आपने उन्हें स्पष्ट रूप से नहीं मांगा।",
                "english": f"Note: The {employees}-employee count was used for eligibility. Individual employee mobile lines are not included because they were not explicitly requested."
            }.get((language or "english").strip().lower())
            if employee_note:
                reply += "\n\n" + employee_note

        if recommendation.get("unmet_needs"):

            reply += (
                "\n\nNot yet covered: "
                + ", ".join(recommendation["unmet_needs"])
            )

        if recommendation.get("eligibility_warnings"):

            reply += (
                "\n\nNotes: "
                + " ".join(
                    recommendation["eligibility_warnings"]
                )
            )

        language_key = (
            language or "English"
        ).strip().lower()

        if language_key == "hindi":

            next_question = (
                "क्या आप KYC verification आगे बढ़ाना चाहेंगे?"
            )

        elif language_key == "hinglish":

            next_question = (
                "Kya aap KYC verification aage badhana chahenge?"
            )

        else:

            next_question = (
                "Would you like to proceed to KYC verification?"
            )

        return {
            "session_id": chat_in.session_id,
            "reply": reply,
            "next_question": next_question,
            "recommendation": recommendation,
            "is_recommendation_ready": bool(
                recommended_products
            )
        }

    except Exception as exc:

        print(
            f"[Advisor AI error] {type(exc).__name__}: {exc}"
        )

        # Deterministic fallback if the free model fails.
        result = advisor.generate_chat_response(
            message=chat_in.message,
            profile_data=profile,
            history_len=0
        )

        return {
            "session_id": chat_in.session_id,
            "reply": result["reply"],
            "next_question": result.get("next_question"),
            "recommendation": None,
            "is_recommendation_ready": False
        }


# ============================================================
# DIRECT ADVISOR RECOMMENDATION API
# ============================================================

@app.post("/api/advisor/recommend")
def get_recommendation(payload: dict):

    category = payload.get(
        "business_category",
        "Professional Office"
    )

    budget = float(
        payload.get("monthly_budget", 3000.0)
    )

    employees = int(
        payload.get("number_of_employees", 5)
    )

    rec = advisor.recommend_bundle(
        category=category,
        budget=budget,
        employees=employees,
        requested_needs=(
            payload.get("needs")
            or payload.get("requested_needs")
        ),
        city_tier=payload.get("city_tier"),
        gstin_available=bool(
            payload.get("gstin_available", False)
        ),
        sites=int(
            payload.get(
                "number_of_locations",
                payload.get("sites", 1)
            ) or 1
        )
    )

    return rec


# ============================================================
# QUOTES
# ============================================================

@app.post(
    "/api/quotes",
    response_model=schemas.QuoteResponse
)
def create_quote(
    quote_in: schemas.QuoteCreateRequest,
    db: Session = Depends(get_db)
):

    quote_id = (
        f"QT-2026-{10000 + len(db.query(models.Quote).all()) + 1}"
    )

    monthly_sum = 0.0
    setup_sum = 0.0

    items_data = []

    profile = db.query(
        models.BusinessProfile
    ).first()

    employee_count = max(
        1,
        int(
            profile.number_of_employees
            if profile else 1
        )
    )

    site_count = max(
        1,
        int(
            profile.number_of_locations
            if profile else 1
        )
    )

    quote_contract_months = 1

    for pid in quote_in.selected_product_ids:

        prod = PRODUCTS_MAP.get(pid)

        if prod:

            unit = str(
                prod.get("price_unit", "")
            ).lower()

            if (
                "per user" in unit
                or "per device" in unit
                or "per line" in unit
            ):

                quantity = employee_count

            elif "per site" in unit:

                quantity = site_count

            else:

                quantity = 1

            line_monthly = (
                prod["monthly_price"] * quantity
            )

            line_setup = (
                prod["setup_fee"] * quantity
            )

            monthly_sum += line_monthly
            setup_sum += line_setup

            quote_contract_months = max(
                quote_contract_months,
                prod["contract_months"]
            )

            items_data.append({
                "product_id": pid,
                "product_name": prod["product_name"],
                "quantity": quantity,
                "unit": prod["price_unit"],
                "unit_price_min": prod["monthly_price"],
                "unit_price_max": prod["monthly_price_max"],
                "monthly_price": line_monthly,
                "setup_fee": line_setup,
                "category": prod["category"]
            })

    quote_obj = models.Quote(
        id=quote_id,
        user_id=1,
        business_profile_id=quote_in.business_profile_id,
        bundle_name=quote_in.bundle_name,
        monthly_recurring_charges=monthly_sum,
        one_time_setup_fees=setup_sum,
        contract_duration_months=quote_contract_months,
        status="Generated"
    )

    db.add(quote_obj)
    db.commit()

    return {
        "id": quote_id,
        "business_name": quote_in.business_name,
        "bundle_name": quote_in.bundle_name,
        "monthly_recurring_charges": monthly_sum,
        "one_time_setup_fees": setup_sum,
        "contract_duration_months": quote_contract_months,
        "status": "Generated",
        "items": items_data,
        "created_at": datetime.datetime.utcnow()
    }


@app.get("/api/quotes/{id}")
def get_quote(
    id: str,
    db: Session = Depends(get_db)
):

    quote = db.query(
        models.Quote
    ).filter(
        models.Quote.id == id
    ).first()

    if not quote:

        # Catalogue-grounded demo quote.
        demo_items = []
        demo_monthly = 0.0
        demo_setup = 0.0

        demo_profile = db.query(
            models.BusinessProfile
        ).first()

        demo_employees = max(
            1,
            int(
                demo_profile.number_of_employees
                if demo_profile else 1
            )
        )

        for product_id in ["P01", "P16", "P20"]:

            product = PRODUCTS_MAP.get(product_id)

            if not product:
                continue

            unit = str(
                product.get("price_unit", "")
            ).lower()

            quantity = (
                demo_employees
                if (
                    "per user" in unit
                    or "per device" in unit
                    or "per line" in unit
                )
                else 1
            )

            line_monthly = (
                product["monthly_price"] * quantity
            )

            line_setup = (
                product["setup_fee"] * quantity
            )

            demo_monthly += line_monthly
            demo_setup += line_setup

            demo_items.append({
                "product_id": product_id,
                "product_name": product["product_name"],
                "quantity": quantity,
                "monthly_price": line_monthly,
                "setup_fee": line_setup
            })

        return {
            "id": id,

            "business_name": (
                demo_profile.business_name
                if demo_profile
                else "Demo Business"
            ),

            "bundle_name": "Udyam360 Starter Solution",

            "monthly_recurring_charges": demo_monthly,

            "one_time_setup_fees": demo_setup,

            "contract_duration_months": max(
                (
                    PRODUCTS_MAP[x]["contract_months"]
                    for x in ["P01", "P16", "P20"]
                    if x in PRODUCTS_MAP
                ),
                default=1
            ),

            "status": "Generated",
            "items": demo_items,
            "created_at": datetime.datetime.utcnow().isoformat()
        }

    return quote


# ============================================================
# KYC DOCUMENT UPLOAD
# ============================================================

@app.post("/api/kyc/upload")
async def upload_kyc_document(
    document_type: str = Form(...),
    business_name: str = Form(""),
    file: UploadFile = File(...)
):

    """
    Store a KYC document privately and run local OCR when available.

    Registry matching is deliberately separate:
    OCR extraction does not prove authenticity.
    An OCR miss is sent to manual review, never auto-approved.
    """

    allowed_types = {
        "gst",
        "udyam",
        "address",
        "signatory"
    }

    if document_type not in allowed_types:

        raise HTTPException(
            status_code=400,
            detail="Unsupported document_type"
        )

    suffix = os.path.splitext(
        file.filename or ""
    )[1].lower()

    if suffix not in {
        ".png", ".jpg", ".jpeg",
        ".tif", ".tiff", ".pdf"
    }:

        raise HTTPException(
            status_code=400,
            detail="Only PDF and image documents are supported"
        )

    content = await file.read()

    max_bytes = 10 * 1024 * 1024

    if not content:

        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty"
        )

    if len(content) > max_bytes:

        raise HTTPException(
            status_code=413,
            detail="File exceeds 10 MB limit"
        )

    upload_dir = os.getenv(
        "UPLOAD_DIR",
        os.path.join(base_dir, "uploads", "kyc")
    )

    os.makedirs(
        upload_dir,
        exist_ok=True
    )

    import uuid

    safe_name = f"{uuid.uuid4().hex}{suffix}"

    stored_path = os.path.join(
        upload_dir,
        safe_name
    )

    with open(stored_path, "wb") as destination:
        destination.write(content)

    try:

        extraction = kyc_service.extract_from_file(
            stored_path,
            file.filename or safe_name
        )

    except Exception as exc:

        extraction = {
            "gstin": None,
            "udyam": None,
            "confidence": 0.0,
            "extracted_text": "",
            "ocr_status": "manual_review",
            "message": (
                f"OCR could not process this document: "
                f"{type(exc).__name__}"
            )
        }

    extracted_gstin = extraction.get("gstin")
    extracted_udyam = extraction.get("udyam")

    gst_result = (
        gstin_service.verify(
            extracted_gstin,
            business_name=business_name
        )
        if extracted_gstin
        else None
    )

    udyam_result = (
        udyam_service.verify(
            extracted_udyam,
            enterprise_name=business_name
        )
        if extracted_udyam
        else None
    )

    has_identifier = bool(
        extracted_gstin or extracted_udyam
    )

    return {
        "filename": file.filename,
        "document_type": document_type,
        "stored": True,
        "ocr_status": extraction.get(
            "ocr_status",
            "manual_review"
        ),
        "confidence": extraction.get(
            "confidence",
            0.0
        ),
        "extracted_text": extraction.get(
            "extracted_text",
            ""
        ),
        "extracted_gstin": extracted_gstin,
        "extracted_udyam": extracted_udyam,
        "gstin_registry_result": gst_result,
        "udyam_registry_result": udyam_result,

        "verification_status": (
            "registry_match_review_required"
            if has_identifier
            else "manual_review_required"
        ),

        "message": (
            "OCR extraction and registry matching are preliminary "
            "checks; document authenticity requires review."
        )
    }


# ============================================================
# KYC CONSENT
# ============================================================

@app.post("/api/kyc/consent")
def record_consent(
    req: schemas.ConsentCreateRequest,
    db: Session = Depends(get_db)
):

    record = models.ConsentRecord(
        user_id=1,
        consent_version=req.consent_version,
        purpose=(
            "MSME Telecom & Cloud KYC Verification "
            "under DoT & DPDP Act 2023 Guidelines"
        ),
        retention_period_days=180
    )

    db.add(record)
    db.commit()

    return {
        "success": True,
        "consent_id": record.id,
        "timestamp": record.granted_at.isoformat(),
        "message": "Consent recorded under DPDP Act 2023 principles."
    }


# ============================================================
# GSTIN VERIFICATION
# ============================================================

@app.post(
    "/api/kyc/gstin/verify",
    response_model=schemas.GSTINVerifyResponse
)
def verify_gstin(
    req: schemas.GSTINVerifyRequest
):

    if not req.gstin or not req.gstin.strip():

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GSTIN number is required for verification."
        )

    result = gstin_service.verify(
        gstin=req.gstin,
        business_name=req.business_name,
        address=req.address,
        state=req.state,
        constitution=req.constitution
    )

    return result


# ============================================================
# UDYAM VERIFICATION
# ============================================================

@app.post(
    "/api/kyc/udyam/verify",
    response_model=schemas.UdyamVerifyResponse
)
def verify_udyam(
    req: schemas.UdyamVerifyRequest
):

    if not req.udyam_number or not req.udyam_number.strip():

        return {
            "verification_status": "Incomplete information",
            "registration_exists": False,
            "udyam_number": "",
            "registered_enterprise_name": None,
            "available_registry_details": None,

            "field_level_matching": {
                "udyam_format_valid": False,
                "udyam_exists": False,
                "enterprise_name_match": None,
                "city_match": None,
                "state_match": None
            },

            "explanation": (
                "Udyam registration number was not provided."
            ),

            "can_proceed_to_manual_review": True
        }

    result = udyam_service.verify(
        udyam_number=req.udyam_number,
        enterprise_name=req.enterprise_name,
        city=req.city,
        state=req.state
    )

    return result


# ============================================================
# KYC VERIFICATION
# ============================================================

@app.post(
    "/api/kyc/verify",
    response_model=schemas.KYCVerifyResponse
)
def verify_kyc(
    req: schemas.KYCVerifyRequest,
    db: Session = Depends(get_db)
):

    submission_id = (
        f"KYC-2026-{datetime.datetime.utcnow().strftime('%M%S')}"
    )

    gst_res = kyc_service.verify_gstin(
        req.gstin,
        req.business_name
    )

    udyam_res = kyc_service.verify_udyam(
        req.udyam_number,
        req.business_name
    )

    is_verified = (
        gst_res.get("valid", False)
        and udyam_res.get("valid", False)
    )

    status_str = (
        "Verified"
        if is_verified
        else (
            "Needs Manual Review"
            if gst_res.get("valid") or udyam_res.get("valid")
            else "Rejected"
        )
    )

    submission = models.KYCSubmission(
        id=submission_id,
        user_id=1,
        business_name=req.business_name,
        gstin=req.gstin,
        udyam_number=req.udyam_number,
        status=status_str,
        gstin_verification_status=gst_res.get(
            "status",
            "Unknown"
        ),
        udyam_verification_status=udyam_res.get(
            "status",
            "Unknown"
        ),
        confidence_score=(
            98.5 if is_verified else 72.0
        ),
        verification_notes=(
            f"GSTIN: {gst_res.get('message')} | "
            f"Udyam: {udyam_res.get('message')}"
        )
    )

    db.add(submission)
    db.commit()

    return {
        "submission_id": submission_id,
        "business_name": req.business_name,
        "gstin_status": gst_res.get(
            "status",
            "NotFound"
        ),
        "udyam_status": udyam_res.get(
            "status",
            "NotFound"
        ),
        "overall_status": status_str,
        "confidence_score": (
            98.5 if is_verified else 72.0
        ),
        "details": {
            "gstin_details": gst_res,
            "udyam_details": udyam_res
        }
    }


# ============================================================
# ORDERS AND TRACKING
# ============================================================

@app.post(
    "/api/orders",
    response_model=schemas.OrderResponse
)
def create_order(
    req: schemas.OrderCreateRequest,
    db: Session = Depends(get_db)
):

    order_id = "ORD-2026-004517"

    now = datetime.datetime.utcnow()

    order = db.query(
        models.Order
    ).filter(
        models.Order.id == order_id
    ).first()

    if not order:

        order = models.Order(
            id=order_id,
            user_id=1,
            quote_id=req.quote_id,
            business_name=req.business_name,
            bundle_name=req.bundle_name,
            monthly_charges=req.monthly_charges,
            setup_charges=req.setup_charges,
            contract_duration_months=req.contract_duration_months,
            current_stage="Service Activated",
            stage_index=7,
            installed_by="Airtel Business Partner"
        )

        db.add(order)
        db.commit()

    timeline = [
        {
            "stage": "Order Placed",
            "date": "12 Jan",
            "completed": True,
            "index": 1
        },
        {
            "stage": "KYC Verification",
            "date": "13 Jan",
            "completed": True,
            "index": 2
        },
        {
            "stage": "Feasibility Check",
            "date": "14 Jan",
            "completed": True,
            "index": 3
        },
        {
            "stage": "Installation Scheduled",
            "date": "15 Jan",
            "completed": True,
            "index": 4
        },
        {
            "stage": "Installation In Progress",
            "date": "16 Jan",
            "completed": True,
            "index": 5
        },
        {
            "stage": "Installation Completed",
            "date": "17 Jan",
            "completed": True,
            "index": 6
        },
        {
            "stage": "Service Activated",
            "date": "17 Jan",
            "completed": True,
            "index": 7
        }
    ]

    return {
        "id": order_id,
        "business_name": req.business_name,
        "bundle_name": req.bundle_name,
        "monthly_charges": req.monthly_charges,
        "setup_charges": req.setup_charges,
        "contract_duration_months": req.contract_duration_months,
        "current_stage": order.current_stage,
        "stage_index": order.stage_index,
        "installed_by": order.installed_by,
        "timeline": timeline,
        "created_at": now
    }


@app.get("/api/orders/{id}")
def get_order_tracking(
    id: str,
    db: Session = Depends(get_db)
):

    timeline = [
        {
            "stage": "Order Placed",
            "date": "12 Jan",
            "completed": True,
            "index": 1
        },
        {
            "stage": "KYC Verification",
            "date": "13 Jan",
            "completed": True,
            "index": 2
        },
        {
            "stage": "Feasibility Check",
            "date": "14 Jan",
            "completed": True,
            "index": 3
        },
        {
            "stage": "Installation Scheduled",
            "date": "15 Jan",
            "completed": True,
            "index": 4
        },
        {
            "stage": "Installation In Progress",
            "date": "16 Jan",
            "completed": True,
            "index": 5
        },
        {
            "stage": "Installation Completed",
            "date": "17 Jan",
            "completed": True,
            "index": 6
        },
        {
            "stage": "Service Activated",
            "date": "17 Jan",
            "completed": True,
            "index": 7
        }
    ]

    return {
        "id": (
            id
            if id.startswith("ORD")
            else "ORD-2026-004517"
        ),
        "business_name": "City Care Clinic",
        "bundle_name": "Clinic Connect Bundle",
        "monthly_charges": 2899.0,
        "setup_charges": 1500.0,
        "contract_duration_months": 12,
        "current_stage": "Service Activated",
        "stage_index": 7,
        "installation_date": "17 Jan 2026",
        "installed_by": "Airtel Business Partner",
        "status": "Completed",
        "timeline": timeline,
        "created_at": "2026-01-12T10:00:00"
    }


@app.patch("/api/admin/orders/{id}/status")
def update_order_status(
    id: str,
    payload: schemas.OrderStatusUpdate
):

    return {
        "id": id,
        "current_stage": payload.stage_name,
        "stage_index": payload.stage_index,
        "remarks": payload.remarks,
        "updated_at": datetime.datetime.utcnow().isoformat()
    }


# ============================================================
# ADMIN DASHBOARD AND ANALYTICS
# ============================================================

@app.get("/api/admin/analytics")
def get_admin_analytics():

    """
    Returns dynamic analytics calculated from smb_leads.csv
    using Pandas.
    """

    analysis = run_lead_analysis(LEADS_PATH)

    total_leads = analysis["total_records"]

    conversions = analysis["financials"]["total_activated"]

    act_rate = analysis["financials"][
        "overall_activation_rate_pct"
    ]

    avg_act_time = analysis["financials"][
        "avg_days_to_activation"
    ]

    funnel = [
        {
            "stage": item["stage"],
            "count": item["reached_count"],
            "pct": item["pct_of_total_leads"]
        }
        for item in analysis["funnel_conversion"]
    ]

    segment_perf = [
        {
            "segment": item["segment"],
            "share": round(
                (item["count"] / total_leads) * 100
            ),
            "count": item["count"],
            "avg_arpu": next(
                (
                    s["avg_monthly_arpu_inr"]
                    for s in analysis["segment_activation"]
                    if s["segment"] == item["segment"]
                ),
                0.0
            )
        }
        for item in analysis["segment_distribution"]
    ]

    return {
        "overview": {
            "total_leads": total_leads,

            "leads_growth": "+12%",

            "conversions": conversions,

            "conversions_growth": "+18%",

            "activation_rate": act_rate,

            "activation_rate_delta": "+4.2pp",

            "avg_activation_time_days": avg_act_time,

            "avg_activation_time_delta": "-1.8 days",

            "churn_rate_6m": analysis["financials"][
                "churn_6m_rate_pct"
            ],

            "avg_nps": analysis["financials"]["avg_nps"],

            "total_mrr_inr": analysis["financials"][
                "total_monthly_recurring_rev_inr"
            ],

            "total_setup_fees_inr": analysis["financials"][
                "total_setup_fees_inr"
            ],

            "cac_per_activated_inr": analysis["financials"][
                "cac_per_activated_customer_inr"
            ]
        },

        "conversion_funnel": funnel,

        "activations_over_time": [
            {
                "month": "Aug",
                "activations": 28
            },
            {
                "month": "Sep",
                "activations": 42
            },
            {
                "month": "Oct",
                "activations": 64
            },
            {
                "month": "Nov",
                "activations": 76
            },
            {
                "month": "Dec",
                "activations": 83
            },
            {
                "month": "Jan",
                "activations": 75
            }
        ],

        "segment_performance": segment_perf,

        "historical_analysis": analysis
    }


@app.get("/api/admin/historical-analytics")
def get_historical_lead_analytics():

    """
    Dedicated endpoint returning the complete acquisition analysis
    dynamically computed from smb_leads.csv.
    """

    return run_lead_analysis(LEADS_PATH)


@app.get("/api/admin/leads")
def get_admin_leads(
    search: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(default=100, ge=1, le=5000),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db)
):

    """
    Returns historical leads from the database with filtering
    and pagination.
    """

    query = db.query(
        models.HistoricalLead
    )

    if search:

        s = f"%{search.lower()}%"

        query = query.filter(
            (
                models.HistoricalLead.business_name.ilike(s)
            )
            |
            (
                models.HistoricalLead.city.ilike(s)
            )
            |
            (
                models.HistoricalLead.lead_id.ilike(s)
            )
        )

    if (
        category
        and category.lower() not in {
            "all categories",
            "all"
        }
    ):

        query = query.filter(
            models.HistoricalLead.segment.ilike(
                f"%{category}%"
            )
        )

    if (
        status
        and status.lower() not in {
            "all status",
            "all"
        }
    ):

        if status.lower() == "converted":

            query = query.filter(
                models.HistoricalLead.outcome == "Activated"
            )

        elif status.lower() == "in progress":

            query = query.filter(
                models.HistoricalLead.stage_reached.in_([
                    "KYC complete",
                    "Quote accepted"
                ])
            )

        elif status.lower() == "qualified":

            query = query.filter(
                models.HistoricalLead.stage_reached.in_([
                    "Needs assessed",
                    "Contacted"
                ])
            )

        elif status.lower() == "new":

            query = query.filter(
                models.HistoricalLead.stage_reached == "Lead"
            )

    leads_rows = query.offset(offset).limit(limit).all()

    output = []

    for r in leads_rows:

        derived_status = (
            "Converted"
            if r.outcome == "Activated"
            else (
                "In Progress"
                if r.stage_reached in [
                    "KYC complete",
                    "Quote accepted"
                ]
                else (
                    "Qualified"
                    if r.stage_reached in [
                        "Needs assessed",
                        "Contacted"
                    ]
                    else "New"
                )
            )
        )

        lead_dict = {
            "lead_id": r.lead_id,
            "business_name": r.business_name,
            "category": r.segment,
            "city": r.city,
            "requirements": (
                r.products_of_interest
                or "Connectivity"
            ),
            "status": derived_status,
            "created_date": r.created_date,
            "lead_source": r.lead_source,
            "business_type": r.business_type,
            "segment": r.segment,
            "city_tier": r.city_tier,
            "state": r.state,
            "preferred_language": r.preferred_language,
            "employee_count": r.employee_count,
            "num_sites": r.num_sites,
            "annual_turnover_band": r.annual_turnover_band,
            "has_gstin": r.has_gstin,
            "gstin": r.gstin,
            "has_udyam": r.has_udyam,
            "udyam_number": r.udyam_number,
            "current_internet": r.current_internet,
            "current_provider": r.current_provider,
            "monthly_telecom_spend_inr": (
                r.monthly_telecom_spend_inr
            ),
            "products_of_interest": r.products_of_interest,
            "contact_name": r.contact_name,
            "contact_role": r.contact_role,
            "stage_reached": r.stage_reached,
            "outcome": r.outcome,
            "drop_reason": r.drop_reason,
            "contacted_date": r.contacted_date,
            "needs_assessed_date": r.needs_assessed_date,
            "quote_accepted_date": r.quote_accepted_date,
            "kyc_complete_date": r.kyc_complete_date,
            "activated_date": r.activated_date,
            "days_lead_to_activation": (
                r.days_lead_to_activation
            ),
            "customer_follow_up_calls": (
                r.customer_follow_up_calls
            ),
            "bundle_products": r.bundle_products,
            "monthly_bundle_value_inr": (
                r.monthly_bundle_value_inr
            ),
            "one_time_setup_inr": r.one_time_setup_inr,
            "contract_months": r.contract_months,
            "churned_within_6_months": (
                r.churned_within_6_months
            ),
            "nps_score": r.nps_score,
            "acquisition_cost_inr": r.acquisition_cost_inr
        }

        output.append(lead_dict)

    return output


@app.get("/api/admin/prototype-leads")
def get_prototype_leads(
    db: Session = Depends(get_db)
):

    """
    Returns only newly created prototype leads from live sessions.
    """

    return db.query(
        models.Lead
    ).order_by(
        models.Lead.created_date.desc()
    ).all()


@app.get("/api/admin/orders")
def get_admin_orders():

    return [
        {
            "id": "ORD-2026-004517",
            "business_name": "City Care Clinic",
            "category": "Professional Office",
            "bundle_name": "Clinic Connect Bundle",
            "monthly_charges": 2899,
            "stage": "Service Activated",
            "stage_index": 7,
            "city": "Bengaluru",
            "date": "2026-01-17"
        },
        {
            "id": "ORD-2026-004518",
            "business_name": "FreshMart Retail",
            "category": "Micro Retail",
            "bundle_name": "Retail Pro Connect Bundle",
            "monthly_charges": 1999,
            "stage": "Installation In Progress",
            "stage_index": 5,
            "city": "New Delhi",
            "date": "2026-01-18"
        },
        {
            "id": "ORD-2026-004519",
            "business_name": "Apex Fabrics & Textiles",
            "category": "Small Manufacturer",
            "bundle_name": "Smart Factory Hub",
            "monthly_charges": 8499,
            "stage": "Feasibility Check",
            "stage_index": 3,
            "city": "Surat",
            "date": "2026-01-19"
        }
    ]


@app.post("/api/admin/handoff")
def human_sales_handoff(
    req: schemas.HumanHandoffRequest
):

    lead_id = (
        f"L-10{datetime.datetime.utcnow().strftime('%S%f')[:3]}"
    )

    return {
        "success": True,
        "lead_id": lead_id,
        "message": (
            f"Lead created for {req.business_name}. "
            "Airtel Field Sales Enterprise Relationship Manager "
            "has been assigned."
        ),
        "assigned_rm": (
            "Priya Sharma (Airtel Business Enterprise Team)"
        ),
        "contact_sla_hours": 2
    }