'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_MIN = 60 * 1000;

export function Countdown({ deadline }: { deadline: Date | string }) {
  const t = useTranslations('countdown');
  const target =
    typeof deadline === 'string' ? new Date(deadline).getTime() : deadline.getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = now === null ? 0 : Math.max(0, target - now);
  const days = Math.floor(diff / MS_PER_DAY);
  const hours = Math.floor((diff % MS_PER_DAY) / MS_PER_HOUR);
  const minutes = Math.floor((diff % MS_PER_HOUR) / MS_PER_MIN);
  const seconds = Math.floor((diff % MS_PER_MIN) / 1000);

  const cells: { n: string; l: string }[] = [
    { n: pad(days, 3), l: t('days') },
    { n: pad(hours), l: t('hours') },
    { n: pad(minutes), l: t('minutes') },
    { n: pad(seconds), l: t('seconds') },
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
