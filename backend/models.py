import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    phone = Column(String(32), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    business_profiles = relationship("BusinessProfile", back_populates="user")
    quotes = relationship("Quote", back_populates="user")
    orders = relationship("Order", back_populates="user")

class AdminUser(Base):
    __tablename__ = "admin_users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="Operations Manager")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class BusinessProfile(Base):
    __tablename__ = "business_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    business_name = Column(String(255), nullable=False)
    business_category = Column(String(100), nullable=False) # Micro retail, Professional office, etc.
    business_type = Column(String(100), nullable=False) # Service, Manufacturing, Trading
    city = Column(String(100), nullable=False)
    city_tier = Column(String(50), default="Tier 1")
    number_of_employees = Column(Integer, default=5)
    number_of_locations = Column(Integer, default=1)
    existing_provider = Column(String(100), nullable=True)
    current_internet_spend = Column(Float, default=0.0)
    existing_tools = Column(String(255), nullable=True)
    required_products = Column(Text, nullable=True)
    monthly_budget = Column(Float, default=3000.0)
    gstin_available = Column(Boolean, default=True)
    gstin_number = Column(String(30), nullable=True)
    udyam_registered = Column(Boolean, default=True)
    udyam_number = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="business_profiles")
    recommendations = relationship("Recommendation", back_populates="business_profile")
    quotes = relationship("Quote", back_populates="business_profile")

class Product(Base):
    __tablename__ = "products"
    id = Column(String(50), primary_key=True) # e.g. P-101
    product_name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    monthly_price = Column(Float, nullable=False)
    price_unit = Column(String(50), default="per month")
    setup_fee = Column(Float, default=0.0)
    contract_months = Column(Integer, default=12)
    city_tiers = Column(String(255), default="Tier 1, Tier 2, Tier 3")
    gstin_required = Column(Boolean, default=False)
    udyam_required = Column(Boolean, default=False)
    dependencies = Column(String(255), default="None")
    features = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Conversation(Base):
    __tablename__ = "conversations"
    id = Column(String(100), primary_key=True) # session id
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    messages = Column(Text, nullable=False) # JSON encoded messages
    context = Column(Text, nullable=True) # JSON encoded extracted intent
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class Recommendation(Base):
    __tablename__ = "recommendations"
    id = Column(Integer, primary_key=True, index=True)
    business_profile_id = Column(Integer, ForeignKey("business_profiles.id"), nullable=True)
    bundle_name = Column(String(255), nullable=False)
    bundle_tagline = Column(String(255), nullable=True)
    recommended_product_ids = Column(Text, nullable=False) # Comma separated
    monthly_total = Column(Float, nullable=False)
    setup_total = Column(Float, default=0.0)
    contract_months = Column(Integer, default=12)
    score = Column(Float, default=95.0)
    explanation = Column(Text, nullable=False) # JSON or markdown list of reasons
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    business_profile = relationship("BusinessProfile", back_populates="recommendations")

class Quote(Base):
    __tablename__ = "quotes"
    id = Column(String(50), primary_key=True) # e.g. QT-2026-00912
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    business_profile_id = Column(Integer, ForeignKey("business_profiles.id"), nullable=True)
    bundle_name = Column(String(255), nullable=False)
    monthly_recurring_charges = Column(Float, nullable=False)
    one_time_setup_fees = Column(Float, default=0.0)
    contract_duration_months = Column(Integer, default=12)
    status = Column(String(50), default="Generated") # Generated, Accepted, Expired
    pdf_path = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="quotes")
    business_profile = relationship("BusinessProfile", back_populates="quotes")
    items = relationship("QuoteItem", back_populates="quote", cascade="all, delete-orphan")
    order = relationship("Order", back_populates="quote", uselist=False)

class QuoteItem(Base):
    __tablename__ = "quote_items"
    id = Column(Integer, primary_key=True, index=True)
    quote_id = Column(String(50), ForeignKey("quotes.id"), nullable=False)
    product_id = Column(String(50), ForeignKey("products.id"), nullable=False)
    product_name = Column(String(255), nullable=False)
    monthly_price = Column(Float, nullable=False)
    setup_fee = Column(Float, default=0.0)
    is_addon = Column(Boolean, default=False)

    quote = relationship("Quote", back_populates="items")

class ConsentRecord(Base):
    __tablename__ = "consent_records"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    consent_version = Column(String(50), default="DPDP-2023-V1.2")
    purpose = Column(String(255), default="MSME Telecom & Cloud KYC Verification under DoT & DPDP Guidelines")
    retention_period_days = Column(Integer, default=180)
    ip_address = Column(String(100), default="127.0.0.1")
    user_agent = Column(String(255), nullable=True)
    granted_at = Column(DateTime, default=datetime.datetime.utcnow)

class KYCSubmission(Base):
    __tablename__ = "kyc_submissions"
    id = Column(String(50), primary_key=True) # KYC-2026-00412
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    business_name = Column(String(255), nullable=False)
    gstin = Column(String(30), nullable=True)
    udyam_number = Column(String(50), nullable=True)
    status = Column(String(50), default="Verified") # Pending, Verified, Needs Manual Review, Rejected
    gstin_verification_status = Column(String(50), default="Valid")
    udyam_verification_status = Column(String(50), default="Valid")
    confidence_score = Column(Float, default=98.5)
    verification_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

    documents = relationship("KYCDocument", back_populates="submission", cascade="all, delete-orphan")

class KYCDocument(Base):
    __tablename__ = "kyc_documents"
    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(String(50), ForeignKey("kyc_submissions.id"), nullable=False)
    document_type = Column(String(50), nullable=False) # GST, Udyam, Address Proof, Signatory ID
    file_name = Column(String(255), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    file_path = Column(String(500), nullable=False)
    extracted_text = Column(Text, nullable=True)
    ocr_confidence = Column(Float, default=95.0)
    manual_review_required = Column(Boolean, default=False)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

    submission = relationship("KYCSubmission", back_populates="documents")

class Order(Base):
    __tablename__ = "orders"
    id = Column(String(50), primary_key=True) # ORD-2026-004517
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    quote_id = Column(String(50), ForeignKey("quotes.id"), nullable=True)
    business_name = Column(String(255), nullable=False)
    bundle_name = Column(String(255), nullable=False)
    monthly_charges = Column(Float, nullable=False)
    setup_charges = Column(Float, default=0.0)
    contract_duration_months = Column(Integer, default=12)
    current_stage = Column(String(50), default="Service Activated") # 1 to 7 stages
    stage_index = Column(Integer, default=7)
    estimated_installation_date = Column(DateTime, nullable=True)
    installed_by = Column(String(255), default="Airtel Business Enterprise Partner")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="orders")
    quote = relationship("Quote", back_populates="order")
    status_history = relationship("OrderStatusHistory", back_populates="order", cascade="all, delete-orphan")

class OrderStatusHistory(Base):
    __tablename__ = "order_status_history"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String(50), ForeignKey("orders.id"), nullable=False)
    stage_name = Column(String(100), nullable=False)
    stage_index = Column(Integer, nullable=False)
    completed_at = Column(DateTime, default=datetime.datetime.utcnow)
    remarks = Column(String(255), nullable=True)

    order = relationship("Order", back_populates="status_history")

class Lead(Base):
    """
    Live Prototype Transactions:
    Represents new real-time leads generated within the Udyam360 prototype
    (e.g., via sales handoff modal or custom advisor inquiries).
    """
    __tablename__ = "leads"
    id = Column(String(50), primary_key=True) # L-10234
    business_name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    city = Column(String(100), nullable=False)
    tier = Column(String(50), default="Tier 1")
    employees = Column(Integer, default=5)
    locations = Column(Integer, default=1)
    budget = Column(Float, default=3000.0)
    requirements = Column(String(255), nullable=False)
    recommended_bundle = Column(String(255), nullable=True)
    source = Column(String(100), default="Digital Self-Serve")
    status = Column(String(50), default="New") # New, Qualified, In Progress, Converted, Disqualified
    conversion_days = Column(Float, default=4.5)
    handoff_reason = Column(Text, nullable=True)
    created_date = Column(DateTime, default=datetime.datetime.utcnow)

class HistoricalLead(Base):
    """
    Historical Dataset (smb_leads.csv):
    Contains the 5,000 historical records from Airtel Business MSME acquisition campaigns.
    Preserves all 39 original columns with zero fabrication.
    """
    __tablename__ = "historical_leads"
    lead_id = Column(String(50), primary_key=True)
    created_date = Column(String(50), nullable=True)
    lead_source = Column(String(100), nullable=True)
    business_name = Column(String(255), nullable=False)
    business_type = Column(String(100), nullable=True)
    segment = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    city_tier = Column(Integer, nullable=True)
    state = Column(String(100), nullable=True)
    preferred_language = Column(String(50), nullable=True)
    employee_count = Column(Integer, nullable=True)
    num_sites = Column(Integer, nullable=True)
    annual_turnover_band = Column(String(50), nullable=True)
    has_gstin = Column(String(10), nullable=True)
    gstin = Column(String(50), nullable=True)
    has_udyam = Column(String(10), nullable=True)
    udyam_number = Column(String(50), nullable=True)
    current_internet = Column(String(100), nullable=True)
    current_provider = Column(String(100), nullable=True)
    monthly_telecom_spend_inr = Column(Float, nullable=True)
    products_of_interest = Column(Text, nullable=True)
    contact_name = Column(String(255), nullable=True)
    contact_role = Column(String(100), nullable=True)
    stage_reached = Column(String(100), nullable=True)
    outcome = Column(String(50), nullable=True)
    drop_reason = Column(Text, nullable=True)
    contacted_date = Column(String(50), nullable=True)
    needs_assessed_date = Column(String(50), nullable=True)
    quote_accepted_date = Column(String(50), nullable=True)
    kyc_complete_date = Column(String(50), nullable=True)
    activated_date = Column(String(50), nullable=True)
    days_lead_to_activation = Column(Float, nullable=True)
    customer_follow_up_calls = Column(Integer, nullable=True)
    bundle_products = Column(Text, nullable=True)
    monthly_bundle_value_inr = Column(Float, nullable=True)
    one_time_setup_inr = Column(Float, nullable=True)
    contract_months = Column(Float, nullable=True)
    churned_within_6_months = Column(String(10), nullable=True)
    nps_score = Column(Float, nullable=True)
    acquisition_cost_inr = Column(Float, nullable=True)

