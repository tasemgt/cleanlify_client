"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
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
  RefreshCw,
  Network,
  Zap,
  Layers,
  Brain,
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
  categoryColumn?: string
}

interface CleaningStepEnhancedProps {
  columns: ColumnInfo[]
  rawData: any[]
  cleaningData: CleaningResponse
  selectedColumns: ColumnInfo[]
  categoryColumn?: string
  onContinue: (cleaningData: CleaningResponse) => void
  onBack?: () => void
}

const matchModeOptions = [
  { value: "ratio", label: "Strict Match (Order-sensitive)" },
  { value: "token_sort_ratio", label: "Matches short phrases (Order-insensitive)" },
  { value: "token_set_ratio", label: "Matches word/phrases as subsets" },
  { value: "partial_token_sort_ratio", label: "Matches phrases with extra words" },
]

function CleaningStepEnhanced({
  cleaningData,
  onBack,
  onContinue,
  columns,
  rawData,
  selectedColumns,
}: CleaningStepEnhancedProps) {
  const { toast } = useToast()

  const [currentCleaningData, setCurrentCleaningData] = useState<CleaningResponse>(cleaningData)
  const [editingValues, setEditingValues] = useState<{ [key: string]: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [currentPages, setCurrentPages] = useState<{ [key: string]: number }>({})
  const [expandedClusters, setExpandedClusters] = useState<{ [key: string]: boolean }>({})
  const [clusterCustomValues, setClusterCustomValues] = useState<{ [key: string]: string }>({})
  const [originalSuggestions, setOriginalSuggestions] = useState<{ [key: string]: string }>({})
  const [originalSuggestionMode, setOriginalSuggestionMode] = useState<{ [key: string]: string }>({})
  const [llmPrompts, setLlmPrompts] = useState<{ [key: string]: string }>({})
  const [googleKgLoadingStates, setGoogleKgLoadingStates] = useState<{ [key: string]: boolean }>({})
  const [llmLoadingStates, setLlmLoadingStates] = useState<{ [key: string]: boolean }>({})
  const [similarityThreshold, setSimilarityThreshold] = useState([75])
  const [matchMode, setMatchMode] = useState("ratio")
  const [isRematching, setIsRematching] = useState(false)
  const [isMLClustering, setIsMLClustering] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("")

  useEffect(() => {
    setCurrentCleaningData(cleaningData)
  }, [cleaningData])

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
    return expandedClusters[key] ?? true
  }

  const handleRematchClusters = async (mlMode = false) => {
    mlMode? setIsMLClustering(true) : setIsRematching(true)
    try {
      const baseEndpoint = cleaningData.useCategory ? "group_by_category" : "group_in_column"
      
      let endpoint = `http://localhost:8080/${baseEndpoint}`
      
      if (mlMode) {
        endpoint += "?ml_mode=true"
      } else {
        endpoint += `?threshold=${similarityThreshold[0]}&match_mode=${matchMode}`
      }

      const payload = {
        rawData,
        selectedColumns,
        useCategory: cleaningData.useCategory,
        categoryColumn: cleaningData.categoryColumn || null,
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error("Failed to rematch clusters")
      }

      const result = await response.json()

      console.log("Rematch clusters result:", result)

      setCurrentCleaningData(result)

      if (result.groupedData && Object.keys(result.groupedData).length > 0) {
        const newTabNames = result.useCategory ? Object.keys(result.groupedData) : columns?.map((col) => col.name) || []
        if (newTabNames.length > 0) {
          setActiveTab(newTabNames[0])
        }
      }

      setOriginalSuggestions({})
      setOriginalSuggestionMode({})
      setClusterCustomValues({})
      setEditingValues({})
      setCurrentPages({})

      toast({
        title: "Success",
        description: mlMode ? "Clusters rematched successfully using ML!" : "Clusters rematched successfully with new similarity settings!",
      })
    } catch (error) {
      console.error("Failed to rematch clusters:", error)
      toast({
        title: "Error",
        description: "Failed to rematch clusters. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRematching(false)
      setIsMLClustering(false)
    }
  }

  const handleCustomEdit = (categoryName: string, clusterId: string, memberIndex: number, customValue: string) => {
    if (!customValue || customValue.trim() === "") return

    setCurrentCleaningData((prev) => {
      const cluster = prev.groupedData[categoryName][clusterId]
      const existingExceptions = cluster.exceptions || []

      // Remove existing exception for this member if it exists
      const filteredExceptions = existingExceptions.filter((exc) => exc.index !== memberIndex)

      // Add new exception
      const newExceptions = [...filteredExceptions, { index: memberIndex, value: customValue.trim() }]

      return {
        ...prev,
        groupedData: {
          ...prev.groupedData,
          [categoryName]: {
            ...prev.groupedData[categoryName],
            [clusterId]: {
              ...prev.groupedData[categoryName][clusterId],
              exceptions: newExceptions,
            },
          },
        },
      }
    })

    // Clear editing state
    const editKey = `${categoryName}-${clusterId}-${memberIndex}`
    setEditingValues((prev) => {
      const newValues = { ...prev }
      delete newValues[editKey]
      return newValues
    })

    toast({
      title: "Success",
      description: "Custom value applied successfully!",
    })
  }

  const handleRevertToSuggestion = (categoryName: string, clusterId: string, memberIndex: number) => {
    setCurrentCleaningData((prev) => {
      const cluster = prev.groupedData[categoryName][clusterId]
      const existingExceptions = cluster.exceptions || []

      // Remove exception for this member
      const filteredExceptions = existingExceptions.filter((exc) => exc.index !== memberIndex)

      return {
        ...prev,
        groupedData: {
          ...prev.groupedData,
          [categoryName]: {
            ...prev.groupedData[categoryName],
            [clusterId]: {
              ...prev.groupedData[categoryName][clusterId],
              exceptions: filteredExceptions.length > 0 ? filteredExceptions : undefined,
            },
          },
        },
      }
    })

    const editKey = `${categoryName}-${clusterId}-${memberIndex}`
    setEditingValues((prev) => {
      const newValues = { ...prev }
      delete newValues[editKey]
      return newValues
    })

    toast({
      title: "Success",
      description: "Reverted to suggested value!",
    })
  }

  const getTotalSuggestions = () => {
    if (!currentCleaningData?.groupedData) return 0

    let total = 0
    Object.values(currentCleaningData.groupedData).forEach((categoryData) => {
      Object.values(categoryData).forEach((cluster) => {
        if (cluster.members) {
          total += cluster.members.filter((member) => member.value && member.value.trim() !== "").length
        }
      })
    })
    return total
  }

  const handleContinue = async () => {
    console.log("Current Cleaning Data on Continue:", currentCleaningData)
    setIsLoading(true)
    try {
      const response = await fetch("http://localhost:8080/apply_cleaning", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(currentCleaningData),
      })

      if (!response.ok) {
        throw new Error("Failed to process cleaning data")
      }

      const result = await response.json()

      console.log("Cleaning data processed result:", result)

      toast({
        title: "Success",
        description: "Data cleaned successfully!",
      })
      await onContinue(result)
    } catch (error) {
      console.error("Failed to continue:", error)
      toast({
        title: "Error",
        description: "Failed to process cleaning data. Please try again.",
        variant: "destructive",
      })
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

  const handleClusterCustomValue = (categoryName: string, clusterId: string, customValue: string) => {
    if (!customValue || customValue.trim() === "") return

    const clusterKey = `${categoryName}-${clusterId}`

    setOriginalSuggestions((prev) => {
      if (!prev[clusterKey]) {
        return {
          ...prev,
          [clusterKey]: currentCleaningData.groupedData[categoryName][clusterId].suggestion,
        }
      }
      return prev
    });

    setOriginalSuggestionMode((prev) => {
      if (!prev[clusterKey]) {
        return {
          ...prev,
          [clusterKey]: currentCleaningData.groupedData[categoryName][clusterId].suggestion_mode,
        }
      }
      return prev
    });

    setCurrentCleaningData((prev) => ({
      ...prev,
      groupedData: {
        ...prev.groupedData,
        [categoryName]: {
          ...prev.groupedData[categoryName],
          [clusterId]: {
            ...prev.groupedData[categoryName][clusterId],
            suggestion: customValue.trim(),
            suggestion_mode: "custom",
          },
        },
      },
    }))

    setClusterCustomValues((prev) => ({ ...prev, [clusterKey]: "" }))

    toast({
      title: "Success",
      description: "Custom value applied to cluster successfully!",
    })
  }

  const handleRestoreOriginalSuggestion = (categoryName: string, clusterId: string) => {
    const clusterKey = `${categoryName}-${clusterId}`
    const originalSuggestion = originalSuggestions[clusterKey]
      const originalMode = originalSuggestionMode[clusterKey]

    if (originalSuggestion) {
      setCurrentCleaningData((prev) => ({
        ...prev,
        groupedData: {
          ...prev.groupedData,
          [categoryName]: {
            ...prev.groupedData[categoryName],
            [clusterId]: {
              ...prev.groupedData[categoryName][clusterId],
              suggestion: originalSuggestion,
              suggestion_mode: originalMode || "suggested",
            },
          },
        },
      }))

      setOriginalSuggestions((prev) => {
        const newSuggestions = { ...prev }
        delete newSuggestions[clusterKey]
        return newSuggestions
      });

      setOriginalSuggestionMode((prev) => {
        const newModes = { ...prev }
        delete newModes[clusterKey]
        return newModes
      });

      toast({
        title: "Success",
        description: "Original suggestion restored successfully!",
      })
    }
  }

  const handleGoogleKgSuggestion = async (categoryName: string, clusterId: string) => {
    const clusterKey = `${categoryName}-${clusterId}`
    setGoogleKgLoadingStates((prev) => ({ ...prev, [clusterKey]: true }))

    try {
      const cluster = currentCleaningData.groupedData[categoryName][clusterId]

      setOriginalSuggestions((prev) => {
        if (!prev[clusterKey]) {
          return {
            ...prev,
            [clusterKey]: cluster.suggestion,
          }
        }
        return prev
      })
      
      setOriginalSuggestionMode((prev) => {
        if (!prev[clusterKey]) {
          return {
            ...prev,
            [clusterKey]: cluster.suggestion_mode,
          }
        }
        return prev
      })

      const payload = {
        members: cluster.members.map((member) => member.value),
      }

      const response = await fetch("http://localhost:8080/use_google_kg", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error("Failed to get Google KG suggestion")
      }

      const result = await response.json()

      if (result.suggestion) {
        setCurrentCleaningData((prev) => ({
          ...prev,
          groupedData: {
            ...prev.groupedData,
            [categoryName]: {
              ...prev.groupedData[categoryName],
              [clusterId]: {
                ...prev.groupedData[categoryName][clusterId],
                suggestion: result.suggestion,
                suggestion_mode: "google_kg",
              },
            },
          },
        }))
      }

      toast({
        title: "Success",
        description: "Knowledge Graph suggestion applied successfully!",
      })
    } catch (error) {
      console.error("Failed to get Google KG suggestion:", error)
      toast({
        title: "Error",
        description: "Failed to get Knowledge Graph suggestion. Please try again.",
        variant: "destructive",
      })
    } finally {
      setGoogleKgLoadingStates((prev) => ({ ...prev, [clusterKey]: false }))
    }
  }

  const handleLlmSuggestion = async (categoryName: string, clusterId: string) => {
    const clusterKey = `${categoryName}-${clusterId}`
    const prompt = llmPrompts[clusterKey]

    if (!prompt || prompt.trim() === "") {
      toast({
        title: "Prompt Required",
        description: "Please enter a context prompt for the LLM suggestion.",
        variant: "destructive",
      })
      return
    }

    setLlmLoadingStates((prev) => ({ ...prev, [clusterKey]: true }))

    try {
      const cluster = currentCleaningData.groupedData[categoryName][clusterId]

      setOriginalSuggestions((prev) => {
        if (!prev[clusterKey]) {
          return {
            ...prev,
            [clusterKey]: cluster.suggestion,
          }
        }
        return prev
      });

      setOriginalSuggestionMode((prev) => {
        if (!prev[clusterKey]) {
          return {
            ...prev,
            [clusterKey]: cluster.suggestion_mode,
          }
        }
        return prev
      });

      const payload = {
        prompt: prompt,
        members: cluster.members.map((member) => member.value),
      }

      const response = await fetch("http://localhost:8080/use_llm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error("Failed to get LLM suggestion")
      }

      const result = await response.json()

      if (result.suggestion) {
        setCurrentCleaningData((prev) => ({
          ...prev,
          groupedData: {
            ...prev.groupedData,
            [categoryName]: {
              ...prev.groupedData[categoryName],
              [clusterId]: {
                ...prev.groupedData[categoryName][clusterId],
                suggestion: result.suggestion,
                suggestion_mode: "llm_suggest",
              },
            },
          },
        }))
      }

      toast({
        title: "Success",
        description: "LLM suggestion applied successfully!",
      })
    } catch (error) {
      console.error("Failed to get LLM suggestion:", error)
      toast({
        title: "Error",
        description: "Failed to get LLM suggestion. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLlmLoadingStates((prev) => ({ ...prev, [clusterKey]: false }))
    }
  }

  const handleCancelEdit = (categoryName: string, clusterId: string, memberIndex: number) => {
    const editKey = `${categoryName}-${clusterId}-${memberIndex}`
    setEditingValues((prev) => {
      const newValues = { ...prev }
      delete newValues[editKey]
      return newValues
    })
  }

  const handleStartEdit = (categoryName: string, clusterId: string, memberIndex: number, finalValue: string) => {
    const editKey = `${categoryName}-${clusterId}-${memberIndex}`
    setEditingValues((prev) => ({ ...prev, [editKey]: finalValue }))
  }

  const renderClusterContent = (categoryName: string, categoryData: CategoryData) => {
    const clusters = Object.entries(categoryData)
    const currentPage = getCurrentPage(categoryName)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedClusters = clusters.slice(startIndex, endIndex)

    return (
      <div className="space-y-4">
        {paginatedClusters.map(([clusterId, cluster]) => {
          const displayMembers = cluster.members?.filter((member) => member.value && member.value.trim() !== "")

          if (!displayMembers || displayMembers.length === 0) return null

          const isExpanded = isClusterExpanded(categoryName, clusterId)
          const clusterKey = `${categoryName}-${clusterId}`
          const isGoogleKgLoading = googleKgLoadingStates[clusterKey]
          const isLlmLoading = llmLoadingStates[clusterKey]
          const showConfidenceBadge = cluster.suggestion_mode === "suggested"

          return (
            <div key={clusterId} className="border rounded-lg">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h5 className="font-medium text-lg">Cluster: {clusterId}</h5>
                      <Badge variant="outline" className="text-xs">
                        {displayMembers.length} items
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Suggestion: <span className="font-medium">{cluster.suggestion}</span>
                      <Badge variant="outline" className="ml-2 text-xs bg-yellow-100 text-white-800">
                        {cluster.suggestion_mode}
                      </Badge>
                      {showConfidenceBadge && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {Math.round(cluster.confidence * 100)}% confidence
                        </Badge>
                      )}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => toggleClusterExpansion(categoryName, clusterId)}>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
                    <h6 className="font-medium text-sm mb-3">Get Cluster suggestions with advanced tools</h6>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGoogleKgSuggestion(categoryName, clusterId)}
                          disabled={isGoogleKgLoading}
                          title="Use Knowledge Graph for suggestions"
                          className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300"
                        >
                          {isGoogleKgLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Network className="w-4 h-4" />
                          )}
                          Use Knowledge Graph
                        </Button>

                        <div className="h-8 w-0.5 bg-gray-400 dark:bg-gray-500" />

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLlmSuggestion(categoryName, clusterId)}
                          disabled={isLlmLoading || !llmPrompts[clusterKey]?.trim()}
                          title="Use LLM for suggestions"
                          className="flex items-center gap-2 bg-green-100 hover:bg-green-200 text-green-800 border-green-300"
                        >
                          {isLlmLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                          Use LLM
                        </Button>

                        <div className="flex-1">
                          <Input
                            placeholder="Enter context prompt for LLM"
                            value={llmPrompts[clusterKey] || ""}
                            onChange={(e) => setLlmPrompts((prev) => ({ ...prev, [clusterKey]: e.target.value }))}
                            className="text-sm h-8"
                          />
                        </div>
                      </div>

                      <p className="text-xs text-gray-500">For example: This is a famous car brand</p>
                    </div>
                  </div>

                  <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
                    <h6 className="font-medium text-sm mb-3">Manual Custom value for cluster</h6>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Input
                          placeholder="Enter custom value for all items in this cluster"
                          value={clusterCustomValues[clusterKey] || ""}
                          onChange={(e) => {
                            setClusterCustomValues((prev) => ({ ...prev, [clusterKey]: e.target.value }))
                          }}
                          className="text-sm h-8"
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={() =>
                          handleClusterCustomValue(categoryName, clusterId, clusterCustomValues[clusterKey])
                        }
                        disabled={!clusterCustomValues[clusterKey]?.trim()}
                        title="Apply custom value to all items in cluster"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestoreOriginalSuggestion(categoryName, clusterId)}
                      title="Restore original suggestion"
                      className="flex items-center gap-2"
                      disabled={!originalSuggestions[clusterKey]}
                    >
                      <RotateCcw className="w-4 h-4" />
                      Restore original
                    </Button>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t p-4">
                  <div className="space-y-3">
                    {displayMembers.map((member, displayIndex) => {
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
                                      className="text-sm h-8"
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
                                <Button variant="ghost" size="sm">
                                  <ArrowRight className="w-4 h-4 text-gray-400" />
                                </Button>
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

        {renderPaginationControls(categoryName, clusters.length)}
      </div>
    )
  }

  const tabNames =
    currentCleaningData?.useCategory && currentCleaningData?.groupedData
      ? Object.keys(currentCleaningData.groupedData)
      : columns?.map((col) => col.name) || []

  const getTabItemCount = (tabName: string) => {
    if (!currentCleaningData?.groupedData) return 0

    if (currentCleaningData.useCategory) {
      return Object.keys(currentCleaningData.groupedData[tabName] || {}).length
    } else {
      return Object.keys(currentCleaningData.groupedData[tabName] || {}).length
    }
  }

  useEffect(() => {
    if (tabNames.length > 0 && !activeTab) {
      setActiveTab(tabNames[0])
    }
  }, [tabNames, activeTab])

  return (
    <div className="space-y-6">
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
                {currentCleaningData?.groupedData
                  ? Object.values(currentCleaningData.groupedData).reduce(
                      (total, categoryData) =>
                        total +
                        Object.values(categoryData).reduce(
                          (catTotal, cluster) => catTotal + (cluster.exceptions?.length || 0),
                          0,
                        ),
                      0,
                    )
                  : 0}{" "}
                custom edits
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{currentCleaningData?.useCategory ? "Category Cleaning" : "Column Cleaning"}</CardTitle>
          <CardDescription>
            Review and edit cleaning suggestions for each {currentCleaningData?.useCategory ? "category" : "column"}.
            Click on cluster headers to expand/collapse. All items will be processed with their final values when you
            continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5" />
              <h4 className="font-medium">Manage Clusters</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Similarity sensitivity, 100 is perfect match
                </label>
                <div className="px-3">
                  <input
                    type="range"
                    value={similarityThreshold[0]}
                    onChange={(e) => setSimilarityThreshold([parseInt(e.target.value)])}
                    min="0"
                    max="100"
                    step="5"
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${similarityThreshold[0]}%, #e5e7eb ${similarityThreshold[0]}%, #e5e7eb 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0 (Loose)</span>
                    <span className="font-medium bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                      {similarityThreshold[0]}
                    </span>
                    <span>100 (Exact)</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Matching Algorithm</label>
                <Select value={matchMode} onValueChange={setMatchMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {matchModeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Button
                  onClick={() => handleRematchClusters()}
                  disabled={isRematching}
                  className="w-full bg-transparent bg-green-100 hover:bg-green-200 border-green-300"
                  variant="outline"
                >
                  {isRematching ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Rematching...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Rematch clusters
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            <hr className="my-4" />
            
            <label className="text-sm font-medium">
              Re-cluster using Machine Learning
            </label>
            <div className="flex justify-start">
              <Button
                onClick={() => handleRematchClusters(true)}
                disabled={isMLClustering}
                className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300"
                variant="outline"
              >
                {isMLClustering ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Clustering...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2"/>
                    Cluster using ML
                  </>
                )}
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="mb-6">
              <TabsList className="h-auto p-1 bg-muted rounded-md flex flex-wrap gap-1">
                {tabNames.map((tabName) => {
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

            {activeTab && (
              <TabsContent key={activeTab} value={activeTab} className="space-y-4 mt-6">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Cleaning suggestions for "{activeTab}"</h4>
                </div>

                {currentCleaningData?.groupedData?.[activeTab] ? (
                  renderClusterContent(activeTab, currentCleaningData.groupedData[activeTab])
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>
                      No cleaning suggestions available for this{" "}
                      {currentCleaningData?.useCategory ? "category" : "column"}.
                    </p>
                    <p className="text-sm">The data appears to be already clean!</p>
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>

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

// Export both default and named export for compatibility
export default CleaningStepEnhanced
export { CleaningStepEnhanced }