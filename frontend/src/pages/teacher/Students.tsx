import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { coursesApi } from "@/api/courses";
import { ArrowLeft, Users, User } from "lucide-react";
import { motion } from "framer-motion";

export default function Students() {
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id);

  const { data } = useQuery({
    queryKey: ["course-students", courseId],
    queryFn: () => coursesApi.getStudents(courseId),
  });

  const students = data?.students ?? [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to={`/teacher/courses/${courseId}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Назад к курсу
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-heading text-foreground">Студенты курса</h1>
        <p className="text-muted-foreground mt-1">{students.length} зачислено</p>
      </motion.div>

      {students.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Студентов пока нет</p>
        </div>
      ) : (
        <div className="space-y-2">
          {students.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{s.first_name} {s.last_name}</p>
                <p className="text-xs text-muted-foreground">ID: {s.id}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
