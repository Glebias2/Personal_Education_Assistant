import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import CourseAnalyticsPanel from "@/components/teacher/CourseAnalytics"
import CourseOverviewPanel from "@/components/teacher/CourseOverviewPanel"
import StudentsPanel from "@/components/teacher/StudentsPanel"
import TagPicker from "@/components/TagPicker"
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
  getAvailableTags,
  getCourseTags,
  updateCourseTags,
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
  const [courseForm, setCourseForm] = useState({ title: "", exam_questions: "", vector_storage_id: "", description: "", difficulty: "intermediate", tags: [] as string[] })
  const [availableTags, setAvailableTags] = useState<string[]>([])

  const [moderatingRequestId, setModeratingRequestId] = useState<number | null>(null)

  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [courseFiles, setCourseFiles] = useState<{ id: number; filename: string; file_id: string; created_at: string }[]>([])

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

      const tagsResp = await getCourseTags(courseIdNum)
      setCourseForm({
        title: courseObj?.title || "",
        exam_questions: courseObj?.exam_questions || "",
        vector_storage_id: courseObj?.vector_storage_id || courseObj?.storage_id || "",
        description: courseObj?.description || "",
        difficulty: courseObj?.difficulty || "intermediate",
        tags: tagsResp.tags || [],
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
    getAvailableTags().then((r) => setAvailableTags(r.tags)).catch(() => {})
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
      await updateCourse(courseIdNum, {
        title: courseForm.title,
        exam_questions: courseForm.exam_questions,
        vector_storage_id: courseForm.vector_storage_id,
        description: courseForm.description || undefined,
        difficulty: courseForm.difficulty,
        tags: courseForm.tags,
      })
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
    }
  }

  const handleDeleteFile = async (fileId: number, filename: string) => {
    if (!confirm(`Удалить файл "${filename}"? Данные будут удалены из векторного хранилища.`)) return
    try {
      await deleteCourseFile(courseIdNum, fileId)
      const filesResp = await getCourseFiles(courseIdNum)
      setCourseFiles(filesResp.files || [])
      toast({ title: "Файл удалён" })
    } catch {
      toast({ title: "Ошибка удаления файла", variant: "destructive" })
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

          <TabsContent value="overview" className="mt-6">
            <CourseOverviewPanel
              course={course}
              courseIdNum={courseIdNum}
              labs={labs}
              courseFiles={courseFiles}
              uploadingFiles={uploadingFiles}
              newLab={newLab}
              editingLab={editingLab}
              onNewLabChange={setNewLab}
              onEditingLabChange={setEditingLab}
              onCreateLab={handleCreateLab}
              onUpdateLab={handleUpdateLab}
              onDeleteLab={handleDeleteLab}
              onUploadFiles={handleUploadFiles}
              onDeleteFile={handleDeleteFile}
            />
          </TabsContent>

          <TabsContent value="students" className="mt-6">
            <StudentsPanel
              enrolledStudents={enrolledStudents}
              filteredStudents={filteredStudents}
              requests={requests}
              requestsPending={requestsPending}
              pendingReports={pendingReports}
              studentSearch={studentSearch}
              selectedStudent={selectedStudent}
              studentDetails={studentDetails}
              detailsLoading={detailsLoading}
              moderatingRequestId={moderatingRequestId}
              onStudentSearchChange={setStudentSearch}
              onOpenStudentDetails={openStudentDetails}
              onCloseStudentDetails={() => setSelectedStudent(null)}
              onApproveRequest={handleApproveRequest}
              onRejectRequest={handleRejectRequest}
              onUpdateReportStatus={handleUpdateReportStatus}
              onDeleteReport={handleDeleteReport}
            />
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
              <Label>Описание курса</Label>
              <Textarea
                value={courseForm.description}
                onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                placeholder="Краткое описание курса"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Сложность</Label>
              <Select value={courseForm.difficulty} onValueChange={(v) => setCourseForm({ ...courseForm, difficulty: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Начальный</SelectItem>
                  <SelectItem value="intermediate">Средний</SelectItem>
                  <SelectItem value="advanced">Продвинутый</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {availableTags.length > 0 && (
              <TagPicker
                availableTags={availableTags}
                selectedTags={courseForm.tags}
                onChange={(tags) => setCourseForm({ ...courseForm, tags })}
                label="Теги курса"
              />
            )}
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
