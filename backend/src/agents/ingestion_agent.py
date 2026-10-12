"""
Termsheet Ingestion Agent for AGRIMA.
Complies with Constitution Principle I (Zero-Retention) & Principle II (Anonymized Extraction).
Handles:
1. Fast PDF password/encryption pre-check
2. Text/image extraction via PyPDF and Gemini 2.5 Flash multimodal OCR with 3-retry backoff
3. Rigorous institutional and client PII scrubbing
4. Non-financial document rejection detection
"""
import io
import os
import re
import time
import logging
from typing import Tuple, Optional
from pypdf import PdfReader
from pypdf.errors import FileNotDecryptedError
from backend.src.agents.llm_client import get_gemini_api_key

logger = logging.getLogger("agrima.ingestion")

# Common institutional entities to scrub
INSTITUTIONAL_PATTERNS = [
    r"(?i)\b(Goldman\s+Sachs(?:\s+International)?(?:\s+Group)?(?:\s+Bank)?)\b",
    r"(?i)\b(Morgan\s+Stanley(?:\s+&\s+Co\.?)?(?:\s+International)?)\b",
    r"(?i)\b(Barclays(?:\s+Bank)?(?:\s+PLC)?(?:\s+Capital)?)\b",
    r"(?i)\b(BNP\s+Paribas(?:\s+Arbitrage\s+Snc)?(?:\s+SA)?)\b",
    r"(?i)\b(UBS(?:\s+AG)?(?:\s+Investment\s+Bank)?)\b",
    r"(?i)\b(Citigroup(?:\s+Global\s+Markets)?|Citibank)\b",
    r"(?i)\b(JPMorgan(?:\s+Chase)?(?:\s+Bank)?(?:\s+&\s+Co\.)?)\b",
    r"(?i)\b(Credit\s+Suisse(?:\s+AG)?)\b",
    r"(?i)\b(HSBC(?:\s+Bank)?(?:\s+USA)?(?:\s+PLC)?)\b",
    r"(?i)\b(Deutsche\s+Bank(?:\s+AG)?)\b",
    r"(?i)\b(Societe\s+Generale)\b",
    r"(?i)\b(Standard\s+Chartered(?:\s+Bank)?)\b",
    r"(?i)\b(Nomura(?:\s+International)?(?:\s+PLC)?)\b",
    r"(?i)\b(DBS\s+Bank(?:\s+Ltd)?)\b",
    r"(?i)\b(Bank\s+of\s+America(?:\s+Merrill\s+Lynch)?)\b",
]

# Client PII patterns
PII_PATTERNS = [
    (r"(?i)(Client\s+Name\s*:\s*)([^\n\r]+)", r"\1[REDACTED_CLIENT]"),
    (r"(?i)(Account\s+Holder\s*:\s*)([^\n\r]+)", r"\1[REDACTED_CLIENT]"),
    (r"(?i)(Client\s+Account\s*:\s*)([^\n\r]+)", r"\1[REDACTED_ACCOUNT]"),
    (r"(?i)(Account\s+Number\s*:\s*)([^\n\r]+)", r"\1[REDACTED_ACCOUNT]"),
    (r"(?i)\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", "[REDACTED_EMAIL]"),
    (r"(?i)(?:\+\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b", "[REDACTED_PHONE]"),
    (r"(?i)\bAC-\d{3,6}-\d{2,6}\b", "[REDACTED_ACCOUNT]"),
]

FINANCIAL_KEYWORDS = [
    "strike", "barrier", "coupon", "autocall", "knock-in", "knock-out",
    "notional", "tenor", "maturity", "yield", "underlying", "currency",
    "dci", "fcn", "settlement", "fixing", "dual currency", "participation"
]

def check_pdf_encrypted(data: bytes) -> bool:
    """Detects whether a PDF file is encrypted or password-protected."""
    try:
        stream = io.BytesIO(data)
        reader = PdfReader(stream)
        return bool(reader.is_encrypted)
    except FileNotDecryptedError:
        return True
    except Exception:
        # Fallback inspection of raw PDF bytes for /Encrypt dictionary
        return b"/Encrypt" in data[:4096] or b"/Encrypt" in data[-4096:]

def redact_pii_and_institutions(text: str) -> str:
    """Scrubs all institutional names, broker-dealers, client identities, and contact PII."""
    scrubbed = text

    # Redact institutional names
    for pattern in INSTITUTIONAL_PATTERNS:
        scrubbed = re.sub(pattern, "[REDACTED_INSTITUTION]", scrubbed)

    # Redact client details and PII
    for pattern, replacement in PII_PATTERNS:
        scrubbed = re.sub(pattern, replacement, scrubbed)

    return scrubbed

def is_financial_termsheet(text: str) -> bool:
    """Determines whether text corresponds to structured financial products."""
    text_lower = text.lower()
    matches = sum(1 for kw in FINANCIAL_KEYWORDS if kw in text_lower)
    return matches >= 2


class TermsheetIngestionAgent:
    """Agent responsible for ingesting, decrypting checks, OCR processing, and sanitizing documents."""

    def __init__(self):
        pass

    def process_document(self, file_bytes: bytes, filename: str) -> Tuple[bool, Optional[str], Optional[str], Optional[str]]:
        """
        Processes uploaded document bytes.
        Returns: (is_success, sanitized_text, error_code, guidance_msg)
        """
        # 1. Password/Encryption Pre-check
        is_pdf = filename.lower().endswith(".pdf") or file_bytes[:4] == b"%PDF"
        if is_pdf and check_pdf_encrypted(file_bytes):
            logger.warning(f"File {filename} rejected: Password-protected or encrypted PDF.")
            return (
                False,
                None,
                "ENCRYPTED_PDF",
                "Password-protected or encrypted PDFs cannot be read. Please upload an unencrypted document or export an unlocked PDF."
            )

        # 2. Extract text from PDF or image
        raw_text = ""
        if is_pdf:
            try:
                reader = PdfReader(io.BytesIO(file_bytes))
                pages_text = []
                for page in reader.pages:
                    txt = page.extract_text() or ""
                    pages_text.append(txt)
                raw_text = "\n".join(pages_text).strip()
            except Exception as e:
                logger.error(f"Error reading PDF text: {e}")
                raw_text = ""

        # If text is empty or image, invoke Gemini Vision if API key is present
        api_key = get_gemini_api_key()
        if not raw_text and api_key:
            raw_text = self._extract_with_gemini_vision(file_bytes, filename)

        if not raw_text:
            # Fallback for plain text or text-encoded files
            try:
                raw_text = file_bytes.decode("utf-8", errors="ignore")
            except Exception:
                pass

        if not raw_text:
            return (
                False,
                None,
                "UNREADABLE_FILE",
                "Unable to extract readable text or financial data from this file. Please verify file integrity."
            )

        # 3. Check if document is structured financial product
        if not is_financial_termsheet(raw_text):
            return (
                False,
                None,
                "UNRECOGNIZED_STRUCTURE",
                "Unrecognized document structure. AGRIMA currently supports: Dual Currency Investments (DCI), Fixed Coupon Notes (FCN), Step-Up/Step-Down Autocalls, and Twin-Win Certificates."
            )

        # 4. Scrub institutional identities and client PII
        sanitized_text = redact_pii_and_institutions(raw_text)
        return (True, sanitized_text, None, None)

    def _extract_with_gemini_vision(self, file_bytes: bytes, filename: str) -> str:
        """Invokes Gemini Vision with automatic model cascade fallback and error resilience."""
        api_key = get_gemini_api_key()
        if not api_key:
            return ""

        try:
            from google import genai
            from backend.src.agents.llm_client import get_flash_model_candidates, generate_with_model_fallback

            client = genai.Client(api_key=api_key)
            mime_type = "application/pdf" if filename.lower().endswith(".pdf") else "image/png"
            contents = [
                genai.types.Part.from_bytes(data=file_bytes, mime_type=mime_type),
                "Extract all text, financial tables, dates, strikes, barriers, and underlying parameters verbatim from this termsheet."
            ]

            candidates = get_flash_model_candidates()
            result = generate_with_model_fallback(client, candidates, contents)
            return result or ""
        except Exception as e:
            logger.error(f"Gemini OCR extraction failed: {e}")
            return ""
