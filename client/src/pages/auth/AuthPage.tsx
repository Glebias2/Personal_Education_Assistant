import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { GraduationCap, Eye, EyeOff, Loader2, Brain } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/features/auth/AuthContext"
import { loginByCredentials, registerUser } from "@/lib/auth"
import type { UserRole } from "@/types"

const loginSchema = z.object({
  login: z.string().min(3, "Минимум 3 символа"),
  password: z.string().min(4, "Минимум 4 символа"),
})

const registerStudentSchema = z.object({
  login: z.string().min(3, "Минимум 3 символа"),
  password: z.string().min(4, "Минимум 4 символа"),
  first_name: z.string().min(1, "Введите имя"),
  last_name: z.string().min(1, "Введите фамилию"),
  characteristic: z.string().optional(),
})

const registerTeacherSchema = z.object({
  login: z.string().min(3, "Минимум 3 символа"),
  password: z.string().min(4, "Минимум 4 символа"),
  first_name: z.string().min(1, "Введите имя"),
  last_name: z.string().min(1, "Введите фамилию"),
})

type LoginData = z.infer<typeof loginSchema>
type RegisterStudentData = z.infer<typeof registerStudentSchema>
type RegisterTeacherData = z.infer<typeof registerTeacherSchema>

export default function AuthPage() {
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [role, setRole] = useState<UserRole>("student")
  const [mode, setMode] = useState<"login" | "register">("login")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const loginForm = useForm<LoginData>({ resolver: zodResolver(loginSchema) })
  const regStudentForm = useForm<RegisterStudentData>({ resolver: zodResolver(registerStudentSchema) })
  const regTeacherForm = useForm<RegisterTeacherData>({ resolver: zodResolver(registerTeacherSchema) })

  const handleLogin = async (data: LoginData) => {
    setLoading(true)
    try {
      const user = await loginByCredentials(data.login, data.password, role)
      if (!user) { toast.error("Неверный логин или пароль"); return }
      setUser(user)
      navigate(role === "student" ? "/student/dashboard" : "/teacher/dashboard")
    } catch (e: any) {
      toast.error(e.message || "Ошибка входа")
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterStudent = async (data: RegisterStudentData) => {
    setLoading(true)
    try {
      await registerUser({ ...data, role: "student" })
      toast.success("Аккаунт создан! Войдите.")
      setMode("login")
    } catch (e: any) {
      toast.error(e.message || "Ошибка регистрации")
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterTeacher = async (data: RegisterTeacherData) => {
    setLoading(true)
    try {
      await registerUser({ ...data, role: "teacher" })
      toast.success("Аккаунт создан! Войдите.")
      setMode("login")
    } catch (e: any) {
      toast.error(e.message || "Ошибка регистрации")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12" style={{ background: "var(--gradient-hero)" }}>
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-accent/15 rounded-full blur-3xl" />

        <div className="relative max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-6 shadow-lg">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-3">EduAgent</h2>
          <p className="text-muted-foreground leading-relaxed mb-8">
            Образовательная платформа с AI-ассистентом, умным тестированием и пробным экзаменом
          </p>
          <div className="space-y-3 text-left">
            {[
              { icon: "🧠", text: "AI-экзаменатор оценивает развёрнутые ответы" },
              { icon: "⚡", text: "Тесты генерируются мгновенно по теме" },
              { icon: "💬", text: "RAG-чат знает все материалы курса" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">EduAgent</span>
          </div>

          <h1 className="text-2xl font-bold mb-1">
            {mode === "login" ? "Добро пожаловать" : "Создать аккаунт"}
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            {mode === "login" ? "Войдите в свой аккаунт" : "Зарегистрируйтесь на платформе"}
          </p>

          {/* Role selector */}
          <Tabs value={role} onValueChange={(v) => setRole(v as UserRole)} className="mb-6">
            <TabsList className="w-full">
              <TabsTrigger value="student" className="flex-1">Студент</TabsTrigger>
              <TabsTrigger value="teacher" className="flex-1">Преподаватель</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Login form */}
          {mode === "login" && (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Логин</Label>
                <Input placeholder="your_login" {...loginForm.register("login")} />
                {loginForm.formState.errors.login && (
                  <p className="text-xs text-destructive">{loginForm.formState.errors.login.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Пароль</Label>
                <div className="relative">
                  <Input
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    {...loginForm.register("password")}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPass(!showPass)}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Войти"}
              </Button>
            </form>
          )}

          {/* Register student */}
          {mode === "register" && role === "student" && (
            <form onSubmit={regStudentForm.handleSubmit(handleRegisterStudent)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Имя</Label>
                  <Input placeholder="Иван" {...regStudentForm.register("first_name")} />
                  {regStudentForm.formState.errors.first_name && (
                    <p className="text-xs text-destructive">{regStudentForm.formState.errors.first_name.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Фамилия</Label>
                  <Input placeholder="Иванов" {...regStudentForm.register("last_name")} />
                  {regStudentForm.formState.errors.last_name && (
                    <p className="text-xs text-destructive">{regStudentForm.formState.errors.last_name.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Логин</Label>
                <Input placeholder="your_login" {...regStudentForm.register("login")} />
                {regStudentForm.formState.errors.login && (
                  <p className="text-xs text-destructive">{regStudentForm.formState.errors.login.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Пароль</Label>
                <div className="relative">
                  <Input type={showPass ? "text" : "password"} placeholder="••••••••" {...regStudentForm.register("password")} />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPass(!showPass)}>
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {regStudentForm.formState.errors.password && (
                  <p className="text-xs text-destructive">{regStudentForm.formState.errors.password.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>О себе <span className="text-muted-foreground">(необязательно)</span></Label>
                <Textarea placeholder="Чем интересуешься, что изучаешь..." rows={2} {...regStudentForm.register("characteristic")} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Создать аккаунт"}
              </Button>
            </form>
          )}

          {/* Register teacher */}
          {mode === "register" && role === "teacher" && (
            <form onSubmit={regTeacherForm.handleSubmit(handleRegisterTeacher)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Имя</Label>
                  <Input placeholder="Иван" {...regTeacherForm.register("first_name")} />
                  {regTeacherForm.formState.errors.first_name && (
                    <p className="text-xs text-destructive">{regTeacherForm.formState.errors.first_name.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Фамилия</Label>
                  <Input placeholder="Иванов" {...regTeacherForm.register("last_name")} />
                  {regTeacherForm.formState.errors.last_name && (
                    <p className="text-xs text-destructive">{regTeacherForm.formState.errors.last_name.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Логин</Label>
                <Input placeholder="your_login" {...regTeacherForm.register("login")} />
                {regTeacherForm.formState.errors.login && (
                  <p className="text-xs text-destructive">{regTeacherForm.formState.errors.login.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Пароль</Label>
                <div className="relative">
                  <Input type={showPass ? "text" : "password"} placeholder="••••••••" {...regTeacherForm.register("password")} />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPass(!showPass)}>
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {regTeacherForm.formState.errors.password && (
                  <p className="text-xs text-destructive">{regTeacherForm.formState.errors.password.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Создать аккаунт"}
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground mt-5">
            {mode === "login" ? "Нет аккаунта? " : "Уже есть аккаунт? "}
            <button
              className="text-primary hover:underline font-medium"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? "Зарегистрироваться" : "Войти"}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
