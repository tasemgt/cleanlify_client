"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react"
import type { ColumnInfo } from "@/app/page"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface UploadStepProps {
  onFileUpload: (file: File, parsedData: any[], columns: ColumnInfo[], fileType: string) => void
}

export function UploadStep({ onFileUpload }: UploadStepProps) {
  const [selectedFileType, setSelectedFileType] = useState<string>("csv")
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supportedFormats = [
    { value: "csv", label: "CSV", extensions: [".csv"], description: "Comma-separated values" },
    { value: "json", label: "JSON", extensions: [".json"], description: "JavaScript Object Notation" },
    { value: "txt", label: "TXT", extensions: [".txt"], description: "Plain text (tab or comma delimited)" },
    { value: "xls", label: "Excel", extensions: [".xls", ".xlsx"], description: "Microsoft Excel files" },
    { value: "tsv", label: "TSV", extensions: [".tsv"], description: "Tab-separated values" },
  ]

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const validateFile = (file: File): string | null => {
    const selectedFormat = supportedFormats.find((f) => f.value === selectedFileType)
    if (!selectedFormat) return "Please select a valid file type."

    const hasValidExtension = selectedFormat.extensions.some((ext) => file.name.toLowerCase().endsWith(ext))

    if (!hasValidExtension) {
      return `Please upload a ${selectedFormat.label} file (${selectedFormat.extensions.join(", ")}).`
    }

    if (file.size > 10 * 1024 * 1024) {
      return "File size must be less than 10MB."
    }
    return null
  }

  const parseCSV = (text: string): any[] => {
    const lines = text.split("\n").filter((line) => line.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
    const data = lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/"/g, ""))
      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ""
      })
      return row
    })

    return data
  }

  const parseFile = async (file: File, fileType: string): Promise<any[]> => {
    const text = await file.text()

    switch (fileType) {
      case "csv":
        return parseCSV(text)
      case "json":
        return parseJSON(text)
      case "txt":
        return parseTXT(text)
      case "tsv":
        return parseTSV(text)
      case "xls":
        // For demo purposes, treat as CSV. In production, use a library like xlsx
        return parseCSV(text)
      default:
        throw new Error("Unsupported file type")
    }
  }

  const parseJSON = (text: string): any[] => {
    try {
      const data = JSON.parse(text)
      if (Array.isArray(data)) {
        return data
      } else if (typeof data === "object") {
        // Convert single object to array
        return [data]
      }
      throw new Error("JSON must contain an array of objects")
    } catch (error) {
      throw new Error("Invalid JSON format")
    }
  }

  const parseTXT = (text: string): any[] => {
    // Try to detect delimiter (comma, tab, or semicolon)
    const lines = text.split("\n").filter((line) => line.trim())
    if (lines.length < 2) return []

    const firstLine = lines[0]
    let delimiter = ","
    if (firstLine.includes("\t")) delimiter = "\t"
    else if (firstLine.includes(";")) delimiter = ";"

    const headers = firstLine.split(delimiter).map((h) => h.trim().replace(/"/g, ""))
    const data = lines.slice(1).map((line) => {
      const values = line.split(delimiter).map((v) => v.trim().replace(/"/g, ""))
      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ""
      })
      return row
    })

    return data
  }

  const parseTSV = (text: string): any[] => {
    const lines = text.split("\n").filter((line) => line.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split("\t").map((h) => h.trim())
    const data = lines.slice(1).map((line) => {
      const values = line.split("\t").map((v) => v.trim())
      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ""
      })
      return row
    })

    return data
  }

  const analyzeColumns = (data: any[]): ColumnInfo[] => {
    if (data.length === 0) return []

    const headers = Object.keys(data[0])
    return headers.map((header) => {
      const values = data.map((row) => row[header]).filter((v) => v && v.trim())
      const uniqueValues = [...new Set(values)]
      const missingCount = data.length - values.length

      // Determine type
      let type: "numeric" | "categorical" | "text" = "text"
      const numericValues = values.filter((v) => !isNaN(Number(v)))

      if (numericValues.length > values.length * 0.8) {
        type = "numeric"
      } else if (uniqueValues.length < values.length * 0.5 && uniqueValues.length < 20) {
        type = "categorical"
      }

      // Check if problematic (high variance in text fields)
      const isProblematic = type === "text" && uniqueValues.length > values.length * 0.7

      return {
        name: header,
        type,
        missingCount,
        uniqueCount: uniqueValues.length,
        sampleValues: uniqueValues.slice(0, 5),
        isProblematic,
      }
    })
  }

  const processFile = async (file: File) => {
    setUploading(true)
    setError(null)

    try {
      const parsedData = await parseFile(file, selectedFileType)

      if (parsedData.length === 0) {
        throw new Error("No valid data found in the file.")
      }

      const columns = analyzeColumns(parsedData)
      onFileUpload(file, parsedData, columns, selectedFileType)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process file.")
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      const file = files[0]
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }
      processFile(file)
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }
      processFile(file)
    }
  }

  const selectedFormat = supportedFormats.find((f) => f.value === selectedFileType)
  const acceptedExtensions = selectedFormat?.extensions.join(",") || ".csv"

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Upload className="w-6 h-6" />
          Upload Your Data File
        </CardTitle>
        <CardDescription>Upload your structured data file to begin the cleaning process</CardDescription>
      </CardHeader>
      <CardContent>
        {/* File Type Selector */}
        <div className="mb-6">
          <label htmlFor="file-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select File Type
          </label>
          <Select value={selectedFileType} onValueChange={setSelectedFileType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose file type" />
            </SelectTrigger>
            <SelectContent>
              {supportedFormats.map((format) => (
                <SelectItem key={format.value} value={format.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{format.label}</span>
                    <span className="text-xs text-gray-500">{format.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "border-gray-300 hover:border-gray-400"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-gray-600">Processing your file...</p>
            </div>
          ) : (
            <>
              <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Drag and drop your {selectedFormat?.label} file here</h3>
              <p className="text-gray-600 mb-4">or</p>
              <Button asChild className="mb-4">
                <label htmlFor="file-upload" className="cursor-pointer">
                  Choose File
                </label>
              </Button>
              <input
                id="file-upload"
                type="file"
                accept={acceptedExtensions}
                onChange={handleFileSelect}
                className="hidden"
              />
              <p className="text-sm text-gray-500">
                Maximum file size: 10MB • Supported format: {selectedFormat?.label} (
                {selectedFormat?.extensions.join(", ")})
              </p>
            </>
          )}
        </div>

        {error && (
          <Alert className="mt-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">What happens next?</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Your {selectedFormat?.label} file will be parsed and analyzed</li>
                <li>• We'll identify column types and data quality issues</li>
                <li>• You'll be able to select which columns to clean</li>
                <li>• All processing happens securely in your browser</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
