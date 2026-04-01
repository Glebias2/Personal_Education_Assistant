import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Send, ArrowLeft, Loader2, GraduationCap } from "lucide-react";
import { ExamQuestion, ExamStartResponse, ExamAnswerResponse, ExamSummaryResponse, ExamResultItem } from "@/types/models";
import { submitExamAnswer } from "@/lib/api";

const API_BASE_URL = "http://localhost:8000";

interface Message {
  role: "user" | "examiner";
  content: string;
  evaluation?: ExamResultItem;
}

interface ExaminerChatProps {
  courseId: number;
  courseTitle: string;
  studentId: number;
  onClose: () => void;
}

type ExamState = "setup" | "in_progress" | "completed";

export default function ExaminerChat({ courseId, courseTitle, studentId, onClose }: ExaminerChatProps) {
  const { toast } = useToast();
  const [examState, setExamState] = useState<ExamState>("setup");
  const [questionCount, setQuestionCount] = useState(3);
  const [examId, setExamId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<ExamQuestion | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<ExamSummaryResponse | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const effectiveCourseId = courseId || 2;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Запуск экзамена
  const startExam = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/courses/${effectiveCourseId}/exam/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentId, question_count: questionCount, language: "ru" })
      });
      if (!response.ok) throw new Error("Ошибка запуска экзамена");

      const data: ExamStartResponse = await response.json();
      setExamId(data.exam_id);
      setCurrentQuestion(data.question);
      setExamState("in_progress");

      setMessages([{
        role: "examiner",
        content: `Экзамен начался. У вас ${questionCount} вопрос(ов).\n\nВопрос ${data.question.id}:\n${data.question.text}`
      }]);
    } catch {
      toast({ title: "Ошибка запуска экзамена", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Отправка ответа на вопрос
  const handleSend = async () => {
    if (!input.trim() || loading || !examId || examState !== "in_progress") return;

    const userAnswer = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userAnswer }]);
    setLoading(true);

    try {
      const data = await submitExamAnswer(effectiveCourseId, examId, userAnswer);
      if (!data) throw new Error("Ошибка отправки ответа");

      // Показываем только следующий вопрос, если он есть
      if (data.next_question !== null) {
        setCurrentQuestion(data.next_question);
        setMessages(prev => [
          ...prev,
          {
            role: "examiner",
            content: `Вопрос ${data.next_question.id}:\n${data.next_question.text}`
          }
        ]);
      } else {
        // Вопросов больше нет — завершаем экзамен
        if (data.evaluation) {
          setMessages(prev => [
            ...prev,
            { role: "examiner", content: formatEvaluationMessage(data.evaluation) }
          ]);
        }
        await fetchSummary(examId);
      }

    } catch (error) {
      console.error("Submit answer error:", error);
      toast({ 
        title: "Ошибка отправки ответа", 
        description: error instanceof Error ? error.message : "Неизвестная ошибка",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  // Получение итоговой сводки
  const fetchSummary = async (examId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/courses/${effectiveCourseId}/summary?exam_id=${examId}`);
      if (!response.ok) throw new Error("Ошибка получения результатов");

      const data: ExamSummaryResponse = await response.json();
      setSummary(data);
      setExamState("completed");

      setMessages(prev => [...prev, { role: "examiner", content: formatSummaryMessage(data) }]);
    } catch {
      toast({ title: "Ошибка получения результатов", variant: "destructive" });
    }
  };

  // Форматирование оценки по вопросу
  const formatEvaluationMessage = (evaluation: ExamAnswerResponse["evaluation"]): string => {
    let message = `Оценка: ${evaluation.score}/100\n`;
    message += `Вердикт: ${evaluation.verdict}\n\n`;

    if (evaluation.issues.length > 0) {
      message += `Замечания:\n`;
      evaluation.issues.forEach((issue, idx) => {
        message += `${idx + 1}. ${issue}\n`;
      });
      message += "\n";
    }

    message += `Рекомендации: ${evaluation.recommendation}`;
    return message;
  };

  // Форматирование итоговой сводки
  const formatSummaryMessage = (summary: ExamSummaryResponse): string => {
    const totalScore = summary.results.reduce((acc, r) => acc + parseInt(r.score), 0);
    const avgScore = Math.round(totalScore / summary.results.length);

    let message = `Экзамен завершён\nСредний балл: ${avgScore}/100\n\nРезультаты по вопросам:\n`;
    summary.results.forEach((result, i) => {
      message += `Вопрос ${i + 1} (${result.score}/100)\n`;
      message += `Вердикт: ${result.verdict}\n\n`;
    });
    message += `Вы можете выйти из экзамена.`;
    return message;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Экран настройки экзамена
  if (examState === "setup") {
    return (
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="border-b flex justify-between items-center">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Пробный экзамен</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Выйти
          </Button>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-center items-center p-6">
          <div className="max-w-md w-full space-y-6">
            <Label htmlFor="questionCount">Количество вопросов</Label>
            <Input
              id="questionCount"
              type="number"
              min={1}
              max={10}
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value) || 3)}
            />
            <Button onClick={startExam} className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Начать экзамен
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Экран чата с экзаменатором
  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="border-b flex justify-between items-center">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Пробный экзамен</CardTitle>
          {examState === "completed" && <Badge variant="secondary">Завершён</Badge>}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Выйти
        </Button>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
          <div className="flex flex-col gap-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] break-words rounded-lg px-4 py-3 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                  {msg.role === "examiner" && (
                    <div className="flex items-center gap-1 mb-1 text-xs font-medium opacity-70">
                      <GraduationCap className="h-3 w-3" /> Экзаменатор
                    </div>
                  )}
                  <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t flex gap-2">
          <Input
            placeholder={examState === "completed" ? "Экзамен завершён" : "Введите ваш ответ..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading || examState === "completed"}
          />
          <Button onClick={handleSend} disabled={loading || !input.trim() || examState === "completed"}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
