import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Search, BookOpen, Loader2, Sparkles, Check } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmptyState } from "@/components/shared/EmptyState"
import { useAuth } from "@/features/auth/AuthContext"
import { getRecommendedCourses, createCourseRequest } from "@/lib/api/recommendations"
import { getStudentCoursesById } from "@/lib/api/courses"
import { cn } from "@/lib/utils"

const difficultyLabel: Record<string, string> = {
  easy: "Лёгкий",
  intermediate: "Средний",
  hard: "Сложный",
}
const difficultyColor: Record<string, string> = {
  easy: "text-success border-success/30 bg-success/10",
  intermediate: "text-warning border-warning/30 bg-warning/10",
  hard: "text-destructive border-destructive/30 bg-destructive/10",
}

export default function StudentCatalog() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState("recommended")

  const { data: recs, isLoading: loadingRecs } = useQuery({
    queryKey: ["recommended-courses", user!.id],
    queryFn: () => getRecommendedCourses(user!.id),
  })

  const { data: enrolled = [] } = useQuery({
    queryKey: ["student-courses", user!.id],
    queryFn: () => getStudentCoursesById(user!.id),
  })

  const enrolledIds = new Set(enrolled.map((c) => c.id))

  const applyMutation = useMutation({
    mutationFn: ({ courseId }: { courseId: number }) => createCourseRequest(courseId, user!.id),
    onSuccess: () => {
      toast.success("Заявка отправлена!")
      qc.invalidateQueries({ queryKey: ["student-courses", user!.id] })
    },
    onError: () => toast.error("Не удалось отправить заявку"),
  })

  const allCourses = tab === "recommended"
    ? (recs?.recommended ?? [])
    : (recs?.other ?? [])

  const filtered = allCourses.filter((c: any) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Каталог курсов</h1>
        <p className="text-muted-foreground text-sm">Запишитесь на интересующие вас курсы</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск курсов..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="recommended" className="gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Рекомендуемые
            </TabsTrigger>
            <TabsTrigger value="all">Все курсы</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Grid */}
      {loadingRecs ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-52 rounded-xl skeleton" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={BookOpen} title="Курсов не найдено" description="Попробуйте изменить поисковый запрос" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c: any) => {
            const isEnrolled = enrolledIds.has(c.id)
            const diff = c.difficulty ? (difficultyColor[c.difficulty] ?? difficultyColor.intermediate) : null
            return (
              <div key={c.id} className="rounded-xl border border-border/50 bg-card p-5 flex flex-col hover:border-primary/30 transition-all">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-primary" />
                  </div>
                  {diff && (
                    <span className={cn("text-xs px-2 py-0.5 rounded-md border font-medium", diff)}>
                      {difficultyLabel[c.difficulty] ?? c.difficulty}
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-sm leading-snug mb-1.5">{c.title}</h3>
                {c.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3 flex-1">{c.description}</p>
                )}

                {c.tags && c.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {c.tags.slice(0, 3).map((t: string) => (
                      <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{t}</span>
                    ))}
                  </div>
                )}

                <div className="mt-auto pt-3 border-t border-border/50">
                  {isEnrolled ? (
                    <Button size="sm" variant="outline" className="w-full gap-1.5" disabled>
                      <Check className="w-3.5 h-3.5 text-success" /> Вы записаны
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full"
                      disabled={applyMutation.isPending}
                      onClick={() => applyMutation.mutate({ courseId: c.id })}
                    >
                      {applyMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Подать заявку"}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
