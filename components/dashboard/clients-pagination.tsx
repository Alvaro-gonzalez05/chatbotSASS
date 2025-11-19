"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight 
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ClientsPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}

export function ClientsPagination({ 
  currentPage, 
  totalPages, 
  totalItems, 
  itemsPerPage 
}: ClientsPaginationProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Create URL with page parameter while preserving other params
  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (page === 1) {
      params.delete("page")
    } else {
      params.set("page", page.toString())
    }
    return `${pathname}?${params.toString()}`
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  // Don't show pagination if there's only one page or less
  if (totalPages <= 1) {
    return (
      <div className="flex items-center justify-between px-2 py-4">
        <div className="text-sm text-muted-foreground">
          {totalItems === 0 ? "No hay clientes" : `Mostrando ${totalItems} ${totalItems === 1 ? "cliente" : "clientes"}`}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between px-2 py-4 border-t">
      <div className="text-sm text-muted-foreground">
        Mostrando {startItem} - {endItem} de {totalItems} clientes
      </div>
      
      <div className="flex items-center space-x-2">
        {/* First page */}
        <Button
          variant="outline"
          size="sm"
          asChild
          disabled={currentPage === 1}
        >
          <Link 
            href={createPageUrl(1)} 
            className={cn(currentPage === 1 && "pointer-events-none opacity-50")}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Link>
        </Button>

        {/* Previous page */}
        <Button
          variant="outline"
          size="sm"
          asChild
          disabled={currentPage === 1}
        >
          <Link 
            href={createPageUrl(currentPage - 1)} 
            className={cn(currentPage === 1 && "pointer-events-none opacity-50")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>

        {/* Page info */}
        <span className="text-sm text-muted-foreground px-2">
          Página {currentPage} de {totalPages}
        </span>

        {/* Next page */}
        <Button
          variant="outline"
          size="sm"
          asChild
          disabled={currentPage === totalPages}
        >
          <Link 
            href={createPageUrl(currentPage + 1)} 
            className={cn(currentPage === totalPages && "pointer-events-none opacity-50")}
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>

        {/* Last page */}
        <Button
          variant="outline"
          size="sm"
          asChild
          disabled={currentPage === totalPages}
        >
          <Link 
            href={createPageUrl(totalPages)} 
            className={cn(currentPage === totalPages && "pointer-events-none opacity-50")}
          >
            <ChevronsRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}