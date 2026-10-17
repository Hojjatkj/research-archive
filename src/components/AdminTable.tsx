"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteItemAction, setPublishAction } from "@/app/admin/actions";
import { EmptySheet } from "./Brand";

export type AdminItemDTO = {
  id: number;
  title: string;
  slug: string;
  type: string;
  course: string;
  status: "draft" | "published";
  updatedAt: string;
  publishedAt: string | null;
  reviews: number;
};

const TYPE_LABELS: Record<string, string> = {
  assignment: "تکلیف / گزارش",
  research: "پژوهش",
  presentation: "ارائه",
  notes: "جزوه",
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function AdminTable({ items }: { items: AdminItemDTO[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(term) ||
        item.course.toLowerCase().includes(term) ||
        item.slug.toLowerCase().includes(term),
    );
  }, [items, q]);

  async function togglePublish(item: AdminItemDTO) {
    setBusyId(item.id);
    setError(null);
    try {
      const result = await setPublishAction(item.id, item.status !== "published");
      if (!result.ok) {
        setError(result.error ?? "تغییر وضعیت انجام نشد.");
        return;
      }
      router.refresh();
    } catch {
      setError("تغییر وضعیت انجام نشد. دوباره تلاش کنید.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(item: AdminItemDTO) {
    const ok = window.confirm(
      `مطلب «${item.title}» برای همیشه حذف شود؟ این عملیات قابل بازگشت نیست.`,
    );
    if (!ok) return;
    setBusyId(item.id);
    setError(null);
    try {
      const result = await deleteItemAction(item.id);
      if (!result.ok) {
        setError(result.error ?? "حذف انجام نشد.");
        return;
      }
      router.refresh();
    } catch {
      setError("حذف انجام نشد. دوباره تلاش کنید.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="جست‌وجو در عنوان، درس یا نشانی…"
          className="w-full max-w-sm border border-rule bg-paper-2 px-4 py-2.5 text-[14px] focus:border-ink focus:bg-white focus:outline-none"
        />
        <p className="num text-[12px] text-ink-soft">
          {String(visible.length).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
        </p>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-4 border-e-4 border-accent bg-accent/10 px-3.5 py-2.5 text-[13px] text-accent-2"
        >
          {error}
        </p>
      ) : null}

      {visible.length === 0 ? (
        <div className="mt-8 flex flex-col items-center border border-dashed border-rule bg-paper-2/60 px-6 py-16 text-center">
          <EmptySheet className="h-14 w-14 text-ink/30" />
          <p className="mt-5 text-[17px] font-bold text-ink">
            {items.length === 0 ? "هنوز مطلبی نوشته نشده است" : "مطلبی با این جست‌وجو نیست"}
          </p>
          <p className="mt-2 max-w-sm text-[13px] leading-8 text-ink-soft">
            {items.length === 0
              ? "اولین مطلب بایگانی را بسازید؛ می‌توانید با یک پیش‌نویس شروع کنید."
              : "عبارت جست‌وجو را تغییر دهید."}
          </p>
          <Link
            href="/admin/edit"
            className="mt-6 border border-ink px-4 py-2.5 text-[13px] font-bold text-ink hover:bg-ink hover:text-paper-2"
          >
            + نوشتن مطلب جدید
          </Link>
        </div>
      ) : (
        <ul className="mt-6 border-t border-rule">
          {visible.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-start gap-x-6 gap-y-4 border-b border-rule py-6"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className={`border px-2 py-0.5 text-[11px] ${
                      item.status === "published"
                        ? "border-moss/40 bg-moss/10 text-moss"
                        : "border-accent/40 bg-accent/10 text-accent"
                    }`}
                  >
                    {item.status === "published" ? "منتشرشده" : "پیش‌نویس"}
                  </span>
                  <span className="text-[11px] text-ink-soft">{TYPE_LABELS[item.type] ?? item.type}</span>
                  {item.reviews > 0 ? (
                    <span className="border border-accent/35 px-2 py-0.5 text-[11px] text-accent">
                      ✓ مشاهده شد ({item.reviews})
                    </span>
                  ) : null}
                </div>

                <h3 className="mt-2.5 text-[17px] font-black leading-8 text-ink">{item.title}</h3>

                <p className="num mt-1.5 text-[11px] text-ink-soft">
                  {item.course ? `${item.course} · ` : ""}به‌روزرسانی {formatDate(item.updatedAt)} · /{item.slug}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/admin/edit/${item.id}`}
                  className="border border-ink px-3.5 py-2 text-[12.5px] font-bold text-ink hover:bg-ink hover:text-paper-2"
                >
                  ویرایش
                </Link>
                {item.status === "published" ? (
                  <Link
                    href={`/item/${item.slug}`}
                    className="border border-rule px-3.5 py-2 text-[12.5px] text-ink-2 hover:border-ink"
                  >
                    مشاهده
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => void togglePublish(item)}
                  disabled={busyId === item.id}
                  className="border border-rule px-3.5 py-2 text-[12.5px] text-ink-2 hover:border-ink disabled:opacity-50"
                >
                  {item.status === "published" ? "لغو انتشار" : "انتشار"}
                </button>
                <button
                  type="button"
                  onClick={() => void remove(item)}
                  disabled={busyId === item.id}
                  className="border border-transparent px-3.5 py-2 text-[12.5px] font-bold text-accent hover:border-accent hover:bg-accent hover:text-paper-2 disabled:opacity-50"
                >
                  حذف
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
