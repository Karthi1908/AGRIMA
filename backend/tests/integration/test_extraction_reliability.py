import os
import pytest
from unittest.mock import patch, MagicMock
from google.genai.errors import APIError
from backend.src.agents.extractor import ExtractorAgent

@pytest.fixture
def extractor():
    os.environ["GEMINI_API_KEY"] = "mock_test_key"
    return ExtractorAgent(model_name="gemini-3.1-pro-preview")

def test_extraction_retry_on_429(extractor):
    with patch.object(extractor.client.models, 'generate_content') as mock_generate:
        error_429 = APIError("Rate limit")
        error_429.code = 429
        mock_success = MagicMock()
        mock_success.text = '{"product": {"archetype": "DCI"}, "field_provenance": {}, "flagged_warnings": [], "is_rejected": false}'
        
        mock_generate.side_effect = [error_429, mock_success]
        
        # We need a small mock file
        response = extractor.extract_termsheet(b"test file", "application/pdf")
        
        assert mock_generate.call_count == 2
        assert not response.is_rejected
        assert response.product.archetype == "DCI"

def test_extraction_timeout_fallback(extractor):
    with patch.object(extractor.client.models, 'generate_content') as mock_generate:
        # Mock timeout error 3 times
        error_timeout = Exception("timeout exceeded")
        mock_generate.side_effect = [error_timeout, error_timeout, error_timeout]
        
        response = extractor.extract_termsheet(b"test file", "application/pdf")
        
        assert mock_generate.call_count == 3
        assert response.is_rejected
        assert response.rejection_reason == "TIMEOUT"
