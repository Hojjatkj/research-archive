"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SeenStamp } from "./Brand";

type ReviewDTO = {
  id: number;
  reviewerName: string;
  note: string;
  createdAt: string;
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function ReviewPanel({ itemId, reviews }: { itemId: number; reviews: ReviewDTO[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("استاد راهنما");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latest = reviews[0];

  async function submit() {
    if (!name.trim()) {
      setError("نام بیننده را وارد کنید.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, reviewerName: name, note }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "ثبت انجام نشد.");
        return;
      }
      setOpen(false);
      setNote("");
      router.refresh();
    } catch {
      setError("ارتباط با سرور برقرار نشد.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="no-print mt-5 border border-rule bg-paper-2 px-5 py-5">
      <p className="text-[12px] font-bold text-ink-2">وضعیت بازبینی</p>

      {reviews.length === 0 ? (
        <p className="mt-2.5 text-[12.5px] leading-8 text-ink-soft">
          هنوز برای این مطلب «مشاهده شد» ثبت نشده است.
        </p>
      ) : (
        <div className="mt-4">
          <SeenStamp name={latest.reviewerName} date={formatDate(latest.createdAt)} />
          {latest.note ? (
            <p className="mt-4 border-e-2 border-accent/50 pe-3 text-[12px] leading-7 text-ink-soft">
              {latest.note}
            </p>
          ) : null}
          {reviews.length > 1 ? (
            <p className="mt-3 text-[11px] text-ink-soft">
              <span className="num">{reviews.length}</span> بار بازبینی شده است.
            </p>
          ) : null}
        </div>
      )}

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-5 w-full border border-ink px-4 py-2.5 text-[13px] font-bold text-ink transition-colors hover:bg-ink hover:text-paper-2"
        >
          {reviews.length ? "ثبت دوبارهٔ «مشاهده شد»" : "ثبت «مشاهده شد»"}
        </button>
      ) : (
        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor="reviewer" className="mb-1 block text-[11px] text-ink-soft">
              نام بیننده
            </label>
            <input
              id="reviewer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-rule bg-white px-3 py-2 text-[13px] focus:border-ink focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="review-note" className="mb-1 block text-[11px] text-ink-soft">
              یادداشت (اختیاری)
            </label>
            <textarea
              id="review-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="مثلاً: اصلاح بخش روش انجام شود."
              className="w-full resize-none border border-rule bg-white px-3 py-2 text-[13px] leading-8 focus:border-ink focus:outline-none"
            />
          </div>

          {error ? (
            <p role="alert" className="border-e-4 border-accent bg-accent/10 px-3 py-2 text-[12px] text-accent">
              {error}
            </p>
          ) : null}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void submit()}
              disabled={busy}
              className="flex-1 border border-accent bg-accent px-4 py-2.5 text-[13px] font-bold text-paper-2 hover:bg-accent-2 disabled:opacity-60"
            >
              {busy ? "در حال ثبت…" : "ثبت مهر مشاهده"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="border border-rule px-4 py-2.5 text-[13px] text-ink-2 hover:border-ink"
            >
              انصراف
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
