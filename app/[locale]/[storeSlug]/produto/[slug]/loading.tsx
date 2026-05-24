export default function ProductDetailLoading() {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--cream)" }}>
      {/* Top bar */}
      <div
        className="sticky top-0 z-30 flex items-center h-14 px-4"
        style={{ background: "var(--cream)", borderBottom: "1px solid var(--cream-dark)" }}
      >
        <div className="h-4 w-16 rounded-full animate-pulse" style={{ background: "var(--cream-dark)" }} />
      </div>

      {/* Image placeholder */}
      <div className="w-full aspect-[4/3] animate-pulse" style={{ background: "var(--cream-dark)" }} />

      {/* Content skeleton */}
      <div className="flex flex-col px-5 pt-5 gap-4">
        <div className="h-3 w-20 rounded-full animate-pulse" style={{ background: "var(--cream-dark)" }} />
        <div className="h-7 w-3/4 rounded-lg animate-pulse" style={{ background: "var(--cream-dark)" }} />
        <div className="flex flex-col gap-2">
          <div className="h-3 w-full rounded-full animate-pulse" style={{ background: "var(--cream-dark)" }} />
          <div className="h-3 w-5/6 rounded-full animate-pulse" style={{ background: "var(--cream-dark)" }} />
          <div className="h-3 w-2/3 rounded-full animate-pulse" style={{ background: "var(--cream-dark)" }} />
        </div>
      </div>

      {/* Bottom bar placeholder */}
      <div
        className="fixed bottom-0 left-0 right-0 h-20 px-5 flex items-center justify-between"
        style={{ background: "white", borderTop: "1px solid var(--cream-dark)" }}
      >
        <div className="h-8 w-24 rounded-lg animate-pulse" style={{ background: "var(--cream-dark)" }} />
        <div className="h-11 w-32 rounded-2xl animate-pulse" style={{ background: "var(--cream-dark)" }} />
      </div>
    </div>
  );
}
