import { cn } from "@/lib/utils"

type Status = "approved" | "rejected" | "pending" | "loaded" | "not-approved" | string

const config: Record<string, { label: string; classes: string }> = {
  approved: { label: "Принято", classes: "bg-success/15 text-success border-success/30" },
  loaded: { label: "Загружено", classes: "bg-primary/15 text-primary border-primary/30" },
  pending: { label: "На проверке", classes: "bg-warning/15 text-warning border-warning/30" },
  rejected: { label: "Отклонено", classes: "bg-destructive/15 text-destructive border-destructive/30" },
  "not-approved": { label: "Не принято", classes: "bg-destructive/15 text-destructive border-destructive/30" },
}

export function StatusBadge({ status }: { status: Status }) {
  const cfg = config[status] ?? { label: status, classes: "bg-muted text-muted-foreground border-border" }
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border", cfg.classes)}>
      {cfg.label}
    </span>
  )
}
