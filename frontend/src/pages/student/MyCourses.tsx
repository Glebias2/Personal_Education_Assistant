import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { coursesApi, type CourseWithStatus } from "@/api/courses";
import { recommendationsApi } from "@/api/recommendations";
import { CourseCard } from "@/components/course/CourseCard";
import { StarRating } from "@/components/course/StarRating";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { BookOpen, GraduationCap, Star } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Tab = "active" | "completed";

export default function MyCourses() {
  const { id } = useAuthStore();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("active");
  const [ratingLoading, setRatingLoading] = useState<number | null>(null);

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["student-courses-full", id],
    queryFn: () => coursesApi.getStudentCoursesFull(id!),
    enabled: !!id,
  });

  const activeCourses   = courses.filter((c) => !c.is_completed);
  const completedCourses = courses.filter((c) => c.is_completed);

  const handleRate = async (course: CourseWithStatus, rating: number) => {
    if (!id) return;
    setRatingLoading(course.id);
    try {
      await recommendationsApi.rateCourse(course.id, { student_id: id, rating });
      toast.success(`Оценка ${rating}/5 сохранена`);
      queryClient.invalidateQueries({ queryKey: ["student-courses-full", id] });
    } catch {
      toast.error("Не удалось сохранить оценку");
    } finally {
      setRatingLoading(null);
    }
  };

  const tabs: { key: Tab; label: string; count: number; icon: typeof BookOpen }[] = [
    { key: "active",    label: "Активные",    count: activeCourses.length,   icon: BookOpen },
    { key: "completed", label: "Завершённые", count: completedCourses.length, icon: GraduationCap },
  ];

  const displayed = tab === "active" ? activeCourses : completedCourses;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-heading text-foreground">Мои курсы</h1>
        <p className="text-muted-foreground mt-1">
          {activeCourses.length} активных · {completedCourses.length} завершённых
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-surface border border-border w-fit">
        {tabs.map(({ key, label, count, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              tab === key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded-full",
              tab === key
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-primary/10 text-primary"
            )}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-card border border-border animate-pulse" />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16 rounded-2xl bg-card border border-border">
            {tab === "active" ? (
              <>
                <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-heading text-foreground mb-2">Нет активных курсов</h3>
                <p className="text-sm text-muted-foreground">Все ваши курсы завершены!</p>
              </>
            ) : (
              <>
                <GraduationCap className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-heading text-foreground mb-2">Нет завершённых курсов</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Курс считается завершённым, когда все лабораторные одобрены и пройден экзамен
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayed.map((course, i) => (
              <div key={course.id} className="flex flex-col gap-2">
                <CourseCard course={course} basePath="/student" index={i} />

                {/* Рейтинг — только для завершённых */}
                {tab === "completed" && (
                  <div className="px-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StarRating
                        value={course.my_rating}
                        onChange={(r) => handleRate(course, r)}
                        readonly={ratingLoading === course.id}
                        size="sm"
                      />
                      {course.my_rating ? (
                        <span className="text-xs text-amber-400 font-medium">
                          {course.my_rating}/5
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Оценить курс</span>
                      )}
                    </div>
                    {course.my_rating && (
                      <Badge
                        variant="outline"
                        className="text-xs border-amber-500/30 text-amber-400 flex items-center gap-1"
                      >
                        <Star className="w-2.5 h-2.5 fill-amber-400" />
                        Оценено
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
