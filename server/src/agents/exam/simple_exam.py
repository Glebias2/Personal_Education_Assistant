#!/usr/bin/env python3
"""
Простой интерактивный клиент для удаленного экзаменационного API.

Использует эндпоинты:
  - POST /courses/{course_id}/exam/start
  - POST /courses/{course_id}/exam/answer
  - GET  /courses/{course_id}/summary?exam_id=...

Запуск:
    python simple_exam.py
"""

from __future__ import annotations

from typing import Any, Dict, Optional

import requests


def main():
    """Интерактивный экзамен."""
    print("=" * 60)
    print("Экзаменационная система")
    print("=" * 60)
    
    # Запрашиваем параметры
    try:
        base_url = input("\nБазовый URL API (по умолчанию http://localhost:8000): ").strip() or "http://localhost:8000"
        course_id = int(input("\nВведите ID курса: "))
        question_count = int(input("Количество вопросов (по умолчанию 3): ") or "3")
        language = input("Язык (ru/en, по умолчанию ru): ").strip() or "ru"
    except ValueError:
        print("Ошибка: введите корректные числа")
        return

    # Стартуем экзамен через API
    print(f"\nСоздание экзамена для курса #{course_id}...")
    start_resp = _start_exam(
        base_url=base_url,
        course_id=course_id,
        question_count=question_count,
        language=language,
    )
    if start_resp is None:
        return

    exam_id = start_resp["exam_id"]
    current_question = start_resp["question"]
    print(f"✓ Экзамен создан! ID экзамена: {exam_id}")

    question_counter = 1
    total_questions = 1
    if start_resp.get("has_more_questions"):
        # не знаем точное количество заранее, только фактическое
        total_questions = "?"

    while current_question:
        print("\n" + "-" * 60)
        print(f"Вопрос {question_counter}/{total_questions}")
        print(f"ID: {current_question['id']}")
        print(f"\n{current_question['text']}")

        if current_question.get("reference_answer"):
            print(f"\n[Эталонный ответ: {current_question['reference_answer']}]")

        answer = input("\nВаш ответ: ").strip()
        if not answer:
            print("Ответ не может быть пустым!")
            continue

        print("\nОцениваем ответ...")
        submit_resp = _submit_answer(
            base_url=base_url,
            course_id=course_id,
            exam_id=exam_id,
            answer=answer,
        )
        if submit_resp is None:
            return

        evaluation = submit_resp["evaluation"]
        print("\n" + "=" * 60)
        print("РЕЗУЛЬТАТЫ ОЦЕНКИ")
        print("=" * 60)
        print(f"Вердикт: {evaluation['verdict']}")
        if evaluation.get("score"):
            print(f"Оценка: {evaluation['score']}/100")
        print(f"\nРекомендация: {evaluation['recommendation']}")

        issues = evaluation.get("issues") or []
        if issues:
            print("\nОбнаруженные проблемы:")
            for i, issue in enumerate(issues, 1):
                print(f"  {i}. {issue}")

        current_question = submit_resp.get("next_question")
        if submit_resp.get("completed"):
            break

        question_counter += 1

    print("\n" + "=" * 60)
    print("ЭКЗАМЕН ЗАВЕРШЕН")
    print("=" * 60)

    summary = _get_summary(base_url=base_url, course_id=course_id, exam_id=exam_id)
    if summary:
        results = summary.get("results", [])
        print(f"\nВсего вопросов: {len(results)}")
        scores = [
            int(r["score"]) for r in results if r.get("score") and str(r["score"]).isdigit()
        ]
        if scores:
            avg_score = sum(scores) / len(scores)
            print(f"Средняя оценка: {avg_score:.1f}/100")
            print(f"Лучшая оценка: {max(scores)}/100")
            print(f"Худшая оценка: {min(scores)}/100")

        print("\nДетальные результаты:")
        for i, result in enumerate(results, 1):
            print(f"\n{i}. {result['question_text']}")
            print(f"   Ваш ответ: {result['user_answer'][:50]}...")
            print(f"   Оценка: {result.get('score') or 'N/A'}")
            print(f"   Вердикт: {result['verdict']}")


def _start_exam(
    *,
    base_url: str,
    course_id: int,
    question_count: int,
    language: str,
) -> Optional[Dict[str, Any]]:
    url = f"{base_url}/courses/{course_id}/exam/start"
    payload = {
        "question_count": question_count,
        "language": language,
    }
    try:
        resp = requests.post(url, json=payload, timeout=30)
        resp.raise_for_status()
        return resp.json()
    except Exception as exc:  # noqa: BLE001
        print(f"✗ Не удалось создать экзамен: {exc}")
        if hasattr(exc, "response") and getattr(exc, "response") is not None:
            print(f"Ответ сервера: {getattr(exc, 'response').text}")
        return None


def _submit_answer(
    *,
    base_url: str,
    course_id: int,
    exam_id: str,
    answer: str,
) -> Optional[Dict[str, Any]]:
    url = f"{base_url}/courses/{course_id}/exam/answer"
    payload = {
        "exam_id": exam_id,
        "answer": answer,
    }
    try:
        resp = requests.post(url, json=payload, timeout=30)
        resp.raise_for_status()
        return resp.json()
    except Exception as exc:  # noqa: BLE001
        print(f"✗ Не удалось отправить ответ: {exc}")
        if hasattr(exc, "response") and getattr(exc, "response") is not None:
            print(f"Ответ сервера: {getattr(exc, 'response').text}")
        return None


def _get_summary(
    *,
    base_url: str,
    course_id: int,
    exam_id: str,
) -> Optional[Dict[str, Any]]:
    url = f"{base_url}/courses/{course_id}/summary"
    try:
        resp = requests.get(url, params={"exam_id": exam_id}, timeout=30)
        resp.raise_for_status()
        return resp.json()
    except Exception as exc:  # noqa: BLE001
        print(f"✗ Не удалось получить результаты экзамена: {exc}")
        if hasattr(exc, "response") and getattr(exc, "response") is not None:
            print(f"Ответ сервера: {getattr(exc, 'response').text}")
        return None


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nЭкзамен прерван пользователем.")
    except Exception as e:
        print(f"\nНеожиданная ошибка: {e}")
        import traceback
        traceback.print_exc()
