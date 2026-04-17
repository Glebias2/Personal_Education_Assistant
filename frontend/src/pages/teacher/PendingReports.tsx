import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { reportsApi } from "@/api/reports";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Check, X, ExternalLink, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function PendingReports() {
  const { id } = useAuthStore();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [rejectId, setRejectId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["pending-reports", id],
    queryFn: () => reportsApi.getPending(id!),
    enabled: !!id,
  });

  const approveMutation = useMutation({
    mutationFn: (reportId: number) => reportsApi.updateStatus(reportId, { status: "approved" }),
    onSuccess: () => {
      toast.success("Отчёт одобрен");
      queryClient.invalidateQueries({ queryKey: ["pending-reports"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => reportsApi.updateStatus(rejectId!, { status: "not-approved", comment }),
    onSuccess: () => {
      toast.success("Отчёт отклонён");
      queryClient.invalidateQueries({ queryKey: ["pending-reports"] });
      setRejectId(null);
      setComment("");
    },
  });

  const reports = data?.reports ?? [];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-heading text-foreground">Отчёты на проверку</h1>
        <p className="text-muted-foreground mt-1">{reports.length} ожидают решения</p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl bg-card border border-border animate-pulse" />)}
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Все отчёты проверены</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r, i) => (
            <motion.div key={r.report_id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className="flex items-center gap-4 p-5 rounded-xl bg-card border border-border">
              <FileText className="w-6 h-6 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{r.course_title} — {r.lab_title}</p>
                <p className="text-sm text-muted-foreground">Студент ID: {r.student_id}</p>
                <a href={r.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                  <ExternalLink className="w-3 h-3" /> Открыть отчёт
                </a>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" onClick={() => approveMutation.mutate(r.report_id)} disabled={approveMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 gap-1">
                  <Check className="w-4 h-4" /> Одобрить
                </Button>
                <Button size="sm" variant="outline" onClick={() => setRejectId(r.report_id)}
                  className="border-destructive/30 text-destructive hover:bg-destructive/10 gap-1">
                  <X className="w-4 h-4" /> Отклонить
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Reject dialog */}
      <Dialog open={rejectId !== null} onOpenChange={() => setRejectId(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-heading">Отклонить отчёт</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Комментарий (необязательно)..." rows={3} className="bg-background border-border" />
            <Button onClick={() => rejectMutation.mutate()} disabled={rejectMutation.isPending} className="w-full bg-destructive hover:bg-destructive/90">
              {rejectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Отклонить"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
