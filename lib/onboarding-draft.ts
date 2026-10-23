export type ExtractedDraft = {
  full_name: string
  headline: string
  summary: string
  skills: string
  location: string
}

export type OnboardingDraft = {
  step: number
  role: string
  location: string
  remote: "" | "remote" | "hybrid" | "onsite"
  authorization: string
  salary: string
  dealBreakers: string
  extracted: ExtractedDraft | null
}

export const ONBOARDING_KEY = "wg-onboarding"

export const EMPTY_ONBOARDING: OnboardingDraft = {
  step: 0,
  role: "",
  location: "",
  remote: "",
  authorization: "",
  salary: "",
  dealBreakers: "",
  extracted: null,
}

export function parseOnboardingDraft(raw: string): OnboardingDraft {
  if (!raw) return EMPTY_ONBOARDING
  try {
    const parsed = JSON.parse(raw) as Partial<OnboardingDraft>
    return {
      ...EMPTY_ONBOARDING,
      ...parsed,
      remote: parsed.remote === "remote" || parsed.remote === "hybrid" || parsed.remote === "onsite" ? parsed.remote : "",
      extracted: parsed.extracted ?? null,
      step: typeof parsed.step === "number" ? parsed.step : 0,
    }
  } catch {
    return EMPTY_ONBOARDING
  }
}

export function writeOnboardingDraft(draft: OnboardingDraft): void {
  localStorage.setItem(ONBOARDING_KEY, JSON.stringify(draft))
  window.dispatchEvent(new Event("wg-onboarding"))
}

export function subscribeOnboarding(onStoreChange: () => void): () => void {
  window.addEventListener("wg-onboarding", onStoreChange)
  window.addEventListener("storage", onStoreChange)
  return () => {
    window.removeEventListener("wg-onboarding", onStoreChange)
    window.removeEventListener("storage", onStoreChange)
  }
}

export function onboardingSteps(draft: OnboardingDraft): number[] {
  return draft.extracted ? [0, 1, 2, 3, 4, 5] : [0, 1, 3, 4, 5]
}
