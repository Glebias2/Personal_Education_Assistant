import { useEffect, useMemo, useRef, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, CheckCircle2, Eye, Pencil, Plus, Search, Trash2, XCircle, Upload, FileText, Loader2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import CourseAnalyticsPanel from "@/components/CourseAnalytics"
import { getAuthUser } from "@/lib/auth"
import {
  approveCourseRequest,
  createLab,
  deleteCourse,
  deleteLab,
  deleteReport,
  getCourseById,
  getCourseFiles,
  getCourseLabs,
  getCourseRequests,
  getCourseStudents,
  getPendingReports,
  rejectCourseRequest,
  updateCourse,
  updateLab,
  updateReport,
  uploadCourseFiles,
  deleteCourseFile,
  getStudentTestResultsByCourse,
  getStudentExamResultsByCourse,
  getStudentReportsByCourse,
  type StudentTestResult,
  type StudentExamResult,
  type StudentReportResult,
} from "@/lib/api"

export default function CourseDetailTeacher() {
  const { courseId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()

  const authUser = getAuthUser()
  const teacherId = location.state?.teacherId || authUser?.id
  const courseIdNum = Number(courseId)

  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState<any | null>(null)
  const [labs, setLabs] = useState<any[]>([])
  const [enrolledStudents, setEnrolledStudents] = useState<{ id: number; first_name: string; last_name: string }[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [pendingReports, setPendingReports] = useState<any[]>([])

  const [newLab, setNewLab] = useState({ number: 1, title: "", task: "" })
  const [editingLab, setEditingLab] = useState<any | null>(null)

  const [editingCourse, setEditingCourse] = useState(false)
  const [courseForm, setCourseForm] = useState({ title: "", exam_questions: "", vector_storage_id: "" })

  const [moderatingRequestId, setModeratingRequestId] = useState<number | null>(null)

  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [courseFiles, setCourseFiles] = useState<{ id: number; filename: string; file_id: string; created_at: string }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [studentSearch, setStudentSearch] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<{ id: number; first_name: string; last_name: string } | null>(null)
  const [studentDetails, setStudentDetails] = useState<{
    tests: StudentTestResult[]
    exams: StudentExamResult[]
    reports: StudentReportResult[]
  } | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  const loadData = async () => {
    if (!courseIdNum || !teacherId) return
    setLoading(true)
    try {
      const courseData = await getCourseById(courseIdNum)
      const courseObj = Array.isArray(courseData) ? courseData[0] : courseData
      setCourse(courseObj)

      setCourseForm({
        title: courseObj?.title || "",
        exam_questions: courseObj?.exam_questions || "",
        vector_storage_id: courseObj?.vector_storage_id || courseObj?.storage_id || "",
      })

      const labsData = await getCourseLabs(courseIdNum)
      setLabs(labsData)

      const studentsResp = await getCourseStudents(courseIdNum)
      setEnrolledStudents(studentsResp.students || [])

      const reqResp = await getCourseRequests(courseIdNum)
      setRequests(reqResp.requests || [])

      const pending = await getPendingReports(teacherId)
      const filtered = (pending.reports || []).filter((r: any) => r.course_title === courseObj?.title)
      setPendingReports(filtered)

      const filesResp = await getCourseFiles(courseIdNum)
      setCourseFiles(filesResp.files || [])
    } catch {
      toast({ title: "Ошибка", description: "Не удалось загрузить данные курса", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line
  }, [courseId])

  const handleCreateLab = async () => {
    if (!courseIdNum || !newLab.title) {
      toast({ title: "Заполните все поля", variant: "destructive" })
      return
    }
    try {
      await createLab({ ...newLab, course_id: courseIdNum })
      toast({ title: "Лаба создана" })
      setNewLab({ number: 1, title: "", task: "" })
      loadData()
    } catch {
      toast({ title: "Ошибка создания лабы", variant: "destructive" })
    }
  }

  const handleDeleteLab = async (labId: number) => {
    try {
      await deleteLab(labId)
      toast({ title: "Лаба удалена" })
      loadData()
    } catch {
      toast({ title: "Ошибка удаления", variant: "destructive" })
    }
  }

  const handleUpdateLab = async () => {
    if (!editingLab) return
    try {
      await updateLab(editingLab.id, { number: editingLab.number, title: editingLab.title, task: editingLab.task })
      toast({ title: "Лаба обновлена" })
      setEditingLab(null)
      loadData()
    } catch {
      toast({ title: "Ошибка обновления", variant: "destructive" })
    }
  }

  const handleUpdateCourse = async () => {
    if (!courseIdNum) return
    try {
      await updateCourse(courseIdNum, courseForm)
      toast({ title: "Курс обновлен" })
      setEditingCourse(false)
      loadData()
    } catch {
      toast({ title: "Ошибка обновления курса", variant: "destructive" })
    }
  }

  const handleDeleteCourse = async () => {
    if (!courseIdNum) return
    try {
      await deleteCourse(courseIdNum)
      toast({ title: "Курс удален" })
      navigate("/teacher")
    } catch {
      toast({ title: "Не удалось удалить курс", variant: "destructive" })
    }
  }

  const handleDeleteReport = async (reportId: number) => {
    try {
      await deleteReport(reportId)
      toast({ title: "Отчет удален" })
      loadData()
    } catch {
      toast({ title: "Ошибка удаления", variant: "destructive" })
    }
  }

  const handleUpdateReportStatus = async (reportId: number, status: "approved" | "rejected") => {
    try {
      await updateReport(reportId, { status })
      toast({ title: "Статус обновлен" })
      loadData()
    } catch {
      toast({ title: "Ошибка обновления", variant: "destructive" })
    }
  }

  const handleApproveRequest = async (requestId: number) => {
    setModeratingRequestId(requestId)
    try {
      await approveCourseRequest(requestId)
      toast({ title: "Студент зачислен" })
      loadData()
    } catch {
      toast({ title: "Не удалось одобрить", variant: "destructive" })
    } finally {
      setModeratingRequestId(null)
    }
  }

  const handleRejectRequest = async (requestId: number) => {
    setModeratingRequestId(requestId)
    try {
      await rejectCourseRequest(requestId)
      toast({ title: "Заявка отклонена" })
      loadData()
    } catch {
      toast({ title: "Не удалось отклонить", variant: "destructive" })
    } finally {
      setModeratingRequestId(null)
    }
  }

  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !courseIdNum) return
    setUploadingFiles(true)
    try {
      const result = await uploadCourseFiles(courseIdNum, Array.from(files))
      toast({ title: "Файлы загружены", description: `Проиндексировано файлов: ${result.indexed.length}` })
      // Перезагружаем список файлов из БД
      const filesResp = await getCourseFiles(courseIdNum)
      setCourseFiles(filesResp.files || [])
    } catch (error: any) {
      toast({ title: "Ошибка загрузки файлов", description: error.message || "Попробуйте позже", variant: "destructive" })
    } finally {
      setUploadingFiles(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const requestsPending = useMemo(() => requests.filter((r) => r.status === "pending"), [requests])

  const filteredStudents = useMemo(
    () => enrolledStudents.filter((s) => s.last_name.toLowerCase().includes(studentSearch.toLowerCase())),
    [enrolledStudents, studentSearch]
  )

  const openStudentDetails = async (s: { id: number; first_name: string; last_name: string }) => {
    setSelectedStudent(s)
    setStudentDetails(null)
    setDetailsLoading(true)
    try {
      const [testsRes, examsRes, reportsRes] = await Promise.all([
        getStudentTestResultsByCourse(s.id, courseIdNum),
        getStudentExamResultsByCourse(s.id, courseIdNum),
        getStudentReportsByCourse(s.id, courseIdNum),
      ])
      setStudentDetails({ tests: testsRes.results, exams: examsRes.results, reports: reportsRes.reports })
    } catch {
      setStudentDetails({ tests: [], exams: [], reports: [] })
    } finally {
      setDetailsLoading(false)
    }
  }
  const courseDescription = useMemo(() => {
    const q = course?.exam_questions ? "Вопросы к экзамену настроены" : "Экзаменационные вопросы не настроены"
    const m = course?.storage_id || course?.vector_storage_id ? "Материалы подключены" : "Материалы не загружены"
    return `${q}. ${m}.`
  }, [course])

  if (loading) return <div className="flex items-center justify-center min-h-screen">Загрузка...</div>
  if (!course) return <div className="flex items-center justify-center min-h-screen">Курс не найден</div>

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Button variant="ghost" onClick={() => navigate("/teacher")} className="px-0 hover:bg-transparent">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold truncate">{course.title}</h1>
            <p className="text-muted-foreground mt-1 text-sm">{courseDescription}</p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditingCourse(true)} className="bg-transparent">
              <Pencil className="h-4 w-4 mr-2" /> Изменить
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteCourse}>
              <Trash2 className="h-4 w-4 mr-2" /> Удалить
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl">
            <TabsTrigger value="overview">Обзор</TabsTrigger>
            <TabsTrigger value="students">Студенты</TabsTrigger>
            <TabsTrigger value="stats">Статистика</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-border/50 shadow-lg">
                <CardHeader>
                  <CardTitle>Материалы курса</CardTitle>
                  <CardDescription>Загрузите PDF, DOCX или TXT файлы — они будут проиндексированы для AI-ассистента</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/30">
                    <div>
                      <div className="font-medium">Векторное хранилище</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {course.storage_id || course.vector_storage_id ? `ID: ${course.storage_id || course.vector_storage_id}` : "Не подключено"}
                      </div>
                    </div>
                    <Badge variant={course.storage_id || course.vector_storage_id ? "default" : "secondary"}>
                      {course.storage_id || course.vector_storage_id ? "Активно" : "Нет"}
                    </Badge>
                  </div>

                  {/* Upload area */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.docx,.txt"
                    className="hidden"
                    onChange={(e) => handleUploadFiles(e.target.files)}
                  />
                  <div
                    onClick={() => !uploadingFiles && fileInputRef.current?.click()}
                    className={`relative p-6 rounded-xl border-2 border-dashed transition-colors text-center cursor-pointer ${
                      uploadingFiles
                        ? "border-primary/30 bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-primary/5"
                    }`}
                  >
                    {uploadingFiles ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Загрузка и индексация файлов...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm font-medium">Нажмите для загрузки файлов</p>
                        <p className="text-xs text-muted-foreground">PDF, DOCX, TXT</p>
                      </div>
                    )}
                  </div>

                  {/* Uploaded files list */}
                  {courseFiles.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Загруженные файлы ({courseFiles.length}):</div>
                      {courseFiles.map((f) => (
                        <div key={f.id} className="flex items-center gap-2 p-2 rounded-lg bg-card/30 border border-border/50 group">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm truncate">{f.filename}</span>
                          <Badge variant="secondary" className="ml-auto text-xs shrink-0">Проиндексирован</Badge>
                          <button
                            onClick={async () => {
                              if (!confirm(`Удалить файл "${f.filename}"? Данные будут удалены из векторного хранилища.`)) return
                              try {
                                await deleteCourseFile(courseIdNum, f.id)
                                const filesResp = await getCourseFiles(courseIdNum)
                                setCourseFiles(filesResp.files || [])
                                toast({ title: "Файл удалён" })
                              } catch (err) {
                                toast({ title: "Ошибка удаления файла", variant: "destructive" })
                              }
                            }}
                            className="p-1 rounded hover:bg-destructive/20 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-lg">
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Лабораторные</CardTitle>
                    <CardDescription>Создание и управление лабами</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="gradient" className="shadow-md">
                        <Plus className="mr-2 h-4 w-4" /> Добавить
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Новая лабораторная</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Номер</Label>
                          <Input type="number" value={newLab.number} onChange={(e) => setNewLab({ ...newLab, number: parseInt(e.target.value) })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Название</Label>
                          <Input value={newLab.title} onChange={(e) => setNewLab({ ...newLab, title: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Задание</Label>
                          <Textarea value={newLab.task} onChange={(e) => setNewLab({ ...newLab, task: e.target.value })} />
                        </div>
                        <Button onClick={handleCreateLab} variant="gradient" className="w-full">
                          Создать
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="space-y-3">
                  {labs.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Лабораторные пока не добавлены</div>
                  ) : (
                    labs.map((lab) => (
                      <div key={lab.id} className="p-4 rounded-xl border border-border bg-card/30">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium truncate">
                              Лаба {lab.number}: {lab.title}
                            </div>
                            {lab.task && <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{lab.task}</div>}
                          </div>
                          <div className="flex gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => setEditingLab({ ...lab })}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Редактировать лабораторную</DialogTitle>
                                </DialogHeader>
                                {editingLab && (
                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                      <Label>Номер</Label>
                                      <Input
                                        type="number"
                                        value={editingLab.number}
                                        onChange={(e) => setEditingLab({ ...editingLab, number: parseInt(e.target.value) })}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Название</Label>
                                      <Input value={editingLab.title} onChange={(e) => setEditingLab({ ...editingLab, title: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Задание</Label>
                                      <Textarea value={editingLab.task} onChange={(e) => setEditingLab({ ...editingLab, task: e.target.value })} />
                                    </div>
                                    <Button onClick={handleUpdateLab} variant="gradient" className="w-full">
                                      Сохранить
                                    </Button>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteLab(lab.id)} className="hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="students" className="mt-6 space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
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
                      onChange={(e) => setStudentSearch(e.target.value)}
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
                            <div className="font-medium">
                              {s.first_name} {s.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground">ID: {s.id}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => openStudentDetails(s)}>
                              <Eye className="h-4 w-4 mr-1" />
                              Подробнее
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
              <Dialog open={!!selectedStudent} onOpenChange={(open) => { if (!open) setSelectedStudent(null) }}>
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
                      {/* Tests */}
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

                      {/* Exams */}
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

                      {/* Reports */}
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
                        <div className="font-medium">
                          {r.first_name} {r.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">ID: {r.student_id}</div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-transparent w-full"
                            onClick={() => handleApproveRequest(r.id)}
                            disabled={moderatingRequestId === r.id}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Принять
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="w-full"
                            onClick={() => handleRejectRequest(r.id)}
                            disabled={moderatingRequestId === r.id}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Отклонить
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

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
                        <Button size="sm" onClick={() => handleUpdateReportStatus(Number(r.report_id), "approved")} disabled={!r.report_id}>
                          Принять
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleUpdateReportStatus(Number(r.report_id), "rejected")} disabled={!r.report_id}>
                          Отклонить
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteReport(Number(r.report_id))} disabled={!r.report_id}>
                          Удалить
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="mt-6">
            <CourseAnalyticsPanel courseId={courseIdNum} />
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={editingCourse} onOpenChange={setEditingCourse}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Редактировать курс</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Экзаменационные вопросы (JSON string)</Label>
              <Textarea value={courseForm.exam_questions} onChange={(e) => setCourseForm({ ...courseForm, exam_questions: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Vector storage ID</Label>
              <Input value={courseForm.vector_storage_id} onChange={(e) => setCourseForm({ ...courseForm, vector_storage_id: e.target.value })} />
            </div>
            <Button onClick={handleUpdateCourse} variant="gradient" className="w-full">
              Сохранить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
