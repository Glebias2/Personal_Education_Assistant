import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"

interface TagPickerProps {
  availableTags: string[]
  selectedTags: string[]
  onChange: (tags: string[]) => void
  maxTags?: number
  label?: string
}

export default function TagPicker({ availableTags, selectedTags, onChange, maxTags, label }: TagPickerProps) {
  const toggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag))
    } else {
      if (maxTags && selectedTags.length >= maxTags) return
      onChange([...selectedTags, tag])
    }
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="flex flex-wrap gap-2">
        {availableTags.map((tag) => {
          const selected = selectedTags.includes(tag)
          return (
            <Badge
              key={tag}
              variant={selected ? "default" : "outline"}
              className={`cursor-pointer select-none transition-colors ${
                selected
                  ? "bg-primary text-primary-foreground hover:bg-primary/80"
                  : "hover:bg-muted"
              } ${maxTags && selectedTags.length >= maxTags && !selected ? "opacity-40 cursor-not-allowed" : ""}`}
              onClick={() => toggle(tag)}
            >
              {tag}
            </Badge>
          )
        })}
      </div>
      {maxTags && (
        <p className="text-xs text-muted-foreground">
          {selectedTags.length} / {maxTags}
        </p>
      )}
    </div>
  )
}
