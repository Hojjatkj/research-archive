"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteItemAction, moderateItemAction, type ActionResult } from "@/app/dashboard/actions";

export type ModItemDTO = {
  id: number;
  title: string;
  slug: string;
  type: string;
  authorName: string | null;
  authorId: number | null;
  hiddenByAdmin: boolean;
  moderationNote: string;
  publishedAt: string | null;
  reviews: number;
};

const TYPE_LABELS: Record<string, string> = {
  assignment: "تکلیف / گزارش",
  research: "پژوهش",
  presentation: "ارائه",
  notes: "جزوه",
};

type Filter = "all" | "visible" | "hidden";

export function ModerationList({ items }: { items: ModItemDTO[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [hidingId, setHidingId] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return items.filter((item) => {
      if (filter === "visible" && item.hiddenByAdmin) return false;
      if (filter === "hidden" && !item.hiddenByAdmin) return false;
      if (!term) return true;
      return item.title.toLowerCase().includes(term) || (item.authorName ?? "").toLowerCase().includes(term);
    });
  }, [items, filter, query]);

  async function run(id: number, task: () => Promise<ActionResult>, success: string) {
    setBusyId(id);
    setError(null);
    setNotice(null);
    try {
      const result = await task();
      if (!result.ok) {
        setError(result.error ?? "عملیات انجام نشد.");
        return;
      }
      setNotice(success);
      setHidingId(null);
      setConfirmDeleteId(null);
      setNote("");
      router.refresh();
    } catch {
      setError("ارتباط با سرور برقرار نشد؛ دوباره تلاش کنید.");
    } finally {
      setBusyId(null);
    }
  }

  const filters: [Filter, string, number][] = [
    ["all", "همه", items.length],
    ["visible", "در دید عموم", items.filter((i) => !i.hiddenByAdmin).length],
    ["hidden", "خارج‌شده", items.filter((i) => i.hiddenByAdmin).length],
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="فیلتر وضعیت">
          {filters.map(([id, label, n]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              aria-pressed={filter === id}
              className={`border px-3 py-1.5 text-[12.5px] transition-colors ${
                filter === id ? "border-ink bg-ink text-paper-2" : "border-rule text-ink-2 hover:border-ink"
              }`}
            >
              {label} <span className="num opacity-70">{n}</span>
            </button>
          ))}
        </div>
        <label htmlFor="mod-search" className="sr-only">جست‌وجو در مطالب کلاس</label>
        <input
          id="mod-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="جست‌وجو در عنوان یا نام دانشجو…"
          className="ms-auto w-full border border-rule bg-white px-3.5 py-2 text-[13.5px] focus:border-ink focus:outline-none sm:w-72"
        />
      </div>

      <div className="mt-4 space-y-3" aria-live="polite">
        {error ? <p role="alert" className="border-s-4 border-accent bg-accent/10 px-4 py-2.5 text-[13px] text-accent-2">{error}</p> : null}
        {notice ? <p role="status" className="border-s-4 border-moss bg-moss/10 px-4 py-2.5 text-[13px] text-moss">{notice}</p> : null}
      </div>

      {visible.length === 0 ? (
        <p className="mt-6 border border-dashed border-rule px-5 py-10 text-center text-[13.5px] text-ink-soft">
          {items.length === 0 ? "هنوز مطلبی در کلاس منتشر نشده است." : "مطلبی با این فیلتر پیدا نشد."}
        </p>
      ) : (
        <ul className="mt-4 border-t border-rule">
          {visible.map((item) => {
            const busy = busyId === item.id;
            const isSample = item.authorId === null;
            return (
              <li key={item.id} className="border-b border-rule py-6">
                <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-[11.5px]">
                      {item.hiddenByAdmin ? (
                        <span className="border border-accent/50 bg-accent/10 px-2 py-0.5 font-bold text-accent-2">خارج از دید عموم</span>
                      ) : (
                        <span className="border border-moss/40 bg-moss/10 px-2 py-0.5 font-bold text-moss">در دید عموم</span>
                      )}
                      <span className="text-ink-soft">{TYPE_LABELS[item.type] ?? item.type}</span>
                      <span className="text-accent">ثبت «من دیدم»: {item.reviews}</span>
                    </div>
                    <h3 className="mt-2 text-[16.5px] font-black leading-8 text-ink">{item.title}</h3>
                    <p className="mt-0.5 text-[12.5px] text-ink-soft">
                      {isSample ? (
                        "مطلب بدون حساب نویسنده"
                      ) : (
                        <>
                          نویسنده:{" "}
                          <Link href={`/students/${item.authorId}`} className="font-bold text-ink-2 hover:text-accent">
                            {item.authorName}
                          </Link>
                        </>
                      )}
                    </p>
                    {item.hiddenByAdmin && item.moderationNote ? (
                      <p className="mt-2 text-[12px] text-accent-2">دلیل: {item.moderationNote}</p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {!item.hiddenByAdmin ? (
                      <Link href={`/item/${item.slug}`} className="border border-rule px-3.5 py-2 text-[12.5px] text-ink-2 hover:border-ink">
                        مشاهده
                      </Link>
                    ) : null}

                    {item.hiddenByAdmin ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void run(item.id, () => moderateItemAction(item.id, false, ""), "مطلب دوباره در دید عموم قرار گرفت.")}
                        className="border border-moss px-3.5 py-2 text-[12.5px] font-bold text-moss hover:bg-moss hover:text-paper-2 disabled:opacity-50"
                      >
                        {busy ? "…" : "بازگرداندن به انتشار"}
                      </button>
                    ) : hidingId !== item.id ? (
                      <button
                        type="button"
                        onClick={() => {
                          setHidingId(item.id);
                          setNote("");
                          setConfirmDeleteId(null);
                        }}
                        className="border border-accent px-3.5 py-2 text-[12.5px] font-bold text-accent hover:bg-accent hover:text-paper-2"
                      >
                        خارج کردن از انتشار
                      </button>
                    ) : null}

                    {isSample ? (
                      confirmDeleteId === item.id ? (
                        <span className="flex items-center gap-1.5 border border-accent/50 bg-accent/10 px-2 py-1">
                          <span className="text-[12px] text-accent-2">حذف مطلب؟</span>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void run(item.id, () => deleteItemAction(item.id), "مطلب حذف شد.")}
                            className="bg-accent px-2.5 py-1 text-[12px] font-bold text-paper-2 disabled:opacity-60"
                          >
                            بله
                          </button>
                          <button type="button" onClick={() => setConfirmDeleteId(null)} className="px-2 py-1 text-[12px] text-ink-2">
                            انصراف
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(item.id)}
                          className="px-3 py-2 text-[12px] text-ink-soft underline underline-offset-4 hover:text-accent"
                        >
                          حذف مطلب
                        </button>
                      )
                    ) : null}
                  </div>
                </div>

                {hidingId === item.id ? (
                  <div className="mt-4 border border-accent/40 bg-accent/5 px-4 py-4">
                    <label htmlFor={`note-${item.id}`} className="block text-[12.5px] font-bold text-ink-2">
                      یادداشت داخلی (اختیاری)
                    </label>
                    <textarea
                      id={`note-${item.id}`}
                      rows={2}
                      maxLength={300}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="مثلاً: نیاز به بازبینی منابع دارد."
                      className="mt-2 w-full resize-y border border-rule bg-white px-3 py-2 text-[13px] leading-7 focus:border-ink focus:outline-none"
                    />
                    <p className="mt-2 text-[11.5px] leading-6 text-ink-soft">
                      با خارج کردن از انتشار، مطلب عمومی نیست اما برای شما در میز کار محفوظ می‌ماند.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void run(item.id, () => moderateItemAction(item.id, true, note), "مطلب از دید عموم خارج شد و در میز کار مدیر محفوظ ماند.")}
                        className="bg-accent px-4 py-2 text-[12.5px] font-bold text-paper-2 hover:bg-accent-2 disabled:opacity-60"
                      >
                        {busy ? "در حال انجام…" : "تأیید و خارج کردن از انتشار"}
                      </button>
                      <button type="button" onClick={() => setHidingId(null)} className="border border-rule px-4 py-2 text-[12.5px] text-ink-2 hover:border-ink">
                        انصراف
                      </button>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
