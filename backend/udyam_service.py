import os
import re
import csv
from typing import Dict, Any, Optional, Tuple, Set

UDYAM_REGEX = re.compile(r'^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$')

class LocalUdyamService:
    """
    Modular service providing offline Udyam MSME verification, validation, and registry matching
    strictly against mock_udyam_registry.csv without any external API calls.
    """
    def __init__(self, csv_path: Optional[str] = None):
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        default_path = os.path.join(base_dir, "data", "mock_udyam_registry.csv")
        self.csv_path = csv_path or (default_path if os.path.exists(default_path) else "/data/mock_udyam_registry.csv")
        self.registry: Dict[str, Dict[str, str]] = {}
        self.load_registry()

    def load_registry(self) -> int:
        """Loads and indexes the Udyam registry by normalized udyam_number key."""
        self.registry.clear()
        if not os.path.exists(self.csv_path):
            return 0
        with open(self.csv_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                udyam = (row.get('udyam_number') or '').strip().upper()
                if udyam:
                    self.registry[udyam] = {k: (v.strip() if v else '') for k, v in row.items()}
        return len(self.registry)

    @staticmethod
    def clean_text(s: str) -> str:
        """Removes punctuation and normalizes whitespace."""
        if not s:
            return ""
        cleaned = re.sub(r'[^a-zA-Z0-9\s]', ' ', s.lower())
        return ' '.join(cleaned.split())

    @staticmethod
    def extract_name_tokens(text: str) -> Set[str]:
        """Extracts significant tokens from enterprise name, filtering common corporate tags."""
        stop_words = {
            'prop', 'proprietor', 'pvt', 'ltd', 'private', 'limited', 'llp',
            'and', 'co', 'the', 'services', 'enterprises', 'company', 'corp', 'solutions', 'industries'
        }
        cleaned = re.sub(r'[^a-zA-Z0-9\s]', ' ', text.lower())
        tokens = set(cleaned.split())
        meaningful = tokens - stop_words
        return meaningful if meaningful else tokens

    def match_enterprise_name(self, submitted_name: str, registered_name: str) -> bool:
        """
        Performs case-insensitive, whitespace-normalized, and token-based matching
        between applicant's submitted enterprise name and registered enterprise name.
        """
        if not submitted_name or not submitted_name.strip():
            return True

        sub_clean = self.clean_text(submitted_name)
        reg_clean = self.clean_text(registered_name)

        if sub_clean == reg_clean:
            return True

        if sub_clean in reg_clean or reg_clean in sub_clean:
            return True

        sub_tokens = self.extract_name_tokens(submitted_name)
        reg_tokens = self.extract_name_tokens(registered_name)

        if sub_tokens.issubset(reg_tokens) or reg_tokens.issubset(sub_tokens):
            return True

        inter = len(sub_tokens.intersection(reg_tokens))
        union = len(sub_tokens.union(reg_tokens))
        if union > 0 and (inter / union) >= 0.5:
            return True

        return False

    def match_location(
        self,
        submitted_city: Optional[str],
        submitted_state: Optional[str],
        registered_city: str,
        registered_state: str
    ) -> Tuple[Optional[bool], Optional[bool]]:
        """
        Validates whether submitted city and state match registered city and state.
        Returns: (city_match, state_match)
        """
        if not submitted_city and not submitted_state:
            return None, None

        city_match: Optional[bool] = None
        if submitted_city and submitted_city.strip():
            c_sub = self.clean_text(submitted_city)
            c_reg = self.clean_text(registered_city)
            city_match = (c_sub == c_reg or c_sub in c_reg or c_reg in c_sub)

        state_match: Optional[bool] = None
        if submitted_state and submitted_state.strip():
            s_sub = self.clean_text(submitted_state)
            s_reg = self.clean_text(registered_state)
            state_match = (s_sub == s_reg or s_sub in s_reg or s_reg in s_sub)

        return city_match, state_match

    def verify(
        self,
        udyam_number: str,
        enterprise_name: Optional[str] = None,
        city: Optional[str] = None,
        state: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes comprehensive Udyam MSME lookup and field-level comparison.
        Returns structured verification outcome with detailed explanations.
        Outcomes:
          - 'Verified'
          - 'Registration not found'
          - 'Enterprise name mismatch'
          - 'Incomplete information'
          - 'Manual review required'
        """
        clean_udyam = (udyam_number or '').strip().upper()

        if not clean_udyam:
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
                "explanation": "Udyam registration number was not provided.",
                "can_proceed_to_manual_review": True
            }

        format_valid = bool(UDYAM_REGEX.match(clean_udyam))

        if clean_udyam not in self.registry:
            if not format_valid:
                return {
                    "verification_status": "Registration not found",
                    "registration_exists": False,
                    "udyam_number": clean_udyam,
                    "registered_enterprise_name": None,
                    "available_registry_details": None,
                    "field_level_matching": {
                        "udyam_format_valid": False,
                        "udyam_exists": False,
                        "enterprise_name_match": False if enterprise_name else None,
                        "city_match": False if city else None,
                        "state_match": False if state else None
                    },
                    "explanation": f"Invalid Udyam registration format '{clean_udyam}'. Must follow pattern UDYAM-XX-00-0000000.",
                    "can_proceed_to_manual_review": True
                }

            return {
                "verification_status": "Registration not found",
                "registration_exists": False,
                "udyam_number": clean_udyam,
                "registered_enterprise_name": None,
                "available_registry_details": None,
                "field_level_matching": {
                    "udyam_format_valid": True,
                    "udyam_exists": False,
                    "enterprise_name_match": False if enterprise_name else None,
                    "city_match": False if city else None,
                    "state_match": False if state else None
                },
                "explanation": f"Udyam registration number '{clean_udyam}' was not found in the MSME registry records.",
                "can_proceed_to_manual_review": True
            }

        # Found in registry
        record = self.registry[clean_udyam]
        reg_name = record.get('enterprise_name', '')
        reg_city = record.get('city', '')
        reg_state = record.get('state', '')
        reg_type = record.get('enterprise_type', '')
        reg_activity = record.get('major_activity', '')
        reg_nic = record.get('nic_description', '')
        reg_date = record.get('date_of_registration', '')

        # Match enterprise name
        name_matched = self.match_enterprise_name(enterprise_name, reg_name) if enterprise_name else True

        # Match location
        city_matched, state_matched = self.match_location(city, state, reg_city, reg_state)

        field_matches = {
            "udyam_format_valid": True,
            "udyam_exists": True,
            "enterprise_name_match": name_matched if enterprise_name else None,
            "city_match": city_matched,
            "state_match": state_matched
        }

        registry_details = {
            "enterprise_name": reg_name,
            "enterprise_type": reg_type,
            "major_activity": reg_activity,
            "nic_description": reg_nic,
            "city": reg_city,
            "state": reg_state,
            "date_of_registration": reg_date
        }

        if not name_matched:
            return {
                "verification_status": "Enterprise name mismatch",
                "registration_exists": True,
                "udyam_number": clean_udyam,
                "registered_enterprise_name": reg_name,
                "available_registry_details": registry_details,
                "field_level_matching": field_matches,
                "explanation": f"Submitted enterprise name '{enterprise_name}' does not match registered MSME name '{reg_name}'.",
                "can_proceed_to_manual_review": True
            }

        if (city_matched is False) or (state_matched is False):
            return {
                "verification_status": "Manual review required",
                "registration_exists": True,
                "udyam_number": clean_udyam,
                "registered_enterprise_name": reg_name,
                "available_registry_details": registry_details,
                "field_level_matching": field_matches,
                "explanation": f"Submitted location '{city or ''}, {state or ''}' differs from registered location '{reg_city}, {reg_state}'. Manual verification needed.",
                "can_proceed_to_manual_review": True
            }

        return {
            "verification_status": "Verified",
            "registration_exists": True,
            "udyam_number": clean_udyam,
            "registered_enterprise_name": reg_name,
            "available_registry_details": registry_details,
            "field_level_matching": field_matches,
            "explanation": f"Udyam registration is verified. Enterprise '{reg_name}' is registered as a {reg_type} enterprise ({reg_activity}) in {reg_city}, {reg_state}.",
            "can_proceed_to_manual_review": False
        }
