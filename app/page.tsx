"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoginPage } from "@/components/auth/login-page"
import { SignupPage } from "@/components/auth/signup-page"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

export interface ColumnInfo {
  name: string
  type: "numeric" | "categorical" | "text"
  missingCount: number
  uniqueCount: number
  sampleValues: string[]
  isShortText?: boolean // New property for text columns
  important?: boolean // New property for categorical columns
}

export interface CleaningMapping {
  original: string
  suggested: string
  accepted: boolean
  userDefined?: string
}

export interface CleaningData {
  [columnName: string]: CleaningMapping[]
}

export default function CleanlifyApp() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [authMode, setAuthMode] = useState<"login" | "signup">("login")
  const router = useRouter()

  useEffect(() => {
    // Redirect to login page by default if no user is present
    if (!currentUser) {
      router.push("/login")
    }
  }, [currentUser, router])

  const handleLogin = (email: string, password: string) => {
    // Mock login - in production, this would call your authentication API
    const mockUser: User = {
      id: "1",
      name: "Dr. Sarah Johnson",
      email: email,
      avatar: "/placeholder.svg?height=40&width=40&text=SJ",
    }
    setCurrentUser(mockUser)
  }

  const handleSignup = (name: string, email: string, password: string) => {
    // Mock signup - in production, this would call your authentication API
    const mockUser: User = {
      id: "1",
      name: name,
      email: email,
      avatar:
        "/placeholder.svg?height=40&width=40&text=" +
        name
          .split(" ")
          .map((n) => n[0])
          .join(""),
    }
    setCurrentUser(mockUser)
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setAuthMode("login")
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        {authMode === "login" ? (
          <LoginPage onLogin={handleLogin} onSwitchToSignup={() => setAuthMode("signup")} />
        ) : (
          <SignupPage onSignup={handleSignup} onSwitchToLogin={() => setAuthMode("login")} />
        )}
      </div>
    )
  }

  return <DashboardLayout user={currentUser} onLogout={handleLogout} />
}
