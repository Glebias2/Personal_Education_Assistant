import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { coursesApi } from "@/api/courses";
import { recommendationsApi } from "@/api/recommendations";
import { labsApi } from "@/api/labs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/course/StarRating";
import { DIFFICULTY_MAP, COURSE_COLORS } from "@/utils/constants";
import {
  FlaskConical, ClipboardCheck, GraduationCap, MessageCircle,
  FileText, ArrowLeft, Download, Send, Lock,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function CoursePage() {
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id);
  const { id: studentId } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: course } = useQuery({
    queryKey: ["course-info", courseId],
    queryFn: () => coursesApi.getInfo(courseId),
  });
  const { data: labs } = useQuery({
    queryKey: ["course-labs", courseId],
    queryFn: () => labsApi.getAll(courseId),
  });
  const { data: files } = useQuery({
    queryKey: ["course-files", courseId],
    queryFn: () => coursesApi.getFiles(courseId),
  });
  const { data: myCourses } = useQuery({
    queryKey: ["student-courses-full", studentId],
    queryFn: () => coursesApi.getStudentCoursesFull(studentId!),
    enabled: !!studentId,
  });

  const enrolledCourse = myCourses?.find((c) => c.id === courseId);
  const isEnrolled = !!enrolledCourse;
  const isCompleted = enrolledCourse?.is_completed ?? false;
  const myRating = enrolledCourse?.my_rating ?? null;

  const enrollMutation = useMutation({
    mutationFn: () => coursesApi.sendRequest(courseId, studentId!),
    onSuccess: () => toast.success("Заявка отправлена"),
    onError: () => toast.error("Ошибка при отправке заявки"),
  });

  const handleRate = async (rating: number) => {
    if (!studentId) return;
    try {
      await recommendationsApi.rateCourse(courseId, { student_id: studentId, rating });
      toast.success(`Оценка ${rating}/5 сохранена`);
      queryClient.invalidateQueries({ queryKey: ["student-courses-full", studentId] });
    } catch {
      toast.error("Не удалось сохранить оценку");
    }
  };

  if (!course) return <div className="animate-pulse h-96 rounded-2xl bg-card border border-border" />;

  const colorClass = COURSE_COLORS[course.id % COURSE_COLORS.length];
  const diff = DIFFICULTY_MAP[course.difficulty] ?? DIFFICULTY_MAP.intermediate;

  return (
    <div className="space-y-6">
      <Link to="/student/catalog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Каталог
      </Link>

      <motion.div className={`rounded-2xl bg-gradient-to-br ${colorClass} p-8 relative overflow-hidden`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <span className="absolute -bottom-8 -right-4 text-[10rem] font-heading text-white/5 leading-none select-none">{course.title.charAt(0)}</span>
        <div className="relative z-10">
          <div className="flex gap-2 mb-3">
            <Badge className={diff.color}>{diff.label}</Badge>
            {course.tags?.map((t) => <Badge key={t} variant="secondary" className="bg-white/10 text-white border-0">{t}</Badge>)}
          </div>
          <h1 className="text-3xl font-heading text-white mb-2">{course.title}</h1>
          <p className="text-white/70 max-w-xl">{course.description}</p>
          {isCompleted && (
            <div className="mt-4 flex items-center gap-3">
              <StarRating value={myRating} onChange={handleRate} size="md" />
              <span className="text-white/60 text-sm">
                {myRating ? `Ваша оценка: ${myRating}/5` : "Оцените курс"}
              </span>
            </div>
          )}
          {!isEnrolled && (
            <Button className="mt-4 bg-white/20 hover:bg-white/30 text-white border-0" onClick={() => enrollMutation.mutate()} disabled={enrollMutation.isPending}>
              <Send className="w-4 h-4 mr-2" />{enrollMutation.isPending ? "Отправка..." : "Записаться на курс"}
            </Button>
          )}
        </div>
      </motion.div>

      {isEnrolled ? (
        <Tabs defaultValue="labs" className="space-y-4">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="labs" className="gap-2"><FlaskConical className="w-4 h-4" /> Лабораторные</TabsTrigger>
            <TabsTrigger value="test" className="gap-2"><ClipboardCheck className="w-4 h-4" /> Тесты</TabsTrigger>
            <TabsTrigger value="exam" className="gap-2"><GraduationCap className="w-4 h-4" /> Экзамен</TabsTrigger>
            <TabsTrigger value="chat" className="gap-2"><MessageCircle className="w-4 h-4" /> Чат</TabsTrigger>
            <TabsTrigger value="files" className="gap-2"><FileText className="w-4 h-4" /> Файлы</TabsTrigger>
          </TabsList>

          <TabsContent value="labs" className="space-y-3">
            {labs?.length === 0 && <p className="text-muted-foreground text-center py-12">Лабораторных пока нет</p>}
            {labs?.map((lab, i) => (
              <motion.div key={lab.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <Link to={`/student/courses/${courseId}/labs/${lab.id}`} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-heading text-lg shrink-0">{lab.number}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground group-hover:text-primary transition-colors">{lab.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">{lab.task}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </TabsContent>

          <TabsContent value="test">
            <div className="text-center py-12">
              <ClipboardCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-heading text-foreground mb-2">Тестирование</h3>
              <p className="text-muted-foreground mb-4">Пройдите тест по материалам курса</p>
              <Link to={`/student/courses/${courseId}/test`}><Button className="bg-primary hover:bg-primary/90">Начать тест</Button></Link>
            </div>
          </TabsContent>

          <TabsContent value="exam">
            <div className="text-center py-12">
              <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-heading text-foreground mb-2">Экзамен</h3>
              <p className="text-muted-foreground mb-4">AI-экзаменатор задаст вопросы и оценит ваши ответы</p>
              <Link to={`/student/courses/${courseId}/exam`}><Button className="bg-primary hover:bg-primary/90">Начать экзамен</Button></Link>
            </div>
          </TabsContent>

          <TabsContent value="chat">
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-heading text-foreground mb-2">AI-ассистент</h3>
              <p className="text-muted-foreground mb-4">Задайте вопросы по материалам курса</p>
              <Link to={`/student/courses/${courseId}/chat`}><Button className="bg-primary hover:bg-primary/90">Открыть чат</Button></Link>
            </div>
          </TabsContent>

          <TabsContent value="files" className="space-y-3">
            {files?.length === 0 && <p className="text-muted-foreground text-center py-12">Файлов нет</p>}
            {files?.map((file) => (
              <div key={file.id} className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
                <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                <span className="flex-1 text-sm text-foreground truncate">{file.filename}</span>
                <a href={coursesApi.downloadFile(courseId, file.file_id)} className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors">
                  <Download className="w-4 h-4" />
                </a>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      ) : (
        <div className="p-12 rounded-2xl bg-card border border-border text-center">
          <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-heading text-foreground mb-2">Запишитесь на курс</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Чтобы получить доступ к лабораторным, тестам, экзаменам и AI-ассистенту, отправьте заявку на запись. Преподаватель рассмотрит её в ближайшее время.
          </p>
        </div>
      )}
    </div>
  );
}
