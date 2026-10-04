"""
Unit tests for PII redaction, entity sanitization, and PDF encryption detection.
Complies with Constitution Principle I (Zero-Retention) and Principle II (Anonymized Extraction).
"""
import os
import pytest
from backend.src.agents.ingestion_agent import redact_pii_and_institutions, check_pdf_encrypted

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")

def test_redact_institutional_identities():
    raw_termsheet = (
        "CONFIDENTIAL TERM SHEET\n"
        "Issuer: Goldman Sachs International (London Branch)\n"
        "Arranger: Barclays Capital PLC\n"
        "Lead Manager: Morgan Stanley & Co.\n"
        "Client Name: Johnathan Doe\n"
        "Client Account: AC-98721-002\n"
        "Email: j.doe@privatewealth.com\n"
        "Phone: +44 20 7986 4000\n"
        "Product: Fixed Coupon Note linked to AAPL, MSFT\n"
        "Notional: USD 250,000\n"
        "Coupon: 10.50% p.a.\n"
        "Strike: 100%\n"
        "Knock-In: 70%\n"
    )

    sanitized = redact_pii_and_institutions(raw_termsheet)

    # Counterparties and client PII must be completely scrubbed
    assert "Goldman Sachs" not in sanitized
    assert "Barclays" not in sanitized
    assert "Morgan Stanley" not in sanitized
    assert "Johnathan Doe" not in sanitized
    assert "AC-98721-002" not in sanitized
    assert "j.doe@privatewealth.com" not in sanitized
    assert "+44 20 7986 4000" not in sanitized

    # Financial economics must be preserved intact
    assert "Fixed Coupon Note" in sanitized
    assert "AAPL" in sanitized
    assert "MSFT" in sanitized
    assert "USD" in sanitized
    assert "250,000" in sanitized
    assert "10.50%" in sanitized
    assert "70%" in sanitized

def test_pdf_encryption_detection():
    encrypted_path = os.path.join(FIXTURES_DIR, "encrypted_termsheet.pdf")
    unencrypted_path = os.path.join(FIXTURES_DIR, "dci_termsheet.pdf")

    with open(encrypted_path, "rb") as f:
        encrypted_bytes = f.read()
    with open(unencrypted_path, "rb") as f:
        unencrypted_bytes = f.read()

    assert check_pdf_encrypted(encrypted_bytes) is True
    assert check_pdf_encrypted(unencrypted_bytes) is False
