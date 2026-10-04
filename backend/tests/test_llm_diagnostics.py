"""
Unit tests for LLM client, diagnostics, and model fallback cascades.
"""
import os
import pytest
from fastapi.testclient import TestClient

from backend.src.main import app
from backend.src.agents.llm_client import (
    get_gemini_api_key,
    get_flash_model_candidates,
    get_pro_model_candidates,
    check_llm_status,
)

client = TestClient(app)

def test_llm_health_endpoint():
    response = client.get("/api/health/llm")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "api_key_configured" in data

def test_model_candidates_structure(monkeypatch):
    monkeypatch.setenv("GEMINI_FLASH_MODEL", "custom-flash-model")
    monkeypatch.setenv("GEMINI_PRO_MODEL", "custom-pro-model")

    flash_candidates = get_flash_model_candidates()
    pro_candidates = get_pro_model_candidates()

    assert flash_candidates == ["custom-flash-model"]
    assert pro_candidates == ["custom-pro-model"]

def test_check_llm_status_without_key(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    status = check_llm_status()
    assert status["status"] == "KEY_MISSING"
    assert status["api_key_configured"] is False
    assert "not configured" in status["message"].lower()

def test_no_hardcoded_model_when_env_empty(monkeypatch):
    monkeypatch.delenv("GEMINI_FLASH_MODEL", raising=False)
    monkeypatch.delenv("GEMINI_PRO_MODEL", raising=False)
    assert get_flash_model_candidates() == []
    assert get_pro_model_candidates() == []

def test_status_when_model_not_configured(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key-12345")
    monkeypatch.delenv("GEMINI_FLASH_MODEL", raising=False)
    status = check_llm_status()
    assert status["status"] == "MODEL_NOT_CONFIGURED"
    assert "GEMINI_FLASH_MODEL is not configured" in status["message"]
