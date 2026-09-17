export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#f8fafc] select-none font-sans">
      {/* Navbar skeleton */}
      <div className="w-full bg-white/95 sticky top-0 z-50 px-6 py-3 shadow-[0_4px_25px_rgba(0,0,0,0.03)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="h-10 w-36 bg-slate-200 rounded-2xl animate-pulse" />
          <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-full">
            <div className="h-8 w-24 bg-slate-200 rounded-full animate-pulse" />
            <div className="h-8 w-20 bg-slate-200 rounded-full animate-pulse" />
            <div className="h-8 w-28 bg-slate-200 rounded-full animate-pulse" />
            <div className="h-8 w-24 bg-slate-200 rounded-full animate-pulse" />
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse" />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6 space-y-6 pb-16">
        {/* Header skeleton */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-2">
            <div className="h-9 w-72 bg-slate-200 rounded-3xl animate-pulse" />
            <div className="h-4 w-52 bg-slate-200 rounded-full animate-pulse" />
          </div>
          <div className="h-10 w-44 bg-slate-200 rounded-3xl animate-pulse" />
        </div>

        {/* KPI cards skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-5 border border-slate-100 space-y-3 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between">
                <div className="h-3 w-16 bg-slate-200 rounded-full animate-pulse" />
                <div className="w-8 h-8 bg-slate-200 rounded-2xl animate-pulse" />
              </div>
              <div className="h-10 w-20 bg-slate-200 rounded-2xl animate-pulse" />
              <div className="h-3 w-28 bg-slate-200 rounded-full animate-pulse" />
            </div>
          ))}
        </div>

        {/* Progress bar skeleton */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.02)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-40 bg-slate-200 rounded-full animate-pulse" />
            <div className="h-4 w-12 bg-slate-200 rounded-full animate-pulse" />
          </div>
          <div className="h-4 w-full bg-slate-200 rounded-full animate-pulse" />
        </div>

        {/* Student list skeleton */}
        <div className="space-y-3">
          <div className="h-5 w-48 bg-slate-200 rounded-full animate-pulse" />
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-4 border border-slate-100 flex items-center gap-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <div className="w-11 h-11 bg-slate-200 rounded-full animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 bg-slate-200 rounded-full animate-pulse" />
                <div className="h-3 w-32 bg-slate-200 rounded-full animate-pulse" />
              </div>
              <div className="h-8 w-20 bg-slate-200 rounded-2xl animate-pulse" />
              <div className="h-8 w-16 bg-slate-200 rounded-2xl animate-pulse" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
