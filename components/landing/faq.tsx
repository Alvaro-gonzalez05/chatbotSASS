"use client"

import { useState, useRef } from "react"
import { Plus, Minus } from "lucide-react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

const faqs = [
  {
    question: "¿Necesito saber programar para usar UcoBot?",
    answer: "No, UcoBot está diseñado para ser intuitivo. Puedes configurar tus flujos de conversación y respuestas automáticas sin escribir una sola línea de código."
  },
  {
    question: "¿Puedo cancelar mi suscripción en cualquier momento?",
    answer: "Sí, no tenemos contratos a largo plazo. Puedes cancelar o cambiar tu plan cuando lo desees desde tu panel de control."
  },
  {
    question: "¿Qué sucede si supero el límite de la IA gratuita?",
    answer: "La IA para respuestas es ilimitada en el plan Pro. En el plan gratuito, tienes un límite diario generoso proporcionado por la tecnología de Google Gemini."
  },
  {
    question: "¿Cómo funcionan los cobros por envíos masivos?",
    answer: "Solo pagas $0.10 USD por cada mensaje que se entrega exitosamente en una campaña de difusión masiva. Los mensajes de respuesta a clientes (inbound) no tienen este costo."
  },
  {
    question: "¿Ofrecen soporte técnico?",
    answer: "Sí, ofrecemos soporte prioritario 24/7 para usuarios del plan Pro y soporte estándar para usuarios del plan gratuito."
  }
]

export function FAQ() {
  const containerRef = useRef(null)
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  useGSAP(() => {
    gsap.from(containerRef.current, {
      y: 50,
      opacity: 0,
      duration: 0.8,
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 80%",
      }
    })
  }, { scope: containerRef })

  return (
    <section ref={containerRef} className="w-full bg-black py-24 px-6 md:px-12 lg:px-24 min-h-screen flex items-center justify-center">
      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        
        {/* Left Column: FAQs */}
        <div className="space-y-8">
          <div className="mb-8">
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
              Preguntas Frecuentes
            </h2>
            <p className="text-lg text-gray-400">
              Todo lo que necesitas saber sobre UcoBot.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className="border-b border-gray-800 pb-4"
              >
                <button 
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex justify-between items-center py-4 text-left group"
                >
                  <span className="text-xl font-medium text-white group-hover:text-gray-300 transition-colors">
                    {faq.question}
                  </span>
                  <span className="ml-4 flex-shrink-0">
                    {openIndex === index ? (
                      <Minus className="w-6 h-6 text-white" />
                    ) : (
                      <Plus className="w-6 h-6 text-white" />
                    )}
                  </span>
                </button>
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openIndex === index ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="text-gray-400 pb-4 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Image Placeholder */}
        <div className="relative h-[600px] w-full bg-gray-50 rounded-[3rem] overflow-hidden flex items-center justify-center border border-gray-100">
           {/* Placeholder for Robot Image */}
           <div className="text-center p-8">
             <p className="text-gray-400 font-medium mb-4">Espacio para imagen del robot</p>
             <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto animate-pulse flex items-center justify-center">
                <span className="text-4xl">🤖</span>
             </div>
           </div>
        </div>

      </div>
    </section>
  )
}
