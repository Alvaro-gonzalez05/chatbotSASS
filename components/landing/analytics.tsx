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
        <div ref={visualRef} className="relative">
          {/* Main Card */}
          <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-8 relative z-10">
            
            {/* Top Stats Row */}
            <div className="flex gap-4 mb-8">
              <div className="flex-1 bg-gray-50 rounded-2xl p-4 flex items-center gap-4">
                <div className="bg-black text-white p-3 rounded-xl">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <div className="text-lg font-bold text-black">25,000 USD</div>
                  <div className="text-xs text-gray-500">Ventas Totales</div>
                </div>
              </div>
              <div className="flex-1 bg-gray-50 rounded-2xl p-4 flex items-center gap-4">
                <div className="bg-black text-white p-3 rounded-xl">
                  <PieChart size={20} />
                </div>
                <div>
                  <div className="text-lg font-bold text-black">22,000 USD</div>
                  <div className="text-xs text-gray-500">Gastos Totales</div>
                </div>
              </div>
            </div>

            {/* Chart Header */}
            <div className="flex justify-between items-end mb-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-black">Ingresos</h3>
                  <span className="bg-green-100 text-green-600 text-xs font-bold px-2 py-1 rounded-full">+13%</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                Este Año
              </div>
            </div>

            {/* Bar Chart Visualization */}
            <div className="h-64 flex items-end justify-between gap-2 md:gap-4 px-2">
              {/* Bars */}
              {[40, 65, 45, 80, 55, 90, 60].map((height, i) => (
                <div key={i} className="w-full flex flex-col items-center gap-2 group relative">
                  {/* Tooltip for the highlighted bar */}
                  {i === 5 && (
                    <div className="absolute -top-12 bg-white shadow-lg border border-gray-100 px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap animate-bounce">
                      Promedio 2025
                    </div>
                  )}
                  
                  <div 
                    className={`chart-bar w-full rounded-t-xl transition-all duration-300 ${
                      i === 5 
                        ? "bg-gradient-to-b from-purple-500 to-purple-700 shadow-lg shadow-purple-200" 
                        : "bg-purple-100 hover:bg-purple-200"
                    }`}
                    style={{ height: `${height}%` }}
                  ></div>
                </div>
              ))}
            </div>
            
            {/* X Axis Line */}
            <div className="h-px w-full bg-gray-100 mt-0"></div>

          </div>

          {/* Decorative Elements behind */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-100 rounded-full blur-3xl -z-10"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-50 rounded-full blur-3xl -z-10"></div>
        </div>

      </div>
    </section>
  )
}
