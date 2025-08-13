"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Check,
  Edit3,
  ArrowRight,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import type { ColumnInfo } from "@/app/page"

interface ClusterMember {
  value: string
  row_ids: number
  short_text_col: string
}

interface ClusterException {
  index: number
  value: string
}

interface Cluster {
  members: ClusterMember[]
  suggestion: string
  suggestion_mode: string
  confidence: number
  exceptions?: ClusterException[]
}

interface CategoryData {
  [clusterId: string]: Cluster
}

interface GroupedData {
  [categoryName: string]: CategoryData
}

interface CleaningResponse {
  status: string
  useCategory: boolean
  groupedData: GroupedData
}

interface CleaningStepEnhancedProps {
  columns: ColumnInfo[]
  rawData: any[]
  cleaningData: CleaningResponse
  onContinue: (cleaningData: CleaningResponse) => void
  onBack?: () => void
}

export function CleaningStepEnhanced({
  columns,
  rawData,
  cleaningData: initialCleaningData,
  onContinue,
  onBack,
}: CleaningStepEnhancedProps) {
  const [cleaningData, setCleaningData] = useState<CleaningResponse>(initialCleaningData)
  const [editingValues, setEditingValues] = useState<{ [key: string]: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [currentPages, setCurrentPages] = useState<{ [key: string]: number }>({})
  const [expandedClusters, setExpandedClusters] = useState<{ [key: string]: boolean }>({})

  const itemsPerPage = 10

  const getCurrentPage = (tabKey: string) => currentPages[tabKey] || 1

  const setCurrentPage = (tabKey: string, page: number) => {
    setCurrentPages((prev) => ({ ...prev, [tabKey]: page }))
  }

  const toggleClusterExpansion = (categoryName: string, clusterId: string) => {
    const key = `${categoryName}-${clusterId}`
    setExpandedClusters((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const isClusterExpanded = (categoryName: string, clusterId: string) => {
    const key = `${categoryName}-${clusterId}`
    return expandedClusters[key] ?? true // Default to expanded
  }

  const handleCustomEdit = (categoryName: string, clusterId: string, memberIndex: number, customValue: string) => {
    if (!customValue || customValue.trim() === "") return

    setCleaningData((prev) => {
      const newData = { ...prev }
      const cluster = newData.groupedData[categoryName][clusterId]

      // Initialize exceptions array if it doesn't exist
      if (!cluster.exceptions) {
        cluster.exceptions = []
      }

      // Remove existing exception for this index if any
      cluster.exceptions = cluster.exceptions.filter((exc) => exc.index !== memberIndex)

      // Add new exception with custom value
      cluster.exceptions.push({
        index: memberIndex,
        value: customValue,
      })

      return newData
    })

    // Don't clear the editing value - keep it visible
    // setEditingValues((prev) => ({ ...prev, [`${categoryName}-${clusterId}-${memberIndex}`]: "" }))
  }

  const handleRevertToSuggestion = (categoryName: string, clusterId: string, memberIndex: number) => {
    setCleaningData((prev) => {
      const newData = { ...prev }
      const cluster = newData.groupedData[categoryName][clusterId]

      if (cluster.exceptions) {
        // Remove exception for this index to revert to suggestion
        cluster.exceptions = cluster.exceptions.filter((exc) => exc.index !== memberIndex)
      }

      return newData
    })

    // Clear any editing state for this item
    const editKey = `${categoryName}-${clusterId}-${memberIndex}`
    setEditingValues((prev) => {
      const newValues = { ...prev }
      delete newValues[editKey]
      return newValues
    })
  }

  const handleStartEdit = (categoryName: string, clusterId: string, memberIndex: number, currentValue: string) => {
    const editKey = `${categoryName}-${clusterId}-${memberIndex}`
    setEditingValues((prev) => ({
      ...prev,
      [editKey]: currentValue || "",
    }))
  }

  const handleCancelEdit = (categoryName: string, clusterId: string, memberIndex: number) => {
    const editKey = `${categoryName}-${clusterId}-${memberIndex}`
    setEditingValues((prev) => {
      const newValues = { ...prev }
      delete newValues[editKey]
      return newValues
    })
  }

  const getTotalSuggestions = () => {
    let total = 0
    if (!cleaningData || !cleaningData.groupedData) return total
    Object.values(cleaningData.groupedData).forEach((categoryData) => {
      Object.values(categoryData).forEach((cluster) => {
        // Only count non-empty members
        if (cluster.members) {
          total += cluster.members.filter((member) => member.value && member.value.trim() !== "").length
        }
      })
    })
    return total
  }

  const getProcessedSuggestions = () => {
    let processed = 0
    Object.values(cleaningData.groupedData).forEach((categoryData) => {
      Object.values(categoryData).forEach((cluster) => {
        if (cluster.members) {
          // Count all non-empty members as processed (they will all be sent to API)
          processed += cluster.members.filter((member) => member.value && member.value.trim() !== "").length
        }
      })
    })
    return processed
  }

  const handleContinue = async () => {
    setIsLoading(true)
    try {
      // Send the cleaning data back to the API
      console.log("Sending cleaning data:", cleaningData)
      const response = await fetch("http://localhost:8080/apply_cleaning", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleaningData),
      })

      if (!response.ok) {
        throw new Error("Failed to process cleaning data")
      }

      const result = await response.json()
      console.log("Cleaning process completed successfully:", result)
      await onContinue(result)
    } catch (error) {
      console.error("Failed to continue:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const renderPaginationControls = (tabKey: string, totalItems: number) => {
    const currentPage = getCurrentPage(tabKey)
    const totalPages = Math.ceil(totalItems / itemsPerPage)

    if (totalPages <= 1) return null

    const startItem = (currentPage - 1) * itemsPerPage + 1
    const endItem = Math.min(currentPage * itemsPerPage, totalItems)

    return (
      <div className="flex items-center justify-between mt-4 pt-4 border-t">
        <div className="text-sm text-gray-600">
          Showing {startItem} to {endItem} of {totalItems} items
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(tabKey, 1)} disabled={currentPage === 1}>
            <ChevronsLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(tabKey, Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded">
            {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(tabKey, Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(tabKey, totalPages)}
            disabled={currentPage === totalPages}
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }

  const getExceptionValue = (cluster: Cluster, memberIndex: number): string | null => {
    if (!cluster.exceptions) return null
    const exception = cluster.exceptions.find((exc) => exc.index === memberIndex)
    return exception ? exception.value : null
  }

  const renderClusterContent = (categoryName: string, categoryData: CategoryData) => {
    const clusters = Object.entries(categoryData)
    const currentPage = getCurrentPage(categoryName)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedClusters = clusters.slice(startIndex, endIndex)

    // console.log('Cat data', categoryName, categoryData);

    return (
      <div className="space-y-4">
        {paginatedClusters.map(([clusterId, cluster]) => {
          // Filter out empty members for display but keep them in the data
          const displayMembers = cluster.members?.filter((member) => member.value && member.value.trim() !== "")

          // Skip clusters with no displayable members
          if (!displayMembers || displayMembers.length === 0) return null

          const isExpanded = isClusterExpanded(categoryName, clusterId)

          return (
            <div key={clusterId} className="border rounded-lg">
              {/* Cluster Header - Always Visible */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => toggleClusterExpansion(categoryName, clusterId)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h5 className="font-medium text-lg">Cluster: {clusterId}</h5>
                    <Badge variant="outline" className="text-xs">
                      {displayMembers.length} items
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Suggestion: <span className="font-medium">{cluster.suggestion}</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {cluster.suggestion_mode}
                    </Badge>
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {Math.round(cluster.confidence * 100)}% confidence
                    </Badge>
                  </p>
                </div>
                <Button variant="ghost" size="sm">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>

              {/* Cluster Content - Collapsible */}
              {isExpanded && (
                <div className="border-t p-4">
                  <div className="space-y-3">
                    {displayMembers.map((member, displayIndex) => {
                      // Find the original index in the full members array
                      const originalIndex = cluster.members?.findIndex(
                        (m) =>
                          m.value === member.value &&
                          m.row_ids === member.row_ids &&
                          m.short_text_col === member.short_text_col,
                      )

                      if (originalIndex === undefined || originalIndex === -1) return null

                      const editKey = `${categoryName}-${clusterId}-${originalIndex}`
                      const exceptionValue = getExceptionValue(cluster, originalIndex)
                      const hasException = exceptionValue !== null
                      const finalValue = hasException ? exceptionValue : cluster.suggestion
                      const isEditing = editingValues[editKey] !== undefined

                      return (
                        <div
                          key={`${originalIndex}-${displayIndex}`}
                          className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-600 mb-1">Original</p>
                                <p className="font-mono text-sm bg-red-50 dark:bg-red-950 p-2 rounded">
                                  {member.value}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Row: {member.row_ids} | Column: {member.short_text_col}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600 mb-1">
                                  {hasException ? "Custom Value" : "Suggested"}
                                </p>
                                {isEditing ? (
                                  <div className="flex gap-2">
                                    <Input
                                      value={editingValues[editKey]}
                                      onChange={(e) =>
                                        setEditingValues((prev) => ({
                                          ...prev,
                                          [editKey]: e.target.value,
                                        }))
                                      }
                                      className="text-sm"
                                      placeholder="Enter custom value"
                                      autoFocus
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleCustomEdit(categoryName, clusterId, originalIndex, editingValues[editKey])
                                      }
                                      title="Apply custom value"
                                    >
                                      <Check className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleCancelEdit(categoryName, clusterId, originalIndex)}
                                      title="Cancel edit"
                                    >
                                      ✕
                                    </Button>
                                  </div>
                                ) : (
                                  <p
                                    className={`font-mono text-sm p-2 rounded ${
                                      hasException ? "bg-green-50 dark:bg-green-950" : "bg-blue-50 dark:bg-blue-950"
                                    }`}
                                  >
                                    {finalValue}
                                  </p>
                                )}
                              </div>
                            </div>

                            {!isEditing && (
                              <div className="flex items-center gap-2">
                                <ArrowRight className="w-4 h-4 text-gray-400" />
                                <div className="flex gap-1">
                                  {hasException && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleRevertToSuggestion(categoryName, clusterId, originalIndex)}
                                      title="Revert to suggested value"
                                    >
                                      <RotateCcw className="w-4 h-4" />
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStartEdit(categoryName, clusterId, originalIndex, finalValue)}
                                    title="Edit value"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {clusters.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No cleaning suggestions for this category.</p>
            <p className="text-sm">The data appears to be already clean!</p>
          </div>
        )}

        {/* Pagination Controls */}
        {renderPaginationControls(categoryName, clusters.length)}
      </div>
    )
  }

  // Get tab names based on useCategory
  const tabNames = cleaningData.useCategory ? Object.keys(cleaningData.groupedData) : columns.map((col) => col.name)

  const getTabItemCount = (tabName: string) => {
    if (cleaningData.useCategory) {
      return Object.keys(cleaningData.groupedData[tabName] || {}).length
    } else {
      // For column cleaning, count clusters in the column
      return Object.keys(cleaningData.groupedData[tabName] || {}).length
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Cleaning Progress</h3>
              <p className="text-gray-600">All {getTotalSuggestions()} items will be processed when you continue</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">Ready</div>
              <p className="text-sm text-gray-600">
                {cleaningData.groupedData &&
                Object.values(cleaningData.groupedData).reduce(
                  (total, categoryData) =>
                    total +
                    Object.values(categoryData).reduce(
                      (catTotal, cluster) => catTotal + (cluster.exceptions?.length || 0),
                      0,
                    ),
                  0,
                )}{" "}
                custom edits
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Column/Category Cleaning */}
      <Card>
        <CardHeader>
          <CardTitle>{cleaningData.useCategory ? "Category Cleaning" : "Column Cleaning"}</CardTitle>
          <CardDescription>
            Review and edit cleaning suggestions for each {cleaningData.useCategory ? "category" : "column"}. Click on
            cluster headers to expand/collapse. All items will be processed with their final values when you continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={tabNames[0]} className="w-full">
            {/* Wrapping tabs for many categories/columns */}
            <div className="mb-6">
              <TabsList className="h-auto p-1 bg-muted rounded-md flex flex-wrap gap-1">
                {tabNames.map((tabName) => {
                  // const itemCount = cleaningData
                  //   ? Object.keys(cleaningData.groupedData[tabName] || {}).length
                  //   : 0
                  const itemCount = getTabItemCount(tabName)
                  return (
                    <TabsTrigger
                      key={tabName}
                      value={tabName}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                    >
                      <span className="truncate max-w-[100px]">{tabName}</span>
                      <Badge variant="secondary" className="text-xs">
                        {itemCount}
                      </Badge>
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </div>

            {tabNames.map((tabName) => (
              <TabsContent key={tabName} value={tabName} className="space-y-4 mt-6">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Cleaning suggestions for "{tabName}"</h4>
                </div>

                {cleaningData.groupedData[tabName] ? (
                  renderClusterContent(tabName, cleaningData.groupedData[tabName])
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>
                      No cleaning suggestions available for this {cleaningData.useCategory ? "category" : "column"}.
                    </p>
                    <p className="text-sm">The data appears to be already clean!</p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        {onBack && (
          <Button variant="outline" onClick={onBack} size="lg">
            ← Back
          </Button>
        )}
        <Button onClick={handleContinue} disabled={isLoading} size="lg" className="ml-auto">
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            "Preview Cleaned Data"
          )}
        </Button>
      </div>
    </div>
  )
}