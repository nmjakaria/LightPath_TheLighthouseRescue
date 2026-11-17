import type { LevelPreviewKind } from "@/config/levelCatalog";

/* Small, schematic previews for the level cards. They are decorative: the card carries the name. */
export function LevelPreview({ kind }: { kind: LevelPreviewKind }) {
  return (
    <svg
      viewBox="0 0 64 48"
      className="h-12 w-16 shrink-0 text-cyan-beam"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      {kind === "mirrors" && (
        <>
          <path d="M4 40h26M30 40 46 12M30 8h28" opacity="0.9" />
          <path d="m26 36 8 8M26 4l8 8" />
        </>
      )}
      {kind === "obstacle" && (
        <>
          <path d="M4 24h20M24 24l10-14v28L24 24M44 24h16" opacity="0.9" />
          <rect x="36" y="14" width="6" height="20" className="fill-navy-line" />
        </>
      )}
      {kind === "prism" && (
        <>
          <path d="M4 24h18m0 0 12-12m-12 12 12 12" opacity="0.9" />
          <path d="m22 12 16 12-16 12z" className="fill-deep-navy" />
          <path d="m38 24 22-12M38 24h22M38 24l22 12" />
        </>
      )}
      {kind === "gate" && (
        <>
          <path d="M4 16h20m16 0h20M24 16v16M40 16v16" opacity="0.9" />
          <path d="M28 18v12m4-12v12m4-12v12" className="text-ocean-teal" />
          <circle cx="52" cy="24" r="4" className="fill-star-gold text-star-gold" />
        </>
      )}
      {kind === "finale" && (
        <>
          <path d="M32 18V6m-8 12h16l-4 24H24z" className="fill-deep-navy" />
          <path d="M8 6 32 18 56 6M8 42 32 18l24 24" opacity="0.55" />
          <circle cx="32" cy="14" r="3" className="fill-beam-core text-beam-core" />
        </>
      )}
    </svg>
  );
}
