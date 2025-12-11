"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { motion } from "framer-motion"

interface ClientCreationDialogProps {
  isOpen: boolean
  onClose: () => void
  onClientCreated?: () => void
  userId: string
}

export function ClientCreationDialog({ isOpen, onClose, onClientCreated, userId }: ClientCreationDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    instagram: "",
    instagram_username: "",
    birthday: "",
    points: 0,
  })

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      instagram: "",
      instagram_username: "",
      birthday: "",
      points: 0,
    })
  }

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Prepare data with default name if empty
    const clientData = {
      ...formData,
      birthday: formData.birthday ? formData.birthday : null,
      name: formData.name.trim() || "Cliente sin nombre",
      user_id: userId,
      total_purchases: 0,
    }

    try {
      const { error } = await supabase
        .from("clients")
        .insert([clientData])
        .select()
        .single()

      if (error) throw error

      toast.success("Cliente añadido exitosamente", {
        description: `${formData.name} ha sido añadido a tu lista de clientes.`,
        duration: 4000,
      })

      resetForm()
      if (onClientCreated) onClientCreated()
      onClose()
    } catch (error) {
      toast.error("Error al añadir cliente", {
        description: "No se pudo añadir el cliente. Inténtalo de nuevo.",
        duration: 4000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Añadir Nuevo Cliente</DialogTitle>
          <DialogDescription>
            Completa la información del cliente. Los campos marcados son opcionales.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAddClient}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Opcional"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                placeholder="@usuario"
              />
              <p className="text-xs text-muted-foreground">
                Para clientes de Instagram, el username se obtiene automáticamente
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="birthday">Cumpleaños</Label>
              <Input
                id="birthday"
                type="date"
                value={formData.birthday}
                onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="points">Puntos Iniciales</Label>
              <Input
                id="points"
                type="number"
                min="0"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: Number.parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Añadiendo..." : "Añadir Cliente"}
              </Button>
            </motion.div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
