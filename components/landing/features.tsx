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
      opacity: 0,
      duration: 1
    }, 0)

    // Right Column: Slide from Right (100px) to 0
    tl.from(rightRef.current, {
      x: 100,
      opacity: 0,
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
        <div ref={rightRef} className="relative">
            {/* Floating Elements (Emojis) */}
            <div className="absolute -left-12 top-1/3 z-20 bg-white p-3 rounded-2xl shadow-xl animate-bounce duration-[3000ms]">
              <div className="flex gap-2 text-2xl">
                <span>👍</span><span>❤️</span><span>😂</span><span>😮</span>
              </div>
            </div>
            
            <div className="absolute -right-4 top-1/2 z-20 bg-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 animate-pulse">
              <span className="text-red-500">❤️</span>
              <span className="font-medium text-sm">Liked</span>
            </div>

          <div className="bg-gray-50 rounded-[2.5rem] p-8 shadow-2xl border border-gray-100 relative overflow-hidden">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900">Chat</h3>
            </div>
            
            <div className="space-y-6 mb-8">
              {/* Message 1 (Left) */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden shrink-0">
                    <User className="w-6 h-6 text-blue-600" />
                </div>
                <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm max-w-[80%]">
                  <div className="h-2 w-32 bg-gray-100 rounded mb-2"></div>
                  <div className="h-2 w-24 bg-gray-100 rounded"></div>
                </div>
              </div>

              {/* Message 2 (Right) */}
              <div className="flex gap-4 flex-row-reverse">
                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center shrink-0">
                    <div className="w-full h-full bg-gray-800 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">Bot</span>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl rounded-tr-none shadow-sm max-w-[80%]">
                  <div className="h-2 w-40 bg-gray-100 rounded mb-2"></div>
                  <div className="h-2 w-28 bg-gray-100 rounded"></div>
                </div>
              </div>

              {/* Message 3 (Left) */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-green-600" />
                </div>
                <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm max-w-[80%]">
                  <div className="h-2 w-36 bg-gray-100 rounded mb-2"></div>
                </div>
              </div>
              
                {/* Message 4 (Right) */}
              <div className="flex gap-4 flex-row-reverse">
                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center shrink-0">
                    <div className="w-full h-full bg-gray-800 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">Bot</span>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl rounded-tr-none shadow-sm max-w-[80%]">
                  <div className="h-2 w-32 bg-gray-100 rounded"></div>
                </div>
              </div>
            </div>

            {/* Input Area */}
            <div className="relative">
              <input 
                type="text" 
                placeholder="Escribe tu texto" 
                className="w-full bg-gray-200/50 border-none rounded-xl py-4 pl-6 pr-14 text-gray-600 focus:ring-2 focus:ring-black/5 outline-none"
                readOnly
              />
              <button className="absolute right-2 top-2 bottom-2 bg-black text-white p-2 rounded-lg hover:bg-gray-800 transition-colors">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
