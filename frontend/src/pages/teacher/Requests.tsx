import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { coursesApi } from "@/api/courses";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, X, UserCheck } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Requests() {
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id);
  const queryClient = useQueryClient();

  const { data: requests } = useQuery({
    queryKey: ["course-requests", courseId],
    queryFn: () => coursesApi.getRequests(courseId),
  });

  const approveMutation = useMutation({
    mutationFn: (requestId: number) => coursesApi.approveRequest(requestId),
    onSuccess: () => {
      toast.success("Заявка одобрена");
      queryClient.invalidateQueries({ queryKey: ["course-requests", courseId] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (requestId: number) => coursesApi.rejectRequest(requestId),
    onSuccess: () => {
      toast.success("Заявка отклонена");
      queryClient.invalidateQueries({ queryKey: ["course-requests", courseId] });
    },
  });

  const pendingRequests = requests?.filter((r) => r.status !== "approved" && r.status !== "rejected") ?? [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to={`/teacher/courses/${courseId}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Назад к курсу
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-heading text-foreground">Заявки на курс</h1>
        <p className="text-muted-foreground mt-1">{pendingRequests.length} ожидают решения</p>
      </motion.div>

      {pendingRequests.length === 0 ? (
        <div className="text-center py-20">
          <UserCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Нет заявок</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingRequests.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className="flex items-center gap-4 p-5 rounded-xl bg-card border border-border">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-heading">
                {r.first_name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{r.first_name} {r.last_name}</p>
                <p className="text-xs text-muted-foreground">ID: {r.student_id}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => approveMutation.mutate(r.id)} disabled={approveMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 gap-1">
                  <Check className="w-4 h-4" /> Одобрить
                </Button>
                <Button size="sm" variant="outline" onClick={() => rejectMutation.mutate(r.id)} disabled={rejectMutation.isPending}
                  className="border-destructive/30 text-destructive hover:bg-destructive/10 gap-1">
                  <X className="w-4 h-4" /> Отклонить
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
