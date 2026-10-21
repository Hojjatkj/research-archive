import Link from "next/link";

export function AuthSwitch({ active }: { active: "login" | "signup" }) {
  const base = "flex-1 px-4 py-2.5 text-center text-[14px] transition-colors";
  const on = "bg-ink font-bold text-paper-2";
  const off = "text-ink-2 hover:bg-paper-3";
  return (
    <nav aria-label="ورود یا ثبت‌نام" className="flex max-w-sm border border-ink/20 bg-paper-2 p-1">
      <Link href="/login" aria-current={active === "login" ? "page" : undefined} className={`${base} ${active === "login" ? on : off}`}>
        ورود
      </Link>
      <Link href="/signup" aria-current={active === "signup" ? "page" : undefined} className={`${base} ${active === "signup" ? on : off}`}>
        ثبت‌نام
      </Link>
    </nav>
  );
}
