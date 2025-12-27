import { createClient } from "@/lib/supabase/server"
import { ArrowLeft, CreditCard, Download, DollarSign } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Link from "next/link"

export default async function AdminPaymentsPage() {
  const supabase = await createClient()

  // Get start of current month for filtering
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const startOfMonthStr = startOfMonth.toISOString()

  // Fetch users
  const { data: users } = await supabase
    .from("user_profiles")
    .select("*")
    .order("created_at", { ascending: false })

  // Fetch usage logs for this month (mass messages)
  // Assuming 'mass_message' is the type for bulk sending
  const { data: usageLogs } = await supabase
    .from("usage_logs")
    .select("*")
    .gte("created_at", startOfMonthStr)

  // Calculate costs per user
  const userCosts = users?.map(user => {
    // Filter logs for this user
    const userLogs = usageLogs?.filter(log => log.user_id === user.id) || []
    
    // Calculate mass messages count
    // Assuming 'amount' in usage_logs represents the number of messages sent in that batch
    // If 'amount' is cost, we'd sum it directly. Based on prompt "abonar 0,10usd por envio", 
    // we assume we count messages. Let's assume 'amount' is quantity.
    const massMessagesCount = userLogs
      .filter(log => log.type === 'mass_message')
      .reduce((acc, log) => acc + (Number(log.amount) || 0), 0)

    const massMessagesCost = massMessagesCount * 0.10

    // Plan cost
    const isTrial = user.plan_type === 'trial' || user.plan_type === 'free'
    const planCost = isTrial ? 0 : 69.00

    return {
      ...user,
      massMessagesCount,
      massMessagesCost,
      planCost,
      totalDue: planCost + massMessagesCost
    }
  }) || []

  // Calculate totals for the dashboard
  const totalRevenue = userCosts.reduce((acc, user) => acc + user.totalDue, 0)
  const totalMassMessages = userCosts.reduce((acc, user) => acc + user.massMessagesCount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/admin">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pagos y Facturación</h2>
          <p className="text-muted-foreground">Periodo actual: {startOfMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Estimados</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Total a facturar este mes
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensajes Masivos</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMassMessages}</div>
            <p className="text-xs text-muted-foreground">
              Enviados este mes
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalle por Usuario</CardTitle>
          <CardDescription>
            Desglose de costos por plan y consumo de mensajes ($0.10/msg).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Plan Actual</TableHead>
                <TableHead className="text-right">Costo Plan</TableHead>
                <TableHead className="text-right">Msj. Masivos</TableHead>
                <TableHead className="text-right">Costo Uso</TableHead>
                <TableHead className="text-right">Total a Pagar</TableHead>
                <TableHead className="text-right">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userCosts.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="font-medium">{user.business_name || "Sin nombre"}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.plan_type === 'trial' ? 'secondary' : 'default'}>
                      {user.plan_type === 'trial' ? 'Prueba Gratis' : 'Pro ($69)'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    ${user.planCost.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {user.massMessagesCount}
                  </TableCell>
                  <TableCell className="text-right">
                    ${user.massMessagesCost.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    ${user.totalDue.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={user.subscription_status === 'active' ? 'outline' : 'destructive'}>
                      {user.subscription_status === 'active' ? 'Al día' : 'Pendiente'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {userCosts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No hay datos de facturación disponibles.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
