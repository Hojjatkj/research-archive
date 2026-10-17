export function Seal({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="نشان بایگانی پژوهش" fill="none">
      <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="1.1" opacity="0.45" />
      <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="2.4" />
      <path d="M32 11.5v5.4M22.2 14.4l2.6 4.9M41.8 14.4l-2.6 4.9" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M25.4 24.6c2.2-2 4.4-2 6.6 0 2.2-2 4.4-2 6.6 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M13.2 44.6c6.2-3.6 12.5-3.6 18.8 0 6.3-3.6 12.6-3.6 18.8 0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M13.2 44.6V31.4c6.2-3.6 12.5-3.6 18.8 0v13.2M50.8 44.6V31.4c-6.2-3.6-12.5-3.6-18.8 0v13.2" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M32 31.4v13.2" stroke="currentColor" strokeWidth="2.2" />
    </svg>
  );
}

/** The professor's rubber stamp — the memorable moment of the archive. */
export function SeenStamp({
  name,
  date,
  className = "",
}: {
  name: string;
  date: string;
  className?: string;
}) {
  return (
    <div className={`stamp inline-block ${className}`}>
      <p className="stamp-title">مشاهده شد</p>
      <p className="num mt-1 text-[11px] leading-4 opacity-80">{date}</p>
      <p className="mt-0.5 text-[12px] leading-4 opacity-90">{name}</p>
    </div>
  );
}

export function EmptySheet({ className = "h-16 w-16" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <path d="M14 8h26l10 10v38H14z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M40 8v10h10" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M21 28h22M21 36h22M21 44h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}
