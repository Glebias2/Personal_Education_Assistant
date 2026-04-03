import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Brain, FlaskConical, MessageSquare, GraduationCap, ChevronRight, Sparkles, Users, BookOpen } from "lucide-react"
import { useAuth } from "@/features/auth/AuthContext"

const features = [
  {
    icon: MessageSquare,
    color: "text-accent",
    bg: "bg-accent/10 border-accent/20",
    title: "AI-ассистент курса",
    description: "RAG-чат с материалами курса. Задавай вопросы — получай ответы из лекций и учебников. Видит твои результаты и прогресс.",
  },
  {
    icon: FlaskConical,
    color: "text-primary",
    bg: "bg-primary/10 border-primary/20",
    title: "Умное тестирование",
    description: "AI генерирует тесты по теме курса или загруженному файлу. Произвольная сложность, разбор ошибок после сдачи.",
  },
  {
    icon: Brain,
    color: "text-warning",
    bg: "bg-warning/10 border-warning/20",
    title: "Пробный экзамен",
    description: "AI-экзаменатор задаёт вопросы из материалов курса и оценивает развёрнутые ответы с рекомендациями.",
  },
]

const steps = [
  { role: "Студент", steps: ["Запишись на курс", "Проходи тесты и экзамены", "Общайся с AI-ассистентом", "Сдавай лабораторные"] },
  { role: "Преподаватель", steps: ["Создай курс с материалами", "Добавь лабораторные", "Просматривай аналитику", "Одобряй отчёты студентов"] },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleStart = () => {
    if (user) {
      navigate(user.role === "student" ? "/student/dashboard" : "/teacher/dashboard")
    } else {
      navigate("/auth")
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-border/50 glass">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-foreground">EduAgent</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Button size="sm" onClick={handleStart}>
                Открыть платформу <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>Войти</Button>
                <Button size="sm" onClick={() => navigate("/auth")}>Начать бесплатно</Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-40 pb-24 px-6 relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="max-w-4xl mx-auto text-center relative">
          <Badge variant="outline" className="mb-6 border-primary/30 text-primary bg-primary/5 px-3 py-1">
            <Sparkles className="w-3 h-3 mr-1.5" />
            Powered by Google Gemini
          </Badge>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6 leading-tight">
            Учись умнее с{" "}
            <span className="gradient-text">AI-ассистентом</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Образовательная платформа БГУИР с интеллектуальным тестированием, пробным экзаменом и RAG-чатом по материалам курса.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button size="lg" className="px-8 gap-2" onClick={handleStart}>
              <GraduationCap className="w-4 h-4" />
              {user ? "Открыть платформу" : "Начать обучение"}
              <ChevronRight className="w-4 h-4" />
            </Button>
            {!user && (
              <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
                Я преподаватель
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="mt-16 flex items-center justify-center gap-8 flex-wrap text-sm text-muted-foreground">
            {[
              { icon: Users, label: "Студентов", value: "1 000+" },
              { icon: BookOpen, label: "Курсов", value: "50+" },
              { icon: Brain, label: "AI-агентов", value: "4" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-primary" />
                <span className="font-semibold text-foreground">{value}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Всё для эффективного обучения</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Три AI-инструмента, каждый из которых понимает контекст твоего курса
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, color, bg, title, description }) => (
              <div
                key={title}
                className="rounded-xl border border-border/50 bg-card p-6 hover:border-primary/30 transition-all duration-200 group"
              >
                <div className={`w-12 h-12 rounded-lg border ${bg} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-card/30 border-y border-border/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Как это работает</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-10">
            {steps.map(({ role, steps: roleSteps }) => (
              <div key={role}>
                <h3 className="font-semibold text-foreground mb-5 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                    <GraduationCap className="w-3.5 h-3.5 text-primary" />
                  </span>
                  {role}
                </h3>
                <ol className="space-y-3">
                  {roleSteps.map((step, i) => (
                    <li key={step} className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="w-6 h-6 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-xs font-medium text-foreground shrink-0">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Готов начать?</h2>
          <p className="text-muted-foreground mb-8">Зарегистрируйся за 30 секунд</p>
          <Button size="lg" className="px-10" onClick={handleStart}>
            {user ? "Перейти в платформу" : "Создать аккаунт"}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      <footer className="border-t border-border/50 py-8 px-6 text-center text-sm text-muted-foreground">
        БГУИР · Personal Agentic Assistant · 2025
      </footer>
    </div>
  )
}
