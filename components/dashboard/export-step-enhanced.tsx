"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Download, RotateCcw, CheckCircle, BarChart3, ChevronLeft, ChevronRight, Search, X } from "lucide-react"

interface ExportStepProps {
  originalData: any[]
  cleaningData: {
    cleanedData: any[]
    originalData: any[]
    status: string
    acceptance_ratio: number
    useCategory?: boolean
    summary: Array<{
      column: string
      num_of_before_unique: number
      num_of_after_unique: number
      num_of_clusters: number
      num_of_majority: number
      total_num_of_single: number
      num_of_spell_check: number
      num_of_global_manual: number
      num_of_gkg: number
      num_of_llm: number
      acceptance_ratio: number
      total_values: number
      manual_corrections: number
    }>
  }
  selectedColumns: string[]
  fileName: string
  onRestart: () => void
  onBack?: () => void
}

export function ExportStepEnhanced({
  originalData,
  cleaningData,
  selectedColumns,
  fileName,
  onRestart,
  onBack,
}: ExportStepProps) {
  const [downloading, setDownloading] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [activeTab, setActiveTab] = useState("cleaned")
  const [searchTerm, setSearchTerm] = useState("")
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [cleaningDetailsSaved, setCleaningDetailsSaved] = useState(false)
  const itemsPerPage = 10

  const totalCorrections = useMemo(() => {
    return cleaningData.summary?.reduce((sum, item) => sum + (item.manual_corrections || 0), 0) || 0
  }, [cleaningData.summary])

  const totalColumns = useMemo(() => {
    return cleaningData.summary?.length || 0
  }, [cleaningData.summary])

  const currentData = useMemo(() => {
    return activeTab === "cleaned" ? cleaningData.cleanedData : cleaningData.originalData
  }, [activeTab, cleaningData.cleanedData, cleaningData.originalData])

  const filteredData = useMemo(() => {
    if (!searchTerm.trim() || !currentData) return currentData

    return currentData.filter((row) => {
      return Object.values(row).some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
      )
    })
  }, [currentData, searchTerm])

  const paginatedData = useMemo(() => {
    const startIndex = currentPage * itemsPerPage
    return filteredData?.slice(startIndex, startIndex + itemsPerPage) || []
  }, [filteredData, currentPage, itemsPerPage])

  const totalPages = Math.ceil((filteredData?.length || 0) / itemsPerPage)

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(0)
  }

  const clearSearch = () => {
    setSearchTerm("")
    setCurrentPage(0)
  }

  const saveCleaningDetails = async () => {
    console.log("Saving cleaning details... ", cleaningData);
    setSaving(true)
    try {
      const userData = localStorage.getItem("user")
      const user = userData ? JSON.parse(userData) : null

      if (!user || !user.id) {
        console.error("User not found in localStorage")
        return
      }

      const payload = {
        user_id: user.id,
        file_name: fileName,
        cleaning_mode: cleaningData.useCategory ?  "category" : "column",
        acceptance_ratio: cleaningData.acceptance_ratio,
        summaries:
          cleaningData.summary?.map((item) => ({
            column: item.column,
            total_values: item.total_values,
            num_of_before_unique: item.num_of_before_unique,
            num_of_after_unique: item.num_of_after_unique,
            manual_corrections: item.manual_corrections,
            num_of_clusters: item.num_of_clusters,
            num_of_majority: item.num_of_majority,
            total_num_of_single: item.total_num_of_single,
            num_of_spell_check:   item.num_of_spell_check,
            num_of_global_manual: item.num_of_global_manual,
            num_of_gkg:          item.num_of_gkg,
            num_of_llm:         item.num_of_llm,
            acceptance_ratio: item.acceptance_ratio,
          })) || [],
      }

      const response = await fetch("http://localhost:8080/clean_save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        console.log("Cleaning details saved successfully")
        setCleaningDetailsSaved(true)
      } else {
        console.error("Failed to save cleaning details")
      }
    } catch (error) {
      console.error("Error saving cleaning details:", error)
    } finally {
      setSaving(false)
      setShowSaveDialog(false)
    }
  }

  const handleDownloadClick = () => {
    if (!cleaningDetailsSaved) {
      setShowSaveDialog(true)
    } else {
      downloadCSV()
    }
  }

  const downloadCSV = async () => {
    setDownloading(true)

    try {
      const headers = Object.keys(cleaningData.cleanedData[0] || {})
      const csvContent = [
        headers.join(","),
        ...cleaningData.cleanedData.map((row) => headers.map((header) => `"${row[header] || ""}"`).join(",")),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)

      link.setAttribute("href", url)
      link.setAttribute("download", `cleaned_${fileName}`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Download failed:", error)
    } finally {
      setDownloading(false)
    }
  }

  const handleDownloadOnly = () => {
    setShowSaveDialog(false)
    downloadCSV()
  }

  const handleSaveAndDownload = async () => {
    await saveCleaningDetails()
    downloadCSV()
  }

  const handleSaveCleaningDetails = async () => {
    await saveCleaningDetails()
  }

  const downloadCleaningMap = () => {
    const cleaningMap: { [key: string]: { original: string; cleaned: string }[] } = {}

    if (cleaningData.originalData && cleaningData.cleanedData) {
      selectedColumns.forEach((columnName) => {
        cleaningMap[columnName] = []

        cleaningData.originalData.forEach((originalRow, index) => {
          const cleanedRow = cleaningData.cleanedData[index]
          const originalValue = originalRow[columnName]
          const cleanedValue = cleanedRow?.[columnName]

          if (originalValue !== cleanedValue && cleanedValue !== undefined) {
            cleaningMap[columnName].push({
              original: originalValue,
              cleaned: cleanedValue,
            })
          }
        })
      })
    }

    const blob = new Blob([JSON.stringify(cleaningMap, null, 2)], {
      type: "application/json;charset=utf-8;",
    })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.setAttribute("href", url)
    link.setAttribute("download", `cleaning_map_${fileName.replace(".csv", ".json")}`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePageChange = (direction: "prev" | "next" | "start" | "end") => {
    switch (direction) {
      case "prev":
        setCurrentPage(Math.max(0, currentPage - 1))
        break
      case "next":
        setCurrentPage(Math.min(totalPages - 1, currentPage + 1))
        break
      case "start":
        setCurrentPage(0)
        break
      case "end":
        setCurrentPage(totalPages - 1)
        break
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">Data Cleaning Complete!</h3>
              <p className="text-green-700 dark:text-green-300">
                All columns processed and cleaned successfully across {totalColumns} columns. A total of{" "}
                {totalCorrections} values were corrected.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Cleaning Summary
          </CardTitle>
          <CardDescription>Overview of changes made to your data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cleaningData.summary?.map((item) => (
              <div key={item.column} className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">{item.column}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total values:</span>
                    <Badge variant="secondary">{item.total_values}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Singular Corrections made:</span>
                    <Badge variant="default">{item.manual_corrections}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Comparison & Review</CardTitle>
          <CardDescription>Preview your original and cleaned data</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="cleaned">Cleaned Data</TabsTrigger>
              <TabsTrigger value="original">Original Data</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  placeholder="Search through data..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSearch}
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0 hover:bg-gray-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {searchTerm && (
                <Badge variant="secondary" className="whitespace-nowrap">
                  {filteredData?.length || 0} of {currentData?.length || 0} rows
                </Badge>
              )}
            </div>

            <TabsContent value="cleaned" className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.keys(paginatedData[0] || {}).map((header) => (
                        <TableHead key={header}>{header}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.length > 0 ? (
                      paginatedData.map((row, index) => (
                        <TableRow key={index}>
                          {Object.keys(row).map((key) => (
                            <TableCell key={key} className="max-w-xs truncate">
                              {row[key] || "-"}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={Object.keys(currentData?.[0] || {}).length}
                          className="text-center py-8 text-gray-500"
                        >
                          {searchTerm ? "No results found for your search" : "No data available"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="original" className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.keys(paginatedData[0] || {}).map((header) => (
                        <TableHead key={header}>{header}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.length > 0 ? (
                      paginatedData.map((row, index) => (
                        <TableRow key={index}>
                          {Object.keys(row).map((key) => (
                            <TableCell key={key} className="max-w-xs truncate">
                              {row[key] || "-"}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={Object.keys(currentData?.[0] || {}).length}
                          className="text-center py-8 text-gray-500"
                        >
                          {searchTerm ? "No results found for your search" : "No data available"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {filteredData && filteredData.length > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {currentPage * itemsPerPage + 1} to{" "}
                  {Math.min((currentPage + 1) * itemsPerPage, filteredData?.length || 0)} of {filteredData?.length || 0}{" "}
                  {searchTerm ? "filtered" : ""} rows
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange("start")}
                    disabled={currentPage === 0}
                  >
                    Start
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange("prev")}
                    disabled={currentPage === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange("next")}
                    disabled={currentPage >= totalPages - 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange("end")}
                    disabled={currentPage >= totalPages - 1}
                  >
                    End
                  </Button>
                </div>
              </div>
            )}
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              ← Back
            </Button>
          )}
          <Button variant="outline" onClick={onRestart}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Start Over
          </Button>
          <Button variant="outline" onClick={handleSaveCleaningDetails} disabled={saving || cleaningDetailsSaved}>
            {cleaningDetailsSaved ? "Cleaning details saved" : saving ? "Saving..." : "Save cleaning details"}
          </Button>
        </div>

        <Button
          onClick={handleDownloadClick}
          disabled={downloading}
          size="lg"
          className="bg-green-600 hover:bg-green-700"
        >
          <Download className="w-4 h-4 mr-2" />
          {downloading ? "Preparing Download..." : "Download Data"}
        </Button>
      </div>

      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center justify-between">
              <AlertDialogTitle>Congratulations! Your cleaning is complete.</AlertDialogTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowSaveDialog(false)} className="h-6 w-6 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <AlertDialogDescription>
              Do you want to save details of this cleaning process for future analysis?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDownloadOnly} disabled={saving || downloading}>
              No, just download
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveAndDownload} disabled={saving || downloading}>
              {saving ? "Saving..." : "Yes, save details"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}