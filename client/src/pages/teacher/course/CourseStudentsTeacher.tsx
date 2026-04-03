import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Users } from "lucide-react"
import { EmptyState } from "@/components/shared/EmptyState"
import { getCourseStudents } from "@/lib/api/courses"
import { getCourseAnalytics } from "@/lib/api/results"

export default function CourseStudentsTeacher() {
  const { courseId } = useParams<{ courseId: string }>()

  const { data: studentsData } = useQuery({
    queryKey: ["course-students", courseId],
    queryFn: () => getCourseStudents(Number(courseId)),
  })

  const { data: analytics } = useQuery({
    queryKey: ["course-analytics", courseId],
    queryFn: () => getCourseAnalytics(Number(courseId)),
  })

  const students = studentsData?.students ?? []
  const testMap = new Map((analytics?.test_averages ?? []).map(t => [t.student_id, t]))
  const examMap = new Map((analytics?.exam_averages ?? []).map(e => [e.student_id, e]))

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h2 className="text-lg font-semibold mb-6">Студенты ({students.length})</h2>

      {students.length === 0 ? (
        <EmptyState icon={Users} title="Нет студентов" description="Одобрите заявки для добавления студентов" />
      ) : (
        <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Студент</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Тестов</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Ср. %</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Экзаменов</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Ср. балл</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const t = testMap.get(s.id)
                const e = examMap.get(s.id)
                return (
                  <tr key={s.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{s.first_name} {s.last_name}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{t?.test_count ?? 0}</td>
                    <td className="px-4 py-3 text-center">
                      {t?.avg_percentage != null ? (
                        <span className={`font-semibold ${t.avg_percentage >= 70 ? "text-success" : t.avg_percentage >= 50 ? "text-warning" : "text-destructive"}`}>
                          {Math.round(t.avg_percentage)}%
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{e?.exam_count ?? 0}</td>
                    <td className="px-4 py-3 text-center">
                      {e?.avg_score != null ? (
                        <span className="font-semibold text-primary">{Number(e.avg_score).toFixed(1)}</span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
