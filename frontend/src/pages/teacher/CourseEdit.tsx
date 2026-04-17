import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { coursesApi } from "@/api/courses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TAGS } from "@/utils/constants";
import { ArrowLeft, Upload, Trash2, FileText, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function CourseEdit() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const courseId = isNew ? null : Number(id);
  const { id: teacherId } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [tags, setTags] = useState<string[]>([]);
  const [examQuestions, setExamQuestions] = useState("");

  const { data: course } = useQuery({
    queryKey: ["course-info", courseId],
    queryFn: () => coursesApi.getInfo(courseId!),
    enabled: !!courseId,
  });

  const { data: files, refetch: refetchFiles } = useQuery({
    queryKey: ["course-files", courseId],
    queryFn: () => coursesApi.getFiles(courseId!),
    enabled: !!courseId,
  });

  // Load existing course data
  useState(() => {
    if (course) {
      setTitle(course.title);
      setDescription(course.description);
      setDifficulty(course.difficulty);
      setTags(course.tags ?? []);
      setExamQuestions(course.exam_questions ?? "");
    }
  });

  const createMutation = useMutation({
    mutationFn: () =>
      coursesApi.create({ title, teacher_id: teacherId!, description, difficulty, tags, exam_questions: examQuestions }),
    onSuccess: () => {
      toast.success("Курс создан");
      queryClient.invalidateQueries({ queryKey: ["teacher-courses"] });
      navigate("/teacher/courses");
    },
    onError: () => toast.error("Ошибка создания"),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      coursesApi.update(courseId!, { title, description, difficulty, tags, exam_questions: examQuestions }),
    onSuccess: () => {
      toast.success("Курс обновлён");
      queryClient.invalidateQueries({ queryKey: ["course-info", courseId] });
    },
    onError: () => toast.error("Ошибка обновления"),
  });

  const uploadMutation = useMutation({
    mutationFn: (fileList: File[]) => coursesApi.uploadFiles(courseId!, fileList),
    onSuccess: () => {
      toast.success("Файлы загружены");
      refetchFiles();
    },
    onError: () => toast.error("Ошибка загрузки"),
  });

  const deleteMutation = useMutation({
    mutationFn: (fileId: string) => coursesApi.deleteFile(courseId!, fileId),
    onSuccess: () => {
      toast.success("Файл удалён");
      refetchFiles();
    },
  });

  const toggleTag = (tag: string) =>
    setTags((p) => (p.includes(tag) ? p.filter((t) => t !== tag) : [...p, tag]));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList) uploadMutation.mutate(Array.from(fileList));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/teacher/courses" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Мои курсы
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-heading text-foreground">
          {isNew ? "Создать курс" : "Редактировать курс"}
        </h1>
      </motion.div>

      {/* Form */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-5">
        <div className="space-y-2">
          <Label>Название</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Алгоритмы и структуры данных" className="bg-background border-border" />
        </div>

        <div className="space-y-2">
          <Label>Описание</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Описание курса..." rows={4} className="bg-background border-border" />
        </div>

        <div className="space-y-2">
          <Label>Сложность</Label>
          <Select value={difficulty} onValueChange={(v) => { if (v) setDifficulty(v); }}>
            <SelectTrigger className="bg-background border-border w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Начальный</SelectItem>
              <SelectItem value="intermediate">Средний</SelectItem>
              <SelectItem value="advanced">Продвинутый</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Теги</Label>
          <div className="flex flex-wrap gap-2">
            {TAGS.map((tag) => (
              <Badge key={tag} variant="outline" className={cn("cursor-pointer transition-all", tags.includes(tag) ? "bg-primary/20 text-primary border-primary/40" : "border-border text-muted-foreground hover:border-primary/30")} onClick={() => toggleTag(tag)}>
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Вопросы для экзамена</Label>
          <Textarea value={examQuestions} onChange={(e) => setExamQuestions(e.target.value)} placeholder="Каждый вопрос с новой строки..." rows={4} className="bg-background border-border" />
          <p className="text-xs text-muted-foreground">Эти вопросы будут использоваться AI-экзаменатором при проведении экзамена</p>
        </div>

        <Button
          onClick={() => (isNew ? createMutation.mutate() : updateMutation.mutate())}
          disabled={!title || createMutation.isPending || updateMutation.isPending}
          className="bg-primary hover:bg-primary/90"
        >
          {(createMutation.isPending || updateMutation.isPending) ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Сохранение...</>
          ) : (
            isNew ? "Создать курс" : "Сохранить изменения"
          )}
        </Button>
      </div>

      {/* Files section (only for existing courses) */}
      {!isNew && (
        <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
          <h2 className="text-xl font-heading text-foreground">Материалы курса</h2>
          <p className="text-sm text-muted-foreground">PDF, DOCX, TXT — загружаются в Weaviate для AI</p>

          <label className="cursor-pointer inline-block">
            <span className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted transition-colors">
              <Upload className="w-4 h-4" /> Загрузить файлы
            </span>
            <input type="file" multiple accept=".pdf,.docx,.txt" className="hidden" onChange={handleFileUpload} />
          </label>

          {files?.map((file) => (
            <div key={file.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border">
              <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
              <span className="flex-1 text-sm text-foreground truncate">{file.filename}</span>
              <button onClick={() => deleteMutation.mutate(file.file_id)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
