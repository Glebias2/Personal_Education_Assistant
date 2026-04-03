import { NavLink, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useAuth } from "@/features/auth/AuthContext"
import { GraduationCap, LayoutDashboard, BookOpen, LogOut, User } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NavItem {
  to: string
  icon: LucideIcon
  label: string
}

const studentNav: NavItem[] = [
  { to: "/student/dashboard", icon: LayoutDashboard, label: "Обзор" },
  { to: "/student/courses", icon: BookOpen, label: "Каталог курсов" },
]

const teacherNav: NavItem[] = [
  { to: "/teacher/dashboard", icon: LayoutDashboard, label: "Мои курсы" },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const navItems = user?.role === "student" ? studentNav : teacherNav

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 flex flex-col border-r border-border/50 bg-background">
      {/* Logo */}
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-border/50">
        <div className="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center">
          <GraduationCap className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-semibold text-sm">EduAgent</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "")} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-border/50">
        <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <User className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{user?.first_name} {user?.last_name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role === "student" ? "Студент" : "Преподаватель"}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
        >
          <LogOut className="w-3.5 h-3.5" />
          Выйти
        </Button>
      </div>
    </aside>
  )
}
