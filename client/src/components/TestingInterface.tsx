import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { TestQuestion, TestGenerationResponse, TestSubmitResponse, FileUploadResponse } from "@/types/models";
import { ArrowLeft, ArrowRight, CheckCircle, XCircle, Loader2, Upload, FileText, BookOpen } from "lucide-react";

/**
 * =============================================================================
 * КОМПОНЕНТ ИНТЕРФЕЙСА ТЕСТИРОВАНИЯ
 * =============================================================================
 * 
 * ENDPOINTS:
 * 
 * 1. POST /upload - Загрузка файла для теста
 *    Body: multipart/form-data с полем "file"
 *    Response: { success: boolean, message: string, material_length: number }
 * 
 * 2. POST /generate-by-topic - Генерация теста по теме
 *    Body: { topic: string, num_questions: number, difficulty: "easy" | "medium" | "hard" }
 *    Response: { success, total_questions, difficulty, questions: [...], error }
 * 
 * 3. POST /generate-by-file - Генерация теста по загруженному файлу
 *    Body: { num_questions: number, difficulty: "easy" | "medium" | "hard" }
 *    Response: { success, total_questions, difficulty, questions: [...], error }
 * 
 * 4. POST /submit - Проверка ответов
 *    Body: { answers: ["A", "B", "C", ...] }
 *    Response: { success, total_questions, correct_answers, wrong_answers, percentage, error }
 * 
 * 5. POST /reset - Сброс сессии
 *    Body: (пустое)
 *    Response: OK
 * 
 * =============================================================================
 */

const API_BASE_URL = "http://localhost:8000";

interface TestingInterfaceProps {
  courseId: number;
  studentId: number;
  onClose: () => void;
}

type TestSource = "none" | "file" | "topic";
type TestState = "select_source" | "configure" | "in_progress" | "results";

export default function TestingInterface({ courseId, studentId, onClose }: TestingInterfaceProps) {
  const { toast } = useToast();
  const [testState, setTestState] = useState<TestState>("select_source");
  const [testSource, setTestSource] = useState<TestSource>("none");
  
  // Конфигурация теста
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(3);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [fileUploaded, setFileUploaded] = useState(false);
  
  // Состояние теста
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<TestSubmitResponse | null>(null);

  /**
   * Загрузка файла
   * 
   * БЭКЕНД: POST /upload
   * Body: multipart/form-data с полем "file"
   */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error("Ошибка загрузки файла");
      }

      const data: FileUploadResponse = await response.json();
      
      if (data.success) {
        setFileUploaded(true);
        toast({ title: "Файл загружен", description: data.message });
      } else {
        throw new Error(data.message);
      }

    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Генерация теста по теме
   * 
   * БЭКЕНД: POST /generate-by-topic
   * Body: { topic, num_questions, difficulty }
   */
  const generateTestByTopic = async () => {
    if (!topic.trim()) {
      toast({ title: "Введите тему", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/generate-by-topic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          course_id: courseId,
          num_questions: numQuestions,
          difficulty
        })
      });

      if (!response.ok) {
        throw new Error("Ошибка генерации теста");
      }

      const data: TestGenerationResponse = await response.json();
      
      if (!data.success || data.error) {
        toast({ 
          title: "Ошибка генерации", 
          description: data.error || "Не удалось сгенерировать тест",
          variant: "destructive" 
        });
        return;
      }

      setQuestions(data.questions);
      setCurrentIndex(0);
      setAnswers({});
      setTestState("in_progress");

    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Генерация теста по файлу
   * 
   * БЭКЕНД: POST /generate-by-file
   * Body: { num_questions, difficulty }
   */
  const generateTestByFile = async () => {
    if (!fileUploaded) {
      toast({ title: "Сначала загрузите файл", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/generate-by-file`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          num_questions: numQuestions,
          difficulty
        })
      });

      if (!response.ok) {
        throw new Error("Ошибка генерации теста");
      }

      const data: TestGenerationResponse = await response.json();
      
      if (!data.success || data.error) {
        toast({ 
          title: "Ошибка генерации", 
          description: data.error || "Не удалось сгенерировать тест",
          variant: "destructive" 
        });
        return;
      }

      setQuestions(data.questions);
      setCurrentIndex(0);
      setAnswers({});
      setTestState("in_progress");

    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Выбор ответа
   */
  const handleAnswer = (questionNum: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionNum]: answer }));
  };

  /**
   * Отправка ответов на проверку
   * 
   * БЭКЕНД: POST /submit
   * Body: { answers: ["A", "B", "C", ...] }
   */
  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Формируем массив ответов в порядке вопросов
      const answersArray = questions.map(q => answers[q.question_num] || "");

      const response = await fetch(`${API_BASE_URL}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: answersArray })
      });

      if (!response.ok) {
        throw new Error("Ошибка проверки теста");
      }

      const data: TestSubmitResponse = await response.json();
      
      if (!data.success || data.error) {
        toast({ 
          title: "Ошибка", 
          description: data.error || "Не удалось проверить тест",
          variant: "destructive" 
        });
        return;
      }

      setResults(data);
      setTestState("results");

    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Выход и сброс сессии
   * 
   * БЭКЕНД: POST /reset
   */
  const handleExit = async () => {
    try {
      await fetch(`${API_BASE_URL}/reset`, { method: "POST" });
    } catch (error) {
      // Игнорируем ошибки при сбросе
    }
    onClose();
  };

  /**
   * Повторное прохождение
   */
  const handleRetry = () => {
    setTestState("select_source");
    setTestSource("none");
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers({});
    setResults(null);
    setFileUploaded(false);
    setTopic("");
  };

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  // Экран выбора источника теста
  if (testState === "select_source") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Тестирование</CardTitle>
            <Button variant="ghost" size="sm" onClick={handleExit}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Выйти
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Выберите источник для генерации теста
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <Card 
              className="border-2 hover:border-primary transition-colors cursor-pointer" 
              onClick={() => {
                setTestSource("file");
                setTestState("configure");
              }}
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <Upload className="h-8 w-8 text-primary" />
                  <h3 className="font-semibold text-lg">Загрузить файл</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Загрузите документ и пройдите тест по его содержимому
                </p>
              </CardContent>
            </Card>
            <Card 
              className="border-2 hover:border-primary transition-colors cursor-pointer" 
              onClick={() => {
                setTestSource("topic");
                setTestState("configure");
              }}
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <BookOpen className="h-8 w-8 text-primary" />
                  <h3 className="font-semibold text-lg">Выбрать тему</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Введите тему и пройдите тест по материалам из базы данных
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Экран конфигурации теста
  if (testState === "configure") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {testSource === "file" ? "Тест по файлу" : "Тест по теме"}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleExit}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Выйти
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {testSource === "file" && (
            <div className="space-y-2">
              <Label>Загрузите файл с материалом</Label>
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={loading}
                  accept=".txt,.pdf,.doc,.docx"
                />
                {fileUploaded && (
                  <Badge variant="default" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Загружен
                  </Badge>
                )}
              </div>
            </div>
          )}

          {testSource === "topic" && (
            <div className="space-y-2">
              <Label>Тема для теста</Label>
              <Input
                placeholder="Например: Машинное обучение"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Количество вопросов</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={numQuestions}
                onChange={(e) => setNumQuestions(parseInt(e.target.value) || 3)}
              />
            </div>
            <div className="space-y-2">
              <Label>Сложность</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Легкий</SelectItem>
                  <SelectItem value="medium">Средний</SelectItem>
                  <SelectItem value="hard">Сложный</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setTestState("select_source")}
            >
              Назад
            </Button>
            <Button 
              onClick={testSource === "file" ? generateTestByFile : generateTestByTopic}
              disabled={loading || (testSource === "file" && !fileUploaded) || (testSource === "topic" && !topic.trim())}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Начать тест
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Экран результатов
  if (testState === "results" && results) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Результаты теста</CardTitle>
            <Badge variant={results.percentage >= 50 ? "default" : "destructive"}>
              {results.correct_answers} / {results.total_questions}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={results.percentage} className="h-3" />
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <Card className="p-4">
              <div className="text-2xl font-bold text-green-600">{results.correct_answers}</div>
              <div className="text-sm text-muted-foreground">Правильных</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-red-600">{results.wrong_answers}</div>
              <div className="text-sm text-muted-foreground">Неправильных</div>
            </Card>
          </div>
          
          <div className="text-center py-4">
            <div className="text-4xl font-bold">{results.percentage}%</div>
            <div className="text-muted-foreground">Результат</div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleRetry}>Пройти заново</Button>
            <Button variant="outline" onClick={handleExit}>
              Выйти
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Экран прохождения теста
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Вопрос {currentIndex + 1} из {questions.length}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              Отвечено: {Object.keys(answers).length} / {questions.length}
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleExit}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Выйти
            </Button>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        {currentQuestion && (
          <>
            <p className="text-lg">{currentQuestion.text}</p>

            <RadioGroup
              value={answers[currentQuestion.question_num] || ""}
              onValueChange={(value) => handleAnswer(currentQuestion.question_num, value)}
            >
              {Object.entries(currentQuestion.options).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2 p-3 border rounded hover:bg-muted/50">
                  <RadioGroupItem value={key} id={`option-${key}`} />
                  <Label htmlFor={`option-${key}`} className="flex-1 cursor-pointer">
                    <span className="font-medium">{key}.</span> {value}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Назад
              </Button>

              {currentIndex < questions.length - 1 ? (
                <Button onClick={() => setCurrentIndex(i => i + 1)}>
                  Далее
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading || Object.keys(answers).length < questions.length}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Проверить результат
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
