"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, CreditCard, Key, Shield, Check, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export function SettingsView() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [apiKey, setApiKey] = useState("")
  
  // Mock Card State
  const [cardNumber, setCardNumber] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvc, setCardCvc] = useState("")
  const [isAddCardOpen, setIsAddCardOpen] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (error) throw error

      setProfile(data)
      setApiKey(data.gemini_api_key || "")
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast.error("Error al cargar la configuración")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveApiKey = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ gemini_api_key: apiKey })
        .eq("id", profile.id)

      if (error) throw error

      toast.success("Clave API guardada correctamente")
      fetchProfile()
    } catch (error) {
      toast.error("Error al guardar la clave API")
    } finally {
      setSaving(false)
    }
  }

  const handleAddCard = async () => {
    // SIMULATION: In a real app, this would use Stripe.js to tokenize the card
    // and send the token to your backend.
    setSaving(true)
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    try {
      // We just save the last 4 digits for display purposes in this demo
      const last4 = cardNumber.slice(-4) || "4242"
      
      const { error } = await supabase
        .from("user_profiles")
        .update({ 
          pm_last_4: last4,
          pm_brand: "Visa", // Simulated
          stripe_customer_id: "cus_simulated_" + Math.random().toString(36).substring(7)
        })
        .eq("id", profile.id)

      if (error) throw error

      toast.success("Tarjeta agregada correctamente")
      setIsAddCardOpen(false)
      setCardNumber("")
      setCardExpiry("")
      setCardCvc("")
      fetchProfile()
    } catch (error) {
      toast.error("Error al agregar la tarjeta")
    } finally {
      setSaving(false)
    }
  }

  const handleUpgradePro = async () => {
    if (!profile.pm_last_4) {
      toast.error("Por favor agrega una tarjeta primero")
      return
    }

    setSaving(true)
    // Simulate API call to Stripe Subscription
    await new Promise(resolve => setTimeout(resolve, 2000))

    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ 
          plan_type: "pro",
          subscription_status: "active"
        })
        .eq("id", profile.id)

      if (error) throw error

      toast.success("¡Bienvenido al Plan PRO!")
      fetchProfile()
    } catch (error) {
      toast.error("Error al procesar la suscripción")
    } finally {
      setSaving(false)
    }
  }

  const handleAddBalance = async (amount: number) => {
    if (!profile.pm_last_4) {
      toast.error("Por favor agrega una tarjeta primero")
      return
    }

    setSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))

    try {
      const currentBalance = Number(profile.usage_balance) || 0
      const { error } = await supabase
        .from("user_profiles")
        .update({ 
          usage_balance: currentBalance + amount
        })
        .eq("id", profile.id)

      if (error) throw error

      toast.success(`Se agregaron $${amount} USD a tu saldo`)
      fetchProfile()
    } catch (error) {
      toast.error("Error al recargar saldo")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <Tabs defaultValue="billing" className="space-y-4">
      <TabsList>
        <TabsTrigger value="billing">Facturación y Plan</TabsTrigger>
        <TabsTrigger value="api">Configuración de IA</TabsTrigger>
      </TabsList>

      {/* BILLING TAB */}
      <TabsContent value="billing" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          
          {/* PLAN CARD */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tu Plan Actual</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{profile?.plan_type === 'pro' ? 'PRO Plan' : 'Trial / Free'}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {profile?.plan_type === 'pro' 
                  ? "Acceso ilimitado a IA y herramientas." 
                  : "Modo de prueba. Usa tu propia API Key."}
              </p>
              
              {profile?.plan_type !== 'pro' && (
                <div className="mt-4">
                  <Button onClick={handleUpgradePro} disabled={saving} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Mejorar a PRO ($69/mes)"}
                  </Button>
                </div>
              )}
              
              {profile?.plan_type === 'pro' && (
                <div className="mt-4 flex items-center text-green-600 text-sm font-medium">
                  <Check className="mr-2 h-4 w-4" /> Suscripción Activa
                </div>
              )}
            </CardContent>
          </Card>

          {/* BALANCE CARD */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Mensajes</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${Number(profile?.usage_balance || 0).toFixed(2)} USD</div>
              <p className="text-xs text-muted-foreground mt-1">
                Costo por mensaje masivo: $0.10 USD
              </p>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleAddBalance(10)} disabled={saving}>+$10</Button>
                <Button variant="outline" size="sm" onClick={() => handleAddBalance(50)} disabled={saving}>+$50</Button>
                <Button variant="outline" size="sm" onClick={() => handleAddBalance(100)} disabled={saving}>+$100</Button>
              </div>
            </CardContent>
          </Card>

          {/* PAYMENT METHOD CARD */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Método de Pago</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {profile?.pm_last_4 ? (
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gray-100 rounded-md">
                    <CreditCard className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">{profile.pm_brand} terminada en {profile.pm_last_4}</p>
                    <p className="text-xs text-muted-foreground">Método predeterminado</p>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No tienes ninguna tarjeta guardada.
                </div>
              )}

              <div className="mt-4">
                <Dialog open={isAddCardOpen} onOpenChange={setIsAddCardOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      {profile?.pm_last_4 ? "Cambiar Tarjeta" : "Agregar Tarjeta"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Agregar Método de Pago</DialogTitle>
                      <DialogDescription>
                        Ingresa los detalles de tu tarjeta. (Simulación Segura)
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="number">Número de Tarjeta</Label>
                        <Input 
                          id="number" 
                          placeholder="0000 0000 0000 0000" 
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="expiry">Expiración</Label>
                          <Input 
                            id="expiry" 
                            placeholder="MM/YY" 
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="cvc">CVC</Label>
                          <Input 
                            id="cvc" 
                            placeholder="123" 
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddCard} disabled={saving}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Guardar Tarjeta"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* API KEY TAB */}
      <TabsContent value="api">
        <Card>
          <CardHeader>
            <CardTitle>Configuración de IA (Bring Your Own Key)</CardTitle>
            <CardDescription>
              Si estás en el plan gratuito/trial, necesitas usar tu propia clave de API de Google Gemini.
              En el plan PRO, nosotros cubrimos el costo de la IA.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">Google Gemini API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <Button onClick={handleSaveApiKey} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Puedes obtener tu clave gratuita en <a href="https://aistudio.google.com/app/apikey" target="_blank" className="underline text-blue-600">Google AI Studio</a>.
              </p>
            </div>

            {profile?.plan_type === 'pro' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <Check className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900">¡Estás cubierto!</h4>
                  <p className="text-sm text-green-700">
                    Como eres usuario PRO, el sistema usará automáticamente nuestra infraestructura de IA ilimitada. 
                    Tu clave personal solo se usará como respaldo.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
