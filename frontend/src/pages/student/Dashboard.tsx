import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { coursesApi } from "@/api/courses";
import { testsApi } from "@/api/tests";
import { CourseCard } from "@/components/course/CourseCard";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { BookOpen, ClipboardCheck, TrendingUp, GraduationCap, ArrowRight } from "lucide-react";

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="p-5 rounded-2xl bg-card border border-border">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-heading text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

export default function StudentDashboard() {
  const { id, name } = useAuthStore();

  const { data: myCourses } = useQuery({
    queryKey: ["student-courses-full", id],
    queryFn: () => coursesApi.getStudentCoursesFull(id!),
    enabled: !!id,
  });

  const { data: testResults } = useQuery({
    queryKey: ["student-tests", id],
    queryFn: () => testsApi.getStudentResults(id!),
    enabled: !!id,
  });

  const avgScore = testResults?.length
    ? Math.round(testResults.reduce((s, t) => s + t.percentage, 0) / testResults.length)
    : 0;

  const completedCount = myCourses?.filter((c) => c.is_completed).length ?? 0;
  const activeCourses = myCourses?.filter((c) => !c.is_completed).slice(0, 3) ?? [];
  const firstName = name.split(" ")[0];

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-heading text-foreground">
          Привет, {firstName}
        </h1>
        <p className="text-muted-foreground mt-1">Ваша сводка за сегодня</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={BookOpen}
          label="Всего курсов"
          value={myCourses?.length ?? 0}
          color="bg-violet-500/15 text-violet-400"
        />
        <StatCard
          icon={GraduationCap}
          label="Завершено"
          value={completedCount}
          color="bg-emerald-500/15 text-emerald-400"
        />
        <StatCard
          icon={ClipboardCheck}
          label="Тестов пройдено"
          value={testResults?.length ?? 0}
          color="bg-blue-500/15 text-blue-400"
        />
        <StatCard
          icon={TrendingUp}
          label="Средний %"
          value={`${avgScore}%`}
          color="bg-amber-500/15 text-amber-400"
        />
      </div>

      {/* Active courses preview */}
      {activeCourses.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-heading text-foreground">Активные курсы</h2>
            <Link to="/student/my-courses">
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
                Все курсы <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeCourses.map((c, i) => (
              <CourseCard key={c.id} course={c} basePath="/student" index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {(!myCourses || myCourses.length === 0) && (
        <div className="p-12 rounded-2xl bg-card border border-border text-center">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-heading text-foreground mb-2">Вы ещё не записаны на курсы</h3>
          <p className="text-muted-foreground mb-4">Перейдите в каталог, чтобы выбрать курс и отправить заявку</p>
          <Link to="/student/catalog">
            <Button className="bg-primary hover:bg-primary/90">Перейти в каталог</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
