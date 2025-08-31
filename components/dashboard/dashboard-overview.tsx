"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart3, FileText, TrendingUp, Clock, CheckCircle, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

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

interface DashboardOverviewProps {
  user: User
  onRefresh?: () => Promise<void>
}

export function DashboardOverview({ user, onRefresh }: DashboardOverviewProps) {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const cleans = user.cleans || []
  const totalFiles = cleans.length
  const cleanedFiles = cleans.length // All files in cleans array are considered cleaned

  // Calculate average acceptance ratio
  const avgAcceptanceRatio =
    cleans.length > 0
      ? +(cleans.reduce((sum, clean) => sum + clean.acceptance_ratio, 0) / cleans.length).toFixed(2)
      : 0

  // Calculate total values from all summaries
  const totalValues = cleans.reduce((total, clean) => {
    return total + clean.summaries.reduce((sum, summary) => sum + summary.total_values, 0)
  }, 0)

  // Helper function to calculate time ago
  const getTimeAgo = (dateString: string) => {
    const cleanDate = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - cleanDate.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`
    }
  }

  const recentCleans = [...cleans]
    .sort((a, b) => new Date(b.clean_date).getTime() - new Date(a.clean_date).getTime())
    .slice(0, 6) // Show up to 6 recent files

  const handleSeeSummary = (cleanIndex: number) => {
    // Store the selected clean data in localStorage for the summary page
    localStorage.setItem(
      "selectedClean",
      JSON.stringify({
        ...cleans[cleanIndex],
        cleanIndex,
      }),
    )
    router.push("/dashboard/summary")
  }

  const handleRefreshClick = async () => {
    if (onRefresh) {
      setIsRefreshing(true)
      await onRefresh()
      setIsRefreshing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back, {user.name.split(" ")[0]}!</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Here's an overview of your data cleaning activities</p>
        </div>
        {/* Refresh Button */}
        <Button
          onClick={handleRefreshClick}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 bg-transparent"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Files</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalFiles}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Cleaned Files</p>
                <p className="text-3xl font-bold text-green-600">{cleanedFiles}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Values</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalValues.toLocaleString()}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Acceptance Rate</p>
                <p className="text-3xl font-bold text-green-600">{avgAcceptanceRatio}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Files */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Files</CardTitle>
          <CardDescription>Your latest data cleaning activities</CardDescription>
        </CardHeader>
        <CardContent>
          {recentCleans.length > 0 ? (
            <div className="space-y-4">
              {recentCleans.map((clean, index) => {
                const totalValues = clean.summaries.reduce((sum, summary) => sum + summary.total_values, 0)
                const cleanIndex = cleans.findIndex(
                  (c) => c.file_name === clean.file_name && c.clean_date === clean.clean_date,
                )
                return (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">Dataset: {clean.file_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {clean.cleaning_mode}
                        </Badge>
                        <span className="text-xs text-gray-500">{totalValues.toLocaleString()} values</span>
                        <Badge variant="secondary" className="text-xs">
                          {+clean.acceptance_ratio.toFixed(2)}% acceptance
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <Badge variant="default" className="text-xs">
                          completed
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">{getTimeAgo(clean.clean_date)}</p>
                      </div>
                      <Button size="sm" className="bg-blue-100 hover:bg-blue-200 text-blue-800" variant="outline" onClick={() => handleSeeSummary(cleanIndex)}>
                        See Summary
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No cleaning activities yet</p>
              <p className="text-sm">Start by uploading and cleaning your first file</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to get you started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer" onClick={() => router.push("/cleanlify")}>
              <FileText className="h-8 w-8 text-blue-600 mb-2" />
              <h3 className="font-medium">Upload New File</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Start cleaning a new dataset</p>
            </div>

            <div className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
              <BarChart3 className="h-8 w-8 text-green-600 mb-2" />
              <h3 className="font-medium">View Analytics</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Analyze your cleaning patterns</p>
            </div>

            <div className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
              <Clock className="h-8 w-8 text-purple-600 mb-2" />
              <h3 className="font-medium">Recent Projects</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Continue where you left off</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}