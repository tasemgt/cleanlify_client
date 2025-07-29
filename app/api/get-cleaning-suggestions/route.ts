import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { columns, domain, data } = await request.json()

    // Mock cleaning suggestions - replace with actual AI/ML logic
    const mockCleaningSuggestions: any = {}

    columns.forEach((columnName: string) => {
      const columnData = data.map((row: any) => row[columnName]).filter((v: any) => v && v.trim())
      const uniqueValues = [...new Set(columnData)]

      const suggestions = uniqueValues
        .slice(0, 10)
        .map((value: string) => {
          let suggested = value.trim()

          // Apply domain-specific cleaning rules
          if (domain === "healthcare") {
            suggested = suggested.replace(/\b(dr|doctor)\b/gi, "Doctor")
            suggested = suggested.replace(/\b(med|medicine)\b/gi, "Medicine")
          } else if (domain === "education") {
            suggested = suggested.replace(/\b(prof|professor)\b/gi, "Professor")
            suggested = suggested.replace(/\b(univ|university)\b/gi, "University")
          }

          // General cleaning
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

    return NextResponse.json(mockCleaningSuggestions)
  } catch (error) {
    console.error("Cleaning suggestions error:", error)
    return NextResponse.json({ error: "Failed to get cleaning suggestions" }, { status: 500 })
  }
}
