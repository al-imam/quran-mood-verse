"use client"

import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/auth-store"
import { useMoodStore } from "@/stores/mood-store"
import { ArrowUp, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { ReflectionInput } from "./reflection-input"

export function ReflectionPrompt() {
  const t = useTranslations()
  const { isAuthenticated, isLoading, setUser, setLoading } = useAuthStore()
  const { savedVerses } = useMoodStore()
  const [showReflectionInput, setShowReflectionInput] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch("/api/oauth/user")
        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            setUser(data.user)
          }
        }
      } catch (error) {
        console.error("Error checking auth status:", error)
      } finally {
        setLoading(false)
      }
    }

    void checkAuth()
  }, [setUser, setLoading])

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
    <div className="my-8">
      <div className="mb-4 text-center">
        <p className="text-muted-foreground text-sm">{t("reflection.based-on-verses")}</p>
        <p className="text-foreground mt-2 text-lg font-medium">{t("reflection.question")}</p>
      </div>

      {showReflectionInput ? (
        <ReflectionInput verses={savedVerses} onClose={() => setShowReflectionInput(false)} />
      ) : (
        <div className="text-center">
          <Button
            onClick={handleAddReflection}
            variant="outline"
            className="border-primary/20 hover:border-primary hover:bg-primary/5 hover:text-primary gap-2 px-6 py-3 transition-all duration-200"
          >
            <ArrowUp className="h-4 w-4" />
            {t("reflection.add-reflection")}
          </Button>
        </div>
      )}
    </div>
  )
}
