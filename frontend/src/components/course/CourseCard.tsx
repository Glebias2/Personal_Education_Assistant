import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { DIFFICULTY_MAP, COURSE_COLORS } from "@/utils/constants";
import type { Course, CourseRef } from "@/api/courses";
import { motion } from "framer-motion";

interface Props {
  course: Course | CourseRef;
  basePath: string;
  index?: number;
}

export function CourseCard({ course, basePath, index = 0 }: Props) {
  const colorClass = COURSE_COLORS[course.id % COURSE_COLORS.length];
  const full = "difficulty" in course ? course : null;
  const diff = DIFFICULTY_MAP[full?.difficulty ?? ""] ?? DIFFICULTY_MAP.intermediate;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
    >
      <Link
        to={`${basePath}/courses/${course.id}`}
        className="group block rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 overflow-hidden"
      >
        {/* Color header */}
        <div className={`h-28 bg-gradient-to-br ${colorClass} relative overflow-hidden`}>
          <span className="absolute -bottom-4 -right-2 text-8xl font-heading text-white/10 leading-none select-none">
            {course.title.charAt(0)}
          </span>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="font-heading text-lg text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors">
            {course.title}
          </h3>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {full && (
              <>
                <Badge className={diff.color} variant="secondary">
                  {diff.label}
                </Badge>
                {full.tags?.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="outline" className="border-border text-muted-foreground text-xs">
                    {tag}
                  </Badge>
                ))}
              </>
            )}
          </div>

          {full?.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {full.description}
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
