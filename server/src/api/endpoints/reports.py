from database.sql import ReportRepository

from ..app import app
from ..schemas.reports import SetReportStatusModel
from models.enums import ReportStatus

@app.get("/api/v1/courses/{teacher_id}/pending_reports", tags=["Отчёты"])
async def get_pending_reports_for_teacher_legacy(teacher_id: int):
    report_repository = ReportRepository()

    reports = report_repository.get_teacher_pending_reports(teacher_id)
    info_list = []

    for part in reports:
        report_id, student_id, course_title, lab_title, url = part
        # legacy-ключ "student_id" раньше ошибочно содержал report_id,
        # оставляем оба поля для обратной совместимости
        info_list.append(
            {
                "student_id": student_id,
                "report_id": report_id,
                "course_title": course_title,
                "lab_title": lab_title,
                "url": url,
            }
        )

    return {"reports": info_list}


@app.get("/api/v1/teachers/{teacher_id}/reports/pending", tags=["Отчёты"])
async def get_pending_reports_for_teacher(teacher_id: int):
    report_repository = ReportRepository()

    reports = report_repository.get_teacher_pending_reports(teacher_id)
    info_list = []

    for part in reports:
        report_id, student_id, course_title, lab_title, url = part
        info_list.append(
            {
                "student_id": student_id,
                "report_id": report_id,
                "course_title": course_title,
                "lab_title": lab_title,
                "url": url,
            }
        )

    return {"reports": info_list}


@app.get("/api/v1/students/{student_id}/reports", tags=["Отчёты"])
async def get_student_reports(student_id: int):
    report_repository = ReportRepository()
    reports = report_repository.get_student_reports(student_id)
    out = []
    for report_id, course_title, lab_title, url, status, comment in reports:
        out.append(
            {
                "report_id": report_id,
                "course_title": course_title,
                "lab_title": lab_title,
                "url": url,
                "status": status,
                "comment": comment,
            }
        )
    return {"reports": out}


@app.post("/api/v1/reports/{report_id}/status", tags=["Отчёты"])
async def set_report_status(report_id: int, payload: SetReportStatusModel):
    status_raw = payload.status.strip().lower()
    if status_raw in {"approved", "approve"}:
        status = ReportStatus.APPROVED
    elif status_raw in {"not-approved", "rejected", "reject"}:
        status = ReportStatus.NOT_APPROVED
    elif status_raw in {"pending"}:
        status = ReportStatus.PENDING
    else:
        return {"success": False, "error": "Unknown status"}

    report_repository = ReportRepository()
    report_repository.set_report_status(report_id, status, payload.comment)
    return {"success": True}


@app.delete("/api/v1/reports/{report_id}", tags=["Отчёты"])
async def delete_report(report_id: int):
    report_repository = ReportRepository()
    success = report_repository.delete(report_id)
    return {"success": success}
