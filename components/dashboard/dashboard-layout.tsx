"use client"

import type React from "react"

import { DashboardHeader } from "./dashboard-header"
import { DashboardSidebar } from "./dashboard-sidebar"

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface DashboardLayoutProps {
  user: User
  onLogout: () => void
  currentPage: "dashboard" | "cleanlify" | "profile"
  children: React.ReactNode
}

export function DashboardLayout({ user, onLogout, currentPage, children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardSidebar currentPage={currentPage} onLogout={onLogout} />

      <div className="lg:pl-64">
        <DashboardHeader user={user} onLogout={onLogout} />

        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
