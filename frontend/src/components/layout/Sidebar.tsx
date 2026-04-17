import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  FileText,
  BarChart3,
  User,
  TrendingUp,
  LogOut,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const studentNav = [
  { to: "/student/dashboard",  icon: LayoutDashboard, label: "Дашборд" },
  { to: "/student/my-courses", icon: GraduationCap,   label: "Мои курсы" },
  { to: "/student/catalog",    icon: BookOpen,        label: "Каталог" },
  { to: "/student/progress",   icon: TrendingUp,      label: "Прогресс" },
  { to: "/student/profile",    icon: User,            label: "Профиль" },
];

const teacherNav = [
  { to: "/teacher/dashboard", icon: LayoutDashboard, label: "Дашборд" },
  { to: "/teacher/courses", icon: GraduationCap, label: "Мои курсы" },
  { to: "/teacher/reports", icon: FileText, label: "Отчёты" },
];

export function Sidebar() {
  const { role, name, logout } = useAuthStore();
  const location = useLocation();
  const nav = role === "teacher" ? teacherNav : studentNav;

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-60 border-r border-border bg-sidebar-background flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <span className="font-heading text-xl text-foreground tracking-tight">EduAI</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map((item) => {
          const active = location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "text-primary-foreground"
                  : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent"
              )}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-primary"
                  transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
                />
              )}
              <item.icon className="w-4 h-4 relative z-10" />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-xs font-medium text-foreground">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground truncate">{name}</p>
            <p className="text-xs text-muted-foreground">
              {role === "teacher" ? "Преподаватель" : "Студент"}
            </p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
