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
  const [showCategorical, setShowCategorical] = useState(true)
  const [showNumeric, setShowNumeric] = useState(true)
  const [showText, setShowText] = useState(true)
  const [selectedCategoryColumn, setSelectedCategoryColumn] = useState<string>("")
  const [categoriesAsText, setCategoriesAsText] = useState<Set<string>>(new Set())

  const itemsPerPage = 10
  const columnsPerPage = 10

  const categoricalColumns = columns.filter((col) => col.type === "categorical")
  const numericColumns = columns.filter((col) => col.type === "numeric")
  const textColumns = columns.filter((col) => col.type === "text")
  const shortTextColumns = textColumns.filter((col) => col.isShortText)
  const longTextColumns = textColumns.filter((col) => !col.isShortText)

  const importantCategoryColumn = categoricalColumns.find((col) => col.important)
  const mostImportantCategoryColumn = categoricalColumns.find((col) => col.most_important)
  const hasCategoricalColumns = categoricalColumns.length > 0
  const hasImportantCategory = !!importantCategoryColumn

  const allColumnsForDisplay = [...categoricalColumns, ...numericColumns, ...textColumns]
  const totalColumnPages = Math.ceil(allColumnsForDisplay.length / columnsPerPage)
  const paginatedColumns = allColumnsForDisplay.slice((columnPage - 1) * columnsPerPage, columnPage * columnsPerPage)

  const handleTreatAsText = (columnName: string) => {
    setCategoriesAsText((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(columnName)) {
        newSet.delete(columnName)
        // Remove from selected columns when switching back to category treatment
        setSelectedColumns((prevSelected) => prevSelected.filter((name) => name !== columnName))
      } else {
        newSet.add(columnName)
        // Add to selected columns when treating as text
        setSelectedColumns((prevSelected) =>
          prevSelected.includes(columnName) ? prevSelected : [...prevSelected, columnName],
        )
      }
      return newSet
    })
  }

  const handleColumnToggle = (columnName: string) => {
    const column = columns.find((col) => col.name === columnName)

    if (useCategoryApproach === true && column?.type === "categorical") {
      setSelectedCategoryColumn(columnName)
      const allShortTextColumns = shortTextColumns.map((col) => col.name)
      setSelectedColumns([...allShortTextColumns, columnName])
    } else if (useCategoryApproach === false && column?.type === "categorical") {
      setSelectedColumns((prev) =>
        prev.includes(columnName) ? prev.filter((name) => name !== columnName) : [...prev, columnName],
      )
    } else if (column?.type === "text" && column.isShortText) {
      setSelectedColumns((prev) =>
        prev.includes(columnName) ? prev.filter((name) => name !== columnName) : [...prev, columnName],
      )
    }
  }

  const handleSelectAllShortText = () => {
    const visibleShortTextColumns = paginatedColumns.filter((col) => col.type === "text" && col.isShortText)
    const allVisibleShortTextSelected = visibleShortTextColumns.every((col) => selectedColumns.includes(col.name))

    if (allVisibleShortTextSelected) {
      setSelectedColumns((prev) => prev.filter((name) => !visibleShortTextColumns.some((col) => col.name === name)))
    } else {
      const newSelections = visibleShortTextColumns.map((col) => col.name)
      setSelectedColumns((prev) => [...new Set([...prev, ...newSelections])])
    }
  }

  const handleCategoryApproachSelection = (useCategory: boolean) => {
    setUseCategoryApproach(useCategory)
    setCategoriesAsText(new Set())

    if (useCategory && hasCategoricalColumns) {
      const allShortTextColumns = shortTextColumns.map((col) => col.name)
      const categoryColumn = mostImportantCategoryColumn?.name || categoricalColumns[0]?.name
      if (categoryColumn) {
        setSelectedCategoryColumn(categoryColumn)
        setSelectedColumns([...allShortTextColumns, categoryColumn])
      }
    } else {
      setSelectedCategoryColumn("")
      setSelectedColumns([])
    }
  }

  const handleContinue = async () => {
    // if (useCategoryApproach === null) return

    setIsLoading(true)
    try {
      await onContinue(
        selectedColumns,
        useCategoryApproach,
        useCategoryApproach && selectedCategoryColumn ? selectedCategoryColumn : undefined,
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

  const filteredColumns = columns.filter((column) => {
    const matchesSearch = column.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const filteredData = rawData.filter((row) => {
    if (!searchTerm) return true

    return filteredColumns.some((column) => {
      const value = row[column.name]
      return value && String(value).toLowerCase().includes(searchTerm.toLowerCase())
    })
  })

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  useEffect(() => {
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

    let isVisible = true
    if (title === "Categorical Columns") isVisible = showCategorical
    if (title === "Numeric Columns") isVisible = showNumeric
    if (title === "Text Columns") isVisible = showText

    return (
      <div className="space-y-3">
        <div
          className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors"
          onClick={() => {
            if (title === "Categorical Columns") setShowCategorical(!showCategorical)
            if (title === "Numeric Columns") setShowNumeric(!showNumeric)
            if (title === "Text Columns") setShowText(!showText)
          }}
        >
          {icon}
          <h4 className="font-medium text-lg">{title}</h4>
          <Badge variant="secondary">{sectionColumns.length}</Badge>
          <ChevronRight className={`w-4 h-4 transition-transform ${isVisible ? "rotate-90" : ""}`} />
        </div>
        {isVisible && (
          <div className="space-y-3">
            {visibleColumns.map((column) => {
              const isTextSelectable = column.type === "text" && column.isShortText
              const isCategoricalSelectable =
                column.type === "categorical" && (useCategoryApproach === true || useCategoryApproach === false)
              const isSelectable = isTextSelectable || isCategoricalSelectable
              const isSelected = selectedColumns.includes(column.name)
              const isCategorySelected =
                useCategoryApproach === true && column.type === "categorical" && selectedCategoryColumn === column.name
              const isTreatedAsText = categoriesAsText.has(column.name)
              const isRadioDisabled = isTreatedAsText

              return (
                <div
                  key={column.name}
                  className={`flex flex-col space-y-3 p-4 border rounded-lg ${
                    !isSelectable ? "opacity-60 bg-gray-50 dark:bg-gray-800" : ""
                  } ${isCategorySelected ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : ""}`}
                >
                  <div className="flex items-center space-x-4">
                    {useCategoryApproach === true && column.type === "categorical" ? (
                      <input
                        type="radio"
                        id={column.name}
                        name="category-column"
                        checked={selectedCategoryColumn === column.name}
                        onChange={() => handleColumnToggle(column.name)}
                        disabled={isRadioDisabled}
                        className="w-4 h-4"
                      />
                    ) : (
                      <Checkbox
                        id={column.name}
                        checked={isSelected}
                        onCheckedChange={() => handleColumnToggle(column.name)}
                        disabled={!isSelectable}
                      />
                    )}

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-medium">{column.name}</h5>
                        <Badge className={getTypeColor(column.type)}>
                          <span className="flex items-center gap-1">
                            {getTypeIcon(column.type)}
                            {column.type}
                          </span>
                        </Badge>
                        {column.type === "categorical" && column.most_important && (
                          <Badge
                            variant="default"
                            className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                          >
                            <Star className="w-3 h-3 mr-1" />
                            Most Important
                          </Badge>
                        )}
                        {column.type === "categorical" && column.important && !column.most_important && (
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
                        {isTreatedAsText && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            Treated as Free Text
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

                  {/* Moved "Treat as free text" functionality to category approach instead of direct approach */}
                  {useCategoryApproach === true &&
                    column.type === "categorical" &&
                    selectedCategoryColumn !== column.name && (
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTreatAsText(column.name)}
                          className={isTreatedAsText ? "bg-purple-50 border-purple-200 text-purple-700" : ""}
                        >
                          {isTreatedAsText ? "Treat as category" : "Treat as free text"}
                        </Button>
                      </div>
                    )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const getCategoryModeValidation = () => {
    if (useCategoryApproach !== true) return { isValid: true, message: "" }

    const categoryColumnCount = selectedCategoryColumn ? 1 : 0
    const textColumnCount = selectedColumns.filter((col) => {
      const column = columns.find((c) => c.name === col)
      return column?.type === "text" && column.isShortText
    }).length
    const treatedAsTextCount = categoriesAsText.size

    const totalColumns = categoryColumnCount + textColumnCount + treatedAsTextCount

    if (totalColumns < 2) {
      return {
        isValid: false,
        message: "Select at least 2 columns: 1 category column and at least 1 text column to proceed",
      }
    }

    return { isValid: true, message: "" }
  }

  const categoryValidation = getCategoryModeValidation()

  return (
    <div className="space-y-6">
      {/* ... existing summary cards ... */}
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

      {/* ... existing data preview card ... */}
      <Card>
        <CardHeader>
          <CardTitle>Data Preview</CardTitle>
          <CardDescription>Browse your data with search and filtering</CardDescription>
        </CardHeader>
        <CardContent>
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

      {hasCategoricalColumns && hasImportantCategory && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Categorical columns detected!</strong> We recommend you process your data based on the suggested
            important categorical column "{importantCategoryColumn.name}" to get the best results from this process.
          </AlertDescription>
        </Alert>
      )}

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
                  <div className="font-medium">Process with important category (Suggested)</div>
                  <div className="text-sm text-gray-600">
                    Use "{importantCategoryColumn.name}" to structure and improve processing results
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
                    Process all selected columns directly
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="w-4 h-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            It is recommended you process your data using the category '{importantCategoryColumn.name}'
                            to get the best results from this process
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="text-sm text-gray-600">Process selected columns without categorical structuring</div>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Column Analysis</CardTitle>
          <CardDescription>
            {useCategoryApproach === true
              ? "Select one categorical column to process with (radio button selection)"
              : "Review detected columns from your " +
                (fileType?.toUpperCase() || "data") +
                " file and select columns for processing"}
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                Select all visible short text fields for processing
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

          {renderColumnPaginationControls()}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        {onBack && (
          <Button variant="outline" onClick={onBack} size="lg">
            ← Back
          </Button>
        )}
        <div className="flex flex-col items-end gap-2">
          {useCategoryApproach === true && !categoryValidation.isValid && (
            <p className="text-sm text-amber-600 dark:text-amber-400">{categoryValidation.message}</p>
          )}
          <Button
            onClick={handleContinue}
            disabled={
              selectedColumns.length === 0 ||
              (hasCategoricalColumns && hasImportantCategory && useCategoryApproach === null) ||
              (useCategoryApproach === true && !categoryValidation.isValid) ||
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
              `Continue to Processing (${selectedColumns.length} columns selected)`
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}