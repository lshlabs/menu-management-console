import type { ReactNode } from "react"
import { Toaster } from "sonner"
import { AppSidebar } from "@/components/app-sidebar"

export default function ConsoleLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Toaster position="top-right" richColors />
      <AppSidebar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  )
}
