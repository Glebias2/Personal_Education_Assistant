import logging
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import (
    ChatPromptTemplate,
    MessagesPlaceholder,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
)
from langchain_core.documents import Document

from settings import settings
from database.vector.repositories import StorageManager


logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Промпты
# ---------------------------------------------------------------------------

RAG_SYSTEM_MESSAGE = """\
Ты — опытный университетский преподаватель.
Ты прекрасно знаешь материал курса и объясняешь его студентам понятно и структурированно.

Правила:
- Отвечай естественно, как знающий преподаватель. НЕ ссылайся на «контекст», «документ», «предоставленные материалы» — просто объясняй.
- Структурируй ответ: сначала краткий ответ (1-2 предложения), затем подробное объяснение.
- Используй Markdown: заголовки, списки, **жирный** для ключевых терминов.
- Приводи примеры и аналогии, если это помогает понять тему.
- Если информации недостаточно для полного ответа — честно скажи об этом и предложи уточнить вопрос.
- Отвечай на русском языке.

Твои знания по теме вопроса:
{context}"""

GENERAL_SYSTEM_MESSAGE = """\
Ты — дружелюбный AI-ассистент образовательной платформы.
Ты помогаешь студентам с учёбой, отвечаешь на вопросы и поддерживаешь диалог.

Правила:
- Отвечай на русском языке.
- Будь вежлив и дружелюбен.
- Используй Markdown для структурирования ответа, если это уместно.
- Если вопрос касается конкретного учебного материала — предложи задать вопрос точнее.
- Можешь вести свободный диалог на общие темы."""


# ---------------------------------------------------------------------------
# LLM
# ---------------------------------------------------------------------------

def _get_llm():
    return ChatGoogleGenerativeAI(
        model=settings.model,
        google_api_key=settings.api_key,
        temperature=settings.temperature,
    )


# ---------------------------------------------------------------------------
# Retrieval — гибридный поиск (BM25 + vector)
# ---------------------------------------------------------------------------

def _retrieve_context(storage_id: str, question: str) -> list[Document]:
    """Гибридный поиск: BM25 (ключевые слова) + vector (семантика).
    Если hybrid недоступен — fallback на чистый vector search.
    """
    try:
        vector_storage = StorageManager.get_vector_storage(storage_id)
        docs = vector_storage.hybrid_search(question, k=15, alpha=0.75)
        logger.info(f"Hybrid search вернул {len(docs)} чанков")
        return docs
    except Exception as e:
        logger.warning(f"Hybrid search недоступен ({e}), fallback на vector search")
        try:
            vector_storage = StorageManager.get_vector_storage(storage_id)
            docs = vector_storage.similarity_search(question, k=15)
            return docs
        except Exception as e2:
            logger.error(f"Ошибка поиска: {e2}")
            return []


def _select_top_chunks(docs: list[Document], max_chunks: int = 8) -> list[Document]:
    """Берёт топ-N чанков. Документы уже отсортированы по релевантности от Weaviate.
    Логирует distance каждого для отладки.
    """
    selected = []
    for doc in docs[:max_chunks]:
        dist = doc.metadata.get("distance", doc.metadata.get("score", "n/a"))
        logger.info(f"  chunk dist/score={dist} | {doc.page_content[:80]}...")
        selected.append(doc)
    return selected


# ---------------------------------------------------------------------------
# Chains
# ---------------------------------------------------------------------------

def create_rag_chain():
    llm = _get_llm()
    prompt = ChatPromptTemplate.from_messages([
        SystemMessagePromptTemplate.from_template(RAG_SYSTEM_MESSAGE),
        MessagesPlaceholder(variable_name="history"),
        HumanMessagePromptTemplate.from_template("{question}"),
    ])
    return prompt | llm


def create_general_chain():
    llm = _get_llm()
    prompt = ChatPromptTemplate.from_messages([
        SystemMessagePromptTemplate.from_template(GENERAL_SYSTEM_MESSAGE),
        MessagesPlaceholder(variable_name="history"),
        HumanMessagePromptTemplate.from_template("{question}"),
    ])
    return prompt | llm


# ---------------------------------------------------------------------------
# Главная функция
# ---------------------------------------------------------------------------

def ask(storage_id: str, question: str, history: list) -> str:
    """
    Гибридный подход:
    1. Hybrid search (BM25 + vector) — 15 кандидатов
    2. Берём топ-8 чанков
    3. Если есть чанки с содержательным текстом — RAG (преподаватель-стиль)
    4. Если нет — свободный диалог (general LLM)
    """
    docs = _retrieve_context(storage_id, question)
    logger.info(f"Вопрос: '{question}' | Найдено чанков: {len(docs)}")

    top = _select_top_chunks(docs, max_chunks=8)

    # Проверяем есть ли реальный контент (не пустые чанки)
    total_text = " ".join(d.page_content.strip() for d in top)
    has_content = len(total_text) > 50

    if top and has_content:
        context_text = "\n\n---\n\n".join(d.page_content for d in top)
        logger.info(f"RAG chain | контекст: {len(context_text)} символов из {len(top)} чанков")
        chain = create_rag_chain()
        response = chain.invoke({
            "context": context_text,
            "history": history,
            "question": question,
        })
    else:
        logger.info("General chain — нет релевантного контента")
        chain = create_general_chain()
        response = chain.invoke({
            "history": history,
            "question": question,
        })

    return response.content
