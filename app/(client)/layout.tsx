import { BottomNav } from "@/components/nav/BottomNav"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <BottomNav />
    </>
  )
}
