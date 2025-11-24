import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <Skeleton className="h-8 w-[200px]" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-9 w-[100px]" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-[120px] rounded-xl" />
        <Skeleton className="h-[120px] rounded-xl" />
        <Skeleton className="h-[120px] rounded-xl" />
        <Skeleton className="h-[120px] rounded-xl" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Skeleton className="col-span-4 h-[400px] rounded-xl" />
        <Skeleton className="col-span-3 h-[400px] rounded-xl" />
      </div>
    </div>
  )
}
