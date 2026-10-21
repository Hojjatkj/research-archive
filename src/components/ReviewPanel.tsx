"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReviewPanel({
  itemId,
  alreadySeen,
}: {
  itemId: number;
  alreadySeen: boolean;
}) {
  const router = useRouter();
  const [seen, setSeen] = useState(alreadySeen);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (busy || seen) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error ?? "ثبت انجام نشد.");
        return;
      }
      setSeen(true);
      router.refresh();
    } catch {
      setError("ارتباط با سرور برقرار نشد.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="no-print mt-5 border border-rule bg-paper-2 px-5 py-5">
      <p className="text-[12px] font-bold text-ink-2">ثبت بازدید</p>
      <p className="mt-2.5 text-[12.5px] leading-8 text-ink-soft">
        {seen
          ? "ثبت «من دیدم» برای این مطلب از این مرورگر انجام شده است."
          : "اگر این مطلب را خواندید، دکمه را بزنید. هر مرورگر برای هر مطلب فقط یک‌بار می‌تواند ثبت کند."}
      </p>

      {error ? (
        <p role="alert" className="mt-3 border-e-4 border-accent bg-accent/10 px-3 py-2 text-[12px] text-accent">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => void submit()}
        disabled={busy || seen}
        aria-pressed={seen}
        className={`mt-4 w-full border px-4 py-2.5 text-[13px] font-bold transition-colors disabled:cursor-default disabled:opacity-65 ${
          seen
            ? "border-moss bg-moss/10 text-moss"
            : "border-ink text-ink hover:bg-ink hover:text-paper-2"
        }`}
      >
        {busy ? "در حال ثبت…" : seen ? "ثبت شد ✓" : "من این مطلب را دیدم"}
      </button>
    </section>
  );
}
