import { BusinessInfo } from "@/components/dashboard/business-info"

export default function NegocioPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Información del Negocio</h1>
        <p className="text-muted-foreground">Configura la información de tu negocio para personalizar tus bots</p>
      </div>
      <BusinessInfo />
    </div>
  )
}
