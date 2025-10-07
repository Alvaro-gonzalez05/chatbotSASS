"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Users, Phone, MessageSquare } from "lucide-react"
import { ScrollFadeIn, ScrollSlideUp, ScrollStaggeredChildren, ScrollStaggerChild } from "@/components/ui/scroll-animations"
import { motion } from "framer-motion"

interface Reservation {
  id: string
  customer_name: string
  customer_phone: string
  reservation_date: string
  reservation_time: string
  party_size: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  special_requests?: string
  table_number?: string
  created_at: string
}

interface Bot {
  id: string
  name: string
  features: string[]
}

interface ReservationsManagementProps {
  initialReservations: Reservation[]
  userId: string
  botsWithReservations: Bot[]
}

export function ReservationsManagement({ initialReservations, userId, botsWithReservations }: ReservationsManagementProps) {
  const [reservations] = useState<Reservation[]>(initialReservations)
  const supabase = createClient()

  // Check if user has bots with reservation-taking capability
  if (botsWithReservations.length === 0) {
    return (
      <div className="space-y-6">
        <ScrollSlideUp>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Gestión de Reservas</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Administra las reservas de tu negocio</p>
          </div>
        </ScrollSlideUp>

        <ScrollFadeIn delay={0.2}>
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-base font-medium text-amber-800">Función no habilitada</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    Para gestionar reservas, necesitas tener al menos un bot con la función "Tomar reservas" habilitada.
                  </p>
                  <p className="text-xs text-amber-600 mt-2">
                    Ve a la sección "Bots" y edita o crea un bot habilitando la función "Tomar reservas".
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </ScrollFadeIn>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5) // HH:MM
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada'
      case 'pending':
        return 'Pendiente'
      case 'cancelled':
        return 'Cancelada'
      case 'completed':
        return 'Completada'
      default:
        return status
    }
  }

  // Group reservations by date
  const reservationsByDate = reservations.reduce((acc, reservation) => {
    const date = reservation.reservation_date
    if (!acc[date]) acc[date] = []
    acc[date].push(reservation)
    return acc
  }, {} as Record<string, Reservation[]>)

  const dates = Object.keys(reservationsByDate).sort()

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <ScrollSlideUp>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Gestión de Reservas</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Administra las reservas generadas por tus bots
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {reservations.length} reservas • Habilitado en {botsWithReservations.length} bot(s)
            </p>
          </div>
        </ScrollSlideUp>
      </div>

      {/* Reservations by Date */}
      <ScrollStaggeredChildren className="space-y-6">
        {reservations.length === 0 ? (
          <ScrollStaggerChild>
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No hay reservas aún</h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Las reservas generadas por tus bots aparecerán aquí automáticamente
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span>Los clientes pueden hacer reservas chateando con tus bots</span>
                </div>
              </CardContent>
            </Card>
          </ScrollStaggerChild>
        ) : (
          dates.map((date) => (
            <ScrollStaggerChild key={date}>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">{formatDate(date)}</h2>
                  <Badge variant="secondary">{reservationsByDate[date].length}</Badge>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {reservationsByDate[date]
                    .sort((a, b) => a.reservation_time.localeCompare(b.reservation_time))
                    .map((reservation) => (
                    <motion.div
                      key={reservation.id}
                      whileHover={{ scale: 1.02, y: -2 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <CardTitle className="text-base flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                {formatTime(reservation.reservation_time)}
                              </CardTitle>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {reservation.party_size} persona{reservation.party_size !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={getStatusColor(reservation.status)}
                            >
                              {getStatusLabel(reservation.status)}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{reservation.customer_name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span>{reservation.customer_phone}</span>
                            </div>
                            {reservation.table_number && (
                              <div className="text-sm">
                                <strong>Mesa:</strong> {reservation.table_number}
                              </div>
                            )}
                            {reservation.special_requests && (
                              <div className="text-sm">
                                <strong>Solicitudes:</strong> {reservation.special_requests}
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground pt-2">
                              Creada el {formatDate(reservation.created_at)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </ScrollStaggerChild>
          ))
        )}
      </ScrollStaggeredChildren>

      {/* Stats Cards */}
      {reservations.length > 0 && (
        <ScrollFadeIn delay={0.4}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Total Reservas</p>
                    <p className="text-lg font-semibold">{reservations.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Confirmadas</p>
                    <p className="text-lg font-semibold">
                      {reservations.filter(r => r.status === 'confirmed').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-yellow-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Pendientes</p>
                    <p className="text-lg font-semibold">
                      {reservations.filter(r => r.status === 'pending').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Personas Total</p>
                    <p className="text-lg font-semibold">
                      {reservations.reduce((acc, r) => acc + r.party_size, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollFadeIn>
      )}
    </div>
  )
}