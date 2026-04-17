import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { labsApi } from "@/api/labs";
import { reportsApi } from "@/api/reports";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { REPORT_STATUS_MAP } from "@/utils/constants";
import { ArrowLeft, Send, FileText, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function LabPage() {
  const { id: courseId, labId } = useParams<{ id: string; labId: string }>();
  const { id: studentId } = useAuthStore();
  const [url, setUrl] = useState("");
  const queryClient = useQueryClient();

  const { data: labs } = useQuery({
    queryKey: ["course-labs", Number(courseId)],
    queryFn: () => labsApi.getAll(Number(courseId)),
  });

  const lab = labs?.find((l) => l.id === Number(labId));

  const { data: reports } = useQuery({
    queryKey: ["student-reports", studentId],
    queryFn: () => reportsApi.getStudentReports(studentId!),
    enabled: !!studentId,
  });

  const labReport = reports?.find(
    (r) => r.lab_id === Number(labId) && r.course_id === Number(courseId)
  );

  const submitMutation = useMutation({
    mutationFn: () =>
      reportsApi.submit({
        student_id: studentId!,
        lab_id: Number(labId),
        url,
      }),
    onSuccess: (data) => {
      if (data.status === "loaded") {
        toast.success("Отчёт загружен и отправлен на проверку");
      } else {
        toast.error(data.message ?? "Отчёт отклонён AI-верификацией");
      }
      queryClient.invalidateQueries({ queryKey: ["student-reports"] });
      setUrl("");
    },
    onError: () => toast.error("Ошибка отправки"),
  });

  if (!lab) {
    return <div className="animate-pulse h-64 rounded-2xl bg-card border border-border" />;
  }

  const reportStatus = labReport
    ? REPORT_STATUS_MAP[labReport.status ?? ""] ?? REPORT_STATUS_MAP.pending
    : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        to={`/student/courses/${courseId}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Назад к курсу
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Lab info */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-heading text-xl">
              {lab.number}
            </div>
            <div>
              <h1 className="text-2xl font-heading text-foreground">{lab.title}</h1>
              <p className="text-sm text-muted-foreground">Лабораторная №{lab.number}</p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Задание</h3>
            <p className="text-foreground whitespace-pre-wrap">{lab.task}</p>
          </div>
        </div>

        {/* Report status */}
        {labReport && reportStatus && (
          <div className="p-4 rounded-xl bg-card border border-border flex items-center gap-3">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-foreground">Ваш отчёт</p>
              <a
                href={labReport.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary hover:underline"
              >
                {labReport.url}
              </a>
            </div>
            <Badge className={reportStatus.color}>{reportStatus.label}</Badge>
          </div>
        )}

        {/* Submit form */}
        {(!labReport || labReport.status === "not-approved" || labReport.status === "rejected") && (
          <div className="p-6 rounded-2xl bg-card border border-border">
            <h2 className="text-lg font-heading text-foreground mb-4">Сдать отчёт</h2>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Ссылка на Google Doc</Label>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://docs.google.com/document/d/..."
                  className="bg-background border-border"
                />
              </div>
              <Button
                onClick={() => submitMutation.mutate()}
                disabled={!url || submitMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> AI проверяет...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" /> Отправить
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                Отчёт пройдёт AI-верификацию перед отправкой преподавателю
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
