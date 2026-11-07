import os
import re
import csv
from typing import Dict, Any, Optional, Tuple, Set

GSTIN_REGEX = re.compile(r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$')

class LocalGSTINService:
    """
    Modular service providing offline GSTIN verification, validation, and registry matching
    strictly against mock_gstin_registry.csv without any external API calls.
    """
    def __init__(self, csv_path: Optional[str] = None):
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        default_path = os.path.join(base_dir, "data", "mock_gstin_registry.csv")
        self.csv_path = csv_path or (default_path if os.path.exists(default_path) else "/data/mock_gstin_registry.csv")
        self.registry: Dict[str, Dict[str, str]] = {}
        self.load_registry()

    def load_registry(self) -> int:
        """Loads and indexes the GSTIN registry by normalized GSTIN key."""
        self.registry.clear()
        if not os.path.exists(self.csv_path):
            return 0
        with open(self.csv_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                gstin = (row.get('gstin') or '').strip().upper()
                if gstin:
                    self.registry[gstin] = {k: (v.strip() if v else '') for k, v in row.items()}
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
        """Extracts significant tokens from business name, filtering common corporate tags."""
        stop_words = {
            'prop', 'proprietor', 'pvt', 'ltd', 'private', 'limited', 'llp',
            'and', 'co', 'the', 'services', 'enterprises', 'company', 'corp'
        }
        cleaned = re.sub(r'[^a-zA-Z0-9\s]', ' ', text.lower())
        tokens = set(cleaned.split())
        meaningful = tokens - stop_words
        return meaningful if meaningful else tokens

    def match_business_name(self, submitted_name: str, legal_name: str, trade_name: str) -> bool:
        """
        Performs case-insensitive, whitespace-normalized, and token-based matching
        between the applicant's submitted business name and the registry's legal & trade names.
        """
        if not submitted_name or not submitted_name.strip():
            return True

        sub_clean = self.clean_text(submitted_name)
        legal_clean = self.clean_text(legal_name)
        trade_clean = self.clean_text(trade_name)

        # Exact normalized match
        if sub_clean == legal_clean or sub_clean == trade_clean:
            return True

        # Check direct substring containment
        if sub_clean in legal_clean or sub_clean in trade_clean:
            return True
        if trade_clean and trade_clean in sub_clean:
            return True

        # Token set overlap
        sub_tokens = self.extract_name_tokens(submitted_name)
        legal_tokens = self.extract_name_tokens(legal_name)
        trade_tokens = self.extract_name_tokens(trade_name)

        if sub_tokens.issubset(legal_tokens) or sub_tokens.issubset(trade_tokens):
            return True
        if trade_tokens and trade_tokens.issubset(sub_tokens):
            return True
        if legal_tokens and legal_tokens.issubset(sub_tokens):
            return True

        # Jaccard overlap threshold (>= 0.5)
        if trade_tokens:
            inter_trade = len(sub_tokens.intersection(trade_tokens))
            union_trade = len(sub_tokens.union(trade_tokens))
            if union_trade > 0 and (inter_trade / union_trade) >= 0.5:
                return True

        if legal_tokens:
            inter_legal = len(sub_tokens.intersection(legal_tokens))
            union_legal = len(sub_tokens.union(legal_tokens))
            if union_legal > 0 and (inter_legal / union_legal) >= 0.5:
                return True

        return False

    def match_address(
        self,
        submitted_address: Optional[str],
        submitted_state: Optional[str],
        registered_address: str,
        registered_state: str
    ) -> Tuple[Optional[bool], Optional[bool]]:
        """
        Validates whether submitted address and state correspond to the registered address.
        Returns: (state_match, address_match)
        """
        if not submitted_address and not submitted_state:
            return None, None

        state_match: Optional[bool] = None
        if submitted_state and submitted_state.strip():
            state_match = (submitted_state.strip().lower() == registered_state.strip().lower())
        elif submitted_address:
            # Check if registered state appears in submitted address
            reg_state_tokens = set(registered_state.lower().split())
            sub_addr_tokens = set(re.sub(r'[^a-zA-Z0-9\s]', ' ', submitted_address.lower()).split())
            if reg_state_tokens.issubset(sub_addr_tokens):
                state_match = True

        address_match: Optional[bool] = None
        if submitted_address and submitted_address.strip():
            sub_clean = re.sub(r'[^a-zA-Z0-9\s]', ' ', submitted_address.lower())
            reg_clean = re.sub(r'[^a-zA-Z0-9\s]', ' ', registered_address.lower())

            address_stop_words = {'shop', 'unit', 'road', 'street', 'no', 'floor', 'plot', 'near', 'opp', 'opposite', 'india'}
            sub_tokens = set(sub_clean.split()) - address_stop_words
            reg_tokens = set(reg_clean.split()) - address_stop_words

            inter = sub_tokens.intersection(reg_tokens)
            # If state explicitly mismatched, address is mismatched
            if state_match is False:
                address_match = False
            elif len(inter) > 0:
                address_match = True
            else:
                address_match = False

        return state_match, address_match

    def verify(
        self,
        gstin: str,
        business_name: Optional[str] = None,
        address: Optional[str] = None,
        state: Optional[str] = None,
        constitution: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes comprehensive GSTIN lookup, status checking, and field-level comparison.
        Returns structured verification outcome with detailed explanations.
        """
        clean_gst = (gstin or '').strip().upper()

        # Format validation
        format_valid = bool(GSTIN_REGEX.match(clean_gst))

        if clean_gst not in self.registry:
            if not format_valid:
                return {
                    "verification_status": "GSTIN not found",
                    "gstin_exists": False,
                    "gstin": clean_gst,
                    "registered_business_name": None,
                    "trade_name": None,
                    "legal_name": None,
                    "constitution": None,
                    "registered_address": None,
                    "state": None,
                    "registration_date": None,
                    "registration_status": None,
                    "field_matches": {
                        "gstin_match": False,
                        "business_name_match": False if business_name else None,
                        "address_match": False if address else None,
                        "state_match": False if state else None,
                        "status_active": False
                    },
                    "explanation": f"Invalid GSTIN format '{clean_gst}'. GSTIN must be a 15-character alphanumeric identifier.",
                    "can_proceed_to_manual_review": True
                }

            return {
                "verification_status": "GSTIN not found",
                "gstin_exists": False,
                "gstin": clean_gst,
                "registered_business_name": None,
                "trade_name": None,
                "legal_name": None,
                "constitution": None,
                "registered_address": None,
                "state": None,
                "registration_date": None,
                "registration_status": None,
                "field_matches": {
                    "gstin_match": False,
                    "business_name_match": False if business_name else None,
                    "address_match": False if address else None,
                    "state_match": False if state else None,
                    "status_active": False
                },
                "explanation": f"GSTIN '{clean_gst}' was not found in the local GST registry. Desk verification or physical invoice required.",
                "can_proceed_to_manual_review": True
            }

        # Record exists in registry
        record = self.registry[clean_gst]
        reg_legal_name = record.get('legal_name', '')
        reg_trade_name = record.get('trade_name', '')
        reg_constitution = record.get('constitution', '')
        reg_address = record.get('principal_place_of_business', '')
        reg_state = record.get('state', '')
        reg_date = record.get('registration_date', '')
        reg_status = record.get('status', 'Active')

        # Status check
        is_active = (reg_status.lower() == 'active')
        if reg_status.lower() == 'cancelled':
            return {
                "verification_status": "Cancelled",
                "gstin_exists": True,
                "gstin": clean_gst,
                "registered_business_name": reg_legal_name,
                "trade_name": reg_trade_name,
                "legal_name": reg_legal_name,
                "constitution": reg_constitution,
                "registered_address": reg_address,
                "state": reg_state,
                "registration_date": reg_date,
                "registration_status": "Cancelled",
                "field_matches": {
                    "gstin_match": True,
                    "business_name_match": self.match_business_name(business_name, reg_legal_name, reg_trade_name) if business_name else None,
                    "address_match": None,
                    "state_match": None,
                    "status_active": False
                },
                "explanation": f"GSTIN {clean_gst} registration was cancelled by authorities on/after {reg_date}. Services cannot be provisioned.",
                "can_proceed_to_manual_review": True
            }

        if reg_status.lower() == 'suspended':
            return {
                "verification_status": "Suspended",
                "gstin_exists": True,
                "gstin": clean_gst,
                "registered_business_name": reg_legal_name,
                "trade_name": reg_trade_name,
                "legal_name": reg_legal_name,
                "constitution": reg_constitution,
                "registered_address": reg_address,
                "state": reg_state,
                "registration_date": reg_date,
                "registration_status": "Suspended",
                "field_matches": {
                    "gstin_match": True,
                    "business_name_match": self.match_business_name(business_name, reg_legal_name, reg_trade_name) if business_name else None,
                    "address_match": None,
                    "state_match": None,
                    "status_active": False
                },
                "explanation": f"GSTIN {clean_gst} is currently suspended due to pending returns or compliance review. Order cannot be completed automatically.",
                "can_proceed_to_manual_review": True
            }

        # Compare submitted business name
        name_matched = self.match_business_name(business_name, reg_legal_name, reg_trade_name) if business_name else True

        # Compare submitted address & state
        state_matched, addr_matched = self.match_address(address, state, reg_address, reg_state)

        # Field match dictionary
        field_matches = {
            "gstin_match": True,
            "business_name_match": name_matched if business_name else None,
            "address_match": addr_matched,
            "state_match": state_matched,
            "status_active": is_active
        }

        # Determine final status
        if not name_matched:
            return {
                "verification_status": "Business name mismatch",
                "gstin_exists": True,
                "gstin": clean_gst,
                "registered_business_name": reg_legal_name,
                "trade_name": reg_trade_name,
                "legal_name": reg_legal_name,
                "constitution": reg_constitution,
                "registered_address": reg_address,
                "state": reg_state,
                "registration_date": reg_date,
                "registration_status": reg_status,
                "field_matches": field_matches,
                "explanation": f"Submitted name '{business_name}' does not match registered legal name '{reg_legal_name}' or trade name '{reg_trade_name}'.",
                "can_proceed_to_manual_review": True
            }

        if addr_matched is False or state_matched is False:
            return {
                "verification_status": "Address mismatch",
                "gstin_exists": True,
                "gstin": clean_gst,
                "registered_business_name": reg_legal_name,
                "trade_name": reg_trade_name,
                "legal_name": reg_legal_name,
                "constitution": reg_constitution,
                "registered_address": reg_address,
                "state": reg_state,
                "registration_date": reg_date,
                "registration_status": reg_status,
                "field_matches": field_matches,
                "explanation": f"Submitted location '{address or state}' does not match registered principal place of business: '{reg_address}'.",
                "can_proceed_to_manual_review": True
            }

        # If everything matches and status is active
        return {
            "verification_status": "Verified",
            "gstin_exists": True,
            "gstin": clean_gst,
            "registered_business_name": reg_legal_name,
            "trade_name": reg_trade_name,
            "legal_name": reg_legal_name,
            "constitution": reg_constitution,
            "registered_address": reg_address,
            "state": reg_state,
            "registration_date": reg_date,
            "registration_status": "Active",
            "field_matches": field_matches,
            "explanation": "GSTIN is Active and verified. Business identity and address match official GST registry records.",
            "can_proceed_to_manual_review": False
        }
