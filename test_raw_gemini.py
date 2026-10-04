import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

with open("test_termsheets/01_Equity_Accumulator_MY.pdf", "rb") as f:
    file_bytes = f.read()

prompt = "Analyze this document and extract the product parameters."
file_part = types.Part.from_bytes(data=file_bytes, mime_type="application/pdf")

print("Sending request...")
response = client.models.generate_content(
    model="gemini-3.8-flash",
    contents=[prompt, file_part]
)
print("Response:")
print(response.text)
