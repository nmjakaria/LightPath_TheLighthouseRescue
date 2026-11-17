/* Small-portrait notice from PRD NFR-007. Hidden by CSS unless the viewport is a narrow portrait
 * phone, so it never covers the game on laptops or tablets. */
export function OrientationNotice() {
  return (
    <div className="orientation-notice" role="note">
      <p className="font-display text-xl text-beam-core">Rotate your device</p>
      <p className="text-sm text-mist">LightPath is best played in landscape.</p>
    </div>
  );
}
