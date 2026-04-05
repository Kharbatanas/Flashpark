export function SpotCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-48 rounded-2xl bg-gray-200" />
      <div className="mt-3 space-y-2">
        <div className="h-4 w-3/4 rounded bg-gray-200" />
        <div className="h-3 w-1/2 rounded bg-gray-200" />
        <div className="h-4 w-1/4 rounded bg-gray-200" />
      </div>
    </div>
  )
}

export function SpotDetailSkeleton() {
  return (
    <div className="animate-pulse mx-auto max-w-6xl px-4 py-8">
      <div className="h-4 w-20 rounded bg-gray-200 mb-6" />
      <div className="grid gap-2 grid-cols-4 grid-rows-2 h-72 rounded-2xl overflow-hidden">
        <div className="col-span-2 row-span-2 bg-gray-200" />
        <div className="bg-gray-200" />
        <div className="bg-gray-200" />
        <div className="bg-gray-200" />
        <div className="bg-gray-200" />
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-8 w-2/3 rounded bg-gray-200" />
          <div className="h-4 w-1/3 rounded bg-gray-200" />
          <div className="h-24 rounded-xl bg-gray-200 mt-6" />
        </div>
        <div className="h-64 rounded-2xl bg-gray-200" />
      </div>
    </div>
  )
}

export function BookingCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5">
      <div className="flex justify-between">
        <div className="space-y-2">
          <div className="h-4 w-40 rounded bg-gray-200" />
          <div className="h-3 w-24 rounded bg-gray-200" />
        </div>
        <div className="h-6 w-16 rounded-full bg-gray-200" />
      </div>
      <div className="mt-4 flex justify-between">
        <div className="h-3 w-32 rounded bg-gray-200" />
        <div className="h-4 w-16 rounded bg-gray-200" />
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="animate-pulse mx-auto max-w-5xl px-4 py-8">
      <div className="h-8 w-48 rounded bg-gray-200 mb-8" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <BookingCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

export function MapSkeleton() {
  return (
    <div className="animate-pulse h-[calc(100vh-4rem)] bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 rounded-full border-4 border-[#0540FF] border-t-transparent animate-spin" />
        <div className="mt-4 h-3 w-32 rounded bg-gray-200 mx-auto" />
      </div>
    </div>
  )
}
