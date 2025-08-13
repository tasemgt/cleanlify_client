import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const fileType = formData.get("fileType") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Mock response with updated column structure
    const mockColumns = [
      {
        name: "category",
        type: "categorical",
        missingCount: 5,
        uniqueCount: 4,
        sampleValues: ["Technology", "Healthcare", "Finance", "Education"],
        important: true,
      },
      {
        name: "brand_name",
        type: "text",
        missingCount: 885,
        uniqueCount: 87,
        sampleValues: ["Caddilac", "yamaha", "Singapore airline", "Leika", "ferrari"],
        isShortText: true,
      },
      {
        name: "customer_age",
        type: "numeric",
        missingCount: 12,
        uniqueCount: 45,
        sampleValues: ["25", "34", "28", "41", "33"],
      },
      {
        name: "feedback_text",
        type: "text",
        missingCount: 156,
        uniqueCount: 234,
        sampleValues: [
          "Great product! Really satisfied with the quality and service provided by the team.",
          "Could be better in terms of delivery time and customer support response.",
          "Excellent service overall, would definitely recommend to others.",
          "Not satisfied with the product quality, expected much better for the price.",
          "Amazing quality and fast delivery, exceeded my expectations completely.",
        ],
        isShortText: false,
      },
      {
        name: "product_code",
        type: "text",
        missingCount: 23,
        uniqueCount: 156,
        sampleValues: ["PRD001", "ITM-234", "PROD_567", "CODE123", "ITEM_890"],
        isShortText: true,
      },
      {
        name: "region",
        type: "categorical",
        missingCount: 8,
        uniqueCount: 3,
        sampleValues: ["North", "South", "East"],
        important: false,
      },
    ]

    const mockData = Array.from({ length: 100 }, (_, i) => ({
      category: ["Technology", "Healthcare", "Finance", "Education"][i % 4],
      brand_name: ["Caddilac", "yamaha", "Singapore airline", "Leika", "ferrari"][i % 5],
      customer_age: Math.floor(Math.random() * 50) + 20,
      feedback_text: [
        "Great product! Really satisfied with the quality and service provided by the team.",
        "Could be better in terms of delivery time and customer support response.",
        "Excellent service overall, would definitely recommend to others.",
        "Not satisfied with the product quality, expected much better for the price.",
        "Amazing quality and fast delivery, exceeded my expectations completely.",
      ][i % 5],
      product_code: ["PRD001", "ITM-234", "PROD_567", "CODE123", "ITEM_890"][i % 5],
      region: ["North", "South", "East"][i % 3],
    }))

    return NextResponse.json({
      columns: mockColumns,
      data: mockData,
      message: "File processed successfully",
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Failed to process file" }, { status: 500 })
  }
}