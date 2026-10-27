// What a route shows the instant it is opened, before its data arrives. The real
// pages share this rhythm: a heading, a row of tiles, then cards.
export function PageSkeleton({ tiles = 2, wide = false }: { tiles?: number; wide?: boolean }) {
  return (
    <div aria-busy aria-label="Loading" className={wide ? "mx-auto max-w-[1200px] px-4 py-6 pb-28 md:px-6 lg:py-8 lg:pb-12" : ""}>
      <div className="mb-6 space-y-2.5">
        <div className="skeleton h-10 w-56 rounded-xl" />
        <div className="skeleton h-4 w-72 max-w-full" />
      </div>
      {tiles > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {Array.from({ length: tiles }, (_, index) => (
            <div key={index} className="skeleton h-28 rounded-3xl" />
          ))}
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="skeleton h-64 rounded-3xl" />
        <div className="skeleton h-64 rounded-3xl" />
      </div>
    </div>
  );
}
