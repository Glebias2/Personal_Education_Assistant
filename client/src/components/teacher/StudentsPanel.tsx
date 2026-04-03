import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { CheckCircle2, Eye, Loader2, Search, XCircle } from "lucide-react"
import type { StudentTestResult, StudentExamResult, StudentReportResult } from "@/lib/api"

interface EnrolledStudent {
  id: number
  first_name: string
  last_name: string
}

interface Props {
  enrolledStudents: EnrolledStudent[]
  filteredStudents: EnrolledStudent[]
  requests: any[]
  requestsPending: any[]
  pendingReports: any[]
  studentSearch: string
  selectedStudent: EnrolledStudent | null
  studentDetails: { tests: StudentTestResult[]; exams: StudentExamResult[]; reports: StudentReportResult[] } | null
  detailsLoading: boolean
  moderatingRequestId: number | null
  onStudentSearchChange: (value: string) => void
  onOpenStudentDetails: (student: EnrolledStudent) => void
  onCloseStudentDetails: () => void
  onApproveRequest: (requestId: number) => void
  onRejectRequest: (requestId: number) => void
  onUpdateReportStatus: (reportId: number, status: "approved" | "rejected") => void
  onDeleteReport: (reportId: number) => void
}

export default function StudentsPanel({
  enrolledStudents,
  filteredStudents,
  requests,
  requestsPending,
  pendingReports,
  studentSearch,
  selectedStudent,
  studentDetails,
  detailsLoading,
  moderatingRequestId,
  onStudentSearchChange,
  onOpenStudentDetails,
  onCloseStudentDetails,
  onApproveRequest,
  onRejectRequest,
  onUpdateReportStatus,
  onDeleteReport,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Зачисленные студенты */}
        <Card className="lg:col-span-2 border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle>Зачисленные студенты</CardTitle>
            <CardDescription>Все студенты, имеющие доступ к курсу</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по фамилии..."
                value={studentSearch}
                onChange={(e) => onStudentSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
            {enrolledStudents.length === 0 ? (
              <div className="text-sm text-muted-foreground">Пока нет зачисленных студентов</div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-sm text-muted-foreground">Студент не найден</div>
            ) : (
              <div className="grid gap-3">
                {filteredStudents.map((s) => (
                  <div key={s.id} className="p-4 rounded-xl border border-border bg-card/30 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{s.first_name} {s.last_name}</div>
                      <div className="text-sm text-muted-foreground">ID: {s.id}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => onOpenStudentDetails(s)}>
                        <Eye className="h-4 w-4 mr-1" /> Подробнее
                      </Button>
                      <Badge variant="secondary">Зачислен</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student details dialog */}
        <Dialog open={!!selectedStudent} onOpenChange={(open) => { if (!open) onCloseStudentDetails() }}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedStudent ? `${selectedStudent.last_name} ${selectedStudent.first_name} — результаты` : ""}
              </DialogTitle>
            </DialogHeader>
            {detailsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : studentDetails ? (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">
                    Тесты ({studentDetails.tests.length})
                    {studentDetails.tests.length > 0 && (
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        средний %: {(studentDetails.tests.reduce((s, t) => s + t.percentage, 0) / studentDetails.tests.length).toFixed(1)}%
                      </span>
                    )}
                  </h3>
                  {studentDetails.tests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Тесты не проходились</p>
                  ) : (
                    <div className="space-y-2">
                      {studentDetails.tests.map((t) => (
                        <div key={t.id} className="flex items-center justify-between text-sm p-2 rounded-lg border border-border/50">
                          <div>
                            <span className="font-medium">{t.topic || "Без темы"}</span>
                            <span className="text-muted-foreground ml-2">· {t.difficulty}</span>
                          </div>
                          <div className="flex items-center gap-3 text-right">
                            <span>{t.correct_answers}/{t.total_questions} ({t.percentage.toFixed(1)}%)</span>
                            <span className="text-muted-foreground text-xs">{String(t.created_at).split("T")[0].split(" ")[0]}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Экзамены ({studentDetails.exams.length})</h3>
                  {studentDetails.exams.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Экзамены не сдавались</p>
                  ) : (
                    <div className="space-y-2">
                      {studentDetails.exams.map((e) => (
                        <div key={e.id} className="flex items-center justify-between text-sm p-2 rounded-lg border border-border/50">
                          <div className="flex items-center gap-2">
                            <span>{e.total_questions} вопросов</span>
                            <Badge variant={e.completed ? "default" : "secondary"} className="text-xs">
                              {e.completed ? "Завершён" : "Не завершён"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3">
                            <span>{e.avg_score !== null ? `${e.avg_score.toFixed(1)}/100` : "—"}</span>
                            <span className="text-muted-foreground text-xs">{String(e.created_at).split("T")[0].split(" ")[0]}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Лабораторные ({studentDetails.reports.length})</h3>
                  {studentDetails.reports.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Отчёты не загружены</p>
                  ) : (
                    <div className="space-y-2">
                      {studentDetails.reports.map((r) => (
                        <div key={r.id} className="flex items-start justify-between text-sm p-2 rounded-lg border border-border/50">
                          <div>
                            <span className="font-medium">{r.lab_title}</span>
                            {r.comment && <p className="text-muted-foreground text-xs mt-0.5">{r.comment}</p>}
                          </div>
                          <Badge
                            variant={r.status === "approved" ? "default" : r.status === "pending" ? "outline" : "destructive"}
                            className={r.status === "approved" ? "bg-green-500 text-white" : r.status === "pending" ? "border-yellow-500 text-yellow-600" : ""}
                          >
                            {r.status === "approved" ? "Принято" : r.status === "pending" ? "На проверке" : "Не принято"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        {/* Заявки на курс */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle>Заявки на курс</CardTitle>
            <CardDescription>Одобрите или отклоните зачисление</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {requestsPending.length === 0 ? (
              <div className="text-sm text-muted-foreground">Новых заявок нет</div>
            ) : (
              requestsPending.map((r) => (
                <div key={r.id} className="p-4 rounded-xl border border-border bg-card/30">
                  <div className="font-medium">{r.first_name} {r.last_name}</div>
                  <div className="text-sm text-muted-foreground">ID: {r.student_id}</div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-transparent w-full"
                      onClick={() => onApproveRequest(r.id)}
                      disabled={moderatingRequestId === r.id}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" /> Принять
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="w-full"
                      onClick={() => onRejectRequest(r.id)}
                      disabled={moderatingRequestId === r.id}
                    >
                      <XCircle className="h-4 w-4 mr-2" /> Отклонить
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Отчеты на проверке */}
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle>Отчеты на проверке</CardTitle>
          <CardDescription>Pending отчеты по курсу</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingReports.length === 0 ? (
            <div className="text-sm text-muted-foreground">Нет отчетов на проверке</div>
          ) : (
            pendingReports.map((r: any) => (
              <div key={r.report_id || `${r.student_id}-${r.url}`} className="p-4 rounded-xl border border-border bg-card/30">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{r.lab_title}</div>
                    <div className="text-sm text-muted-foreground mt-1">Студент #{r.student_id}</div>
                    {r.url && (
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline mt-2 inline-block">
                        Открыть отчет
                      </a>
                    )}
                  </div>
                  <Badge>На проверке</Badge>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={() => onUpdateReportStatus(Number(r.report_id), "approved")} disabled={!r.report_id}>
                    Принять
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => onUpdateReportStatus(Number(r.report_id), "rejected")} disabled={!r.report_id}>
                    Отклонить
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onDeleteReport(Number(r.report_id))} disabled={!r.report_id}>
                    Удалить
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
