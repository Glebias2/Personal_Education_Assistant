from langchain_google_genai import GoogleGenerativeAI
from settings import settings

llm = GoogleGenerativeAI(
    model=settings.model,
    google_api_key=settings.api_key,
    temperature=settings.temperature,
)
