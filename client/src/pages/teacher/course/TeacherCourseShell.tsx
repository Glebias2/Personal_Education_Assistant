import { NavLink, Outlet, useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Settings, FileText, Upload, Users, UserPlus, ClipboardList, BarChart2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { getCourseById } from "@/lib/api/courses"
import { Button } from "@/components/ui/button"

const tabs = [
  { to: "overview", icon: Settings, label: "Обзор" },
  { to: "labs", icon: FileText, label: "Лабы" },
  { to: "files", icon: Upload, label: "Файлы" },
  { to: "students", icon: Users, label: "Студенты" },
  { to: "requests", icon: UserPlus, label: "Заявки" },
  { to: "reports", icon: ClipboardList, label: "Отчёты" },
  { to: "analytics", icon: BarChart2, label: "Аналитика" },
]

export default function TeacherCourseShell() {
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
      <div className="border-b border-border/50 bg-background px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => navigate("/teacher/dashboard")}>
          <ArrowLeft className="w-4 h-4" /> Назад
        </Button>
        <div className="h-4 w-px bg-border" />
        <h1 className="font-semibold text-foreground truncate">{course?.title ?? "Курс"}</h1>
      </div>

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

      <div className="flex-1 bg-background">
        <Outlet />
      </div>
    </div>
  )
}
