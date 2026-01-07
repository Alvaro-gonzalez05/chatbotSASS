"use client"

import { 
  Target, 
  Users, 
  Search, 
  Bell, 
  PieChart, 
  BrainCircuit
} from "lucide-react"

export function Benefits() {
  return (
    <section className="w-full bg-black py-24 px-6 md:px-12 lg:px-24 min-h-screen">
      <div className="max-w-7xl mx-auto flex flex-col gap-16">
        
        {/* Header */}
        <div className="text-center space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
              Lo Que Hacemos Mejor
            </h2>
            <p className="text-lg text-gray-400 leading-relaxed max-w-2xl mx-auto">
              Desde la estrategia hasta la ejecución, nuestras herramientas están diseñadas para elevar tu marca, atraer a tu audiencia e impulsar un crecimiento medible.
            </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
          
          {/* Card 1: Tall Left - Estrategia (Data-Backed Strategy) */}
          <div className="md:col-span-1 md:row-span-2 bg-zinc-900/80 rounded-[2rem] p-8 flex flex-col justify-between border border-white/5 hover:border-white/10 transition-colors group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity">
                <BrainCircuit className="w-64 h-64 text-white" />
            </div>
            
            <div className="relative z-10 bg-gradient-to-br from-zinc-800 to-zinc-900 w-24 h-24 rounded-2xl flex items-center justify-center shadow-xl border border-white/5 mb-8">
                <BrainCircuit className="w-12 h-12 text-white" />
            </div>

            <div className="relative z-10 space-y-4">
               <h3 className="text-2xl font-bold text-white">Estrategia Automatizada</h3>
               <p className="text-sm text-gray-400 leading-relaxed">
                 Creamos flujos de conversación basados en datos reales, no en suposiciones, para que cada interacción tenga un propósito claro.
               </p>
            </div>
          </div>

          {/* Card 2: Wide Top Right - Campañas (Targeted Campaigns) */}
          <div className="md:col-span-2 bg-zinc-900/80 rounded-[2rem] p-8 flex flex-col md:flex-row items-center md:items-start justify-between border border-white/5 hover:border-white/10 transition-colors group overflow-hidden relative">
             <div className="flex flex-col justify-center h-full space-y-4 max-w-md relative z-10">
               <h3 className="text-2xl font-bold text-white">Campañas Dirigidas</h3>
               <p className="text-sm text-gray-400 leading-relaxed">
                 Llega a la audiencia correcta en el momento justo con mensajes masivos que convierten en todas las plataformas.
               </p>
             </div>
             
             <div className="relative mt-8 md:mt-0">
                <div className="relative z-10 bg-gradient-to-br from-zinc-800 to-zinc-900 w-32 h-32 rounded-full flex items-center justify-center shadow-2xl border border-white/5">
                   <Target className="w-16 h-16 text-white" />
                </div>
                {/* Decor elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-white/5 rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-white/5 rounded-full" />
             </div>
          </div>

          {/* Card 3: Small Middle - Social Media */}
          <div className="bg-zinc-900/80 rounded-[2rem] p-8 flex flex-col justify-between border border-white/5 hover:border-white/10 transition-colors relative overflow-hidden">
             <div className="space-y-4 relative z-10">
               <h3 className="text-xl font-bold text-white">Gestión 24/7</h3>
               <p className="text-xs text-gray-400 leading-relaxed">
                 Atención instantánea a múltiples usuarios simultáneamente sin demoras.
               </p>
             </div>
             <div className="self-end mt-4 bg-gradient-to-br from-zinc-800 to-zinc-900 p-4 rounded-xl border border-white/5 shadow-lg">
                <Users className="w-8 h-8 text-white" />
             </div>
          </div>

          {/* Card 4: Small Right - SEO & Content */}
          <div className="bg-zinc-900/80 rounded-[2rem] p-8 flex flex-col justify-between border border-white/5 hover:border-white/10 transition-colors relative overflow-hidden">
             <div className="space-y-4 relative z-10">
               <h3 className="text-xl font-bold text-white">Captación de Leads</h3>
               <p className="text-xs text-gray-400 leading-relaxed">
                 Aumenta tu base de datos automáticamente capturando información clave.
               </p>
             </div>
             <div className="self-end mt-4 bg-gradient-to-br from-zinc-800 to-zinc-900 p-4 rounded-xl border border-white/5 shadow-lg">
                <Search className="w-8 h-8 text-white" />
             </div>
          </div>

          {/* Card 5: Wide Bottom Left - Creative Branding */}
          <div className="md:col-span-2 bg-zinc-900/80 rounded-[2rem] p-8 flex flex-row items-center justify-between border border-white/5 hover:border-white/10 transition-colors relative overflow-hidden">
             <div className="space-y-4 max-w-sm relative z-10">
               <h3 className="text-2xl font-bold text-white">Seguimiento Automático</h3>
               <p className="text-sm text-gray-400 leading-relaxed">
                 Destaca con mensajes personalizados y recordatorios que aseguran que ningún cliente se olvide de ti.
               </p>
             </div>
             
             <div className="relative pr-8 hidden md:block">
                <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 w-32 h-32 rounded-full flex items-center justify-center shadow-xl border border-white/5 transform rotate-12">
                   <Bell className="w-16 h-16 text-white" />
                </div>
             </div>
          </div>

          {/* Card 6: Small Bottom Right - Analytics */}
          <div className="bg-zinc-900/80 rounded-[2rem] p-8 flex flex-col justify-end border border-white/5 hover:border-white/10 transition-colors relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8">
                <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 p-4 rounded-full border border-white/5 shadow-lg">
                   <PieChart className="w-8 h-8 text-white" />
                </div>
             </div>
             
             <div className="space-y-4 relative z-10 mt-16">
               <h3 className="text-xl font-bold text-white">Analíticas Claras</h3>
               <p className="text-xs text-gray-400 leading-relaxed">
                 Mide resultados en tiempo real y adapta tu estrategia rápido.
               </p>
             </div>
          </div>

        </div>
      </div>
    </section>
  )
}
