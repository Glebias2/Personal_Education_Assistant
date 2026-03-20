from settings import settings


class Config:
    # Gemini (через общие настройки)
    MODEL_NAME = settings.model
    API_KEY = settings.api_key

    # Параметры генерации
    MAX_TOKENS = 4000
    TEMPERATURE_EASY = 0.1
    TEMPERATURE_MEDIUM = 0.5
    TEMPERATURE_HARD = 0.9

    # Параметры обработки
    MAX_MATERIAL_LENGTH = 8000
    MIN_QUESTION_LENGTH = 5
    REQUIRED_OPTIONS = 4

    # Параметры оценки
    GRADE_SCALE = {
        (96, 100): {'grade': '10', 'letter': 'A+', 'description': 'Превосходно! Идеальное знание материала'},
        (90, 95): {'grade': '9', 'letter': 'A', 'description': 'Отлично! Вы отлично знаете материал'},
        (84, 89): {'grade': '8', 'letter': 'B+', 'description': 'Очень хорошо! Небольшие пробелы'},
        (78, 83): {'grade': '7', 'letter': 'B', 'description': 'Хорошо! Вы хорошо разбираетесь в теме'},
        (72, 77): {'grade': '6', 'letter': 'C+', 'description': 'Удовлетворительно+ Понимаете большинство'},
        (66, 71): {'grade': '5', 'letter': 'C', 'description': 'Удовлетворительно. Есть пробелы в знаниях'},
        (60, 65): {'grade': '4', 'letter': 'D+', 'description': 'Слабо. Критические пробелы'},
        (54, 59): {'grade': '3', 'letter': 'D', 'description': 'Плохо. Нужно повторить материал'},
        (48, 53): {'grade': '2', 'letter': 'E', 'description': 'Очень плохо. Много ошибок'},
        (30, 47): {'grade': '1', 'letter': 'F', 'description': 'Очень плохо. Пересмотреть весь материал'},
        (0, 29): {'grade': '0', 'letter': 'F-', 'description': 'Неудовлетворительно. Почти ничего не известно'},
    }

    # Поддерживаемые форматы
    SUPPORTED_FORMATS = {
        '.pdf': 'application/pdf',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.txt': 'text/plain'
    }
