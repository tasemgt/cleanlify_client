"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, AlertCircle, CheckCircle, Info } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

interface UploadStepEnhancedProps {
  onFileUpload: (file: File, fileType: string, limit?: number) => Promise<void>
}

export function UploadStepEnhanced({ onFileUpload }: UploadStepEnhancedProps) {
  const [selectedFileType, setSelectedFileType] = useState<string>("csv")
  const [rowLimit, setRowLimit] = useState<number | undefined>(undefined)
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

  const processFile = async (file: File) => {
    setUploading(true)
    setError(null)

    try {
      await onFileUpload(file, selectedFileType, rowLimit)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process file.")
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
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
    },
    [selectedFileType],
  )

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

        {/* Row Limit Input Field */}
        <div className="mb-6">
          <label htmlFor="row-limit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Number of Rows to Process (Optional)
          </label>
          <Input
            id="row-limit"
            type="number"
            min="1"
            max="10000"
            value={rowLimit || ""}
            onChange={(e) => {
              const value = e.target.value
              setRowLimit(value === "" ? undefined : Math.max(1, Number.parseInt(value) || undefined))
            }}
            className="w-full"
            placeholder="Leave empty to process all rows"
          />
          <div className="flex items-start gap-2 mt-2 p-2 bg-amber-50 dark:bg-amber-950 rounded-md">
            <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800 dark:text-amber-200">
              <strong>Tip:</strong> Leave empty to process all rows, or specify a number for faster processing. The
              larger the number of rows, the longer it takes to process.
            </p>
          </div>
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
                <li>• Your {selectedFormat?.label} file will be uploaded to our secure servers</li>
                <li>• We'll analyze column types and identify data quality issues</li>
                <li>• You'll be able to select which columns to clean</li>
                <li>• All data is processed securely and deleted after your session</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}