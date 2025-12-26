"use client"

import Link from "next/link"
import { ArrowRight, Send, User } from "lucide-react"
import { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

export function Features() {
  const containerRef = useRef(null)
  const leftRef = useRef(null)
  const rightRef = useRef(null)

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".hero-trigger",
        start: "top top",
        end: "20% top",
        scrub: 0.5,
      }
    })

    // Left Column: Slide from Left (-100px) to 0
    tl.from(leftRef.current, {
      x: -100,
      duration: 1
    }, 0)

    // Right Column: Slide from Right (100px) to 0
    tl.from(rightRef.current, {
      x: 100,
      duration: 1
    }, 0)

  }, { scope: containerRef })

  return (
    <section ref={containerRef} className="w-full bg-white py-24 px-6 md:px-12 lg:px-24 flex items-center justify-center min-h-screen">
      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left Column: Text */}
        <div ref={leftRef} className="flex flex-col gap-6">
          <h2 className="text-4xl md:text-6xl font-bold leading-tight text-black tracking-tight">
            Obtén el Máximo de <br/> Cada Conversación
          </h2>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-lg">
            Vende más, interactúa mejor y haz crecer tu audiencia con potentes automatizaciones para Instagram, WhatsApp, TikTok y Messenger.
          </p>
          <div className="flex items-center gap-6 mt-4">
            <Link
              href="#"
              className="flex items-center gap-2 rounded-full bg-black px-8 py-4 text-base font-medium text-white transition-transform hover:scale-105 active:scale-95 shadow-lg"
            >
              Comenzar
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="#"
              className="text-base font-medium text-gray-800 hover:text-black transition-colors"
            >
              Prueba Gratuita
            </Link>
          </div>
        </div>

        {/* Right Column: Chat UI Mockup */}
        <div ref={rightRef} className="relative flex justify-center items-center">
          <img 
            src="/images/b.png" 
            alt="Chat Simulation" 
            className="w-full h-auto object-contain mix-blend-multiply scale-125 hover:scale-135 transition-transform duration-500 [mask-image:radial-gradient(circle,black_70%,transparent_100%)]"
          />
        </div>
      </div>
    </section>
  )
}
