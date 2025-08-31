"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface Clean {
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
  cleanIndex: number
}

interface CleanSummaryViewProps {
  clean: Clean
}

export function CleanSummaryView({ clean }: CleanSummaryViewProps) {
  const router = useRouter()
  const [selectedColumn, setSelectedColumn] = useState(clean.summaries[0]?.column || "")

  const selectedSummary = clean.summaries.find((s) => s.column === selectedColumn) || clean.summaries[0]

  // Prepare chart data
  const chartData = selectedSummary
    ? [
        { name: "Majority", value: selectedSummary.num_of_majority, fill: "#3b82f6" },
        { name: "PySpell Checker", value: selectedSummary.num_of_spell_check, fill: "#10b981" },
        { name: "Singles", value: selectedSummary.total_num_of_single, fill: "#f59e0b" },
        { name: "Global Custom", value: selectedSummary.num_of_global_manual, fill: "#ef4444" },
        { name: "Google KG", value: selectedSummary.num_of_gkg, fill: "#8b5cf6" },
        { name: "LLM (Gemini)", value: selectedSummary.num_of_llm, fill: "#06b6d4" },
      ]
    : []

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Cleaning Summary</h1>
          <p className="text-gray-600 dark:text-gray-400">{clean.file_name}</p>
        </div>
      </div>

      {/* Column Selection and Info */}
      <Card>
        <CardHeader>
          <CardTitle>{clean.cleaning_mode.slice(0,1)[0].toUpperCase()+clean.cleaning_mode.slice(1)} Cleaning Analysis</CardTitle>
          <CardDescription>Select a {clean.cleaning_mode} to view detailed cleaning suggestions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">{clean.cleaning_mode.slice(0,1)[0].toUpperCase()+clean.cleaning_mode.slice(1)}:</label>
              <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  {clean.summaries.map((summary) => (
                    <SelectItem key={summary.column} value={summary.column}>
                      {summary.column}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Clean Mode:</span>
              <Badge variant="outline">{clean.cleaning_mode}</Badge>
            </div>
          </div>

          {selectedSummary && (
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Acceptance Ratio:</span>
                <Badge variant="secondary">{+selectedSummary.acceptance_ratio.toFixed(2)}%</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Clusters Created:</span>
                <Badge variant="outline">{selectedSummary.num_of_clusters}</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Cleaning Suggestions Distribution</CardTitle>
          <CardDescription>Breakdown of different cleaning methods applied to {selectedColumn}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Additional Stats */}
      {selectedSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{selectedSummary.total_values}</p>
                <p className="text-sm text-gray-600">Total Values</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{selectedSummary.num_of_before_unique}</p>
                <p className="text-sm text-gray-600">Before Unique</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{selectedSummary.num_of_after_unique}</p>
                <p className="text-sm text-gray-600">After Unique</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{selectedSummary.manual_corrections}</p>
                <p className="text-sm text-gray-600">Manual Corrections</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
