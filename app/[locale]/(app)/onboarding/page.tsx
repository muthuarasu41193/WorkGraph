import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow"
import { getSessionUser } from "@/lib/auth/session-server"

export const dynamic = "force-dynamic"

export default async function OnboardingPage() {
  const user = await getSessionUser()
  return <OnboardingFlow userId={user?.id ?? null} />
}
