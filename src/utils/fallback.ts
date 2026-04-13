import { FALLBACK_VERSES } from "@/constants/fallback-verses"
import { toKebabCase } from "@/utils/casing"

/**
 * Gets fallback verse keys for a given mood
 * @param mood - The mood/feeling string
 * @returns Array of verse keys in "surah:verse" format, or null if no fallback exists
 *
 * @example
 * getFallbackVerses("Seeking Forgiveness") // ["39:53", "66:8", ...]
 * getFallbackVerses("anxious") // ["13:28", "65:3", ...]
 * getFallbackVerses("unknown") // null
 */
export function getFallbackVerses(mood: string): string[] | null {
  const normalizedMood = toKebabCase(mood)
  return FALLBACK_VERSES[normalizedMood] || null
}
