"use client"

import { useNavigate } from "react-router-dom"
import { GraduationCap, BookOpen, Users, Award, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const Index = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-hero">
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="text-center max-w-4xl mx-auto animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-gradient-primary rounded-3xl shadow-lg shadow-primary/20 mb-8 animate-pulse">
            <GraduationCap className="w-10 h-10 md:w-12 md:h-12 text-primary-foreground" />
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight text-balance">
            Personal Agentic Assistant
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto text-pretty">
            Современная образовательная платформа с AI-поддержкой для студентов и преподавателей
          </p>

          <Button
            variant="gradient"
            size="xl"
            onClick={() => navigate("/auth")}
            className="shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 group"
          >
            Войти в систему
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-20 md:pb-32">
        <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          <div className="group text-center p-6 rounded-2xl bg-card/50 backdrop-blur border border-border hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-lg">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4 group-hover:bg-primary/20 transition-colors">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">Управление курсами</h3>
            <p className="text-muted-foreground leading-relaxed">
              Полный контроль над курсами, лабораторными работами и материалами
            </p>
          </div>

          <div className="group text-center p-6 rounded-2xl bg-card/50 backdrop-blur border border-border hover:border-accent/50 transition-all duration-300 hover:scale-105 hover:shadow-lg">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/10 rounded-2xl mb-4 group-hover:bg-accent/20 transition-colors">
              <Users className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">AI Ассистент</h3>
            <p className="text-muted-foreground leading-relaxed">
              Персональный AI помощник для каждого курса и студента
            </p>
          </div>

          <div className="group text-center p-6 rounded-2xl bg-card/50 backdrop-blur border border-border hover:border-primary-light/50 transition-all duration-300 hover:scale-105 hover:shadow-lg">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-light/10 rounded-2xl mb-4 group-hover:bg-primary-light/20 transition-colors">
              <Award className="w-8 h-8 text-primary-light" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">Автоматическое тестирование</h3>
            <p className="text-muted-foreground leading-relaxed">Система тестирования знаний с мгновенной проверкой</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Index
