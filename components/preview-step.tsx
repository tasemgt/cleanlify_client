"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, BarChart3, Database, Type } from "lucide-react"
import type { ColumnInfo } from "@/app/page"
import { domains } from "@/data/domains" // Declare the domains variable

interface PreviewStepProps {
  columns: ColumnInfo[]
  rawData: any[]
  fileType?: string
  onContinue: (selectedColumns: string[], domain: string) => void
  onBack?: () => void
}

export function PreviewStep({ columns, rawData, fileType, onContinue, onBack }: PreviewStepProps) {
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [selectedDomain, setSelectedDomain] = useState<string>("")

  const handleColumnToggle = (columnName: string) => {
    setSelectedColumns((prev) =>
      prev.includes(columnName) ? prev.filter((name) => name !== columnName) : [...prev, columnName],
    )
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "numeric":
        return <BarChart3 className="w-4 h-4" />
      case "categorical":
        return <Database className="w-4 h-4" />
      case "text":
        return <Type className="w-4 h-4" />
      default:
        return <Type className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "numeric":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "categorical":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "text":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const textColumns = columns.filter((col) => col.type === "text")
  const problematicColumns = columns.filter((col) => col.isProblematic)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{rawData.length}</p>
                <p className="text-sm text-gray-600">Total Rows</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Type className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{textColumns.length}</p>
                <p className="text-sm text-gray-600">Text Columns</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{problematicColumns.length}</p>
                <p className="text-sm text-gray-600">Needs Cleaning</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Column Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Column Analysis</CardTitle>
          <CardDescription>
            Review detected columns from your {fileType?.toUpperCase() || "data"} file and select text fields that need
            cleaning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {columns.map((column) => (
              <div key={column.name} className="flex items-center space-x-4 p-4 border rounded-lg">
                <Checkbox
                  id={column.name}
                  checked={selectedColumns.includes(column.name)}
                  onCheckedChange={() => handleColumnToggle(column.name)}
                  disabled={column.type !== "text"}
                />

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{column.name}</h4>
                    <Badge className={getTypeColor(column.type)}>
                      <span className="flex items-center gap-1">
                        {getTypeIcon(column.type)}
                        {column.type}
                      </span>
                    </Badge>
                    {column.isProblematic && (
                      <Badge variant="destructive">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Needs Cleaning
                      </Badge>
                    )}
                  </div>

                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      Missing values: {column.missingCount} | Unique values: {column.uniqueCount}
                    </p>
                    <p>Sample values: {column.sampleValues.join(", ")}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Data Preview</CardTitle>
          <CardDescription>First 5 rows of your data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column.name}>{column.name}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rawData.slice(0, 5).map((row, index) => (
                  <TableRow key={index}>
                    {columns.map((column) => (
                      <TableCell key={column.name} className="max-w-xs truncate">
                        {row[column.name] || "-"}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Domain Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Context Selection</CardTitle>
          <CardDescription>Choose your domain to get better cleaning suggestions</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedDomain} onValueChange={setSelectedDomain}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select your domain/context" />
            </SelectTrigger>
            <SelectContent>
              {domains.map((domain) => (
                <SelectItem key={domain.value} value={domain.value}>
                  {domain.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        {onBack && (
          <Button variant="outline" onClick={onBack} size="lg">
            ← Back
          </Button>
        )}
        <Button
          onClick={() => onContinue(selectedColumns, selectedDomain)}
          disabled={selectedColumns.length === 0 || !selectedDomain}
          size="lg"
          className="ml-auto"
        >
          Continue to Cleaning ({selectedColumns.length} columns selected)
        </Button>
      </div>
    </div>
  )
}
