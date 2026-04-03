import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getCourseById, getCourseLabs, getCourseFiles, addReport } from "@/lib/api";
import type { CourseFileInfo } from "@/lib/api";
import { getAuthUser } from "@/lib/auth";
import { Course, Lab } from "@/types";
import { ArrowLeft, AlertCircle, ClipboardCheck, Download, GraduationCap, FileText } from "lucide-react";
import AIAssistantChat from "@/components/AIAssistantChat";
import TestingInterface from "@/components/TestingInterface";
import ExaminerChat from "@/components/ExaminerChat";

type TestMode = "none" | "test" | "exam";

export default function CourseDetailStudent() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = getAuthUser();

  const [course, setCourse] = useState<Course | null>(null);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [courseFiles, setCourseFiles] = useState<CourseFileInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Для добавления отчёта
  const [selectedLabId, setSelectedLabId] = useState<string>("");
  const [reportLink, setReportLink] = useState("");
  const [addingReport, setAddingReport] = useState(false);
  const [reportResult, setReportResult] = useState<{ status: string; message?: string } | null>(null);

  // Для тестирования и экзаменов
  const [testMode, setTestMode] = useState<TestMode>("none");

  useEffect(() => {
    loadData();
  }, [courseId]);

  const loadData = async () => {
    if (!courseId || !user) return;

    setLoading(true);
    try {
      const courseData = await getCourseById(Number(courseId));
      setCourse(courseData[0]);

      const labsData = await getCourseLabs(parseInt(courseId));
      setLabs(labsData);

      const filesResp = await getCourseFiles(Number(courseId));
      setCourseFiles(filesResp.files || []);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные курса",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getReportTitle = (status: string) => {
    switch (status) {
      case "loaded":
        return "Отчёт принят";
      case "rejected":
        return "Отчёт отклонён";
      default:
        return "Неизвестный статус";
    }
  };

  const handleAddReport = async () => {
    if (!selectedLabId) {
      toast({ title: "Выберите лабораторную работу", variant: "destructive" });
      return;
    }
    if (!reportLink) {
      toast({ title: "Введите ссылку на отчёт", variant: "destructive" });
      return;
    }
    if (!user) return;

    setAddingReport(true);
    try {
      const result = await addReport(user.id, parseInt(selectedLabId), reportLink);

      setReportResult(result);
      setReportLink("");

      if (result.status === "loaded") {
        toast({
          title: "Отчёт успешно загружен",
          description: "Преподаватель получит ваш отчёт",
        });
      } else if (result.status === "rejected") {
        toast({
          title: "Отчёт отклонён",
          description: result.message || "Исправьте ошибки и загрузите снова",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Ошибка загрузки отчёта",
        description: error.message || "Попробуйте позже",
        variant: "destructive",
      });
    } finally {
      setAddingReport(false);
    }
  };


  if (loading) return <div className="flex items-center justify-center min-h-screen">Загрузка...</div>;
  if (!course) return <div className="flex items-center justify-center min-h-screen">Курс не найден</div>;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/student")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад
          </Button>
          <h1 className="text-3xl font-bold">{course.title}</h1>
        </div>

        <Tabs defaultValue="materials" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="materials">Материалы</TabsTrigger>
            <TabsTrigger value="labs">Лабы</TabsTrigger>
            <TabsTrigger value="reports">Отчеты</TabsTrigger>
            <TabsTrigger value="test">Тестирование</TabsTrigger>
            <TabsTrigger value="chat">AI Ассистент</TabsTrigger>
          </TabsList>

          <TabsContent value="materials">
            <Card>
              <CardHeader>
                <CardTitle>Материалы курса</CardTitle>
              </CardHeader>
              <CardContent>
                {courseFiles.length > 0 ? (
                  <div className="space-y-2">
                    {courseFiles.map((f) => (
                      <div key={f.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card/30">
                        <FileText className="h-5 w-5 text-primary shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{f.filename}</div>
                          <div className="text-xs text-muted-foreground">{new Date(f.created_at).toLocaleDateString("ru-RU")}</div>
                        </div>
                        <a
                          href={`http://localhost:8000/api/v1/courses/${courseId}/files/${f.file_id}/download`}
                          download={f.filename}
                          className="shrink-0"
                        >
                          <Button size="sm" variant="ghost">
                            <Download className="h-4 w-4" />
                          </Button>
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Материалы ещё не добавлены преподавателем</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="labs">
            <Card>
              <CardHeader>
                <CardTitle>Лабораторные работы</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {labs.length === 0 ? (
                  <p className="text-muted-foreground">Лабораторные работы еще не добавлены</p>
                ) : (
                  labs.map((lab) => (
                    <div key={lab.id} className="p-4 border rounded space-y-2">
                      <h3 className="font-semibold">
                        Лаба {lab.number}: {lab.title}
                      </h3>
                      {lab.task && <p className="text-muted-foreground">{lab.task}</p>}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Загрузка отчёта</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Лабораторная работа</Label>
                  <Select value={selectedLabId} onValueChange={setSelectedLabId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите лабораторную..." />
                    </SelectTrigger>
                    <SelectContent>
                      {labs.map((lab) => (
                        <SelectItem key={lab.id} value={String(lab.id)}>
                          Лаб. {lab.number} — {lab.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Ссылка на Google Doc</Label>
                  <Input
                    placeholder="https://docs.google.com/..."
                    value={reportLink}
                    onChange={(e) => setReportLink(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddReport} className="w-full" disabled={addingReport || !selectedLabId}>
                  {addingReport ? "Загрузка..." : "Добавить отчёт"}
                </Button>

                {reportResult && (
                  <div className="p-4 bg-muted rounded-lg mt-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-primary" />
                      <strong>Результат: {getReportTitle(reportResult.status)}</strong>
                    </div>
                    <p className="mt-2">{reportResult.status === "loaded" ? "Отчёт принят" : reportResult.message}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="test">
            {testMode === "none" ? (
              <div className="grid md:grid-cols-2 gap-4">
                <Card
                  className="border-2 hover:border-primary transition-colors cursor-pointer"
                  onClick={() => setTestMode("test")}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-3">
                      <ClipboardCheck className="h-8 w-8 text-primary" />
                      <h3 className="font-semibold text-lg">Начать тест</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Пройдите тест с множественным выбором.
                    </p>
                  </CardContent>
                </Card>
                <Card
                  className="border-2 hover:border-primary transition-colors cursor-pointer"
                  onClick={() => setTestMode("exam")}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-3">
                      <GraduationCap className="h-8 w-8 text-primary" />
                      <h3 className="font-semibold text-lg">Пробный экзамен</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Общайтесь с AI-экзаменатором.
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : testMode === "test" ? (
              <TestingInterface
                courseId={parseInt(courseId!)}
                studentId={user!.id}
                onClose={() => setTestMode("none")}
              />
            ) : (
              <ExaminerChat
                courseId={parseInt(courseId!)}
                courseTitle={course.title}
                studentId={user!.id}
                onClose={() => setTestMode("none")}
              />
            )}
          </TabsContent>

          <TabsContent value="chat">
            <AIAssistantChat
              courseId={parseInt(courseId!)}
              studentId={user!.id}
              courseTitle={course.title}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
