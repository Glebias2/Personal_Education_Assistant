import { useState } from "react"
import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { FileText, Link, Loader2, ChevronDown, ChevronUp, Send } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmptyState } from "@/components/shared/EmptyState"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { useAuth } from "@/features/auth/AuthContext"
import { getCourseLabs } from "@/lib/api/labs"
import { addReport } from "@/lib/api/reports"
import { getStudentReportsByCourse } from "@/lib/api/results"
import { cn } from "@/lib/utils"

export default function CourseLabs() {
  const { courseId } = useParams<{ courseId: string }>()
  const { user } = useAuth()
  const qc = useQueryClient()
  const [expandedLab, setExpandedLab] = useState<number | null>(null)
  const [selectedLabId, setSelectedLabId] = useState<string>("")
  const [reportUrl, setReportUrl] = useState("")

  const { data: labs = [], isLoading } = useQuery({
    queryKey: ["labs", courseId],
    queryFn: () => getCourseLabs(Number(courseId)),
  })

  const { data: reportData } = useQuery({
    queryKey: ["reports", user!.id, courseId],
    queryFn: () => getStudentReportsByCourse(user!.id, Number(courseId)),
  })

  const reports = reportData?.reports ?? []
  const reportMap = new Map(reports.map((r) => [r.lab_title, r]))

  const submitMutation = useMutation({
    mutationFn: () => addReport(user!.id, Number(selectedLabId), reportUrl),
    onSuccess: (data) => {
      if (data.status === "loaded") {
        toast.success("Отчёт отправлен на проверку!")
      } else {
        toast.error("Отчёт отклонён AI: " + (data.message ?? ""))
      }
      setReportUrl("")
      setSelectedLabId("")
      qc.invalidateQueries({ queryKey: ["reports", user!.id, courseId] })
    },
    onError: () => toast.error("Ошибка при отправке отчёта"),
  })

  if (isLoading) return <div className="p-8"><div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-20 rounded-xl skeleton" />)}</div></div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-lg font-semibold mb-6">Лабораторные работы</h2>

      {labs.length === 0 ? (
        <EmptyState icon={FileText} title="Лабораторных нет" description="Преподаватель ещё не добавил лабораторные" />
      ) : (
        <div className="space-y-3 mb-10">
          {labs.map((lab) => {
            const isExpanded = expandedLab === lab.id
            const labReport = reportMap.get(lab.title)
            return (
              <div key={lab.id} className="rounded-xl border border-border/50 bg-card overflow-hidden">
                <button
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedLab(isExpanded ? null : lab.id)}
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">{lab.number}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground">{lab.title}</p>
                  </div>
                  {labReport && <StatusBadge status={labReport.status} />}
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                </button>
                {isExpanded && lab.task && (
                  <div className="px-4 pb-4 pt-0">
                    <div className="rounded-lg bg-muted/30 border border-border/50 p-3 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {lab.task}
                    </div>
                    {labReport?.comment && (
                      <p className="mt-2 text-xs text-muted-foreground">Комментарий: {labReport.comment}</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Submit report */}
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <h3 className="font-medium mb-4 flex items-center gap-2">
          <Send className="w-4 h-4 text-primary" />
          Сдать отчёт
        </h3>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Лабораторная</Label>
            <Select value={selectedLabId} onValueChange={setSelectedLabId}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите лабораторную" />
              </SelectTrigger>
              <SelectContent>
                {labs.map((lab) => (
                  <SelectItem key={lab.id} value={String(lab.id)}>
                    Лаб. {lab.number}: {lab.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Ссылка на отчёт</Label>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="https://docs.google.com/..."
                value={reportUrl}
                onChange={(e) => setReportUrl(e.target.value)}
                className="pl-9"
              />
            </div>
            <p className="text-xs text-muted-foreground">Ссылка на Google Docs или другой публичный документ</p>
          </div>
          <Button
            disabled={!selectedLabId || !reportUrl || submitMutation.isPending}
            onClick={() => submitMutation.mutate()}
          >
            {submitMutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Проверяется AI...</>
            ) : "Отправить на проверку"}
          </Button>
        </div>
      </div>
    </div>
  )
}
