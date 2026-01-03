"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, Clock, Users, Phone, Eye, MoreHorizontal, Edit, Trash, Tag, Filter, X } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { DashboardPagination } from "./dashboard-pagination"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Reservation {
  id: string
  customer_name: string
  customer_phone: string
  reservation_date: string
  reservation_time: string
  party_size: number
  status: string
  table_number?: string
  special_requests?: string
  tags?: string[]
  conversation?: {
    platform?: string
  }
}

interface ReservasClientProps {
  reservations: Reservation[]
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }
}

export function ReservasClient({ reservations, pagination }: ReservasClientProps) {
  const supabase = createClient()
  const router = useRouter()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // Extract unique tags from all reservations
  const allTags = Array.from(new Set(reservations.flatMap(r => r.tags || []))).sort()

  // Filter reservations based on selected tags
  const filteredReservations = reservations.filter(reservation => {
    if (selectedTags.length === 0) return true
    if (!reservation.tags) return false
    // Check if reservation has ALL selected tags (Intersection)
    // Or ANY? User said "ir agregando... y ir viendolas". Usually filters are additive (AND) for refinement.
    // Let's assume AND for now. If I select "Dinner" and "VIP", I want Dinner AND VIP.
    return selectedTags.every(tag => reservation.tags?.includes(tag))
  })

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const handleDelete = (id: string) => {
    toast("¿Estás seguro de eliminar esta reserva?", {
      description: "Esta acción no se puede deshacer.",
      action: {
        label: "Eliminar",
        onClick: () => performDelete(id),
      },
    })
  }

  const performDelete = async (id: string) => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("reservations")
        .delete()
        .eq("id", id)

      if (error) throw error

      toast.success("Reserva eliminada", {
        description: "La reserva ha sido eliminada correctamente.",
      })
      router.refresh()
    } catch (error) {
      console.error("Error deleting reservation:", error)
      toast.error("Error", {
        description: "No se pudo eliminar la reserva.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (reservation: Reservation) => {
    setSelectedReservation(reservation)
    setIsEditDialogOpen(true)
  }

  const handleUpdateReservation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedReservation) return

    setIsLoading(true)
    const formData = new FormData(e.currentTarget)
    
    try {
      const { error } = await supabase
        .from("reservations")
        .update({
          reservation_date: formData.get("date"),
          reservation_time: formData.get("time"),
          party_size: formData.get("party_size"),
          status: formData.get("status"),
          table_number: formData.get("table_number"),
        })
        .eq("id", selectedReservation.id)

      if (error) throw error

      toast.success("Reserva actualizada", {
        description: "Los cambios se han guardado correctamente.",
      })
      setIsEditDialogOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error updating reservation:", error)
      toast.error("Error", {
        description: "No se pudo actualizar la reserva.",
      })
    } finally {
      setIsLoading(false)
    }
  }

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
            <div className="text-2xl font-bold">{pagination.totalItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {reservations.filter(r => r.status === 'confirmed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {reservations.filter(r => r.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {reservations.filter(r => r.status === 'cancelled').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Reservations Table */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Todas las Reservas
              </CardTitle>
              <CardDescription>
                Historial completo de reservas
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {selectedTags.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedTags([])}
                  className="h-8 px-2 text-muted-foreground"
                >
                  Limpiar filtros
                  <X className="ml-2 h-4 w-4" />
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 border-dashed">
                    <Filter className="mr-2 h-4 w-4" />
                    Etiquetas
                    {selectedTags.length > 0 && (
                      <Badge variant="secondary" className="ml-2 rounded-sm px-1 font-normal lg:hidden">
                        {selectedTags.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuLabel>Filtrar por etiquetas</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {allTags.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No hay etiquetas disponibles
                    </div>
                  ) : (
                    allTags.map((tag) => (
                      <DropdownMenuCheckboxItem
                        key={tag}
                        checked={selectedTags.includes(tag)}
                        onCheckedChange={() => toggleTag(tag)}
                      >
                        {tag}
                      </DropdownMenuCheckboxItem>
                    ))
                  )}
                  {selectedTags.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={() => setSelectedTags([])}
                        className="justify-center text-center"
                      >
                        Limpiar filtros
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedTags.map(tag => (
                <Badge key={tag} variant="secondary" className="rounded-sm px-1 font-normal">
                  {tag}
                  <button
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onClick={() => toggleTag(tag)}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {filteredReservations.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {reservations.length === 0 
                  ? "No hay reservas registradas" 
                  : "No se encontraron reservas con los filtros seleccionados"}
              </p>
            </div>
          ) : (
            <>
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
                  {filteredReservations.map((reservation) => (
                    <TableRow key={reservation.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{reservation.customer_name}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {reservation.customer_phone}
                          </p>
                          {reservation.tags && reservation.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {reservation.tags.map((tag, i) => (
                                <Badge key={i} variant="outline" className="text-[10px] px-1 py-0 h-4 bg-blue-50 text-blue-700 border-blue-200">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {format(new Date(reservation.reservation_date + 'T12:00:00'), 'dd MMM yyyy', { locale: es })}
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
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
                                    <p>{format(new Date(reservation.reservation_date + 'T12:00:00'), 'dd MMMM yyyy', { locale: es })}</p>
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
                                {reservation.tags && reservation.tags.length > 0 && (
                                  <div>
                                    <Label>Etiquetas</Label>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {reservation.tags.map((tag, i) => (
                                        <Badge key={i} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>

                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleEdit(reservation)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDelete(reservation.id)} className="text-red-600">
                                <Trash className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-4 border-t">
                <DashboardPagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.totalItems}
                  itemsPerPage={pagination.limit}
                  entityName={{ singular: "reserva", plural: "reservas" }}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Reserva</DialogTitle>
            <DialogDescription>
              Modifica los detalles de la reserva.
            </DialogDescription>
          </DialogHeader>
          {selectedReservation && (
            <form onSubmit={handleUpdateReservation} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Fecha</Label>
                  <Input 
                    id="date" 
                    name="date" 
                    type="date" 
                    defaultValue={selectedReservation.reservation_date} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Hora</Label>
                  <Input 
                    id="time" 
                    name="time" 
                    type="time" 
                    defaultValue={selectedReservation.reservation_time} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="party_size">Personas</Label>
                  <Input 
                    id="party_size" 
                    name="party_size" 
                    type="number" 
                    min="1"
                    defaultValue={selectedReservation.party_size} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select name="status" defaultValue={selectedReservation.status}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="confirmed">Confirmada</SelectItem>
                      <SelectItem value="completed">Completada</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="table_number">Número de Mesa</Label>
                <Input 
                  id="table_number" 
                  name="table_number" 
                  placeholder="Ej: Mesa 5"
                  defaultValue={selectedReservation.table_number || ''} 
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Guardando..." : "Guardar cambios"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
