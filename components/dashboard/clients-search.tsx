"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface ClientsSearchProps {
  placeholder?: string
  defaultValue?: string
}

export function ClientsSearch({ 
  placeholder = "Buscar por nombre, email o teléfono...",
  defaultValue = ""
}: ClientsSearchProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(defaultValue)

  // Sync with URL changes (e.g. back button)
  useEffect(() => {
    const urlSearch = searchParams.get("search") || ""
    if (searchTerm !== urlSearch) {
      setSearchTerm(urlSearch)
    }
  }, [searchParams])

  // Debounce search
  useEffect(() => {
    const currentSearch = searchParams.get("search") || ""
    if (searchTerm === currentSearch) return

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      
      // Reset to first page when searching
      params.delete("page")
      
      if (searchTerm) {
        params.set("search", searchTerm)
      } else {
        params.delete("search")
      }

      router.replace(`${pathname}?${params.toString()}`)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, router, pathname, searchParams])

  return (
    <div className="relative flex-1">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-8"
      />
    </div>
  )
}