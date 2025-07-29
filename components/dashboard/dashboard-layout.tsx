"use client"

import { useState } from "react"
import { DashboardHeader } from "./dashboard-header"
import { DashboardSidebar } from "./dashboard-sidebar"
import { DashboardOverview } from "./dashboard-overview"
import { CleanlifyWorkflow } from "./cleanlify-workflow"
import { ProfilePage } from "./profile-page"
import type { User } from "@/app/page"

interface DashboardLayoutProps {
  user: User
  onLogout: () => void
}

export function DashboardLayout({ user, onLogout }: DashboardLayoutProps) {
  const [currentPage, setCurrentPage] = useState<"dashboard" | "cleanlify" | "profile">("dashboard")

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardOverview user={user} />
      case "cleanlify":
        return <CleanlifyWorkflow />
      case "profile":
        return <ProfilePage user={user} />
      default:
        return <DashboardOverview user={user} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardSidebar currentPage={currentPage} onPageChange={setCurrentPage} onLogout={onLogout} />

      <div className="lg:pl-64">
        <DashboardHeader user={user} onLogout={onLogout} />

        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{renderCurrentPage()}</div>
        </main>
      </div>
    </div>
  )
}
