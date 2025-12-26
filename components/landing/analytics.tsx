"use client"

import Link from "next/link"
import { ArrowRight, ShoppingBag, PieChart, TrendingUp } from "lucide-react"
import { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

export function Analytics() {
  const containerRef = useRef(null)
  const textRef = useRef(null)
  const visualRef = useRef(null)

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 75%",
        toggleActions: "play none none reverse",
      }
    })

    tl.from(textRef.current, {
      x: -50,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out"
    })
    .from(visualRef.current, {
      x: 50,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out"
    }, "-=0.6")

    // Animate chart bars
    gsap.from(".chart-bar", {
      scaleY: 0,
      transformOrigin: "bottom",
      duration: 0.6,
      stagger: 0.1,
      ease: "back.out(1.7)",
      scrollTrigger: {
        trigger: visualRef.current,
        start: "top 80%",
      }
    })

  }, { scope: containerRef })

  return (
    <section ref={containerRef} className="w-full bg-white py-24 px-6 md:px-12 lg:px-24 min-h-screen flex items-center">
      <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Left Column: Text */}
        <div ref={textRef} className="flex flex-col gap-8">
          <h2 className="text-4xl md:text-6xl font-bold leading-tight text-black tracking-tight">
            Toma decisiones de negocio que impulsen tu crecimiento
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed max-w-xl">
            Gestiona todos tus canales sociales, garantiza una atención al cliente superior, monitorea tu rendimiento y más—todo desde una única plataforma.
          </p>
          <div className="mt-2">
            <Link
              href="#"
              className="inline-flex items-center gap-2 rounded-full bg-black px-8 py-4 text-base font-medium text-white transition-transform hover:scale-105 active:scale-95 shadow-lg"
            >
              Comenzar Ahora
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* Right Column: Visual/Chart */}
        <div ref={visualRef} className="relative flex justify-center items-center">
          <img 
            src="/images/d.png" 
            alt="Dashboard Analytics" 
            className="w-full h-auto object-contain mix-blend-multiply scale-125 hover:scale-135 transition-transform duration-500"
          />
        </div>

      </div>
    </section>
  )
}
