/** Small, crisp inline flags — deliberately not emoji (renders inconsistently
 * across OSes/browsers) and not a heavier flag-icon package the project
 * doesn't already depend on. */

export function FlagPT({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 14" className={className} role="img" aria-hidden="true">
      <rect width="20" height="14" fill="#FF0000" />
      <rect width="8" height="14" fill="#006600" />
      <circle cx="8" cy="7" r="3" fill="#FFCC00" stroke="#FFFFFF" strokeWidth="0.4" />
    </svg>
  );
}

export function FlagGB({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 14" className={className} role="img" aria-hidden="true">
      <rect width="20" height="14" fill="#012169" />
      <path d="M0,0 L20,14 M20,0 L0,14" stroke="#FFFFFF" strokeWidth="2.8" />
      <path d="M0,0 L20,14 M20,0 L0,14" stroke="#C8102E" strokeWidth="1" />
      <path d="M10,0 V14 M0,7 H20" stroke="#FFFFFF" strokeWidth="4.6" />
      <path d="M10,0 V14 M0,7 H20" stroke="#C8102E" strokeWidth="2.6" />
    </svg>
  );
}
