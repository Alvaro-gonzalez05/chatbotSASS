import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "lucide-react"
import { ReservasClient } from "@/components/dashboard/reservas-client"

interface ReservasPageProps {
  searchParams: {
    page?: string
  }
}

export default async function ReservasPage({ searchParams }: ReservasPageProps) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/login")
  }

  // Parse pagination parameters
  const page = parseInt(searchParams.page || "1")
  const limit = 10 // Reservas por página
  const offset = (page - 1) * limit

  // Check if user has any bot with "take_reservations" feature enabled
  const { data: allBots } = await supabase
    .from("bots")
    .select("id, name, features")
    .eq("user_id", data.user.id)

  // Filter bots that have the take_reservations feature in JavaScript
  const botsWithReservations = allBots?.filter(bot => 
    bot.features && Array.isArray(bot.features) && bot.features.includes("take_reservations")
  ) || []

  if (!botsWithReservations || botsWithReservations.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle>Función no habilitada</CardTitle>
            <CardDescription>
              Para gestionar reservas, necesitas tener al menos un bot con la función "Tomar reservas" habilitada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              Ve a la sección "Bots" y edita o crea un bot habilitando la función "Tomar reservas".
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fetch reservations for the user with pagination
  const { data: reservations, count } = await supabase
    .from("reservations")
    .select(`
      *,
      client:client_id(name, phone),
      conversation:conversation_id(platform)
    `, { count: "exact" })
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false }) // Order by creation date (newest first)
    .range(offset, offset + limit - 1)

  // Calculate pagination info
  const totalItems = count || 0
  const totalPages = Math.ceil(totalItems / limit)

  return (
    <ReservasClient 
      reservations={reservations || []}
      pagination={{
        page,
        limit,
        totalItems,
        totalPages,
      }}
    />
  )
}