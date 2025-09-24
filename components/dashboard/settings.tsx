"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { User, Bell, CreditCard, Shield, LogOut, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { ScrollFadeIn, ScrollSlideUp, ScrollStaggeredChildren, ScrollStaggerChild } from "@/components/ui/scroll-animations"
import { motion } from "framer-motion"

interface UserProfile {
  id: string
  email: string
  business_name: string
  created_at: string
}

interface NotificationSettings {
  email_notifications: boolean
  push_notifications: boolean
  marketing_emails: boolean
  bot_alerts: boolean
}

export function Settings() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_notifications: true,
    push_notifications: true,
    marketing_emails: false,
    bot_alerts: true,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase.from("user_profiles").select("*").eq("id", user.id).single()

      if (error && error.code !== "PGRST116") throw error

      setProfile({
        id: user.id,
        email: user.email || "",
        business_name: data?.business_name || "Mi Negocio",
        created_at: user.created_at,
      })
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast.error("Error al cargar el perfil", {
        description: "No se pudo cargar la información del perfil de usuario.",
        duration: 4000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateNotificationSetting = (key: keyof NotificationSettings, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: value }))
  }

  const saveSettings = async () => {
    try {
      setIsSaving(true)
      // Here you would save notification settings to the database
      toast.success("Configuración guardada", {
        description: "Tus preferencias de notificaciones han sido actualizadas correctamente.",
        duration: 4000,
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Error al guardar configuración", {
        description: "No se pudieron guardar las preferencias de notificaciones. Inténtalo de nuevo.",
        duration: 4000,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
      toast.error("Error al cerrar sesión", {
        description: "No se pudo cerrar la sesión correctamente. Inténtalo de nuevo.",
        duration: 4000,
      })
    }
  }

  if (isLoading) {
    return <div>Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <ScrollSlideUp>
        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="account">Cuenta</TabsTrigger>
            <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
            <TabsTrigger value="billing">Facturación</TabsTrigger>
            <TabsTrigger value="security">Seguridad</TabsTrigger>
          </TabsList>

        <TabsContent value="account" className="space-y-6">
          <ScrollFadeIn delay={0.2}>
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información de la Cuenta
              </CardTitle>
              <CardDescription>Administra tu información personal y de negocio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={profile?.email || ""} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business_name">Nombre del Negocio</Label>
                  <Input
                    id="business_name"
                    value={profile?.business_name || ""}
                    onChange={(e) => setProfile((prev) => (prev ? { ...prev, business_name: e.target.value } : null))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="text-sm font-medium">Miembro desde</p>
                  <p className="text-sm text-muted-foreground">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "N/A"}
                  </p>
                </div>
                <Badge variant="secondary">Plan Gratuito</Badge>
              </div>
            </CardContent>
            </Card>
          </ScrollFadeIn>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <ScrollFadeIn delay={0.2}>
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Preferencias de Notificaciones
              </CardTitle>
              <CardDescription>Configura cómo y cuándo quieres recibir notificaciones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones por Email</Label>
                    <p className="text-sm text-muted-foreground">Recibe actualizaciones importantes por correo</p>
                  </div>
                  <Switch
                    checked={notifications.email_notifications}
                    onCheckedChange={(checked) => updateNotificationSetting("email_notifications", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones Push</Label>
                    <p className="text-sm text-muted-foreground">Recibe notificaciones en tiempo real</p>
                  </div>
                  <Switch
                    checked={notifications.push_notifications}
                    onCheckedChange={(checked) => updateNotificationSetting("push_notifications", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Emails de Marketing</Label>
                    <p className="text-sm text-muted-foreground">Recibe consejos y novedades del producto</p>
                  </div>
                  <Switch
                    checked={notifications.marketing_emails}
                    onCheckedChange={(checked) => updateNotificationSetting("marketing_emails", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Alertas de Bot</Label>
                    <p className="text-sm text-muted-foreground">Notificaciones sobre el estado de tus bots</p>
                  </div>
                  <Switch
                    checked={notifications.bot_alerts}
                    onCheckedChange={(checked) => updateNotificationSetting("bot_alerts", checked)}
                  />
                </div>
              </div>

              <Button onClick={saveSettings} disabled={isSaving}>
                {isSaving ? "Guardando..." : "Guardar Preferencias"}
              </Button>
            </CardContent>
            </Card>
          </ScrollFadeIn>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Facturación y Suscripción
              </CardTitle>
              <CardDescription>Administra tu plan y métodos de pago</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Plan Actual</h3>
                  <p className="text-sm text-muted-foreground">Plan Gratuito - 0 clientes</p>
                </div>
                <Badge variant="outline">Gratuito</Badge>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Próxima Facturación</h4>
                <p className="text-sm text-muted-foreground">
                  No tienes facturación programada. Actualiza tu plan para acceder a más funciones.
                </p>
              </div>

              <Button className="w-full">Actualizar Plan</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Seguridad
              </CardTitle>
              <CardDescription>Administra la seguridad de tu cuenta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Cambiar Contraseña</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Actualiza tu contraseña regularmente para mantener tu cuenta segura
                  </p>
                  <Button variant="outline">Cambiar Contraseña</Button>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Cerrar Sesión</h4>
                  <p className="text-sm text-muted-foreground mb-4">Cierra sesión en todos los dispositivos</p>
                  <Button variant="outline" onClick={signOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar Sesión
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2 text-destructive">Zona de Peligro</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Eliminar tu cuenta es permanente y no se puede deshacer
                  </p>
                  <Button variant="destructive" disabled>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar Cuenta
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      </ScrollSlideUp>
    </div>
  )
}
