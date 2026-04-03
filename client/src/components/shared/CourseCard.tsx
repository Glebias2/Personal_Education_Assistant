import { useNavigate } from "react-router-dom"
import { BookOpen, ChevronRight, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const difficultyMap: Record<string, { label: string; classes: string }> = {
  easy: { label: "Лёгкий", classes: "bg-success/10 text-success border-success/20" },
  intermediate: { label: "Средний", classes: "bg-warning/10 text-warning border-warning/20" },
  hard: { label: "Сложный", classes: "bg-destructive/10 text-destructive border-destructive/20" },
}

interface Props {
  id: number
  title: string
  description?: string
  difficulty?: string
  tags?: string[]
  rating?: number
  role: "student" | "teacher"
  className?: string
}

export function CourseCard({ id, title, description, difficulty, tags, rating, role, className }: Props) {
  const navigate = useNavigate()
  const diff = difficulty ? (difficultyMap[difficulty] ?? difficultyMap.intermediate) : null

  return (
    <div
      className={cn(
        "group rounded-xl border border-border/50 bg-card p-5 hover:border-primary/30 transition-all duration-200 cursor-pointer flex flex-col",
        className
      )}
      onClick={() => navigate(`/${role}/course/${id}/overview`)}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <BookOpen className="w-4 h-4 text-primary" />
        </div>
        {diff && (
          <span className={cn("text-xs px-2 py-0.5 rounded-md border font-medium", diff.classes)}>
            {diff.label}
          </span>
        )}
      </div>

      <h3 className="font-semibold text-foreground text-sm leading-snug mb-1.5 group-hover:text-primary transition-colors">
        {title}
      </h3>

      {description && (
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3 flex-1">
          {description}
        </p>
      )}

      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
        {rating != null ? (
          <span className="flex items-center gap-1 text-xs text-warning">
            <Star className="w-3 h-3 fill-current" />
            {rating.toFixed(1)}
          </span>
        ) : (
          <span />
        )}
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </div>
  )
}
