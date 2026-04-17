import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, ArrowRight, ArrowLeft, Sparkles, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore, type UserRole } from "@/store/authStore";
import { authApi } from "@/api/auth";
import { TAGS } from "@/utils/constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Направление анимации при переключении шагов
type Direction = 1 | -1;

const variants = {
  enter: (dir: Direction) => ({ opacity: 0, x: dir * 40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: Direction) => ({ opacity: 0, x: dir * -40 }),
};

export default function Register() {
  const [role, setRole] = useState<UserRole>("student");

  // Шаги: для студента 3 (0,1,2), для преподавателя только 1 (0)
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<Direction>(1);

  // Поля
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [characteristic, setCharacteristic] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const authLogin = useAuthStore((s) => s.login);

  const totalSteps = role === "student" ? 3 : 1;

  const goNext = () => {
    setDirection(1);
    setStep((s) => s + 1);
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const toggleInterest = (tag: string) =>
    setInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );

  const handleRoleChange = (v: string) => {
    setRole(v as UserRole);
    setStep(0);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (role === "student") {
        const res = await authApi.studentRegister({
          login,
          password,
          first_name: firstName,
          last_name: lastName,
          characteristic: characteristic.trim() || undefined,
          interests,
        });
        if (res.success && res.student_id) {
          authLogin("student", res.student_id, `${firstName} ${lastName}`);
          navigate("/student/dashboard");
        }
      } else {
        const res = await authApi.teacherRegister({
          login,
          password,
          first_name: firstName,
          last_name: lastName,
        });
        if (res.success && res.teacher_id) {
          authLogin("teacher", res.teacher_id, `${firstName} ${lastName}`);
          navigate("/teacher/dashboard");
        }
      }
    } catch {
      toast.error("Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  // Шаг 0 — имя/фамилия/логин/пароль
  const step0Valid = firstName.trim() && lastName.trim() && login.trim() && password.trim();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="fixed bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/8 blur-[100px]" />

      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="font-heading text-3xl text-foreground">EduAI</span>
        </Link>

        <div className="p-8 rounded-2xl bg-surface border border-border overflow-hidden">

          {/* Прогресс-точки (только для студента с 3 шагами) */}
          {role === "student" && (
            <div className="flex items-center justify-center gap-2 mb-6">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-full transition-all duration-300",
                    i === step
                      ? "w-6 h-2 bg-primary"
                      : i < step
                        ? "w-2 h-2 bg-primary/50"
                        : "w-2 h-2 bg-border"
                  )}
                />
              ))}
            </div>
          )}

          {/* Переключатель роли — только на шаге 0 */}
          {step === 0 && (
            <>
              <h1 className="font-heading text-3xl text-foreground text-center mb-2">
                Регистрация
              </h1>
              <p className="text-sm text-muted-foreground text-center mb-6">Создайте аккаунт</p>
              <Tabs value={role} onValueChange={handleRoleChange} className="mb-6">
                <TabsList className="w-full bg-background">
                  <TabsTrigger value="student" className="flex-1">Студент</TabsTrigger>
                  <TabsTrigger value="teacher" className="flex-1">Преподаватель</TabsTrigger>
                </TabsList>
              </Tabs>
            </>
          )}

          {/* Анимированный контент шагов */}
          <AnimatePresence mode="wait" custom={direction}>
            {/* ── Шаг 0: Данные аккаунта ───────────────────────────── */}
            {step === 0 && (
              <motion.div
                key="step-0"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Имя</Label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Имя"
                      className="bg-background border-border"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Фамилия</Label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Фамилия"
                      className="bg-background border-border"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Логин</Label>
                  <Input
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    placeholder="Логин"
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Пароль</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Пароль"
                    className="bg-background border-border"
                  />
                </div>

                {/* Для студента — кнопка Далее, для преподавателя — сразу Создать */}
                {role === "student" ? (
                  <Button
                    onClick={goNext}
                    disabled={!step0Valid}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    Далее <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!step0Valid || loading}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    {loading ? "Регистрация..." : "Создать аккаунт"}
                  </Button>
                )}
              </motion.div>
            )}

            {/* ── Шаг 1: Интересы ──────────────────────────────────── */}
            {step === 1 && (
              <motion.div
                key="step-1"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="space-y-5"
              >
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="font-heading text-2xl text-foreground">Ваши интересы</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Выберите темы — система подберёт подходящие курсы
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {TAGS.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className={cn(
                        "cursor-pointer transition-all select-none",
                        interests.includes(tag)
                          ? "bg-primary/20 text-primary border-primary/40"
                          : "border-border text-muted-foreground hover:border-primary/30"
                      )}
                      onClick={() => toggleInterest(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-3 pt-1">
                  <Button variant="outline" onClick={goBack} className="flex-1">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Назад
                  </Button>
                  <Button onClick={goNext} className="flex-1 bg-primary hover:bg-primary/90">
                    Далее <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ── Шаг 2: Характеристика ────────────────────────────── */}
            {step === 2 && (
              <motion.div
                key="step-2"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="space-y-5"
              >
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="font-heading text-2xl text-foreground">О себе</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Необязательно, но поможет AI лучше рекомендовать курсы
                  </p>
                </div>

                <div className="space-y-2">
                  <Textarea
                    value={characteristic}
                    onChange={(e) => setCharacteristic(e.target.value)}
                    placeholder="Расскажите о своих целях, опыте или чём хотите научиться. Например: «Хочу стать веб-разработчиком, знаю базовый Python, интересуюсь алгоритмами»"
                    className="bg-background border-border resize-none text-sm"
                    rows={5}
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={goBack} className="flex-1">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Назад
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    {loading ? "Создаём..." : "Создать аккаунт"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-sm text-muted-foreground text-center mt-6">
            Уже есть аккаунт?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Войти
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
