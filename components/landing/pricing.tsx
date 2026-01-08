"use client"

import { Check, MessageSquare, Zap, Sparkles, Clock, AlertCircle } from "lucide-react"
import Image from "next/image"
import { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

export function Pricing() {
  const containerRef = useRef(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (cardsRef.current) {
      const cards = cardsRef.current.children
      gsap.from(cards, {
        y: 100,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 75%",
        }
      })
    }
  }, { scope: containerRef })

  return (
    <section ref={containerRef} className="w-full bg-black py-24 px-6 md:px-12 lg:px-24 min-h-screen flex items-center justify-center">
      <div className="max-w-[1400px] w-full mx-auto">
        
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-6">
            Elige tu plan ideal.
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Comienza gratis y escala cuando estés listo.
          </p>
        </div>

        <div ref={cardsRef} className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-center">
          
          {/* Free Trial Card */}
          <div className="bg-[#121212] rounded-[2.5rem] p-8 md:p-10 border border-gray-800 hover:shadow-xl transition-shadow duration-300 flex flex-col h-full z-10">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-gray-900 rounded-full px-4 py-1 text-sm font-medium text-gray-400 mb-6">
                <Clock className="w-4 h-4" />
                <span>Prueba de 7 Días</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl md:text-6xl font-bold tracking-tighter text-white">Gratis</span>
              </div>
              <p className="text-gray-400 mt-4">
                Ideal para probar el sistema y ver cómo funciona.
              </p>
            </div>

            <div className="space-y-6 flex-1">
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-gray-400">
                  <div className="bg-gray-800 p-1 rounded-full mt-1">
                    <Check className="w-3 h-3 text-gray-400" strokeWidth={3} />
                  </div>
                  <span>Acceso a CRM y Analíticas</span>
                </li>
                <li className="flex items-start gap-3 text-gray-400">
                  <div className="bg-yellow-900/30 p-1 rounded-full mt-1">
                    <AlertCircle className="w-3 h-3 text-yellow-500" strokeWidth={3} />
                  </div>
                  <span>
                    <strong>IA Limitada</strong>
                    <span className="block text-sm text-gray-500">Límites diarios de Google Gemini</span>
                  </span>
                </li>
                <li className="flex items-start gap-3 text-gray-400">
                  <div className="bg-blue-900/30 p-1 rounded-full mt-1">
                    <MessageSquare className="w-3 h-3 text-blue-400" strokeWidth={3} />
                  </div>
                  <span>
                    <strong>Envíos Masivos Disponibles</strong>
                    <span className="block text-sm text-gray-500">Costo: $0.10 USD por mensaje</span>
                  </span>
                </li>
              </ul>
            </div>

            <button className="mt-8 w-full bg-transparent border-2 border-white text-white rounded-full px-8 py-4 text-lg font-bold hover:bg-white hover:text-black transition-colors">
              Comenzar Prueba
            </button>
          </div>

          {/* Center Image */}
          <div className="hidden lg:flex justify-center items-center relative z-0 -mx-12">
            <div className="relative w-[400px] h-[500px]">
              <Image 
                src="/images/botpricing.png" 
                alt="UcoBot Assistant" 
                fill
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </div>

          {/* Pro Plan Card */}
          <div className="bg-[#1a1a1a] rounded-[2.5rem] p-8 md:p-10 border border-gray-800 shadow-lg relative overflow-hidden flex flex-col h-full transform lg:-translate-y-4 z-10">
            <div className="absolute top-0 right-0 bg-white text-black text-xs font-bold px-4 py-2 rounded-bl-2xl">
              RECOMENDADO
            </div>
            
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-1 text-sm font-medium text-black mb-6">
                <Zap className="w-4 h-4 text-yellow-500" fill="currentColor" />
                <span>Acceso Total</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl md:text-7xl font-bold tracking-tighter text-white">$69</span>
                <span className="text-xl text-gray-400 font-medium">/mes</span>
              </div>
              <p className="text-gray-400 mt-4">
                Para negocios que quieren escalar sin límites.
              </p>
            </div>

            <div className="space-y-6 flex-1">
              {/* AI Feature Pill */}
              <div className="flex items-center gap-2 text-purple-300 font-medium bg-purple-900/30 px-4 py-2 rounded-full w-fit">
                <Sparkles className="w-4 h-4" />
                <span>Respuestas con IA Ilimitadas</span>
              </div>

              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-white font-medium">
                  <div className="bg-purple-900/30 p-1 rounded-full mt-1">
                    <Check className="w-3 h-3 text-purple-400" strokeWidth={3} />
                  </div>
                  <span>IA Gratis para respuestas (Inbound)</span>
                </li>
                <li className="flex items-start gap-3 text-gray-400">
                  <div className="bg-green-900/30 p-1 rounded-full mt-1">
                    <Check className="w-3 h-3 text-green-400" strokeWidth={3} />
                  </div>
                  <span>CRM y Analíticas Avanzadas</span>
                </li>
                <li className="flex items-start gap-3 text-gray-400">
                  <div className="bg-green-900/30 p-1 rounded-full mt-1">
                    <Check className="w-3 h-3 text-green-400" strokeWidth={3} />
                  </div>
                  <span>Sin límites de contactos</span>
                </li>
                <li className="flex items-start gap-3 text-gray-400">
                  <div className="bg-blue-900/30 p-1 rounded-full mt-1">
                    <MessageSquare className="w-3 h-3 text-blue-400" strokeWidth={3} />
                  </div>
                  <span>
                    <strong>Envíos Masivos</strong>
                    <span className="block text-sm text-gray-500">Costo: $0.10 USD por mensaje</span>
                  </span>
                </li>
              </ul>
            </div>

            <button className="mt-8 w-full bg-white text-black rounded-full px-8 py-4 text-lg font-bold hover:scale-105 transition-transform active:scale-95 shadow-lg">
              Obtener Acceso Total
            </button>
          </div>

        </div>

      </div>
    </section>
  )
}
