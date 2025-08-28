"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { DashboardOverview } from "@/components/dashboard/dashboard-overview"

interface User {
  id: number
  name: string
  email: string
  job_title: string
  location: string
  organisation: string
  bio: string
  create_date: string
  member_plan: string
  profession: string
  avatar?: string
  cleans?: Array<{
    file_name: string
    cleaning_mode: string
    acceptance_ratio: number
    clean_date: string
    summaries: Array<{
      column: string
      total_values: number
      num_of_before_unique: number
      num_of_after_unique: number
      manual_corrections: number
      num_of_clusters: number
      num_of_majority: number
      total_num_of_single: number
      num_of_spell_check: number
      num_of_global_manual: number
      num_of_gkg: number
      num_of_llm: number
      acceptance_ratio: number
    }>
  }>
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    } else {
      router.push("/login")
    }
    setLoading(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("selectedClean")
    router.push("/login")
  }

  const handleRefresh = async () => {
    if (!user) return

    try {
      setLoading(true)
      const response = await fetch(`http://localhost:8080/cleans_all?user_id=${user.id}`)

      if (response.ok) {
        const cleansData = await response.json()

        // Update user object with new cleans data
        const updatedUser = {
          ...user,
          cleans: cleansData.cleans || cleansData, // Handle different response structures
        }

        // Update localStorage and state
        localStorage.setItem("user", JSON.stringify(updatedUser))
        setUser(updatedUser)
      } else {
        console.error("Failed to fetch cleans data")
      }
    } catch (error) {
      console.error("Error refreshing cleans data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <DashboardLayout user={user} onLogout={handleLogout} currentPage="dashboard">
      <DashboardOverview user={user} onRefresh={handleRefresh} />
    </DashboardLayout>
  )
}