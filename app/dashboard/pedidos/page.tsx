import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PedidosClient } from "@/components/dashboard/pedidos-client"

interface PedidosPageProps {
  searchParams: {
    page?: string
  }
}

export default async function PedidosPage({ searchParams }: PedidosPageProps) {
  const supabase = await createClient()
  
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/login")
  }

  // Parse pagination parameters
  const page = parseInt(searchParams.page || "1")
  const limit = 10 // Pedidos por página
  const offset = (page - 1) * limit

  // Check if user has any bot with "take_orders" feature enabled
  const { data: allBots } = await supabase
    .from("bots")
    .select("id, name, features")
    .eq("user_id", data.user.id)

  // Filter bots that have the take_orders feature in JavaScript
  const botsWithOrders = allBots?.filter(bot => 
    bot.features && Array.isArray(bot.features) && bot.features.includes("take_orders")
  ) || []

  if (!botsWithOrders || botsWithOrders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Función no habilitada</h2>
          <p className="text-muted-foreground mb-4">
            Para gestionar pedidos y productos, necesitas tener al menos un bot con la función "Tomar pedidos" habilitada.
          </p>
          <p className="text-sm text-muted-foreground">
            Ve a la sección "Bots" y edita o crea un bot habilitando la función "Tomar pedidos".
          </p>
        </div>
      </div>
    )
  }

  // Fetch orders for the user with pagination
  const { data: orders, count } = await supabase
    .from("orders")
    .select(`
      *,
      client:client_id(name, phone),
      conversation:conversation_id(platform)
    `, { count: "exact" })
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  // Calculate pagination info
  const totalItems = count || 0
  const totalPages = Math.ceil(totalItems / limit)

  // Fetch products for the user
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false })

  // Get unique categories
  const categories = [...new Set(products?.map(p => p.category).filter(Boolean))] as string[]

  // Fetch delivery settings
  const { data: deliverySettings } = await supabase
    .from("delivery_settings")
    .select("*")
    .eq("user_id", data.user.id)
    .single()

  return (
    <PedidosClient 
      initialOrders={orders || []}
      initialProducts={products || []}
      initialCategories={categories}
      deliverySettings={deliverySettings || undefined}
      pagination={{
        page,
        limit,
        totalItems,
        totalPages,
      }}
    />
  )
}