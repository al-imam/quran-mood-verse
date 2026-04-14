"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthStore } from "@/stores/auth-store"
import { useMoodStore } from "@/stores/mood-store"
import { ArrowUp, HelpCircle, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { ReflectionInput } from "./reflection-input"

export function ReflectionPrompt() {
  const t = useTranslations()
  const { isAuthenticated, isLoading, setUser, setLoading, logout } = useAuthStore()
  const { savedVerses } = useMoodStore()
  const [showReflectionInput, setShowReflectionInput] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch("/api/oauth/user")
        if (response.ok) {
          const data = await response.json()
          if (data.user) setUser(data.user)
        } else if (response.status === 401) {
          logout()
        }
      } catch (error) {
        console.error("Error checking auth status:", error)
      } finally {
        setLoading(false)
      }
    }

    void checkAuth()
  }, [setUser, setLoading, logout])

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const authSuccess = urlParams.get("auth")
    const authError = urlParams.get("error")

    if (authSuccess === "success") {
      window.history.replaceState({}, "", window.location.pathname)
      toast.success("Successfully logged in!")

      void fetch("/api/oauth/user")
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            setUser(data.user)
            setShowReflectionInput(true)
          }
        })
    } else if (authError) {
      window.history.replaceState({}, "", window.location.pathname)
      toast.error(decodeURIComponent(authError))
    }
  }, [setUser])

  function handleAddReflection() {
    if (!isAuthenticated) {
      window.location.href = "/api/oauth/auth"
    } else {
      setShowReflectionInput(true)
    }
  }

  if (isLoading) {
    return (
      <div className="my-8 text-center">
        <Loader2 className="text-muted-foreground mx-auto h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <Card className="border-primary/20 bg-muted/30 mb-4 p-3 pt-2 md:mb-8 md:p-6 md:pt-5">
      {showReflectionInput ? (
        <ReflectionInput verses={savedVerses} onClose={() => setShowReflectionInput(false)} />
      ) : (
        <>
          <CardHeader className="pb-4 text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              <CardTitle className="text-lg">{t("reflection.card-title")}</CardTitle>
              <a
                href="https://quranreflect.com/faq"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="FAQ"
              >
                <HelpCircle className="h-5 w-5" />
              </a>
            </div>

            <p className="text-muted-foreground text-sm">{t("reflection.prompt")}</p>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              onClick={handleAddReflection}
              variant="outline"
              className="border-primary/20 hover:border-primary hover:bg-primary/5 hover:text-primary gap-2 px-6 py-3 transition-all duration-200"
            >
              <ArrowUp className="h-4 w-4" />
              {t("reflection.add-reflection")}
            </Button>
          </CardContent>
        </>
      )}
    </Card>
  )
}
