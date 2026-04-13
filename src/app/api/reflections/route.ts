import { quranSDK } from "@/lib/quran.foundation"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const reflectionSchema = z.object({
  reflectionText: z.string().trim().min(6, "Reflection must be at least 6 characters long"),
  verseKey: z.string().regex(/^\d+:\d+$/, "Verse key must be in format `Surah:Verse`"),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const validationResult = reflectionSchema.safeParse(body)

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }))

      return NextResponse.json({ error: "Validation Error", errors }, { status: 400 })
    }

    const post = await quranSDK.createReflection(
      validationResult.data.reflectionText,
      validationResult.data.verseKey
    )

    return NextResponse.json({ message: "Reflection Created Successfully", post }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized - Please Login First" }, { status: 401 })
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
