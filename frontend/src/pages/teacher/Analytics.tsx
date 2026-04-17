import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { coursesApi, type CourseAnalytics } from "@/api/courses";
import {
  ArrowLeft, BarChart3, TrendingUp, GraduationCap,
  CheckCircle2, AlertTriangle, AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, LabelList,
  CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";

// ── Stying helpers ────────────────────────────────────────────────
const TT = {
  contentStyle: {
    background: "#1e1e21",
    border: "1px solid #2a2a2d",
    borderRadius: 8,
    color: "#f1f1f3",
    fontSize: 13,
  },
};

const VERDICT_LABELS: Record<string, string> = {
  correct: "Верно",
  partial: "Частично",
  incorrect: "Неверно",
  compilation_error: "Ошибка компиляции",
};
const VERDICT_COLORS: Record<string, string> = {
  correct: "#10b981",
  partial: "#f59e0b",
  incorrect: "#ef4444",
  compilation_error: "#71717a",
};
const DIFF_LABELS: Record<string, string> = {
  easy: "Лёгкий",
  medium: "Средний",
  hard: "Сложный",
};
const DIFF_COLORS: Record<string, string> = {
  easy: "#10b981",
  medium: "#f59e0b",
  hard: "#ef4444",
};

function topicBarColor(pct: number) {
  if (pct < 60) return "#ef4444";
  if (pct < 80) return "#f59e0b";
  return "#10b981";
}

function avgOf(nums: (number | null)[]): number | null {
  const valid = nums.filter((n): n is number => n !== null);
  if (!valid.length) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function fmtPct(n: number | null) {
  return n === null ? "—" : `${Math.round(n)}%`;
}

// ── Sub-components ────────────────────────────────────────────────
function Skel({ className }: { className?: string }) {
  return <div className={cn("rounded-2xl bg-card border border-border animate-pulse", className)} />;
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("p-6 rounded-2xl bg-card border border-border", className)}>
      {children}
    </div>
  );
}

function CardTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-lg font-heading text-foreground">{children}</h3>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground text-center py-10">{text}</p>;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  iconCls,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  sub?: string;
  iconCls: string;
}) {
  return (
    <div className="p-5 rounded-2xl bg-card border border-border flex items-start gap-4">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", iconCls)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground leading-tight">{label}</p>
        <p className="text-2xl font-heading text-foreground mt-0.5 leading-none">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────
export default function Analytics() {
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id);

  const { data, isLoading } = useQuery<CourseAnalytics>({
    queryKey: ["course-analytics", courseId],
    queryFn: () => coursesApi.getAnalytics(courseId),
  });

  // ── Derived values ────────────────────────────────────────────
  const avgTestPct = avgOf(data?.test_averages.map((s) => s.avg_percentage) ?? []);
  const avgExamScore = avgOf(data?.exam_averages.map((s) => s.avg_score) ?? []);

  const { totalApproved, totalEnrolledSlots } = (() => {
    if (!data?.lab_funnel.length) return { totalApproved: 0, totalEnrolledSlots: 0 };
    return {
      totalApproved: data.lab_funnel.reduce((s, l) => s + l.approved, 0),
      totalEnrolledSlots: data.lab_funnel.reduce((s, l) => s + l.enrolled, 0),
    };
  })();
  const labApprovalPct = totalEnrolledSlots > 0
    ? (totalApproved / totalEnrolledSlots) * 100
    : null;

  const weakTopicsCount = data?.topic_accuracy.filter((t) => t.accuracy_pct < 60).length ?? 0;

  // Timeline: group by dd.MM, avg %
  const timelineData = (() => {
    if (!data?.test_timeline.length) return [];
    const byDate: Record<string, number[]> = {};
    for (const row of data.test_timeline) {
      const d = new Date(row.created_at);
      const key = `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
      (byDate[key] ??= []).push(row.percentage ?? 0);
    }
    return Object.entries(byDate).map(([date, vals]) => ({
      date,
      avg_pct: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
    }));
  })();

  // Difficulty breakdown
  const diffData = (data?.difficulty_breakdown ?? []).map((d) => ({
    name: DIFF_LABELS[d.difficulty] ?? d.difficulty,
    avg_pct: d.avg_pct,
    color: DIFF_COLORS[d.difficulty] ?? "#71717a",
  }));

  // Verdict pie
  const verdictData = (data?.verdict_distribution ?? []).map((v) => ({
    name: VERDICT_LABELS[v.verdict] ?? v.verdict,
    value: v.count,
    color: VERDICT_COLORS[v.verdict] ?? "#71717a",
  }));
  const totalVerdicts = verdictData.reduce((s, v) => s + v.value, 0);

  // Student summary table — merge test + exam data
  const studentRows = (() => {
    const map = new Map<
      number,
      { name: string; test_count: number; avg_test: number | null; exam_count: number; avg_exam: number | null }
    >();
    for (const s of data?.test_averages ?? []) {
      map.set(s.student_id, {
        name: `${s.last_name} ${s.first_name}`,
        test_count: s.test_count,
        avg_test: s.avg_percentage,
        exam_count: 0,
        avg_exam: null,
      });
    }
    for (const s of data?.exam_averages ?? []) {
      const ex = map.get(s.student_id);
      if (ex) {
        ex.exam_count = s.exam_count;
        ex.avg_exam = s.avg_score;
      } else {
        map.set(s.student_id, {
          name: `${s.last_name} ${s.first_name}`,
          test_count: 0,
          avg_test: null,
          exam_count: s.exam_count,
          avg_exam: s.avg_score,
        });
      }
    }
    return [...map.values()].sort((a, b) => (b.avg_test ?? -1) - (a.avg_test ?? -1));
  })();

  // Hard questions (< 70%)
  const hardQs = (data?.hard_questions ?? []).filter((q) => q.success_rate < 70);

  // Lab funnel bar data
  const labFunnelData = (data?.lab_funnel ?? []).map((l) => ({
    name: `Лаба ${l.number}`,
    "Сдали": l.submitted,
    "Принято": l.approved,
    "Отклонено": l.rejected,
  }));

  // ── Loading skeleton ──────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        <Skel className="h-5 w-28" />
        <Skel className="h-12 w-72" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skel key={i} className="h-28" />)}
        </div>
        <Skel className="h-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skel className="h-72" />
          <Skel className="h-72" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skel className="h-64" />
          <Skel className="h-64" />
        </div>
        <Skel className="h-56" />
        <Skel className="h-52" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <Link
          to={`/teacher/courses/${courseId}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Назад к курсу
        </Link>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-heading text-foreground">Аналитика курса</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Мониторинг успеваемости и слабых мест</p>
          </div>
        </motion.div>
      </div>

      {/* Section 1 — Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Средний % тестов"
          value={fmtPct(avgTestPct)}
          sub={`${data?.test_averages.length ?? 0} студентов`}
          iconCls="bg-primary/10 text-primary"
        />
        <StatCard
          icon={GraduationCap}
          label="Ср. балл экзамена"
          value={avgExamScore !== null ? avgExamScore.toFixed(1) : "—"}
          sub="из 10"
          iconCls="bg-blue-500/10 text-blue-400"
        />
        <StatCard
          icon={CheckCircle2}
          label="Лаб принято"
          value={fmtPct(labApprovalPct)}
          sub={`${totalApproved} из ${totalEnrolledSlots} сдач`}
          iconCls="bg-emerald-500/10 text-emerald-400"
        />
        <StatCard
          icon={AlertTriangle}
          label="Слабых тем"
          value={String(weakTopicsCount)}
          sub="точность < 60%"
          iconCls={weakTopicsCount > 0 ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"}
        />
      </div>

      {/* Section 2 — Topic Accuracy (horizontal bars) */}
      <Card>
        <CardTitle sub="Процент правильных ответов — где студенты ошибаются чаще всего">
          Точность по темам
        </CardTitle>
        {data?.topic_accuracy.length ? (
          <ResponsiveContainer
            width="100%"
            height={Math.max(160, data.topic_accuracy.length * 44)}
          >
            <BarChart data={data.topic_accuracy} layout="vertical" margin={{ left: 8, right: 48 }}>
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fill: "#71717a", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                unit="%"
              />
              <YAxis
                type="category"
                dataKey="topic"
                width={170}
                tick={{ fill: "#a1a1aa", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                {...TT}
                formatter={(val: number) => [`${val}%`, "Точность"]}
              />
              <Bar dataKey="accuracy_pct" radius={[0, 6, 6, 0]} maxBarSize={30}>
                {data.topic_accuracy.map((entry, i) => (
                  <Cell key={i} fill={topicBarColor(entry.accuracy_pct)} fillOpacity={0.85} />
                ))}
                <LabelList
                  dataKey="accuracy_pct"
                  position="right"
                  formatter={(v: number) => `${v}%`}
                  style={{ fill: "#a1a1aa", fontSize: 12 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Empty text="Нет данных по тестам" />
        )}
      </Card>

      {/* Section 3 — Hard Questions + Lab Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hard Questions */}
        <Card>
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-5 h-5 text-rose-400" />
            <h3 className="text-lg font-heading text-foreground">Сложные вопросы</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Вопросы с успехом ниже 70%</p>
          {hardQs.length > 0 ? (
            <div className="space-y-2">
              {hardQs.slice(0, 6).map((q, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-xl bg-background border border-border"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground line-clamp-2" title={q.question_text}>
                      {q.question_text}
                    </p>
                    {q.topic && (
                      <span className="text-xs text-muted-foreground mt-0.5 inline-block">
                        {q.topic}
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium px-2 py-1 rounded-lg flex-shrink-0 mt-0.5",
                      q.success_rate < 40
                        ? "bg-rose-500/20 text-rose-400"
                        : "bg-amber-500/20 text-amber-400"
                    )}
                  >
                    {q.success_rate}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle2 className="w-10 h-10 text-emerald-400/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Все вопросы в порядке</p>
            </div>
          )}
        </Card>

        {/* Lab Funnel */}
        <Card>
          <CardTitle sub="Количество студентов по каждой лабораторной">
            Воронка сдачи лаб
          </CardTitle>
          {labFunnelData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={labFunnelData} margin={{ top: 4 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#71717a", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#71717a", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip {...TT} />
                <Legend wrapperStyle={{ fontSize: 12, color: "#71717a" }} />
                <Bar dataKey="Сдали" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={22} />
                <Bar dataKey="Принято" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={22} />
                <Bar dataKey="Отклонено" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Empty text="Нет лаб" />
          )}
        </Card>
      </div>

      {/* Section 4 — Exam Verdicts + Difficulty Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exam Verdict Donut */}
        <Card>
          <CardTitle sub="Распределение результатов по вопросам экзамена">
            Вердикты экзамена
          </CardTitle>
          {verdictData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie
                    data={verdictData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={82}
                    paddingAngle={3}
                  >
                    {verdictData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    {...TT}
                    formatter={(val: number) => [val, "вопросов"]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-1">
                {verdictData.map((v) => (
                  <div key={v.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: v.color }} />
                    {v.name} — {v.value}
                  </div>
                ))}
              </div>
              <p className="text-center text-xs text-muted-foreground mt-2">
                Всего вопросов: {totalVerdicts}
              </p>
            </>
          ) : (
            <Empty text="Экзаменов пока нет" />
          )}
        </Card>

        {/* Difficulty Breakdown Bar */}
        <Card>
          <CardTitle sub="Средний % правильных ответов по уровню сложности теста">
            Сложность тестов
          </CardTitle>
          {diffData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={diffData} margin={{ top: 16 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#71717a", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "#71717a", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                />
                <Tooltip
                  {...TT}
                  formatter={(val: number) => [`${val}%`, "Ср. результат"]}
                />
                <Bar dataKey="avg_pct" radius={[6, 6, 0, 0]} maxBarSize={64}>
                  {diffData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                  ))}
                  <LabelList
                    dataKey="avg_pct"
                    position="top"
                    formatter={(v: number) => `${v}%`}
                    style={{ fill: "#a1a1aa", fontSize: 12 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Empty text="Нет данных" />
          )}
        </Card>
      </div>

      {/* Section 5 — Students Summary Table */}
      <Card>
        <CardTitle sub="Сводка успеваемости по каждому студенту">Студенты</CardTitle>
        {studentRows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Студент", "Тестов", "Ср. %", "Экзаменов", "Ср. балл", "Статус"].map((h) => (
                    <th
                      key={h}
                      className={cn(
                        "text-muted-foreground font-medium py-2 text-xs",
                        h === "Студент" ? "text-left pr-4" : "text-center px-3"
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {studentRows.map((s, i) => {
                  const pct = s.avg_test;
                  const tag =
                    pct === null ? "neutral"
                    : pct >= 80 ? "good"
                    : pct >= 60 ? "mid"
                    : "bad";
                  return (
                    <tr key={i} className="border-b border-border/40 last:border-0">
                      <td className="py-3 pr-4 font-medium text-foreground whitespace-nowrap">
                        {s.name}
                      </td>
                      <td className="py-3 px-3 text-center text-muted-foreground">{s.test_count || "—"}</td>
                      <td className="py-3 px-3 text-center">{fmtPct(s.avg_test)}</td>
                      <td className="py-3 px-3 text-center text-muted-foreground">{s.exam_count || "—"}</td>
                      <td className="py-3 px-3 text-center">
                        {s.avg_exam !== null ? s.avg_exam.toFixed(1) : "—"}
                      </td>
                      <td className="py-3 pl-3 text-center">
                        <span
                          className={cn(
                            "text-xs px-2 py-1 rounded-lg font-medium",
                            tag === "good" && "bg-emerald-500/20 text-emerald-400",
                            tag === "mid" && "bg-amber-500/20 text-amber-400",
                            tag === "bad" && "bg-rose-500/20 text-rose-400",
                            tag === "neutral" && "bg-muted/40 text-muted-foreground"
                          )}
                        >
                          {tag === "good" ? "Отлично" : tag === "mid" ? "В процессе" : tag === "bad" ? "Отстаёт" : "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty text="Нет данных по студентам" />
        )}
      </Card>

      {/* Section 6 — Activity Timeline */}
      <Card>
        <CardTitle sub="Средний % тестов по дням">Активность тестирования</CardTitle>
        {timelineData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={timelineData} margin={{ top: 4, right: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2d" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "#71717a", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "#71717a", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                unit="%"
              />
              <Tooltip
                {...TT}
                formatter={(val: number) => [`${val}%`, "Средний результат"]}
              />
              <Line
                type="monotone"
                dataKey="avg_pct"
                stroke="#7c3aed"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#7c3aed", strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Empty text="Нет активности" />
        )}
      </Card>
    </div>
  );
}
