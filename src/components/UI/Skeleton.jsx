export default function Skeleton({ className = '', lines = 1 }) {
  if (lines === 1) {
    return (
      <div className={`animate-pulse bg-gray-200 rounded ${className}`} aria-hidden="true">
        <span className="sr-only">Loading...</span>
      </div>
    )
  }

  return (
    <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-gray-200 rounded ${className}`}
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-white shadow rounded-lg p-6 space-y-4">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}

export function SkeletonList({ count = 5 }) {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {Array.from({ length: count }).map((_, i) => (
          <li key={i} className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
