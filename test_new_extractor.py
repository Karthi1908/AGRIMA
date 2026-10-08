import os
import glob
import sys
import json

# Add backend to sys.path so we can import src correctly
sys.path.append(r"C:\Users\Karth\hacks-projects\AGRIMA\backend")

from src.agents.extractor import TermsheetExtractor
from pydantic import BaseModel

def run_tests():
    extractor = TermsheetExtractor()
    folder_path = r"C:\Users\Karth\hacks-projects\AGRIMA\test_termsheets"
    pdf_files = glob.glob(os.path.join(folder_path, "*.pdf"))
    
    if not pdf_files:
        print(f"No PDF files found in {folder_path}")
        return

    print(f"Found {len(pdf_files)} PDF files.")
    
    for pdf_file in pdf_files:
        print(f"\n--- Testing: {os.path.basename(pdf_file)} ---")
        try:
            with open(pdf_file, "rb") as f:
                content = f.read()
            
            result = extractor.extract(content, "application/pdf")
            
            print(f"Product Type: {result.product_type}")
            for key, field in result.fields.items():
                print(f"  Field: {key}")
                print(f"    Value: {field.value}")
                print(f"    Status: {field.status}")
                print(f"    Source Text: {field.source_text}")
                
        except Exception as e:
            print(f"Error processing {os.path.basename(pdf_file)}: {e}")

if __name__ == "__main__":
    run_tests()
