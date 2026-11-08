"""Catalogue-driven recommendation engine for Udyam360.

Prices are estimates using the catalogue's lower monthly price bound. The
engine never recommends a product that fails the supplied eligibility checks.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple


SEGMENT_ALIASES = {
    "micro retail": "micro",
    "retail": "micro",
    "shop": "micro",
    "store": "micro",
    "small retail": "micro",
    "professional office": "prof",
    "professional": "prof",
    "clinic": "prof",
    "healthcare": "prof",
    "office": "prof",
    "small multi-site business": "multi",
    "multi-site": "multi",
    "multisite": "multi",
    "multi site": "multi",
    "small manufacturer": "mfg",
    "manufacturing": "mfg",
    "manufacturer": "mfg",
    "factory": "mfg",
}

NEED_PRODUCT_CANDIDATES = {
    "internet": ["P01", "P02", "P03", "P04", "P05", "P06"],
    "email": ["P16"],
    "security": ["P20", "P21"],
    "voice": ["P07", "P08", "P12", "P13"],
    "storage": ["P17"],
    "iot": ["P19", "P22", "P23", "P24", "P25"],
    # CCTV is deliberately separate from generic IoT so a camera request
    # cannot be satisfied by an unrelated tracker, sensor, or POS product.
    "cctv": [],
}

NEED_LABELS = {
    "internet": "business internet",
    "email": "business email and productivity",
    "security": "endpoint and network security",
    "voice": "business calling and communication",
    "storage": "cloud backup and storage",
    "iot": "business operations and connected devices",
    "cctv": "CCTV and video surveillance",
}


class DeterministicAdvisor:
    def __init__(self, products_map: Dict[str, Any]):
        self.products = products_map or {}

    def _segment_code(self, category: Optional[str]) -> str:
        value = (category or "").strip().lower()
        for alias, code in SEGMENT_ALIASES.items():
            if alias in value:
                return code
        if value in {"micro", "prof", "multi", "mfg"}:
            return value
        return "prof"

    @staticmethod
    def _tier_number(city_tier: Optional[str]) -> Optional[str]:
        if city_tier is None or str(city_tier).strip() == "":
            return None
        value = str(city_tier).strip().lower().replace("tier", "").strip()
        return value if value in {"1", "2", "3"} else None

    @staticmethod
    def _truthy(value: Any) -> bool:
        if isinstance(value, bool):
            return value
        return str(value).strip().lower() in {"1", "true", "yes", "y"}

    def _quantity(self, product: Dict[str, Any], employees: int, sites: int) -> int:
        unit = str(product.get("price_unit", product.get("unit", ""))).lower()
        if "per user" in unit or "per device" in unit or "per line" in unit:
            return max(1, employees)
        if "per site" in unit:
            return max(1, sites)
        return 1

    def _eligible(
        self,
        product: Dict[str, Any],
        employees: int,
        sites: int,
        city_tier: Optional[str],
        gstin_available: bool,
    ) -> Tuple[bool, List[str]]:
        reasons: List[str] = []
        min_employees = int(product.get("min_employees", 1) or 1)
        min_sites = int(product.get("min_sites", 1) or 1)
        if employees < min_employees:
            reasons.append(f"Requires at least {min_employees} employees")
        if sites < min_sites:
            reasons.append(f"Requires at least {min_sites} business sites")
        if self._truthy(product.get("gstin_required", False)) and not gstin_available:
            reasons.append("Requires GSTIN")

        allowed_tiers = product.get("city_tiers", product.get("available_city_tiers", ""))
        tier = self._tier_number(city_tier)
        if tier and allowed_tiers:
            allowed = {x.strip() for x in str(allowed_tiers).replace(",", ";").split(";") if x.strip()}
            if allowed and tier not in allowed:
                reasons.append(f"Not listed for Tier {tier} cities")
        return not reasons, reasons

    def _product_score(
        self, product: Dict[str, Any], segment: str, need: str,
        employees: int = 1, sites: int = 1
    ) -> Tuple[int, float]:
        targets_raw = product.get("target_segments", "")
        targets = {x.strip().lower() for x in str(targets_raw).replace(",", ";").split(";") if x.strip()}
        segment_bonus = 20 if segment in targets else 0
        unit_price = float(product.get("monthly_price", product.get("price_min_inr_per_month", 0)) or 0)
        estimated_total = unit_price * self._quantity(product, employees, sites)
        return segment_bonus, estimated_total

    def _candidates_for_need(self, need: str) -> List[Dict[str, Any]]:
        """Resolve CCTV products from catalogue text instead of assuming IDs."""
        if need != "cctv":
            return [
                self.products[pid]
                for pid in NEED_PRODUCT_CANDIDATES.get(need, [])
                if pid in self.products
            ]

        matches = []
        for product in self.products.values():
            searchable = " ".join([
                str(product.get("product_name", "")),
                str(product.get("description", "")),
                str(product.get("category", "")),
                str(product.get("features", "")),
            ]).lower()
            if any(term in searchable for term in (
                "cctv", "surveillance", "security camera",
                "video monitoring", "camera system", "camera pack"
            )):
                matches.append(product)
        return matches

    def extract_intent_and_needs(self, message: str) -> Dict[str, Any]:
        """Small deterministic fallback parser; the LLM remains the primary extractor."""
        lower = (message or "").lower()
        needs: List[str] = []
        patterns = {
            "internet": ["internet", "broadband", "wifi", "wi-fi", "network", "इंटरनेट", "नेट"],
            "email": ["email", "e-mail", "workspace", "business mail", "ईमेल"],
            "security": ["security", "antivirus", "firewall", "ransomware", "सुरक्षा"],
            "voice": ["business mobile line", "mobile line", "mobile connection", "mobile connections", "postpaid", "business sim", "employee sim", "employee phone line", "calling", "ivr", "toll free", "फोन", "कॉल"],
            "storage": ["backup", "cloud backup", "online storage", "file storage", "drive storage", "स्टोरेज", "बैकअप"],
            "cctv": ["cctv", "camera", "surveillance", "video monitoring", "कैमरा"],
            "iot": ["tracker", "gps", "iot", "pos", "billing", "machine", "sensor"],
        }
        for need, words in patterns.items():
            if need == "iot":
                import re as _re
                matched = any(_re.search(r"\b" + _re.escape(word) + r"\b", lower) for word in ("gps", "iot", "pos")) or any(word in lower for word in ("tracker", "billing", "machine", "sensor", "asset tracking", "energy monitor"))
            else:
                matched = any(word in lower for word in words)
            if matched:
                needs.append(need)

        budget = None
        import re
        match = re.search(r"(?:rs\.?|inr|₹|budget|around|under|within)\s*([\d,]+)", lower)
        if not match:
            match = re.search(r"([\d,]+)\s*(?:per\s*month|/month|pm|rupees|रुपये)", lower)
        if match:
            try:
                budget = float(match.group(1).replace(",", ""))
            except ValueError:
                pass

        emp_match = re.search(r"(\d+)\s*(?:employees|staff|people|workers|team members|कर्मचारी)", lower)
        if not emp_match:
            emp_match = re.search(r"(\d+)\s*(?:separate\s+)?(?:business\s+)?(?:mobile\s+)?(?:connections?|lines|sims)", lower)
        employees = int(emp_match.group(1)) if emp_match else None
        if employees is None:
            word_match = re.search(r"\b(one|two|three|four|five|six|seven|eight|nine|ten)\b(?:\s+\w+){0,5}\s+(?:mobile\s+)?(?:connections?|lines|sims)\b", lower)
            word_numbers = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10}
            if word_match:
                employees = word_numbers[word_match.group(1)]
        return {"needs": needs, "budget": budget, "employees": employees}

    def recommend_bundle(
        self,
        category: str,
        budget: float,
        employees: int = 5,
        requested_needs: Optional[List[str]] = None,
        city_tier: Optional[str] = None,
        gstin_available: bool = False,
        sites: int = 1,
    ) -> Dict[str, Any]:
        """Build a need-led product set that respects eligibility and budget."""
        if not self.products:
            raise ValueError("Product catalogue is empty. Check data/product_catalogue.csv.")
        if budget <= 0:
            raise ValueError("Monthly budget must be greater than zero.")

        segment = self._segment_code(category)
        employees = max(1, int(employees or 1))
        sites = max(1, int(sites or 1))
        needs = list(dict.fromkeys(n for n in (requested_needs or []) if n in NEED_PRODUCT_CANDIDATES))

        chosen: List[Dict[str, Any]] = []
        chosen_ids = set()
        rejected: Dict[str, List[str]] = {}
        unmet_needs: List[str] = []
        warnings: List[str] = []
        monthly_total = 0.0
        setup_total = 0.0
        max_contract = 1

        # Internet is selected first so dependent products can be checked against it.
        ordered_needs = sorted(needs, key=lambda n: (n != "internet", needs.index(n)))
        for need in ordered_needs:
            candidates = []
            for product in self._candidates_for_need(need):
                pid = str(product.get("id") or product.get("product_id"))
                eligible, why_not = self._eligible(
                    product, employees, sites, city_tier, gstin_available
                )
                if not eligible:
                    rejected[pid] = why_not
                    continue
                candidates.append(product)

            if not candidates:
                unmet_needs.append(need)
                warnings.append(f"No catalogue product currently meets the eligibility rules for {NEED_LABELS[need]}.")
                continue

            candidates.sort(key=lambda p: (-self._product_score(p, segment, need, employees, sites)[0], self._product_score(p, segment, need, employees, sites)[1]))
            # A segment-fit candidate is preferred, then the lowest monthly floor.
            best = candidates[0]
            quantity = self._quantity(best, employees, sites)
            unit_price = float(best.get("monthly_price", 0) or 0)
            line_monthly = unit_price * quantity
            line_setup = float(best.get("setup_fee", 0) or 0) * quantity

            # Respect the budget. Do not silently return an over-budget bundle.
            if monthly_total + line_monthly > budget:
                affordable = [p for p in candidates if monthly_total + float(p.get("monthly_price", 0) or 0) * self._quantity(p, employees, sites) <= budget]
                if affordable:
                    affordable.sort(key=lambda p: (-self._product_score(p, segment, need, employees, sites)[0], self._product_score(p, segment, need, employees, sites)[1]))
                    best = affordable[0]
                    quantity = self._quantity(best, employees, sites)
                    unit_price = float(best.get("monthly_price", 0) or 0)
                    line_monthly = unit_price * quantity
                    line_setup = float(best.get("setup_fee", 0) or 0) * quantity
                else:
                    unmet_needs.append(need)
                    warnings.append(f"{NEED_LABELS[need].capitalize()} was not added because the available option exceeds the remaining monthly budget.")
                    continue

            pid = str(best.get("id") or best.get("product_id"))
            if pid in chosen_ids:
                continue

            # Enforce requires_one_of dependencies by adding a compatible base connection.
            dependencies = best.get("dependencies", "") or ""
            required_ids = [x.strip() for x in str(dependencies).replace(",", "|").split("|") if x.strip()]
            if required_ids and not any(dep in chosen_ids for dep in required_ids):
                dependency_candidates = []
                for dep_id in required_ids:
                    dep = self.products.get(dep_id)
                    if not dep:
                        continue
                    dep_ok, _ = self._eligible(dep, employees, sites, city_tier, gstin_available)
                    if dep_ok:
                        dep_qty = self._quantity(dep, employees, sites)
                        dep_cost = float(dep.get("monthly_price", 0) or 0) * dep_qty
                        if monthly_total + dep_cost + line_monthly <= budget:
                            dependency_candidates.append((dep, dep_qty, dep_cost))
                if not dependency_candidates:
                    unmet_needs.append(need)
                    warnings.append(f"{best.get('product_name')} requires a compatible base connection, which could not be added within the budget or eligibility limits.")
                    continue
                dependency_candidates.sort(key=lambda item: (-self._product_score(item[0], segment, "internet", employees, sites)[0], self._product_score(item[0], segment, "internet", employees, sites)[1]))
                dep, dep_qty, dep_cost = dependency_candidates[0]
                dep_id = str(dep.get("id") or dep.get("product_id"))
                if dep_id not in chosen_ids:
                    dep_setup = float(dep.get("setup_fee", 0) or 0) * dep_qty
                    chosen.append({
                        "id": dep_id,
                        "quantity": dep_qty,
                        "unit": dep.get("price_unit", dep.get("unit", "unit")),
                        "unit_price": float(dep.get("monthly_price", 0) or 0),
                        "monthly_cost": dep_cost,
                        "setup_cost": dep_setup,
                        "contract_months": int(dep.get("contract_months", 1) or 1),
                    })
                    chosen_ids.add(dep_id)
                    monthly_total += dep_cost
                    setup_total += dep_setup
                    max_contract = max(max_contract, int(dep.get("contract_months", 1) or 1))

            chosen.append({
                "id": pid,
                "quantity": quantity,
                "unit": best.get("price_unit", best.get("unit", "unit")),
                "unit_price": unit_price,
                "monthly_cost": line_monthly,
                "setup_cost": line_setup,
                "contract_months": int(best.get("contract_months", 1) or 1),
            })
            chosen_ids.add(pid)
            monthly_total += line_monthly
            setup_total += line_setup
            max_contract = max(max_contract, int(best.get("contract_months", 1) or 1))

        if not chosen:
            warnings.append("No eligible products could be selected within the supplied budget. Increase the budget or review business eligibility details.")

        selected_names = [self.products[item["id"]].get("product_name", item["id"]) for item in chosen]
        reasons = [f"Selected {len(chosen)} catalogue product(s) for the {category or 'business'} segment."]
        if chosen:
            reasons.append("Monthly estimates use the catalogue's minimum listed price; final pricing may vary within the published range.")
        if monthly_total <= budget:
            reasons.append(f"Estimated monthly total {monthly_total:,.0f} INR is within the {budget:,.0f} INR budget.")
        if unmet_needs:
            reasons.append("Some requested needs remain uncovered because of budget or eligibility constraints.")

        return {
            "bundle_name": f"Udyam360 {category or 'Business'} Solution",
            "tagline": "A needs-based selection from the supplied product catalogue, adjusted for eligibility and budget.",
            "recommended_product_ids": [item["id"] for item in chosen],
            "product_quantities": {item["id"]: item["quantity"] for item in chosen},
            "product_costs": {item["id"]: item for item in chosen},
            "monthly_cost": round(monthly_total, 2),
            "setup_cost": round(setup_total, 2),
            "contract_months": max_contract,
            "why_recommended": reasons,
            "eligibility_warnings": warnings,
            "category_fit": category or "General MSME",
            "unmet_needs": list(dict.fromkeys(unmet_needs)),
            "budget": float(budget),
            # An empty bundle is not a successful budget fit.
            "budget_fit": bool(chosen) and monthly_total <= budget,
            "selected_product_names": selected_names,
            "rejected_products": rejected,
        }

    def generate_chat_response(self, message: str, profile_data: Optional[Dict[str, Any]] = None, history_len: int = 0) -> Dict[str, Any]:
        profile_data = profile_data or {}
        extracted = self.extract_intent_and_needs(message)
        category = profile_data.get("business_category") or "Professional Office"
        budget = extracted.get("budget") or profile_data.get("monthly_budget") or 3000.0
        employees = extracted.get("employees") or profile_data.get("number_of_employees") or 5
        needs = extracted.get("needs") or []
        if needs or history_len >= 2:
            recommendation = self.recommend_bundle(
                category=category,
                budget=float(budget),
                employees=int(employees),
                requested_needs=needs,
                city_tier=profile_data.get("city_tier"),
                gstin_available=bool(profile_data.get("gstin_available", False)),
                sites=int(profile_data.get("number_of_locations") or 1),
            )
            return {
                "reply": "I have prepared a catalogue-based option using your stated needs, budget and eligibility details.",
                "next_question": "Would you like to review the itemised breakdown?",
                "recommendation": recommendation,
                "is_recommendation_ready": bool(recommendation.get("recommended_product_ids")),
            }
        return {
            "reply": "I can help match your business with products from the catalogue.",
            "next_question": "What are your main requirements, employee count and approximate monthly budget?",
            "recommendation": None,
            "is_recommendation_ready": False,
        }
