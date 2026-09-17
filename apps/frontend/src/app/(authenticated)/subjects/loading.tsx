export default function SubjectsLoading() {
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6 space-y-6 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-2">
            <div className="h-9 w-64 bg-slate-200 rounded-3xl animate-pulse" />
            <div className="h-4 w-44 bg-slate-200 rounded-full animate-pulse" />
          </div>
          <div className="h-10 w-40 bg-slate-200 rounded-3xl animate-pulse" />
        </div>

        {/* Subject cards grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-5 border border-slate-100 space-y-4 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
              {/* Color bar top */}
              <div className="h-2 w-full bg-slate-200 rounded-full animate-pulse" />
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-5 w-36 bg-slate-200 rounded-full animate-pulse" />
                  <div className="h-3 w-24 bg-slate-200 rounded-full animate-pulse" />
                </div>
                <div className="w-10 h-10 bg-slate-200 rounded-2xl animate-pulse" />
              </div>
              {/* Assignment skeletons */}
              <div className="space-y-2 pt-1">
                {[0, 1, 2].map((j) => (
                  <div key={j} className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-slate-200 rounded-full animate-pulse shrink-0" />
                    <div className="h-3 bg-slate-200 rounded-full animate-pulse flex-1" style={{ width: `${60 + (j * 15)}%` }} />
                  </div>
                ))}
              </div>
              <div className="h-9 w-full bg-slate-200 rounded-2xl animate-pulse" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
