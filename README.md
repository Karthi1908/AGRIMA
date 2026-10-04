# AGRIMA | Smart Termsheet Scanner & Interactive Payoff Explainer

AGRIMA is an intelligent, agent-driven web application designed to demystify complex financial structured products. By simply uploading a standard OTC termsheet PDF, AGRIMA extracts the economic parameters, models the product's behavior, and provides interactive simulations to help investors visualize potential payoffs across various market scenarios.

## 🌟 Features

- **Automated Termsheet Extraction**: Powered by Gemini Flash, AGRIMA can read complex, unstructured PDF termsheets and extract all relevant economic parameters (strike prices, barriers, coupons, observation schedules, etc.) into a strict, validated schema.
- **Interactive Payoff Simulation**: Once extracted, users can manipulate simulated asset prices to see exactly how the product behaves in real-time, visualizing knock-ins, knock-outs, and geared accumulations.
- **AI-Generated Narratives**: For any given simulation state, AGRIMA generates Best-Case, Base-Case, and Worst-Case narratives to explain the mechanics in plain language.
- **Wide Product Support**: Capable of handling Dual Currency Investments (DCI), Autocallable Notes (FCNs, Step-Up, Step-Down), Twin-Wins, and Equity Accumulators/Decumulators.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Recharts for dynamic data visualization.
- **Backend**: FastAPI (Python), Pydantic for strict data contract enforcement.
- **AI Integration**: Google GenAI SDK (Gemini 3.8 Flash) for extraction and narrative generation.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python 3.12+
- Gemini API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/AGRIMA.git
   cd AGRIMA
   ```

2. **Backend Setup:**
   Create a virtual environment, install dependencies, and configure your API key.
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r backend/requirements.txt
   ```
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   ```

### Running Locally

To run the application locally, you need to start both the backend server and the frontend development server.

**Start the Backend (FastAPI):**
```bash
# From the project root
python -m uvicorn backend.src.main:app --port 8000 --reload
```

**Start the Frontend (Vite):**
```bash
# From the frontend directory
npm run dev
```

Navigate to `http://localhost:5173` in your browser to start using AGRIMA!

## 🧪 Testing

AGRIMA comes with a set of test fixtures and validation scripts to ensure accuracy across complex financial instruments.

```bash
# Run backend tests
pytest backend/tests/
```

## 📜 License

[MIT License](LICENSE)
