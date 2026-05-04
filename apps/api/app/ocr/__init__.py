"""OCR integration. Swap `extract_invoice` with the real Possibility OCR module
when available — the rest of the system uses only this function's signature.
"""
from app.ocr.extractor import extract_invoice, OcrResult

__all__ = ["extract_invoice", "OcrResult"]
