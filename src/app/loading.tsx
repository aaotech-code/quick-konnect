export default function Loading() {
  return (
    <div className="min-h-screen bg-[#05070b] text-white">
      <div className="border-b border-white/[0.06]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="h-7 w-40 animate-pulse rounded-lg bg-white/[0.06]" />
          <div className="hidden gap-3 sm:flex">
            <div className="h-4 w-20 animate-pulse rounded bg-white/[0.05]" />
            <div className="h-4 w-24 animate-pulse rounded bg-white/[0.05]" />
            <div className="h-4 w-20 animate-pulse rounded bg-white/[0.05]" />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mb-4 h-6 w-32 animate-pulse rounded-full bg-white/[0.05]" />
        <div className="mb-3 h-12 w-3/4 animate-pulse rounded-2xl bg-white/[0.06]" />
        <div className="mb-10 h-12 w-1/2 animate-pulse rounded-2xl bg-white/[0.05]" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-40 animate-pulse rounded-2xl bg-white/[0.03]" />
          <div className="h-40 animate-pulse rounded-2xl bg-white/[0.03]" />
        </div>
      </div>
    </div>
  );
}
