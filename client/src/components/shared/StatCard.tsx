import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface Props {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  trend?: { value: string; positive?: boolean }
  className?: string
}

export function StatCard({ title, value, subtitle, icon: Icon, iconColor = "text-primary", iconBg = "bg-primary/10 border-primary/20", trend, className }: Props) {
  return (
    <div className={cn("rounded-xl border border-border/50 bg-card p-5 flex items-start gap-4", className)}>
      <div className={cn("w-10 h-10 rounded-lg border flex items-center justify-center shrink-0", iconBg)}>
        <Icon className={cn("w-5 h-5", iconColor)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground mb-0.5">{title}</p>
        <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        {trend && (
          <p className={cn("text-xs mt-1 font-medium", trend.positive ? "text-success" : "text-muted-foreground")}>
            {trend.value}
          </p>
        )}
      </div>
    </div>
  )
}
