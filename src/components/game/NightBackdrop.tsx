/* Decorative CSS-only night scene used behind menu screens. Canvas rendering starts in STEP 6,
 * so this layer stays aria-hidden and never receives pointer events. */
export function NightBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="night-glow absolute inset-0" />
      <div className="night-sweep absolute -right-32 -top-40 h-[36rem] w-[36rem] rounded-full" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-deep-navy to-transparent opacity-70" />
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle,var(--mist)_1px,transparent_1px)] [background-size:96px_96px]" />
    </div>
  );
}
