import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { rawData, selectedColumns, useCategory, categoryColumn, allColumns } = await request.json()

    if (useCategory && categoryColumn) {
      // Return grouped data structure when using category approach
      const mockGroupedData = {
        CARS: {
          cluster_1: {
            members: [
              {
                value: "toyota",
                row_ids: 2,
                short_text_col: "brand_name",
              },
              {
                value: "tayota",
                row_ids: 3,
                short_text_col: "brand_name",
              },
            ],
            suggestion: "Toyota",
            suggestion_mode: "spell_checker",
            confidence: 0.9,
          },
          cluster_2: {
            members: [
              {
                value: "honda",
                row_ids: 5,
                short_text_col: "brand_name",
              },
              {
                value: "handa",
                row_ids: 8,
                short_text_col: "brand_name",
              },
            ],
            suggestion: "Honda",
            suggestion_mode: "spell_checker",
            confidence: 0.85,
          },
        },
        TECHNOLOGY: {
          cluster_1: {
            members: [
              {
                value: "apple",
                row_ids: 12,
                short_text_col: "brand_name",
              },
              {
                value: "aple",
                row_ids: 15,
                short_text_col: "brand_name",
              },
            ],
            suggestion: "Apple",
            suggestion_mode: "spell_checker",
            confidence: 0.95,
          },
        },
        HEALTHCARE: {
          cluster_1: {
            members: [
              {
                value: "pfizer",
                row_ids: 20,
                short_text_col: "brand_name",
              },
              {
                value: "pfiser",
                row_ids: 22,
                short_text_col: "brand_name",
              },
            ],
            suggestion: "Pfizer",
            suggestion_mode: "spell_checker",
            confidence: 0.88,
          },
        },
      }

      return NextResponse.json({
        status: "success",
        useCategory: true,
        groupedData: mockGroupedData,
      })
    } else {
      // Return column-based structure when not using category approach
      const mockCleaningSuggestions: any = {}

      selectedColumns.forEach((columnName: string) => {
        const columnData = rawData.map((row: any) => row[columnName]).filter((v: any) => v && v.trim())
        const uniqueValues = [...new Set(columnData)]

        const suggestions = uniqueValues
          .slice(0, 20)
          .map((value: string) => {
            let suggested = value.trim()
            suggested = suggested.replace(/\s+/g, " ")
            suggested = suggested.toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase())

            return {
              original: value,
              suggested: suggested,
              accepted: false,
            }
          })
          .filter((item: any) => item.original !== item.suggested)

        mockCleaningSuggestions[columnName] = suggestions
      })

      return NextResponse.json({
        status: "success",
        useCategory: false,
        groupedData: mockCleaningSuggestions,
      })
    }
  } catch (error) {
    console.error("Processing error:", error)
    return NextResponse.json({ error: "Failed to process data" }, { status: 500 })
  }
}