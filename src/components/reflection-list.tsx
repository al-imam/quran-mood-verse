"use client"

import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/auth-store"
import { Loader2, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface Reflection {
  id: string
  body: string
  createdAt: string
  references?: Array<{
    chapterId: number
    from: number
    to: number
  }>
}

function timeAgo(input: string | Date): string {
  const date = typeof input === "string" ? new Date(input) : input

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

  if (isNaN(seconds)) return "invalid date"

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
    { label: "second", seconds: 1 },
  ]

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds)
    if (count > 0) {
      return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`
    }
  }

  return "just now"
}

export function ReflectionList() {
  const { isAuthenticated } = useAuthStore()
  const [reflections, setReflections] = useState<Reflection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated) void loadReflections()
  }, [isAuthenticated])

  async function loadReflections() {
    try {
      setIsLoading(true)
      const response = await fetch("/api/reflections")
      if (!response.ok) throw new Error("Failed to load reflections")

      const data = await response.json()
      const sorted = (data.data || []).sort(
        (a: Reflection, b: Reflection) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      setReflections(sorted)
    } catch (error) {
      toast.error("Failed to load reflections")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this reflection?")) return

    try {
      setIsDeleting(id)
      const response = await fetch(`/api/reflections/${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete reflection")
      toast.success("Reflection deleted successfully")
      setReflections((prev) => prev.filter((r) => r.id !== id))
    } catch (error) {
      toast.error("Failed to delete reflection")
      console.error(error)
    } finally {
      setIsDeleting(null)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="text-muted-foreground p-4 text-center text-sm">
        Please login to view your reflections
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (reflections.length === 0) {
    return <div className="text-muted-foreground p-4 text-center text-sm">No reflections found</div>
  }

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your Reflections</h2>
        <span className="text-muted-foreground text-sm">{reflections.length} total</span>
      </div>
      {reflections.map((reflection) => (
        <div
          key={reflection.id}
          className="bg-background hover:bg-muted/50 relative rounded-lg border p-4 transition-colors"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-medium">
              {timeAgo(reflection.createdAt)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(reflection.id)}
              disabled={isDeleting === reflection.id}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-7 shrink-0"
            >
              {isDeleting === reflection.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
          <p className="mb-3 text-sm leading-relaxed">{reflection.body}</p>
          {reflection.references && reflection.references.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {reflection.references.map((ref, idx) => (
                <span
                  key={idx}
                  className="bg-muted text-muted-foreground rounded-md px-2 py-1 text-xs font-medium"
                >
                  {ref.chapterId}:{ref.from}
                  {ref.from !== ref.to ? `-${ref.to}` : ""}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
