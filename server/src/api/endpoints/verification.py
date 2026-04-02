from __future__ import annotations

from models.enums import VerificationStatus
from models.report import NewReport
from database.sql.repositories import LabRepository, ReportRepository
from database.vector.repositories import ReportIndex
from agents.verification import VerificationAgent
from agents.verification.parser import ReportDownloader
from api.schemas.reports import AddReportModel

from ..app import app


@app.post("/api/v1/reports", tags=["Отчёты"])
async def add_report(request: AddReportModel):
    agent = VerificationAgent()
    database = LabRepository()
    report_index = ReportIndex()

    report_url = request.url
    lab_task = database.get_lab_task(request.lab_id)

    async with ReportDownloader() as loager:
        report = await loager.download_report(report_url)

    result = await agent.arun(lab_task, report)

    if result["status"] == VerificationStatus.DISAPPROVE:
        return {"status": "rejected", "message": result["agent_message"]}

    report_rep = ReportRepository()
    report = NewReport(
        student_id=request.student_id,
        lab_id=request.lab_id,
        url=report_url
    )
    report_rep.add(report)
    report_index.add_report(result["vector"], str(request.student_id))

    return {"status": "loaded"}
