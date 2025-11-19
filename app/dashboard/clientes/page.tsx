import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ClientsManagement } from "@/components/dashboard/clients-management"
import { PageTransition } from "@/components/ui/page-transition"

interface ClientsPageProps {
  searchParams: {
    page?: string
    search?: string
  }
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/login")
  }

  // Parse pagination parameters
  const page = parseInt(searchParams.page || "1")
  const limit = 10 // Clientes por página
  const search = searchParams.search || ""
  const offset = (page - 1) * limit

  // Build query with search filter
  let query = supabase
    .from("clients")
    .select("*, instagram_username", { count: "exact" })
    .eq("user_id", data.user.id)

  // Apply search filter if provided
  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  // Get clients with pagination
  const { data: clients, count, error: clientsError } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (clientsError) {
    console.error("Error fetching clients:", clientsError)
  }

  // Calculate pagination info
  const totalItems = count || 0
  const totalPages = Math.ceil(totalItems / limit)

  const paginationInfo = {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  }

  return (
    <PageTransition>
      <ClientsManagement 
        initialClients={clients || []} 
        userId={data.user.id}
        pagination={paginationInfo}
        searchTerm={search}
      />
    </PageTransition>
  )
}
