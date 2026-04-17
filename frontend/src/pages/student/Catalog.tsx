import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { coursesApi, type Course } from "@/api/courses";
import { recommendationsApi } from "@/api/recommendations";
import { CourseCard } from "@/components/course/CourseCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TAGS, DIFFICULTY_MAP } from "@/utils/constants";
import { Search, Sparkles, BookOpen, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type Tab = "recommended" | "all";

function MaybeLike({ course, shownIds }: { course: Course | null; shownIds: number[] }) {
  if (!course || shownIds.includes(course.id)) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pt-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Wand2 className="w-4 h-4" />
        <span>Возможно, вам понравится</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <CourseCard course={course} basePath="/student" index={0} />
      </div>
    </motion.div>
  );
}

export default function Catalog() {
  const { id } = useAuthStore();
  const [tab, setTab] = useState<Tab>("recommended");
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedDiff, setSelectedDiff] = useState<string | null>(null);

  const { data: courses, isLoading } = useQuery({
    queryKey: ["all-courses"],
    queryFn: coursesApi.getAll,
  });

  const { data: recommended, isLoading: recLoading } = useQuery({
    queryKey: ["recommended", id],
    queryFn: () => recommendationsApi.getRecommended(id!),
    enabled: !!id,
  });

  const filtered = courses?.filter((c) => {
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedTags.length) {
      const courseTags = c.tags?.map((t) => t.toLowerCase()) ?? [];
      if (!selectedTags.some((t) => courseTags.includes(t.toLowerCase()))) return false;
    }
    if (selectedDiff && c.difficulty !== selectedDiff) return false;
    return true;
  });

  const toggleTag = (tag: string) =>
    setSelectedTags((p) => (p.includes(tag) ? p.filter((t) => t !== tag) : [...p, tag]));

  const hasRecommendations = recommended?.has_recommendations && recommended.recommended.length > 0;

  const tabs: { key: Tab; label: string; icon: typeof Sparkles }[] = [
    { key: "recommended", label: "Рекомендованные", icon: Sparkles },
    { key: "all", label: "Все курсы", icon: BookOpen },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-heading text-foreground">Каталог курсов</h1>
        <p className="text-muted-foreground mt-1">Найдите подходящий курс</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-surface border border-border w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              tab === key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
            {key === "recommended" && hasRecommendations && (
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-full",
                tab === key ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary"
              )}>
                {recommended!.recommended.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Recommended tab */}
      {tab === "recommended" && (
        <motion.div key="rec" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {recLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 rounded-2xl bg-card border border-border animate-pulse" />
              ))}
            </div>
          ) : hasRecommendations ? (
            <>
              <p className="text-sm text-muted-foreground">
                Курсы подобраны на основе ваших интересов и активности
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommended!.recommended.map((c, i) => (
                  <CourseCard key={c.id} course={c} basePath="/student" index={i} />
                ))}
              </div>
              <MaybeLike course={recommended!.maybe_like} shownIds={recommended!.recommended.map(c => c.id)} />
            </>
          ) : (
            <>
              <div className="text-center py-12 rounded-2xl bg-card border border-border">
                <Sparkles className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-heading text-foreground mb-2">Пока нет рекомендаций</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Выберите интересы в профиле — система подберёт подходящие курсы для вас
                </p>
              </div>
              <MaybeLike course={recommended?.maybe_like ?? null} shownIds={[]} />
            </>
          )}
        </motion.div>
      )}

      {/* All courses tab */}
      {tab === "all" && (
        <motion.div key="all" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Search + Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Поиск курсов..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-card border-border"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {TAGS.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-all",
                    selectedTags.includes(tag)
                      ? "bg-primary/20 text-primary border-primary/40"
                      : "border-border text-muted-foreground hover:border-primary/30"
                  )}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
              {Object.entries(DIFFICULTY_MAP).map(([key, val]) => (
                <Badge
                  key={key}
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-all",
                    selectedDiff === key
                      ? val.color
                      : "border-border text-muted-foreground hover:border-primary/30"
                  )}
                  onClick={() => setSelectedDiff(selectedDiff === key ? null : key)}
                >
                  {val.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Course grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 rounded-2xl bg-card border border-border animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered?.map((c, i) => (
                <CourseCard key={c.id} course={c} basePath="/student" index={i} />
              ))}
              {filtered?.length === 0 && (
                <p className="col-span-full text-center text-muted-foreground py-12">
                  Курсы не найдены
                </p>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
