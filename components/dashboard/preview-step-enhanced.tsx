"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { AlertTriangle, BarChart3, Database, Type, Search } from "lucide-react"
import type { ColumnInfo } from "@/app/page"

interface PreviewStepEnhancedProps {
  columns: ColumnInfo[]
  rawData: any[]
  fileType?: string
  onContinue: (selectedColumns: string[], domain: string) => void
  onBack?: () => void
}

const domains = [
  { value: "general", label: "General" },
  { value: "healthcare", label: "Healthcare" },
  { value: "education", label: "Education" },
  { value: "finance", label: "Finance" },
  { value: "technology", label: "Technology" },
  { value: "marketing", label: "Marketing" },
]

export function PreviewStepEnhanced({ columns, rawData, fileType, onContinue, onBack }: PreviewStepEnhancedProps) {
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [selectedDomain, setSelectedDomain] = useState<string>("")
  const [showFieldType, setShowFieldType] = useState<"all" | "numeric" | "text">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectAll, setSelectAll] = useState(false)

  const itemsPerPage = 10

  const handleColumnToggle = (columnName: string) => {
    setSelectedColumns((prev) =>
      prev.includes(columnName) ? prev.filter((name) => name !== columnName) : [...prev, columnName],
    )
  }

  const handleSelectAll = () => {
    const textColumns = filteredColumns.filter((col) => col.type === "text")
    if (selectAll) {
      setSelectedColumns([])
      setSelectAll(false)
    } else {
      setSelectedColumns(textColumns.map((col) => col.name))
      setSelectAll(true)
    }
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

  // Filter columns based on type and search
  const filteredColumns = columns.filter((column) => {
    const matchesType = showFieldType === "all" || column.type === showFieldType
    const matchesSearch = column.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesType && matchesSearch
  })

  // Filter and paginate data
  const filteredData = rawData.filter((row) =>
    Object.values(row).some((value) => String(value).toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const textColumns = columns.filter((col) => col.type === "text")
  const numericColumns = columns.filter((col) => col.type === "numeric")
  const problematicColumns = columns.filter((col) => col.isProblematic)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <BarChart3 className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{numericColumns.length}</p>
                <p className="text-sm text-gray-600">Numeric Columns</p>
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

      {/* Data Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Data Preview</CardTitle>
          <CardDescription>Browse your data with search and filtering</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search data..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={showFieldType}
              onValueChange={(value: "all" | "numeric" | "text") => setShowFieldType(value)}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fields</SelectItem>
                <SelectItem value="numeric">Numeric Fields</SelectItem>
                <SelectItem value="text">Text Fields</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {filteredColumns.map((column) => (
                    <TableHead key={column.name}>{column.name}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((row, index) => (
                  <TableRow key={index}>
                    {filteredColumns.map((column) => (
                      <TableCell key={column.name} className="max-w-xs truncate">
                        {row[column.name] || "-"}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-600">
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredData.length)} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} rows
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
          {/* Select All Checkbox */}
          <div className="flex items-center space-x-2 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Checkbox id="select-all" checked={selectAll} onCheckedChange={handleSelectAll} />
            <label htmlFor="select-all" className="text-sm font-medium">
              Select all text fields for cleaning
            </label>
          </div>

          <div className="space-y-4">
            {filteredColumns.map((column) => (
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
