import glob
import os
import shutil
import tempfile
from pathlib import Path
from typing import List

from fastapi import File, HTTPException, UploadFile
from fastapi.responses import FileResponse

from database.sql import CourseRepository
from database.vector.repositories import StorageManager
from rag.indexer import Indexer
from rag.exceptions import InvalidFile

from ..app import app

UPLOADS_DIR = Path("/app/uploads")
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


@app.post("/api/v1/courses/{course_id}/upload-files", tags=["Курсы"])
async def upload_files_for_course(course_id: int, files: List[UploadFile] = File(...)):
    course_repository = CourseRepository()

    storage_id = course_repository.get_storage_id(course_id)
    if not storage_id:
        storage_id = StorageManager.create_storage()
        course_repository.update(course_id, storage_id=storage_id)
        indexer = Indexer(storage_id)
    else:
        try:
            indexer = Indexer(storage_id)
        except ValueError:
            storage_id = StorageManager.create_storage()
            course_repository.update(course_id, storage_id=storage_id)
            indexer = Indexer(storage_id)

    indexed = []

    for file in files:
        contents = await file.read()
        suffix = Path(file.filename).suffix

        tmp_path = None
        try:
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                tmp.write(contents)
                tmp_path = tmp.name

            file_id = indexer.add_file(tmp_path)
            dest_path = UPLOADS_DIR / f"{file_id}{suffix}"
            shutil.copy2(tmp_path, dest_path)
            course_repository.add_course_file(course_id, file.filename, file_id)
            indexed.append({"filename": file.filename, "file_id": file_id})
        except InvalidFile:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format: {file.filename}. Allowed: .pdf, .docx, .txt"
            )
        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.unlink(tmp_path)

    return {"success": True, "indexed": indexed}


@app.get("/api/v1/courses/{course_id}/files", tags=["Курсы"])
def get_course_files(course_id: int):
    course_repository = CourseRepository()
    rows = course_repository.get_course_files(course_id)
    return {
        "files": [
            {"id": row[0], "filename": row[1], "file_id": row[2], "created_at": str(row[3])}
            for row in rows
        ]
    }


@app.delete("/api/v1/courses/{course_id}/files/{file_record_id}", tags=["Курсы"])
def delete_course_file(course_id: int, file_record_id: int):
    """Удалить файл из курса: убирает чанки из Weaviate и запись из SQL."""
    course_repository = CourseRepository()

    rows = course_repository.get_course_files(course_id)
    file_row = next((r for r in rows if r[0] == file_record_id), None)
    if not file_row:
        raise HTTPException(status_code=404, detail="File not found")

    file_id = file_row[2]  # (id, filename, file_id, created_at)

    storage_id = course_repository.get_storage_id(course_id)
    if storage_id:
        try:
            vector_storage = StorageManager.get_vector_storage(storage_id)
            vector_storage.delete_by_file_id(file_id)
        except ValueError:
            pass

    for f in glob.glob(str(UPLOADS_DIR / f"{file_id}.*")):
        try:
            os.unlink(f)
        except OSError:
            pass

    course_repository.delete_course_file(file_record_id)
    return {"success": True}


@app.get("/api/v1/courses/{course_id}/files/{file_id}/download", tags=["Курсы"])
def download_course_file(course_id: int, file_id: str):
    """Скачать файл материала курса."""
    matches = glob.glob(str(UPLOADS_DIR / f"{file_id}.*"))
    if not matches:
        raise HTTPException(status_code=404, detail="File not found on disk")
    file_path = matches[0]
    rows = CourseRepository().get_course_files(course_id)
    file_row = next((r for r in rows if r[2] == file_id), None)
    filename = file_row[1] if file_row else Path(file_path).name
    return FileResponse(file_path, filename=filename, media_type="application/octet-stream")
