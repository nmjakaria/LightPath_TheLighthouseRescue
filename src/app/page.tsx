// STEP 1 placeholder: a themed landing screen; the real main menu arrives in STEP 5.
export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-8 overflow-hidden bg-abyss px-6 text-center text-soft-white">
      <div className="pointer-events-none absolute inset-x-0 top-1/4 h-80 bg-[radial-gradient(ellipse_at_center,var(--cyan-beam),transparent_65%)] opacity-10" />

      <div className="relative flex flex-col items-center gap-4">
        <span className="rounded-full border border-navy-line px-4 py-1 font-mono text-xs uppercase tracking-[0.3em] text-mist">
          Step 1 · Scaffold
        </span>
        <h1 className="font-display text-6xl font-bold tracking-tight text-beam-core sm:text-7xl">
          LightPath
        </h1>
        <p className="font-display text-xl text-cyan-beam sm:text-2xl">The Lighthouse Rescue</p>
        <p className="max-w-xl text-base leading-relaxed text-mist">
          An optical puzzle game built with Next.js, TypeScript and Canvas 2D. The tooling is green;
          gameplay modules arrive in the following steps.
        </p>

        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <span className="rounded-button border border-navy-line bg-deep-navy px-3 py-2 font-mono text-xs text-mist">
            1280 × 720 wu
          </span>
          <span className="rounded-button border border-navy-line bg-deep-navy px-3 py-2 font-mono text-xs text-mist">
            Canvas 2D
          </span>
          <span className="rounded-button border border-navy-line bg-deep-navy px-3 py-2 font-mono text-xs text-mist">
            Strict TypeScript
          </span>
        </div>
      </div>
    </main>
  );
}
