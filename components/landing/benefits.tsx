"use client"

import { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

export function Benefits() {
  const containerRef = useRef(null)
  const headerRef = useRef(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 80%", // Start animation when top of section hits 80% of viewport height
        toggleActions: "play none none reverse", // Play on enter, reverse on leave back up
      }
    })

    // Header animation
    tl.from(headerRef.current, {
      y: 50,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out"
    })

    // Cards animation (staggered)
    if (cardsRef.current) {
      tl.from(cardsRef.current.children, {
        y: 100,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out"
      }, "-=0.4") // Overlap slightly with header animation
    }

  }, { scope: containerRef })

  return (
    <section ref={containerRef} className="w-full bg-white py-24 px-6 md:px-12 lg:px-24 flex flex-col items-center justify-center min-h-screen">
      <div className="max-w-7xl w-full flex flex-col items-center gap-16">
        
        {/* Header */}
        <div ref={headerRef} className="text-center max-w-3xl space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-black tracking-tight leading-tight">
              Transforma Buenos Chats en Grandes Conversaciones
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed">
              Convierte chats ordinarios en conversaciones verdaderamente grandiosas añadiendo claridad, contexto y guía inteligente que te ayuda a expresar mejor tus ideas.
            </p>
        </div>

        {/* Cards Grid */}
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          
          {/* Card 01 */}
            <div className="bg-gray-50 rounded-3xl p-8 h-full flex flex-col justify-between hover:shadow-lg transition-shadow duration-300">
              <div className="space-y-4">
                <span className="text-lg font-medium text-gray-400">01/</span>
                <h3 className="text-2xl font-bold text-gray-900">
                  Convierte Comentarios Rápido
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Transforma simples comentarios en conversaciones significativas que generan resultados.
                </p>
              </div>
            </div>

          {/* Card 02 - Highlighted */}
            <div className="bg-[#8b939c] rounded-3xl p-8 h-full flex flex-col justify-between shadow-xl transform md:-translate-y-4 relative overflow-hidden group">
              {/* Decorative gradient/shine */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="space-y-4 relative z-10">
                <span className="text-lg font-medium text-gray-200">02/</span>
                <h3 className="text-2xl font-bold text-white">
                  Conexión Instantánea
                </h3>
                <p className="text-gray-100 leading-relaxed">
                  Conecta instantáneamente con tu audiencia a través de respuestas inteligentes y automatizadas.
                </p>
              </div>
              {/* Bottom shadow effect simulation */}
              <div className="absolute bottom-0 left-4 right-4 h-4 bg-black/10 blur-lg rounded-[100%]" />
            </div>

          {/* Card 03 */}
            <div className="bg-gray-50 rounded-3xl p-8 h-full flex flex-col justify-between hover:shadow-lg transition-shadow duration-300">
              <div className="space-y-4">
                <span className="text-lg font-medium text-gray-400">03/</span>
                <h3 className="text-2xl font-bold text-gray-900">
                  Haz Crecer Tu Imperio
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Lleva tu imperio al siguiente nivel escalando tu impacto e incrementando visibilidad.
                </p>
              </div>
            </div>

        </div>
      </div>
    </section>
  )
}
