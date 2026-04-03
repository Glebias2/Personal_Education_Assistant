import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { BookOpen, FileText, Users, Plus, Loader2, ChevronRight, Clock } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { StatCard } from "@/components/shared/StatCard"
import { EmptyState } from "@/components/shared/EmptyState"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { useAuth } from "@/features/auth/AuthContext"
import { getTeacherCourses, createCourseAPI } from "@/lib/api/courses"
import { getPendingReports } from "@/lib/api/reports"

export default function TeacherDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: "", description: "", difficulty: "intermediate", exam_questions: "" })

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["teacher-courses", user!.id],
    queryFn: () => getTeacherCourses(user!.id),
  })

  const { data: pendingData } = useQuery({
    queryKey: ["pending-reports", user!.id],
    queryFn: () => getPendingReports(user!.id),
  })

  const pending = pendingData?.reports ?? []

  const createMutation = useMutation({
    mutationFn: () => createCourseAPI({
      title: form.title,
      teacher_id: String(user!.id),
      exam_questions: form.exam_questions,
      description: form.description,
      difficulty: form.difficulty,
    }),
    onSuccess: () => {
      toast.success("Курс создан!")
      qc.invalidateQueries({ queryKey: ["teacher-courses", user!.id] })
      setOpen(false)
      setForm({ title: "", description: "", difficulty: "intermediate", exam_questions: "" })
    },
    onError: () => toast.error("Ошибка при создании курса"),
  })

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Добро пожаловать, {user?.first_name}!</h1>
          <p className="text-muted-foreground mt-1">Управляйте своими курсами</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Создать курс</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Создать новый курс</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Название *</Label>
                <Input placeholder="Название курса" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Описание</Label>
                <Textarea rows={2} placeholder="Краткое описание..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
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
                <Label>Вопросы для экзамена <span className="text-muted-foreground">(каждый с новой строки)</span></Label>
                <Textarea rows={3} placeholder="Что такое ООП?&#10;Принципы SOLID..." value={form.exam_questions} onChange={e => setForm(f => ({ ...f, exam_questions: e.target.value }))} />
              </div>
              <Button
                className="w-full"
                disabled={!form.title || createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Создать"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        <StatCard title="Курсов" value={courses.length} icon={BookOpen} iconColor="text-primary" iconBg="bg-primary/10 border-primary/20" />
        <StatCard title="Ожидают проверки" value={pending.length} icon={FileText} iconColor="text-warning" iconBg="bg-warning/10 border-warning/20" />
        <StatCard title="Студентов" value="—" icon={Users} iconColor="text-accent" iconBg="bg-accent/10 border-accent/20" subtitle="По всем курсам" />
      </div>

      {/* Courses */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold mb-4">Мои курсы</h2>
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-40 rounded-xl skeleton" />)}
          </div>
        ) : courses.length === 0 ? (
          <EmptyState icon={BookOpen} title="Нет курсов" description="Создайте первый курс" action={
            <Button size="sm" onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-1.5" /> Создать курс</Button>
          } />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((c) => (
              <div
                key={c.id}
                className="group rounded-xl border border-border/50 bg-card p-5 hover:border-primary/30 transition-all cursor-pointer"
                onClick={() => navigate(`/teacher/course/${c.id}/overview`)}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
                  <BookOpen className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{c.title}</h3>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                  <span className="text-xs text-muted-foreground">Управление</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending reports */}
      {pending.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-warning" />
            <h2 className="text-lg font-semibold">Ожидают проверки</h2>
          </div>
          <div className="space-y-2">
            {pending.slice(0, 5).map((r: any) => (
              <div key={r.report_id} className="flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-card">
                <FileText className="w-4 h-4 text-warning shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.lab_title}</p>
                  <p className="text-xs text-muted-foreground">{r.course_title}</p>
                </div>
                <StatusBadge status="pending" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
