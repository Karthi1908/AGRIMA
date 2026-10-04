from google.genai import types
from backend.src.agents.orchestrator import ADKOrchestrator
from backend.src.models.schemas import TermsheetExtractionResponse

class ExtractorAgent(ADKOrchestrator):
    def extract_termsheet(self, file_bytes: bytes, mime_type: str) -> TermsheetExtractionResponse:
        prompt = """
        You are an expert financial structured products extraction AI.
        Analyze the provided termsheet document and extract all economic parameters into the precise schema.
        
        CRITICAL INSTRUCTIONS:
        1. If the document is NOT a termsheet or is heavily encrypted, set is_rejected=True and provide rejection_reason.
        2. Provide a field_provenance map (FOUND, INFERRED, MISSING, CONFLICT) for every extracted field.
        3. If a parameter is explicitly found, provenance should be 'FOUND'.
        4. If a parameter is inferred from context (e.g. standard market conventions), provenance should be 'INFERRED' and add the field name to flagged_warnings.
        5. If a required parameter is completely missing, guess a safe default but set provenance to 'MISSING' and add the field name to flagged_warnings.
        6. If multiple conflicting definitions exist for a parameter (e.g. multiple strike prices), set provenance to 'CONFLICT' and add the field name to flagged_warnings. THIS IS A HARD BLOCKER for verification.
        
        Ensure accuracy. Zero-retention and strict anonymity must be maintained.
        """
        
        file_part = types.Part.from_bytes(data=file_bytes, mime_type=mime_type)
        
        return self.generate_structured_response(
            prompt=prompt,
            schema=TermsheetExtractionResponse,
            files=[file_part]
        )
