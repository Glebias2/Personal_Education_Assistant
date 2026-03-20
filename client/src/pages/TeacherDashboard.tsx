"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { getAuthUser, logout } from "@/lib/auth"
import { getTeacherCourses, createCourseAPI } from "@/lib/api"
import type { AuthUser, CourseShort } from "@/types/models"
import { LogOut, Plus, BookOpen, X, ArrowRight } from "lucide-react"

export default function TeacherDashboard() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [courses, setCourses] = useState<CourseShort[]>([])
  const [loading, setLoading] = useState(true)
  const [newCourseTitle, setNewCourseTitle] = useState("")
  const [questions, setQuestions] = useState<string[]>([""])
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    const authUser = getAuthUser()
    if (!authUser || authUser.role !== "teacher") {
      navigate("/auth")
      return
    }
    setUser(authUser)
    loadData(authUser.id)
  }, [navigate])

  /**
   * GET /api/v1/teachers/{teacher_id}/courses
   */
  const loadData = async (teacherId: number) => {
    setLoading(true)
    try {
      const coursesData = await getTeacherCourses(teacherId)
      setCourses(coursesData)
    } catch (error) {
      toast({ title: "Ошибка загрузки", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate("/auth")
  }

  /**
   * POST /api/v1/courses/create
   * Body: { title, teacher_id, exam_questions: "[\"Вопрос1\", \"Вопрос2\"]" }
   */
  const handleCreateCourse = async () => {
    if (!user || !newCourseTitle) {
      toast({ title: "Заполните название курса", variant: "destructive" })
      return
    }

    try {
      // Формируем вопросы в нужном формате: "[\"Вопрос1\", \"Вопрос2\"]"
      const filteredQuestions = questions.filter((q) => q.trim())
      const examQuestionsFormatted = JSON.stringify(filteredQuestions)

      await createCourseAPI({
        title: newCourseTitle,
        teacher_id: user.id.toString(),
        exam_questions: examQuestionsFormatted,
      })

      toast({ title: "Курс создан" })
      setNewCourseTitle("")
      setQuestions([""])
      setDialogOpen(false)
      loadData(user.id)
    } catch (error) {
      toast({ title: "Ошибка создания курса", variant: "destructive" })
    }
  }

  const addQuestion = () => setQuestions([...questions, ""])

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index))
    }
  }

  const updateQuestion = (index: number, value: string) => {
    const updated = [...questions]
    updated[index] = value
    setQuestions(updated)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4 animate-pulse">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Личный кабинет преподавателя</h1>
            {user && (
              <p className="text-muted-foreground mt-1">
                {user.first_name} {user.last_name}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="hover:border-destructive/50 hover:text-destructive bg-transparent"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Выйти
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-12">
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Мои курсы</CardTitle>
                <CardDescription>Управление курсами</CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="gradient" className="shadow-lg">
                    <Plus className="mr-2 h-4 w-4" />
                    Создать курс
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Новый курс</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Название курса</Label>
                      <Input
                        value={newCourseTitle}
                        onChange={(e) => setNewCourseTitle(e.target.value)}
                        placeholder="Введите название курса"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label>Экзаменационные вопросы</Label>
                      <div className="space-y-2 mt-2">
                        {questions.map((q, i) => (
                          <div key={i} className="flex gap-2">
                            <Input
                              value={q}
                              onChange={(e) => updateQuestion(i, e.target.value)}
                              placeholder={`Вопрос ${i + 1}`}
                            />
                            {questions.length > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeQuestion(i)}
                                className="hover:bg-destructive/10 hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addQuestion}
                          className="hover:border-primary/50 bg-transparent"
                        >
                          + Добавить вопрос
                        </Button>
                      </div>
                    </div>
                    <Button onClick={handleCreateCourse} variant="gradient" className="w-full shadow-md">
                      Создать
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {courses.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-muted/50 rounded-3xl mb-4">
                  <BookOpen className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-lg">У вас пока нет курсов</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    onClick={() =>
                      navigate(`/teacher/course/${course.id}`, {
                        state: { teacherId: user?.id },
                      })
                    }
                    className="group p-6 border border-border rounded-xl hover:bg-primary/5 hover:border-primary/50 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                        {course.title}
                      </h3>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
