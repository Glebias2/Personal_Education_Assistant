import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { coursesApi } from "@/api/courses";
import { CourseCard } from "@/components/course/CourseCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function TeacherCourses() {
  const { id } = useAuthStore();

  const { data: courses, isLoading } = useQuery({
    queryKey: ["teacher-courses", id],
    queryFn: () => coursesApi.getTeacherCourses(id!),
    enabled: !!id,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-heading text-foreground">Мои курсы</h1>
          <p className="text-muted-foreground mt-1">Управление курсами</p>
        </motion.div>
        <Link to="/teacher/courses/new">
          <Button className="bg-primary hover:bg-primary/90 gap-2">
            <Plus className="w-4 h-4" /> Создать курс
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : courses?.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">У вас пока нет курсов</p>
          <Link to="/teacher/courses/new">
            <Button className="bg-primary hover:bg-primary/90">Создать первый курс</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses?.map((c, i) => (
            <CourseCard key={c.id} course={c} basePath="/teacher" index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
