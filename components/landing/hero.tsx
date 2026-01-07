"use client"

import { Fade } from "react-awesome-reveal"
import { ArrowLeft, ArrowUpRight } from "lucide-react"
import Link from "next/link"

export function Hero() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-black">
      
      {/* Main Container - Full Screen */}
      <div className="relative w-full h-full flex flex-col md:flex-row bg-black">
        
        {/* LEFT PANEL - Gradient Gray Area */}
        <div className="relative w-full md:w-[55%] h-full bg-gradient-to-br from-[#404040] to-[#1a1a1a] p-8 md:p-24 flex flex-col justify-center rounded-br-[5rem] md:rounded-br-[10rem] z-10">
          
          {/* Main Content */}
          <Fade direction="up" cascade damping={0.2} triggerOnce className="z-10 relative max-w-3xl">
             
             <h1 className="mt-8 text-5xl md:text-7xl lg:text-[8rem] font-black text-white leading-[0.9] tracking-tighter">
               Moderniza <br/>
               tu negocio <br/>
               <span className="text-white/90">con IA</span>
             </h1>

             {/* CTA Buttons */}
             <div className="flex items-center gap-8 mt-16">
               <Link 
                 href="/register" 
                 className="px-10 py-5 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-white font-bold text-lg transition-all hover:scale-105 hover:bg-white/30"
               >
                 Saber más
               </Link>
               
               <Link 
                 href="/login" 
                 className="px-10 py-5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white font-bold text-lg transition-all hover:scale-105 hover:bg-white/10"
               >
                 Iniciar Sesión
               </Link>
             </div>
          </Fade>

          {/* Abstract 3D shape decoration - subtle white glow instead of purple */}
          <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-white blur-[150px] opacity-5 pointer-events-none" />
          
          {/* THE CURVE / BITE - The magic trick */}
          {/* Made significantly larger and positioned to cut into the purple bg */}
          <div className="absolute top-1/2 -translate-y-1/2 -right-[60vh] w-[90vh] h-[90vh] bg-black rounded-full z-0 hidden md:block pointer-events-none shadow-[inset_20px_0_40px_rgba(0,0,0,0.5)]" />

        </div>

        {/* RIGHT PANEL - Black Area */}
        <div className="relative w-full md:w-[45%] h-full bg-black flex items-center justify-center overflow-hidden">
            
            {/* Brand Text above Robot */}
            <div className="absolute top-[15%] left-1/2 -translate-x-1/2 md:left-auto md:right-20 md:translate-x-0 flex flex-col items-center md:items-end z-20">
               <h2 className="text-6xl md:text-8xl font-black text-white tracking-widest">UCOBOT</h2>
               <p className="text-xs md:text-xl text-gray-500 uppercase tracking-[0.3em] font-medium mt-2">by codea desarrollos</p>
            </div>

            {/* ROBOT VIDEO - Centered on the Split/Curve */}
            {/* Bridging the gap between columns - Moved slightly down */}
            <div className="absolute left-[-10vh] top-[60%] -translate-y-1/2 w-[65vh] h-[65vh] z-10 flex items-center justify-center pointer-events-none">
               <img 
                 src="/robot.gif" 
                 alt="UcoBot AI"
                 className="w-full h-full object-contain drop-shadow-2xl translate-x-4"
                 style={{
                    maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)'
                 }}
               />
            </div>

        </div>

      </div>
    </section>
  )
}
