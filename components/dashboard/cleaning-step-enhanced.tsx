"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, X, Edit3, ArrowRight } from "lucide-react"
import type { ColumnInfo, CleaningData } from "@/app/page"

interface CleaningStepEnhancedProps {
  columns: ColumnInfo[]
  selectedDomain: string
  rawData: any[]
  cleaningData: CleaningData
  onContinue: (cleaningData: CleaningData) => void
  onBack?: () => void
}

export function CleaningStepEnhanced({
  columns,
  selectedDomain,
  rawData,
  cleaningData: initialCleaningData,
  onContinue,
  onBack,
}: CleaningStepEnhancedProps) {
  const [cleaningData, setCleaningData] = useState<CleaningData>(initialCleaningData)
  const [editingValues, setEditingValues] = useState<{ [key: string]: string }>({})

  const handleAcceptSuggestion = (columnName: string, index: number) => {
    setCleaningData((prev) => ({
      ...prev,
      [columnName]: prev[columnName].map((item, i) => (i === index ? { ...item, accepted: true } : item)),
    }))
  }

  const handleRejectSuggestion = (columnName: string, index: number) => {
    setCleaningData((prev) => ({
      ...prev,
      [columnName]: prev[columnName].map((item, i) => (i === index ? { ...item, accepted: false } : item)),
    }))
  }

  const handleCustomEdit = (columnName: string, index: number, customValue: string) => {
    setCleaningData((prev) => ({
      ...prev,
      [columnName]: prev[columnName].map((item, i) =>
        i === index ? { ...item, userDefined: customValue, accepted: true } : item,
      ),
    }))
    setEditingValues((prev) => ({ ...prev, [`${columnName}-${index}`]: "" }))
  }

  const handleBulkAccept = (columnName: string) => {
    setCleaningData((prev) => ({
      ...prev,
      [columnName]: prev[columnName].map((item) => ({ ...item, accepted: true })),
    }))
  }

  const getTotalSuggestions = () => {
    return Object.values(cleaningData).reduce((total, mappings) => total + mappings.length, 0)
  }

  const getAcceptedSuggestions = () => {
    return Object.values(cleaningData).reduce((total, mappings) => total + mappings.filter((m) => m.accepted).length, 0)
  }

  return (
    <div className="space-y-6">
      {/* Progress Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Cleaning Progress</h3>
              <p className="text-gray-600">
                {getAcceptedSuggestions()} of {getTotalSuggestions()} suggestions reviewed
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {getTotalSuggestions() > 0 ? Math.round((getAcceptedSuggestions() / getTotalSuggestions()) * 100) : 0}%
              </div>
              <p className="text-sm text-gray-600">Complete</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Column Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Column Cleaning</CardTitle>
          <CardDescription>Review and approve cleaning suggestions for each selected column</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={columns[0]?.name} className="w-full">
            <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {columns.map((column) => (
                <TabsTrigger key={column.name} value={column.name} className="text-sm">
                  {column.name}
                  <Badge variant="secondary" className="ml-2">
                    {cleaningData[column.name]?.length || 0}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {columns.map((column) => (
              <TabsContent key={column.name} value={column.name} className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Cleaning suggestions for "{column.name}"</h4>
                  <Button variant="outline" size="sm" onClick={() => handleBulkAccept(column.name)}>
                    Accept All
                  </Button>
                </div>

                <div className="space-y-3">
                  {cleaningData[column.name]?.map((mapping, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Original</p>
                            <p className="font-mono text-sm bg-red-50 dark:bg-red-950 p-2 rounded">
                              {mapping.original}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Suggested</p>
                            {editingValues[`${column.name}-${index}`] !== undefined ? (
                              <div className="flex gap-2">
                                <Input
                                  value={editingValues[`${column.name}-${index}`]}
                                  onChange={(e) =>
                                    setEditingValues((prev) => ({
                                      ...prev,
                                      [`${column.name}-${index}`]: e.target.value,
                                    }))
                                  }
                                  className="text-sm"
                                  placeholder="Enter custom value"
                                />
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleCustomEdit(column.name, index, editingValues[`${column.name}-${index}`])
                                  }
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <p
                                className={`font-mono text-sm p-2 rounded ${
                                  mapping.accepted ? "bg-green-50 dark:bg-green-950" : "bg-blue-50 dark:bg-blue-950"
                                }`}
                              >
                                {mapping.userDefined || mapping.suggested}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant={mapping.accepted ? "default" : "outline"}
                              onClick={() => handleAcceptSuggestion(column.name, index)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectSuggestion(column.name, index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setEditingValues((prev) => ({
                                  ...prev,
                                  [`${column.name}-${index}`]: mapping.userDefined || mapping.suggested,
                                }))
                              }
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {(!cleaningData[column.name] || cleaningData[column.name].length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No cleaning suggestions for this column.</p>
                      <p className="text-sm">The data appears to be already clean!</p>
                    </div>
                  )}
                </div>
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
        <Button onClick={() => onContinue(cleaningData)} size="lg" className="ml-auto">
          Preview Cleaned Data
        </Button>
      </div>
    </div>
  )
}
