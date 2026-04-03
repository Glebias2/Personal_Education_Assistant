import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { FlaskConical, Brain, FileText, TrendingUp } from "lucide-react"
import { StatCard } from "@/components/shared/StatCard"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { useAuth } from "@/features/auth/AuthContext"
import { getStudentTestResultsByCourse, getStudentExamResultsByCourse, getStudentReportsByCourse } from "@/lib/api/results"
import { format } from "date-fns"

export default function CourseOverview() {
  const { courseId } = useParams<{ courseId: string }>()
  const { user } = useAuth()

  const { data: testData } = useQuery({
    queryKey: ["test-results", user!.id, courseId],
    queryFn: () => getStudentTestResultsByCourse(user!.id, Number(courseId)),
  })
  const { data: examData } = useQuery({
    queryKey: ["exam-results", user!.id, courseId],
    queryFn: () => getStudentExamResultsByCourse(user!.id, Number(courseId)),
  })
  const { data: reportData } = useQuery({
    queryKey: ["reports", user!.id, courseId],
    queryFn: () => getStudentReportsByCourse(user!.id, Number(courseId)),
  })

  const tests = testData?.results ?? []
  const exams = examData?.results ?? []
  const reports = reportData?.reports ?? []

  const avgTest = tests.length > 0
    ? Math.round(tests.reduce((s, t) => s + t.percentage, 0) / tests.length)
    : null
  const avgExam = exams.length > 0
    ? (exams.filter(e => e.avg_score != null).reduce((s, e) => s + (e.avg_score ?? 0), 0) / exams.filter(e => e.avg_score != null).length).toFixed(1)
    : null

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h2 className="text-lg font-semibold mb-6">Обзор прогресса</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard title="Тестов" value={tests.length} icon={FlaskConical} iconColor="text-accent" iconBg="bg-accent/10 border-accent/20" />
        <StatCard title="Средний %" value={avgTest != null ? `${avgTest}%` : "—"} icon={TrendingUp} iconColor="text-success" iconBg="bg-success/10 border-success/20" />
        <StatCard title="Экзаменов" value={exams.length} icon={Brain} iconColor="text-warning" iconBg="bg-warning/10 border-warning/20" />
        <StatCard title="Отчётов" value={reports.length} icon={FileText} iconColor="text-primary" iconBg="bg-primary/10 border-primary/20" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent tests */}
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <h3 className="font-medium mb-4 text-sm">Последние тесты</h3>
          {tests.length === 0 ? (
            <p className="text-sm text-muted-foreground">Тестов ещё не было</p>
          ) : (
            <div className="space-y-3">
              {tests.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-foreground truncate">{t.topic ?? "Тест"}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.correct_answers}/{t.total_questions} верных · {format(new Date(t.created_at), "dd.MM.yyyy")}
                    </p>
                  </div>
                  <span className={`text-sm font-semibold ${t.percentage >= 70 ? "text-success" : t.percentage >= 50 ? "text-warning" : "text-destructive"}`}>
                    {Math.round(t.percentage)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reports */}
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <h3 className="font-medium mb-4 text-sm">Статусы отчётов</h3>
          {reports.length === 0 ? (
            <p className="text-sm text-muted-foreground">Отчётов ещё не было</p>
          ) : (
            <div className="space-y-3">
              {reports.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3">
                  <p className="text-sm text-foreground truncate">{r.lab_title}</p>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
