"""
AGRIMA Structured Product Explainer FastAPI Application.
Stateless, ephemeral backend compliant with Constitution Principle I (Zero-Retention Client Privacy).
"""
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.src.api.routes import router as api_router

# Configure minimal privacy-compliant logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("agrima")

app = FastAPI(
    title="AGRIMA Structured Product Explainer",
    description="Agentic multimodal scanner and real-time payoff simulator for structured investments",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for local Vite development and Cloud Run deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler to prevent leaking raw tracebacks or sensitive payloads
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error processing endpoint: {request.url.path} - {type(exc).__name__}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred while processing the request."}
    )

app.include_router(api_router)

# Mount static frontend for production Cloud Run deployment if dist exists
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

static_dir = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
if not os.path.exists(static_dir):
    static_dir = os.path.join(os.path.dirname(__file__), "static")

if os.path.exists(static_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(static_dir, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(static_dir, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(static_dir, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.src.main:app", host="0.0.0.0", port=8000, reload=True)
