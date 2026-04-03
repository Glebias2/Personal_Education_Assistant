import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "@/features/auth/AuthContext"
import ProtectedRoute from "@/components/layout/ProtectedRoute"

import LandingPage from "@/pages/landing/LandingPage"
import AuthPage from "@/pages/auth/AuthPage"

import StudentLayout from "@/pages/student/StudentLayout"
import StudentDashboard from "@/pages/student/dashboard/StudentDashboard"
import StudentCatalog from "@/pages/student/catalog/StudentCatalog"

import CourseLayout from "@/pages/student/course/CourseLayout"
import CourseOverview from "@/pages/student/course/CourseOverview"
import CourseLabs from "@/pages/student/course/CourseLabs"
import CourseTesting from "@/pages/student/course/CourseTesting"
import CourseExam from "@/pages/student/course/CourseExam"
import CourseChat from "@/pages/student/course/CourseChat"
import CourseMaterials from "@/pages/student/course/CourseMaterials"

import TeacherLayout from "@/pages/teacher/TeacherLayout"
import TeacherDashboard from "@/pages/teacher/dashboard/TeacherDashboard"
import TeacherCourseShell from "@/pages/teacher/course/TeacherCourseShell"
import CourseOverviewTeacher from "@/pages/teacher/course/CourseOverviewTeacher"
import CourseLabsTeacher from "@/pages/teacher/course/CourseLabsTeacher"
import CourseFilesTeacher from "@/pages/teacher/course/CourseFilesTeacher"
import CourseStudentsTeacher from "@/pages/teacher/course/CourseStudentsTeacher"
import CourseRequestsTeacher from "@/pages/teacher/course/CourseRequestsTeacher"
import CourseReportsTeacher from "@/pages/teacher/course/CourseReportsTeacher"
import CourseAnalyticsTeacher from "@/pages/teacher/course/CourseAnalyticsTeacher"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster position="top-right" richColors />
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />

              {/* Student */}
              <Route element={<ProtectedRoute role="student" />}>
                <Route element={<StudentLayout />}>
                  <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
                  <Route path="/student/dashboard" element={<StudentDashboard />} />
                  <Route path="/student/courses" element={<StudentCatalog />} />
                  <Route path="/student/course/:courseId" element={<CourseLayout />}>
                    <Route index element={<Navigate to="overview" replace />} />
                    <Route path="overview" element={<CourseOverview />} />
                    <Route path="labs" element={<CourseLabs />} />
                    <Route path="testing" element={<CourseTesting />} />
                    <Route path="exam" element={<CourseExam />} />
                    <Route path="chat" element={<CourseChat />} />
                    <Route path="materials" element={<CourseMaterials />} />
                  </Route>
                </Route>
              </Route>

              {/* Teacher */}
              <Route element={<ProtectedRoute role="teacher" />}>
                <Route element={<TeacherLayout />}>
                  <Route path="/teacher" element={<Navigate to="/teacher/dashboard" replace />} />
                  <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
                  <Route path="/teacher/course/:courseId" element={<TeacherCourseShell />}>
                    <Route index element={<Navigate to="overview" replace />} />
                    <Route path="overview" element={<CourseOverviewTeacher />} />
                    <Route path="labs" element={<CourseLabsTeacher />} />
                    <Route path="files" element={<CourseFilesTeacher />} />
                    <Route path="students" element={<CourseStudentsTeacher />} />
                    <Route path="requests" element={<CourseRequestsTeacher />} />
                    <Route path="reports" element={<CourseReportsTeacher />} />
                    <Route path="analytics" element={<CourseAnalyticsTeacher />} />
                  </Route>
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
