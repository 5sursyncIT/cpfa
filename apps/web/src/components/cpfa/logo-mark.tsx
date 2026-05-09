// LogoMark — recreates the orbital motif from the source logo:
// orange ellipse (sphere) crossed by a navy elliptical ring.

export function LogoMark({ size = 38 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <radialGradient id="lm-sphere" cx="35%" cy="35%" r="75%">
          <stop offset="0%" stopColor="oklch(72% 0.18 50)" />
          <stop offset="55%" stopColor="oklch(58% 0.18 40)" />
          <stop offset="100%" stopColor="oklch(28% 0.08 35)" />
        </radialGradient>
      </defs>
      {/* Back half of ring */}
      <path d="M 12 50 a 38 12 -8 0 1 76 0" stroke="var(--navy)" strokeWidth="3.5" fill="none" />
      {/* Sphere */}
      <ellipse cx="50" cy="50" rx="22" ry="34" fill="url(#lm-sphere)" />
      {/* Highlight */}
      <ellipse cx="60" cy="48" rx="5" ry="3.5" fill="white" stroke="black" strokeWidth="0.8" />
      {/* Front half of ring */}
      <path d="M 12 50 a 38 12 -8 0 0 76 0" stroke="var(--navy)" strokeWidth="3.5" fill="none" />
    </svg>
  );
}

// Large decorative version used as a hero backdrop.
export function OrbitGraphic() {
  return (
    <svg viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <radialGradient id="og-sphere" cx="32%" cy="32%" r="80%">
          <stop offset="0%" stopColor="oklch(78% 0.16 50)" />
          <stop offset="50%" stopColor="oklch(58% 0.18 40)" />
          <stop offset="100%" stopColor="oklch(22% 0.08 30)" />
        </radialGradient>
      </defs>
      <ellipse cx="400" cy="400" rx="340" ry="120" stroke="var(--navy)" strokeWidth="2" opacity="0.35" />
      <ellipse
        cx="400"
        cy="400"
        rx="280"
        ry="95"
        stroke="var(--navy)"
        strokeWidth="2"
        opacity="0.5"
        transform="rotate(-12 400 400)"
      />
      <ellipse
        cx="400"
        cy="400"
        rx="220"
        ry="70"
        stroke="var(--navy)"
        strokeWidth="2"
        opacity="0.7"
        transform="rotate(18 400 400)"
      />
      <ellipse cx="400" cy="400" rx="175" ry="265" fill="url(#og-sphere)" />
    </svg>
  );
}
