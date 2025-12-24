"use client"

import { Fade } from "react-awesome-reveal"

export function Hero() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-[#2e2e2e] flex flex-col items-center justify-center">
      {/* Background Gradient/Lighting effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#5e5e5e_0%,_#2e2e2e_100%)] opacity-80" />

      {/* Hero Content - UCOBOT Text */}
      <main className="relative z-10 flex w-full flex-col items-center justify-center">
        <Fade delay={500}>
          <div className="relative inline-block">
            <h1 className="select-none text-[18vw] font-black leading-none tracking-tighter text-white drop-shadow-sm">
              UCOBOT
              <span className="align-top text-[4vw] font-bold text-white">®</span>
            </h1>
            <p className="absolute -bottom-4 right-2 md:right-8 text-sm md:text-2xl text-gray-400 font-medium tracking-widest uppercase">
              by codea desarrollos
            </p>
          </div>
        </Fade>
      </main>
    </section>
  )
}
