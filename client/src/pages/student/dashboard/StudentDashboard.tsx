import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { BookOpen, FlaskConical, Brain, TrendingUp, Plus, ChevronRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/shared/StatCard"
import { CourseCard } from "@/components/shared/CourseCard"
import { EmptyState } from "@/components/shared/EmptyState"
import { useAuth } from "@/features/auth/AuthContext"
import { getStudentCoursesById } from "@/lib/api/courses"
import { getRecommendedCourses } from "@/lib/api/recommendations"

export default function StudentDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: courses = [], isLoading: loadingCourses } = useQuery({
    queryKey: ["student-courses", user!.id],
    queryFn: () => getStudentCoursesById(user!.id),
  })

  const { data: recs } = useQuery({
    queryKey: ["recommended-courses", user!.id],
    queryFn: () => getRecommendedCourses(user!.id),
  })

  const recommended = recs?.recommended ?? []

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          Привет, {user?.first_name}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">Добро пожаловать на платформу</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard
          title="Курсов записан"
          value={courses.length}
          icon={BookOpen}
          iconColor="text-primary"
          iconBg="bg-primary/10 border-primary/20"
        />
        <StatCard
          title="Тестов пройдено"
          value="—"
          icon={FlaskConical}
          iconColor="text-accent"
          iconBg="bg-accent/10 border-accent/20"
          subtitle="Зайди в курс"
        />
        <StatCard
          title="Экзаменов"
          value="—"
          icon={Brain}
          iconColor="text-warning"
          iconBg="bg-warning/10 border-warning/20"
          subtitle="Пробных"
        />
        <StatCard
          title="Средний %"
          value="—"
          icon={TrendingUp}
          iconColor="text-success"
          iconBg="bg-success/10 border-success/20"
          subtitle="По тестам"
        />
      </div>

      {/* My courses */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Мои курсы</h2>
          <Button variant="outline" size="sm" onClick={() => navigate("/student/courses")}>
            Каталог <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>

        {loadingCourses ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-44 rounded-xl skeleton" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Нет записанных курсов"
            description="Запишитесь на курсы в каталоге"
            action={
              <Button size="sm" onClick={() => navigate("/student/courses")}>
                <Plus className="w-4 h-4 mr-1.5" /> Найти курсы
              </Button>
            }
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((c) => (
              <CourseCard key={c.id} id={c.id} title={c.title} role="student" />
            ))}
          </div>
        )}
      </section>

      {/* Recommended */}
      {recommended.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-lg font-semibold">Рекомендуем для тебя</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommended.slice(0, 3).map((c: any) => (
              <CourseCard
                key={c.id}
                id={c.id}
                title={c.title}
                description={c.description}
                difficulty={c.difficulty}
                tags={c.tags}
                rating={c.bayesian_rating}
                role="student"
              />
            ))}
          </div>
          {recommended.length > 3 && (
            <div className="mt-4 text-center">
              <Button variant="ghost" size="sm" onClick={() => navigate("/student/courses")}>
                Показать все рекомендации <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
