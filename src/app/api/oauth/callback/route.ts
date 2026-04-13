import { env } from "@/env"
import { quranSDK } from "@/lib/quran.foundation"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")

    if (error) {
      const errorDescription = searchParams.get("error_description")
      return NextResponse.redirect(
        `${env.NEXT_PUBLIC_ORIGIN}/?error=${encodeURIComponent(errorDescription || error)}`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${env.NEXT_PUBLIC_ORIGIN}/?error=${encodeURIComponent("Missing authorization code or state")}`
      )
    }

    const tokens = await quranSDK.exchangeCodeForTokens(code, state)

    if (!tokens) {
      return NextResponse.redirect(
        `${env.NEXT_PUBLIC_ORIGIN}/?error=${encodeURIComponent("Failed to exchange token")}`
      )
    }

    return NextResponse.redirect(`${env.NEXT_PUBLIC_ORIGIN}/?auth=success`)
  } catch {
    return NextResponse.redirect(
      `${env.NEXT_PUBLIC_ORIGIN}/?error=${encodeURIComponent("Authentication Failed")}`
    )
  }
}
