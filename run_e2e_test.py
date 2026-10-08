import requests
import json
import os
import sys
import glob

def main():
    print("Running programmatic E2E test...")
    folder_path = r"c:\Users\Karth\hacks-projects\AGRIMA\test_termsheets"
    pdf_files = glob.glob(os.path.join(folder_path, "*.pdf"))
    
    if not pdf_files:
        print(f"No PDF files found in {folder_path}")
        sys.exit(1)

    all_passed = True
    for file_path in pdf_files:
        print(f"\n====================================")
        print(f"Testing {os.path.basename(file_path)}")
        print(f"Uploading to /api/extract...")
        with open(file_path, "rb") as f:
            response = requests.post("http://127.0.0.1:8000/api/extract", files={"file": f})
            
        if response.status_code != 200:
            print(f"Extraction failed with status {response.status_code}: {response.text}")
            all_passed = False
            continue
            
        data = response.json()
        product = data.get("product")
        if not product:
            print("Extraction succeeded but no product returned!")
            all_passed = False
            continue
            
        print(f"Extraction successful: {product.get('title')} (Archetype: {product.get('archetype')})")
        print(f"Found {len(product.get('underlyings', []))} underlyings.")
        
        # Check field provenance for any MISSING fields (since the warning issue was about this)
        missing_fields = []
        if product.get('field_provenance'):
            for field, status in product['field_provenance'].items():
                if status == "MISSING":
                    missing_fields.append(field)
        if missing_fields:
            print(f"Warning: Missing fields found: {missing_fields}")
            # we'll flag it as failed if important fields are missing
            if any(f in ["capital_protection_pct", "twin_win_parameters"] for f in missing_fields):
                all_passed = False
        else:
            print("All fields have provenance (FOUND or INFERRED).")
        
        print("Running simulation...")
        # Add assumptions for simulation
        num_underlyings = len(product.get("underlyings", []))
        # Create a simple identity/ones correlation matrix for the test
        corr_matrix = [[0.5]*num_underlyings for _ in range(num_underlyings)]
        for i in range(num_underlyings):
            corr_matrix[i][i] = 1.0
            
        assumptions = {
            "volatility": 0.25,
            "drift": 0.05,
            "dividend_yield": 0.0,
            "path_count": 1000,
            "seed": 42,
            "method": "simulated",
            "correlation": corr_matrix,
            "persona": "Neutral"
        }
        
        sim_payload = {
            "product": product,
            "assumptions": assumptions
        }
        
        sim_resp = requests.post("http://127.0.0.1:8000/api/simulate", json=sim_payload)
        if sim_resp.status_code != 200:
            print(f"Simulation failed with status {sim_resp.status_code}: {sim_resp.text}")
            all_passed = False
            continue
            
        sim_data = sim_resp.json()
        print("Simulation successful!")
        
        # Check if PnL distribution is returned
        pnl_dist = sim_data.get("pnl_distribution", [])
        if pnl_dist:
            print(f"Monte Carlo PnL distribution returned (len: {len(pnl_dist)})")
        else:
            print("Monte Carlo PnL distribution missing!")
            all_passed = False
            
        print(f"Expected PnL: {sim_data.get('expected_pnl')}")
        print(f"Probability of loss: {sim_data.get('probability_of_loss')}")
        print(f"Knock-out probability: {sim_data.get('knock_out_probability')}")

    if all_passed:
        print("\nAll E2E Tests Passed successfully.")
        sys.exit(0)
    else:
        print("\nSome tests failed.")
        sys.exit(1)

if __name__ == "__main__":
    main()
