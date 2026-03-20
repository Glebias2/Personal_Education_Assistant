from langchain_openai import ChatOpenAI
from settings import settings


llm = ChatOpenAI(
    base_url=settings.base_url,
    model=settings.model,
    api_key=settings.api_key,
    temperature=settings.temperature
)
