"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Bot, MessageSquare, Users, Zap, Star, ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { FadeIn, SlideUp, ScaleIn, StaggeredFadeIn, StaggerChild } from "@/components/ui/page-transition"
import { ScrollFadeIn, ScrollSlideUp, ScrollScaleIn, ScrollStaggeredChildren, ScrollStaggerChild } from "@/components/ui/scroll-animations"
import { motion } from "framer-motion"

export function LandingPage() {
  const plans = [
    {
      name: "Prueba Gratuita",
      price: "Gratis",
      duration: "15 días",
      description: "Configuración completa + sección de prueba",
      features: [
        "Configuración completa del bot",
        "Sección de prueba integrada",
        "Sin conexión a Meta/WhatsApp",
        "Soporte por email",
      ],
      popular: false,
      cta: "Comenzar Prueba",
    },
    {
      name: "Básico",
      price: "$150",
      duration: "/mes",
      description: "Perfecto para pequeños negocios",
      features: ["1 bot funcional conectado", "1 automatización", "Gestión básica de clientes", "Soporte prioritario"],
      popular: false,
      cta: "Comenzar Ahora",
    },
    {
      name: "Pro",
      price: "$200",
      duration: "/mes",
      description: "Ideal para negocios en crecimiento",
      features: [
        "2 bots funcionales",
        "3 automatizaciones",
        "Sistema de puntos completo",
        "Analytics avanzados",
        "Soporte 24/7",
      ],
      popular: true,
      cta: "Más Popular",
    },
    {
      name: "Pro Max",
      price: "$270",
      duration: "/mes",
      description: "Para empresas establecidas",
      features: [
        "3 bots funcionales",
        "5 automatizaciones",
        "Integraciones avanzadas",
        "Gestión completa de promociones",
        "Soporte dedicado",
      ],
      popular: false,
      cta: "Comenzar Ahora",
    },
  ]

  const features = [
    {
      icon: MessageSquare,
      title: "Chatbots Inteligentes",
      description: "IA avanzada que entiende el contexto y responde como un humano, mejorando cada día con machine learning."
    },
    {
      icon: Users,
      title: "Gestión de Clientes",
      description: "Centraliza todas las conversaciones y datos de clientes en un solo lugar con segmentación inteligente."
    },
    {
      icon: Zap,
      title: "Automatización Total",
      description: "Workflows personalizados que se adaptan a tu negocio, desde leads hasta postventa automático."
    }
  ]

  const testimonials = [
    {
      name: "Roberto Fernández",
      business: "Viñedo San Rafael",
      content: "Implementamos UcoBot para nuestras catas y ventas online. En 3 meses aumentamos las conversiones un 240%.",
      rating: 5,
    },
    {
      name: "María González",
      business: "Hotel Boutique - Luján de Cuyo",
      content: "La automatización de reservas y consultas nos permite enfocarnos en la experiencia del huésped. Increíble herramienta.",
      rating: 5,
    },
    {
      name: "Carlos Ruiz",
      business: "Bodega Familiar - Maipú",
      content: "El sistema automatiza las visitas a la bodega y el programa de puntos para nuestros vinos. ROI increíble del 300%.",
      rating: 5,
    },
    {
      name: "Ana Martínez",
      business: "Spa Termas - Las Leñas",
      content: "UcoBot maneja nuestras reservas de temporada alta automáticamente. Nos ahorra 15 horas semanales en atención.",
      rating: 5,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <FadeIn>
        <header className="flex items-center justify-between p-4 sm:p-6">
          <div className="flex items-center space-x-2">
            <Bot className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <span className="text-xl sm:text-2xl font-bold">UcoBot</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Comenzar Gratis</Link>
            </Button>
          </div>
        </header>
      </FadeIn>

      {/* Hero Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4">
        <div className="container mx-auto text-center">
          <SlideUp>
            <Badge variant="secondary" className="mb-4 sm:mb-6">
              Desde Mendoza para el mundo
            </Badge>
          </SlideUp>
          <FadeIn delay={0.2}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-balance">
              Automatiza tu atención al cliente con{" "}
              <span className="text-primary">Inteligencia Artificial</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8 text-balance max-w-3xl mx-auto px-4">
              Convierte visitantes en clientes fieles con chatbots inteligentes que nunca duermen. 
              Creado en Mendoza, inspirado en la excelencia vitivinícola argentina.
            </p>
          </FadeIn>
          <ScaleIn delay={0.4}>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" className="text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto" asChild>
                  <Link href="/register">
                    Prueba Gratis por 14 Días
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" variant="outline" className="text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto">
                  Ver Demo en Vivo
                </Button>
              </motion.div>
            </div>
          </ScaleIn>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <ScrollSlideUp>
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">¿Por qué UcoBot?</h2>
              <p className="text-lg sm:text-xl text-muted-foreground text-balance max-w-2xl mx-auto px-4">
                Desarrollado con el espíritu innovador de Mendoza, combinando tecnología de punta con la pasión argentina por la excelencia.
              </p>
            </div>
          </ScrollSlideUp>
          <ScrollStaggeredChildren>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {features.map((feature, index) => (
                <ScrollStaggerChild key={index} index={index}>
                  <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <CardHeader className="text-center pb-4">
                      <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
                        <feature.icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                      </div>
                      <CardTitle className="text-lg sm:text-xl mb-2">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <CardDescription className="text-sm sm:text-base leading-relaxed">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </ScrollStaggerChild>
              ))}
            </div>
          </ScrollStaggeredChildren>
        </div>
      </section>

      {/* Story Section - UcoBot Origins */}
      <section className="py-12 sm:py-16 lg:py-20 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <ScrollSlideUp>
              <div className="space-y-4 sm:space-y-6">
                <Badge variant="outline" className="w-fit">Nuestra Historia</Badge>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-balance">
                  Nacido en el corazón vitivinícola de Argentina
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p className="text-base sm:text-lg leading-relaxed">
                    UcoBot surge en Mendoza, inspirado en la tradición familiar de elaborar los mejores vinos. 
                    Como los viñateros cuidan cada cepa, nosotros cuidamos cada interacción de tus clientes.
                  </p>
                  <p className="text-base sm:text-lg leading-relaxed">
                    Desde las faldas de la Cordillera de Los Andes, combinamos la pasión argentina por la excelencia 
                    con tecnología de vanguardia para revolucionar la atención al cliente.
                  </p>
                  <p className="text-base sm:text-lg leading-relaxed">
                    Cada chatbot que creamos lleva el ADN mendocino: <strong>calidad, dedicación y resultados excepcionales</strong>.
                  </p>
                </div>
              </div>
            </ScrollSlideUp>
            <ScrollScaleIn delay={0.2}>
              <div className="relative">
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 p-4 sm:p-6">
                  <div className="h-full w-full rounded-xl overflow-hidden shadow-2xl relative">
                    <Image
                      src="/uco.jpg"
                      alt="Valle de Uco, Mendoza - Inspiración de UcoBot"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1">Valle de Uco</div>
                      <div className="text-sm sm:text-base opacity-90">Mendoza, Argentina</div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollScaleIn>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <ScrollSlideUp>
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Planes que se adaptan a tu crecimiento</h2>
              <p className="text-lg sm:text-xl text-muted-foreground text-balance max-w-2xl mx-auto px-4">
                Desde emprendedores hasta grandes empresas, tenemos la solución perfecta para vos
              </p>
            </div>
          </ScrollSlideUp>
          <ScrollStaggeredChildren>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {plans.map((plan, index) => (
                <ScrollStaggerChild key={index} index={index}>
                  <Card className={`relative h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${
                    plan.popular ? "border-primary ring-1 ring-primary" : ""
                  }`}>
                    {plan.popular && (
                      <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                        Más Popular
                      </Badge>
                    )}
                    <CardHeader className="text-center pb-3 lg:pb-4">
                      <CardTitle className="text-base lg:text-lg">{plan.name}</CardTitle>
                      <div className="space-y-1">
                        <div className="text-xl lg:text-2xl font-bold">{plan.price}</div>
                        <div className="text-xs lg:text-sm text-muted-foreground">{plan.duration}</div>
                      </div>
                      <CardDescription className="text-xs lg:text-sm">{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 lg:space-y-4 pt-3 lg:pt-4">
                      <ul className="space-y-1.5 lg:space-y-2">
                        {plan.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start gap-2">
                            <Check className="h-3 w-3 lg:h-4 lg:w-4 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-xs lg:text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button 
                        className="w-full mt-4 lg:mt-6 text-xs lg:text-sm" 
                        size="sm"
                        variant={plan.popular ? "default" : "outline"}
                        asChild
                      >
                        <Link href="/register">
                          {plan.cta}
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </ScrollStaggerChild>
              ))}
            </div>
          </ScrollStaggeredChildren>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4">
        <div className="container mx-auto">
          <ScrollSlideUp>
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Lo que dicen nuestros clientes</h2>
              <p className="text-lg sm:text-xl text-muted-foreground text-balance max-w-2xl mx-auto px-4">
                Empresas de toda Argentina confían en UcoBot para crecer
              </p>
            </div>
          </ScrollSlideUp>
          <ScrollStaggeredChildren>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {testimonials.map((testimonial, index) => (
                <ScrollStaggerChild key={index} index={index}>
                  <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex mb-3 sm:mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 fill-primary text-primary" />
                        ))}
                      </div>
                      <blockquote className="text-sm sm:text-base mb-4 leading-relaxed italic">
                        "{testimonial.content}"
                      </blockquote>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs sm:text-sm font-semibold text-primary">
                            {testimonial.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-sm sm:text-base">{testimonial.name}</div>
                          <div className="text-xs sm:text-sm text-muted-foreground">{testimonial.business}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </ScrollStaggerChild>
              ))}
            </div>
          </ScrollStaggeredChildren>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center">
          <ScrollSlideUp>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 px-2">¿Listo para automatizar tu negocio?</h2>
            <p className="text-lg sm:text-xl mb-6 sm:mb-8 text-primary-foreground/90 text-balance max-w-2xl mx-auto px-4">
              Únete a miles de empresas que ya están aumentando sus ventas con chatbots inteligentes
            </p>
          </ScrollSlideUp>
          <ScrollScaleIn delay={0.2}>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" variant="secondary" className="text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto" asChild>
                  <Link href="/register">
                    Comenzar Ahora - Es Gratis
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-base sm:text-lg px-6 sm:px-8 bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary w-full sm:w-auto"
                >
                  Hablar con un Experto
                </Button>
              </motion.div>
            </div>
          </ScrollScaleIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-10 lg:py-12 px-4 border-t">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                <span className="text-base sm:text-lg font-bold">UcoBot</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
                La plataforma líder en automatización de chatbots con IA para fidelización de clientes.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Producto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Características
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Precios
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Integraciones
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    API
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Soporte</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Centro de Ayuda
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Documentación
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Contacto
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Estado del Sistema
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Acerca de
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Carreras
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Privacidad
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-xs sm:text-sm text-muted-foreground">
            <p>&copy; 2024 UcoBot. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}