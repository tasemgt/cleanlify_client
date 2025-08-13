"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  BarChart3,
  Database,
  Type,
  Search,
  Loader2,
  Info,
  Star,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import type { ColumnInfo } from "@/app/page"

interface PreviewStepEnhancedProps {
  columns: ColumnInfo[]
  rawData: any[]
  fileType?: string
  selectedColumns?: string[]
  onContinue: (selectedColumns: string[], useCategory: boolean, categoryColumn?: string) => void
  onBack?: () => void
}

export function PreviewStepEnhanced({
  columns,
  rawData,
  fileType,
  selectedColumns: initialSelectedColumns = [],
  onContinue,
  onBack,
}: PreviewStepEnhancedProps) {
  const [selectedColumns, setSelectedColumns] = useState<string[]>(initialSelectedColumns)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [useCategoryApproach, setUseCategoryApproach] = useState<boolean | null>(null)
  const [columnPage, setColumnPage] = useState(1)

  const itemsPerPage = 10
  const columnsPerPage = 10

  // Categorize columns
  const categoricalColumns = columns.filter((col) => col.type === "categorical")
  const numericColumns = columns.filter((col) => col.type === "numeric")
  const textColumns = columns.filter((col) => col.type === "text")
  const shortTextColumns = textColumns.filter((col) => col.isShortText)
  const longTextColumns = textColumns.filter((col) => !col.isShortText)

  // Find important categorical column
  const importantCategoryColumn = categoricalColumns.find((col) => col.important)
  const hasCategoricalColumns = categoricalColumns.length > 0
  const hasImportantCategory = !!importantCategoryColumn

  // Get all columns for pagination
  const allColumnsForDisplay = [...categoricalColumns, ...numericColumns, ...textColumns]
  const totalColumnPages = Math.ceil(allColumnsForDisplay.length / columnsPerPage)
  const paginatedColumns = allColumnsForDisplay.slice((columnPage - 1) * columnsPerPage, columnPage * columnsPerPage)

  const handleColumnToggle = (columnName: string) => {
    const column = columns.find((col) => col.name === columnName)
    // Only allow selection of short text columns
    if (column?.type === "text" && column.isShortText) {
      setSelectedColumns((prev) =>
        prev.includes(columnName) ? prev.filter((name) => name !== columnName) : [...prev, columnName],
      )
    }
  }

  const handleSelectAllShortText = () => {
    const visibleShortTextColumns = paginatedColumns.filter((col) => col.type === "text" && col.isShortText)
    const allVisibleShortTextSelected = visibleShortTextColumns.every((col) => selectedColumns.includes(col.name))

    if (allVisibleShortTextSelected) {
      // Remove all visible short text columns from selection
      setSelectedColumns((prev) => prev.filter((name) => !visibleShortTextColumns.some((col) => col.name === name)))
    } else {
      // Add all visible short text columns to selection
      const newSelections = visibleShortTextColumns.map((col) => col.name)
      setSelectedColumns((prev) => [...new Set([...prev, ...newSelections])])
    }
  }

  const handleCategoryApproachSelection = (useCategory: boolean) => {
    setUseCategoryApproach(useCategory)
    if (useCategory && hasImportantCategory) {
      // Auto-select all short text columns and the important category column when using category approach
      const allShortTextColumns = shortTextColumns.map((col) => col.name)
      const categoryColumn = importantCategoryColumn.name
      setSelectedColumns([...allShortTextColumns, categoryColumn])
    } else {
      // Clear selections when not using category approach
      setSelectedColumns([])
    }
  }

  const handleContinue = async () => {
    // if (!useCategoryApproach) return
    
    setIsLoading(true)
    try {
      await onContinue(
        selectedColumns,
        useCategoryApproach,
        useCategoryApproach && importantCategoryColumn ? importantCategoryColumn.name : undefined,
      )
    } catch (error) {
      console.error("Failed to continue:", error)
    } finally {
      setIsLoading(false)
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

  // Filter columns for data preview (search only)
  const filteredColumns = columns.filter((column) => {
    const matchesSearch = column.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  // Filter and paginate data based on search term
  const filteredData = rawData.filter((row) => {
    if (!searchTerm) return true

    return filteredColumns.some((column) => {
      const value = row[column.name]
      return value && String(value).toLowerCase().includes(searchTerm.toLowerCase())
    })
  })

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  // Add this useEffect after the existing state declarations
  useEffect(() => {
    // Auto-select category approach if there are categorical columns and important category
    if (hasCategoricalColumns && hasImportantCategory && useCategoryApproach === null) {
      handleCategoryApproachSelection(true)
    }
  }, [hasCategoricalColumns, hasImportantCategory, useCategoryApproach])

  const renderColumnPaginationControls = () => {
    if (totalColumnPages <= 1) return null

    return (
      <div className="flex items-center justify-between mt-4 pt-4 border-t">
        <div className="text-sm text-gray-600">
          Showing {Math.min((columnPage - 1) * columnsPerPage + 1, allColumnsForDisplay.length)} to{" "}
          {Math.min(columnPage * columnsPerPage, allColumnsForDisplay.length)} of {allColumnsForDisplay.length} columns
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setColumnPage(1)} disabled={columnPage === 1}>
            <ChevronsLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setColumnPage(Math.max(1, columnPage - 1))}
            disabled={columnPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded">
            {columnPage} of {totalColumnPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setColumnPage(Math.min(totalColumnPages, columnPage + 1))}
            disabled={columnPage === totalColumnPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setColumnPage(totalColumnPages)}
            disabled={columnPage === totalColumnPages}
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }

  const renderColumnSection = (title: string, sectionColumns: ColumnInfo[], icon: React.ReactNode) => {
    const visibleColumns = sectionColumns.filter((col) => paginatedColumns.includes(col))
    if (visibleColumns.length === 0) return null

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {icon}
          <h4 className="font-medium text-lg">{title}</h4>
          <Badge variant="secondary">{sectionColumns.length}</Badge>
        </div>
        <div className="space-y-3">
          {visibleColumns.map((column) => {
            const isSelectable = column.type === "text" && column.isShortText
            const isSelected = selectedColumns.includes(column.name)
            const isCategorySelected = useCategoryApproach === true && column.type === "categorical" && column.important

            return (
              <div
                key={column.name}
                className={`flex items-center space-x-4 p-4 border rounded-lg ${
                  !isSelectable && !isCategorySelected ? "opacity-60 bg-gray-50 dark:bg-gray-800" : ""
                } ${isCategorySelected ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : ""}`}
              >
                <Checkbox
                  id={column.name}
                  checked={isSelected || isCategorySelected}
                  onCheckedChange={() => handleColumnToggle(column.name)}
                  disabled={!isSelectable || isCategorySelected}
                />

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="font-medium">{column.name}</h5>
                    <Badge className={getTypeColor(column.type)}>
                      <span className="flex items-center gap-1">
                        {getTypeIcon(column.type)}
                        {column.type}
                      </span>
                    </Badge>
                    {column.type === "categorical" && column.important && (
                      <Badge
                        variant="default"
                        className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      >
                        <Star className="w-3 h-3 mr-1" />
                        Important
                      </Badge>
                    )}
                    {column.type === "text" && (
                      <Badge variant={column.isShortText ? "default" : "secondary"}>
                        {column.isShortText ? "Short Text" : "Long Text"}
                      </Badge>
                    )}
                    {isCategorySelected && (
                      <Badge variant="default" className="bg-blue-600">
                        Selected for Processing
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
            )
          })}
        </div>
      </div>
    )
  }

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
              <Database className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{categoricalColumns.length}</p>
                <p className="text-sm text-gray-600">Categorical Columns</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Type className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">
                  {textColumns.length}
                  <span className="text-sm text-gray-500 ml-1">({shortTextColumns.length} short)</span>
                </p>
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
      </div>

      {/* Data Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Data Preview</CardTitle>
          <CardDescription>Browse your data with search and filtering</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search Controls */}
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
                {paginatedData.length > 0 ? (
                  paginatedData.map((row, index) => (
                    <TableRow key={index}>
                      {filteredColumns.map((column) => (
                        <TableCell key={column.name} className="max-w-xs truncate">
                          {row[column.name] || "-"}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={filteredColumns.length} className="text-center py-8 text-gray-500">
                      {searchTerm ? "No matching data found" : "No data available"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-600">
              {filteredData.length > 0 ? (
                <>
                  Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredData.length)} to{" "}
                  {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} rows
                  {searchTerm && ` (filtered from ${rawData.length} total)`}
                </>
              ) : (
                "No data to display"
              )}
            </p>
            {totalPages > 1 && (
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
            )}
          </div>
        </CardContent>
      </Card>

      {/* Categorical Column Detection Alert */}
      {hasCategoricalColumns && hasImportantCategory && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Categorical columns detected!</strong> We recommend you clean your data based on the suggested
            important categorical column "{importantCategoryColumn.name}" to get the best results from this process.
          </AlertDescription>
        </Alert>
      )}

      {/* Processing Approach Selection */}
      {hasCategoricalColumns && hasImportantCategory && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Approach</CardTitle>
            <CardDescription>Choose how you want to process your data cleaning</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="use-category"
                  name="processing-approach"
                  checked={useCategoryApproach === true}
                  onChange={() => handleCategoryApproachSelection(true)}
                  className="w-4 h-4"
                />
                <label htmlFor="use-category" className="flex-1 cursor-pointer">
                  <div className="font-medium">Clean with important category (Recommended)</div>
                  <div className="text-sm text-gray-600">
                    Use "{importantCategoryColumn.name}" to structure and improve cleaning results
                  </div>
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="no-category"
                  name="processing-approach"
                  checked={useCategoryApproach === false}
                  onChange={() => handleCategoryApproachSelection(false)}
                  className="w-4 h-4"
                />
                <label htmlFor="no-category" className="flex-1 cursor-pointer">
                  <div className="font-medium flex items-center gap-2">
                    Clean columns directly
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="w-4 h-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            It is recommended you clean your data using the category '{importantCategoryColumn.name}' to
                            get the best results from this process
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="text-sm text-gray-600">Clean selected columns without categorical structuring</div>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Column Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Column Analysis</CardTitle>
          <CardDescription>
            Review detected columns from your {fileType?.toUpperCase() || "data"} file and select short text fields for
            cleaning
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Select All Short Text Checkbox - only show when not using category approach or no category approach selected */}
          {(useCategoryApproach === false || useCategoryApproach === null) && shortTextColumns.length > 0 && (
            <div className="flex items-center space-x-2 mb-6 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Checkbox
                id="select-all-short-text"
                checked={paginatedColumns
                  .filter((col) => col.type === "text" && col.isShortText)
                  .every((col) => selectedColumns.includes(col.name))}
                onCheckedChange={handleSelectAllShortText}
              />
              <label htmlFor="select-all-short-text" className="text-sm font-medium">
                Select all visible short text fields for cleaning
              </label>
            </div>
          )}

          <div className="space-y-8">
            {renderColumnSection(
              "Categorical Columns",
              categoricalColumns,
              <Database className="w-5 h-5 text-blue-600" />,
            )}
            {renderColumnSection("Numeric Columns", numericColumns, <BarChart3 className="w-5 h-5 text-green-600" />)}
            {renderColumnSection("Text Columns", textColumns, <Type className="w-5 h-5 text-purple-600" />)}
          </div>

          {/* Column Pagination Controls */}
          {renderColumnPaginationControls()}
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
          onClick={handleContinue}
          disabled={
            selectedColumns.length === 0 ||
            (hasCategoricalColumns && hasImportantCategory && useCategoryApproach === null) ||
            isLoading
          }
          size="lg"
          className="ml-auto"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            `Continue to Cleaning (${selectedColumns.length} columns selected)`
          )}
        </Button>
      </div>
    </div>
  )
}