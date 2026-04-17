import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { testsApi, type TestQuestion, type TestEvalResponse } from "@/api/tests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TEST_DIFFICULTY_MAP } from "@/utils/constants";
import { cn } from "@/lib/utils";
import { ArrowLeft, Loader2, CheckCircle, XCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

type Phase = "setup" | "quiz" | "result";

export default function TestPage() {
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id);
  const { id: studentId } = useAuthStore();

  const [phase, setPhase] = useState<Phase>("setup");
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<TestEvalResponse | null>(null);

  const generateMutation = useMutation({
    mutationFn: () => testsApi.generateByTopic({ course_id: courseId, topic, num_questions: numQuestions, difficulty }),
    onSuccess: (data) => {
      if (!data.success || data.questions.length === 0) {
        toast.error(data.error ?? "Не удалось сгенерировать тест");
        return;
      }
      setQuestions(data.questions);
      setPhase("quiz");
      setCurrentIdx(0);
      setAnswers(new Array(data.questions.length).fill(""));
    },
    onError: () => toast.error("Ошибка генерации теста"),
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      testsApi.submit({
        student_id: studentId!,
        course_id: courseId,
        answers,
      }),
    onSuccess: (data) => {
      setResult(data);
      setPhase("result");
    },
    onError: () => toast.error("Ошибка отправки"),
  });

  const q = questions[currentIdx];
  const optionEntries = q ? Object.entries(q.options) : [];
  const allAnswered = questions.length > 0 && answers.every((a) => a !== "");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to={`/student/courses/${courseId}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Назад к курсу
      </Link>

      <AnimatePresence mode="wait">
        {phase === "setup" && (
          <motion.div key="setup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="p-8 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-heading text-foreground">Генерация теста</h1>
                <p className="text-sm text-muted-foreground">AI создаст вопросы по вашей теме</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Тема</Label>
                <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Например: сортировка массивов" className="bg-background border-border" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Количество вопросов (1–20)</Label>
                  <Input type="number" min={1} max={20} value={numQuestions} onChange={(e) => setNumQuestions(Math.min(20, Math.max(1, Number(e.target.value))))} className="bg-background border-border w-full" />
                </div>
                <div className="space-y-2">
                  <Label>Сложность</Label>
                  <div className="flex gap-2">
                    {(["easy", "medium", "hard"] as const).map((d) => {
                      const info = TEST_DIFFICULTY_MAP[d];
                      return (
                        <Badge
                          key={d}
                          variant="outline"
                          className={cn(
                            "cursor-pointer transition-all px-3 py-1.5",
                            difficulty === d ? info.color : "border-border text-muted-foreground hover:border-primary/30"
                          )}
                          onClick={() => setDifficulty(d)}
                        >
                          {info.label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </div>
              <Button onClick={() => generateMutation.mutate()} disabled={!topic || generateMutation.isPending} className="bg-primary hover:bg-primary/90">
                {generateMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Генерация...</> : "Сгенерировать тест"}
              </Button>
            </div>
          </motion.div>
        )}

        {phase === "quiz" && q && (
          <motion.div key={`q-${currentIdx}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-surface overflow-hidden">
                <motion.div className="h-full bg-primary rounded-full" initial={{ width: 0 }} animate={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} />
              </div>
              <span className="text-sm text-muted-foreground">{currentIdx + 1}/{questions.length}</span>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border">
              <h2 className="text-lg font-heading text-foreground mb-6">{q.text}</h2>
              <RadioGroup
                value={answers[currentIdx] ?? ""}
                onValueChange={(v) => {
                  if (!v) return;
                  setAnswers((prev) => {
                    const next = [...prev];
                    next[currentIdx] = v;
                    return next;
                  });
                }}
              >
                <div className="space-y-3">
                  {optionEntries.map(([key, text]) => (
                    <label key={key} className="flex items-center gap-3 p-4 rounded-xl bg-surface border border-border hover:border-primary/30 transition-all cursor-pointer">
                      <RadioGroupItem value={key} />
                      <span className="text-foreground"><span className="font-medium mr-2">{key}.</span>{text}</span>
                    </label>
                  ))}
                </div>
              </RadioGroup>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentIdx((p) => p - 1)} disabled={currentIdx === 0}>Назад</Button>
              {currentIdx < questions.length - 1 ? (
                <Button onClick={() => setCurrentIdx((p) => p + 1)} disabled={!answers[currentIdx]} className="bg-primary hover:bg-primary/90">Далее</Button>
              ) : (
                <Button onClick={() => submitMutation.mutate()} disabled={!allAnswered || submitMutation.isPending} className="bg-primary hover:bg-primary/90">
                  {submitMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Отправка...</> : "Завершить"}
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {phase === "result" && result && (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-8 rounded-2xl bg-card border border-border text-center">
            <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${result.percentage >= 70 ? "bg-emerald-500/15" : "bg-rose-500/15"}`}>
              {result.percentage >= 70 ? <CheckCircle className="w-10 h-10 text-emerald-400" /> : <XCircle className="w-10 h-10 text-rose-400" />}
            </div>
            <h2 className="text-3xl font-heading text-foreground mb-2">{Math.round(result.percentage)}%</h2>
            <p className="text-muted-foreground mb-2">{result.correct_answers} из {result.total_questions} правильных</p>
            <Badge className={result.percentage >= 70 ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}>
              {result.percentage >= 70 ? "Тест пройден" : "Попробуйте ещё"}
            </Badge>
            <div className="mt-8 flex gap-3 justify-center">
              <Button variant="outline" onClick={() => { setPhase("setup"); setResult(null); }}>Новый тест</Button>
              <Link to={`/student/courses/${courseId}`}><Button className="bg-primary hover:bg-primary/90">К курсу</Button></Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
