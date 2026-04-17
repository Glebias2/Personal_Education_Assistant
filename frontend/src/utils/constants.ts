export const TAGS = [
  "Программирование",
  "Базы данных",
  "Сети",
  "Операционные системы",
  "Алгоритмы",
  "Web",
  "Мобильная разработка",
  "AI/ML",
  "Математика",
  "Электроника",
  "Безопасность",
  "DevOps",
] as const;

/** Сложность курсов (значения из БД) */
export const DIFFICULTY_MAP: Record<string, { label: string; color: string }> = {
  beginner:     { label: "Начальный",   color: "bg-emerald-500/20 text-emerald-400" },
  intermediate: { label: "Средний",     color: "bg-amber-500/20 text-amber-400" },
  advanced:     { label: "Продвинутый", color: "bg-rose-500/20 text-rose-400" },
};

/** Сложность тестов (значения для API генерации тестов) */
export const TEST_DIFFICULTY_MAP: Record<string, { label: string; color: string }> = {
  easy:   { label: "Лёгкий",     color: "bg-emerald-500/20 text-emerald-400" },
  medium: { label: "Средний",    color: "bg-amber-500/20 text-amber-400" },
  hard:   { label: "Сложный",    color: "bg-rose-500/20 text-rose-400" },
};

export const REPORT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "На проверке", color: "bg-amber-500/20 text-amber-400" },
  approved: { label: "Одобрен", color: "bg-emerald-500/20 text-emerald-400" },
  "not-approved": { label: "Отклонён", color: "bg-rose-500/20 text-rose-400" },
  loaded: { label: "Загружен", color: "bg-blue-500/20 text-blue-400" },
  rejected: { label: "Отклонён AI", color: "bg-rose-500/20 text-rose-400" },
};

export const COURSE_COLORS = [
  "from-violet-600 to-purple-700",
  "from-blue-600 to-cyan-700",
  "from-emerald-600 to-teal-700",
  "from-rose-600 to-pink-700",
  "from-amber-600 to-orange-700",
  "from-indigo-600 to-blue-700",
  "from-fuchsia-600 to-purple-700",
  "from-sky-600 to-blue-700",
];
