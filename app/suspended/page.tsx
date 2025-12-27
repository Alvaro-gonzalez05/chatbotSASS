import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"

export default function SuspendedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md text-center border-red-200 dark:border-red-900 shadow-lg">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
              <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-500" />
            </div>
          </div>
          <CardTitle className="text-2xl text-red-600 dark:text-red-500">Cuenta Suspendida</CardTitle>
          <CardDescription className="text-lg mt-2">
            Tu cuenta ha sido suspendida temporalmente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Hemos detectado actividad inusual o falta de pago en tu cuenta. 
            Por favor, contacta con soporte para resolver esta situación y restaurar el acceso a tus servicios.
          </p>
          
          <div className="pt-4 flex flex-col gap-2">
            <Button asChild variant="default" className="w-full">
              <Link href="mailto:soporte@ucobot.com">
                Contactar Soporte
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">
                Volver al Inicio
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
