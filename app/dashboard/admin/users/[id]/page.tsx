import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { 
  User, 
  Bot, 
  CreditCard, 
  Activity, 
  Calendar, 
  MessageSquare, 
  Settings,
  Shield,
  Ban,
  CheckCircle
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { BusinessDetailsCard } from "@/components/dashboard/admin/business-details-card"
import { UserSuspendButton } from "@/components/dashboard/admin/user-suspend-button"

export default async function AdminUserDetailsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  
  // Fetch user profile
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", params.id)
    .single()

  if (profileError || !profile) {
    notFound()
  }

  // Fetch user's bots
  const { data: bots } = await supabase
    .from("bots")
    .select("*")
    .eq("user_id", params.id)
    .order("created_at", { ascending: false })

  // Fetch usage logs (recent activity)
  const { data: usageLogs } = await supabase
    .from("usage_logs")
    .select("*")
    .eq("user_id", params.id)
    .order("created_at", { ascending: false })
    .limit(10)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/admin/users" className="text-muted-foreground hover:text-foreground">
              Usuarios
            </Link>
            <span className="text-muted-foreground">/</span>
            <h2 className="text-3xl font-bold tracking-tight">{profile.business_name || "Usuario"}</h2>
          </div>
          <p className="text-muted-foreground mt-1">ID: {profile.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/admin/users/${params.id}/chat`}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Ver Chat
            </Link>
          </Button>
          <UserSuspendButton 
            userId={profile.id}
            currentStatus={profile.subscription_status || 'trialing'}
            userName={profile.business_name || 'Usuario'}
          />
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plan Actual</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{profile.plan_type || "Free"}</div>
            <div className="flex items-center mt-1">
              <div className={`w-2 h-2 rounded-full mr-2 ${profile.subscription_status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <p className="text-xs text-muted-foreground capitalize">
                {profile.subscription_status || "Trial"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bots Creados</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bots?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Límite: {profile.max_bots || 1}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo de Uso</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${profile.usage_balance || "0.00"}</div>
            <p className="text-xs text-muted-foreground">
              Crédito disponible
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Tabs (1 col wide) */}
        <div className="space-y-4">
          <Tabs defaultValue="bots" className="space-y-4">
            <TabsList className="w-full grid grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              <TabsTrigger value="bots">Bots</TabsTrigger>
              <TabsTrigger value="billing">Fact.</TabsTrigger>
              <TabsTrigger value="activity">Act.</TabsTrigger>
              <TabsTrigger value="details">Det.</TabsTrigger>
            </TabsList>

            {/* Bots Tab */}
            <TabsContent value="bots" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Bots Activos</h3>
                {bots?.map((bot) => (
                  <Card key={bot.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{bot.name}</CardTitle>
                        <Badge variant={bot.is_active ? "default" : "secondary"}>
                          {bot.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                      <CardDescription>{bot.platform || "WhatsApp"}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground mb-4">
                        Modelo: {bot.model || "Gemini Flash"}
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/admin/users/${params.id}/bots`}>
                            <Settings className="h-4 w-4 mr-1" />
                            Config
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(!bots || bots.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                    Este usuario no tiene bots creados.
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Suscripción</CardTitle>
                  <CardDescription>Detalles del plan</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-muted-foreground">ID Cliente Stripe</span>
                      <p className="font-mono text-sm truncate">{profile.stripe_customer_id || "No registrado"}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-muted-foreground">ID Suscripción</span>
                      <p className="font-mono text-sm truncate">{profile.stripe_subscription_id || "Sin suscripción"}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-muted-foreground">Método de Pago</span>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span className="text-sm">
                          {profile.pm_brand ? `${profile.pm_brand} •••• ${profile.pm_last_4}` : "No hay tarjeta"}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-muted-foreground">Fin de Prueba</span>
                      <p className="text-sm">
                        {profile.trial_ends_at 
                          ? new Date(profile.trial_ends_at).toLocaleDateString() 
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Registro de Uso</CardTitle>
                  <CardDescription>Últimas actividades</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {usageLogs?.map((log) => (
                      <div key={log.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none truncate max-w-[150px]">{log.description || log.type}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="font-medium text-sm">
                          {log.amount > 0 ? `+$${log.amount}` : `-$${Math.abs(log.amount)}`}
                        </div>
                      </div>
                    ))}
                    {(!usageLogs || usageLogs.length === 0) && (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        No hay registros.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Detalles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-muted-foreground">Nombre del Negocio</span>
                      <p className="text-sm">{profile.business_name}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-muted-foreground">Email</span>
                      <p className="text-sm truncate">{profile.email || "No disponible"}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-muted-foreground">Teléfono</span>
                      <p className="text-sm">{profile.business_info?.phone || "No disponible"}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-muted-foreground">Ubicación</span>
                      <p className="text-sm">{profile.location || "No especificada"}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-muted-foreground">Rol</span>
                      <div>
                        <Badge variant={profile.role === 'admin' ? 'destructive' : 'outline'}>
                          {profile.role || 'user'}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-muted-foreground">API Key (BYOK)</span>
                      <p className="font-mono text-xs truncate">
                        {profile.gemini_api_key ? "••••••••" + profile.gemini_api_key.slice(-4) : "No configurada"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column: Business Info (Sticky, 2 cols wide) */}
        <div className="lg:col-span-2 h-full">
          <div className="sticky top-6">
            <BusinessDetailsCard profile={profile} />
          </div>
        </div>
      </div>
    </div>
  )
}
