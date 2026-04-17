import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Brain, Shield, Zap, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Brain,
    title: "AI-верификация",
    desc: "Отчёты проверяются тремя AI-оценщиками с голосованием",
  },
  {
    icon: Zap,
    title: "Генерация тестов",
    desc: "Тесты создаются AI на основе материалов курса",
  },
  {
    icon: Shield,
    title: "AI-экзаменатор",
    desc: "Устный экзамен с адаптивными вопросами и оценкой",
  },
  {
    icon: BookOpen,
    title: "RAG-ассистент",
    desc: "Чат с AI по материалам курса для подготовки",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Noise overlay */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-50"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")" }}
      />

      {/* Gradient orbs */}
      <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/8 blur-[100px]" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="font-heading text-2xl text-foreground">EduAI</span>
        </div>
        <div className="flex gap-3">
          <Link to="/login">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              Войти
            </Button>
          </Link>
          <Link to="/register">
            <Button className="bg-primary hover:bg-primary/90">
              Регистрация
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center text-center pt-24 pb-20 px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-surface text-sm text-muted-foreground mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Образовательная платформа БГУИР
          </div>
        </motion.div>

        <motion.h1
          className="text-6xl md:text-7xl lg:text-8xl font-heading text-foreground leading-[0.95] max-w-4xl"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          Учитесь с{" "}
          <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
            интеллектом
          </span>
        </motion.h1>

        <motion.p
          className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
        >
          AI-ассистент для курсов, тестов, экзаменов и лабораторных работ.
          Персональный подход к каждому студенту.
        </motion.p>

        <motion.div
          className="mt-10 flex gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Link to="/register">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-base px-8 gap-2 shadow-lg shadow-primary/25">
              Начать обучение <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline" className="text-base px-8 border-border hover:bg-surface">
              Войти
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 pb-24">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="group p-6 rounded-2xl bg-surface border border-border hover:border-primary/30 transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-heading text-lg text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
