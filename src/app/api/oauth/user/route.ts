import { quranSDK } from "@/lib/quran.foundation"
import { NextRequest, NextResponse } from "next/server"

export async function GET(_req: NextRequest) {
  try {
    const user = await quranSDK.getCurrentUser()
    if (!user) return NextResponse.json({ user: null }, { status: 401 })
    return NextResponse.json({ user })
  } catch {
    return NextResponse.json({ user: null }, { status: 500 })
  }
}
