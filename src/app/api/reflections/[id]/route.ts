import { quranSDK } from "@/lib/quran.foundation"
import { NextRequest, NextResponse } from "next/server"

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    await quranSDK.deleteReflection(id)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized - Please Login First" }, { status: 401 })
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
