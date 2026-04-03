import { useRef } from "react"
import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Upload, Trash2, FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/EmptyState"
import { getCourseFiles, uploadCourseFiles, deleteCourseFile } from "@/lib/api/files"
import { format } from "date-fns"

export default function CourseFilesTeacher() {
  const { courseId } = useParams<{ courseId: string }>()
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["course-files", courseId],
    queryFn: () => getCourseFiles(Number(courseId)),
  })
  const files = data?.files ?? []

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) => uploadCourseFiles(Number(courseId), files),
    onSuccess: (data) => {
      toast.success(`Загружено ${data.indexed.length} файл(ов)`)
      qc.invalidateQueries({ queryKey: ["course-files", courseId] })
    },
    onError: () => toast.error("Ошибка загрузки"),
  })

  const deleteMutation = useMutation({
    mutationFn: (fileId: number) => deleteCourseFile(Number(courseId), fileId),
    onSuccess: () => {
      toast.success("Файл удалён")
      qc.invalidateQueries({ queryKey: ["course-files", courseId] })
    },
    onError: () => toast.error("Ошибка удаления"),
  })

  const extIcon: Record<string, string> = { pdf: "📄", docx: "📝", doc: "📝", txt: "📃" }
  const getExt = (name: string) => name.split(".").pop()?.toLowerCase() ?? ""

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Материалы курса</h2>
        <Button
          size="sm"
          className="gap-1.5"
          disabled={uploadMutation.isPending}
          onClick={() => fileRef.current?.click()}
        >
          {uploadMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          Загрузить файлы
        </Button>
        <input
          type="file"
          ref={fileRef}
          multiple
          accept=".pdf,.docx,.doc,.txt"
          className="hidden"
          onChange={(e) => { if (e.target.files?.length) uploadMutation.mutate(Array.from(e.target.files)) }}
        />
      </div>

      {/* Drop zone */}
      <div
        className="border-2 border-dashed border-border rounded-xl p-8 text-center mb-6 hover:border-primary/40 transition-colors cursor-pointer"
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Нажмите или перетащите файлы (PDF, DOCX, TXT)</p>
        <p className="text-xs text-muted-foreground mt-1">Файлы будут проиндексированы в векторную БД для AI-чата</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-16 rounded-xl skeleton" />)}</div>
      ) : files.length === 0 ? (
        <EmptyState icon={FileText} title="Нет файлов" description="Загрузите материалы для курса" />
      ) : (
        <div className="space-y-2">
          {files.map((f) => {
            const ext = getExt(f.filename)
            return (
              <div key={f.id} className="flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-card">
                <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center text-xl shrink-0">
                  {extIcon[ext] ?? "📄"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{f.filename}</p>
                  <p className="text-xs text-muted-foreground">{ext.toUpperCase()} · {format(new Date(f.created_at), "dd.MM.yyyy")}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => deleteMutation.mutate(f.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
