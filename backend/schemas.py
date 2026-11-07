from pydantic import BaseModel, Field
from typing import List, Optional
import datetime

# Business Profile Schemas
class BusinessProfileCreate(BaseModel):
    business_name: str
    business_category: str
    business_type: str
    city: str
    city_tier: Optional[str] = "Tier 1"
    number_of_employees: int = 5
    number_of_locations: int = 1
    existing_provider: Optional[str] = None
    current_internet_spend: Optional[float] = 0.0
    existing_tools: Optional[str] = None
    required_products: Optional[str] = None
    monthly_budget: float = 3000.0
    gstin_available: bool = True
    gstin_number: Optional[str] = None
    udyam_registered: bool = True
    udyam_number: Optional[str] = None

class BusinessProfileResponse(BusinessProfileCreate):
    id: int
    user_id: Optional[int] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Product Schemas
class ProductResponse(BaseModel):
    id: str
    product_name: str
    category: str
    description: str
    monthly_price: float
    price_unit: str
    setup_fee: float
    contract_months: int
    city_tiers: str
    gstin_required: bool
    udyam_required: bool
    dependencies: str
    features: Optional[str] = None

    class Config:
        from_attributes = True

# Advisor Chat Schemas
class ChatMessage(BaseModel):
    role: str # user or advisor
    content: str
    timestamp: Optional[str] = None

class AdvisorChatRequest(BaseModel):
    session_id: str
    message: str
    profile: Optional[BusinessProfileCreate] = None

class RecommendationBundle(BaseModel):
    bundle_name: str
    tagline: str
    recommended_product_ids: List[str]
    monthly_cost: float
    setup_cost: float
    contract_months: int
    why_recommended: List[str]
    eligibility_warnings: List[str] = []
    category_fit: str

class AdvisorChatResponse(BaseModel):
    session_id: str
    reply: str
    next_question: Optional[str] = None
    recommendation: Optional[dict] = None
    is_recommendation_ready: bool = False

# Quote Schemas
class QuoteItemCreate(BaseModel):
    product_id: str
    is_addon: bool = False

class QuoteCreateRequest(BaseModel):
    business_profile_id: Optional[int] = None
    business_name: str
    bundle_name: str
    selected_product_ids: List[str]
    monthly_budget: float = 3000.0

class QuoteResponse(BaseModel):
    id: str
    business_name: str
    bundle_name: str
    monthly_recurring_charges: float
    one_time_setup_fees: float
    contract_duration_months: int
    status: str
    items: List[dict]
    created_at: datetime.datetime

# KYC Schemas
class ConsentCreateRequest(BaseModel):
    consent_version: str = "DPDP-2023-V1.2"
    accepted: bool = True

class GSTINVerifyRequest(BaseModel):
    gstin: str
    business_name: Optional[str] = None
    address: Optional[str] = None
    state: Optional[str] = None
    constitution: Optional[str] = None

class GSTINFieldMatches(BaseModel):
    gstin_match: bool
    business_name_match: Optional[bool] = None
    address_match: Optional[bool] = None
    state_match: Optional[bool] = None
    status_active: bool

class GSTINVerifyResponse(BaseModel):
    verification_status: str  # Verified, GSTIN not found, Cancelled, Suspended, Business name mismatch, Address mismatch, Manual review required
    gstin_exists: bool
    gstin: str
    registered_business_name: Optional[str] = None
    trade_name: Optional[str] = None
    legal_name: Optional[str] = None
    constitution: Optional[str] = None
    registered_address: Optional[str] = None
    state: Optional[str] = None
    registration_date: Optional[str] = None
    registration_status: Optional[str] = None
    field_matches: GSTINFieldMatches
    explanation: str
    can_proceed_to_manual_review: bool

# Udyam Verification Schemas
class UdyamVerifyRequest(BaseModel):
    udyam_number: str
    enterprise_name: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None

class UdyamFieldMatches(BaseModel):
    udyam_format_valid: bool
    udyam_exists: bool
    enterprise_name_match: Optional[bool] = None
    city_match: Optional[bool] = None
    state_match: Optional[bool] = None

class UdyamVerifyResponse(BaseModel):
    verification_status: str  # Verified, Registration not found, Enterprise name mismatch, Incomplete information, Manual review required
    registration_exists: bool
    udyam_number: str
    registered_enterprise_name: Optional[str] = None
    available_registry_details: Optional[dict] = None
    field_level_matching: UdyamFieldMatches
    explanation: str
    can_proceed_to_manual_review: bool

class KYCVerifyRequest(BaseModel):
    business_name: str
    gstin: Optional[str] = None
    udyam_number: Optional[str] = None
    documents: Optional[List[dict]] = None # {document_type: str, file_name: str, file_size: int}

class KYCVerifyResponse(BaseModel):
    submission_id: str
    business_name: str
    gstin_status: str # Valid, Suspended, Cancelled, NotFound
    udyam_status: str # Valid, UnderReview, Revoked, NotFound
    overall_status: str # Verified, Needs Manual Review, Rejected
    confidence_score: float
    details: dict

# Order Schemas
class OrderCreateRequest(BaseModel):
    quote_id: str
    business_name: str
    bundle_name: str
    monthly_charges: float
    setup_charges: float
    contract_duration_months: int

class OrderStatusUpdate(BaseModel):
    stage_index: int
    stage_name: str
    remarks: Optional[str] = None

class OrderResponse(BaseModel):
    id: str
    business_name: str
    bundle_name: str
    monthly_charges: float
    setup_charges: float
    contract_duration_months: int
    current_stage: str
    stage_index: int
    installed_by: str
    timeline: List[dict]
    created_at: datetime.datetime

# Human Handoff / Lead Schema
class HumanHandoffRequest(BaseModel):
    business_name: str
    category: str
    city: str
    budget: float
    requirements: str
    reason: str
    preferred_contact: Optional[str] = None
