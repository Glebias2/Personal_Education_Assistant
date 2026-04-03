import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { FileText, Download, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/EmptyState"
import { getCourseFiles } from "@/lib/api/files"
import { format } from "date-fns"

const extIcon: Record<string, string> = {
  pdf: "📄",
  docx: "📝",
  doc: "📝",
  txt: "📃",
  pptx: "📊",
  xlsx: "📊",
}

function getExt(filename: string) {
  return filename.split(".").pop()?.toLowerCase() ?? ""
}

export default function CourseMaterials() {
  const { courseId } = useParams<{ courseId: string }>()

  const { data, isLoading } = useQuery({
    queryKey: ["course-files", courseId],
    queryFn: () => getCourseFiles(Number(courseId)),
  })

  const files = data?.files ?? []

  if (isLoading) return (
    <div className="p-8">
      <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-16 rounded-xl skeleton" />)}</div>
    </div>
  )

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-lg font-semibold mb-6">Материалы курса</h2>

      {files.length === 0 ? (
        <EmptyState icon={BookOpen} title="Материалов нет" description="Преподаватель ещё не загрузил файлы" />
      ) : (
        <div className="space-y-2">
          {files.map((f) => {
            const ext = getExt(f.filename)
            return (
              <div key={f.id} className="flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-card hover:border-primary/20 transition-all">
                <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center text-xl shrink-0">
                  {extIcon[ext] ?? "📄"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{f.filename}</p>
                  <p className="text-xs text-muted-foreground">
                    {ext.toUpperCase()} · {format(new Date(f.created_at), "dd.MM.yyyy")}
                  </p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <a href={`/api/v1/courses/${courseId}/files/${f.file_id}/download`} download={f.filename}>
                    <Download className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
