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

interface DashboardPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  entityName?: {
    singular: string
    plural: string
  }
}

export function DashboardPagination({ 
  currentPage, 
  totalPages, 
  totalItems, 
  itemsPerPage,
  entityName = { singular: "elemento", plural: "elementos" }
}: DashboardPaginationProps) {
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
          {totalItems === 0 ? `No hay ${entityName.plural}` : `Mostrando ${totalItems} ${totalItems === 1 ? entityName.singular : entityName.plural}`}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="text-sm text-muted-foreground">
        Mostrando {startItem}-{endItem} de {totalItems} {entityName.plural}
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={currentPage <= 1}
          asChild={currentPage > 1}
        >
          {currentPage > 1 ? (
            <Link href={createPageUrl(1)}>
              <ChevronsLeft className="h-4 w-4" />
              <span className="sr-only">Primera página</span>
            </Link>
          ) : (
            <span>
              <ChevronsLeft className="h-4 w-4" />
              <span className="sr-only">Primera página</span>
            </span>
          )}
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={currentPage <= 1}
          asChild={currentPage > 1}
        >
          {currentPage > 1 ? (
            <Link href={createPageUrl(currentPage - 1)}>
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Página anterior</span>
            </Link>
          ) : (
            <span>
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Página anterior</span>
            </span>
          )}
        </Button>
        <div className="text-sm font-medium">
          Página {currentPage} de {totalPages}
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={currentPage >= totalPages}
          asChild={currentPage < totalPages}
        >
          {currentPage < totalPages ? (
            <Link href={createPageUrl(currentPage + 1)}>
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Página siguiente</span>
            </Link>
          ) : (
            <span>
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Página siguiente</span>
            </span>
          )}
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={currentPage >= totalPages}
          asChild={currentPage < totalPages}
        >
          {currentPage < totalPages ? (
            <Link href={createPageUrl(totalPages)}>
              <ChevronsRight className="h-4 w-4" />
              <span className="sr-only">Última página</span>
            </Link>
          ) : (
            <span>
              <ChevronsRight className="h-4 w-4" />
              <span className="sr-only">Última página</span>
            </span>
          )}
        </Button>
      </div>
    </div>
  )
}
