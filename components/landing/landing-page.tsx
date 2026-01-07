"use client"

// import { Navbar } from "./navbar" // Removed as requested
import { Hero } from "./hero"
import { FeaturesBenefits } from "./features-benefits"
import { Platforms } from "./platforms"
import { Analytics } from "./analytics"
import { Ecosystem } from "./ecosystem"
import { Pricing } from "./pricing"
import { FAQ } from "./faq"
import { Footer } from "./footer"
import { useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(ScrollTrigger)

export function LandingPage() {
  const mainRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    // Optional: Add parallax to Hero content for extra polish
    if (heroRef.current) {
      gsap.to(heroRef.current, {
        yPercent: -20,
        ease: "none",
        scrollTrigger: {
          trigger: mainRef.current,
          start: "top top",
          end: "100vh top",
          scrub: true
        }
      })
    }
  }, { scope: mainRef })

  return (
    <div ref={mainRef} className="w-full font-sans overflow-x-hidden">
      {/* <Navbar /> Removed */}
      
      {/* Hero Layer - Fixed at back */}
      <div className="fixed top-0 left-0 w-full h-screen z-0">
        <Hero />
      </div>

      {/* Spacer to push content down so Hero is visible initially */}
      <div className="w-full h-screen invisible pointer-events-none" />

      {/* Combined Features & Benefits Section */}
      <div className="relative z-10 bg-black">
        <FeaturesBenefits />
      </div>

      {/* Platforms: Follows Benefits */}
      <div className="relative z-20 bg-white">
        <Platforms />
      </div>

      {/* Analytics: Sticky to be covered by Ecosystem */}
      <div className="sticky top-0 z-10">
        <Analytics />
      </div>

      {/* Ecosystem: Covers Analytics and stays sticky for Pricing to cover it */}
      <div className="sticky top-0 z-20 bg-[#2e2e2e]">
        <Ecosystem />
      </div>

      {/* Pricing: Covers Ecosystem */}
      <div className="relative z-30 bg-white">
        <Pricing />
      </div>

      {/* FAQ: Follows Pricing */}
      <div className="relative z-30 bg-white">
        <FAQ />
      </div>

      {/* Footer: Final Section */}
      <div className="relative z-30 bg-gray-50">
        <Footer />
      </div>
    </div>
  )
}
