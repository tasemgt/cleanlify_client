"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Download, RotateCcw, CheckCircle, BarChart3, ChevronLeft, ChevronRight, Search, X } from "lucide-react"

interface ExportStepProps {
  originalData: any[]
  cleaningData: {
    cleanedData: any[]
    originalData: any[]
    status: string
    summary: Array<{
      column: string
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

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm.trim() || !currentData) return currentData

    return currentData.filter((row) => {
      return Object.values(row).some((value) =>
        String(value || "").toLowerCase().includes(searchTerm.toLowerCase())
      )
    })
  }, [currentData, searchTerm])

  const paginatedData = useMemo(() => {
    const startIndex = currentPage * itemsPerPage
    return filteredData?.slice(startIndex, startIndex + itemsPerPage) || []
  }, [filteredData, currentPage, itemsPerPage])

  const totalPages = Math.ceil((filteredData?.length || 0) / itemsPerPage)

  // Reset to first page when search term changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(0)
  }

  const clearSearch = () => {
    setSearchTerm("")
    setCurrentPage(0)
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
      {/* Success Summary */}
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

      {/* Cleaning Summary */}
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
                    <span>Corrections made:</span>
                    <Badge variant="default">{item.manual_corrections}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Comparison & Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Data Comparison & Preview</CardTitle>
          <CardDescription>Preview your original and cleaned data</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="cleaned">Cleaned Data</TabsTrigger>
              <TabsTrigger value="original">Original Data</TabsTrigger>
            </TabsList>

            {/* Search Box */}
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
                        <TableCell colSpan={Object.keys(currentData?.[0] || {}).length} className="text-center py-8 text-gray-500">
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
                        <TableCell colSpan={Object.keys(currentData?.[0] || {}).length} className="text-center py-8 text-gray-500">
                          {searchTerm ? "No results found for your search" : "No data available"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Pagination Controls */}
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

      {/* Action Buttons */}
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
          <Button variant="outline" onClick={downloadCleaningMap}>
            Save Cleaning Map
          </Button>
        </div>

        <Button onClick={downloadCSV} disabled={downloading} size="lg" className="bg-green-600 hover:bg-green-700">
          <Download className="w-4 h-4 mr-2" />
          {downloading ? "Preparing Download..." : "Download Data"}
        </Button>
      </div>
    </div>
  )
}