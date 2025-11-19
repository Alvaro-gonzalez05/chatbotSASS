"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ShoppingCart, Package, Edit, Trash2, Eye, Settings } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { ProductForm } from "./product-form"
import { ProductEditForm } from "./product-edit-form"
import { toast } from "sonner"
import { DashboardPagination } from "./dashboard-pagination"

interface Order {
  id: string
  status: string
  total_amount: number
  delivery_phone: string
  customer_notes?: string
  delivery_address?: string
  order_type?: string
  items: any[]
  created_at: string
  client?: {
    name?: string
    phone?: string
  }
  conversation?: {
    platform?: string
  }
}

interface Product {
  id: string
  name: string
  description?: string
  price: number
  category?: string
  is_available: boolean
  image_url?: string
  created_at: string
}

interface DeliverySettings {
  id?: string
  pickup_enabled: boolean
  delivery_enabled: boolean
  pickup_instructions: string
  delivery_instructions: string
  delivery_fee: number
  minimum_order_delivery: number
  delivery_time_estimate: string
  pickup_time_estimate: string
}

interface PedidosClientProps {
  initialOrders: Order[]
  initialProducts: Product[]
  initialCategories: string[]
  deliverySettings?: DeliverySettings
  pagination?: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }
}

export function PedidosClient({ 
  initialOrders, 
  initialProducts, 
  initialCategories,
  deliverySettings: initialDeliverySettings,
  pagination
}: PedidosClientProps) {
  const [orders] = useState<Order[]>(initialOrders)
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [categories, setCategories] = useState<string[]>(initialCategories)
  const [isLoading, setIsLoading] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>(
    initialDeliverySettings || {
      pickup_enabled: true,
      delivery_enabled: false,
      pickup_instructions: 'Retiro en el local',
      delivery_instructions: 'Envío a domicilio',
      delivery_fee: 0,
      minimum_order_delivery: 0,
      delivery_time_estimate: '30-45 minutos',
      pickup_time_estimate: '15-20 minutos',
    }
  )

  const refreshProducts = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/products")
      const data = await response.json()
      
      if (response.ok) {
        setProducts(data.products)
        setCategories(data.categories)
      }
    } catch (error) {
      console.error("Error refreshing products:", error)
      toast.error("Error al cargar productos")
    } finally {
      setIsLoading(false)
    }
  }

  const saveDeliverySettings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/delivery-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(deliverySettings),
      })

      if (response.ok) {
        toast.success("Configuración de modalidades guardada")
      } else {
        toast.error("Error al guardar configuración")
      }
    } catch (error) {
      console.error("Error saving delivery settings:", error)
      toast.error("Error al guardar configuración")
    } finally {
      setIsLoading(false)
    }
  }

  const getOrderTypeLabel = (orderType?: string) => {
    switch (orderType) {
      case 'pickup':
        return 'Retiro en el local'
      case 'delivery':
        return 'Envío a domicilio'
      default:
        return 'Retiro en el local'
    }
  }

  const getOrderTypeBadgeColor = (orderType?: string) => {
    switch (orderType) {
      case 'pickup':
        return 'bg-blue-600 hover:bg-blue-700'
      case 'delivery':
        return 'bg-green-600 hover:bg-green-700'
      default:
        return 'bg-blue-600 hover:bg-blue-700'
    }
  }

  const deleteProduct = async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast.success("Producto eliminado")
        refreshProducts()
      } else {
        throw new Error("Error al eliminar producto")
      }
    } catch (error) {
      console.error("Error deleting product:", error)
      toast.error("Error al eliminar producto")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500'
      case 'confirmed': return 'bg-blue-500'
      case 'preparing': return 'bg-orange-500'
      case 'ready': return 'bg-green-500'
      case 'delivered': return 'bg-gray-500'
      case 'cancelled': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente'
      case 'confirmed': return 'Confirmado'
      case 'preparing': return 'Preparando'
      case 'ready': return 'Listo'
      case 'delivered': return 'Entregado'
      case 'cancelled': return 'Cancelado'
      default: return status
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-2 mb-6">
        <ShoppingCart className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Pedidos y Productos</h1>
      </div>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Pedidos
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Productos
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuración
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Pedidos Recientes</h2>
              <p className="text-sm text-muted-foreground">
                Gestiona todos los pedidos realizados por tus clientes
              </p>
            </div>
          </div>

          {!orders || orders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No hay pedidos aún</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Los pedidos realizados por tus clientes aparecerán aquí automáticamente
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estado</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Modalidad</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Plataforma</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Badge className={`${getStatusColor(order.status)} text-white`}>
                          {getStatusText(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {order.client?.name || order.delivery_phone || 'Cliente Anónimo'}
                          </p>
                          <p className="text-sm text-muted-foreground">{order.delivery_phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getOrderTypeBadgeColor(order.order_type)} text-white`}>
                          {getOrderTypeLabel(order.order_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${order.total_amount}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {order.conversation?.platform || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(order.created_at), { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Detalles del Pedido</DialogTitle>
                              <DialogDescription>
                                Información completa del pedido #{order.id.slice(0, 8)}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Cliente</Label>
                                  <p>{order.client?.name || order.delivery_phone || 'Cliente Anónimo'}</p>
                                </div>
                                <div>
                                  <Label>Teléfono</Label>
                                  <p>{order.delivery_phone}</p>
                                </div>
                                <div>
                                  <Label>Estado</Label>
                                  <Badge className={`${getStatusColor(order.status)} text-white`}>
                                    {getStatusText(order.status)}
                                  </Badge>
                                </div>
                                <div>
                                  <Label>Modalidad</Label>
                                  <Badge className={`${getOrderTypeBadgeColor(order.order_type)} text-white`}>
                                    {getOrderTypeLabel(order.order_type)}
                                  </Badge>
                                </div>
                                <div>
                                  <Label>Total</Label>
                                  <p className="font-medium">${order.total_amount}</p>
                                </div>
                              </div>
                              {order.delivery_address && (
                                <div>
                                  <Label>Dirección de entrega</Label>
                                  <p>{order.delivery_address}</p>
                                </div>
                              )}
                              {order.customer_notes && (
                                <div>
                                  <Label>Notas del cliente</Label>
                                  <p>{order.customer_notes}</p>
                                </div>
                              )}
                              <div>
                                <Label>Productos</Label>
                                <div className="mt-2 space-y-2">
                                  {Array.isArray(order.items) && order.items.map((item: any, index: number) => (
                                    <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                                      <span>{item.product_name || `Producto ${index + 1}`}</span>
                                      <span>x{item.quantity} - ${item.price}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {pagination && (
                <div className="p-4 border-t">
                  <DashboardPagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    totalItems={pagination.totalItems}
                    itemsPerPage={pagination.limit}
                    entityName={{ singular: "pedido", plural: "pedidos" }}
                  />
                </div>
              )}
            </Card>
          )}
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Catálogo de Productos</h2>
              <p className="text-sm text-muted-foreground">
                Gestiona los productos que tus clientes pueden pedir
              </p>
            </div>
            <ProductForm 
              onProductCreated={refreshProducts}
              existingCategories={categories}
            />
          </div>

          {!products || products.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No hay productos en tu catálogo</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Agrega productos para que tus clientes puedan hacer pedidos
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <Card key={product.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        {product.category && (
                          <Badge variant="secondary" className="mt-1">
                            {product.category}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setEditingProduct(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {product.image_url && (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-full h-32 object-cover rounded-md mb-3"
                      />
                    )}
                    {product.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {product.description}
                      </p>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold">${product.price}</span>
                      <Badge variant={product.is_available ? "default" : "secondary"}>
                        {product.is_available ? "Disponible" : "No disponible"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Configuración de Modalidades</h2>
              <p className="text-sm text-muted-foreground">
                Configura las modalidades de entrega disponibles para tus clientes
              </p>
            </div>
            <Button 
              onClick={saveDeliverySettings}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Guardar Configuración
            </Button>
          </div>

          <div className="grid gap-6">
            {/* Modalidades disponibles */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Modalidades Disponibles</CardTitle>
                <CardDescription>
                  Selecciona qué modalidades de entrega quieres ofrecer a tus clientes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pickup"
                    checked={deliverySettings.pickup_enabled}
                    onCheckedChange={(checked) =>
                      setDeliverySettings(prev => ({ ...prev, pickup_enabled: !!checked }))
                    }
                  />
                  <Label htmlFor="pickup" className="font-medium">Retiro en local</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="delivery"
                    checked={deliverySettings.delivery_enabled}
                    onCheckedChange={(checked) =>
                      setDeliverySettings(prev => ({ ...prev, delivery_enabled: !!checked }))
                    }
                  />
                  <Label htmlFor="delivery" className="font-medium">Envío a domicilio</Label>
                </div>
              </CardContent>
            </Card>

            {/* Configuración de delivery */}
            {deliverySettings.delivery_enabled && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Configuración de Delivery</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="delivery_fee">Costo de delivery ($)</Label>
                      <Input
                        id="delivery_fee"
                        type="number"
                        step="0.01"
                        value={deliverySettings.delivery_fee}
                        onChange={(e) =>
                          setDeliverySettings(prev => ({ 
                            ...prev, 
                            delivery_fee: parseFloat(e.target.value) || 0 
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minimum_order">Pedido mínimo para delivery ($)</Label>
                      <Input
                        id="minimum_order"
                        type="number"
                        step="0.01"
                        value={deliverySettings.minimum_order_delivery}
                        onChange={(e) =>
                          setDeliverySettings(prev => ({ 
                            ...prev, 
                            minimum_order_delivery: parseFloat(e.target.value) || 0 
                          }))
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Instrucciones personalizadas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Instrucciones Personalizadas</CardTitle>
                <CardDescription>
                  Personaliza los mensajes que el bot enviará para cada modalidad
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {deliverySettings.pickup_enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="pickup_instructions">Mensaje para retiro en local</Label>
                    <Textarea
                      id="pickup_instructions"
                      value={deliverySettings.pickup_instructions}
                      onChange={(e) =>
                        setDeliverySettings(prev => ({ 
                          ...prev, 
                          pickup_instructions: e.target.value 
                        }))
                      }
                      placeholder="Ej: Te esperamos en nuestro local en..."
                    />
                  </div>
                )}

                {deliverySettings.delivery_enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="delivery_instructions">Mensaje para delivery</Label>
                    <Textarea
                      id="delivery_instructions"
                      value={deliverySettings.delivery_instructions}
                      onChange={(e) =>
                        setDeliverySettings(prev => ({ 
                          ...prev, 
                          delivery_instructions: e.target.value 
                        }))
                      }
                      placeholder="Ej: Realizamos delivery en la zona..."
                    />
                  </div>
                )}


              </CardContent>
            </Card>

            {/* Tiempos estimados */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tiempos Estimados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {deliverySettings.pickup_enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="pickup_time">Tiempo estimado para retiro</Label>
                    <Input
                      id="pickup_time"
                      value={deliverySettings.pickup_time_estimate}
                      onChange={(e) =>
                        setDeliverySettings(prev => ({ 
                          ...prev, 
                          pickup_time_estimate: e.target.value 
                        }))
                      }
                      placeholder="Ej: 15-20 minutos"
                    />
                  </div>
                )}

                {deliverySettings.delivery_enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="delivery_time">Tiempo estimado para delivery</Label>
                    <Input
                      id="delivery_time"
                      value={deliverySettings.delivery_time_estimate}
                      onChange={(e) =>
                        setDeliverySettings(prev => ({ 
                          ...prev, 
                          delivery_time_estimate: e.target.value 
                        }))
                      }
                      placeholder="Ej: 30-45 minutos"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Product Dialog */}
      {editingProduct && (
        <ProductEditForm
          product={editingProduct}
          onProductUpdated={refreshProducts}
          onClose={() => setEditingProduct(null)}
          existingCategories={categories}
          isOpen={!!editingProduct}
        />
      )}
    </div>
  )
}