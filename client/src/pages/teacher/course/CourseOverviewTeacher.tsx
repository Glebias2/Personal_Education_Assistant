import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Save, Loader2, Settings } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getCourseById, updateCourse } from "@/lib/api/courses"

export default function CourseOverviewTeacher() {
  const { courseId } = useParams<{ courseId: string }>()
  const qc = useQueryClient()
  const [form, setForm] = useState({ title: "", description: "", difficulty: "intermediate", exam_questions: "" })

  const { data: courseArr } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => getCourseById(Number(courseId)),
  })
  const course = Array.isArray(courseArr) ? courseArr[0] : courseArr

  useEffect(() => {
    if (course) {
      setForm({
        title: course.title ?? "",
        description: course.description ?? "",
        difficulty: course.difficulty ?? "intermediate",
        exam_questions: course.exam_questions ?? "",
      })
    }
  }, [course])

  const updateMutation = useMutation({
    mutationFn: () => updateCourse(Number(courseId), form),
    onSuccess: () => {
      toast.success("Сохранено")
      qc.invalidateQueries({ queryKey: ["course", courseId] })
    },
    onError: () => toast.error("Ошибка сохранения"),
  })

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Settings className="w-5 h-5 text-primary" />
        </div>
        <h2 className="font-semibold text-lg">Настройки курса</h2>
      </div>

      <div className="rounded-xl border border-border/50 bg-card p-6 space-y-5">
        <div className="space-y-1.5">
          <Label>Название</Label>
          <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Описание</Label>
          <Textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Сложность</Label>
          <Select value={form.difficulty} onValueChange={v => setForm(f => ({ ...f, difficulty: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Лёгкий</SelectItem>
              <SelectItem value="intermediate">Средний</SelectItem>
              <SelectItem value="hard">Сложный</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Вопросы для экзамена</Label>
          <Textarea rows={4} placeholder="Каждый вопрос с новой строки..." value={form.exam_questions} onChange={e => setForm(f => ({ ...f, exam_questions: e.target.value }))} />
        </div>
        <Button className="gap-2" disabled={updateMutation.isPending} onClick={() => updateMutation.mutate()}>
          {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Сохранить
        </Button>
      </div>
    </div>
  )
}
