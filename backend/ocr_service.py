import os
import re
import csv
from typing import Dict, Any, Optional

GSTIN_REGEX = re.compile(r'\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})\b')
UDYAM_REGEX = re.compile(r'\b(UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7})\b', re.I)

class LocalKycVerificationService:
    """Local OCR + registry helpers. Never fabricates identifiers or OCR text."""
    def __init__(self, gstin_csv_path: Optional[str] = None, udyam_csv_path: Optional[str] = None):
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        gstin_path = gstin_csv_path or os.path.join(base_dir, "data", "mock_gstin_registry.csv")
        udyam_path = udyam_csv_path or os.path.join(base_dir, "data", "mock_udyam_registry.csv")
        self.gstin_registry: Dict[str, Dict[str, Any]] = {}
        self.udyam_registry: Dict[str, Dict[str, Any]] = {}
        self.load_registries(gstin_path, udyam_path)

    def load_registries(self, gstin_path: str, udyam_path: str):
        if os.path.exists(gstin_path):
            with open(gstin_path, encoding="utf-8-sig", newline="") as f:
                for row in csv.DictReader(f):
                    key = (row.get("gstin") or "").strip().upper()
                    if key: self.gstin_registry[key] = row
        if os.path.exists(udyam_path):
            with open(udyam_path, encoding="utf-8-sig", newline="") as f:
                for row in csv.DictReader(f):
                    key = (row.get("udyam_number") or "").strip().upper()
                    if key: self.udyam_registry[key] = row

    def extract_from_file(self, path: str, original_filename: str = "") -> Dict[str, Any]:
        """Run Tesseract locally. Missing OCR dependencies return manual review."""
        try:
            import pytesseract
            from PIL import Image, ImageOps, ImageEnhance, ImageFilter
        except ImportError:
            return {"gstin": None, "udyam": None, "confidence": 0.0,
                    "extracted_text": "", "ocr_status": "manual_review",
                    "message": "Pillow/pytesseract is not installed"}
        try:
            if path.lower().endswith(".pdf"):
                try:
                    from pdf2image import convert_from_path
                    pages = convert_from_path(path, first_page=1, last_page=2)
                    if not pages:
                        raise ValueError("No PDF pages could be rendered")
                    images = pages
                except Exception as exc:
                    return {"gstin": None, "udyam": None, "confidence": 0.0,
                            "extracted_text": "", "ocr_status": "manual_review",
                            "message": f"PDF OCR unavailable: {type(exc).__name__}"}
            else:
                images = [Image.open(path)]
            texts = []
            for image in images:
                image = ImageOps.exif_transpose(image).convert("L")
                image = ImageOps.autocontrast(image)
                image = image.filter(ImageFilter.SHARPEN)
                image = ImageEnhance.Contrast(image).enhance(1.4)
                texts.append(pytesseract.image_to_string(image, config="--psm 6"))
            text = "\n".join(texts).strip()
            upper = text.upper()
            gst = GSTIN_REGEX.search(upper)
            udyam = UDYAM_REGEX.search(upper)
            confidence = 0.85 if text else 0.0
            return {"gstin": gst.group(1) if gst else None,
                    "udyam": udyam.group(1).upper() if udyam else None,
                    "confidence": confidence, "extracted_text": text,
                    "ocr_status": "extracted" if (gst or udyam) else "manual_review",
                    "message": "Identifier extracted by local OCR" if (gst or udyam) else "No supported registration identifier was confidently extracted"}
        except Exception as exc:
            return {"gstin": None, "udyam": None, "confidence": 0.0,
                    "extracted_text": "", "ocr_status": "manual_review",
                    "message": f"OCR failed: {type(exc).__name__}"}

    def parse_text_or_file(self, text_content: str, filename: str) -> Dict[str, Any]:
        # Compatibility helper for existing callers; text must be genuinely supplied.
        upper = (text_content or "").upper()
        gst = GSTIN_REGEX.search(upper)
        udyam = UDYAM_REGEX.search(upper)
        return {"gstin": gst.group(1) if gst else None,
                "udyam": udyam.group(1) if udyam else None,
                "confidence": 0.85 if text_content else 0.0,
                "extracted_text": text_content or "",
                "ocr_status": "extracted" if (gst or udyam) else "manual_review"}

    def verify_gstin(self, gstin: Optional[str], business_name: str) -> Dict[str, Any]:
        if not gstin: return {"status": "Missing", "valid": False, "message": "No GSTIN supplied"}
        key = gstin.strip().upper()
        row = self.gstin_registry.get(key)
        if not row: return {"status": "NotFound", "valid": False, "message": "GSTIN not found in supplied mock registry; manual review required"}
        state = (row.get("status") or "Unknown").strip()
        if state.lower() == "active":
            return {"status": "Active", "valid": True, "legal_name": row.get("legal_name"), "trade_name": row.get("trade_name"), "address": row.get("principal_place_of_business") or row.get("address"), "message": "GSTIN record found with Active status in mock registry; document authenticity is not established."}
        return {"status": state, "valid": False, "legal_name": row.get("legal_name"), "message": f"GSTIN registry status is {state}; manual review required"}

    def verify_udyam(self, udyam: Optional[str], business_name: str) -> Dict[str, Any]:
        if not udyam: return {"status": "Missing", "valid": False, "message": "No Udyam number supplied"}
        row = self.udyam_registry.get(udyam.strip().upper())
        if not row: return {"status": "NotFound", "valid": False, "message": "Udyam number not found in supplied mock registry; manual review required"}
        return {"status": "FoundInMockRegistry", "valid": True, "enterprise_name": row.get("enterprise_name"), "message": "Udyam record found in mock registry; document authenticity is not established."}
