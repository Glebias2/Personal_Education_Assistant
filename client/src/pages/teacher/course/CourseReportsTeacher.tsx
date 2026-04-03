import { useState } from "react"
import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Check, X, ExternalLink, FileText } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { EmptyState } from "@/components/shared/EmptyState"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { getPendingReports, updateReport } from "@/lib/api/reports"
import { useAuth } from "@/features/auth/AuthContext"

export default function CourseReportsTeacher() {
  const { courseId } = useParams<{ courseId: string }>()
  const { user } = useAuth()
  const qc = useQueryClient()
  const [comments, setComments] = useState<Record<number, string>>({})

  const { data, isLoading } = useQuery({
    queryKey: ["pending-reports", user!.id],
    queryFn: () => getPendingReports(user!.id),
  })

  const courseReports = (data?.reports ?? []).filter((r: any) => String(r.course_id) === courseId || !r.course_id)

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "approved" | "rejected" }) =>
      updateReport(id, { status, comment: comments[id] }),
    onSuccess: () => {
      toast.success("Статус обновлён")
      qc.invalidateQueries({ queryKey: ["pending-reports", user!.id] })
    },
    onError: () => toast.error("Ошибка"),
  })

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-lg font-semibold mb-6">Отчёты студентов</h2>

      {isLoading ? (
        <div className="space-y-3">{[1,2].map(i=><div key={i} className="h-32 rounded-xl skeleton" />)}</div>
      ) : courseReports.length === 0 ? (
        <EmptyState icon={FileText} title="Нет отчётов" description="Ожидающие проверки отчёты появятся здесь" />
      ) : (
        <div className="space-y-4">
          {courseReports.map((r: any) => (
            <div key={r.report_id} className="rounded-xl border border-border/50 bg-card p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-medium text-sm">{r.lab_title}</p>
                  <p className="text-xs text-muted-foreground">{r.course_title}</p>
                </div>
                <StatusBadge status="pending" />
              </div>

              {r.url && (
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mb-3"
                >
                  <ExternalLink className="w-3 h-3" /> Открыть отчёт
                </a>
              )}

              <Textarea
                placeholder="Комментарий (необязательно)..."
                rows={2}
                className="mb-3 text-sm"
                value={comments[r.report_id] ?? ""}
                onChange={e => setComments(prev => ({ ...prev, [r.report_id]: e.target.value }))}
              />

              <div className="flex gap-2">
                <Button size="sm" className="gap-1.5 bg-success hover:bg-success/90" onClick={() => updateMutation.mutate({ id: r.report_id, status: "approved" })}>
                  <Check className="w-3.5 h-3.5" /> Принять
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => updateMutation.mutate({ id: r.report_id, status: "rejected" })}>
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
