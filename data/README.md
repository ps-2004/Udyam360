# Udyam Digital - Synthetic Dataset & Schema Specification
Airtel SYNC YTL Hackathon 2026 - Track A

This dataset repository contains offline registries and catalogue data required for deterministic, offline operation without external API dependencies.

## 1. product_catalogue.csv
- **Rows**: 25 authentic Airtel Business enterprise products across 5 strategic MSME categories:
  1. Internet & Connectivity (Broadband 100/200/300 Mbps, DIA Lease Lines 10/50 Mbps, SD-WAN Gateway, 4G/5G Backup Dongle)
  2. Cloud & Collaboration (Google Workspace Starter, Microsoft 365 Basic, Cloud Storage 100GB/1TB, Cloud Backup & DR)
  3. Security & Compliance (Airtel SecureSuite, CyberGuard Pro Firewall, SafeNet DNS Security, Secure Wi-Fi Captive Portal)
  4. Voice & Customer Communication (Airtel Business Voice Fixed Line, Cloud Contact Center IVR, 1800 Toll-Free, Smart SMS Hub, WhatsApp Business API)
  5. IoT & Smart Operations (IoT Asset Tracker, Cloud CCTV Surveillance, Smart Energy & Power Monitor, POS M2M Connectivity SIM)
- **Columns**: `product_id`, `product_name`, `category`, `description`, `monthly_price`, `price_unit`, `setup_fee`, `contract_months`, `city_tiers`, `gstin_required`, `udyam_required`, `dependencies`, `features`

## 2. mock_gstin_registry.csv
- **Purpose**: Local verification source for GST identification numbers.
- **Columns**: `gstin`, `legal_name`, `trade_name`, `constitution`, `state`, `city`, `address`, `status` (Active, Suspended, Cancelled), `filing_status`, `registration_date`, `hsn_code`
- **Verification Logic**: Checks format (15-character alphanumeric checksum), record existence, matching business name, and active status flag.

## 3. mock_udyam_registry.csv
- **Purpose**: Local verification source for Ministry of MSME Udyam registration numbers.
- **Columns**: `udyam_number`, `enterprise_name`, `enterprise_type` (Micro, Small, Medium), `major_activity` (Services, Manufacturing, Trading), `state`, `city`, `date_of_commencement`, `dic_name`, `status` (Verified, Under Review, Revoked)
- **Verification Logic**: Validates format (`UDYAM-XX-00-0000000`), matches enterprise title and status.

## 4. smb_leads.csv
- **Purpose**: Historical sales funnel and lead generation analytics.
- **Funnel Aggregates**:
  - Total Leads: 4,892 (+12%)
  - Qualified Leads: 3,214 (66%)
  - Quoted: 1,985 (41%)
  - Ordered: 1,326 (27%)
  - Activated: 1,126 (23%)
  - Average Activation Time: 5.4 days (-1.8 days)
  - Activation Rate: 92.8% (+4.2pp)
