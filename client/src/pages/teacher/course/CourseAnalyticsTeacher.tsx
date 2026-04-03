import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUp, Brain, FileText } from "lucide-react"
import { StatCard } from "@/components/shared/StatCard"
import { getCourseAnalytics } from "@/lib/api/results"
import { format } from "date-fns"

const CHART_COLORS = { primary: "hsl(239 84% 67%)", accent: "hsl(192 91% 43%)", success: "hsl(160 84% 39%)" }

export default function CourseAnalyticsTeacher() {
  const { courseId } = useParams<{ courseId: string }>()

  const { data, isLoading } = useQuery({
    queryKey: ["course-analytics", courseId],
    queryFn: () => getCourseAnalytics(Number(courseId)),
  })

  if (isLoading) return (
    <div className="p-8">
      <div className="grid grid-cols-3 gap-4 mb-8">{[1,2,3].map(i=><div key={i} className="h-24 rounded-xl skeleton" />)}</div>
      <div className="grid lg:grid-cols-2 gap-6">{[1,2].map(i=><div key={i} className="h-64 rounded-xl skeleton" />)}</div>
    </div>
  )

  const testData = (data?.test_averages ?? []).map(t => ({
    name: `${t.first_name} ${t.last_name[0]}.`,
    avg: t.avg_percentage != null ? Math.round(t.avg_percentage) : 0,
    count: t.test_count,
  }))

  const examData = (data?.exam_averages ?? []).map(e => ({
    name: `${e.first_name} ${e.last_name[0]}.`,
    avg: e.avg_score != null ? Number(e.avg_score.toFixed(1)) : 0,
  }))

  const timelineData = (data?.test_timeline ?? []).map(t => ({
    date: format(new Date(t.created_at), "dd.MM"),
    pct: t.percentage != null ? Math.round(t.percentage) : 0,
    name: t.first_name,
  }))

  const avgTestAll = testData.length > 0
    ? Math.round(testData.reduce((s, t) => s + t.avg, 0) / testData.length)
    : null

  const avgExamAll = examData.length > 0
    ? (examData.reduce((s, e) => s + e.avg, 0) / examData.length).toFixed(1)
    : null

  const pendingReports = (data?.report_statuses ?? []).filter(r => r.status === "pending").length

  const tooltipStyle = { backgroundColor: "hsl(231 28% 14%)", border: "1px solid hsl(228 28% 16%)", borderRadius: "8px", color: "hsl(210 40% 98%)" }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h2 className="text-lg font-semibold mb-6">Аналитика курса</h2>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard title="Ср. % тестов" value={avgTestAll != null ? `${avgTestAll}%` : "—"} icon={TrendingUp} iconColor="text-primary" iconBg="bg-primary/10 border-primary/20" />
        <StatCard title="Ср. балл экзаменов" value={avgExamAll ?? "—"} icon={Brain} iconColor="text-warning" iconBg="bg-warning/10 border-warning/20" subtitle="из 10" />
        <StatCard title="Отчётов на проверке" value={pendingReports} icon={FileText} iconColor="text-accent" iconBg="bg-accent/10 border-accent/20" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Test averages */}
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <h3 className="font-medium text-sm mb-4">Средний % тестов по студентам</h3>
          {testData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Нет данных</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={testData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(228 28% 16%)" />
                <XAxis dataKey="name" tick={{ fill: "hsl(215 16% 47%)", fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: "hsl(215 16% 47%)", fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="avg" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} name="% верных" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Exam averages */}
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <h3 className="font-medium text-sm mb-4">Средний балл экзаменов</h3>
          {examData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Нет данных</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={examData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(228 28% 16%)" />
                <XAxis dataKey="name" tick={{ fill: "hsl(215 16% 47%)", fontSize: 11 }} />
                <YAxis domain={[0, 10]} tick={{ fill: "hsl(215 16% 47%)", fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="avg" fill={CHART_COLORS.accent} radius={[4, 4, 0, 0]} name="Балл" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Timeline */}
      {timelineData.length > 0 && (
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <h3 className="font-medium text-sm mb-4">Активность тестирования</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(228 28% 16%)" />
              <XAxis dataKey="date" tick={{ fill: "hsl(215 16% 47%)", fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: "hsl(215 16% 47%)", fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="pct" stroke={CHART_COLORS.success} strokeWidth={2} dot={{ fill: CHART_COLORS.success, r: 3 }} name="%" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
