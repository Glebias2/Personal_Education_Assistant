from typing_extensions import TypedDict

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, Field

from enums import VerificationStatus
from settings import settings
from .models import Report


class OutputScheme(BaseModel):
    verdict: bool = Field(description="Does the report meet the requirements?")
    confirmation: str = Field(description="Justification of the verdict")


class State(TypedDict):
    report: Report
    lr_condition: str
    verdict_1: bool
    verdict_2: bool
    verdict_3: bool
    status: VerificationStatus
    agent_message: str


def _get_llm(temperature: float = 0.3):
    return ChatGoogleGenerativeAI(
        model=settings.model,
        google_api_key=settings.api_key,
        temperature=temperature,
    )


# ── Оценщик 1: строгий преподаватель ──

PROMPT_1 = """
Ты — строгий преподаватель. Оцени, соответствует ли отчёт студента требованиям лабораторной работы.
Требования к работе:
{requirements}

Обоснуй вердикт полностью. Решение должно быть ТОЧНЫМ и СПРАВЕДЛИВЫМ!
"""

async def evaluate_work_1(state: State):
    llm = _get_llm(temperature=0.3)
    model = llm.with_structured_output(OutputScheme)

    prompt = [
        SystemMessage(content=PROMPT_1.format(requirements=state['lr_condition'])),
        HumanMessage(content=f"Отчет студента:\n{state['report'].text}")
    ]

    result = await model.ainvoke(prompt)
    return {"verdict_1": result.verdict}


# ── Оценщик 2: объективный рецензент ──

PROMPT_2 = """
Ты — AI-рецензент для автоматизированной проверки студенческих отчётов.
Твоя задача — объективно и последовательно проанализировать текст студента по заданным критериям.
Требования к работе:
{requirements}

Обоснуй свой вердикт полностью.
"""

async def evaluate_work_2(state: State):
    llm = _get_llm(temperature=0)
    model = llm.with_structured_output(OutputScheme)

    prompt = [
        SystemMessage(content=PROMPT_2.format(requirements=state['lr_condition'])),
        HumanMessage(content=f"Отчет студента:\n{state['report'].text}")
    ]

    result = await model.ainvoke(prompt)
    return {"verdict_2": result.verdict}


# ── Оценщик 3: лояльный преподаватель ──

PROMPT_3 = """
Ты — лояльный преподаватель. Твоя задача — убедиться, что отчёт студента соответствует минимальным требованиям.
Требования к работе:
{requirements}

Обоснуй все свои решения. Будь ЛОЯЛЬНЫМ, но СПРАВЕДЛИВЫМ!
"""

async def evaluate_work_3(state: State):
    llm = _get_llm(temperature=0.3)
    model = llm.with_structured_output(OutputScheme)

    prompt = [
        SystemMessage(content=PROMPT_3.format(requirements=state['lr_condition'])),
        HumanMessage(content=f"Отчет студента:\n{state['report'].text}")
    ]

    result = await model.ainvoke(prompt)
    return {"verdict_3": result.verdict}


# ── Агрегация (голосование 2 из 3) ──

async def aggregation(state: State):
    verdicts = [state["verdict_1"], state["verdict_2"], state["verdict_3"]]
    if verdicts.count(True) > 1:
        return {"status": VerificationStatus.APPROVE}
    return {"status": VerificationStatus.DISAPPROVE}


# ── Генерация сообщения при отклонении ──

HELP_PROMPT = """
Ты — персональный ассистент по обучению.
Студент прислал отчёт, но он не соответствует требованиям лабораторной работы.
Требования к работе:
{requirements}

Твоя задача — чётко определить что не так, понятно и кратко объяснить это студенту.
Дай рекомендации по устранению недочётов.
Отвечай на русском языке.
"""

async def gen_agent_message(state: State):
    llm = _get_llm(temperature=0.3)

    prompt = [
        SystemMessage(content=HELP_PROMPT.format(requirements=state['lr_condition'])),
        HumanMessage(content=f"Отчет студента:\n{state['report'].text}")
    ]

    result = await llm.ainvoke(prompt)
    return {"agent_message": result.content}
