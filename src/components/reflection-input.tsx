/* eslint-disable max-lines, react-func/max-lines-per-function */

"use client"

import { GlowingEdge } from "@/components/shared/glowing-edge"
import { Button } from "@/components/ui/button"
import { PromptInput, PromptInputActions, PromptInputTextarea } from "@/components/ui/prompt-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuthStore } from "@/stores/auth-store"
import { type Verse } from "@/stores/mood-store"
import { Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

interface ReflectionInputProps {
  verses: Verse[]
  onClose?: () => void
}

interface ReflectionFormData {
  reflectionText: string
  verseKey: string
}

export function ReflectionInput({ verses, onClose }: ReflectionInputProps) {
  const t = useTranslations()
  const { isAuthenticated, isLoading: authLoading, user, logout } = useAuthStore()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ReflectionFormData>({
    defaultValues: {
      reflectionText: "",
      verseKey: verses.length > 0 ? `${verses[0].surah.number}:${verses[0].number}` : "",
    },
  })

  const reflectionText = watch("reflectionText")

  useEffect(() => {
    if (verses.length > 0) setValue("verseKey", `${verses[0].surah.number}:${verses[0].number}`)
  }, [verses, setValue])

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

  async function onSubmit(data: ReflectionFormData) {
    if (!isAuthenticated) {
      toast.error("Please login to submit your reflection")
      return (window.location.href = "/api/oauth/auth")
    }

    try {
      const response = await fetch("/api/reflections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          logout()
          toast.error("Your session has expired. Please login again.")
          return (window.location.href = "/api/oauth/auth")
        }

        if (result.error === "Validation Error" && result.errors) {
          return result.errors.forEach((err: { field: string; message: string }) =>
            setError(err.field as "verseKey", { message: err.message })
          )
        }

        throw new Error("Failed to submit Reflection")
      }

      toast.success("Reflection submitted successfully!")
      setValue("reflectionText", "")
      onClose?.()

      // Docs says return {post: {}} but really returns {data: {}} ???
      const postId = result?.post?.id ?? result?.data?.id
      if (postId) window.location.href = `https://quranreflect.com/posts/${postId}`
    } catch (error) {
      if (error instanceof Error && error.message.includes("Unauthorized")) {
        logout()
        toast.error("Your session has expired. Please login again.")
        return (window.location.href = "/api/oauth/auth")
      }

      toast.error("Failed to submit reflection. Please try again.")
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
    <>
      <div className="mb-2 flex items-end justify-between gap-4">
        <span className="text-muted-foreground ml-[1.5px] text-sm font-medium">
          {t("reflection.select-verse")}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleLogout}
          className="text-muted-foreground hover:text-destructive h-7 gap-2"
        >
          {t("logout")}
        </Button>
      </div>

      <div className="mb-4">
        <Controller
          control={control}
          name="verseKey"
          rules={{
            required: "Please select a verse",
            pattern: {
              value: /^\d+:\d+$/,
              message: "Invalid verse format",
            },
          }}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a verse" />
              </SelectTrigger>
              <SelectContent>
                {verses.map((verse) => (
                  <SelectItem
                    key={`${verse.surah.number}-${verse.number}`}
                    value={`${verse.surah.number}:${verse.number}`}
                  >
                    {verse.surah.number}:{verse.number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.verseKey && (
          <p className="text-destructive pt-1.5 text-xs">{errors.verseKey?.message}</p>
        )}
      </div>

      <GlowingEdge onHover always={isSubmitting} round="0.6rem" size="0.2rem">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="relative">
            <PromptInput
              value={reflectionText}
              onValueChange={(value) => setValue("reflectionText", value.slice(0, 500))}
              isLoading={isSubmitting}
              onSubmit={handleSubmit(onSubmit)}
              className="rounded-md"
            >
              <PromptInputTextarea
                {...register("reflectionText", {
                  required: "Please write your reflection",
                  validate: (value) =>
                    value.trim().length >= 6 || "Reflection must be at least 6 characters long",
                })}
                placeholder={t("reflection.placeholder")}
                className="placeholder:text-muted-foreground text-foreground min-h-[120px] resize-none px-2 py-2"
                disabled={isSubmitting}
              />

              <PromptInputActions className="mr-1 mb-1 items-end justify-between">
                <div className="flex flex-col gap-1">
                  <div className="text-muted-foreground ml-2 text-xs">
                    {reflectionText.trim().length}/500
                  </div>
                  {errors.reflectionText && (
                    <p className="text-destructive ml-2 text-xs">
                      {errors.reflectionText?.message}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {onClose && (
                    <Button
                      type="button"
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
                    type="submit"
                    variant="default"
                    size="sm"
                    disabled={isSubmitting}
                    className="h-8"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>Post As {user?.name.split(" ").at(-1) ?? "User"}</>
                    )}
                  </Button>
                </div>
              </PromptInputActions>
            </PromptInput>
          </div>
        </form>
      </GlowingEdge>
    </>
  )
}
