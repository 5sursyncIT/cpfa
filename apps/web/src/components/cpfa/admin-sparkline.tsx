// Inline SVG bar chart used by the admin dashboard. Zero deps.

export function AdminSparkline({
  days,
  data,
  kpis,
}: {
  days: string[];
  data: number[];
  kpis: { label: string; value: number }[];
}) {
  const max = Math.max(...data, 1);
  return (
    <div>
      <div className="row gap-6" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        {kpis.map((k) => (
          <div key={k.label}>
            <div className="label">{k.label}</div>
            <div className="serif" style={{ fontSize: 36, marginTop: 4 }}>
              {k.value}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'end',
          height: 140,
          marginTop: 24,
        }}
      >
        {data.map((v, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div style={{ flex: 1, display: 'flex', alignItems: 'end', width: '100%' }}>
              <div
                style={{
                  width: '100%',
                  height: (v / max) * 100 + '%',
                  background: i === data.length - 1 ? 'var(--orange)' : 'var(--ink)',
                  borderRadius: '4px 4px 0 0',
                  position: 'relative',
                  minHeight: v > 0 ? 4 : 0,
                }}
              >
                <div
                  className="mono"
                  style={{
                    position: 'absolute',
                    top: -22,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: 11,
                    color: 'var(--ink-soft)',
                  }}
                >
                  {v}
                </div>
              </div>
            </div>
            <div className="mono fs-13 text-soft">{days[i]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
