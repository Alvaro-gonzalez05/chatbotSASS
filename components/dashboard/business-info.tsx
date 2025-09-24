"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, MapPin, Phone, Mail, Globe, Save } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollFadeIn, ScrollSlideUp, ScrollStaggeredChildren, ScrollStaggerChild } from "@/components/ui/scroll-animations"
import { motion } from "framer-motion"

interface BusinessInfo {
  id?: string
  business_name: string
  business_type: string
  description: string
  address: string
  phone: string
  email: string
  website: string
  opening_hours: {
    monday: { isOpen: boolean; open: string; close: string }
    tuesday: { isOpen: boolean; open: string; close: string }
    wednesday: { isOpen: boolean; open: string; close: string }
    thursday: { isOpen: boolean; open: string; close: string }
    friday: { isOpen: boolean; open: string; close: string }
    saturday: { isOpen: boolean; open: string; close: string }
    sunday: { isOpen: boolean; open: string; close: string }
  }
  social_media: {
    facebook?: string
    instagram?: string
    twitter?: string
    whatsapp?: string
  }
  logo_url?: string
}

export function BusinessInfo() {
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    business_name: "",
    business_type: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    opening_hours: {
      monday: { isOpen: false, open: "09:00", close: "18:00" },
      tuesday: { isOpen: false, open: "09:00", close: "18:00" },
      wednesday: { isOpen: false, open: "09:00", close: "18:00" },
      thursday: { isOpen: false, open: "09:00", close: "18:00" },
      friday: { isOpen: false, open: "09:00", close: "18:00" },
      saturday: { isOpen: false, open: "09:00", close: "14:00" },
      sunday: { isOpen: false, open: "10:00", close: "14:00" },
    },
    social_media: {},
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchBusinessInfo()
  }, [])

  const fetchBusinessInfo = async () => {
    try {
      setIsLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase.from("user_profiles").select("business_info").eq("id", user.id).single()

      if (error && error.code !== "PGRST116") throw error

      if (data?.business_info) {
        const businessData = {
          ...data.business_info,
          social_media: data.business_info.social_media || {},
          opening_hours:
            typeof data.business_info.opening_hours === "string"
              ? {
                  monday: { isOpen: false, open: "09:00", close: "18:00" },
                  tuesday: { isOpen: false, open: "09:00", close: "18:00" },
                  wednesday: { isOpen: false, open: "09:00", close: "18:00" },
                  thursday: { isOpen: false, open: "09:00", close: "18:00" },
                  friday: { isOpen: false, open: "09:00", close: "18:00" },
                  saturday: { isOpen: false, open: "09:00", close: "14:00" },
                  sunday: { isOpen: false, open: "10:00", close: "14:00" },
                }
              : data.business_info.opening_hours || {
                  monday: { isOpen: false, open: "09:00", close: "18:00" },
                  tuesday: { isOpen: false, open: "09:00", close: "18:00" },
                  wednesday: { isOpen: false, open: "09:00", close: "18:00" },
                  thursday: { isOpen: false, open: "09:00", close: "18:00" },
                  friday: { isOpen: false, open: "09:00", close: "18:00" },
                  saturday: { isOpen: false, open: "09:00", close: "14:00" },
                  sunday: { isOpen: false, open: "10:00", close: "14:00" },
                },
        }
        setBusinessInfo(businessData)
      }
    } catch (error) {
      console.error("Error fetching business info:", error)
      toast.error("Error al cargar información", {
        description: "No se pudo cargar la información del negocio. Inténtalo de nuevo.",
        duration: 4000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const saveBusinessInfo = async () => {
    try {
      setIsSaving(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from("user_profiles").update({ business_info: businessInfo }).eq("id", user.id)

      if (error) throw error

      toast.success("Información del negocio actualizada", {
        description: `Los datos de "${businessInfo.business_name || 'tu negocio'}" han sido guardados correctamente.`,
        duration: 4000,
      })
    } catch (error) {
      console.error("Error saving business info:", error)
      toast.error("Error al guardar información", {
        description: "No se pudo guardar la información del negocio. Inténtalo de nuevo.",
        duration: 4000,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const updateField = (field: keyof BusinessInfo, value: any) => {
    setBusinessInfo((prev) => ({ ...prev, [field]: value }))
  }

  const updateSocialMedia = (platform: string, value: string) => {
    setBusinessInfo((prev) => ({
      ...prev,
      social_media: { ...prev.social_media, [platform]: value },
    }))
  }

  const updateOpeningHours = (
    day: keyof typeof businessInfo.opening_hours,
    field: "isOpen" | "open" | "close",
    value: boolean | string,
  ) => {
    setBusinessInfo((prev) => ({
      ...prev,
      opening_hours: {
        ...prev.opening_hours,
        [day]: {
          ...prev.opening_hours[day],
          [field]: value,
        },
      },
    }))
  }

  const businessTypes = [
    "Restaurante",
    "Tienda de Ropa",
    "Salón de Belleza",
    "Gimnasio",
    "Consultorio Médico",
    "Agencia de Viajes",
    "Inmobiliaria",
    "Educación",
    "Tecnología",
    "Servicios Financieros",
    "E-commerce",
    "Otro",
  ]

  const dayLabels = {
    monday: "Lunes",
    tuesday: "Martes",
    wednesday: "Miércoles",
    thursday: "Jueves",
    friday: "Viernes",
    saturday: "Sábado",
    sunday: "Domingo",
  }

  // Array ordenado de días para mostrar en el orden correcto
  const orderedDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const

  if (isLoading) {
    return <div>Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <ScrollSlideUp>
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">Información General</TabsTrigger>
            <TabsTrigger value="contact">Contacto</TabsTrigger>
            <TabsTrigger value="social">Redes Sociales</TabsTrigger>
          </TabsList>

        <TabsContent value="general" className="space-y-6">
          <ScrollFadeIn delay={0.2}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Información General
                </CardTitle>
                <CardDescription>Configura los datos básicos de tu negocio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScrollStaggeredChildren className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ScrollStaggerChild>
                    <div className="space-y-2">
                      <Label htmlFor="business_name">Nombre del Negocio</Label>
                      <Input
                        id="business_name"
                        value={businessInfo.business_name}
                        onChange={(e) => updateField("business_name", e.target.value)}
                        placeholder="Mi Empresa S.A."
                      />
                    </div>
                  </ScrollStaggerChild>
                  <ScrollStaggerChild>
                    <div className="space-y-2">
                      <Label htmlFor="business_type">Tipo de Negocio</Label>
                      <Select
                        value={businessInfo.business_type}
                        onValueChange={(value) => updateField("business_type", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {businessTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </ScrollStaggerChild>
                </ScrollStaggeredChildren>

                <ScrollFadeIn delay={0.3}>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción del Negocio</Label>
                    <Textarea
                      id="description"
                      value={businessInfo.description}
                      onChange={(e) => updateField("description", e.target.value)}
                      placeholder="Describe tu negocio, productos o servicios..."
                      rows={4}
                    />
                  </div>
                </ScrollFadeIn>

                <div className="space-y-4">
                  <Label>Horarios de Atención</Label>
                  <ScrollStaggeredChildren className="space-y-3">
                    {orderedDays.map((day) => {
                      const schedule = businessInfo.opening_hours[day]
                      return (
                      <ScrollStaggerChild key={day}>
                        <motion.div 
                          className="flex items-center gap-4 p-3 border rounded-lg"
                          whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="flex items-center space-x-2 min-w-[120px]">
                            <Checkbox
                              id={`${day}-open`}
                              checked={schedule.isOpen}
                              onCheckedChange={(checked) =>
                                updateOpeningHours(
                                  day as keyof typeof businessInfo.opening_hours,
                                  "isOpen",
                                  checked as boolean,
                                )
                              }
                            />
                            <Label htmlFor={`${day}-open`} className="font-medium">
                              {dayLabels[day as keyof typeof dayLabels]}
                            </Label>
                          </div>

                          {schedule.isOpen && (
                            <div className="flex items-center gap-2 flex-1">
                              <div className="flex items-center gap-2">
                                <Label className="text-sm text-muted-foreground">Abre:</Label>
                                <Input
                                  type="time"
                                  value={schedule.open}
                                  onChange={(e) =>
                                    updateOpeningHours(
                                      day as keyof typeof businessInfo.opening_hours,
                                      "open",
                                      e.target.value,
                                    )
                                  }
                                  className="w-24"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <Label className="text-sm text-muted-foreground">Cierra:</Label>
                                <Input
                                  type="time"
                                  value={schedule.close}
                                  onChange={(e) =>
                                    updateOpeningHours(
                                      day as keyof typeof businessInfo.opening_hours,
                                      "close",
                                      e.target.value,
                                    )
                                  }
                                  className="w-24"
                                />
                              </div>
                            </div>
                          )}

                          {!schedule.isOpen && (
                            <div className="flex-1">
                              <span className="text-sm text-muted-foreground">Cerrado</span>
                            </div>
                          )}
                        </motion.div>
                      </ScrollStaggerChild>
                      )
                    })}
                  </ScrollStaggeredChildren>
                </div>
              </CardContent>
            </Card>
          </ScrollFadeIn>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <ScrollFadeIn delay={0.2}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Información de Contacto
                </CardTitle>
                <CardDescription>Datos de contacto para tus clientes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScrollFadeIn delay={0.3}>
                  <div className="space-y-2">
                    <Label htmlFor="address">Dirección</Label>
                    <div className="flex gap-2">
                      <MapPin className="h-4 w-4 mt-3 text-muted-foreground" />
                      <Input
                        id="address"
                        value={businessInfo.address}
                        onChange={(e) => updateField("address", e.target.value)}
                        placeholder="Calle Principal 123, Ciudad, País"
                      />
                    </div>
                  </div>
                </ScrollFadeIn>

                <ScrollStaggeredChildren className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ScrollStaggerChild>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <div className="flex gap-2">
                        <Phone className="h-4 w-4 mt-3 text-muted-foreground" />
                        <Input
                          id="phone"
                          value={businessInfo.phone}
                          onChange={(e) => updateField("phone", e.target.value)}
                          placeholder="+1 234 567 8900"
                        />
                      </div>
                    </div>
                  </ScrollStaggerChild>
                  <ScrollStaggerChild>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="flex gap-2">
                        <Mail className="h-4 w-4 mt-3 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={businessInfo.email}
                          onChange={(e) => updateField("email", e.target.value)}
                          placeholder="contacto@miempresa.com"
                        />
                      </div>
                    </div>
                  </ScrollStaggerChild>
                </ScrollStaggeredChildren>

                <ScrollFadeIn delay={0.5}>
                  <div className="space-y-2">
                    <Label htmlFor="website">Sitio Web</Label>
                    <div className="flex gap-2">
                      <Globe className="h-4 w-4 mt-3 text-muted-foreground" />
                      <Input
                        id="website"
                        value={businessInfo.website}
                        onChange={(e) => updateField("website", e.target.value)}
                        placeholder="https://www.miempresa.com"
                      />
                    </div>
                  </div>
                </ScrollFadeIn>
              </CardContent>
            </Card>
          </ScrollFadeIn>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <ScrollFadeIn delay={0.2}>
            <Card>
              <CardHeader>
                <CardTitle>Redes Sociales</CardTitle>
                <CardDescription>Enlaces a tus perfiles en redes sociales</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScrollStaggeredChildren className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ScrollStaggerChild>
                    <div className="space-y-2">
                      <Label htmlFor="facebook">Facebook</Label>
                      <Input
                        id="facebook"
                        value={businessInfo.social_media?.facebook || ""}
                        onChange={(e) => updateSocialMedia("facebook", e.target.value)}
                        placeholder="https://facebook.com/miempresa"
                      />
                    </div>
                  </ScrollStaggerChild>
                  <ScrollStaggerChild>
                    <div className="space-y-2">
                      <Label htmlFor="instagram">Instagram</Label>
                      <Input
                        id="instagram"
                        value={businessInfo.social_media?.instagram || ""}
                        onChange={(e) => updateSocialMedia("instagram", e.target.value)}
                        placeholder="https://instagram.com/miempresa"
                      />
                    </div>
                  </ScrollStaggerChild>
                  <ScrollStaggerChild>
                    <div className="space-y-2">
                      <Label htmlFor="twitter">Twitter</Label>
                      <Input
                        id="twitter"
                        value={businessInfo.social_media?.twitter || ""}
                        onChange={(e) => updateSocialMedia("twitter", e.target.value)}
                        placeholder="https://twitter.com/miempresa"
                      />
                    </div>
                  </ScrollStaggerChild>
                  <ScrollStaggerChild>
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp Business</Label>
                      <Input
                        id="whatsapp"
                        value={businessInfo.social_media?.whatsapp || ""}
                        onChange={(e) => updateSocialMedia("whatsapp", e.target.value)}
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                  </ScrollStaggerChild>
                </ScrollStaggeredChildren>
              </CardContent>
            </Card>
          </ScrollFadeIn>
        </TabsContent>
        </Tabs>
      </ScrollSlideUp>

      <ScrollFadeIn delay={0.4}>
        <div className="flex justify-end">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button onClick={saveBusinessInfo} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Guardando..." : "Guardar Información"}
            </Button>
          </motion.div>
        </div>
      </ScrollFadeIn>
    </div>
  )
}
