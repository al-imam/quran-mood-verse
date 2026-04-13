import { quranSDK } from "@/lib/quran.foundation"
import { NextRequest, NextResponse } from "next/server"

export async function GET(_req: NextRequest) {
  try {
    const authUrl = await quranSDK.generateAuthorizationUrl()
    return NextResponse.redirect(authUrl)
  } catch {
    return NextResponse.json({ error: "Authorization Failed" }, { status: 500 })
  }
}
