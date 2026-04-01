import warnings
warnings.filterwarnings("ignore", message=".*create_react_agent.*")
from loguru import logger
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, ToolMessage
from langgraph.prebuilt import create_react_agent

from settings import settings
from rag.tools import make_agent_tools
from database.sql.repositories.students import StudentRepository
from database.sql.repositories.courses import CourseRepository


def _get_llm():
    return ChatGoogleGenerativeAI(
        model=settings.model,
        google_api_key=settings.api_key,
        temperature=settings.temperature,
    )


def _build_system_prompt(student_name: str, course_title: str) -> str:
    return f"""\
Ты — AI-ассистент образовательной платформы по курсу «{course_title}».
Студент: {student_name}.

Правила поведения:
- Всегда отвечай на русском языке.
- Используй Markdown: заголовки, списки, **жирный** для ключевых терминов.
- Будь дружелюбен и поддерживай студента.
- Если для ответа нужны данные — вызывай инструменты сразу, не объясняя что собираешься делать.

Скилл «Разбор теста или экзамена»:
- Сначала вызови get_my_test_results или get_my_exam_results чтобы найти нужный ID.
- Затем вызови get_test_mistakes или get_exam_details чтобы получить детали.
- В конце сообщения добавь: «Задай вопрос по теме которую хочешь разобрать — я найду объяснение в материалах курса.»

Скилл «Помощь с лабораторной работой»:
- Сначала вызови get_course_labs чтобы увидеть список лаб и их задания.
- Определи нужную лабу и вызови search_course_materials с её названием и заданием.
- Предложи структуру выполнения и ключевые концепции — помоги студенту понять, но не решай за него.
- Если студент просит выполнить задание за него — ответь: «Это задание нужно выполнить самостоятельно. Задай конкретный вопрос по концепции и я объясню.»\
"""


def _log_agent_trace(messages: list, history_len: int) -> None:
    step = 0
    for msg in messages[history_len:]:
        if isinstance(msg, AIMessage) and msg.tool_calls:
            for tc in msg.tool_calls:
                args_preview = str(tc.get("args", {}))[:120]
                logger.debug(f"  [шаг {step}] LLM → вызов инструмента: {tc['name']}({args_preview})")
                step += 1
        elif isinstance(msg, ToolMessage):
            content_preview = str(msg.content)[:500]
            logger.debug(f"  [шаг {step}] Инструмент '{msg.name}' → результат ({len(str(msg.content))} символов):\n{content_preview}")
            step += 1
        elif isinstance(msg, AIMessage) and not msg.tool_calls:
            content = msg.content
            content_type = type(content).__name__
            content_len = len(content) if isinstance(content, str) else len(str(content))
            logger.debug(f"  [шаг {step}] LLM → финальный ответ ({content_len} символов, тип={content_type}): {str(content)[:300]}")
            step += 1


def ask(storage_id: str, question: str, history: list, student_id: int, course_id: int) -> str:
    try:
        first, last = StudentRepository().get_first_and_last_names(student_id)
        student_name = f"{first} {last}"
    except Exception:
        student_name = "студент"
    try:
        info = CourseRepository().get_course_info(course_id)
        course_title = info[0][1] if info else "курс"
    except Exception:
        course_title = "курс"

    llm = _get_llm()
    tools = make_agent_tools(student_id, course_id, storage_id)
    agent = create_react_agent(llm, tools)
    system_prompt = _build_system_prompt(student_name, course_title)
    messages = [SystemMessage(content=system_prompt)] + list(history) + [HumanMessage(content=question)]

    logger.info(f"▶ Agent | student={student_id} ({student_name}) course={course_id} ({course_title}) | '{question[:80]}'")
    result = agent.invoke({"messages": messages})

    _log_agent_trace(result["messages"], len(messages))
    new_messages = result["messages"][len(messages):]
    logger.info(f"◀ Agent завершил | новых шагов: {sum(1 for m in new_messages if isinstance(m, (AIMessage, ToolMessage)))}")

    content = result["messages"][-1].content
    logger.debug(f"  raw content type={type(content).__name__}, value={str(content)[:300]}")
    if isinstance(content, list):
        content = "".join(p.get("text", "") if isinstance(p, dict) else str(p) for p in content)
        logger.debug(f"  content after list join: {len(content)} символов")
    return content
