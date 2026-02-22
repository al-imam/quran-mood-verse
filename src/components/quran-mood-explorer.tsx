"use client"

import { GlowingEdge } from "@/components/shared/glowing-edge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input"
import { GET_VERSES_BY_MOOD } from "@/gql/queries/verses.query"
import { cn } from "@/lib/utils"
import { useMoodStore, type Verse } from "@/stores/mood-store"
import { useScriptStore } from "@/stores/script-store"
import { useLazyQuery } from "@apollo/client/react"
import { ArrowUp, Loader2, Sparkles, SquareArrowOutUpRight } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { Fragment } from "react"

const languageLocaleMap = { en: "english", bn: "bengali" }
const transitionLocaleMap = { en: "85", bn: "161" }

export function QuranMoodExplorer() {
  const locale = useLocale()
  const t = useTranslations()

  const store = useMoodStore()
  const { script } = useScriptStore()

  const MOOD_PRESETS = [
    { label: t("moods.grateful"), key: "Grateful", emoji: "✨" },
    { label: t("moods.sad"), key: "Sad", emoji: "😔" },
    { label: t("moods.seeking-forgiveness"), key: "Seeking Forgiveness", emoji: "💫" },
    { label: t("moods.anxious"), key: "Anxious", emoji: "😰" },
    { label: t("moods.angry"), key: "Angry", emoji: "😡" },
  ]

  const [getVerses, { loading }] = useLazyQuery(GET_VERSES_BY_MOOD, {
    errorPolicy: "all",
  })

  async function handleSubmit(moodInput: string) {
    const mood = moodInput.trim()
    if (!mood) return

    store.setSubmitError(null)

    try {
      const { data, error } = await getVerses({ variables: { mood } })
      if (error) {
        return store.setSubmitError(error.message || t("errors.fetching-verses"))
      }

      if (data?.getVersesByMood?.verses && data.getVersesByMood.verses.length > 0) {
        store.updateVersesResult(data.getVersesByMood.verses, data.getVersesByMood.mood)
      } else {
        store.setSubmitError(t("errors.no-verses-found"))
      }
    } catch (_err) {
      store.setSubmitError(t("errors.general-error"))
    }
  }

  function handleChangeMood() {
    store.clearMoodState()
  }

  const verses = store.savedVerses.length > 0 ? store.savedVerses : []

  function getScript(scripts: Verse["scripts"]) {
    return scripts.find((option) => option.name.toLowerCase() === script)!.text
  }

  function getTranslation(translations: Verse["translations"]) {
    return translations.find((t) => t.languageId.toLowerCase() === languageLocaleMap[locale])!.text
  }

  return (
    <div>
      {verses.length <= 0 ? (
        <div className="relative flex min-h-[calc(var(--fs)-var(--footer-height))] flex-col items-center justify-center">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 text-center text-2xl text-balance">
              {t("home.tagline")}
            </div>

            <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
              <GlowingEdge onHover always={loading} round="1.95rem" size="0.25rem">
                <PromptInput
                  value={store.mood}
                  onValueChange={(value) => {
                    store.setMood(value.slice(0, 200))
                    if (store.submitError) store.setSubmitError(null)
                  }}
                  isLoading={loading}
                  onSubmit={() => void handleSubmit(store.mood)}
                >
                  <PromptInputTextarea
                    placeholder={t("home.mood-prompt")}
                    className="placeholder:text-muted-foreground text-foreground text-base"
                    disabled={loading}
                  />
                  <PromptInputActions className="items-center justify-between">
                    <div className="text-muted-foreground ml-2 text-xs">
                      {store.mood.trim().length}/200
                    </div>
                    <PromptInputAction
                      tooltip={loading ? t("home.finding-verses") : t("home.find-verses")}
                    >
                      <Button
                        variant="default"
                        size="icon"
                        className="h-10 w-10 rounded-full shadow-md transition-all duration-200 hover:shadow-lg"
                        disabled={loading || !store.mood.trim()}
                        onClick={() => void handleSubmit(store.mood)}
                      >
                        {loading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <ArrowUp className="h-5 w-5" />
                        )}
                      </Button>
                    </PromptInputAction>
                  </PromptInputActions>
                </PromptInput>
              </GlowingEdge>

              {store.submitError && (
                <Card className="bg-destructive/10 border-destructive/20 p-4">
                  <p className="text-destructive text-sm">{store.submitError}</p>
                </Card>
              )}

              <div className="flex flex-wrap justify-center gap-2">
                {MOOD_PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      store.setMood(preset.key)
                      void handleSubmit(preset.key)
                    }}
                    disabled={loading}
                    className="border-muted-foreground/20 hover:border-primary hover:bg-primary/5 hover:text-primary gap-2 rounded-full px-4 py-2 transition-all duration-200"
                  >
                    <span className="text-base">{preset.emoji}</span>
                    <span className="font-medium">{preset.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="my-8 flex flex-col gap-8">
          <div className="flex flex-col gap-1 text-center">
            <h2 className="text-2xl font-semibold">{t("home.verses-for-soul")}</h2>
            {store.currentMood && (
              <p className="text-muted-foreground">
                {t("home.based-on-mood", { mood: store.currentMood })}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-8">
            {verses.map((verse, index) => (
              <Fragment key={`${verse.surah.number}-${verse.number}`}>
                <div key={`${verse.surah.number}-${verse.number}`} className="relative">
                  <div className="flex flex-col gap-8">
                    <div className="flex justify-end">
                      <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={`https://quran.com/${verse.surah.number}?startingVerse=${verse.number}&translations=${transitionLocaleMap[locale]}`}
                        className="bg-primary/80 text-primary-foreground font-inter inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium"
                      >
                        {verse.surah.number}:{verse.number}
                        <SquareArrowOutUpRight className="size-3.5" />
                      </a>
                    </div>
                    <div className="text-right">
                      <p
                        dir="rtl"
                        className={cn("font-arabic text-4xl leading-relaxed", {
                          "font-arabic-indopak": script === "indopak",
                          "font-arabic-uthmani": script === "uthmani",
                        })}
                      >
                        {getScript(verse.scripts)}
                      </p>
                    </div>
                    <div>
                      <p className="text-foreground/90 text-base leading-loose">
                        {getTranslation(verse.translations)}
                      </p>
                    </div>
                  </div>
                </div>
                {index < verses.length - 1 && <div className="border-muted/20 border-b" />}
              </Fragment>
            ))}
          </div>

          <div className="my-4 text-center">
            <Button
              onClick={handleChangeMood}
              variant="outline"
              className="border-primary/20 hover:border-primary hover:bg-primary/5 hover:text-primary gap-2 px-6 py-3 transition-all duration-200"
            >
              <Sparkles className="h-4 w-4" />
              {t("home.mood-changed")}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
