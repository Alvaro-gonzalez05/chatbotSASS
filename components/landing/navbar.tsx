"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

export function Navbar() {
  const navRef = useRef(null)
  
  useGSAP(() => {
    const showAnim = gsap.from(navRef.current, { 
      yPercent: -300, // Move up enough to hide completely (considering top-10)
      paused: true,
      duration: 0.4,
      ease: "power3.out"
    }).progress(1) // Start at the end (visible)

    ScrollTrigger.create({
      start: "top top",
      end: "max",
      onUpdate: (self) => {
        // self.direction === 1 means scrolling down
        // self.direction === -1 means scrolling up
        // self.scroll() > 100 ensures we don't hide it immediately at the very top if user scrolls down just a bit
        if (self.direction === 1 && self.scroll() > 100) {
            showAnim.reverse() // Go back to "from" state (hidden)
        } else if (self.direction === -1) {
            showAnim.play() // Go to "to" state (visible)
        }
      }
    })
  }, { scope: navRef })

  return (
    <div ref={navRef} className="fixed top-10 z-50 w-full flex justify-center pointer-events-none">
      <div className="pointer-events-auto">
          <nav className="flex items-center gap-8 rounded-full bg-white/90 px-2 py-2 pl-8 shadow-xl backdrop-blur-sm transition-all hover:bg-white">
            <div className="flex items-center gap-8 text-sm font-medium text-gray-800">
              <Link href="/nosotros" className="group relative transition-colors hover:text-black">
                Nosotros
                <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-black transition-all duration-300 group-hover:w-full"></span>
              </Link>
              {["Soluciones", "Agencias", "Precios", "Recursos"].map((item) => (
                <Link key={item} href="#" className="group relative transition-colors hover:text-black">
                  {item}
                  <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-black transition-all duration-300 group-hover:w-full"></span>
                </Link>
              ))}
            </div>
            
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition-transform hover:scale-105 active:scale-95"
            >
              Iniciar Sesión
              <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>
      </div>
    </div>
  )
}
