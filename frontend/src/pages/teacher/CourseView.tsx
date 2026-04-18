import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { coursesApi } from "@/api/courses";
import { labsApi } from "@/api/labs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DIFFICULTY_MAP, COURSE_COLORS } from "@/utils/constants";
import {
  FlaskConical, Users, FileText, BarChart3, Pencil,
  ArrowLeft, UserCheck, Settings,
} from "lucide-react";
import { motion } from "framer-motion";

export default function CourseView() {
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id);

  const { data: course } = useQuery({
    queryKey: ["course-info", courseId],
    queryFn: () => coursesApi.getInfo(courseId),
  });

  const { data: labs } = useQuery({
    queryKey: ["course-labs", courseId],
    queryFn: () => labsApi.getAll(courseId),
  });

  const { data: studentsData } = useQuery({
    queryKey: ["course-students", courseId],
    queryFn: () => coursesApi.getStudents(courseId),
  });

  const { data: requests } = useQuery({
    queryKey: ["course-requests", courseId],
    queryFn: () => coursesApi.getRequests(courseId),
  });

  if (!course) return <div className="animate-pulse h-96 rounded-2xl bg-card border border-border" />;

  const colorClass = COURSE_COLORS[course.id % COURSE_COLORS.length];
  const diff = DIFFICULTY_MAP[course.difficulty] ?? DIFFICULTY_MAP.intermediate;
  const pendingRequests = requests?.filter((r) => r.status !== "approved" && r.status !== "rejected") ?? [];

  return (
    <div className="space-y-6">
      <Link to="/teacher/courses" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Мои курсы
      </Link>

      {/* Hero */}
      <motion.div className={`rounded-2xl bg-gradient-to-br ${colorClass} p-8 relative overflow-hidden`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <span className="absolute -bottom-8 -right-4 text-[10rem] font-heading text-white/5 leading-none select-none">{course.title.charAt(0)}</span>
        <div className="relative z-10">
          <div className="flex gap-2 mb-3">
            <Badge className={diff.color}>{diff.label}</Badge>
            {course.tags?.map((t) => <Badge key={t} variant="secondary" className="bg-white/10 text-white border-0">{t}</Badge>)}
          </div>
          <h1 className="text-3xl font-heading text-white mb-2">{course.title}</h1>
          <p className="text-white/70 max-w-xl">{course.description}</p>
        </div>
      </motion.div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { to: `/teacher/courses/${courseId}/edit`, icon: Pencil, label: "Редактировать" },
          { to: `/teacher/courses/${courseId}/labs`, icon: FlaskConical, label: `Лабы (${labs?.length ?? 0})` },
          { to: `/teacher/courses/${courseId}/students`, icon: Users, label: `Студенты (${studentsData?.students?.length ?? 0})` },
          { to: `/teacher/courses/${courseId}/requests`, icon: UserCheck, label: `Заявки (${pendingRequests.length})` },
          { to: `/teacher/courses/${courseId}/analytics`, icon: BarChart3, label: "Аналитика" },
          { to: `/teacher/courses/${courseId}/files`, icon: Settings, label: "Файлы" },
        ].map((action) => (
          <Link key={action.to + action.label} to={action.to}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all group">
            <action.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{action.label}</span>
          </Link>
        ))}
      </div>

      {/* Labs preview */}
      <div className="p-6 rounded-2xl bg-card border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-heading text-foreground">Лабораторные</h2>
          <Link to={`/teacher/courses/${courseId}/labs`}>
            <Button variant="ghost" size="sm" className="text-primary">Управление</Button>
          </Link>
        </div>
        {labs?.length === 0 ? (
          <p className="text-muted-foreground">Лабораторных пока нет</p>
        ) : (
          <div className="space-y-2">
            {labs?.map((lab) => (
              <div key={lab.id} className="flex items-center gap-3 p-3 rounded-lg bg-surface border border-border">
                <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary font-heading text-sm">{lab.number}</div>
                <span className="text-sm text-foreground">{lab.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
