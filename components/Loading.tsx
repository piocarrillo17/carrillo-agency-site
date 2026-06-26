'use client'
// Consistent page skeleton — keeps the layout stable while data loads.
export default function Loading() {
  return (
    <div className="min-h-screen app-bg md:pl-60">
      {/* Sidebar placeholder */}
      <div className="hidden md:flex fixed left-0 top-0 bottom-0 w-60 sidebar-bg border-r border-slate-800/60 flex-col p-4 gap-3">
        <div className="skeleton h-14 w-28 mx-auto rounded-xl mb-1" />
        <div className="skeleton h-12 w-full rounded-xl mt-1" />
        <div className="space-y-1.5 mt-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="skeleton h-8 w-full rounded-lg" />
          ))}
        </div>
      </div>

      {/* Content placeholder */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="skeleton h-8 w-56 mb-2 rounded-lg" />
        <div className="skeleton h-4 w-36 mb-8 rounded-md" />
        {/* Stat cards row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-28 w-full rounded-2xl" />
          ))}
        </div>
        {/* Main content blocks */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-52 w-full rounded-2xl" />
          ))}
        </div>
        <div className="skeleton h-40 w-full rounded-2xl" />
      </div>
    </div>
  )
}
