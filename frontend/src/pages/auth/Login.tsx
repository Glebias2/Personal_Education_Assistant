import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore, type UserRole } from "@/store/authStore";
import { authApi } from "@/api/auth";
import { toast } from "sonner";

export default function Login() {
  const [role, setRole] = useState<UserRole>("student");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const authLogin = useAuthStore((s) => s.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (role === "student") {
        const res = await authApi.studentLogin(login, password);
        if (res.success && res.student_id) {
          const profile = await authApi.getStudent(res.student_id);
          authLogin("student", res.student_id, `${profile.first_name} ${profile.last_name}`);
          navigate("/student/dashboard");
        } else {
          toast.error("Неверный логин или пароль");
        }
      } else {
        const res = await authApi.teacherLogin(login, password);
        if (res.success && res.teacher_id) {
          const profile = await authApi.getTeacher(res.teacher_id);
          authLogin("teacher", res.teacher_id, `${profile.first_name} ${profile.last_name}`);
          navigate("/teacher/dashboard");
        } else {
          toast.error("Неверный логин или пароль");
        }
      }
    } catch {
      toast.error("Ошибка авторизации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      {/* Background effects */}
      <div className="fixed top-[-30%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/8 blur-[100px]" />

      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="font-heading text-3xl text-foreground">EduAI</span>
        </Link>

        {/* Card */}
        <div className="p-8 rounded-2xl bg-surface border border-border">
          <h1 className="font-heading text-3xl text-foreground text-center mb-2">
            Вход
          </h1>
          <p className="text-sm text-muted-foreground text-center mb-8">
            Войдите в свой аккаунт
          </p>

          <Tabs value={role} onValueChange={(v) => setRole(v as UserRole)} className="mb-6">
            <TabsList className="w-full bg-background">
              <TabsTrigger value="student" className="flex-1">Студент</TabsTrigger>
              <TabsTrigger value="teacher" className="flex-1">Преподаватель</TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login">Логин</Label>
              <Input
                id="login"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="Введите логин"
                required
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                required
                className="bg-background border-border"
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
              {loading ? "Вход..." : "Войти"}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-6">
            Нет аккаунта?{" "}
            <Link to="/register" className="text-primary hover:underline">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
