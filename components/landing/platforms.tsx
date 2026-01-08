"use client"

import Link from "next/link"
import { ArrowRight, Instagram, Mail, MessageCircle, Phone } from "lucide-react"
import { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

// Custom Icons
const TiktokIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    height="1em"
    width="1em"
    className={className}
  >
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
  </svg>
)

const platforms = [
  {
    name: "Instagram",
    description: "Haz crecer tu presencia en Instagram con herramientas poderosas que te ayudan a interactuar.",
    icon: Instagram,
    color: "bg-[#ffeef9]",
    iconColor: "text-[#d62976]",
    video: "/videos/instagram2.mp4"
  },
  {
    name: "TikTok",
    description: "Convierte momentos virales rápidos en conversaciones reflexivas y de alto valor.",
    icon: TiktokIcon,
    color: "bg-[#e0fbfc]",
    iconColor: "text-black",
    video: "/videos/tiktok.mp4"
  },
  {
    name: "WhatsApp",
    description: "Automatiza respuestas y gestiona pedidos directamente desde la app de mensajería más usada.",
    icon: Phone,
    color: "bg-[#e0fce4]",
    iconColor: "text-[#25D366]",
    video: "/videos/wsp.mp4"
  },
  {
    name: "Messenger",
    description: "Conecta con clientes potenciales en Facebook al instante y escala tus ventas.",
    icon: MessageCircle,
    color: "bg-[#e0e7fc]",
    iconColor: "text-[#0084FF]",
    video: "/videos/messengernew.mp4"
  },
  {
    name: "Gmail",
    description: "Integra tu correo electrónico para un seguimiento de leads sin interrupciones.",
    icon: Mail,
    color: "bg-[#fce0e0]",
    iconColor: "text-[#EA4335]",
    video: "/videos/gmail.mp4"
  }
]

export function Platforms() {
  const sectionRef = useRef(null)
  const trackRef = useRef(null)

  useGSAP(() => {
    // Only run animation on larger screens where the layout applies
    const mm = gsap.matchMedia()

    mm.add("(min-width: 1024px)", () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=300%", // Scroll distance (3x height)
          pin: true,
          scrub: 1,
          anticipatePin: 1
        }
      })

      // Move the track to the left
      // We want to move it enough so that the last 3 cards are visible
      // Initial state: [Text][Card1][Card2] | [Card3][Card4][Card5] (offscreen)
      // Final state: [Card3][Card4][Card5]
      // Movement needed: -100vw (to shift Card3 to left edge)
      
      tl.to(trackRef.current, {
        x: () => -window.innerWidth, 
        ease: "none"
      })
    })

  }, { scope: sectionRef })

  return (
    <section ref={sectionRef} className="w-full bg-black min-h-screen overflow-hidden relative">
      
      {/* Desktop Layout (Pinned Horizontal Scroll) */}
      <div className="hidden lg:flex h-screen w-full relative">
        
        {/* Left Text Column (Fixed Position initially, gets covered) */}
        <div className="absolute left-0 top-0 w-1/3 h-full flex flex-col justify-center px-12 z-0">
          <div className="flex flex-col gap-8">
            <h2 className="text-5xl font-bold leading-tight text-white tracking-tight">
              Mantente conectado en cada lugar donde existe tu audiencia.
            </h2>
            <p className="text-lg text-gray-400 leading-relaxed">
              Llega a tu audiencia donde sea que estén, en cada plataforma, cada canal y cada momento en que estén listos para conectar.
            </p>
            <div className="mt-2">
              <Link
                href="#"
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-medium text-black transition-transform hover:scale-105 active:scale-95 shadow-lg"
              >
                Comenzar Prueba Gratis
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Cards Track (Starts at 33% width, slides left) */}
        <div 
          ref={trackRef}
          className="absolute top-0 left-[33.333%] h-full flex z-10"
          style={{ width: `${platforms.length * 33.333}vw` }} // Width to hold all cards
        >
          {platforms.map((platform, index) => (
            <div 
              key={platform.name} 
              className="h-full w-[33.333vw] border-l border-gray-800 bg-black flex flex-col p-12"
            >
              <div className="flex flex-col h-full gap-8">
                <div className="space-y-4 min-h-[120px]">
                  <h3 className="text-2xl font-bold text-white">{platform.name}</h3>
                  <p className="text-gray-400 leading-relaxed text-sm">
                    {platform.description}
                  </p>
                </div>
                <div className={`${platform.color} rounded-[2.5rem] aspect-square w-full flex items-center justify-center overflow-hidden transition-transform hover:scale-[1.02] duration-300 mt-auto relative`}>
                  {platform.video ? (
                    <video
                      src={platform.video}
                      className="w-full h-full object-cover absolute inset-0"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : (
                    <platform.icon className={`w-32 h-32 ${platform.iconColor}`} strokeWidth={1.5} />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Layout (Vertical Stack) */}
      <div className="lg:hidden flex flex-col py-24 px-6 gap-16">
        <div className="flex flex-col gap-8">
            <h2 className="text-4xl font-bold leading-tight text-white tracking-tight">
              Mantente conectado en cada lugar donde existe tu audiencia.
            </h2>
            <p className="text-lg text-gray-400 leading-relaxed">
              Llega a tu audiencia donde sea que estén, en cada plataforma, cada canal y cada momento en que estén listos para conectar.
            </p>
            <div className="mt-2">
              <Link
                href="#"
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-medium text-black transition-transform hover:scale-105 active:scale-95 shadow-lg"
              >
                Comenzar Prueba Gratis
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
        </div>
        
        <div className="grid grid-cols-1 gap-8">
          {platforms.map((platform) => (
             <div key={platform.name} className="flex flex-col gap-8 border-t border-gray-800 pt-8">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-white">{platform.name}</h3>
                  <p className="text-gray-400 leading-relaxed text-sm">
                    {platform.description}
                  </p>
                </div>
                <div className={`${platform.color} rounded-[2.5rem] aspect-square w-full flex items-center justify-center overflow-hidden relative`}>
                  {platform.video ? (
                    <video
                      src={platform.video}
                      className="w-full h-full object-cover absolute inset-0"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : (
                    <platform.icon className={`w-32 h-32 ${platform.iconColor}`} strokeWidth={1.5} />
                  )}
                </div>
             </div>
          ))}
        </div>
      </div>

    </section>
  )
}
