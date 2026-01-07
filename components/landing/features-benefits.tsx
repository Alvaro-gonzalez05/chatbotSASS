"use client"

import Link from "next/link"
import { 
  ArrowRight, 
  Target, 
  Users, 
  Search, 
  Bell, 
  PieChart, 
  BrainCircuit
} from "lucide-react"
import { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

export function FeaturesBenefits() {
  const containerRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const featuresLeftRef = useRef<HTMLDivElement>(null)
  const featuresRightRef = useRef<HTMLDivElement>(null)
  const benefitsRef = useRef<HTMLDivElement>(null)
  const benefitCardsRef = useRef<HTMLDivElement[]>([])
  
  // Clear refs on each render to avoid duplicates or stale nodes
  benefitCardsRef.current = []

  useGSAP(() => {
    // Ensure we have cards to animate
    if (benefitCardsRef.current.length === 0) return

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "+=150%", // Determines how long the pin lasts (scroll distance)
        pin: true,
        scrub: 1,
        // markers: true, // Remove for production
      }
    })

    // 1. Features Exit Animation
    // Left side goes left, Right side goes right
    tl.to(featuresLeftRef.current, {
      xPercent: -150,
      opacity: 0,
      duration: 1,
      ease: "power2.in"
    })
    .to(featuresRightRef.current, {
      xPercent: 150,
      opacity: 0,
      duration: 1,
      ease: "power2.in"
    }, "<") // Run simultaneously with previous animation

    // 2. Benefits Entrance Animation (Pop effect)
    // Ensure benefits section is visible (it might be hidden initially via CSS or opacity)
    .to(benefitsRef.current, {
        autoAlpha: 1, 
        duration: 0.1
    }, "-=0.2")
    
    // Animate cards popping in
    .from(benefitCardsRef.current, {
      y: 50, // Slight movement from bottom
      scale: 0.8, // Start slightly smaller
      opacity: 0,
      duration: 0.6,
      stagger: 0.05, // Faster stagger
      ease: "back.out(1.7)",
      clearProps: "all" // Clear styles after animation to avoid conflict with hover effects
    })
    
    // 3. Hold phase (Pause before unpinning)
    .to({}, { duration: 1 }) // Empty tween adds a pause of 1 "unit" of scroll


  }, { scope: containerRef })

  const addToRefs = (el: HTMLDivElement | null) => {
    if (el && !benefitCardsRef.current.includes(el)) {
      benefitCardsRef.current.push(el)
    }
  }

  return (
    <section ref={containerRef} className="relative w-full min-h-screen bg-black overflow-hidden z-10">
      
      {/* 
        LAYER 1: FEATURES 
        Positioned absolutely to overlap with Benefits if needed, 
        or just the initial view.
      */}
      <div 
        ref={featuresRef} 
        className="absolute inset-0 w-full h-full flex items-center justify-center px-6 md:px-12 lg:px-24 pointer-events-none" // pointer-events-none to let scroll pass through if needed, but we have interactive elements?
      >
        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center pointer-events-auto"> 
          {/* pointer-events-auto restores interaction */}
          
          {/* Left Column: Text */}
          <div ref={featuresLeftRef} className="relative isolate">
            {/* Back Card */}
            <div className="absolute top-4 -right-4 w-full h-full bg-gradient-to-br from-[#404040] to-[#1a1a1a] rounded-[3rem] border-4 border-white -z-10" />
            
            {/* Main White Card */}
            <div className="flex flex-col gap-6 bg-white p-12 rounded-[3rem] border border-gray-100">
               <h2 className="text-4xl md:text-6xl font-bold leading-tight text-black tracking-tight text-balance">
                 Obtén el Máximo de Cada Conversación
               </h2>
               <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-lg">
                 Vende más, interactúa mejor y haz crecer tu audiencia con potentes automatizaciones para Instagram, WhatsApp, TikTok y Messenger.
               </p>
               <div className="flex items-center gap-6 mt-4">
                 <Link
                   href="#"
                   className="flex items-center gap-2 rounded-full bg-black/80 backdrop-blur-md border border-black/5 px-8 py-4 text-base font-medium text-white transition-transform hover:scale-105 active:scale-95 shadow-lg hover:bg-black/70"
                 >
                   Comenzar
                   <ArrowRight className="h-5 w-5" />
                 </Link>
                 <Link
                   href="#"
                   className="px-8 py-4 rounded-full bg-gray-100/50 backdrop-blur-sm border border-gray-200 text-base font-medium text-gray-800 transition-transform hover:scale-105 hover:bg-gray-200/50"
                 >
                   Prueba Gratuita
                 </Link>
               </div>
            </div>
          </div>

          {/* Right Column: Chat UI Mockup */}
          <div ref={featuresRightRef} className="relative flex justify-center items-center">
            <img 
              src="/images/b.png" 
              alt="Chat Simulation" 
              className="w-full h-auto object-contain scale-125 [mask-image:radial-gradient(circle,black_70%,transparent_100%)]"
            />
          </div>
        </div>
      </div>


      {/* 
        LAYER 2: BENEFITS (Bento Grid)
        Initially hidden (opacity 0 or visibility hidden)
      */}
      <div 
        ref={benefitsRef} 
        className="absolute inset-0 w-full h-full flex flex-col justify-start md:justify-center items-center px-4 md:px-8 lg:px-12 pt-20 md:pt-0 invisible opacity-0"
      >
        <div className="max-w-6xl mx-auto flex flex-col gap-4 w-full h-full md:h-auto justify-center"> 
          
          {/* Header */}
          <div ref={addToRefs} className="text-center space-y-2 mb-2 md:mb-6 shrink-0">
              <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight leading-tight">
                Qué Hacemos Mejor?
              </h2>
              <p className="text-xs md:text-sm text-gray-400 leading-relaxed max-w-2xl mx-auto text-balance">
                Desde chatbots inteligentes hasta un CRM completo. Todo lo que necesitas para automatizar y escalar tu marca.
              </p>
          </div>

          {/* Bento Grid - Mobile: List View (Flex Row), Desktop: Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-3 md:auto-rows-[minmax(150px,auto)]">
            
            {/* Card 1: Strategy - Mobile: Text Left, Img Right */}
            <div ref={addToRefs} className="md:col-span-1 md:row-span-2 min-h-[120px] md:min-h-0 bg-[#121212] rounded-[1.5rem] p-5 md:p-6 flex flex-row md:flex-col items-center md:items-stretch justify-between md:justify-end relative overflow-hidden group border border-white/5">
              
              {/* Text Area */}
              <div className="relative z-10 space-y-2 md:space-y-4 max-w-[60%] md:max-w-full">
                 <h3 className="text-xl md:text-4xl font-bold text-white leading-[0.9] tracking-tight">
                   Visión <br className="hidden md:block"/>
                   Estratégica
                 </h3>
                 <p className="text-[12px] md:text-[13px] text-gray-500 leading-snug font-medium md:max-w-[90%]">
                   Analiza datos del CRM y detecta nuevas oportunidades de venta.
                 </p>
              </div>

               {/* Image Area - Mobile: Right, Desktop: Top/Left */}
              <div className="absolute right-[-10px] md:right-auto md:left-0 top-1/2 -translate-y-1/2 md:-translate-y-0 md:top-[-50px] w-[40%] md:w-full h-full md:h-auto pointer-events-none flex items-center justify-center md:block">
                  <div className="relative w-full md:w-[55%]">
                      <img 
                        src="/images/vinoculares.png" 
                        alt="Strategy" 
                        className="w-full h-auto object-contain object-center md:object-left drop-shadow-2xl transition-transform duration-500"
                      />
                  </div>
              </div>
            </div>

            {/* Card 2: Campaigns */}
            <div ref={addToRefs} className="md:col-span-2 min-h-[120px] md:min-h-0 bg-[#27272a] rounded-[1.5rem] p-5 md:p-6 flex flex-row items-center justify-between border border-white/5 relative overflow-hidden group">
               
               {/* Left Content */}
               <div className="flex flex-col justify-center h-full space-y-2 md:space-y-4 max-w-[60%] md:max-w-sm relative z-10">
                 <h3 className="text-lg md:text-3xl font-bold text-white leading-[0.9] tracking-tight">
                   Marketing <br/>
                   de Precisión
                 </h3>
                 <p className="text-[11px] md:text-[12px] text-gray-500 leading-snug font-medium max-w-full md:max-w-[90%]">
                   Acierta en el blanco con campañas masivas segmentadas.
                 </p>
               </div>

               {/* Right Content - Image */}
               <div className="absolute right-[-20px] md:right-[10%] bottom-[-10px] md:bottom-[-65px] h-[100%] md:h-[160%] w-[40%] md:w-auto flex items-end justify-center pointer-events-none">
                  <img 
                    src="/images/diana.png" 
                    alt="Target" 
                    className="h-full w-auto object-contain object-bottom drop-shadow-2xl transition-transform duration-500"
                  />
               </div>
            </div>

            {/* Card 3: Social Media - Now Phone/Chatbots */}
            <div ref={addToRefs} className="min-h-[140px] md:min-h-0 bg-[#121212] rounded-[1.5rem] p-6 flex flex-row md:flex-col items-center md:items-stretch justify-between border border-white/5 relative overflow-hidden group">
               <div className="space-y-2 md:space-y-3 relative z-10 w-[60%] md:w-[60%]">
                 <h3 className="text-lg md:text-xl font-bold text-white leading-tight">
                  Atención <br/> Instantánea
                 </h3>
                 <p className="text-[12px] md:text-[13px] text-gray-500 font-medium leading-snug relative z-10 text-balance">
                  Responde automáticamente en redes 24/7.
                 </p>
               </div>
               
               {/* Phone Image */}
               <div className="absolute right-[-30px] md:-right-10 bottom-[-20px] md:-bottom-16 w-[45%] md:w-64 h-[120%] md:h-64 flex items-center justify-center pointer-events-none">
                  <img 
                    src="/images/tel.png" 
                    alt="Phone" 
                    className="w-full h-full object-contain drop-shadow-2xl transition-transform duration-500"
                  />
               </div>
            </div>

            {/* Card 4: CRM */}
            <div ref={addToRefs} className="min-h-[120px] md:min-h-0 bg-[#121212] rounded-[1.5rem] p-6 flex flex-row md:flex-col items-center md:items-stretch justify-between border border-white/5 relative overflow-hidden group">
               <div className="space-y-2 md:space-y-3 relative z-10 max-w-[60%] md:max-w-[50%]">
                 <h3 className="text-lg md:text-xl font-bold text-white leading-tight">
                  CRM Integral
                 </h3>
                 <p className="text-[12px] md:text-[13px] text-gray-500 font-medium leading-snug">
                   Gestiona clientes y estados en un solo lugar.
                 </p>
               </div>
               
               <div className="absolute right-[-20px] bottom-[-20px] w-[120px] h-[120px] md:w-[200px] md:h-[200px] flex items-center justify-center pointer-events-none">
                  <img 
                    src="/images/social.png" 
                    alt="Social CRM" 
                    className="w-full h-full object-contain drop-shadow-2xl"
                  />
               </div>
            </div>

            {/* Card 5: Notifications */}
            <div ref={addToRefs} className="md:col-span-2 min-h-[120px] md:min-h-[200px] bg-[#27272a] rounded-[1.5rem] p-5 md:p-6 flex flex-row items-center justify-between border border-white/5 relative overflow-hidden group">
               <div className="space-y-2 md:space-y-4 max-w-[60%] md:max-w-sm relative z-10">
                 <h3 className="text-lg md:text-3xl font-bold text-white leading-tight">
                  Notificaciones <br/> al Instante
                 </h3>
                 <p className="text-[12px] md:text-[13px] text-gray-500 font-medium leading-snug max-w-full md:max-w-[90%]">
                   Recibí turnos y pedidos al momento.
                 </p>
               </div>
               <div className="absolute right-[-10px] md:right-[5%] bottom-[-10px] md:bottom-[-70px] h-[100%] md:h-[180%] w-auto flex items-end justify-center pointer-events-none">
                  <img 
                      src="/images/notificacion.png" 
                      alt="Notifications" 
                      className="h-full w-auto object-contain object-bottom drop-shadow-2xl transition-transform duration-500"
                  />
               </div>
            </div>

            {/* Card 6: Analytics */}
            <div ref={addToRefs} className="min-h-[120px] md:min-h-[200px] bg-[#121212] rounded-[1.5rem] p-5 md:p-6 flex flex-row md:flex-col items-center md:items-start justify-between md:justify-start border border-white/5 relative overflow-hidden group">
               <div className="space-y-2 md:space-y-3 relative z-10 max-w-[60%] md:max-w-full">
                 <h3 className="text-lg md:text-xl font-bold text-white leading-tight">
                  Analíticas en Tiempo Real
                 </h3>
                 <p className="text-[12px] md:text-[13px] text-gray-500 font-medium leading-snug">
                   Mide el rendimiento con métricas claras.
                 </p>
               </div>
               
               <div className="absolute right-[-20px] md:right-auto md:left-[-50px] bottom-[-20px] md:bottom-[-75px] w-[50%] md:w-[150%] h-[120%] md:h-[250px] pointer-events-none">
                  <img 
                      src="/images/torta.png" 
                      alt="Analytics" 
                      className="w-full h-full object-contain object-bottom-right md:object-left-bottom drop-shadow-2xl transition-transform duration-500"
                  />
               </div>
            </div>

          </div>
        </div>
      </div>

    </section>
  )
}
