import { LandingPage } from "@/components/landing-page"
import { PageTransition } from "@/components/ui/page-transition"

export default function Home() {
  return (
    <PageTransition>
      <main>
        <LandingPage />
      </main>
    </PageTransition>
  )
}
