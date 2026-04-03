"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { GraduationCap, UserCircle, LogIn } from "lucide-react"
import TagPicker from "@/components/TagPicker"
import { getAvailableTags } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { getAuthUser, loginByCredentials, registerUser } from "@/lib/auth"
import type { UserRole } from "@/types"

export default function AuthPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [role, setRole] = useState<UserRole>("student")
  const [mode, setMode] = useState<"login" | "register">("login") // NEW FUNCTIONALITY: режим вход/регистрация
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // Состояния для полей ввода
  const [login, setLogin] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [characteristic, setCharacteristic] = useState("")
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])

  // Загружаем теги для выбора интересов
  useEffect(() => {
    getAvailableTags().then((r) => setAvailableTags(r.tags)).catch(() => {})
  }, [])

  // Проверяем, не авторизован ли уже пользователь
  useEffect(() => {
    const user = getAuthUser()
    if (user) {
      navigate(user.role === "student" ? "/student" : "/teacher")
    } else {
      setCheckingAuth(false)
    }
  }, [navigate])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!login.trim()) throw new Error("Введите логин")
      if (!password.trim()) throw new Error("Введите пароль")

      if (mode === "register") {
        // NEW FUNCTIONALITY: регистрация
        if (!firstName.trim()) throw new Error("Введите имя")
        if (!lastName.trim()) throw new Error("Введите фамилию")

        await registerUser({
          role,
          login: login.trim(),
          password: password.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          characteristic: role === "student" ? (characteristic.trim() || undefined) : undefined,
          interests: role === "student" ? selectedInterests : undefined,
        })

        toast({ title: "Регистрация успешна", description: "Теперь выполните вход" })
        setMode("login")
        setPassword("")
        return
      }

      // NEW FUNCTIONALITY: вход через API для студента и преподавателя
      const user = await loginByCredentials(login.trim(), password.trim(), role)
      if (!user) throw new Error("Неверный логин или пароль")

      toast({
        title: "Вход выполнен",
        description: `Добро пожаловать, ${user.first_name} ${user.last_name}!`,
      })

      navigate(role === "student" ? "/student" : "/teacher")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка входа",
        description: error instanceof Error ? error.message : "Неизвестная ошибка",
      })
    } finally {
      setLoading(false)
    }
  }

  // Убираем поле password при переключении на студента
  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole)
    setLogin("")
    setPassword("")
    setFirstName("")
    setLastName("")
    setCharacteristic("")
    setSelectedInterests([])
  }

  // Пока проверяем авторизацию, показываем лоадер
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-primary rounded-3xl shadow-lg shadow-primary/30 mb-4 animate-pulse">
            <GraduationCap className="w-10 h-10 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground">Проверка авторизации...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-primary rounded-3xl shadow-lg shadow-primary/30 mb-6">
            <GraduationCap className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 text-balance">
            Personal Agentic Assistant
          </h1>
          <p className="text-muted-foreground leading-relaxed">Образовательная платформа нового поколения</p>
        </div>

        <Card className="shadow-xl shadow-black/20 border-border/50 backdrop-blur">
          <CardHeader>
            <CardTitle>{mode === "login" ? "Вход в систему" : "Регистрация"}</CardTitle>
            <CardDescription>
              {mode === "login"
                ? role === "student"
                  ? "Введите логин и пароль студента"
                  : "Введите логин и пароль преподавателя"
                : role === "student"
                  ? "Создайте аккаунт студента"
                  : "Создайте аккаунт преподавателя"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={role} onValueChange={(v) => handleRoleChange(v as UserRole)}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="student" className="gap-2">
                  <UserCircle className="w-4 h-4" />
                  Студент
                </TabsTrigger>
                <TabsTrigger value="teacher" className="gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Преподаватель
                </TabsTrigger>
              </TabsList>

              <TabsContent value="student" className="mt-0">
                <div className="space-y-4">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="student-login">Логин</Label>
                      <Input
                        id="student-login"
                        type="text"
                        placeholder="Введите логин"
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                        required
                        autoComplete="username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student-password">Пароль</Label>
                      <Input
                        id="student-password"
                        type="password"
                        placeholder="Введите пароль"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete={mode === "login" ? "current-password" : "new-password"}
                      />
                    </div>

                    {mode === "register" && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="student-first-name">Имя</Label>
                          <Input
                            id="student-first-name"
                            type="text"
                            placeholder="Иван"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                            autoComplete="given-name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="student-last-name">Фамилия</Label>
                          <Input
                            id="student-last-name"
                            type="text"
                            placeholder="Иванов"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                            autoComplete="family-name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="student-characteristic">Характеристика (опционально)</Label>
                          <Input
                            id="student-characteristic"
                            type="text"
                            placeholder="Например: сильная математика, нужен упор на практику"
                            value={characteristic}
                            onChange={(e) => setCharacteristic(e.target.value)}
                          />
                        </div>
                        {availableTags.length > 0 && (
                          <TagPicker
                            availableTags={availableTags}
                            selectedTags={selectedInterests}
                            onChange={setSelectedInterests}
                            maxTags={5}
                            label="Интересы (выберите категории)"
                          />
                        )}
                      </>
                    )}

                    <Button type="submit" variant="gradient" className="w-full" disabled={loading || !login.trim() || !password.trim()}>
                      <LogIn className="w-4 h-4 mr-2" />
                      {loading ? (mode === "login" ? "Вход..." : "Регистрация...") : mode === "login" ? "Войти как студент" : "Зарегистрировать студента"}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full bg-transparent"
                      onClick={() => setMode(mode === "login" ? "register" : "login")}
                      disabled={loading}
                    >
                      {mode === "login" ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
                    </Button>
                  </form>
                </div>
              </TabsContent>

              <TabsContent value="teacher" className="mt-0">
                <div className="space-y-4">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="teacher-login">Логин</Label>
                      <Input
                        id="teacher-login"
                        type="text"
                        placeholder="Введите логин"
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                        required
                        autoComplete="username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="teacher-password">Пароль</Label>
                      <Input
                        id="teacher-password"
                        type="password"
                        placeholder="Введите пароль"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete={mode === "login" ? "current-password" : "new-password"}
                      />
                    </div>

                    {mode === "register" && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="teacher-first-name">Имя</Label>
                          <Input
                            id="teacher-first-name"
                            type="text"
                            placeholder="Анна"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                            autoComplete="given-name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="teacher-last-name">Фамилия</Label>
                          <Input
                            id="teacher-last-name"
                            type="text"
                            placeholder="Петрова"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                            autoComplete="family-name"
                          />
                        </div>
                      </>
                    )}
                    <Button
                      type="submit"
                      variant="gradient"
                      className="w-full"
                      disabled={loading || !login.trim() || !password.trim()}
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      {loading
                        ? mode === "login"
                          ? "Вход..."
                          : "Регистрация..."
                        : mode === "login"
                          ? "Войти как преподаватель"
                          : "Зарегистрировать преподавателя"}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full bg-transparent"
                      onClick={() => setMode(mode === "login" ? "register" : "login")}
                      disabled={loading}
                    >
                      {mode === "login" ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
                    </Button>
                  </form>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
