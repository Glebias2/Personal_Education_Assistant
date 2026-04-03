import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Check, X, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/EmptyState"
import { getCourseRequests, approveCourseRequest, rejectCourseRequest } from "@/lib/api/recommendations"
import { format } from "date-fns"

export default function CourseRequestsTeacher() {
  const { courseId } = useParams<{ courseId: string }>()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["course-requests", courseId],
    queryFn: () => getCourseRequests(Number(courseId)),
  })

  const requests = (data?.requests ?? []).filter((r: any) => r.status === "pending")

  const approveMutation = useMutation({
    mutationFn: (id: number) => approveCourseRequest(id),
    onSuccess: () => { toast.success("Заявка одобрена"); qc.invalidateQueries({ queryKey: ["course-requests", courseId] }) },
    onError: () => toast.error("Ошибка"),
  })

  const rejectMutation = useMutation({
    mutationFn: (id: number) => rejectCourseRequest(id),
    onSuccess: () => { toast.success("Заявка отклонена"); qc.invalidateQueries({ queryKey: ["course-requests", courseId] }) },
    onError: () => toast.error("Ошибка"),
  })

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-lg font-semibold mb-6">Заявки на запись ({requests.length})</h2>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-16 rounded-xl skeleton" />)}</div>
      ) : requests.length === 0 ? (
        <EmptyState icon={UserPlus} title="Нет заявок" description="Новые заявки появятся здесь" />
      ) : (
        <div className="space-y-2">
          {requests.map((r: any) => (
            <div key={r.id} className="flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-card">
              <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
                {r.first_name?.[0]}{r.last_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{r.first_name} {r.last_name}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(r.created_at), "dd.MM.yyyy HH:mm")}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="gap-1.5 border-success/30 text-success hover:bg-success/10" onClick={() => approveMutation.mutate(r.id)}>
                  <Check className="w-3.5 h-3.5" /> Принять
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => rejectMutation.mutate(r.id)}>
                  <X className="w-3.5 h-3.5" /> Отклонить
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
