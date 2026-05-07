// Inline SVG sparkline — no charting library dependency.
// Renders the 30-day revenue series as a series of vertical bars.

type Point = { date: string; totalXof: number };

const fmtXof = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`;

export function RevenueSparkline({ series }: { series: Point[] }) {
  if (series.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun encaissement confirmé sur la période.
      </p>
    );
  }

  const max = Math.max(...series.map((p) => p.totalXof), 1);
  const total = series.reduce((acc, p) => acc + p.totalXof, 0);
  const width = 600;
  const height = 140;
  const barWidth = Math.max(2, Math.floor(width / Math.max(series.length, 1)) - 2);

  return (
    <div>
      <p className="text-3xl font-bold">{fmtXof(total)}</p>
      <p className="text-xs text-muted-foreground">cumulé · {series.length} jour(s) avec recette</p>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mt-4 h-32 w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label="Recettes journalières"
      >
        {series.map((p, i) => {
          const x = i * (barWidth + 2);
          const h = (p.totalXof / max) * (height - 16);
          return (
            <rect
              key={p.date}
              x={x}
              y={height - h}
              width={barWidth}
              height={h}
              className="fill-primary/70"
            >
              <title>
                {p.date} — {fmtXof(p.totalXof)}
              </title>
            </rect>
          );
        })}
      </svg>
    </div>
  );
}
