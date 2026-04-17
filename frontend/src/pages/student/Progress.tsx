import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { testsApi } from "@/api/tests";
import { examApi } from "@/api/exam";
import { reportsApi } from "@/api/reports";
import { Badge } from "@/components/ui/badge";
import { REPORT_STATUS_MAP } from "@/utils/constants";
import { ClipboardCheck, GraduationCap, FileText, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function Progress() {
  const { id } = useAuthStore();

  const { data: testResults } = useQuery({
    queryKey: ["student-tests", id],
    queryFn: () => testsApi.getStudentResults(id!),
    enabled: !!id,
  });

  const { data: examResults } = useQuery({
    queryKey: ["student-exams", id],
    queryFn: () => examApi.getStudentResults(id!),
    enabled: !!id,
  });

  const { data: reports } = useQuery({
    queryKey: ["student-reports", id],
    queryFn: () => reportsApi.getStudentReports(id!),
    enabled: !!id,
  });

  const avgTest = testResults?.length
    ? Math.round(testResults.reduce((s, t) => s + t.percentage, 0) / testResults.length)
    : 0;
  const avgExam = examResults?.length
    ? (examResults.reduce((s, e) => s + (e.avg_score ?? 0), 0) / examResults.length).toFixed(1)
    : "0";

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-heading text-foreground">Мой прогресс</h1>
        <p className="text-muted-foreground mt-1">История результатов</p>
      </motion.div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { icon: ClipboardCheck, label: "Тестов", value: testResults?.length ?? 0, color: "text-violet-400 bg-violet-500/15" },
          { icon: TrendingUp, label: "Средний %", value: `${avgTest}%`, color: "text-emerald-400 bg-emerald-500/15" },
          { icon: GraduationCap, label: "Экзаменов", value: examResults?.length ?? 0, color: "text-amber-400 bg-amber-500/15" },
          { icon: FileText, label: "Отчётов", value: reports?.length ?? 0, color: "text-blue-400 bg-blue-500/15" },
        ].map((s) => (
          <div key={s.label} className="p-5 rounded-2xl bg-card border border-border">
            <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-heading text-foreground">{s.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tests */}
      <section>
        <h2 className="text-2xl font-heading text-foreground mb-4">Тесты</h2>
        {testResults?.length === 0 && <p className="text-muted-foreground">Тестов ещё не было</p>}
        <div className="space-y-2">
          {testResults?.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-heading text-lg ${t.percentage >= 70 ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"}`}>
                {t.percentage}%
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{t.topic}</p>
                <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString("ru")}</p>
              </div>
              <span className="text-sm text-muted-foreground">{t.correct_answers}/{t.total_questions}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Exams */}
      <section>
        <h2 className="text-2xl font-heading text-foreground mb-4">Экзамены</h2>
        {examResults?.length === 0 && <p className="text-muted-foreground">Экзаменов ещё не было</p>}
        <div className="space-y-2">
          {examResults?.map((e, i) => (
            <motion.div key={e.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-heading text-lg ${(e.avg_score ?? 0) >= 7 ? "bg-emerald-500/15 text-emerald-400" : (e.avg_score ?? 0) >= 4 ? "bg-amber-500/15 text-amber-400" : "bg-rose-500/15 text-rose-400"}`}>
                {e.avg_score != null ? e.avg_score.toFixed(1) : "—"}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Экзамен ({e.total_questions} вопросов)</p>
                <p className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleDateString("ru")}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Reports */}
      <section>
        <h2 className="text-2xl font-heading text-foreground mb-4">Отчёты</h2>
        {reports?.length === 0 && <p className="text-muted-foreground">Отчётов ещё не было</p>}
        <div className="space-y-2">
          {reports?.map((r) => {
            const st = REPORT_STATUS_MAP[r.status ?? "pending"] ?? REPORT_STATUS_MAP.pending;
            return (
              <div key={r.report_id} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
                <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{r.course_title} — {r.lab_title}</p>
                  <a href={r.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline truncate block">{r.url}</a>
                </div>
                <Badge className={st.color}>{st.label}</Badge>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
