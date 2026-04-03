import { useState } from "react"
import { useParams } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { Brain, Loader2, CheckCircle, XCircle, RotateCcw, Send } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/features/auth/AuthContext"
import { fetchJSON } from "@/lib/api/helpers"
import { cn } from "@/lib/utils"

type Phase = "setup" | "exam" | "done"

interface Question { id: string; text: string }
interface Evaluation {
  question_text: string
  user_answer: string
  verdict: string
  recommendation: string
  issues: string[]
  score?: number
}

export default function CourseExam() {
  const { courseId } = useParams<{ courseId: string }>()
  const { user } = useAuth()
  const [phase, setPhase] = useState<Phase>("setup")
  const [numQ, setNumQ] = useState("3")
  const [examId, setExamId] = useState("")
  const [question, setQuestion] = useState<Question | null>(null)
  const [answer, setAnswer] = useState("")
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [hasMore, setHasMore] = useState(false)

  const startMutation = useMutation({
    mutationFn: () => fetchJSON<any>(`/api/v1/courses/${courseId}/exam/start`, {
      method: "POST",
      body: JSON.stringify({ student_id: user!.id, question_count: Number(numQ), language: "ru" }),
    }),
    onSuccess: (data) => {
      setExamId(data.exam_id)
      setQuestion(data.question)
      setHasMore(data.has_more_questions)
      setEvaluations([])
      setAnswer("")
      setPhase("exam")
    },
    onError: () => toast.error("Не удалось начать экзамен"),
  })

  const answerMutation = useMutation({
    mutationFn: () => fetchJSON<any>(`/api/v1/courses/${courseId}/exam/answer`, {
      method: "POST",
      body: JSON.stringify({ exam_id: examId, answer }),
    }),
    onSuccess: (data) => {
      setEvaluations(prev => [...prev, data.evaluation])
      setAnswer("")
      if (data.completed || !data.has_more_questions) {
        setPhase("done")
        setQuestion(null)
      } else {
        setQuestion(data.next_question)
        setHasMore(data.has_more_questions)
      }
    },
    onError: () => toast.error("Ошибка при отправке ответа"),
  })

  const avgScore = evaluations.length > 0 && evaluations.every(e => e.score != null)
    ? (evaluations.reduce((s, e) => s + (e.score ?? 0), 0) / evaluations.length).toFixed(1)
    : null

  // ── Setup ──
  if (phase === "setup") return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-warning/10 border border-warning/20 flex items-center justify-center">
          <Brain className="w-5 h-5 text-warning" />
        </div>
        <div>
          <h2 className="font-semibold">Пробный экзамен</h2>
          <p className="text-sm text-muted-foreground">AI-экзаменатор задаёт вопросы и оценивает ответы</p>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card p-6 space-y-5">
        <div className="space-y-1.5">
          <Label>Количество вопросов</Label>
          <Select value={numQ} onValueChange={setNumQ}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[1,2,3,5,7,10].map(n => <SelectItem key={n} value={String(n)}>{n} вопрос{n === 1 ? "" : n < 5 ? "а" : "ов"}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg bg-warning/5 border border-warning/20 p-3 text-sm text-muted-foreground">
          💡 Вопросы генерируются из материалов курса. Отвечайте развёрнуто — AI оценивает качество ответа.
        </div>

        <Button className="w-full" disabled={startMutation.isPending} onClick={() => startMutation.mutate()}>
          {startMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Подготовка...</> : "Начать экзамен"}
        </Button>
      </div>
    </div>
  )

  // ── Exam in progress ──
  if (phase === "exam" && question) return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm text-muted-foreground">
          Вопрос {evaluations.length + 1}{hasMore ? "..." : ` из ${evaluations.length + 1}`}
        </span>
        <div className="flex gap-1.5">
          {evaluations.map((e, i) => (
            <div key={i} className={cn("w-2 h-2 rounded-full", e.verdict === "PASS" ? "bg-success" : "bg-destructive")} />
          ))}
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        </div>
      </div>

      {/* Previous evaluations summary */}
      {evaluations.length > 0 && (
        <div className="mb-6 space-y-3">
          {evaluations.map((e, i) => (
            <div key={i} className={cn("rounded-lg border p-3 text-sm", e.verdict === "PASS" ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5")}>
              <div className="flex items-center gap-2 mb-1">
                {e.verdict === "PASS" ? <CheckCircle className="w-3.5 h-3.5 text-success" /> : <XCircle className="w-3.5 h-3.5 text-destructive" />}
                <span className="font-medium text-xs">{e.question_text.slice(0, 60)}...</span>
                {e.score != null && <span className="ml-auto text-xs font-semibold">{e.score}/10</span>}
              </div>
              <p className="text-xs text-muted-foreground">{e.recommendation}</p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-border/50 bg-card p-5 mb-5">
        <p className="font-medium text-foreground leading-relaxed">{question.text}</p>
      </div>

      <div className="space-y-3">
        <Textarea
          placeholder="Введите развёрнутый ответ..."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={5}
          className="resize-none"
        />
        <Button
          className="w-full gap-2"
          disabled={!answer.trim() || answerMutation.isPending}
          onClick={() => answerMutation.mutate()}
        >
          {answerMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Проверяется...</> : <><Send className="w-4 h-4" /> Ответить</>}
        </Button>
      </div>
    </div>
  )

  // ── Done ──
  if (phase === "done") return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
          <Brain className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-xl font-bold mb-1">Экзамен завершён</h2>
        {avgScore && <p className="text-3xl font-bold text-primary mt-2">{avgScore}<span className="text-lg text-muted-foreground">/10</span></p>}
        <p className="text-muted-foreground text-sm mt-1">Средний балл</p>
      </div>

      <div className="space-y-4 mb-8">
        {evaluations.map((e, i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-card p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <p className="text-sm font-medium text-foreground">{e.question_text}</p>
              <div className="flex items-center gap-2 shrink-0">
                {e.verdict === "PASS"
                  ? <CheckCircle className="w-4 h-4 text-success" />
                  : <XCircle className="w-4 h-4 text-destructive" />}
                {e.score != null && (
                  <span className={cn("text-sm font-bold", e.verdict === "PASS" ? "text-success" : "text-destructive")}>
                    {e.score}/10
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <div className="bg-muted/30 rounded-lg p-2">
                <p className="text-muted-foreground font-medium mb-0.5">Ваш ответ:</p>
                <p className="text-foreground">{e.user_answer}</p>
              </div>
              {e.recommendation && (
                <p className="text-muted-foreground">{e.recommendation}</p>
              )}
              {e.issues?.length > 0 && (
                <ul className="text-destructive space-y-0.5">
                  {e.issues.map((iss, j) => <li key={j}>• {iss}</li>)}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" className="w-full" onClick={() => { setPhase("setup"); setEvaluations([]) }}>
        <RotateCcw className="w-4 h-4 mr-2" /> Пройти снова
      </Button>
    </div>
  )

  return null
}
