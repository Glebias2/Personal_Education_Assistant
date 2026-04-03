import { NavLink, Outlet, useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, LayoutDashboard, FlaskConical, Brain, MessageSquare, FileText, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { getCourseById } from "@/lib/api/courses"
import { Button } from "@/components/ui/button"

const tabs = [
  { to: "overview", icon: LayoutDashboard, label: "Обзор" },
  { to: "labs", icon: FileText, label: "Лабы" },
  { to: "testing", icon: FlaskConical, label: "Тестирование" },
  { to: "exam", icon: Brain, label: "Экзамен" },
  { to: "chat", icon: MessageSquare, label: "AI-чат" },
  { to: "materials", icon: BookOpen, label: "Материалы" },
]

const difficultyMap: Record<string, string> = {
  easy: "text-success",
  intermediate: "text-warning",
  hard: "text-destructive",
}

export default function CourseLayout() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()

  const { data: courseArr } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => getCourseById(Number(courseId)),
    enabled: !!courseId,
  })

  const course = Array.isArray(courseArr) ? courseArr[0] : courseArr

  return (
    <div className="flex flex-col min-h-screen">
      {/* Course header */}
      <div className="border-b border-border/50 bg-background px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => navigate("/student/dashboard")}>
          <ArrowLeft className="w-4 h-4" />
          Назад
        </Button>
        <div className="h-4 w-px bg-border" />
        <div className="min-w-0">
          <h1 className="font-semibold text-foreground truncate">{course?.title ?? "Курс"}</h1>
          {course?.difficulty && (
            <p className={cn("text-xs", difficultyMap[course.difficulty] ?? "text-muted-foreground")}>
              {course.difficulty === "easy" ? "Лёгкий" : course.difficulty === "intermediate" ? "Средний" : "Сложный"}
            </p>
          )}
        </div>
      </div>

      {/* Tab nav */}
      <div className="border-b border-border/50 bg-background">
        <nav className="flex items-center gap-1 px-4 overflow-x-auto">
          {tabs.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-1.5 px-3 py-3 text-sm border-b-2 transition-colors whitespace-nowrap",
                  isActive
                    ? "border-primary text-primary font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )
              }
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 bg-background">
        <Outlet />
      </div>
    </div>
  )
}
