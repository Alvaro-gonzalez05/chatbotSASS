"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Bot, MessageSquare, Users, Zap, Star, ArrowRight } from "lucide-react"
import Link from "next/link"
import { FadeIn, SlideUp, ScaleIn, StaggeredFadeIn, StaggerChild } from "@/components/ui/page-transition"
import { ScrollFadeIn, ScrollSlideUp, ScrollScaleIn, ScrollStaggeredChildren, ScrollStaggerChild } from "@/components/ui/scroll-animations"
import { motion } from "framer-motion"

export function LandingPage() {
  const pricingPlans = [
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
        "API personalizada",
        "Gerente de cuenta dedicado",
      ],
      popular: false,
      cta: "Escalar Negocio",
    },
  ]

  const features = [
    {
      icon: Bot,
      title: "IA Conversacional Avanzada",
      description: "Chatbots inteligentes que entienden y responden naturalmente a tus clientes",
    },
    {
      icon: MessageSquare,
      title: "Multi-Plataforma",
      description: "Conecta WhatsApp, Instagram y Email en una sola interfaz",
    },
    {
      icon: Users,
      title: "Gestión de Clientes",
      description: "Sistema completo de puntos, historial y segmentación automática",
    },
    {
      icon: Zap,
      title: "Automatización Inteligente",
      description: "Campañas automáticas basadas en comportamiento y fechas especiales",
    },
  ]

  const testimonials = [
    {
      name: "María González",
      business: "Parrilla El Quincho - Mendoza",
      content:
        "Desde que uso UcoBot, las reservas aumentaron 40%. Los turistas pueden reservar en cualquier horario y nosotros nunca perdemos un cliente.",
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
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-lg sm:text-xl font-bold">UcoBot</span>
            </Link>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="hidden sm:block">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="ghost" asChild>
                  <Link href="/login">Iniciar Sesión</Link>
                </Button>
              </motion.div>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button asChild size="default">
                <Link href="/register">Comenzar Gratis</Link>
              </Button>
            </motion.div>
          </div>
        </header>
      </FadeIn>

      {/* Hero Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4">
        <div className="container mx-auto text-center">
          <FadeIn delay={0.1}>
            <Badge variant="secondary" className="mb-4 text-xs sm:text-sm">
              Tecnología argentina desde Mendoza
            </Badge>
          </FadeIn>
          <SlideUp delay={0.2}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-balance mb-4 sm:mb-6 px-2">
              Desde Mendoza para todo el país: <span className="text-primary">Chatbots Inteligentes</span>
            </h1>
          </SlideUp>
          <FadeIn delay={0.3}>
            <p className="text-lg sm:text-xl text-muted-foreground text-balance mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
              UcoBot nació en el corazón de Mendoza con la misión de democratizar la automatización para los negocios argentinos.
              Conecta WhatsApp, Instagram y Email con la calidez del servicio mendocino.
            </p>
          </FadeIn>
          <ScaleIn delay={0.4}>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" className="text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto" asChild>
                  <Link href="/register">
                    Comenzar Prueba Gratuita
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" variant="outline" className="text-base sm:text-lg px-6 sm:px-8 bg-transparent w-full sm:w-auto">
                  Ver Demo en Vivo
                </Button>
              </motion.div>
            </div>
          </ScaleIn>
          <FadeIn delay={0.5}>
            <p className="text-xs sm:text-sm text-muted-foreground mt-4 px-4">
              ✅ Sin tarjeta de crédito • ✅ Configuración en 5 minutos • ✅ Soporte en español
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Features Section */}
            {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 lg:py-20 px-4">
        <div className="container mx-auto">
          <ScrollSlideUp>
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 px-2">Potencia tu negocio con IA</h2>
              <p className="text-lg sm:text-xl text-muted-foreground text-balance max-w-2xl mx-auto px-4">
                Todas las herramientas que necesitas para automatizar y hacer crecer tu negocio
              </p>
            </div>
          </ScrollSlideUp>
          <ScrollStaggeredChildren>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {features.map((feature, index) => (
                <ScrollStaggerChild key={index}>
                  <motion.div whileHover={{ y: -8, scale: 1.02 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                    <Card className="text-center hover:shadow-lg transition-shadow h-full p-4 sm:p-6">
                      <CardHeader className="pb-4">
                        <motion.div
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6, ease: "easeInOut" }}
                        >
                          <feature.icon className="h-10 w-10 sm:h-12 sm:w-12 text-primary mx-auto mb-3 sm:mb-4" />
                        </motion.div>
                        <CardTitle className="text-lg sm:text-xl">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-sm sm:text-base">{feature.description}</CardDescription>
                      </CardContent>
                    </Card>
                  </motion.div>
                </ScrollStaggerChild>
              ))}
            </div>
          </ScrollStaggeredChildren>
        </div>
      </section>

      {/* About UcoBot Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <ScrollFadeIn>
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 px-2">¿Por qué UcoBot?</h2>
              <p className="text-lg sm:text-xl text-muted-foreground text-balance max-w-3xl mx-auto px-4">
                Nuestra historia comenzó en las montañas de Mendoza, donde entendimos que cada negocio argentino 
                merece herramientas de primer mundo sin la complejidad internacional.
              </p>
            </div>
          </ScrollFadeIn>
          
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <ScrollSlideUp>
              <div className="space-y-6 sm:space-y-8">
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="w-3 h-3 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-2">Nacido en Mendoza</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      Desde el corazón de Cuyo, desarrollamos UcoBot con la filosofía mendocina: 
                      trabajo honesto, tecnología accesible y trato cercano.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="w-3 h-3 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-2">Para Argentina y Latinoamérica</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      Entendemos las particularidades del mercado local: horarios, modismos, 
                      festividades y la importancia del trato personalizado.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="w-3 h-3 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-2">Tecnología Simple y Poderosa</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      Porque creemos que la automatización no debería ser complicada. 
                      UcoBot es fácil de usar pero potente en resultados.
                    </p>
                  </div>
                </div>
              </div>
            </ScrollSlideUp>
            
            <ScrollSlideUp delay={0.2}>
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-6 sm:p-8 border mt-8 lg:mt-0">
                <div className="text-center space-y-4">
                  <h3 className="text-xl sm:text-2xl font-bold text-primary">El espíritu mendocino</h3>
                  <p className="text-base sm:text-lg text-muted-foreground italic">
                    "Como el vino mendocino, UcoBot se ha desarrollado con paciencia, 
                    dedicación y el orgullo de representar lo mejor de nuestra tierra."
                  </p>
                  <div className="pt-4">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      - Equipo UcoBot, Mendoza, Argentina
                    </p>
                  </div>
                </div>
              </div>
            </ScrollSlideUp>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 sm:py-16 lg:py-20 px-4">
        <div className="container mx-auto">
          <ScrollSlideUp>
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 px-2">Planes diseñados para cada etapa de tu negocio</h2>
              <p className="text-lg sm:text-xl text-muted-foreground text-balance max-w-2xl mx-auto px-4">
                Desde startups hasta empresas establecidas, tenemos el plan perfecto para ti
              </p>
            </div>
          </ScrollSlideUp>
          <ScrollStaggeredChildren>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
              {plans.map((plan, index) => (
                <ScrollStaggerChild key={index}>
                  <motion.div 
                    whileHover={{ y: -5, scale: 1.02 }} 
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={plan.popular ? "lg:scale-105" : ""}
                  >
                    <Card className={`text-center h-full relative ${plan.popular ? "ring-2 ring-primary shadow-lg" : ""} p-4 sm:p-6`}>
                      {plan.popular && (
                        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground text-xs sm:text-sm">
                          Más Popular
                        </Badge>
                      )}
                      <CardHeader className="pb-4">
                        <CardTitle className="text-xl sm:text-2xl">{plan.name}</CardTitle>
                        <div className="text-3xl sm:text-4xl font-bold text-primary">
                          {plan.price}
                          <span className="text-base sm:text-lg text-muted-foreground font-normal">{plan.duration}</span>
                        </div>
                        <CardDescription className="text-sm sm:text-base">{plan.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 pb-4">
                        <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base">
                          {plan.features.map((feature, featureIndex) => (
                            <li key={featureIndex} className="flex items-center text-left">
                              <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary mr-2 sm:mr-3 flex-shrink-0" />
                              <span className="text-muted-foreground">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                      <CardContent>
                        <Button className="w-full text-sm sm:text-base" variant={plan.popular ? "default" : "outline"} asChild>
                          <Link href="/register">{plan.cta}</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                </ScrollStaggerChild>
              ))}
            </div>
          </ScrollStaggeredChildren>
        </div>
      </section>      {/* Testimonials Section */}
      <section id="testimonials" className="py-12 sm:py-16 lg:py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <ScrollFadeIn>
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 px-2">Lo que dicen nuestros clientes</h2>
              <p className="text-lg sm:text-xl text-muted-foreground text-balance max-w-2xl mx-auto px-4">
                Más de 1,000 negocios confían en nosotros para automatizar su atención al cliente
              </p>
            </div>
          </ScrollFadeIn>
          <ScrollStaggeredChildren>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {testimonials.map((testimonial, index) => (
                <ScrollStaggerChild key={index}>
                  <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                    <Card className="hover:shadow-lg transition-shadow h-full p-4 sm:p-6">
                      <CardHeader className="pb-4">
                        <div className="flex items-center space-x-1 mb-2">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 fill-primary text-primary" />
                          ))}
                        </div>
                        <CardTitle className="text-base sm:text-lg">{testimonial.name}</CardTitle>
                        <CardDescription className="text-sm">{testimonial.business}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm sm:text-base text-muted-foreground italic">"{testimonial.content}"</p>
                      </CardContent>
                    </Card>
                  </motion.div>
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
