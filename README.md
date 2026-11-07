# Udyam Digital (Udyam360) – Airtel SYNC YTL Hackathon 2026
**Track A: Enterprise MSME Acquisition, Product Discovery, Smart KYC & Optical Activation**

Udyam360 is an enterprise-grade full-stack solution engineered for **Bharti Airtel Limited** to simplify and streamline how Indian Micro, Small, and Medium Enterprises (MSMEs) discover, purchase, verify, and activate telecom and cloud connectivity solutions.

---

## 1. Primary Architecture & Zero External API Dependency Compliance

This project strictly adheres to all architectural constraints:
- **Zero Third-Party External API Calls**: Does not rely on Gemini, OpenAI, Google Maps, AWS, Firebase, or external government endpoints.
- **Deterministic Intelligent Recommendation Engine**: Implemented locally using multi-criteria constraint satisfaction (business category relevance, employee count, monthly budget compatibility, city-tier coverage, and product dependencies like Broadband requirement for SecureSuite/SD-WAN).
- **Offline KYC Registry Verification**: Uses local datasets (`mock_gstin_registry.csv` and `mock_udyam_registry.csv`) with OCR heuristics, format validation (15-character GST checksum and Udyam patterns), active/suspended/cancelled status checking, and manual review routing.
- **DPDP Act 2023 Compliance**: Incorporates explicit informed consent, purpose limitation, retention limit (180 days), and right-to-erasure workflows.
- **Render Ready**: Includes standalone FastAPI backend (`/backend`), SQLAlchemy ORM models, Pydantic schemas, `render.yaml`, `requirements.txt`, and database configurations for SQLite and Render PostgreSQL.

---

## 2. 9-Screen UI Module Mapping (Referencing Mockup)

| Screen # | Module | Core Functionality |
|---|---|---|
| **1** | **Landing Page** | Value proposition ("Your Business. Connected. Simplified."), hero visual, 4 core service cards, MSME segments, and CTAs. |
| **2** | **Business Profile Setup** | 5-step onboarding wizard collecting name, category, employee size, locations, city tier, budget, and GSTIN/Udyam status. |
| **3** | **Intelligent Advisor (Chat)** | Conversational consultation, intent & budget extraction, and interactive recommendation cards (e.g. Clinic Connect Bundle). |
| **4** | **Product Catalogue** | Complete 25-product Airtel Business catalogue with search, category tabs (Internet, Cloud, Security, Voice, IoT), and dependency tags. |
| **5** | **Bundle Comparison & Checkout** | Side-by-side comparison (Recommended Bundle vs Custom Selection with add-ons), price breakdown, and offline PDF generation. |
| **6** | **Smart KYC Verification** | 4-stage stepper (Consent → Upload → Verify Details → Completed), drag-and-drop file uploaders, local OCR extraction, and registry validation. |
| **7** | **Order Tracker (Customer)** | 7-stage activation timeline (Order Placed → KYC → Feasibility → Installation Scheduled → In Progress → Completed → Service Activated). |
| **8** | **Admin Dashboard Overview** | Executive acquisition KPIs (4,892 leads, 1,126 activations, 92.8% activation rate), historical conversion funnel, and trend line chart. |
| **9** | **Admin Leads & Orders** | Tabbed leads management with search, category/status filters, CSV export, and stage advance controller for simulating installations. |
| **Modal** | **Human Sales Handoff** | Hybrid digital-to-field escalation assigning an Airtel Enterprise Relationship Manager with 2-hour SLA. |

---

## 3. Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, jsPDF (for local offline PDF quote export).
- **Backend**:
  - Express.js (`server.ts`) for local full-stack execution with Vite middlewares on port 3000.
  - Python FastAPI (`/backend`) with Pydantic and SQLAlchemy ORM for independent Render deployment.
- **Data & Processing**:
  - `data/product_catalogue.csv`: 25 verified Airtel Business solutions.
  - `data/mock_gstin_registry.csv`: GST registry with active, suspended, and cancelled businesses.
  - `data/mock_udyam_registry.csv`: Ministry of MSME Udyam registration records.
  - `data/smb_leads.csv`: Historical leads for funnel analytics.

---

## 4. Local Development & Testing

### Running the App Locally:
```bash
# Install dependencies
npm install

# Start development full-stack server on port 3000
npm run dev
```

### Running Backend Python Unit Tests:
```bash
cd backend
python3 -m unittest test_app.py
```
Tests verify:
- Accurate pricing calculations and bundle setup fees
- Product dependency validation (e.g., SecureSuite requires Broadband)
- GSTIN registry matching and suspended registration handling
- Udyam classification parsing (Micro, Small, Medium)
- Natural language intent and budget extraction

---

## 5. Render Deployment Guide

The application can be deployed on Render using the included `render.yaml`:

### Option A: Blueprint Deployment
1. Connect your GitHub repository to Render.
2. Select **Blueprints** and point to `render.yaml`.
3. Render will provision:
   - `udyam360-db` (PostgreSQL free tier)
   - `udyam360-backend` (Python web service running FastAPI via Uvicorn)
   - `udyam360-frontend` (Node web service running `node server.ts` or Vite build)

### Option B: Standalone Web Service
- **Build Command**: `pip install -r backend/requirements.txt`
- **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Environment Variables**:
  - `DATABASE_URL`: Your PostgreSQL connection string
  - `CORS_ORIGINS`: Frontend URL


## Local development (Vite + FastAPI)

1. Backend: `cd backend`, create/activate a Python virtual environment, run `pip install -r requirements.txt`, then `uvicorn main:app --reload --host 127.0.0.1 --port 8000`.
2. Install the Tesseract OCR system binary separately (Windows: install Tesseract and add its install directory to PATH; Ubuntu: `sudo apt-get install tesseract-ocr`).
3. Frontend in a second terminal: from the project root run `npm install` then `npm run dev`. Vite proxies `/api` and `/health` to FastAPI at `http://127.0.0.1:8000`.
4. Open `http://localhost:5173`. FastAPI Swagger is at `http://127.0.0.1:8000/docs`.

## KYC upload endpoint

`POST /api/kyc/upload` accepts multipart fields `file`, `document_type` (`gst`, `udyam`, `address`, `signatory`) and optional `business_name`. Supported files: PNG, JPG/JPEG, TIFF and PDF; maximum 10 MB. OCR runs locally when Tesseract is installed. An OCR miss returns `manual_review_required`; no identifiers are fabricated. Registry matching is a separate preliminary check and does not establish document authenticity.

## Deployment note

The Render blueprint uses a Vite static frontend and FastAPI web service. Configure a persistent disk for uploads and a persistent PostgreSQL database for production. A free web service filesystem is not durable. Set `DATABASE_URL` and `CORS_ORIGINS` in the backend service settings before production use.
