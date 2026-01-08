"use client"

import { CloudLightning, Rocket, Star, Network } from "lucide-react"
import { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

export function Ecosystem() {
  const containerRef = useRef(null)
  
  // Refs for the cards to animate them
  const card1Ref = useRef(null)
  const card2Ref = useRef(null)
  const card3Ref = useRef(null)
  const card4Ref = useRef(null)

  useGSAP(() => {
    // Floating animation for the cards
    const cards = [card1Ref.current, card2Ref.current, card3Ref.current, card4Ref.current]
    
    cards.forEach((card, index) => {
      gsap.to(card, {
        y: -20,
        duration: 2 + index * 0.5, // Different durations for organic feel
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: index * 0.2
      })
    })

  }, { scope: containerRef })

  return (
    <section ref={containerRef} className="relative w-full min-h-screen py-20 md:py-0 md:h-screen overflow-hidden bg-[#2e2e2e] flex flex-col items-center justify-center">
      {/* Background Gradient/Lighting effect (Identical to Hero) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#5e5e5e_0%,_#2e2e2e_100%)] opacity-80" />

      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
        {/* Title */}
        <div className="mb-12 md:mb-12 text-center px-4">
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight uppercase max-w-4xl mx-auto leading-tight">
            Convierte cada <span className="italic">&quot;Hola&quot;</span> en una venta.
          </h2>
        </div>

        {/* Content Container */}
        <div className="relative w-full max-w-7xl h-auto md:h-[500px] flex flex-col md:block items-center justify-center gap-6">
        
        {/* Central Placeholder (Space for Bot & Social Icons) */}
        {/* Hidden on mobile, visible on desktop as absolute center */}
        <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[380px] border-2 border-dashed border-white/5 rounded-3xl items-center justify-center text-white/10 z-0">
          {/* Placeholder area */}
        </div>

        {/* Floating Cards - Mobile: Stack/Grid, Desktop: Absolute positions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:block w-full px-4 md:px-0">
          
          {/* Top Left: Cloud Server */}
          <div ref={card1Ref} className="relative md:absolute md:top-4 md:left-10 lg:left-32 bg-white rounded-2xl p-4 pr-8 flex items-center gap-4 shadow-xl transform md:-rotate-6 md:scale-100 transition-transform">
            <div className="bg-[#dcfce7] p-3 rounded-xl shrink-0">
              <CloudLightning className="w-6 h-6 text-black" />
            </div>
            <span className="font-bold text-black text-lg">Servidor Cloud</span>
          </div>

          {/* Bottom Left: Collaboration */}
          <div ref={card2Ref} className="relative md:absolute md:bottom-4 md:left-10 lg:left-32 bg-white rounded-2xl p-4 pr-8 flex items-center gap-4 shadow-xl transform md:rotate-3 md:scale-100 transition-transform">
            <div className="bg-[#e0f2fe] p-3 rounded-xl shrink-0">
              <Rocket className="w-6 h-6 text-black" />
            </div>
            <span className="font-bold text-black text-lg">Colaboración</span>
          </div>

          {/* Top Right: Tracking */}
          <div ref={card3Ref} className="relative md:absolute md:top-4 md:right-10 lg:right-32 bg-white rounded-2xl p-4 pr-8 flex items-center gap-4 shadow-xl transform md:rotate-6 md:scale-100 transition-transform">
            <div className="bg-[#ffedd5] p-3 rounded-xl shrink-0">
              <Star className="w-6 h-6 text-black" />
            </div>
            <span className="font-bold text-black text-lg">Seguimiento</span>
          </div>

          {/* Bottom Right: Operation */}
          <div ref={card4Ref} className="relative md:absolute md:bottom-4 md:right-10 lg:right-32 bg-white rounded-2xl p-4 pr-8 flex items-center gap-4 shadow-xl transform md:-rotate-3 md:scale-100 transition-transform">
            <div className="bg-[#f3e8ff] p-3 rounded-xl shrink-0">
              <Network className="w-6 h-6 text-black" />
            </div>
            <span className="font-bold text-black text-lg">Operaciones</span>
          </div>

        </div>

      </div>
      </div>
    </section>
  )
}
