import { useEffect, useState } from "react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getCourseAnalytics, type CourseAnalytics } from "@/lib/api"

interface Props {
  courseId: number
}

export default function CourseAnalyticsPanel({ courseId }: Props) {
  const [data, setData] = useState<CourseAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCourseAnalytics(courseId)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [courseId])

  if (loading) return <p className="text-center py-8 text-muted-foreground">Загрузка аналитики...</p>
  if (!data) return <p className="text-center py-8 text-muted-foreground">Нет данных для аналитики</p>

  const hasTests = data.test_averages.length > 0
  const hasExams = data.exam_averages.length > 0
  const hasReports = data.report_statuses.length > 0
  const hasTimeline = data.test_timeline.length > 0

  // Summary
  const avgTestAll = hasTests
    ? data.test_averages.reduce((s, r) => s + (r.avg_percentage ?? 0), 0) / data.test_averages.length
    : 0
  const avgExamAll = hasExams
    ? data.exam_averages.reduce((s, r) => s + (r.avg_score ?? 0), 0) / data.exam_averages.length
    : 0
  const totalReports = data.report_statuses.length

  // Bar chart data
  const testBarData = data.test_averages.map((r) => ({
    name: `${r.last_name} ${r.first_name[0]}.`,
    "Средний %": Number((r.avg_percentage ?? 0).toFixed(1)),
    "Кол-во тестов": r.test_count,
  }))

  const examBarData = data.exam_averages.map((r) => ({
    name: `${r.last_name} ${r.first_name[0]}.`,
    "Средний балл": Number((r.avg_score ?? 0).toFixed(1)),
    "Кол-во экзаменов": r.exam_count,
  }))

  // Timeline: group by student
  const studentColors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7c7c", "#8dd1e1", "#a4de6c"]
  const studentsInTimeline = [...new Set(data.test_timeline.map((r) => r.student_id))]
  const timelineData = data.test_timeline.reduce<Record<string, any>[]>((acc, r) => {
    const date = r.created_at.split(" ")[0]
    const key = `${r.last_name} ${r.first_name[0]}.`
    let entry = acc.find((e) => e.date === date && e._studentId === r.student_id)
    if (!entry) {
      entry = { date, _studentId: r.student_id, [key]: r.percentage }
      acc.push(entry)
    } else {
      entry[key] = r.percentage
    }
    return acc
  }, [])

  // Report matrix
  const labNames = [...new Set(data.report_statuses.map((r) => r.lab_title))]
  const studentReportMap = new Map<number, { name: string; statuses: Record<string, string> }>()
  for (const r of data.report_statuses) {
    if (!studentReportMap.has(r.student_id)) {
      studentReportMap.set(r.student_id, {
        name: `${r.last_name} ${r.first_name}`,
        statuses: {},
      })
    }
    studentReportMap.get(r.student_id)!.statuses[r.lab_title] = r.status
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500 text-white">Принято</Badge>
      case "pending":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">На проверке</Badge>
      case "not-approved":
        return <Badge variant="destructive">Не принято</Badge>
      default:
        return <Badge variant="secondary">-</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Средний % по тестам</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{hasTests ? `${avgTestAll.toFixed(1)}%` : "—"}</p>
            <p className="text-xs text-muted-foreground">{data.test_averages.length} студентов</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Средний балл экзаменов</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{hasExams ? `${avgExamAll.toFixed(1)}` : "—"}</p>
            <p className="text-xs text-muted-foreground">{data.exam_averages.length} студентов</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Всего отчётов</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalReports}</p>
            <p className="text-xs text-muted-foreground">
              {data.report_statuses.filter((r) => r.status === "approved").length} принято
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Test Bar Chart */}
      {hasTests && (
        <Card>
          <CardHeader>
            <CardTitle>Результаты тестов по студентам</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={testBarData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Средний %" fill="#8884d8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Exam Bar Chart */}
      {hasExams && (
        <Card>
          <CardHeader>
            <CardTitle>Результаты экзаменов по студентам</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={examBarData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Средний балл" fill="#82ca9d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Timeline Line Chart */}
      {hasTimeline && (
        <Card>
          <CardHeader>
            <CardTitle>Динамика результатов тестов</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                {studentsInTimeline.map((sid, i) => {
                  const student = data.test_timeline.find((r) => r.student_id === sid)
                  const key = student ? `${student.last_name} ${student.first_name[0]}.` : `Student ${sid}`
                  return (
                    <Line
                      key={sid}
                      type="monotone"
                      dataKey={key}
                      stroke={studentColors[i % studentColors.length]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  )
                })}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Report Status Matrix */}
      {hasReports && (
        <Card>
          <CardHeader>
            <CardTitle>Статусы лабораторных</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-medium">Студент</th>
                  {labNames.map((lab) => (
                    <th key={lab} className="text-center py-2 px-2 font-medium">{lab}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...studentReportMap.entries()].map(([sid, { name, statuses }]) => (
                  <tr key={sid} className="border-b last:border-0">
                    <td className="py-2 pr-4">{name}</td>
                    {labNames.map((lab) => (
                      <td key={lab} className="text-center py-2 px-2">
                        {statuses[lab] ? statusBadge(statuses[lab]) : <span className="text-muted-foreground">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {!hasTests && !hasExams && !hasReports && (
        <p className="text-center py-8 text-muted-foreground">Пока нет данных по этому курсу</p>
      )}
    </div>
  )
}
