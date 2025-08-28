"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CleanSummaryView } from "@/components/dashboard/clean-summary-view"

interface Clean {
  file_name: string
  cleaning_mode: string
  acceptance_ratio: number
  clean_date: string
  summaries: Array<{
    column: string
    total_values: number
    num_of_before_unique: number
    num_of_after_unique: number
    manual_corrections: number
    num_of_clusters: number
    num_of_majority: number
    total_num_of_single: number
    num_of_spell_check: number
    num_of_global_manual: number
    num_of_gkg: number
    num_of_llm: number
    acceptance_ratio: number
  }>
  cleanIndex: number
}

export default function SummaryPage() {
  const router = useRouter()
  const [selectedClean, setSelectedClean] = useState<Clean | null>(null)

  useEffect(() => {
    const cleanData = localStorage.getItem("selectedClean")
    if (cleanData) {
      setSelectedClean(JSON.parse(cleanData))
    } else {
      router.push("/dashboard")
    }
  }, [router])

  if (!selectedClean) {
    return <div>Loading...</div>
  }

  return <CleanSummaryView clean={selectedClean} />
}
