import { BotTesting } from "@/components/dashboard/bot-testing"

export default function PruebasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pruebas de Bot</h1>
        <p className="text-muted-foreground">Prueba y valida el comportamiento de tus chatbots antes de activarlos</p>
      </div>
      <BotTesting />
    </div>
  )
}
