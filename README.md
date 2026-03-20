# Personal Agentic Assistant

Образовательная платформа. Преподаватель создаёт курсы, добавляет лабораторные и загружает материалы. Студент записывается на курс, сдаёт отчёты, проходит тесты и общается с AI-ассистентом по материалам курса.

## Стек

**Бэкенд:** Python, FastAPI, PostgreSQL, Weaviate (векторная БД для RAG).

**LLM:** Google Gemini — используется везде: чат-ассистент, генерация тестов, проверка отчётов, экзаменатор.

**Фронтенд:** React + TypeScript + Tailwind CSS + shadcn/ui.

## Настройка .env

Скопируй `.env.example` в `.env` и заполни:

```env
MODEL_NAME = gemini-2.0-flash
MODEL_API_KEY = твой_google_api_key
EMBEDDING_MODEL = models/embedding-001

EDUCATION_DATABASE_HOST = education_database
EDUCATION_DATABASE_PORT = 5432
EDUCATION_DATABASE_USER = postgres
EDUCATION_DATABASE_PASS = твой_пароль
EDUCATION_DATABASE_NAME = education_database
```

Если нужен прокси для доступа к Google API — добавь строку:

```env
HTTPS_PROXY = http://login:password@host:port
```

## Запуск

Нужен Docker. В одном терминале поднимаем бэкенд и базы:

```bash
docker compose up --build
```

В другом терминале — фронтенд:

```bash
cd client
npm install
npm run dev
```

После этого:
- Фронтенд: http://localhost:5173
- Бэкенд API: http://localhost:8000
