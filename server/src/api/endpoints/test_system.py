import tempfile
import traceback
from pathlib import Path

from fastapi import UploadFile, File

from agents.test_generator.processor import MaterialProcessor
from agents.test_generator.service import TestService
from agents.test_generator.schemas import (
    GenerateByTopicRequest,
    GenerateByFileRequest,
    SubmitAnswersRequest,
    TestsResponse,
    EvaluationResponseAPI,
    ResetResponse,
    HealthResponse
)

from ..app import app

service = TestService()
processor = MaterialProcessor()


# Проверка статуса API
@app.get("/api/v1/tests/health", response_model=HealthResponse, tags=["Тестирование"])
def health_check():
    return HealthResponse(
        status="healthy",
        message="API работает нормально"
    )

# Загрузка файла
@app.post("/api/v1/tests/upload", tags=["Тестирование"])
async def upload_file(file: UploadFile = File(...)):
    temp_path = None

    try:
        # Создаём временный файл
        temp_path = Path(tempfile.gettempdir()) / file.filename
        content = await file.read()
        temp_path.write_bytes(content)

        # Извлекаем текст
        material = processor.extract_text_from_file(str(temp_path))

        if not material:
            return {
                "success": False,
                "error": "Не удалось извлечь текст из файла"
            }

        # Загружаем в сессию
        result = service.upload_material(material)

        return result

    except Exception as e:
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e)
        }
    finally:
        if temp_path and temp_path.exists():
            temp_path.unlink()

# Генерация теста по теме из БД
@app.post("/api/v1/tests/generate-by-topic", response_model=TestsResponse, tags=["Тестирование"])
def generate_tests_by_topic(request: GenerateByTopicRequest):
    try:
        # Используем сервис который теперь получает материал из БД
        response = service.generate_by_topic(request)
        return response

    except Exception as e:
        print(f"[GENERATE-BY-TOPIC] Ошибка: {e}")
        traceback.print_exc()
        return TestsResponse(
            success=False,
            total_questions=0,
            difficulty="unknown",
            questions=[],
            error=str(e)
        )


# Генерация теста из файла
@app.post("/api/v1/tests/generate-by-file", response_model=TestsResponse, tags=["Тестирование"])
def generate_tests_by_file(request: GenerateByFileRequest):
    try:
        response = service.generate_by_file(request)
        return response

    except Exception as e:
        traceback.print_exc()
        return TestsResponse(
            success=False,
            total_questions=0,
            difficulty="unknown",
            error=str(e)
        )

# Проверка ответов на тест
@app.post("/api/v1/tests/submit", response_model=EvaluationResponseAPI, tags=["Тестирование"])
def submit_answers(request: SubmitAnswersRequest):
    try:
        response = service.submit_answers(request)

        return response

    except Exception as e:
        traceback.print_exc()
        return EvaluationResponseAPI(
            success=False,
            error=str(e)
        )

# Получаем статус сессии
@app.get("/api/v1/tests/status", tags=["Тестирование"])
def get_status():
    try:
        return service.get_status()
    except Exception as e:
        traceback.print_exc()
        return {"error": str(e)}

# Сбросить сессию
@app.post("/api/v1/tests/reset", response_model=ResetResponse, tags=["Тестирование"])
def reset_session():
    try:
        result = service.reset_session()
        return ResetResponse(
            success=result["success"],
            message=result["message"]
        )
    except Exception as e:
        traceback.print_exc()
        return ResetResponse(
            success=False,
            message=str(e)
        )
