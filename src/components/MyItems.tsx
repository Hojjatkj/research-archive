"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteItemAction, setPublishAction, type ActionResult } from "@/app/dashboard/actions";
import { EmptySheet } from "./Brand";

export type MyItemDTO = {
  id: number;
  title: string;
  slug: string;
  type: string;
  course: string;
  status: "draft" | "published";
  hiddenByAdmin: boolean;
  moderationNote: string;
  updatedAt: string;
  reviews: number;
  lastReviewer: string | null;
  lastReviewAt: string | null;
};

const TYPE_LABELS: Record<string, string> = {
  assignment: "تکلیف / گزارش",
  research: "پژوهش",
  presentation: "ارائه",
  notes: "جزوه",
};

type Filter = "all" | "published" | "draft" | "seen" | "hidden";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "long", day: "numeric" }).format(new Date(iso));
}

function StatusBadge({ item }: { item: MyItemDTO }) {
  if (item.hiddenByAdmin) {
    return <span className="border border-accent/50 bg-accent/10 px-2 py-0.5 text-[11.5px] font-bold text-accent-2">خارج‌شده توسط مدیر</span>;
  }
  if (item.status === "published") {
    return <span className="border border-moss/40 bg-moss/10 px-2 py-0.5 text-[11.5px] font-bold text-moss">منتشرشده</span>;
  }
  return <span className="border border-ink/25 bg-paper-3/60 px-2 py-0.5 text-[11.5px] font-bold text-ink-2">پیش‌نویس</span>;
}

export function MyItems({ items }: { items: MyItemDTO[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const counts: Record<Filter, number> = useMemo(
    () => ({
      all: items.length,
      published: items.filter((i) => i.status === "published" && !i.hiddenByAdmin).length,
      draft: items.filter((i) => i.status !== "published").length,
      seen: items.filter((i) => i.reviews > 0).length,
      hidden: items.filter((i) => i.hiddenByAdmin).length,
    }),
    [items],
  );

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return items.filter((item) => {
      if (filter === "published" && !(item.status === "published" && !item.hiddenByAdmin)) return false;
      if (filter === "draft" && item.status === "published") return false;
      if (filter === "seen" && item.reviews === 0) return false;
      if (filter === "hidden" && !item.hiddenByAdmin) return false;
      if (!term) return true;
      return item.title.toLowerCase().includes(term) || item.course.toLowerCase().includes(term);
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
      setConfirmId(null);
      router.refresh();
    } catch {
      setError("ارتباط با سرور برقرار نشد؛ دوباره تلاش کنید.");
    } finally {
      setBusyId(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center border border-dashed border-rule bg-paper-2/60 px-6 py-16 text-center">
        <EmptySheet className="h-14 w-14 text-ink/30" />
        <p className="mt-5 text-[18px] font-black text-ink">هنوز مطلبی ننوشته‌اید</p>
        <p className="mt-2 max-w-md text-[13.5px] leading-8 text-ink-soft">
          اولین تکلیف، گزارش، ارائه یا جزوه را بنویسید. می‌توانید با یک پیش‌نویس شروع کنید و هر وقت
          آماده بود منتشرش کنید.
        </p>
        <Link href="/dashboard/edit" className="mt-6 border border-accent bg-accent px-5 py-2.5 text-[14px] font-bold text-paper-2 hover:bg-accent-2">
          + نوشتن اولین مطلب
        </Link>
      </div>
    );
  }

  const filters: [Filter, string][] = [
    ["all", "همه"],
    ["published", "منتشرشده"],
    ["draft", "پیش‌نویس"],
    ["seen", "مشاهده‌شده"],
    ["hidden", "خارج‌شده توسط مدیر"],
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="فیلتر وضعیت">
          {filters
            .filter(([id]) => id !== "hidden" || counts.hidden > 0)
            .map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                aria-pressed={filter === id}
                className={`border px-3 py-1.5 text-[12.5px] transition-colors ${
                  filter === id ? "border-ink bg-ink text-paper-2" : "border-rule text-ink-2 hover:border-ink"
                }`}
              >
                {label} <span className="num opacity-70">{counts[id]}</span>
              </button>
            ))}
        </div>
        <label htmlFor="my-items-search" className="sr-only">جست‌وجو در مطالب من</label>
        <input
          id="my-items-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="جست‌وجو در عنوان یا درس…"
          className="ms-auto w-full border border-rule bg-white px-3.5 py-2 text-[13.5px] focus:border-ink focus:outline-none sm:w-64"
        />
      </div>

      <div className="mt-4 space-y-3" aria-live="polite">
        {error ? <p role="alert" className="border-s-4 border-accent bg-accent/10 px-4 py-2.5 text-[13px] text-accent-2">{error}</p> : null}
        {notice ? <p role="status" className="border-s-4 border-moss bg-moss/10 px-4 py-2.5 text-[13px] text-moss">{notice}</p> : null}
      </div>

      {visible.length === 0 ? (
        <p className="mt-6 border border-dashed border-rule px-5 py-10 text-center text-[13.5px] text-ink-soft">
          مطلبی با این فیلتر یا جست‌وجو پیدا نشد.
        </p>
      ) : (
        <ul className="mt-4 border-t border-rule">
          {visible.map((item) => {
            const busy = busyId === item.id;
            return (
              <li key={item.id} className="border-b border-rule py-6">
                <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge item={item} />
                      <span className="text-[11.5px] text-ink-soft">{TYPE_LABELS[item.type] ?? item.type}</span>
                      {item.course ? <span className="text-[11.5px] text-ink-soft">· {item.course}</span> : null}
                    </div>
                    <h3 className="mt-2 text-[17px] font-black leading-8 text-ink">
                      <Link href={`/dashboard/edit/${item.id}`} className="decoration-accent underline-offset-[0.35em] hover:underline">
                        {item.title}
                      </Link>
                    </h3>
                    <p className="mt-0.5 text-[12px] text-ink-soft">آخرین ویرایش: {formatDate(item.updatedAt)}</p>

                    {item.reviews > 0 && item.lastReviewAt ? (
                      <p className="mt-2.5 inline-flex flex-wrap items-center gap-1.5 border border-accent/40 px-2.5 py-1 text-[12px] font-bold text-accent">
                        ✓ مشاهده شد · {item.lastReviewer} · {formatDate(item.lastReviewAt)}
                        {item.reviews > 1 ? <span className="font-normal">({item.reviews} بار)</span> : null}
                      </p>
                    ) : item.status === "published" && !item.hiddenByAdmin ? (
                      <p className="mt-2.5 text-[12px] text-ink-soft">هنوز توسط استاد مشاهده نشده است.</p>
                    ) : null}

                    {item.hiddenByAdmin ? (
                      <p className="mt-3 border-s-4 border-accent bg-accent/10 px-3.5 py-2.5 text-[12.5px] leading-7 text-accent-2">
                        مدیر کلاس این مطلب را از دید عموم خارج کرده است
                        {item.moderationNote ? ` — «${item.moderationNote}»` : "."} مطلب برای شما محفوظ است و
                        می‌توانید آن را ویرایش کنید.
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/dashboard/edit/${item.id}`} className="border border-ink px-3.5 py-2 text-[12.5px] font-bold text-ink hover:bg-ink hover:text-paper-2">
                      ویرایش
                    </Link>
                    {item.status === "published" && !item.hiddenByAdmin ? (
                      <Link href={`/item/${item.slug}`} className="border border-rule px-3.5 py-2 text-[12.5px] text-ink-2 hover:border-ink">
                        مشاهده
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      disabled={busy || item.hiddenByAdmin}
                      title={item.hiddenByAdmin ? "تا وقتی مدیر مطلب را بازنگرداند، انتشار ممکن نیست." : undefined}
                      onClick={() =>
                        void run(
                          item.id,
                          () => setPublishAction(item.id, item.status !== "published"),
                          item.status === "published" ? "مطلب به پیش‌نویس برگشت." : "مطلب منتشر شد.",
                        )
                      }
                      className="border border-rule px-3.5 py-2 text-[12.5px] text-ink-2 hover:border-ink disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {busy ? "…" : item.status === "published" ? "لغو انتشار" : "انتشار"}
                    </button>

                    {confirmId === item.id ? (
                      <span className="flex items-center gap-1.5 border border-accent/50 bg-accent/10 px-2 py-1">
                        <span className="text-[12px] text-accent-2">حذف همیشگی؟</span>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void run(item.id, () => deleteItemAction(item.id), "مطلب حذف شد.")}
                          className="bg-accent px-2.5 py-1 text-[12px] font-bold text-paper-2 hover:bg-accent-2 disabled:opacity-60"
                        >
                          بله، حذف شود
                        </button>
                        <button type="button" onClick={() => setConfirmId(null)} className="px-2 py-1 text-[12px] text-ink-2 hover:text-ink">
                          انصراف
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmId(item.id)}
                        className="border border-transparent px-3 py-2 text-[12.5px] font-bold text-accent hover:border-accent"
                      >
                        حذف
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
