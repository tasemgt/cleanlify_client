"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart3, FileText, TrendingUp, Clock, CheckCircle } from "lucide-react"
import type { User } from "@/app/page"

interface DashboardOverviewProps {
  user: User
}

export function DashboardOverview({ user }: DashboardOverviewProps) {
  // Mock data - in production, this would come from your API
  const stats = {
    totalFiles: 24,
    cleanedFiles: 18,
    totalRecords: 125000,
    cleanedRecords: 98500,
    mostCleanedDomain: "Healthcare",
    avgCleaningTime: "3.2 min",
    successRate: 94,
  }

  const recentFiles = [
    {
      name: "survey_responses_2024.csv",
      status: "completed",
      domain: "Healthcare",
      cleanedAt: "2 hours ago",
      records: 5420,
    },
    {
      name: "customer_feedback.json",
      status: "in_progress",
      domain: "Consumer",
      cleanedAt: "1 day ago",
      records: 2100,
    },
    { name: "research_data.xlsx", status: "completed", domain: "Education", cleanedAt: "3 days ago", records: 8900 },
    { name: "market_analysis.csv", status: "failed", domain: "Finance", cleanedAt: "1 week ago", records: 1200 },
  ]

  const domainStats = [
    { domain: "Healthcare", files: 8, percentage: 33 },
    { domain: "Education", files: 6, percentage: 25 },
    { domain: "Consumer", files: 4, percentage: 17 },
    { domain: "Finance", files: 3, percentage: 13 },
    { domain: "Technology", files: 3, percentage: 12 },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back, {user.name.split(" ")[0]}!</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">Here's an overview of your data cleaning activities</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Files</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalFiles}</p>
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
                <p className="text-3xl font-bold text-green-600">{stats.cleanedFiles}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Records</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.totalRecords.toLocaleString()}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
                <p className="text-3xl font-bold text-green-600">{stats.successRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Files */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Files</CardTitle>
            <CardDescription>Your latest data cleaning activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{file.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {file.domain}
                      </Badge>
                      <span className="text-xs text-gray-500">{file.records.toLocaleString()} records</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        file.status === "completed"
                          ? "default"
                          : file.status === "in_progress"
                            ? "secondary"
                            : "destructive"
                      }
                      className="text-xs"
                    >
                      {file.status.replace("_", " ")}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">{file.cleanedAt}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Domain Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Domain Distribution</CardTitle>
            <CardDescription>Files cleaned by research domain</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {domainStats.map((domain, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{domain.domain}</span>
                    <span className="text-sm text-gray-500">{domain.files} files</span>
                  </div>
                  <Progress value={domain.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to get you started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
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
