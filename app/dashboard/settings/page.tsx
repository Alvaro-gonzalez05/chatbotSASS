import { SettingsView } from "@/components/dashboard/settings-view"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración y Facturación</h1>
        <p className="text-muted-foreground">Gestiona tu plan, métodos de pago y claves de API</p>
      </div>
      <SettingsView />
    </div>
  )
}
