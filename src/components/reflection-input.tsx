"use client"

import { GlowingEdge } from "@/components/shared/glowing-edge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PromptInput, PromptInputActions, PromptInputTextarea } from "@/components/ui/prompt-input"
import { useAuthStore } from "@/stores/auth-store"
import { type Verse } from "@/stores/mood-store"
import { Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface ReflectionInputProps {
  verses: Verse[]
  onClose?: () => void
}

export function ReflectionInput({ verses, onClose }: ReflectionInputProps) {
  const t = useTranslations()
  const { isAuthenticated, isLoading: authLoading, user, logout } = useAuthStore()
  const [reflection, setReflection] = useState("")
  const [selectedVerseKey, setSelectedVerseKey] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (verses.length > 0) {
      setSelectedVerseKey(`${verses[0].surah.number}:${verses[0].number}`)
    }
  }, [verses])

  async function handleLogout() {
    try {
      logout()
      toast.success("Logged out successfully")

      const response = await fetch("/api/oauth/logout", { method: "POST" })

      if (response.ok) {
        const data = await response.json()
        if (data.logoutUrl) window.location.href = data.logoutUrl
      } else {
        onClose?.()
      }
    } catch {
      toast.error("Log out failed")
    }
  }

  async function handleSubmit() {
    if (!reflection.trim()) return toast.error("Please write your reflection")

    if (!isAuthenticated) {
      toast.error("Please login to submit your reflection")
      return (window.location.href = "/api/oauth/auth")
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/reflections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reflectionText: reflection, verseKey: selectedVerseKey }),
      })

      if (!response.ok) throw new Error("Failed to submit reflection")

      toast.success("Reflection submitted successfully!")
      setReflection("")
      onClose?.()
    } catch {
      toast.error("Failed to submit reflection. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="my-8 text-center">
        <Loader2 className="text-muted-foreground mx-auto h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <Card className="border-primary/20 bg-muted/50 p-6">
      <div className="mb-2 flex items-end justify-between">
        <span className="text-muted-foreground text-sm font-medium">
          {t("reflection.select-verse")}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-muted-foreground hover:text-destructive gap-2"
        >
          Logout
        </Button>
      </div>

      <div className="mb-4">
        <select
          value={selectedVerseKey}
          onChange={(e) => setSelectedVerseKey(e.target.value)}
          className="border-input bg-background ring-offset-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
        >
          {verses.map((verse) => (
            <option
              key={`${verse.surah.number}-${verse.number}`}
              value={`${verse.surah.number}:${verse.number}`}
            >
              {verse.surah.number}:{verse.number}
            </option>
          ))}
        </select>
      </div>

      <GlowingEdge onHover always={isSubmitting} round="0.6rem" size="0.2rem">
        <PromptInput
          value={reflection}
          onValueChange={(value) => setReflection(value.slice(0, 500))}
          isLoading={isSubmitting}
          onSubmit={handleSubmit}
          className="rounded-md"
        >
          <PromptInputTextarea
            placeholder={t("reflection.placeholder")}
            className="placeholder:text-muted-foreground text-foreground min-h-[120px] resize-none"
            disabled={isSubmitting}
          />

          <PromptInputActions className="mr-1 mb-1 items-end justify-between">
            <div className="text-muted-foreground ml-2 text-xs">{reflection.trim().length}/500</div>
            <div className="flex gap-2">
              {onClose && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="h-8"
                >
                  {t("reflection.close")}
                </Button>
              )}
              <Button
                variant="default"
                size="sm"
                disabled={isSubmitting || !reflection.trim()}
                onClick={handleSubmit}
                className="h-8"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>Post As {user?.name.split(" ").at(-1) || "User"}</>
                )}
              </Button>
            </div>
          </PromptInputActions>
        </PromptInput>
      </GlowingEdge>
    </Card>
  )
}
