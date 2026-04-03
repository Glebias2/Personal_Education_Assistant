import { Outlet } from "react-router-dom"
import Sidebar from "@/components/layout/Sidebar"

export default function StudentLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
