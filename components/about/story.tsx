"use client"

import { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

export function Story() {
  const containerRef = useRef<HTMLDivElement>(null)
  const textRefs = useRef<(HTMLParagraphElement | HTMLHeadingElement | HTMLUListElement)[]>([])

  const addToRefs = (el: HTMLParagraphElement | HTMLHeadingElement | HTMLUListElement | null) => {
    if (el && !textRefs.current.includes(el)) {
      textRefs.current.push(el)
    }
  }

  useGSAP(() => {
    textRefs.current.forEach((el) => {
      gsap.fromTo(
        el,
        { 
          opacity: 0, 
          y: 30,
          filter: "blur(10px)"
        },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none reverse"
          }
        }
      )
    })
  }, { scope: containerRef })

  return (
    <section ref={containerRef} className="min-h-screen bg-[#1a1a1a] text-gray-300 py-32 px-6 md:px-12 flex justify-center">
      <div className="max-w-3xl w-full space-y-12">
        
        <h1 ref={addToRefs} className="text-4xl md:text-6xl font-bold text-white leading-tight">
          Ucobot no nació en una oficina.
        </h1>

        <div className="space-y-8 text-lg md:text-2xl leading-relaxed font-light">
          <p ref={addToRefs}>
            Nació un martes a la noche, en un restaurante vacío.
          </p>
          
          <p ref={addToRefs}>
            Teníamos las mesas limpias, la comida lista... y <span className="text-white font-medium">cero reservas.</span>
          </p>

          <p ref={addToRefs}>
            Mientras miraba el salón vacío, pensé: <span className="italic text-white">"Tengo una base de clientes que ya compraron acá. ¿Por qué no están volviendo?"</span>
          </p>

          <p ref={addToRefs}>
            El problema no era la comida. <span className="text-white font-bold">Era la comunicación.</span>
          </p>

          <p ref={addToRefs}>
            No teníamos forma de avisarles de las promos, recordarles que existíamos, o simplemente mantener el contacto.
          </p>

          <p ref={addToRefs}>
            Esa noche, en vez de quedarme de brazos cruzados, me puse a programar.
          </p>

          <div ref={addToRefs} className="pl-6 border-l-2 border-white/20">
            <p className="mb-4 font-medium text-white">Necesitaba algo simple:</p>
            <ul className="space-y-2 list-disc list-inside marker:text-white">
              <li>Enviar promos a toda mi base de clientes</li>
              <li>Responder automáticamente las preguntas frecuentes</li>
              <li>Recuperar clientes que hacía meses no venían</li>
            </ul>
          </div>

          <p ref={addToRefs} className="text-2xl md:text-3xl text-white font-semibold">
            Tres semanas después, el restaurante estaba lleno.
          </p>

          <p ref={addToRefs}>
            No cambié el menú. No hice publicidad cara. Solo empecé a hablarle a la gente correcta, en el momento correcto.
          </p>

          <h2 ref={addToRefs} className="text-5xl md:text-7xl font-black text-white tracking-tighter py-8">
            Ahí nació Ucobot.
          </h2>

          <p ref={addToRefs}>
            Lo que empezó como una solución para mi propio problema, hoy ayuda a cientos de negocios a no tener mesas vacías, productos sin vender, o clientes olvidados.
          </p>

          <p ref={addToRefs} className="text-xl md:text-2xl text-white border-t border-white/10 pt-8">
            Porque si funcionó para salvar mi restaurante, puede funcionar para tu negocio.
          </p>
        </div>

      </div>
    </section>
  )
}
