import { create } from "zustand";
import type { ExamAnswerResponse, ExamQuestion } from "@/api/exam";

interface ExamState {
  examId: string | null;
  courseId: number | null;
  currentQuestion: ExamQuestion | null;
  results: ExamAnswerResponse["evaluation"][];
  questionTexts: string[];
  answers: string[];
  completed: boolean;
  questionCount: number;
  currentIndex: number;

  startExam: (examId: string, courseId: number, question: ExamQuestion, questionCount: number) => void;
  addResult: (evaluation: ExamAnswerResponse["evaluation"], questionText: string, answer: string, nextQuestion?: ExamQuestion) => void;
  complete: () => void;
  reset: () => void;
}

export const useExamStore = create<ExamState>((set) => ({
  examId: null,
  courseId: null,
  currentQuestion: null,
  results: [],
  questionTexts: [],
  answers: [],
  completed: false,
  questionCount: 0,
  currentIndex: 0,

  startExam: (examId, courseId, question, questionCount) =>
    set({
      examId,
      courseId,
      currentQuestion: question,
      results: [],
      questionTexts: [],
      answers: [],
      completed: false,
      questionCount,
      currentIndex: 0,
    }),

  addResult: (evaluation, questionText, answer, nextQuestion) =>
    set((s) => ({
      results: [...s.results, evaluation],
      questionTexts: [...s.questionTexts, questionText],
      answers: [...s.answers, answer],
      currentQuestion: nextQuestion ?? null,
      currentIndex: s.currentIndex + 1,
    })),

  complete: () => set({ completed: true, currentQuestion: null }),
  reset: () =>
    set({
      examId: null,
      courseId: null,
      currentQuestion: null,
      results: [],
      questionTexts: [],
      answers: [],
      completed: false,
      questionCount: 0,
      currentIndex: 0,
    }),
}));
