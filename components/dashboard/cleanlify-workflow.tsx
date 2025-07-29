"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { UploadStepEnhanced } from "./upload-step-enhanced"
import { PreviewStepEnhanced } from "./preview-step-enhanced"
import { CleaningStepEnhanced } from "./cleaning-step-enhanced"
import { ExportStepEnhanced } from "./export-step-enhanced"
import type { ColumnInfo, CleaningData } from "@/app/page"

const steps = [
  { id: 1, title: "Upload", description: "Upload your data file" },
  { id: 2, title: "Preview", description: "Review data summary" },
  { id: 3, title: "Clean", description: "Clean selected columns" },
  { id: 4, title: "Export", description: "Download cleaned data" },
]

export function CleanlifyWorkflow() {
  const [currentStep, setCurrentStep] = useState(1)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [columns, setColumns] = useState<ColumnInfo[]>([])
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [selectedDomain, setSelectedDomain] = useState<string>("")
  const [cleaningData, setCleaningData] = useState<CleaningData>({})
  const [rawData, setRawData] = useState<any[]>([])
  const [fileType, setFileType] = useState<string>("")

  const progress = (currentStep / steps.length) * 100

  const handleFileUpload = async (file: File, uploadedFileType: string) => {
    setUploadedFile(file)
    setFileType(uploadedFileType)

    // Call API to process file
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("fileType", uploadedFileType)

      // Mock API call - replace with your actual API endpoint
      const response = await fetch("/api/upload-file", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload file")
      }

      const data = await response.json()
      setColumns(data.columns)
      setRawData(data.data)
      setCurrentStep(2)
    } catch (error) {
      console.error("Upload failed:", error)
      // Handle error appropriately
    }
  }

  const handlePreviewContinue = async (selectedCols: string[], domain: string) => {
    setSelectedColumns(selectedCols)
    setSelectedDomain(domain)

    // Call API to get cleaning suggestions
    try {
      const response = await fetch("/api/get-cleaning-suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          columns: selectedCols,
          domain: domain,
          data: rawData,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get cleaning suggestions")
      }

      const cleaningSuggestions = await response.json()
      setCleaningData(cleaningSuggestions)
      setCurrentStep(3)
    } catch (error) {
      console.error("Failed to get cleaning suggestions:", error)
      // Handle error appropriately
    }
  }

  const handleCleaningContinue = (cleaningMappings: CleaningData) => {
    setCleaningData(cleaningMappings)
    setCurrentStep(4)
  }

  const handleRestart = () => {
    setCurrentStep(1)
    setUploadedFile(null)
    setColumns([])
    setSelectedColumns([])
    setSelectedDomain("")
    setCleaningData({})
    setRawData([])
    setFileType("")
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Cleanlify</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">Clean your data with our intelligent workflow</p>
      </div>

      {/* Progress Indicator */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.id ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300 text-gray-500"
                }`}
              >
                {step.id}
              </div>
              <div className="ml-3 hidden sm:block">
                <p className={`text-sm font-medium ${currentStep >= step.id ? "text-blue-600" : "text-gray-500"}`}>
                  {step.title}
                </p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-4 ${currentStep > step.id ? "bg-blue-600" : "bg-gray-300"}`} />
              )}
            </div>
          ))}
        </div>
        <Progress value={progress} className="w-full" />
        <div className="flex justify-between mt-2">
          <Badge variant={currentStep >= 1 ? "default" : "secondary"}>
            Step {currentStep} of {steps.length}
          </Badge>
          <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
        </div>
      </Card>

      {/* Step Content */}
      <div>
        {currentStep === 1 && <UploadStepEnhanced onFileUpload={handleFileUpload} />}

        {currentStep === 2 && (
          <PreviewStepEnhanced
            columns={columns}
            rawData={rawData}
            fileType={fileType}
            onContinue={handlePreviewContinue}
            onBack={handleBack}
          />
        )}

        {currentStep === 3 && (
          <CleaningStepEnhanced
            columns={columns.filter((col) => selectedColumns.includes(col.name))}
            selectedDomain={selectedDomain}
            rawData={rawData}
            cleaningData={cleaningData}
            onContinue={handleCleaningContinue}
            onBack={handleBack}
          />
        )}

        {currentStep === 4 && (
          <ExportStepEnhanced
            originalData={rawData}
            cleaningData={cleaningData}
            selectedColumns={selectedColumns}
            fileName={uploadedFile?.name || "cleaned_data.csv"}
            onRestart={handleRestart}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  )
}
