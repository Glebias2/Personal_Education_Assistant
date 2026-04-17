import { Outlet, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { Sidebar } from "./Sidebar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export function AppLayout() {
  const { isAuthenticated, role } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Sidebar />
          <main className="pl-60">
            <div className="p-6 max-w-7xl mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
        <Toaster richColors position="bottom-right" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export function AuthLayout() {
  const { isAuthenticated, role } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to={role === "teacher" ? "/teacher/dashboard" : "/student/dashboard"} replace />;
  }

  return (
    <>
      <Outlet />
      <Toaster richColors position="bottom-right" />
    </>
  );
}
