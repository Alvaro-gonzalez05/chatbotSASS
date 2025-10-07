import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, Clock, Users, Phone, Eye } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default async function ReservasPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/login")
  }

  // Check if user has any bot with "take_reservations" feature enabled
  const { data: allBots } = await supabase
    .from("bots")
    .select("id, name, features")
    .eq("user_id", data.user.id)

  // Filter bots that have the take_reservations feature in JavaScript
  const botsWithReservations = allBots?.filter(bot => 
    bot.features && Array.isArray(bot.features) && bot.features.includes("take_reservations")
  ) || []

  if (!botsWithReservations || botsWithReservations.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle>Función no habilitada</CardTitle>
            <CardDescription>
              Para gestionar reservas, necesitas tener al menos un bot con la función "Tomar reservas" habilitada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              Ve a la sección "Bots" y edita o crea un bot habilitando la función "Tomar reservas".
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fetch reservations for the user
  const { data: reservations } = await supabase
    .from("reservations")
    .select(`
      *,
      client:client_id(name, phone),
      conversation:conversation_id(platform)
    `)
    .eq("user_id", data.user.id)
    .order("reservation_date", { ascending: true })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500'
      case 'confirmed': return 'bg-green-500'
      case 'cancelled': return 'bg-red-500'
      case 'completed': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente'
      case 'confirmed': return 'Confirmada'
      case 'cancelled': return 'Cancelada'
      case 'completed': return 'Completada'
      default: return status
    }
  }

  // Separate upcoming and past reservations
  const today = new Date()
  const upcomingReservations = reservations?.filter(r => 
    new Date(`${r.reservation_date}T${r.reservation_time}`) >= today
  ) || []
  const pastReservations = reservations?.filter(r => 
    new Date(`${r.reservation_date}T${r.reservation_time}`) < today
  ) || []

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Gestión de Reservas</h1>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Reservas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reservations?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Próximas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{upcomingReservations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {reservations?.filter(r => r.status === 'confirmed').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {reservations?.filter(r => r.status === 'pending').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Reservations */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Próximas Reservas
          </CardTitle>
          <CardDescription>
            Reservas programadas para los próximos días
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingReservations.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay reservas próximas</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha y Hora</TableHead>
                  <TableHead>Personas</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Mesa</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingReservations.map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{reservation.customer_name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {reservation.customer_phone}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {format(new Date(reservation.reservation_date), 'dd MMM yyyy', { locale: es })}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {reservation.reservation_time}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {reservation.party_size}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(reservation.status)} text-white`}>
                        {getStatusText(reservation.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {reservation.table_number || 'No asignada'}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Detalles de la Reserva</DialogTitle>
                            <DialogDescription>
                              Información completa de la reserva
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Cliente</Label>
                                <p>{reservation.customer_name}</p>
                              </div>
                              <div>
                                <Label>Teléfono</Label>
                                <p>{reservation.customer_phone}</p>
                              </div>
                              <div>
                                <Label>Fecha</Label>
                                <p>{format(new Date(reservation.reservation_date), 'dd MMMM yyyy', { locale: es })}</p>
                              </div>
                              <div>
                                <Label>Hora</Label>
                                <p>{reservation.reservation_time}</p>
                              </div>
                              <div>
                                <Label>Número de personas</Label>
                                <p>{reservation.party_size}</p>
                              </div>
                              <div>
                                <Label>Estado</Label>
                                <Badge className={`${getStatusColor(reservation.status)} text-white`}>
                                  {getStatusText(reservation.status)}
                                </Badge>
                              </div>
                            </div>
                            {reservation.table_number && (
                              <div>
                                <Label>Mesa asignada</Label>
                                <p>{reservation.table_number}</p>
                              </div>
                            )}
                            {reservation.special_requests && (
                              <div>
                                <Label>Solicitudes especiales</Label>
                                <p>{reservation.special_requests}</p>
                              </div>
                            )}
                            <div>
                              <Label>Plataforma</Label>
                              <Badge variant="outline">
                                {reservation.conversation?.platform || 'N/A'}
                              </Badge>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Past Reservations */}
      {pastReservations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Historial de Reservas
            </CardTitle>
            <CardDescription>
              Reservas anteriores y completadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha y Hora</TableHead>
                  <TableHead>Personas</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pastReservations.slice(0, 10).map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{reservation.customer_name}</p>
                        <p className="text-sm text-muted-foreground">{reservation.customer_phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {format(new Date(reservation.reservation_date), 'dd MMM yyyy', { locale: es })}
                        </p>
                        <p className="text-sm text-muted-foreground">{reservation.reservation_time}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {reservation.party_size}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(reservation.status)} text-white`}>
                        {getStatusText(reservation.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Detalles de la Reserva</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Cliente</Label>
                                <p>{reservation.customer_name}</p>
                              </div>
                              <div>
                                <Label>Teléfono</Label>
                                <p>{reservation.customer_phone}</p>
                              </div>
                              <div>
                                <Label>Fecha</Label>
                                <p>{format(new Date(reservation.reservation_date), 'dd MMMM yyyy', { locale: es })}</p>
                              </div>
                              <div>
                                <Label>Hora</Label>
                                <p>{reservation.reservation_time}</p>
                              </div>
                            </div>
                            {reservation.special_requests && (
                              <div>
                                <Label>Solicitudes especiales</Label>
                                <p>{reservation.special_requests}</p>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}