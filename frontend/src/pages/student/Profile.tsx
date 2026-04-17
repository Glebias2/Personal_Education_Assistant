import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/api/auth";
import { recommendationsApi } from "@/api/recommendations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TAGS } from "@/utils/constants";
import { User, Tag, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Profile() {
  const { id } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [style, setStyle] = useState("");
  const [notes, setNotes] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["student-profile", id],
    queryFn: () => authApi.getStudent(id!),
    enabled: !!id,
  });

  const { data: interests } = useQuery({
    queryKey: ["student-interests", id],
    queryFn: () => recommendationsApi.getInterests(id!),
    enabled: !!id,
  });

  const { data: preferences } = useQuery({
    queryKey: ["student-preferences", id],
    queryFn: () => authApi.getPreferences(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (interests) setSelectedInterests(interests);
  }, [interests]);

  useEffect(() => {
    if (preferences) {
      setStyle(preferences.preferred_explanation_style ?? "");
      setNotes(preferences.notes ?? "");
    }
  }, [preferences]);

  const updateInterestsMutation = useMutation({
    mutationFn: () => recommendationsApi.updateInterests(id!, selectedInterests),
    onSuccess: () => toast.success("Интересы обновлены"),
    onError: () => toast.error("Ошибка обновления"),
  });

  const updatePrefsMutation = useMutation({
    mutationFn: () =>
      authApi.updatePreferences(id!, {
        preferred_explanation_style: style,
        notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-preferences", id] });
      toast.success("Предпочтения сохранены");
    },
    onError: () => toast.error("Ошибка сохранения"),
  });

  const toggleInterest = (tag: string) => {
    setSelectedInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const interestsChanged =
    JSON.stringify(selectedInterests.sort()) !==
    JSON.stringify((interests ?? []).sort());

  const prefsChanged =
    style !== (preferences?.preferred_explanation_style ?? "") ||
    notes !== (preferences?.notes ?? "");

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-heading text-foreground">Профиль</h1>
      </motion.div>

      {/* Info card */}
      <div className="p-6 rounded-2xl bg-card border border-border">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-heading text-foreground">
              {profile?.first_name} {profile?.last_name}
            </h2>
            <p className="text-sm text-muted-foreground">@{profile?.login}</p>
          </div>
        </div>
        {profile?.characteristic && (
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-sm text-muted-foreground mb-1">Характеристика</p>
            <p className="text-foreground">{profile.characteristic}</p>
          </div>
        )}
      </div>

      {/* Preferences */}
      <div className="p-6 rounded-2xl bg-card border border-border">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-heading text-foreground">
            Предпочтения по объяснениям
          </h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Укажите, как вам удобнее получать объяснения от AI-ассистента. Эти
          настройки используются по умолчанию во всех чатах.
        </p>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Стиль объяснения
            </label>
            <Textarea
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              placeholder="Например: объясняй просто, на пальцах, с примерами из жизни"
              className="resize-none"
              rows={3}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Дополнительные заметки
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Например: я лучше понимаю через аналогии, не люблю формулы"
              className="resize-none"
              rows={2}
            />
          </div>
          {prefsChanged && (
            <Button
              onClick={() => updatePrefsMutation.mutate()}
              disabled={updatePrefsMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {updatePrefsMutation.isPending ? "Сохранение..." : "Сохранить предпочтения"}
            </Button>
          )}
        </div>
      </div>

      {/* Interests */}
      <div className="p-6 rounded-2xl bg-card border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Tag className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-heading text-foreground">Интересы</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Выберите темы для персональных рекомендаций курсов
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {TAGS.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className={cn(
                "cursor-pointer transition-all text-sm py-1.5 px-3",
                selectedInterests.includes(tag)
                  ? "bg-primary/20 text-primary border-primary/40"
                  : "border-border text-muted-foreground hover:border-primary/30"
              )}
              onClick={() => toggleInterest(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
        {interestsChanged && (
          <Button
            onClick={() => updateInterestsMutation.mutate()}
            disabled={updateInterestsMutation.isPending}
            className="bg-primary hover:bg-primary/90"
          >
            {updateInterestsMutation.isPending ? "Сохранение..." : "Сохранить"}
          </Button>
        )}
      </div>
    </div>
  );
}
