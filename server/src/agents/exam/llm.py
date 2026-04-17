from langchain_google_genai import ChatGoogleGenerativeAI
from settings import settings

llm = ChatGoogleGenerativeAI(
    model=settings.model,
    google_api_key=settings.api_key,
    temperature=settings.temperature,
    max_output_tokens=4096,
)
