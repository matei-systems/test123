// Generische Platzhalter-Bausteine für loading.tsx-Dateien (Next.js zeigt
// diese automatisch während des Ladens der Server-Komponente an, per
// Route-Segment) - deckt die wiederkehrenden Layout-Formen im Dashboard/
// Admin-Bereich ab (Titelzeile, Kennzahlen-Kacheln, Tabelle), statt für
// jede einzelne Seite ein eigenes Skelett zu bauen.
function Bar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-white/[0.06] ${className}`} />;
}

export function HeaderSkeleton() {
  return (
    <div className="mb-6">
      <Bar className="h-7 w-56 mb-2" />
      <Bar className="h-4 w-80" />
    </div>
  );
}

export function TileGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-5">
          <Bar className="h-3 w-24 mb-3" />
          <Bar className="h-7 w-16" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="card overflow-hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 border-b border-white/[0.06] last:border-b-0 flex items-center gap-4">
          <Bar className="h-4 flex-1 max-w-[220px]" />
          <Bar className="h-4 w-20" />
          <Bar className="h-4 w-24 ml-auto" />
        </div>
      ))}
    </div>
  );
}

export default function PageSkeleton({ tiles = 4, rows = 6 }: { tiles?: number; rows?: number }) {
  return (
    <div>
      <HeaderSkeleton />
      <TileGridSkeleton count={tiles} />
      <TableSkeleton rows={rows} />
    </div>
  );
}
