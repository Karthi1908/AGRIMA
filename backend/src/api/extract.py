from fastapi import APIRouter, File, UploadFile, HTTPException
from backend.src.agents.extractor import ExtractorAgent
from backend.src.models.schemas import TermsheetExtractionResponse

router = APIRouter()
agents = [
    ExtractorAgent(model_name="gemini-3.8-flash"),
    ExtractorAgent(model_name="gemini-3.1-pro-preview"),
]

@router.post("", response_model=TermsheetExtractionResponse)
async def extract_termsheet(file: UploadFile = File(...)):
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")
    
    mime_type = file.content_type or "application/pdf"
    
    last_error = None
    for agent in agents:
        try:
            return agent.extract_termsheet(file_bytes, mime_type)
        except Exception as e:
            last_error = e
    raise HTTPException(status_code=500, detail=f"Extraction failed: {str(last_error)}")
