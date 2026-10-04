"""
Script to generate seed mock termsheets and JSON fixtures for testing.
"""
import json
import os
from pypdf import PdfWriter
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

FIXTURES_DIR = os.path.dirname(os.path.abspath(__file__))

def create_simple_pdf(filename: str, title: str, lines: list[str], password: str | None = None):
    filepath = os.path.join(FIXTURES_DIR, filename)
    temp_path = filepath + ".tmp"
    c = canvas.Canvas(temp_path, pagesize=letter)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, 750, title)
    c.setFont("Helvetica", 11)
    y = 710
    for line in lines:
        c.drawString(50, y, line)
        y -= 20
    c.save()

    if password:
        writer = PdfWriter()
        writer.append(temp_path)
        writer.encrypt(user_password=password, owner_password=password + "_owner")
        with open(filepath, "wb") as f:
            writer.write(f)
        os.remove(temp_path)
    else:
        if os.path.exists(filepath):
            os.remove(filepath)
        os.rename(temp_path, filepath)
    print(f"Created {filepath}")

def generate_fixtures():
    # 1. DCI PDF
    dci_lines = [
        "INDICATIVE TERM SHEET: DUAL CURRENCY INVESTMENT (DCI)",
        "Issuer: Global Investment Bank PLC (Redacted)",
        "Base Currency: USD",
        "Alternate Currency: EUR",
        "Notional Amount: USD 100,000",
        "Trade Date: 2026-10-01",
        "Maturity Date: 2026-11-15 (Tenor: 45 Days)",
        "Initial Spot Rate (EUR/USD): 1.0950",
        "Strike / Linked Rate: 1.0800",
        "Enhanced Coupon Yield: 8.50% p.a.",
        "Observation Type: European (At Maturity 14:00 Tokyo Time)",
        "Settlement:",
        "- If EUR/USD >= 1.0800: Investor receives 100% USD Principal + USD Coupon.",
        "- If EUR/USD < 1.0800: Investor receives EUR converted at Strike 1.0800 + Coupon."
    ]
    create_simple_pdf("dci_termsheet.pdf", "DUAL CURRENCY INVESTMENT TERM SHEET", dci_lines)

    # 2. FCN 3-Stock Basket PDF
    fcn_lines = [
        "INDICATIVE TERM SHEET: 12-MONTH FIXED COUPON NOTE (FCN)",
        "Underlying Basket: Apple Inc. (AAPL), Microsoft Corp. (MSFT), NVIDIA Corp. (NVDA)",
        "Settlement Currency: USD",
        "Notional Amount: USD 500,000",
        "Trade Date: 2026-10-01 | Maturity Date: 2027-10-01",
        "Autocall Barrier: 100% of Initial Strike (Observed Monthly from Month 3)",
        "Coupon Barrier: 80% with Memory Feature",
        "Fixed Guaranteed / Memory Coupon: 12.00% p.a. (1.00% per month)",
        "Knock-In Barrier: 70% (European Observation at Maturity)",
        "Payoff Structure: Worst-of Basket Performance",
        "- If all underlyings >= 100% on observation date: Early redemption at 100% + coupon.",
        "- At maturity, if Worst-of >= 70%: 100% Principal repaid.",
        "- If Worst-of < 70%: Physical or cash delivery based on Worst-of performance."
    ]
    create_simple_pdf("fcn_termsheet.pdf", "FIXED COUPON NOTE TERM SHEET", fcn_lines)

    # 3. Step-Down Autocall PDF
    step_down_lines = [
        "INDICATIVE TERM SHEET: 2-YEAR STEP-DOWN AUTOCALLABLE NOTE",
        "Underlying Asset: Tesla Inc. (TSLA)",
        "Denomination: USD 250,000",
        "Coupon Rate: 10.50% p.a. (Quarterly Payment)",
        "Autocall Schedule:",
        "  - Month 6: 100.00%",
        "  - Month 12: 95.00%",
        "  - Month 18: 90.00%",
        "  - Month 24: 85.00%",
        "Knock-In Barrier: 65.00% (European Observation at Maturity)",
        "Observation Type: European Maturity Barrier"
    ]
    create_simple_pdf("step_down_termsheet.pdf", "STEP-DOWN AUTOCALLABLE NOTE", step_down_lines)

    # 4. Twin-Win PDF
    twin_win_lines = [
        "INDICATIVE TERM SHEET: 18-MONTH TWIN-WIN CERTIFICATE",
        "Underlying Asset: S&P 500 ETF (SPY)",
        "Denomination: USD 100,000",
        "Strike Level: 100.00%",
        "Upside Participation: 100.00% (Capped at 125.00%)",
        "Downside Knock-In Barrier: 75.00% (Continuous American Monitoring)",
        "Payoff Mechanics:",
        "- If Knock-In Barrier (75%) is NEVER breached:",
        "  Payoff = 100% + ABS(Final Return) up to cap.",
        "- If Knock-In Barrier IS breached:",
        "  Payoff = 100% + Final Return (1-to-1 downside exposure below strike)."
    ]
    create_simple_pdf("twin_win_termsheet.pdf", "TWIN-WIN CAPITAL PROTECTION CERTIFICATE", twin_win_lines)

    # 5. Encrypted PDF
    create_simple_pdf("encrypted_termsheet.pdf", "CONFIDENTIAL ENCRYPTED FINANCIAL NOTE", ["Classified termsheet."], password="secret_password_123")

    # 6. Non-financial PDF
    invoice_lines = [
        "ACME RESTAURANT & CATERING SERVICES",
        "Invoice Number: INV-98234",
        "Date: 2026-09-15",
        "Billed To: Corporate Events Inc.",
        "Items:",
        "1. Gourmet Lunch Buffet - 50 Persons - $2,500.00",
        "2. Beverage Package - $750.00",
        "3. Service Staff & Gratuity - $500.00",
        "Total Due: $3,750.00",
        "Payment Terms: Net 30 days"
    ]
    create_simple_pdf("non_financial_doc.pdf", "COMMERCIAL INVOICE - ACME CATERING", invoice_lines)

    # JSON representations for tests
    fixtures_data = {
        "dci": {
            "archetype": "dual_currency_investment",
            "title": "USD/EUR Dual Currency Investment",
            "base_currency": "USD",
            "alternate_currency": "EUR",
            "notional": 100000.0,
            "tenor_days": 45,
            "initial_spot": 1.0950,
            "strike_rate": 1.0800,
            "annualized_coupon": 0.085,
            "observation_type": "european",
            "confidence_scores": {"strike_rate": 0.98, "annualized_coupon": 0.95}
        },
        "fcn": {
            "archetype": "fcn",
            "title": "3-Stock Worst-Of Fixed Coupon Note",
            "currency": "USD",
            "notional": 500000.0,
            "tenor_months": 12,
            "underlyings": [
                {"symbol": "AAPL", "initial_price": 225.0, "current_price": 225.0},
                {"symbol": "MSFT", "initial_price": 430.0, "current_price": 430.0},
                {"symbol": "NVDA", "initial_price": 120.0, "current_price": 120.0}
            ],
            "autocall_barrier_pct": 1.00,
            "coupon_barrier_pct": 0.80,
            "knock_in_barrier_pct": 0.70,
            "annualized_coupon": 0.12,
            "memory_coupon": True,
            "observation_type": "european",
            "observation_frequency": "monthly",
            "confidence_scores": {"knock_in_barrier_pct": 0.94, "annualized_coupon": 0.97}
        },
        "step_down": {
            "archetype": "step_down_autocall",
            "title": "TSLA Step-Down Autocall Note",
            "currency": "USD",
            "notional": 250000.0,
            "underlyings": [{"symbol": "TSLA", "initial_price": 240.0, "current_price": 240.0}],
            "autocall_schedule": [
                {"period": 1, "barrier_pct": 1.00},
                {"period": 2, "barrier_pct": 0.95},
                {"period": 3, "barrier_pct": 0.90},
                {"period": 4, "barrier_pct": 0.85}
            ],
            "knock_in_barrier_pct": 0.65,
            "annualized_coupon": 0.105,
            "observation_type": "european",
            "confidence_scores": {"knock_in_barrier_pct": 0.91}
        },
        "twin_win": {
            "archetype": "twin_win",
            "title": "SPY 18M Twin-Win Certificate",
            "currency": "USD",
            "notional": 100000.0,
            "underlyings": [{"symbol": "SPY", "initial_price": 560.0, "current_price": 560.0}],
            "knock_in_barrier_pct": 0.75,
            "upside_participation": 1.00,
            "cap_pct": 1.25,
            "observation_type": "american",
            "confidence_scores": {"knock_in_barrier_pct": 0.92, "cap_pct": 0.88}
        }
    }

    for key, data in fixtures_data.items():
        json_path = os.path.join(FIXTURES_DIR, f"{key}_fixture.json")
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        print(f"Created {json_path}")

if __name__ == "__main__":
    generate_fixtures()
