export type ComponentKind = "lamp" | "mirror" | "prism" | "target" | "switch" | "gate" | "obstacle";

const colorClasses: Record<ComponentKind, string> = {
  lamp: "text-star-gold",
  mirror: "text-cyan-beam",
  prism: "text-light-blue",
  target: "text-light-green",
  switch: "text-ocean-teal",
  gate: "text-warning",
  obstacle: "text-mist",
};

/* Legend icons use simple strokes so they stay crisp and inherit token colours via currentColor. */
export function ComponentIcon({ kind }: { kind: ComponentKind }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-6 w-6 shrink-0 ${colorClasses[kind]}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {kind === "lamp" && (
        <>
          <circle cx="9" cy="12" r="4" />
          <path d="m13 12 8-5v10l-8-5" />
        </>
      )}
      {kind === "mirror" && <path d="m5 19 14-14M7 5l3 3m4 8 3 3" />}
      {kind === "prism" && <path d="m12 4 9 16H3z" />}
      {kind === "target" && (
        <>
          <circle cx="12" cy="12" r="7" />
          <circle cx="12" cy="12" r="2" className="fill-current" />
        </>
      )}
      {kind === "switch" && (
        <>
          <rect x="3" y="7" width="18" height="10" rx="2" />
          <path d="m8 12 3 3 5-6" />
        </>
      )}
      {kind === "gate" && <path d="M6 3v18M18 3v18M6 8h12M6 16h12" />}
      {kind === "obstacle" && <path d="M4 18h16L16 7 8 11z" />}
    </svg>
  );
}
