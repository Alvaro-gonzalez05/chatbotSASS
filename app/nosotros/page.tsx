import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { Story } from "@/components/about/story"

export default function AboutPage() {
  return (
    <main className="bg-[#1a1a1a] min-h-screen">
      <Navbar />
      <Story />
      <Footer />
    </main>
  )
}
