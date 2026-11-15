/**
 * Supersintelligence (SI) watermark.
 *
 * Two shapes, same mark:
 *   <SiMark />        a small inline badge — sits in the HUD bar (so it is on
 *                     every screen) and at the head of each page-end note.
 *   <SiWatermark />   the quiet fixed mark on the left edge, mounted once in
 *                     App.jsx so it rides along over every view.
 */

/** Small bordered "SI" lockup. `label` shows the full name beside it. */
export function SiMark({ label = false, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`} title="Supersintelligence (SI)">
      <span className="flex h-[17px] items-center rounded-[2px] border border-amber/55 bg-amber/10 px-1 font-mono text-[9px] font-semibold leading-none tracking-[0.12em] text-amber">
        SI
      </span>
      {label && (
        <span className="font-mono text-[9px] tracking-[0.22em] text-parchment/50">SUPERSINTELLIGENCE</span>
      )}
    </span>
  );
}

/** Fixed edge watermark. Decorative only — never catches a click. */
export default function SiWatermark() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-1/2 z-[61] hidden -translate-y-1/2 select-none sm:block"
    >
      <span
        className="block whitespace-nowrap pl-2 font-mono text-[9px] tracking-[0.42em] text-parchment/25"
        style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
      >
        SI · SUPERSINTELLIGENCE
      </span>
    </div>
  );
}
