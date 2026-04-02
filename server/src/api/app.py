from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

tags_metadata = [
    {"name": "Курсы", "description": "CRUD курсов, материалы, заявки"},
    {"name": "Лабораторные", "description": "Создание и управление лабораторными работами"},
    {"name": "Отчёты", "description": "Загрузка, верификация и модерация отчётов"},
    {"name": "Чат", "description": "AI-ассистент: создание чатов, отправка сообщений (RAG)"},
    {"name": "Экзамен", "description": "Пробный экзамен с AI-экзаменатором"},
    {"name": "Тестирование", "description": "Генерация и прохождение тестов"},
    {"name": "Преподаватели", "description": "Авторизация, регистрация, профиль преподавателя"},
    {"name": "Студенты", "description": "Авторизация, регистрация, профиль студента"},
    {"name": "Рекомендации", "description": "Теги, интересы, рейтинги, рекомендации курсов"},
]

app = FastAPI(
    title="Personal Agentic Assistant API",
    description="Образовательная платформа БГУИР — AI-ассистент, экзамен, тестирование, RAG-чат",
    version="1.0.0",
    openapi_tags=tags_metadata,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
