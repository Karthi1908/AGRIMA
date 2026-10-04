"""
Centralized Google GenAI / Gemini LLM Client & Diagnostics.
Complies with Constitution Principle I (Zero-Retention) & Principle V (Gemini Foundation).
Provides:
- Automatic .env loading
- Validated model cascades with automatic fallbacks for non-existent or deprecated models
- Comprehensive LLM error diagnostics & connectivity validation
"""
import os
import logging
from typing import List, Optional, Dict, Any
from pathlib import Path
from dotenv import load_dotenv

logger = logging.getLogger("agrima.llm")

# Automatically load .env from project root
env_paths = [
    Path(__file__).resolve().parent.parent.parent.parent / ".env",
    Path(__file__).resolve().parent.parent.parent / ".env",
    Path(".env"),
]
for p in env_paths:
    if p.exists():
        load_dotenv(p, override=True)
        break


def get_gemini_api_key() -> Optional[str]:
    """Dynamically reads the Gemini API key from environment."""
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    return key if key else None

def get_flash_model() -> Optional[str]:
    """Dynamically reads the flash model name exclusively from .env."""
    model = os.environ.get("GEMINI_FLASH_MODEL", "").strip()
    return model if model else None

def get_pro_model() -> Optional[str]:
    """Dynamically reads the pro model name exclusively from .env."""
    model = os.environ.get("GEMINI_PRO_MODEL", "").strip()
    return model if model else None

def get_flash_model_candidates() -> List[str]:
    """
    Returns candidate list consisting ONLY of the GEMINI_FLASH_MODEL from .env.
    No models are hardcoded or assumed.
    """
    model = get_flash_model()
    return [model] if model else []

def get_pro_model_candidates() -> List[str]:
    """
    Returns candidate list consisting ONLY of the GEMINI_PRO_MODEL from .env.
    No models are hardcoded or assumed.
    """
    model = get_pro_model()
    return [model] if model else []

def generate_with_model_fallback(
    client,
    model_candidates: List[str],
    contents,
    config: Optional[Dict[str, Any]] = None
) -> Optional[str]:
    """
    Attempts content generation across candidate models.
    If a model fails due to 404/NotFound or InvalidArgument (e.g. invalid model name),
    it immediately advances to the next candidate model in the cascade.
    """
    if not model_candidates:
        logger.info("No Gemini model configured in .env. Skipping LLM invocation.")
        return None

    last_error = None
    for model_name in model_candidates:
        try:
            logger.info(f"Attempting Gemini generation with model: {model_name}")
            response = client.models.generate_content(
                model=model_name,
                contents=contents,
                config=config
            )
            if response and response.text:
                return response.text
        except Exception as e:
            err_str = str(e)
            last_error = e
            # If model name not found (404) or invalid model specified
            if "404" in err_str or "not found" in err_str.lower() or "invalid" in err_str.lower():
                logger.warning(f"Model '{model_name}' unavailable or invalid: {err_str}.")
                continue
            # If server capacity exhausted / temporary outage / model unreachable (503 UNAVAILABLE)
            elif "503" in err_str or "unreachable" in err_str.lower() or "unavailable" in err_str.lower():
                logger.warning(f"Model '{model_name}' is currently unreachable / overloaded (503).")
                continue
            # If account credits depleted (402 Prepayment credits depleted)
            elif "402" in err_str or "prepayment credits" in err_str.lower():
                logger.warning(f"Google AI Studio prepayment credits depleted (402). Switching immediately to deterministic fallback mode.")
                break
            # If authentication failure (400 or 403 API key error)
            elif "API_KEY_INVALID" in err_str or "403" in err_str or "PERMISSION_DENIED" in err_str:
                logger.error(f"Gemini API authentication failed: {err_str}")
                break
            else:
                logger.warning(f"Error invoking model '{model_name}': {err_str}.")
                continue

    if last_error:
        logger.error(f"All Gemini model candidates exhausted. Last error: {last_error}")
    return None

def check_llm_status() -> Dict[str, Any]:
    """
    Performs full health and error diagnosis for Gemini LLM configuration.
    Returns status report without leaking secret key values.
    Tests candidate models in order until a reachable model is found.
    """
    api_key = get_gemini_api_key()
    if not api_key:
        return {
            "status": "KEY_MISSING",
            "api_key_configured": False,
            "message": "GEMINI_API_KEY is not configured in .env. Running in deterministic local simulation mode.",
            "flash_candidates": get_flash_model_candidates(),
            "pro_candidates": get_pro_model_candidates(),
        }

    # Mask key for privacy: e.g. "AIza...W48"
    masked_key = f"{api_key[:4]}...{api_key[-4:]}" if len(api_key) > 8 else "***"

    flash_candidates = get_flash_model_candidates()
    if not flash_candidates:
        return {
            "status": "MODEL_NOT_CONFIGURED",
            "api_key_configured": True,
            "masked_api_key": masked_key,
            "message": "GEMINI_FLASH_MODEL is not configured in .env. Please define GEMINI_FLASH_MODEL in your .env file.",
            "flash_candidates": [],
            "pro_candidates": get_pro_model_candidates(),
        }

    try:
        from google import genai
        client = genai.Client(api_key=api_key)

        tested_errors = []

        # Iterate candidates until one is reachable
        for test_model in flash_candidates:
            try:
                res = client.models.generate_content(
                    model=test_model,
                    contents="Ping. Respond with 'PONG'."
                )
                return {
                    "status": "HEALTHY",
                    "api_key_configured": True,
                    "masked_api_key": masked_key,
                    "active_model": test_model,
                    "test_response": res.text.strip() if res.text else "OK",
                    "message": f"Successfully connected to Gemini API using model '{test_model}'.",
                }
            except Exception as model_err:
                err_msg = str(model_err)
                tested_errors.append(f"{test_model}: {err_msg}")
                # If credits depleted (402), project-wide billing issue
                if "402" in err_msg or "prepayment credits" in err_msg.lower():
                    return {
                        "status": "CREDITS_DEPLETED",
                        "api_key_configured": True,
                        "masked_api_key": masked_key,
                        "message": "Google AI Studio prepayment credits are depleted (HTTP 402 RESOURCE_EXHAUSTED).",
                        "fallback_status": "Active (deterministic local simulation mode ensures 100% operational uptime).",
                        "recommended_action": "Top up prepayment credits at https://ai.studio/projects or set a GEMINI_API_KEY with active quota."
                    }
                # If authentication issue, stopping makes sense
                if "API_KEY_INVALID" in err_msg or "403" in err_msg or "PERMISSION_DENIED" in err_msg:
                    return {
                        "status": "INVALID_API_KEY",
                        "api_key_configured": True,
                        "masked_api_key": masked_key,
                        "message": "The provided GEMINI_API_KEY was rejected by Google AI Studio.",
                        "recommended_action": "Check that your API key from https://aistudio.google.com/ is valid and has not expired."
                    }
                # For 503 / unreachable or 404 / not found, continue to next candidate
                logger.info(f"Model test for '{test_model}' failed: {err_msg}.")
                continue

        # If all candidates were unreachable
        has_unreachable = any("503" in e or "unreachable" in e.lower() or "unavailable" in e.lower() for e in tested_errors)
        if has_unreachable:
            return {
                "status": "MODEL_UNREACHABLE",
                "api_key_configured": True,
                "masked_api_key": masked_key,
                "message": "The requested Gemini model(s) are currently unreachable due to Google Cloud server capacity limits (503 UNAVAILABLE).",
                "tested_candidates": tested_errors,
                "fallback_status": "Active (deterministic local simulation mode ensures 100% operational uptime).",
                "recommended_action": "Wait a few moments for Google Cloud capacity to recover, or update GEMINI_FLASH_MODEL in .env."
            }

        return {
            "status": "API_ERROR",
            "api_key_configured": True,
            "masked_api_key": masked_key,
            "message": f"Gemini API error across all tested models: {tested_errors[-1] if tested_errors else 'Unknown'}",
            "tested_candidates": tested_errors,
        }
    except Exception as e:
        return {
            "status": "CLIENT_INIT_ERROR",
            "api_key_configured": True,
            "masked_api_key": masked_key,
            "message": f"Failed to initialize google-genai client: {str(e)}",
        }
