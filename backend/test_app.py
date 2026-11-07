import unittest
from advisor_engine import DeterministicAdvisor, CURATED_BUNDLES
from ocr_service import LocalKycVerificationService
from gstin_service import LocalGSTINService
from udyam_service import LocalUdyamService

class TestUdyam360Logic(unittest.TestCase):
    def setUp(self):
        self.mock_products = {
            "P-101": {
                "id": "P-101",
                "product_name": "Airtel Business Broadband (100 Mbps)",
                "monthly_price": 999.0,
                "setup_fee": 999.0,
                "dependencies": "None"
            },
            "P-108": {
                "id": "P-108",
                "product_name": "Airtel Business Email (5 users)",
                "monthly_price": 1495.0,
                "setup_fee": 0.0,
                "dependencies": "None"
            },
            "P-113": {
                "id": "P-113",
                "product_name": "Airtel SecureSuite (5 devices)",
                "monthly_price": 499.0,
                "setup_fee": 0.0,
                "dependencies": "P-101"
            }
        }
        self.advisor = DeterministicAdvisor(self.mock_products)
        self.kyc = LocalKycVerificationService()
        self.gstin_service = LocalGSTINService()
        self.udyam_service = LocalUdyamService()

    def test_pricing_calculation(self):
        bundle = self.advisor.recommend_bundle(
            category="Professional Office",
            budget=3000.0,
            employees=5
        )
        self.assertEqual(bundle["bundle_name"], "Clinic Connect Bundle")
        expected_monthly = 999.0 + 1495.0 + 499.0
        self.assertAlmostEqual(bundle["monthly_cost"], 2993.0, delta=100.0)
        self.assertTrue(bundle["setup_cost"] >= 999.0)

    def test_product_dependencies(self):
        prod_secure = self.mock_products["P-113"]
        self.assertEqual(prod_secure["dependencies"], "P-101")

    # ================= GSTIN REGISTRY SERVICE TESTS =================
    def test_gstin_service_record_count(self):
        """Verify the 3,534 records are loaded and indexed properly."""
        count = len(self.gstin_service.registry)
        self.assertEqual(count, 3534)

    def test_gstin_service_verified_outcome(self):
        """Active GSTIN with matching trade name and address."""
        res = self.gstin_service.verify(
            gstin="03PJNXS4821G1ZB",
            business_name="Saffron Bakers",
            address="Market Yard, Ludhiana",
            state="Punjab"
        )
        self.assertEqual(res["verification_status"], "Verified")
        self.assertTrue(res["gstin_exists"])
        self.assertEqual(res["registration_status"], "Active")
        self.assertEqual(res["registered_business_name"], "Sneha Rao (Prop. Saffron Bakers)")
        self.assertEqual(res["trade_name"], "Saffron Bakers")
        self.assertTrue(res["field_matches"]["gstin_match"])
        self.assertTrue(res["field_matches"]["business_name_match"])
        self.assertTrue(res["field_matches"]["address_match"])
        self.assertTrue(res["field_matches"]["status_active"])
        self.assertFalse(res["can_proceed_to_manual_review"])

    def test_gstin_service_case_insensitive_and_whitespace_normalized(self):
        """Check robust normalization for casing and extra whitespace."""
        res = self.gstin_service.verify(
            gstin="03pjnxs4821g1zb",
            business_name="  sAfFrOn   BaKeRs  "
        )
        self.assertEqual(res["verification_status"], "Verified")
        self.assertTrue(res["field_matches"]["business_name_match"])

    def test_gstin_service_proprietor_legal_name_match(self):
        """Applicant submits proprietor name instead of trade name."""
        res = self.gstin_service.verify(
            gstin="03PJNXS4821G1ZB",
            business_name="Sneha Rao"
        )
        self.assertEqual(res["verification_status"], "Verified")
        self.assertTrue(res["field_matches"]["business_name_match"])

    def test_gstin_service_suspended_detection(self):
        """Suspended GSTIN detection from actual registry."""
        res = self.gstin_service.verify(
            gstin="23QYBXS1811Q1ZD",
            business_name="Sahyadri Realty"
        )
        self.assertEqual(res["verification_status"], "Suspended")
        self.assertTrue(res["gstin_exists"])
        self.assertEqual(res["registration_status"], "Suspended")
        self.assertFalse(res["field_matches"]["status_active"])
        self.assertTrue(res["can_proceed_to_manual_review"])
        self.assertIn("suspended", res["explanation"].lower())

    def test_gstin_service_cancelled_detection(self):
        """Cancelled GSTIN detection from actual registry."""
        res = self.gstin_service.verify(
            gstin="37IHKXV5167L1ZS",
            business_name="Vindhya Tours & Travels"
        )
        self.assertEqual(res["verification_status"], "Cancelled")
        self.assertTrue(res["gstin_exists"])
        self.assertEqual(res["registration_status"], "Cancelled")
        self.assertFalse(res["field_matches"]["status_active"])
        self.assertTrue(res["can_proceed_to_manual_review"])
        self.assertIn("cancelled", res["explanation"].lower())

    def test_gstin_service_business_name_mismatch(self):
        """Active GSTIN with non-matching submitted name."""
        res = self.gstin_service.verify(
            gstin="03PJNXS4821G1ZB",
            business_name="Green Leaf Diagnostics Centre"
        )
        self.assertEqual(res["verification_status"], "Business name mismatch")
        self.assertTrue(res["gstin_exists"])
        self.assertFalse(res["field_matches"]["business_name_match"])
        self.assertTrue(res["can_proceed_to_manual_review"])
        self.assertIn("does not match", res["explanation"])

    def test_gstin_service_address_mismatch(self):
        """Active GSTIN with completely mismatched state and address."""
        res = self.gstin_service.verify(
            gstin="03PJNXS4821G1ZB",
            business_name="Saffron Bakers",
            address="Marine Drive, Nariman Point, Mumbai",
            state="Maharashtra"
        )
        self.assertEqual(res["verification_status"], "Address mismatch")
        self.assertTrue(res["gstin_exists"])
        self.assertFalse(res["field_matches"]["address_match"])
        self.assertTrue(res["can_proceed_to_manual_review"])

    def test_gstin_service_not_found(self):
        """Valid format 15-character GSTIN not in registry."""
        res = self.gstin_service.verify(
            gstin="99AABCE1234F1Z9",
            business_name="Test Enterprise"
        )
        self.assertEqual(res["verification_status"], "GSTIN not found")
        self.assertFalse(res["gstin_exists"])
        self.assertTrue(res["can_proceed_to_manual_review"])

    def test_gstin_service_invalid_format(self):
        """Invalid format GSTIN."""
        res = self.gstin_service.verify(
            gstin="INVALID_GSTIN_123"
        )
        self.assertEqual(res["verification_status"], "GSTIN not found")
        self.assertFalse(res["gstin_exists"])
        self.assertIn("Invalid GSTIN format", res["explanation"])

    # ================= UDYAM REGISTRY SERVICE TESTS =================
    def test_udyam_service_record_count(self):
        """Verify the 2,723 records are loaded and indexed properly."""
        count = len(self.udyam_service.registry)
        self.assertEqual(count, 2723)

    def test_udyam_service_valid_matching(self):
        """Valid registration number and matching enterprise name from actual records."""
        res = self.udyam_service.verify(
            udyam_number="UDYAM-KL-00-3078801",
            enterprise_name="Balaji Dental Care LLP",
            city="Kochi",
            state="Kerala"
        )
        self.assertEqual(res["verification_status"], "Verified")
        self.assertTrue(res["registration_exists"])
        self.assertEqual(res["registered_enterprise_name"], "Balaji Dental Care LLP")
        self.assertEqual(res["available_registry_details"]["enterprise_type"], "Micro")
        self.assertEqual(res["available_registry_details"]["city"], "Kochi")
        self.assertTrue(res["field_level_matching"]["udyam_format_valid"])
        self.assertTrue(res["field_level_matching"]["udyam_exists"])
        self.assertTrue(res["field_level_matching"]["enterprise_name_match"])
        self.assertFalse(res["can_proceed_to_manual_review"])

    def test_udyam_service_case_and_whitespace_normalization(self):
        """Valid registration number with case insensitivity and extra whitespace."""
        res = self.udyam_service.verify(
            udyam_number="udyam-kl-00-3078801",
            enterprise_name="  bAlAjI   dEnTaL   cArE  "
        )
        self.assertEqual(res["verification_status"], "Verified")
        self.assertTrue(res["field_level_matching"]["enterprise_name_match"])

    def test_udyam_service_name_mismatch(self):
        """Existing registration number with mismatched enterprise name."""
        res = self.udyam_service.verify(
            udyam_number="UDYAM-KL-00-3078801",
            enterprise_name="Wrong Bakery Shop"
        )
        self.assertEqual(res["verification_status"], "Enterprise name mismatch")
        self.assertTrue(res["registration_exists"])
        self.assertFalse(res["field_level_matching"]["enterprise_name_match"])
        self.assertTrue(res["can_proceed_to_manual_review"])
        self.assertIn("does not match", res["explanation"])

    def test_udyam_service_non_existent_number(self):
        """Valid format but non-existent registration number."""
        res = self.udyam_service.verify(
            udyam_number="UDYAM-XX-00-9999999",
            enterprise_name="Random Company"
        )
        self.assertEqual(res["verification_status"], "Registration not found")
        self.assertFalse(res["registration_exists"])
        self.assertTrue(res["can_proceed_to_manual_review"])
        self.assertIn("not found in the MSME registry records", res["explanation"])

    def test_udyam_service_invalid_format(self):
        """Invalid format registration number."""
        res = self.udyam_service.verify(
            udyam_number="INVALID_UDYAM_123"
        )
        self.assertEqual(res["verification_status"], "Registration not found")
        self.assertFalse(res["registration_exists"])
        self.assertFalse(res["field_level_matching"]["udyam_format_valid"])
        self.assertIn("Invalid Udyam registration format", res["explanation"])

    def test_udyam_service_empty_input(self):
        """Missing or empty registration number."""
        res = self.udyam_service.verify(
            udyam_number=""
        )
        self.assertEqual(res["verification_status"], "Incomplete information")
        self.assertFalse(res["registration_exists"])
        self.assertIn("not provided", res["explanation"])

    def test_intent_extraction(self):
        extracted = self.advisor.extract_intent_and_needs(
            "I run a clinic and need internet, cloud email and security. My budget is around 3000 per month."
        )
        self.assertIn("internet", extracted["needs"])
        self.assertIn("email", extracted["needs"])
        self.assertIn("security", extracted["needs"])
        self.assertEqual(extracted["budget"], 3000.0)

    # ================= HISTORICAL LEADS ANALYTICS TESTS =================
    def test_historical_leads_analysis_metrics(self):
        from analyze_leads import run_lead_analysis
        result = run_lead_analysis()
        self.assertEqual(result["total_records"], 5000)
        self.assertEqual(result["columns_count"], 40)
        self.assertEqual(result["financials"]["total_activated"], 368)
        self.assertAlmostEqual(result["financials"]["overall_activation_rate_pct"], 7.36, places=2)
        self.assertEqual(result["financials"]["churned_6m_count"], 56)
        self.assertAlmostEqual(result["financials"]["churn_6m_rate_pct"], 15.22, places=2)
        self.assertEqual(result["financials"]["total_acquisition_cost_inr"], 5539640.0)
        self.assertEqual(result["financials"]["total_monthly_recurring_rev_inr"], 4544990.0)
        self.assertEqual(len(result["segment_distribution"]), 4)

    def test_sqlalchemy_historical_leads_persistence(self):
        from database import SessionLocal
        import models
        db = SessionLocal()
        count = db.query(models.HistoricalLead).count()
        self.assertEqual(count, 5000)
        proto_leads = db.query(models.Lead).all()
        self.assertIsInstance(proto_leads, list)
        db.close()

if __name__ == '__main__':
    unittest.main()
