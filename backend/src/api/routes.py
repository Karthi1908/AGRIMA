"""
API routes for AGRIMA Structured Product Explainer.
Endpoints:
- POST /api/termsheets/parse: Ingest PDF/image termsheets, redact PII, return structured parameters.
- POST /api/simulation/calculate: Deterministically evaluate barrier conditions and returns.
- POST /api/narrative/generate: Synthesize executive scenario narratives using Gemini.
"""
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from typing import Dict, Any

from backend.src.models.schemas import (
    TermsheetExtractionResponse,
    SimulationCalculationRequest,
    PayoffSimulationState,
    NarrativeGenerationRequest,
    ScenarioNarratives,
)

router = APIRouter(prefix="/api")

from backend.src.agents.llm_client import check_llm_status

@router.get("/health")
async def health_check() -> Dict[str, str]:
    return {"status": "ok", "app": "AGRIMA Structured Product Explainer"}

@router.get("/health/llm")
async def llm_health_check() -> Dict[str, Any]:
    """Diagnoses Gemini LLM API key status, model availability, and errors."""
    return check_llm_status()

from backend.src.agents.ingestion_agent import TermsheetIngestionAgent
from backend.src.agents.structuring_agent import EconomicStructuringAgent

ingestion_agent = TermsheetIngestionAgent()
structuring_agent = EconomicStructuringAgent()

@router.post("/termsheets/parse", response_model=TermsheetExtractionResponse)
async def parse_termsheet(file: UploadFile = File(...)):
    """
    Ingest termsheet file (PDF or image).
    Performs encryption pre-check, PII redaction, non-financial detection,
    and returns normalized structured parameters or rejection guidance.
    """
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")

    # 1. Ingestion Agent: Pre-check, OCR, Sanitization, Non-financial detection
    success, sanitized_text, error_code, guidance = ingestion_agent.process_document(
        file_bytes, file.filename or "termsheet.pdf"
    )

    if not success:
        return TermsheetExtractionResponse(
            product=None,
            field_provenance={},
            flagged_warnings=[],
            is_rejected=True,
            rejection_reason=error_code,
            rejection_guidance=guidance,
        )

    # 2. Structuring Agent: Extract product parameters and confidence
    response = structuring_agent.structure_termsheet(sanitized_text)
    return response

from backend.src.engine.payoff_calculator import PayoffCalculator

@router.post("/simulation/calculate", response_model=PayoffSimulationState)
async def calculate_simulation(req: SimulationCalculationRequest):
    """
    Calculate deterministic payoff simulation using pure financial mathematics.
    Evaluates worst-of selection, barriers, coupons, and capital protection.
    """
    try:
        return PayoffCalculator.calculate_payoff(
            product=req.product,
            simulated_prices=req.simulated_prices,
            target_period=req.target_period
        )
    except Exception as e:
        logger.error(f"Error computing payoff simulation: {e}")
        raise HTTPException(status_code=400, detail=f"Simulation calculation error: {str(e)}")

from backend.src.agents.narrative_agent import ClientNarrativeAgent

narrative_agent = ClientNarrativeAgent()

@router.post("/narrative/generate", response_model=ScenarioNarratives)
async def generate_narrative(req: NarrativeGenerationRequest):
    """
    Generate plain-language executive scenario narratives (Best, Base, Worst case).
    Uses Gemini 2.5 Flash via ClientNarrativeAgent without institutional branding.
    """
    try:
        return narrative_agent.generate_narratives(req.product)
    except Exception as e:
        logger.error(f"Error generating scenario narratives: {e}")
        raise HTTPException(status_code=500, detail=f"Narrative generation error: {str(e)}")

# New Risk Analytics & Trust feature routes
from backend.src.api.extract import router as extract_router
from backend.src.api.simulate import router as simulate_router
from backend.src.api.compare import router as compare_router

router.include_router(extract_router, prefix="/extract", tags=["extract"])
router.include_router(simulate_router, prefix="/simulate", tags=["simulate"])
router.include_router(compare_router, prefix="/compare", tags=["compare"])
