"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Package, Clock, Phone, MapPin, DollarSign } from "lucide-react"
import { ScrollFadeIn, ScrollSlideUp, ScrollStaggeredChildren, ScrollStaggerChild } from "@/components/ui/scroll-animations"
import { motion } from "framer-motion"

interface Order {
  id: string
  client_id?: string
  conversation_id?: string
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  items: Array<{
    product_id: string
    quantity: number
    price: number
    notes?: string
    name?: string
  }>
  total_amount: number
  customer_notes?: string
  delivery_address?: string
  delivery_phone?: string
  scheduled_for?: string
  created_at: string
}

interface Bot {
  id: string
  name: string
  features: string[]
}

interface OrdersManagementProps {
  initialOrders: Order[]
  userId: string
  botsWithOrders: Bot[]
}

export function OrdersManagement({ initialOrders, userId, botsWithOrders }: OrdersManagementProps) {
  const [orders] = useState<Order[]>(initialOrders)
  const supabase = createClient()

  // Check if user has bots with order-taking capability
  if (botsWithOrders.length === 0) {
    return (
      <div className="space-y-6">
        <ScrollSlideUp>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Gestión de Pedidos</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Administra los pedidos de tu negocio</p>
          </div>
        </ScrollSlideUp>

        <ScrollFadeIn delay={0.2}>
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <ShoppingCart className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-base font-medium text-amber-800">Función no habilitada</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    Para gestionar pedidos, necesitas tener al menos un bot con la función "Tomar pedidos" habilitada.
                  </p>
                  <p className="text-xs text-amber-600 mt-2">
                    Ve a la sección "Bots" y edita o crea un bot habilitando la función "Tomar pedidos".
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'preparing':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'ready':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'delivered':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmado'
      case 'preparing':
        return 'Preparando'
      case 'ready':
        return 'Listo'
      case 'delivered':
        return 'Entregado'
      case 'pending':
        return 'Pendiente'
      case 'cancelled':
        return 'Cancelado'
      default:
        return status
    }
  }

  // Group orders by status
  const ordersByStatus = orders.reduce((acc, order) => {
    const status = order.status
    if (!acc[status]) acc[status] = []
    acc[status].push(order)
    return acc
  }, {} as Record<string, Order[]>)

  const statusOrder = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']
  const statuses = statusOrder.filter(status => ordersByStatus[status]?.length > 0)

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <ScrollSlideUp>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Gestión de Pedidos</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Administra los pedidos generados por tus bots
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {orders.length} pedidos • Habilitado en {botsWithOrders.length} bot(s)
            </p>
          </div>
        </ScrollSlideUp>
      </div>

      {/* Orders by Status */}
      <ScrollStaggeredChildren className="space-y-6">
        {orders.length === 0 ? (
          <ScrollStaggerChild>
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No hay pedidos aún</h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Los pedidos realizados a través de tus bots aparecerán aquí automáticamente
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span>Los clientes pueden hacer pedidos chateando con tus bots</span>
                </div>
              </CardContent>
            </Card>
          </ScrollStaggerChild>
        ) : (
          statuses.map((status) => (
            <ScrollStaggerChild key={status}>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">{getStatusLabel(status)}</h2>
                  <Badge variant="secondary">{ordersByStatus[status].length}</Badge>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {ordersByStatus[status]
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((order) => (
                    <motion.div
                      key={order.id}
                      whileHover={{ scale: 1.02, y: -2 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <CardTitle className="text-base flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-green-600" />
                                ${order.total_amount.toFixed(2)}
                              </CardTitle>
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {order.items.reduce((acc, item) => acc + item.quantity, 0)} producto{order.items.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={getStatusColor(order.status)}
                            >
                              {getStatusLabel(order.status)}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2">
                            {/* Items */}
                            <div className="space-y-1">
                              <h4 className="text-sm font-medium">Productos:</h4>
                              {order.items.map((item, index) => (
                                <div key={index} className="text-sm text-muted-foreground flex justify-between">
                                  <span>{item.quantity}x {item.name || `Producto ${item.product_id}`}</span>
                                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>

                            {/* Delivery Info */}
                            {order.delivery_phone && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                <span>{order.delivery_phone}</span>
                              </div>
                            )}

                            {order.delivery_address && (
                              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3 mt-0.5" />
                                <span className="text-xs">{order.delivery_address}</span>
                              </div>
                            )}

                            {/* Customer Notes */}
                            {order.customer_notes && (
                              <div className="text-sm">
                                <strong>Notas:</strong> {order.customer_notes}
                              </div>
                            )}

                            {/* Scheduled */}
                            {order.scheduled_for && (
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-3 w-3" />
                                <span>Programado: {formatDate(order.scheduled_for)}</span>
                              </div>
                            )}

                            <div className="text-xs text-muted-foreground pt-2">
                              Pedido realizado: {formatDate(order.created_at)}
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
      {orders.length > 0 && (
        <ScrollFadeIn delay={0.4}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Total Pedidos</p>
                    <p className="text-lg font-semibold">{orders.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Ingresos Total</p>
                    <p className="text-lg font-semibold">
                      ${orders.reduce((acc, order) => acc + order.total_amount, 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Pendientes</p>
                    <p className="text-lg font-semibold">
                      {orders.filter(order => order.status === 'pending').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Entregados</p>
                    <p className="text-lg font-semibold">
                      {orders.filter(order => order.status === 'delivered').length}
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