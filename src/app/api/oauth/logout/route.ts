import { quranSDK } from "@/lib/quran.foundation"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const logoutUrl = await quranSDK.logout()
    return NextResponse.json({ logoutUrl })
  } catch {
    return NextResponse.json({ logoutUrl: process.env.NEXT_PUBLIC_ORIGIN! }, { status: 500 })
  }
}
