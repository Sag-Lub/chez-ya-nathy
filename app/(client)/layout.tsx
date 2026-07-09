import { OnboardingGate } from "@/components/onboarding/OnboardingGate"
import { BottomNav } from "@/components/nav/BottomNav"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingGate>
      <div className="pb-24">{children}</div>
      <BottomNav />
    </OnboardingGate>
  )
}
