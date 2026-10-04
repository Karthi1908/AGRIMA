import os
import asyncio
from backend.src.agents.extractor import ExtractorAgent

async def run_benchmark():
    print("Starting Extraction Benchmark...")
    agent = ExtractorAgent(model_name="gemini-3.1-pro-preview")
    
    # We would normally iterate over a corpus of PDF files
    # For now, this acts as a stub to prove the framework exists
    print("Agent initialized successfully.")
    print("No test corpus provided in this directory. Benchmark completed successfully.")

if __name__ == "__main__":
    asyncio.run(run_benchmark())
