import { useState, useRef } from "react"
import { useParams } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { FlaskConical, Upload, BookOpen, Loader2, CheckCircle, XCircle, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/features/auth/AuthContext"
import { fetchJSON, API_BASE } from "@/lib/api/helpers"
import { cn } from "@/lib/utils"

type Phase = "setup" | "quiz" | "results"

interface Question {
  question_num: number
  text: string
  options: Record<string, string>
  type: string
}

interface TestResult {
  success: boolean
  total_questions: number
  correct_answers: number
  wrong_answers: number
  percentage: number
}

export default function CourseTesting() {
  const { courseId } = useParams<{ courseId: string }>()
  const { user } = useAuth()
  const [phase, setPhase] = useState<Phase>("setup")
  const [source, setSource] = useState<"topic" | "file">("topic")
  const [topic, setTopic] = useState("")
  const [numQ, setNumQ] = useState("5")
  const [difficulty, setDifficulty] = useState("medium")
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [current, setCurrent] = useState(0)
  const [result, setResult] = useState<TestResult | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const resetMutation = useMutation({
    mutationFn: () => fetchJSON<any>("/api/v1/tests/reset", { method: "POST" }),
  })

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch(`${API_BASE}/api/v1/tests/upload`, { method: "POST", body: form })
      if (!res.ok) throw new Error("Upload failed")
      return res.json()
    },
    onSuccess: () => toast.success("Файл загружен"),
    onError: () => toast.error("Ошибка загрузки файла"),
  })

  const generateMutation = useMutation({
    mutationFn: async () => {
      await resetMutation.mutateAsync()
      if (source === "topic") {
        return fetchJSON<any>("/api/v1/tests/generate-by-topic", {
          method: "POST",
          body: JSON.stringify({ topic, course_id: Number(courseId), num_questions: Number(numQ), difficulty }),
        })
      } else {
        return fetchJSON<any>("/api/v1/tests/generate-by-file", {
          method: "POST",
          body: JSON.stringify({ num_questions: Number(numQ), difficulty }),
        })
      }
    },
    onSuccess: (data) => {
      if (!data.success) { toast.error(data.error ?? "Ошибка генерации"); return }
      setQuestions(data.questions)
      setAnswers({})
      setCurrent(0)
      setPhase("quiz")
    },
    onError: () => toast.error("Ошибка генерации теста"),
  })

  const submitMutation = useMutation({
    mutationFn: () => fetchJSON<any>("/api/v1/tests/submit", {
      method: "POST",
      body: JSON.stringify({
        answers: questions.map((q, i) => answers[i] ?? ""),
        student_id: user!.id,
        course_id: Number(courseId),
      }),
    }),
    onSuccess: (data) => {
      setResult(data)
      setPhase("results")
    },
    onError: () => toast.error("Ошибка при отправке ответов"),
  })

  const q = questions[current]
  const progress = questions.length > 0 ? ((current + 1) / questions.length) * 100 : 0

  // ── Setup ──
  if (phase === "setup") return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
          <FlaskConical className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h2 className="font-semibold">Тестирование</h2>
          <p className="text-sm text-muted-foreground">Выберите источник и настройки теста</p>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card p-6 space-y-5">
        <Tabs value={source} onValueChange={(v) => setSource(v as "topic" | "file")}>
          <TabsList className="w-full">
            <TabsTrigger value="topic" className="flex-1 gap-1.5"><BookOpen className="w-3.5 h-3.5" /> По теме курса</TabsTrigger>
            <TabsTrigger value="file" className="flex-1 gap-1.5"><Upload className="w-3.5 h-3.5" /> Загрузить файл</TabsTrigger>
          </TabsList>
        </Tabs>

        {source === "topic" ? (
          <div className="space-y-1.5">
            <Label>Тема</Label>
            <Input placeholder="Например: Алгоритмы сортировки" value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Файл (PDF, DOCX, TXT)</Label>
            <div
              className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Нажмите для выбора файла</p>
              {uploadMutation.isSuccess && <p className="text-xs text-success mt-1">✓ Файл загружен</p>}
            </div>
            <input
              type="file"
              ref={fileRef}
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) uploadMutation.mutate(e.target.files[0]) }}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Вопросов</Label>
            <Select value={numQ} onValueChange={setNumQ}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[3,5,7,10,15].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Сложность</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Лёгкий</SelectItem>
                <SelectItem value="medium">Средний</SelectItem>
                <SelectItem value="hard">Сложный</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          className="w-full"
          disabled={generateMutation.isPending || (source === "topic" && !topic) || (source === "file" && !uploadMutation.isSuccess)}
          onClick={() => generateMutation.mutate()}
        >
          {generateMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Генерируем...</> : "Начать тест"}
        </Button>
      </div>
    </div>
  )

  // ── Quiz ──
  if (phase === "quiz" && q) return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
        <span>Вопрос {current + 1} из {questions.length}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full mb-8 overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <div className="rounded-xl border border-border/50 bg-card p-6 mb-6">
        <p className="text-foreground leading-relaxed font-medium">{q.text}</p>
      </div>

      <div className="space-y-2 mb-8">
        {Object.entries(q.options).map(([key, val]) => (
          <button
            key={key}
            className={cn(
              "w-full text-left p-4 rounded-xl border transition-all text-sm",
              answers[current] === key
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border/50 bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
            )}
            onClick={() => setAnswers(prev => ({ ...prev, [current]: key }))}
          >
            <span className="font-semibold text-primary mr-2">{key}.</span> {val}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" disabled={current === 0} onClick={() => setCurrent(c => c - 1)}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Назад
        </Button>
        {current < questions.length - 1 ? (
          <Button disabled={!answers[current]} onClick={() => setCurrent(c => c + 1)}>
            Далее <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            disabled={Object.keys(answers).length < questions.length || submitMutation.isPending}
            onClick={() => submitMutation.mutate()}
          >
            {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Завершить тест"}
          </Button>
        )}
      </div>
    </div>
  )

  // ── Results ──
  if (phase === "results" && result) return (
    <div className="p-8 max-w-2xl mx-auto text-center">
      <div className={cn(
        "w-20 h-20 rounded-full border-4 flex items-center justify-center mx-auto mb-6 text-3xl font-bold",
        result.percentage >= 70 ? "border-success text-success" : result.percentage >= 50 ? "border-warning text-warning" : "border-destructive text-destructive"
      )}>
        {Math.round(result.percentage)}%
      </div>
      <h2 className="text-xl font-bold mb-2">{result.percentage >= 70 ? "Отлично!" : result.percentage >= 50 ? "Неплохо" : "Попробуйте снова"}</h2>
      <p className="text-muted-foreground mb-8">
        Правильных ответов: <span className="text-success font-semibold">{result.correct_answers}</span> из {result.total_questions}
      </p>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <p className="text-2xl font-bold text-foreground">{result.total_questions}</p>
          <p className="text-xs text-muted-foreground">Всего</p>
        </div>
        <div className="rounded-xl border border-success/30 bg-success/10 p-4">
          <p className="text-2xl font-bold text-success">{result.correct_answers}</p>
          <p className="text-xs text-muted-foreground">Верных</p>
        </div>
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
          <p className="text-2xl font-bold text-destructive">{result.wrong_answers}</p>
          <p className="text-xs text-muted-foreground">Неверных</p>
        </div>
      </div>
      <Button onClick={() => { setPhase("setup"); setResult(null) }}>
        <RotateCcw className="w-4 h-4 mr-2" /> Пройти ещё раз
      </Button>
    </div>
  )

  return null
}
