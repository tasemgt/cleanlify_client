"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, RotateCcw, CheckCircle, BarChart3 } from "lucide-react"
import type { CleaningData } from "@/app/page"

interface ExportStepEnhancedProps {
  originalData: any[]
  cleaningData: CleaningData
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
}: ExportStepEnhancedProps) {
  const [downloading, setDownloading] = useState(false)

  const cleanedData = useMemo(() => {
    return originalData.map((row) => {
      const cleanedRow = { ...row }

      selectedColumns.forEach((columnName) => {
        const mappings = cleaningData[columnName] || []
        const originalValue = row[columnName]

        const mapping = mappings.find((m) => m.original === originalValue && m.accepted)
        if (mapping) {
          cleanedRow[columnName] = mapping.userDefined || mapping.suggested
        }
      })

      return cleanedRow
    })
  }, [originalData, cleaningData, selectedColumns])

  const cleaningStats = useMemo(() => {
    const stats: { [key: string]: { total: number; cleaned: number } } = {}

    selectedColumns.forEach((columnName) => {
      const mappings = cleaningData[columnName] || []
      stats[columnName] = {
        total: mappings.length,
        cleaned: mappings.filter((m) => m.accepted).length,
      }
    })

    return stats
  }, [cleaningData, selectedColumns])

  const downloadCSV = async () => {
    setDownloading(true)

    try {
      // Convert cleaned data to CSV
      const headers = Object.keys(cleanedData[0] || {})
      const csvContent = [
        headers.join(","),
        ...cleanedData.map((row) => headers.map((header) => `"${row[header] || ""}"`).join(",")),
      ].join("\n")

      // Create and download file
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
    const cleaningMap = Object.entries(cleaningData).reduce((acc, [columnName, mappings]) => {
      acc[columnName] = mappings
        .filter((m) => m.accepted)
        .map((m) => ({
          original: m.original,
          cleaned: m.userDefined || m.suggested,
        }))
      return acc
    }, {} as any)

    const blob = new Blob([JSON.stringify(cleaningMap, null, 2)], {
      type: "application/json;charset=utf-8;",
    })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.setAttribute("href", url)
    link.setAttribute("download", `cleaning_map_${fileName.replace(/\.[^/.]+$/, ".json")}`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const totalChanges = Object.values(cleaningStats).reduce((sum, stat) => sum + stat.cleaned, 0)

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
                Successfully cleaned {totalChanges} values across {selectedColumns.length} columns
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
            {selectedColumns.map((columnName) => (
              <div key={columnName} className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">{columnName}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total suggestions:</span>
                    <Badge variant="secondary">{cleaningStats[columnName]?.total || 0}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Applied changes:</span>
                    <Badge variant="default">{cleaningStats[columnName]?.cleaned || 0}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Before & After Comparison</CardTitle>
          <CardDescription>Compare your original and cleaned data</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="cleaned" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="cleaned">Cleaned Data</TabsTrigger>
              <TabsTrigger value="original">Original Data</TabsTrigger>
            </TabsList>

            <TabsContent value="cleaned" className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.keys(cleanedData[0] || {}).map((header) => (
                        <TableHead key={header}>
                          {header}
                          {selectedColumns.includes(header) && (
                            <Badge variant="outline" className="ml-2">
                              Cleaned
                            </Badge>
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cleanedData.slice(0, 10).map((row, index) => (
                      <TableRow key={index}>
                        {Object.keys(row).map((key) => (
                          <TableCell key={key} className="max-w-xs truncate">
                            {row[key] || "-"}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-sm text-gray-600">Showing first 10 rows of {cleanedData.length} total rows</p>
            </TabsContent>

            <TabsContent value="original" className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.keys(originalData[0] || {}).map((header) => (
                        <TableHead key={header}>{header}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {originalData.slice(0, 10).map((row, index) => (
                      <TableRow key={index}>
                        {Object.keys(row).map((key) => (
                          <TableCell key={key} className="max-w-xs truncate">
                            {row[key] || "-"}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-sm text-gray-600">Showing first 10 rows of {originalData.length} total rows</p>
            </TabsContent>
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
          {downloading ? "Preparing Download..." : "Download Cleaned Data"}
        </Button>
      </div>
    </div>
  )
}
