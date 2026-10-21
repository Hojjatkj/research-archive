import type { ReactNode } from "react";

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function SubmitButton({
  pending,
  pendingLabel,
  children,
  tone = "ink",
}: {
  pending: boolean;
  pendingLabel: string;
  children: ReactNode;
  tone?: "ink" | "accent";
}) {
  const toneClass =
    tone === "accent"
      ? "border-accent bg-accent hover:bg-accent-2"
      : "border-ink bg-ink hover:bg-ink-2";
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending || undefined}
      className={`flex w-full items-center justify-center gap-2.5 border px-5 py-3 text-[15px] font-bold text-paper-2 transition-colors disabled:cursor-wait disabled:opacity-80 ${toneClass}`}
    >
      {pending ? <Spinner /> : null}
      <span>{pending ? pendingLabel : children}</span>
    </button>
  );
}
