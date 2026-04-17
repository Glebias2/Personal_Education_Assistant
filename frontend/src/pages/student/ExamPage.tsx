import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { examApi, type ExamAnswerResponse, type ExamResultPayload, type ExamSummary } from "@/api/exam";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, GraduationCap, Send, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "examiner";
  content: string;
  evaluation?: ExamResultPayload;
  isSummary?: boolean;
}

export default function ExamPage() {
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id);
  const { id: studentId } = useAuthStore();

  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [questionCount, setQuestionCount] = useState(5);
  const [examId, setExamId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const startExam = async () => {
    setLoading(true);
    try {
      const data = await examApi.start(courseId, {
        student_id: studentId!,
        question_count: questionCount,
        language: "ru",
      });
      setExamId(data.exam_id);
      setStarted(true);
      setMessages([
        {
          role: "examiner",
          content: `Экзамен начался. У вас ${questionCount} вопрос(ов).\n\nВопрос ${data.question.id}:\n${data.question.text}`,
        },
      ]);
    } catch {
      toast.error("Ошибка запуска экзамена");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading || !examId || completed) return;

    const userAnswer = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userAnswer }]);
    setLoading(true);

    try {
      const data: ExamAnswerResponse = await examApi.answer(courseId, {
        exam_id: examId,
        answer: userAnswer,
      });

      const evalMsg = formatEvaluation(data.evaluation);

      if (data.next_question) {
        setMessages((prev) => [
          ...prev,
          { role: "examiner", content: evalMsg, evaluation: data.evaluation },
          {
            role: "examiner",
            content: `Вопрос ${data.next_question.id}:\n${data.next_question.text}`,
          },
        ]);
      } else {
        // Last question answered — show eval then fetch summary
        setMessages((prev) => [
          ...prev,
          { role: "examiner", content: evalMsg, evaluation: data.evaluation },
        ]);
        await fetchSummary(examId);
      }
    } catch {
      toast.error("Ошибка отправки ответа");
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async (eid: string) => {
    try {
      const data: ExamSummary = await examApi.summary(courseId, eid);
      setCompleted(true);
      setMessages((prev) => [
        ...prev,
        { role: "examiner", content: formatSummary(data), isSummary: true },
      ]);
    } catch {
      toast.error("Ошибка получения результатов");
    }
  };

  const formatEvaluation = (ev: ExamResultPayload): string => {
    let msg = "";
    if (ev.score) msg += `Оценка: ${ev.score}/100\n`;
    msg += `Вердикт: ${ev.verdict}\n`;
    if (ev.issues && ev.issues.length > 0) {
      msg += `\nЗамечания:\n`;
      ev.issues.forEach((issue, i) => {
        msg += `${i + 1}. ${issue}\n`;
      });
    }
    if (ev.recommendation) msg += `\nРекомендация: ${ev.recommendation}`;
    return msg;
  };

  const formatSummary = (summary: ExamSummary): string => {
    const scores = summary.results
      .map((r) => parseFloat(r.score ?? "0"))
      .filter((s) => !isNaN(s));
    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    let msg = `Экзамен завершён!\nСредний балл: ${avg}/100\n\nРезультаты по вопросам:\n`;
    summary.results.forEach((r, i) => {
      msg += `\n${i + 1}. (${r.score ?? "—"}/100) — ${r.verdict}`;
    });
    msg += "\n\nВы можете начать новый экзамен или вернуться к курсу.";
    return msg;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const resetExam = () => {
    setStarted(false);
    setCompleted(false);
    setExamId(null);
    setMessages([]);
    setInput("");
  };

  // --- Setup screen ---
  if (!started) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Link to={`/student/courses/${courseId}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Назад к курсу
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-8 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-heading text-foreground">Пробный экзамен</h1>
              <p className="text-sm text-muted-foreground">AI-экзаменатор задаст вопросы и оценит ответы</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Количество вопросов (1–10)</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={questionCount}
                onChange={(e) => setQuestionCount(Math.min(10, Math.max(1, Number(e.target.value))))}
                className="bg-background border-border w-32"
              />
            </div>
            <Button onClick={startExam} disabled={loading} className="bg-primary hover:bg-primary/90">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Подготовка...
                </>
              ) : (
                "Начать экзамен"
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- Chat screen ---
  return (
    <div className="max-w-3xl mx-auto flex flex-col" style={{ height: "calc(100vh - 8rem)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Link to={`/student/courses/${courseId}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Назад к курсу
        </Link>
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-primary" />
          <span className="font-heading text-foreground">Пробный экзамен</span>
          {completed && (
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Завершён</Badge>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto chat-scroll rounded-2xl bg-card border border-border p-4 space-y-4 mb-4"
      >
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : msg.isSummary
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-foreground"
                    : msg.evaluation
                      ? "bg-amber-500/10 border border-amber-500/20 text-foreground"
                      : "bg-surface border border-border text-foreground"
              )}
            >
              {msg.role === "examiner" && (
                <div className="flex items-center gap-1.5 mb-1.5 text-xs font-medium text-muted-foreground">
                  <GraduationCap className="w-3 h-3" />
                  Экзаменатор
                  {msg.evaluation?.score && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "ml-auto text-xs px-1.5 py-0",
                        parseFloat(msg.evaluation.score) >= 70
                          ? "border-emerald-500/40 text-emerald-400"
                          : parseFloat(msg.evaluation.score) >= 40
                            ? "border-amber-500/40 text-amber-400"
                            : "border-rose-500/40 text-rose-400"
                      )}
                    >
                      {msg.evaluation.score}/100
                    </Badge>
                  )}
                </div>
              )}
              <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              {msg.evaluation?.issues && msg.evaluation.issues.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
                  {msg.evaluation.issues.map((issue, j) => (
                    <div key={j} className="flex items-start gap-1.5 text-xs text-amber-400">
                      <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                      {issue}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-surface border border-border rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Экзаменатор думает...
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        {completed ? (
          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={resetExam} className="flex-1">
              Новый экзамен
            </Button>
            <Link to={`/student/courses/${courseId}`} className="flex-1">
              <Button className="w-full bg-primary hover:bg-primary/90">К курсу</Button>
            </Link>
          </div>
        ) : (
          <>
            <Input
              placeholder="Введите ваш ответ..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              className="flex-1 bg-background border-border"
            />
            <Button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-primary hover:bg-primary/90 px-4"
            >
              <Send className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
