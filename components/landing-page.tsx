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
      business: "Restaurante La Cocina",
      content:
        "Nuestras reservas aumentaron 40% desde que implementamos el chatbot. Los clientes aman la atención 24/7.",
      rating: 5,
    },
    {
      name: "Carlos Ruiz",
      business: "Tienda Fashion Style",
      content: "El sistema de puntos ha mejorado increíblemente la fidelidad de nuestros clientes. ROI del 300%.",
      rating: 5,
    },
    {
      name: "Ana Martínez",
      business: "Spa Wellness",
      content: "La automatización de citas y recordatorios nos ahorra 10 horas semanales. Imprescindible.",
      rating: 5,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <FadeIn>
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between">
            <motion.div 
              className="flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Bot className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">BotSaaS</span>
            </motion.div>
            <nav className="hidden md:flex items-center space-x-6">
              <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
                <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">
                  Características
                </Link>
              </motion.div>
              <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
                <Link href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
                  Precios
                </Link>
              </motion.div>
              <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
                <Link href="#testimonials" className="text-sm font-medium hover:text-primary transition-colors">
                  Testimonios
                </Link>
              </motion.div>
            </nav>
            <div className="flex items-center space-x-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="ghost" asChild>
                  <Link href="/login">Iniciar Sesión</Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button asChild>
                  <Link href="/register">Comenzar Gratis</Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </header>
      </FadeIn>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <FadeIn delay={0.1}>
            <Badge variant="secondary" className="mb-4">
              🚀 Automatización con IA para tu negocio
            </Badge>
          </FadeIn>
          <SlideUp delay={0.2}>
            <h1 className="text-4xl md:text-6xl font-bold text-balance mb-6">
              Transforma tu atención al cliente con <span className="text-primary">Chatbots Inteligentes</span>
            </h1>
          </SlideUp>
          <FadeIn delay={0.3}>
            <p className="text-xl text-muted-foreground text-balance mb-8 max-w-3xl mx-auto">
              Automatiza conversaciones, fideliza clientes y aumenta ventas con nuestra plataforma de chatbots con IA.
              Conecta WhatsApp, Instagram y Email en minutos.
            </p>
          </FadeIn>
          <ScaleIn delay={0.4}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" className="text-lg px-8" asChild>
                  <Link href="/register">
                    Comenzar Prueba Gratuita
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent">
                  Ver Demo en Vivo
                </Button>
              </motion.div>
            </div>
          </ScaleIn>
          <FadeIn delay={0.5}>
            <p className="text-sm text-muted-foreground mt-4">
              ✅ Sin tarjeta de crédito • ✅ Configuración en 5 minutos • ✅ Soporte en español
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <ScrollFadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Todo lo que necesitas para automatizar tu negocio</h2>
              <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
                Herramientas poderosas diseñadas para aumentar tus ventas y mejorar la experiencia del cliente
              </p>
            </div>
          </ScrollFadeIn>
          <ScrollStaggeredChildren>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <ScrollStaggerChild key={index}>
                  <motion.div whileHover={{ y: -8, scale: 1.02 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                    <Card className="text-center hover:shadow-lg transition-shadow h-full">
                      <CardHeader>
                        <motion.div
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6, ease: "easeInOut" }}
                        >
                          <feature.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                        </motion.div>
                        <CardTitle className="text-xl">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-base">{feature.description}</CardDescription>
                      </CardContent>
                    </Card>
                  </motion.div>
                </ScrollStaggerChild>
              ))}
            </div>
          </ScrollStaggeredChildren>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto">
          <ScrollSlideUp>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Planes diseñados para cada etapa de tu negocio</h2>
              <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
                Desde startups hasta empresas establecidas, tenemos el plan perfecto para ti
              </p>
            </div>
          </ScrollSlideUp>
          <ScrollStaggeredChildren>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {pricingPlans.map((plan, index) => (
                <ScrollStaggerChild key={index}>
                  <motion.div whileHover={{ y: -5, scale: 1.02 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                    <Card className={`relative ${plan.popular ? "border-primary shadow-lg scale-105" : ""} h-full`}>
                      {plan.popular && (
                        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">Más Popular</Badge>
                      )}
                      <CardHeader className="text-center">
                        <CardTitle className="text-2xl">{plan.name}</CardTitle>
                        <div className="text-3xl font-bold text-primary">
                          {plan.price}
                          <span className="text-sm text-muted-foreground font-normal">{plan.duration}</span>
                        </div>
                        <CardDescription>{plan.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <ul className="space-y-2">
                          {plan.features.map((feature, featureIndex) => (
                            <li key={featureIndex} className="flex items-center">
                              <Check className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                              <span className="text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <Button className="w-full" variant={plan.popular ? "default" : "outline"} asChild>
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
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <ScrollFadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Lo que dicen nuestros clientes</h2>
              <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
                Más de 1,000 negocios confían en nosotros para automatizar su atención al cliente
              </p>
            </div>
          </ScrollFadeIn>
          <ScrollStaggeredChildren>
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <ScrollStaggerChild key={index}>
                  <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                    <Card className="hover:shadow-lg transition-shadow h-full">
                      <CardHeader>
                        <div className="flex items-center space-x-1 mb-2">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                          ))}
                        </div>
                        <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                        <CardDescription>{testimonial.business}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground italic">"{testimonial.content}"</p>
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
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center">
          <ScrollSlideUp>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">¿Listo para automatizar tu negocio?</h2>
            <p className="text-xl mb-8 text-primary-foreground/90 text-balance max-w-2xl mx-auto">
              Únete a miles de empresas que ya están aumentando sus ventas con chatbots inteligentes
            </p>
          </ScrollSlideUp>
          <ScrollScaleIn delay={0.2}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" variant="secondary" className="text-lg px-8" asChild>
                  <Link href="/register">
                    Comenzar Ahora - Es Gratis
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary bg-transparent"
                >
                  Hablar con Ventas
                </Button>
              </motion.div>
            </div>
          </ScrollScaleIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Bot className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold">ChatBot Pro</span>
              </div>
              <p className="text-muted-foreground text-sm">
                La plataforma líder en automatización de chatbots con IA para fidelización de clientes.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-primary">
                    Características
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary">
                    Precios
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary">
                    Integraciones
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary">
                    API
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Soporte</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-primary">
                    Centro de Ayuda
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary">
                    Documentación
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary">
                    Contacto
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary">
                    Estado del Sistema
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-primary">
                    Acerca de
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary">
                    Carreras
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary">
                    Privacidad
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 ChatBot Pro. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
