'use client';

import { useEffect, useState } from 'react';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_MIN = 60 * 1000;

export function Countdown({ deadline }: { deadline: Date | string }) {
  const target =
    typeof deadline === 'string' ? new Date(deadline).getTime() : deadline.getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / MS_PER_DAY);
  const hours = Math.floor((diff % MS_PER_DAY) / MS_PER_HOUR);
  const minutes = Math.floor((diff % MS_PER_HOUR) / MS_PER_MIN);
  const seconds = Math.floor((diff % MS_PER_MIN) / 1000);

  const cells: { n: string; l: string }[] = [
    { n: pad(days, 3), l: 'Jours' },
    { n: pad(hours), l: 'Heures' },
    { n: pad(minutes), l: 'Minutes' },
    { n: pad(seconds), l: 'Secondes' },
  ];

  return (
    <div className="countdown">
      {cells.map((c, i) => (
        <div key={i} className="countdown-cell">
          <div className="countdown-num">{c.n}</div>
          <div className="countdown-label">{c.l}</div>
        </div>
      ))}
    </div>
  );
}

function pad(n: number, width = 2) {
  return n.toString().padStart(width, '0');
}
