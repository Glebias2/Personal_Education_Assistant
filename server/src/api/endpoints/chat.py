from fastapi import Form, HTTPException
from langchain_core.messages import HumanMessage, AIMessage

from rag.chain import ask
from database.sql import CourseRepository
from database.sql.repositories import ChatRepository

from ..app import app


@app.post("/api/v1/chats", tags=["Чат"])
def create_chat(student_id: int = Form(...), course_id: int = Form(...), name: str = Form("Новый чат")):
    """Создать новый чат для студента в рамках курса."""
    course_repository = CourseRepository()
    if not course_repository.get_storage_id(course_id):
        raise HTTPException(status_code=404, detail="Course not found or has no materials")

    chat_repository = ChatRepository()
    chat_id = chat_repository.create_chat(student_id, course_id, name)

    return {"chat_id": chat_id, "name": name}


@app.get("/api/v1/students/{student_id}/chats", tags=["Чат"])
def get_student_chats(student_id: int):
    """Список всех чатов студента."""
    chat_repository = ChatRepository()
    rows = chat_repository.get_student_chats(student_id)
    return [
        {
            "chat_id": chat_id,
            "name": name,
            "course_id": course_id,
            "course_title": course_title,
            "created_at": created_at,
        }
        for (chat_id, name, course_id, course_title, created_at) in rows
    ]


@app.delete("/api/v1/chats/{chat_id}", tags=["Чат"])
def delete_chat(chat_id: int):
    """Удалить чат и все его сообщения."""
    chat_repository = ChatRepository()
    if not chat_repository.delete_chat(chat_id):
        raise HTTPException(status_code=404, detail="Chat not found")
    return {"success": True}


@app.patch("/api/v1/chats/{chat_id}", tags=["Чат"])
def rename_chat(chat_id: int, name: str = Form(...)):
    """Переименовать чат."""
    chat_repository = ChatRepository()
    if not chat_repository.rename_chat(chat_id, name):
        raise HTTPException(status_code=404, detail="Chat not found")
    return {"success": True, "name": name}


@app.get("/api/v1/chats/{chat_id}/messages", tags=["Чат"])
def get_chat_messages(chat_id: int):
    """История сообщений конкретного чата."""
    chat_repository = ChatRepository()
    chat = chat_repository.get_chat(chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    messages = chat_repository.get_messages(chat_id)
    return [{"role": role, "content": content} for (role, content) in messages]


@app.post("/api/v1/chats/{chat_id}/messages", tags=["Чат"])
def send_message(chat_id: int, message: str = Form(...)):
    """Отправить сообщение в чат и получить ответ AI."""
    chat_repository = ChatRepository()
    chat = chat_repository.get_chat(chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    _, _, course_id, _, _ = chat

    course_repository = CourseRepository()
    storage_id = course_repository.get_storage_id(course_id)
    if not storage_id:
        raise HTTPException(status_code=404, detail="Course has no uploaded materials")

    # Загружаем историю из БД и конвертируем в LangChain-формат
    raw_messages = chat_repository.get_messages(chat_id, limit=20)
    history = []
    for role, content in raw_messages:
        if role == "human":
            history.append(HumanMessage(content=content))
        else:
            history.append(AIMessage(content=content))

    response = ask(storage_id, message, history)

    chat_repository.add_message(chat_id, "human", message)
    chat_repository.add_message(chat_id, "ai", response)

    return {"response": response}
