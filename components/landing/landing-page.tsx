"use client"

import { Navbar } from "./navbar"
import { Hero } from "./hero"
import { Features } from "./features"
import { Benefits } from "./benefits"
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
    <div ref={mainRef} className="w-full font-sans">
      <Navbar />
      
      {/* 
        Sticky Container Strategy:
        Height = 200vh (Hero Height + Features Height)
        
        Behavior:
        1. Features is sticky at top.
        2. Hero is absolute on top of Features.
        3. As we scroll 0-100vh:
           - Hero moves up with the flow.
           - Features sticks to the viewport.
           - Result: Hero slides up, revealing Features underneath.
        4. At 100vh:
           - Hero is fully scrolled out.
           - Features hits the bottom of the container.
           - Features stops sticking.
        5. As we scroll >100vh:
           - Features moves up naturally.
           - Benefits follows immediately.
      */}
      <div className="relative h-[200vh]">
        
        {/* Features: Sticky Layer (Bottom) */}
        <div className="sticky top-0 h-screen z-0 overflow-hidden">
          <Features />
        </div>

        {/* Hero: Cover Layer (Top) */}
        <div className="absolute top-0 left-0 w-full h-screen z-10 hero-trigger">
          <div ref={heroRef} className="w-full h-full">
            <Hero />
          </div>
        </div>

      </div>

      {/* Benefits: Follows the container */}
      <div className="relative z-20 bg-white">
        <Benefits />
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
