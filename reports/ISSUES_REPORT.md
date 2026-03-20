# Отчёт об ошибках и несовместимостях

Результат анализа. Каждая проблема пронумерована по приоритету (🔴 критическая / 🟡 важная / 🔵 улучшение).
Исправленные проблемы помечены ✅.

Последнее обновление: 2026-03-20.

---

## 🔴 КРИТИЧЕСКИЕ — функциональность сломана

---

### [CRIT-1] Auth-запросы идут на неправильный хост

**Файл:** `client/src/lib/auth.ts`

**Проблема:** Функции `loginByCredentials` и `registerUser` вызывают `fetch` с относительными URL — `/teachers/auth`, `/students/auth` и т.д. **без** базового адреса `http://localhost:8000`.

Когда фронтенд работает на `http://localhost:5173`, относительный URL разрешается в `http://localhost:5173/teachers/auth` → 404.

**Следствие:** Вход и регистрация **не работают** в dev-режиме без прокси.

**Ожидаемое решение:** Использовать `API_BASE = "http://localhost:8000"` как в `api.ts`.

---

### ✅ [CRIT-2] Чат AI-ассистента не вызывает API (закомментирован)

**Исправлено.** Компонент `AIAssistantChat.tsx` полностью переписан. Реализована система чатов с сайдбаром, историей, поиском по Weaviate и Markdown-рендерингом ответов. API-вызов `sendChatMessage` активен.

---

### ✅ [CRIT-3] `chat.py` вызывает `create_chain(course_id)` — несовместимые типы и хардкод

**Исправлено.** `chat.py` полностью переписан:
- `course_id` берётся из записи чата в БД (не захардкожен)
- `storage_id` получается через `course_repository.get_storage_id(course_id)` и передаётся как строка
- RAG-пайплайн использует функцию `ask(storage_id, message, history)`

---

### ✅ [CRIT-3b] `ChatMemory` создаётся заново на каждый запрос — история не сохраняется

**Исправлено.** История чата хранится в PostgreSQL (таблица `chat_messages`). При каждом запросе последние сообщения загружаются из БД и передаются в LLM как контекст.

---

### ✅ [CRIT-4] `addReport` получает `courseId` вместо `lab_id`

**Исправлено.** На вкладке отчётов добавлен Select-компонент для выбора лабораторной работы. `addReport` теперь получает `parseInt(selectedLabId)`.

---

### ✅ [CRIT-5] Эндпоинт загрузки файлов курса нерабочий (Python-ошибка)

**Исправлено.** Эндпоинт `upload-files` переписан. Файлы сохраняются во временную директорию, индексируются через `Indexer`, метаданные записываются в PostgreSQL. Добавлены эндпоинты `GET /files` и `DELETE /files/{file_id}`.

---

## 🟡 ВАЖНЫЕ — несовместимости и логические ошибки

---

### [WARN-1] Несогласованный префикс `/api/v1/` в эндпоинтах

**Проблема:** Половина эндпоинтов имеет префикс `/api/v1/`, другая — нет.

| Группа | Префикс |
|---|---|
| Курсы, лабы, отчёты, чат | `/api/v1/` |
| Студенты, преподаватели (auth/register/get) | Нет (`/students/`, `/teachers/`) |
| Экзамен (exam start/answer/summary) | Нет (`/courses/`) |
| Тестирование (generate/submit) | Нет префикса |

---

### [WARN-2] `getPendingReports` использует teacherId в пути как courseId

**Файл:** `client/src/lib/api.ts`

Путь `/api/v1/courses/${teacherId}/pending_reports` — семантически `/courses/{X}` означает «операция над курсом X», а X — это ID преподавателя. Путаница.

---

### [WARN-3] `PendingReport` тип не содержит `report_id`

**Файл:** `client/src/types/models.ts`

Бэкенд возвращает `report_id`, но в TypeScript-типе его нет. Кнопки «Принять/Отклонить/Удалить» работают через `any`.

---

### [WARN-4] `getCourseById` возвращает массив, поле `storage_id` vs `vector_storage_id`

Бэкенд возвращает массив из одного элемента с полем `storage_id`. Тип `Course` на фронте имеет `vector_storage_id`. Несовпадение имён полей.

---

### [WARN-5] Эндпоинт загрузки лабов не возвращает `course_id` — тип `Lab` неверен

Бэкенд: `GET /api/v1/courses/{id}/labs` возвращает `{id, number, title, task}` (без `course_id`).
TypeScript тип `Lab` требует `course_id: number` как обязательное поле.

---

### [WARN-6] Сессия тестирования глобальная — не изолирована по студентам

**Файл:** `server/src/api/endpoints/test_system.py`

`TestService` — синглтон на уровне модуля. Несколько студентов одновременно делят одну сессию.

---

### [WARN-7] Exam-сессии хранятся in-memory — теряются при рестарте

**Файл:** `server/src/api/endpoints/exam.py`

Все экзаменационные сессии хранятся в `app.state.exams`. При перезапуске uvicorn теряются.

---

### [WARN-8] `ExaminerChat` не показывает оценку текущего ответа студенту

**Файл:** `client/src/components/ExaminerChat.tsx`

Если есть следующий вопрос — оценка за текущий ответ не показывается. Студент видит фидбек только в финальной сводке.

---

### [WARN-9] `createCourseAPI` отправляет `teacher_id` как строку

**Файл:** `client/src/lib/api.ts`

`teacher_id` передаётся как `string`, бэкенд ожидает `int`. Pydantic молча конвертирует, но типизация некорректна.

---

### [WARN-10] CORS `allow_origins=["*"]` + `allow_credentials=True` — невалидная комбинация

**Файл:** `server/src/api/app.py`

По спецификации CORS, если `allow_credentials=True`, нельзя использовать `allow_origins=["*"]`.

---

### [WARN-11] `submitExamAnswer` в api.ts не имеет `/api/v1/`

**Файл:** `client/src/lib/api.ts`

Технически совместимо (бэкенд регистрирует без префикса), но нарушает единообразие API.

---

### ✅ [WARN-12] Интерфейс отчётов — нет выбора лабораторной работы

**Исправлено.** Добавлен Select-компонент с выбором лабораторной перед отправкой отчёта. Связано с [CRIT-4].

---

## 🔵 УЛУЧШЕНИЯ И ТЕХНИЧЕСКИЙ ДОЛГ

---

### [TECH-1] Дублирование функции `fetchJSON` / `fetchAPI` в api.ts

**Файл:** `client/src/lib/api.ts`

Две почти идентичные обёртки над `fetch`. Нужно оставить одну.

---

### ✅ [TECH-2] `ExaminerChat.tsx` содержит ~410 строк закомментированного кода

**Исправлено.** Компонент очищен, содержит только рабочий код (~264 строки).

---

### [TECH-3] Вкладка "Статистика" — заглушка без функциональности

**Файл:** `client/src/pages/CourseDetailTeacher.tsx`

Вкладка «Статистика» — текст-заглушка. Нет API-эндпоинта и данных.

---

### ✅ [TECH-4] Управление файлами курса — заглушки

**Частично исправлено.** Эндпоинт `upload-files` работает. Добавлены: список файлов (`GET /files`), удаление файла (`DELETE /files/{file_id}`), очистка Weaviate при удалении курса. Кнопки на фронте преподавателя работают.

---

### ✅ [TECH-5] `TestingInterface` не использует `courseId`

**Исправлено.** `courseId` передаётся в запрос `generate-by-topic`. Тесты генерируются на основе материалов конкретного курса из Weaviate.

---

### [TECH-6] Агент `personalization` не интегрирован в API

**Файл:** `server/src/agents/personalization/`

Агент существует, но ни один API-эндпоинт его не вызывает.

---

### [TECH-7] Фронтенд не в Docker Compose (сервис закомментирован)

**Файл:** `docker-compose.yml`

Сервис `frontend` закомментирован. Фронт запускается вручную.

---

### [TECH-8] `on_event("startup")` устарел в FastAPI

**Файл:** `server/src/api/endpoints/exam.py`

Устарел с FastAPI 0.93. Рекомендуется `@asynccontextmanager` lifespan.

---

### [TECH-9] Пароли хранятся в открытом виде

**Файлы:** `server/src/database/sql/repositories/students.py`, `teachers.py`

Auth возвращает совпадение по login+password — пароли хранятся plaintext.

---

## Сводная таблица

| ID | Приоритет | Статус | Компонент | Краткое описание |
|---|---|---|---|---|
| CRIT-1 | 🔴 | Открыт | auth.ts | Авторизация — нет base URL |
| CRIT-2 | 🔴 | ✅ | AIAssistantChat | Чат полностью переписан и работает |
| CRIT-3 | 🔴 | ✅ | chat.py + rag/ | storage_id корректно берётся из БД |
| CRIT-3b | 🔴 | ✅ | chat.py | История чата хранится в PostgreSQL |
| CRIT-4 | 🔴 | ✅ | CourseDetailStudent | lab_id передаётся через Select |
| CRIT-5 | 🔴 | ✅ | courses.py | upload-files переписан, работает |
| WARN-1 | 🟡 | Открыт | API | Несогласованные префиксы /api/v1/ |
| WARN-2 | 🟡 | Открыт | api.ts / reports.py | teacherId в пути /courses/ |
| WARN-3 | 🟡 | Открыт | models.ts | PendingReport не содержит report_id |
| WARN-4 | 🟡 | Открыт | CourseDetail* | storage_id vs vector_storage_id |
| WARN-5 | 🟡 | Открыт | labs.py / models.ts | Lab требует course_id, API не возвращает |
| WARN-6 | 🟡 | Открыт | test_system.py | Глобальная сессия тестирования |
| WARN-7 | 🟡 | Открыт | exam.py | Экзамен in-memory |
| WARN-8 | 🟡 | Открыт | ExaminerChat | Оценка не показывается в процессе |
| WARN-9 | 🟡 | Открыт | api.ts | teacher_id как string |
| WARN-10 | 🟡 | Открыт | app.py | CORS * + credentials |
| WARN-11 | 🟡 | Открыт | api.ts | submitExamAnswer без /api/v1/ |
| WARN-12 | 🟡 | ✅ | CourseDetailStudent | Выбор лабы добавлен |
| TECH-1 | 🔵 | Открыт | api.ts | Дублирование fetchJSON / fetchAPI |
| TECH-2 | 🔵 | ✅ | ExaminerChat | Закомментированный код удалён |
| TECH-3 | 🔵 | Открыт | CourseDetailTeacher | Статистика — заглушка |
| TECH-4 | 🔵 | ✅ | CourseDetailTeacher | Управление файлами работает |
| TECH-5 | 🔵 | ✅ | TestingInterface | courseId используется |
| TECH-6 | 🔵 | Открыт | agents/ | Personalization не подключён |
| TECH-7 | 🔵 | Открыт | docker-compose | Фронтенд не в Docker |
| TECH-8 | 🔵 | Открыт | exam.py | on_event устарел |
| TECH-9 | 🔵 | Открыт | repositories | Пароли plaintext |
