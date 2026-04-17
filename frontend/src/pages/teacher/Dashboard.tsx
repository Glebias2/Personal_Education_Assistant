import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { coursesApi } from "@/api/courses";
import { reportsApi } from "@/api/reports";
import { CourseCard } from "@/components/course/CourseCard";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, FileText, Users } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function TeacherDashboard() {
  const { id, name } = useAuthStore();

  const { data: courses } = useQuery({
    queryKey: ["teacher-courses", id],
    queryFn: () => coursesApi.getTeacherCourses(id!),
    enabled: !!id,
  });

  const { data: pending } = useQuery({
    queryKey: ["pending-reports", id],
    queryFn: () => reportsApi.getPending(id!),
    enabled: !!id,
  });

  const firstName = name.split(" ")[0];
  const pendingCount = pending?.reports?.length ?? 0;

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-heading text-foreground">Привет, {firstName}</h1>
        <p className="text-muted-foreground mt-1">Панель преподавателя</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border">
          <div className="w-10 h-10 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center mb-3">
            <GraduationCap className="w-5 h-5" />
          </div>
          <p className="text-2xl font-heading text-foreground">{courses?.length ?? 0}</p>
          <p className="text-sm text-muted-foreground mt-1">Курсов</p>
        </div>
        <Link to="/teacher/reports" className="p-5 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all group">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-3">
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-heading text-foreground">{pendingCount}</p>
            {pendingCount > 0 && <Badge className="bg-amber-500/20 text-amber-400">Ждут</Badge>}
          </div>
          <p className="text-sm text-muted-foreground mt-1">Отчётов на проверку</p>
        </Link>
        <div className="p-5 rounded-2xl bg-card border border-border">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-3">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-2xl font-heading text-foreground">—</p>
          <p className="text-sm text-muted-foreground mt-1">Студентов</p>
        </div>
      </div>

      {/* Courses */}
      {courses && courses.length > 0 && (
        <section>
          <h2 className="text-2xl font-heading text-foreground mb-4">Мои курсы</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((c, i) => (
              <CourseCard key={c.id} course={c} basePath="/teacher" index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
