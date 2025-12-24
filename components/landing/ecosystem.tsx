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
    <section ref={containerRef} className="relative h-screen w-full overflow-hidden bg-[#2e2e2e] flex flex-col items-center justify-center">
      {/* Background Gradient/Lighting effect (Identical to Hero) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#5e5e5e_0%,_#2e2e2e_100%)] opacity-80" />

      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full pt-20">
        {/* Title */}
        <div className="mb-8 md:mb-12 text-center px-4">
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight uppercase max-w-4xl mx-auto leading-tight">
            Convierte cada <span className="italic">&quot;Hola&quot;</span> en una venta.
          </h2>
        </div>

        {/* Content Container */}
        <div className="relative w-full max-w-7xl h-[400px] md:h-[500px] flex items-center justify-center">
        
        {/* Central Placeholder (Space for Bot & Social Icons) */}
        <div className="w-[280px] h-[380px] border-2 border-dashed border-white/5 rounded-3xl flex items-center justify-center text-white/10">
          {/* Placeholder area */}
        </div>

        {/* Floating Cards - Positioned absolutely relative to the center */}
        
        {/* Top Left: Cloud Server */}
        <div ref={card1Ref} className="absolute top-0 md:top-4 left-4 md:left-10 lg:left-32 bg-white rounded-2xl p-3 md:p-4 pr-6 md:pr-8 flex items-center gap-3 md:gap-4 shadow-xl transform -rotate-6 scale-90 md:scale-100">
          <div className="bg-[#dcfce7] p-2 md:p-3 rounded-xl">
            <CloudLightning className="w-5 h-5 md:w-6 md:h-6 text-black" />
          </div>
          <span className="font-bold text-black text-base md:text-lg">Servidor Cloud</span>
        </div>

        {/* Bottom Left: Collaboration */}
        <div ref={card2Ref} className="absolute bottom-0 md:bottom-4 left-4 md:left-10 lg:left-32 bg-white rounded-2xl p-3 md:p-4 pr-6 md:pr-8 flex items-center gap-3 md:gap-4 shadow-xl transform rotate-3 scale-90 md:scale-100">
          <div className="bg-[#e0f2fe] p-2 md:p-3 rounded-xl">
            <Rocket className="w-5 h-5 md:w-6 md:h-6 text-black" />
          </div>
          <span className="font-bold text-black text-base md:text-lg">Colaboración</span>
        </div>

        {/* Top Right: Tracking */}
        <div ref={card3Ref} className="absolute top-0 md:top-4 right-4 md:right-10 lg:right-32 bg-white rounded-2xl p-3 md:p-4 pr-6 md:pr-8 flex items-center gap-3 md:gap-4 shadow-xl transform rotate-6 scale-90 md:scale-100">
          <div className="bg-[#ffedd5] p-2 md:p-3 rounded-xl">
            <Star className="w-5 h-5 md:w-6 md:h-6 text-black" />
          </div>
          <span className="font-bold text-black text-base md:text-lg">Seguimiento</span>
        </div>

        {/* Bottom Right: Operation */}
        <div ref={card4Ref} className="absolute bottom-0 md:bottom-4 right-4 md:right-10 lg:right-32 bg-white rounded-2xl p-3 md:p-4 pr-6 md:pr-8 flex items-center gap-3 md:gap-4 shadow-xl transform -rotate-3 scale-90 md:scale-100">
          <div className="bg-[#f3e8ff] p-2 md:p-3 rounded-xl">
            <Network className="w-5 h-5 md:w-6 md:h-6 text-black" />
          </div>
          <span className="font-bold text-black text-base md:text-lg">Operaciones</span>
        </div>

      </div>
      </div>
    </section>
  )
}
