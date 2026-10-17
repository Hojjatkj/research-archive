/** Subtle paper texture using a repeating CSS gradient — no external image needed. */
export function Grain() {
  return (
    <div
      aria-hidden="true"
      className="grain pointer-events-none fixed inset-0 z-0"
      style={{
        backgroundImage:
          "repeating-linear-gradient(180deg, transparent 0px, transparent 55px, rgba(22,35,63,0.04) 55px, rgba(22,35,63,0.04) 56px)",
      }}
    />
  );
}
