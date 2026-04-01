import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { getAuthUser, logout } from "@/lib/auth"
import { createCourseRequest, getStudentCoursesById, listAllCourses } from "@/lib/api"
import type { AuthUser, CourseShort } from "@/types/models"
import { LogOut, BookOpen, ArrowRight, PlusCircle } from "lucide-react"

export default function StudentDashboard() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [courses, setCourses] = useState<CourseShort[]>([])
  const [catalog, setCatalog] = useState<{ id: number; title: string; teacher_id: number }[]>([])
  const [requesting, setRequesting] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const authUser = getAuthUser()
    if (!authUser || authUser.role !== "student") {
      navigate("/auth")
      return
    }
    setUser(authUser)
    loadData(authUser.id)
  }, [navigate])

  const loadData = async (studentId: number) => {
    setLoading(true)
    try {
      const coursesData = await getStudentCoursesById(studentId)
      setCourses(coursesData)
      const all = await listAllCourses()
      const enrolledIds = new Set(coursesData.map((c) => c.id))
      setCatalog(all.filter((c) => !enrolledIds.has(c.id)))
    } catch (error) {
      toast({ title: "Ошибка загрузки", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleRequestCourse = async (courseId: number) => {
    if (!user) return
    setRequesting(courseId)
    try {
      await createCourseRequest(courseId, user.id)
      toast({ title: "Заявка отправлена", description: "Ожидайте одобрения преподавателя" })
    } catch (e) {
      toast({ title: "Не удалось отправить заявку", variant: "destructive" })
    } finally {
      setRequesting(null)
    }
  }

  const handleLogout = () => {
    logout()
    navigate("/auth")
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
            <h1 className="text-2xl md:text-3xl font-bold">Личный кабинет студента</h1>
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
        <Tabs defaultValue="my" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-xl">
            <TabsTrigger value="my">Мои курсы</TabsTrigger>
            <TabsTrigger value="catalog">Каталог</TabsTrigger>
          </TabsList>

          <TabsContent value="my" className="mt-6">
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Мои курсы</CardTitle>
                <CardDescription>Зачисленные курсы</CardDescription>
              </CardHeader>
              <CardContent>
                {courses.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-muted/50 rounded-3xl mb-4">
                      <BookOpen className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-lg">Пока нет зачисленных курсов</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {courses.map((course) => (
                      <div
                        key={course.id}
                        onClick={() => navigate(`/student/course/${course.id}`)}
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
          </TabsContent>

          <TabsContent value="catalog" className="mt-6">
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Каталог курсов</CardTitle>
                <CardDescription>Выберите курс и отправьте заявку</CardDescription>
              </CardHeader>
              <CardContent>
                {catalog.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-muted-foreground">Курсы пока не созданы</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {catalog.map((c) => (
                      <div
                        key={c.id}
                        className="p-6 border border-border rounded-xl bg-card/30 hover:bg-card/60 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="font-semibold text-lg truncate">{c.title}</div>
                            <div className="text-sm text-muted-foreground mt-1">Курс #{c.id} • Преподаватель #{c.teacher_id}</div>
                          </div>
                          <Button
                            variant="outline"
                            className="bg-transparent"
                            onClick={() => handleRequestCourse(c.id)}
                            disabled={requesting === c.id}
                          >
                            <PlusCircle className="h-4 w-4 mr-2" />
                            {requesting === c.id ? "Отправка..." : "Подать заявку"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
