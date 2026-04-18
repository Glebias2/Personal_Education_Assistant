import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { coursesApi } from "@/api/courses";
import { ArrowLeft, Upload, Trash2, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function CourseFiles() {
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id);
  const queryClient = useQueryClient();

  const { data: files, refetch } = useQuery({
    queryKey: ["course-files", courseId],
    queryFn: () => coursesApi.getFiles(courseId),
  });

  const uploadMutation = useMutation({
    mutationFn: (fileList: File[]) => coursesApi.uploadFiles(courseId, fileList),
    onSuccess: () => {
      toast.success("Файлы загружены");
      refetch();
    },
    onError: () => toast.error("Ошибка загрузки"),
  });

  const deleteMutation = useMutation({
    mutationFn: (fileRecordId: number) => coursesApi.deleteFile(courseId, fileRecordId),
    onSuccess: () => {
      toast.success("Файл удалён");
      queryClient.invalidateQueries({ queryKey: ["course-files", courseId] });
    },
    onError: () => toast.error("Ошибка удаления"),
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList && fileList.length > 0) {
      uploadMutation.mutate(Array.from(fileList));
      e.target.value = "";
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        to={`/teacher/courses/${courseId}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> К курсу
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-heading text-foreground">Материалы курса</h1>
        <p className="text-sm text-muted-foreground mt-1">PDF, DOCX, TXT — загружаются в Weaviate для AI-чата</p>
      </motion.div>

      <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
        <label className={cn("cursor-pointer inline-block", uploadMutation.isPending && "pointer-events-none opacity-60")}>
          <span className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
            {uploadMutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Загрузка...</>
            ) : (
              <><Upload className="w-4 h-4" /> Загрузить файлы</>
            )}
          </span>
          <input
            type="file"
            multiple
            accept=".pdf,.docx,.txt"
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploadMutation.isPending}
          />
        </label>

        {!files || files.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">Файлов пока нет</p>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <div key={file.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border">
                <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{file.filename}</p>
                  <p className="text-xs text-muted-foreground">{new Date(file.created_at).toLocaleDateString("ru-RU")}</p>
                </div>
                <button
                  onClick={() => deleteMutation.mutate(file.id)}
                  disabled={deleteMutation.isPending}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
