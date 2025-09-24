"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { Plus, Gift, Percent, DollarSign, Star, Users, MoreHorizontal, Trash2, Play, Pause, Award } from "lucide-react"
import { ScrollFadeIn, ScrollSlideUp, ScrollStaggeredChildren, ScrollStaggerChild, ScrollScaleIn } from "@/components/ui/scroll-animations"
import { motion } from "framer-motion"

interface Promotion {
  id: string
  name: string
  description?: string
  discount_type: "percentage" | "fixed_amount" | "points"
  discount_value: number
  points_required: number
  min_purchase_amount: number
  max_uses?: number
  current_uses: number
  start_date: string
  end_date: string
  is_active: boolean
  created_at: string
}

interface Reward {
  id: string
  name: string
  description?: string
  points_cost: number
  reward_type: "discount" | "free_item" | "service" | "gift"
  reward_value?: string
  stock_quantity?: number
  current_stock?: number
  is_active: boolean
  created_at: string
}

interface PromotionsManagementProps {
  initialPromotions: Promotion[]
  initialRewards: Reward[]
  userId: string
}

const discountTypeLabels = {
  percentage: "Porcentaje",
  fixed_amount: "Cantidad Fija",
  points: "Puntos",
}

const rewardTypeLabels = {
  discount: "Descuento",
  free_item: "Producto Gratis",
  service: "Servicio",
  gift: "Regalo",
}

export function PromotionsManagement({ initialPromotions, initialRewards, userId }: PromotionsManagementProps) {
  const [promotions, setPromotions] = useState<Promotion[]>(initialPromotions)
  const [rewards, setRewards] = useState<Reward[]>(initialRewards)
  const [isPromotionDialogOpen, setIsPromotionDialogOpen] = useState(false)
  const [isRewardDialogOpen, setIsRewardDialogOpen] = useState(false)
  const [isEditPromotionDialogOpen, setIsEditPromotionDialogOpen] = useState(false)
  const [isEditRewardDialogOpen, setIsEditRewardDialogOpen] = useState(false)
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null)
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  // Form states
  const [promotionForm, setPromotionForm] = useState({
    name: "",
    description: "",
    discount_type: "" as "percentage" | "fixed_amount" | "points" | "",
    discount_value: 0,
    points_required: 0,
    min_purchase_amount: 0,
    max_uses: "",
    start_date: "",
    end_date: "",
    is_active: true,
  })

  const [rewardForm, setRewardForm] = useState({
    name: "",
    description: "",
    points_cost: 0,
    reward_type: "" as "discount" | "free_item" | "service" | "gift" | "",
    reward_value: "",
    stock_quantity: "",
    is_active: true,
  })

  const resetPromotionForm = () => {
    setPromotionForm({
      name: "",
      description: "",
      discount_type: "",
      discount_value: 0,
      points_required: 0,
      min_purchase_amount: 0,
      max_uses: "",
      start_date: "",
      end_date: "",
      is_active: true,
    })
  }

  const resetRewardForm = () => {
    setRewardForm({
      name: "",
      description: "",
      points_cost: 0,
      reward_type: "",
      reward_value: "",
      stock_quantity: "",
      is_active: true,
    })
  }

  const handleCreatePromotion = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await supabase
        .from("promotions")
        .insert([
          {
            ...promotionForm,
            user_id: userId,
            max_uses: promotionForm.max_uses ? Number.parseInt(promotionForm.max_uses) : null,
            current_uses: 0,
          },
        ])
        .select()
        .single()

      if (error) throw error

      setPromotions([data, ...promotions])
      setIsPromotionDialogOpen(false)
      resetPromotionForm()
      toast.success(`Promoción "${promotionForm.name}" creada`, {
        description: "La promoción ha sido creada exitosamente y está disponible para los clientes.",
        duration: 4000,
      })
    } catch (error) {
      toast.error("Error al crear promoción", {
        description: "No se pudo crear la promoción. Verifica los datos e inténtalo de nuevo.",
        duration: 4000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await supabase
        .from("rewards")
        .insert([
          {
            ...rewardForm,
            user_id: userId,
            stock_quantity: rewardForm.stock_quantity ? Number.parseInt(rewardForm.stock_quantity) : null,
            current_stock: rewardForm.stock_quantity ? Number.parseInt(rewardForm.stock_quantity) : null,
          },
        ])
        .select()
        .single()

      if (error) throw error

      setRewards([data, ...rewards])
      setIsRewardDialogOpen(false)
      resetRewardForm()
      toast.success(`Recompensa "${rewardForm.name}" creada`, {
        description: "La recompensa ha sido creada exitosamente y está disponible en el catálogo.",
        duration: 4000,
      })
    } catch (error) {
      toast.error("Error al crear recompensa", {
        description: "No se pudo crear la recompensa. Verifica los datos e inténtalo de nuevo.",
        duration: 4000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTogglePromotion = async (promotionId: string, isActive: boolean) => {
    try {
      const { error } = await supabase.from("promotions").update({ is_active: isActive }).eq("id", promotionId)

      if (error) throw error

      setPromotions(promotions.map((p) => (p.id === promotionId ? { ...p, is_active: isActive } : p)))
      const promotion = promotions.find(p => p.id === promotionId);
      toast.success(`Promoción ${isActive ? 'activada' : 'desactivada'}`, {
        description: `"${promotion?.name || 'La promoción'}" ha sido ${isActive ? "activada" : "desactivada"} exitosamente.`,
        duration: 4000,
      })
    } catch (error) {
      toast.error("Error al cambiar estado de promoción", {
        description: "No se pudo cambiar el estado de la promoción. Inténtalo de nuevo.",
        duration: 4000,
      })
    }
  }

  const handleToggleReward = async (rewardId: string, isActive: boolean) => {
    try {
      const { error } = await supabase.from("rewards").update({ is_active: isActive }).eq("id", rewardId)

      if (error) throw error

      setRewards(rewards.map((r) => (r.id === rewardId ? { ...r, is_active: isActive } : r)))
      const reward = rewards.find(r => r.id === rewardId);
      toast.success(`Recompensa ${isActive ? 'activada' : 'desactivada'}`, {
        description: `"${reward?.name || 'La recompensa'}" ha sido ${isActive ? "activada" : "desactivada"} exitosamente.`,
        duration: 4000,
      })
    } catch (error) {
      toast.error("Error al cambiar estado de recompensa", {
        description: "No se pudo cambiar el estado de la recompensa. Inténtalo de nuevo.",
        duration: 4000,
      })
    }
  }

  const handleDeletePromotion = async (promotionId: string) => {
    try {
      const { error } = await supabase.from("promotions").delete().eq("id", promotionId)

      if (error) throw error

      setPromotions(promotions.filter((p) => p.id !== promotionId))
      const promotion = promotions.find(p => p.id === promotionId);
      toast.success("Promoción eliminada", {
        description: `"${promotion?.name || 'La promoción'}" ha sido eliminada permanentemente.`,
        duration: 4000,
      })
    } catch (error) {
      toast.error("Error al eliminar promoción", {
        description: "No se pudo eliminar la promoción. Inténtalo de nuevo.",
        duration: 4000,
      })
    }
  }

  const handleDeleteReward = async (rewardId: string) => {
    try {
      const { error } = await supabase.from("rewards").delete().eq("id", rewardId)

      if (error) throw error

      setRewards(rewards.filter((r) => r.id !== rewardId))
      const reward = rewards.find(r => r.id === rewardId);
      toast.success("Recompensa eliminada", {
        description: `"${reward?.name || 'La recompensa'}" ha sido eliminada permanentemente.`,
        duration: 4000,
      })
    } catch (error) {
      toast.error("Error al eliminar recompensa", {
        description: "No se pudo eliminar la recompensa. Inténtalo de nuevo.",
        duration: 4000,
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES")
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
  }

  const isPromotionActive = (promotion: Promotion) => {
    const now = new Date()
    const startDate = new Date(promotion.start_date)
    const endDate = new Date(promotion.end_date)
    return promotion.is_active && now >= startDate && now <= endDate
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <ScrollSlideUp>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Sistema de Puntos y Promociones</h1>
            <p className="text-muted-foreground">Gestiona promociones y recompensas para fidelizar clientes</p>
          </div>
        </div>
      </ScrollSlideUp>

      {/* Stats */}
      <ScrollStaggeredChildren>
        <div className="grid gap-4 md:grid-cols-4">
          <ScrollStaggerChild>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Promociones Activas</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <ScrollScaleIn>
                  <div className="text-2xl font-bold">{promotions.filter((p) => isPromotionActive(p)).length}</div>
                </ScrollScaleIn>
                <p className="text-xs text-muted-foreground">En vigencia</p>
              </CardContent>
            </Card>
          </ScrollStaggerChild>

          <ScrollStaggerChild>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recompensas</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <ScrollScaleIn>
                  <div className="text-2xl font-bold">{rewards.filter((r) => r.is_active).length}</div>
                </ScrollScaleIn>
                <p className="text-xs text-muted-foreground">Disponibles</p>
              </CardContent>
            </Card>
          </ScrollStaggerChild>

          <ScrollStaggerChild>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usos Totales</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <ScrollScaleIn>
                  <div className="text-2xl font-bold">{promotions.reduce((sum, p) => sum + p.current_uses, 0)}</div>
                </ScrollScaleIn>
                <p className="text-xs text-muted-foreground">Promociones usadas</p>
              </CardContent>
            </Card>
          </ScrollStaggerChild>

          <ScrollStaggerChild>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Puntos en Circulación</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <ScrollScaleIn>
                  <div className="text-2xl font-bold">0</div>
                </ScrollScaleIn>
                <p className="text-xs text-muted-foreground">Puntos activos</p>
              </CardContent>
            </Card>
          </ScrollStaggerChild>
        </div>
      </ScrollStaggeredChildren>

      {/* Tabs */}
      <Tabs defaultValue="promotions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="promotions">Promociones</TabsTrigger>
          <TabsTrigger value="rewards">Catálogo de Recompensas</TabsTrigger>
          <TabsTrigger value="settings">Configuración de Puntos</TabsTrigger>
        </TabsList>

        {/* Promotions Tab */}
        <TabsContent value="promotions" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Promociones</h2>
            <Dialog open={isPromotionDialogOpen} onOpenChange={setIsPromotionDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Promoción
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Crear Nueva Promoción</DialogTitle>
                  <DialogDescription>Configura una promoción para atraer y fidelizar clientes</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreatePromotion}>
                  <div className="grid gap-6 py-4">
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="promo-name">Nombre de la Promoción *</Label>
                        <Input
                          id="promo-name"
                          value={promotionForm.name}
                          onChange={(e) => setPromotionForm({ ...promotionForm, name: e.target.value })}
                          placeholder="20% de descuento en toda la tienda"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="promo-description">Descripción</Label>
                        <Textarea
                          id="promo-description"
                          value={promotionForm.description}
                          onChange={(e) => setPromotionForm({ ...promotionForm, description: e.target.value })}
                          placeholder="Describe los términos y condiciones de la promoción"
                          rows={3}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="discount-type">Tipo de Descuento *</Label>
                        <Select
                          value={promotionForm.discount_type}
                          onValueChange={(value: "percentage" | "fixed_amount" | "points") =>
                            setPromotionForm({ ...promotionForm, discount_type: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                            <SelectItem value="fixed_amount">Cantidad Fija (€)</SelectItem>
                            <SelectItem value="points">Puntos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="discount-value">
                          Valor del Descuento *{" "}
                          {promotionForm.discount_type === "percentage"
                            ? "(%)"
                            : promotionForm.discount_type === "fixed_amount"
                              ? "(€)"
                              : "(puntos)"}
                        </Label>
                        <Input
                          id="discount-value"
                          type="number"
                          min="0"
                          step={promotionForm.discount_type === "fixed_amount" ? "0.01" : "1"}
                          value={promotionForm.discount_value}
                          onChange={(e) =>
                            setPromotionForm({
                              ...promotionForm,
                              discount_value: Number.parseFloat(e.target.value) || 0,
                            })
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="points-required">Puntos Requeridos</Label>
                        <Input
                          id="points-required"
                          type="number"
                          min="0"
                          value={promotionForm.points_required}
                          onChange={(e) =>
                            setPromotionForm({
                              ...promotionForm,
                              points_required: Number.parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="min-purchase">Compra Mínima (€)</Label>
                        <Input
                          id="min-purchase"
                          type="number"
                          min="0"
                          step="0.01"
                          value={promotionForm.min_purchase_amount}
                          onChange={(e) =>
                            setPromotionForm({
                              ...promotionForm,
                              min_purchase_amount: Number.parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="max-uses">Máximo de Usos</Label>
                        <Input
                          id="max-uses"
                          type="number"
                          min="1"
                          value={promotionForm.max_uses}
                          onChange={(e) => setPromotionForm({ ...promotionForm, max_uses: e.target.value })}
                          placeholder="Ilimitado"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="start-date">Fecha de Inicio *</Label>
                        <Input
                          id="start-date"
                          type="datetime-local"
                          value={promotionForm.start_date}
                          onChange={(e) => setPromotionForm({ ...promotionForm, start_date: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="end-date">Fecha de Fin *</Label>
                        <Input
                          id="end-date"
                          type="datetime-local"
                          value={promotionForm.end_date}
                          onChange={(e) => setPromotionForm({ ...promotionForm, end_date: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="promo-active"
                        checked={promotionForm.is_active}
                        onCheckedChange={(checked) => setPromotionForm({ ...promotionForm, is_active: checked })}
                      />
                      <Label htmlFor="promo-active">Activar promoción inmediatamente</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsPromotionDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "Creando..." : "Crear Promoción"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {promotions.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Percent className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No tienes promociones aún</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Crea tu primera promoción para atraer y fidelizar clientes
                  </p>
                  <Button onClick={() => setIsPromotionDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear mi primera promoción
                  </Button>
                </CardContent>
              </Card>
            ) : (
              promotions.map((promotion) => (
                <Card key={promotion.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 rounded-md bg-primary/10">
                        {promotion.discount_type === "percentage" ? (
                          <Percent className="h-4 w-4 text-primary" />
                        ) : promotion.discount_type === "fixed_amount" ? (
                          <DollarSign className="h-4 w-4 text-primary" />
                        ) : (
                          <Star className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{promotion.name}</CardTitle>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleTogglePromotion(promotion.id, !promotion.is_active)}>
                          {promotion.is_active ? (
                            <>
                              <Pause className="mr-2 h-4 w-4" />
                              Desactivar
                            </>
                          ) : (
                            <>
                              <Play className="mr-2 h-4 w-4" />
                              Activar
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeletePromotion(promotion.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant={isPromotionActive(promotion) ? "default" : "secondary"}>
                        {isPromotionActive(promotion) ? "Activa" : "Inactiva"}
                      </Badge>
                      <Badge variant="outline">{discountTypeLabels[promotion.discount_type]}</Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Descuento:</span>
                        <span className="ml-2">
                          {promotion.discount_type === "percentage"
                            ? `${promotion.discount_value}%`
                            : promotion.discount_type === "fixed_amount"
                              ? formatCurrency(promotion.discount_value)
                              : `${promotion.discount_value} puntos`}
                        </span>
                      </div>

                      {promotion.points_required > 0 && (
                        <div className="text-sm">
                          <span className="font-medium">Puntos requeridos:</span>
                          <span className="ml-2">{promotion.points_required}</span>
                        </div>
                      )}

                      {promotion.min_purchase_amount > 0 && (
                        <div className="text-sm">
                          <span className="font-medium">Compra mínima:</span>
                          <span className="ml-2">{formatCurrency(promotion.min_purchase_amount)}</span>
                        </div>
                      )}

                      <div className="text-sm">
                        <span className="font-medium">Vigencia:</span>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(promotion.start_date)} - {formatDate(promotion.end_date)}
                        </div>
                      </div>

                      <div className="text-sm">
                        <span className="font-medium">Usos:</span>
                        <span className="ml-2">
                          {promotion.current_uses}
                          {promotion.max_uses ? ` / ${promotion.max_uses}` : " / ∞"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Catálogo de Recompensas</h2>
            <Dialog open={isRewardDialogOpen} onOpenChange={setIsRewardDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Recompensa
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Crear Nueva Recompensa</DialogTitle>
                  <DialogDescription>Añade una recompensa que los clientes puedan canjear con puntos</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateReward}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="reward-name">Nombre de la Recompensa *</Label>
                      <Input
                        id="reward-name"
                        value={rewardForm.name}
                        onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
                        placeholder="Café gratis"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="reward-description">Descripción</Label>
                      <Textarea
                        id="reward-description"
                        value={rewardForm.description}
                        onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
                        placeholder="Describe la recompensa y sus condiciones"
                        rows={2}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="points-cost">Costo en Puntos *</Label>
                      <Input
                        id="points-cost"
                        type="number"
                        min="1"
                        value={rewardForm.points_cost}
                        onChange={(e) =>
                          setRewardForm({ ...rewardForm, points_cost: Number.parseInt(e.target.value) || 0 })
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="reward-type">Tipo de Recompensa *</Label>
                      <Select
                        value={rewardForm.reward_type}
                        onValueChange={(value: "discount" | "free_item" | "service" | "gift") =>
                          setRewardForm({ ...rewardForm, reward_type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="discount">Descuento</SelectItem>
                          <SelectItem value="free_item">Producto Gratis</SelectItem>
                          <SelectItem value="service">Servicio</SelectItem>
                          <SelectItem value="gift">Regalo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="reward-value">Valor/Detalles de la Recompensa</Label>
                      <Input
                        id="reward-value"
                        value={rewardForm.reward_value}
                        onChange={(e) => setRewardForm({ ...rewardForm, reward_value: e.target.value })}
                        placeholder="10% descuento, Café americano, etc."
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="stock">Stock Disponible</Label>
                      <Input
                        id="stock"
                        type="number"
                        min="1"
                        value={rewardForm.stock_quantity}
                        onChange={(e) => setRewardForm({ ...rewardForm, stock_quantity: e.target.value })}
                        placeholder="Ilimitado"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="reward-active"
                        checked={rewardForm.is_active}
                        onCheckedChange={(checked) => setRewardForm({ ...rewardForm, is_active: checked })}
                      />
                      <Label htmlFor="reward-active">Recompensa disponible</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsRewardDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "Creando..." : "Crear Recompensa"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rewards.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Gift className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No tienes recompensas aún</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Crea recompensas que tus clientes puedan canjear con puntos
                  </p>
                  <Button onClick={() => setIsRewardDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear mi primera recompensa
                  </Button>
                </CardContent>
              </Card>
            ) : (
              rewards.map((reward) => (
                <Card key={reward.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 rounded-md bg-primary/10">
                        <Award className="h-4 w-4 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{reward.name}</CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleToggleReward(reward.id, !reward.is_active)}>
                          {reward.is_active ? (
                            <>
                              <Pause className="mr-2 h-4 w-4" />
                              Desactivar
                            </>
                          ) : (
                            <>
                              <Play className="mr-2 h-4 w-4" />
                              Activar
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteReward(reward.id)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant={reward.is_active ? "default" : "secondary"}>
                        {reward.is_active ? "Disponible" : "No disponible"}
                      </Badge>
                      <Badge variant="outline">{rewardTypeLabels[reward.reward_type]}</Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Costo:</span>
                        <span className="ml-2 text-primary font-medium">{reward.points_cost} puntos</span>
                      </div>

                      {reward.reward_value && (
                        <div className="text-sm">
                          <span className="font-medium">Detalles:</span>
                          <span className="ml-2">{reward.reward_value}</span>
                        </div>
                      )}

                      {reward.stock_quantity && (
                        <div className="text-sm">
                          <span className="font-medium">Stock:</span>
                          <span className="ml-2">
                            {reward.current_stock} / {reward.stock_quantity}
                          </span>
                        </div>
                      )}

                      {reward.description && (
                        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                          {reward.description}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración del Sistema de Puntos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="points-per-euro">Puntos por Euro Gastado</Label>
                  <Input id="points-per-euro" type="number" min="1" defaultValue="1" />
                  <p className="text-xs text-muted-foreground">Cuántos puntos gana el cliente por cada euro gastado</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="points-expiry">Caducidad de Puntos (días)</Label>
                  <Input id="points-expiry" type="number" min="30" defaultValue="365" />
                  <p className="text-xs text-muted-foreground">Días hasta que los puntos caduquen</p>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="welcome-points">Puntos de Bienvenida</Label>
                <Input id="welcome-points" type="number" min="0" defaultValue="100" />
                <p className="text-xs text-muted-foreground">Puntos que recibe un cliente al registrarse</p>
              </div>

              <Button>Guardar Configuración</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
