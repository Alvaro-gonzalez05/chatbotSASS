"use client"

import { Fade } from "react-awesome-reveal"
import { ArrowLeft, ArrowUpRight, ArrowRight, Menu } from "lucide-react"
import Link from "next/link"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-black">
      
      {/* Main Container - Full Screen */}
      <div className="relative w-full h-full flex flex-col md:flex-row bg-black">
        
        {/* LEFT PANEL - Gradient Gray Area */}
        <div className="relative w-full h-full md:w-[55%] bg-gradient-to-br from-[#404040] to-[#1a1a1a] p-6 sm:p-8 md:p-24 flex flex-col justify-center rounded-br-[3rem] md:rounded-br-[10rem] z-10 transition-all duration-500 overflow-hidden md:overflow-visible">
          
          {/* NAVIGATION LINKS (Left / Gray Side) */}
          <nav className="absolute top-6 left-6 md:top-12 md:left-24 z-30 flex items-center gap-8 text-sm font-medium text-white/90">
             {/* Desktop Nav */}
             <div className="hidden md:flex items-center gap-8">
               <Link href="/nosotros" className="group relative transition-colors hover:text-white">
                  Nosotros
                  <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-white transition-all duration-300 group-hover:w-full"></span>
                </Link>
                {["Soluciones", "Agencias", "Precios", "Recursos"].map((item) => (
                  <Link key={item} href="#" className="group relative transition-colors hover:text-white">
                    {item}
                    <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-white transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                ))}
             </div>

             {/* Mobile Nav Trigger */}
             <Sheet>
               <SheetTrigger asChild>
                 <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-white/20">
                   <Menu className="h-6 w-6" />
                 </Button>
               </SheetTrigger>
               <SheetContent side="left" className="bg-[#1a1a1a] border-gray-800 text-white">
                 <SheetHeader>
                   <SheetTitle className="text-white text-left text-2xl font-bold">UCOBOT</SheetTitle>
                 </SheetHeader>
                 <div className="flex flex-col gap-6 mt-8">
                   <Link href="/nosotros" className="text-lg font-medium hover:text-gray-300 transition-colors">
                     Nosotros
                   </Link>
                   {["Soluciones", "Agencias", "Precios", "Recursos"].map((item) => (
                     <Link key={item} href="#" className="text-lg font-medium hover:text-gray-300 transition-colors">
                       {item}
                     </Link>
                   ))}
                   <div className="flex flex-col gap-4 mt-4">
                     <Link 
                       href="/login" 
                       className="text-lg font-medium hover:text-gray-300 transition-colors"
                     >
                       Iniciar Sesión
                     </Link>
                     <Link 
                       href="/register" 
                       className="px-6 py-3 rounded-full bg-white text-black font-bold text-center transition-transform hover:scale-105"
                     >
                       Registrarse
                     </Link>
                   </div>
                 </div>
               </SheetContent>
             </Sheet>
          </nav>

          {/* Main Content */}
          <Fade direction="up" cascade damping={0.2} triggerOnce className="z-10 relative max-w-3xl">
             
             <h1 className="mt-12 md:mt-8 text-4xl sm:text-5xl md:text-7xl lg:text-[7rem] font-black text-white leading-[1.0] md:leading-[0.9] tracking-tighter text-center md:text-left">
               Moderniza tu negocio <br/>
               <span className="text-white/90">con IA</span>
             </h1>

             {/* CTA Buttons */}
             <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 mt-8 sm:mt-16 w-full justify-center md:justify-start">
               <Link 
                 href="/register" 
                 className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-white font-bold text-base sm:text-lg transition-all hover:scale-105 hover:bg-white/30 text-center"
               >
                 Saber más
               </Link>
               
               <Link 
                 href="/login" 
                 className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white font-bold text-base sm:text-lg transition-all hover:scale-105 hover:bg-white/10 text-center"
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
        <div className="relative w-full h-[40vh] md:h-full md:w-[45%] bg-black flex items-center justify-center overflow-hidden shrink-0">
            
            {/* LOGIN BUTTON (Right / Black Side) */}
            <div className="absolute top-8 right-8 md:top-12 md:right-12 z-30 hidden md:block">
                <Link
                  href="/login"
                  className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-transform hover:scale-105 active:scale-95 hover:bg-white/90"
                >
                  Iniciar Sesión
                  <ArrowRight className="h-4 w-4" />
                </Link>
            </div>

            {/* Brand Text above Robot */}
            <div className="absolute top-[10%] left-1/2 -translate-x-1/2 md:left-auto md:right-20 md:translate-x-0 flex flex-col items-center md:items-end z-20 w-full md:w-auto">
               <h2 className="text-3xl sm:text-5xl md:text-8xl font-black text-white tracking-widest text-center md:text-right">UCOBOT</h2>
               <p className="text-[10px] sm:text-xs md:text-xl text-gray-500 uppercase tracking-[0.3em] font-medium mt-2 text-center md:text-right">by codea desarrollos</p>
            </div>

            {/* ROBOT VIDEO - Centered on the Split/Curve */}
            {/* Bridging the gap between columns - Moved slightly down */}
            <div className="absolute left-1/2 md:left-[-10vh] top-[55%] md:top-[60%] -translate-x-1/2 md:-translate-x-0 -translate-y-1/2 w-[35vh] sm:w-[50vh] md:w-[65vh] h-[35vh] sm:h-[50vh] md:h-[65vh] z-10 flex items-center justify-center pointer-events-none">
               <img 
                 src="/robot.gif" 
                 alt="UcoBot AI"
                 className="w-full h-full object-contain drop-shadow-2xl md:translate-x-4"
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
