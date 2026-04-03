import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { getAuthUser, logout } from "@/lib/auth"
import {
  createCourseRequest, getStudentCoursesById, getRecommendedCourses,
  getCourseLabs, getStudentReportsByCourse, getStudentExamResultsByCourse,
  getCourseRating, rateCourse,
} from "@/lib/api"
import type { AuthUser, CourseShort, CourseCatalogItem } from "@/types"
import { LogOut, BookOpen, ArrowRight, PlusCircle, Sparkles, Users, Star, Trophy } from "lucide-react"

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "Начальный",
  intermediate: "Средний",
  advanced: "Продвинутый",
}

interface CourseStatus {
  completed: boolean
  rating: number | null
}

export default function StudentDashboard() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [courses, setCourses] = useState<CourseShort[]>([])
  const [recommended, setRecommended] = useState<CourseCatalogItem[]>([])
  const [otherCourses, setOtherCourses] = useState<CourseCatalogItem[]>([])
  const [hasRecommendations, setHasRecommendations] = useState(false)
  const [courseStatuses, setCourseStatuses] = useState<Record<number, CourseStatus>>({})
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
      const [coursesData, recData] = await Promise.all([
        getStudentCoursesById(studentId),
        getRecommendedCourses(studentId),
      ])
      setCourses(coursesData)
      setRecommended(recData.recommended)
      setOtherCourses(recData.other)
      setHasRecommendations(recData.has_recommendations)

      // Check completion status for each enrolled course
      const statuses: Record<number, CourseStatus> = {}
      await Promise.all(
        coursesData.map(async (c) => {
          try {
            const [labs, reportsRes, examsRes, ratingRes] = await Promise.all([
              getCourseLabs(c.id),
              getStudentReportsByCourse(studentId, c.id),
              getStudentExamResultsByCourse(studentId, c.id),
              getCourseRating(c.id, studentId),
            ])
            const allLabsApproved =
              labs.length > 0 &&
              labs.every((lab) =>
                reportsRes.reports.some(
                  (r) => r.lab_title === lab.title && r.status === "approved"
                )
              )
            const examPassed = examsRes.results.some((e) => e.completed)
            statuses[c.id] = {
              completed: allLabsApproved && examPassed,
              rating: ratingRes.rating,
            }
          } catch {
            statuses[c.id] = { completed: false, rating: null }
          }
        })
      )
      setCourseStatuses(statuses)
    } catch (error) {
      toast({ title: "Ошибка загрузки", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleRate = async (courseId: number, rating: number) => {
    if (!user) return
    try {
      await rateCourse(courseId, user.id, rating)
      setCourseStatuses((prev) => ({
        ...prev,
        [courseId]: { ...prev[courseId], rating },
      }))
      toast({ title: "Спасибо за оценку!" })
    } catch {
      toast({ title: "Не удалось сохранить оценку", variant: "destructive" })
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
                    {courses.map((course) => {
                      const status = courseStatuses[course.id]
                      return (
                        <div
                          key={course.id}
                          className={`p-6 border rounded-xl transition-all duration-200 ${
                            status?.completed
                              ? "border-green-500/30 bg-green-500/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div
                            onClick={() => navigate(`/student/course/${course.id}`)}
                            className="group flex items-center justify-between cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                                {course.title}
                              </h3>
                              {status?.completed && (
                                <Badge variant="outline" className="border-green-500/50 text-green-600 text-xs">
                                  <Trophy className="h-3 w-3 mr-1" />
                                  Завершён
                                </Badge>
                              )}
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                          </div>
                          {status?.completed && (
                            <div className="mt-3 pt-3 border-t border-border/50">
                              {status.rating ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span>Ваша оценка:</span>
                                  <StarRating value={status.rating} readOnly />
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-muted-foreground">Оцените курс:</span>
                                  <StarRating
                                    value={0}
                                    onChange={(val) => handleRate(course.id, val)}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
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
                {recommended.length === 0 && otherCourses.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-muted-foreground">Нет доступных курсов</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {hasRecommendations && recommended.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-semibold">Рекомендуемые для вас</h3>
                        </div>
                        <div className="grid gap-4">
                          {recommended.map((c) => (
                            <CourseCard
                              key={c.id}
                              course={c}
                              highlighted
                              requesting={requesting}
                              onRequest={handleRequestCourse}
                            />
                          ))}
                        </div>
                        <Separator />
                        <h3 className="text-lg font-semibold text-muted-foreground">Все курсы</h3>
                      </>
                    )}
                    <div className="grid gap-4">
                      {otherCourses.map((c) => (
                        <CourseCard
                          key={c.id}
                          course={c}
                          requesting={requesting}
                          onRequest={handleRequestCourse}
                        />
                      ))}
                    </div>
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

function StarRating({
  value,
  onChange,
  readOnly,
}: {
  value: number
  onChange?: (val: number) => void
  readOnly?: boolean
}) {
  const [hover, setHover] = useState(0)

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          className={`p-0.5 transition-colors ${readOnly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(0)}
        >
          <Star
            className={`h-5 w-5 transition-colors ${
              star <= (hover || value)
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/40"
            }`}
          />
        </button>
      ))}
    </div>
  )
}

function CourseCard({
  course,
  highlighted,
  requesting,
  onRequest,
}: {
  course: CourseCatalogItem
  highlighted?: boolean
  requesting: number | null
  onRequest: (id: number) => void
}) {
  return (
    <div
      className={`p-6 border rounded-xl transition-colors ${
        highlighted
          ? "border-primary/50 bg-primary/5 hover:bg-primary/10"
          : "border-border bg-card/30 hover:bg-card/60"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-lg">{course.title}</span>
            {highlighted && (
              <Badge variant="default" className="bg-primary/20 text-primary border-primary/30 text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                Для вас
              </Badge>
            )}
            {course.difficulty && (
              <Badge variant="outline" className="text-xs">
                {DIFFICULTY_LABELS[course.difficulty] || course.difficulty}
              </Badge>
            )}
          </div>
          {course.description && (
            <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{course.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {course.tags && course.tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {course.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            {(course.enrollment_count != null && course.enrollment_count > 0) && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                {course.enrollment_count}
              </span>
            )}
            {(course.bayesian_rating != null && course.bayesian_rating > 0) && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Star className="h-3 w-3" />
                {course.bayesian_rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
        <Button
          variant={highlighted ? "gradient" : "outline"}
          className={highlighted ? "shadow-md" : "bg-transparent"}
          onClick={() => onRequest(course.id)}
          disabled={requesting === course.id}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          {requesting === course.id ? "Отправка..." : "Подать заявку"}
        </Button>
      </div>
    </div>
  )
}
