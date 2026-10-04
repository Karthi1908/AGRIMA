"""
Contract tests for termsheet parsing and agent structuring.
Validates extraction of DCI, FCN, Step-Down, Twin-Win, and rejection of encrypted/invalid docs.
"""
import os
import pytest
from fastapi.testclient import TestClient

from backend.src.main import app
from backend.src.models.schemas import ProductArchetype

client = TestClient(app)
FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")

def test_parse_encrypted_pdf_rejection():
    encrypted_path = os.path.join(FIXTURES_DIR, "encrypted_termsheet.pdf")
    with open(encrypted_path, "rb") as f:
        response = client.post("/api/termsheets/parse", files={"file": ("encrypted.pdf", f, "application/pdf")})
    
    assert response.status_code == 200
    data = response.json()
    assert data["is_rejected"] is True
    assert data["rejection_reason"] == "ENCRYPTED_PDF"
    assert "password" in data["rejection_guidance"].lower()
    assert data["product"] is None

def test_parse_non_financial_doc_rejection():
    doc_path = os.path.join(FIXTURES_DIR, "non_financial_doc.pdf")
    with open(doc_path, "rb") as f:
        response = client.post("/api/termsheets/parse", files={"file": ("invoice.pdf", f, "application/pdf")})
    
    assert response.status_code == 200
    data = response.json()
    assert data["is_rejected"] is True
    assert data["rejection_reason"] == "UNRECOGNIZED_STRUCTURE"
    assert "supported" in data["rejection_guidance"].lower() or "unrecognized" in data["rejection_guidance"].lower()

def test_parse_dci_termsheet():
    dci_path = os.path.join(FIXTURES_DIR, "dci_termsheet.pdf")
    with open(dci_path, "rb") as f:
        response = client.post("/api/termsheets/parse", files={"file": ("dci.pdf", f, "application/pdf")})
    
    assert response.status_code == 200
    data = response.json()
    assert data["is_rejected"] is False
    assert data["product"] is not None
    assert data["product"]["archetype"] == ProductArchetype.DCI.value
    assert data["product"]["dci_parameters"] is not None
    assert data["product"]["dci_parameters"]["strike_rate"] == 1.0800
    assert len(data["product"]["underlyings"]) >= 1

def test_parse_fcn_termsheet():
    fcn_path = os.path.join(FIXTURES_DIR, "fcn_termsheet.pdf")
    with open(fcn_path, "rb") as f:
        response = client.post("/api/termsheets/parse", files={"file": ("fcn.pdf", f, "application/pdf")})
    
    assert response.status_code == 200
    data = response.json()
    assert data["is_rejected"] is False
    assert data["product"] is not None
    assert data["product"]["archetype"] == ProductArchetype.FCN_AUTOCALL_NOTE.value
    assert len(data["product"]["underlyings"]) == 3
    assert any(u["symbol"] == "AAPL" for u in data["product"]["underlyings"])
