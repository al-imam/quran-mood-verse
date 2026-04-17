/* eslint-disable max-lines, react-func/max-lines-per-function, @typescript-eslint/no-namespace */

import { env } from "@/env"
import { joinUrl } from "@/lib/url"
import axios from "axios"
import { LRUCache } from "lru-cache"
import { cookies } from "next/headers"
import z from "zod"

const OAUTH_BASE_URL = env.QURAN_FOUNDATION_OAUTH_BASE_URL
const API_BASE_URL = env.QURAN_FOUNDATION_API_BASE_URL

const ACCESS_TOKEN_URL = joinUrl(OAUTH_BASE_URL, "oauth2", "token")
const OAUTH_AUTH_URL = joinUrl(OAUTH_BASE_URL, "oauth2", "auth")
const OAUTH_LOGOUT_URL = joinUrl(OAUTH_BASE_URL, "oauth2", "sessions", "logout")
const API_URL = joinUrl(API_BASE_URL, "content", "api", "v4")
const POSTS_API_URL = joinUrl(API_BASE_URL, "quran-reflect", "v1", "posts")

export type VerseLevelField =
  | "chapter_id"
  | "text_indopak"
  | "text_imlaei_simple"
  | "text_imlaei"
  | "text_uthmani"
  | "text_uthmani_simple"
  | "text_uthmani_tajweed"
  | "text_qpc_hafs"
  | "qpc_uthmani_hafs"
  | "text_qpc_nastaleeq_hafs"
  | "text_qpc_nastaleeq"
  | "text_indopak_nastaleeq"
  | "image_url"
  | "image_width"
  | "code_v1"
  | "code_v2"
  | "page_number"
  | "v1_page"
  | "v2_page"

export type WordLevelField =
  | "verse_id"
  | "chapter_id"
  | "text_uthmani"
  | "text_indopak"
  | "text_imlaei_simple"
  | "text_imlaei"
  | "text_uthmani_simple"
  | "text_uthmani_tajweed"
  | "text_qpc_hafs"
  | "verse_key"
  | "location"
  | "code_v1"
  | "code_v2"
  | "v1_page"
  | "v2_page"
  | "line_number"
  | "line_v2"
  | "line_v1"

export type TranslationField =
  | "chapter_id"
  | "verse_number"
  | "verse_key"
  | "juz_number"
  | "hizb_number"
  | "rub_el_hizb_number"
  | "page_number"
  | "ruku_number"
  | "manzil_number"
  | "resource_name"
  | "language_name"
  | "language_id"
  | "id"
  | "text"

export interface GetVerseOptions {
  language?: string
  words?: boolean
  translations?: string
  audio?: number
  tafsirs?: string
  word_fields?: Partial<Record<WordLevelField, boolean>> | WordLevelField[]
  translation_fields?: Partial<Record<TranslationField, boolean>> | TranslationField[]
  fields?: Partial<Record<VerseLevelField, boolean>> | VerseLevelField[]
}

const AccessResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  scope: z.string(),
})

export function generateState(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")
}

export function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null

    const payload = parts[1]
    const paddedPayload = payload + "=".repeat((4 - (payload.length % 4)) % 4)
    const decoded = Buffer.from(paddedPayload, "base64").toString("utf-8")
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

export const OAUTH_SCOPES = "openid post offline_access"

export const COOKIE_CONFIG = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
}

namespace QuranFoundation {
  export interface Translation {
    resource_id: number
    resource_name: string
    id?: number
    text: string
    verse_id?: number
    language_id?: number
    language_name?: string
    verse_key?: string
    chapter_id?: number
    verse_number?: number
    juz_number?: number
    hizb_number?: number
    rub_number?: number
    page_number?: number
  }

  export interface Transliteration {
    text: string
    language_name: string
  }

  export interface AudioSegment {
    text: string
    language_name: string
  }

  export interface Audio {
    url: string
    duration?: number
    format?: string
    segments?: AudioSegment[]
  }

  export interface Word {
    id: number
    position: number
    text_uthmani?: string
    text_indopak?: string
    text_imlaei?: string
    verse_key?: string
    page_number?: number
    line_number?: number
    audio_url: string
    location?: string
    char_type_name: string
    code_v1?: string
    code_v2?: string
    translation: Translation
    transliteration: Transliteration
    v1_page?: number
    v2_page?: number
  }

  export interface Verse {
    id: number
    chapter_id?: number
    verse_number: number
    verse_key: string
    verse_index?: number
    text_uthmani?: string
    text_uthmani_simple?: string
    text_imlaei?: string
    text_imlaei_simple?: string
    text_indopak?: string
    text_indopak_nastaleeq?: string
    text_uthmani_tajweed?: string
    juz_number: number
    hizb_number: number
    rub_number: number
    page_number: number
    image_url?: string
    image_width?: number
    words: Word[]
    audio?: Audio
    translations?: Translation[]
    code_v1?: string
    code_v2?: string
    v1_page?: number
    v2_page?: number
  }

  export interface GetVerseByKeyResponse {
    verse: Verse
  }
}

const verseCache = new LRUCache<string, QuranFoundation.GetVerseByKeyResponse>({ max: 10000 })

export class QFSDK {
  private static instance: QFSDK | null = null

  private clientId: string
  private clientSecret: string
  private redirectUri: string

  private accessToken: string | null = null
  private tokenExpiry: number | null = null

  private constructor({ clientId, clientSecret }: { clientId: string; clientSecret: string }) {
    if (QFSDK.instance) throw new Error("Use QFSDK.getInstance() instead of new.")

    this.clientId = clientId
    this.clientSecret = clientSecret
    this.redirectUri = joinUrl(env.NEXT_PUBLIC_ORIGIN, "api", "oauth", "callback")
  }

  public static getInstance(config: { clientId: string; clientSecret: string }) {
    if (!QFSDK.instance) {
      QFSDK.instance = new QFSDK(config)
    }

    return QFSDK.instance
  }

  private getTokenMaxAge(token: string, fallbackMaxAge: number): number {
    const tokenData = decodeJwt(token)

    if (tokenData && typeof tokenData.exp === "number" && typeof tokenData.iat === "number") {
      return tokenData.exp - tokenData.iat
    }

    return fallbackMaxAge
  }

  public async generateAuthorizationUrl(): Promise<string> {
    const state = generateState()
    const codeVerifier = generateCodeVerifier()

    const encoder = new TextEncoder()
    const data = encoder.encode(codeVerifier)
    const digest = await crypto.subtle.digest("SHA-256", data)
    const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "")

    const cookieStore = await cookies()
    cookieStore.set("oauth_state", state, {
      ...COOKIE_CONFIG,
      maxAge: 60 * 10,
    })

    cookieStore.set("oauth_code_verifier", codeVerifier, {
      ...COOKIE_CONFIG,
      maxAge: 60 * 10,
    })

    const authUrl = new URL(OAUTH_AUTH_URL)
    authUrl.searchParams.set("client_id", this.clientId)
    authUrl.searchParams.set("redirect_uri", this.redirectUri)
    authUrl.searchParams.set("response_type", "code")
    authUrl.searchParams.set("scope", OAUTH_SCOPES)
    authUrl.searchParams.set("state", state)
    authUrl.searchParams.set("code_challenge", codeChallenge)
    authUrl.searchParams.set("code_challenge_method", "S256")

    return authUrl.toString()
  }

  public async exchangeCodeForTokens(
    code: string,
    state: string
  ): Promise<{
    access_token: string
    refresh_token?: string
    id_token?: string
    token_type: string
    expires_in?: number
    expires_at?: number
  } | null> {
    const cookieStore = await cookies()
    const storedState = cookieStore.get("oauth_state")?.value
    const codeVerifier = cookieStore.get("oauth_code_verifier")?.value

    if (!storedState || !codeVerifier || storedState !== state) return null

    const credentials = `${this.clientId}:${this.clientSecret}`
    const encodedCredentials = Buffer.from(credentials).toString("base64")

    try {
      const response = await axios.post(
        ACCESS_TOKEN_URL,
        new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: this.redirectUri,
          code_verifier: codeVerifier,
        }).toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
            Authorization: `Basic ${encodedCredentials}`,
          },
        }
      )

      const tokens = response.data

      cookieStore.set("oauth_access_token", tokens.access_token, {
        ...COOKIE_CONFIG,
        maxAge: this.getTokenMaxAge(tokens.access_token, 60 * 60),
      })

      if (tokens.refresh_token) {
        cookieStore.set("oauth_refresh_token", tokens.refresh_token, {
          ...COOKIE_CONFIG,
          maxAge: 60 * 60 * 24 * 30,
        })
      }

      if (tokens.id_token) {
        cookieStore.set("oauth_id_token", tokens.id_token, {
          ...COOKIE_CONFIG,
          maxAge: this.getTokenMaxAge(tokens.id_token, 60 * 60),
        })
      }

      cookieStore.delete("oauth_state")
      cookieStore.delete("oauth_code_verifier")

      return tokens
    } catch {
      return null
    }
  }

  public async getCurrentUser(): Promise<{ id: string; name: string; email: string } | null> {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("oauth_access_token")?.value
    const idToken = cookieStore.get("oauth_id_token")?.value

    if (!accessToken || !idToken) return null

    const userData = decodeJwt(idToken)
    if (!userData) return null

    const combinedName = [userData.first_name, userData.last_name].filter(Boolean).join(" ")
    const userName = combinedName || (userData.name as string) || "Unknown"

    return { id: userData.sub as string, name: userName, email: userData.email as string }
  }

  public async logout(): Promise<string> {
    const cookieStore = await cookies()

    const idToken = cookieStore.get("oauth_id_token")?.value
    cookieStore.delete("oauth_access_token")
    cookieStore.delete("oauth_refresh_token")
    cookieStore.delete("oauth_id_token")
    cookieStore.delete("oauth_state")
    cookieStore.delete("oauth_code_verifier")

    const logoutUrl = new URL(OAUTH_LOGOUT_URL)
    logoutUrl.searchParams.set("client_id", this.clientId)
    // logoutUrl.searchParams.set("post_logout_redirect_uri", env.NEXT_PUBLIC_ORIGIN)
    logoutUrl.searchParams.set("redirect_uri", env.NEXT_PUBLIC_ORIGIN)
    if (idToken) logoutUrl.searchParams.set("id_token_hint", idToken)

    return logoutUrl.toString()
  }

  private async refreshAccessToken(refreshToken: string): Promise<{
    access_token: string
    refresh_token?: string
    id_token?: string
    expires_in?: number
  } | null> {
    const credentials = `${this.clientId}:${this.clientSecret}`
    const encodedCredentials = Buffer.from(credentials).toString("base64")

    try {
      const response = await axios.post(
        ACCESS_TOKEN_URL,
        new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }).toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
            Authorization: `Basic ${encodedCredentials}`,
          },
        }
      )

      const tokens = response.data

      const cookieStore = await cookies()

      cookieStore.set("oauth_access_token", tokens.access_token, {
        ...COOKIE_CONFIG,
        maxAge: this.getTokenMaxAge(tokens.access_token, 60 * 60),
      })

      if (tokens.refresh_token) {
        cookieStore.set("oauth_refresh_token", tokens.refresh_token, {
          ...COOKIE_CONFIG,
          maxAge: 60 * 60 * 24 * 30,
        })
      }

      if (tokens.id_token) {
        cookieStore.set("oauth_id_token", tokens.id_token, {
          ...COOKIE_CONFIG,
          maxAge: this.getTokenMaxAge(tokens.id_token, 60 * 60),
        })
      }

      return tokens
    } catch {
      const cookieStore = await cookies()
      cookieStore.delete("oauth_access_token")
      cookieStore.delete("oauth_refresh_token")
      cookieStore.delete("oauth_id_token")
      return null
    }
  }

  private async fetchAccessToken() {
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64")

    const response = await axios.post(
      ACCESS_TOKEN_URL,
      "grant_type=client_credentials&scope=content",
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    )

    const result = AccessResponseSchema.parse(response.data)

    this.accessToken = result.access_token
    this.tokenExpiry = Date.now() + result.expires_in * 1000

    return this.accessToken
  }

  public async getAccessToken() {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    return this.fetchAccessToken()
  }

  public async getTranslationResources() {
    const accessToken = await this.getAccessToken()

    const response = await axios<QuranFoundation.GetVerseByKeyResponse>({
      method: "get",
      url: joinUrl(API_URL, "resources/translations"),
      headers: {
        "x-auth-token": accessToken,
        "x-client-id": this.clientId,
      },
    })

    return response.data
  }

  public joinQueryParams(value: string[] | Record<string, boolean>): string {
    if (Array.isArray(value)) {
      return value.join(",")
    } else {
      return Object.entries(value)
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(",")
    }
  }

  public async getVerse(key: string, options?: GetVerseOptions) {
    const Url = new URL(API_URL)

    Url.pathname = joinUrl(Url.pathname, "verses/by_key", key)

    const params = Url.searchParams

    if (options?.language) params.append("language", options.language)
    if (options?.words !== undefined) params.append("words", options.words.toString())
    if (options?.translations) params.append("translations", options.translations)
    if (options?.audio) params.append("audio", options.audio.toString())
    if (options?.tafsirs) params.append("tafsirs", options.tafsirs)

    if (options?.word_fields) {
      params.append("word_fields", this.joinQueryParams(options.word_fields!))
    }

    if (options?.translation_fields) {
      params.append("translation_fields", this.joinQueryParams(options.translation_fields!))
    }

    if (options?.fields) {
      params.append("fields", this.joinQueryParams(options.fields!))
    }

    const url = Url.toString()

    if (verseCache.has(url)) return verseCache.get(url)!

    const accessToken = await this.getAccessToken()

    const response = await axios<QuranFoundation.GetVerseByKeyResponse>({
      method: "get",
      url,
      headers: {
        "x-auth-token": accessToken,
        "x-client-id": this.clientId,
      },
    })

    verseCache.set(url, response.data)

    return response.data
  }

  public async createReflection(reflectionText: string, verseKey: string): Promise<unknown> {
    const accessToken = await this.getValidUserAccessToken()
    if (!accessToken) throw new Error("Unauthorized - Please login first")

    const [surahNumber, verseNumber] = verseKey.split(":")

    const response = await axios.post(
      POSTS_API_URL,
      {
        post: {
          body: reflectionText,
          draft: false,
          roomPostStatus: 1, // 1 = Publicly, 0 = AsRoom, 2 = OnlyMembers
          references: [
            {
              chapterId: parseInt(surahNumber, 10),
              from: parseInt(verseNumber, 10),
              to: parseInt(verseNumber, 10),
            },
          ],
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": accessToken,
          "x-client-id": this.clientId,
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    return response.data
  }

  public async getUserReflections(
    page = 1,
    limit = 20
  ): Promise<{ data: unknown[]; total: number }> {
    const accessToken = await this.getValidUserAccessToken()
    if (!accessToken) throw new Error("Unauthorized - Please login first")

    const response = await axios.get(`${POSTS_API_URL}/my-posts`, {
      params: { page, limit, tab: "my_reflections" },
      headers: {
        "Content-Type": "application/json",
        "x-auth-token": accessToken,
        "x-client-id": this.clientId,
        Authorization: `Bearer ${accessToken}`,
      },
    })

    return response.data
  }

  public async deleteReflection(postId: string): Promise<{ success: boolean }> {
    const accessToken = await this.getValidUserAccessToken()
    if (!accessToken) throw new Error("Unauthorized - Please login first")

    const response = await axios.delete(`${POSTS_API_URL}/${postId}`, {
      headers: {
        "Content-Type": "application/json",
        "x-auth-token": accessToken,
        "x-client-id": this.clientId,
        Authorization: `Bearer ${accessToken}`,
      },
    })

    return response.data
  }

  private async getValidUserAccessToken(): Promise<string | null> {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("oauth_access_token")?.value
    const refreshToken = cookieStore.get("oauth_refresh_token")?.value

    if (!accessToken && !refreshToken) return null

    if (accessToken) {
      const jwtData = decodeJwt(accessToken)
      if (jwtData && typeof jwtData.exp === "number") {
        const expiryTime = jwtData.exp * 1000
        const currentTime = Date.now()
        const timeUntilExpiry = expiryTime - currentTime

        if (timeUntilExpiry < 300000) {
          if (refreshToken) {
            const refreshed = await this.refreshAccessToken(refreshToken)
            if (refreshed?.access_token) return refreshed.access_token
            if (timeUntilExpiry < 0) return null
          }

          if (timeUntilExpiry < 0) return null
        }

        return accessToken
      }

      return null
    }

    if (refreshToken) {
      const refreshed = await this.refreshAccessToken(refreshToken)
      return refreshed?.access_token || null
    }

    return null
  }
}

export const quranSDK = QFSDK.getInstance({
  clientId: env.QURAN_FOUNDATION_CLIENT_ID!,
  clientSecret: env.QURAN_FOUNDATION_CLIENT_SECRET!,
})
