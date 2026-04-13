import { quranSDK } from "@/lib/quran.foundation"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { reflectionText, verseKey } = body

    if (!reflectionText || !verseKey) {
      return NextResponse.json({ error: "Missing Required Fields" }, { status: 400 })
    }

    const post = await quranSDK.createReflection(reflectionText, verseKey)

    return NextResponse.json({ message: "Reflection Created Successfully", post }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized - Please Login First" }, { status: 401 })
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
