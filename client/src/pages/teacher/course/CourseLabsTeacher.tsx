import { useState } from "react"
import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Trash2, PenLine, Save, X, Loader2, FileText } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { EmptyState } from "@/components/shared/EmptyState"
import { getCourseLabs, createLab, updateLab, deleteLab } from "@/lib/api/labs"

interface Lab { id: number; number: number; title: string; task?: string }

export default function CourseLabsTeacher() {
  const { courseId } = useParams<{ courseId: string }>()
  const qc = useQueryClient()
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ number: 1, title: "", task: "" })
  const [showCreate, setShowCreate] = useState(false)
  const [newForm, setNewForm] = useState({ number: 1, title: "", task: "" })

  const { data: labs = [], isLoading } = useQuery({
    queryKey: ["labs", courseId],
    queryFn: () => getCourseLabs(Number(courseId)),
  })

  const createMutation = useMutation({
    mutationFn: () => createLab({ ...newForm, course_id: Number(courseId) }),
    onSuccess: () => {
      toast.success("Лабораторная добавлена")
      qc.invalidateQueries({ queryKey: ["labs", courseId] })
      setShowCreate(false)
      setNewForm({ number: (labs.length ?? 0) + 2, title: "", task: "" })
    },
    onError: () => toast.error("Ошибка"),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id }: { id: number }) => updateLab(id, editForm),
    onSuccess: () => {
      toast.success("Сохранено")
      qc.invalidateQueries({ queryKey: ["labs", courseId] })
      setEditingId(null)
    },
    onError: () => toast.error("Ошибка"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteLab(id),
    onSuccess: () => {
      toast.success("Удалено")
      qc.invalidateQueries({ queryKey: ["labs", courseId] })
    },
    onError: () => toast.error("Ошибка"),
  })

  const startEdit = (lab: Lab) => {
    setEditingId(lab.id)
    setEditForm({ number: lab.number, title: lab.title, task: lab.task ?? "" })
  }

  if (isLoading) return <div className="p-8"><div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-20 rounded-xl skeleton" />)}</div></div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Лабораторные работы</h2>
        <Button size="sm" className="gap-1.5" onClick={() => { setShowCreate(true); setNewForm({ number: (labs.length ?? 0) + 1, title: "", task: "" }) }}>
          <Plus className="w-3.5 h-3.5" /> Добавить
        </Button>
      </div>

      {showCreate && (
        <div className="rounded-xl border border-primary/30 bg-card p-5 mb-4">
          <div className="grid grid-cols-[80px_1fr] gap-3 mb-3">
            <div className="space-y-1.5">
              <Label>№</Label>
              <Input type="number" value={newForm.number} onChange={e => setNewForm(f => ({ ...f, number: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Название</Label>
              <Input placeholder="Название лабораторной" value={newForm.title} onChange={e => setNewForm(f => ({ ...f, title: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5 mb-3">
            <Label>Задание</Label>
            <Textarea rows={3} placeholder="Описание задания..." value={newForm.task} onChange={e => setNewForm(f => ({ ...f, task: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" disabled={!newForm.title || createMutation.isPending} onClick={() => createMutation.mutate()}>
              {createMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Сохранить
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowCreate(false)}><X className="w-3.5 h-3.5" /></Button>
          </div>
        </div>
      )}

      {labs.length === 0 && !showCreate ? (
        <EmptyState icon={FileText} title="Нет лабораторных" action={<Button size="sm" onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-1.5" /> Добавить</Button>} />
      ) : (
        <div className="space-y-3">
          {labs.map((lab) => (
            <div key={lab.id} className="rounded-xl border border-border/50 bg-card overflow-hidden">
              {editingId === lab.id ? (
                <div className="p-5">
                  <div className="grid grid-cols-[80px_1fr] gap-3 mb-3">
                    <div className="space-y-1.5">
                      <Label>№</Label>
                      <Input type="number" value={editForm.number} onChange={e => setEditForm(f => ({ ...f, number: Number(e.target.value) }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Название</Label>
                      <Input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-1.5 mb-3">
                    <Label>Задание</Label>
                    <Textarea rows={3} value={editForm.task} onChange={e => setEditForm(f => ({ ...f, task: e.target.value }))} />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" disabled={updateMutation.isPending} onClick={() => updateMutation.mutate({ id: lab.id })}>
                      {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Сохранить
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">{lab.number}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{lab.title}</p>
                    {lab.task && <p className="text-xs text-muted-foreground truncate">{lab.task}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(lab)}><PenLine className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(lab.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
