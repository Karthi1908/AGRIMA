import os
import time
from google import genai
from google.genai.errors import APIError
from pydantic import BaseModel
from typing import TypeVar, Type, List, Any

T = TypeVar('T', bound=BaseModel)

class ADKOrchestrator:
    """Base class for ADK Agents using google-genai."""
    def __init__(self, model_name: str = None):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.model_name = model_name or os.getenv("GEMINI_FLASH_MODEL", "gemini-3.8-flash")
        self.client = genai.Client(api_key=self.api_key)

    def generate_structured_response(self, prompt: str, schema: Type[T], files: List[Any] = None) -> T:
        import json
        schema_json = json.dumps(schema.model_json_schema())
        prompt_with_schema = f"{prompt}\n\nYou must return a valid JSON object matching this schema:\n{schema_json}"
        
        contents = [prompt_with_schema]
        if files:
            contents.extend(files)
            
        max_retries = 3
        base_delay = 1.0
        
        for attempt in range(max_retries):
            try:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=contents,
                    config={
                        'response_mime_type': 'application/json',
                        'http_options': {'timeout': int(os.getenv("GEMINI_TIMEOUT_MS", "90000"))}
                    },
                )
                return schema.model_validate_json(response.text)
            except Exception as e:
                is_rate_limit = isinstance(e, APIError) and getattr(e, 'code', 0) == 429
                is_timeout = 'timeout' in str(e).lower() or (isinstance(e, APIError) and getattr(e, 'code', 0) in (500, 502, 503, 504))
                
                if attempt == max_retries - 1:
                    # T065: Setup default fallback if LLM times out
                    if is_timeout:
                        fallback = {"is_rejected": True, "rejection_reason": "TIMEOUT", "rejection_guidance": "LLM took too long. Please try again."}
                        return schema.model_validate(fallback)
                    raise
                
                if is_rate_limit or is_timeout:
                    time.sleep(base_delay * (2 ** attempt))
                else:
                    raise
